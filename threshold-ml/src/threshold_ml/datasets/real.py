"""Real Pi recording adapter — same contract as SyntheticANCDataset for retraining.

Expects data/real/YYYY-MM-DD/HH/scene_*.npz from ingest_raw_server.py
each npz: reference[L], error[L], speaker[L+M-1], secondary_ir[M], sample_index, fs
Muted calibration windows provide disturbance labels: d = error when speaker history is silent.
"""
from pathlib import Path
import numpy as np
import torch
from torch.utils.data import Dataset
from torch.nn.utils.rnn import pad_sequence


class RealRecordingDataset(Dataset):
    def __init__(self, root="data/real", L_in=2048, H=200, windows_per_scene=8, split="train", mean_std=None, max_scenes=None):
        self.root = Path(root)
        self.L_in, self.H = L_in, H
        files = sorted(self.root.rglob("*.npz"))
        if not files:
            raise FileNotFoundError(f"no npz in {self.root}")
        # group by hour directory = scene
        by_scene = {}
        for f in files:
            by_scene.setdefault(f.parent, []).append(f)
        scenes = sorted(by_scene.items())  # [(Path, [files])]
        if max_scenes:
            scenes = scenes[:max_scenes]
        self.scenes = []
        self.entries = []
        for scene_dir, flist in scenes:
            flist = sorted(flist, key=lambda p: int(np.load(p)["sample_index"]))
            # concatenate L-length reference/error into long series
            refs, errs, speakers = [], [], []
            ir = None
            for p in flist:
                d = np.load(p)
                refs.append(d["reference"])
                errs.append(d["error"])
                speakers.append(d["speaker"])
                ir = d["secondary_ir"]  # last wins, assume stationary per hour
            ref_series = np.concatenate(refs)
            err_series = np.concatenate(errs)
            # speaker history is L+M-1 per frame, overlapping — reconstruct long speaker series by taking last L per frame
            # simpler: use error when muted, so disturbance ≈ error
            n = len(ref_series) - L_in - H
            if n <= 0:
                continue
            self.scenes.append(str(scene_dir))
            for w in range(windows_per_scene):
                # deterministic per scene/window, no hash randomization
                start = (w * 997) % max(1, n)
                end = start + L_in
                ref_win = ref_series[start:end]
                err_win = err_series[start:end]
                dist_future = err_series[end:end+H]  # muted => error is disturbance
                self.entries.append((ref_win, err_win, dist_future, ir, str(scene_dir)))
        if not self.entries:
            raise ValueError("no windows from real data")
        # normalization: train-only
        if mean_std is None:
            if split != "train":
                raise ValueError("val/test need train mean_std")
            all_ref = np.concatenate([e[0] for e in self.entries] + [e[1] for e in self.entries])
            self.mean = float(np.mean(all_ref))
            self.std = float(np.std(all_ref) + 1e-6)
        else:
            self.mean, self.std = map(float, mean_std)

    def __len__(self):
        return len(self.entries)

    def __getitem__(self, idx):
        ref, err, dist_future, ir, scene_id = self.entries[idx]
        # two-channel model_input: ref and err (past disturbance when muted)
        inputs = (np.stack([ref, err]) - self.mean) / self.std
        return dict(
            reference=torch.tensor((ref - self.mean) / self.std, dtype=torch.float32),
            model_input=torch.tensor(inputs, dtype=torch.float32),
            disturbance_past=torch.tensor(err, dtype=torch.float32),
            disturbance_future=torch.tensor(dist_future, dtype=torch.float32),
            secondary_ir=torch.tensor(ir, dtype=torch.float32),
            scene_id=scene_id,
            sample_index=idx,
        )

    def get_stats(self):
        return self.mean, self.std

    def manifest(self):
        return dict(scenes=self.scenes, mean=self.mean, std=self.std, L_in=self.L_in, H=self.H)

def collate_fn(batch):
    result = {k: torch.stack([b[k] for b in batch]) for k in ("reference", "model_input", "disturbance_past", "disturbance_future")}
    result["secondary_ir"] = pad_sequence([b["secondary_ir"] for b in batch], batch_first=True)
    result["scene_id"] = [b["scene_id"] for b in batch]
    result["sample_index"] = torch.tensor([b["sample_index"] for b in batch])
    return result
