import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import Nav, { Footer } from '../ui/Nav';
import { PreviewBadge } from '../ui/Buttons';
import { useTheme } from '../useTheme';
import {
  CANDIDATES, DEFAULT_WEIGHTS, FACTORS, PRESETS, communityImpact, effectiveWeights, gridReadiness, habitatImpact, scoreCandidate,
  waterStress, type Level, type Weights,
} from './data';

const field = 'w-full rounded-xl border border-[#2B2E28]/15 bg-white px-3.5 py-2.5 text-[15px] text-[#2B2E28] focus:border-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]/15';

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm text-[#5B5F56]">
      <span className="font-medium text-[#2B2E28]">{label}</span>
      {children}
      {hint}
    </label>
  );
}

function Segmented({ value, onChange, label }: { value: Level; onChange: (v: Level) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-[#2B2E28]/15 bg-white p-0.5">
      {(['Low', 'Medium', 'High'] as Level[]).map((l) => (
        <button key={l} type="button" role="radio" aria-checked={value === l} onClick={() => onChange(l)} className={`flex-1 rounded-full px-3 py-1.5 text-sm transition-colors ${value === l ? 'bg-[#1F3D2B] text-[#FAFAF7]' : 'text-[#5B5F56] hover:text-[#2B2E28]'}`}>{l}</button>
      ))}
    </div>
  );
}

// Colour only reinforces the label; the text is always shown.
const chip: Record<Level, string> = {
  Low: 'bg-[#E4EBE1] text-[#1F3D2B]',
  Medium: 'bg-[#F4EBD3] text-[#7A5A12]',
  High: 'bg-[#F3DCD7] text-[#8A2F26]',
};
const Chip = ({ v, good }: { v: Level; good?: 'high' }) => {
  // For "grid readiness", High is the good outcome, so invert the tint.
  const tint = good === 'high' ? (v === 'High' ? 'Low' : v === 'Low' ? 'High' : 'Medium') : v;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${chip[tint]}`}>{v}</span>;
};

export default function SiteIntelligence() {
  useTheme('threshold');

  // company inputs
  const [mw, setMw] = useState(40);
  const [footprint, setFootprint] = useState(250000);
  const [region, setRegion] = useState('Virginia');
  const [maxDist, setMaxDist] = useState(60);
  const [power, setPower] = useState('Within 24 months');
  const [cooling, setCooling] = useState('Liquid');
  const [water, setWater] = useState(150000);
  const [fiber, setFiber] = useState('< 10 ms to a major exchange');
  const [expansion, setExpansion] = useState('Phase 2 within 3 years');
  const [noiseSens, setNoiseSens] = useState<Level>('Medium');
  const [wildSens, setWildSens] = useState<Level>('Medium');

  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const eff = effectiveWeights(weights);
  const rawSum = FACTORS.reduce((a, f) => a + weights[f.id], 0);

  const ranked = useMemo(
    () => CANDIDATES.map((c) => ({ c, ...scoreCandidate(c, weights) })).sort((a, b) => b.total - a.total),
    [weights],
  );

  const bump = (ids: (keyof Weights)[]) => setWeights((w) => ({ ...w, ...Object.fromEntries(ids.map((id) => [id, Math.min(50, w[id] + 10)])) }));

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#2B2E28]">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <header className="max-w-3xl">
          <div className="flex items-center gap-3"><p className="text-[11px] uppercase tracking-[0.2em] text-[#3D6B4A]">Site Intelligence</p><PreviewBadge /></div>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4.4rem)] leading-[1] tracking-[-0.02em]">Screen sites for lower community impact.</h1>
          <p className="mt-5 text-[17px] leading-relaxed text-[#5B5F56]">
            Describe the facility, then compare candidate locations using a disruption score whose weights you can see and change. The candidates below are illustrative sample data, and this is a preliminary screen, not a siting decision.
          </p>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-10">
          {/* company inputs */}
          <section aria-labelledby="inputs-h" className="h-fit min-w-0 rounded-3xl border border-[#2B2E28]/10 bg-[#F3F2EC] p-6">
            <h2 id="inputs-h" className="font-display text-2xl">Company inputs</h2>
            <form className="mt-5 grid gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Required IT capacity (MW)"><input className={field} type="number" min={1} value={mw} onChange={(e) => setMw(+e.target.value)} /></Field>
                <Field label="Facility footprint (sq ft)"><input className={field} type="number" min={0} step={5000} value={footprint} onChange={(e) => setFootprint(+e.target.value)} /></Field>
              </div>
              <Field label="Preferred state or region">
                <select className={field} value={region} onChange={(e) => setRegion(e.target.value)}>
                  {['Virginia', 'Texas', 'Ohio', 'Arizona', 'Oregon', 'Georgia', 'No preference'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Max distance from a major city (mi)"><input className={field} type="number" min={0} value={maxDist} onChange={(e) => setMaxDist(+e.target.value)} /></Field>
              <Field label="Required power availability">
                <select className={field} value={power} onChange={(e) => setPower(e.target.value)}>
                  {['Immediately', 'Within 12 months', 'Within 24 months', 'Within 36+ months'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cooling method">
                  <select className={field} value={cooling} onChange={(e) => setCooling(e.target.value)}>{['Air', 'Liquid', 'Hybrid', 'Evaporative'].map((o) => <option key={o}>{o}</option>)}</select>
                </Field>
                <Field label="Water demand (gal/day)"><input className={field} type="number" min={0} step={5000} value={water} onChange={(e) => setWater(+e.target.value)} /></Field>
              </div>
              <Field label="Latency / fiber requirements">
                <select className={field} value={fiber} onChange={(e) => setFiber(e.target.value)}>{['< 5 ms to a major exchange', '< 10 ms to a major exchange', '< 20 ms to a major exchange', 'Not critical'].map((o) => <option key={o}>{o}</option>)}</select>
              </Field>
              <Field label="Expansion plans">
                <select className={field} value={expansion} onChange={(e) => setExpansion(e.target.value)}>{['None planned', 'Phase 2 within 3 years', 'Campus build-out (5+ years)'].map((o) => <option key={o}>{o}</option>)}</select>
              </Field>
              <div className="grid gap-2">
                <span className="text-sm font-medium">Community-noise sensitivity</span>
                <Segmented label="Community-noise sensitivity" value={noiseSens} onChange={setNoiseSens} />
                {noiseSens === 'High' && (
                  <button type="button" onClick={() => bump(['residential', 'noise'])} className="justify-self-start text-sm text-[#1F3D2B] underline underline-offset-4">Raise residential-distance and ambient-noise weights</button>
                )}
              </div>
              <div className="grid gap-2">
                <span className="text-sm font-medium">Wildlife / ecological sensitivity</span>
                <Segmented label="Wildlife and ecological sensitivity" value={wildSens} onChange={setWildSens} />
                {wildSens === 'High' && (
                  <button type="button" onClick={() => bump(['wildlife'])} className="justify-self-start text-sm text-[#1F3D2B] underline underline-offset-4">Raise the wildlife and habitat weight</button>
                )}
              </div>
            </form>
            <p className="mt-5 rounded-xl bg-[#FAFAF7] p-3 text-xs leading-relaxed text-[#5B5F56]" aria-live="polite">
              Brief: {mw} MW · {footprint.toLocaleString()} sq ft · {region} · within {maxDist} mi · {cooling.toLowerCase()} cooling · {water.toLocaleString()} gal/day · {power.toLowerCase()} · {fiber} · {expansion.toLowerCase()}. In this demo the brief is recorded but does not change the sample candidates; the weights below do.
            </p>
          </section>

          <div className="grid min-w-0 gap-8">
            {/* results */}
            <section aria-labelledby="results-h" className="min-w-0 rounded-3xl border border-[#2B2E28]/10 p-6">
              <h2 id="results-h" className="font-display text-2xl">Recommended results: top 3 candidates</h2>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#2B2E28]/10 text-[11px] uppercase tracking-[0.12em] text-[#5B5F56]">
                      <th className="py-3 pr-3 font-medium">Candidate</th><th className="py-3 pr-3 font-medium">Suitability</th><th className="py-3 pr-3 font-medium">Community impact</th><th className="py-3 pr-3 font-medium">Grid readiness</th><th className="py-3 pr-3 font-medium">Water stress</th><th className="py-3 font-medium">Habitat impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((r, i) => (
                      <motion.tr layout key={r.c.name} transition={{ type: 'spring', stiffness: 420, damping: 38 }} className="border-b border-[#2B2E28]/[0.07] last:border-0">
                        <td className="py-4 pr-3"><span className="mr-2 font-mono text-xs text-[#5B5F56]">{i + 1}</span><span className="font-medium">{r.c.name}</span></td>
                        <td className="py-4 pr-3">
                          <p className="font-mono text-lg">{Math.round(r.total)}<span className="text-xs text-[#5B5F56]">/100</span></p>
                          <div className="mt-1.5 flex h-1.5 w-28 overflow-hidden rounded-full bg-[#E4EBE1]" aria-hidden>
                            {r.parts.map((p, k) => <span key={p.id} style={{ width: `${p.value}%`, background: FACTORS[k].color }} />)}
                          </div>
                        </td>
                        <td className="py-4 pr-3"><Chip v={communityImpact(r.c)} /></td>
                        <td className="py-4 pr-3"><Chip v={gridReadiness(r.c)} good="high" /></td>
                        <td className="py-4 pr-3"><Chip v={waterStress(r.c)} /></td>
                        <td className="py-4"><Chip v={habitatImpact(r.c)} /></td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#5B5F56]">
                Suitability = Σ (factor sub-score × effective weight). The bar under each score shows each factor’s contribution. Labels come from the factor sub-scores: community impact from residential distance, grid readiness from grid availability, water stress from water score, habitat impact from wildlife sensitivity.
              </p>
            </section>

            {/* weights */}
            <section aria-labelledby="weights-h" className="rounded-3xl border border-[#2B2E28]/10 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 id="weights-h" className="font-display text-2xl">Disruption score weights</h2>
                  <p className="mt-1 text-sm text-[#5B5F56]">Drag a slider and the scores above recompute. Weights are normalized to 100%.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setWeights(p.weights)} title={p.note} className="rounded-full border border-[#2B2E28]/20 px-3.5 py-1.5 text-sm text-[#2B2E28] transition-[transform,background-color] duration-200 hover:bg-[#E4EBE1] active:scale-[0.97]">{p.label}</button>
                  ))}
                </div>
              </div>
              <ul className="mt-6 grid gap-5">
                {FACTORS.map((f) => (
                  <li key={f.id} className="grid gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <label htmlFor={`w-${f.id}`} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: f.color }} />{f.label}</label>
                      <span className="font-mono text-[#2B2E28]">{eff[f.id].toFixed(0)}%</span>
                    </div>
                    <input
                      id={`w-${f.id}`}
                      type="range"
                      min={0}
                      max={50}
                      step={1}
                      value={weights[f.id]}
                      onChange={(e) => setWeights((w) => ({ ...w, [f.id]: +e.target.value }))}
                      className="w-full accent-[#1F3D2B]"
                      aria-valuetext={`${eff[f.id].toFixed(0)} percent`}
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between border-t border-[#2B2E28]/10 pt-4 text-sm text-[#5B5F56]">
                <span>Raw total {rawSum} → effective 100%</span>
                <button type="button" onClick={() => setWeights(DEFAULT_WEIGHTS)} className="text-[#1F3D2B] underline underline-offset-4">Reset to defaults</button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
