import numpy as np
from scipy.signal import lfilter


class LMS:
    def __init__(self, n_taps=32, mu=.01):
        self.n_taps, self.mu = n_taps, mu

    def predict(self, reference, H):
        w = np.zeros(self.n_taps)
        for n in range(self.n_taps, len(reference)):
            x = reference[n-self.n_taps:n][::-1]
            w += self.mu*(reference[n]-w@x)*x/(1e-6+x@x)
        history = list(reference[-self.n_taps:])
        for _ in range(H):
            history.append(float(np.clip(w@np.asarray(history[-self.n_taps:][::-1]), -2, 2)))
        return np.asarray(history[self.n_taps:], dtype=np.float32)


class FxLMS:
    """Sequential normalized filtered-x LMS simulation, NOT a future predictor.

    True secondary path forms current residual; estimated path filters reference.
    Update uses current residual only, never future disturbance. Bounded weights
    and commands are safeguards, not a proof of closed-loop stability.
    """
    def __init__(self, n_taps=32, mu=.001, limit=1., coefficient_limit=2.):
        self.n_taps, self.mu = n_taps, mu
        self.limit, self.coefficient_limit = limit, coefficient_limit
        self.w = np.zeros(n_taps)

    def run(self, reference, disturbance, secondary_ir, estimated_ir=None):
        h = np.asarray(secondary_ir)
        estimate = h if estimated_ir is None else np.asarray(estimated_ir)
        xfiltered = lfilter(estimate, [1.], reference)
        xp = np.pad(reference, (self.n_taps-1, 0))
        fp = np.pad(xfiltered, (self.n_taps-1, 0))
        commands = np.zeros(len(reference)); error = np.zeros(len(reference))
        for n in range(len(reference)):
            x = xp[n:n+self.n_taps][::-1]
            fx = fp[n:n+self.n_taps][::-1]
            unconstrained = self.w@x
            commands[n] = np.clip(unconstrained, -self.limit, self.limit)
            k = min(n+1, len(h))
            error[n] = disturbance[n]+h[:k]@commands[n-k+1:n+1][::-1]
            if abs(unconstrained) < self.limit:
                self.w -= self.mu*error[n]*fx/(1e-4+fx@fx)
                self.w = np.clip(self.w, -self.coefficient_limit, self.coefficient_limit)
        return commands, error
