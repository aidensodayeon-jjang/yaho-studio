import { useState, useEffect } from 'react';
import { fetchTourSpots, fetchTourSpotsByEntities, TourSpotItem } from '../api/tourApi';

export interface TrendEntities {
  places?: string[];
  regions?: string[];
  events?: string[];
  foods?: string[];
}

export interface UseTourDataResult {
  loading: boolean;
  error: string | null;
  data: TourSpotItem[];
  isNationwideFallback: boolean;
}

/**
 * When `entities` is provided (a trend was selected), POIs are resolved from the
 * trend's structured entities (places → regions+places → events → foods → regions),
 * NOT from the raw display title. This is what actually connects a discovered
 * trend like "공주 공산성 야경" to the real POI "공산성". Falls back to the plain
 * areaCode/keyword search for manual searches.
 */
export function useTourData(
  areaCode?: number,
  contentTypeId?: number,
  keyword?: string,
  entities?: TrendEntities
): UseTourDataResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TourSpotItem[]>([]);
  const [isNationwideFallback, setIsNationwideFallback] = useState<boolean>(false);

  const hasEntities = !!(
    entities &&
    ((entities.places && entities.places.length > 0) ||
      (entities.regions && entities.regions.length > 0) ||
      (entities.events && entities.events.length > 0) ||
      (entities.foods && entities.foods.length > 0))
  );
  const entitiesKey = hasEntities ? JSON.stringify(entities) : '';

  useEffect(() => {
    let isMounted = true;

    async function loadTourData() {
      setLoading(true);
      setError(null);
      try {
        const result = hasEntities
          ? await fetchTourSpotsByEntities(entities, keyword)
          : await fetchTourSpots(areaCode, contentTypeId, keyword);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaCode, contentTypeId, keyword, entitiesKey]);

  return { loading, error, data, isNationwideFallback };
}
