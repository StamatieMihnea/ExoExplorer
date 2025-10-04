'use client';

import { ActionButtons } from '@/components/layout/ActionButtons';
import { ExoplanetInfoDialog } from '@/components/layout/ExoplanetInfoDialog';
import { Header } from '@/components/layout/Header';
import { InfoPanel } from '@/components/layout/InfoPanel';
import { StatsCard } from '@/components/layout/StatsCard';
import { useThreeScene } from '@/hooks/useThreeScene';

export function SceneView() {
  const { containerRef, returnToEarth, selectedExoplanet, clearSelection } = useThreeScene();

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
        <Header />

        {/* Bottom Info Panel and Action Buttons */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <InfoPanel />
          <ActionButtons onReturnToEarth={returnToEarth} />
        </div>

        {/* Floating Stats Card */}
        <StatsCard />

        {/* Exoplanet Info Dialog */}
        {selectedExoplanet && (
          <ExoplanetInfoDialog
            exoplanet={selectedExoplanet}
            onClose={clearSelection}
          />
        )}
      </div>
    </>
  );
}

