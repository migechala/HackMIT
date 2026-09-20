"""Scene-level splits; bounded per-scene cache, deterministic lazy generation."""
from dataclasses import asdict
from functools import lru_cache
import numpy as np
import torch
from torch.utils.data import Dataset
from torch.nn.utils.rnn import pad_sequence
from ..simulation.generator import AcousticSimulator, stable_seed, DATASET_VERSION


class SyntheticANCDataset(Dataset):
    def __init__(self, num_scenes, sim_cfg, L_in, H, windows_per_scene=8,
                 seed=0, split='train', normalize=True, mean_std=None):
        if min(num_scenes, L_in, H, windows_per_scene) < 1:
            raise ValueError('Dataset dimensions must be positive')
        if normalize and split != 'train' and mean_std is None:
            raise ValueError('Validation/test require training normalization')
        self.sim = AcousticSimulator(sim_cfg)
        self.sim_cfg, self.L_in, self.H = sim_cfg, L_in, H
        self.windows_per_scene, self.seed, self.split = windows_per_scene, seed, split
        # Split namespace changes source AND path draws even when seeds are reused.
        rng = np.random.default_rng(stable_seed((DATASET_VERSION, split, seed)))
        self.scenes = [self.sim.sample_scene(f'{split}_{seed}_{i}', rng) for i in range(num_scenes)]
        self.starts = []
        warmup = max(max(len(s.primary_ir), len(s.secondary_ir)) for s in self.scenes)
        end = round(sim_cfg.fs*sim_cfg.duration_s)-L_in-H
        if end < warmup:
            raise ValueError('Scene too short for warmup, input and horizon')
        for scene in self.scenes:
            wrng = np.random.default_rng(stable_seed((scene.scene_id, seed)))
            self.starts.append(wrng.integers(warmup, end+1, windows_per_scene))
        # Cache bound limits memory; workers have independent caches.
        self._data = lru_cache(maxsize=8)(self._synthesize)
        self.mean, self.std = 0., 1.
        if normalize:
            if mean_std is not None:
                self.mean, self.std = map(float, mean_std)
            else:
                # Streaming training-only moments of both input channels.
                total = squares = 0.
                count = 0
                for i in range(num_scenes):
                    d = self._data(i)
                    for start in self.starts[i]:
                        x = np.stack([d['reference'][start:start+L_in],
                                      d['residual'][start:start+L_in]]).astype(np.float64)
                        total += x.sum(); squares += (x*x).sum(); count += x.size
                self.mean = total/count
                self.std = max(np.sqrt(max(0., squares/count-self.mean**2)), 1e-6)
            if self.std <= 0:
                raise ValueError('Normalization std must be positive')

    def __getstate__(self):
        state = self.__dict__.copy()
        state.pop('_data')
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self._data = lru_cache(maxsize=8)(self._synthesize)

    def _synthesize(self, i):
        return self.sim.synthesize(self.scenes[i])

    def __len__(self):
        return len(self.scenes)*self.windows_per_scene

    def __getitem__(self, index):
        i, w = divmod(index, self.windows_per_scene)
        start = int(self.starts[i][w]); end = start+self.L_in
        d = self._data(i)
        ref = d['reference'][start:end]
        # Speaker is muted in milestone scenes; error history estimates disturbance.
        past = d['residual'][start:end]
        inputs = (np.stack([ref, past])-self.mean)/self.std
        return dict(reference=torch.tensor((ref-self.mean)/self.std, dtype=torch.float32),
                    model_input=torch.tensor(inputs, dtype=torch.float32),
                    disturbance_past=torch.tensor(past),
                    disturbance_future=torch.tensor(d['disturbance'][end:end+self.H]),
                    secondary_ir=torch.tensor(d['secondary_ir']),
                    scene_id=self.scenes[i].scene_id, sample_index=end-1)

    def get_stats(self):
        return float(self.mean), float(self.std)

    def manifest(self):
        return dict(version=DATASET_VERSION, split=self.split, seed=self.seed,
                    simulator=asdict(self.sim_cfg), L_in=self.L_in, H=self.H,
                    mean=self.mean, std=self.std,
                    scenes=[{**asdict(s), 'primary_ir': s.primary_ir.tolist(),
                             'secondary_ir': s.secondary_ir.tolist(),
                             'starts': self.starts[i].tolist()} for i, s in enumerate(self.scenes)])


def collate_fn(batch):
    result = {k: torch.stack([b[k] for b in batch]) for k in
              ('reference', 'model_input', 'disturbance_past', 'disturbance_future')}
    result['secondary_ir'] = pad_sequence([b['secondary_ir'] for b in batch], batch_first=True)
    result['scene_id'] = [b['scene_id'] for b in batch]
    result['sample_index'] = torch.tensor([b['sample_index'] for b in batch])
    return result
