import { useMemo, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import type { DetailContext } from './DatacenterDetail'
import { generateSpectrum, generatePowerHistory } from '../../lib/mockData'
import { Card, CardTitle, StatusCard, Toggle, StatRow, Badge } from '../../components/ui'

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
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatusCard label="ANC Status" value={metrics.ancActive ? 'Active' : 'Disabled'} tone={metrics.ancActive ? 'good' : 'bad'} />
        <StatusCard label="Noise Reduction" value={metrics.attenuationDb.toFixed(1)} unit="dB" tone="good" emphasize />
        <StatusCard label="Residual Noise" value={metrics.residualDbA.toFixed(1)} unit="dBA" />
        <StatusCard label="System Power" value={metrics.powerW.toFixed(1)} unit="W" />
        <StatusCard
          label="Threshold Status"
          value={withinThreshold ? 'Below limit' : 'At limit'}
          tone={withinThreshold ? 'good' : 'warn'}
          sub={dc?.status === 'exceedance' ? 'See compliance tab' : undefined}
        />
      </div>

      {/* Spectrum - largest element */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Live noise spectrum</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCapture}
              className="rounded-full border border-[color:var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[color:var(--text)] hover:border-[color:var(--text-dim)]"
            >
              {captured ? 'Baseline captured ✓' : 'Capture New Baseline'}
            </button>
            <Toggle checked={metrics.ancActive} onChange={setAncActive} labelOn="ANC On" labelOff="ANC Off" />
          </div>
        </div>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spectrum} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#1c2942" strokeDasharray="3 3" />
              <XAxis dataKey="freq" stroke="#7e8bab" tick={{ fontSize: 11 }} label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -2, fill: '#7e8bab', fontSize: 11 }} />
              <YAxis stroke="#7e8bab" tick={{ fontSize: 11 }} label={{ value: 'dB', angle: -90, position: 'insideLeft', fill: '#7e8bab', fontSize: 11 }} domain={[0, 70]} />
              <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1c2942', borderRadius: 8, fontSize: 12 }} labelFormatter={(v) => `${v} Hz`} />
              <Line type="monotone" dataKey="baseline" name="Baseline (ANC off)" stroke="#7e8bab" strokeWidth={1.5} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
              <Line type="monotone" dataKey="anc" name="Current (ANC on)" stroke="#35e8c4" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <ReferenceDot x={peak.freq} y={peak.baseline} r={5} fill="#f5b94a" stroke="none" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[color:var(--text-dim)]">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[color:var(--text-dim)]" /> Baseline, ANC off</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[color:var(--accent)]" /> Current, ANC on</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[color:var(--warn)]" /> Dominant tone &mdash; {dc?.dominantFrequencyHz} Hz</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cancellation performance */}
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

        {/* Energy transparency */}
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
          <StatRow label="Current power" value={`${metrics.powerW.toFixed(1)} W`} />
          <StatRow label="Energy used today" value={`${(metrics.energyTodayWh / 1000).toFixed(2)} kWh`} />
          <StatRow label="Estimated daily operating cost" value={`$${((metrics.powerW / 1000) * 24 * 0.14).toFixed(2)}`} />
          <StatRow label="Noise-reduction efficiency" value={`${(metrics.attenuationDb / Math.max(metrics.powerW, 0.1)).toFixed(2)} dB/W`} />

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-dim)]">Historical power</span>
              <div className="flex gap-1">
                {(['hour', 'day', 'week'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      range === r ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent)]' : 'text-[color:var(--text-dim)] hover:text-[color:var(--text)]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={powerHistory} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#7e8bab" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#7e8bab" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1c2942', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="watts" stroke="#4f8dff" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
