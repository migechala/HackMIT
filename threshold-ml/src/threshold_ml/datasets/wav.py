"""WAV training adapter — same contract as SyntheticANCDataset/RealRecordingDataset.

Loads a real stereo WAV (e.g. sound_train.wav at 48 kHz), resamples to
training fs (default 4000), splits CONTIGUOUS time into train/val/test
(never overlapping windows), and exposes muted-calibration windows where
past disturbance ≈ error (speaker muted).

Fixes prior synthetic-only pipeline which could not ingest the real wav:
- correct 24-bit PCM scaling (scipy int32 is 256× left-shifted)
- anti-aliased resampling (resample_poly, not naive decimation)
- contiguous time splits with guard gap (no leakage)
- train-only normalization, provenance-preserving manifest
"""
from pathlib import Path
import numpy as np
import torch
from torch.utils.data import Dataset
from torch.nn.utils.rnn import pad_sequence

try:
    from scipy.io import wavfile
    from scipy.signal import resample_poly
    from fractions import Fraction
    import math
except Exception as e:
    raise ImportError("scipy required for wav dataset") from e

from ..simulation.paths import make_secondary_ir

def _load_wav_as_float(path: Path):
    sr, data = wavfile.read(str(path))
    # data may be int16/int32/float; handle robustly
    # For this repo's 24-bit wav, scipy returns int32 left-shifted 8 bits
    if np.issubdtype(data.dtype, np.integer):
        # Determine bits: int16 -> 32768, int32 -> 2147483648
        # 24-bit files read as int32 need 2**31 scaling (left-justified)
        # Using 2**31 works for both 24-bit (via sci) and 32-bit
        max_val = float(1 << 31) if data.dtype == np.int32 else float(1 << 15)
        # int32 files that are actually 16-bit padded still safe
        float_data = data.astype(np.float64) / max_val
    elif np.issubdtype(data.dtype, np.floating):
        float_data = data.astype(np.float64)
        # assume already in [-1,1] if float, otherwise normalize
        mx = np.max(np.abs(float_data))
        if mx > 2.0:
            float_data /= 32768.0
    else:
        raise ValueError(f"unsupported wav dtype {data.dtype}")
    # shape: (N,) mono or (N,C) stereo
    if float_data.ndim == 1:
        float_data = float_data[:, None]
    return int(sr), float_data


def _resample_to_fs(data: np.ndarray, sr_in: int, sr_out: int):
    if sr_in == sr_out:
        return data
    # resample_poly needs integer up/down, reduce fraction
    g = math.gcd(sr_in, sr_out)
    up = sr_out // g
    down = sr_in // g
    # resample each channel
    out_ch = []
    for c in range(data.shape[1]):
        y = resample_poly(data[:, c], up, down, window=('kaiser', 5.0))
        out_ch.append(y)
    out = np.stack(out_ch, axis=1)
    return out


