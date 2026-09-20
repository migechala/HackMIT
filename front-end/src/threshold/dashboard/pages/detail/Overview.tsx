import { useMemo, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import type { DetailContext } from './DatacenterDetail'
import { generateSpectrum, generatePowerHistory } from '../../lib/mockData'
import { Card, CardTitle, StatusCard, Toggle, StatRow, Badge, Pill, CHART } from '../../components/ui'
import { priceFor } from '../../lib/energy'

const tooltipStyle = { background: CHART.tooltipBg, border: `1px solid ${CHART.tooltipBorder}`, borderRadius: 12, fontSize: 12, boxShadow: '0 12px 30px -14px rgba(16,40,27,0.35)' }

export default function Overview() {
  const { dc, metrics, setAncActive } = useOutletContext<DetailContext>()
  const [captured, setCaptured] = useState(false)
  const [range, setRange] = useState<'hour' | 'day' | 'week'>('day')

  const spectrum = useMemo(
    () => generateSpectrum(dc!.dominantFrequencyHz, metrics.ancActive, metrics.attenuationDb),
    [dc, metrics.ancActive, metrics.attenuationDb],
  )
  const powerHistory = useMemo(() => generatePowerHistory(range, metrics.powerW), [range, metrics.powerW])
  const peak = spectrum.reduce((a, b) => (b.baseline > a.baseline ? b : a), spectrum[0])

  const withinThreshold = metrics.residualDbA <= dc!.baselineDbA

  function handleCapture() {
    setCaptured(true)
    setTimeout(() => setCaptured(false), 2200)
  }

  return (
    <div className="space-y-4">
      {/* The result: one large number, with the supporting readouts beside it */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <div className="flex min-h-[15rem] flex-col justify-between rounded-[20px] bg-[color:var(--ink)] p-6 text-white shadow-[0_28px_50px_-28px_rgba(16,40,27,0.75)]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-white/60">Noise reduction</span>
            <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-white/75">{metrics.ancActive ? 'ANC active' : 'ANC disabled'}</span>
          </div>
          <div className="font-mono text-[clamp(4.5rem,8.5vw,7rem)] font-medium leading-none tracking-tighter tabular-nums">
            {metrics.attenuationDb.toFixed(1)}
            <span className="ml-2 font-sans text-2xl font-normal tracking-normal text-white/55">dB</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/60">
            The {dc?.dominantFrequencyHz} Hz tone drops from {dc?.baselineDbA.toFixed(1)} to {metrics.residualDbA.toFixed(1)} dBA at the fence line.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatusCard label="ANC status" value={metrics.ancActive ? 'Active' : 'Disabled'} tone={metrics.ancActive ? 'good' : 'bad'} />
          <StatusCard label="Residual noise" value={metrics.residualDbA.toFixed(1)} unit="dBA" />
          <StatusCard label="System power" value={metrics.powerW.toFixed(1)} unit="W" />
          <StatusCard
            label="Threshold status"
            value={withinThreshold ? 'Below limit' : 'At limit'}
            tone={withinThreshold ? 'good' : 'warn'}
            sub={dc?.status === 'exceedance' ? 'See the financial tab for compliance' : undefined}
          />
        </div>
      </div>

      {/* Spectrum (largest element) beside the cancellation table */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Live noise spectrum</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCapture}
                className="glass-strong whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold text-[color:var(--text)] transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                {captured ? 'Baseline captured' : 'Capture New Baseline'}
              </button>
              <Toggle checked={metrics.ancActive} onChange={setAncActive} labelOn="ANC On" labelOff="ANC Off" />
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <Pill label="Baseline peak" value={`${dc!.baselineDbA.toFixed(1)} dBA`} />
            <Pill label="Current" value={`${metrics.residualDbA.toFixed(1)} dBA`} />
            <Pill label="Range" value="20-500 Hz" />
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spectrum} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="freq" stroke={CHART.axis} tick={{ fontSize: 11 }} interval={11} label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -2, fill: CHART.axis, fontSize: 11 }} />
                <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} label={{ value: 'dB', angle: -90, position: 'insideLeft', fill: CHART.axis, fontSize: 11 }} domain={[0, 70]} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `${v} Hz`} />
                <Line type="monotone" dataKey="baseline" name="Baseline (ANC off)" stroke={CHART.baseline} strokeWidth={1.5} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
                <Line type="monotone" dataKey="anc" name="Current (ANC on)" stroke={CHART.ink} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#ffffff', stroke: CHART.ink, strokeWidth: 2 }} isAnimationActive={false} />
                <ReferenceDot x={peak.freq} y={peak.baseline} r={5} fill={CHART.warn} stroke="none" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[color:var(--text-dim)]">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[color:var(--text-dim)]" /> Baseline, ANC off</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[color:var(--ink)]" /> Current, ANC on</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[color:var(--warn)]" /> Dominant tone, {dc?.dominantFrequencyHz} Hz</span>
          </div>
        </Card>

        <Card>
          <CardTitle>Cancellation performance</CardTitle>
          <StatRow label="Dominant frequency" value={`${dc?.dominantFrequencyHz} Hz`} />
          <StatRow label="Cancellation frequency" value={`${dc?.dominantFrequencyHz} Hz`} />
          <StatRow label="Phase adjustment" value={`${metrics.phaseAdjustmentDeg}°`} />
          <StatRow label="Baseline level" value={`${dc?.baselineDbA.toFixed(1)} dBA`} />
          <StatRow label="Residual level" value={`${metrics.residualDbA.toFixed(1)} dBA`} />
          <StatRow label="Attenuation achieved" value={`${metrics.attenuationDb.toFixed(1)} dB`} />
          <StatRow label="ANC status" value={<Badge tone={metrics.ancActive ? 'good' : 'bad'}>{metrics.ancActive ? 'Active' : 'Inactive'}</Badge>} />
        </Card>
      </div>

      {/* Energy transparency: readouts on the left, history on the right */}
      <Card>
        <CardTitle
          right={
            <Link to="../financial" className="text-xs font-semibold text-[color:var(--accent)] hover:underline">
              Full financial impact &rarr;
            </Link>
          }
        >
          Energy transparency
        </CardTitle>
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[19rem_1fr]">
          <div>
            <StatRow label="Current power" value={`${metrics.powerW.toFixed(1)} W`} />
            <StatRow label="Energy used today" value={`${(metrics.energyTodayWh / 1000).toFixed(2)} kWh`} />
            <StatRow label="Est. daily operating cost" value={`$${((metrics.powerW / 1000) * 24 * priceFor(dc!.id)).toFixed(2)}`} />
            <StatRow label="Noise-reduction efficiency" value={`${(metrics.attenuationDb / Math.max(metrics.powerW, 0.1)).toFixed(2)} dB/W`} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium text-[color:var(--text-dim)]">Historical power</span>
              <div className="flex gap-1 rounded-full bg-white/50 p-0.5">
                {(['hour', 'day', 'week'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors duration-150 ${
                      range === r ? 'bg-[color:var(--ink)] text-white' : 'text-[color:var(--text-dim)] hover:text-[color:var(--text)]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[170px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={powerHistory} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke={CHART.axis} tick={{ fontSize: 10 }} />
                  <YAxis stroke={CHART.axis} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="watts" stroke={CHART.accent2} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
