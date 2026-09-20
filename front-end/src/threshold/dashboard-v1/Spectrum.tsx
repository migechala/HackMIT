import { useEffect, useMemo, useRef, useState } from 'react';
import { BASELINE_PEAK, DOMINANT_HZ, FREQS, RESIDUAL_PEAK, spectrumDb, xOf, yOf } from './sim';

const W = 900, H = 356;
const M = { l: 46, r: 16, t: 14, b: 46 };
const IW = W - M.l - M.r, IH = H - M.t - M.b;
const X_TICKS = [20, 50, 100, 200, 500, 1000];
const Y_TICKS = [30, 40, 50, 60, 70];

const path = (ys: number[]) => FREQS.map((f, i) => `${i ? 'L' : 'M'}${xOf(f, IW).toFixed(1)},${yOf(ys[i], IH).toFixed(1)}`).join('');

/**
 * Live noise spectrum: gray baseline (ANC off) vs green-cyan result (ANC on), with the dominant
 * tone highlighted. The peak height is driven by `attn`, so it visibly decays when ANC switches on.
 */
export default function Spectrum({ attn, seed, threshold, capturing }: { attn: number; seed: number; threshold: number; capturing: boolean }) {
  const jit = useRef<number[]>(FREQS.map(() => 0));
  const [tick, setTick] = useState(0);

  // ~12 fps of small live jitter on the measured curve only.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      const j = jit.current;
      for (let i = 0; i < j.length; i++) j[i] = j[i] * 0.55 + (Math.random() - 0.5) * 0.9 * 0.45;
      setTick((t) => t + 1);
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  const baseline = useMemo(() => FREQS.map((f) => spectrumDb(f, 0, seed)), [seed]);
  const live = FREQS.map((f, i) => spectrumDb(f, attn, seed) + jit.current[i] * (f > 150 || attn < 0.99 ? 1 : 0.35));
  void tick;

  // exact peak for the readout (the drawn curve is smoothed by ~0.1 dB)
  const peakNow = BASELINE_PEAK + (RESIDUAL_PEAK - BASELINE_PEAK) * attn;
  const px = xOf(DOMINANT_HZ, IW);
  const yBase = yOf(BASELINE_PEAK, IH);
  const yNow = yOf(Math.min(peakNow, BASELINE_PEAK), IH);
  const line = path(live);
  const fillPath = `${line}L${IW},${IH}L0,${IH}Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Noise spectrum. Baseline peaks at ${BASELINE_PEAK} dB near ${DOMINANT_HZ} Hz; with active cancellation the peak is about ${RESIDUAL_PEAK} dB.`}>
      <defs>
        <linearGradient id="spec-line" x1="0" x2="1">
          <stop offset="0" stopColor="#5FE89A" />
          <stop offset="1" stopColor="#4FC3D9" />
        </linearGradient>
        <linearGradient id="spec-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5FE89A" stopOpacity="0.22" />
          <stop offset="1" stopColor="#5FE89A" stopOpacity="0" />
        </linearGradient>
        <clipPath id="spec-clip"><rect width={IW} height={IH} /></clipPath>
      </defs>
      <g transform={`translate(${M.l},${M.t})`}>
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line x1="0" x2={IW} y1={yOf(t, IH)} y2={yOf(t, IH)} stroke="#EDEEE9" strokeOpacity="0.08" />
            <text x="-10" y={yOf(t, IH) + 4} textAnchor="end" fontSize="11" fill="#98A29A">{t}</text>
          </g>
        ))}
        {X_TICKS.map((t) => (
          <g key={t}>
            <line x1={xOf(t, IW)} x2={xOf(t, IW)} y1="0" y2={IH} stroke="#EDEEE9" strokeOpacity="0.05" />
            <text x={xOf(t, IW)} y={IH + 20} textAnchor="middle" fontSize="11" fill="#98A29A">{t}</text>
          </g>
        ))}

        <g clipPath="url(#spec-clip)">
          {/* dominant tone band */}
          <rect x={px - 14} y="0" width="28" height={IH} fill="#4FC3D9" fillOpacity="0.08" />
          <line x1={px} x2={px} y1="0" y2={IH} stroke="#4FC3D9" strokeOpacity="0.5" strokeDasharray="3 4" />
          {/* configured threshold */}
          <line x1="0" x2={IW} y1={yOf(threshold, IH)} y2={yOf(threshold, IH)} stroke="#E8A73E" strokeOpacity="0.7" strokeDasharray="6 5" />
          {/* baseline: ANC off */}
          <path d={path(baseline)} fill="none" stroke="#8B938A" strokeWidth="2" style={capturing ? { strokeDasharray: 2400, strokeDashoffset: 2400, animation: 'spec-draw 1.3s ease-out forwards' } : undefined} />
          {/* result: ANC on */}
          <path d={fillPath} fill="url(#spec-fill)" />
          <path d={line} fill="none" stroke="url(#spec-line)" strokeWidth="2.5" strokeLinejoin="round" />
        </g>

        {/* peak markers */}
        <line x1={px + 20} x2={px + 20} y1={yBase} y2={yNow} stroke="#EDEEE9" strokeOpacity="0.5" />
        <circle cx={px} cy={yBase} r="4" fill="#0B0F0D" stroke="#8B938A" strokeWidth="2" />
        <circle cx={px} cy={yNow} r="5" fill="#5FE89A" />
        <g transform={`translate(${px + 30},${Math.max(16, yBase - 4)})`}>
          <text fontSize="12" fill="#EDEEE9" fontWeight="600">Dominant tone {DOMINANT_HZ} Hz</text>
          <text y="16" fontSize="11" fill="#98A29A">{BASELINE_PEAK.toFixed(1)} dB baseline → {Math.min(peakNow, BASELINE_PEAK).toFixed(1)} dB now</text>
        </g>
        <text x={IW - 4} y={yOf(threshold, IH) - 6} textAnchor="end" fontSize="11" fill="#E8A73E">{threshold} dBA configured threshold</text>
        <text x="-34" y="-2" fontSize="11" fill="#98A29A">dB</text>
      </g>
      <text x={M.l + IW / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="#98A29A">Frequency (Hz, log scale)</text>
    </svg>
  );
}

