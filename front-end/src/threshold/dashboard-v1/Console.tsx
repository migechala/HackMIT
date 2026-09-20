import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import { AlertTriangle, ArrowLeft, LogOut } from 'lucide-react';
import Spectrum from './Spectrum';
import PowerChart from './PowerChart';
import {
  ATTENUATION, BASELINE_PEAK, DOMINANT_HZ, FULL_POWER_W, IDLE_POWER_W, THRESHOLDS, useAncSim, type TimeMode,
} from './sim';
import type { Session } from './session';

const one = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

function Panel({ title, kicker, right, children, className = '' }: { title: string; kicker?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-white/10 bg-[#111713] p-5 sm:p-6 ${className}`}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          {kicker && <p className="text-[11px] uppercase tracking-[0.16em] text-[#98A29A]">{kicker}</p>}
          <h2 className="mt-1 font-display text-2xl text-[#EDEEE9]">{title}</h2>
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

function Card({ label, children, className = '', tone }: { label: string; children: ReactNode; className?: string; tone?: string }) {
  return (
    <div className={`flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-[#111713] p-5 ${className}`} style={tone ? { borderColor: tone } : undefined}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#98A29A]">{label}</p>
      {children}
    </div>
  );
}

const money = (n: number, d = 3) => `$${n.toFixed(d)}`;

export default function Console({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const sim = useAncSim();
  const { ancOn, attn } = sim;

  const [mode, setMode] = useState<TimeMode>('night');
  const threshold = THRESHOLDS[mode];
  const [price, setPrice] = useState(0.12);
  const [altMonthly, setAltMonthly] = useState(150);
  const [share, setShare] = useState(25);

  const reduction = ATTENUATION * attn;
  const residual = BASELINE_PEAK - reduction;
  const power = IDLE_POWER_W + (FULL_POWER_W - IDLE_POWER_W) * attn;
  const margin = threshold - residual;
  const over = residual > threshold + 1e-6;
  const status = !ancOn ? 'Standby' : attn > 0.985 ? 'Active' : 'Converging';

  const hourly = (power / 1000) * price;
  const daily = hourly * 24;
  const monthly = daily * 30;
  const avoided = (altMonthly * share) / 100 - monthly;

  // Count an exceedance (and log a warning) each time the estimated level crosses above the threshold.
  const [exceed, setExceed] = useState(0);
  const [warnings, setWarnings] = useState<{ t: string; text: string }[]>([]);
  const prevOver = useRef(false);
  useEffect(() => {
    if (over && !prevOver.current) {
      setExceed((n) => n + 1);
      setWarnings((w) => [{ t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: `Estimated level crossed above the ${threshold} dBA ${mode} threshold (ANC off).` }, ...w].slice(0, 4));
    }
    prevOver.current = over;
  }, [over, threshold, mode]);

  return (
    <div className="min-h-screen bg-[#0B0F0D] font-sans text-[#EDEEE9]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B0F0D]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#98A29A] hover:text-[#EDEEE9]"><ArrowLeft className="size-4" /><span className="hidden sm:inline">Site</span></Link>
            <span className="text-[13px] font-medium tracking-[0.22em]">THRESHOLD</span>
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-[#98A29A]">Demo preview</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[#98A29A] sm:inline">{session.name} · {session.company}</span>
            <span className="rounded-full bg-[#5FE89A]/15 px-3 py-1 text-xs font-medium text-[#5FE89A]">{session.plan} plan</span>
            <button onClick={onSignOut} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[#98A29A] transition-colors hover:text-[#EDEEE9]"><LogOut className="size-3.5" />Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6">
        <p className="text-sm text-[#98A29A]">Simulated data for demonstration. Site: Building C hall, Row 2 (example).</p>

        {/* status cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <Card label="ANC status">
            <div className="flex items-center gap-2.5">
              <span className={`size-2.5 rounded-full ${status === 'Active' ? 'bg-[#5FE89A] shadow-[0_0_10px_#5FE89A]' : status === 'Converging' ? 'bg-[#4FC3D9]' : 'bg-[#98A29A]'}`} />
              <p className="text-3xl font-medium">{status}</p>
            </div>
          </Card>
          <Card label="Noise reduction" className="col-span-2 border-[#5FE89A]/25 bg-[#5FE89A]/[0.04]">
            <p className="font-mono text-[clamp(4rem,8vw,6.2rem)] leading-none tracking-tight text-[#5FE89A]">
              <NumberFlow value={+reduction.toFixed(1)} format={one} />
              <span className="ml-2 text-3xl text-[#EDEEE9]/60">dB</span>
            </p>
          </Card>
          <Card label="Residual noise">
            <p className="font-mono text-3xl"><NumberFlow value={+residual.toFixed(1)} format={one} /><span className="ml-1 text-lg text-[#98A29A]">dBA</span></p>
          </Card>
          <Card label="System power">
            <p className="font-mono text-3xl"><NumberFlow value={+power.toFixed(1)} format={one} /><span className="ml-1 text-lg text-[#98A29A]">W</span></p>
          </Card>
          <Card label="Threshold status" className="col-span-2 lg:col-span-1" tone={over ? '#E85F5F66' : undefined}>
            <p className={`text-xl font-medium leading-snug ${over ? 'text-[#E85F5F]' : 'text-[#EDEEE9]'}`}>{over ? 'Above configured limit' : 'Below configured limit'}</p>
          </Card>
        </div>

        {/* spectrum */}
        <Panel
          title="Live noise spectrum"
          kicker="Frequency analysis"
          right={
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
                <span className="text-[#98A29A]">ANC</span>
                <button
                  role="switch"
                  aria-checked={ancOn}
                  aria-label="Active noise cancellation"
                  onClick={() => sim.setAncOn(!ancOn)}
                  className={`relative h-7 w-14 rounded-full border transition-colors duration-200 ${ancOn ? 'border-[#5FE89A]/60 bg-[#5FE89A]/25' : 'border-white/15 bg-white/5'}`}
                >
                  <span className={`absolute top-0.5 size-6 rounded-full transition-[left,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${ancOn ? 'left-[1.9rem] bg-[#5FE89A]' : 'left-0.5 bg-[#98A29A]'}`} />
                </button>
                <span className="w-7 font-mono">{ancOn ? 'ON' : 'OFF'}</span>
              </label>
              <button
                onClick={sim.captureBaseline}
                disabled={sim.capturing}
                className="rounded-full border border-white/15 px-4 py-2 text-sm transition-[transform,background-color] duration-200 hover:bg-white/5 active:scale-[0.97] disabled:opacity-60"
              >
                {sim.capturing ? 'Capturing…' : 'Capture New Baseline'}
              </button>
            </div>
          }
        >
          <Spectrum attn={attn} seed={sim.seed} threshold={threshold} capturing={sim.capturing} />
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#98A29A]">
            <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-[#8B938A]" />Baseline (ANC off)</span>
            <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-gradient-to-r from-[#5FE89A] to-[#4FC3D9]" />Current (ANC on)</span>
            <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 border-t border-dashed border-[#E8A73E]" />Configured threshold</span>
            <span className="ml-auto">{sim.capturedAt ? `Baseline captured ${sim.capturedAt.toLocaleTimeString()}` : 'Baseline from initial calibration (example)'}</span>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* performance table */}
          <Panel title="Cancellation performance" kicker="Tonal cancellation">
            <table className="w-full text-sm">
              <caption className="sr-only">Cancellation performance metrics</caption>
              <thead><tr className="text-left text-[11px] uppercase tracking-[0.14em] text-[#98A29A]"><th className="pb-3 font-medium">Metric</th><th className="pb-3 text-right font-medium">Example</th></tr></thead>
              <tbody className="divide-y divide-white/[0.07]">
                {[
                  ['Dominant frequency', `${DOMINANT_HZ} Hz`],
                  ['Cancellation frequency', ancOn ? `${DOMINANT_HZ} Hz` : 'Off'],
                  ['Phase adjustment', ancOn ? '180°' : 'n/a'],
                  ['Baseline level', `${BASELINE_PEAK.toFixed(1)} dBA`],
                  ['Residual level', `${residual.toFixed(1)} dBA`],
                  ['Attenuation achieved', `${reduction.toFixed(1)} dB`],
                  ['ANC status', status],
                ].map(([k, v]) => (
                  <tr key={k}><th scope="row" className="py-3 text-left font-normal text-[#EDEEE9]/80">{k}</th><td className="py-3 text-right font-mono text-[#EDEEE9]">{v}</td></tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* energy */}
          <Panel title="Energy transparency" kicker="What the mitigation draws">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {[
                ['Current power', <><NumberFlow value={+power.toFixed(1)} format={one} /> W</>],
                ['Energy used today', <>62.4 Wh <span className="text-sm text-[#98A29A]">(0.062 kWh)</span></>],
                ['Est. daily operating cost', <>{money(daily)}</>],
                ['Noise-reduction efficiency', power > 1 ? <>{(reduction / power).toFixed(2)} <span className="text-sm text-[#98A29A]">dB per W</span></> : <>n/a</>],
              ].map(([k, v], i) => (
                <div key={i}><p className="text-xs text-[#98A29A]">{k}</p><p className="mt-1 font-mono text-2xl">{v}</p></div>
              ))}
            </div>
            <div className="mt-6 border-t border-white/[0.07] pt-5"><PowerChart /></div>
          </Panel>
        </div>

        {/* financial */}
        <Panel title="Cost of Quiet Operation" kicker="Financial impact" right={<span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#98A29A]">Based on your assumptions</span>}>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              {[
                ['Current operating cost', `${money(hourly, 5)} / h`],
                ['Estimated daily cost', money(daily)],
                ['Estimated monthly cost', money(monthly)],
                ['Energy price assumption', `$${price.toFixed(2)} / kWh`],
                ['Cost per decibel-hour reduced', reduction > 0.05 ? `$${(hourly / reduction).toFixed(6)}` : 'n/a'],
                ['Projected avoided mitigation cost', `${avoided >= 0 ? '' : '−'}$${Math.abs(avoided).toFixed(2)} / mo`],
              ].map(([k, v]) => (
                <div key={k}><p className="text-xs text-[#98A29A]">{k}</p><p className="mt-1 font-mono text-xl">{v}</p></div>
              ))}
              <p className="col-span-full text-xs leading-relaxed text-[#98A29A]">
                Avoided mitigation cost is an illustrative projection: it assumes the given share of a passive-mitigation cost would otherwise be needed, minus this system’s monthly energy cost. It is not a measured saving.
              </p>
            </div>
            <div className="grid content-start gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#98A29A]">Assumptions (editable)</p>
              <label className="grid gap-1.5">Energy price ($/kWh)
                <input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(Math.max(0, +e.target.value || 0))} className="rounded-lg border border-white/10 bg-[#0B0F0D] px-3 py-2 font-mono focus:border-[#5FE89A] focus:outline-none" />
              </label>
              <label className="grid gap-1.5">Alternative passive mitigation ($/month, amortized)
                <input type="number" min={0} step={10} value={altMonthly} onChange={(e) => setAltMonthly(Math.max(0, +e.target.value || 0))} className="rounded-lg border border-white/10 bg-[#0B0F0D] px-3 py-2 font-mono focus:border-[#5FE89A] focus:outline-none" />
              </label>
              <label className="grid gap-1.5">Share displaced by ANC: <span className="font-mono text-[#5FE89A]">{share}%</span>
                <input type="range" min={0} max={100} value={share} onChange={(e) => setShare(+e.target.value)} className="accent-[#5FE89A]" />
              </label>
            </div>
          </div>
        </Panel>

        {/* compliance */}
        <Panel
          title="Legal compliance monitoring"
          kicker="Configured threshold profile"
          right={
            <div role="group" aria-label="Simulated time of day" className="flex rounded-full border border-white/10 p-0.5 text-xs">
              {([['night', 'Night · 02:14'], ['day', 'Day · 14:00']] as const).map(([id, label]) => (
                <button key={id} aria-pressed={mode === id} onClick={() => setMode(id)} className={`rounded-full px-3 py-1.5 transition-colors ${mode === id ? 'bg-[#EDEEE9] text-[#0B0F0D]' : 'text-[#98A29A] hover:text-[#EDEEE9]'}`}>{label}</button>
              ))}
            </div>
          }
        >
          <div role="note" className="mb-6 flex gap-3 rounded-2xl border border-[#E8A73E]/40 bg-[#E8A73E]/[0.07] p-4 text-sm text-[#F0C777]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p><strong className="font-semibold">Your microphone is probably not calibrated as a legally certified sound-level meter.</strong></p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm text-[#98A29A]">Prince William County: Configured Profile</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {[
                  ['Day threshold', `${THRESHOLDS.day} dBA`],
                  ['Night threshold', `${THRESHOLDS.night} dBA`],
                  ['Applicable threshold now', `${threshold} dBA`],
                  ['Current estimated level', `${residual.toFixed(1)} dBA`],
                  ['Margin', margin >= 0 ? `${margin.toFixed(1)} dB below threshold` : `${Math.abs(margin).toFixed(1)} dB above threshold`],
                  ['Time of day (simulated)', mode === 'night' ? '02:14 · night' : '14:00 · day'],
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-[#98A29A]">{k}</dt><dd className="mt-0.5 font-mono text-[#EDEEE9]">{v}</dd></div>
                ))}
                <div className="col-span-2">
                  <dt className="text-xs text-[#98A29A]">Status</dt>
                  <dd className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${over ? 'bg-[#E85F5F]/15 text-[#E85F5F]' : margin < 2 ? 'bg-[#E8A73E]/15 text-[#E8A73E]' : 'bg-[#5FE89A]/15 text-[#5FE89A]'}`}>
                    {over ? 'Above configured threshold' : 'Within configured threshold'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <p className="text-sm text-[#98A29A]">Baseline without THRESHOLD vs. measured with THRESHOLD</p>
              <div className="relative mt-5 grid gap-4" role="img" aria-label={`Baseline ${BASELINE_PEAK} dBA versus measured ${residual.toFixed(1)} dBA against a ${threshold} dBA threshold`}>
                {[
                  ['Without THRESHOLD', BASELINE_PEAK, '#8B938A'],
                  ['With THRESHOLD', residual, over ? '#E85F5F' : '#5FE89A'],
                ].map(([label, v, color]) => (
                  <div key={label as string}>
                    <div className="mb-1 flex justify-between text-xs"><span className="text-[#98A29A]">{label}</span><span className="font-mono text-[#EDEEE9]">{(v as number).toFixed(1)} dBA</span></div>
                    <div className="h-3 rounded-full bg-white/[0.06]"><div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${(((v as number) - 30) / 45) * 100}%`, background: color as string }} /></div>
                  </div>
                ))}
                <div aria-hidden className="pointer-events-none absolute -bottom-2 -top-1 w-px bg-[#E8A73E]" style={{ left: `${((threshold - 30) / 45) * 100}%` }}>
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-[#E8A73E]">{threshold} dBA</span>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-[#98A29A]">Exceedances (this session)</p><p className="mt-0.5 font-mono text-2xl">{exceed}</p></div>
                <div><p className="text-xs text-[#98A29A]">Threshold warnings</p><p className="mt-0.5 font-mono text-2xl">{warnings.length}</p></div>
              </div>
              <ul className="mt-3 grid gap-2 text-sm" aria-live="polite">
                {warnings.length === 0 && <li className="text-[#98A29A]">No threshold warnings.</li>}
                {warnings.map((w, i) => <li key={i} className="flex gap-2 text-[#F0A0A0]"><span className="font-mono text-[#98A29A]">{w.t}</span>{w.text}</li>)}
              </ul>
            </div>
          </div>

          <p className="mt-8 border-t border-white/[0.07] pt-4 text-sm text-[#98A29A]">Prototype readings are not certified compliance measurements.</p>
        </Panel>
      </main>
    </div>
  );
}
