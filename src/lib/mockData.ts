export type JurisdictionId = 'pwc-va' | 'divide-nd' | 'pennfuture-pa' | 'washtenaw-mi'

export interface JurisdictionProfile {
  id: JurisdictionId
  name: string
  region: string
  dayThreshold: number
  nightThreshold: number
  dayStart: number // hour, 0-23
  nightStart: number // hour, 0-23
  source: string
}

export const JURISDICTIONS: Record<JurisdictionId, JurisdictionProfile> = {
  'pwc-va': {
    id: 'pwc-va',
    name: 'Prince William County, VA',
    region: 'Northern Virginia "Data Center Alley"',
    dayThreshold: 60,
    nightThreshold: 55,
    dayStart: 7,
    nightStart: 22,
    source: 'PWC Noise Ordinance, Ch. 21 — industrial/commercial abutting residential',
  },
  'divide-nd': {
    id: 'divide-nd',
    name: 'Divide County, ND',
    region: 'Rural Bakken-adjacent siting corridor',
    dayThreshold: 65,
    nightThreshold: 50,
    dayStart: 6,
    nightStart: 21,
    source: 'Divide County zoning & nuisance-noise ordinance',
  },
  'pennfuture-pa': {
    id: 'pennfuture-pa',
    name: 'PennFuture Model Ordinance, PA',
    region: 'Commonwealth of Pennsylvania (model draft)',
    dayThreshold: 58,
    nightThreshold: 48,
    dayStart: 7,
    nightStart: 21,
    source: 'PennFuture model noise ordinance for large energy loads',
  },
  'washtenaw-mi': {
    id: 'washtenaw-mi',
    name: 'Washtenaw County, MI',
    region: 'Southeast Michigan',
    dayThreshold: 62,
    nightThreshold: 53,
    dayStart: 7,
    nightStart: 22,
    source: 'Washtenaw County noise & nuisance code',
  },
}

export interface Datacenter {
  id: string
  name: string
  operator: string
  city: string
  state: string
  jurisdiction: JurisdictionId
  capacityMW: number
  installedDevices: number
  dominantFrequencyHz: number
  baselineDbA: number
  status: 'nominal' | 'watch' | 'exceedance'
  installedDate: string
  litigationNote?: string
}

export const DATACENTERS: Datacenter[] = [
  {
    id: 'dc-manassas-01',
    name: 'Manassas North Campus',
    operator: 'Helion Cloud Infrastructure',
    city: 'Manassas',
    state: 'VA',
    jurisdiction: 'pwc-va',
    capacityMW: 48,
    installedDevices: 6,
    dominantFrequencyHz: 120,
    baselineDbA: 66.6,
    status: 'watch',
    installedDate: '2025-11-03',
    litigationNote: 'Named in active resident noise complaint, filed 2025',
  },
  {
    id: 'dc-divide-02',
    name: 'Divide County Facility B',
    operator: 'Northline Data Partners',
    city: 'Crosby',
    state: 'ND',
    jurisdiction: 'divide-nd',
    capacityMW: 32,
    installedDevices: 4,
    dominantFrequencyHz: 100,
    baselineDbA: 61.2,
    status: 'nominal',
    installedDate: '2026-01-14',
  },
  {
    id: 'dc-scranton-03',
    name: 'Scranton Ridge Facility',
    operator: 'Helion Cloud Infrastructure',
    city: 'Scranton',
    state: 'PA',
    jurisdiction: 'pennfuture-pa',
    capacityMW: 60,
    installedDevices: 8,
    dominantFrequencyHz: 120,
    baselineDbA: 68.1,
    status: 'exceedance',
    installedDate: '2025-08-22',
    litigationNote: 'Consent decree pending — county v. operator',
  },
  {
    id: 'dc-ypsi-04',
    name: 'Ypsilanti East Annex',
    operator: 'Meridian Compute',
    city: 'Ypsilanti',
    state: 'MI',
    jurisdiction: 'washtenaw-mi',
    capacityMW: 21,
    installedDevices: 3,
    dominantFrequencyHz: 60,
    baselineDbA: 63.4,
    status: 'nominal',
    installedDate: '2026-02-27',
  },
]

export function getDatacenter(id: string): Datacenter | undefined {
  return DATACENTERS.find((d) => d.id === id)
}

// ---------- Spectrum simulation ----------

export interface SpectrumPoint {
  freq: number
  baseline: number
  anc: number
}

function noise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function generateSpectrum(dominantFreq: number, ancOn: boolean, attenuationDb: number): SpectrumPoint[] {
  const points: SpectrumPoint[] = []
  for (let f = 20; f <= 500; f += 4) {
    const distFromTone = Math.abs(f - dominantFreq)
    const toneWidth = 6
    const toneBump = 26 * Math.exp(-(distFromTone * distFromTone) / (2 * toneWidth * toneWidth))
    const harmonic = Math.abs(f - dominantFreq * 2) < 8 ? 10 * Math.exp(-Math.pow(f - dominantFreq * 2, 2) / 40) : 0
    const broadband = 34 - 0.025 * f + noise(f) * 2.2
    const baseline = broadband + toneBump + harmonic
    let anc = baseline
    if (ancOn) {
      const cancelWidth = 5
      const cancelDepth = attenuationDb * Math.exp(-(distFromTone * distFromTone) / (2 * cancelWidth * cancelWidth))
      anc = baseline - cancelDepth
    }
    points.push({ freq: f, baseline: Math.round(baseline * 10) / 10, anc: Math.round(anc * 10) / 10 })
  }
  return points
}

// ---------- Power / history simulation ----------

