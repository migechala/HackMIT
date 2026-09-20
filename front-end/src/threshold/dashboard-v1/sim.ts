import { useCallback, useEffect, useRef, useState } from 'react';
import { mulberry32 } from '../scene/random';

/** All numbers here are illustrative demo values, not measurements. */

export const F_MIN = 20;
export const F_MAX = 1000;
export const DB_MIN = 30;
export const DB_MAX = 75;

export const BASELINE_PEAK = 66.6;
export const RESIDUAL_PEAK = 54.2;
export const ATTENUATION = +(BASELINE_PEAK - RESIDUAL_PEAK).toFixed(1); // 12.4
export const FULL_POWER_W = 5.2;
export const IDLE_POWER_W = 0.3;
export const DOMINANT_HZ = 120;

// Tonal components: only the dominant 120 Hz tone is cancelled strongly; harmonics are only slightly reduced.
const TONES = [
  { f: 120, off: 66.6, on: 54.2, w: 0.05 },
  { f: 240, off: 58.4, on: 56.6, w: 0.045 },
  { f: 360, off: 52.6, on: 51.8, w: 0.04 },
  { f: 480, off: 47.6, on: 47.2, w: 0.04 },
];

const smoothMax = (a: number, b: number) => (a + b + Math.sqrt((a - b) ** 2 + 2)) / 2;

/** Sound level (dB) at frequency `f` for ANC depth `attn` (0 = off … 1 = fully converged). */
export function spectrumDb(f: number, attn: number, seed: number) {
  const floor = 47.5 - 7 * Math.log10(f / 100) + 0.8 * Math.sin(f * 0.043 + seed * 1.9) + 0.5 * Math.sin(f * 0.11 + seed * 0.7);
  let level = floor;
  for (const t of TONES) {
    const d = Math.log(f / t.f) / t.w;
    const peak = t.off + (t.on - t.off) * attn - 26 * d * d;
    level = smoothMax(level, peak);
  }
  return level;
}

export const xOf = (f: number, w: number) => ((Math.log(f) - Math.log(F_MIN)) / (Math.log(F_MAX) - Math.log(F_MIN))) * w;
export const yOf = (db: number, h: number) => h - ((db - DB_MIN) / (DB_MAX - DB_MIN)) * h;

export const FREQS = Array.from({ length: 200 }, (_, i) => F_MIN * Math.pow(F_MAX / F_MIN, i / 199));

export type TimeMode = 'night' | 'day';
export const THRESHOLDS = { day: 60, night: 55 } as const;

/**
 * ANC state. `attn` eases toward its target after a toggle so the tonal peak visibly decays
 * (or returns); the loop stops once settled.
 */
export function useAncSim() {
  const [ancOn, setAncOnState] = useState(true);
  const [attn, setAttn] = useState(1);
  const [seed, setSeed] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const target = useRef(1);
  const cur = useRef(1);
  const raf = useRef(0);

  const run = useCallback(() => {
    cancelAnimationFrame(raf.current);
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // critically-damped-ish ease with ~0.55 s time constant
      cur.current += (target.current - cur.current) * (1 - Math.exp(-dt / 0.55));
      if (Math.abs(target.current - cur.current) < 0.002) cur.current = target.current;
      setAttn(cur.current);
      if (cur.current !== target.current) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const setAncOn = (on: boolean) => {
    setAncOnState(on);
    target.current = on ? 1 : 0;
    run();
  };

  const captureBaseline = () => {
    if (capturing) return;
    setCapturing(true);
    window.setTimeout(() => {
      setSeed((s) => s + 1);
      setCapturedAt(new Date());
      setCapturing(false);
    }, 1400);
  };

  return { ancOn, setAncOn, attn, seed, capturing, capturedAt, captureBaseline };
}

/** Deterministic power history for the historical graph (illustrative). */
export type Range = 'hour' | 'day' | 'week';
export function powerHistory(range: Range): { label: string; w: number }[] {
  const rand = mulberry32(range === 'hour' ? 3 : range === 'day' ? 5 : 8);
  if (range === 'hour') {
    return Array.from({ length: 60 }, (_, i) => ({ label: `${59 - i} min ago`, w: 5.2 + (rand() - 0.5) * 0.5 + Math.sin(i / 7) * 0.12 }));
  }
  if (range === 'day') {
    return Array.from({ length: 24 }, (_, i) => ({
      label: `${String(i).padStart(2, '0')}:00`,
      w: (i < 2 ? 0.3 + i * 2.4 : 4.8 + Math.sin(i / 3) * 0.5) + (rand() - 0.5) * 0.4,
    }));
  }
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((d) => ({ label: d, w: 4.6 + rand() * 0.9 }));
}
