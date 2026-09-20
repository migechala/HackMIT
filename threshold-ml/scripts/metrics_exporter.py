#!/usr/bin/env python3
"""Prometheus exporter: summary.json attenuation + real data growth -> /metrics"""
import json, time
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer

def load():
    lines = []
    for summary in Path("artifacts").rglob("summary.json"):
        try:
            d = json.loads(summary.read_text())
            for method, v in d.items():
                if isinstance(v, dict) and "attenuation_db" in v:
                    m = v["attenuation_db"]["mean"]
                    lines.append(f'threshold_attenuation_db{{method="{method}"}} {m}')
                    lines.append(f'threshold_amplification_count{{method="{method}"}} {v.get("amplification_count",0)}')
        except: pass
    frames = len(list(Path("data/real").rglob("*.npz"))) if Path("data/real").exists() else 0
    lines.append(f"threshold_real_frames {frames}")
    # nature freed m² from ml mean: π*(2.5*dB)^2
    try:
        ml = float([l.split()[-1] for l in lines if 'method="ml"' in l][0])
        area = 3.14159 * (2.5 * max(0, ml))**2
        lines.append(f"threshold_nature_freed_m2 {area}")
    except: pass
    return "\n".join(lines) + "\n"

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/metrics":
            self.send_response(200); self.send_header("Content-Type","text/plain"); self.end_headers()
            self.wfile.write(load().encode())
        else:
            self.send_response(404); self.end_headers()
    def log_message(self, *a): pass

if __name__ == "__main__":
    print("exporter on :8000/metrics")
    HTTPServer(("0.0.0.0",8000), H).serve_forever()
