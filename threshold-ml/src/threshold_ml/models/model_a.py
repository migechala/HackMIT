"""UNVALIDATED Model A prototype, excluded from audited experiment factory.

Missing path-conditioned tone labels and permutation-invariant supervision.
Do not use as evidence of a functioning parameter predictor.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class ParameterPredictor(nn.Module):
    def __init__(self, L_in: int = 2048, n_tones_max: int = 3, fs: int = 4000, hidden: int = 128):
        super().__init__()
        self.L_in = L_in
        self.n_tones_max = n_tones_max
        self.fs = fs
        # 1D CNN encoder causal-ish
        self.encoder = nn.Sequential(
            nn.Conv1d(1, 32, 15, stride=2, padding=7), nn.ReLU(), nn.BatchNorm1d(32),
            nn.Conv1d(32, 64, 15, stride=2, padding=7), nn.ReLU(), nn.BatchNorm1d(64),
            nn.Conv1d(64, 128, 11, stride=2, padding=5), nn.ReLU(), nn.BatchNorm1d(128),
            nn.Conv1d(128, 128, 11, stride=2, padding=5), nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.fc = nn.Sequential(
            nn.Linear(128, hidden), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(hidden, hidden), nn.ReLU(),
        )
        # For each tone: freq (logit -> freq), amp, phase sin/cos, confidence
        self.out_freq = nn.Linear(hidden, n_tones_max)
        self.out_amp = nn.Linear(hidden, n_tones_max)
        self.out_phase_sin = nn.Linear(hidden, n_tones_max)
        self.out_phase_cos = nn.Linear(hidden, n_tones_max)
        self.out_conf = nn.Linear(hidden, n_tones_max)

    def forward(self, reference: torch.Tensor):
        # reference [B, L_in]
        x = reference.unsqueeze(1)  # [B,1,L]
        h = self.encoder(x).squeeze(-1)  # [B,128]
        h = self.fc(h)  # [B,hidden]
        # freq in [20, 600] -> apply sigmoid scaling
        freq_raw = torch.sigmoid(self.out_freq(h))  # [0,1]
        freq = 20 + freq_raw * 580  # 20..600
        amp = F.softplus(self.out_amp(h))  # positive
        amp = torch.clamp(amp, 0, 2.0)
        sin = self.out_phase_sin(h)
        cos = self.out_phase_cos(h)
        phase = torch.atan2(sin, cos)  # [-pi,pi]
        conf = torch.sigmoid(self.out_conf(h))  # [0,1]
        return dict(freq=freq, amp=amp, phase=phase, conf=conf)

    def reconstruct_waveform(self, params: dict, H: int, fs: int = None):
        fs = fs or self.fs
        B = params["freq"].shape[0]
        K = self.n_tones_max
        device = params["freq"].device
        t_future = torch.arange(H, device=device).float() / fs  # [H] relative to future start offset 0?
        # Need phase at future start time = phase predicted at playback time.
        # We predict phase at t = L_in/fs (i.e., now). Future evolves as 2π f * tau + phase
        t_grid = t_future.unsqueeze(0).unsqueeze(0).expand(B, K, H)  # [B,K,H]
        freq = params["freq"].unsqueeze(-1)  # [B,K,1]
        amp = params["amp"].unsqueeze(-1)
        phase = params["phase"].unsqueeze(-1)
        conf = params["conf"].unsqueeze(-1)
        wave_components = amp * torch.sin(2*math.pi*freq*t_grid + phase) * conf
        wave = wave_components.sum(dim=1)  # [B,H]
        # bound
        wave = torch.tanh(wave) * 1.2
        return wave

    def loss(self, params: dict, target_tones, target_wave: torch.Tensor, H: int):
        raise NotImplementedError('Permutation-invariant parameter supervision is not implemented')
