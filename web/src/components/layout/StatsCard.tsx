import { GlassCard } from '@/components/ui/GlassCard';

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div>
      <p className="text-white/60 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  );
}

interface StatsCardProps {
  exoplanetsCount: number;
  distanceRange: { min: number; max: number } | null;
}

export function StatsCard({ exoplanetsCount, distanceRange }: StatsCardProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} pc`;
    } else if (distance < 1000) {
      return `${distance.toFixed(1)} ly`;
    } else {
      return `${(distance / 1000).toFixed(1)}k ly`;
    }
  };

  return (
    <div className="absolute top-32 right-6">
      <GlassCard className="px-5 py-4">
        <div className="space-y-3">
          <StatItem 
            label="Total Exoplanets" 
            value={exoplanetsCount > 0 ? formatNumber(exoplanetsCount) : 'Loading...'} 
          />
          <div className="h-px bg-white/20"></div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Distance Range</p>
            <p className="text-white text-sm font-medium">
              {distanceRange 
                ? `${formatDistance(distanceRange.min)} - ${formatDistance(distanceRange.max)}`
                : 'Loading...'}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

