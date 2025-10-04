'use client';

import { useState } from 'react';
import { ActionButtons } from '@/components/layout/ActionButtons';
import { AllPlanetsDialog } from '@/components/layout/AllPlanetsDialog';
import { FavoritesDialog } from '@/components/layout/FavoritesDialog';
import { ExoplanetInfoDialog } from '@/components/layout/ExoplanetInfoDialog';
import { Header } from '@/components/layout/Header';
import { InfoPanel } from '@/components/layout/InfoPanel';
import { StatsCard } from '@/components/layout/StatsCard';
import { SearchInput } from '@/components/layout/SearchInput';
import { useThreeScene } from '@/hooks/useThreeScene';

export function SceneView() {
  const { 
    containerRef, 
    returnToEarth, 
    selectedExoplanet, 
    clearSelection, 
    exoplanetsCount, 
    distanceRange,
    navigateToPlanet,
    setControlsEnabled 
  } = useThreeScene();

  const [showAllPlanets, setShowAllPlanets] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const handleSearchFocusChange = (focused: boolean) => {
    // Disable controls when search is focused, enable when blurred
    setControlsEnabled(!focused);
  };

  return (
    <>
      {/* 3D Scene Container */}
      <div
        ref={containerRef}
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
        }}
      />

      {/* UI Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Top Header */}
        <Header exoplanetsCount={exoplanetsCount} />

        {/* Search Input at Top Middle */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
          <SearchInput 
            onSelectPlanet={navigateToPlanet}
            onFocusChange={handleSearchFocusChange}
          />
        </div>

        {/* Bottom Info Panel and Action Buttons */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <InfoPanel />
          <ActionButtons 
            onReturnToEarth={returnToEarth}
            onViewAll={() => setShowAllPlanets(true)}
            onViewFavorites={() => setShowFavorites(true)}
          />
        </div>

        {/* Floating Stats Card */}
        <StatsCard exoplanetsCount={exoplanetsCount} distanceRange={distanceRange} />

        {/* Exoplanet Info Dialog */}
        {selectedExoplanet && (
          <ExoplanetInfoDialog
            exoplanet={selectedExoplanet}
            onClose={clearSelection}
          />
        )}

        {/* All Planets Dialog */}
        {showAllPlanets && (
          <AllPlanetsDialog
            onClose={() => setShowAllPlanets(false)}
            onSelectPlanet={navigateToPlanet}
          />
        )}

        {/* Favorites Dialog */}
        {showFavorites && (
          <FavoritesDialog
            onClose={() => setShowFavorites(false)}
            onSelectPlanet={navigateToPlanet}
          />
        )}
      </div>
    </>
  );
}

