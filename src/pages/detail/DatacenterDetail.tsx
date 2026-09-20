import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { getDatacenter, JURISDICTIONS } from '../../lib/mockData'
import { useLiveMetrics } from '../../lib/useLiveMetrics'
import { Badge } from '../../components/ui'

const TABS = [
  { to: 'overview', label: 'Overview' },
  { to: 'financial', label: 'Financial Impact' },
  { to: 'compliance', label: 'Legal Compliance' },
  { to: 'site-intelligence', label: 'Site Intelligence' },
]

export interface DetailContext {
  dc: ReturnType<typeof getDatacenter>
  metrics: ReturnType<typeof useLiveMetrics>['metrics']
  setAncActive: ReturnType<typeof useLiveMetrics>['setAncActive']
}

export default function DatacenterDetail() {
  const { dcId } = useParams()
  const dc = getDatacenter(dcId ?? '')
  const { metrics, setAncActive } = useLiveMetrics(dc!)

  if (!dc) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[color:var(--text)]">
        Facility not found. <Link to="/app" className="ml-2 text-[color:var(--accent)]">Back to list</Link>
      </div>
    )
  }

  const j = JURISDICTIONS[dc.jurisdiction]

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <header className="border-b border-[color:var(--border)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app" className="text-sm text-[color:var(--text-dim)] hover:text-[color:var(--text)]">&larr;</Link>
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)] animate-pulse-glow" />
            <span className="text-lg font-bold tracking-tight text-[color:var(--text-h)]">THRESHOLD</span>
          </div>
          <Link to="/app" className="text-sm text-[color:var(--text-dim)] hover:text-[color:var(--text)]">All facilities</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--text-h)]">{dc.name}</h1>
            <p className="mt-1 text-sm text-[color:var(--text-dim)]">{dc.city}, {dc.state} &middot; {j.name} &middot; {dc.capacityMW} MW &middot; {dc.installedDevices} ANC units installed</p>
          </div>
          <Badge tone={metrics.ancActive ? 'good' : 'bad'}>ANC {metrics.ancActive ? 'Active' : 'Disabled'}</Badge>
        </div>

        <nav className="mt-6 flex gap-1 border-b border-[color:var(--border)]">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-b-2 border-[color:var(--accent)] text-[color:var(--text-h)]'
                    : 'border-b-2 border-transparent text-[color:var(--text-dim)] hover:text-[color:var(--text)]'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet context={{ dc, metrics, setAncActive } satisfies DetailContext} />
      </main>
    </div>
  )
}
