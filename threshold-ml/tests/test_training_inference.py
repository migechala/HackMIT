"""CPU-only functional checks, not experiment training."""
import numpy as np
import torch
from torch.utils.data import DataLoader
from threshold_ml.models import TCNWaveformPredictor
from threshold_ml.datasets import SyntheticANCDataset, collate_fn
from threshold_ml.simulation import SimConfig
from threshold_ml.training.trainer import Trainer
from threshold_ml.losses import CompositeLoss


def test_checkpoint_roundtrip_and_single_optimizer_step(tmp_path):
    torch.manual_seed(42)
    torch.set_num_threads(1)
    ds = SyntheticANCDataset(1, SimConfig(duration_s=.3), 64, 32, 1)
    loader = DataLoader(ds, batch_size=1, collate_fn=collate_fn)
    config = {'test': True}
    def build():
        model = TCNWaveformPredictor(L_in=64, H=32, hidden=4, levels=1, in_channels=2)
        opt = torch.optim.AdamW(model.parameters())
        return Trainer(model, loader, loader, CompositeLoss(), opt,
                       torch.optim.lr_scheduler.ReduceLROnPlateau(opt), device='cpu',
                       ckpt_dir=tmp_path, config=config, norm=ds.get_stats())
    first = build()
    assert np.isfinite(first._epoch(loader, train=True))  # exactly one smoke-test update
    first.best_val = .25
    first._save(1, 'last')
    expected_rng = torch.rand(4)
    second = build()
    second.resume(tmp_path/'exp_last.pt')
    torch.testing.assert_close(torch.rand(4), expected_rng)
    assert second.start_epoch == 1 and second.best_val == .25
    for x, y in zip(first.model.parameters(), second.model.parameters()):
        torch.testing.assert_close(x, y)
    # Same dropout RNG gives the same next CPU step after resuming optimizer state.
    torch.manual_seed(123); first._epoch(loader, train=True)
    torch.manual_seed(123); second._epoch(loader, train=True)
    for x, y in zip(first.model.parameters(), second.model.parameters()):
        torch.testing.assert_close(x, y)


def test_inference_uses_shared_controller():
    from threshold_ml.inference.api import ThresholdInferenceAPI
    from threshold_ml.inference.control import bounded_control
    torch.manual_seed(0)
    model = TCNWaveformPredictor(L_in=64, H=32, hidden=4, levels=1, in_channels=2)
    api = ThresholdInferenceAPI(model, mean=0, std=1, H=32, device='cpu')
    ref = np.sin(np.arange(64)*.2).astype(np.float32)
    h = np.array([0., 0., .6], dtype=np.float32)
    result = api.predict(ref, ref, np.zeros(66), h, sample_index=100)
    with torch.no_grad():
        pred = model(torch.tensor(np.stack([ref, ref])[None]))
        u, _ = bounded_control(pred, torch.tensor(h[None]))
    np.testing.assert_allclose(result['speaker_anti'], u[0].numpy())
    assert result['command_start_index'] == 101
    assert np.max(abs(result['speaker_anti'])) <= 1


def test_metrics_do_not_hide_amplification():
    from threshold_ml.evaluation.metrics import compute_metrics
    d = (.2*np.sin(np.arange(64)*.3)).astype(np.float32)
    m = compute_metrics(d, -d, np.ones(1, dtype=np.float32))
    assert m['attenuation_db'] < -5
    assert m['amplification_db'] > 5
    assert m['rms_residual'] > m['rms_disturbance']


def test_evaluation_cli_untrained_smoke(tmp_path):
    import os, subprocess, sys
    from pathlib import Path
    import yaml
    from threshold_ml.training.experiment import make_model, make_dataset
    cfg = yaml.safe_load(Path('configs/single_tone.yaml').read_text())
    cfg.update(L_in=256, H=64)
    cfg['sim']['duration_s'] = .3
    cfg['dataset'].update(train_scenes=1, val_scenes=1, test_scenes=2, windows_per_scene=1)
    cfg['model'].update(hidden=4, levels=1)
    train = make_dataset(cfg, 'train')
    checkpoint = tmp_path/'untrained_smoke.pt'
    torch.save(dict(dataset_version=2, config=cfg, norm=train.get_stats(),
                    model_state=make_model(cfg).state_dict()), checkpoint)
    subprocess.run([sys.executable, 'scripts/evaluate.py', '--checkpoint', str(checkpoint),
                    '--device', 'cpu', '--output', str(tmp_path/'evaluation')],
                   check=True, capture_output=True,
                   env={**os.environ, 'OMP_NUM_THREADS': '1', 'MKL_NUM_THREADS': '1'})
    assert (tmp_path/'evaluation/summary.json').exists()
    assert (tmp_path/'evaluation/comparison.png').exists()


def test_scene_sampler_covers_all_windows():
    from threshold_ml.datasets.sampler import SceneWindowSampler
    ds = SyntheticANCDataset(3, SimConfig(duration_s=.3), 64, 32, 2)
    indices = list(SceneWindowSampler(ds))
    assert sorted(indices) == list(range(6))
    assert all(indices[i]//2 == indices[i+1]//2 for i in range(0, 6, 2))


def test_trimmed_tcn_matches_full_receptive_computation():
    model = TCNWaveformPredictor(L_in=512, H=32, hidden=4, levels=2, in_channels=2).eval()
    x = torch.randn(2, 2, 512)
    with torch.no_grad():
        full = torch.tanh(model.proj(model.tcn(x)[:, :, -1]))*model.scale.clamp(.5, 1.5)
        torch.testing.assert_close(full, model(x))
