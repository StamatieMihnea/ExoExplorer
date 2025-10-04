import * as THREE from 'three';
import type { Exoplanet } from '@/lib/types';
import { generatePlanetTexture, generateSimpleTexture } from '@/utils/planet-texture-generator';

// Texture loader for loading pre-generated textures from URLs
const textureLoader = new THREE.TextureLoader();

/**
 * Manages texture loading/unloading based on distance from camera
 * This ensures we only have high-quality textures loaded for nearby planets
 */

export interface TextureEntry {
  texture: THREE.Texture;
  resolution: 'high' | 'low' | 'none';
  lastUsed: number;
}

export class TextureManager {
  private textureCache: Map<string, TextureEntry> = new Map();
  private lastTextureUpdate: Map<string, number> = new Map();
  private visiblePlanetIds: Set<string> = new Set(); // Track currently visible planets
  
  // Dynamic distance thresholds (in scene units) - now adaptive
  private HIGH_RES_DISTANCE_BASE = 200000000; // Base: 24 light years
  private LOW_RES_DISTANCE_BASE = 400000000;  // Base: 32 light years
  private currentHighResDistance = 200000000; // Current (dynamic)
  private currentLowResDistance = 400000000;  // Current (dynamic)
  
  // Memory management
  private readonly MAX_HIGH_RES_TEXTURES = 200; // Increased for dynamic system
  private readonly MAX_LOW_RES_TEXTURES = 400; // Increased for dynamic system
  private readonly CLEANUP_INTERVAL = 5000; // Cleanup every 5 seconds
  private readonly TEXTURE_UPDATE_DELAY = 500; // Don't update same texture more often than 500ms
  private readonly UNLOAD_INVISIBLE_AFTER = 3000; // Unload textures after 3s of being invisible
  
  private lastCleanupTime = 0;
  private highResCount = 0;
  private lowResCount = 0;

  /**
   * Update which planets are currently visible
   * This allows us to prioritize visible planets for high-res textures
   */
  updateVisiblePlanets(visiblePlanetIds: string[]): void {
    this.visiblePlanetIds = new Set(visiblePlanetIds);
  }

  /**
   * Dynamically adjust texture distance thresholds based on visible planet count
   * More visible planets = stricter thresholds to maintain performance
   * Fewer visible planets = more generous thresholds for better quality
   */
  adjustThresholdsBasedOnLoad(visibleCount: number): void {
    // Adjust based on how many planets are visible
    if (visibleCount > 150) {
      // Many visible planets - be more conservative
      this.currentHighResDistance = this.HIGH_RES_DISTANCE_BASE * 0.5;
      this.currentLowResDistance = this.LOW_RES_DISTANCE_BASE * 0.6;
    } else if (visibleCount > 100) {
      // Moderate number - slightly conservative
      this.currentHighResDistance = this.HIGH_RES_DISTANCE_BASE * 0.75;
      this.currentLowResDistance = this.LOW_RES_DISTANCE_BASE * 0.8;
    } else if (visibleCount > 50) {
      // Normal - use base thresholds
      this.currentHighResDistance = this.HIGH_RES_DISTANCE_BASE;
      this.currentLowResDistance = this.LOW_RES_DISTANCE_BASE;
    } else {
      // Few visible planets - be more generous with quality
      this.currentHighResDistance = this.HIGH_RES_DISTANCE_BASE * 1.5;
      this.currentLowResDistance = this.LOW_RES_DISTANCE_BASE * 1.5;
    }
  }

