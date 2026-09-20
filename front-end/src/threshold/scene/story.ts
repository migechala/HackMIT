import { CatmullRomCurve3, Vector3 } from 'three';

/**
 * Story timeline. Every visual in the scene is a pure function of `story.progress` (0..1),
 * which is written by GSAP ScrollTrigger (scrub). Nothing here runs on its own clock.
 */

export const story = {
  progress: 0,
  listeners: new Set<(p: number) => void>(),
};

export function setProgress(p: number) {
  story.progress = p;
  story.listeners.forEach((l) => l(p));
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const sstep2 = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/* ---------------------------------------------------------------- rotation */

export const ROT_START = -0.55;
export const ROT_END = 0.62 + Math.PI * 1.5; // resting three-quarter view: about 340° of total rotation, less than one full turn

function omega(p: number) {
  let w = lerp(2.0, 0.05, sstep(0.2, 0.3, p)); // deer entry: rotation slows almost to a stop
  w = lerp(w, 0.55, sstep(0.4, 0.47, p)); // disintegration begins: rotation picks back up
  return w * (1 - sstep(0.8, 1.0, p)); // settle to rest
}

const ROT_N = 1200;
const rotTable = new Float64Array(ROT_N + 1);
for (let i = 1; i <= ROT_N; i++) rotTable[i] = rotTable[i - 1] + omega((i - 0.5) / ROT_N) / ROT_N;

/** Model yaw (radians) — bound 1:1 to scroll progress, including during disintegration/reassembly. */
export function rotationAt(p: number) {
  const f = clamp01(p) * ROT_N;
  const i = Math.min(ROT_N - 1, Math.floor(f));
  const om = lerp(rotTable[i], rotTable[i + 1], f - i) / rotTable[ROT_N];
  return ROT_START + (ROT_END - ROT_START) * om;
}

/* --------------------------------------------------------- noise / vibration */

/** Amplitude of the "noisy state" signal (vibration, rings, camera jitter). */
export const vibrationAt = (p: number) => sstep(0.24, 0.32, p) * (1 - sstep(0.5, 0.62, p));

/** 0 = neutral/anxious lights, 1 = calm green-cyan pulse. */
export const calmAt = (p: number) => sstep(0.66, 0.78, p);

/* -------------------------------------------------------------------- deer */

const P = (x: number, z: number) => new Vector3(x, 0, z);
export const DEER_PATH_POINTS = [
  P(-27, 7.4), P(-19.5, 7.0), P(-14, 6.8), P(-10.8, 6.7),
  P(-9.3, 7.8), // veers slightly while hesitating
  P(-8, 6.9), P(-3.5, 5.8), P(2.5, 5.6), P(8.5, 6.4),
  P(11.6, 7.7), P(10.7, 9.3), P(8.2, 8.6),
];
export const deerCurve = new CatmullRomCurve3(DEER_PATH_POINTS, false, 'centripetal');
export const DEER_LENGTH = deerCurve.getLength();

function deerSpeed(p: number) {
  if (p < 0.2) return 0;
  let v = sstep(0.2, 0.225, p);
  v *= lerp(1, 0.08, sstep(0.3, 0.355, p)); // hesitates as it nears the structure
  v = lerp(v, sstep(0.2, 0.225, p), sstep(0.395, 0.44, p)); // then walks through
  v *= 1 - sstep(0.66, 0.8, p); // settles down to graze
  return v;
}
const DEER_N = 1200;
const deerTable = new Float64Array(DEER_N + 1);
for (let i = 1; i <= DEER_N; i++) deerTable[i] = deerTable[i - 1] + deerSpeed((i - 0.5) / DEER_N) / DEER_N;

const _pos = new Vector3();
const _tan = new Vector3();

export interface DeerState {
  x: number; z: number; heading: number;
  /** distance walked along the path in metres — drives the gait so legs reverse with scroll */
  walked: number;
  /** 0..1 how fast it is moving (leg swing amplitude) */
  speed: number;
  visible: boolean;
  alert: number; // head-up hesitation
  graze: number; // head-down calm
}

export function deerAt(p: number): DeerState {
  const f = clamp01(p) * DEER_N;
  const i = Math.min(DEER_N - 1, Math.floor(f));
  const u = lerp(deerTable[i], deerTable[i + 1], f - i) / deerTable[DEER_N];
  deerCurve.getPointAt(clamp01(u), _pos);
  deerCurve.getTangentAt(clamp01(u), _tan);
  const speed = clamp01(deerSpeed(p) * 1.15);
  return {
    x: _pos.x, z: _pos.z,
    heading: Math.atan2(-_tan.z, _tan.x),
    walked: u * DEER_LENGTH,
    speed,
    visible: p > 0.005 && u > 0.001,
    alert: sstep(0.3, 0.345, p) * (1 - sstep(0.4, 0.44, p)),
    graze: sstep(0.84, 0.9, p),
  };
}

/* ------------------------------------------------------------------ camera */

export interface CamKey { p: number; az: number; el: number; dist: number; tx: number; ty: number; tz: number; follow: number }
export const CAM_KEYS: CamKey[] = [
  { p: 0,    az: 38, el: 30, dist: 31, tx: 0,   ty: 1.2, tz: 0,   follow: 0 },
  { p: 0.2,  az: 40, el: 30, dist: 31, tx: 0,   ty: 1.2, tz: 0.5, follow: 0 },
  { p: 0.3,  az: 32, el: 25, dist: 34, tx: 2.5, ty: 1.0, tz: 2,   follow: 0.2 },
  { p: 0.4,  az: 26, el: 22, dist: 33, tx: 2.5, ty: 1.0, tz: 2.5, follow: 0.2 },
  { p: 0.55, az: 33, el: 27, dist: 31, tx: 1.5, ty: 1.2, tz: 2.5, follow: 0.25 },
  { p: 0.75, az: 42, el: 27, dist: 31, tx: 2,   ty: 1.0, tz: 3.5, follow: 0 },
  { p: 1,    az: 46, el: 24, dist: 26, tx: 3.5, ty: 1.0, tz: 4.5, follow: 0 },
];

/** Cardinal-spline sample (finite-difference tangents) so the camera arc has no velocity kinks. */
export function sampleCam(p: number, field: Exclude<keyof CamKey, 'p'>) {
  const k = CAM_KEYS;
  let i = 0;
  while (i < k.length - 2 && p > k[i + 1].p) i++;
  const a = k[i], b = k[i + 1];
  const pa = k[Math.max(0, i - 1)], pb = k[Math.min(k.length - 1, i + 2)];
  const h = b.p - a.p;
  const t = clamp01((p - a.p) / h);
  const m0 = ((b[field] - pa[field]) / (b.p - pa.p || 1)) * h;
  const m1 = ((pb[field] - a[field]) / (pb.p - a.p || 1)) * h;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a[field] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b[field] + (t3 - t2) * m1;
}

/* -------------------------------------------------------- resting footprint */

/** Is a world-space point inside the data center footprint at its final resting rotation? */
export function insideRestFootprint(x: number, z: number, margin = 0) {
  const th = ROT_END;
  const lx = x * Math.cos(th) - z * Math.sin(th);
  const lz = x * Math.sin(th) + z * Math.cos(th);
  return Math.abs(lx) < 5.9 + margin && Math.abs(lz) < 4.2 + margin;
}
