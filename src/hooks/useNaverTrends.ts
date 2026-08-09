import { useState, useEffect } from 'react';

export interface TrendItem {
  keyword: string;
  recentAverage: number;
  previousAverage: number;
  changeRate: number;
  trend: 'rising' | 'stable' | 'falling';
}

export function useNaverTrends() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
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
            setTrends([]);
          } else if (json.success && Array.isArray(json.data)) {
            setHasKeys(true);
            setTrends(json.data);
          } else {
            setTrends([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '트렌드 데이터 수집 실패');
          setTrends([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTrends();
    return () => { isMounted = false; };
  }, []);

  return { trends, loading, error, hasKeys };
}
