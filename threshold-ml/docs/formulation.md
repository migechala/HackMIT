# Audited v2 formulation

## Signals and identifiability

At cutoff t, synchronized inputs contain reference r[t-L+1:t], error microphone
measurements e[t-L+1:t], and prior speaker commands u. Near-source reference alone
cannot identify the phase/amplitude of an independently randomized, unknown primary
path. The audited Model B therefore consumes TWO channels:

1. reference history;
2. estimated disturbance history d_hat_past = e_past - (h_hat * u_past).

The initial dataset uses muted speaker histories, so the second channel is noisy
uncontrolled disturbance history. This is observable past data, never a future
label. Nonzero-speaker-history operation is not trained or validated yet.

Simulation: r = source + reference/background noise; d = p * source_with_background
+ local background; e = d + h*u + error-microphone noise. p and h are randomized
causal FIRs. Reference and error microphone noise are distinct from physical d.

## Timing and prediction

Time is discrete; fs is samples/second. Input ends at t; prediction index j=0
means t+1, NOT t. Model predicts d_hat[j] for j=0,...,H-1. The available command
vector has the same logical indices. The effective FIR h includes processing,
output buffering, acoustic propagation, speaker/microphone coloration and echoes.
Processing delay is included ONCE by prepending it within h. Group delay from the
FIR response is additional; impulse argmax is not the full path model.

H is a forecast interval, **not** the sum of processing and acoustic delays.
It must extend beyond the path onset for any new command to affect this window.
For a future streaming block of B samples, sufficient forecast coverage generally
requires B plus the relevant delay/path response. A continuous overlapping block
scheduler and tail scoring remain future work.

Define S[j,i] = h[j-i] for j>=i, zero otherwise. c[j] is the known contribution of
commands before the cutoff (zero for the isolated-window benchmark).

u_hat ≈ argmin_{|u_i|<=1} ||d_hat + c + S_hat u||² + 0.01 ||u||².

The shared controller uses 32 projected-gradient steps with step size
1/(||h_hat||_1²+0.01). This is a bounded finite-horizon approximate solve, not
noncausal FFT division or a guaranteed exact optimum. It never receives true
future d except for the explicitly privileged perfect-forecast baseline.

Physical evaluation: y = S_true u_hat, residual = d_true + c_true + y.
No backwards alignment, circular convolution, or division of the measured residual
is permitted. New commands cannot cancel the initial samples before the FIR onset.
All startup samples are included in the reported RMS.

## Objective and measurements

Training combines waveform MSE, multiresolution magnitude/complex spectral error,
actual future residual energy through the same controller, command energy,
near-saturation penalty, and adjacent-command smoothness. Model disturbance output
is tanh-bounded; command limit is independently fixed at 1.0. The physical solver
and spectral losses use float32 even when the neural encoder uses CUDA AMP.

Attenuation = 10 log10(mean(d²)/mean(residual²)). Negative is amplification.
Worst amplification is max(0, -minimum attenuation) across scored windows.
Frequency/amplitude/phase diagnostics currently use FFT bins of the short forecast
interval; they are coarse, not parameter-ground-truth errors. Future work must add
parameter matching and sub-bin diagnostics. True future microphone measurement
noise is not counted as cancellable physical disturbance.

## Benchmark scope

All windows are isolated cold starts with zero prior commands. The speaker tail
beyond t+H is NOT scored. Thus this experiment is NOT continuous ANC performance,
not a stability proof, and not a real-world attenuation claim. Score the tail and
retain filter/command state before any continuous-control claims. The inference API
can account for previous contributions but this mode has no trained validation.

No production winner can be selected from the invalidated v1 experiments. Model B
is the audited pilot; Model A matching and learned FxLMS corrections remain deferred.
