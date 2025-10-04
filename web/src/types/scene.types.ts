import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';

export interface SceneConfig {
  camera: CameraConfig;
  fog: FogConfig;
  lighting: LightingConfig;
  renderer: RendererConfig;
}

export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  initialPosition: THREE.Vector3;
}

export interface FogConfig {
  color: number;
  near: number;
  far: number;
}

export interface LightingConfig {
  ambient: {
    color: number;
    intensity: number;
  };
  sun: {
    color: number;
    intensity: number;
    position: THREE.Vector3;
  };
}

export interface RendererConfig {
  antialias: boolean;
  alpha: boolean;
  logarithmicDepthBuffer: boolean;
}

export interface TilesConfig {
  apiToken: string;
  assetId: string;
  errorTarget: number;
  errorThreshold: number;
  maxDepth: number;
  rotation: THREE.Euler;
}

export interface ExoplanetConfig {
  count: number;
  radius: number;
  minDistanceFromEarth: number;
  maxDistanceFromEarth: number;
  lodLevels: Array<{ detail: number; distance: number }>;
}

export interface CameraAnimation {
  targetPosition: THREE.Vector3;
  targetRotation: THREE.Euler;
  lerpFactor: number;
  distanceThreshold: number;
}

export interface SceneRefs {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: FlyControls;
  tiles: TilesRenderer;
  clock: THREE.Clock;
}

