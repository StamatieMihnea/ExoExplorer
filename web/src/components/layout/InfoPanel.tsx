import { GlassCard } from '@/components/ui/GlassCard';

export function InfoPanel() {
  return (
    <GlassCard className="px-6 py-4 max-w-sm">
      <h3 className="text-white font-semibold text-lg mb-2">Navigation</h3>
      <p className="text-white/80 text-sm">
        Right-click and drag to navigate through space. Explore Earth and surrounding exoplanets.
      </p>
    </GlassCard>
  );
}

