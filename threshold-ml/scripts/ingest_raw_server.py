#!/usr/bin/env python3
"""GX10 raw TCP ingest + inference reply — direct cable/Wi-Fi, no gRPC."""
import argparse, struct, zlib, time, socket
from pathlib import Path
import numpy as np
import yaml, torch
from threshold_ml.ingest.raw_protocol import HEADER_SIZE, unpack_header
from threshold_ml.training.experiment import make_model
from threshold_ml.inference.api import ThresholdInferenceAPI

def load_api(cfg_path, ckpt_path):
    cfg = yaml.safe_load(Path(cfg_path).read_text())
    ckpt = torch.load(ckpt_path, map_location='cpu', weights_only=False)
    if ckpt.get('dataset_version') != 2:
        raise ValueError('legacy checkpoint')
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = make_model(cfg).to(device).eval()
    model.load_state_dict(ckpt['model_state'], strict=True)
    norm = ckpt['norm']
    mean, std = (norm if isinstance(norm, (list, tuple)) else (norm['mean'], norm['std'])) if isinstance(norm, dict) else norm
    # ckpt norm is (mean, std) tuple
    if isinstance(ckpt['norm'], (list, tuple)):
        mean, std = ckpt['norm']
    else:
        mean, std = ckpt['norm']['mean'], ckpt['norm']['std'] if isinstance(ckpt['norm'], dict) else ckpt['norm']
    H = cfg['H']; fs = cfg['fs']
    api = ThresholdInferenceAPI(model, float(mean), float(std), fs=fs, H=H, device=device)
    return api, H

def serve(bind, out, fs, cfg_path, ckpt_path):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    host, port = (bind.rsplit(':',1) if ':' in bind else (bind, '5000'))
    port = int(port)
    api, H = load_api(cfg_path, ckpt_path)
    print(f'loaded {ckpt_path} H={H}')
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((host, port)); srv.listen(1)
    print(f'listening on {host}:{port} -> {out} (fs {fs}) replying H={H} float32')
    conn, addr = srv.accept()
    print(f'connected {addr}')
    buf = b''
    last_index = None
    scene_path = out / time.strftime('%Y-%m-%d') / time.strftime('%H')
    scene_path.mkdir(parents=True, exist_ok=True)
    count = 0
    # low-latency
    conn.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
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
                continue
            if last_index is not None and hdr['sample_index'] <= last_index:
                print(f'non-monotonic {hdr["sample_index"]} <= {last_index}')
            last_index = hdr['sample_index']
            off = 0
            def take(n):
                nonlocal off
                a = np.frombuffer(payload[off:off+n*4], dtype='<f4').copy()
                off += n*4
                return a
            reference = take(hdr['L']); error = take(hdr['L']); speaker = take(hdr['L']+hdr['M']-1); secondary = take(hdr['M'])
            if not all(np.isfinite(a).all() for a in (reference, error, speaker, secondary)):
                continue
            # save
            name = scene_path / f'scene_{time.strftime("%H%M%S")}_{count}.npz'
            np.savez_compressed(name, reference=reference, error=error, speaker=speaker, secondary_ir=secondary, sample_index=np.int64(hdr['sample_index']), fs=np.int32(fs))
            count += 1
            # inference + reply (50 ms budget)
            try:
                result = api.predict(reference, error, speaker, secondary, int(hdr['sample_index']))
                anti = result['speaker_anti'].astype('<f4')
                # reply: [H 4][payload H*4]
                conn.sendall(struct.pack('>I', H) + anti.tobytes())
            except Exception as e:
                print(f'inference error: {e}')
                conn.sendall(struct.pack('>I', H) + np.zeros(H, dtype='<f4').tobytes())
            if count % 100 == 0:
                print(f'{count} frames, last index {hdr["sample_index"]}')
    finally:
        conn.close(); srv.close()

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--bind', default='0.0.0.0:5000')
    ap.add_argument('--out', default='data/real')
    ap.add_argument('--fs', type=int, default=4000)
    ap.add_argument('--config', default='configs/drift.yaml')
    ap.add_argument('--checkpoint', default='artifacts/checkpoints/drift2_h128/drift2_h128_best.pt')
    args = ap.parse_args()
    serve(args.bind, args.out, args.fs, args.config, args.checkpoint)
