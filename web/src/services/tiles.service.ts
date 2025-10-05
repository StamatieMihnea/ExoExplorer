import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { TilesRenderer } from '3d-tiles-renderer';
import {
  CesiumIonAuthPlugin,
  GLTFExtensionsPlugin,
  UpdateOnChangePlugin
} from '3d-tiles-renderer/plugins';
import { TILES_CONFIG, DRACO_DECODER_PATH } from '@/constants/scene.constants';
import { fixTextures } from '@/utils/texture.utils';
import type { TilesConfig } from '@/types/scene.types';

export class TilesService {
  private config: TilesConfig;
  private tiles: TilesRenderer | null = null;
  private dracoLoader: DRACOLoader | null = null;

  constructor(config: TilesConfig = TILES_CONFIG) {
    this.config = config;
  }

  createTiles(camera: THREE.PerspectiveCamera, maxAnisotropy: number): TilesRenderer {
    // Setup DRACO loader
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    this.dracoLoader.setDecoderConfig({ type: 'js' });

    // Create tiles renderer
    this.tiles = new TilesRenderer();
    
    // Register plugins
    this.tiles.registerPlugin(new CesiumIonAuthPlugin({
      apiToken: this.config.apiToken,
      assetId: this.config.assetId,
      autoRefreshToken: true
    }));
    this.tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader: this.dracoLoader }));
    this.tiles.registerPlugin(new UpdateOnChangePlugin());

    // Configure tiles
    this.tiles.setCamera(camera);
    this.tiles.errorTarget = this.config.errorTarget;
    this.tiles.errorThreshold = this.config.errorThreshold;
    this.tiles.maxDepth = this.config.maxDepth;
    this.tiles.displayActiveTiles = true;

    // Rotate the globe so the north pole is up
    this.tiles.group.rotation.copy(this.config.rotation);

    // Setup texture fixing
    this.setupTextureFixing(maxAnisotropy);

    return this.tiles;
  }

  private setupTextureFixing(maxAnisotropy: number): void {
    if (!this.tiles) return;

    // Configure texture filtering for all loaded tiles
    this.tiles.addEventListener('load-tile-set', () => {
      if (this.tiles?.group) {
        this.tiles.group.traverse(obj => fixTextures(obj, maxAnisotropy));
      }
    });

    // Also apply filtering to individual models as they load
    this.tiles.addEventListener('load-model', (event: any) => {
      if (event?.scene) {
        event.scene.traverse((obj: any) => fixTextures(obj, maxAnisotropy));
      }
    });
  }

  update(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
    if (this.tiles) {
      this.tiles.update();
      this.tiles.setResolutionFromRenderer(camera, renderer);
    }
  }

  rotateTiles(speed: number): void {
    if (this.tiles) {
      this.tiles.group.rotation.z += speed;
    }
  }

  getTilesGroup(): THREE.Group | null {
    return this.tiles ? this.tiles.group : null;
  }

  dispose(): void {
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
      this.dracoLoader = null;
    }
    this.tiles = null;
  }
}

