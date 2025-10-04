import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 p-6">
      <div className="flex items-center justify-between">
        {/* App Logo/Name */}
        <GlassCard className="px-6 py-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Exo Explorer
          </h1>
          <p className="text-xs text-white/70 mt-1">Discover 10,000+ Exoplanets</p>
        </GlassCard>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pointer-events-auto">
          <GlassButton>Explore</GlassButton>
          <GlassButton>Search</GlassButton>
          <GlassButton>Settings</GlassButton>
        </div>
      </div>
    </header>
  );
}

