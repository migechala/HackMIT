import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { DetailContext } from './DatacenterDetail'
import { JURISDICTIONS, applicableThreshold, generateComplianceHistory } from '../../lib/mockData'
import { Card, CardTitle, StatusCard, StatRow, Badge } from '../../components/ui'

export default function Compliance() {
  const { dc, metrics } = useOutletContext<DetailContext>()
  const j = JURISDICTIONS[dc!.jurisdiction]
  const now = new Date()
  const currentHour = now.getHours()
  const { value: applicable, period } = applicableThreshold(j, currentHour)

  const history = useMemo(() => generateComplianceHistory(dc!, j, metrics.attenuationDb), [dc, j, metrics.attenuationDb])
  const exceedanceCount = history.filter((h) => h.exceeded).length
  const margin = applicable - metrics.residualDbA
  const withinThreshold = margin >= 0

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle right={<Badge>{j.name}: Configured profile</Badge>}>Legal compliance monitoring</CardTitle>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 md:grid-cols-4">
          <StatRow label="Day threshold" value={`${j.dayThreshold} dBA`} />
          <StatRow label="Night threshold" value={`${j.nightThreshold} dBA`} />
          <StatRow label="Applicable threshold now" value={`${applicable} dBA (${period})`} />
          <StatRow label="Time of day" value={`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} local`} />
        </div>
      </Card>

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
              <CartesianGrid stroke="#1c2942" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#7e8bab" tick={{ fontSize: 11 }} interval={2} />
              <YAxis stroke="#7e8bab" tick={{ fontSize: 11 }} domain={[30, 75]} label={{ value: 'dBA', angle: -90, position: 'insideLeft', fill: '#7e8bab', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1c2942', borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={j.dayThreshold} stroke="#f5b94a" strokeDasharray="4 3" label={{ value: 'Day', fill: '#f5b94a', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={j.nightThreshold} stroke="#ff5d6c" strokeDasharray="4 3" label={{ value: 'Night', fill: '#ff5d6c', fontSize: 10, position: 'right' }} />
              <Line type="monotone" dataKey="baseline" name="Baseline (no THRESHOLD)" stroke="#7e8bab" strokeWidth={1.5} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
              <Line type="monotone" dataKey="measured" name="Measured (with THRESHOLD)" stroke="#35e8c4" strokeWidth={2.5} dot={false} isAnimationActive={false} />
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
        <Card className="border-[color:var(--danger)]/30 bg-[color:var(--danger)]/5">
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
    </div>
  )
}
