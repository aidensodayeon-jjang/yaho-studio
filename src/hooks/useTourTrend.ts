import { useState, useEffect } from 'react';
import { fetchTourTrend } from '../api/tourTrendApi';
import { RegionalTrendSummary } from '../types/tourTrend';

export interface UseTourTrendResult {
  loading: boolean;
  error: string | null;
  trendData: RegionalTrendSummary | null;
  isEmpty: boolean;
}

export function useTourTrend(
  tourAreaCode: number = 1,
  address?: string,
  spotTitle?: string
): UseTourTrendResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<RegionalTrendSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadTrendData() {
      try {
        const data = await fetchTourTrend(tourAreaCode, address, spotTitle);
        if (isMounted) {
          setTrendData(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : '관광 트렌드 데이터를 불러올 수 없습니다.';
          setError(message);
          setTrendData(null);
          setLoading(false);
        }
      }
    }

    loadTrendData();

    return () => {
      isMounted = false;
    };
  }, [tourAreaCode, address, spotTitle]);

  return {
    loading,
    error,
    trendData,
    isEmpty: !trendData || trendData.allSpotTrends.length === 0,
  };
}
