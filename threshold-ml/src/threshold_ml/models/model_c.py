"""Reserved interface: no validated learned FxLMS correction model yet."""
from torch import nn


class HybridFxLMSPredictor(nn.Module):
    def __init__(self, *args, **kwargs):
        super().__init__()
        raise NotImplementedError(
            'Model C is deferred. Use baselines.lms.FxLMS for real filtered-x adaptation; '
            'the previous learned FIR was not FxLMS and must not be benchmarked as such.')
