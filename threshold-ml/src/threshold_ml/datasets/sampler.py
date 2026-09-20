"""Shuffle whole scenes, then their windows, to avoid repeatedly synthesizing scenes."""
import torch
from torch.utils.data import Sampler


class SceneWindowSampler(Sampler):
    def __init__(self, dataset):
        self.dataset = dataset

    def __len__(self):
        return len(self.dataset)

    def __iter__(self):
        windows = self.dataset.windows_per_scene
        for scene in torch.randperm(len(self.dataset.scenes)).tolist():
            for window in torch.randperm(windows).tolist():
                yield scene*windows+window
