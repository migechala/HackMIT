import { NavLink, Link } from 'react-router-dom'
import { Activity, Banknote, Compass, LogOut } from 'lucide-react'

const TABS = [
  { to: 'overview', label: 'Overview', icon: Activity },
  { to: 'financial', label: 'Financial Impact', icon: Banknote },
  { to: 'site-intelligence', label: 'Site Intelligence', icon: Compass },
]

/** Icon rail: frosted column, dark green tile marks the active tab. */
export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="glass-strong sticky top-5 flex h-[calc(100vh-3.5rem)] w-14 shrink-0 sm:w-[68px] flex-col items-center justify-between rounded-[28px] py-4">
      <div className="flex flex-col items-center gap-7">
        <Link
          to="/dashboard"
          title="All facilities"
          className="flex size-10 items-center justify-center rounded-2xl bg-[color:var(--ink)] shadow-[0_10px_20px_-10px_rgba(16,40,27,0.7)] transition-transform sm:size-11 duration-150 ease-out active:scale-[0.96]"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path d="M6 8h12M6 12h12M6 16h12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="9 3" />
            <circle cx="18" cy="8" r="1.6" fill="#7fe0b6" />
          </svg>
        </Link>
        <nav className="flex flex-col gap-2">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              title={t.label}
              aria-label={t.label}
              className={({ isActive }) =>
                `flex size-10 items-center justify-center rounded-2xl transition-[background-color,color,transform] sm:size-11 duration-150 ease-out active:scale-[0.96] ${
                  isActive
                    ? 'bg-[color:var(--ink)] text-white shadow-[0_10px_20px_-10px_rgba(16,40,27,0.7)]'
                    : 'text-[color:var(--text-dim)] hover:bg-white/70 hover:text-[color:var(--text-h)]'
                }`
              }
            >
              <t.icon size={19} strokeWidth={1.9} />
            </NavLink>
          ))}
        </nav>
      </div>
      <button
        onClick={onLogout}
        title="Log out"
        aria-label="Log out"
        className="flex size-10 items-center justify-center rounded-2xl text-[color:var(--text-dim)] transition-colors duration-150 hover:bg-white/70 sm:size-11 hover:text-[color:var(--danger)]"
      >
        <LogOut size={18} strokeWidth={1.9} />
      </button>
    </aside>
  )
}
