import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DetailContext } from './DatacenterDetail'
import { generatePowerHistory } from '../../lib/mockData'
import { Card, CardTitle, StatusCard, StatRow } from '../../components/ui'

const ENERGY_PRICE_PER_KWH = 0.14 // $/kWh assumption

export default function Financial() {
  const { dc, metrics } = useOutletContext<DetailContext>()
  const [range, setRange] = useState<'hour' | 'day' | 'week'>('week')

  const powerHistory = useMemo(() => generatePowerHistory(range, metrics.powerW), [range, metrics.powerW])

  const currentCostPerHour = (metrics.powerW / 1000) * ENERGY_PRICE_PER_KWH
  const dailyCost = currentCostPerHour * 24
  const monthlyCost = dailyCost * 30
  const dbHoursPerDay = metrics.attenuationDb * 24
  const costPerDbHour = dbHoursPerDay > 0 ? dailyCost / dbHoursPerDay : 0

  // Stretch: avoided mitigation cost — modeled against typical passive/structural retrofit costs
  // industry-reported range for large-facility acoustic enclosures/barriers, not a measured figure.
  const avoidedMitigationLow = dc!.capacityMW * 4200
  const avoidedMitigationHigh = dc!.capacityMW * 9800

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatusCard label="Current operating cost" value={`$${currentCostPerHour.toFixed(3)}`} unit="/hr" />
        <StatusCard label="Estimated daily cost" value={`$${dailyCost.toFixed(2)}`} tone="good" emphasize />
        <StatusCard label="Estimated monthly cost" value={`$${monthlyCost.toFixed(0)}`} />
        <StatusCard label="Energy price assumption" value={`$${ENERGY_PRICE_PER_KWH.toFixed(2)}`} unit="/kWh" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Cost of quiet operation</CardTitle>
          <StatRow label="System power draw" value={`${metrics.powerW.toFixed(1)} W`} />
          <StatRow label="Energy used today" value={`${(metrics.energyTodayWh / 1000).toFixed(2)} kWh`} />
          <StatRow label="Noise reduction delivered" value={`${metrics.attenuationDb.toFixed(1)} dB`} />
          <StatRow label="Cost per decibel-hour reduced" value={`$${costPerDbHour.toFixed(4)}`} />
          <StatRow label="Energy price assumption" value={`$${ENERGY_PRICE_PER_KWH.toFixed(2)} / kWh (regional industrial avg.)`} />
          <p className="mt-4 text-xs leading-relaxed text-[color:var(--text-dim)]">
            The ANC enclosure draws a small, near-constant load to cancel a continuous tonal
            source &mdash; unlike passive mitigation (structural enclosures, berms, barrier walls),
            which carries a large one-time capital cost but near-zero marginal energy cost.
          </p>
        </Card>

        <Card className="border-[color:var(--accent-2)]/25">
          <CardTitle>Projected avoided mitigation cost <span className="ml-2 rounded-full bg-[color:var(--accent-2)]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--accent-2)]">Stretch estimate</span></CardTitle>
          <p className="text-sm text-[color:var(--text-dim)]">
            Estimated capital cost of an equivalent passive-only mitigation retrofit (acoustic
            enclosure, barrier wall, structural damping) for a facility this size, modeled from
            industry-reported per-MW retrofit ranges &mdash; not a quote or measured figure.
          </p>
          <div className="mt-4 flex items-end gap-3">
            <div className="text-3xl font-bold text-[color:var(--accent-2)]">
              ${(avoidedMitigationLow / 1000).toFixed(0)}k&ndash;${(avoidedMitigationHigh / 1000).toFixed(0)}k
            </div>
            <div className="pb-1 text-xs text-[color:var(--text-dim)]">one-time, vs. ANC's ~${(monthlyCost * 12).toFixed(0)}/yr operating cost</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Historical power draw</CardTitle>
          <div className="flex gap-1">
            {(['hour', 'day', 'week'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  range === r ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent)]' : 'text-[color:var(--text-dim)] hover:text-[color:var(--text)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={powerHistory} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="powerFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f8dff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#4f8dff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1c2942" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#7e8bab" tick={{ fontSize: 11 }} />
              <YAxis stroke="#7e8bab" tick={{ fontSize: 11 }} label={{ value: 'Watts', angle: -90, position: 'insideLeft', fill: '#7e8bab', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1c2942', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="watts" stroke="#4f8dff" strokeWidth={2} fill="url(#powerFill)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
