#!/usr/bin/env python3
"""Scene-stratified finite-horizon evaluation. All dB values include true FIR."""
import argparse
import json
import time
from pathlib import Path
import numpy as np
import torch
from threshold_ml.training.experiment import make_model, make_dataset
from threshold_ml.training.trainer import get_device, synchronize
from threshold_ml.evaluation.metrics import compute_metrics
from threshold_ml.evaluation.plots import plot_waveforms, plot_spectra
from threshold_ml.baselines.persistence import periodic_persistence_predict
from threshold_ml.baselines.sinusoid import sinusoid_regression_predict
from threshold_ml.baselines.fft_tracker import fft_peak_predict
from threshold_ml.baselines.ar import ar_predict
from threshold_ml.inference.control import bounded_control


def summary(values):
    a = np.asarray(values)
    return dict(mean=float(a.mean()), median=float(np.median(a)),
                p10=float(np.percentile(a, 10)), p90=float(np.percentile(a, 90)),
                min=float(a.min()), max=float(a.max()))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkpoint', required=True, help='Trusted checkpoint from audited trainer')
    parser.add_argument('--device', choices=['cpu', 'cuda', 'mps'])
    parser.add_argument('--windows-per-scene', type=int, default=1)
    parser.add_argument('--output', default='artifacts/evaluation')
    args = parser.parse_args()
    checkpoint = torch.load(args.checkpoint, map_location='cpu', weights_only=False)
    if checkpoint.get('dataset_version') != 2:
        raise ValueError('Legacy checkpoint is scientifically invalid for this pipeline')
    cfg = checkpoint['config']; fs, H = cfg['fs'], cfg['H']
    ds = make_dataset(cfg, 'test', checkpoint['norm'])
    if not 1 <= args.windows_per_scene <= ds.windows_per_scene:
        raise ValueError('Invalid windows per scene')
    device = torch.device(args.device) if args.device else get_device()
    model = make_model(cfg).to(device).eval()
    model.load_state_dict(checkpoint['model_state'], strict=True)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=False)  # Never silently overwrite results.
    (output/'test_manifest.json').write_text(json.dumps(ds.manifest(), indent=2))
    rows, model_times, control_times = [], [], []
    with torch.inference_mode():
        sample = ds[0]
        x = sample['model_input'][None].to(device)
        h = sample['secondary_ir'][None].to(device)
        for _ in range(5):
            bounded_control(model(x), h)
        for _ in range(20):
            synchronize(device); start = time.perf_counter()
            prediction = model(x)
            synchronize(device); model_times.append((time.perf_counter()-start)*1000)
            start = time.perf_counter(); bounded_control(prediction, h)
            synchronize(device); control_times.append((time.perf_counter()-start)*1000)
        indices = [s*ds.windows_per_scene+w for s in range(len(ds.scenes))
                   for w in range(args.windows_per_scene)]
        for index in indices:
            item = ds[index]
            # All non-oracle predictors observe the same causal disturbance estimate.
            past = item['disturbance_past'].numpy()
            target, h = [item[k].numpy() for k in ('disturbance_future', 'secondary_ir')]
            prediction = model(item['model_input'][None].to(device))[0].cpu().numpy()
            predictions = dict(ml=prediction, no_control=np.zeros(H, dtype=np.float32),
                               persistence=periodic_persistence_predict(past, H, fs),
                               sinusoid=sinusoid_regression_predict(past, H, fs),
                               fft=fft_peak_predict(past, H, fs), ar=ar_predict(past, H),
                               perfect_forecast=target)
            for name, pred in predictions.items():
                metrics = compute_metrics(target, pred, h, fs)
                rows.append(dict(scene_id=item['scene_id'], sample_index=item['sample_index'],
                                 method=name, **{k: v for k, v in metrics.items() if np.isscalar(v)}))
                if name == 'ml' and index//ds.windows_per_scene < 3:
                    plot_waveforms(past, target, pred, fs, output/f'waveform_{index}.png')
                    plot_spectra(target, metrics['residual'], pred, fs, output/f'spectrum_{index}.png')
    report = {}
    for name in predictions:
        records = [r for r in rows if r['method'] == name]
        numeric = [k for k in records[0] if k not in ('scene_id', 'sample_index', 'method')]
        report[name] = {key: summary([r[key] for r in records]) for key in numeric}
        report[name]['amplification_count'] = sum(r['attenuation_db'] < -1e-6 for r in records)
        report[name]['worst_cases'] = sorted(records, key=lambda r: r['attenuation_db'])[:5]
        print(name, report[name]['attenuation_db'])
    report['runtime'] = dict(model_ms=summary(model_times), controller_ms=summary(control_times),
                            real_time_factor=(np.mean(model_times)+np.mean(control_times))/(1000*H/fs),
                            parameters=sum(p.numel() for p in model.parameters()), device=str(device))
    (output/'summary.json').write_text(json.dumps(report, indent=2))
    (output/'per_window.json').write_text(json.dumps(rows, indent=2))
    import matplotlib.pyplot as plt
    names = list(predictions)
    plt.boxplot([[r['attenuation_db'] for r in rows if r['method'] == n] for n in names])
    plt.xticks(range(1, len(names)+1), names, rotation=30)
    plt.axhline(0, color='red'); plt.ylabel('Simulated physical attenuation [dB]')
    plt.tight_layout(); plt.savefig(output/'comparison.png'); plt.close()


if __name__ == '__main__':
    main()
