# Correctness/performance audit

## Verdict

The previous code contained material scientific errors, not merely tuning issues.
Its attenuation results, including the ~113 dB oracle and positive ML summaries,
are INVALID: the final metric bypassed the actual secondary path. These are not
simulation evidence of noise cancellation. No successful model comparison is
claimed. Old artifacts are retained under `artifacts/legacy_unvalidated/` and the
new evaluator rejects their checkpoints. New training must run on the ASUS GX10.

## Corrected

- One common bounded, regularized finite-horizon controller in loss/evaluation/API.
- Correct causal FIR convolution, no backwards residual shift or unity-path scoring.
- Loss and evaluation use the same physical timing/sign conventions and bounds.
- Spectral loss is active for short horizons and complex/phase-sensitive; no silent
  exception swallowing. FFT/controller remain float32 under neural AMP.
- Randomized FIRs retain full support for any configured delay/sample rate; removed
  arbitrary peak normalization that distorted specified path gain.
- Proper primary source-to-error path and explicit two-channel causal input. A
  reference-only predictor could not infer the previous hidden randomized mapping.
- Removed future-dependent whole-scene peak normalization and acausal oracle labels.
- Stable scene/window seeds across processes; independent source/path draws per
  split, training-only normalization, versioned full scene/path/window manifests.
- SNR actually controls injected background. Harmonic drift scales with harmonic
  order. Intermittency now works when enabled. No all-zero intermittency placeholder.
- AR chronological coefficient order, FFT quadrature phase fit, stable single-tone
  sinusoidal variable-projection regression.
- Replaced fake FxLMS with sequential actual filtered-reference adaptation. It is
  tested separately, not misleadingly compared with isolated-window predictors.
- Removed misleading learned-FIR-as-FxLMS hybrid; Model C fails explicitly. Model A
  is excluded from training until its matching loss and correct labels exist.
- Strict checkpoint loading and version checks; config/norm/RNG/optimizer/scheduler/
  AMP state saved for resume. Atomic saves; guard against overwriting experiments.
- Accelerator-aware timing synchronization, conventional RTF=time/audio-duration,
  separate neural/controller timings. No claims about GX10 timing from Mac results.
- Test selection covers every held-out scene, not just the first few scenes. Report
  physical metrics, percentiles, all per-window results and actual worst cases.

## Efficiency

- Removed unused torchaudio/TensorBoard dependencies; JSONL tracks epoch history.
- Lazy per-scene generation, bounded LRU cache; scene-shuffled sampler avoids
  re-synthesizing every scene for every random window. No giant concatenation for
  normalization statistics. Worker-spawn serialization is covered by a test.
- TCN computes only its true receptive field (181 samples for 4 levels/kernel 7),
  not 2048 irrelevant samples. Exact inference equivalence tested. Increase levels
  if longer context is needed; current pilot does not use all 512 ms of input.
- Batched differentiable path solver replaces Python per-example loss convolution.
  It is O(batch * iterations * H²) and NOT a demonstrated real-time solver. Profile
  on GX10 before large horizon/batch sweeps; a structured FIR solver is a next step.
- GPU training moves model before optimizer creation, supports pinned transfers,
  zero_grad(set_to_none), gradient clipping and CUDA-only AMP.

## Remaining gaps (do not claim completed deliverables)

- Model A multi-component assignment loss and future error-location parameter labels.
- Model C learned bounded FxLMS corrections and closed-loop stability experiments.
- Continuous streaming training/evaluation, nonzero-speaker histories, speaker tails,
  time-varying paths, abrupt operating-point changes and rigorous OOD test suites.
- Multitone regression/parameter metrics; the multitone config is a deferred draft.
- Full phase/frequency/mismatch/horizon/spectrogram plots and ablations. Current
  plotting covers forecast waveforms, physical spectra, and baseline distributions.
- Approximate bounded perfect-forecast baseline is not an exact optimal oracle and
  knows future broadband noise. A known-tonal-parameter oracle still needs adding.
- Full-channel normalization, metadata/channels beyond the two audited inputs,
  real recording adapter, and hardware-specific throughput/memory tuning.
- Pilot scene counts are small. Tail-risk statistics require larger scene-level
  samples, confidence intervals and separate shifted distributions.

## Verification scope

CPU unit/smoke tests cover deterministic seeds, split isolation, normalization,
variable FIR support, SNR response, convolution agreement with scipy, delayed
oracle causality, output bounds, actual amplification, spectral gradients, baseline
phase/AR correctness, real FxLMS causality, inference/controller agreement, TCN
receptive-field trimming, and full optimizer checkpoint/resume equivalence.
Only tiny test updates were run during this audit; no new experiment training.
Latest local verification: **21 tests passed**, including an untrained evaluation CLI
smoke test that writes physical-metric JSON and plots in a temporary directory.
Python compilation and CLI help checks also passed. No experiment training process
is running. CUDA/GX10 execution and end-to-end trained v2 results remain unverified.
