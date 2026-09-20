#!/usr/bin/env python3
"""Measure secondary_ir on Pi via exponential sine sweep (ESS).

Pi plays sweep via plughw:4,0 and records via USB mic, GX10 not needed.
Run on Pi in quiet room, 1m from speaker.

Usage:
  uv run python scripts/measure_secondary_ir.py --out threshold-ml/data/secondary_ir.npz --duration 5 --fs 48000
  # then set ir = np.load('data/secondary_ir.npz')['ir'] in pi_stream_client.py
"""
import argparse
import time
import numpy as np
import sounddevice as sd
from scipy.signal import chirp

def ess(f0=20, f1=2000, duration=5, fs=48000):
    t = np.arange(int(duration*fs))/fs
    # exponential sweep
    sweep = chirp(t, f0, duration, f1, method="logarithmic")
    # half-Hann window to avoid clicks
    w = 0.5*(1-np.cos(2*np.pi*np.arange(len(sweep))/len(sweep)))
    fade = int(0.02*fs)
    w[:fade] = np.linspace(0,1,fade)
    w[-fade:] = np.linspace(1,0,fade)
    return (sweep*w*0.7).astype(np.float32)

def measure(out, duration, fs, play_dev, rec_dev):
    print(f"play {play_dev} -> rec {rec_dev} {duration}s {fs}Hz")
    sweep = ess(duration=duration, fs=fs)
    # find UAC devices if None
    if play_dev is None:
        for i,d in enumerate(sd.query_devices()):
            if int(d["max_output_channels"])>0 and ("UAC" in d["name"] or "USB" in d["name"]):
                play_dev=i; break
    if rec_dev is None:
        for i,d in enumerate(sd.query_devices()):
            if int(d["max_input_channels"])>0 and ("UAC" in d["name"] or "USB" in d["name"]):
                rec_dev=i; break
    print(f"using play {play_dev} {sd.query_devices(play_dev)['name']} rec {rec_dev} {sd.query_devices(rec_dev)['name']}")
    rec = sd.playrec(sweep.reshape(-1,1), samplerate=fs, channels=1, device=(rec_dev, play_dev), blocking=True)
    rec = rec[:,0].astype(np.float32)
    # deconvolve via inverse ESS (Farina method)
    # simple: cross-correlate with inverse sweep
    t = np.arange(len(sweep))/fs
    inv = sweep[::-1] * np.exp(-np.log(2)*t[::-1])  # approx inverse
    ir = np.convolve(rec, inv, mode="full")[: int(0.1*fs)]  # first 100ms
    ir = ir / (np.max(np.abs(ir)) + 1e-9) * 0.6
    # resample to 4000 Hz model rate and truncate to 48 taps
    from scipy.signal import resample_poly
    ir_4k = resample_poly(ir, 4000, fs).astype(np.float32)[:48]
    np.savez_compressed(out, ir=ir_4k, ir_48k=ir.astype(np.float32), fs=np.int32(4000), sweep=sweep)
    print(f"saved ir_4k {len(ir_4k)} taps to {out}, peak {np.max(np.abs(ir_4k)):.3f}, delay {np.argmax(np.abs(ir_4k))} @4kHz")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data/secondary_ir.npz")
    ap.add_argument("--duration", type=float, default=5)
    ap.add_argument("--fs", type=int, default=48000)
    ap.add_argument("--play-dev", type=int, default=None)
    ap.add_argument("--rec-dev", type=int, default=None)
    args = ap.parse_args()
    measure(args.out, args.duration, args.fs, args.play_dev, args.rec_dev)