  /**
   * Unload textures for planets that are no longer visible
   * This frees up memory for visible planets
   */
  unloadInvisibleTextures(): number {
    const now = Date.now();
    const toRemove: string[] = [];
    let unloadedCount = 0;

    for (const [planetId, entry] of this.textureCache.entries()) {
      const isVisible = this.visiblePlanetIds.has(planetId);
      
      // If not visible and hasn't been used recently, unload it
      if (!isVisible && (now - entry.lastUsed > this.UNLOAD_INVISIBLE_AFTER)) {
        toRemove.push(planetId);
        
        // Update counters
        if (entry.resolution === 'high') {
          this.highResCount--;
        } else if (entry.resolution === 'low') {
          this.lowResCount--;
        }
      }
    }

    // Remove the textures
    for (const planetId of toRemove) {
      this.textureCache.delete(planetId);
      this.lastTextureUpdate.delete(planetId);
      unloadedCount++;
    }

    if (unloadedCount > 0) {
      console.log(`🗑️ Unloaded ${unloadedCount} textures for invisible planets (high: ${this.highResCount}, low: ${this.lowResCount})`);
    }

    return unloadedCount;
  }

  /**
   * Load texture from URL (pre-generated on backend)
   * @param url - Texture URL
   * @param planetId - Planet ID for caching
   * @param resolution - Resolution type
   * @returns Promise resolving to texture or null
   */
  private loadTextureFromURL(
    url: string, 
    planetId: string, 
    resolution: 'high' | 'low'
  ): Promise<THREE.Texture | null> {
    return new Promise((resolve) => {
      textureLoader.load(
        url,
        (texture) => {
          // Configure texture
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          
          console.log(`Loaded ${resolution}-res texture from URL for ${planetId}`);
          resolve(texture);
        },
        undefined,
        (error) => {
          console.warn(`Failed to load texture from ${url}:`, error);
          resolve(null);
        }
      );
    });
  }

  /**
   * Get or create texture for an exoplanet based on distance from camera
   * Tries to load pre-generated textures from URLs first, falls back to generation
   * @param exoplanet - The exoplanet data
   * @param distance - Distance from camera
   * @returns Texture or null if too far
   */
  getTexture(exoplanet: Exoplanet, distance: number): THREE.Texture | null {
    const planetId = exoplanet._id || exoplanet.name;
    const now = Date.now();

    // Determine required resolution based on DYNAMIC distance thresholds
    let requiredResolution: 'high' | 'low' | 'none';
    if (distance < this.currentHighResDistance) {
      requiredResolution = 'high';
    } else if (distance < this.currentLowResDistance) {
      requiredResolution = 'low';
    } else {
      requiredResolution = 'none';
    }

    // Check cache
    const cached = this.textureCache.get(planetId);
    
    if (cached) {
      // Update last used time
      cached.lastUsed = now;

      // If cached resolution matches or exceeds requirement, use it
      if (
        (requiredResolution === 'none') ||
        (requiredResolution === 'low' && (cached.resolution === 'low' || cached.resolution === 'high')) ||
        (requiredResolution === 'high' && cached.resolution === 'high')
      ) {
        return cached.texture;
      }

      // Need to upgrade resolution - but check if we updated recently to avoid thrashing
      const lastUpdate = this.lastTextureUpdate.get(planetId) || 0;
      if (now - lastUpdate < this.TEXTURE_UPDATE_DELAY) {
        return cached.texture; // Use existing texture, too soon to update
      }

      // Need to upgrade resolution
      if (requiredResolution === 'high' && cached.resolution === 'low') {
        // Note: generatePlanetTexture now has internal caching, so this is efficient
        // Generate high-res texture
        if (this.highResCount < this.MAX_HIGH_RES_TEXTURES) {
          const texture = generatePlanetTexture(exoplanet);
          // Don't dispose cached.texture yet, it might be shared or cached
          cached.texture = texture;
          cached.resolution = 'high';
          cached.lastUsed = now;
          this.lastTextureUpdate.set(planetId, now);
          this.lowResCount--;
          this.highResCount++;
          return texture;
        } else {
          // Hit limit, keep low-res
          return cached.texture;
        }
      }
    }

    // Not in cache, need to create
    if (requiredResolution === 'none') {
      return null;
    }

    let texture: THREE.Texture;
    
    if (requiredResolution === 'high' && this.highResCount < this.MAX_HIGH_RES_TEXTURES) {
      // Note: generatePlanetTexture now has internal caching
      texture = generatePlanetTexture(exoplanet);
      this.textureCache.set(planetId, {
        texture,
        resolution: 'high',
        lastUsed: now,
      });
      this.lastTextureUpdate.set(planetId, now);
      this.highResCount++;
    } else {
      // Use low-res (either requested or high-res limit reached)
      if (this.lowResCount < this.MAX_LOW_RES_TEXTURES) {
        // Note: generateSimpleTexture now has internal caching
        texture = generateSimpleTexture(exoplanet);
        this.textureCache.set(planetId, {
          texture,
          resolution: 'low',
          lastUsed: now,
        });
        this.lastTextureUpdate.set(planetId, now);
        this.lowResCount++;
      } else {
        // Both limits reached, cleanup old textures first
        this.cleanup(true);
        
        // Try again
        texture = generateSimpleTexture(exoplanet);
        this.textureCache.set(planetId, {
          texture,
          resolution: 'low',
          lastUsed: now,
        });
        this.lastTextureUpdate.set(planetId, now);
        this.lowResCount++;
      }
    }

    // Periodic cleanup
    if (now - this.lastCleanupTime > this.CLEANUP_INTERVAL) {
      this.cleanup(false);
      this.lastCleanupTime = now;
    }

    return texture;
  }

