import pudl from './pudlSummary.json'

export type EnergyContext = {
  /** $/kWh, state average industrial retail price (EIA-861 via PUDL) */
  pricePerKwh: number
  year: number
  state: string
  carbonFreeShare: number
  generation: (typeof pudl.sites)[number]['generation']
  source: string
}

const FALLBACK_PRICE = 0.14

/** Real state electricity price and grid mix for a facility, with the old $0.14 as a labeled fallback. */
export function getEnergyContext(dcId: string): EnergyContext | null {
  const s = pudl.sites.find((x) => x.id === dcId)
  if (!s) return null
  return {
    pricePerKwh: s.latest.industrialCentsKwh / 100,
    year: s.latest.year,
    state: s.state,
    carbonFreeShare: s.generation.carbonFreeShare,
    generation: s.generation,
    source: pudl.source,
  }
}

export const priceFor = (dcId: string) => getEnergyContext(dcId)?.pricePerKwh ?? FALLBACK_PRICE
