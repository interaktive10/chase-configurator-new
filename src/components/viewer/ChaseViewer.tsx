import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { ChaseModel } from './ChaseModel';
import { DimensionOverlay } from './DimensionOverlay';
import { bindCameraActions } from '../../utils/cameraRef';

// Syncs camera and controls refs to the module-level cameraActions
function CameraSync() {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (controls) bindCameraActions(camera, controls);
  }, [camera, controls]);
  return null;
}

export function ChaseViewer() {
  return (
    <Canvas
      shadows
      camera={{ position: [1.5, 1.2, 1.5], fov: 45 }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <OrbitControls target={[0, 0.04, 0]} makeDefault minDistance={0.5} maxDistance={4.5} />
      <CameraSync />

      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.3}
        castShadow
        shadow-bias={-0.0001}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight intensity={0.4} groundColor="#b08060" />
      <Environment preset="warehouse" environmentIntensity={0.7} />

      <ChaseModel />
      <DimensionOverlay />
    </Canvas>
  );
}
