import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color, Plane, ShaderMaterial, Vector2, Vector3 } from 'three';
import { buildDataCenter } from './pieces';
import { mulberry32 } from './random';
import { deerAt, rotationAt, sstep, story } from './story';

/**
 * Dark, stippled particle cloud. Every particle's position is an analytic function of its seed and
 * the scroll progress (no simulation state), so the whole sequence reverses with scroll:
 *
 *   40–56%  the building dissolves into dust that arcs up and to the left, then drops into
 *           a tilted elliptical orbit around the site (the "swoosh" that wraps the building)
 *   56–62%  the dust orbits; the pointer steers the orbit plane and parts the cloud locally
 *   62–80%  most of the dust falls back into the rebuilt building
 *   80–100% about a fifth stays behind as a slow, fainter ring around the grass and animals
 *
 * Move the pointer to direct the orbit; double-click / double-tap switches its focus between the
 * building and the deer.
 */

const vert = /* glsl */ `
  attribute vec4 aSeed;
  attribute vec3 aHome;
  uniform float uTime;
  uniform float uRot;
  uniform float uEmit;
  uniform float uReturn;
  uniform float uAngle;
  uniform float uKeep;
  uniform float uOpacity;
  uniform float uSize;
  uniform float uScale;
  uniform float uA;
  uniform float uB;
  uniform vec3 uFocus;
  uniform vec3 uPtr;
  uniform float uPtrAmt;
  uniform vec2 uTilt;
  varying float vAlpha;

  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
  mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

  vec3 bezier(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    float k = 1.0 - t;
    return k * k * k * a + 3.0 * k * k * t * b + 3.0 * k * t * t * c + t * t * t * d;
  }
  float ease(float x) { x = clamp(x, 0.0, 1.0); return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }

  void main() {
    // ---- orbit point: a tilted ellipse around the focus, sheared so inner dust runs faster
    float phi = aSeed.x * 6.2831853 + uAngle * (0.55 + 0.9 * aSeed.y);
    float rr = 1.0 + (aSeed.z + aSeed.w - 1.0) * 0.42;
    vec3 e = vec3(cos(phi) * uA * rr, (aSeed.w - 0.5) * 1.9 * rr, sin(phi) * uB * rr);
    e = rotY(uTilt.x * 0.55) * rotZ(-0.28 + uTilt.x * 0.3) * rotX(0.5 + uTilt.y * 0.35) * e;
    vec3 orbit = e + uFocus;

    // ---- home point on the (rotating) building
    vec3 home = rotY(uRot) * aHome;

    // ---- leaving: home -> up and to the left -> down into the orbit
    float u = ease((uEmit - aSeed.y * 0.5) / 0.5);
    vec3 c1 = home + vec3(-5.0, 11.0 + 4.0 * aSeed.z, -3.0);
    vec3 c2 = orbit + vec3(-9.0, 7.0 + 3.0 * aSeed.x, (aSeed.w - 0.5) * 6.0);
    vec3 pos = bezier(home, c1, c2, orbit, u);

    // ---- returning: most dust falls back into the rebuilt structure; ~20% stays in orbit
    float stays = step(fract(aSeed.x * 7.13 + aSeed.z * 3.71), 0.2);
    float r = ease((uReturn - aSeed.w * 0.5) / 0.5) * (1.0 - stays);
    if (r > 0.0) {
      vec3 d1 = orbit + vec3(0.0, 9.0, 0.0);
      vec3 d2 = home + vec3(0.0, 7.0, 0.0);
      pos = bezier(orbit, d1, d2, home, r);
    }

    // ambient drift, strongest mid-flight
    float mid = sin(3.14159 * u) + stays * 0.6;
    pos += 0.28 * mid * vec3(sin(uTime * 0.7 + aSeed.x * 30.0), sin(uTime * 0.9 + aSeed.y * 20.0), cos(uTime * 0.6 + aSeed.z * 25.0));

    // pointer parts the cloud and swirls it around the cursor
    vec3 dp = pos - uPtr;
    float f = exp(-dot(dp, dp) / 7.0) * uPtrAmt * smoothstep(0.02, 0.2, u);
    vec3 dir = normalize(dp + vec3(0.0001));
    pos += dir * f * 2.4 + cross(vec3(0.0, 1.0, 0.0), dir) * f * 0.9;

    float vis = smoothstep(0.0, 0.06, u) * mix(1.0 - smoothstep(0.82, 1.0, r), uKeep, stays * step(0.001, uReturn));
    vAlpha = vis * (0.32 + 0.5 * aSeed.w) * uOpacity;

    vec4 mv = viewMatrix * vec4(pos, 1.0);
    gl_PointSize = max(1.0, uSize * (0.7 + 0.7 * aSeed.z) * uScale / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;

const frag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = 1.0 - smoothstep(0.5, 1.0, d);
    gl_FragColor = vec4(uColor, vAlpha * a);
    #include <colorspace_fragment>
  }`;

