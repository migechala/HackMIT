#!/usr/bin/env python3
"""Pi raw TCP client — direct cable, no gRPC/Internet. Run on Pi."""
import argparse, time, socket, struct
import numpy as np
from threshold_ml.ingest.raw_protocol import pack_frame

def fake_sensor(L=2048, M=64):
    # Replace with real ALSA/DAQ reads: must return float32 C-contiguous
    # speaker history MUST be L+len(ir)-1
    t = time.time()
    ir = np.array([0,0,0.6], dtype=np.float32)  # measured secondary_ir[M]
    return (np.sin(np.arange(L)*0.1 + t).astype(np.float32),
            np.sin(np.arange(L)*0.1 + t + 0.2).astype(np.float32),
            np.zeros(L+len(ir)-1, dtype=np.float32),
            ir)

def stream(server, fs, rate_hz):
    host, port = server.rsplit(':',1)
    s = socket.create_connection((host, int(port)))
    print(f'connected to {server}')
    sample_index = 0
    interval = 1/rate_hz  # e.g. 20 Hz = every 50ms = H/fs
    try:
        while True:
            ref, err, speaker, ir = fake_sensor()
            frame = pack_frame(ref, err, speaker, ir, sample_index)
            s.sendall(frame)
            sample_index += len(ref)  # advance by L
            time.sleep(interval)
    finally:
        s.close()

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--server', default='192.168.10.1:5000')
    ap.add_argument('--fs', type=int, default=4000)
    ap.add_argument('--rate-hz', type=float, default=20, help='frames per second = fs/H')
    args = ap.parse_args()
    stream(args.server, args.fs, args.rate_hz)
