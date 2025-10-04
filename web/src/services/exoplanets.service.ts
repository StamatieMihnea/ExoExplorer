import * as THREE from 'three';
import { EXOPLANET_CONFIG } from '@/constants/scene.constants';
import { getRandomPointOnSphere } from '@/utils/math.utils';
import type { ExoplanetConfig } from '@/types/scene.types';

export class ExoplanetsService {
  private config: ExoplanetConfig;
  private geometries: THREE.IcosahedronGeometry[] = [];
  private material: THREE.MeshLambertMaterial | null = null;

  constructor(config: ExoplanetConfig = EXOPLANET_CONFIG) {
    this.config = config;
  }

  createExoplanets(): THREE.LOD[] {
    // Create geometries for LOD levels
    this.geometries = this.config.lodLevels.map(
      level => new THREE.IcosahedronGeometry(this.config.radius, level.detail)
    );

    // Create material
    this.material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      wireframe: true,
    });

    // Create exoplanets
    const exoplanets: THREE.LOD[] = [];
    for (let i = 0; i < this.config.count; i++) {
      const lod = this.createExoplanet();
      exoplanets.push(lod);
    }

    return exoplanets;
  }

  private createExoplanet(): THREE.LOD {
    const lod = new THREE.LOD();

    // Add LOD levels
    this.config.lodLevels.forEach((level, index) => {
      const mesh = new THREE.Mesh(this.geometries[index], this.material!);
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
      lod.addLevel(mesh, level.distance);
    });

    // Position exoplanet randomly on a sphere
    const radius = this.config.minDistanceFromEarth + 
                   Math.random() * (this.config.maxDistanceFromEarth - this.config.minDistanceFromEarth);
    
    const position = getRandomPointOnSphere(radius);
    lod.position.copy(position);
    lod.updateMatrix();
    lod.matrixAutoUpdate = false;

    return lod;
  }

  dispose(): void {
    this.geometries.forEach(geom => geom.dispose());
    this.geometries = [];
    
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
  }
}

