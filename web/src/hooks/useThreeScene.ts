import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { SceneService } from '@/services/scene.service';
import { TilesService } from '@/services/tiles.service';
import { ExoplanetsService } from '@/services/exoplanets.service';
import { CameraService } from '@/services/camera.service';
import { fixTextures } from '@/utils/texture.utils';
import { EARTH_ROTATION_SPEED, TEXTURE_FIX_FRAME_INTERVAL } from '@/constants/scene.constants';

export interface SelectedExoplanet {
  position: THREE.Vector3;
  id: number;
}

interface UseThreeSceneReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  returnToEarth: () => void;
  selectedExoplanet: SelectedExoplanet | null;
  clearSelection: () => void;
}

export function useThreeScene(): UseThreeSceneReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<FlyControls | null>(null);
  const tilesRef = useRef<TilesRenderer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const exoplanetsRef = useRef<THREE.LOD[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  
  // Services
  const sceneServiceRef = useRef<SceneService | null>(null);
  const tilesServiceRef = useRef<TilesService | null>(null);
  const exoplanetsServiceRef = useRef<ExoplanetsService | null>(null);
  const cameraServiceRef = useRef<CameraService | null>(null);
  
  // State
  const [selectedExoplanet, setSelectedExoplanet] = useState<SelectedExoplanet | null>(null);
  
  const returnToEarth = useCallback(() => {
    if (cameraServiceRef.current) {
      cameraServiceRef.current.returnToEarth();
    }
    setSelectedExoplanet(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedExoplanet(null);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize services
    sceneServiceRef.current = new SceneService();
    tilesServiceRef.current = new TilesService();
    exoplanetsServiceRef.current = new ExoplanetsService();
    cameraServiceRef.current = new CameraService();

    // Create scene components
    const scene = sceneServiceRef.current.createScene();
    const camera = sceneServiceRef.current.createCamera();
    const renderer = sceneServiceRef.current.createRenderer();
    const lights = sceneServiceRef.current.createLighting();
    
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Add lighting to scene
    lights.forEach(light => scene.add(light));

    // Setup tiles (Earth)
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const tiles = tilesServiceRef.current.createTiles(camera, maxAnisotropy);
    tilesRef.current = tiles;
    scene.add(tiles.group);

    // Create exoplanets
    const exoplanets = exoplanetsServiceRef.current.createExoplanets();
    exoplanets.forEach(exoplanet => scene.add(exoplanet));
    exoplanetsRef.current = exoplanets;

    // Append renderer to container
    containerRef.current.appendChild(renderer.domElement);

    // Setup camera controls
    const controls = cameraServiceRef.current.createControls(camera, renderer.domElement);
    controlsRef.current = controls;
    
    const cleanupMouseControls = cameraServiceRef.current.setupMouseControls(renderer.domElement);

    // Setup click handler for exoplanets
    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only handle left clicks
      
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycasterRef.current.setFromCamera(mouse, camera);
      
      // Get all meshes from LOD objects
      const meshes: THREE.Mesh[] = [];
      exoplanetsRef.current.forEach(lod => {
        lod.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child);
          }
        });
      });

      const intersects = raycasterRef.current.intersectObjects(meshes, false);
      
      if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object;
        // Find the parent LOD
        const lod = exoplanetsRef.current.find(l => l.children.includes(intersectedMesh));
        if (lod && cameraServiceRef.current) {
          const exoplanetIndex = exoplanetsRef.current.indexOf(lod);
          setSelectedExoplanet({
            position: lod.position.clone(),
            id: exoplanetIndex,
          });
          cameraServiceRef.current.moveToPlanet(lod.position);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Create clock for animation timing
    const clock = new THREE.Clock();
    clockRef.current = clock;

    let frameCount = 0;

    // Animation loop
    function animate() {
      if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;
      
      const delta = clock.getDelta();
      frameCount++;

      // Rotate Earth
      if (tilesServiceRef.current) {
        tilesServiceRef.current.rotateTiles(EARTH_ROTATION_SPEED);
      }

      // Update camera animation or controls
      if (cameraServiceRef.current) {
        cameraServiceRef.current.updateAnimation(cameraRef.current);
        cameraServiceRef.current.update(delta);
      }

      // Periodically fix textures
      if (frameCount % TEXTURE_FIX_FRAME_INTERVAL === 0 && tilesRef.current) {
        tilesRef.current.group.traverse(obj => fixTextures(obj, maxAnisotropy));
      }

      // Update tiles
      if (tilesServiceRef.current) {
        tilesServiceRef.current.update(cameraRef.current, rendererRef.current);
      }

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    renderer.setAnimationLoop(animate);

    // Handle window resize
    const handleResize = () => {
      if (sceneServiceRef.current && cameraRef.current && rendererRef.current) {
        sceneServiceRef.current.handleWindowResize(cameraRef.current, rendererRef.current);
        if (tilesServiceRef.current) {
          tilesServiceRef.current.update(cameraRef.current, rendererRef.current);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      cleanupMouseControls();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      
      if (containerRef.current && renderer.domElement.parentElement) {
        containerRef.current.removeChild(renderer.domElement);
      }

      // Dispose services
      tilesServiceRef.current?.dispose();
      exoplanetsServiceRef.current?.dispose();
      cameraServiceRef.current?.dispose();

      // Clear refs
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      tilesRef.current = null;
      clockRef.current = null;
    };
  }, []);

  return {
    containerRef,
    returnToEarth,
    selectedExoplanet,
    clearSelection,
  };
}

