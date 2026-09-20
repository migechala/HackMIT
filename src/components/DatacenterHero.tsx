import { motion } from 'framer-motion'

function Fan({ delay = 0, size = 34 }: { delay?: number; size?: number }) {
  return (
    <motion.div
      className="relative flex items-center justify-center rounded-full border border-white/10 bg-black/30"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 2.6 + delay, ease: 'linear' }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute h-[2px] w-[42%] rounded-full bg-[color:var(--accent-2)]/70"
          style={{ transform: `rotate(${i * 120}deg)` }}
        />
      ))}
    </motion.div>
  )
}

export default function DatacenterHero() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-3xl select-none">
      {/* Ambient sound waves radiating outward (uncancelled noise) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full border border-[color:var(--danger)]/25"
            style={{ width: 60, height: 60 }}
            animate={{ width: [60, 620], height: [60, 620], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 4, delay: i * 1, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Cancelling inverse waves (green, phase-shifted) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full border border-[color:var(--accent)]/40"
            style={{ width: 60, height: 60 }}
            animate={{ width: [60, 560], height: [60, 560], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 4, delay: i * 1 + 0.55, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Floating building */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2"
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      >
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#101a30] to-[#0a0f1c] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="mono text-[10px] text-[color:var(--text-dim)]">FACILITY // ANC-ACTIVE</span>
            <span className="flex h-2 w-2 rounded-full bg-[color:var(--accent)] animate-pulse-glow" />
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-4 rounded-[3px] bg-[color:var(--accent-2)]/25"
                animate={{ opacity: [0.25, 0.7, 0.25] }}
                transition={{ repeat: Infinity, duration: 2 + (i % 5) * 0.3, delay: (i % 7) * 0.15 }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
            <span className="mono text-[10px] text-[color:var(--text-dim)]">COOLING ARRAY</span>
            <div className="flex gap-2">
              <Fan delay={0} />
              <Fan delay={0.4} size={30} />
              <Fan delay={0.15} size={26} />
            </div>
          </div>
        </div>
        {/* enclosure box below, representing the ANC unit */}
        <motion.div
          className="mx-auto mt-3 flex w-40 items-center justify-center gap-2 rounded-xl border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 py-2"
          animate={{ boxShadow: ['0 0 0px rgba(53,232,196,0.0)', '0 0 22px rgba(53,232,196,0.35)', '0 0 0px rgba(53,232,196,0.0)'] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
        >
          <span className="mono text-[10px] font-semibold text-[color:var(--accent)]">ANC ENCLOSURE · −12.4 dB</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
