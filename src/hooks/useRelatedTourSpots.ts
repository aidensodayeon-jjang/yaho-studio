import { useState, useEffect } from 'react';
import { RelatedTourSpot } from '../types/relatedTour';
import { fetchRelatedTourSpots } from '../api/relatedTourApi';

export interface UseRelatedTourSpotsResult {
  spots: RelatedTourSpot[];
  loading: boolean;
  error: string | null;
}

export function useRelatedTourSpots(
  contentId?: string,
  mapx?: string | number,
  mapy?: string | number,
  contentTypeId?: string,
  title?: string,
  addr1?: string
): UseRelatedTourSpotsResult {
  const [spots, setSpots] = useState<RelatedTourSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId || contentId.trim() === '') {
      setSpots([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetchRelatedTourSpots(contentId, mapx, mapy, contentTypeId, title, addr1)
      .then((data) => {
        if (!isCancelled) {
          setSpots(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(errorMsg);
          setSpots([]);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [contentId, mapx, mapy, contentTypeId]);

  return { spots, loading, error };
}
