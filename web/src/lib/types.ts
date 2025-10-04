// Type definitions for exoplanet data

export interface Exoplanet {
  _id?: string;
  name: string;
  mass?: number;
  radius?: number;
  discovered?: number;
  temp_calculated?: number;
  temp_measured?: number;
  star_name?: string;
  star_distance?: number;
  star_mass?: number;
  star_radius?: number;
  star_age?: number;
  // Pre-generated texture URLs (stored in database or cloud storage)
  texture_high_url?: string;  // High-resolution texture (512x512 or 256x256)
  texture_low_url?: string;   // Low-resolution texture (64x64 or 32x32)
}

export interface ExoplanetSearchParams {
  name?: string;
  minDistance?: number;
  maxDistance?: number;
  minMass?: number;
  maxMass?: number;
  minRadius?: number;
  maxRadius?: number;
  discoveredAfter?: number;
  discoveredBefore?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

