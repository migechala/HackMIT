#!/usr/bin/env python3
"""Prometheus exporter — THRESHOLD dashboard: cancellation performance,
remaining noise, energy/cost of mitigation, and jurisdiction-aware alerting.

- Reads real attenuation from artifacts/**/summary.json when present (fallback: 12.4 dB)
- Emits per-facility metrics: the facility's location determines its
  jurisdiction profile (day/night limits + day/night hours), timezone,
  tariff (state industrial price via PUDL) and baseline tone.
- Day/night is evaluated in the facility's local time (zoneinfo), so the
  applicable threshold switches with local rules, not viewer time.
- Prometheus alerting rules (prometheus_rules.yml) handle "sustained"
  exceedance (for: 30s) and notify; Grafana shows firing state.
  This exporter only reports instantaneous state (0/1) — duration is in rules.
"""
import json, math, time
from datetime import datetime, timezone
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer

try:
    from zoneinfo import ZoneInfo
except ImportError:
    ZoneInfo = None  # fallback to UTC

FACILITIES = [
    # id, city, state, jurisdiction, tz, day, night, dayStart, nightStart, baseline, freq, tariff $/kWh, operator
    dict(id="dc-manassas-01", city="Manassas", state="VA", jurisdiction="pwc-va",
         name="Prince William County, VA", tz="America/New_York", day=60, night=55,
         dayStart=7, nightStart=22, baseline=66.6, freq=120, tariff=0.090, operator="Helion Cloud Infrastructure"),
    dict(id="dc-divide-02", city="Crosby", state="ND", jurisdiction="divide-nd",
         name="Divide County, ND", tz="America/Chicago", day=65, night=50,
         dayStart=6, nightStart=21, baseline=61.2, freq=100, tariff=0.073, operator="Northline Data Partners"),
    dict(id="dc-manassas-01b", city="Manassas", state="VA", jurisdiction="pwc-va",
         name="Prince William County, VA", tz="America/New_York", day=60, night=55,
         dayStart=7, nightStart=22, baseline=66.6, freq=120, tariff=0.090, operator="Helion Cloud Infrastructure"),
    dict(id="dc-scranton-03", city="Scranton", state="PA", jurisdiction="pennfuture-pa",
         name="PennFuture Model Ordinance, PA", tz="America/New_York", day=58, night=48,
         dayStart=7, nightStart=21, baseline=68.1, freq=120, tariff=0.079, operator="Helion Cloud Infrastructure"),
    dict(id="dc-ypsi-04", city="Ypsilanti", state="MI", jurisdiction="washtenaw-mi",
         name="Washtenaw County, MI", tz="America/Detroit", day=62, night=53,
         dayStart=7, nightStart=22, baseline=63.4, freq=60, tariff=0.083, operator="Meridian Compute"),
]
# Deduplicate: keep canonical 4
FACILITIES = [f for f in FACILITIES if f["id"] != "dc-manassas-01b"]
ALERT_MARGIN_DB = 2        # alert at limit-2 dB (warn before breach), configurable in web app
ALERT_HOLD_SECONDS = 30    # must stay above alert level for this long (Prometheus `for:` handles it)

def load_attenuation():
    """attenuation mean per method from real evaluation; fallback to audited demo values."""
    out = {}
    for summary in Path("artifacts").rglob("summary.json"):
        try:
            d = json.loads(summary.read_text())
            for method, v in d.items():
                if isinstance(v, dict) and "attenuation_db" in v:
                    out[method] = float(v["attenuation_db"]["mean"])
        except Exception:
            pass
    if not out:
        out = {"ml": 12.4, "sinusoid": 8.1, "perfect_forecast": 15.8, "persistence": 6.2}
    return out

def facility_local_hour(fac):
    if ZoneInfo is None:
        return datetime.now(timezone.utc).hour, "UTC"
    try:
        z = ZoneInfo(fac["tz"])
        lt = datetime.now(z)
        return lt.hour, lt.strftime("%Y-%m-%d %H:%M %Z")
    except Exception:
        return datetime.now(timezone.utc).hour, "UTC"

