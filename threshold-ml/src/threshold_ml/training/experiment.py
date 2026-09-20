"""Single construction path for training, evaluation and inference."""
import random
import numpy as np
import torch
from ..models import TCNWaveformPredictor, GRUWaveformPredictor
from ..simulation.generator import SimConfig
from ..datasets import SyntheticANCDataset


def seed_all(seed):
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True


def make_model(cfg):
    model = cfg['model']
    common = dict(L_in=cfg['L_in'], H=cfg['H'], fs=cfg['fs'],
                  hidden=model.get('hidden', 64), in_channels=2)
    if model['name'] == 'model_b_tcn':
        return TCNWaveformPredictor(**common, levels=model.get('levels', 4),
                                    kernel_size=model.get('kernel_size', 7))
    if model['name'] == 'model_b_gru':
        return GRUWaveformPredictor(**common)
    raise NotImplementedError('Only Model B TCN/GRU are audited. A lacks matching supervision; C is deferred.')


def make_dataset(cfg, split, stats=None):
    d = cfg['dataset']
    seeds = [d[f'{s}_seed'] for s in ('train', 'val', 'test')]
    if len(set(seeds)) != 3:
        raise ValueError('Use distinct scene split seeds')
    return SyntheticANCDataset(d[f'{split}_scenes'], SimConfig(fs=cfg['fs'], **cfg['sim']),
                               cfg['L_in'], cfg['H'], d.get('windows_per_scene', 8),
                               d[f'{split}_seed'], split, mean_std=stats)
