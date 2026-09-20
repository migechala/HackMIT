import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DatacenterHero from '../components/DatacenterHero'
import { Badge } from '../components/ui'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[color:var(--border)]/70 bg-[color:var(--bg)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)] animate-pulse-glow" />
            <span className="text-lg font-bold tracking-tight text-[color:var(--text-h)]">THRESHOLD</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-[color:var(--text-dim)] md:flex">
            <a href="#mission" className="hover:text-[color:var(--text-h)]">Mission</a>
            <a href="#how-it-works" className="hover:text-[color:var(--text-h)]">How it works</a>
            <a href="#pricing" className="hover:text-[color:var(--text-h)]">Pricing</a>
          </nav>
          <Link
            to="/login"
            className="rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 px-5 py-2 text-sm font-semibold text-[color:var(--accent)] transition hover:bg-[color:var(--accent)]/20"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-10 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>Active litigation: Mississippi · Wisconsin · Michigan</Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-[color:var(--text-h)] md:text-6xl">
            The hum nobody's ordinance can measure.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[color:var(--text-dim)]">
            Data center cooling fans, transformers, and generators produce continuous low-frequency
            tonal hum that standard sound meters miss and permitting-day testing never catches.
            THRESHOLD cancels it at the source, and proves it, continuously.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110"
            >
              View live dashboard
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-[color:var(--border)] px-6 py-3 text-sm font-semibold text-[color:var(--text)] transition hover:border-[color:var(--text-dim)]"
            >
              How it works
            </a>
          </div>
        </div>
        <DatacenterHero />
      </section>

      {/* Mission */}
      <section id="mission" className="border-t border-[color:var(--border)] bg-[color:var(--bg-elev)]/40 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-14 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-widest text-[color:var(--accent)]">Mission</span>
              <h2 className="mt-3 text-3xl font-bold text-[color:var(--text-h)] md:text-4xl">
                Enforcement is failing because measurement is failing.
              </h2>
              <p className="mt-4 text-[color:var(--text-dim)]">
                Standard A-weighted sound meters used for permitting compliance systematically
                under-report low-frequency tonal noise &mdash; exactly the component residents describe as a
                constant hum or drone. Testing also happens once, at permitting, not continuously
                as a facility ages, expands, or runs hotter.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { stat: '3 states', label: 'with active resident litigation against data center operators' },
              { stat: '1x', label: 'compliance is typically measured — at permitting, never again' },
              { stat: '20 dB', label: 'attenuation demonstrated by published industrial ANC/HVAC literature' },
            ].map((s, i) => (
              <Reveal key={s.stat} delay={i * 0.1}>
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elev)] p-6">
                  <div className="text-3xl font-bold text-[color:var(--text-h)]">{s.stat}</div>
                  <div className="mt-2 text-sm text-[color:var(--text-dim)]">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-14 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-widest text-[color:var(--accent)]">How it works</span>
              <h2 className="mt-3 text-3xl font-bold text-[color:var(--text-h)] md:text-4xl">
                Two physical layers, one compliance layer.
              </h2>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: '1. Capture the tonal hum',
                body: 'Microphones inside a confined enclosure around the fan, transformer, or generator continuously identify the dominant low-frequency tone and its harmonics.',
              },
              {
                title: '2. Emit the inverse waveform',
                body: 'A matched anti-phase (180°) waveform is generated and emitted in the enclosure, physically cancelling the tonal component — the same active noise control mechanism used in industrial HVAC and transformer noise mitigation.',
              },
              {
                title: '3. Absorb what ANC can’t',
                body: 'Passive foam and cardboard-composite absorption lining catches broadband noise outside ANC’s effective range, so both tonal and broadband components are addressed.',
              },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elev)] p-6">
                  <div className="mb-3 text-sm font-bold text-[color:var(--accent)]">{s.title}</div>
                  <p className="text-sm leading-relaxed text-[color:var(--text-dim)]">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <div className="mt-6 rounded-2xl border border-[color:var(--accent-2)]/30 bg-[color:var(--accent-2)]/8 p-6">
              <div className="mb-2 text-sm font-bold text-[color:var(--accent-2)]">Secondary layer: continuous compliance monitoring</div>
              <p className="text-sm leading-relaxed text-[color:var(--text-dim)]">
                Live readings are compared against real jurisdiction thresholds (Prince William
                County VA, Divide County ND, the PennFuture model ordinance, and others) around the
                clock &mdash; not just once at permitting &mdash; and flag when mitigation is maxed out and levels
                are still approaching the legal limit.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-[color:var(--border)] bg-[color:var(--bg-elev)]/40 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-14 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-widest text-[color:var(--accent)]">Pricing</span>
              <h2 className="mt-3 text-3xl font-bold text-[color:var(--text-h)] md:text-4xl">
                Built for every side of the noise complaint.
              </h2>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                tier: 'Community',
                price: 'Free',
                audience: 'For residents living near a monitored facility',
                features: [
                  'Public compliance status for facilities near you',
                  'Exceedance history & threshold context',
                  'File & track a noise complaint',
                  'Email alerts on sustained exceedances',
                ],
              },
              {
                tier: 'Government',
                price: '$$ / jurisdiction',
                audience: 'For regulators & code enforcement',
                features: [
                  'Continuous monitoring across all facilities in-jurisdiction',
                  'Custom ordinance threshold profiles',
                  'Exceedance audit trail for enforcement action',
                  'Multi-facility compliance dashboard',
                ],
                highlight: true,
              },
              {
                tier: 'Operator',
                price: '$$$ / facility',
                audience: 'For the companies building & running data centers',
                features: [
                  'Full ANC + compliance dashboard, all facilities',
                  'Financial impact & cost-of-quiet-operation reporting',
                  'Site intelligence & disruption-score siting tool',
                  'Proactive compliance flags before legal exposure',
                ],
              },
            ].map((p, i) => (
              <Reveal key={p.tier} delay={i * 0.1}>
                <div
                  className={`flex h-full flex-col rounded-2xl border p-6 ${
                    p.highlight
                      ? 'border-[color:var(--accent)]/50 bg-[color:var(--accent)]/8'
                      : 'border-[color:var(--border)] bg-[color:var(--bg-elev)]'
                  }`}
                >
                  <div className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-dim)]">{p.tier}</div>
                  <div className="mt-2 text-2xl font-bold text-[color:var(--text-h)]">{p.price}</div>
                  <div className="mt-1 text-xs text-[color:var(--text-dim)]">{p.audience}</div>
                  <ul className="mt-5 flex-1 space-y-2.5 text-sm text-[color:var(--text)]">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--accent)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/login"
                    className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-semibold ${
                      p.highlight ? 'bg-[color:var(--accent)] text-black' : 'border border-[color:var(--border)] text-[color:var(--text)]'
                    }`}
                  >
                    Get started
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[color:var(--border)] px-6 py-10 text-center text-xs text-[color:var(--text-dim)]">
        <p>THRESHOLD — prototype dashboard for demonstration. Readings shown after login are simulated, not certified compliance measurements.</p>
      </footer>
    </div>
  )
}
