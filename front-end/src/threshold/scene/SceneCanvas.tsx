import { Component, useEffect, useState, type ReactNode } from 'react';
import { Canvas, invalidate } from '@react-three/fiber';
import { NoToneMapping } from 'three';
import Scene from './Scene';
import { useQuality, webglAvailable } from '../hooks';
import StaticFallback from './StaticFallback';

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.error('[threshold] 3D scene failed', err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/**
 * The persistent 3D canvas. `paused` stops rendering while the story is off-screen; `still`
 * renders on demand only (reduced motion).
 */
export default function SceneCanvas({ paused = false, still = false }: { paused?: boolean; still?: boolean }) {
  const quality = useQuality();
  const [ok] = useState(webglAvailable);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!still || !ready) return;
    // In on-demand mode, request a few frames so the first paint and shader compile settle.
    const ids = [0, 120, 400].map((ms) => window.setTimeout(() => invalidate(), ms));
    return () => ids.forEach(clearTimeout);
  }, [still, ready]);

  if (!ok) return <StaticFallback reason="WebGL is not available in this browser." />;

  return (
    <div className="absolute inset-0">
      <Boundary fallback={<StaticFallback reason="The 3D scene could not start." />}>
        <Canvas
          dpr={quality.dpr}
          shadows={quality.shadows ? 'percentage' : false}
          flat
          frameloop={paused ? 'never' : still ? 'demand' : 'always'}
          camera={{ fov: 30, near: 0.5, far: 220, position: [14, 14, 22] }}
          gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: NoToneMapping }}
          onCreated={() => setReady(true)}
          aria-label="Interactive 3D data center"
        >
          <Scene quality={quality} shiftX={quality.wide ? 0.21 : 0} shiftY={quality.mobile && !still ? 0.13 : 0} />
        </Canvas>
      </Boundary>
      <div
        aria-hidden={ready}
        role="status"
        className={`pointer-events-none absolute inset-0 grid place-items-center bg-[#F5F6F3] text-sm text-[#5B5F56] transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
      >
        <span className="flex items-center gap-3">
          <span className="size-2 animate-pulse rounded-full bg-[#3D6B4A]" />
          Preparing scene…
        </span>
      </div>
    </div>
  );
}
