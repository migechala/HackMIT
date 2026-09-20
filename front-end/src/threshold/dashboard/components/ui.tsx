import type { ReactNode } from 'react'

// Shared recharts palette so every chart on the dashboard reads as one system.
export const CHART = {
  grid: 'rgba(16, 40, 27, 0.08)',
  axis: '#7d8d83',
  tooltipBg: 'rgba(255, 255, 255, 0.94)',
  tooltipBorder: 'rgba(255, 255, 255, 1)',
  baseline: '#9aa89f',
  ink: '#10281B',
  accent: '#2f7d55',
  accent2: '#2E8FA3',
  warn: '#b8842f',
  danger: '#c0555e',
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-[20px] p-5 ${className}`}>{children}</div>
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-[15px] font-semibold text-[color:var(--text-h)]">{children}</h3>
      {right}
    </div>
  )
}

/** Small label + dark value chip, used above charts. */
export function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="glass-strong inline-flex items-center gap-2.5 rounded-full py-1 pl-3.5 pr-1 text-xs text-[color:var(--text)]">
      {label}
      <span className="rounded-full bg-[color:var(--ink)] px-3 py-1 font-mono font-medium tabular-nums text-white">{value}</span>
    </span>
  )
}

export function StatusCard({
  label,
  value,
  unit,
  tone = 'default',
  emphasize = false,
  sub,
  className = '',
}: {
  label: string
  value: string
  unit?: string
  tone?: 'default' | 'good' | 'warn' | 'bad'
  emphasize?: boolean
  sub?: string
  className?: string
}) {
  // The featured card is the really dark green tile, so the main result reads first.
  const toneColor = emphasize
    ? tone === 'bad'
      ? 'text-[#ff9aa2]'
      : tone === 'warn'
        ? 'text-[#f3c47a]'
        : 'text-white'
    : tone === 'good'
      ? 'text-[color:var(--accent)]'
      : tone === 'warn'
        ? 'text-[color:var(--warn)]'
        : tone === 'bad'
          ? 'text-[color:var(--danger)]'
          : 'text-[color:var(--text-h)]'
  return (
    <div
      className={
        emphasize
          ? `rounded-[20px] bg-[color:var(--ink)] p-5 shadow-[0_24px_44px_-24px_rgba(16,40,27,0.7)] ${className}`
          : `glass rounded-[20px] p-5 ${className}`
      }
    >
      <div className={`text-[13px] font-medium ${emphasize ? 'text-white/60' : 'text-[color:var(--text-dim)]'}`}>{label}</div>
      <div className={`mt-2.5 flex items-baseline gap-1.5 tabular-nums ${/^[$\d-]/.test(value) ? 'font-mono' : 'font-sans'} ${emphasize ? 'text-4xl' : 'text-[22px]'} font-medium tracking-tight ${toneColor}`}>
        {value}
        {unit && <span className={`font-sans text-sm font-normal ${emphasize ? 'text-white/60' : 'text-[color:var(--text-dim)]'}`}>{unit}</span>}
      </div>
      {sub && <div className={`mt-1 text-xs ${emphasize ? 'text-white/60' : 'text-[color:var(--text-dim)]'}`}>{sub}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const cls =
    tone === 'good'
      ? 'bg-[color:var(--accent)]/12 text-[color:var(--accent)] border-[color:var(--accent)]/30'
      : tone === 'warn'
        ? 'bg-[color:var(--warn)]/14 text-[color:var(--warn)] border-[color:var(--warn)]/30'
        : tone === 'bad'
          ? 'bg-[color:var(--danger)]/12 text-[color:var(--danger)] border-[color:var(--danger)]/30'
          : 'bg-white/60 text-[color:var(--text-dim)] border-white/80'
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>{children}</span>
}

export function Toggle({ checked, onChange, labelOn = 'On', labelOff = 'Off' }: { checked: boolean; onChange: (v: boolean) => void; labelOn?: string; labelOff?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`glass-strong flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-transform duration-150 ease-out active:scale-[0.97] ${
        checked ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-dim)]'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${checked ? 'bg-[color:var(--accent)]' : 'bg-[color:var(--text-dim)]'}`} />
      {checked ? labelOn : labelOff}
    </button>
  )
}

export function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] py-2.5 text-sm last:border-0">
      <span className="text-[color:var(--text-dim)]">{label}</span>
      <span className="text-right font-mono text-[13px] font-medium tabular-nums text-[color:var(--text-h)]">{value}</span>
    </div>
  )
}
