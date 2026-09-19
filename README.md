# Civic Asset Platform — hero + stats

Real React + Vite + Tailwind v4 + Motion project, structured like the
Acreage Ag reference you shared, adapted to your platform's brand and data.

## Run locally

```bash
cd front-end
npm install
npm run dev
```

Then open http://localhost:3000

## What's here

- `HeroSection.tsx` — floating pill nav, per-character typewriter headline,
  duotone gradient standing in for a video background (see comment in the
  file for exactly where to swap in a real `<video>` tag once you have footage).
- `StatsSection.tsx` — real count-up stat animation (Motion's `animate()`,
  triggered on scroll into view) and the arch-shaped SVG mask technique from
  the reference, filled with a growth-toned gradient instead of a cropped video.
- `Typewriter.tsx` — the per-letter reveal component, ported as-is since the
  technique itself isn't brand-specific.

## What changed from the reference

- Fonts: Barlow + Instrument Serif (same pairing as the reference) plus
  IBM Plex Mono added for data readouts — coordinates, stats labels, nav —
  since your product needs an "instrument" register the farm site didn't.
- Color: swapped their black/white for a blueprint-paper base (`--color-paper`,
  `--color-ink`) with a thermal red→amber→green data spectrum
  (`--color-waste`, `--color-transition`, `--color-growth`) used only for
  live numbers, not decoration.
- Copy and structure rewritten for parcels/reuse/claims instead of harvesting.
- Dropped: LogoMarquee, ImageSection, NextSection (testimonials), ContactSection,
  Footer — none were requested yet. Say the word if you want any of them adapted
  next (e.g. LogoMarquee → participating cities, ContactSection → claim request form).

## Next steps

1. Source or generate a real hero video (see chat for sourcing options) and
   drop it into `public/`, then swap it in per the comment in `HeroSection.tsx`.
2. Wire the stat numbers to real computed data instead of the hardcoded values.
3. Decide whether Parcel Detail / Claim Flow / Admin Queue / Subscription
   (from the earlier wireframe) get built in this same stack.
