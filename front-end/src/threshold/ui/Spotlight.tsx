import type { PointerEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Cursor-following highlight. The pointer position is written to CSS variables directly on the
 * element (no React state, no re-render), and the glow only exists on real hover pointers.
 */
export default function Spot({
  as: Tag = 'div',
  tone = 'light',
  className,
  children,
}: {
  as?: 'div' | 'article';
  tone?: 'light' | 'dark';
  className?: string;
  children: ReactNode;
}) {
  const glow = tone === 'light' ? 'rgba(255,255,255,0.16)' : 'rgba(31,61,43,0.07)';
  return (
    <Tag
      className={cn('group/spot relative isolate overflow-hidden', className)}
      onPointerMove={(e: PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 ease-out [@media(hover:hover)]:group-hover/spot:opacity-100"
        style={{ background: `radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), ${glow}, transparent 70%)` }}
      />
      {children}
    </Tag>
  );
}
