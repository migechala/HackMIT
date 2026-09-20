import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elev)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.02)_inset] ${className}`}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-dim)]">{children}</h3>
      {right}
    </div>
  )
}

export function StatusCard({
  label,
  value,
  unit,
  tone = 'default',
  emphasize = false,
  sub,
}: {
  label: string
  value: string
  unit?: string
  tone?: 'default' | 'good' | 'warn' | 'bad'
  emphasize?: boolean
  sub?: string
}) {
  const toneColor =
    tone === 'good'
      ? 'text-[color:var(--accent)]'
      : tone === 'warn'
        ? 'text-[color:var(--warn)]'
        : tone === 'bad'
          ? 'text-[color:var(--danger)]'
          : 'text-[color:var(--text-h)]'
  return (
    <Card className={emphasize ? 'ring-1 ring-[color:var(--accent)]/30' : ''}>
      <div className="text-xs font-medium uppercase tracking-wider text-[color:var(--text-dim)]">{label}</div>
      <div className={`mt-2 flex items-baseline gap-1.5 ${emphasize ? 'text-4xl' : 'text-2xl'} font-bold ${toneColor}`}>
        {value}
        {unit && <span className="text-base font-medium text-[color:var(--text-dim)]">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-xs text-[color:var(--text-dim)]">{sub}</div>}
    </Card>
  )
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const cls =
    tone === 'good'
      ? 'bg-[color:var(--accent)]/12 text-[color:var(--accent)] border-[color:var(--accent)]/30'
      : tone === 'warn'
        ? 'bg-[color:var(--warn)]/12 text-[color:var(--warn)] border-[color:var(--warn)]/30'
        : tone === 'bad'
          ? 'bg-[color:var(--danger)]/12 text-[color:var(--danger)] border-[color:var(--danger)]/30'
          : 'bg-white/5 text-[color:var(--text-dim)] border-[color:var(--border)]'
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>{children}</span>
}

export function Toggle({ checked, onChange, labelOn = 'On', labelOff = 'Off' }: { checked: boolean; onChange: (v: boolean) => void; labelOn?: string; labelOff?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        checked
          ? 'border-[color:var(--accent)]/40 bg-[color:var(--accent)]/12 text-[color:var(--accent)]'
          : 'border-[color:var(--border)] bg-white/5 text-[color:var(--text-dim)]'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${checked ? 'bg-[color:var(--accent)] animate-pulse-glow' : 'bg-[color:var(--text-dim)]'}`} />
      {checked ? labelOn : labelOff}
    </button>
  )
}

export function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[color:var(--border)] py-2.5 text-sm last:border-0">
      <span className="text-[color:var(--text-dim)]">{label}</span>
      <span className="font-semibold text-[color:var(--text-h)]">{value}</span>
    </div>
  )
}
