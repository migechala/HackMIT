"""Deterministic synthetic scenes. Version 2: no full-scene normalization/leakage."""
from dataclasses import dataclass
from typing import List, Tuple
import hashlib
import numpy as np
from .paths import make_primary_ir, make_secondary_ir, apply_ir

DATASET_VERSION = 2


def stable_seed(key):
    return int.from_bytes(hashlib.sha256(str(key).encode()).digest()[:8], 'little')


@dataclass
class ToneSpec:
    freq: float
    amp: float
    phase: float = 0.
    drift_hz_per_s: float = 0.
    intermittency_prob: float = 0.


@dataclass
class SimConfig:
    fs: int = 4000
    duration_s: float = 5.
    n_tones: int = 1
    freq_range: Tuple[float, float] = (45., 300.)
    amp_range: Tuple[float, float] = (.3, 1.)
    snr_db_range: Tuple[float, float] = (10., 30.)
    drift_range: Tuple[float, float] = (-.5, .5)
    use_harmonics: bool = False
    harmonic_decay: float = .5
    broadband_noise_std: float = .05  # additional independent background at error location
    ref_noise_std: float = .02
    err_noise_std: float = .02
    secondary_delay_ms_range: Tuple[float, float] = (8., 18.)
    secondary_atten_range: Tuple[float, float] = (.4, .8)
    processing_delay_ms: float = 2.
    mild_nonlinear: bool = True
    transformer_hum_prob: float = .3
    intermittency_prob: float = 0.
    amplitude_modulation: float = 0.


@dataclass
class SceneConfig:
    tones: List[ToneSpec]
    primary_ir: np.ndarray
    secondary_ir: np.ndarray
    fs: int
    snr_db: float
    scene_id: str
    noise_seed: int


class AcousticSimulator:
    def __init__(self, cfg):
        if cfg.fs <= 0 or cfg.n_tones < 1 or cfg.duration_s <= 0:
            raise ValueError("Invalid simulation configuration")
        self.cfg = cfg

    def sample_scene(self, scene_id, rng):
        c = self.cfg
        tones = []
        for i in range(c.n_tones):
            hum = i == 0 and rng.random() < c.transformer_hum_prob
            f = float(rng.choice([50., 60.])) if hum else float(rng.uniform(*c.freq_range))
            drift = 0. if hum else float(rng.uniform(*c.drift_range))
            amp = float(rng.uniform(*c.amp_range))
            tones.append(ToneSpec(f, amp, float(rng.uniform(-np.pi, np.pi)), drift, c.intermittency_prob))
            if c.use_harmonics and 2*f < c.fs*.45:
                tones.append(ToneSpec(2*f, amp*c.harmonic_decay, float(rng.uniform(-np.pi, np.pi)), 2*drift))
        if any(t.freq+abs(t.drift_hz_per_s)*c.duration_s >= c.fs/2 for t in tones):
            raise ValueError("Tone exceeds Nyquist")
        primary = make_primary_ir(c.fs, rng.uniform(1, 5), rng=rng)
        secondary = make_secondary_ir(c.fs,
            c.processing_delay_ms+rng.uniform(*c.secondary_delay_ms_range),
            num_taps=48, attenuation=rng.uniform(*c.secondary_atten_range), rng=rng)
        return SceneConfig(tones, primary, secondary, c.fs,
                           float(rng.uniform(*c.snr_db_range)), scene_id,
                           int(rng.integers(0, 2**63)))

    def synthesize(self, scene, duration_s=None):
        c = self.cfg
        n = round(scene.fs*(c.duration_s if duration_s is None else duration_s))
        t = np.arange(n)/scene.fs
        rng = np.random.default_rng(scene.noise_seed)
        source = np.zeros(n)
        freqs = []
        for tone in scene.tones:
            phase = 2*np.pi*(tone.freq*t+.5*tone.drift_hz_per_s*t*t)+tone.phase
            amplitude = tone.amp*(1+c.amplitude_modulation*np.sin(2*np.pi*.2*t+tone.phase))
            gate = np.ones(n)
            if tone.intermittency_prob:
                # Per-second activity with soft 10 ms transitions.
                activity = rng.random(int(np.ceil(t[-1]))+2) >= tone.intermittency_prob
                gate = activity[np.floor(t).astype(int)].astype(float)
                gate = apply_ir(gate, np.ones(max(1, scene.fs//100))/(max(1, scene.fs//100)))
            source += amplitude*gate*np.sin(phase)
            freqs.append(tone.freq+tone.drift_hz_per_s*t)
        if c.mild_nonlinear:
            source = np.tanh(1.1*source)/1.1
        # Nominal SNR is relative to analytic tone power, independent of future samples.
        nominal_rms = np.sqrt(sum(t.amp**2/2 for t in scene.tones))
        noise = rng.normal(0, nominal_rms*10**(-scene.snr_db/20), n)
        reference = source+noise+rng.normal(0, c.ref_noise_std, n)
        disturbance = apply_ir(source+noise, scene.primary_ir)+rng.normal(0, c.broadband_noise_std, n)
        command = np.zeros(n, dtype=np.float32)  # milestone: muted calibration history
        contribution = apply_ir(command, scene.secondary_ir)
        residual = disturbance+contribution+rng.normal(0, c.err_noise_std, n)
        return dict(source=source.astype(np.float32), reference=reference.astype(np.float32),
                    disturbance=disturbance.astype(np.float32), speaker_command=command,
                    speaker_at_error=contribution, residual=residual.astype(np.float32),
                    secondary_ir=scene.secondary_ir, primary_ir=scene.primary_ir,
                    t=t, inst_freq=np.asarray(freqs), scene=scene)

    def generate_dataset_entries(self, num_scenes, seed=0):
        rng = np.random.default_rng(seed)
        for i in range(num_scenes):
            yield self.synthesize(self.sample_scene(f'scene_{seed}_{i}', rng))
