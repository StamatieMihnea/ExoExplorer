import { useState, useEffect } from 'react';
import type { Exoplanet } from '@/lib/types';

const FAVORITES_STORAGE_KEY = 'exoplanet-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(new Set(Array.isArray(parsed) ? parsed : []));
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(Array.from(favorites))
        );
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    }
  }, [favorites, isLoaded]);

  const addFavorite = (planetId: string) => {
    setFavorites((prev) => new Set([...prev, planetId]));
  };

  const removeFavorite = (planetId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(planetId);
      return next;
    });
  };

  const toggleFavorite = (planetId: string) => {
    if (favorites.has(planetId)) {
      removeFavorite(planetId);
    } else {
      addFavorite(planetId);
    }
  };

  const isFavorite = (planetId: string) => {
    return favorites.has(planetId);
  };

  const getFavoriteIds = () => {
    return Array.from(favorites);
  };

  const clearAllFavorites = () => {
    setFavorites(new Set());
  };

  return {
    favorites: getFavoriteIds(),
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    favoritesCount: favorites.size,
    isLoaded,
  };
}

// Helper function to get planet identifier
export function getPlanetId(planet: Exoplanet): string {
  return planet._id || planet.name;
}

