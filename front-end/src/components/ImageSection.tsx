import { motion } from 'motion/react';
import Typewriter from './Typewriter';

// Sun icon (impact scoring), building icon (verified claims), grid icon (dashboards).
// Reference uses Lottie files hosted on their repo — swapped for inline SVG
// so this section has no dependency on external assets.
function IconSun() {
  return (
    <svg width="40" height="40" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="5" stroke="white" strokeWidth="1.4" />
      <path d="M13 1v4M13 21v4M25 13h-4M5 13H1M21.5 4.5l-2.8 2.8M7.3 18.7l-2.8 2.8M21.5 21.5l-2.8-2.8M7.3 7.3L4.5 4.5" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg width="40" height="40" viewBox="0 0 26 26" fill="none">
      <rect x="4" y="10" width="18" height="12" stroke="white" strokeWidth="1.4" />
      <path d="M8 10V6a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg width="40" height="40" viewBox="0 0 26 26" fill="none">
      <path d="M3 22V4M3 22h20M8 22V13M14 22V8M20 22v-6" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}

export default function ImageSection() {
  return (
    <section id="services" className="w-full relative overflow-hidden flex flex-col justify-center">
      {/* "the green thing" — duotone gradient standing in for the reference's field photo.
          Swap for a real image at this same absolute inset-0 layer if you get one. */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full"
          style={{
            background:
              'radial-gradient(70% 60% at 25% 30%, rgba(62,136,98,.35), transparent 60%), linear-gradient(160deg, #4C6B52 0%, #33513B 55%, #1E3626 100%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full mx-auto px-6 md:px-12 lg:px-[120px] py-8 md:py-24 flex flex-col h-full justify-between gap-4 md:gap-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 w-full items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="md:col-span-2"
          >
            <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-medium tracking-tight text-white mb-6 leading-[1.1] max-w-[800px]">
              <Typewriter text="A Rigorous, Data-Driven Scoring Process Built For " delay={0} speed={0.012} />
              <span className="font-serif italic font-normal">
                <Typewriter text="Real Reuse" delay={0.8} speed={0.012} />
              </span>
            </h2>
            <p className="text-lg md:text-[24px] text-white/80 font-light tracking-wide">
              <Typewriter text="Precision on every parcel." delay={0.1} speed={0.012} />
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="hidden md:flex justify-end w-full max-w-[421px] pb-1"
          >
            <button className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-black hover:text-white transition-colors duration-300 text-sm tracking-wide font-medium">
              Browse the Map
            </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 w-full md:mt-[200px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col w-full max-w-[420px]"
          >
            <div className="w-12 h-12 mb-6 flex items-center justify-center"><IconSun /></div>
            <div className="w-full h-px bg-white/20 mb-6" />
            <h3 className="text-2xl font-medium text-white mb-3"><Typewriter text="Impact Scoring" delay={0.1} speed={0.012} /></h3>
            <p className="text-sm text-white/70 leading-relaxed max-w-[340px]">
              <Typewriter text="Sun exposure, heat-island contribution, and carbon math computed per parcel, not estimated by hand." delay={0.1} speed={0.012} />
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col w-full max-w-[420px]"
          >
            <div className="w-12 h-12 mb-6 flex items-center justify-center"><IconBuilding /></div>
            <div className="w-full h-px bg-white/20 mb-6" />
            <h3 className="text-2xl font-medium text-white mb-3"><Typewriter text="Verified Claims" delay={0.1} speed={0.012} /></h3>
            <p className="text-sm text-white/70 leading-relaxed max-w-[340px]">
              <Typewriter text="Every request to use a parcel goes through a lightweight risk check before it reaches a city desk." delay={0.1} speed={0.012} />
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col w-full max-w-[421px]"
          >
            <div className="w-12 h-12 mb-6 flex items-center justify-center"><IconGrid /></div>
            <div className="w-full h-px bg-white/20 mb-6" />
            <h3 className="text-2xl font-medium text-white mb-3"><Typewriter text="City Dashboards" delay={0.1} speed={0.012} /></h3>
            <p className="text-sm text-white/70 leading-relaxed max-w-[340px]">
              <Typewriter text="Every parcel a city owns, its score, and who wants it — in one queue, not four spreadsheets." delay={0.1} speed={0.012} />
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="flex md:hidden justify-start w-full"
        >
          <button className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-black hover:text-white transition-colors duration-300 text-sm tracking-wide font-medium">
            Browse the Map
          </button>
        </motion.div>
      </div>
    </section>
  );
}
