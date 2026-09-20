import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { DetailContext } from './DatacenterDetail'
import { JURISDICTIONS, applicableThreshold, generatePowerHistory, generateComplianceHistory } from '../../lib/mockData'
import { Card, CardTitle, StatusCard, StatRow, Badge, CHART } from '../../components/ui'
import ClockCard from '../../components/ClockCard'
import GridMix from '../../components/GridMix'
import { getEnergyContext } from '../../lib/energy'


const tooltipStyle = { background: CHART.tooltipBg, border: `1px solid ${CHART.tooltipBorder}`, borderRadius: 14, fontSize: 12, boxShadow: '0 12px 30px -14px rgba(16,40,27,0.35)' }

export default function FinancialImpact() {
  const { dc, metrics } = useOutletContext<DetailContext>()
  // Real state industrial retail price (EIA-861 via PUDL); the old $0.14 is only a fallback.
  const energy = getEnergyContext(dc!.id)
  const ENERGY_PRICE_PER_KWH = energy?.pricePerKwh ?? 0.14
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

  const j = JURISDICTIONS[dc!.jurisdiction]
  const now = new Date()
  const { value: applicable, period } = applicableThreshold(j, now.getHours())
  const history = useMemo(() => generateComplianceHistory(dc!, j, metrics.attenuationDb), [dc, j, metrics.attenuationDb])
  const exceedanceCount = history.filter((h) => h.exceeded).length
  const margin = applicable - metrics.residualDbA
  const withinThreshold = margin >= 0

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <h2 className="text-lg font-medium tracking-tight text-[color:var(--text-h)]">Cost of quiet operation</h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatusCard label="Current operating cost" value={`$${currentCostPerHour.toFixed(4)}`} unit="/hr" />
          <StatusCard label="Estimated daily cost" value={`$${dailyCost.toFixed(2)}`} tone="good" emphasize />
          <StatusCard label="Estimated monthly cost" value={`$${monthlyCost.toFixed(0)}`} />
          <StatusCard label={energy ? `${energy.state} industrial price` : 'Energy price assumption'} value={`$${ENERGY_PRICE_PER_KWH.toFixed(3)}`} unit="/kWh" sub={energy ? `EIA average, ${energy.year}` : undefined} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Cost of quiet operation</CardTitle>
            <StatRow label="System power draw" value={`${metrics.powerW.toFixed(1)} W`} />
            <StatRow label="Energy used today" value={`${(metrics.energyTodayWh / 1000).toFixed(2)} kWh`} />
            <StatRow label="Noise reduction delivered" value={`${metrics.attenuationDb.toFixed(1)} dB`} />
            <StatRow label="Cost per decibel-hour reduced" value={`${(costPerDbHour * 100).toFixed(4)} cents`} />
            <StatRow label={energy ? 'Electricity price' : 'Energy price assumption'} value={energy ? `$${ENERGY_PRICE_PER_KWH.toFixed(3)} / kWh (${energy.state} industrial avg., ${energy.year})` : `$${ENERGY_PRICE_PER_KWH.toFixed(2)} / kWh`} />
            <p className="mt-4 text-xs leading-relaxed text-[color:var(--text-dim)]">
              The ANC enclosure draws a small, near-constant load to cancel a continuous tonal
              source &mdash; unlike passive mitigation (structural enclosures, berms, barrier walls),
              which carries a large one-time capital cost but near-zero marginal energy cost.
            </p>
          </Card>

          <Card className="border-[color:var(--accent-2)]/25">
            <CardTitle>Projected avoided mitigation cost <span className="ml-2 rounded-full bg-[color:var(--accent-2)]/12 px-2 py-0.5 text-[10px] font-bold text-[color:var(--accent-2)]">Stretch estimate</span></CardTitle>
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

        {energy && <GridMix energy={energy} />}

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Historical power draw</CardTitle>
            <div className="flex gap-1">
              {(['hour', 'day', 'week'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    range === r ? 'bg-[color:var(--ink)] text-white' : 'text-[color:var(--text-dim)] hover:text-[color:var(--text)]'
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
                    <stop offset="0%" stopColor={CHART.accent2} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART.accent2} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={CHART.axis} tick={{ fontSize: 11 }} />
                <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} label={{ value: 'Watts', angle: -90, position: 'insideLeft', fill: CHART.axis, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="watts" stroke={CHART.accent2} strokeWidth={2} fill="url(#powerFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-medium tracking-tight text-[color:var(--text-h)]">Legal compliance monitoring</h2>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,19rem)_1fr]">
        <ClockCard />
        <Card>
          <CardTitle right={<Badge>{j.name}: Configured profile</Badge>}>Legal compliance monitoring</CardTitle>
          <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-3">
            <StatRow label="Day threshold" value={`${j.dayThreshold} dBA`} />
            <StatRow label="Night threshold" value={`${j.nightThreshold} dBA`} />
            <StatRow label="Applicable threshold now" value={`${applicable} dBA (${period})`} />
          </div>
        </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatusCard label="Current estimated level" value={metrics.residualDbA.toFixed(1)} unit="dBA" />
          <StatusCard
            label={withinThreshold ? 'Margin below threshold' : 'Margin over threshold'}
            value={Math.abs(margin).toFixed(1)}
            unit="dB"
            tone={withinThreshold ? 'good' : 'bad'}
            emphasize
          />
          <StatusCard label="Status" value={withinThreshold ? 'Within threshold' : 'Exceedance'} tone={withinThreshold ? 'good' : 'bad'} />
          <StatusCard label="Exceedances (24h)" value={String(exceedanceCount)} tone={exceedanceCount > 0 ? 'warn' : 'good'} />
        </div>

        <Card>
          <CardTitle>Baseline vs. measured level (24h), with applicable threshold</CardTitle>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 44, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={CHART.axis} tick={{ fontSize: 11 }} interval={2} />
                <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} domain={[30, 75]} label={{ value: 'dBA', angle: -90, position: 'insideLeft', fill: CHART.axis, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine y={j.dayThreshold} stroke={CHART.warn} strokeDasharray="4 3" label={{ value: 'Day', fill: CHART.warn, fontSize: 10, position: 'right' }} />
                <ReferenceLine y={j.nightThreshold} stroke={CHART.danger} strokeDasharray="4 3" label={{ value: 'Night', fill: CHART.danger, fontSize: 10, position: 'right' }} />
                <Line type="monotone" dataKey="baseline" name="Baseline (no THRESHOLD)" stroke={CHART.baseline} strokeWidth={1.5} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
                <Line type="monotone" dataKey="measured" name="Measured (with THRESHOLD)" stroke={CHART.accent} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[color:var(--text-dim)]">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[color:var(--text-dim)]" /> Baseline, no THRESHOLD</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[color:var(--accent)]" /> Measured, with THRESHOLD</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[color:var(--warn)]" /> Day limit</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[color:var(--danger)]" /> Night limit</span>
          </div>
        </Card>

        {exceedanceCount > 0 && (
          <Card className="border-[color:var(--danger)]/30 bg-[color:var(--danger)]/6">
            <div className="text-sm font-semibold text-[color:var(--danger)]">Threshold warning</div>
            <p className="mt-1 text-sm text-[color:var(--text-dim)]">
              {exceedanceCount} of the last 24 hourly readings exceeded the applicable jurisdiction
              threshold even with active mitigation. Consider reviewing enclosure capacity or filing
              a proactive disclosure with {j.name.split(',')[0]}.
            </p>
          </Card>
        )}

        <p className="text-xs leading-relaxed text-[color:var(--text-dim)]">
          <strong className="text-[color:var(--text)]">Disclaimer:</strong> Prototype readings are not
          certified compliance measurements. This microphone and pipeline are not calibrated as a
          legally certified sound-level meter under {j.source}. Values shown are for monitoring and
          engineering guidance only.
        </p>
      </section>
    </div>
  )
}
