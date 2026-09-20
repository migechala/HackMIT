"""NOAA ISD -> per-site weather-propagation summary for THRESHOLD (Voloridge "Signal in the Noise").

What it does
  1. Reads the ISD station catalogue (isd-history.csv, ~35k stations) and the per-year inventory
     (isd-inventory.csv, ~15 MB) from the public NOAA bucket.
  2. For each THRESHOLD facility, picks the nearest station that is still active and reports enough
     hourly observations in every study year (coverage check, not just "nearest").
  3. Downloads one gzipped fixed-width file per station per year (anonymous HTTPS, resumable cache),
     parses the mandatory section, drops flagged/missing values, keeps one observation per hour.
  4. Reduces it to what matters for outdoor sound propagation: how often the air is still at night,
     which way the wind blows at night (16-sector rose), how hot it runs (cooling load -> fan speed),
     and a monthly view. Writes one small JSON the web app loads.

Scope note: ISD has no sound data. These are weather *exposure* statistics, not noise measurements.

Run (no dependencies, stdlib only):
    uv run --no-project --python 3.12 --with tzdata python voloridge/isd_pipeline.py
"""

from __future__ import annotations

import csv
import gzip
import io
import json
import math
import sys
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

BUCKET = "https://noaa-isd-pds.s3.amazonaws.com"
YEARS = list(range(2019, 2025))
MIN_OBS_PER_YEAR = 6000  # roughly 70% of the hours in a year
MAX_DISTANCE_KM = 80
STILL_AIR_MS = 2.0  # below this the air is treated as "still"
NIGHT_HOURS = set(list(range(22, 24)) + list(range(0, 7)))  # local 22:00-06:59
# ISD quality flags that pass (0 passed gross limits, 1 passed all, 4/5 passed after manual review, 9 = missing-ok)
GOOD_Q = set("01459")

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "data"
OUT = ROOT.parent / "front-end" / "src" / "threshold" / "dashboard" / "lib" / "isdSummary.json"

# The four facilities in the dashboard (front-end/src/threshold/dashboard/lib/mockData.ts).
SITES = [
    {"id": "dc-manassas-01", "city": "Manassas", "state": "VA", "lat": 38.7509, "lon": -77.4753, "tz": "America/New_York"},
    {"id": "dc-divide-02", "city": "Crosby", "state": "ND", "lat": 48.9106, "lon": -103.2963, "tz": "America/Chicago"},
    {"id": "dc-scranton-03", "city": "Scranton", "state": "PA", "lat": 41.4090, "lon": -75.6624, "tz": "America/New_York"},
    {"id": "dc-ypsi-04", "city": "Ypsilanti", "state": "MI", "lat": 42.2411, "lon": -83.6130, "tz": "America/Detroit"},
]

SECTORS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]


def fetch(url: str, dest: Path) -> Path:
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=120) as r, open(dest, "wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    return dest


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(a))


