import json
import platform
import subprocess
import random
from pathlib import Path
import numpy as np
import torch
from torch import nn


def get_device():
    if torch.cuda.is_available():
        return torch.device('cuda')
    if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        return torch.device('mps')
    return torch.device('cpu')


def synchronize(device):
    if device.type == 'cuda':
        torch.cuda.synchronize()
    elif device.type == 'mps':
        torch.mps.synchronize()


class Trainer:
    def __init__(self, model, train_loader, val_loader, loss_fn, optimizer,
                 scheduler=None, device=None, ckpt_dir='artifacts/checkpoints',
                 experiment_name='exp', use_amp=True, grad_clip=1., config=None, norm=None):
        self.device = torch.device(device) if device else get_device()
        self.model = model.to(self.device)
        self.train_loader, self.val_loader = train_loader, val_loader
        self.loss_fn, self.optimizer, self.scheduler = loss_fn, optimizer, scheduler
        self.use_amp = use_amp and self.device.type == 'cuda'
        self.scaler = torch.amp.GradScaler('cuda', enabled=self.use_amp)
        self.grad_clip = grad_clip
        self.config, self.norm = config, norm
        self.ckpt_dir = Path(ckpt_dir); self.ckpt_dir.mkdir(parents=True, exist_ok=True)
        self.experiment_name, self.start_epoch, self.best_val = experiment_name, 0, float('inf')
        info = dict(device=str(self.device), torch=str(torch.__version__),
                    cuda=torch.version.cuda, python=platform.python_version(), platform=platform.platform(),
                    config=config, dataset_version=2)
        if self.device.type == 'cuda':
            info['accelerator'] = torch.cuda.get_device_name()
            info['capability'] = torch.cuda.get_device_capability()
        try:
            info['git_commit'] = subprocess.check_output(['git', 'rev-parse', 'HEAD'], stderr=subprocess.DEVNULL).decode().strip()
            info['git_dirty'] = bool(subprocess.check_output(['git', 'status', '--porcelain']))
        except (OSError, subprocess.CalledProcessError):
            info['git_commit'] = None
        (self.ckpt_dir/f'{experiment_name}_info.json').write_text(json.dumps(info, indent=2))

    def _epoch(self, loader, train):
        self.model.train(train)
        total, count = 0., 0
        with torch.set_grad_enabled(train):
            for batch in loader:
                x, target, h = [batch[k].to(self.device, non_blocking=True) for k in
                                ('model_input', 'disturbance_future', 'secondary_ir')]
                if train:
                    self.optimizer.zero_grad(set_to_none=True)
                with torch.autocast(device_type=self.device.type, enabled=self.use_amp):
                    prediction = self.model(x)
                # FFT/controller computations intentionally float32.
                loss, _ = self.loss_fn(prediction.float(), target, h)
                if not torch.isfinite(loss):
                    raise FloatingPointError('Non-finite objective')
                if train:
                    self.scaler.scale(loss).backward()
                    self.scaler.unscale_(self.optimizer)
                    nn.utils.clip_grad_norm_(self.model.parameters(), self.grad_clip, error_if_nonfinite=True)
                    self.scaler.step(self.optimizer); self.scaler.update()
                total += loss.detach().item()*len(x); count += len(x)
        return total/count

    def resume(self, path):
        # Full checkpoints contain RNG Python/numpy state: trusted local files only.
        c = torch.load(path, map_location='cpu', weights_only=False)
        if c.get('dataset_version') != 2 or c['config'] != self.config or c['norm'] != self.norm:
            raise ValueError('Checkpoint data/config mismatch; legacy checkpoints unsupported')
        self.model.load_state_dict(c['model_state'], strict=True)
        self.optimizer.load_state_dict(c['optimizer_state'])
        if self.scheduler:
            self.scheduler.load_state_dict(c['scheduler_state'])
        self.scaler.load_state_dict(c['scaler_state'])
        self.start_epoch, self.best_val = c['epoch'], c['best_val']
        random.setstate(c['python_rng']); np.random.set_state(c['numpy_rng'])
        torch.set_rng_state(c['torch_rng'])
        if self.device.type == 'cuda' and c['cuda_rng'] is not None:
            torch.cuda.set_rng_state_all(c['cuda_rng'])
        if self.device.type == 'mps' and c.get('mps_rng') is not None:
            torch.mps.set_rng_state(c['mps_rng'])

    def _save(self, epoch, suffix):
        state = dict(dataset_version=2, epoch=epoch, best_val=self.best_val,
                     model_state=self.model.state_dict(), optimizer_state=self.optimizer.state_dict(),
                     scheduler_state=self.scheduler.state_dict() if self.scheduler else None,
                     scaler_state=self.scaler.state_dict(), config=self.config, norm=self.norm,
                     python_rng=random.getstate(), numpy_rng=np.random.get_state(), torch_rng=torch.get_rng_state(),
                     cuda_rng=torch.cuda.get_rng_state_all() if self.device.type == 'cuda' else None,
                     mps_rng=torch.mps.get_rng_state() if self.device.type == 'mps' else None)
        path = self.ckpt_dir/f'{self.experiment_name}_{suffix}.pt'
        temporary = path.with_suffix('.tmp')
        torch.save(state, temporary); temporary.replace(path)

    def fit(self, epochs=20):
        for epoch in range(self.start_epoch+1, epochs+1):
            training = self._epoch(self.train_loader, True)
            validation = self._epoch(self.val_loader, False)
            if self.scheduler:
                if isinstance(self.scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(validation)
                else:
                    self.scheduler.step()
            improved = validation < self.best_val
            self.best_val = min(validation, self.best_val)
            self._save(epoch, 'last')
            if improved:
                self._save(epoch, 'best')
            record = dict(epoch=epoch, train_loss=training, val_loss=validation)
            with (self.ckpt_dir/f'{self.experiment_name}_history.jsonl').open('a') as f:
                f.write(json.dumps(record)+'\n')
            print(record, flush=True)
        return self.best_val
