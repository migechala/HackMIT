import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Typewriter from './Typewriter';

// Placeholder quotes — clearly fictional roles, not real people. Replace with
// real pilot-city feedback once you have it; keeping attribution honest matters
// for a civic product more than most.
const feedbacks = [
  {
    quote:
      '"Before this, we had no way to compare a proposal against what a lot actually could be. Now every application starts with a real baseline."',
    author: 'Placeholder — Planning Director',
    title: 'Pilot City Planning Dept.',
  },
  {
    quote:
      '"We found space for our urban farm in a week instead of a year of cold calls and dead ends."',
    author: 'Placeholder — Community Org Lead',
    title: 'Neighborhood Nonprofit',
  },
  {
    quote:
      '"The impact numbers gave us something concrete to bring to council instead of a vague sustainability goal."',
    author: 'Placeholder — Sustainability Officer',
    title: 'Pilot City Sustainability Office',
  },
];

export default function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((i) => (i + 1) % feedbacks.length);
  };
  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((i) => (i - 1 + feedbacks.length) % feedbacks.length);
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 100 : -100, opacity: 0 }),
  };

  return (
    <section id="feedback" className="w-full bg-white text-black py-8 md:py-24 px-6 md:px-12 lg:px-[120px] flex flex-col justify-center overflow-hidden">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
        className="w-full"
      >
        <motion.h2
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }}
          className="text-sm md:text-base mb-6 font-medium tracking-wide"
        >
          <Typewriter text="Early Feedback (Placeholder)" delay={0} speed={0.012} />
        </motion.h2>

        <motion.div
          variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.8, ease: 'easeOut' } } }}
          className="w-full h-[1px] bg-[#D9D9D9] mb-12 md:mb-20 origin-left"
        />

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }}
          className="relative overflow-hidden min-h-[300px] md:min-h-[250px] flex items-center"
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full"
            >
              <p className="text-2xl md:text-4xl lg:text-[44px] font-light leading-snug md:leading-tight text-right tracking-tight">
                <Typewriter text={feedbacks[currentIndex].quote} delay={0.2} speed={0.012} />
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.8, ease: 'easeOut' } } }}
          className="w-full h-[1px] bg-[#D9D9D9] mt-12 md:mt-20 mb-8 origin-left"
        />

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }}
          className="flex flex-col sm:flex-row justify-between items-center gap-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-4 w-full sm:w-auto"
            >
              <div className="w-14 h-14 rounded-full bg-black/10 flex items-center justify-center text-xs text-black/40 font-mono">
                {feedbacks[currentIndex].author.split(' ')[0][0]}
              </div>
              <div>
                <h3 className="font-medium text-lg"><Typewriter text={feedbacks[currentIndex].author} delay={0.4} speed={0.012} /></h3>
                <p className="text-gray-500 text-sm"><Typewriter text={feedbacks[currentIndex].title} delay={0.5} speed={0.012} /></p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button onClick={prevSlide} className="w-14 h-14 bg-[#D9D9D9] hover:bg-[#c9c9c9] transition-colors flex items-center justify-center rounded-full" aria-label="Previous">
              ←
            </button>
            <button onClick={nextSlide} className="w-14 h-14 bg-[#D9D9D9] hover:bg-[#c9c9c9] transition-colors flex items-center justify-center rounded-full" aria-label="Next">
              →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
