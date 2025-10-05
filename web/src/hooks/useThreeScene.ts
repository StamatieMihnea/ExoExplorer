import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { SceneService } from '@/services/scene.service';
import { TilesService } from '@/services/tiles.service';
import { ExoplanetsService, type ExoplanetLOD } from '@/services/exoplanets.service';
import { CameraService } from '@/services/camera.service';
import { TextureManager } from '@/services/texture-manager.service';
import { StarfieldService } from '@/services/starfield.service';
import { VisibilityService } from '@/services/visibility.service';
import { fixTextures } from '@/utils/texture.utils';
import { EARTH_ROTATION_SPEED, TEXTURE_FIX_FRAME_INTERVAL } from '@/constants/scene.constants';
import type { Exoplanet } from '@/lib/types';

export interface SelectedExoplanet {
  position: THREE.Vector3;
  exoplanet: Exoplanet;
}

interface UseThreeSceneReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  returnToEarth: () => void;
  selectedExoplanet: SelectedExoplanet | null;
  clearSelection: () => void;
  exoplanetsCount: number;
  distanceRange: { min: number; max: number } | null;
  navigateToPlanet: (exoplanet: Exoplanet) => void;
  setControlsEnabled: (enabled: boolean) => void;
  navigateToRandomPlanet: () => void;
}

