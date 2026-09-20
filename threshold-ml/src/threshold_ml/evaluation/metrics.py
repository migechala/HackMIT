"""Metrics ALWAYS use the bounded command through the true secondary FIR."""
import numpy as np
import torch
from scipy.signal import lfilter
from ..inference.control import bounded_control


def attenuation_db(disturbance, residual):
    rms_d = np.sqrt(np.mean(disturbance**2) + 1e-12)
    rms_e = np.sqrt(np.mean(residual**2) + 1e-12)
    return 20*np.log10(rms_d/rms_e), rms_d, rms_e


def compute_metrics(dist_true, pred_wave, secondary_ir, fs=4000, estimated_ir=None):
    h = secondary_ir if estimated_ir is None else estimated_ir
    with torch.no_grad():
        command, _ = bounded_control(torch.tensor(pred_wave[None], dtype=torch.float32),
                                     torch.tensor(h[None], dtype=torch.float32))
    u = command[0].numpy()
    y = lfilter(secondary_ir, [1.], u)[:len(dist_true)]
    residual = dist_true + y
    attenuation, rms_d, rms_e = attenuation_db(dist_true, residual)
    n = len(dist_true)
    window = np.hanning(n)
    D, P, E = [np.fft.rfft(x*window) for x in (dist_true, pred_wave, residual)]
    peak, peak_p = [int(np.argmax(np.abs(s[1:])))+1 for s in (D, P)]
    freqs = np.fft.rfftfreq(n, 1/fs)
    # These are bin-based diagnostics, not ground-truth parameter estimates.
    phase_error = abs(np.angle(P[peak]*D[peak].conjugate()))
    amp_error = abs(abs(P[peak])-abs(D[peak]))*2/window.sum()
    return dict(mse=float(np.mean((pred_wave-dist_true)**2)),
                mae=float(np.mean(np.abs(pred_wave-dist_true))),
                rms_disturbance=float(rms_d), rms_residual=float(rms_e),
                attenuation_db=float(attenuation), amplification_db=float(max(0, -attenuation)),
                freq_err_hz=float(abs(freqs[peak_p]-freqs[peak])),
                amp_err=float(amp_error), circular_phase_error_rad=float(phase_error),
                broadband_residual_power=float(np.mean(residual**2)),
                targeted_bin_power=float(abs(E[peak])**2/window.sum()**2),
                clip_rate=float(np.mean(np.abs(u)>=.999)), output_energy=float(np.mean(u**2)),
                f_true_peak=float(freqs[peak]), f_pred_peak=float(freqs[peak_p]),
                residual=residual, y=y, speaker_command=u)
