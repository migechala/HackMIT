#!/usr/bin/env python3
"""Pi raw TCP client — send + receive anti-noise, direct cable/Wi-Fi."""
import argparse, time, socket, struct
import numpy as np
from threshold_ml.ingest.raw_protocol import pack_frame

def fake_sensor(L=2048, M=3):
    t = time.time()
    ir = np.array([0,0,0.6], dtype=np.float32)
    ref = np.sin(np.arange(L)*0.1 + t).astype(np.float32)
    err = np.sin(np.arange(L)*0.1 + t + 0.2).astype(np.float32)
    speaker = np.zeros(L+len(ir)-1, dtype=np.float32)
    return ref, err, speaker, ir

def play_anti(anti, fs=4000):
    try:
        import sounddevice as sd
        # blocking play keeps 50 ms cadence; use same fs as model
        sd.play(anti, samplerate=fs, blocking=True)
    except Exception as e:
        # fallback: write raw to ALSA pipe (Pi with aplay)
        try:
            import subprocess, tempfile
            with tempfile.NamedTemporaryFile(suffix='.raw') as f:
                anti.astype('<f4').tofile(f.name)
                subprocess.run(['aplay', '-f', 'FLOAT_LE', '-r', str(fs), '-c', '1', f.name], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            print(f'play failed: {e}')

def stream(server, fs, rate_hz):
    host, port = server.rsplit(':',1)
    s = socket.create_connection((host, int(port)))
    s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    print(f'connected to {server}')
    sample_index = 0
    interval = 1/rate_hz
    try:
        while True:
            start = time.time()
            ref, err, speaker, ir = fake_sensor()
            frame = pack_frame(ref, err, speaker, ir, sample_index)
            s.sendall(frame)
            # receive reply: [H 4][H*4]
            hdr = b''
            while len(hdr) < 4:
                chunk = s.recv(4 - len(hdr))
                if not chunk:
                    raise ConnectionError('server closed')
                hdr += chunk
            H = struct.unpack('>I', hdr)[0]
            payload = b''
            while len(payload) < H*4:
                chunk = s.recv(H*4 - len(payload))
                if not chunk:
                    raise ConnectionError('server closed')
                payload += chunk
            anti = np.frombuffer(payload, dtype='<f4').copy()
            play_anti(anti, fs=fs)
            if sample_index % (2048*20) == 0:
                print(f'got anti {H} samples, max {np.max(np.abs(anti)):.3f}')
            sample_index += len(ref)
            sleep = interval - (time.time() - start)
            if sleep > 0:
                time.sleep(sleep)
    finally:
        s.close()

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--server', default='192.168.10.1:5000')
    ap.add_argument('--fs', type=int, default=4000)
    ap.add_argument('--rate-hz', type=float, default=20)
    args = ap.parse_args()
    stream(args.server, args.fs, args.rate_hz)
