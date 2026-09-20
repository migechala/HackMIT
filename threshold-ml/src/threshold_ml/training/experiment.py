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
    kind = d.get('type', 'synthetic')  # synthetic | real | wav
    if kind == 'wav':
        from ..datasets.wav import WavDataset
        # wav_path may be absolute or relative to repo root; dataset config can override
        wav_path = d.get('wav_path', 'sound_train.wav')
        # allow per-dataset windows override
        wps = d.get('windows_per_scene', 64)
        return WavDataset(wav_path=wav_path, fs=cfg['fs'], L_in=cfg['L_in'], H=cfg['H'],
                          windows_per_scene=wps, split=split, mean_std=stats,
                          split_ratios=tuple(d.get('split_ratios', [0.7, 0.15, 0.15])),
                          ref_channel=d.get('ref_channel', 0), err_channel=d.get('err_channel', 1),
                          secondary_ir=d.get('secondary_ir'), seed=d.get('seed', 42))
    if kind == 'real':
        from ..datasets.real import RealRecordingDataset
        return RealRecordingDataset(root=d.get('root', 'data/real'), L_in=cfg['L_in'], H=cfg['H'],
                                    windows_per_scene=d.get('windows_per_scene', 8),
                                    split=split, mean_std=stats, max_scenes=d.get('max_scenes'))
    # synthetic (default)
    seeds = [d[f'{s}_seed'] for s in ('train', 'val', 'test')]
    if len(set(seeds)) != 3:
        raise ValueError('Use distinct scene split seeds')
    return SyntheticANCDataset(d[f'{split}_scenes'], SimConfig(fs=cfg['fs'], **cfg['sim']),
                               cfg['L_in'], cfg['H'], d.get('windows_per_scene', 8),
                               d[f'{split}_seed'], split, mean_std=stats)