export interface PowerPoint {
  label: string
  watts: number
}

export function generatePowerHistory(range: 'hour' | 'day' | 'week', basePower: number): PowerPoint[] {
  const points: PowerPoint[] = []
  if (range === 'hour') {
    for (let m = 0; m < 60; m += 5) {
      points.push({ label: `:${m.toString().padStart(2, '0')}`, watts: Math.round((basePower + (noise(m) - 0.5) * 0.8) * 10) / 10 })
    }
  } else if (range === 'day') {
    for (let h = 0; h < 24; h++) {
      const loadFactor = h >= 8 && h <= 20 ? 1.15 : 0.85
      points.push({ label: `${h}:00`, watts: Math.round(basePower * loadFactor * (0.95 + noise(h) * 0.1) * 10) / 10 })
    }
  } else {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for (let i = 0; i < 7; i++) {
      const weekend = i >= 5 ? 0.9 : 1.05
      points.push({ label: days[i], watts: Math.round(basePower * weekend * (0.95 + noise(i * 3) * 0.1) * 10) / 10 })
    }
  }
  return points
}

// ---------- Compliance ----------

export interface CompliancePoint {
  hour: number
  label: string
  baseline: number
  measured: number
  threshold: number
  exceeded: boolean
}

export function applicableThreshold(j: JurisdictionProfile, hour: number): { value: number; period: 'Day' | 'Night' } {
  const isDay = hour >= j.dayStart && hour < j.nightStart
  return isDay ? { value: j.dayThreshold, period: 'Day' } : { value: j.nightThreshold, period: 'Night' }
}

export function generateComplianceHistory(dc: Datacenter, j: JurisdictionProfile, attenuationDb: number): CompliancePoint[] {
  const points: CompliancePoint[] = []
  for (let h = 0; h < 24; h++) {
    const baseline = Math.round((dc.baselineDbA + (noise(h * 2.3) - 0.5) * 2.5) * 10) / 10
    const measured = Math.round((baseline - attenuationDb) * 10) / 10
    const { value: threshold } = applicableThreshold(j, h)
    points.push({
      hour: h,
      label: `${h}:00`,
      baseline,
      measured,
      threshold,
      exceeded: measured > threshold,
    })
  }
  return points
}

// ---------- Site intelligence ----------

export interface Candidate {
  id: string
  name: string
  state: string
  communityImpact: number // 0-100, lower is better (less impact)
  gridReadiness: number // 0-100, higher is better
  waterStress: number // 0-100, lower is better
  habitatImpact: number // 0-100, lower is better
  ambientNoise: number // 0-100, lower is better
  brownfield: number // 0-100, higher is better (existing industrial/brownfield)
  fiberProximity: number // 0-100, higher is better
  residentialDistanceMiles: number
}

export const CANDIDATES: Candidate[] = [
  {
    id: 'site-a',
    name: 'Existing Industrial Zone A',
    state: 'OH',
    communityImpact: 18,
    gridReadiness: 88,
    waterStress: 22,
    habitatImpact: 15,
    ambientNoise: 62,
    brownfield: 90,
    fiberProximity: 80,
    residentialDistanceMiles: 3.1,
  },
  {
    id: 'site-b',
    name: 'Brownfield Zone B',
    state: 'PA',
    communityImpact: 24,
    gridReadiness: 68,
    waterStress: 30,
    habitatImpact: 20,
    ambientNoise: 55,
    brownfield: 95,
    fiberProximity: 60,
    residentialDistanceMiles: 2.4,
  },
  {
    id: 'site-c',
    name: 'Rural Parcel C',
    state: 'ND',
    communityImpact: 62,
    gridReadiness: 74,
    waterStress: 48,
    habitatImpact: 70,
    ambientNoise: 20,
    brownfield: 10,
    fiberProximity: 25,
    residentialDistanceMiles: 8.7,
  },
  {
    id: 'site-d',
    name: 'Suburban Fringe Parcel D',
    state: 'VA',
    communityImpact: 70,
    gridReadiness: 82,
    waterStress: 35,
    habitatImpact: 30,
    ambientNoise: 58,
    brownfield: 40,
    fiberProximity: 90,
    residentialDistanceMiles: 1.2,
  },
]

export interface WeightConfig {
  residentialDistance: number
  landUse: number
  gridPower: number
  waterStress: number
  habitat: number
  ambientNoise: number
  fiber: number
}

export const DEFAULT_WEIGHTS: WeightConfig = {
  residentialDistance: 25,
  landUse: 20,
  gridPower: 15,
  waterStress: 15,
  habitat: 10,
  ambientNoise: 10,
  fiber: 5,
}

export function scoreCandidate(c: Candidate, w: WeightConfig) {
  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0) || 1
  const residentialScore = Math.min(100, (c.residentialDistanceMiles / 10) * 100)
  const landUseScore = c.brownfield
  const gridScore = c.gridReadiness
  const waterScore = 100 - c.waterStress
  const habitatScore = 100 - c.habitatImpact
  const noiseScore = 100 - c.ambientNoise
  const fiberScore = c.fiberProximity

  const weighted =
    (residentialScore * w.residentialDistance +
      landUseScore * w.landUse +
      gridScore * w.gridPower +
      waterScore * w.waterStress +
      habitatScore * w.habitat +
      noiseScore * w.ambientNoise +
      fiberScore * w.fiber) /
    totalWeight

  return Math.round(weighted)
}

export function impactLabel(score: number, invert = false): 'Low' | 'Medium' | 'High' {
  const s = invert ? 100 - score : score
  if (s < 35) return 'Low'
  if (s < 65) return 'Medium'
  return 'High'
}
