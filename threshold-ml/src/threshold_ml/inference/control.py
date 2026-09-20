"""Shared finite-horizon bounded controller. No acausal output alignment.

At cutoff t, predict disturbance at t+1..t+H. Commands start at t+1;
processing/buffering delay must be included ONCE in the supplied causal FIR.
Zero command history is assumed for isolated evaluation windows. Early samples
before the FIR onset cannot be cancelled. Streaming callers must supply the
known contribution of previous commands, and preserve convolution state.
"""
import torch
import torch.nn.functional as F


def path_matrix(ir, horizon):
    """Batched causal convolution matrices [B,H,H]."""
    if ir.ndim != 2 or ir.shape[1] == 0:
        raise ValueError("Expected nonempty [batch, FIR length]")
    n = torch.arange(horizon, device=ir.device)
    lag = n[:, None] - n[None, :]
    valid = (lag >= 0) & (lag < ir.shape[1])
    return ir[:, lag.clamp(0, ir.shape[1]-1)] * valid


def bounded_control(prediction, ir, limit=1.0, regularization=0.01, steps=32,
                    previous_contribution=None):
    """Projected gradient solution of ||d+S u||² + reg ||u||².

    Uses only predicted future disturbance and estimated FIR; never true future
    targets. Conservative step size from the FIR l1 bound avoids unstable updates.
    Float32 solver is shared by training, inference, and evaluation.
    """
    if limit <= 0 or regularization <= 0 or steps < 1:
        raise ValueError("Positive bounds, regularization and iterations required")
    with torch.autocast(device_type=prediction.device.type, enabled=False):
        d, h = prediction.float(), ir.float()
        S = path_matrix(h, d.shape[-1])
        target = d if previous_contribution is None else d + previous_contribution.float()
        step = 1 / (h.abs().sum(-1).square() + regularization)
        u = torch.zeros_like(d)
        for _ in range(steps):
            residual = torch.bmm(S, u.unsqueeze(-1)).squeeze(-1) + target
            grad = torch.bmm(S.transpose(1, 2), residual.unsqueeze(-1)).squeeze(-1)
            u = (u - step[:, None] * (grad + regularization * u)).clamp(-limit, limit)
        y = torch.bmm(S, u.unsqueeze(-1)).squeeze(-1)
        return u, y


def causal_filter(command, ir):
    """Batched true linear convolution truncated at command horizon."""
    b, horizon = command.shape
    return F.conv1d(command.unsqueeze(0), ir.flip(-1).unsqueeze(1),
                    padding=ir.shape[-1]-1, groups=b)[0, :, :horizon]
