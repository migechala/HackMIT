"""Float32 phase-sensitive spectral and physical residual objective."""
import torch
from torch import nn
import torch.nn.functional as F
from ..inference.control import bounded_control


def multi_res_stft_loss(pred, target, fs=None):
    terms = []
    for size in (16, 32, 64, 128, 256):
        if size > pred.shape[-1]:
            continue
        window = torch.hann_window(size, device=pred.device)
        p = torch.stft(pred, size, hop_length=size//4, window=window,
                       center=False, return_complex=True)
        t = torch.stft(target, size, hop_length=size//4, window=window,
                       center=False, return_complex=True)
        # Complex difference explicitly penalizes incorrect phase.
        terms.append((p-t).abs().mean()/size**0.5 +
                     F.l1_loss(torch.log1p(p.abs()), torch.log1p(t.abs())))
    return torch.stack(terms).mean() if terms else pred.sum()*0


class CompositeLoss(nn.Module):
    def __init__(self, w_td=1., w_stft=.3, w_residual=1., w_energy=.01,
                 w_clip=.3, w_smooth=.001, s_max=1.):
        super().__init__()
        self.weights = dict(td=w_td, stft=w_stft, residual=w_residual,
                            energy=w_energy, clip=w_clip, smooth=w_smooth)
        self.s_max = s_max

    def forward(self, pred_wave, target_wave, secondary_ir=None, **kwargs):
        if secondary_ir is None:
            raise ValueError("Physical residual loss requires secondary FIR")
        with torch.autocast(device_type=pred_wave.device.type, enabled=False):
            pred, target = pred_wave.float(), target_wave.float()
            u, y = bounded_control(pred, secondary_ir, limit=self.s_max)
            terms = dict(td=F.mse_loss(pred, target),
                         stft=multi_res_stft_loss(pred, target),
                         residual=(target+y).square().mean(),
                         energy=u.square().mean(),
                         # Penalize near saturation, not an impossible post-clamp overflow.
                         clip=F.relu(u.abs()-.95*self.s_max).square().mean(),
                         smooth=(u[:, 1:]-u[:, :-1]).square().mean())
            total = sum(self.weights[k]*v for k, v in terms.items())
        return total, {**{k: v.detach().item() for k, v in terms.items()},
                       "total": total.detach().item()}
