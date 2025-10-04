import * as THREE from 'three';
import type { SceneConfig, TilesConfig, ExoplanetConfig } from '@/types/scene.types';

// Cesium Ion key for Google Photorealistic Tiles
export const ION_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0Njc3NjIyYS03OWEzLTQ0NGYtYTQ2Ny1jN2E5YjgwMGQxZWUiLCJpZCI6MzQ3MTk4LCJpYXQiOjE3NTk1OTYyMTJ9.WgGEjKeNZZgmkD53rj6SAdJzyKs28wF_o-2kRyzn4yk';

export const SCENE_CONFIG: SceneConfig = {
  camera: {
    fov: 45,
    near: 1,
    far: 500000000,
    initialPosition: new THREE.Vector3(0, 0, 50000000),
  },
  fog: {
    color: 0x000000,
    near: 1,
    far: 300000000,
  },
  lighting: {
    ambient: {
      color: 0x404040,
      intensity: 1.5,
    },
    sun: {
      color: 0xffffff,
      intensity: 2,
      position: new THREE.Vector3(20000000, 20000000, 20000000),
    },
  },
  renderer: {
    antialias: true,
    alpha: true,
    logarithmicDepthBuffer: true,
  },
};

export const TILES_CONFIG: TilesConfig = {
  apiToken: ION_KEY,
  assetId: '2275207',
  errorTarget: 1,
  errorThreshold: 1,
  maxDepth: Infinity,
  rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
};

export const EXOPLANET_CONFIG: ExoplanetConfig = {
  count: 10000,
  radius: 5000000,
  minDistanceFromEarth: 80000000,
  maxDistanceFromEarth: 250000000,
  lodLevels: [
    { detail: 16, distance: 5000000 },
    { detail: 8, distance: 20000000 },
    { detail: 4, distance: 50000000 },
    { detail: 2, distance: 100000000 },
    { detail: 1, distance: 200000000 },
  ],
};

export const CAMERA_ANIMATION_CONFIG = {
  lerpFactor: 0.05,
  distanceThreshold: 100000,
};

export const CONTROLS_CONFIG = {
  movementSpeed: 10000000,
  rollSpeed: Math.PI / 10,
  dragToLook: true,
};

export const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

export const TEXTURE_FIX_FRAME_INTERVAL = 60;
export const EARTH_ROTATION_SPEED = 0.01;

