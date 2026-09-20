import type { EnergyContext } from '../lib/energy'
import { Card, CardTitle } from './ui'

const FUELS: { key: keyof EnergyContext['generation']['shares']; label: string; color: string }[] = [
  { key: 'nuclear', label: 'Nuclear', color: '#10281B' },
  { key: 'wind', label: 'Wind', color: '#2E8FA3' },
  { key: 'hydro', label: 'Hydro', color: '#5FB8C9' },
  { key: 'solar', label: 'Solar', color: '#b8842f' },
  { key: 'gas', label: 'Gas', color: '#8b9a91' },
  { key: 'coal', label: 'Coal', color: '#5b6b62' },
  { key: 'oil', label: 'Oil', color: '#a9b4ad' },
  { key: 'waste', label: 'Waste', color: '#c9d1cb' },
  { key: 'other', label: 'Other', color: '#dfe5e1' },
]

/** In-state generation mix behind the electricity the mitigation system draws. */
export default function GridMix({ energy }: { energy: EnergyContext }) {
  const shares = energy.generation.shares
  const list = FUELS.filter((f) => shares[f.key] >= 0.005)
  return (
    <Card>
      <CardTitle>What powers the mitigation</CardTitle>
      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[13rem_1fr] lg:items-center">
        <div>
          <div className="font-mono text-5xl font-medium tracking-tight text-[color:var(--text-h)]">{Math.round(energy.carbonFreeShare * 100)}%</div>
          <p className="mt-1 text-sm text-[color:var(--text-dim)]">of {energy.state} generation is nuclear, hydro, wind or solar ({energy.generation.year})</p>
        </div>
        <div>
          <div className="flex h-4 overflow-hidden rounded-full bg-white/50" role="img" aria-label={`${energy.state} generation mix: ${list.map((f) => `${f.label} ${Math.round(shares[f.key] * 100)} percent`).join(', ')}`}>
            {list.map((f) => <span key={f.key} title={`${f.label} ${(shares[f.key] * 100).toFixed(1)}%`} style={{ width: `${shares[f.key] * 100}%`, background: f.color }} />)}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[color:var(--text-dim)]">
            {list.map((f) => (
              <li key={f.key} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: f.color }} />
                {f.label} <span className="font-mono text-[color:var(--text)]">{(shares[f.key] * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[color:var(--text-dim)]">
        Source: EIA-923 via PUDL. This is in-state generation ({energy.generation.totalTwh} TWh), not what a specific utility delivers to the facility, so it describes the
        grid the mitigation draws from rather than its exact emissions.
      </p>
    </Card>
  )
}
