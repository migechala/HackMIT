import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getDatacenter, JURISDICTIONS } from '../../lib/mockData'
import { useLiveMetrics } from '../../lib/useLiveMetrics'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../../components/ui'
import Sidebar from '../../components/Sidebar'

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
  const { pathname } = useLocation()

  if (!dc) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[color:var(--text)]">
        Facility not found. <Link to="/dashboard" className="ml-2 text-[color:var(--accent)]">Back to list</Link>
      </div>
    )
  }

  const j = JURISDICTIONS[dc.jurisdiction]
  const first = user?.name.split(' ')[0] ?? 'there'

  // Each tab gets its own headline; Overview keeps the greeting.
  const tab = pathname.endsWith('/financial') ? 'financial' : pathname.endsWith('/weather') ? 'weather' : pathname.endsWith('/site-intelligence') ? 'site' : 'overview'
  const heading = { overview: `Welcome back, ${first}`, financial: 'Financial impact', weather: 'Weather exposure', site: 'Site intelligence' }[tab]
  const lead = {
    overview: <>You&rsquo;re previewing analytics for <span className="font-semibold text-[color:var(--text-h)]">{dc.name}</span></>,
    financial: <>Operating cost and threshold compliance for <span className="font-semibold text-[color:var(--text-h)]">{dc.name}</span></>,
    weather: <>How wind and still air at night change who hears <span className="font-semibold text-[color:var(--text-h)]">{dc.name}</span>, from six years of NOAA observations</>,
    site: <>Preliminary lower-impact location screening, starting from <span className="font-semibold text-[color:var(--text-h)]">{dc.name}</span></>,
  }[tab]

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="relative min-h-screen p-3 sm:p-5">
      <div className="glass-window mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1500px] gap-2.5 rounded-[32px] p-2.5 sm:min-h-[calc(100vh-2.5rem)] sm:gap-4 sm:p-4">
        <Sidebar onLogout={handleLogout} />

        <div className="min-w-0 flex-1 pb-6">
          <header className="flex flex-wrap items-start justify-between gap-4 px-1 pt-1 sm:px-2">
            <div className="min-w-0">
              <Link to="/dashboard" className="text-xs font-medium text-[color:var(--text-dim)] transition-colors hover:text-[color:var(--text-h)]">&larr; All facilities</Link>
              <h1 className="mt-3 text-balance text-[clamp(2rem,4.2vw,3.4rem)] font-light leading-[1.05] tracking-tight text-[color:var(--text-h)]">{heading}</h1>
              <p className="mt-2 text-[15px] text-[color:var(--text-dim)]">{lead}</p>
              <p className="mt-1 text-xs text-[color:var(--text-dim)]/85">{dc.city}, {dc.state} &middot; {j.name} &middot; {dc.capacityMW} MW &middot; {dc.installedDevices} ANC units installed</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={metrics.ancActive ? 'good' : 'bad'}>ANC {metrics.ancActive ? 'Active' : 'Disabled'}</Badge>
              <div className="glass-strong flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-[color:var(--ink)] text-[11px] font-semibold text-white">
                  {initials(user?.name ?? '?')}
                </span>
                <span className="text-xs text-[color:var(--text-dim)]">
                  Signed in as <span className="font-semibold text-[color:var(--text-h)]">{first}</span>
                </span>
              </div>
            </div>
          </header>

          <main className="mt-6">
            <Outlet context={{ dc, metrics, setAncActive } satisfies DetailContext} />
          </main>
        </div>
      </div>
    </div>
  )
}
