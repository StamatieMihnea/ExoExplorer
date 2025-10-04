import * as THREE from 'three';

export interface StarfieldConfig {
  starCount: number;
  galaxyCount: number;
  minDistance: number;
  maxDistance: number;
  baseStarSize: number;
}

const DEFAULT_STARFIELD_CONFIG: StarfieldConfig = {
  starCount: 2000, // Fewer, more subtle stars
  galaxyCount: 3000, // Distant galaxy glow particles
  minDistance: 100000000,
  maxDistance: 400000000,
  baseStarSize: 4000000, // Smaller base size for subtlety
};

export class StarfieldService {
  private config: StarfieldConfig;
  private starfield: THREE.Group | null = null;

  constructor(config: StarfieldConfig = DEFAULT_STARFIELD_CONFIG) {
    this.config = config;
  }

  /**
   * Create a beautiful, subtle galaxy-like background
   */
  createStarfield(): THREE.Group {
    const group = new THREE.Group();

    // Create subtle distant stars
    const stars = this.createSubtleStars();
    group.add(stars);

    // Create galaxy nebula effect
    const nebula = this.createNebulaEffect();
    group.add(nebula);

    this.starfield = group;
    return group;
  }

  /**
   * Create subtle, distant stars
   */
  private createSubtleStars(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    const color = new THREE.Color();

    for (let i = 0; i < this.config.starCount; i++) {
      // Random position on a sphere shell
      const radius = THREE.MathUtils.randFloat(
        this.config.minDistance,
        this.config.maxDistance
      );
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions.push(x, y, z);

      // Subtle star colors - mostly white with slight tints
      const rand = Math.random();
      if (rand < 0.8) {
        color.setHex(0xffffff); // Pure white (most stars)
      } else if (rand < 0.9) {
        color.setHex(0xfffaf0); // Warm white
      } else if (rand < 0.96) {
        color.setHex(0xf0f8ff); // Cool white
      } else {
        color.setHex(0xe6f2ff); // Very subtle blue
      }
      
      colors.push(color.r, color.g, color.b);

      // Very small stars for subtlety - power of 4 makes most stars very tiny
      const size = Math.pow(Math.random(), 4) * this.config.baseStarSize * 0.8;
      sizes.push(size);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: this.config.baseStarSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.25, // More subtle opacity
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Create subtle nebula/galaxy glow effect
   */
  private createNebulaEffect(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    const color = new THREE.Color();

    for (let i = 0; i < this.config.galaxyCount; i++) {
      // Cluster particles more toward certain regions for galaxy arms
      const clusterAngle = Math.floor(Math.random() * 3) * (Math.PI * 2 / 3);
      const angleVariation = (Math.random() - 0.5) * Math.PI / 2;
      const theta = clusterAngle + angleVariation;
      
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = THREE.MathUtils.randFloat(
        this.config.minDistance * 1.5,
        this.config.maxDistance * 0.9
      );

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.3; // Flatten slightly
      const z = radius * Math.cos(phi);

      positions.push(x, y, z);

      // Very subtle nebula colors - darker and more refined
      const rand = Math.random();
      if (rand < 0.4) {
        color.setRGB(0.08, 0.06, 0.15); // Very dark purple
      } else if (rand < 0.7) {
        color.setRGB(0.05, 0.08, 0.18); // Very dark blue
      } else if (rand < 0.85) {
        color.setRGB(0.12, 0.05, 0.12); // Dark magenta
      } else if (rand < 0.95) {
        color.setRGB(0.06, 0.1, 0.14); // Dark cyan
      } else {
        color.setRGB(0.15, 0.15, 0.18); // Slightly lighter grey-blue
      }
      
      colors.push(color.r, color.g, color.b);

      // Large, soft particles for nebula effect - more variation
      const size = THREE.MathUtils.randFloat(
        this.config.baseStarSize * 1.5,
        this.config.baseStarSize * 6
      );
      sizes.push(size);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: this.config.baseStarSize * 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.08, // Extremely subtle nebula glow
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.starfield) {
      this.starfield.traverse((child) => {
        if (child instanceof THREE.Points) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }
  }
}

