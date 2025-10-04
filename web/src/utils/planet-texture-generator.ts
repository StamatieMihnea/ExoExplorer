import * as THREE from 'three';
import type { Exoplanet } from '@/lib/types';

/**
 * Scientifically Accurate Exoplanet Texture Generator (Performance Optimized)
 * 
 * This module generates procedural textures for exoplanets based on real astronomical
 * classification and observational data. The textures are informed by:
 * 
 * 1. Planet Classification:
 *    - Uses mass-radius relationships to determine composition (rocky vs gaseous)
 *    - Classifies into: Hot Jupiters, Ice Giants, Mini-Neptunes, Super-Earths, Terrestrial
 * 
 * 2. Temperature-Dependent Appearance:
 *    - Hot Jupiters (>1000K): Dark atmospheres with thermal emission, sodium absorption
 *    - Ice Giants (<500K): Methane absorption creates Neptune/Uranus-like blue colors
 *    - Temperate (200-400K): Earth-like features with potential liquid water
 *    - Lava worlds (>700K): Molten surfaces with glowing patterns
 * 
 * 3. Atmospheric Physics:
 *    - Gas giants: Atmospheric banding from high-altitude winds (like Jupiter)
 *    - Storm systems: Based on observed features (Great Red Spot, Great Dark Spot)
 *    - Cloud coverage: Depends on temperature and composition
 * 
 * 4. Surface Features (Rocky planets):
 *    - Water distribution based on habitable zone position
 *    - Desert, ocean, or balanced Earth-like compositions
 *    - Frozen surfaces for cold planets
 * 
 * Performance Optimizations:
 * - Texture caching to ensure each planet texture is generated only once
 * - Reduced pixel iteration for low-res textures
 * - Optimized noise functions
 * 
 * References:
 * - NASA Exoplanet Archive classification schemes
 * - Observational data from JWST, Hubble, and ground-based telescopes
 * - Atmospheric models from exoplanet science literature
 */

// Global cache for generated textures - ensures each planet texture is computed only once
const textureCache = new Map<string, THREE.Texture>();
const simpleTextureCache = new Map<string, THREE.Texture>();

interface PlanetColors {
  base: string;
  secondary: string;
  accent: string;
}

// Planet classification based on mass and radius
enum PlanetType {
  HOT_JUPITER = 'hot_jupiter',      // Gas giant, T > 1000K
  WARM_NEPTUNE = 'warm_neptune',    // Ice giant, 500K < T < 1000K
  ICE_GIANT = 'ice_giant',          // Neptune-like, T < 500K
  SUPER_EARTH = 'super_earth',      // Rocky, R > 1.5 Earth radii
  TERRESTRIAL = 'terrestrial',      // Rocky, Earth-sized or smaller
  MINI_NEPTUNE = 'mini_neptune',    // Small gas planet
}

// Earth constants for reference
const EARTH_MASS = 1.0;  // Earth masses
const EARTH_RADIUS = 1.0; // Earth radii
const JUPITER_MASS = 317.8; // Earth masses
const JUPITER_RADIUS = 11.2; // Earth radii
const NEPTUNE_MASS = 17.1; // Earth masses
const NEPTUNE_RADIUS = 3.88; // Earth radii

/**
 * Classify planet type based on physical properties
 * Uses scientific criteria from exoplanet research
 */
function classifyPlanet(exoplanet: Exoplanet): PlanetType {
  const mass = exoplanet.mass || EARTH_MASS;
  const radius = exoplanet.radius || EARTH_RADIUS;
  const temp = exoplanet.temp_calculated || exoplanet.temp_measured || 300;
  
  // Calculate density (relative to Earth)
  const density = mass / (radius * radius * radius);
  
  // Hot Jupiter: Large, low density, very hot
  if (radius > 8 && temp > 1000 && density < 0.4) {
    return PlanetType.HOT_JUPITER;
  }
  
  // Warm Neptune: Neptune-sized, warm
  if (radius > 3 && radius < 8 && temp > 500 && temp < 1000 && density < 0.8) {
    return PlanetType.WARM_NEPTUNE;
  }
  
  // Ice Giant: Neptune-like, cold, low density
  if (radius > 3 && temp < 500 && density < 0.8) {
    return PlanetType.ICE_GIANT;
  }
  
  // Mini-Neptune: Small gas planet (between Earth and Neptune)
  if (radius > 1.5 && radius < 4 && density < 1.2) {
    return PlanetType.MINI_NEPTUNE;
  }
  
  // Super-Earth: Large rocky planet
  if (radius > 1.5 && density >= 1.2) {
    return PlanetType.SUPER_EARTH;
  }
  
  // Terrestrial: Earth-sized rocky planet
  return PlanetType.TERRESTRIAL;
}

