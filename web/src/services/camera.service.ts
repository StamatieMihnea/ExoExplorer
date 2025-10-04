import * as THREE from 'three';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { CONTROLS_CONFIG, CAMERA_ANIMATION_CONFIG, SCENE_CONFIG } from '@/constants/scene.constants';
import { lerpCamera, isCameraAtTarget } from '@/utils/math.utils';
import type { CameraAnimation } from '@/types/scene.types';

export class CameraService {
  private controls: FlyControls | null = null;
  private animation: CameraAnimation | null = null;

  createControls(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement
  ): FlyControls {
    this.controls = new FlyControls(camera, domElement);
    this.controls.movementSpeed = CONTROLS_CONFIG.movementSpeed;
    this.controls.rollSpeed = CONTROLS_CONFIG.rollSpeed;
    this.controls.dragToLook = CONTROLS_CONFIG.dragToLook;
    return this.controls;
  }

  setupMouseControls(domElement: HTMLElement): () => void {
    let isRightMouseDown = false;

    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 2) {
        isRightMouseDown = true;
      } else {
        event.stopPropagation();
        event.preventDefault();
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      if (event.button === 2) {
        isRightMouseDown = false;
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isRightMouseDown) {
        event.stopPropagation();
      }
    };

    const onContextMenu = (event: Event) => {
      event.preventDefault();
    };

    domElement.addEventListener('mousedown', onMouseDown, true);
    domElement.addEventListener('mouseup', onMouseUp, true);
    domElement.addEventListener('mousemove', onMouseMove, true);
    domElement.addEventListener('contextmenu', onContextMenu);

    // Return cleanup function
    return () => {
      domElement.removeEventListener('mousedown', onMouseDown, true);
      domElement.removeEventListener('mouseup', onMouseUp, true);
      domElement.removeEventListener('mousemove', onMouseMove, true);
      domElement.removeEventListener('contextmenu', onContextMenu);
    };
  }

  startAnimation(targetPosition: THREE.Vector3, targetRotation: THREE.Euler): void {
    this.animation = {
      targetPosition,
      targetRotation,
      lerpFactor: CAMERA_ANIMATION_CONFIG.lerpFactor,
      distanceThreshold: CAMERA_ANIMATION_CONFIG.distanceThreshold,
    };

    if (this.controls) {
      this.controls.enabled = false;
    }
  }

  updateAnimation(camera: THREE.PerspectiveCamera): boolean {
    if (!this.animation) return false;

    lerpCamera(
      camera,
      this.animation.targetPosition,
      this.animation.targetRotation,
      this.animation.lerpFactor
    );

    if (isCameraAtTarget(camera, this.animation.targetPosition, this.animation.distanceThreshold)) {
      camera.position.copy(this.animation.targetPosition);
      camera.quaternion.setFromEuler(this.animation.targetRotation);
      this.animation = null;

      if (this.controls) {
        this.controls.enabled = true;
      }

      return false;
    }

    return true;
  }

  update(delta: number): void {
    if (this.controls && !this.animation) {
      this.controls.update(delta);
    }
  }

  setControlsEnabled(enabled: boolean): void {
    if (this.controls && !this.animation) {
      this.controls.enabled = enabled;
    }
  }

  getControlsEnabled(): boolean {
    return this.controls?.enabled ?? false;
  }

  returnToEarth(): void {
    this.startAnimation(
      SCENE_CONFIG.camera.initialPosition.clone(),
      new THREE.Euler(0, 0, 0)
    );
  }

  moveToPlanet(planetPosition: THREE.Vector3): void {
    // Calculate offset to position the planet on the right side of the screen
    // We want the camera to be positioned so the planet appears on the right
    const distance = 15000000; // Distance from the planet
    
    // Create a direction vector from Earth (origin) to the planet
    const direction = planetPosition.clone().normalize();
    
    // Calculate the camera position offset to the left of the planet
    // (so planet appears on the right side of screen)
    const rightOffset = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize()
      .multiplyScalar(distance * 0.6); // Offset to the left
    
    // Position camera closer to the planet, offset to the left
    const cameraPosition = planetPosition.clone()
      .add(direction.multiplyScalar(-distance)) // Move back from planet
      .add(rightOffset); // Offset to the left
    
    // Calculate rotation to look at the planet
    const tempCamera = new THREE.PerspectiveCamera();
    tempCamera.position.copy(cameraPosition);
    tempCamera.lookAt(planetPosition);
    
    this.startAnimation(
      cameraPosition,
      tempCamera.rotation.clone()
    );
  }

  isAnimating(): boolean {
    return this.animation !== null;
  }

  dispose(): void {
    this.controls = null;
    this.animation = null;
  }
}

