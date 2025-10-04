import { GlassButton } from '@/components/ui/GlassButton';

interface ActionButtonsProps {
  onReturnToEarth: () => void;
}

export function ActionButtons({ onReturnToEarth }: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-3 pointer-events-auto">
      <GlassButton variant="emerald" onClick={onReturnToEarth}>
        🌍 Return to Earth
      </GlassButton>
      <GlassButton variant="blue">
        View All
      </GlassButton>
      <GlassButton variant="purple">
        Favorites
      </GlassButton>
    </div>
  );
}

