'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Exoplanet } from '@/lib/types';
import { useFavorites } from '@/hooks/useFavorites';

interface AllPlanetsDialogProps {
  onClose: () => void;
  onSelectPlanet: (exoplanet: Exoplanet) => void;
  initialShowOnlyFavorites?: boolean;
}

export function AllPlanetsDialog({ onClose, onSelectPlanet, initialShowOnlyFavorites = false }: AllPlanetsDialogProps) {
  const [planets, setPlanets] = useState<Exoplanet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'discovered'>('name');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(initialShowOnlyFavorites);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const fetchPlanets = async () => {
      try {
        const response = await fetch('/api/exoplanets/all');
        if (!response.ok) {
          throw new Error('Failed to fetch planets');
        }
        const data = await response.json();
        setPlanets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanets();
  }, []);

  const handlePlanetClick = (planet: Exoplanet) => {
    onSelectPlanet(planet);
    onClose();
  };

  // Filter planets based on search term and favorites
  const filteredPlanets = planets.filter(planet => {
    const matchesSearch = planet.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFavorites = !showOnlyFavorites || isFavorite(planet._id);
    return matchesSearch && matchesFavorites;
  });

  // Sort planets
  const sortedPlanets = [...filteredPlanets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'distance':
        return (a.star_distance || 0) - (b.star_distance || 0);
      case 'discovered':
        return (b.discovered || 0) - (a.discovered || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <GlassCard className="relative w-[90vw] max-w-5xl h-[85vh] flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-3xl mb-2">
              {showOnlyFavorites ? 'Favorite Exoplanets' : 'All Exoplanets'}
            </h2>
            <p className="text-white/60 text-sm">
              {loading ? 'Loading...' : `${sortedPlanets.length} of ${planets.length} planets`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex gap-4 items-center mb-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search planets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'distance' | 'discovered')}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
            >
              <option value="name" className="bg-gray-900">Sort by Name</option>
              <option value="distance" className="bg-gray-900">Sort by Distance</option>
              <option value="discovered" className="bg-gray-900">Sort by Discovery Year</option>
            </select>
          </div>

          {/* Favorites Filter Toggle */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showOnlyFavorites
                ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300'
                : 'bg-white/5 border border-white/20 text-white/60 hover:text-white/80 hover:border-white/30'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={showOnlyFavorites ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <span className="text-sm font-medium">
              {showOnlyFavorites ? 'Show All' : 'Favorites Only'}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/60">Loading planets...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-400">Error: {error}</div>
            </div>
          )}

          {!loading && !error && sortedPlanets.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/60">No planets found</div>
            </div>
          )}

          {!loading && !error && sortedPlanets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPlanets.map((planet) => {
                const favorite = isFavorite(planet._id);
                return (
                  <div
                    key={planet._id || planet.name}
                    className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(planet._id);
                      }}
                      className={`absolute top-3 right-3 z-10 transition-all ${
                        favorite
                          ? 'text-yellow-400 hover:text-yellow-300 scale-110'
                          : 'text-white/40 hover:text-yellow-400 hover:scale-110'
                      }`}
                      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg
                        className="w-6 h-6"
                        fill={favorite ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>

                    {/* Planet Card Button */}
                    <button
                      onClick={() => handlePlanetClick(planet)}
                      className="w-full p-4 text-left"
                    >
                      {/* Planet Name */}
                      <h3 className="text-white font-semibold text-lg mb-2 truncate group-hover:text-blue-300 transition-colors pr-8">
                        {planet.name}
                      </h3>

                      {/* Planet Info */}
                      <div className="space-y-1 text-sm text-white/60">
                        {planet.star_distance !== undefined && planet.star_distance !== null && (
                          <div className="flex justify-between">
                            <span>Distance:</span>
                            <span className="font-mono text-white/80">
                              {planet.star_distance.toFixed(2)} ly
                            </span>
                          </div>
                        )}
                        {planet.radius !== undefined && planet.radius !== null && (
                          <div className="flex justify-between">
                            <span>Radius:</span>
                            <span className="font-mono text-white/80">
                              {planet.radius.toFixed(2)} R⊕
                            </span>
                          </div>
                        )}
                        {planet.mass !== undefined && planet.mass !== null && (
                          <div className="flex justify-between">
                            <span>Mass:</span>
                            <span className="font-mono text-white/80">
                              {planet.mass.toFixed(2)} M⊕
                            </span>
                          </div>
                        )}
                        {planet.discovered !== undefined && planet.discovered !== null && (
                          <div className="flex justify-between">
                            <span>Discovered:</span>
                            <span className="font-mono text-white/80">
                              {planet.discovered}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Hover indicator */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 pointer-events-none" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

