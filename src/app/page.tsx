'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Scene3D from '@/components/Scene3D';
import JSZip from 'jszip';
import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

const SAMPLE_SKYBOX = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/2294472375_24a3b8ef46_o.jpg';

export default function Home() {
  const [fileUrl, setFileUrl] = useState<string | null>(SAMPLE_SKYBOX);
  const [fileType, setFileType] = useState<'image' | 'model' | 'video' | null>('image');
  const [backgroundType, setBackgroundType] = useState<'none' | 'color' | 'gradient' | 'room'>('room');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [gradientColors, setGradientColors] = useState({
    top: '#000000',
    bottom: '#ffffff'
  });
  const [showFloor, setShowFloor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);

  // Helper: Load GLTF/GLB from ZIP with full PBR/texture support
  async function loadGLTFFromZipWithPBR(zipFile: File) {
    const zip = await JSZip.loadAsync(zipFile);
    // Find .gltf or .glb file
    let gltfEntry = Object.values(zip.files).find(f => f.name.endsWith('.gltf') || f.name.endsWith('.glb'));
    if (!gltfEntry) return alert('No .gltf or .glb file found in ZIP');

    // Prepare file map for URLModifier
    const fileMap: Record<string, Blob> = {};
    for (const file of Object.values(zip.files)) {
      if (!file.dir) {
        fileMap[file.name] = await file.async('blob');
      }
    }

    // Create a custom loading manager
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      // Remove any leading './' or '/'
      const cleanUrl = url.replace(/^\.\//, '').replace(/^\//, '');
      if (fileMap[cleanUrl]) {
        return URL.createObjectURL(fileMap[cleanUrl]);
      }
      return url;
    });

    // Use GLTFLoader with the custom manager
    const loader = new GLTFLoader(manager);
    // Optionally: add DRACOLoader support here if needed

    let gltf;
    if (gltfEntry.name.endsWith('.glb')) {
      const blob = fileMap[gltfEntry.name];
      gltf = await loader.parseAsync(await blob.arrayBuffer(), '');
    } else {
      const text = await gltfEntry.async('text');
      gltf = await loader.parseAsync(text, '');
    }
    if (gltf.scene) {
      (gltf.scene as unknown as THREE.Scene).background = null;
      (gltf.scene as unknown as THREE.Scene).environment = null;
    }
    setGltfScene(gltf.scene || gltf.scenes?.[0] || null);
    setFileUrl(null); // Hide any previous model
    setFileType(null);
  }

  const handleFileSelect = async (file: File) => {
    if (file.name.endsWith('.zip')) {
      await loadGLTFFromZipWithPBR(file);
      return;
    }
    setGltfScene(null);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    
    // Check file extension for more specific type detection
    const extension = file.name.toLowerCase().split('.').pop();
    
    if (file.type.startsWith('image/') || 
        ['.jpg', '.jpeg', '.png', '.hdr', '.exr', '.tif', '.tiff', '.bmp', '.webp'].includes(`.${extension}`)) {
      setFileType('image');
    } else if (file.type === 'model/gltf-binary' || 
              file.type === 'model/gltf+json' || 
              ['.glb', '.gltf', '.obj', '.fbx', '.stl', '.dae', '.3ds'].includes(`.${extension}`)) {
      setFileType('model');
    } else if (file.type.startsWith('video/') || 
              ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.insv'].includes(`.${extension}`)) {
      setFileType('video');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await handleFileSelect(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.hdr', '.exr', '.tif', '.tiff', '.bmp', '.webp'],
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
      'model/obj': ['.obj'],
      'model/fbx': ['.fbx'],
      'model/stl': ['.stl'],
      'model/collada': ['.dae'],
      'model/3ds': ['.3ds'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.insv'],
    },
    multiple: false,
    noClick: true,
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <div {...getRootProps()} className="fixed inset-0">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".jpg,.jpeg,.png,.hdr,.exr,.tif,.tiff,.bmp,.webp,.glb,.gltf,.obj,.fbx,.stl,.dae,.3ds,.mp4,.webm,.mov,.avi,.mkv,.insv"
        className="hidden"
      />
      
      <div className="absolute top-4 right-4 z-10 flex gap-4 items-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-black/50 text-white px-3 py-2 rounded-lg backdrop-blur-sm hover:bg-black/60 transition-colors"
        >
          Select File
        </button>

        <select
          value={backgroundType}
          onChange={(e) => setBackgroundType(e.target.value as any)}
          className="bg-black/50 text-white px-3 py-2 rounded-lg backdrop-blur-sm"
        >
          <option value="none">No Background</option>
          <option value="color">Solid Color</option>
          <option value="gradient">Gradient</option>
          <option value="room">Room</option>
        </select>

        {backgroundType === 'color' && (
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer"
          />
        )}

        {backgroundType === 'gradient' && (
          <div className="flex gap-2">
            <div className="flex flex-col items-center">
              <span className="text-white text-xs mb-1">Top</span>
              <input
                type="color"
                value={gradientColors.top}
                onChange={(e) => setGradientColors(prev => ({ ...prev, top: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-white text-xs mb-1">Bottom</span>
              <input
                type="color"
                value={gradientColors.bottom}
                onChange={(e) => setGradientColors(prev => ({ ...prev, bottom: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 bg-black/50 text-white px-3 py-2 rounded-lg backdrop-blur-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showFloor}
            onChange={(e) => setShowFloor(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Floor
        </label>
      </div>

      <Scene3D
        fileUrl={fileUrl}
        fileType={fileType}
        backgroundType={backgroundType}
        backgroundColor={backgroundColor}
        gradientColors={gradientColors}
        showFloor={showFloor}
        gltfScene={gltfScene}
      />
    </div>
  );
}
