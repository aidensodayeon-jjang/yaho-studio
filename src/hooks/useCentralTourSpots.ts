import { useState, useEffect } from 'react';
import { fetchCentralTourSpots } from '../api/centralTourSpotApi';
import { CentralTourSpotItem } from '../types/centralTourSpot';

export interface UseCentralTourSpotsResult {
  loading: boolean;
  error: string | null;
  spots: CentralTourSpotItem[];
  areaCd: string;
  signguCd: string;
  signguNm: string;
  isEmpty: boolean;
  isCurrentSpotCentral: boolean;
  currentSpotRank: number | null;
}

export function useCentralTourSpots(
  tourAreaCode: number = 1,
  address?: string,
  spotTitle?: string
): UseCentralTourSpotsResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [spots, setSpots] = useState<CentralTourSpotItem[]>([]);
  const [areaCd, setAreaCd] = useState<string>('11');
  const [signguCd, setSignguCd] = useState<string>('11410');
  const [signguNm, setSignguNm] = useState<string>('서대문구');
  const [isCurrentSpotCentral, setIsCurrentSpotCentral] = useState<boolean>(false);
  const [currentSpotRank, setCurrentSpotRank] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadCentralSpots() {
      try {
        const result = await fetchCentralTourSpots(tourAreaCode, address, '202405');
        if (isMounted) {
          setSpots(result.spots);
          setAreaCd(result.areaCd);
          setSignguCd(result.signguCd);
          setSignguNm(result.signguNm);
          setLoading(false);

          // 선택된 관광지가 중심 관광지 목록에 포함되는지 유연하게 비교
          if (spotTitle && spotTitle.trim() !== '' && result.spots.length > 0) {
            const cleanTitle = spotTitle.trim().replace(/\s+/g, '');
            const matchedItem = result.spots.find((s) => {
              const cleanHubNm = s.hubTatsNm.trim().replace(/\s+/g, '');
              return (
                cleanHubNm.includes(cleanTitle) ||
                cleanTitle.includes(cleanHubNm) ||
                (cleanTitle.includes('홍제') && cleanHubNm.includes('홍제')) ||
                (cleanTitle.includes('경복궁') && cleanHubNm.includes('경복궁'))
              );
            });

            if (matchedItem) {
              setIsCurrentSpotCentral(true);
              setCurrentSpotRank(matchedItem.hubRank);
            } else {
              setIsCurrentSpotCentral(false);
              setCurrentSpotRank(null);
            }
          } else {
            setIsCurrentSpotCentral(false);
            setCurrentSpotRank(null);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : '지역 중심 관광지 데이터를 불러올 수 없습니다.';
          setError(message);
          setSpots([]);
          setLoading(false);
          setIsCurrentSpotCentral(false);
          setCurrentSpotRank(null);
        }
      }
    }

    loadCentralSpots();

    return () => {
      isMounted = false;
    };
  }, [tourAreaCode, address, spotTitle]);

  return {
    loading,
    error,
    spots,
    areaCd,
    signguCd,
    signguNm,
    isEmpty: spots.length === 0,
    isCurrentSpotCentral,
    currentSpotRank,
  };
}
