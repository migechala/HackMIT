import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DetailContext } from './DatacenterDetail'
import summary from '../../lib/isdSummary.json'
import { Badge, Card, CardTitle, CHART, StatRow, StatusCard } from '../../components/ui'

type Site = (typeof summary.sites)[number]

const SECTORS = summary.params.sectors as string[]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`
const compass = (deg: number) => SECTORS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]
const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180)

function carryTone(still: number): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (still >= 0.45) return { label: 'High', tone: 'bad' }
  if (still >= 0.2) return { label: 'Moderate', tone: 'warn' }
  return { label: 'Low', tone: 'good' }
}

/** Night wind rose. Wedges are "wind from" sectors; the ones that carry sound toward the homes are filled. */
function WindRose({ rose, homesBearing }: { rose: number[]; homesBearing: number }) {
  const cx = 110, cy = 110, R = 84
  const max = Math.max(...rose, 0.001)
  const carryFrom = (homesBearing + 180) % 360 // wind blowing FROM here moves air (and sound) toward the homes
  const pt = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)]
  }
  return (
    <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[19rem]" role="img" aria-label="Night wind rose with the direction of nearby homes marked">
      {[0.5, 1].map((k) => <circle key={k} cx={cx} cy={cy} r={R * k} fill="none" stroke="rgba(16,40,27,0.12)" strokeDasharray="3 3" />)}
      {rose.map((share, i) => {
        const c = i * 22.5
        const r = (share / max) * R
        const [x1, y1] = pt(c - 11, r)
        const [x2, y2] = pt(c + 11, r)
        const carries = angleDiff(c, carryFrom) <= 45
        return (
          <path
            key={i}
            d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2} Z`}
            fill={carries ? CHART.accent : CHART.baseline}
            fillOpacity={carries ? 0.85 : 0.5}
          >
            <title>{`Wind from ${SECTORS[i]}: ${pct(share, 1)} of windy night hours`}</title>
          </path>
        )
      })}
      {['N', 'E', 'S', 'W'].map((l, i) => {
        const [x, y] = pt(i * 90, R + 14)
        return <text key={l} x={x} y={y + 4} textAnchor="middle" fontSize="11" fill={CHART.axis}>{l}</text>
      })}
      {/* homes marker */}
      {(() => {
        const [x, y] = pt(homesBearing, R + 2)
        const [tx, ty] = pt(homesBearing, R * 0.45)
        return (
          <g>
            <line x1={tx} y1={ty} x2={x} y2={y} stroke={CHART.ink} strokeWidth="1.5" strokeDasharray="2 3" />
            <circle cx={x} cy={y} r="6" fill={CHART.ink} />
            <path d={`M${x - 3},${y + 1.5} L${x},${y - 3} L${x + 3},${y + 1.5} Z`} fill="#fff" />
          </g>
        )
      })()}
    </svg>
  )
}

export default function Weather() {
  const { dc } = useOutletContext<DetailContext>()
  const site = summary.sites.find((s) => s.id === dc!.id) as Site | undefined
  const [bearing, setBearing] = useState(90)

  const downwind = useMemo(() => {
    if (!site) return 0
    const carryFrom = (bearing + 180) % 360
    return site.nightRose.reduce((acc, share, i) => (angleDiff(i * 22.5, carryFrom) <= 45 ? acc + share : acc), 0)
  }, [site, bearing])

  if (!site) {
    return <Card><p className="text-sm text-[color:var(--text-dim)]">No weather summary is available for this facility yet.</p></Card>
  }

  const tone = carryTone(site.stillNightShare)
  const monthly = site.monthlyStillNight.map((v, i) => ({ month: MONTHS[i], still: +(v * 100).toFixed(1) }))
  const [y0, y1] = site.years

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatusCard label="Still-air nights" value={pct(site.stillNightShare)} sub="wind under 2 m/s, 22:00-07:00" emphasize />
        <StatusCard label="Toward homes" value={pct(downwind)} sub={`of windy nights, homes to the ${compass(bearing)}`} />
        <StatusCard label="Mean night wind" value={site.meanNightWindMs.toFixed(1)} unit="m/s" />
        <StatusCard label="Hours at 25 °C+" value={pct(site.hours25CShare)} sub="fans work hardest when it is warm" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,26rem)_1fr]">
        <Card>
          <CardTitle right={<Badge tone={tone.tone}>{tone.label} carry potential</Badge>}>Night wind rose</CardTitle>
          <WindRose rose={site.nightRose} homesBearing={bearing} />
          <div className="mt-4">
            <label htmlFor="bearing" className="mb-1.5 flex items-center justify-between text-sm text-[color:var(--text-dim)]">
              <span>Direction to the nearest homes</span>
              <span className="font-mono text-[13px] font-medium text-[color:var(--text-h)]">{bearing}° {compass(bearing)}</span>
            </label>
            <input id="bearing" type="range" min={0} max={359} value={bearing} onChange={(e) => setBearing(+e.target.value)} className="w-full" aria-valuetext={`${bearing} degrees, ${compass(bearing)}`} />
            <p className="mt-3 text-xs leading-relaxed text-[color:var(--text-dim)]">
              Green wedges are the wind directions that blow sound from the facility toward the homes (within 45°). Bigger wedge, more hours.
            </p>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardTitle>Still-air share of nights, by month</CardTitle>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke={CHART.axis} tick={{ fontSize: 11 }} />
                  <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip cursor={{ fill: 'rgba(16,40,27,0.05)' }} formatter={(v) => [`${v}%`, 'Still-air nights']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="still" fill={CHART.ink} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardTitle>How the same hum compares across your facilities</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--border)] text-xs text-[color:var(--text-dim)]">
                    <th className="py-2 pr-3 font-medium">Facility</th>
                    <th className="py-2 pr-3 font-medium">Still-air nights</th>
                    <th className="py-2 pr-3 font-medium">Mean night wind</th>
                    <th className="py-2 font-medium">Hours 25 °C+</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.sites.map((s) => (
                    <tr key={s.id} className={`border-b border-[color:var(--border)] last:border-0 ${s.id === dc!.id ? 'font-semibold text-[color:var(--text-h)]' : 'text-[color:var(--text)]'}`}>
                      <td className="py-2.5 pr-3">{s.city}, {s.state}</td>
                      <td className="py-2.5 pr-3 font-mono text-[13px]">{pct(s.stillNightShare)}</td>
                      <td className="py-2.5 pr-3 font-mono text-[13px]">{s.meanNightWindMs.toFixed(1)} m/s</td>
                      <td className="py-2.5 font-mono text-[13px]">{pct(s.hours25CShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardTitle>Data behind this page</CardTitle>
        <div className="grid gap-x-10 lg:grid-cols-2">
          <div>
            <StatRow label="Source" value="NOAA Integrated Surface Database" />
            <StatRow label="Station" value={`${site.station.name} (${site.station.icao || `${site.station.usaf}-${site.station.wban}`})`} />
            <StatRow label="Distance to facility" value={`${site.station.distanceKm} km`} />
          </div>
          <div>
            <StatRow label="Period" value={`${y0}-${y1}`} />
            <StatRow label="Hourly observations used" value={site.hourlyObs.toLocaleString()} />
            <StatRow label="Of which at night" value={site.nightObs.toLocaleString()} />
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[color:var(--text-dim)]">
          {summary.limits} Still air and wind direction change how far low-frequency sound carries, so this shows where the same hum is more likely to reach neighbors.
          It does not predict decibel levels at a specific home. Wind is measured at the airport station, not at the facility.
        </p>
      </Card>
    </div>
  )
}
