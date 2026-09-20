#!/usr/bin/env python3
"""Pi raw TCP client — send + receive anti-noise, direct cable/Wi-Fi."""
import argparse
import socket
import struct
import subprocess
import time

import numpy as np
from scipy.signal import resample_poly

from threshold_ml.ingest.raw_protocol import pack_frame

# Pi's working DAC from `aplay -l`: card 4 UACDemoV10
ALSA_DEVICE = "plughw:4,0"
ALSA_RATE = 48000  # USB DACs reject 4000 Hz; resample
ALSA_CHANNELS = 2  # card 4 reports max_output_channels=2, mono fails with -9998


def fake_sensor(L=2048, M=3):
    t = time.time()
    ir = np.array([0, 0, 0.6], dtype=np.float32)
    ref = np.sin(np.arange(L) * 0.1 + t).astype(np.float32)
    err = np.sin(np.arange(L) * 0.1 + t + 0.2).astype(np.float32)
    speaker = np.zeros(L + len(ir) - 1, dtype=np.float32)
    return ref, err, speaker, ir


def play_anti(anti, fs=4000, gain=2.5):
    anti = np.asarray(anti, dtype=np.float32) * float(gain)
    anti = np.clip(anti, -0.99, 0.99)
    if fs != ALSA_RATE:
        anti = resample_poly(anti, ALSA_RATE, fs).astype(np.float32)
    anti = np.asarray(anti, dtype=np.float32).reshape(-1, 1)
    if ALSA_CHANNELS == 2 and anti.shape[1] == 1:
        anti = np.repeat(anti, 2, axis=1)
    # interleave to bytes: FLOAT_LE, 2 channels
    data = anti.astype("<f4").tobytes()
    # blocking aplay — same path as `speaker-test -D plughw:4,0` which you confirmed beeps
    proc = subprocess.Popen(
        ["aplay", "-D", ALSA_DEVICE, "-f", "FLOAT_LE", "-r", str(ALSA_RATE), "-c", str(ALSA_CHANNELS), "-q"],
        stdin=subprocess.PIPE,
    )
    proc.communicate(data)


def stream(server, fs, rate_hz):
    host, port = server.rsplit(":", 1)
    s = socket.create_connection((host, int(port)))
    s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    print(f"connected to {server}")
    sample_index = 0
    interval = 1 / rate_hz
    try:
        while True:
            start = time.time()
            ref, err, speaker, ir = fake_sensor()
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
            if sample_index % (2048 * 20) == 0:
                print(f"got anti {H} samples, max {np.max(np.abs(anti)):.3f}")
            play_anti(anti, fs=fs)
            sample_index += len(ref)
            sleep = interval - (time.time() - start)
            if sleep > 0:
                time.sleep(sleep)
    finally:
        s.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--server", default="192.168.10.1:5000")
    ap.add_argument("--fs", type=int, default=4000)
    ap.add_argument("--rate-hz", type=float, default=20)
    args = ap.parse_args()
    stream(args.server, args.fs, args.rate_hz)
