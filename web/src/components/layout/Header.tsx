import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';

interface HeaderProps {
  exoplanetsCount: number;
}

export function Header({ exoplanetsCount }: HeaderProps) {
  const formatCount = (count: number) => {
    if (count === 0) return 'Loading...';
    if (count < 1000) return `${count}`;
    return `${(count / 1000).toFixed(1)}k+`;
  };

  return (
    <header className="absolute top-0 left-0 right-0 p-6 z-[9999] pointer-events-none">
      <div className="flex items-center justify-between pointer-events-auto">
        {/* App Logo/Name */}
        <GlassCard className="px-6 py-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Exo Explorer
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Discover {formatCount(exoplanetsCount)} Exoplanets
          </p>
        </GlassCard>

        {/* Navigation to Prediction Page */}
        <Link 
          href="/predict" 
          className="backdrop-blur-md transition-all duration-300 rounded-xl px-5 py-3 border shadow-lg bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/30 hover:scale-105 transform cursor-pointer relative z-[10000]"
        >
          <span className="text-white font-medium">
            🔮 Predict Exoplanets
          </span>
        </Link>
      </div>
    </header>
  );
}

