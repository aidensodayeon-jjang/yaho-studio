export interface VisitorApiItemRaw {
  areaCode?: string;
  areaNm?: string;
  signguCode?: string;
  signguNm?: string;
  baseYmd?: string;
  daywkDivCd?: string;
  daywkDivNm?: string;
  touDivCd?: string; // 1: 현지인, 2: 외지인, 3: 외국인
  touDivNm?: string;
  touNum?: string; // 방문자 수 (문자열 float)
}

export interface VisitorAnalyticsSummary {
  areaCode: string;
  areaNm: string;
  signguCode?: string;
  signguNm?: string;
  level: 'metco' | 'locgo'; // 광역지자체 (도시) 또는 기초지자체 (구/시/군)
  baseYm: string; // e.g. "2024-05"
  totalVisitors: number; // 총 방문자 수
  localVisitors: number; // 현지인 수 (touDivCd == '1')
  outsiderVisitors: number; // 외지인 수 (touDivCd == '2')
  foreignerVisitors: number; // 외국인 수 (touDivCd == '3')
  outsiderRatio: number; // 외지인 비율 (%)
  foreignerRatio: number; // 외국인 비율 (%)
}

export interface VisitorApiResponseHeader {
  resultCode: string;
  resultMsg: string;
}

export interface VisitorApiResponseBody {
  items?: {
    item?: VisitorApiItemRaw[] | VisitorApiItemRaw | string;
  } | string;
  numOfRows?: number;
  pageNo?: number;
  totalCount?: number;
}

export interface VisitorApiResponse {
  response?: {
    header?: VisitorApiResponseHeader;
    body?: VisitorApiResponseBody;
  };
}

const DATALAB_API_BASE_URL = 'https://apis.data.go.kr/B551011/DataLabService';

// TourAPI areaCode (1~39) -> DataLab API areaCode (11~52) 매핑
export const TOUR_TO_DATALAB_AREA_MAP: Record<number, { dataLabCode: string; name: string }> = {
  1: { dataLabCode: '11', name: '서울특별시' },
  2: { dataLabCode: '28', name: '인천광역시' },
  3: { dataLabCode: '30', name: '대전광역시' },
  4: { dataLabCode: '27', name: '대구광역시' },
  5: { dataLabCode: '29', name: '광주광역시' },
  6: { dataLabCode: '26', name: '부산광역시' },
  7: { dataLabCode: '31', name: '울산광역시' },
  8: { dataLabCode: '36', name: '세종특별자치시' },
  31: { dataLabCode: '41', name: '경기도' },
  32: { dataLabCode: '51', name: '강원특별자치도' },
  33: { dataLabCode: '43', name: '충청북도' },
  34: { dataLabCode: '44', name: '충청남도' },
  35: { dataLabCode: '52', name: '전북특별자치도' },
  36: { dataLabCode: '46', name: '전라남도' },
  37: { dataLabCode: '47', name: '경상북도' },
  38: { dataLabCode: '48', name: '경상남도' },
  39: { dataLabCode: '50', name: '제주특별자치도' },
};

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

// 메모리 캐시 (Key: "metco_11" 또는 "locgo_종로구")
const visitorDataCache: Record<string, VisitorAnalyticsSummary> = {};

// 주소에서 시/군/구 (예: "종로구", "해운대구", "제주시", "강릉시") 추출 함수
function extractSigunguName(addr?: string): string | null {
  if (!addr || addr.trim() === '') return null;
  const parts = addr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const secondPart = parts[1];
    if (secondPart.endsWith('구') || secondPart.endsWith('시') || secondPart.endsWith('군')) {
      return secondPart;
    }
  }
  return null;
}

