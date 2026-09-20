import DataCenter from './DataCenter';
import Deer from './Deer';
import Grass from './Grass';
import Trees from './Trees';
import Critters from './Critters';
import CameraRig from './CameraRig';
import ParticleSwirl from './ParticleSwirl';
import { BG, Ground, NoiseRings } from './Environment';

export interface Quality {
  mobile: boolean;
  shadows: boolean;
  grass: number;
  trees: number;
}

export default function Scene({ quality, shiftX, shiftY }: { quality: Quality; shiftX: number; shiftY: number }) {
  const map = quality.mobile ? 1024 : 2048;
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 40, 82]} />
      <hemisphereLight args={['#FFFFFF', '#DCE3DF', 1.25]} />
      <directionalLight
        position={[-12, 20, 9]}
        intensity={2.6}
        color="#FDFEFF"
        castShadow={quality.shadows}
        shadow-mapSize={[map, map]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[14, 9, -8]} intensity={0.7} color="#DCEBFF" />
      <CameraRig shiftX={shiftX} shiftY={shiftY} />
      <Ground />
      <NoiseRings />
      <DataCenter />
      <ParticleSwirl count={quality.mobile ? 40000 : 120000} />
      <Deer />
      <Trees count={quality.trees} />
      <Grass count={quality.grass} />
      <Critters full={!quality.mobile} />
    </>
  );
}
