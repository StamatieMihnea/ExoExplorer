'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { useFavorites, getPlanetId } from '@/hooks/useFavorites';
import type { SelectedExoplanet } from '@/hooks/useThreeScene';

interface ExoplanetInfoDialogProps {
  exoplanet: SelectedExoplanet;
  onClose: () => void;
}

type TabType = 'about' | 'size' | 'distance' | 'mass';

export function ExoplanetInfoDialog({ exoplanet, onClose }: ExoplanetInfoDialogProps) {
  const data = exoplanet.exoplanet;
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const formatValue = (value: number | undefined, unit: string, decimals = 2) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(decimals)} ${unit}`;
  };

  // Determine which tabs should be available
  const availableTabs: TabType[] = ['about'];
  if (data.radius !== undefined && data.radius !== null) availableTabs.push('size');
  if (data.star_distance !== undefined && data.star_distance !== null) availableTabs.push('distance');
  if (data.mass !== undefined && data.mass !== null) availableTabs.push('mass');

  // Ensure active tab is available
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('about');
    }
  }, [activeTab, availableTabs]);

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <GlassCard className="px-6 py-6 w-[28rem] max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-white font-bold text-2xl truncate pr-2">{data.name || 'Unknown Exoplanet'}</h2>
          <div className="flex items-center gap-3 flex-shrink-0">
            <FavoriteButton
              isFavorite={isFavorite(getPlanetId(data))}
              onToggle={() => toggleFavorite(getPlanetId(data))}
              size="lg"
            />
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
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
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1">
          {activeTab === 'about' && <AboutTab exoplanet={data} position={exoplanet.position} formatValue={formatValue} />}
          {activeTab === 'size' && <SizeTab radius={data.radius!} planetName={data.name} />}
          {activeTab === 'distance' && <DistanceTab distance={data.star_distance!} planetName={data.name} />}
          {activeTab === 'mass' && <MassTab mass={data.mass!} planetName={data.name} />}
        </div>
      </GlassCard>
    </div>
  );
}

// About Tab Component
function AboutTab({ exoplanet, position, formatValue }: any) {
  return (
    <div className="space-y-4 text-white/80 text-sm">
      {/* Exoplanet Properties */}
      <div>
        <h3 className="font-semibold text-white mb-2">Exoplanet Properties</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-white/60">Mass:</span>
            <span className="font-mono">{formatValue(exoplanet.mass, 'M⊕')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Radius:</span>
            <span className="font-mono">{formatValue(exoplanet.radius, 'R⊕')}</span>
          </div>
          {exoplanet.temp_calculated !== undefined && (
            <div className="flex justify-between">
              <span className="text-white/60">Temperature (calc):</span>
              <span className="font-mono">{formatValue(exoplanet.temp_calculated, 'K', 0)}</span>
            </div>
          )}
          {exoplanet.temp_measured !== undefined && (
            <div className="flex justify-between">
              <span className="text-white/60">Temperature (measured):</span>
              <span className="font-mono">{formatValue(exoplanet.temp_measured, 'K', 0)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Host Star Properties */}
      {(exoplanet.star_name || exoplanet.star_distance !== undefined || exoplanet.star_mass !== undefined || exoplanet.star_radius !== undefined || exoplanet.star_age !== undefined) && (
        <div>
          <h3 className="font-semibold text-white mb-2">Host Star</h3>
          <div className="space-y-1">
            {exoplanet.star_name && (
              <div className="flex justify-between">
                <span className="text-white/60">Name:</span>
                <span className="font-mono">{exoplanet.star_name}</span>
              </div>
            )}
            {exoplanet.star_distance !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/60">Distance:</span>
                <span className="font-mono">{formatValue(exoplanet.star_distance, 'ly')}</span>
              </div>
            )}
            {exoplanet.star_mass !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/60">Mass:</span>
                <span className="font-mono">{formatValue(exoplanet.star_mass, 'M☉')}</span>
              </div>
            )}
            {exoplanet.star_radius !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/60">Radius:</span>
                <span className="font-mono">{formatValue(exoplanet.star_radius, 'R☉')}</span>
              </div>
            )}
            {exoplanet.star_age !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/60">Age:</span>
                <span className="font-mono">{formatValue(exoplanet.star_age, 'Gyr')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discovery */}
      {exoplanet.discovered && (
        <div>
          <h3 className="font-semibold text-white mb-2">Discovery</h3>
          <div className="flex justify-between">
            <span className="text-white/60">Year:</span>
            <span className="font-mono">{exoplanet.discovered}</span>
          </div>
        </div>
      )}

      {/* Position in Scene */}
      <div>
        <h3 className="font-semibold text-white mb-2">Scene Position</h3>
        <p className="font-mono text-xs">
          X: {position.x.toFixed(0)}<br />
          Y: {position.y.toFixed(0)}<br />
          Z: {position.z.toFixed(0)}
        </p>
      </div>
    </div>
  );
}

// Size Tab Component
function SizeTab({ radius, planetName }: { radius: number; planetName: string }) {
  const earthRadius = 1; // Reference
  const scale = Math.min(radius, 20); // Cap visualization scale
  const earthSize = 40; // Base size in pixels
  const planetSize = earthSize * scale;
  
  return (
    <div className="space-y-6 text-white/80">
      {/* Comparison Visualization */}
      <div className="bg-black/20 rounded-lg p-6">
        <h3 className="font-semibold text-white mb-4 text-center">Size Comparison</h3>
        <div className="flex items-end justify-center gap-8 h-48">
          {/* Earth */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="rounded-full bg-blue-500 animate-pulse"
              style={{
                width: `${earthSize}px`,
                height: `${earthSize}px`,
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
              }}
            />
            <span className="text-xs text-white/60">Earth</span>
            <span className="text-xs font-mono text-white">{earthRadius} R⊕</span>
          </div>
          
          {/* Exoplanet */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="rounded-full bg-purple-500 animate-pulse"
              style={{
                width: `${planetSize}px`,
                height: `${planetSize}px`,
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
                animationDelay: '0.5s',
              }}
            />
            <span className="text-xs text-white/60 max-w-[100px] truncate">{planetName}</span>
            <span className="text-xs font-mono text-white">{radius.toFixed(2)} R⊕</span>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-semibold text-white mb-2">About Earth's Size</h4>
          <p className="text-white/70 leading-relaxed">
            Earth has a radius of approximately 6,371 kilometers (3,959 miles). 
            This makes it the fifth-largest planet in our Solar System and the largest of the terrestrial planets.
          </p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="font-semibold text-white mb-2">Comparison</h4>
          <p className="text-white/70 leading-relaxed">
            {radius < 0.5 && `${planetName} is significantly smaller than Earth, with a radius only ${(radius * 100).toFixed(0)}% of Earth's radius.`}
            {radius >= 0.5 && radius < 0.9 && `${planetName} is somewhat smaller than Earth, with a radius about ${(radius * 100).toFixed(0)}% of Earth's radius.`}
            {radius >= 0.9 && radius <= 1.1 && `${planetName} is very similar in size to Earth, with approximately ${(radius * 100).toFixed(0)}% of Earth's radius.`}
            {radius > 1.1 && radius <= 2 && `${planetName} is larger than Earth, with a radius ${radius.toFixed(2)} times Earth's radius.`}
            {radius > 2 && radius <= 4 && `${planetName} is a "Super-Earth" with a radius ${radius.toFixed(2)} times larger than Earth.`}
            {radius > 4 && radius <= 10 && `${planetName} is a "Neptune-sized" planet, with a radius ${radius.toFixed(2)} times that of Earth.`}
            {radius > 10 && `${planetName} is a gas giant comparable to Jupiter, with a radius ${radius.toFixed(2)} times larger than Earth.`}
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-200 text-xs">
            <span className="font-semibold">Note:</span> The symbol R⊕ represents Earth radii, 
            a standard unit for measuring planetary sizes in astronomy.
          </p>
        </div>
      </div>
    </div>
  );
}

