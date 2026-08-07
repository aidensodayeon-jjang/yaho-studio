import { useState, useEffect } from 'react';
import { fetchRegionalVisitors, VisitorAnalyticsSummary } from '../api/visitorAnalyticsApi';

export interface UseVisitorAnalyticsResult {
  loading: boolean;
  error: string | null;
  visitorData: VisitorAnalyticsSummary | null;
}

export function useVisitorAnalytics(
  tourAreaCode: number = 1,
  address?: string
): UseVisitorAnalyticsResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visitorData, setVisitorData] = useState<VisitorAnalyticsSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadVisitorData() {
      try {
        const data = await fetchRegionalVisitors(tourAreaCode, address);
        if (isMounted) {
          setVisitorData(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : '방문자 데이터를 불러올 수 없습니다.';
          setError(message);
          setVisitorData(null);
          setLoading(false);
        }
      }
    }

    loadVisitorData();

    return () => {
      isMounted = false;
    };
  }, [tourAreaCode, address]);

  return { loading, error, visitorData };
}
