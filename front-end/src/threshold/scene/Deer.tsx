import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Quaternion, Vector3 } from 'three';
import { deerAt, story } from './story';
import { Replaceable } from './assets';

const COAT = '#8B6B4B';
const COAT_DARK = '#6E533A';
const BELLY = '#E8D9BE';
const ANTLER = '#D8C7A4';
const HOOF = '#3A2E26';
const NOSE = '#2B2622';

const UP = new Vector3(0, 1, 0);

/** Thin cylinder between two points (used for antler beams and tines). */
function Bar({ a, b, r = 0.014, color = ANTLER }: { a: [number, number, number]; b: [number, number, number]; r?: number; color?: string }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new Vector3(...a), vb = new Vector3(...b);
    const dir = vb.clone().sub(va);
    const len = dir.length();
    return {
      pos: va.clone().add(vb).multiplyScalar(0.5).toArray() as [number, number, number],
      quat: new Quaternion().setFromUnitVectors(UP, dir.normalize()),
      len,
    };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r * 0.7, r, len, 5]} />
      <meshStandardMaterial color={color} flatShading roughness={0.8} />
    </mesh>
  );
}

const Blob = ({ p, s, color, rot }: { p: [number, number, number]; s: [number, number, number]; color: string; rot?: [number, number, number] }) => (
  <mesh position={p} scale={s} rotation={rot} castShadow>
    <icosahedronGeometry args={[1, 1]} />
    <meshStandardMaterial color={color} flatShading roughness={0.85} />
  </mesh>
);

function Antlers({ side }: { side: 1 | -1 }) {
  const z = (v: number) => v * side;
  const P0: [number, number, number] = [0.0, 0.07, z(0.04)];
  const P1: [number, number, number] = [-0.06, 0.22, z(0.1)];
  const P2: [number, number, number] = [-0.04, 0.38, z(0.15)];
  const P3: [number, number, number] = [0.07, 0.5, z(0.16)];
  return (
    <group>
      <Bar a={P0} b={P1} r={0.02} />
      <Bar a={P1} b={P2} r={0.017} />
      <Bar a={P2} b={P3} r={0.014} />
      <Bar a={P1} b={[0.06, 0.3, z(0.1)]} />
      <Bar a={P2} b={[0.1, 0.47, z(0.2)]} />
      <Bar a={P2} b={[-0.12, 0.5, z(0.19)]} />
      <Bar a={P3} b={[0.13, 0.6, z(0.13)]} r={0.01} />
    </group>
  );
}

export interface DeerRig {
  root: Group | null;
  body: Group | null;
  neck: Group | null;
  head: Group | null;
  earL: Group | null;
  earR: Group | null;
  tail: Group | null;
  hip: (Group | null)[]; // FL FR BL BR
  knee: (Group | null)[];
}

function Leg({ x, z, hind, rig, i }: { x: number; z: number; hind: boolean; rig: DeerRig; i: number }) {
  const up = hind ? 0.5 : 0.46;
  return (
    <group position={[x, 0.93, z]} ref={(g) => { rig.hip[i] = g; }}>
      <mesh position={[0, -up / 2, 0]} castShadow>
        <cylinderGeometry args={[hind ? 0.075 : 0.065, 0.045, up, 6]} />
        <meshStandardMaterial color={COAT} flatShading roughness={0.85} />
      </mesh>
      <group position={[0, -up, 0]} ref={(g) => { rig.knee[i] = g; }}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.026, 0.44, 6]} />
          <meshStandardMaterial color={COAT_DARK} flatShading roughness={0.85} />
        </mesh>
        <mesh position={[0.012, -0.455, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.038, 0.06, 6]} />
          <meshStandardMaterial color={HOOF} flatShading roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/** Procedural low-poly buck: body, neck, head, antlers, ears, tail and articulated two-segment legs. */
