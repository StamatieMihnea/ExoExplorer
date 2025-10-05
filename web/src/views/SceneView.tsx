'use client';

import { useState } from 'react';
import { ActionButtons } from '@/components/layout/ActionButtons';
import { AllPlanetsDialog } from '@/components/layout/AllPlanetsDialog';
import { ExoplanetInfoDialog } from '@/components/layout/ExoplanetInfoDialog';
import { Header } from '@/components/layout/Header';
import { InfoPanel } from '@/components/layout/InfoPanel';
import { StatsCard } from '@/components/layout/StatsCard';
import { SearchInput } from '@/components/layout/SearchInput';
import { WelcomeModal } from '@/components/layout/WelcomeModal';
import { GlassButton } from '@/components/ui/GlassButton';
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
    setControlsEnabled,
    navigateToRandomPlanet
  } = useThreeScene();

  const [showAllPlanets, setShowAllPlanets] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

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
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 pointer-events-auto z-[10000] w-[40vw] max-w-[800px]">
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
            onViewAll={() => {
              setShowFavoritesOnly(false);
              setShowAllPlanets(true);
            }}
            onViewFavorites={() => {
              setShowFavoritesOnly(true);
              setShowAllPlanets(true);
            }}
          />
        </div>

        {/* I Feel Lucky Button - Bottom Middle */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <GlassButton 
            variant="purple" 
            onClick={navigateToRandomPlanet}
            className="pointer-events-auto px-8 py-3 text-lg font-semibold"
          >
            🎲 I Feel Lucky
          </GlassButton>
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
            onClose={() => {
              setShowAllPlanets(false);
              setShowFavoritesOnly(false);
            }}
            onSelectPlanet={navigateToPlanet}
            initialShowOnlyFavorites={showFavoritesOnly}
          />
        )}
      </div>

      {/* Welcome Modal - Outside pointer-events-none container */}
      {showWelcomeModal && (
        <WelcomeModal onClose={() => setShowWelcomeModal(false)} />
      )}
    </>
  );
}

