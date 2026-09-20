/** Illustrative candidate data for the Site Intelligence demo. These are not real parcels. */

export type FactorId = 'residential' | 'land' | 'grid' | 'water' | 'wildlife' | 'noise' | 'fiber';

export interface Factor { id: FactorId; label: string; short: string; default: number; color: string }

export const FACTORS: Factor[] = [
  { id: 'residential', label: 'Distance from residential communities', short: 'Residential distance', default: 25, color: '#1F3D2B' },
  { id: 'land', label: 'Existing land use / brownfield status', short: 'Land use', default: 20, color: '#3D6B4A' },
  { id: 'grid', label: 'Grid and power availability', short: 'Grid & power', default: 15, color: '#5FB8C9' },
  { id: 'water', label: 'Water stress', short: 'Water stress', default: 15, color: '#7FAEDD' },
  { id: 'wildlife', label: 'Wildlife and habitat sensitivity', short: 'Wildlife & habitat', default: 10, color: '#8DBF76' },
  { id: 'noise', label: 'Existing ambient noise', short: 'Ambient noise', default: 10, color: '#A9B39F' },
  { id: 'fiber', label: 'Proximity to fiber infrastructure', short: 'Fiber proximity', default: 5, color: '#C9CFC0' },
];

export type Weights = Record<FactorId, number>;
export const DEFAULT_WEIGHTS = Object.fromEntries(FACTORS.map((f) => [f.id, f.default])) as Weights;

export const PRESETS: { id: string; label: string; note: string; weights: Weights }[] = [
  { id: 'default', label: 'Balanced (default)', note: 'The starting weights.', weights: DEFAULT_WEIGHTS },
  {
    id: 'ai', label: 'AI-training facility', note: 'Prioritizes power and fiber.',
    weights: { residential: 15, land: 15, grid: 30, water: 10, wildlife: 10, noise: 10, fiber: 10 },
  },
  {
    id: 'board', label: 'Community review board', note: 'Prioritizes residents and water.',
    weights: { residential: 30, land: 10, grid: 5, water: 20, wildlife: 15, noise: 15, fiber: 5 },
  },
];

/** Sub-scores 0–100 per factor; higher = lower disruption / better fit. */
export interface Candidate { name: string; scores: Record<FactorId, number> }

export const CANDIDATES: Candidate[] = [
  { name: 'Existing industrial zone A', scores: { residential: 88, land: 95, grid: 85, water: 88, wildlife: 82, noise: 75, fiber: 90 } },
  { name: 'Brownfield zone B', scores: { residential: 84, land: 90, grid: 68, water: 84, wildlife: 80, noise: 72, fiber: 76 } },
  { name: 'Rural parcel C', scores: { residential: 42, land: 60, grid: 95, water: 70, wildlife: 40, noise: 62, fiber: 90 } },
];

export type Level = 'Low' | 'Medium' | 'High';

// Labels are derived from the factor sub-scores (see thresholds below), not hard-coded.
export const communityImpact = (c: Candidate): Level => (c.scores.residential >= 70 ? 'Low' : c.scores.residential >= 50 ? 'Medium' : 'High');
export const gridReadiness = (c: Candidate): Level => (c.scores.grid >= 80 ? 'High' : c.scores.grid >= 55 ? 'Medium' : 'Low');
export const waterStress = (c: Candidate): Level => (c.scores.water >= 75 ? 'Low' : c.scores.water >= 50 ? 'Medium' : 'High');
export const habitatImpact = (c: Candidate): Level => (c.scores.wildlife >= 70 ? 'Low' : c.scores.wildlife >= 50 ? 'Medium' : 'High');

/** Normalizes raw slider values so effective weights always sum to 100%. */
export function effectiveWeights(w: Weights): Weights {
  const sum = FACTORS.reduce((a, f) => a + w[f.id], 0);
  return Object.fromEntries(FACTORS.map((f) => [f.id, sum === 0 ? 100 / FACTORS.length : (w[f.id] / sum) * 100])) as Weights;
}

export function scoreCandidate(c: Candidate, w: Weights) {
  const e = effectiveWeights(w);
  const parts = FACTORS.map((f) => ({ id: f.id, value: (c.scores[f.id] * e[f.id]) / 100 }));
  return { total: parts.reduce((a, p) => a + p.value, 0), parts };
}
