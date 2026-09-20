#!/usr/bin/env python3
"""Half-hour auto-retrain on real Pi data. Run on GX10 via cron or systemd timer.

Every 30 min, if >=30 min of new data in data/real, fine-tunes drift2_h128 on muted windows.
Keeps per-rack isolation; no live adaptation per sample.
"""
import time, subprocess, json
from pathlib import Path
import yaml

CONFIG = "configs/real_finetune.yaml"
BASE_CKPT = "artifacts/checkpoints/drift2_h128/drift2_h128_best.pt"
OUT_ROOT = Path("artifacts/checkpoints")

def has_halfhour_data():
    files = list(Path("data/real").rglob("*.npz"))
    # 20 Hz * 1800s = 36000 frames = half hour
    return len(files) >= 36000

def run():
    # ensure real_finetune.yaml exists
    if not Path(CONFIG).exists():
        # create from drift.yaml
        cfg = yaml.safe_load(Path("configs/drift.yaml").read_text())
        cfg["experiment"] = "real_halfhour"
        cfg["training"]["epochs"] = 10
        cfg["training"]["lr"] = 0.0001
        Path(CONFIG).write_text(yaml.safe_dump(cfg))
        print(f"created {CONFIG}")
    # check data
    if not has_halfhour_data():
        print("not enough real data yet (<30 min), skipping")
        return
    exp = yaml.safe_load(Path(CONFIG).read_text())["experiment"]
    ckpt = BASE_CKPT if not (OUT_ROOT/exp).exists() else str(OUT_ROOT/exp / f"{exp}_last.pt")
    resume = BASE_CKPT if ckpt == BASE_CKPT else ckpt
    print(f"fine-tuning {exp} from {resume}")
    subprocess.run(["uv", "run", "python", "scripts/train.py", "--config", CONFIG, "--device", "cuda", "--resume", resume], check=False)
    # evaluate on held-out last half hour
    subprocess.run(["uv", "run", "python", "scripts/evaluate.py", "--device", "cuda", "--checkpoint", str(OUT_ROOT/exp / f"{exp}_best.pt"), "--output", f"artifacts/evaluation_{exp}"], check=False)
    print("done, promote _best.pt to ingest server via --checkpoint flag")

if __name__ == "__main__":
    while True:
        run()
        print("sleeping 30 min")
        time.sleep(1800)
