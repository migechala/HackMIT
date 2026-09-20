import { useFrame, useThree } from '@react-three/fiber';
import { Fog, MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { deerAt, lerp, sampleCam, story, vibrationAt } from './story';

const target = new Vector3();

/** Camera is a smooth function of scroll progress: a gentle arc that follows the deer mid-story. */
export default function CameraRig({ shiftX = 0, shiftY = 0 }: { shiftX?: number; shiftY?: number }) {
  const { camera, size, scene } = useThree();
  useFrame((state) => {
    const p = story.progress;
    const cam = camera as PerspectiveCamera;
    const az = MathUtils.degToRad(sampleCam(p, 'az'));
    const el = MathUtils.degToRad(sampleCam(p, 'el'));
    const aspect = size.width / size.height;
    // Pull back on narrow viewports so the whole diorama stays in frame.
    const fit = Math.min(2.1, Math.max(1, 1.3 / aspect));
    const dist = sampleCam(p, 'dist') * fit;
    // keep the distance fog proportional to how far the camera has been pulled back
    if (scene.fog instanceof Fog) { scene.fog.near = 40 * fit; scene.fog.far = 82 * fit; }
    const d = deerAt(p);
    const f = sampleCam(p, 'follow') * (d.visible ? 1 : 0);
    target.set(
      lerp(sampleCam(p, 'tx'), d.x, f * 0.6),
      sampleCam(p, 'ty'),
      lerp(sampleCam(p, 'tz'), d.z, f * 0.6),
    );
    const v = vibrationAt(p);
    const t = state.clock.elapsedTime;
    cam.position.set(
      target.x + Math.sin(az) * Math.cos(el) * dist + Math.sin(t * 61) * 0.02 * v,
      target.y + Math.sin(el) * dist + Math.sin(t * 73) * 0.02 * v,
      target.z + Math.cos(az) * Math.cos(el) * dist,
    );
    cam.lookAt(target);
    // On wide screens nudge the model right so the headline column has room.
    // (and, on phones, up so the story text has room underneath).
    if (shiftX !== 0 || shiftY !== 0) cam.setViewOffset(size.width, size.height, -shiftX * size.width, shiftY * size.height, size.width, size.height);
    else cam.clearViewOffset();
  });
  return null;
}
