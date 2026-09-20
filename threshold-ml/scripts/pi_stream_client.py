#!/usr/bin/env python3
"""Pi raw TCP client — send + receive anti-noise, direct cable/Wi-Fi."""
import argparse, time, socket, struct
import numpy as np
import sounddevice as sd
from threshold_ml.ingest.raw_protocol import pack_frame

def fake_sensor(L=2048, M=3):
    t = time.time()
    ir = np.array([0,0,0.6], dtype=np.float32)
    ref = np.sin(np.arange(L)*0.1 + t).astype(np.float32)
    err = np.sin(np.arange(L)*0.1 + t + 0.2).astype(np.float32)
    speaker = np.zeros(L+len(ir)-1, dtype=np.float32)
    return ref, err, speaker, ir

def play_anti(anti, fs=4000, device=None):
    if device is None:
        for i,d in enumerate(sd.query_devices()):
            if 'UAC' in d['name'] or 'USB' in d['name']:
                device=i; break
        else:
            device=None
    info = sd.query_devices(device) if device is not None else sd.query_devices(kind='output')
    dev_fs = int(info['default_samplerate']) or 48000
    # resample 4000 -> device rate (USB DACs reject 4000 Hz)
    if dev_fs != fs:
        from scipy.signal import resample_poly
        # 4000 -> 48000 is 12x
        anti = resample_poly(anti, dev_fs, fs).astype(np.float32)
        fs = dev_fs
    max_ch = int(info['max_output_channels'])
    anti = np.asarray(anti, dtype=np.float32).reshape(-1, 1)
    if max_ch == 2:
        anti = np.repeat(anti, 2, axis=1)  # mono -> stereo for HDMI/USB that rejects mono
    elif max_ch > 2:
        anti = np.tile(anti, (1, max_ch))
    sd.play(anti, samplerate=fs, blocking=True, device=device)

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
            play_anti(anti, fs=fs, device=args.device)
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
    ap.add_argument('--device', type=int, default=None, help='PortAudio index (auto-detects UACDemo); use "aplay -l" card for fallback')
    ap.add_argument('--rate-hz', type=float, default=20)
    args = ap.parse_args()
    stream(args.server, args.fs, args.rate_hz)
