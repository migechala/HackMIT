#!/usr/bin/env python3
"""Save scene/path manifests; windows are generated lazily from deterministic seeds."""
import argparse
import json
from pathlib import Path
import yaml
from threshold_ml.training.experiment import make_dataset


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True)
    parser.add_argument('--output', default='data/manifests')
    args = parser.parse_args()
    cfg = yaml.safe_load(Path(args.config).read_text())
    directory = Path(args.output); directory.mkdir(parents=True, exist_ok=False)
    train = make_dataset(cfg, 'train')
    for dataset in (train, make_dataset(cfg, 'val', train.get_stats()),
                    make_dataset(cfg, 'test', train.get_stats())):
        (directory/f'{dataset.split}.json').write_text(json.dumps(dataset.manifest(), indent=2))
        print(dataset.split, len(dataset), 'windows')


if __name__ == '__main__':
    main()
