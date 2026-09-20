import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * Letter-by-letter roll on hover. Idea adapted from Skiper UI "skiper58" TextRoll
 * (https://skiper-ui.com, free to use with attribution). Rebuilt as CSS so it costs no JS on hover,
 * only runs on real hover pointers, and is disabled under prefers-reduced-motion (see index.css).
 * The trigger is the nearest ancestor with the `roll-host` class.
 */
export default function TextRoll({ children, className }: { children: string; className?: string }) {
  const letters = [...children];
  const mid = (letters.length - 1) / 2;
  const cell = (c: string, i: number, layer: 'roll-out' | 'roll-in') => (
    <span key={i} className={cn('roll-l inline-block', layer)} style={{ '--d': `${Math.abs(i - mid) * 16}ms` } as CSSProperties}>
      {c === ' ' ? ' ' : c}
    </span>
  );
  return (
    <span className={cn('relative inline-block overflow-hidden align-bottom leading-[1.3]', className)}>
      <span className="sr-only">{children}</span>
      <span aria-hidden className="block whitespace-nowrap">{letters.map((c, i) => cell(c, i, 'roll-out'))}</span>
      <span aria-hidden className="absolute inset-0 block whitespace-nowrap">{letters.map((c, i) => cell(c, i, 'roll-in'))}</span>
    </span>
  );
}
