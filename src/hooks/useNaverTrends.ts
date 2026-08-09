import { useState, useEffect } from 'react';

export interface TrendItem {
  keyword: string;
  recentAverage: number;
  previousAverage: number;
  changeRate: number;
  trend: 'rising' | 'stable' | 'falling';
}

export function useNaverTrends() {
  const [popularTrends, setPopularTrends] = useState<TrendItem[]>([]);
  const [risingTrends, setRisingTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasKeys, setHasKeys] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchTrends() {
      setLoading(true);
      try {
        const response = await fetch('/api/trends');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        if (isMounted) {
          if (json.reason === 'NO_KEY') {
            setHasKeys(false);
            setPopularTrends([]);
            setRisingTrends([]);
          } else if (json.success) {
            setHasKeys(true);
            setPopularTrends(Array.isArray(json.popularTrends) ? json.popularTrends : []);
            setRisingTrends(Array.isArray(json.risingTrends) ? json.risingTrends : []);
          } else {
            setPopularTrends([]);
            setRisingTrends([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '트렌드 데이터 수집 실패');
          setPopularTrends([]);
          setRisingTrends([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTrends();
    return () => { isMounted = false; };
  }, []);

  return { popularTrends, risingTrends, loading, error, hasKeys };
}
