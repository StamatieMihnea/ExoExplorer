import { useEffect, useState } from 'react';

export interface ExoplanetStats {
  total: number;
  withDistance: number;
  withMass: number;
  withRadius: number;
  withAtmosphere: number;
  percentageWithDistance: string;
  percentageWithMass: string;
  percentageWithRadius: string;
  percentageWithAtmosphere: string;
  nearestExoplanet: {
    name: string;
    distance_parsecs: number;
    distance_light_years: string;
    star_name: string;
  } | null;
  detectionTypes: Array<{
    type: string;
    count: number;
  }>;
  discoveryByYear: Array<{
    year: number;
    count: number;
  }>;
}

export function useExoplanetStats() {
  const [stats, setStats] = useState<ExoplanetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/exoplanets/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching exoplanet stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

