import { useMemo, useState } from 'react'
import { CANDIDATES, DEFAULT_WEIGHTS, scoreCandidate, impactLabel, type WeightConfig } from '../../lib/mockData'
import { Card, CardTitle, Badge } from '../../components/ui'

const WEIGHT_META: { key: keyof WeightConfig; label: string }[] = [
  { key: 'residentialDistance', label: 'Distance from residential communities' },
  { key: 'landUse', label: 'Existing land use / brownfield status' },
  { key: 'gridPower', label: 'Grid & power availability' },
  { key: 'waterStress', label: 'Water stress' },
  { key: 'habitat', label: 'Wildlife & habitat sensitivity' },
  { key: 'ambientNoise', label: 'Existing ambient noise' },
  { key: 'fiber', label: 'Proximity to fiber infrastructure' },
]

const COOLING_METHODS = ['Air-cooled (CRAC/CRAH)', 'Evaporative / adiabatic', 'Liquid / direct-to-chip', 'Immersion']

function impactTone(label: 'Low' | 'Medium' | 'High'): 'good' | 'warn' | 'bad' {
  return label === 'Low' ? 'good' : label === 'Medium' ? 'warn' : 'bad'
}

export default function SiteIntelligence() {
  const [weights, setWeights] = useState<WeightConfig>(DEFAULT_WEIGHTS)
  const [form, setForm] = useState({
    capacityMW: 50,
    footprintAcres: 120,
    region: 'Mid-Atlantic',
    maxDistanceCityMi: 40,
    powerAvailabilityMW: 60,
    cooling: COOLING_METHODS[0],
    waterDemandMGD: 0.8,
    fiberRequirement: 'Dual dark-fiber path, <2ms to major IX',
    expansionPlans: 'Phase 2 (+30MW) within 3 years',
    noiseSensitivity: 60,
    habitatSensitivity: 40,
  })

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1

  const ranked = useMemo(() => {
    return CANDIDATES.map((c) => ({ c, score: scoreCandidate(c, weights) })).sort((a, b) => b.score - a.score)
  }, [weights])

  function updateWeight(key: keyof WeightConfig, value: number) {
    setWeights((w) => ({ ...w, [key]: value }))
  }

  function applySensitivityPresets() {
    setWeights((w) => ({
      ...w,
      residentialDistance: Math.round(10 + (form.noiseSensitivity / 100) * 35),
      habitat: Math.round(5 + (form.habitatSensitivity / 100) * 25),
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Company inputs</CardTitle>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Required IT capacity (MW)">
            <input type="number" value={form.capacityMW} onChange={(e) => setForm({ ...form, capacityMW: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Estimated facility footprint (acres)">
            <input type="number" value={form.footprintAcres} onChange={(e) => setForm({ ...form, footprintAcres: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Preferred state or region">
            <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Max distance from a major city (mi)">
            <input type="number" value={form.maxDistanceCityMi} onChange={(e) => setForm({ ...form, maxDistanceCityMi: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Required power availability (MW)">
            <input type="number" value={form.powerAvailabilityMW} onChange={(e) => setForm({ ...form, powerAvailabilityMW: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Cooling method">
            <select value={form.cooling} onChange={(e) => setForm({ ...form, cooling: e.target.value })} className={inputCls}>
              {COOLING_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Estimated water demand (MGD)">
            <input type="number" step="0.1" value={form.waterDemandMGD} onChange={(e) => setForm({ ...form, waterDemandMGD: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Latency / fiber requirements">
            <input value={form.fiberRequirement} onChange={(e) => setForm({ ...form, fiberRequirement: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Expansion plans">
            <input value={form.expansionPlans} onChange={(e) => setForm({ ...form, expansionPlans: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label={`Community-noise sensitivity preference — ${form.noiseSensitivity}`}>
            <input type="range" min={0} max={100} value={form.noiseSensitivity} onChange={(e) => setForm({ ...form, noiseSensitivity: +e.target.value })} className="w-full accent-[color:var(--accent)]" />
          </Field>
          <Field label={`Wildlife / ecological sensitivity preference — ${form.habitatSensitivity}`}>
            <input type="range" min={0} max={100} value={form.habitatSensitivity} onChange={(e) => setForm({ ...form, habitatSensitivity: +e.target.value })} className="w-full accent-[color:var(--accent)]" />
          </Field>
        </div>
        <button
          onClick={applySensitivityPresets}
          className="mt-4 rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 px-4 py-2 text-xs font-semibold text-[color:var(--accent)] hover:bg-[color:var(--accent)]/20"
        >
          Apply preferences to disruption-score weights
        </button>
      </Card>

      <Card>
        <CardTitle>Recommended results — top candidate areas</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] text-left text-xs uppercase tracking-wide text-[color:var(--text-dim)]">
                <th className="py-2 pr-4">Candidate</th>
                <th className="py-2 pr-4">Suitability</th>
                <th className="py-2 pr-4">Community impact</th>
                <th className="py-2 pr-4">Grid readiness</th>
                <th className="py-2 pr-4">Water stress</th>
                <th className="py-2 pr-4">Habitat impact</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 3).map(({ c, score }, i) => (
                <tr key={c.id} className="border-b border-[color:var(--border)] last:border-0">
                  <td className="py-3 pr-4 font-semibold text-[color:var(--text-h)]">
                    {i === 0 && <span className="mr-2 text-[color:var(--accent)]">★</span>}
                    {c.name} <span className="text-xs font-normal text-[color:var(--text-dim)]">({c.state})</span>
                  </td>
                  <td className="py-3 pr-4 font-bold text-[color:var(--text-h)]">{score}/100</td>
                  <td className="py-3 pr-4"><Badge tone={impactTone(impactLabel(c.communityImpact))}>{impactLabel(c.communityImpact)}</Badge></td>
                  <td className="py-3 pr-4"><Badge tone={c.gridReadiness >= 65 ? 'good' : c.gridReadiness >= 40 ? 'warn' : 'bad'}>{impactLabel(c.gridReadiness)}</Badge></td>
                  <td className="py-3 pr-4"><Badge tone={impactTone(impactLabel(c.waterStress))}>{impactLabel(c.waterStress)}</Badge></td>
                  <td className="py-3 pr-4"><Badge tone={impactTone(impactLabel(c.habitatImpact))}>{impactLabel(c.habitatImpact)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>Disruption score weights <span className="ml-2 text-xs font-normal normal-case text-[color:var(--text-dim)]">(sums to {totalWeight}%, renormalized live)</span></CardTitle>
        <div className="space-y-4">
          {WEIGHT_META.map((m) => (
            <div key={m.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[color:var(--text-dim)]">{m.label}</span>
                <span className="font-semibold text-[color:var(--text-h)]">{weights[m.key]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={weights[m.key]}
                onChange={(e) => updateWeight(m.key, +e.target.value)}
                className="w-full accent-[color:var(--accent)]"
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[color:var(--text-dim)]">
          Defaults reflect a balanced siting review (25% residential distance, 20% land use, 15%
          grid, 15% water, 10% habitat, 10% ambient noise, 5% fiber). An AI-training operator might
          weight grid power more heavily; a community review board might weight residential
          distance and water stress more heavily. Adjust and the candidates above re-rank live.
        </p>
      </Card>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-elev-2)] px-3 py-2 text-sm text-[color:var(--text-h)] outline-none focus:border-[color:var(--accent)]/50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[color:var(--text-dim)]">{label}</span>
      {children}
    </label>
  )
}
