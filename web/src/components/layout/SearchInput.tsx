'use client';

import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Exoplanet } from '@/lib/types';
import { useFavorites } from '@/hooks/useFavorites';

interface SearchInputProps {
  onSelectPlanet: (exoplanet: Exoplanet) => void;
  onFocusChange?: (focused: boolean) => void;
}

export function SearchInput({ onSelectPlanet, onFocusChange }: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allPlanets, setAllPlanets] = useState<Exoplanet[]>([]);
  const [filteredPlanets, setFilteredPlanets] = useState<Exoplanet[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  const { isFavorite } = useFavorites();

  // Fetch all planets on mount
  useEffect(() => {
    const fetchPlanets = async () => {
      try {
        const response = await fetch('/api/exoplanets/all');
        if (response.ok) {
          const planets = await response.json();
          setAllPlanets(planets);
        }
      } catch (error) {
        console.error('Error fetching planets:', error);
      }
    };

    fetchPlanets();
  }, []);

  // Filter planets based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPlanets([]);
      setIsOpen(false);
      return;
    }

    const filtered = allPlanets
      .filter(planet =>
        planet.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 50); // Limit to 50 results

    setFilteredPlanets(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, allPlanets]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No need for global key blocking - disabling FlyControls is sufficient

  // Scroll selected item into view when navigating with keyboard
  useEffect(() => {
    if (selectedIndex >= 0 && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  const handleSelectPlanet = (planet: Exoplanet) => {
    setSearchTerm(planet.name);
    setIsOpen(false);
    onSelectPlanet(planet);
    // Blur the input to re-enable camera controls
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle special keys for dropdown navigation
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); // Prevent cursor movement in input
        setSelectedIndex(prev =>
          prev < filteredPlanets.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault(); // Prevent cursor movement in input
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredPlanets.length) {
          handleSelectPlanet(filteredPlanets[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(false);
  };

  return (
    <div className="relative w-full max-w-md pointer-events-auto">
      <GlassCard className="px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Search Icon */}
          <svg
            className="w-5 h-5 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search exoplanets..."
            className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
          />

          {/* Clear button */}
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </GlassCard>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full z-50"
          onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
        >
          <GlassCard className="overflow-hidden">
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredPlanets.map((planet, index) => {
                const favorite = isFavorite(planet._id);
                return (
                  <button
                    key={planet._id || planet.name}
                    ref={index === selectedIndex ? selectedItemRef : null}
                    onClick={() => handleSelectPlanet(planet)}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      index === selectedIndex
                        ? 'bg-white/20'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-white flex-1">{planet.name}</div>
                      {favorite && (
                        <svg
                          className="w-4 h-4 text-yellow-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {planet.star_name && `Star: ${planet.star_name}`}
                      {planet.star_distance && 
                        ` • ${planet.star_distance.toFixed(1)} ly away`}
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

