import { useEffect, useState } from 'react'

/** Analog clock card (local time), used in the compliance section where the time of day picks the threshold. */
export default function ClockCard() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(id)
  }, [])

  const hourAngle = ((now.getHours() % 12) + now.getMinutes() / 60) * 30
  const minuteAngle = now.getMinutes() * 6
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const date = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'long' })

  return (
    <div className="glass flex items-center gap-5 rounded-[24px] p-5">
      <svg viewBox="0 0 120 120" className="size-28 shrink-0" role="img" aria-label={`Local time ${time}`}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180
          const long = i % 3 === 0
          const r1 = long ? 46 : 49
          return (
            <line
              key={i}
              x1={60 + Math.sin(a) * r1}
              y1={60 - Math.cos(a) * r1}
              x2={60 + Math.sin(a) * 54}
              y2={60 - Math.cos(a) * 54}
              stroke="#10241a"
              strokeOpacity={long ? 0.7 : 0.3}
              strokeWidth={long ? 2 : 1.5}
              strokeLinecap="round"
            />
          )
        })}
        <line x1="60" y1="60" x2="60" y2="30" stroke="#10241a" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hourAngle} 60 60)`} />
        <line x1="60" y1="60" x2="60" y2="16" stroke="#10241a" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${minuteAngle} 60 60)`} />
        <circle cx="60" cy="60" r="4" fill="#10241a" />
      </svg>
      <div>
        <div className="text-3xl font-semibold tracking-tight text-[color:var(--text-h)]">{time}</div>
        <div className="mt-1 text-sm text-[color:var(--text-dim)]">{date}</div>
      </div>
    </div>
  )
}
