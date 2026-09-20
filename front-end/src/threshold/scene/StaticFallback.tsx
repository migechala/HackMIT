/** Shown only when WebGL is unavailable or the scene crashes: a flat illustration plus the reason. */
export default function StaticFallback({ reason }: { reason: string }) {
  return (
    <div role="img" aria-label="Illustration of a data center with a deer nearby" className="absolute inset-0 grid place-items-center bg-[#F5F6F3]">
      <div className="flex max-w-md flex-col items-center gap-5 px-6 text-center">
        <svg viewBox="0 0 320 190" className="w-full max-w-sm" aria-hidden>
          <ellipse cx="160" cy="150" rx="140" ry="26" fill="#E4EBE1" />
          <polygon points="160,60 250,102 160,144 70,102" fill="#DFE5E1" stroke="#C5CDC8" />
          <polygon points="70,102 160,144 160,158 70,116" fill="#AEB9B5" />
          <polygon points="160,144 250,102 250,116 160,158" fill="#98A39E" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3, 4].map((c) => (
              <g key={`${r}-${c}`} transform={`translate(${104 + c * 14 + r * 12}, ${88 + r * 8 - c * 2 + 4})`}>
                <polygon points="0,0 10,5 10,-14 0,-19" fill="#2E3944" />
                <polygon points="0,0 10,5 10,-14 0,-19" fill="none" stroke="#5C6A76" strokeWidth="0.6" />
                <circle cx="6" cy="-6" r="1.1" fill="#5FE89A" />
              </g>
            )),
          )}
          <g fill="#8B6B4B" transform="translate(228 122)">
            <ellipse cx="0" cy="0" rx="17" ry="7" />
            <rect x="-12" y="4" width="2.6" height="17" rx="1" />
            <rect x="9" y="4" width="2.6" height="17" rx="1" />
            <polygon points="12,-4 20,-20 24,-18 16,-1" />
            <ellipse cx="23" cy="-21" rx="5" ry="3.4" />
            <path d="M22 -24 l-3 -11 M22 -24 l3 -12 M20 -30 l-6 -2 M24 -31 l6 -2" stroke="#D8C7A4" strokeWidth="1.4" fill="none" />
          </g>
        </svg>
        <p className="font-display text-2xl text-[#2B2E28]">The 3D story is unavailable here.</p>
        <p className="text-sm leading-relaxed text-[#5B5F56]">{reason} The full story is written out below, and the rest of the site works normally.</p>
      </div>
    </div>
  );
}
