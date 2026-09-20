import { useId, useMemo, useState } from 'react';
import { powerHistory, type Range } from './sim';

const W = 640, H = 220;
const M = { l: 40, r: 12, t: 12, b: 26 };
const IW = W - M.l - M.r, IH = H - M.t - M.b;

const RANGES: { id: Range; label: string }[] = [
  { id: 'hour', label: 'Hour' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
];

/** Historical power draw (W) with an hour/day/week toggle and a hover readout. */
export default function PowerChart() {
  const [range, setRange] = useState<Range>('day');
  const [hover, setHover] = useState<number | null>(null);
  const uid = useId();
  const data = useMemo(() => powerHistory(range), [range]);
  const max = 7;
  const x = (i: number) => (data.length === 1 ? 0 : (i / (data.length - 1)) * IW);
  const y = (w: number) => IH - (w / max) * IH;
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.w).toFixed(1)}`).join('');
  const avg = data.reduce((a, d) => a + d.w, 0) / data.length;
  const ticksX = data.length > 12 ? [0, Math.floor(data.length / 2), data.length - 1] : data.map((_, i) => i);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-[#98A29A]">Average <span className="font-mono text-[#EDEEE9]">{avg.toFixed(1)} W</span></p>
        <div role="tablist" aria-label="History range" className="flex rounded-full border border-white/10 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={range === r.id}
              onClick={() => { setRange(r.id); setHover(null); }}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${range === r.id ? 'bg-[#5FE89A] text-[#0B0F0D]' : 'text-[#98A29A] hover:text-[#EDEEE9]'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label={`Power draw over the last ${range}, averaging ${avg.toFixed(1)} watts`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W - M.l;
          setHover(Math.max(0, Math.min(data.length - 1, Math.round((px / IW) * (data.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id={`${uid}-f`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#4FC3D9" stopOpacity="0.28" />
            <stop offset="1" stopColor="#4FC3D9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(${M.l},${M.t})`}>
          {[0, 2, 4, 6].map((t) => (
            <g key={t}>
              <line x1="0" x2={IW} y1={y(t)} y2={y(t)} stroke="#EDEEE9" strokeOpacity="0.08" />
              <text x="-8" y={y(t) + 4} textAnchor="end" fontSize="11" fill="#98A29A">{t} W</text>
            </g>
          ))}
          {ticksX.map((i) => (
            <text key={i} x={x(i)} y={IH + 18} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#98A29A">{data[i].label}</text>
          ))}
          <path d={`${line}L${IW},${IH}L0,${IH}Z`} fill={`url(#${uid}-f)`} />
          <path d={line} fill="none" stroke="#4FC3D9" strokeWidth="2" strokeLinejoin="round" />
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1="0" y2={IH} stroke="#EDEEE9" strokeOpacity="0.3" />
              <circle cx={x(hover)} cy={y(data[hover].w)} r="4" fill="#4FC3D9" />
              <g transform={`translate(${Math.min(Math.max(x(hover), 60), IW - 60)},4)`}>
                <rect x="-56" y="0" width="112" height="34" rx="6" fill="#1A221D" stroke="#EDEEE9" strokeOpacity="0.15" />
                <text textAnchor="middle" y="14" fontSize="11" fill="#98A29A">{data[hover].label}</text>
                <text textAnchor="middle" y="28" fontSize="12" fill="#EDEEE9" fontWeight="600">{data[hover].w.toFixed(2)} W</text>
              </g>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
