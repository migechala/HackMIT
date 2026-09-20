import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { DEMO_SESSION, type Session } from './session';

const TIERS = [
  {
    name: 'Pilot', price: '$0', unit: '30-day evaluation', blurb: 'One monitored source and the live spectrum view.',
    points: ['1 monitored source', 'Live spectrum + ANC toggle', 'Community support'], highlight: false,
  },
  {
    name: 'Business', price: '$1,200', unit: 'per site / month', blurb: 'Multi-source monitoring for a single facility.',
    points: ['Up to 10 sources', 'Energy and cost tracking', 'Configured threshold profiles'], highlight: false,
  },
  {
    name: 'Corporate', price: 'Custom', unit: 'portfolio pricing', blurb: 'Fleet view, exports and integration support.',
    points: ['Unlimited sites', 'Site Intelligence screening', 'SSO and data export'], highlight: true,
  },
];

/** Demo sign-in. There are no real accounts: the demo path lands on the Corporate plan. */
export default function Login({ onSignIn }: { onSignIn: (s: Session) => void }) {
  const [msg, setMsg] = useState('');

  return (
    <div className="min-h-screen bg-[#0B0F0D] text-[#EDEEE9]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#98A29A] transition-colors hover:text-[#EDEEE9]">
          <ArrowLeft className="size-4" /> THRESHOLD
        </Link>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[#98A29A]">Demo preview</span>
      </header>

      <main className="mx-auto grid max-w-6xl gap-14 px-5 pb-24 pt-6 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <section>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#5FE89A]">Mission</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,5.4vw,4.6rem)] leading-[0.98] tracking-[-0.02em]">
            Compute more.<br />Disturb less.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#EDEEE9]/70">
            THRESHOLD reduces predictable tonal noise at the source of a data-center noise problem and shows what it costs to do so. This console is a
            preview with simulated data. It demonstrates the interface, not a live installation.
          </p>
          <ul className="mt-8 grid gap-3 text-[15px] text-[#EDEEE9]/80">
            {[
              ['Cancels the dominant tone', 'Phase-inverted output targets the strongest steady frequency.'],
              ['Shows the result live', 'Baseline vs. current spectrum, with the peak marked.'],
              ['Tracks energy and cost', 'Mitigation power, daily energy and cost per decibel-hour.'],
              ['Compares to a configured limit', 'Uses your own threshold profile. It is not a compliance certificate.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-1 size-4 shrink-0 text-[#5FE89A]" />
                <span><span className="font-medium text-[#EDEEE9]">{t}.</span> <span className="text-[#EDEEE9]/60">{d}</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="signin" className="rounded-3xl border border-white/10 bg-[#111713] p-7 sm:p-8">
          <h2 id="signin" className="font-display text-3xl">Sign in</h2>
          <form
            className="mt-6 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setMsg('Real accounts are not enabled in this preview. Use the demo account below.');
            }}
          >
            <label className="grid gap-1.5 text-sm text-[#98A29A]">
              Work email
              <input type="email" name="email" autoComplete="email" placeholder="you@company.com" className="rounded-xl border border-white/10 bg-[#0B0F0D] px-4 py-3 text-[#EDEEE9] placeholder:text-[#EDEEE9]/30 focus:border-[#5FE89A] focus:outline-none" />
            </label>
            <label className="grid gap-1.5 text-sm text-[#98A29A]">
              Password
              <input type="password" name="password" autoComplete="current-password" placeholder="••••••••" className="rounded-xl border border-white/10 bg-[#0B0F0D] px-4 py-3 text-[#EDEEE9] placeholder:text-[#EDEEE9]/30 focus:border-[#5FE89A] focus:outline-none" />
            </label>
            <button type="submit" className="rounded-full border border-white/15 py-3 text-sm font-medium text-[#EDEEE9] transition-[transform,background-color] duration-200 hover:bg-white/5 active:scale-[0.98]">
              Sign in
            </button>
            {msg && <p role="status" className="text-sm text-[#E8A73E]">{msg}</p>}
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-[#98A29A]"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
          <button
            type="button"
            onClick={() => onSignIn(DEMO_SESSION)}
            className="group flex w-full items-center justify-between rounded-full bg-[#5FE89A] py-1.5 pl-6 pr-1.5 text-[15px] font-medium text-[#0B0F0D] transition-[transform,background-color] duration-200 hover:bg-[#7CF0AE] active:scale-[0.98]"
          >
            Sign in with a fake demo account
            <span className="grid size-9 place-items-center rounded-full bg-[#0B0F0D]/15">→</span>
          </button>
          <p className="mt-3 text-center text-xs text-[#98A29A]">Lands on the Corporate plan with sample data.</p>
        </section>
      </main>

      <section className="border-t border-white/10 bg-[#0E1310] px-5 py-16 sm:px-8" aria-labelledby="pricing">
        <div className="mx-auto max-w-6xl">
          <h2 id="pricing" className="font-display text-4xl">Pricing points</h2>
          <p className="mt-2 text-sm text-[#98A29A]">Illustrative figures for this demo only. Not a quote or an offer.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {TIERS.map((t) => (
              <article key={t.name} className={`rounded-3xl border p-7 ${t.highlight ? 'border-[#5FE89A]/50 bg-[#5FE89A]/[0.05]' : 'border-white/10 bg-[#111713]'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t.name}</h3>
                  {t.highlight && <span className="rounded-full bg-[#5FE89A] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[#0B0F0D]">Demo plan</span>}
                </div>
                <p className="mt-4 font-mono text-4xl tracking-tight">{t.price}</p>
                <p className="text-sm text-[#98A29A]">{t.unit}</p>
                <p className="mt-4 text-sm text-[#EDEEE9]/70">{t.blurb}</p>
                <ul className="mt-5 grid gap-2 text-sm text-[#EDEEE9]/80">
                  {t.points.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#5FE89A]" />{p}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
