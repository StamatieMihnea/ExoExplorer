import * as THREE from 'three';
import type { ExoplanetLOD } from './exoplanets.service';

/**
 * Service to manage object visibility and frustum culling
 */
export class VisibilityService {
  private frustum: THREE.Frustum;
  private projScreenMatrix: THREE.Matrix4;
  private visibilityCache: Map<string, boolean>;
  private maxRenderDistance: number;

  constructor(maxRenderDistance: number = 500000000) {
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
    this.visibilityCache = new Map();
    this.maxRenderDistance = maxRenderDistance;
  }

  /**
   * Update frustum from camera
   */
  updateFrustum(camera: THREE.PerspectiveCamera): void {
    camera.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  /**
   * Check if an object is visible in the camera frustum and within distance
   */
  isVisible(
    object: THREE.Object3D,
    cameraPosition: THREE.Vector3,
    checkDistance: boolean = true
  ): boolean {
    // Distance culling
    if (checkDistance) {
      const distance = object.position.distanceTo(cameraPosition);
      if (distance > this.maxRenderDistance) {
        return false;
      }
    }

    // Frustum culling
    // For LOD objects, we need to check the bounding sphere
    if (object instanceof THREE.LOD) {
      // Get the current level geometry
      const currentLevel = object.getCurrentLevel();
      if (currentLevel >= 0 && currentLevel < object.levels.length) {
        const mesh = object.levels[currentLevel].object as THREE.Mesh;
        if (mesh.geometry) {
          // Compute bounding sphere if not already computed
          if (!mesh.geometry.boundingSphere) {
            mesh.geometry.computeBoundingSphere();
          }
          
          if (mesh.geometry.boundingSphere) {
            // Create a sphere at the object's position with the geometry's radius
            const sphere = new THREE.Sphere(
              object.position.clone(),
              mesh.geometry.boundingSphere.radius
            );
            return this.frustum.intersectsSphere(sphere);
          }
        }
      }
    }

    // Fallback: check if object position is in frustum (point test)
    return this.frustum.containsPoint(object.position);
  }

  /**
   * Update visibility for all exoplanets and return visible ones
   */
  updateVisibility(
    exoplanets: ExoplanetLOD[],
    camera: THREE.PerspectiveCamera
  ): {
    visible: ExoplanetLOD[];
    hidden: ExoplanetLOD[];
    visibleCount: number;
    hiddenCount: number;
  } {
    this.updateFrustum(camera);
    
    const visible: ExoplanetLOD[] = [];
    const hidden: ExoplanetLOD[] = [];

    for (const exoplanet of exoplanets) {
      const planetId = exoplanet.userData.exoplanet._id || exoplanet.userData.exoplanet.name;
      const isVisible = this.isVisible(exoplanet, camera.position);
      
      // Update visibility state
      if (isVisible) {
        if (!exoplanet.visible) {
          exoplanet.visible = true;
        }
        visible.push(exoplanet);
        this.visibilityCache.set(planetId, true);
      } else {
        if (exoplanet.visible) {
          exoplanet.visible = false;
        }
        hidden.push(exoplanet);
        this.visibilityCache.set(planetId, false);
      }
    }

    return {
      visible,
      hidden,
      visibleCount: visible.length,
      hiddenCount: hidden.length,
    };
  }

  /**
   * Get visible exoplanets sorted by distance from camera
   * Useful for prioritizing texture updates
   */
  getVisibleSortedByDistance(
    exoplanets: ExoplanetLOD[],
    camera: THREE.PerspectiveCamera,
    maxCount?: number
  ): ExoplanetLOD[] {
    this.updateFrustum(camera);

    // Filter visible and calculate distances
    const visibleWithDistance = exoplanets
      .map(exoplanet => ({
        exoplanet,
        distance: exoplanet.position.distanceTo(camera.position),
        isVisible: this.isVisible(exoplanet, camera.position),
      }))
      .filter(item => item.isVisible)
      .sort((a, b) => a.distance - b.distance);

    // Return top N if specified
    const result = maxCount 
      ? visibleWithDistance.slice(0, maxCount)
      : visibleWithDistance;

    return result.map(item => item.exoplanet);
  }

  /**
   * Check if a specific planet is cached as visible
   */
  isInVisibilityCache(planetId: string): boolean {
    return this.visibilityCache.get(planetId) ?? false;
  }

  /**
   * Set maximum render distance
   */
  setMaxRenderDistance(distance: number): void {
    this.maxRenderDistance = distance;
  }

  /**
   * Get statistics about visibility
   */
  getStats(): {
    cachedCount: number;
    visibleInCache: number;
    hiddenInCache: number;
  } {
    let visibleInCache = 0;
    let hiddenInCache = 0;

    this.visibilityCache.forEach(isVisible => {
      if (isVisible) {
        visibleInCache++;
      } else {
        hiddenInCache++;
      }
    });

    return {
      cachedCount: this.visibilityCache.size,
      visibleInCache,
      hiddenInCache,
    };
  }

  /**
   * Clear visibility cache
   */
  clearCache(): void {
    this.visibilityCache.clear();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.visibilityCache.clear();
  }
}

