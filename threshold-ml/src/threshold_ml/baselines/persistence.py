import numpy as np
import torch

def persistence_predict(reference: torch.Tensor, H: int) -> torch.Tensor:
    """Repeat last value (naive) or last cycle if periodic? Simple: repeat last sample."""
    last = reference[:, -1:]  # [B,1]
    return last.repeat(1, H)

def periodic_persistence_predict(reference: np.ndarray, H: int, fs: int = 4000) -> np.ndarray:
    """Better baseline: estimate period via autocorrelation and repeat."""
    # use FFT to estimate dominant period
    n = len(reference)
    corr = np.correlate(reference - reference.mean(), reference - reference.mean(), mode='full')[n-1:]
    # find peak not at 0
    # search for max in 30..500 Hz range
    min_lag = max(1, int(fs/500))
    max_lag = int(fs/30)
    max_lag = min(max_lag, len(corr)-1)
    peak_lag = int(np.argmax(corr[min_lag:max_lag]) + min_lag)
    period = peak_lag
    # tile last period
    last_period = reference[-period:]
    reps = int(np.ceil(H / period))
    tiled = np.tile(last_period, reps)[:H]
    return tiled.astype(np.float32)
