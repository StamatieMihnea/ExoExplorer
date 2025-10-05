'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Stop loading after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // Close modal if clicking on backdrop (not the card) and not loading
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <GlassCard className="max-w-2xl w-full p-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🪐</div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 mb-2">
            Welcome to Exo Explorer
          </h1>
          <p className="text-purple-300/80 text-lg">
            Your Gateway to the Universe of Exoplanets
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8 text-white/90">
          <p className="text-center leading-relaxed">
            Embark on an immersive journey through space and discover thousands of confirmed exoplanets. 
            Navigate through the cosmos, explore planetary systems, and unlock the mysteries of distant worlds.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="text-2xl">🔍</span>
              <div>
                <h3 className="font-semibold text-purple-300 mb-1">Smart Search</h3>
                <p className="text-sm text-white/70">
                  Use natural language to find planets by any criteria
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="text-2xl">🌍</span>
              <div>
                <h3 className="font-semibold text-purple-300 mb-1">Interactive 3D</h3>
                <p className="text-sm text-white/70">
                  Fly through space and explore in real-time 3D
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="text-2xl">⭐</span>
              <div>
                <h3 className="font-semibold text-purple-300 mb-1">Save Favorites</h3>
                <p className="text-sm text-white/70">
                  Bookmark your favorite exoplanets for quick access
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="text-2xl">🎲</span>
              <div>
                <h3 className="font-semibold text-purple-300 mb-1">Random Discovery</h3>
                <p className="text-sm text-white/70">
                  Feel lucky? Jump to a random exoplanet instantly
                </p>
              </div>
            </div>
          </div>

          {/* Controls Info */}
          <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <h3 className="font-semibold text-purple-300 mb-2 text-center">🎮 Navigation Controls</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
              <div><strong>W/S:</strong> Move Forward/Backward</div>
              <div><strong>A/D:</strong> Move Left/Right</div>
              <div><strong>Q/E:</strong> Roll Camera</div>
              <div><strong>R/F:</strong> Move Up/Down</div>
              <div><strong>Mouse:</strong> Look Around</div>
              <div><strong>Click:</strong> Select Planet</div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center">
          <GlassButton 
            onClick={onClose}
            variant="purple"
            className={`px-12 py-4 text-xl font-bold ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <span className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                Loading Explorer...
              </span>
            ) : (
              '🚀 Start Exploring'
            )}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}

