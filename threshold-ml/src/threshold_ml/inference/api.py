"""Explicit synchronized-window inference, with retained secondary-path history."""
import numpy as np
import torch
from scipy.signal import lfilter
from ..training.trainer import get_device
from .control import bounded_control


class ThresholdInferenceAPI:
    def __init__(self, model, mean, std, fs=4000, H=200, device=None):
        if std <= 0:
            raise ValueError('Training normalization required')
        self.device = torch.device(device) if device else get_device()
        self.model = model.to(self.device).eval()
        self.mean, self.std, self.fs, self.H = mean, std, fs, H

    @torch.inference_mode()
    def predict(self, reference_audio, error_audio, speaker_output, secondary_ir, sample_index):
        """Audio windows end at sample_index. Return commands starting at index+1.

        error_audio and reference_audio: [L]. speaker_output: at least [L+M-1],
        ending at same cutoff, where M=len(secondary_ir). Include processing and
        buffering latency once in secondary_ir. Caller retains state across calls.
        Current training uses muted histories; nonzero-speaker operation is OOD.
        """
        reference, error, previous, h = [np.asarray(x, dtype=np.float32) for x in
                                        (reference_audio, error_audio, speaker_output, secondary_ir)]
        L = self.model.L_in
        if reference.shape != (L,) or error.shape != (L,) or h.ndim != 1 or not len(h):
            raise ValueError('Invalid synchronized window/FIR shapes')
        if previous.ndim != 1 or len(previous) < L+len(h)-1:
            raise ValueError('Speaker history insufficient to reconstruct secondary contribution')
        if not all(np.isfinite(x).all() for x in (reference, error, previous, h)):
            raise ValueError('Nonfinite signal input')
        if not isinstance(sample_index, (int, np.integer)):
            raise ValueError('Integer cutoff sample index required')
        past_contribution = lfilter(h, [1.], previous)[-L:]
        disturbance_history = error-past_contribution
        x = (np.stack([reference, disturbance_history])-self.mean)/self.std
        prediction = self.model(torch.tensor(x[None], dtype=torch.float32, device=self.device))
        known_future = lfilter(h, [1.], np.r_[previous, np.zeros(self.H)])[-self.H:]
        command, _ = bounded_control(prediction, torch.tensor(h[None], device=self.device),
                                     previous_contribution=torch.tensor(known_future[None], dtype=torch.float32, device=self.device))
        return dict(speaker_anti=command[0].cpu().numpy(),
                    pred_disturbance=prediction[0].cpu().numpy(),
                    command_start_index=int(sample_index)+1, sample_rate=self.fs)
