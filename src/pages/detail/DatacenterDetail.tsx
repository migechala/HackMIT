import { Link, Outlet, useNavigate, useParams } from 'react-router-dom'
import { getDatacenter, JURISDICTIONS } from '../../lib/mockData'
import { useLiveMetrics } from '../../lib/useLiveMetrics'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../../components/ui'
import Sidebar from '../../components/Sidebar'
import GrassField from '../../components/GrassField'

export interface DetailContext {
  dc: ReturnType<typeof getDatacenter>
  metrics: ReturnType<typeof useLiveMetrics>['metrics']
  setAncActive: ReturnType<typeof useLiveMetrics>['setAncActive']
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function DatacenterDetail() {
  const { dcId } = useParams()
  const dc = getDatacenter(dcId ?? '')
  const { metrics, setAncActive } = useLiveMetrics(dc!)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!dc) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[color:var(--text)]">
        Facility not found. <Link to="/app" className="ml-2 text-[color:var(--accent)]">Back to list</Link>
      </div>
    )
  }

  const j = JURISDICTIONS[dc.jurisdiction]

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="relative min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <GrassField />
      <div className="relative z-10 flex gap-4 p-4">
        <Sidebar onLogout={handleLogout} />

        <div className="min-w-0 flex-1 pb-20">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-elev)] px-6 py-4 shadow-[0_1px_2px_rgba(32,29,23,0.04),0_10px_28px_-16px_rgba(32,29,23,0.16)]">
            <div>
              <Link to="/app" className="text-xs font-medium text-[color:var(--text-dim)] hover:text-[color:var(--text-h)]">&larr; All facilities</Link>
              <h1 className="mt-1 text-xl font-bold text-[color:var(--text-h)]">{dc.name}</h1>
              <p className="mt-0.5 text-sm text-[color:var(--text-dim)]">{dc.city}, {dc.state} &middot; {j.name} &middot; {dc.capacityMW} MW &middot; {dc.installedDevices} ANC units installed</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={metrics.ancActive ? 'good' : 'bad'}>ANC {metrics.ancActive ? 'Active' : 'Disabled'}</Badge>
              <div className="flex items-center gap-2.5 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elev-2)] py-1 pl-1 pr-3.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--accent)]/15 text-[11px] font-bold text-[color:var(--accent)]">
                  {initials(user?.name ?? '?')}
                </span>
                <span className="text-xs text-[color:var(--text-dim)]">
                  Signed in as <span className="font-semibold text-[color:var(--text-h)]">{user?.name.split(' ')[0]}</span>
                </span>
              </div>
            </div>
          </header>

          <main className="mt-4">
            <Outlet context={{ dc, metrics, setAncActive } satisfies DetailContext} />
          </main>
        </div>
      </div>
    </div>
  )
}
