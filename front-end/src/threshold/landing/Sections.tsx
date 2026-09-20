import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { siArduino, siAsus, siEspressif } from 'simple-icons';
import { ArrowUpRight } from 'lucide-react';
import { PreviewBadge } from '../ui/Buttons';
import Spot from '../ui/Spotlight';

/**
 * Scroll reveal. Purpose: sequence. It tells the reader which tile to read next, so tiles enter
 * with a short stagger. Transform + opacity only, strong ease-out, gentler under reduced motion.
 */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: reduce ? 'translateY(0px)' : 'translateY(16px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduce ? 0.2 : 0.5, delay: reduce ? 0 : delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

// viewBox is cropped per mark so the three read at a similar optical size
const LOGOS = [
  { icon: siAsus, viewBox: '0 8.4 24 7.2', cls: 'h-5 sm:h-6' },
  { icon: siArduino, viewBox: '0 5 24 14', cls: 'h-7 sm:h-8' },
  { icon: siEspressif, viewBox: '0 0 24 24', cls: 'h-8 sm:h-9' },
];

/** The single marquee on the page: a muted, low-contrast row of real brand marks (Simple Icons). */
export function LogoStrip() {
  const row = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];
  return (
    <section aria-label="Hardware ecosystem" className="bg-[#FAFAF7] py-10">
      <p className="mb-6 text-center text-sm text-[#5B5F56]/70">Prototype hardware ecosystem</p>
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]">
        <ul className="flex w-max animate-[marquee_40s_linear_infinite] items-center gap-24 pr-24 motion-reduce:animate-none" aria-hidden>
          {row.map(({ icon, viewBox, cls }, i) => (
            <li key={i} className="text-[#2B2E28]/25">
              <svg viewBox={viewBox} className={`${cls} w-auto`} fill="currentColor"><path d={icon.path} /></svg>
            </li>
          ))}
        </ul>
      </div>
      <span className="sr-only">ASUS, Arduino, Espressif</span>
    </section>
  );
}

/* ---- tile visuals (colours are passed in so each tile reads on its own background) ---- */

function AntiPhase({ noise, anti, flat }: { noise: string; anti: string; flat: string }) {
  const w = 360, h = 130;
  const pts = (f: (x: number) => number) =>
    Array.from({ length: 121 }, (_, i) => `${(i / 120) * w},${h / 2 - f((i / 120) * Math.PI * 6) * 38}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="A tonal noise wave, its inverted copy, and their near-flat sum">
      <polyline points={pts(Math.sin)} fill="none" stroke={noise} strokeWidth="2" />
      <polyline points={pts((x) => -Math.sin(x))} fill="none" stroke={anti} strokeWidth="2" strokeDasharray="5 4" />
      <line x1="0" x2={w} y1={h / 2} y2={h / 2} stroke={flat} strokeWidth="2.5" />
    </svg>
  );
}

function Absorber() {
  return (
    <svg viewBox="0 0 360 120" className="w-full" role="img" aria-label="Sound waves entering an absorbing panel and leaving weaker">
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M ${30 + i * 28} 20 Q ${44 + i * 28} 60 ${30 + i * 28} 100`} fill="none" stroke="#1F3D2B" strokeOpacity={0.7 - i * 0.14} strokeWidth="2" />
      ))}
      <rect x="170" y="14" width="34" height="92" rx="6" fill="#FAFAF7" stroke="#3D6B4A" />
      {Array.from({ length: 8 }, (_, i) => <line key={i} x1="177" x2="197" y1={24 + i * 10} y2={24 + i * 10} stroke="#3D6B4A" strokeOpacity=".5" />)}
      {[0, 1].map((i) => (
        <path key={i} d={`M ${226 + i * 26} 44 Q ${236 + i * 26} 60 ${226 + i * 26} 76`} fill="none" stroke="#1F3D2B" strokeOpacity={0.3 - i * 0.1} strokeWidth="2" />
      ))}
    </svg>
  );
}

function Meter() {
  const bars = [30, 44, 38, 62, 88, 56, 40, 34, 28, 22];
  return (
    <svg viewBox="0 0 360 120" className="w-full" role="img" aria-label="Spectrum bars with one dominant tonal peak highlighted">
      {bars.map((b, i) => (
        <rect key={i} x={20 + i * 33} y={110 - b} width="22" height={b} rx="4" fill={i === 4 ? '#3D9FB3' : '#C9CFC0'} />
      ))}
    </svg>
  );
}

function Screening() {
  const rows = [87, 81, 62];
  return (
    <div className="grid gap-3" role="img" aria-label="Three candidate sites ranked by suitability score">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-4 text-xs text-[#2B2E28]/60">{'ABC'[i]}</span>
          <div className="h-2.5 flex-1 rounded-full bg-[#2B2E28]/8"><div className="h-full rounded-full bg-[#1F3D2B]" style={{ width: `${r}%` }} /></div>
          <span className="w-7 text-right font-mono text-xs text-[#2B2E28]">{r}</span>
        </div>
      ))}
    </div>
  );
}