function buildGeometry(count: number) {
  const rand = mulberry32(2024);
  const { pieces } = buildDataCenter();
  const seed = new Float32Array(count * 4);
  const home = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 4; k++) seed[i * 4 + k] = rand();
    // dust starts on the building itself: a random point inside a random piece
    const pc = pieces[Math.floor(rand() * pieces.length)];
    home[i * 3] = pc.home.x + (rand() - 0.5) * pc.scale.x;
    home[i * 3 + 1] = pc.home.y + (rand() - 0.5) * pc.scale.y;
    home[i * 3 + 2] = pc.home.z + (rand() - 0.5) * pc.scale.z;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3)); // unused; shader computes positions
  g.setAttribute('aSeed', new BufferAttribute(seed, 4));
  g.setAttribute('aHome', new BufferAttribute(home, 3));
  return g;
}

const CENTER = new Vector3(0, 3, 0);
const plane = new Plane(new Vector3(0, 1, 0), -3);
const hit = new Vector3();
const focusTarget = new Vector3();

export default function ParticleSwirl({ count }: { count: number }) {
  const { gl, size } = useThree();
  const geometry = useMemo(() => buildGeometry(count), [count]);
  const material = useMemo(
    () => new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uRot: { value: 0 }, uEmit: { value: 0 }, uReturn: { value: 0 }, uAngle: { value: 0 },
        uKeep: { value: 1 }, uOpacity: { value: 1 }, uSize: { value: 0.034 }, uScale: { value: 800 },
        uA: { value: 9.5 }, uB: { value: 6.8 },
        uFocus: { value: new Vector3(0, 3, 0) }, uPtr: { value: new Vector3(0, 3, 0) }, uPtrAmt: { value: 0 },
        uTilt: { value: new Vector2() }, uColor: { value: new Color('#0C1012') },
      },
    }),
    [],
  );

  const st = useRef({ focus: 0, lastMove: -1e9, lastTap: 0, ptrAmt: 0, tilt: new Vector2() });

  // pointer directs the orbit; double-click / double-tap switches focus
  useEffect(() => {
    const el = gl.domElement;
    const s = st.current;
    const onMove = () => { s.lastMove = performance.now(); };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      const now = performance.now();
      if (now - s.lastTap < 350) s.focus = 1 - s.focus;
      s.lastTap = now;
    };
    const onDbl = () => { s.focus = 1 - s.focus; };
    const onLeave = () => { s.lastMove = -1e9; };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('dblclick', onDbl);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('dblclick', onDbl);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [gl]);

  const points = useRef<import('three').Points>(null);

  useFrame((state) => {
    const p = story.progress;
    const u = material.uniforms;
    const s = st.current;
    const visible = p > 0.395;
    if (points.current) points.current.visible = visible;
    if (!visible) return;

    u.uTime.value = state.clock.elapsedTime;
    u.uRot.value = rotationAt(p);
    u.uEmit.value = sstep(0.4, 0.56, p);
    u.uReturn.value = sstep(0.62, 0.8, p);
    u.uAngle.value = p * 14 + state.clock.elapsedTime * 0.22; // scroll-bound, with a slow ambient drift
    u.uKeep.value = 1 - 0.5 * sstep(0.8, 0.95, p);
    u.uA.value = 9.5 + 2.2 * sstep(0.7, 1, p);
    u.uB.value = 6.8 + 1.8 * sstep(0.7, 1, p);
    u.uScale.value = size.height * state.gl.getPixelRatio() / (2 * Math.tan((state.camera as import('three').PerspectiveCamera).fov * Math.PI / 360));
    u.uOpacity.value = 1;

    // focus: the building, or the deer once it is on stage
    const deer = deerAt(p);
    if (s.focus === 1 && deer.visible) focusTarget.set(deer.x, 1.6, deer.z); else focusTarget.copy(CENTER);
    (u.uFocus.value as Vector3).lerp(focusTarget, 0.05);

    // pointer: steer the orbit plane, and project the cursor onto a plane through the site
    s.tilt.x += (state.pointer.x - s.tilt.x) * 0.05;
    s.tilt.y += (state.pointer.y - s.tilt.y) * 0.05;
    (u.uTilt.value as Vector2).copy(s.tilt);
    state.raycaster.setFromCamera(state.pointer, state.camera);
    if (state.raycaster.ray.intersectPlane(plane, hit)) (u.uPtr.value as Vector3).lerp(hit, 0.15);
    const active = performance.now() - s.lastMove < 2500 ? 1 : 0;
    s.ptrAmt += (active - s.ptrAmt) * 0.06;
    u.uPtrAmt.value = s.ptrAmt;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={4} visible={false} />;
}
