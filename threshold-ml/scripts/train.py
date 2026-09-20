#!/usr/bin/env python3
"""Run actual training on GX10; local validation should use pytest only."""
import argparse
import json
from pathlib import Path
import yaml
import torch
from torch.utils.data import DataLoader
from threshold_ml.training.experiment import make_model, make_dataset, seed_all
from threshold_ml.training.trainer import Trainer, get_device
from threshold_ml.losses import CompositeLoss


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True)
    parser.add_argument('--device', choices=['cpu', 'cuda', 'mps'])
    parser.add_argument('--resume', help='Trusted full checkpoint; resumes to configured total epochs')
    args = parser.parse_args()
    cfg = yaml.safe_load(Path(args.config).read_text())
    settings = cfg['training']
    seed_all(settings.get('seed', 42))
    device = torch.device(args.device) if args.device else get_device()
    # Model to device BEFORE optimizer construction.
    model = make_model(cfg).to(device)
    directory = Path('artifacts/checkpoints')/cfg['experiment']
    if directory.exists() and any(directory.iterdir()) and not args.resume:
        raise FileExistsError(f'{directory} exists. Resume or use a new experiment name.')
    train = make_dataset(cfg, 'train')
    stats = train.get_stats()
    validation = make_dataset(cfg, 'val', stats)
    directory.mkdir(parents=True, exist_ok=True)
    for ds in (train, validation):
        (directory/f'{ds.split}_manifest.json').write_text(json.dumps(ds.manifest(), indent=2))
    workers = settings.get('num_workers', 0)
    kwargs = dict(batch_size=settings['batch_size'], num_workers=workers,
                  pin_memory=device.type == 'cuda')
    from threshold_ml.datasets import collate_fn
    from threshold_ml.datasets.sampler import SceneWindowSampler
    training_loader = DataLoader(train, sampler=SceneWindowSampler(train), collate_fn=collate_fn, **kwargs)
    validation_loader = DataLoader(validation, shuffle=False, collate_fn=collate_fn, **kwargs)
    optimizer_name = settings.get('optimizer', 'adamw')
    optimizers = dict(adamw=torch.optim.AdamW, adam=torch.optim.Adam)
    optimizer = optimizers[optimizer_name](model.parameters(), lr=float(settings['lr']),
                                         weight_decay=float(settings.get('weight_decay', 0.)))
    scheduler_name = settings.get('scheduler', 'plateau')
    scheduler = (torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, factor=.5, patience=4)
                 if scheduler_name == 'plateau' else None)
    if scheduler_name not in ('plateau', 'none'):
        raise ValueError('Unknown scheduler')
    loss = CompositeLoss(**cfg['loss'])
    trainer = Trainer(model, training_loader, validation_loader, loss, optimizer, scheduler,
                      device=device, ckpt_dir=directory, experiment_name=cfg['experiment'],
                      use_amp=settings.get('use_amp', True), grad_clip=settings.get('grad_clip', 1.),
                      config=cfg, norm=stats)
    if args.resume:
        trainer.resume(args.resume)
    trainer.fit(settings['epochs'])


if __name__ == '__main__':
    main()
