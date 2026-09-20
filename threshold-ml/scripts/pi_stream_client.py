#!/usr/bin/env python3
"""Pi raw TCP client — real USB mic with low-latency ring buffer, no 512ms block."""
import argparse
import socket
import struct
import subprocess
import threading
import time

import numpy as np
import sounddevice as sd
from scipy.signal import resample_poly

from threshold_ml.ingest.raw_protocol import pack_frame

ALSA_DEVICE = "plughw:4,0"
ALSA_RATE = 48000
ALSA_CHANNELS = 2

_aplay = None
_prev_tail = None
FADE = 960

# mic ring buffer — continuous capture, no per-frame 512ms wait
MIC_DEVICE = None
MIC_RATE = 48000
for i, d in enumerate(sd.query_devices()):
    if int(d["max_input_channels"]) > 0 and ("UAC" in d["name"] or "USB" in d["name"]):
        MIC_DEVICE = i
        break
if MIC_DEVICE is None:
    MIC_DEVICE = sd.default.device[0]

_ring = np.zeros(int(MIC_RATE * 1), dtype=np.float32)  # 1s ring
_ring_pos = 0
_ring_lock = threading.Lock()

def mic_callback(indata, frames, time_info, status):
    global _ring_pos
    if status:
        print(status)
    mono = indata[:, 0].astype(np.float32)
    with _ring_lock:
        n = len(mono)
        if n >= len(_ring):
            _ring[:] = mono[-len(_ring):]
            _ring_pos = 0
        else:
            end = _ring_pos + n
            if end <= len(_ring):
                _ring[_ring_pos:end] = mono
            else:
                _ring[_ring_pos:] = mono[: len(_ring) - _ring_pos]
                _ring[: end - len(_ring)] = mono[len(_ring) - _ring_pos :]
            _ring_pos = end % len(_ring)

_rec_stream = None

def get_rec():
    global _rec_stream
    if _rec_stream is None:
        _rec_stream = sd.InputStream(device=MIC_DEVICE, channels=1, samplerate=MIC_RATE, dtype="float32", callback=mic_callback, blocksize=480)
        _rec_stream.start()
        time.sleep(0.2)
    return _rec_stream

def get_aplay():
    global _aplay
    if _aplay is None or _aplay.poll() is not None:
        _aplay = subprocess.Popen(
            ["aplay", "-D", ALSA_DEVICE, "-f", "FLOAT_LE", "-r", str(ALSA_RATE), "-c", str(ALSA_CHANNELS), "-q"],
            stdin=subprocess.PIPE,
        )
    return _aplay

_speaker_hist = None

def real_sensor(L=2048, M=3):
    global _speaker_hist
    ir = np.array([0, 0, 0.6], dtype=np.float32)
    # latest 512 ms from ring, no blocking 512ms read
    needed_raw = int(L * MIC_RATE / 4000)
    with _ring_lock:
        if _ring_pos >= needed_raw:
            mono = _ring[_ring_pos - needed_raw : _ring_pos].copy()
        else:
            mono = np.concatenate([_ring[-(needed_raw - _ring_pos) :], _ring[:_ring_pos]])
    ref = resample_poly(mono, 4000, MIC_RATE).astype(np.float32)[:L]
    if len(ref) < L:
        ref = np.pad(ref, (0, L - len(ref)))
    err = ref.copy()
    if _speaker_hist is None:
        _speaker_hist = np.zeros(L + len(ir) - 1, dtype=np.float32)
    speaker = _speaker_hist.copy()
    return ref, err, speaker, ir

def check_mic(seconds=0.5):
    time.sleep(seconds)
    with _ring_lock:
        buf = _ring.copy()
    rms = float(np.sqrt(np.mean(buf.astype(np.float64) ** 2)))
    db = 20 * np.log10(rms + 1e-9)
    print(f"mic check dev {MIC_DEVICE} {sd.query_devices(MIC_DEVICE)['name']}: rms {rms:.4f} ({db:.1f} dBFS) — {'OK' if rms > 0.005 else 'WARNING: silent'}")
    return rms

def play_anti(anti, fs=4000, gain=2.5):
    global _prev_tail, _speaker_hist
    anti = np.asarray(anti, dtype=np.float32) * float(gain)
    anti = np.clip(anti, -0.99, 0.99)
    if _speaker_hist is not None:
        new_hist = np.concatenate([_speaker_hist[len(anti) :], anti]) if len(_speaker_hist) > len(anti) else anti[-len(_speaker_hist) :]
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

def stream(server, fs, rate_hz):
    host, port = server.rsplit(":", 1)
    s = socket.create_connection((host, int(port)))
    s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    print(f"connected to {server} mic dev {MIC_DEVICE} -> {sd.query_devices(MIC_DEVICE)['name']}")
    get_rec()
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
                print(f"mic rms {rms:.4f} ({db:.1f} dBFS) -> anti max {np.max(np.abs(anti)):.3f} {'[SILENT]' if rms < 0.005 else ''}")
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
        if _rec_stream:
            _rec_stream.stop()
            _rec_stream.close()

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--server", default="192.168.10.1:5000")
    ap.add_argument("--fs", type=int, default=4000)
    ap.add_argument("--rate-hz", type=float, default=20)
    args = ap.parse_args()
    stream(args.server, args.fs, args.rate_hz)
