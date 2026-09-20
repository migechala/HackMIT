import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, Object3D } from 'three';
import { mulberry32, range } from './random';
import { deerCurve, sstep, story } from './story';
import { Replaceable } from './assets';

interface TreeSpec { x: number; z: number; s: number; delay: number; pine: boolean; tint: Color }

const PINE = ['#3D6B4A', '#2F5A3D', '#4E7D58'];
const ROUND = ['#6FA06B', '#5E9060', '#7CAE72'];
const CAM_DIR = Math.atan2(0.79, 0.62);

function makeTrees(count: number): TreeSpec[] {
  const rand = mulberry32(99);
  const path = deerCurve.getSpacedPoints(80);
  const out: TreeSpec[] = [];
  let guard = 0;
  while (out.length < count && guard++ < 4000) {
    const r = range(rand, 17, 36);
    const a = rand() * Math.PI * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    // keep the camera-side foreground and the deer corridor clear
    if (Math.cos(a - CAM_DIR) > 0.55 && r < 30) continue;
    if (path.some((q) => Math.hypot(q.x - x, q.z - z) < 5.5)) continue;
    const pine = rand() < 0.6;
    out.push({
      x, z, s: range(rand, 0.8, 1.4), pine, delay: range(rand, 0.18, 0.33),
      tint: new Color((pine ? PINE : ROUND)[Math.floor(rand() * 3)]),
    });
  }
  return out;
}

function ProceduralTrees({ count }: { count: number }) {
  const trunks = useRef<InstancedMesh>(null);
  const cones = useRef<InstancedMesh>(null);
  const blobs = useRef<InstancedMesh>(null);
  const trees = useMemo(() => makeTrees(count), [count]);
  const pines = useMemo(() => trees.filter((t) => t.pine), [trees]);
  const rounds = useMemo(() => trees.filter((t) => !t.pine), [trees]);
  const dummy = useMemo(() => new Object3D(), []);
  const lastP = useRef(-1);

  useLayoutEffect(() => {
    pines.forEach((t, i) => { cones.current?.setColorAt(i * 2, t.tint); cones.current?.setColorAt(i * 2 + 1, t.tint); });
    rounds.forEach((t, i) => blobs.current?.setColorAt(i, t.tint));
    const trunk = new Color('#7A5C43');
    trees.forEach((_, i) => trunks.current?.setColorAt(i, trunk));
    lastP.current = -1;
  }, [pines, rounds, trees]);

  // Trees rise with staggered delays as the deer enters (p 0.18–0.42). Pure function of progress.
  useFrame(() => {
    const p = story.progress;
    if (Math.abs(p - lastP.current) < 1e-6) return;
    lastP.current = p;
    const grow = (t: TreeSpec) => sstep(t.delay, t.delay + 0.09, p);
    trees.forEach((t, i) => {
      const g = grow(t);
      dummy.position.set(t.x, 0.6 * t.s * g, t.z);
      dummy.scale.set(t.s * g, 1.2 * t.s * g, t.s * g);
      dummy.updateMatrix();
      trunks.current?.setMatrixAt(i, dummy.matrix);
    });
    pines.forEach((t, i) => {
      const g = grow(t);
      for (let k = 0; k < 2; k++) {
        dummy.position.set(t.x, (1.5 + k * 1.15) * t.s * g, t.z);
        const w = (k === 0 ? 1.5 : 1.05) * t.s * g;
        dummy.scale.set(w, (k === 0 ? 2 : 1.7) * t.s * g, w);
        dummy.updateMatrix();
        cones.current?.setMatrixAt(i * 2 + k, dummy.matrix);
      }
    });
    rounds.forEach((t, i) => {
      const g = grow(t);
      dummy.position.set(t.x, 2.3 * t.s * g, t.z);
      const w = 1.3 * t.s * g;
      dummy.scale.set(w, w * 1.05, w);
      dummy.updateMatrix();
      blobs.current?.setMatrixAt(i, dummy.matrix);
    });
    for (const m of [trunks.current, cones.current, blobs.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.13, 0.2, 1, 6]} />
        <meshStandardMaterial flatShading roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={cones} args={[undefined, undefined, Math.max(1, pines.length * 2)]} frustumCulled={false} castShadow>
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial flatShading roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={blobs} args={[undefined, undefined, Math.max(1, rounds.length)]} frustumCulled={false} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial flatShading roughness={0.85} />
      </instancedMesh>
    </>
  );
}

/** Low-poly trees that rise at the edges of the diorama as the deer enters. */
export default function Trees({ count }: { count: number }) {
  return <Replaceable slot="tree" fallback={<ProceduralTrees count={count} />} />;
}