// One radius for every card on the page (28px); buttons are pills.
const tile = 'flex min-h-[19rem] flex-col justify-between gap-8 rounded-[28px] p-7 sm:p-9';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-[#FAFAF7] px-4 pb-24 pt-16 sm:px-8 md:pb-32 md:pt-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-3xl font-display text-[clamp(2rem,3.8vw,3.2rem)] leading-[1.05] text-[#2B2E28]">
            Treat the noise where it starts. Then measure what it took.
          </h2>
        </Reveal>

        {/* 4 tiles, 4 cells: 4+2 over 2+4, each with its own surface */}
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <Spot as="article" tone="light" className={`${tile} h-full bg-[#1F3D2B] text-[#FAFAF7] md:grid md:grid-cols-[1fr_minmax(0,17rem)] md:items-center md:gap-10`}>
              <div>
                <h3 className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight">Cancel the tone at its source.</h3>
                <p className="mt-4 max-w-md leading-relaxed text-[#FAFAF7]/72">
                  Fans, transformers and pumps hum at a few steady frequencies. THRESHOLD emits the inverse wave at the dominant tone, so the two partly cancel in controlled spaces.
                </p>
              </div>
              <div className="mt-8 md:mt-0">
                <AntiPhase noise="#FAFAF7" anti="#5FB8C9" flat="#7FD9A6" />
              </div>
            </Spot>
          </Reveal>

          <Reveal delay={0.06} className="md:col-span-2">
            <Spot as="article" tone="dark" className={`${tile} h-full bg-[#E4EBE1] text-[#2B2E28]`}>
              <div>
                <h3 className="font-display text-[clamp(1.5rem,2.2vw,1.9rem)] leading-tight">Passive treatment does the rest.</h3>
                <p className="mt-4 leading-relaxed text-[#5B5F56]">Absorbers, enclosures and isolation handle the broadband noise a single inverted tone cannot.</p>
              </div>
              <Absorber />
            </Spot>
          </Reveal>

          <Reveal delay={0.06} className="md:col-span-2">
            <Spot as="article" tone="dark" className={`${tile} h-full border border-[#2B2E28]/10 bg-[#F3F2EC] text-[#2B2E28]`}>
              <div>
                <h3 className="font-display text-[clamp(1.5rem,2.2vw,1.9rem)] leading-tight">Measured continuously.</h3>
                <p className="mt-4 leading-relaxed text-[#5B5F56]">Noise level and mitigation energy sit side by side. Readings come from prototype hardware, not certified meters.</p>
              </div>
              <Meter />
            </Spot>
          </Reveal>

          <Reveal delay={0.12} className="md:col-span-4">
            <Spot as="article" tone="dark" className={`${tile} h-full bg-[#DCEEF2] text-[#2B2E28] md:grid md:grid-cols-[1fr_minmax(0,17rem)] md:items-center md:gap-10`}>
              <div>
                <h3 className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight">Screen sites early.</h3>
                <p className="mt-4 max-w-md leading-relaxed text-[#3F4A4D]">
                  Compare candidate locations on community, land use, grid, water and habitat, with weights you can change. A preliminary screen, not a verdict.
                </p>
                <Link to="/site-intelligence" className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#1F3D2B] py-1.5 pl-5 pr-1.5 text-sm font-medium text-[#FAFAF7] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]">
                  Site Intelligence
                  <span className="grid size-8 place-items-center rounded-full bg-[#FAFAF7]/15"><ArrowUpRight className="size-3.5" /></span>
                </Link>
              </div>
              <div className="mt-8 md:mt-0"><Screening /></div>
            </Spot>
          </Reveal>
        </div>

        <Reveal>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-[#5B5F56]">
            What THRESHOLD does not claim: total data-center energy savings, certified legal compliance, or proven wildlife recovery.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const SUSTAIN = [
  {
    title: 'Noise is a pollutant.',
    body: 'A constant low-frequency hum reaches homes, sleep and wildlife long before it reaches a regulator. Quieting it at the source is part of building infrastructure that neighbors can live beside.',
  },
  {
    title: 'Mitigation you can audit.',
    body: 'THRESHOLD reports the power a mitigation system draws, the energy used today and the cost per decibel-hour, so the footprint of the fix is visible next to the result.',
  },
  {
    title: 'Lower-impact siting from the start.',
    body: 'Site Intelligence screens locations on brownfield reuse, water stress, habitat sensitivity and distance from homes, with weights a community review board can change.',
  },
];

// Frosted glass: an approximation built from backdrop-filter, a 1px light border and an inset highlight.
const glass =
  'border border-white/15 bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_30px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] motion-reduce:backdrop-blur-none';

export function Sustainability() {
  const reduce = useReducedMotion();
  const head = useRef<HTMLDivElement>(null);
  // Perspective tilt on the headline as it scrolls in (idea from Skiper UI skiper28, without Lenis).
  const { scrollYProgress } = useScroll({ target: head, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 32, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [reduce ? 1 : 0.2, 1]);

  return (
    <section id="sustainability" className="relative isolate scroll-mt-20 overflow-hidden bg-[#152B1E] px-4 py-24 text-[#FAFAF7] sm:px-8 md:py-32">
      {/* colour and contour rings behind the glass so the frosting has something to blur */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-10 size-[38rem] rounded-full bg-[#3D6B4A]/60 blur-[110px]" />
        <div className="absolute -right-32 top-1/3 size-[34rem] rounded-full bg-[#5FB8C9]/28 blur-[120px]" />
        <div className="absolute bottom-[-10rem] left-1/3 size-[30rem] rounded-full bg-[#8DBF76]/25 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            background: 'repeating-radial-gradient(circle at 78% 42%, transparent 0 46px, rgba(250,250,247,0.09) 46px 47px)',
            maskImage: 'radial-gradient(ellipse 70% 70% at 78% 42%, #000, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 78% 42%, #000, transparent)',
          }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28" style={{ perspective: 900 }}>
            <motion.div ref={head} style={{ rotateX, y, opacity, transformOrigin: '50% 100%' }}>
              <Spot as="div" tone="light" className={`rounded-[28px] p-7 sm:p-9 ${glass}`}>
                <h2 className="text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.05]">
                  Sustainable infrastructure includes the sound it makes.
                </h2>
                <p className="mt-5 leading-relaxed text-[#FAFAF7]/72">
                  Data centers are scaling fast. The question is how much of their footprint lands on the people and wildlife nearby.
                </p>
              </Spot>
            </motion.div>
          </div>
        </div>

        <div className="grid content-start gap-4 lg:col-span-7">
          {SUSTAIN.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.07}>
              <Spot as="div" tone="light" className={`rounded-[28px] p-7 sm:p-8 ${glass} ${i === 1 ? 'lg:ml-10' : i === 2 ? 'lg:ml-20' : ''}`}>
                <h3 className="font-display text-[clamp(1.35rem,2vw,1.75rem)] leading-tight">{r.title}</h3>
                <p className="mt-3 max-w-lg leading-relaxed text-[#FAFAF7]/72">{r.body}</p>
              </Spot>
            </Reveal>
          ))}
        </div>

        <Reveal className="lg:col-span-12">
          <p className="max-w-2xl text-sm leading-relaxed text-[#FAFAF7]/60">
            THRESHOLD does not claim total data-center energy savings, certified legal compliance, or proven wildlife recovery. It makes noise and the cost of reducing it measurable.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function PreviewCards() {
  return (
    <section className="bg-[#F3F2EC] px-4 py-24 sm:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-2xl font-display text-[clamp(2rem,3.4vw,2.8rem)] leading-[1.05] text-[#2B2E28]">See the impact, measured.</h2>
          <p className="mt-4 max-w-xl text-[#5B5F56]">Two demo shells with illustrative data. Nothing here is connected to a real sensor or site.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Reveal>
            <Link to="/dashboard" className="group flex h-full min-h-[22rem] flex-col justify-between rounded-[28px] bg-[#0B0F0D] p-8 text-[#EDEEE9] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 sm:p-9">
              <div className="flex items-start justify-between">
                <p className="font-mono text-7xl leading-none tracking-tight text-[#5FE89A] sm:text-8xl">12.4<span className="ml-1 text-2xl text-[#EDEEE9]/55 sm:text-3xl">dB</span></p>
                <PreviewBadge className="!bg-[#5FE89A]/15 !text-[#5FE89A]" />
              </div>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <h3 className="font-display text-3xl">Explore the Platform</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#EDEEE9]/60">Live spectrum, cancellation performance, energy and cost, and configured-threshold monitoring.</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#5FE89A] text-[#0B0F0D]"><ArrowUpRight className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={0.06}>
            <Link to="/site-intelligence" className="group flex h-full min-h-[22rem] flex-col justify-between rounded-[28px] bg-[#1F3D2B] p-8 text-[#FAFAF7] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 sm:p-9">
              <div className="flex items-start justify-between gap-6">
                <div className="w-full max-w-xs">
                  <div className="grid gap-3" aria-hidden>
                    {[87, 81, 62].map((r, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-2.5 flex-1 rounded-full bg-[#FAFAF7]/12"><div className="h-full rounded-full bg-[#7FD9A6]" style={{ width: `${r}%` }} /></div>
                        <span className="w-7 text-right font-mono text-xs text-[#FAFAF7]/70">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <PreviewBadge className="!bg-[#FAFAF7] !text-[#1F3D2B]" />
              </div>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <h3 className="font-display text-3xl">Site Intelligence</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#FAFAF7]/70">Adjustable disruption-score weights and a ranked shortlist of candidate locations.</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#FAFAF7] text-[#1F3D2B]"><ArrowUpRight className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
