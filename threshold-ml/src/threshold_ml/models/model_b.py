"""Model B: direct waveform predictor - TCN and GRU."""
import torch
import torch.nn as nn
import torch.nn.functional as F

class Chomp1d(nn.Module):
    def __init__(self, chomp):
        super().__init__()
        self.chomp = chomp
    def forward(self, x):
        return x[:, :, :-self.chomp].contiguous() if self.chomp else x

class TemporalBlock(nn.Module):
    def __init__(self, n_inputs, n_outputs, kernel_size, stride, dilation, padding, dropout=0.1):
        super().__init__()
        self.conv1 = nn.utils.parametrizations.weight_norm(nn.Conv1d(n_inputs, n_outputs, kernel_size, stride=stride, padding=padding, dilation=dilation))
        self.chomp1 = Chomp1d(padding)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(dropout)
        self.conv2 = nn.utils.parametrizations.weight_norm(nn.Conv1d(n_outputs, n_outputs, kernel_size, stride=stride, padding=padding, dilation=dilation))
        self.chomp2 = Chomp1d(padding)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(dropout)
        self.downsample = nn.Conv1d(n_inputs, n_outputs, 1) if n_inputs != n_outputs else None
        self.relu = nn.ReLU()
    def forward(self, x):
        out = self.conv1(x)
        out = self.chomp1(out)
        out = self.relu1(out)
        out = self.dropout1(out)
        out = self.conv2(out)
        out = self.chomp2(out)
        out = self.relu2(out)
        out = self.dropout2(out)
        res = x if self.downsample is None else self.downsample(x)
        return self.relu(out + res)

class TCNWaveformPredictor(nn.Module):
    def __init__(self, L_in: int = 2048, H: int = 200, hidden: int = 64, levels: int = 4, kernel_size: int = 5, dropout: float = 0.1, fs: int = 4000, in_channels: int = 1):
        super().__init__()
        self.L_in = L_in
        self.H = H
        self.fs = fs
        layers = []
        num_channels = [hidden] * levels
        for i in range(levels):
            dilation = 2 ** i
            in_ch = in_channels if i==0 else num_channels[i-1]
            out_ch = num_channels[i]
            padding = (kernel_size - 1) * dilation
            layers += [TemporalBlock(in_ch, out_ch, kernel_size, stride=1, dilation=dilation, padding=padding, dropout=dropout)]
        self.tcn = nn.Sequential(*layers)
        self.receptive_field = 1 + 2*(kernel_size-1)*(2**levels-1)
        self.proj = nn.Sequential(
            nn.Linear(hidden, hidden), nn.ReLU(),
            nn.Linear(hidden, H)
        )
        self.scale = nn.Parameter(torch.tensor(1.0))

    def forward(self, reference: torch.Tensor):
        # reference [B, L_in]
        x = reference.unsqueeze(1) if reference.ndim == 2 else reference
        # Earlier samples cannot affect the last TCN step: avoid wasted convolutions.
        x = x[:, :, -self.receptive_field:]
        y = self.tcn(x)  # [B,hidden,L], last step sees only receptive_field samples
        pooled = y[:, :, -1]  # [B,hidden] use last step (phase-preserving)
        wave = self.proj(pooled)  # [B,H]
        wave = torch.tanh(wave) * self.scale.clamp(0.5, 1.5)
        return wave

class GRUWaveformPredictor(nn.Module):
    def __init__(self, L_in: int = 2048, H: int = 200, hidden: int = 64, num_layers: int = 2, fs: int = 4000, in_channels: int = 1):
        super().__init__()
        self.L_in = L_in
        self.H = H
        self.gru = nn.GRU(input_size=in_channels, hidden_size=hidden, num_layers=num_layers, batch_first=True)
        self.proj = nn.Sequential(
            nn.Linear(hidden, hidden), nn.ReLU(),
            nn.Linear(hidden, H)
        )
        self.scale = nn.Parameter(torch.tensor(1.0))

    def forward(self, reference: torch.Tensor):
        x = reference.unsqueeze(-1) if reference.ndim == 2 else reference.transpose(1, 2)
        _, h_n = self.gru(x)  # h_n [num_layers,B,hidden]
        h = h_n[-1]  # [B,hidden]
        wave = self.proj(h)
        wave = torch.tanh(wave) * self.scale.clamp(0.5,1.5)
        return wave
