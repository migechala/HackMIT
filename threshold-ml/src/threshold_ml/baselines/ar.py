import numpy as np


def ar_predict(reference, H, order=16):
    """Ridge least-squares autoregression; chronological coefficients at rollout."""
    p = min(order, len(reference)//2)
    if p < 1:
        raise ValueError('Reference too short')
    X = np.lib.stride_tricks.sliding_window_view(reference, p)[:-1].astype(np.float64)
    y = reference[p:]
    coefficients = np.linalg.solve(X.T@X+1e-5*np.eye(p), X.T@y)
    history = list(reference[-p:])
    for _ in range(H):
        history.append(float(np.clip(np.dot(coefficients, history[-p:]), -2., 2.)))
    return np.asarray(history[p:], dtype=np.float32)