  /**
   * Async method to get or load texture for an exoplanet
   * Tries to load pre-generated textures from URLs first, falls back to generation
   * @param exoplanet - The exoplanet data
   * @param distance - Distance from camera
   * @returns Promise resolving to texture or null
   */
  async getTextureAsync(exoplanet: Exoplanet, distance: number): Promise<THREE.Texture | null> {
    const planetId = exoplanet._id || exoplanet.name;
    const now = Date.now();
    const isVisible = this.visiblePlanetIds.has(planetId);

    // Determine required resolution based on DYNAMIC distance thresholds
    // Visible planets get priority for high-res textures
    let requiredResolution: 'high' | 'low' | 'none';
    if (distance < this.currentHighResDistance) {
      requiredResolution = 'high';
    } else if (distance < this.currentLowResDistance) {
      requiredResolution = 'low';
    } else {
      requiredResolution = 'none';
    }

    // If not visible, downgrade quality to save resources
    if (!isVisible && requiredResolution === 'high') {
      requiredResolution = 'low';
    }

    if (requiredResolution === 'none') {
      return null;
    }

    // Debug logging for first few planets
    const distanceLY = (distance / 25000000).toFixed(1);
    const visMarker = isVisible ? '👁️' : '🚫';
    if (Math.random() < 0.01) { // Log 1% of requests to avoid spam
      console.log(`${visMarker} Texture: ${exoplanet.name} at ${distanceLY} LY → ${requiredResolution}-res (threshold: ${(this.currentHighResDistance / 25000000).toFixed(1)} LY) [${this.highResCount}/${this.MAX_HIGH_RES_TEXTURES}]`);
    }

    // Check cache first
    const cached = this.textureCache.get(planetId);
    if (cached) {
      cached.lastUsed = now;

      // If cached resolution matches or exceeds requirement, use it
      if (
        (requiredResolution === 'low' && (cached.resolution === 'low' || cached.resolution === 'high')) ||
        (requiredResolution === 'high' && cached.resolution === 'high')
      ) {
        return cached.texture;
      }

      // Check if we updated recently to avoid thrashing
      const lastUpdate = this.lastTextureUpdate.get(planetId) || 0;
      if (now - lastUpdate < this.TEXTURE_UPDATE_DELAY) {
        return cached.texture;
      }
    }

    // Try to load from URL if available
    if (requiredResolution === 'high' && exoplanet.texture_high_url) {
      if (this.highResCount < this.MAX_HIGH_RES_TEXTURES) {
        const texture = await this.loadTextureFromURL(
          exoplanet.texture_high_url,
          planetId,
          'high'
        );
        
        if (texture) {
          // Dispose old texture if upgrading
          if (cached && cached.resolution === 'low') {
            this.lowResCount--;
          }
          
          this.textureCache.set(planetId, {
            texture,
            resolution: 'high',
            lastUsed: now,
          });
          this.lastTextureUpdate.set(planetId, now);
          this.highResCount++;
          return texture;
        }
      } else {
        // Hit high-res limit, force cleanup to make room
        if (Math.random() < 0.05) { // Log occasionally
          console.warn(`High-res texture limit reached (${this.highResCount}/${this.MAX_HIGH_RES_TEXTURES}). Forcing cleanup...`);
        }
        this.cleanup(true); // Force aggressive cleanup
        
        // Try again after cleanup if we freed up space
        if (this.highResCount < this.MAX_HIGH_RES_TEXTURES) {
          const texture = await this.loadTextureFromURL(
            exoplanet.texture_high_url,
            planetId,
            'high'
          );
          
          if (texture) {
            if (cached && cached.resolution === 'low') {
              this.lowResCount--;
            }
            
            this.textureCache.set(planetId, {
              texture,
              resolution: 'high',
              lastUsed: now,
            });
            this.lastTextureUpdate.set(planetId, now);
            this.highResCount++;
            return texture;
          }
        }
      }
    } else if (requiredResolution === 'low' && exoplanet.texture_low_url) {
      if (this.lowResCount < this.MAX_LOW_RES_TEXTURES) {
        const texture = await this.loadTextureFromURL(
          exoplanet.texture_low_url,
          planetId,
          'low'
        );
        
        if (texture) {
          this.textureCache.set(planetId, {
            texture,
            resolution: 'low',
            lastUsed: now,
          });
          this.lastTextureUpdate.set(planetId, now);
          this.lowResCount++;
          return texture;
        }
      }
    }

    // Fallback to procedural generation if URL not available or failed
    return this.getTexture(exoplanet, distance);
  }

