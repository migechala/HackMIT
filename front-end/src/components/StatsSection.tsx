import { useEffect, useRef } from 'react';
import { useInView, animate, motion } from 'motion/react';
import Typewriter from './Typewriter';

function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (inView) {
      const controls = animate(0, value, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate(val) {
          if (ref.current) {
            ref.current.textContent = `${prefix}${val.toFixed(decimals)}${suffix}`;
          }
        },
      });
      return () => controls.stop();
    }
  }, [inView, value, prefix, suffix, decimals]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

const ARCH_PATH =
  "M53.54,45.42c2.19-3.79,7.67-3.79,9.86,0l4.54,7.87c1.17,2.02,1.17,4.51,0,6.54l-8.15,13.81c-1.68,2.91.42,6.55,3.78,6.55h17.81c3.45,0,5.61-3.74,3.89-6.73l-28.76-49.81c-2.95-5.12-10.34-5.12-13.29,0l-28.46,49.3c-1.86,3.22.46,7.24,4.18,7.24h10.23c2.55,0,4.91-1.36,6.19-3.57l18.18-31.19Z";

export default function StatsSection() {
  return (
    <section
      id="stats"
      className="bg-black text-white py-8 md:py-24 px-6 md:px-12 lg:px-[120px] w-full border-t border-white/10 overflow-hidden"
    >
      <div className="w-full max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-[160px] items-stretch">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
            className="flex-1 flex flex-col justify-start"
          >
            <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-medium tracking-tight mb-6 leading-[1.1] w-[590px] max-w-full">
              <Typewriter text="Turning waste" delay={0} speed={0.012} /><br />
              <Typewriter text="into " delay={0.25} speed={0.012} />
              <span className="font-dm-serif italic font-normal">
                <Typewriter text="measurable recovery" delay={0.35} speed={0.012} />
              </span>
            </h2>
            <p className="text-base md:text-lg text-white/40 leading-relaxed font-light max-w-lg whitespace-normal mb-16">
              <Typewriter
                text="Every parcel on the map carries a real, computed number — not a guess. Cities see the cost of doing nothing, and the upside of doing something."
                delay={0.1}
                speed={0.012}
              />
            </p>

            <motion.div
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
              className="grid grid-cols-2 md:grid-cols-[max-content_max-content] gap-8 md:gap-x-16 lg:gap-x-24"
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }} className="flex flex-col">
                <div className="text-4xl md:text-5xl lg:text-[56px] font-dm-serif tracking-tight mb-3">
                  <AnimatedCounter value={1240} suffix="t" />
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-wider">
                  <Typewriter text="CO2 Wasted Per Year" delay={0.1} speed={0.012} />
                </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }} className="flex flex-col">
                <div className="text-4xl md:text-5xl lg:text-[56px] font-dm-serif tracking-tight mb-3">
                  <AnimatedCounter value={890} suffix="t" />
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-wider">
                  <Typewriter text="Recoverable Per Year" delay={0.1} speed={0.012} />
                </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }} className="flex flex-col">
                <div className="text-4xl md:text-5xl lg:text-[56px] font-dm-serif tracking-tight mb-3">
                  <AnimatedCounter value={47} />
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-wider">
                  <Typewriter text="Parcels Mapped" delay={0.1} speed={0.012} />
                </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }} className="flex flex-col">
                <div className="text-4xl md:text-5xl lg:text-[56px] font-dm-serif tracking-tight mb-3">
                  <AnimatedCounter value={18} prefix="$" suffix="k" />
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-wider">
                  <Typewriter text="Wasted Per Month" delay={0.1} speed={0.012} />
                </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }} className="flex flex-col">
                <div className="text-4xl md:text-5xl lg:text-[56px] font-dm-serif tracking-tight mb-3">
                  <AnimatedCounter value={92} suffix="%" />
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-wider">
                  <Typewriter text="Match Confidence" delay={0.1} speed={0.012} />
                </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }} className="flex flex-col">
                <div className="text-4xl md:text-5xl lg:text-[56px] font-dm-serif tracking-tight mb-3">
                  <AnimatedCounter value={3} />
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-wider">
                  <Typewriter text="Cities Tracked" delay={0.1} speed={0.012} />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          <div className="flex justify-center lg:justify-end items-center shrink-0 lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1.2 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0, ease: 'easeOut' }}
              className="w-full max-w-[500px] lg:max-w-none lg:w-[120%] aspect-square origin-center"
              style={{
                WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='${ARCH_PATH}'/%3E%3C/svg%3E")`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='${ARCH_PATH}'/%3E%3C/svg%3E")`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source
                  src="https://app-uploads.krea.ai/wan-videos/7f348c17-c3aa-40c9-9d5b-a2bed9a72c2e.mp4"
                  type="video/mp4"
                />
              </video>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
