import numpy as np


def fft_peak_predict(reference, H, fs=4000):
    """Hann FFT + interpolated peak, then least-squares sine/cosine phase fit."""
    n = len(reference)
    spectrum = abs(np.fft.rfft((reference-reference.mean())*np.hanning(n)))
    k = int(np.argmax(spectrum[1:]))+1
    delta = 0.
    if k < len(spectrum)-1:
        a, b, c = np.log(spectrum[k-1:k+2]+1e-12)
        delta = np.clip(.5*(a-c)/(a-2*b+c+1e-12), -.5, .5)
    f = (k+delta)*fs/n
    t = np.arange(n)/fs
    basis = np.stack([np.sin(2*np.pi*f*t), np.cos(2*np.pi*f*t)], axis=1)
    coeff = np.linalg.lstsq(basis, reference, rcond=None)[0]
    future = np.arange(n, n+H)/fs
    return np.clip(coeff[0]*np.sin(2*np.pi*f*future)+coeff[1]*np.cos(2*np.pi*f*future), -2, 2).astype(np.float32)
