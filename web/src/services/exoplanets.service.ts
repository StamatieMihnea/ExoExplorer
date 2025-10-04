import * as THREE from 'three';
import { EXOPLANET_CONFIG } from '@/constants/scene.constants';
import { getRandomPointOnSphere } from '@/utils/math.utils';
import type { ExoplanetConfig } from '@/types/scene.types';
import type { Exoplanet } from '@/lib/types';

// Conversion factors
const LIGHT_YEAR_TO_SCENE_UNITS = 25000000; // 1 light year = 25M scene units (increased for more dispersion)
const EARTH_RADIUS_TO_SCENE_UNITS = 5000000; // 1 Earth radius = 5M scene units
const DEFAULT_DISTANCE = 100; // Default distance in light years if not available
const DEFAULT_RADIUS = 1; // Default radius in Earth radii if not available

export interface ExoplanetLOD extends THREE.LOD {
  userData: {
    exoplanet: Exoplanet;
    materials: THREE.MeshStandardMaterial[];
  };
}

export class ExoplanetsService {
  private config: ExoplanetConfig;
  private geometries: Map<number, THREE.IcosahedronGeometry[]> = new Map();
  private materials: Map<string, THREE.MeshStandardMaterial[]> = new Map();

  constructor(config: ExoplanetConfig = EXOPLANET_CONFIG) {
    this.config = config;
  }

  async fetchExoplanets(): Promise<Exoplanet[]> {
    try {
      const response = await fetch('/api/exoplanets/all');
      if (!response.ok) {
        throw new Error('Failed to fetch exoplanets');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exoplanets:', error);
      return [];
    }
  }

  async createExoplanets(): Promise<ExoplanetLOD[]> {
    // Fetch exoplanets from API
    const exoplanetsData = await this.fetchExoplanets();
    
    if (exoplanetsData.length === 0) {
      console.warn('No exoplanets fetched from API');
      return [];
    }

    // Create exoplanets from fetched data with collision detection
    const exoplanets: ExoplanetLOD[] = [];
    const placedPlanets: Array<{ position: THREE.Vector3; radius: number }> = [];
    
    for (const exoplanetData of exoplanetsData) {
      const lod = this.createExoplanet(exoplanetData, placedPlanets);
      exoplanets.push(lod);
      
      // Track this planet's position and radius for future collision checks
      const radius = (exoplanetData.radius || DEFAULT_RADIUS) * EARTH_RADIUS_TO_SCENE_UNITS;
      placedPlanets.push({
        position: lod.position.clone(),
        radius: radius
      });
    }

    return exoplanets;
  }

  private createExoplanet(
    exoplanetData: Exoplanet,
    placedPlanets: Array<{ position: THREE.Vector3; radius: number }> = []
  ): ExoplanetLOD {
    const lod = new THREE.LOD() as ExoplanetLOD;
    const planetId = exoplanetData._id || exoplanetData.name;

    // Calculate size based on radius (in Earth radii)
    const radius = (exoplanetData.radius || DEFAULT_RADIUS) * EARTH_RADIUS_TO_SCENE_UNITS;
    
    // Create geometries for this specific exoplanet's size if not cached
    const radiusKey = Math.round(radius);
    if (!this.geometries.has(radiusKey)) {
      const geometries = this.config.lodLevels.map(
        level => new THREE.IcosahedronGeometry(radius, level.detail)
      );
      this.geometries.set(radiusKey, geometries);
    }
    
    const geometries = this.geometries.get(radiusKey)!;

    // Create materials for this planet (one per LOD level)
    // Start with no texture - will be added by TextureManager
    // Add subtle emissive glow for visual appeal
    const materials = this.config.lodLevels.map(() => {
      return new THREE.MeshStandardMaterial({
        color: 0xffffff, // White to not tint the texture
        roughness: 0.35,   // Lower roughness for brighter appearance
        metalness: 0.05,   // Very low metalness for more diffuse reflection
        flatShading: false,
        emissive: 0x111122, // Subtle blue glow
        emissiveIntensity: 0.08,
      });
    });
    
    this.materials.set(planetId, materials);

    // Store exoplanet data and materials in userData
    lod.userData = { 
      exoplanet: exoplanetData,
      materials,
    };

    // Add LOD levels with individual materials
    this.config.lodLevels.forEach((level, index) => {
      const mesh = new THREE.Mesh(geometries[index], materials[index]);
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
      lod.addLevel(mesh, level.distance);
    });

    // Position exoplanet based on star_distance (in light years)
    const distance = (exoplanetData.star_distance || DEFAULT_DISTANCE) * LIGHT_YEAR_TO_SCENE_UNITS;
    
    // Find a non-overlapping position with collision detection
    const position = this.findNonOverlappingPosition(distance, radius, placedPlanets);
    lod.position.copy(position);
    lod.updateMatrix();
    lod.matrixAutoUpdate = false;

    return lod;
  }

  /**
   * Find a non-overlapping position for a planet
   * Uses collision detection to ensure planets don't overlap
   */
  private findNonOverlappingPosition(
    distance: number,
    radius: number,
    placedPlanets: Array<{ position: THREE.Vector3; radius: number }>
  ): THREE.Vector3 {
    const MAX_ATTEMPTS = 100;
    const MIN_SEPARATION_MULTIPLIER = 2.5; // Minimum separation is 2.5x the sum of radii
    
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidatePosition = getRandomPointOnSphere(distance);
      let hasCollision = false;
      
      // Check collision with all previously placed planets
      for (const placed of placedPlanets) {
        const distanceBetween = candidatePosition.distanceTo(placed.position);
        const minDistance = (radius + placed.radius) * MIN_SEPARATION_MULTIPLIER;
        
        if (distanceBetween < minDistance) {
          hasCollision = true;
          break;
        }
      }
      
      // If no collision, return this position
      if (!hasCollision) {
        return candidatePosition;
      }
    }
    
    // If we couldn't find a non-overlapping position after MAX_ATTEMPTS,
    // return a position anyway (better than infinite loop)
    // This should be rare in practice given the vast space available
    console.warn(`Could not find non-overlapping position after ${MAX_ATTEMPTS} attempts`);
    return getRandomPointOnSphere(distance);
  }

  /**
   * Update texture for a specific exoplanet
   */
  updateTexture(planetId: string, texture: THREE.Texture | null): void {
    const materials = this.materials.get(planetId);
    if (!materials) return;

    materials.forEach(material => {
      if (material.map) {
        material.map = texture;
        material.needsUpdate = true;
      } else if (texture) {
        material.map = texture;
        material.needsUpdate = true;
      }
    });
  }

  dispose(): void {
    this.geometries.forEach(geometryArray => {
      geometryArray.forEach(geom => geom.dispose());
    });
    this.geometries.clear();
    
    this.materials.forEach(materialArray => {
      materialArray.forEach(material => material.dispose());
    });
    this.materials.clear();
  }
}

