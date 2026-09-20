const BLADE_COUNT = 90
const BLADE_COLORS = ['#3f9d6f', '#5fb488', '#2f7d57']

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const blades = Array.from({ length: BLADE_COUNT }, (_, i) => {
  const x = (i / BLADE_COUNT) * 1200 + seeded(i, 1) * 6
  const height = 22 + seeded(i, 2) * 34
  const lean = (seeded(i, 3) - 0.5) * 26
  const color = BLADE_COLORS[i % BLADE_COLORS.length]
  const delay = seeded(i, 4) * 4
  return { x, height, lean, color, delay }
})

export default function GrassField() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-16 select-none overflow-hidden md:h-20" aria-hidden="true">
      <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="absolute bottom-0 h-full w-full">
        <defs>
          <linearGradient id="grass-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef2e2" stopOpacity="0" />
            <stop offset="100%" stopColor="#eef2e2" />
          </linearGradient>
        </defs>
        <rect x="0" y="78" width="1200" height="22" fill="url(#grass-ground)" />
        {blades.map((b, i) => (
          <path
            key={i}
            className="animate-sway"
            style={{ animationDelay: `${b.delay}s` }}
            d={`M ${b.x} 92 Q ${b.x + b.lean} ${92 - b.height * 0.6} ${b.x + b.lean * 1.6} ${92 - b.height}`}
            stroke={b.color}
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}
      </svg>
    </div>
  )
}
