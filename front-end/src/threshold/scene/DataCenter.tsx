import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { buildDataCenter, type Piece } from './pieces';
import { calmAt, rotationAt, sstep, sstep2, story, vibrationAt } from './story';

const LED_NEUTRAL = new Color('#4FBF80');
const LED_CALM_A = new Color('#5FE89A');
const LED_CALM_B = new Color('#5FB8C9');
const LED_FRAG = new Color('#5FB8C9');

const _m = new Matrix4();
const _q = new Quaternion();
const _sq = new Quaternion();
const _v = new Vector3();
const _s = new Vector3();
const _c = new Color();
const _c2 = new Color();

/** Detachment 0..1: peel into particles (40–53%), swirl as threads wrap around (45–70%), rebuild (62–80%). */
function detach(pc: Piece, p: number) {
  const out = sstep2(0.4 + pc.oOut * 0.05, 0.4 + pc.oOut * 0.05 + 0.08, p);
  const back = sstep2(0.62 + pc.oBack * 0.07, 0.62 + pc.oBack * 0.07 + 0.11, p);
  return out * (1 - back);
}

/**
 * Procedural roofless data center. All ~1,000 pieces live in three InstancedMeshes; disintegration is
 * a per-piece function of scroll progress applied in the *rotating* group's frame, so fragments
 * inherit the model's rotation (plus a swirl in the same direction) rather than flying off on a
 * separate timer.
 */
export default function DataCenter() {
  const group = useRef<Group>(null);
  const boxes = useRef<InstancedMesh>(null);
  const cyls = useRef<InstancedMesh>(null);
  const leds = useRef<InstancedMesh>(null);
  const last = useRef({ p: -1 });
  const model = useMemo(() => buildDataCenter(), []);
  const lists = useMemo(() => {
    const l: [Piece[], Piece[], Piece[]] = [[], [], []];
    model.pieces.forEach((pc) => l[pc.kind].push(pc));
    return l;
  }, [model]);

  useLayoutEffect(() => {
    const meshes = [boxes.current, cyls.current, leds.current];
    meshes.forEach((mesh, k) => {
      if (!mesh) return;
      lists[k].forEach((pc) => {
        mesh.setMatrixAt(pc.index, pc.homeMatrix);
        mesh.setColorAt(pc.index, pc.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [lists]);

  useFrame((state) => {
    const p = story.progress;
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    g.rotation.y = rotationAt(p);

    const vib = vibrationAt(p);
    const calm = calmAt(p);
    const twist = sstep(0.46, 0.66, p) * 2.2; // vortex orbit of the particles
    const moved = Math.abs(p - last.current.p) > 1e-6;
    const active = p > 0.38 && p < 0.82;
    const needsLayout = moved || vib > 0.001 || active;

    if (needsLayout) {
      last.current.p = p;
      [boxes.current, cyls.current].forEach((mesh, k) => {
        if (!mesh) return;
        const arr = lists[k];
        const colors = mesh.instanceColor!.array as Float32Array;
        for (let i = 0; i < arr.length; i++) {
          const pc = arr[i];
          const a = detach(pc, p);
          if (a < 0.0005 && vib < 0.001) {
            mesh.setMatrixAt(pc.index, pc.homeMatrix);
            colors[pc.index * 3] = pc.color.r;
            colors[pc.index * 3 + 1] = pc.color.g;
            colors[pc.index * 3 + 2] = pc.color.b;
            continue;
          }
          writePiece(mesh, pc, a, vib, t, twist);
          _c.copy(pc.color).lerp(pc.fragColor, sstep(0, 0.6, a));
          colors[pc.index * 3] = _c.r;
          colors[pc.index * 3 + 1] = _c.g;
          colors[pc.index * 3 + 2] = _c.b;
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor!.needsUpdate = true;
      });
    }

    const ledMesh = leds.current;
    if (ledMesh) {
      const arr = lists[2];
      const colors = ledMesh.instanceColor!.array as Float32Array;
      for (let i = 0; i < arr.length; i++) {
        const pc = arr[i];
        const a = needsLayout ? detach(pc, p) : 0;
        if (needsLayout) {
          if (a < 0.0005 && vib < 0.001) ledMesh.setMatrixAt(pc.index, pc.homeMatrix);
          else writePiece(ledMesh, pc, a, vib, t, twist);
        }
        // Neutral / anxious: irregular quick blinks. Calm: slow synchronised green-cyan pulse.
        const ph = pc.ledPhase;
        const blink = Math.sin(t * (4 + ph * 7) + ph * 31) > 0.15 ? 1 : 0.12;
        const anxious = (0.25 + 0.75 * blink) * (ph > 0.85 ? 0.15 : 1);
        const pulse = 0.55 + 0.45 * Math.sin(t * 1.5 + ph * 0.8);
        const b = anxious + (pulse - anxious) * calm;
        _c.copy(LED_NEUTRAL);
        _c2.copy(LED_CALM_A).lerp(LED_CALM_B, 0.5 + 0.5 * Math.sin(t * 0.9 + ph * 3));
        _c.lerp(_c2, calm).lerp(LED_FRAG, sstep(0, 0.5, a)).multiplyScalar(b);
        colors[pc.index * 3] = _c.r;
        colors[pc.index * 3 + 1] = _c.g;
        colors[pc.index * 3 + 2] = _c.b;
      }
      if (needsLayout) ledMesh.instanceMatrix.needsUpdate = true;
      ledMesh.instanceColor!.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      <instancedMesh ref={boxes} args={[undefined, undefined, lists[0].length]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.62} metalness={0.12} />
      </instancedMesh>
      <instancedMesh ref={cyls} args={[undefined, undefined, lists[1].length]} castShadow receiveShadow frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.5, 1, 14]} />
        <meshStandardMaterial roughness={0.5} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={leds} args={[undefined, undefined, lists[2].length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function writePiece(mesh: InstancedMesh, pc: Piece, a: number, vib: number, t: number, twist: number) {
  // Straight peel from home toward the scatter target, with a sideways curl and a swirl about Y
  // in the same direction the model rotates (angular momentum inheritance).
  const e = a;
  _v.copy(pc.home).lerp(pc.target, e);
  const arc = Math.sin(Math.PI * e) * pc.curl;
  _v.x += arc * -Math.sin(pc.swirl);
  _v.z += arc * Math.cos(pc.swirl);
  const psi = pc.swirl * e + twist * e * (1.2 + 5 / (1 + Math.hypot(pc.target.x, pc.target.z)));
  const cs = Math.cos(psi), sn = Math.sin(psi);
  const x = _v.x * cs + _v.z * sn;
  const z = -_v.x * sn + _v.z * cs;
  _v.x = x;
  _v.z = z;
  if (e > 0.01) _v.y += Math.sin(t * 1.3 + pc.ledPhase * 20) * 0.08 * e * (1 - e * 0.5);
  if (vib > 0.001) {
    const k = 0.022 * vib;
    _v.x += Math.sin(t * 53 + pc.home.x * 9.1 + pc.home.z * 4.3) * k;
    _v.y += Math.sin(t * 61 + pc.home.z * 7.7) * k * 0.6;
    _v.z += Math.sin(t * 47 + pc.home.y * 5.9 + pc.home.x * 3.1) * k;
  }
  _sq.setFromAxisAngle(pc.spinAxis, pc.spinAmt * e);
  _q.copy(_sq).multiply(pc.homeQ);
  const shrink = 1 - e * (0.5 + 0.4 * pc.bigness);
  _s.copy(pc.scale).multiplyScalar(shrink);
  _m.compose(_v, _q, _s);
  mesh.setMatrixAt(pc.index, _m);
}
