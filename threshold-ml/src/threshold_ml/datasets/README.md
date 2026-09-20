# Real recordings: adapter contract (not yet implemented)

An adapter returns:
- `reference`: normalized reference [L], float32.
- `model_input`: float32 [2,L]: normalized reference and estimated disturbance history.
- `disturbance_past`: raw physical-scale estimated disturbance [L], for baselines.
- `disturbance_future`: raw physical-scale uncontrolled disturbance [H], LABEL ONLY.
- `secondary_ir`: measured/estimated effective causal FIR [M], including all latency once.
- `scene_id`: recording-session/operating-condition identifier.
- `sample_index`: integer index of final observed sample, shared by all input channels.

Pilot training uses muted calibration recordings. With active playback, estimate
past disturbance as error_audio - h_est * speaker_history. Retain at least M-1 extra
speaker samples before the input window, and account for previous commands in the
future residual. Model/API support for this subtraction is not evidence of trained
closed-loop performance: the current simulator uses muted speaker histories.

Residual alone is not a ground-truth future uncontrolled-disturbance label during
playback. Use muted segments, a separately validated observer, or appropriate
controlled measurement protocol. Do not infer future noise from test labels.

Split whole sessions, rooms/paths and source operating conditions; never split
adjacent or overlapping windows into train and test. Fit normalization ONLY on
training inputs. Preserve physical amplitude units in targets, commands and FIRs;
never independently normalize these quantities. Avoid per-scene peak normalization
using future samples. Resample/alignment must preserve documented latency and phase.

Implement the same Dataset/collate interface; inference and models need not change.
For reproducibility archive recording hashes, metadata, split manifests, sample-rate
conversions, calibration FIRs, normalization and dataset version. A real adapter
must version its own data, not claim to be synthetic dataset v2.
