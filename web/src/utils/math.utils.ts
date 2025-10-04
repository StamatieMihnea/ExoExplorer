import * as THREE from 'three';

/**
 * Get a random point on a sphere with the given radius
 */
export function getRandomPointOnSphere(radius: number): THREE.Vector3 {
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

/**
 * Smoothly interpolate camera position and rotation
 */
export function lerpCamera(
  camera: THREE.PerspectiveCamera,
  targetPosition: THREE.Vector3,
  targetRotation: THREE.Euler,
  lerpFactor: number
): void {
  // Smoothly interpolate position
  camera.position.lerp(targetPosition, lerpFactor);
  
  // Smoothly interpolate rotation
  const currentRotation = new THREE.Euler().setFromQuaternion(camera.quaternion);
  currentRotation.x += (targetRotation.x - currentRotation.x) * lerpFactor;
  currentRotation.y += (targetRotation.y - currentRotation.y) * lerpFactor;
  currentRotation.z += (targetRotation.z - currentRotation.z) * lerpFactor;
  camera.quaternion.setFromEuler(currentRotation);
}

/**
 * Check if camera is close enough to target position
 */
export function isCameraAtTarget(
  camera: THREE.PerspectiveCamera,
  targetPosition: THREE.Vector3,
  threshold: number
): boolean {
  return camera.position.distanceTo(targetPosition) < threshold;
}

