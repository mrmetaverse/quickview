import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, useTexture } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Reflector as ThreeReflector } from 'three-stdlib';

interface Scene3DProps {
  fileUrl: string | null;
  fileType: 'image' | 'model' | 'video' | null;
  backgroundType: 'none' | 'color' | 'gradient' | 'room';
  backgroundColor?: string;
  gradientColors?: {
    top: string;
    bottom: string;
  };
  showFloor: boolean;
  gltfScene?: THREE.Group | null;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Skybox({ url }: { url: string }) {
  const texture = useTexture(url);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function VideoBackground({ url }: { url: string }) {
  const [video] = useState(() => {
    const vid = document.createElement('video');
    vid.src = url;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.play();
    return vid;
  });

  useEffect(() => {
    return () => {
      video.pause();
      video.src = '';
    };
  }, [video]);

  const texture = new THREE.VideoTexture(video);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.mapping = THREE.EquirectangularReflectionMapping;

  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function GradientBackground({ topColor, bottomColor }: { topColor: string; bottomColor: string }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 2;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, 2);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function ReflectiveFloor() {
  const meshRef = useRef<THREE.Mesh>(null);
  const reflectorRef = useRef<any>(null);

  useEffect(() => {
    if (meshRef.current) {
      const reflector = new ThreeReflector(new THREE.CircleGeometry(50, 64), {
        textureWidth: 1024,
        textureHeight: 1024,
        color: 0xffffff,
        clipBias: 0.003,
        // blur: [512, 512], // Not available in three-stdlib Reflector
      });
      reflector.rotation.x = -Math.PI / 2;
      reflector.position.y = -5;
      meshRef.current.add(reflector);
      reflectorRef.current = reflector;
    }
    return () => {
      if (meshRef.current && reflectorRef.current) {
        meshRef.current.remove(reflectorRef.current);
      }
    };
  }, []);

  return <group ref={meshRef} />;
}

export default function Scene3D({ 
  fileUrl, 
  fileType, 
  backgroundType, 
  backgroundColor = '#000000',
  gradientColors = { top: '#000000', bottom: '#ffffff' },
  showFloor,
  gltfScene
}: Scene3DProps) {
  return (
    <div className="fixed inset-0">
      <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
        <Suspense fallback={null}>
          {/* Always render the skybox/environment first */}
          {backgroundType === 'room' && <Environment preset="sunset" />}
          {backgroundType === 'color' && (
            <>
              <color attach="background" args={[backgroundColor]} />
              <fog attach="fog" args={[backgroundColor, 10, 100]} />
            </>
          )}
          {backgroundType === 'gradient' && (
            <GradientBackground topColor={gradientColors.top} bottomColor={gradientColors.bottom} />
          )}
          {backgroundType === 'none' && (
            <>
              <color attach="background" args={['#000000']} />
              <fog attach="fog" args={['#000000', 10, 100]} />
            </>
          )}

          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          {gltfScene ? (
            <primitive object={gltfScene} />
          ) : (
            <>
              {fileUrl && fileType === 'model' && <Model url={fileUrl} />}
              {fileUrl && fileType === 'image' && <Skybox url={fileUrl} />}
              {fileUrl && fileType === 'video' && <VideoBackground url={fileUrl} />}
            </>
          )}
          <OrbitControls />
          {showFloor && <ReflectiveFloor />}
        </Suspense>
      </Canvas>
    </div>
  );
} 