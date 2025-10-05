'use client';

import { useState, useEffect } from 'react';
import type { Exoplanet } from '@/lib/types';

const FAVORITES_STORAGE_KEY = 'exoplanet-favorites';

/**
 * Hook for managing favorite exoplanets in localStorage
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
      setIsLoaded(true);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Failed to save favorites to localStorage:', error);
      }
    }
  }, [favorites, isLoaded]);

  /**
   * Check if an exoplanet is favorited
   */
  const isFavorite = (exoplanetId: string | undefined): boolean => {
    if (!exoplanetId) return false;
    return favorites.includes(exoplanetId);
  };

  /**
   * Toggle favorite status of an exoplanet
   */
  const toggleFavorite = (exoplanetId: string | undefined): void => {
    if (!exoplanetId) return;

    setFavorites((prev) => {
      if (prev.includes(exoplanetId)) {
        // Remove from favorites
        return prev.filter((id) => id !== exoplanetId);
      } else {
        // Add to favorites
        return [...prev, exoplanetId];
      }
    });
  };

  /**
   * Add an exoplanet to favorites
   */
  const addFavorite = (exoplanetId: string | undefined): void => {
    if (!exoplanetId || favorites.includes(exoplanetId)) return;
    setFavorites((prev) => [...prev, exoplanetId]);
  };

  /**
   * Remove an exoplanet from favorites
   */
  const removeFavorite = (exoplanetId: string | undefined): void => {
    if (!exoplanetId) return;
    setFavorites((prev) => prev.filter((id) => id !== exoplanetId));
  };

  /**
   * Clear all favorites
   */
  const clearFavorites = (): void => {
    setFavorites([]);
  };

  /**
   * Filter an array of exoplanets to only include favorites
   */
  const filterFavorites = (exoplanets: Exoplanet[]): Exoplanet[] => {
    return exoplanets.filter((planet) => isFavorite(planet._id));
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    filterFavorites,
    isLoaded,
  };
}