export function useThreeScene(): UseThreeSceneReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<FlyControls | null>(null);
  const tilesRef = useRef<TilesRenderer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const exoplanetsRef = useRef<ExoplanetLOD[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  
  // Services
  const sceneServiceRef = useRef<SceneService | null>(null);
  const tilesServiceRef = useRef<TilesService | null>(null);
  const exoplanetsServiceRef = useRef<ExoplanetsService | null>(null);
  const cameraServiceRef = useRef<CameraService | null>(null);
  const textureManagerRef = useRef<TextureManager | null>(null);
  const starfieldServiceRef = useRef<StarfieldService | null>(null);
  const visibilityServiceRef = useRef<VisibilityService | null>(null);
  
  // State
  const [selectedExoplanet, setSelectedExoplanet] = useState<SelectedExoplanet | null>(null);
  const [exoplanetsCount, setExoplanetsCount] = useState(0);
  const [distanceRange, setDistanceRange] = useState<{ min: number; max: number } | null>(null);
  
  const returnToEarth = useCallback(() => {
    if (cameraServiceRef.current) {
      cameraServiceRef.current.returnToEarth();
    }
    setSelectedExoplanet(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedExoplanet(null);
  }, []);

  const navigateToPlanet = useCallback((exoplanet: Exoplanet) => {
    // Find the LOD object for this exoplanet
    const lod = exoplanetsRef.current.find(l => {
      const lodExoplanet = l.userData.exoplanet;
      return lodExoplanet._id === exoplanet._id || lodExoplanet.name === exoplanet.name;
    });

    if (lod && cameraServiceRef.current) {
      const lodExoplanet = lod.userData.exoplanet;
      // Calculate planet radius in scene units (1 Earth radius = 5M scene units)
      const EARTH_RADIUS_TO_SCENE_UNITS = 5000000;
      const planetRadius = (lodExoplanet.radius || 1) * EARTH_RADIUS_TO_SCENE_UNITS;
      
      setSelectedExoplanet({
        position: lod.position.clone(),
        exoplanet: lodExoplanet,
      });
      cameraServiceRef.current.moveToPlanet(lod.position, planetRadius);
    } else {
      console.warn('Planet not found:', exoplanet.name);
    }
  }, []);

  const setControlsEnabled = useCallback((enabled: boolean) => {
    if (cameraServiceRef.current) {
      cameraServiceRef.current.setControlsEnabled(enabled);
    }
  }, []);

  const navigateToRandomPlanet = useCallback(() => {
    if (exoplanetsRef.current.length === 0) {
      console.warn('No exoplanets loaded yet');
      return;
    }

    // Get a random exoplanet
    const randomIndex = Math.floor(Math.random() * exoplanetsRef.current.length);
    const randomLod = exoplanetsRef.current[randomIndex];
    const exoplanet = randomLod.userData.exoplanet;

    if (exoplanet && cameraServiceRef.current) {
      // Calculate planet radius in scene units (1 Earth radius = 5M scene units)
      const EARTH_RADIUS_TO_SCENE_UNITS = 5000000;
      const planetRadius = (exoplanet.radius || 1) * EARTH_RADIUS_TO_SCENE_UNITS;
      
      setSelectedExoplanet({
        position: randomLod.position.clone(),
        exoplanet: exoplanet,
      });
      cameraServiceRef.current.moveToPlanet(randomLod.position, planetRadius);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    // Initialize services
    sceneServiceRef.current = new SceneService();
    tilesServiceRef.current = new TilesService();
    exoplanetsServiceRef.current = new ExoplanetsService();
    cameraServiceRef.current = new CameraService();
    textureManagerRef.current = new TextureManager();
    starfieldServiceRef.current = new StarfieldService();
    visibilityServiceRef.current = new VisibilityService();

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
    
    // Add starfield background
    if (starfieldServiceRef.current) {
      const starfield = starfieldServiceRef.current.createStarfield();
      scene.add(starfield);
    }

    // Setup tiles (Earth)
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const tiles = tilesServiceRef.current.createTiles(camera, maxAnisotropy);
    tilesRef.current = tiles;
    scene.add(tiles.group);

    // Load exoplanets asynchronously
    const loadExoplanets = async () => {
      if (!mounted || !exoplanetsServiceRef.current) return;
      
      const exoplanets = await exoplanetsServiceRef.current.createExoplanets();
      
      if (!mounted) {
        // Dispose if component unmounted during loading
        exoplanets.forEach(exoplanet => {
          exoplanet.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
            }
          });
        });
        return;
      }
      
      exoplanets.forEach(exoplanet => scene.add(exoplanet));
      exoplanetsRef.current = exoplanets;
      
      // Update count
      setExoplanetsCount(exoplanets.length);
      
      // Calculate distance range from loaded exoplanets
      if (exoplanets.length > 0) {
        const distances = exoplanets
          .map(lod => lod.userData.exoplanet.star_distance)
          .filter((d): d is number => d !== undefined && d !== null);
        
        if (distances.length > 0) {
          setDistanceRange({
            min: Math.min(...distances),
            max: Math.max(...distances),
          });
        }
      }
    };
    
    loadExoplanets();

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
      
      // Get meshes from ONLY VISIBLE LOD objects for better performance
      const meshes: THREE.Mesh[] = [];
      exoplanetsRef.current.forEach(lod => {
        // Skip hidden planets
        if (!lod.visible) return;
        
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
        if (lod && cameraServiceRef.current && lod.userData.exoplanet) {
          setSelectedExoplanet({
            position: lod.position.clone(),
            exoplanet: lod.userData.exoplanet,
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
    const TEXTURE_UPDATE_INTERVAL = 120; // Update textures every 120 frames (~2s at 60fps) - reduced for performance
    const VISIBILITY_UPDATE_INTERVAL = 30; // Update visibility every 30 frames (~0.5s at 60fps)
    const STATS_LOG_INTERVAL = 300; // Log stats every 300 frames (~5s at 60fps)
    let lastFrameTime = performance.now();
    let frameTimeSum = 0;
    let frameTimeCount = 0;
    let visibleCount = 0;

    // Animation loop
    function animate() {
      if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;
      
      // Performance monitoring
      const now = performance.now();
      const frameTime = now - lastFrameTime;
      lastFrameTime = now;
      frameTimeSum += frameTime;
      frameTimeCount++;
      
      // Log average FPS and visibility stats every 5 seconds
      if (frameTimeCount >= STATS_LOG_INTERVAL) {
        const avgFrameTime = frameTimeSum / frameTimeCount;
        const fps = 1000 / avgFrameTime;
        const totalPlanets = exoplanetsRef.current.length;
        const renderPercent = totalPlanets > 0 ? ((visibleCount / totalPlanets) * 100).toFixed(1) : '0';
        console.log(`Performance: ${fps.toFixed(1)} FPS (${avgFrameTime.toFixed(2)}ms/frame) | Rendering: ${visibleCount}/${totalPlanets} planets (${renderPercent}%)`);
        
        // Log texture stats for debugging
        if (textureManagerRef.current) {
          textureManagerRef.current.logDetailedStats();
        }
        
        frameTimeSum = 0;
        frameTimeCount = 0;
      }
      
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

      // Update visibility with frustum culling
      if (frameCount % VISIBILITY_UPDATE_INTERVAL === 0 && 
          visibilityServiceRef.current && 
          exoplanetsRef.current.length > 0) {
        
        const visibilityResult = visibilityServiceRef.current.updateVisibility(
          exoplanetsRef.current,
          cameraRef.current
        );
        visibleCount = visibilityResult.visibleCount;
        
        // Update TextureManager with visible planets for dynamic management
        if (textureManagerRef.current) {
          const visiblePlanetIds = visibilityResult.visible.map(
            lod => lod.userData.exoplanet._id || lod.userData.exoplanet.name
          );
          textureManagerRef.current.updateVisiblePlanets(visiblePlanetIds);
          
          // Dynamically adjust texture distance thresholds based on visible count
          textureManagerRef.current.adjustThresholdsBasedOnLoad(visibleCount);
          
          // Unload textures for planets that are no longer visible
          textureManagerRef.current.unloadInvisibleTextures();
        }
      }

      // Periodically update exoplanet textures - ONLY for visible planets
      if (frameCount % TEXTURE_UPDATE_INTERVAL === 0 && 
          textureManagerRef.current && 
          exoplanetsServiceRef.current &&
          visibilityServiceRef.current &&
          exoplanetsRef.current.length > 0) {
        
        const textureUpdateStart = performance.now();
        
        // Get only visible planets sorted by distance (closest first)
        // Limit to top 100 visible planets to avoid performance issues
        const visiblePlanets = visibilityServiceRef.current.getVisibleSortedByDistance(
          exoplanetsRef.current,
          cameraRef.current,
          100
        );
        
        // Only update textures for visible planets (async with URL loading)
        if (visiblePlanets.length > 0) {
          // Use async version to load from URLs
          textureManagerRef.current.updateTexturesAsync(
            visiblePlanets,
            cameraRef.current.position
          ).then((textureMap) => {
            // Apply textures to materials
            textureMap.forEach((texture, planetId) => {
              exoplanetsServiceRef.current?.updateTexture(planetId, texture);
            });
            
            const textureUpdateTime = performance.now() - textureUpdateStart;
            if (textureUpdateTime > 16) { // Log if taking more than one frame at 60fps
              console.log(`Texture update took ${textureUpdateTime.toFixed(2)}ms for ${visiblePlanets.length} visible planets`);
            }
          });
        }
      }

      // Periodically fix textures
      if (frameCount % TEXTURE_FIX_FRAME_INTERVAL === 0 && tilesRef.current) {
        tilesRef.current.group.traverse(obj => fixTextures(obj, maxAnisotropy));
      }

      // Update tiles
      if (tilesServiceRef.current) {
        tilesServiceRef.current.update(cameraRef.current, rendererRef.current);
      }

      // Render scene - Three.js will automatically skip rendering hidden objects (visible=false)
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
      mounted = false;
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
      textureManagerRef.current?.dispose();
      starfieldServiceRef.current?.dispose();
      visibilityServiceRef.current?.dispose();

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
    exoplanetsCount,
    distanceRange,
    navigateToPlanet,
    setControlsEnabled,
    navigateToRandomPlanet,
  };
}