// Distance Tab Component
function DistanceTab({ distance, planetName }: { distance: number; planetName: string }) {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, []);

  const travelTime = distance; // Already in light-years
  const speedOfLight = 299792; // km/s
  const kmDistance = distance * 9.461e12; // Convert light-years to km

  return (
    <div className="space-y-6 text-white/80">
      {/* Light Travel Animation */}
      <div className="bg-black/20 rounded-lg p-6">
        <h3 className="font-semibold text-white mb-4 text-center">Light Travel Visualization</h3>
        <div className="relative h-24 flex items-center">
          {/* Earth */}
          <div className="absolute left-0 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500" style={{ boxShadow: '0 0 15px rgba(59, 130, 246, 0.7)' }} />
            <span className="text-xs text-white/60 mt-1">Earth</span>
          </div>
          
          {/* Path */}
          <div className="absolute left-8 right-8 h-0.5 bg-white/10" />
          
          {/* Light beam */}
          <div
            className="absolute h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-100"
            style={{
              left: '32px',
              width: `${animationProgress * (100 - 64 / 4)}%`,
              boxShadow: '0 0 10px rgba(253, 224, 71, 0.8)',
            }}
          />
          
          {/* Exoplanet */}
          <div className="absolute right-0 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-purple-500" style={{ boxShadow: '0 0 15px rgba(168, 85, 247, 0.7)' }} />
            <span className="text-xs text-white/60 mt-1 max-w-[60px] truncate">{planetName}</span>
          </div>
        </div>
        <p className="text-center text-xs text-white/50 mt-2">
          {animationProgress < 1 ? 'Light traveling...' : 'Light reached destination!'}
        </p>
      </div>

      {/* Information */}
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-semibold text-white mb-2">Distance</h4>
          <p className="text-white/70 leading-relaxed">
            {planetName} is located approximately <span className="font-mono text-white">{distance.toFixed(2)} light-years</span> away from Earth.
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="font-semibold text-white mb-2">What is a Light-Year?</h4>
          <p className="text-white/70 leading-relaxed">
            A light-year is the distance that light travels in one year through the vacuum of space. 
            Light moves at an incredible speed of approximately {speedOfLight.toLocaleString()} kilometers per second 
            (186,282 miles per second).
          </p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <h4 className="font-semibold text-white mb-2">Put Into Perspective</h4>
          <p className="text-white/70 leading-relaxed mb-2">
            One light-year equals approximately 9.46 trillion kilometers (5.88 trillion miles). 
          </p>
          <p className="text-white/70 leading-relaxed">
            {distance < 1 && `If you could travel at the speed of light, it would take ${(distance * 365.25).toFixed(0)} days to reach ${planetName}.`}
            {distance >= 1 && distance < 10 && `Even traveling at light speed, it would take ${distance.toFixed(1)} years to reach ${planetName}—that's ${Math.round(distance * 365.25)} days!`}
            {distance >= 10 && distance < 100 && `At light speed, the journey to ${planetName} would take ${distance.toFixed(0)} years. With current spacecraft technology (traveling at about 60,000 km/h), it would take over ${Math.round(distance * 17900)} years!`}
            {distance >= 100 && distance < 1000 && `${planetName} is ${distance.toFixed(0)} light-years away. Even if humans could somehow travel at 1% of light speed, the journey would take ${(distance * 100).toFixed(0)} years.`}
            {distance >= 1000 && `At a staggering ${distance.toFixed(0)} light-years away, ${planetName} is incredibly distant. The light we see from it today actually left the planet ${Math.round(distance)} years ago!`}
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-yellow-200 text-xs">
            <span className="font-semibold">Fun Fact:</span> If you could drive a car at highway speed (100 km/h) 
            to {planetName}, it would take approximately {(kmDistance / 100 / 24 / 365).toExponential(2)} years to get there!
          </p>
        </div>
      </div>
    </div>
  );
}