  /**
   * Update textures for all planets based on camera position (async version)
   * Returns map of planet ID to texture
   */
  async updateTexturesAsync(
    exoplanets: Array<{ position: THREE.Vector3; userData: { exoplanet: Exoplanet } }>,
    cameraPosition: THREE.Vector3
  ): Promise<Map<string, THREE.Texture | null>> {
    const textureMap = new Map<string, THREE.Texture | null>();

    // Calculate distances and sort by proximity
    const planetsWithDistance = exoplanets.map(planet => ({
      planet,
      distance: planet.position.distanceTo(cameraPosition),
    }));

    // Process planets in order of proximity
    planetsWithDistance.sort((a, b) => a.distance - b.distance);

    // Load textures in parallel (limit concurrency to avoid overwhelming the browser)
    const BATCH_SIZE = 10;
    for (let i = 0; i < planetsWithDistance.length; i += BATCH_SIZE) {
      const batch = planetsWithDistance.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async ({ planet, distance }) => {
        const exoplanet = planet.userData.exoplanet;
        const planetId = exoplanet._id || exoplanet.name;
        const texture = await this.getTextureAsync(exoplanet, distance);
        return { planetId, texture };
      });

      const results = await Promise.all(promises);
      results.forEach(({ planetId, texture }) => {
        textureMap.set(planetId, texture);
      });
    }

