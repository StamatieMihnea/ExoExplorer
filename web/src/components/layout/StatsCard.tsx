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

export function StatsCard() {
  return (
    <div className="absolute top-32 right-6">
      <GlassCard className="px-5 py-4">
        <div className="space-y-3">
          <StatItem label="Total Exoplanets" value="10,000" />
          <div className="h-px bg-white/20"></div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Distance Range</p>
            <p className="text-white text-sm font-medium">80k - 250k km</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

