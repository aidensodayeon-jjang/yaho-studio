import { useState, useEffect } from 'react';
import { fetchTourSpotsByArea, TourSpotItem } from '../api/tourApi';

export interface UseTourDataResult {
  loading: boolean;
  error: string | null;
  data: TourSpotItem[];
}

export function useTourData(areaCode: number): UseTourDataResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TourSpotItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadTourData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTourSpotsByArea(areaCode);
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
          setError(message);
          setData([]);
          setLoading(false);
        }
      }
    }

    loadTourData();

    return () => {
      isMounted = false;
    };
  }, [areaCode]);

  return { loading, error, data };
}