export async function fetchRegionalVisitors(
  tourAreaCode: number = 1,
  address?: string
): Promise<VisitorAnalyticsSummary> {
  const areaInfo = TOUR_TO_DATALAB_AREA_MAP[tourAreaCode] || TOUR_TO_DATALAB_AREA_MAP[1];
  const targetDataLabCode = areaInfo.dataLabCode;
  const sigunguNm = extractSigunguName(address);

  // 캐시 키 결정
  const cacheKey = sigunguNm ? `locgo_${sigunguNm}` : `metco_${targetDataLabCode}`;

  // 1. 캐시 확인
  if (visitorDataCache[cacheKey]) {
    return visitorDataCache[cacheKey];
  }

  const serviceKey = getDecodedServiceKey();

  // 2024년 5월 전체 집계 (31일 데이터)
  const startYmd = '20240501';
  const endYmd = '20240531';

  // 시/군/구명이 파싱된 경우 기초 지자체 API (locgoRegnVisitrDDList) 호출 시도
  const endpoint = sigunguNm ? 'locgoRegnVisitrDDList' : 'metcoRegnVisitrDDList';

  const queryParams = new URLSearchParams({
    serviceKey: serviceKey,
    MobileOS: 'ETC',
    MobileApp: 'YAHOStudio',
    _type: 'json',
    numOfRows: '700',
    pageNo: '1',
    startYmd: startYmd,
    endYmd: endYmd,
  });

  const url = `${DATALAB_API_BASE_URL}/${endpoint}?${queryParams.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`방문자 데이터 네트워크 오류: ${errorMsg}`);
  }

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      // 무시
    }
    throw new Error(`방문자 데이터 HTTP 오류 (${response.status})${errorBody ? ` - ${errorBody}` : ''}`);
  }

  let data: VisitorApiResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error('방문자 데이터를 JSON 파싱하지 못했습니다.');
  }

  const header = data?.response?.header;
  if (header && header.resultCode !== '0000') {
    throw new Error(`방문자 API 오류 (코드: ${header.resultCode}, 메시지: ${header.resultMsg})`);
  }

  const itemsData = data?.response?.body?.items;
  if (!itemsData || typeof itemsData === 'string') {
    throw new Error('방문자 데이터(items)가 비어있습니다.');
  }

  const rawItem = itemsData.item;
  if (!rawItem) {
    throw new Error('방문자 데이터 아이템이 누락되었습니다.');
  }

  let rawList: VisitorApiItemRaw[] = [];
  if (Array.isArray(rawItem)) {
    rawList = rawItem;
  } else if (typeof rawItem === 'object' && rawItem !== null) {
    rawList = [rawItem];
  } else {
    throw new Error('방문자 데이터 형식이 올바르지 않습니다.');
  }

  let areaFilteredList: VisitorApiItemRaw[] = [];
  let isLocgo = false;
  let resolvedAreaName = areaInfo.name;

  if (sigunguNm) {
    areaFilteredList = rawList.filter((item) => item.signguNm === sigunguNm);
    if (areaFilteredList.length > 0) {
      isLocgo = true;
      resolvedAreaName = `${areaInfo.name} ${sigunguNm}`;
    }
  }

  // 기초 지자체 검색 실패 시 광역 지자체로 필터링 (Fallback)
  if (areaFilteredList.length === 0) {
    areaFilteredList = rawList.filter(
      (item) => String(item.areaCode) === targetDataLabCode
    );
  }

  if (areaFilteredList.length === 0) {
    throw new Error(`${areaInfo.name} 지역의 방문자 데이터가 존재하지 않습니다.`);
  }

  let localTotal = 0;
  let outsiderTotal = 0;
  let foreignerTotal = 0;

  areaFilteredList.forEach((item) => {
    const num = parseFloat(item.touNum ?? '0');
    if (isNaN(num)) return;

    if (item.touDivCd === '1') {
      localTotal += num;
    } else if (item.touDivCd === '2') {
      outsiderTotal += num;
    } else if (item.touDivCd === '3') {
      foreignerTotal += num;
    }
  });

  const totalVisitors = Math.round(localTotal + outsiderTotal + foreignerTotal);
  const roundedLocal = Math.round(localTotal);
  const roundedOutsider = Math.round(outsiderTotal);
  const roundedForeigner = Math.round(foreignerTotal);

  const outsiderRatio = totalVisitors > 0 ? Number(((roundedOutsider / totalVisitors) * 100).toFixed(1)) : 0;
  const foreignerRatio = totalVisitors > 0 ? Number(((roundedForeigner / totalVisitors) * 100).toFixed(1)) : 0;

  const summaryResult: VisitorAnalyticsSummary = {
    areaCode: targetDataLabCode,
    areaNm: resolvedAreaName,
    signguCode: areaFilteredList[0]?.signguCode,
    signguNm: isLocgo ? sigunguNm || undefined : undefined,
    level: isLocgo ? 'locgo' : 'metco',
    baseYm: '2024-05',
    totalVisitors: totalVisitors,
    localVisitors: roundedLocal,
    outsiderVisitors: roundedOutsider,
    foreignerVisitors: roundedForeigner,
    outsiderRatio: outsiderRatio,
    foreignerRatio: foreignerRatio,
  };

  // 캐시에 저장
  visitorDataCache[cacheKey] = summaryResult;

  return summaryResult;
}
