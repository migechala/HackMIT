import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

def plot_waveforms(reference: np.ndarray, dist_future: np.ndarray, pred_wave: np.ndarray, fs: int, save_path: str):
    plt.figure(figsize=(10,4))
    L = len(reference)
    H = len(dist_future)
    t_ref = np.arange(L)/fs
    t_fut = np.arange(L, L+H)/fs
    plt.plot(t_ref, reference, label="estimated disturbance (past)", alpha=0.7)
    plt.plot(t_fut, dist_future, label="true disturbance future", linewidth=2)
    plt.plot(t_fut, pred_wave, label="predicted", linestyle="--")
    plt.xlabel("time [s]"); plt.ylabel("amplitude"); plt.legend(); plt.tight_layout()
    plt.savefig(save_path, dpi=150); plt.close()

def plot_spectra(dist: np.ndarray, residual: np.ndarray, pred: np.ndarray, fs: int, save_path: str):
    plt.figure(figsize=(10,4))
    def mag(x):
        N=len(x)
        return np.abs(np.fft.rfft(x*np.hanning(N)))
    freqs = np.fft.rfftfreq(len(dist), 1/fs)
    plt.semilogy(freqs, mag(dist)+1e-6, label="disturbance")
    plt.semilogy(freqs, mag(residual)+1e-6, label="residual")
    plt.semilogy(freqs, mag(pred)+1e-6, label="pred", alpha=0.7, linestyle="--")
    plt.xlabel("freq [Hz]"); plt.ylabel("mag"); plt.legend(); plt.tight_layout()
    plt.savefig(save_path, dpi=150); plt.close()
