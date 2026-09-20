import numpy as np
from scipy.optimize import minimize_scalar


def sinusoid_regression_predict(reference, H, fs=4000, n_tones=1):
    """Single-tone variable projection: frequency search + linear quadrature fit."""
    if n_tones != 1:
        raise NotImplementedError('Joint multitone regression is not validated yet')
    n = len(reference)
    t = np.arange(n)/fs
    def fit(f):
        design = np.stack([np.sin(2*np.pi*f*t), np.cos(2*np.pi*f*t)], axis=1)
        coefficients = np.linalg.lstsq(design, reference, rcond=None)[0]
        return np.mean((design@coefficients-reference)**2), coefficients
    spectrum = abs(np.fft.rfft((reference-reference.mean())*np.hanning(n)))
    k = np.argmax(spectrum[1:])+1
    result = minimize_scalar(lambda f: fit(f)[0], bounds=(max(.1, (k-1)*fs/n),
                             min(fs/2-.1, (k+1)*fs/n)), method='bounded')
    f = result.x
    _, coefficients = fit(f)
    future = np.arange(n, n+H)/fs
    return np.clip(coefficients[0]*np.sin(2*np.pi*f*future)+coefficients[1]*np.cos(2*np.pi*f*future), -2, 2).astype(np.float32)
