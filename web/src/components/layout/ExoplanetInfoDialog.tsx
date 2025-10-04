import { GlassCard } from '@/components/ui/GlassCard';
import type { SelectedExoplanet } from '@/hooks/useThreeScene';

interface ExoplanetInfoDialogProps {
  exoplanet: SelectedExoplanet;
  onClose: () => void;
}

export function ExoplanetInfoDialog({ exoplanet, onClose }: ExoplanetInfoDialogProps) {
  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <GlassCard className="px-6 py-6 w-80 max-h-[70vh] overflow-y-auto pointer-events-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-white font-bold text-2xl">Exoplanet #{exoplanet.id}</h2>
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

        <div className="space-y-4 text-white/80 text-sm">
          <div>
            <h3 className="font-semibold text-white mb-2">Position</h3>
            <p className="font-mono text-xs">
              X: {exoplanet.position.x.toFixed(2)}<br />
              Y: {exoplanet.position.y.toFixed(2)}<br />
              Z: {exoplanet.position.z.toFixed(2)}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Description</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Properties</h3>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Discovery</h3>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

