import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DATACENTERS, JURISDICTIONS } from '../lib/mockData'
import { Badge } from '../components/ui'

const statusTone = { nominal: 'good', watch: 'warn', exceedance: 'bad' } as const
const statusLabel = { nominal: 'Nominal', watch: 'Watch', exceedance: 'Exceedance' } as const

export default function DatacenterList() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <header className="border-b border-[color:var(--border)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)] animate-pulse-glow" />
            <span className="text-lg font-bold tracking-tight text-[color:var(--text-h)]">THRESHOLD</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-[color:var(--text-dim)] hover:text-[color:var(--text)]">
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elev)] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-dim)]">Operator account</div>
            <div className="mt-1 text-lg font-bold text-[color:var(--text-h)]">{user?.name}</div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs text-[color:var(--text-dim)]">Employee ID</div>
              <div className="font-medium text-[color:var(--text)]">{user?.employeeId}</div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--text-dim)]">Phone</div>
              <div className="font-medium text-[color:var(--text)]">{user?.phone}</div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--text-dim)]">Company</div>
              <div className="font-medium text-[color:var(--text)]">{user?.company}</div>
            </div>
          </div>
        </div>

        <h1 className="mb-1 text-2xl font-bold text-[color:var(--text-h)]">Monitored facilities</h1>
        <p className="mb-6 text-sm text-[color:var(--text-dim)]">Facilities with THRESHOLD ANC devices installed.</p>

        <div className="grid gap-4 md:grid-cols-2">
          {DATACENTERS.map((dc) => {
            const j = JURISDICTIONS[dc.jurisdiction]
            return (
              <Link
                key={dc.id}
                to={`/app/${dc.id}`}
                className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elev)] p-6 transition hover:border-[color:var(--accent)]/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold text-[color:var(--text-h)] group-hover:text-[color:var(--accent)]">{dc.name}</div>
                    <div className="text-sm text-[color:var(--text-dim)]">{dc.city}, {dc.state} &middot; {j.name}</div>
                  </div>
                  <Badge tone={statusTone[dc.status]}>{statusLabel[dc.status]}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-[color:var(--text-dim)]">Capacity</div>
                    <div className="font-semibold text-[color:var(--text)]">{dc.capacityMW} MW</div>
                  </div>
                  <div>
                    <div className="text-xs text-[color:var(--text-dim)]">ANC units</div>
                    <div className="font-semibold text-[color:var(--text)]">{dc.installedDevices}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[color:var(--text-dim)]">Dominant tone</div>
                    <div className="font-semibold text-[color:var(--text)]">{dc.dominantFrequencyHz} Hz</div>
                  </div>
                </div>
                {dc.litigationNote && (
                  <div className="mt-4 rounded-lg border border-[color:var(--danger)]/25 bg-[color:var(--danger)]/8 px-3 py-2 text-xs text-[color:var(--danger)]">
                    {dc.litigationNote}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
