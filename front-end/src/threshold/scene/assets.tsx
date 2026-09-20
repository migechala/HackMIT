import { useEffect, useState, type ReactNode } from 'react';
import type { Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Replaceable model slots. Everything ships as procedural geometry so the page runs with zero
 * external files. To swap in a licensed GLB, drop it in /public/models and set its URL here.
 * A missing, blocked, or malformed file logs one warning and falls back to the procedural model —
 * it never throws into the render tree.
 *
 * Notes: a replacement deer is moved/rotated along the path but is not gait-animated; the data
 * center itself is procedural instanced pieces (required for the fragmentation effect).
 */
export type Slot = 'deer' | 'rabbit' | 'bird' | 'tree';

export const MODEL_URLS: Partial<Record<Slot, string>> = {
  // deer: '/models/deer.glb',
  // rabbit: '/models/rabbit.glb',
  // bird: '/models/bird.glb',
  // tree: '/models/tree.glb',
};

const cache = new Map<string, Promise<Object3D | null>>();

function loadOptional(url: string) {
  let hit = cache.get(url);
  if (!hit) {
    hit = new Promise<Object3D | null>((resolve) => {
      new GLTFLoader().load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        (err) => {
          console.warn(`[threshold] model "${url}" could not be loaded, using procedural fallback.`, err);
          resolve(null);
        },
      );
    });
    cache.set(url, hit);
  }
  return hit;
}

export function Replaceable({ slot, fallback }: { slot: Slot; fallback: ReactNode }) {
  const url = MODEL_URLS[slot];
  const [obj, setObj] = useState<Object3D | null>(null);

  useEffect(() => {
    if (!url) return;
    let live = true;
    loadOptional(url).then((o) => live && setObj(o ? o.clone(true) : null));
    return () => { live = false; };
  }, [url]);

  return obj ? <primitive object={obj} /> : <>{fallback}</>;
}