// Mass Tab Component
function MassTab({ mass, planetName }: { mass: number; planetName: string }) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Calculate tilt based on mass difference
  const maxTilt = 15; // degrees
  const baseTilt = mass > 1 
    ? -Math.min(maxTilt, (mass - 1) * 3) 
    : Math.min(maxTilt, (1 - mass) * 10);
  const tilt = baseTilt * (animationPhase === 1 ? 1 : 0.85);

  return (
    <div className="space-y-6 text-white/80">
      {/* Balance Scale Visualization */}
      <div className="bg-black/20 rounded-lg p-6">
        <h3 className="font-semibold text-white mb-4 text-center">Mass Comparison</h3>
        
        {/* Scale Container */}
        <div className="relative h-64 flex items-center justify-center">
          {/* Fulcrum Base */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-4 bg-gray-700 rounded-t-lg shadow-lg" />
          
          {/* Fulcrum Pole */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-4 h-24 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-sm shadow-md" />
          
          {/* Fulcrum Top (Triangle/Pivot) */}
          <div 
            className="absolute bottom-[8.75rem] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-l-transparent border-r-transparent border-b-gray-300 shadow-sm"
          />
          
          {/* Rotating Balance System */}
          <div
            className="absolute bottom-[8.75rem] left-1/2 transition-transform duration-1000 ease-in-out"
            style={{
              transform: `translateX(-50%) rotate(${tilt}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Balance Beam */}
            <div className="relative w-80 h-2.5 bg-gradient-to-r from-gray-600 via-gray-300 to-gray-600 rounded-full shadow-lg -translate-x-1/2 left-1/2" />
            
            {/* Left Side (Earth) - Counter-rotate to keep vertical */}
            <div 
              className="absolute left-8 top-2.5 transition-transform duration-1000 ease-in-out" 
              style={{ 
                transformOrigin: 'top center',
                transform: `rotate(${-tilt}deg)`,
              }}
            >
              {/* String */}
              <div className="w-0.5 h-16 bg-gray-400 mx-auto" />
              
              {/* Pan */}
              <div className="flex flex-col items-center -mt-0.5">
                <div className="w-24 h-2 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full shadow-md" />
                <div className="w-20 h-1 bg-gray-500 rounded-full mt-0.5" />
                
                {/* Earth */}
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mt-2 shadow-xl" style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)' }}>
                  <div className="text-3xl">🌍</div>
                </div>
                
                {/* Labels */}
                <div className="flex flex-col items-center mt-2 gap-0.5">
                  <span className="text-xs text-white/70">Earth</span>
                  <span className="text-xs font-mono text-white font-semibold">1.00 M⊕</span>
                </div>
              </div>
            </div>
            
            {/* Right Side (Exoplanet) - Counter-rotate to keep vertical */}
            <div 
              className="absolute right-8 top-2.5 transition-transform duration-1000 ease-in-out" 
              style={{ 
                transformOrigin: 'top center',
                transform: `rotate(${-tilt}deg)`,
              }}
            >
              {/* String */}
              <div className="w-0.5 h-16 bg-gray-400 mx-auto" />
              
              {/* Pan */}
              <div className="flex flex-col items-center -mt-0.5">
                <div className="w-24 h-2 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full shadow-md" />
                <div className="w-20 h-1 bg-gray-500 rounded-full mt-0.5" />
                
                {/* Exoplanet */}
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mt-2 shadow-xl" 
                  style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.8)' }}
                >
                  <div className="text-3xl">🪐</div>
                </div>
                
                {/* Labels */}
                <div className="flex flex-col items-center mt-2 gap-0.5">
                  <span className="text-xs text-white/70 max-w-[90px] truncate text-center">{planetName}</span>
                  <span className="text-xs font-mono text-white font-semibold">{mass.toFixed(2)} M⊕</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-semibold text-white mb-2">About Earth's Mass</h4>
          <p className="text-white/70 leading-relaxed">
            Earth has a mass of approximately 5.972 × 10²⁴ kilograms. 
            This mass gives Earth its gravitational pull, which keeps our atmosphere in place 
            and determines how much we weigh on the surface.
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="font-semibold text-white mb-2">Mass Comparison</h4>
          <p className="text-white/70 leading-relaxed">
            {mass < 0.5 && `${planetName} is much less massive than Earth, with only ${(mass * 100).toFixed(0)}% of Earth's mass. This lower mass means weaker gravity—you would feel much lighter there!`}
            {mass >= 0.5 && mass < 0.9 && `${planetName} has about ${(mass * 100).toFixed(0)}% of Earth's mass. Its gravity would be noticeably weaker, making you feel lighter.`}
            {mass >= 0.9 && mass <= 1.1 && `${planetName} has a very similar mass to Earth (${mass.toFixed(2)} M⊕). Standing on its surface, you would experience nearly the same gravitational pull as on Earth.`}
            {mass > 1.1 && mass <= 2 && `${planetName} is ${mass.toFixed(2)} times more massive than Earth. Its stronger gravity would make you feel heavier.`}
            {mass > 2 && mass <= 10 && `${planetName} is a massive "Super-Earth" with ${mass.toFixed(2)} times Earth's mass. Its powerful gravity would make movement much more difficult.`}
            {mass > 10 && mass <= 100 && `${planetName} is ${mass.toFixed(1)} times more massive than Earth, likely a gas giant. Its immense gravity would crush any solid surface.`}
            {mass > 100 && `${planetName} is an enormous gas giant with ${mass.toFixed(0)} times Earth's mass—comparable to or exceeding Jupiter!`}
          </p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <h4 className="font-semibold text-white mb-2">Gravitational Impact</h4>
          <p className="text-white/70 leading-relaxed">
            If you weigh 70 kg (154 lbs) on Earth, you would weigh approximately{' '}
            <span className="font-mono text-white">
              {(70 * mass * (1 / (Math.pow(mass, 0.33)))).toFixed(1)} kg
            </span>{' '}
            on {planetName} (assuming similar density and radius-mass relationship).
          </p>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-green-200 text-xs">
            <span className="font-semibold">Note:</span> The symbol M⊕ represents Earth masses, 
            the standard unit for measuring planetary masses. Mass and size don't always correlate—
            a planet can be large but have low density (like Saturn), or small but very dense!
          </p>
        </div>
      </div>
    </div>
  );
}