/**
 * Get scientifically accurate colors based on planet type and temperature
 * Based on atmospheric composition and thermal emission
 */
function getScientificColors(exoplanet: Exoplanet, planetType: PlanetType): PlanetColors {
  const temp = exoplanet.temp_calculated || exoplanet.temp_measured || 300;
  
  switch (planetType) {
    case PlanetType.HOT_JUPITER:
      // Hot Jupiters: Very hot, thermal emission dominates
      // Appear dark with sodium/potassium absorption, possibly red-brown from aerosols
      if (temp > 2000) {
        // Ultra-hot: Thermal emission, appears dark with glowing edges
        return {
          base: '#5a3820',
          secondary: '#3d2510',
          accent: '#8a5530',
        };
      } else if (temp > 1500) {
        // Very hot: Dark with reddish tint from clouds
        return {
          base: '#6a4530',
          secondary: '#4a3020',
          accent: '#9a6540',
        };
      } else {
        // Hot: Dark brown/gray from high altitude clouds
        return {
          base: '#7a5840',
          secondary: '#5a4030',
          accent: '#aa7860',
        };
      }
    
    case PlanetType.WARM_NEPTUNE:
      // Warm Neptunes: May have water clouds, less methane
      // Appear lighter blue or cyan-white
      return {
        base: '#8bc5e8',
        secondary: '#6ba3d0',
        accent: '#aae5ff',
      };
    
    case PlanetType.ICE_GIANT:
      // Ice Giants: Methane absorption in atmosphere
      // Neptune/Uranus-like: Blue from methane, with some variation
      if (temp < 100) {
        // Very cold: Deep blue like Neptune
        return {
          base: '#6a8fc5',
          secondary: '#4a6fa5',
          accent: '#8aafe5',
        };
      } else {
        // Warmer ice giant: Lighter blue-cyan like Uranus
        return {
          base: '#9ad8e5',
          secondary: '#7ab8c5',
          accent: '#baf8ff',
        };
      }
    
    case PlanetType.MINI_NEPTUNE:
      // Mini-Neptunes: Hydrogen/helium atmosphere, possibly with clouds
      // Can range from blue-gray to white depending on clouds
      const cloudiness = Math.random();
      if (cloudiness > 0.7) {
        // High clouds: Appears whitish
        return {
          base: '#e5f5ff',
          secondary: '#c5d5e5',
          accent: '#ffffff',
        };
      } else if (cloudiness > 0.4) {
        // Some clouds: Blue-white
        return {
          base: '#aad5f5',
          secondary: '#8ab5d5',
          accent: '#caf5ff',
        };
      } else {
        // Clear: Blue-gray
        return {
          base: '#8aafb5',
          secondary: '#6a8fa5',
          accent: '#aacfd5',
        };
      }
    
    case PlanetType.SUPER_EARTH:
      // Super-Earths: Rocky, composition depends on location and temperature
      if (temp > 700) {
        // Lava world: Molten surface
        return {
          base: '#ff7a40',
          secondary: '#e85a20',
          accent: '#ffaa70',
        };
      } else if (temp > 400) {
        // Hot rocky: Desert-like, no water
        return {
          base: '#d8b090',
          secondary: '#b89070',
          accent: '#f8d0b0',
        };
      } else if (temp > 250) {
        // Potentially habitable: Could have water, continents
        const variation = Math.random();
        if (variation < 0.4) {
          // Ocean world: More water than Earth
          return {
            base: '#4d7aaa',
            secondary: '#3d6a9a',
            accent: '#6d9aca',
          };
        } else if (variation < 0.7) {
          // Earth-like: Water and continents
          return {
            base: '#6a9a7a',
            secondary: '#5a8a6a',
            accent: '#8aba9a',
          };
        } else {
          // Dry: More land than water
          return {
            base: '#aa9a7a',
            secondary: '#8a7a5a',
            accent: '#caba9a',
          };
        }
      } else {
        // Cold: Frozen surface
        return {
          base: '#e5f5ff',
          secondary: '#c5d5e5',
          accent: '#ffffff',
        };
      }
    
    case PlanetType.TERRESTRIAL:
      // Terrestrial planets: Similar to Super-Earth but smaller
      if (temp > 600) {
        // Venus-like: Thick atmosphere, hot
        return {
          base: '#f8e0b0',
          secondary: '#d8c090',
          accent: '#ffffd0',
        };
      } else if (temp > 350) {
        // Hot: Desert world
        return {
          base: '#e8b080',
          secondary: '#c89060',
          accent: '#ffd0a0',
        };
      } else if (temp > 200) {
        // Temperate: Potentially habitable
        const variation = Math.random();
        if (variation < 0.3) {
          // Water-rich
          return {
            base: '#5d8aba',
            secondary: '#4d7aaa',
            accent: '#7daadd',
          };
        } else if (variation < 0.6) {
          // Balanced
          return {
            base: '#7a9a8a',
            secondary: '#6a8a7a',
            accent: '#9abaaa',
          };
        } else {
          // Rocky/desert
          return {
            base: '#baaa8a',
            secondary: '#9a8a6a',
            accent: '#dacaaa',
          };
        }
      } else if (temp > 150) {
        // Mars-like: Cold, thin atmosphere
        return {
          base: '#e89a70',
          secondary: '#c87a50',
          accent: '#ffba90',
        };
      } else {
        // Frozen: Ice-covered
        return {
          base: '#f5ffff',
          secondary: '#d5e5f5',
          accent: '#ffffff',
        };
      }
    
    default:
      return {
        base: '#a0a0a0',
        secondary: '#808080',
        accent: '#c0c0c0',
      };
  }
}

