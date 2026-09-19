import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Typewriter from './Typewriter';

export default function HeroSection() {
  const [isOverWhiteBg, setIsOverWhiteBg] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const stats = document.getElementById('stats');
      if (stats) {
        const triggerPoint = stats.offsetTop - 80;
        setIsOverWhiteBg(window.scrollY >= triggerPoint);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      {/*
        REPLACE with a real <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-80">
        once you have footage, exactly like the reference. Placeholder below keeps the same
        black base + subtle motion until then.
      */}
      <div className="absolute inset-0 w-full h-full bg-black z-0 opacity-80" />

      <div className="absolute bottom-0 left-0 w-full h-40 md:h-64 bg-gradient-to-t from-black to-transparent z-0 pointer-events-none" />

      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 md:gap-4 p-2 rounded-full backdrop-blur-md text-sm transition-all duration-300 ${
          isOverWhiteBg
            ? 'bg-black border border-transparent text-white/[0.64]'
            : 'bg-white/5 border border-white/20 text-gray-300'
        }`}
      >
        <a href="#stats" className="px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all duration-300 hidden md:block">
          Impact
        </a>
        <a href="#map" className="px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all duration-300 hidden md:block">
          Map
        </a>
        <span className="flex items-center justify-center px-4 text-xs tracking-wide">
          [PLATFORM]
        </span>
        <a href="#cities" className="px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all duration-300 hidden md:block">
          For cities
        </a>
        <a href="#orgs" className="px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all duration-300 hidden md:block">
          For orgs
        </a>
      </motion.nav>

      <main className="flex-1 flex flex-col justify-end relative z-10 w-full mx-auto px-6 md:px-12 lg:px-[120px] pb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 lg:gap-12 border-b border-white/10 pb-10 mb-6">
          <div className="flex flex-col justify-start items-start pr-4 lg:pr-8 w-full flex-1">
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 1 },
                visible: { opacity: 1, transition: { staggerChildren: 0.025 } },
              }}
              className="text-[clamp(2rem,5vw,72px)] font-medium tracking-tight text-white mb-4 leading-[1.1] w-full max-w-[920px]"
            >
              {'Every wasted lot'.split('').map((char, i) => (
                <motion.span key={`a-${i}`} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
              <br />
              {'becomes '.split('').map((char, i) => (
                <motion.span key={`b-${i}`} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
              <span className="font-serif italic font-normal">
                {'something alive.'.split('').map((char, i) => (
                  <motion.span key={`c-${i}`} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </span>
            </motion.h1>
            <p className="text-lg md:text-[24px] text-white/80 font-light tracking-wide">
              <Typewriter text="Score it. Match it. Claim it." delay={0.1} speed={0.012} />
            </p>
          </div>

          <div className="flex flex-col items-start w-full lg:w-[400px] xl:w-[480px] shrink-0">
            <div className="space-y-2 lg:space-y-4 text-sm md:text-base text-white/80 leading-relaxed font-light">
              <p>
                <Typewriter
                  text="We score underutilized land and buildings for reuse — solar, farm, workspace, market — before anyone has to guess."
                  delay={0.1}
                  speed={0.012}
                />
              </p>
              <p>
                <Typewriter
                  text="Then we connect the site to the people who could actually bring it back."
                  delay={0.1}
                  speed={0.012}
                />
              </p>
            </div>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="mt-8 px-6 py-2.5 rounded-full border border-white/30 hover:bg-white text-white hover:text-black transition-colors duration-300 backdrop-blur-sm text-sm tracking-wide"
            >
              Browse the map
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-white/[0.64] tracking-wide">
          <p className="mb-2 sm:mb-0"><Typewriter text="3 cities · 140 parcels · 4,900 t CO2 potential offset identified" delay={0.1} speed={0.012} /></p>
          <p><Typewriter text="[Platform] (c) 2026" delay={0.1} speed={0.012} /></p>
        </div>
      </main>
    </div>
  );
}