def build_metrics():
    att = load_attenuation()
    ml_att = att.get("ml", 12.4)
    # gentle live jitter so Grafana timeseries move (no artifacts needed)
    jitter = 0.35 * math.sin(time.time() / 45) + 0.12 * math.sin(time.time() / 7)
    t = time.time()

    lines = []
    def add(name, value, labels=None, help_text=None):
        # optional HELP/TYPE not required but useful
        label_str = ""
        if labels:
            label_str = "{" + ",".join(f'{k}="{v}"' for k, v in labels.items()) + "}"
        lines.append(f"{name}{label_str} {value}")

    # --- Global (backward compat) ---
    for method, v in att.items():
        add("threshold_attenuation_db", round(v + (jitter if method == "ml" else 0), 3), {"method": method})
        # amplification_count only stored for ml in many summaries; emit 0 otherwise
        add("threshold_amplification_count", 2 if method == "ml" and v < 10 else 0, {"method": method})
    frames = len(list(Path("data/real").rglob("*.npz"))) if Path("data/real").exists() else 0
    add("threshold_real_frames", frames)
    try:
        area = 3.14159 * (2.5 * max(0, ml_att))**2
        add("threshold_nature_freed_m2", round(area, 2))
    except Exception:
        pass

    # --- Per-facility: cancellation performance / remaining noise / energy+c cost / threshold ---
    for fac in FACILITIES:
        hour, local_str = facility_local_hour(fac)
        is_day = fac["dayStart"] <= hour < fac["nightStart"]
        period = "day" if is_day else "night"
        applicable = fac["day"] if is_day else fac["night"]
        # per-facility tiny offset so facilities don't plot identically
        off = (hash(fac["id"]) % 7) * 0.15
        att_fac = max(0.5, ml_att + off + 0.25 * math.sin(t/30 + hash(fac["id"]) % 10))
        residual = fac["baseline"] - att_fac + 0.18 * math.sin(t/18 + off)
        residual = round(residual, 2)
        baseline = fac["baseline"]
        anc_active = 1  # ANC on in demo; real ingest would set 0/1 from device telemetry
        # phase illustration (180 deg optimal, hardware adapts)
        phase = 180

        # power/energy/cost (mitigation node only, not facility savings)
        power_w = round((5.2 if anc_active else 1.1) + 0.2 * math.sin(t/20 + off), 2)
        # energy since midnight facility-local (Wh)
        if ZoneInfo:
            try:
                z = ZoneInfo(fac["tz"])
                now_local = datetime.now(z)
                hours_today = now_local.hour + now_local.minute/60 + now_local.second/3600
            except Exception:
                hours_today = (t % 86400)/3600
        else:
            hours_today = (t % 86400)/3600
        energy_wh = round(power_w * hours_today, 2)
        tariff = fac["tariff"]
        cost_per_hour = round(power_w/1000 * tariff, 6)
        cost_per_day = round(power_w/1000 * 24 * tariff, 4)
        cost_per_month = round(power_w/1000 * 24 * 30 * tariff, 2)
        w_per_db = round(power_w / max(0.1, att_fac), 3)
        # cost per dB-hour: $ per (dB * hour) of attenuation
        cost_per_dbh = round((power_w/1000 * tariff) / max(0.1, att_fac), 6)

        margin = round(residual - applicable, 2)              # >0 means above limit
        alert_level = applicable - ALERT_MARGIN_DB
        above_alert = 1 if residual > alert_level else 0
        exceed = 1 if residual > applicable else 0            # instantaneous; Prometheus `for:` makes it sustained
        # facility info gauge (always 1, labels carry jurisdiction)
        add("threshold_facility_info", 1, {"facility": fac["id"], "city": fac["city"], "state": fac["state"],
               "jurisdiction": fac["jurisdiction"], "jurisdiction_name": fac["name"],
               "timezone": fac["tz"], "operator": fac["operator"]})
        # cancellation performance
        add("threshold_attenuation_db", round(att_fac, 2), {"method": "ml", "facility": fac["id"]})
        add("threshold_dominant_frequency_hz", fac["freq"], {"facility": fac["id"]})
        add("threshold_phase_deg", phase, {"facility": fac["id"]})
        add("threshold_anc_active", anc_active, {"facility": fac["id"]})
        # remaining noise
        add("threshold_residual_db", residual, {"facility": fac["id"], "unit": "dBA"})
        add("threshold_baseline_db", baseline, {"facility": fac["id"], "unit": "dBA"})
        # threshold limits: emit both day and night with applicable flag so Grafana can step-plot
        for p, lim in [("day", fac["day"]), ("night", fac["night"])]:
            add("threshold_threshold_limit_db", lim, {"facility": fac["id"], "jurisdiction": fac["jurisdiction"],
                 "period": p, "applicable": "1" if p == period else "0"})
        add("threshold_applicable_threshold_db", applicable, {"facility": fac["id"], "jurisdiction": fac["jurisdiction"], "period": period})
        add("threshold_noise_margin_db", margin, {"facility": fac["id"]})
        add("threshold_alert_level_db", alert_level, {"facility": fac["id"]})
        add("threshold_exceedance_state", exceed, {"facility": fac["id"], "jurisdiction": fac["jurisdiction"]})
        add("threshold_alert_pending", above_alert, {"facility": fac["id"], "alert_margin_db": str(ALERT_MARGIN_DB)})
        # energy & operating cost (mitigation electricity only)
        add("threshold_system_power_watts", power_w, {"facility": fac["id"]})
        add("threshold_energy_wh_total", energy_wh, {"facility": fac["id"]})
        add("threshold_operating_cost_usd_per_hour", cost_per_hour, {"facility": fac["id"]})
        add("threshold_operating_cost_usd_per_day", cost_per_day, {"facility": fac["id"]})
        add("threshold_operating_cost_usd_per_month", cost_per_month, {"facility": fac["id"]})
        add("threshold_power_per_db_w_per_db", w_per_db, {"facility": fac["id"]})
        add("threshold_cost_per_db_hour_usd", cost_per_dbh, {"facility": fac["id"]})
        # tariff info
        add("threshold_tariff_usd_per_kwh", tariff, {"facility": fac["id"], "state": fac["state"], "source": "EIA-861 via PUDL 2024 state industrial avg"})
        # local hour gauge
        add("threshold_facility_local_hour", hour, {"facility": fac["id"]})

    # global alert config for dashboards to display
    add("threshold_alert_config_info", 1, {"alert_margin_db": str(ALERT_MARGIN_DB), "alert_hold_seconds": str(ALERT_HOLD_SECONDS),
                                           "description": "Alert when residual stays above (applicable limit - margin) for hold duration; notify responsible operator"})
    return "\n".join(lines) + "\n"

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/metrics":
            body = build_metrics()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(body.encode())
        elif self.path == "/health":
            self.send_response(200); self.end_headers(); self.wfile.write(b"ok")
        else:
            self.send_response(404); self.end_headers()
    def log_message(self, *a): pass

if __name__ == "__main__":
    print("exporter on :8000/metrics  (per-facility cancellation / residual / power+cost / jurisdiction-aware thresholds)")
    print(f"facilities: {', '.join(f['id'] for f in FACILITIES)}  alert_margin={ALERT_MARGIN_DB}dB hold={ALERT_HOLD_SECONDS}s")
    HTTPServer(("0.0.0.0", 8000), H).serve_forever()
