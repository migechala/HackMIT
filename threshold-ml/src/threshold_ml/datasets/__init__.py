from .synthetic_dataset import SyntheticANCDataset, collate_fn as synthetic_collate_fn
from .wav import WavDataset
from .real import RealRecordingDataset

collate_fn = synthetic_collate_fn  # shared signature
