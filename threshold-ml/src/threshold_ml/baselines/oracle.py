"""Privileged perfect-future forecast, NOT a perfect ANC controller."""
import numpy as np


def oracle_predict(disturbance_future, secondary_ir=None, fs=4000):
    """Evaluation-only upper-information baseline; includes future background noise.

    Must go through bounded_control and the TRUE causal FIR before any attenuation
    is reported. Does not imply the bounded finite-horizon solver is optimal.
    """
    return np.asarray(disturbance_future, dtype=np.float32).copy()
