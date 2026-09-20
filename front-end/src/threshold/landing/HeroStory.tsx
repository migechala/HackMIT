import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setProgress, sstep, story } from '../scene/story';
import { useReducedMotion, webglAvailable } from '../hooks';
import { BEATS, type Beat } from './beats';
import { PrimaryButton, SecondaryButton, PreviewBadge } from '../ui/Buttons';
import StoryIsland from './StoryIsland';

gsap.registerPlugin(ScrollTrigger);

// three.js + the scene load as their own chunk so the rest of the page is interactive sooner.
const SceneCanvas = lazy(() => import('../scene/SceneCanvas'));
const SceneLoading = () => (
  <div role="status" className="absolute inset-0 grid place-items-center bg-[#F5F6F3] text-sm text-[#5B5F56]">Preparing scene…</div>
);

const SCROLL_SCREENS = 4; // pinned distance; with the 1-screen stage the section spans ~5 viewport heights

function BeatText({ beat, headline }: { beat: Beat; headline?: boolean }) {
  return (
    <>
      <h2
        className={
          headline
            ? 'font-display text-balance text-[clamp(2.4rem,5vw,4.6rem)] leading-[1] text-[#2B2E28]'
            : 'font-display text-balance text-[clamp(2rem,3.8vw,3.2rem)] leading-[1.04] text-[#2B2E28]'
        }
      >
        {beat.title}
      </h2>
      {beat.body && <p className="mt-5 max-w-md text-[clamp(1rem,1.3vw,1.2rem)] leading-relaxed text-[#5B5F56]">{beat.body}</p>}
      {beat.note && <p className="mt-4 max-w-md border-l-2 border-[#3D6B4A]/40 pl-3 text-[13px] leading-relaxed text-[#5B5F56]">{beat.note}</p>}
    </>
  );
}

function StoryCtas() {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3">
      <PrimaryButton to="/dashboard">Explore the Platform</PrimaryButton>
      <SecondaryButton to="/site-intelligence">Site Intelligence</SecondaryButton>
      <PreviewBadge />
    </div>
  );
}

/** Scroll-linked overlay: each beat's opacity/offset is a pure function of progress. */
function StoryOverlay() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const hint = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const apply = (p: number) => {
      BEATS.forEach((b, i) => {
        const el = refs.current[i];
        if (!el) return;
        const last = i === BEATS.length - 1;
        const fadeIn = i === 0 ? 1 : sstep(b.from + 0.005, b.from + 0.04, p);
        const fadeOut = last ? 0 : sstep(b.to - 0.035, b.to + 0.005, p);
        const o = fadeIn * (1 - fadeOut);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(1 - fadeIn) * 28 - fadeOut * 20}px, 0)`;
        el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });
      if (hint.current) hint.current.style.opacity = String(sstep(0.46, 0.54, p));
    };
    apply(story.progress);
    story.listeners.add(apply);
    return () => { story.listeners.delete(apply); };
  }, []);

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] bg-[linear-gradient(to_top,#F5F6F3_0%,rgba(245,246,243,0.94)_34%,rgba(245,246,243,0)_58%)] md:bg-[radial-gradient(ellipse_75%_62%_at_0%_100%,#F5F6F3_0%,rgba(245,246,243,0.94)_42%,rgba(245,246,243,0)_82%)] lg:bg-[radial-gradient(ellipse_48%_70%_at_0%_50%,#F5F6F3_0%,rgba(245,246,243,0.9)_46%,rgba(245,246,243,0)_88%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-5 pb-24 sm:px-10 sm:pb-16 md:px-14 md:pb-20 lg:inset-y-0 lg:flex lg:items-center lg:pb-0">
        <div className="relative mx-auto h-[19rem] w-full max-w-6xl sm:h-[21rem] lg:h-[28rem]">
          {BEATS.map((b, i) => (
            <div key={b.id} ref={(el) => { refs.current[i] = el; }} className="absolute inset-x-0 bottom-0 max-w-3xl will-change-transform lg:inset-y-0 lg:flex lg:max-w-xl lg:flex-col lg:justify-center" style={{ opacity: i === 0 ? 1 : 0 }}>
              <div className="flex flex-col justify-end">
                <BeatText beat={b} headline={i === 0 || i === BEATS.length - 1} />
                {b.id === 'final' && <StoryCtas />}
              </div>
            </div>
          ))}
        </div>
      </div>
      <StoryIsland />
      <p ref={hint} aria-hidden className="pointer-events-none absolute bottom-6 right-10 z-10 hidden rounded-full bg-[#FAFAF7]/90 px-3.5 py-1.5 text-xs text-[#5B5F56] opacity-0 lg:block">
        Move your pointer to direct. Double-click to change focus.
      </p>
    </>
  );
}

/** Reduced-motion / no-WebGL: normal document flow, story text laid out as plain sections. */
function FlowBeats() {
  return (
    <ol className="mx-auto flex max-w-3xl flex-col gap-14 px-6 py-16">
      {BEATS.map((b, i) => (
        <li key={b.id}>
          <BeatText beat={b} headline={i === 0 || i === BEATS.length - 1} />
          {b.id === 'final' && <StoryCtas />}
        </li>
      ))}
    </ol>
  );
}

export default function HeroStory() {
  const reduced = useReducedMotion();
  const [gl] = useState(webglAvailable);
  const wrap = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const scrolled = !reduced && gl;

  // Bind scene progress to scroll with scrub (1:1 in both directions, no independent timer).
  useLayoutEffect(() => {
    if (!scrolled) {
      setProgress(1); // static coexistence frame
      return;
    }
    setProgress(0);
    const ctx = gsap.context(() => {
      const proxy = { p: 0 };
      gsap.to(proxy, {
        p: 1,
        ease: 'none',
        onUpdate: () => setProgress(proxy.p),
        scrollTrigger: {
          trigger: wrap.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * SCROLL_SCREENS}`,
          pin: stage.current,
          scrub: 0.25,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [scrolled]);

  // Stop rendering the canvas once the story has scrolled away.
  useEffect(() => {
    const el = stage.current;
    if (!el || !scrolled) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [scrolled]);

  if (!scrolled) {
    return (
      <section aria-label="THRESHOLD story" className="bg-[#F5F6F3] pt-20">
        <div className="relative h-[68svh] min-h-[22rem] w-full overflow-hidden">
          <Suspense fallback={<SceneLoading />}>{gl ? <SceneCanvas still /> : <SceneCanvas />}</Suspense>
        </div>
        <FlowBeats />
      </section>
    );
  }

  return (
    <section ref={wrap} aria-label="THRESHOLD story" className="relative">
      <div ref={stage} className="relative h-svh w-full overflow-hidden bg-[#F5F6F3]">
        <Suspense fallback={<SceneLoading />}><SceneCanvas paused={!visible} /></Suspense>
        <StoryOverlay />
      </div>
    </section>
  );
}
