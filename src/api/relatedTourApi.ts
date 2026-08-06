import { RelatedTourSpot } from '../types/relatedTour';

const TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

// 메모리 캐시 저장소 (contentId -> RelatedTourSpot[])
const relatedTourCache = new Map<string, RelatedTourSpot[]>();

function getDecodedServiceKey(): string {
  const rawServiceKey = import.meta.env.VITE_TOUR_API_KEY?.trim();

  if (!rawServiceKey) {
    throw new Error('인증키가 설정되지 않았습니다. .env.local 파일의 VITE_TOUR_API_KEY를 확인해주세요.');
  }

  try {
    return decodeURIComponent(rawServiceKey);
  } catch {
    return rawServiceKey;
  }
}

// Haversine 공식을 사용한 위경도 사이 거리(m) 계산 함수
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 지구 반지름 (meters)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // meters
}

function formatDistanceText(meters?: number): string | undefined {
  if (meters === undefined || isNaN(meters)) return undefined;
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 한국관광공사 TourAPI를 호출하여 contentId 기준 연관/주변 관광지 6개를 가져오는 함수
 * 
 * Strategy:
 * 1. detailCommon2로 해당 contentId의 좌표(mapx, mapy)를 구함
 * 2. locationBasedList2(위치기반 관광지 검색 API)를 5000m 반경으로 호출
 * 3. 자기 자신(contentId)을 제외하고 거리 순으로 정렬하여 최대 6개 반환
 * 4. 위치 좌표가 없거나 locationBasedList2 결과가 없는 경우 동일 카테고리/지역 areaBasedList2로 fallback
 */
export async function fetchRelatedTourSpots(
  contentId: string,
  mapx?: string | number,
  mapy?: string | number,
  contentTypeId?: string,
  title?: string,
  addr1?: string
): Promise<RelatedTourSpot[]> {
  if (!contentId || contentId.trim() === '') {
    return [];
  }

  const cacheKey = contentId.trim();

  // 1. 메모리 캐시 확인
  if (relatedTourCache.has(cacheKey)) {
    return relatedTourCache.get(cacheKey)!;
  }

  const serviceKey = getDecodedServiceKey();
  let targetMapX = mapx ? String(mapx) : undefined;
  let targetMapY = mapy ? String(mapy) : undefined;

  // 좌표가 없고 contentId도 Mock ID인 경우 (숫자 형태가 아니거나 TourAPI 좌표가 없는 경우)
  if (!targetMapX || !targetMapY || targetMapX === '0' || targetMapY === '0') {
    try {
      // 1. TourAPI detailCommon2 호출하여 좌표 확보
      if (/^\d+$/.test(cacheKey)) {
        const detailUrl = `${TOUR_API_BASE_URL}/detailCommon2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=YAHOStudio&_type=json&contentId=${cacheKey}&mapinfoYN=Y`;
        const res = await fetch(detailUrl);
        if (res.ok) {
          const json = await res.json();
          const item = json?.response?.body?.items?.item;
          const detailObj = Array.isArray(item) ? item[0] : item;
          if (detailObj?.mapx && detailObj?.mapy) {
            targetMapX = String(detailObj.mapx);
            targetMapY = String(detailObj.mapy);
          }
        }
      }

      // 2. 만약 여전히 좌표가 없다면, 제목(예: "포방터시장", "홍제폭포")으로 TourAPI searchKeyword2 검색하여 동적 좌표(mapx, mapy) 확보
      if ((!targetMapX || !targetMapY || targetMapX === '0' || targetMapY === '0') && title && title.trim() !== '') {
        const cleanTitle = title.replace(/패키지|투어|힐링|×.*$/g, '').trim(); // "포방터시장 패키지" -> "포방터시장"
        const searchUrl = `${TOUR_API_BASE_URL}/searchKeyword2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=YAHOStudio&_type=json&keyword=${encodeURIComponent(cleanTitle)}&numOfRows=1`;
        const sRes = await fetch(searchUrl);
        if (sRes.ok) {
          const sJson = await sRes.json();
          const sItem = sJson?.response?.body?.items?.item;
          const matchedObj = Array.isArray(sItem) ? sItem[0] : sItem;
          if (matchedObj?.mapx && matchedObj?.mapy) {
            targetMapX = String(matchedObj.mapx);
            targetMapY = String(matchedObj.mapy);
          }
        }
      }
    } catch {
      // 무시
    }
  }

  let resultSpots: RelatedTourSpot[] = [];

  // 위치기반 검색 가능한 좌표가 확보된 경우: locationBasedList2 호출
  if (targetMapX && targetMapY && targetMapX !== '0' && targetMapY !== '0') {
    try {
      const locParams = new URLSearchParams({
        serviceKey: serviceKey,
        numOfRows: '20',
        pageNo: '1',
        MobileOS: 'ETC',
        MobileApp: 'YAHOStudio',
        _type: 'json',
        mapX: targetMapX,
        mapY: targetMapY,
        radius: '5000', // 5km 반경
        arrange: 'E', // 거리순 정렬
      });

      const locUrl = `${TOUR_API_BASE_URL}/locationBasedList2?${locParams.toString()}`;
      const response = await fetch(locUrl);

      if (response.ok) {
        const data = await response.json();
        const itemsData = data?.response?.body?.items;
        if (itemsData && typeof itemsData === 'object') {
          const rawItem = itemsData.item;
          let rawList: any[] = [];
          if (Array.isArray(rawItem)) {
            rawList = rawItem;
          } else if (typeof rawItem === 'object' && rawItem !== null) {
            rawList = [rawItem];
          }

          const originX = parseFloat(targetMapX);
          const originY = parseFloat(targetMapY);

          resultSpots = rawList
            .filter((item) => String(item.contentid) !== cacheKey && String(item.title) !== title) // 자기 자신 및 동일명 제외
            .map((item) => {
              const itemX = item.mapx ? parseFloat(String(item.mapx)) : NaN;
              const itemY = item.mapy ? parseFloat(String(item.mapy)) : NaN;
              let meters: number | undefined;

              if (!isNaN(originX) && !isNaN(originY) && !isNaN(itemX) && !isNaN(itemY)) {
                meters = calculateDistanceMeters(originY, originX, itemY, itemX);
              } else if (item.dist) {
                meters = Math.round(parseFloat(String(item.dist)));
              }

              return {
                contentid: String(item.contentid ?? ''),
                title: String(item.title ?? ''),
                addr1: item.addr1 ? String(item.addr1) : undefined,
                firstimage: item.firstimage ? String(item.firstimage) : undefined,
                mapx: item.mapx ? String(item.mapx) : undefined,
                mapy: item.mapy ? String(item.mapy) : undefined,
                contenttypeid: String(item.contenttypeid ?? ''),
                distance: meters,
                distanceText: formatDistanceText(meters),
              };
            })
            .slice(0, 6);
        }
      }
    } catch {
      // locationBasedList2 에러 시 fallback
    }
  }

  // 위치 기반 결과가 없거나 부족한 경우 (주소 addr1 기반 연관 검색)
  if (resultSpots.length === 0) {
    try {
      const cleanTitle = (title || '').replace(/패키지|투어|힐링|×.*$/g, '').trim();
      
      // 주소(addr1)에서 "구/시/군/동" 파싱 (예: "서울특별시 서대문구 홍은동 100" -> ["서대문구", "홍은동"])
      const addrTokens = (addr1 || '').split(' ').filter(Boolean);
      const district = addrTokens.find((t) => t.endsWith('구') || t.endsWith('시') || t.endsWith('군'));
      const neighborhood = addrTokens.find((t) => t.endsWith('동') || t.endsWith('읍') || t.endsWith('면') || t.endsWith('가'));

      const keywordsToTry = [
        neighborhood, // 1순위: 홍은동/연희동
        district,     // 2순위: 서대문구/해운대구
        cleanTitle,   // 3순위: 관광지 명칭
        addrTokens[0] // 4순위: 서울/부산
      ].filter((k): k is string => Boolean(k && k.length >= 2));

      for (const kw of keywordsToTry) {
        if (resultSpots.length >= 6) break;

        const fbParams = new URLSearchParams({
          serviceKey: serviceKey,
          numOfRows: '15',
          pageNo: '1',
          MobileOS: 'ETC',
          MobileApp: 'YAHOStudio',
          _type: 'json',
          keyword: kw,
        });

        const fbUrl = `${TOUR_API_BASE_URL}/searchKeyword2?${fbParams.toString()}`;
        const response = await fetch(fbUrl);

        if (response.ok) {
          const data = await response.json();
          const itemsData = data?.response?.body?.items;
          if (itemsData && typeof itemsData === 'object') {
            const rawItem = itemsData.item;
            let rawList: any[] = [];
            if (Array.isArray(rawItem)) {
              rawList = rawItem;
            } else if (typeof rawItem === 'object' && rawItem !== null) {
              rawList = [rawItem];
            }

            const mapped = rawList
              .filter((item) => String(item.contentid) !== cacheKey && !String(item.title).includes(cleanTitle))
              .map((item) => ({
                contentid: String(item.contentid ?? ''),
                title: String(item.title ?? ''),
                addr1: item.addr1 ? String(item.addr1) : undefined,
                firstimage: item.firstimage ? String(item.firstimage) : undefined,
                mapx: item.mapx ? String(item.mapx) : undefined,
                mapy: item.mapy ? String(item.mapy) : undefined,
                contenttypeid: String(item.contenttypeid ?? ''),
              }));

            // 기존 결과와 중복되지 않는 아이템만 누적
            for (const m of mapped) {
              if (!resultSpots.some((r) => r.contentid === m.contentid || r.title === m.title)) {
                resultSpots.push(m);
              }
              if (resultSpots.length >= 6) break;
            }
          }
        }
      }
    } catch {
      // 무시
    }
  }

  // 3차 최종 Fallback: 전국 areaBasedList2
  if (resultSpots.length === 0) {
    try {
      const fbParams = new URLSearchParams({
        serviceKey: serviceKey,
        numOfRows: '10',
        pageNo: '1',
        MobileOS: 'ETC',
        MobileApp: 'YAHOStudio',
        _type: 'json',
        arrange: 'A',
      });
      if (contentTypeId && contentTypeId.trim() !== '') {
        fbParams.append('contentTypeId', contentTypeId.trim());
      }

      const fbUrl = `${TOUR_API_BASE_URL}/areaBasedList2?${fbParams.toString()}`;
      const response = await fetch(fbUrl);

      if (response.ok) {
        const data = await response.json();
        const itemsData = data?.response?.body?.items;
        if (itemsData && typeof itemsData === 'object') {
          const rawItem = itemsData.item;
          let rawList: any[] = [];
          if (Array.isArray(rawItem)) {
            rawList = rawItem;
          } else if (typeof rawItem === 'object' && rawItem !== null) {
            rawList = [rawItem];
          }

          resultSpots = rawList
            .filter((item) => String(item.contentid) !== cacheKey)
            .map((item) => ({
              contentid: String(item.contentid ?? ''),
              title: String(item.title ?? ''),
              addr1: item.addr1 ? String(item.addr1) : undefined,
              firstimage: item.firstimage ? String(item.firstimage) : undefined,
              mapx: item.mapx ? String(item.mapx) : undefined,
              mapy: item.mapy ? String(item.mapy) : undefined,
              contenttypeid: String(item.contenttypeid ?? ''),
            }))
            .slice(0, 6);
        }
      }
    } catch {
      // 무시
    }
  }

  // 캐시에 저장
  relatedTourCache.set(cacheKey, resultSpots);

  return resultSpots;
}