    return textureMap;
  }

  /**
   * Update textures for all planets based on camera position (sync version - for backward compatibility)
   * Returns map of planet ID to texture
   */
  updateTextures(
    exoplanets: Array<{ position: THREE.Vector3; userData: { exoplanet: Exoplanet } }>,
    cameraPosition: THREE.Vector3
  ): Map<string, THREE.Texture | null> {
    const textureMap = new Map<string, THREE.Texture | null>();

    // Calculate distances and sort by proximity
    const planetsWithDistance = exoplanets.map(planet => ({
      planet,
      distance: planet.position.distanceTo(cameraPosition),
    }));

    // Process planets in order of proximity
    planetsWithDistance.sort((a, b) => a.distance - b.distance);

    for (const { planet, distance } of planetsWithDistance) {
      const exoplanet = planet.userData.exoplanet;
      const planetId = exoplanet._id || exoplanet.name;
      const texture = this.getTexture(exoplanet, distance);
      textureMap.set(planetId, texture);
    }

    return textureMap;
  }

  /**
   * Cleanup old or unused textures
   * @param force - If true, aggressively cleanup to free memory
   */
  private cleanup(force: boolean): void {
    const now = Date.now();
    const maxAge = force ? 1000 : 30000; // 1s for forced, 30s for normal cleanup
    
    const toRemove: string[] = [];

    // Find old textures
    for (const [planetId, entry] of this.textureCache.entries()) {
      if (now - entry.lastUsed > maxAge) {
        toRemove.push(planetId);
      }
    }

    // If forced and still need more space, remove oldest
    if (force && toRemove.length === 0) {
      const entries = Array.from(this.textureCache.entries());
      entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      
      // Remove oldest 25%
      const removeCount = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < removeCount && i < entries.length; i++) {
        toRemove.push(entries[i][0]);
      }
    }

    // Remove textures
    for (const planetId of toRemove) {
      const entry = this.textureCache.get(planetId);
      if (entry) {
        // Note: Don't dispose textures here as they might be cached in the generator
        if (entry.resolution === 'high') {
          this.highResCount--;
        } else if (entry.resolution === 'low') {
          this.lowResCount--;
        }
        this.textureCache.delete(planetId);
        this.lastTextureUpdate.delete(planetId);
      }
    }

    if (toRemove.length > 0) {
      console.log(`Texture cleanup: removed ${toRemove.length} texture refs (high: ${this.highResCount}, low: ${this.lowResCount})`);
    }
  }

  /**
   * Clear all textures from cache
   */
  dispose(): void {
    // Note: Don't dispose textures as they're cached in the generator
    this.textureCache.clear();
    this.lastTextureUpdate.clear();
    this.highResCount = 0;
    this.lowResCount = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): { 
    totalTextures: number; 
    highResTextures: number; 
    lowResTextures: number;
    cacheSize: number;
  } {
    return {
      totalTextures: this.textureCache.size,
      highResTextures: this.highResCount,
      lowResTextures: this.lowResCount,
      cacheSize: this.textureCache.size,
    };
  }

  /**
   * Log detailed texture statistics (for debugging)
   */
  logDetailedStats(): void {
    const stats = this.getStats();
    const highPercent = (this.highResCount / this.MAX_HIGH_RES_TEXTURES * 100).toFixed(1);
    const lowPercent = (this.lowResCount / this.MAX_LOW_RES_TEXTURES * 100).toFixed(1);
    
    console.log('📊 Texture Manager Stats (Dynamic):');
    console.log(`  High-res: ${this.highResCount}/${this.MAX_HIGH_RES_TEXTURES} (${highPercent}%)`);
    console.log(`  Low-res: ${this.lowResCount}/${this.MAX_LOW_RES_TEXTURES} (${lowPercent}%)`);
    console.log(`  Total cached: ${stats.totalTextures}`);
    console.log(`  Visible planets tracked: ${this.visiblePlanetIds.size}`);
    console.log(`  Dynamic thresholds: High <${(this.currentHighResDistance / 25000000).toFixed(1)} LY (base: ${(this.HIGH_RES_DISTANCE_BASE / 25000000).toFixed(1)}), Low <${(this.currentLowResDistance / 25000000).toFixed(1)} LY`);
  }
}

