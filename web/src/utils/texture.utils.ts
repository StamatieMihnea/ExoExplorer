import * as THREE from 'three';

/**
 * Apply texture filtering to fix glitching issues
 */
export function fixTextures(obj: any, maxAnisotropy: number): void {
  if (obj.material) {
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach((mat: any) => {
      // Fix all texture channels
      const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'];
      textureProps.forEach(prop => {
        if (mat[prop]) {
          mat[prop].anisotropy = maxAnisotropy;
          mat[prop].generateMipmaps = true;
          mat[prop].minFilter = THREE.LinearFilter;
          mat[prop].magFilter = THREE.LinearFilter;
          mat[prop].wrapS = THREE.ClampToEdgeWrapping;
          mat[prop].wrapT = THREE.ClampToEdgeWrapping;
          mat[prop].needsUpdate = true;
        }
      });
      
      // Force material update
      mat.needsUpdate = true;
    });
  }
  
  // Also fix geometry if present
  if (obj.geometry) {
    obj.geometry.computeVertexNormals();
  }
}

