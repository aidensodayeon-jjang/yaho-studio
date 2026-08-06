import { useState, useEffect } from 'react';
import { fetchTourDetail, TourDetailItem } from '../api/tourApi';

export interface UseTourDetailResult {
  loading: boolean;
  error: string | null;
  data: TourDetailItem | null;
}

export function useTourDetail(
  contentId?: string,
  contentTypeId?: string
): UseTourDetailResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TourDetailItem | null>(null);

  useEffect(() => {
    // contentId가 없으면 호출하지 않고 상태 초기화
    if (!contentId || contentId.trim() === '') {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadDetail() {
      try {
        const detail = await fetchTourDetail(contentId!, contentTypeId);
        if (isMounted) {
          setData(detail);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : '상세정보를 불러오지 못했습니다.';
          setError(message);
          setData(null);
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      // 이전 요청 완료 전 contentId가 변경되면 덮어쓰지 않도록 처리
      isMounted = false;
    };
  }, [contentId, contentTypeId]);

  return { loading, error, data };
}
