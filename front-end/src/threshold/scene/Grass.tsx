import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, ConeGeometry, InstancedBufferAttribute, InstancedMesh, MeshStandardMaterial, Object3D } from 'three';
import { mulberry32, range } from './random';
import { insideRestFootprint, story } from './story';

const GREENS = ['#5E9A5C', '#7DB56A', '#3D6B4A', '#6FA35B', '#8DBF76'];

interface Blade { m: number[]; c: Color }

/**
 * Instanced grass. Growth happens in the vertex shader from scroll progress with a per-blade delay
 * (staggered, nearest the structure first), so blades rise from the ground rather than popping in.
 */
export default function Grass({ count }: { count: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const uniforms = useMemo(() => ({ uP: { value: 0 }, uTime: { value: 0 } }), []);

  const { geometry, material, blades } = useMemo(() => {
    const geometry = new ConeGeometry(0.03, 1, 3, 1, true);
    geometry.translate(0, 0.5, 0);
    const rand = mulberry32(21);
    const delay = new Float32Array(count);
    const dummy = new Object3D();
    const blades: Blade[] = [];
    let guard = 0;
    while (blades.length < count && guard++ < count * 30) {
      const r = 5.2 + Math.pow(rand(), 0.7) * 10.5;
      const a = rand() * Math.PI * 2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (insideRestFootprint(x, z, 0.45)) continue;
      dummy.position.set(x, 0, z);
      dummy.rotation.set(range(rand, -0.15, 0.15), rand() * Math.PI * 2, range(rand, -0.15, 0.15));
      dummy.scale.set(range(rand, 0.8, 1.6), range(rand, 0.18, 0.5), range(rand, 0.8, 1.6));
      dummy.updateMatrix();
      // nearest the structure first, staggered with randomness
      const dist = Math.min(1, Math.max(0, (r - 5) / 11));
      delay[blades.length] = 0.81 + dist * 0.09 + rand() * 0.04;
      blades.push({ m: dummy.matrix.toArray(), c: new Color(GREENS[Math.floor(rand() * GREENS.length)]) });
    }
    geometry.setAttribute('aDelay', new InstancedBufferAttribute(delay, 1));
    const material = new MeshStandardMaterial({ roughness: 0.9, flatShading: true, side: 2 });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uP = uniforms.uP;
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aDelay;\nuniform float uP;\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          float grow = smoothstep(aDelay, aDelay + 0.07, uP);
          transformed.y *= grow;
          transformed.x += sin(uTime * 1.7 + instanceMatrix[3].x * 0.8 + instanceMatrix[3].z * 0.6) * 0.07 * transformed.y * grow;`,
        );
    };
    return { geometry, material, blades };
  }, [count, uniforms]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    m.count = blades.length;
    blades.forEach((b, i) => {
      m.instanceMatrix.array.set(b.m, i * 16);
      m.setColorAt(i, b.c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [blades]);

  useFrame((state) => {
    uniforms.uP.value = story.progress;
    uniforms.uTime.value = state.clock.elapsedTime;
    if (mesh.current) mesh.current.visible = story.progress > 0.8;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} receiveShadow />;
}
