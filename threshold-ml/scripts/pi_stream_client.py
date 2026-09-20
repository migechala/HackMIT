#!/usr/bin/env python3
"""Pi raw TCP client — real USB mic + speaker, direct cable/Wi-Fi."""
import argparse
import socket
import struct
import subprocess
import time

import numpy as np
import sounddevice as sd
from scipy.signal import resample_poly

from threshold_ml.ingest.raw_protocol import pack_frame

ALSA_DEVICE = "plughw:4,0"
ALSA_RATE = 48000
ALSA_CHANNELS = 2

_aplay = None
_rec = None
_prev_tail = None
FADE = 960  # 20 ms at 48kHz

# USB mic — auto-detect input with max_input_channels>0 and UAC/USB
MIC_DEVICE = None
MIC_RATE = 48000  # most USB mics run 48k, resample to 4000
for i, d in enumerate(sd.query_devices()):
    if int(d["max_input_channels"]) > 0 and ("UAC" in d["name"] or "USB" in d["name"]):
        # prefer the input, not the output we use for aplay
        if d["max_input_channels"] >= 1:
            MIC_DEVICE = i
            break
if MIC_DEVICE is None:
    MIC_DEVICE = sd.default.device[0]

def get_aplay():
    global _aplay
    if _aplay is None or _aplay.poll() is not None:
        _aplay = subprocess.Popen(
            ["aplay", "-D", ALSA_DEVICE, "-f", "FLOAT_LE", "-r", str(ALSA_RATE), "-c", str(ALSA_CHANNELS), "-q"],
            stdin=subprocess.PIPE,
        )
    return _aplay

def get_rec():
    global _rec
    if _rec is None:
        _rec = sd.InputStream(device=MIC_DEVICE, channels=1, samplerate=MIC_RATE, dtype="float32", blocksize=0)
        _rec.start()
    return _rec

# last speaker history for error mic correction (L+M-1)
_speaker_hist = None

def real_sensor(L=2048, M=3):
    global _speaker_hist
    ir = np.array([0, 0, 0.6], dtype=np.float32)  # replace with measured secondary_ir
    # capture L samples at 4000 Hz: read at MIC_RATE and resample
    rec = get_rec()
    # read 512 ms at MIC_RATE
    needed = int(L * MIC_RATE / 4000)
    buf, _ = rec.read(needed)
    mono = buf[:, 0].astype(np.float32)
    # resample 48k -> 4k
    ref = resample_poly(mono, 4000, MIC_RATE).astype(np.float32)[:L]
    if len(ref) < L:
        ref = np.pad(ref, (0, L - len(ref)))
    # error mic: same USB mic for now (single-mic board); duplicate
    # if you have 2 mics, open second InputStream and read similarly
    err = ref.copy()
    if _speaker_hist is None:
        _speaker_hist = np.zeros(L + len(ir) - 1, dtype=np.float32)
    speaker = _speaker_hist.copy()
    return ref, err, speaker, ir

def play_anti(anti, fs=4000, gain=2.5):
    global _prev_tail, _speaker_hist
    anti = np.asarray(anti, dtype=np.float32) * float(gain)
    anti = np.clip(anti, -0.99, 0.99)
    # keep history for next error correction (raw 4000Hz before resample)
    if _speaker_hist is not None:
        # shift and append anti at 4000Hz into history
        new_hist = np.concatenate([_speaker_hist[len(anti):], anti]) if len(_speaker_hist) > len(anti) else anti[-len(_speaker_hist):]
        _speaker_hist = new_hist.astype(np.float32)
    if fs != ALSA_RATE:
        anti = resample_poly(anti, ALSA_RATE, fs).astype(np.float32)
    anti = anti.reshape(-1, 1)
    anti = np.repeat(anti, ALSA_CHANNELS, axis=1)
    if _prev_tail is not None and len(anti) >= FADE:
        fade_out = np.linspace(1, 0, FADE)[:, None]
        fade_in = np.linspace(0, 1, FADE)[:, None]
        anti[:FADE] = _prev_tail[-FADE:] * fade_out + anti[:FADE] * fade_in
    _prev_tail = anti.copy()
    data = anti.astype("<f4").tobytes()
    try:
        get_aplay().stdin.write(data)
        get_aplay().stdin.flush()
    except BrokenPipeError:
        global _aplay
        _aplay = None
        get_aplay().stdin.write(data)
        get_aplay().stdin.flush()

def check_mic(seconds=1):
    rec = get_rec()
    needed = int(MIC_RATE * seconds)
    buf, _ = rec.read(needed)
    rms = float(np.sqrt(np.mean(buf.astype(np.float64) ** 2)))
    db = 20 * np.log10(rms + 1e-9)
    print(f"mic check dev {MIC_DEVICE} {sd.query_devices(MIC_DEVICE)['name']}: rms {rms:.4f} ({db:.1f} dBFS) — {'OK' if rms > 0.005 else 'WARNING: silent/quiet, check gain/cable'}")
    return rms

def stream(server, fs, rate_hz):
    host, port = server.rsplit(":", 1)
    s = socket.create_connection((host, int(port)))
    s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    print(f"connected to {server} mic dev {MIC_DEVICE} -> {sd.query_devices(MIC_DEVICE)['name']}")
    check_mic()
    sample_index = 0
    interval = 1 / rate_hz
    try:
        while True:
            start = time.time()
            ref, err, speaker, ir = real_sensor()
            frame = pack_frame(ref, err, speaker, ir, sample_index)
            s.sendall(frame)
            hdr = b""
            while len(hdr) < 4:
                chunk = s.recv(4 - len(hdr))
                if not chunk:
                    raise ConnectionError("server closed")
                hdr += chunk
            H = struct.unpack(">I", hdr)[0]
            payload = b""
            while len(payload) < H * 4:
                chunk = s.recv(H * 4 - len(payload))
                if not chunk:
                    raise ConnectionError("server closed")
                payload += chunk
            anti = np.frombuffer(payload, dtype="<f4").copy()
            rms = float(np.sqrt(np.mean(ref.astype(np.float64) ** 2)))
            db = 20 * np.log10(rms + 1e-9)
            if sample_index % (2048 * 5) == 0:
                print(f"mic rms {rms:.4f} ({db:.1f} dBFS) -> anti max {np.max(np.abs(anti)):.3f} {'[MIC SILENT!]' if rms < 0.005 else ''}")
            play_anti(anti, fs=fs)
            sample_index += len(ref)
            sleep = interval - (time.time() - start)
            if sleep > 0:
                time.sleep(sleep)
    finally:
        s.close()
        if _aplay:
            try:
                _aplay.stdin.close()
            except Exception:
                pass
        if _rec:
            _rec.stop(); _rec.close()

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--server", default="192.168.10.1:5000")
    ap.add_argument("--fs", type=int, default=4000)
    ap.add_argument("--rate-hz", type=float, default=20)
    args = ap.parse_args()
    stream(args.server, args.fs, args.rate_hz)
