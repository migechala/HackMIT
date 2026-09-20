#!/usr/bin/env python3
"""GX10 raw TCP ingest — direct cable, no gRPC/Internet. Run on GX10."""
import argparse, struct, zlib, time
from pathlib import Path
import numpy as np
from threshold_ml.ingest.raw_protocol import HEADER_SIZE, unpack_header

def serve(bind, out, fs):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    import socket
    host, port = (bind.rsplit(':',1) if ':' in bind else (bind, '5000'))
    port = int(port)
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((host, port)); srv.listen(1)
    print(f'listening on {host}:{port} -> {out} (fs {fs})')
    conn, addr = srv.accept()
    print(f'connected {addr}')
    buf = b''
    last_index = None
    scene_path = out / time.strftime('%Y-%m-%d') / time.strftime('%H')
    scene_path.mkdir(parents=True, exist_ok=True)
    opened = None
    count = 0
    try:
        while True:
            while len(buf) < HEADER_SIZE:
                chunk = conn.recv(65536)
                if not chunk:
                    return
                buf += chunk
            hdr = unpack_header(buf[:HEADER_SIZE])
            total = HEADER_SIZE + (hdr['L']*2 + (hdr['L']+hdr['M']-1) + hdr['M'])*4
            while len(buf) < total:
                chunk = conn.recv(65536)
                if not chunk:
                    return
                buf += chunk
            frame, buf = buf[:total], buf[total:]
            payload = frame[HEADER_SIZE:]
            if zlib.crc32(payload) & 0xffffffff != hdr['crc']:
                print('crc mismatch, dropping frame')
                continue
            if last_index is not None and hdr['sample_index'] <= last_index:
                print(f'non-monotonic index {hdr["sample_index"]} <= {last_index}')
            last_index = hdr['sample_index']
            off = 0
            def take(n):
                nonlocal off
                arr = np.frombuffer(payload[off:off+n*4], dtype='<f4').copy()
                off += n*4
                return arr
            reference = take(hdr['L']); error = take(hdr['L']); speaker = take(hdr['L']+hdr['M']-1); secondary = take(hdr['M'])
            # Basic validation
            if not all(np.isfinite(a).all() for a in (reference, error, speaker, secondary)):
                print('nonfinite, dropping'); continue
            # Append to hourly npz scene
            if opened is None or count % 7200 == 0:  # new file every ~hour at 2 Hz
                name = scene_path / f'scene_{time.strftime("%H%M%S")}_{count}.npz'
                opened = name
            np.savez_compressed(opened, reference=reference, error=error, speaker=speaker, secondary_ir=secondary, sample_index=np.int64(hdr['sample_index']), fs=np.int32(fs))
            count += 1
            if count % 100 == 0:
                print(f'{count} frames, last index {hdr["sample_index"]}')
    finally:
        conn.close(); srv.close()

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--bind', default='192.168.10.1:5000')
    ap.add_argument('--out', default='data/real')
    ap.add_argument('--fs', type=int, default=4000)
    args = ap.parse_args()
    serve(args.bind, args.out, args.fs)