// Generate noise pattern for texture variation with enhanced detail (optimized)
function generateNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  intensity: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Optimize by processing fewer pixels for low-res textures
  const step = width < 128 ? 2 : 1;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      
      // Single noise calculation for performance
      const noise = (Math.random() - 0.5) * intensity;
      
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
      
      // Fill in skipped pixels if step > 1
      if (step > 1 && x + 1 < width) {
        const i2 = (y * width + x + 1) * 4;
        data[i2] = data[i];
        data[i2 + 1] = data[i + 1];
        data[i2 + 2] = data[i + 2];
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Add detail layer for enhanced texture (optimized)
function addDetailLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  ctx.globalCompositeOperation = 'overlay';
  
  // Reduce detail sampling for performance - use larger steps for smaller textures
  const step = width < 128 ? 4 : width < 256 ? 2 : 1;
  
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const detail = perlinNoise(x / width * 2, y / height * 2, 16, 3); // Reduced octaves
      const brightness = Math.floor(detail * 255);
      
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${intensity})`;
      ctx.fillRect(x, y, step, step); // Fill larger blocks
    }
  }
  
  ctx.globalCompositeOperation = 'source-over';
}

// Simple Perlin-like noise using sin waves (optimized with caching)
const noiseCache = new Map<string, number>();

function perlinNoise(x: number, y: number, scale: number, octaves: number = 3): number {
  // Cache key for noise values (round to reduce cache size)
  const cacheKey = `${Math.floor(x * 100)},${Math.floor(y * 100)},${scale},${octaves}`;
  const cached = noiseCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let value = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += Math.sin(x * frequency) * Math.cos(y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  const result = (value / maxValue + 1) / 2; // Normalize to 0-1
  
  // Cache the result (limit cache size)
  if (noiseCache.size < 10000) {
    noiseCache.set(cacheKey, result);
  }
  
  return result;
}

// Draw cloud patterns (for planets with atmospheres) - optimized
function drawClouds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: PlanetColors,
  density: number,
  pattern: 'wisps' | 'bands' | 'spots' = 'wisps'
): void {
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = colors.secondary;

  if (pattern === 'bands') {
    // Banded clouds (for gas giants)
    const bands = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < bands; i++) {
      const bandY = (i / bands) * height;
      const bandHeight = height / bands;
      
      ctx.globalAlpha = 0.3 + Math.random() * 0.4;
      ctx.fillRect(0, bandY, width, bandHeight);
    }
  } else if (pattern === 'spots') {
    // Spot patterns (storms on gas giants)
    const spots = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < spots; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 10 + Math.random() * 30;
      
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Wispy clouds (for terrestrial planets) - optimized with larger steps
    const step = width < 128 ? 4 : 2;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const noise = perlinNoise(x / width, y / height, 8, 2); // Reduced octaves
        if (noise > (1 - density)) {
          ctx.globalAlpha = (noise - (1 - density)) / density * 0.5;
          ctx.fillRect(x, y, step, step);
        }
      }
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// Draw atmospheric bands (for gas giants)
function drawAtmosphericBands(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: PlanetColors,
  turbulence: number
): void {
  const bands = 6 + Math.floor(Math.random() * 6);
  
  for (let i = 0; i < bands; i++) {
    const y = (i / bands) * height;
    const bandHeight = height / bands;
    const variation = Math.random() * 0.2 + 0.8;

    // Create gradient for this band
    const gradient = ctx.createLinearGradient(0, y, 0, y + bandHeight);
    gradient.addColorStop(0, i % 2 === 0 ? colors.secondary : colors.accent);
    gradient.addColorStop(0.5, colors.base);
    gradient.addColorStop(1, i % 2 === 0 ? colors.accent : colors.secondary);

    ctx.fillStyle = gradient;
    ctx.globalAlpha = variation;
    
    // Draw wavy band with turbulence
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    for (let x = 0; x <= width; x += 5) {
      const wave1 = Math.sin(x / width * Math.PI * 6 + i) * turbulence * 8;
      const wave2 = Math.sin(x / width * Math.PI * 3 + i * 2) * turbulence * 4;
      const waveY = y + wave1 + wave2;
      ctx.lineTo(x, waveY);
    }
    
    ctx.lineTo(width, y + bandHeight);
    ctx.lineTo(0, y + bandHeight);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

// Draw surface features for rocky planets (optimized)
function drawRockySurface(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: PlanetColors,
  hasWater: boolean
): void {
  // Reduce feature count for small textures
  const scale = width < 128 ? 0.5 : 1;
  
  if (hasWater) {
    // Draw water bodies
    const waterAreas = Math.floor((3 + Math.floor(Math.random() * 4)) * scale);
    ctx.fillStyle = colors.accent;
    
    for (let i = 0; i < waterAreas; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const w = (20 + Math.random() * 60) * scale;
      const h = (20 + Math.random() * 60) * scale;
      
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x - w/2, y - h/2, w, h);
    }
  }
  
  // Draw landmasses / terrain variation
  const regions = Math.floor((8 + Math.floor(Math.random() * 8)) * scale);
  for (let i = 0; i < regions; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = (15 + Math.random() * 40) * scale;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, colors.secondary);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
  }

  ctx.globalAlpha = 1;
}

// Generate texture resolution based on radius
function getTextureResolution(radius?: number): number {
  if (!radius) return 256;
  
  // Larger planets get higher resolution textures (but capped for performance)
  if (radius > 10) return 512;
  if (radius > 5) return 256;
  if (radius > 2) return 128;
  return 64;
}

/**
 * Generate a scientifically accurate procedural texture for an exoplanet
 * @param exoplanet - The exoplanet data
 * @param resolution - Optional resolution override (will be calculated based on radius if not provided)
 * @returns THREE.Texture
 */
export function generatePlanetTexture(
  exoplanet: Exoplanet,
  resolution?: number
): THREE.Texture {
  // Create cache key based on planet ID and resolution
  const planetId = exoplanet._id || exoplanet.name;
  const size = resolution || getTextureResolution(exoplanet.radius);
  const cacheKey = `${planetId}_${size}`;
  
  // Return cached texture if available
  const cached = textureCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  // Classify planet type based on scientific criteria
  const planetType = classifyPlanet(exoplanet);
  const colors = getScientificColors(exoplanet, planetType);
  const temp = exoplanet.temp_calculated || exoplanet.temp_measured || 300;
  const mass = exoplanet.mass || 1;

  // Base layer - solid color
  ctx.fillStyle = colors.base;
  ctx.fillRect(0, 0, size, size);

  // Generate features based on planet type
  switch (planetType) {
    case PlanetType.HOT_JUPITER:
      // Hot Jupiters: Strong atmospheric bands with high turbulence
      drawAtmosphericBands(ctx, size, size, colors, 1.5);
      drawClouds(ctx, size, size, colors, 0.4, 'spots'); // Add storm spots
      addDetailLayer(ctx, size, size, 0.3);
      generateNoise(ctx, size, size, 1, 25); // More noise for turbulence
      break;

    case PlanetType.WARM_NEPTUNE:
      // Warm Neptunes: Moderate banding, some clouds
      drawAtmosphericBands(ctx, size, size, colors, 1.0);
      drawClouds(ctx, size, size, colors, 0.3, 'bands');
      addDetailLayer(ctx, size, size, 0.25);
      generateNoise(ctx, size, size, 1, 20);
      break;

    case PlanetType.ICE_GIANT:
      // Ice Giants: Subtle banding, smooth appearance (like Neptune/Uranus)
      drawAtmosphericBands(ctx, size, size, colors, 0.5);
      if (Math.random() > 0.7) {
        // Occasional spots (like Neptune's Great Dark Spot)
        drawClouds(ctx, size, size, colors, 0.2, 'spots');
      }
      addDetailLayer(ctx, size, size, 0.2);
      generateNoise(ctx, size, size, 1, 15);
      break;

    case PlanetType.MINI_NEPTUNE:
      // Mini-Neptunes: Light banding or uniform with clouds
      if (Math.random() > 0.5) {
        drawAtmosphericBands(ctx, size, size, colors, 0.7);
      }
      drawClouds(ctx, size, size, colors, 0.4, 'wisps');
      addDetailLayer(ctx, size, size, 0.25);
      generateNoise(ctx, size, size, 1, 18);
      break;

    case PlanetType.SUPER_EARTH:
      // Super-Earths: Surface features depend on temperature
      if (temp > 700) {
        // Lava world: Flowing patterns
        drawAtmosphericBands(ctx, size, size, colors, 0.8); // Lava flows
        addDetailLayer(ctx, size, size, 0.4);
        generateNoise(ctx, size, size, 1, 30); // Very rough surface
      } else if (temp > 250 && temp < 400) {
        // Potentially habitable: Water and continents
        const hasWater = Math.random() > 0.3;
        drawRockySurface(ctx, size, size, colors, hasWater);
        if (hasWater) {
          drawClouds(ctx, size, size, colors, 0.3, 'wisps'); // Weather systems
        }
        addDetailLayer(ctx, size, size, 0.3);
        generateNoise(ctx, size, size, 1, 20);
      } else {
        // Desert or frozen: Terrain features
        drawRockySurface(ctx, size, size, colors, false);
        addDetailLayer(ctx, size, size, 0.3);
        generateNoise(ctx, size, size, 1, 22);
      }
      break;

    case PlanetType.TERRESTRIAL:
      // Terrestrial: Rocky surface, possibly with water/clouds
      if (temp > 600) {
        // Venus-like: Thick clouds
        drawClouds(ctx, size, size, colors, 0.8, 'wisps');
        addDetailLayer(ctx, size, size, 0.25);
        generateNoise(ctx, size, size, 1, 18);
      } else if (temp > 200 && temp < 350) {
        // Earth-like: Water, continents, clouds
        const hasWater = Math.random() > 0.4;
        drawRockySurface(ctx, size, size, colors, hasWater);
        drawClouds(ctx, size, size, colors, 0.25, 'wisps');
        addDetailLayer(ctx, size, size, 0.3);
        generateNoise(ctx, size, size, 1, 20);
      } else if (temp > 150) {
        // Mars-like: Desert with some features
        drawRockySurface(ctx, size, size, colors, false);
        addDetailLayer(ctx, size, size, 0.35);
        generateNoise(ctx, size, size, 1, 25);
      } else {
        // Frozen: Icy surface
        drawRockySurface(ctx, size, size, colors, false);
        addDetailLayer(ctx, size, size, 0.2);
        generateNoise(ctx, size, size, 1, 15);
      }
      break;
  }

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Cache the texture for reuse
  textureCache.set(cacheKey, texture);
  
  // Log texture generation for debugging
  console.log(`Generated texture for ${planetId} (${size}x${size})`);

  return texture;
}

/**
 * Generate a simple placeholder texture (for distant planets)
 * Uses scientifically accurate colors but minimal detail
 */
export function generateSimpleTexture(exoplanet: Exoplanet): THREE.Texture {
  // Create cache key based on planet ID
  const planetId = exoplanet._id || exoplanet.name;
  const cacheKey = `${planetId}_simple`;
  
  // Return cached texture if available
  const cached = simpleTextureCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  const planetType = classifyPlanet(exoplanet);
  const colors = getScientificColors(exoplanet, planetType);

  // Simple solid color with slight gradient
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, colors.base);
  gradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;

  // Cache the simple texture for reuse
  simpleTextureCache.set(cacheKey, texture);

  return texture;
}

/**
 * Clear texture caches (useful for cleanup)
 */
export function clearTextureCache(): void {
  textureCache.forEach(texture => texture.dispose());
  textureCache.clear();
  simpleTextureCache.forEach(texture => texture.dispose());
  simpleTextureCache.clear();
  noiseCache.clear();
  console.log('Texture cache cleared');
}

/**
 * Get cache statistics
 */
export function getTextureCacheStats(): { high: number; low: number; noise: number } {
  return {
    high: textureCache.size,
    low: simpleTextureCache.size,
    noise: noiseCache.size,
  };
}