function ProceduralDeer({ rig }: { rig: DeerRig }) {
  return (
    <group ref={(g) => { rig.body = g; }}>
      <Blob p={[0, 0.98, 0]} s={[0.62, 0.26, 0.21]} color={COAT} />
      <Blob p={[0.34, 1.02, 0]} s={[0.3, 0.29, 0.21]} color={COAT} />
      <Blob p={[-0.34, 0.99, 0]} s={[0.3, 0.28, 0.22]} color={COAT} />
      <Blob p={[0, 0.82, 0]} s={[0.52, 0.12, 0.17]} color={BELLY} />
      <Blob p={[0.12, 1.17, 0]} s={[0.5, 0.06, 0.16]} color={COAT_DARK} />
      {/* tail */}
      <group position={[-0.62, 1.06, 0]} ref={(g) => { rig.tail = g; }} rotation={[0, 0, 0.5]}>
        <mesh position={[0, 0.07, 0]} castShadow>
          <coneGeometry args={[0.06, 0.18, 5]} />
          <meshStandardMaterial color={COAT_DARK} flatShading />
        </mesh>
        <Blob p={[0.02, 0.0, 0]} s={[0.05, 0.07, 0.07]} color="#F4EEE2" />
      </group>
      {/* neck + head */}
      <group position={[0.5, 1.08, 0]} ref={(g) => { rig.neck = g; }} rotation={[0, 0, -0.85]}>
        <mesh position={[0, 0.27, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.13, 0.56, 6]} />
          <meshStandardMaterial color={COAT} flatShading roughness={0.85} />
        </mesh>
        <group position={[0, 0.56, 0]} ref={(g) => { rig.head = g; }} rotation={[0, 0, 0.6]}>
          <Blob p={[0.09, 0, 0]} s={[0.13, 0.085, 0.085]} color={COAT} />
          <mesh position={[0.24, -0.015, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <coneGeometry args={[0.055, 0.2, 6]} />
            <meshStandardMaterial color={BELLY} flatShading />
          </mesh>
          <Blob p={[0.34, -0.02, 0]} s={[0.03, 0.028, 0.03]} color={NOSE} />
          <Blob p={[0.13, 0.03, 0.075]} s={[0.018, 0.018, 0.018]} color={NOSE} />
          <Blob p={[0.13, 0.03, -0.075]} s={[0.018, 0.018, 0.018]} color={NOSE} />
          {([1, -1] as const).map((sd) => (
            <group key={sd} ref={(g) => { if (sd === 1) rig.earL = g; else rig.earR = g; }} position={[0.0, 0.06, 0.07 * sd]} rotation={[0.75 * sd, 0, 0.2]}>
              <mesh position={[0, 0.08, 0]} castShadow>
                <coneGeometry args={[0.045, 0.2, 5]} />
                <meshStandardMaterial color={COAT} flatShading />
              </mesh>
              <mesh position={[0.012, 0.075, 0]} scale={[0.5, 0.8, 0.6]}>
                <coneGeometry args={[0.04, 0.17, 5]} />
                <meshStandardMaterial color={BELLY} flatShading />
              </mesh>
            </group>
          ))}
          <group position={[0.02, 0.02, 0]}>
            <Antlers side={1} />
            <Antlers side={-1} />
          </group>
        </group>
      </group>
      <Leg x={0.4} z={0.11} hind={false} rig={rig} i={0} />
      <Leg x={0.4} z={-0.11} hind={false} rig={rig} i={1} />
      <Leg x={-0.4} z={0.11} hind rig={rig} i={2} />
      <Leg x={-0.4} z={-0.11} hind rig={rig} i={3} />
    </group>
  );
}

/** The deer. Position, heading, gait and head pose are all pure functions of scroll progress. */
export default function Deer() {
  const rig = useMemo<DeerRig>(() => ({ root: null, body: null, neck: null, head: null, earL: null, earR: null, tail: null, hip: [], knee: [] }), []);
  const root = useRef<Group>(null);

  useFrame((state) => {
    const r = root.current;
    if (!r) return;
    const p = story.progress;
    const t = state.clock.elapsedTime;
    const d = deerAt(p);
    r.visible = d.visible;
    r.position.set(d.x, 0, d.z);
    r.rotation.y = d.heading;

    // Gait phase follows distance walked, so scrolling back walks the deer backwards.
    const ph = (d.walked / 1.7) * Math.PI * 2;
    const amp = d.speed;
    const phases = [0, Math.PI, Math.PI, 0]; // diagonal pairs
    for (let i = 0; i < 4; i++) {
      const hip = rig.hip[i], knee = rig.knee[i];
      if (!hip || !knee) continue;
      const s = Math.sin(ph + phases[i]);
      hip.rotation.z = 0.5 * amp * s;
      knee.rotation.z = -0.75 * amp * Math.max(0, Math.sin(ph + phases[i] + 1.3)) - (i > 1 ? 0.08 : 0);
    }
    if (rig.body) {
      rig.body.position.y = 0.035 * amp * Math.abs(Math.sin(ph)) - 0.02 * d.graze;
      rig.body.rotation.z = 0.015 * amp * Math.sin(ph * 2);
    }
    if (rig.neck && rig.head) {
      const idle = Math.sin(t * 1.25) * 0.11 * d.graze;
      const bob = 0.05 * amp * Math.sin(ph * 2);
      rig.neck.rotation.z = -0.85 - 0.2 * d.alert - 1.35 * d.graze + idle + bob;
      rig.head.rotation.z = 0.6 + 0.1 * d.alert + 0.5 * d.graze - 0.4 * idle;
    }
    if (rig.earL && rig.earR) {
      const tw = Math.max(0, Math.sin(t * 3.1)) * (0.15 + 0.35 * d.alert);
      rig.earL.rotation.x = 0.75 - tw;
      rig.earR.rotation.x = -0.75 + tw * 0.6;
    }
    if (rig.tail) rig.tail.rotation.z = 0.5 + 0.12 * Math.sin(t * 2.4) * d.graze;
  });

  return (
    <group ref={root} visible={false}>
      <Replaceable slot="deer" fallback={<ProceduralDeer rig={rig} />} />
    </group>
  );
}
