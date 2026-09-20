"""Causal FIR paths: delay + coloration + a signed early reflection."""
import numpy as np
from scipy.signal import firwin, lfilter


def make_primary_ir(fs, delay_ms=2., num_taps=32, rng=None, drift=0.):
    rng = np.random.default_rng(0) if rng is None else rng
    if fs <= 0 or delay_ms < 0:
        raise ValueError("Invalid sample rate or delay")
    delay = round(delay_ms*fs/1000)
    b = firwin(9, cutoff=.4*fs, fs=fs)
    reflection = int(rng.integers(4, 12))
    h = np.zeros(delay+max(num_taps, reflection+len(b)))
    h[delay:delay+len(b)] = b*.9
    h[delay+reflection:delay+reflection+len(b)] += b*rng.uniform(-.25, .25)
    return (h*(1+drift)).astype(np.float32)


def make_secondary_ir(fs, delay_ms=10., num_taps=64, cutoff_low=40.,
                      cutoff_high=900., rng=None, attenuation=.6, reflection_gain=.2):
    rng = np.random.default_rng(0) if rng is None else rng
    if fs <= 0 or delay_ms < 0 or num_taps < 3:
        raise ValueError("Invalid FIR configuration")
    delay = round(delay_ms*fs/1000)
    low = np.clip(rng.normal(cutoff_low, 15), .005*fs, .10*fs)
    high = np.clip(rng.normal(cutoff_high, 80), .15*fs, .45*fs)
    b = firwin(num_taps, [low, high], pass_zero=False, fs=fs)
    reflection = int(rng.integers(8, 24))
    h = np.zeros(delay+reflection+num_taps)
    # Preserve interpretable passband gain; do NOT normalize by impulse peak.
    h[delay:delay+num_taps] = b*attenuation*rng.uniform(.7, 1.)
    h[delay+reflection:delay+reflection+num_taps] += b*reflection_gain*rng.uniform(-.6, .6)
    return h.astype(np.float32)


def apply_ir(signal, ir):
    return lfilter(ir, [1.], signal).astype(np.float32)
