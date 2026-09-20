import numpy as np
import torch
import pytest
from scipy.signal import lfilter
from threshold_ml.simulation import AcousticSimulator, SimConfig
from threshold_ml.simulation.paths import make_secondary_ir
from threshold_ml.datasets import SyntheticANCDataset, collate_fn
from threshold_ml.inference.control import bounded_control, causal_filter, path_matrix


def test_paths_do_not_truncate_delays():
    h = make_secondary_ir(8000, delay_ms=80)
    assert len(h) > 640+64
    assert np.count_nonzero(h[:640]) == 0


def test_generator():
    sim = AcousticSimulator(SimConfig(duration_s=1.))
    scene = sim.sample_scene('test', np.random.default_rng(42))
    first, second = sim.synthesize(scene), sim.synthesize(scene)
    for key in ('reference', 'disturbance', 'residual'):
        np.testing.assert_array_equal(first[key], second[key])
        assert first[key].shape == (4000,)
    assert 'speaker_command' in first


def test_snr_changes_noise():
    cfg = SimConfig(duration_s=1., ref_noise_std=0, mild_nonlinear=False)
    sim = AcousticSimulator(cfg)
    scene = sim.sample_scene('snr', np.random.default_rng(42))
    scene.snr_db = 10
    a = sim.synthesize(scene)
    scene.snr_db = 30
    b = sim.synthesize(scene)
    ratio = np.std(a['reference']-a['source'])/np.std(b['reference']-b['source'])
    assert ratio == pytest.approx(10., rel=.001)


def test_dataset_splits_and_normalization():
    cfg = SimConfig(duration_s=1.)
    ds = SyntheticANCDataset(2, cfg, 256, 64, 2, seed=0)
    val = SyntheticANCDataset(2, cfg, 256, 64, 2, seed=0, split='val', mean_std=ds.get_stats())
    assert set(s.scene_id for s in ds.scenes).isdisjoint(s.scene_id for s in val.scenes)
    assert ds.scenes[0].tones != val.scenes[0].tones
    assert val.get_stats() == ds.get_stats()
    assert ds[0]['model_input'].shape == (2, 256)
    assert collate_fn([ds[0], ds[2]])['secondary_ir'].shape[0] == 2
    with pytest.raises(ValueError):
        SyntheticANCDataset(1, cfg, 256, 64, split='test')


def test_dataset_spawn_pickle():
    import pickle
    ds = SyntheticANCDataset(1, SimConfig(duration_s=1.), 256, 64, 1)
    other = pickle.loads(pickle.dumps(ds))
    torch.testing.assert_close(ds[0]['model_input'], other[0]['model_input'])


def test_no_future_dependent_normalization_in_simulator():
    sim = AcousticSimulator(SimConfig(duration_s=1., mild_nonlinear=False, ref_noise_std=0))
    scene = sim.sample_scene('prefix', np.random.default_rng(0))
    short = sim.synthesize(scene, .5)
    long = sim.synthesize(scene, 1.)
    # Source/reference noise prefix is independent of future waveform extrema.
    np.testing.assert_allclose(short['source'], long['source'][:2000])
    np.testing.assert_allclose(short['reference'], long['reference'][:2000])


def test_stable_seed_across_processes():
    import subprocess, sys, os
    code = 'from threshold_ml.simulation.generator import stable_seed; print(stable_seed("scene"))'
    values = [subprocess.check_output([sys.executable, '-c', code], env={**os.environ, 'PYTHONHASHSEED': str(i)}) for i in (1, 2)]
    assert values[0] == values[1]


def test_causal_convolution_matches_scipy():
    torch.manual_seed(0)
    command, ir = torch.randn(2, 20), torch.randn(2, 31)
    filtered = causal_filter(command, ir)
    matrix_result = torch.bmm(path_matrix(ir, 20), command.unsqueeze(-1)).squeeze(-1)
    torch.testing.assert_close(filtered, matrix_result)
    for i in range(2):
        np.testing.assert_allclose(filtered[i], lfilter(ir[i], [1], command[i]), atol=3e-6)


def test_identity_control_and_bound():
    d = torch.ones(1, 64)*.2
    u, y = bounded_control(d, torch.ones(1, 1))
    assert torch.max(torch.abs(u)) <= 1
    assert (d+y).square().mean() < d.square().mean()/100
    u, _ = bounded_control(d*100, torch.ones(1, 1))
    assert torch.max(torch.abs(u)) <= 1


def test_delayed_oracle_cannot_cancel_before_arrival():
    d = torch.ones(1, 64)*.2
    h = torch.zeros(1, 20); h[0, 10] = 1.
    u, y = bounded_control(d, h)
    torch.testing.assert_close(y[:, :10], torch.zeros(1, 10))
    assert (d+y).square().mean() >= d.square().mean()*10/64
    # Prediction does not justify shifting the physical speaker response backwards.
    from threshold_ml.evaluation.metrics import compute_metrics
    long_delay = np.r_[np.zeros(80), 1.].astype(np.float32)
    m = compute_metrics(d[0].numpy(), d[0].numpy(), long_delay)
    assert abs(m['attenuation_db']) < 1e-6


def test_short_horizon_spectral_loss_and_gradient():
    from threshold_ml.losses.composite import CompositeLoss, multi_res_stft_loss
    prediction = torch.randn(2, 64, requires_grad=True)
    target = torch.randn(2, 64)
    ir = torch.tensor([[0., 0., .8], [0., .6, .1]])
    assert multi_res_stft_loss(prediction, target) > 0
    loss, metrics = CompositeLoss()(prediction, target, ir)
    loss.backward()
    assert torch.isfinite(prediction.grad).all()
    with torch.no_grad():
        _, y = bounded_control(prediction, ir)
    assert metrics['residual'] == pytest.approx((target+y).square().mean().item())


def test_models_cpu_forward_backward():
    from threshold_ml.models import TCNWaveformPredictor, GRUWaveformPredictor
    torch.set_num_threads(1)
    for cls in (TCNWaveformPredictor, GRUWaveformPredictor):
        model = cls(L_in=64, H=32, hidden=8, in_channels=2)
        result = model(torch.randn(2, 2, 64))
        assert result.shape == (2, 32)
        result.square().mean().backward()
        assert all(torch.isfinite(p.grad).all() for p in model.parameters() if p.grad is not None)


def test_baseline_frequency_amplitude_phase():
    from threshold_ml.baselines import ar_predict, sinusoid_regression_predict, fft_peak_predict
    fs = 4000
    x = .4*np.sin(2*np.pi*123.4*np.arange(2304)/fs+.7)
    for predict in (ar_predict, sinusoid_regression_predict, fft_peak_predict):
        y = predict(x[:2048], 256)
        assert np.mean((y-x[2048:])**2) < .002


def test_fxlms_is_adaptive_and_causal():
    from threshold_ml.baselines import FxLMS
    x = .2*np.sin(np.arange(4000)*.13)
    model = FxLMS(n_taps=8, mu=.03)
    u, error = model.run(x, x, np.array([1.]))
    assert np.mean(error[-500:]**2) < np.mean(x[-500:]**2)*.01
    assert np.max(abs(u)) <= 1
    changed = x.copy(); changed[2000:] *= -1
    _, second = FxLMS(n_taps=8, mu=.03).run(x, changed, np.array([1.]))
    np.testing.assert_array_equal(error[:2000], second[:2000])


def test_unfinished_hybrid_is_not_silently_used():
    from threshold_ml.models import HybridFxLMSPredictor
    with pytest.raises(NotImplementedError):
        HybridFxLMSPredictor()
