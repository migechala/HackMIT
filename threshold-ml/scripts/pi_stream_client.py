#!/usr/bin/env python3
"""Pi raw TCP client — arecord mic (no sounddevice InputStream), aplay speaker."""
import argparse, socket, struct, subprocess, threading, time
import numpy as np
from scipy.signal import resample_poly
from threshold_ml.ingest.raw_protocol import pack_frame

ALSA_DEVICE = "plughw:4,0"
ALSA_RATE = 48000
ALSA_CHANNELS = 2
MIC_ALSA = "plughw:1,0"  # from arecord -l, adjust if needed
MIC_RATE = 48000

_aplay = None
_prev_tail = None
FADE = 960

_ring = np.zeros(int(MIC_RATE * 1), dtype=np.float32)
_pos = 0
_lock = threading.Lock()
_arecord = None

def get_aplay():
    global _aplay
    if _aplay is None or _aplay.poll() is not None:
        _aplay = subprocess.Popen(
            ["aplay", "-D", ALSA_DEVICE, "-f", "FLOAT_LE", "-r", str(ALSA_RATE), "-c", str(ALSA_CHANNELS), "-q"],
            stdin=subprocess.PIPE,
        )
    return _aplay

def mic_thread():
    global _pos
    proc = subprocess.Popen(
        ["arecord", "-D", MIC_ALSA, "-f", "FLOAT_LE", "-r", str(MIC_RATE), "-c", "1", "-q"],
        stdout=subprocess.PIPE,
    )
    global _arecord
    _arecord = proc
    while True:
        data = proc.stdout.read(4096)
        if not data:
            break
        chunk = np.frombuffer(data, dtype="<f4").astype(np.float32)
        with _lock:
            n = len(chunk)
            if n >= len(_ring):
                _ring[:] = chunk[-len(_ring) :]
                _pos = 0
            else:
                end = _pos + n
                if end <= len(_ring):
                    _ring[_pos:end] = chunk
                else:
                    _ring[_pos:] = chunk[: len(_ring) - _pos]
                    _ring[: end - len(_ring)] = chunk[len(_ring) - _pos :]
                _pos = end % len(_ring)

threading.Thread(target=mic_thread, daemon=True).start()
time.sleep(0.5)

_speaker_hist = None
try:
    _MEASURED_IR = np.load("data/secondary_ir.npz")["ir"].astype(np.float32)
    print(f"loaded ir {len(_MEASURED_IR)}")
except Exception:
    _MEASURED_IR = np.array([0, 0, 0.6], dtype=np.float32)

def real_sensor(L=2048, M=3):
    global _speaker_hist
    ir = _MEASURED_IR
    needed = int(L * MIC_RATE / 4000)
    with _lock:
        if _pos >= needed:
            mono = _ring[_pos - needed : _pos].copy()
        else:
            mono = np.concatenate([_ring[-(needed - _pos) :], _ring[:_pos]])
    ref = resample_poly(mono, 4000, MIC_RATE).astype(np.float32)[:L]
    if len(ref) < L:
        ref = np.pad(ref, (0, L - len(ref)))
    err = ref.copy()
    if _speaker_hist is None:
        _speaker_hist = np.zeros(L + len(ir) - 1, dtype=np.float32)
    return ref, err, _speaker_hist.copy(), ir

def play_anti(anti, fs=4000, gain=2.5):
    global _prev_tail, _speaker_hist
    anti = np.asarray(anti, dtype=np.float32) * float(gain)
    anti = np.clip(anti, -0.99, 0.99)
    if _speaker_hist is not None:
        _speaker_hist = np.concatenate([_speaker_hist[len(anti) :], anti]) if len(_speaker_hist) > len(anti) else anti[-len(_speaker_hist) :].astype(np.float32)
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
    while True:
        try:
            s = socket.create_connection((host, int(port)), timeout=5)
            s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
            print(f"connected to {server} mic {MIC_ALSA} -> {ALSA_DEVICE}")
            sample_index = 0
            interval = 1 / rate_hz
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
                if sample_index % (2048 * 20) == 0:
                    print(f"mic rms {np.std(ref):.3f} -> anti max {np.max(np.abs(anti)):.3f}")
                play_anti(anti, fs=fs)
                sample_index += len(ref)
                sleep = interval - (time.time() - start)
                if sleep > 0:
                    time.sleep(sleep)
        except Exception as e:
            print(f"disconnected: {e} — reconnecting in 2s")
            time.sleep(2)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--server", default="192.168.10.1:5000")
    ap.add_argument("--fs", type=int, default=4000)
    ap.add_argument("--rate-hz", type=float, default=20)
    args = ap.parse_args()
    stream(args.server, args.fs, args.rate_hz)
