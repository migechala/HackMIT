import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Material, Mesh } from 'three';
import { sstep, story } from './story';
import { Replaceable } from './assets';

const FUR = '#B9A48A';
const FUR_LIGHT = '#EFE7D8';
const EYE = '#2B2622';

const RABBITS: { pos: [number, number, number]; rot: number }[] = [
  { pos: [-5.2, 0, 8.6], rot: 0.6 },
  { pos: [-6.7, 0, 7.6], rot: 2.9 },
  { pos: [3.4, 0, 10.6], rot: 1.4 },
];

function setFade(g: Group, o: number) {
  g.visible = o > 0.01;
  g.traverse((c) => {
    const m = (c as Mesh).material as Material | undefined;
    if (m) { m.transparent = true; m.opacity = o; }
  });
}

const Blob = ({ p, s, color, rot }: { p: [number, number, number]; s: [number, number, number]; color: string; rot?: [number, number, number] }) => (
  <mesh position={p} scale={s} rotation={rot} castShadow>
    <icosahedronGeometry args={[1, 1]} />
    <meshStandardMaterial color={color} flatShading transparent />
  </mesh>
);

function Rabbit({ pos, rot, phase }: { pos: [number, number, number]; rot: number; phase: number }) {
  const g = useRef<Group>(null);
  const body = useRef<Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    setFade(g.current, sstep(0.88, 0.97, story.progress));
    const hop = Math.max(0, Math.sin(s.clock.elapsedTime * 1.1 + phase)) ** 6;
    if (body.current) body.current.position.y = hop * 0.18;
  });
  return (
    <group ref={g} position={pos} rotation={[0, rot, 0]} visible={false}>
      <Replaceable
        slot="rabbit"
        fallback={
          <group ref={body}>
            <Blob p={[0, 0.2, 0]} s={[0.26, 0.2, 0.18]} color={FUR} />
            <Blob p={[0.22, 0.32, 0]} s={[0.14, 0.12, 0.11]} color={FUR} />
            {[0.05, -0.05].map((z) => (
              <Blob key={z} p={[0.19, 0.5, z]} s={[0.035, 0.17, 0.05]} color={FUR} rot={[z * 4, 0, -0.15]} />
            ))}
            <Blob p={[-0.26, 0.24, 0]} s={[0.08, 0.08, 0.08]} color={FUR_LIGHT} />
            <Blob p={[0.34, 0.31, 0.04]} s={[0.02, 0.02, 0.02]} color={EYE} />
            <Blob p={[0.34, 0.31, -0.04]} s={[0.02, 0.02, 0.02]} color={EYE} />
          </group>
        }
      />
    </group>
  );
}

function Bird({ radius, height, speed, phase }: { radius: number; height: number; speed: number; phase: number }) {
  const g = useRef<Group>(null);
  const wingL = useRef<Mesh>(null);
  const wingR = useRef<Mesh>(null);
  useFrame((s) => {
    const o = g.current;
    if (!o) return;
    setFade(o, sstep(0.9, 0.99, story.progress));
    const t = s.clock.elapsedTime * speed + phase;
    o.position.set(1 + Math.cos(t) * radius, height + Math.sin(t * 2) * 0.3, 1 + Math.sin(t) * radius);
    o.rotation.y = -t - Math.PI / 2;
    const flap = Math.sin(s.clock.elapsedTime * 9 + phase * 5) * 0.7;
    if (wingL.current) wingL.current.rotation.x = flap;
    if (wingR.current) wingR.current.rotation.x = -flap;
  });
  return (
    <group ref={g} visible={false}>
      <Replaceable
        slot="bird"
        fallback={
          <group scale={1.3}>
            <Blob p={[0, 0, 0]} s={[0.2, 0.09, 0.09]} color="#5B6A75" />
            <Blob p={[0.2, 0.02, 0]} s={[0.08, 0.07, 0.07]} color="#F1F3F0" />
            <mesh position={[0.29, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.025, 0.08, 4]} />
              <meshStandardMaterial color="#E8A73E" flatShading transparent />
            </mesh>
            <mesh ref={wingL} position={[0, 0.02, 0.09]} scale={[0.14, 0.015, 0.22]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#7B8B96" flatShading transparent />
            </mesh>
            <mesh ref={wingR} position={[0, 0.02, -0.09]} scale={[0.14, 0.015, 0.22]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#7B8B96" flatShading transparent />
            </mesh>
            <mesh position={[-0.24, 0, 0]} scale={[0.14, 0.02, 0.06]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#5B6A75" flatShading transparent />
            </mesh>
          </group>
        }
      />
    </group>
  );
}

/** Rabbits and birds that fade in during the final coexistence beat. */
export default function Critters({ full }: { full: boolean }) {
  return (
    <>
      {RABBITS.slice(0, full ? 3 : 2).map((r, i) => <Rabbit key={i} pos={r.pos} rot={r.rot} phase={i * 1.7} />)}
      <Bird radius={9.5} height={4.6} speed={0.35} phase={0} />
      {full && <Bird radius={11.5} height={5.6} speed={0.28} phase={2.4} />}
      {full && <Bird radius={8} height={3.8} speed={0.42} phase={4.1} />}
    </>
  );
}