def load_catalogue():
    hist = fetch(f"{BUCKET}/isd-history.csv", CACHE / "isd-history.csv")
    inv = fetch(f"{BUCKET}/isd-inventory.csv", CACHE / "isd-inventory.csv")
    stations = []
    with open(hist, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            try:
                lat, lon = float(r["LAT"]), float(r["LON"])
            except ValueError:
                continue
            if lat == 0 and lon == 0:
                continue
            if r["END"] < "20241231":  # only stations still reporting through the study window
                continue
            stations.append({
                "usaf": r["USAF"], "wban": r["WBAN"], "name": r["STATION NAME"].strip(), "icao": r["ICAO"],
                "state": r["STATE"], "lat": lat, "lon": lon, "elev": r["ELEV(M)"],
            })
    counts: dict[tuple[str, str], dict[int, int]] = defaultdict(dict)
    with open(inv, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            y = int(r["YEAR"])
            if y in YEARS:
                counts[(r["USAF"], r["WBAN"])][y] = sum(int(r[m]) for m in
                                                       ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"))
    return stations, counts


def pick_station(site, stations, counts):
    ranked = sorted(stations, key=lambda s: haversine_km(site["lat"], site["lon"], s["lat"], s["lon"]))
    considered = []
    for s in ranked[:400]:
        c = counts.get((s["usaf"], s["wban"]), {})
        ok = all(c.get(y, 0) >= MIN_OBS_PER_YEAR for y in YEARS)
        d = haversine_km(site["lat"], site["lon"], s["lat"], s["lon"])
        considered.append((d, s, ok))
        if ok and d <= MAX_DISTANCE_KM:
            return s, d, considered[-4:]
    raise RuntimeError(f"no station with full coverage within {MAX_DISTANCE_KM} km of {site['city']}")


def parse_year(path: Path, tz: ZoneInfo):
    """Yield (local_datetime, wind_dir, wind_ms, temp_c) for one observation per UTC hour."""
    seen = set()
    with gzip.open(path, "rt", encoding="ascii", errors="replace") as f:
        for line in f:
            if len(line) < 105:
                continue
            key = line[15:23] + line[23:25]  # date + UTC hour
            if key in seen:
                continue
            try:
                utc = datetime(int(line[15:19]), int(line[19:21]), int(line[21:23]), int(line[23:25]), tzinfo=timezone.utc)
            except ValueError:
                continue
            direction = int(line[60:63]) if line[60:63].isdigit() else 999
            d_ok = line[63] in GOOD_Q and direction != 999
            speed_raw = line[65:69]
            s_ok = line[69] in GOOD_Q and speed_raw.isdigit() and speed_raw != "9999"
            temp_raw = line[87:92]
            t_ok = line[92] in GOOD_Q and temp_raw.strip("+-").isdigit() and temp_raw != "+9999"
            if not s_ok:
                continue
            seen.add(key)
            speed = int(speed_raw) / 10
            temp = int(temp_raw) / 10 if t_ok else None
            yield utc.astimezone(tz), (direction if d_ok else None), speed, temp


def add_to_rose(rose: Counter, deg: int) -> None:
    """ISD reports direction in 10-degree steps. Binning those straight into 22.5-degree sectors
    aliases (some sectors catch three steps, others two), so spread each reading over the +-5 degrees
    it represents and split it across the sectors it overlaps."""
    d = deg % 360
    lo, hi = d - 5, d + 5
    for i in range(16):
        for shift in (-360, 0, 360):
            c = i * 22.5 + shift
            overlap = min(hi, c + 11.25) - max(lo, c - 11.25)
            if overlap > 0:
                rose[i] += overlap / 10


def summarise(site, station, dist_km):
    tz = ZoneInfo(site["tz"])
    urls = []
    for y in YEARS:
        name = f"{station['usaf']}-{station['wban']}-{y}.gz"
        urls.append((f"{BUCKET.replace('noaa-isd-pds', 'noaa-isd-pds')}/data/{y}/{name}", CACHE / "noaa_isd" / str(y) / name))
    with ThreadPoolExecutor(max_workers=6) as ex:
        paths = list(ex.map(lambda u: fetch(*u), urls))

    n = night_n = 0
    night_still = 0
    night_speed = 0.0
    night_rose = Counter()
    all_rose = Counter()
    n_dir_night = n_dir_all = 0
    monthly = defaultdict(lambda: [0, 0])  # month -> [night obs, still night obs]
    temps = []
    hot25 = hot30 = 0
    night_temps = []
    for p in paths:
        for local, direction, speed, temp in parse_year(p, tz):
            n += 1
            is_night = local.hour in NIGHT_HOURS
            if temp is not None:
                temps.append(temp)
                hot25 += temp >= 25
                hot30 += temp >= 30
                if is_night:
                    night_temps.append(temp)
            if direction is not None and speed >= 0.5:
                add_to_rose(all_rose, direction)
                n_dir_all += 1
            if is_night:
                night_n += 1
                night_speed += speed
                still = speed < STILL_AIR_MS
                night_still += still
                monthly[local.month][0] += 1
                monthly[local.month][1] += still
                if direction is not None and speed >= 0.5:
                    add_to_rose(night_rose, direction)
                    n_dir_night += 1

    def rose(c, total):
        return [round(c[i] / total, 4) if total else 0 for i in range(16)]

    return {
        "id": site["id"], "city": site["city"], "state": site["state"], "lat": site["lat"], "lon": site["lon"],
        "station": {
            "usaf": station["usaf"], "wban": station["wban"], "name": station["name"], "icao": station["icao"],
            "lat": station["lat"], "lon": station["lon"], "elevM": float(station["elev"]) if station["elev"] else None,
            "distanceKm": round(dist_km, 1),
        },
        "years": [YEARS[0], YEARS[-1]],
        "hourlyObs": n,
        "nightObs": night_n,
        "stillNightShare": round(night_still / night_n, 4) if night_n else 0,
        "meanNightWindMs": round(night_speed / night_n, 2) if night_n else 0,
        "nightRose": rose(night_rose, n_dir_night),
        "allRose": rose(all_rose, n_dir_all),
        "monthlyStillNight": [round(monthly[m][1] / monthly[m][0], 4) if monthly[m][0] else 0 for m in range(1, 13)],
        "meanTempC": round(sum(temps) / len(temps), 1) if temps else None,
        "meanNightTempC": round(sum(night_temps) / len(night_temps), 1) if night_temps else None,
        "hours25CShare": round(hot25 / len(temps), 4) if temps else 0,
        "hours30CShare": round(hot30 / len(temps), 4) if temps else 0,
    }


def main():
    print("loading catalogue ...", flush=True)
    stations, counts = load_catalogue()
    print(f"  {len(stations):,} active stations; inventory covers {len(counts):,} station ids", flush=True)
    results = []
    for site in SITES:
        st, d, near = pick_station(site, stations, counts)
        print(f"{site['city']}, {site['state']}: {st['name']} ({st['usaf']}-{st['wban']}, {st['icao'] or 'no ICAO'}) {d:.1f} km", flush=True)
        r = summarise(site, st, d)
        print(f"  {r['hourlyObs']:,} hourly obs, {r['nightObs']:,} at night; still-air share at night {r['stillNightShare']:.1%}; "
              f"hours >=25C {r['hours25CShare']:.1%}", flush=True)
        results.append(r)
    out = {
        "source": "NOAA Integrated Surface Database (s3://noaa-isd-pds), hourly surface observations",
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "params": {"years": [YEARS[0], YEARS[-1]], "stillAirBelowMs": STILL_AIR_MS, "nightLocal": "22:00-06:59",
                   "sectors": SECTORS, "windDirection": "direction the wind blows FROM, degrees true"},
        "limits": "ISD has no acoustic data. These are weather exposure statistics, not noise measurements.",
        "sites": results,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    sys.exit(main())
