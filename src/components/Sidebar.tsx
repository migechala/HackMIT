import { NavLink, Link } from 'react-router-dom'
import { Activity, Banknote, Compass, LogOut } from 'lucide-react'

const TABS = [
  { to: 'overview', label: 'Overview', icon: Activity },
  { to: 'financial', label: 'Financial Impact', icon: Banknote },
  { to: 'site-intelligence', label: 'Site Intelligence', icon: Compass },
]

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="sticky top-4 flex h-[calc(100vh-2rem)] w-[76px] shrink-0 flex-col items-center justify-between rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-elev)] py-5 shadow-[0_1px_2px_rgba(32,29,23,0.04),0_12px_32px_-14px_rgba(32,29,23,0.18)]">
      <div className="flex flex-col items-center gap-8">
        <Link to="/app" title="All facilities" className="flex h-8 w-8 items-center justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)] animate-pulse-glow" />
        </Link>
        <nav className="flex flex-col gap-2">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              title={t.label}
              className={({ isActive }) =>
                `flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                  isActive
                    ? 'bg-[color:var(--accent)]/12 text-[color:var(--accent)]'
                    : 'text-[color:var(--text-dim)] hover:bg-black/[0.03] hover:text-[color:var(--text-h)]'
                }`
              }
            >
              <t.icon size={20} strokeWidth={2} />
            </NavLink>
          ))}
        </nav>
      </div>
      <button
        onClick={onLogout}
        title="Log out"
        className="flex h-11 w-11 items-center justify-center rounded-2xl text-[color:var(--text-dim)] transition-colors hover:bg-black/[0.03] hover:text-[color:var(--danger)]"
      >
        <LogOut size={19} strokeWidth={2} />
      </button>
    </aside>
  )
}
