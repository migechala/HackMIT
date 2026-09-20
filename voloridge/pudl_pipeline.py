"""PUDL (EIA data) -> per-state electricity price and grid mix for THRESHOLD (Voloridge challenge).

Replaces the dashboard's placeholder energy price ($0.14/kWh) with real state retail prices, and adds
the in-state generation mix so the energy a mitigation system draws can be read against its grid.

Sources (public bucket s3://pudl.catalyst.coop, release "stable", CC-BY-4.0):
  core_eia861__yearly_sales                      retail sales and revenue by utility, state, customer class
  out_eia923__yearly_generation_fuel_combined    net generation by plant and fuel
  core_eia__entity_plants                        plant -> state

Data-cleaning trap handled here: in restructured markets (PA, MI, ...) sales appear as a supplier
"energy" row and a wires "delivery" row. Averaging every row double counts megawatt-hours and gives an
absurdly low price (about 4 c/kWh in Pennsylvania). The all-in price is
    (revenue of bundled + energy + delivery rows) / (MWh of bundled + energy rows)
with each MWh counted once. The naive figure is printed next to it as a check.

Run (needs pyarrow, fetched on demand by uv):
    uv run --no-project --python 3.12 --with pyarrow python voloridge/pudl_pipeline.py
"""

from __future__ import annotations

import json
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import pyarrow.parquet as pq

BASE = "https://s3.us-west-2.amazonaws.com/pudl.catalyst.coop/stable"
TABLES = ["core_eia861__yearly_sales", "out_eia923__yearly_generation_fuel_combined", "core_eia__entity_plants"]
YEARS = list(range(2019, 2025))  # final (not provisional) data
GEN_YEAR = 2024
CARBON_FREE = ("nuclear", "hydro", "wind", "solar")

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "data" / "pudl"
OUT = ROOT.parent / "front-end" / "src" / "threshold" / "dashboard" / "lib" / "pudlSummary.json"
WEB = ROOT.parent / "web" / "assets"  # standalone site: JSON plus a script wrapper so index.html works from disk

SITES = [
    {"id": "dc-manassas-01", "city": "Manassas", "state": "VA"},
    {"id": "dc-divide-02", "city": "Crosby", "state": "ND"},
    {"id": "dc-scranton-03", "city": "Scranton", "state": "PA"},
    {"id": "dc-ypsi-04", "city": "Ypsilanti", "state": "MI"},
]


def fetch(table: str) -> Path:
    dest = CACHE / f"{table}.parquet"
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(f"{BASE}/{table}.parquet", timeout=180) as r, open(dest, "wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    return dest


def prices(sales: list[dict], states: set[str]):
    """state -> customer_class -> year -> (all_in c/kWh, naive c/kWh)."""
    acc = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0.0, 0.0]))  # rev_all, mwh_once, rev_naive, mwh_naive
    for r in sales:
        st, cls, svc, y = r["state"], r["customer_class"], r["service_type"], r["report_date"].year
        if st not in states or cls not in ("industrial", "commercial") or y not in YEARS:
            continue
        rev, mwh = r["sales_revenue"], r["sales_mwh"]
        if not rev or not mwh:
            continue
        a = acc[(st, cls)][y]
        a[0] += rev
        if svc in ("bundled", "energy"):
            a[1] += mwh  # each MWh counted once
        a[2] += rev
        a[3] += mwh
    out: dict = defaultdict(dict)
    for (st, cls), by_year in acc.items():
        out[st][cls] = {
            str(y): {"allIn": round(a[0] / a[1] / 10, 2), "naive": round(a[2] / a[3] / 10, 2)}
            for y, a in sorted(by_year.items()) if a[1] and a[3]
        }
    return out


def generation_mix(gen: list[dict], plants: dict[int, str], states: set[str]):
    fuels = ("coal", "gas", "oil", "nuclear", "hydro", "wind", "solar", "waste", "other")
    tot = defaultdict(lambda: defaultdict(float))
    for r in gen:
        if r["report_date"].year != GEN_YEAR:
            continue
        st = plants.get(r["plant_id_eia"])
        mwh = r["net_generation_mwh"]
        if st in states and mwh and mwh > 0:
            tot[st][r["fuel_type_code_pudl"] if r["fuel_type_code_pudl"] in fuels else "other"] += mwh
    res = {}
    for st, by in tot.items():
        total = sum(by.values())
        res[st] = {
            "year": GEN_YEAR,
            "totalTwh": round(total / 1e6, 1),
            "shares": {f: round(by.get(f, 0) / total, 4) for f in fuels},
            "carbonFreeShare": round(sum(by.get(f, 0) for f in CARBON_FREE) / total, 4),
        }
    return res


def main():
    for t in TABLES:
        p = fetch(t)
        print(f"{t}: {p.stat().st_size / 1e6:.1f} MB", flush=True)
    states = {s["state"] for s in SITES}
    sales = pq.read_table(CACHE / "core_eia861__yearly_sales.parquet", columns=[
        "state", "report_date", "customer_class", "service_type", "sales_mwh", "sales_revenue"]).to_pylist()
    price = prices(sales, states)
    plants = {r["plant_id_eia"]: r["state"] for r in pq.read_table(
        CACHE / "core_eia__entity_plants.parquet", columns=["plant_id_eia", "state"]).to_pylist()}
    gen = pq.read_table(CACHE / "out_eia923__yearly_generation_fuel_combined.parquet", columns=[
        "report_date", "plant_id_eia", "fuel_type_code_pudl", "net_generation_mwh"]).to_pylist()
    mix = generation_mix(gen, plants, states)

    sites = []
    for s in SITES:
        st = s["state"]
        ind = price[st]["industrial"]
        latest = max(ind)
        entry = {
            "id": s["id"], "city": s["city"], "state": st,
            "price": {"industrial": ind, "commercial": price[st]["commercial"]},
            "latest": {"year": int(latest), "industrialCentsKwh": ind[latest]["allIn"],
                       "commercialCentsKwh": price[st]["commercial"][latest]["allIn"]},
            "generation": mix[st],
        }
        sites.append(entry)
        print(f"{s['city']}, {st}: industrial {ind[latest]['allIn']} c/kWh in {latest} (naive average {ind[latest]['naive']}); "
              f"in-state generation {mix[st]['totalTwh']} TWh, carbon-free {mix[st]['carbonFreeShare']:.0%}", flush=True)

    out = {
        "source": "PUDL / EIA-861 retail sales and EIA-923 generation (s3://pudl.catalyst.coop, stable release)",
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "params": {"years": [YEARS[0], YEARS[-1]], "generationYear": GEN_YEAR, "carbonFree": list(CARBON_FREE),
                   "priceMethod": "(revenue of bundled+energy+delivery) / (MWh of bundled+energy), state average"},
        "limits": ("Prices are state averages, not a tariff quote for any facility. The generation mix is in-state "
                   "generation, not what a specific utility delivers (imports and contracts are not modeled)."),
        "sites": sites,
    }
    OUT.write_text(json.dumps(out, indent=1), encoding="utf-8")
    WEB.mkdir(parents=True, exist_ok=True)
    (WEB / "pudl-summary.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    (WEB / "pudl-data.js").write_text("window.THRESHOLD_PUDL = " + json.dumps(out, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    sys.exit(main())
