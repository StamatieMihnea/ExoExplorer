import { GlassButton } from '@/components/ui/GlassButton';

interface ActionButtonsProps {
  onReturnToEarth: () => void;
  onViewAll: () => void;
  onViewFavorites: () => void;
}

export function ActionButtons({ onReturnToEarth, onViewAll, onViewFavorites }: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-3 pointer-events-auto">
      <GlassButton variant="emerald" onClick={onReturnToEarth}>
        Return to Earth
      </GlassButton>
      <GlassButton variant="blue" onClick={onViewAll}>
        View All
      </GlassButton>
      <GlassButton variant="purple" onClick={onViewFavorites}>
        Favorites
      </GlassButton>
    </div>
  );
}

