import * as THREE from 'three';
import { SCENE_CONFIG } from '@/constants/scene.constants';
import type { SceneConfig } from '@/types/scene.types';

export class SceneService {
  private config: SceneConfig;

  constructor(config: SceneConfig = SCENE_CONFIG) {
    this.config = config;
  }

  createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(
      this.config.fog.color,
      this.config.fog.near,
      this.config.fog.far
    );
    return scene;
  }

  createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      this.config.camera.fov,
      window.innerWidth / window.innerHeight,
      this.config.camera.near,
      this.config.camera.far
    );
    camera.position.copy(this.config.camera.initialPosition);
    return camera;
  }

  createLighting(): THREE.Light[] {
    const ambientLight = new THREE.AmbientLight(
      this.config.lighting.ambient.color,
      this.config.lighting.ambient.intensity
    );

    const sunLight = new THREE.DirectionalLight(
      this.config.lighting.sun.color,
      this.config.lighting.sun.intensity
    );
    sunLight.position.copy(this.config.lighting.sun.position);
    
    const hemisphereLight = new THREE.HemisphereLight(
      0x8888ff,
      0x220022,
      0.5
    );

    const fillLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    fillLight.position.set(-10000000, -10000000, -10000000);

    return [ambientLight, sunLight, hemisphereLight, fillLight];
  }

  createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: this.config.renderer.antialias,
      alpha: this.config.renderer.alpha,
      logarithmicDepthBuffer: this.config.renderer.logarithmicDepthBuffer,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    return renderer;
  }

  handleWindowResize(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ): void {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

