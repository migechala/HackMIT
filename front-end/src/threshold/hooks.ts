import { useEffect, useState } from 'react';
import type { Quality } from './scene/Scene';

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');

/** Coarser scene on phones/tablets: fewer blades and trees, no shadow map, capped pixel ratio. */
export function useQuality(): Quality & { dpr: [number, number]; wide: boolean } {
  const mobile = useMedia('(max-width: 820px)');
  const wide = useMedia('(min-width: 1024px)');
  return mobile
    ? { mobile, wide, shadows: false, grass: 900, trees: 14, dpr: [1, 1.5] }
    : { mobile, wide, shadows: true, grass: 2800, trees: 28, dpr: [1, 2] };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
