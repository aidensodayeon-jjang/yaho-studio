import { useState, useEffect } from 'react';
import { fetchTourSpots, TourSpotItem } from '../api/tourApi';

export interface UseTourDataResult {
  loading: boolean;
  error: string | null;
  data: TourSpotItem[];
  isNationwideFallback: boolean;
}

export function useTourData(
  areaCode?: number,
  contentTypeId?: number,
  keyword?: string
): UseTourDataResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TourSpotItem[]>([]);
  const [isNationwideFallback, setIsNationwideFallback] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTourData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTourSpots(areaCode, contentTypeId, keyword);
        if (isMounted) {
          setData(result.spots);
          setIsNationwideFallback(result.isNationwideFallback);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
          setError(message);
          setData([]);
          setIsNationwideFallback(false);
          setLoading(false);
        }
      }
    }

    loadTourData();

    return () => {
      isMounted = false;
    };
  }, [areaCode, contentTypeId, keyword]);

  return { loading, error, data, isNationwideFallback };
}