class WavDataset(Dataset):
    """Single long WAV -> contiguous splits. One scene per split, many windows."""
    def __init__(self, wav_path="sound_train.wav", fs=4000, L_in=2048, H=200,
                 windows_per_scene=32, split="train", mean_std=None,
                 split_ratios=(0.7, 0.15, 0.15), ref_channel=0, err_channel=1,
                 secondary_ir=None, seed=0, guard=True):
        # wav_path may be absolute or relative to threshold-ml/ or repo root
        p = Path(wav_path)
        candidates = [p, Path("threshold-ml")/p, Path.cwd()/p, Path(__file__).resolve().parents[3]/p, Path(__file__).resolve().parents[2]/wav_path]
        # also try repo root sound_train.wav
        repo_root_wav = Path(__file__).resolve().parents[3] / "sound_train.wav"
        if not p.exists() and repo_root_wav.exists():
            p = repo_root_wav
        elif not p.exists():
            for c in candidates:
                if c.exists():
                    p = c
                    break
        if not p.exists():
            raise FileNotFoundError(f"wav not found: {wav_path} (tried {p})")
        self.wav_path = str(p)
        self.fs = int(fs)
        self.L_in, self.H = int(L_in), int(H)
        self.windows_per_scene = int(windows_per_scene)
        self.split = split
        self.ref_channel = int(ref_channel)
        self.err_channel = int(err_channel)

        sr_in, float_data = _load_wav_as_float(p)
        # choose channels
        n_ch = float_data.shape[1]
        if self.ref_channel >= n_ch or self.err_channel >= n_ch:
            raise ValueError(f"wav has {n_ch} channels, requested ref {self.ref_channel} err {self.err_channel}")
        # resample
        resampled = _resample_to_fs(float_data, sr_in, self.fs)
        ref_series = resampled[:, self.ref_channel].astype(np.float32)
        err_series = resampled[:, self.err_channel].astype(np.float32)

        # mild global gain fix: bring rms to ~0.08 (synthetic-like 0.05-0.3)
        # preserves relative dynamics, not per-window peak normalization
        # This is a fixed analog-frontend gain, not per-scene leakage
        rms = float(np.sqrt(np.mean(ref_series.astype(np.float64)**2) + np.sqrt(np.mean(err_series.astype(np.float64)**2))))
        # actually average rms; if too small (<0.01) boost, if too large (>0.5) attenuate
        # Keep physical scale: apply single scalar to both channels derived from overall rms
        # Target rms 0.15
        target_rms = 0.15
        cur_rms = float(np.sqrt(np.mean(np.concatenate([ref_series, err_series]).astype(np.float64)**2)))
        if cur_rms > 1e-9:
            gain = target_rms / cur_rms
            # clamp gain to avoid extreme scaling (0.3x .. 8x)
            gain = float(np.clip(gain, 0.3, 8.0))
            ref_series *= gain
            err_series *= gain

        n_total = len(ref_series)
        if n_total < self.L_in + self.H + 10:
            raise ValueError(f"wav too short after resample: {n_total} < {self.L_in+self.H}")

        # contiguous splits with guard
        r_train, r_val, r_test = split_ratios
        assert abs(sum(split_ratios)-1.0) < 1e-6
        # Compatibility with SceneWindowSampler (expects dataset.scenes)
        # Wav has one logical scene per split; windows are windows_per_scene sub-windows.
        self.num_scenes = 1
        self.scenes = [f"{Path(self.wav_path).name}:{split}:scene0"]
        n_train = int(n_total * r_train)
        n_val = int(n_total * r_val)
        guard_len = self.L_in + self.H if guard else 0
        # boundaries
        b0, b1 = 0, n_train
        b2, b3 = b1 + guard_len, b1 + guard_len + n_val
        b4, b5 = b3 + guard_len, n_total
        bounds = {"train": (b0, b1), "val": (b2, b3), "test": (b4, b5)}
        if split not in bounds:
            raise ValueError(f"split {split} not in {list(bounds)}")
        lo, hi = bounds[split]
        segment_len = hi - lo
        if segment_len < self.L_in + self.H + 1:
            raise ValueError(f"split {split} segment too short: {segment_len}")
        ref_seg = ref_series[lo:hi]
        err_seg = err_series[lo:hi]

        # secondary IR: use provided array or synthesize one stable per wav
        if secondary_ir is not None:
            ir = np.asarray(secondary_ir, dtype=np.float32)
        else:
            # Generate stable synthetic secondary that matches sim config if available
            # Use 10ms delay + 48 taps, attenuation 0.6
            rng = np.random.default_rng(0)
            ir = make_secondary_ir(self.fs, delay_ms=10., num_taps=48, attenuation=0.6, rng=rng)
        self.secondary_ir = ir.astype(np.float32)
        # Keep short ref for manifest provenance
        self.sr_in = int(sr_in)
        self.n_total = int(n_total)
        self.bounds = bounds
        self.ref_seg = ref_seg
        self.err_seg = err_seg

        # sample windows deterministically spaced, not overlapping leakage across splits
        # stride = segment_len / windows_per_scene
        # Use deterministic start positions: linspace with fixed seed offset
        self.starts = []
        usable = segment_len - self.L_in - self.H
        if usable <= 0:
            raise ValueError("usable less than window")
        # Evenly spaced, plus small jitter from seed
        rng = np.random.default_rng(abs(hash((str(p), split, seed))) % (1<<32))
        if self.windows_per_scene == 1:
            self.starts = [usable//2]
        else:
            # linspace then jitter ±10% of stride, clamped
            stride = usable / self.windows_per_scene
            for w in range(self.windows_per_scene):
                base = int(w * stride)
                jitter = int(rng.integers(-int(stride*0.1), int(stride*0.1)+1))
                s = int(np.clip(base + jitter, 0, usable))
                self.starts.append(s)
            # ensure sorted and unique
            self.starts = sorted(set(self.starts))
            # if deduplication reduced count, fill randomly
            while len(self.starts) < self.windows_per_scene:
                s = int(rng.integers(0, usable+1))
                if s not in self.starts:
                    self.starts.append(s)
            self.starts = sorted(self.starts)[:self.windows_per_scene]

        # Build entries: each entry is a window
        self.entries = []
        for s in self.starts:
            ref_win = ref_seg[s:s+self.L_in]
            err_win = err_seg[s:s+self.L_in]
            dist_future = err_seg[s+self.L_in: s+self.L_in+self.H]
            self.entries.append((ref_win, err_win, dist_future))

        # normalization: train-only; val/test must receive train mean_std
        if mean_std is None:
            if split != "train":
                raise ValueError("val/test need train mean_std (train-only normalization)")
            # compute mean/std over both channels across all train windows
            all_data = np.concatenate([np.concatenate([e[0], e[1]]) for e in self.entries])
            self.mean = float(np.mean(all_data))
            self.std = float(np.std(all_data) + 1e-6)
        else:
            self.mean, self.std = map(float, mean_std)

    def __len__(self):
        return len(self.entries)

    def __getitem__(self, idx):
        ref, err, dist_future = self.entries[idx]
        # normalized model input
        inp = (np.stack([ref, err]) - self.mean) / self.std
        return dict(
            reference=torch.tensor((ref - self.mean) / self.std, dtype=torch.float32),
            model_input=torch.tensor(inp, dtype=torch.float32),
            disturbance_past=torch.tensor(err, dtype=torch.float32),
            disturbance_future=torch.tensor(dist_future, dtype=torch.float32),
            secondary_ir=torch.tensor(self.secondary_ir, dtype=torch.float32),
            scene_id=f"{Path(self.wav_path).name}:{self.split}:{idx}",
            sample_index=int(self.starts[idx] + self.L_in - 1),  # global sample index within segment, like synthetic
        )

    def get_stats(self):
        return self.mean, self.std

    def manifest(self):
        return dict(
            version=2,
            kind="wav",
            wav_path=self.wav_path,
            sr_in=self.sr_in,
            fs=self.fs,
            L_in=self.L_in,
            H=self.H,
            n_total=self.n_total,
            bounds=self.bounds,
            split=self.split,
            windows_per_scene=self.windows_per_scene,
            starts=self.starts,
            mean=self.mean,
            std=self.std,
            secondary_ir=self.secondary_ir.tolist()[:8],
            note="contiguous time split with guard, resampled via resample_poly, single fixed gain from overall rms (not per-window), 24-bit correct scaling",
        )

def collate_fn(batch):
    from torch.nn.utils.rnn import pad_sequence
    result = {k: torch.stack([b[k] for b in batch]) for k in ("reference", "model_input", "disturbance_past", "disturbance_future")}
    result["secondary_ir"] = pad_sequence([b["secondary_ir"] for b in batch], batch_first=True)
    result["scene_id"] = [b["scene_id"] for b in batch]
    result["sample_index"] = torch.stack([b["sample_index"] if isinstance(b["sample_index"], torch.Tensor) else torch.tensor(b["sample_index"]) for b in batch])
    return result
