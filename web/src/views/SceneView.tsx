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
    setControlsEnabled(!focused);
  };

  return (
    <>
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

      <div className="fixed inset-0 pointer-events-none z-50">
        <Header exoplanetsCount={exoplanetsCount} />

        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 pointer-events-auto z-[10000] w-[40vw] max-w-[800px]">
          <SearchInput 
            onSelectPlanet={navigateToPlanet}
            onFocusChange={handleSearchFocusChange}
          />
        </div>

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

        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <GlassButton 
            variant="purple" 
            onClick={navigateToRandomPlanet}
            className="pointer-events-auto px-8 py-3 text-lg font-semibold"
          >
            🎲 I Feel Lucky
          </GlassButton>
        </div>

        <StatsCard exoplanetsCount={exoplanetsCount} distanceRange={distanceRange} />

        {selectedExoplanet && (
          <ExoplanetInfoDialog
            exoplanet={selectedExoplanet}
            onClose={clearSelection}
          />
        )}

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

      {showWelcomeModal && (
        <WelcomeModal onClose={() => setShowWelcomeModal(false)} />
      )}
    </>
  );
}

