import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Mesh, ShaderMaterial } from 'three';
import { rotationAt, sstep, story, vibrationAt } from './story';

export const BG = '#F5F6F3';

const floorVert = /* glsl */ `
  varying vec2 vP;
  void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const floorFrag = /* glsl */ `
  varying vec2 vP;
  uniform float uRot;
  uniform float uLawn;
  uniform vec3 uBg;
  uniform vec3 uPool;
  uniform vec3 uInk;
  uniform vec3 uLawnCol;
  const float TAU = 6.28318530718;

  // anti-aliased hairline at every multiple of "gap" along a distance value
  float hair(float v, float gap) {
    float dist = abs(mod(v + gap * 0.5, gap) - gap * 0.5);
    return 1.0 - smoothstep(0.0, fwidth(v) * 1.3, dist);
  }

  void main() {
    float d = length(vP);
    // soft pool of light that resolves exactly to the page colour, so the edge never shows
    vec3 col = mix(uPool, uBg, smoothstep(1.0, 32.0, d));
    // lawn tint (final beat)
    col = mix(col, uLawnCol, uLawn * (1.0 - smoothstep(15.0, 17.5, d)));

    float fade = 1.0 - smoothstep(9.0, 30.0, d);
    // contour rings every 2 m, stronger every 10 m
    float minor = hair(d, 2.0) * 0.05;
    float major = hair(d, 10.0) * 0.09;
    float a = (minor + major) * fade * (1.0 - uLawn * 0.8);

    // turntable ring with degree ticks that turn with the model
    float ang = atan(vP.y, vP.x) - uRot;
    float t5 = ang / TAU * 72.0;
    float t30 = ang / TAU * 12.0;
    float tick5 = 1.0 - smoothstep(0.0, fwidth(t5) * 1.3, abs(fract(t5 + 0.5) - 0.5));
    float tick30 = 1.0 - smoothstep(0.0, fwidth(t30) * 1.3, abs(fract(t30 + 0.5) - 0.5));
    float band5 = step(8.2, d) * step(d, 8.55);
    float band30 = step(8.2, d) * step(d, 9.0);
    float ring = (1.0 - smoothstep(0.0, fwidth(d) * 1.3, abs(d - 8.2))) * 0.3;
    float tt = max(ring, max(tick5 * band5 * 0.2, tick30 * band30 * 0.34)) * (1.0 - uLawn * 0.85);

    col = mix(col, uInk, clamp(a + tt, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

/**
 * Studio floor: an unlit shader that blends into the page colour at its edge, with a soft pool of
 * light, faint contour rings and a degree-tick turntable ring bound to the model's rotation.
 * Shadows are drawn by a separate transparent shadow-catcher so they stay correct.
 */
export function Ground() {
  const mat = useMemo(
    () => new ShaderMaterial({
      vertexShader: floorVert,
      fragmentShader: floorFrag,
      uniforms: {
        uRot: { value: 0 },
        uLawn: { value: 0 },
        uBg: { value: new Color(BG) },
        uPool: { value: new Color('#FFFFFF') },
        uInk: { value: new Color('#3E4A43') },
        uLawnCol: { value: new Color('#DDE8D4') },
      },
    }),
    [],
  );
  useFrame(() => {
    const p = story.progress;
    mat.uniforms.uRot.value = rotationAt(p);
    mat.uniforms.uLawn.value = sstep(0.8, 0.97, p);
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={mat}>
        <circleGeometry args={[90, 96]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <shadowMaterial opacity={0.2} color="#2C3A33" />
      </mesh>
    </group>
  );
}

const ringVert = /* glsl */ `
  varying vec2 vP;
  void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ringFrag = /* glsl */ `
  varying vec2 vP;
  uniform float uT;
  uniform float uAmp;
  void main() {
    float d = length(vP);
    float ring = smoothstep(0.55, 1.0, sin(d * 1.9 - uT * 4.2));
    float fall = smoothstep(19.0, 6.0, d) * smoothstep(3.0, 6.5, d);
    gl_FragColor = vec4(0.373, 0.722, 0.788, ring * fall * uAmp * 0.32);
  }`;

/** Faint expanding rings: the building's "noisy state" while the deer approaches. Amplitude follows scroll. */
export function NoiseRings() {
  const mat = useMemo(
    () => new ShaderMaterial({
      vertexShader: ringVert, fragmentShader: ringFrag, transparent: true, depthWrite: false,
      uniforms: { uT: { value: 0 }, uAmp: { value: 0 } },
    }),
    [],
  );
  const mesh = useRef<Mesh>(null);
  useFrame((s) => {
    const a = vibrationAt(story.progress);
    mat.uniforms.uT.value = s.clock.elapsedTime;
    mat.uniforms.uAmp.value = a;
    if (mesh.current) mesh.current.visible = a > 0.005;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={mat} renderOrder={2}>
      <planeGeometry args={[44, 44]} />
    </mesh>
  );
}
