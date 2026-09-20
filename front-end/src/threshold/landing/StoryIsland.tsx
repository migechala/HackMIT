/**
 * Adapted from Watermelon UI "scroll-island" (https://registry.watermelon.sh/r/scroll-island.json).
 * Changes: bound to the scrubbed story progress instead of an inner scroller, anchored to the
 * bottom of the pinned stage so it grows upward, chapters jump to positions in the pinned scroll,
 * brand colours, keyboard + reduced-motion support. The progress ring and % are written straight
 * to the DOM (no React re-render per scroll frame).
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronUp } from 'lucide-react';
import useMeasure from 'react-use-measure';
import { story } from '../scene/story';
import { BEATS } from './beats';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export default function StoryIsland() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [beat, setBeat] = useState(0);
  const [started, setStarted] = useState(false);
  const ring = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const [measureRef, bounds] = useMeasure({ offsetSize: true });

  useEffect(() => {
    const apply = (p: number) => {
      ring.current?.style.setProperty('--p', `${(p * 100).toFixed(1)}%`);
      if (pct.current) pct.current.textContent = `${Math.round(p * 100)}%`;
      setBeat(Math.max(0, BEATS.findIndex((b, i) => p < b.to || i === BEATS.length - 1)));
      setStarted(p > 0.02);
    };
    apply(story.progress);
    story.listeners.add(apply);
    return () => { story.listeners.delete(apply); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const jump = (i: number) => {
    const st = ScrollTrigger.getAll().find((t) => t.pin);
    if (!st) return;
    const b = BEATS[i];
    const p = i === BEATS.length - 1 ? 0.94 : b.from + 0.02;
    window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: reduce ? 'auto' : 'smooth' });
    setOpen(false);
  };

  const spring = reduce ? { duration: 0.01 } : { type: 'spring' as const, duration: 0.5, bounce: 0.15 };

  return (
    <MotionConfig transition={spring}>
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            aria-hidden
            className="absolute inset-0 z-20 bg-[#2B2E28]/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex items-end justify-center px-4 sm:bottom-5">
        <motion.nav
          aria-label="Story chapters"
          className="pointer-events-auto overflow-hidden bg-[#1F3D2B] text-[#FAFAF7] shadow-[0_10px_30px_-12px_rgba(31,61,43,0.55)]"
          initial={false}
          animate={{ height: bounds.height > 0 ? bounds.height : 'auto', width: open ? 300 : 236, borderRadius: open ? 24 : 28 }}
        >
          <div ref={measureRef} className="flex w-full flex-col">
            <AnimatePresence initial={false}>
              {open && (
                <motion.ul
                  id="story-chapters"
                  className="flex flex-col gap-0.5 px-2 pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                >
                  {BEATS.map((b, i) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => jump(i)}
                        aria-current={i === beat ? 'step' : undefined}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                          i === beat ? 'bg-[#FAFAF7]/12 text-[#FAFAF7]' : 'text-[#FAFAF7]/65 hover:text-[#FAFAF7]'
                        }`}
                      >
                        <span>{b.label}</span>
                        <span className="text-xs tabular-nums text-[#FAFAF7]/45">{Math.round(b.from * 100)}%</span>
                      </button>
                    </li>
                  ))}
                  <li aria-hidden className="mx-3 mt-1 h-px bg-[#FAFAF7]/10" />
                </motion.ul>
              )}
            </AnimatePresence>

            <button
              type="button"
              aria-expanded={open}
              aria-controls="story-chapters"
              onClick={() => setOpen((o) => !o)}
              className="flex h-12 w-full items-center gap-3 px-4 text-left transition-transform duration-150 ease-out active:scale-[0.98]"
            >
              <div
                ref={ring}
                aria-hidden
                className="relative size-6 shrink-0 rounded-full"
                style={{ background: 'conic-gradient(#5FB8C9 var(--p, 0%), rgba(250,250,247,0.2) 0)' }}
              >
                <div className="absolute inset-[3px] rounded-full bg-[#1F3D2B]" />
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                <span key={started ? beat : 'cue'} className="block animate-[label-in_160ms_cubic-bezier(0.23,1,0.32,1)]">
                  {started ? BEATS[beat].label : 'Scroll to explore'}
                </span>
              </span>
              <span ref={pct} className="text-xs tabular-nums text-[#FAFAF7]/60">0%</span>
              <ChevronUp className={`size-4 shrink-0 text-[#FAFAF7]/60 transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </motion.nav>
      </div>
    </MotionConfig>
  );
}
