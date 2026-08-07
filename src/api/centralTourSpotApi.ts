import {
  CentralTourSpotItem,
  CentralTourSpotItemRaw,
  CentralTourApiResponse,
} from '../types/centralTourSpot';
import { TOUR_TO_DATALAB_AREA_MAP } from './visitorAnalyticsApi';

const CENTRAL_TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/LocgoHubTarService1';

// 주소에서 시/군/구 (예: "서대문구", "종로구", "해운대구") 및 시군구 5자리 코드 매핑 테이블
const SIGUNGU_NAME_TO_CODE_MAP: Record<string, string> = {
  // 서울 (11)
  종로구: '11110',
  중구: '11140',
  용산구: '11170',
  성동구: '11200',
  광진구: '11215',
  동대문구: '11230',
  중랑구: '11260',
  성북구: '11290',
  강북구: '11305',
  도봉구: '11320',
  노원구: '11350',
  은평구: '11380',
  서대문구: '11410',
  마포구: '11440',
  양천구: '11470',
  강서구: '11500',
  구로구: '11530',
  금천구: '11545',
  영등포구: '11560',
  동작구: '11590',
  관악구: '11620',
  서초구: '11650',
  강남구: '11680',
  송파구: '11710',
  강동구: '11740',
  // 부산 (26)
  중구부산: '26110',
  서구: '26140',
  동구: '26170',
  영도구: '26200',
  부산진구: '26230',
  동래구: '26260',
  남구: '26290',
  북구: '26320',
  해운대구: '26350',
  사하구: '26380',
  금정구: '26410',
  강서구부산: '26440',
  연제구: '26470',
  수영구: '26500',
  사상구: '26530',
  기장군: '26710',
  // 인천 (28)
  중구인천: '28110',
  동구인천: '28140',
  미추홀구: '28177',
  연수구: '28185',
  남동구: '28200',
  부평구: '28237',
  계양구: '28245',
  서구인천: '28260',
  강화군: '28710',
  옹진군: '28720',
  // 제주 (50)
  제주시: '50110',
  서귀포시: '50130',
};

function extractSigunguCode(address?: string): { areaCd: string; signguCd: string; name: string } | null {
  if (!address || address.trim() === '') return null;
  const parts = address.trim().split(/\s+/);
  if (parts.length >= 2) {
    const sigunguName = parts[1];
    const code = SIGUNGU_NAME_TO_CODE_MAP[sigunguName];
    if (code) {
      const areaCd = code.slice(0, 2);
      return { areaCd, signguCd: code, name: sigunguName };
    }
  }
  return null;
}

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

// 메모리 캐시 (Key: "signguCd_11410_202405")
const centralTourSpotCache: Record<string, CentralTourSpotItem[]> = {};

export async function fetchCentralTourSpots(
  tourAreaCode: number = 1,
  address?: string,
  baseYm: string = '202405'
): Promise<{ spots: CentralTourSpotItem[]; areaCd: string; signguCd: string; signguNm: string }> {
  // 주소 또는 tourAreaCode 기반 areaCd 및 signguCd 추출
  let targetAreaCd = '11';
  let targetSignguCd = '11410'; // 기본 서대문구
  let resolvedName = '서대문구';

  const sigunguInfo = extractSigunguCode(address);
  if (sigunguInfo) {
    targetAreaCd = sigunguInfo.areaCd;
    targetSignguCd = sigunguInfo.signguCd;
    resolvedName = sigunguInfo.name;
  } else {
    const areaInfo = TOUR_TO_DATALAB_AREA_MAP[tourAreaCode] || TOUR_TO_DATALAB_AREA_MAP[1];
    targetAreaCd = areaInfo.dataLabCode;
    // 지역 대표 시군구 기본값 지정 (서울 -> 종로구 11110, 부산 -> 해운대구 26350 등)
    if (targetAreaCd === '11') targetSignguCd = '11110';
    else if (targetAreaCd === '26') targetSignguCd = '26350';
    else if (targetAreaCd === '50') targetSignguCd = '50110';
    else targetSignguCd = `${targetAreaCd}110`;
  }

  const cacheKey = `signgu_${targetSignguCd}_${baseYm}`;
  if (centralTourSpotCache[cacheKey]) {
    return {
      spots: centralTourSpotCache[cacheKey],
      areaCd: targetAreaCd,
      signguCd: targetSignguCd,
      signguNm: resolvedName,
    };
  }

  const serviceKey = getDecodedServiceKey();

  const queryParams = new URLSearchParams({
    serviceKey: serviceKey,
    MobileOS: 'ETC',
    MobileApp: 'YAHOStudio',
    _type: 'json',
    numOfRows: '10',
    pageNo: '1',
    baseYm: baseYm,
    areaCd: targetAreaCd,
    signguCd: targetSignguCd,
  });

  const url = `${CENTRAL_TOUR_API_BASE_URL}/areaBasedList1?${queryParams.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`중심 관광지 네트워크 오류: ${errorMsg}`);
  }

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      // 무시
    }
    throw new Error(`중심 관광지 HTTP 오류 (${response.status})${errorBody ? ` - ${errorBody}` : ''}`);
  }

  let data: CentralTourApiResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error('중심 관광지 응답 데이터를 JSON 형태로 파싱하지 못했습니다.');
  }

  const header = data?.response?.header;
  if (header && header.resultCode !== '0000') {
    throw new Error(`중심 관광지 API 오류 (코드: ${header.resultCode}, 메시지: ${header.resultMsg})`);
  }

  const itemsData = data?.response?.body?.items;
  if (!itemsData || typeof itemsData === 'string') {
    return { spots: [], areaCd: targetAreaCd, signguCd: targetSignguCd, signguNm: resolvedName };
  }

  const rawItem = itemsData.item;
  if (!rawItem) {
    return { spots: [], areaCd: targetAreaCd, signguCd: targetSignguCd, signguNm: resolvedName };
  }

  let rawList: CentralTourSpotItemRaw[] = [];
  if (Array.isArray(rawItem)) {
    rawList = rawItem;
  } else if (typeof rawItem === 'object' && rawItem !== null) {
    rawList = [rawItem];
  }

  const mappedSpots: CentralTourSpotItem[] = rawList.map((item) => ({
    baseYm: String(item.baseYm ?? baseYm),
    areaCd: String(item.areaCd ?? targetAreaCd),
    areaNm: String(item.areaNm ?? ''),
    signguCd: String(item.signguCd ?? targetSignguCd),
    signguNm: String(item.signguNm ?? resolvedName),
    hubTatsCd: String(item.hubTatsCd ?? ''),
    hubTatsNm: String(item.hubTatsNm ?? ''),
    hubCtgryLclsNm: String(item.hubCtgryLclsNm ?? ''),
    hubCtgryMclsNm: String(item.hubCtgryMclsNm ?? ''),
    hubRank: parseInt(String(item.hubRank ?? '99'), 10),
    mapX: item.mapX ? String(item.mapX) : undefined,
    mapY: item.mapY ? String(item.mapY) : undefined,
  }));

  // 순위 오름차순 정렬 (1위부터)
  mappedSpots.sort((a, b) => a.hubRank - b.hubRank);

  // 메모리 캐시 저장
  centralTourSpotCache[cacheKey] = mappedSpots;

  return {
    spots: mappedSpots,
    areaCd: targetAreaCd,
    signguCd: targetSignguCd,
    signguNm: mappedSpots[0]?.signguNm || resolvedName,
  };
}
