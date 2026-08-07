import {
  TourTrendApiResponse,
  TourTrendItemRaw,
  TourSpotTrendSummary,
  RegionalTrendSummary,
} from '../types/tourTrend';
import { TOUR_TO_DATALAB_AREA_MAP } from './visitorAnalyticsApi';

const TREND_API_BASE_URL = 'https://apis.data.go.kr/B551011/TatsCnctrRateService';

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
  해운대구: '26350',
  부산진구: '26230',
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

// 메모리 캐시 (Key: "trend_11410")
const tourTrendCache: Record<string, RegionalTrendSummary> = {};

export async function fetchTourTrend(
  tourAreaCode: number = 1,
  address?: string,
  spotTitle?: string
): Promise<RegionalTrendSummary> {
  let targetAreaCd = '11';
  let targetSignguCd = '11410';
  let resolvedSignguName = '서대문구';

  const sigunguInfo = extractSigunguCode(address);
  if (sigunguInfo) {
    targetAreaCd = sigunguInfo.areaCd;
    targetSignguCd = sigunguInfo.signguCd;
    resolvedSignguName = sigunguInfo.name;
  } else {
    const areaInfo = TOUR_TO_DATALAB_AREA_MAP[tourAreaCode] || TOUR_TO_DATALAB_AREA_MAP[1];
    targetAreaCd = areaInfo.dataLabCode;
    if (targetAreaCd === '11') targetSignguCd = '11410';
    else if (targetAreaCd === '26') targetSignguCd = '26350';
    else if (targetAreaCd === '50') targetSignguCd = '50110';
    else targetSignguCd = `${targetAreaCd}110`;
  }

  const cacheKey = `trend_${targetSignguCd}_${(spotTitle || '').trim()}`;
  if (tourTrendCache[cacheKey]) {
    return tourTrendCache[cacheKey];
  }

  const serviceKey = getDecodedServiceKey();

  const queryParams = new URLSearchParams({
    serviceKey: serviceKey,
    MobileOS: 'ETC',
    MobileApp: 'YAHOStudio',
    _type: 'json',
    numOfRows: '100',
    pageNo: '1',
    areaCd: targetAreaCd,
    signguCd: targetSignguCd,
  });

  const url = `${TREND_API_BASE_URL}/tatsCnctrRatedList?${queryParams.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`관광 트렌드 네트워크 오류: ${errorMsg}`);
  }

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      // 무시
    }
    throw new Error(`관광 트렌드 HTTP 오류 (${response.status})${errorBody ? ` - ${errorBody}` : ''}`);
  }

  let data: TourTrendApiResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error('관광 트렌드 응답 데이터를 JSON 형태로 파싱하지 못했습니다.');
  }

  const header = data?.response?.header;
  if (header && header.resultCode !== '0000') {
    throw new Error(`관광 트렌드 API 오류 (코드: ${header.resultCode}, 메시지: ${header.resultMsg})`);
  }

  const itemsData = data?.response?.body?.items;
  if (!itemsData || typeof itemsData === 'string') {
    const emptyResult: RegionalTrendSummary = {
      areaCd: targetAreaCd,
      areaNm: '',
      signguCd: targetSignguCd,
      signguNm: resolvedSignguName,
      avgRegionalRate: 0,
      matchedSpotTrend: null,
      topSpotTrend: null,
      allSpotTrends: [],
      isSpotSpecific: false,
    };
    return emptyResult;
  }

  const rawItem = itemsData.item;
  if (!rawItem) {
    const emptyResult: RegionalTrendSummary = {
      areaCd: targetAreaCd,
      areaNm: '',
      signguCd: targetSignguCd,
      signguNm: resolvedSignguName,
      avgRegionalRate: 0,
      matchedSpotTrend: null,
      topSpotTrend: null,
      allSpotTrends: [],
      isSpotSpecific: false,
    };
    return emptyResult;
  }

  let rawList: TourTrendItemRaw[] = [];
  if (Array.isArray(rawItem)) {
    rawList = rawItem;
  } else if (typeof rawItem === 'object' && rawItem !== null) {
    rawList = [rawItem];
  }

  // 관광지별 그룹핑
  const spotsMap = new Map<string, TourTrendItemRaw[]>();
  let areaNm = '';
  let signguNm = resolvedSignguName;

  rawList.forEach((it) => {
    if (it.areaNm) areaNm = String(it.areaNm);
    if (it.signguNm) signguNm = String(it.signguNm);
    const spotName = String(it.tAtsNm || '관광지').trim();
    if (!spotsMap.has(spotName)) {
      spotsMap.set(spotName, []);
    }
    spotsMap.get(spotName)!.push(it);
  });

  const allSpotTrends: TourSpotTrendSummary[] = [];

  spotsMap.forEach((items, spotName) => {
    items.sort((a, b) => String(a.baseYmd || '').localeCompare(String(b.baseYmd || '')));

    const dataPoints = items.map((it) => ({
      date: String(it.baseYmd || ''),
      cnctrRate: parseFloat(String(it.cnctrRate || '0')),
    }));

    const rates = dataPoints.map((d) => d.cnctrRate);
    const currentRate = rates[0] || 0;
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);
    const avgRate = rates.reduce((acc, c) => acc + c, 0) / (rates.length || 1);
    const predictedRate = rates[rates.length - 1] || currentRate;

    const changeRate = currentRate > 0 ? ((predictedRate - currentRate) / currentRate) * 100 : 0;

    let trendDirection: 'RISING' | 'STABLE' | 'FALLING' = 'STABLE';
    if (changeRate >= 5.0) trendDirection = 'RISING';
    else if (changeRate <= -5.0) trendDirection = 'FALLING';

    let cnctrGrade: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (avgRate >= 60) cnctrGrade = 'HIGH';
    else if (avgRate >= 35) cnctrGrade = 'MEDIUM';

    const startDateStr = dataPoints[0]?.date ? `${dataPoints[0].date.slice(0,4)}.${dataPoints[0].date.slice(4,6)}.${dataPoints[0].date.slice(6,8)}` : '';
    const endDateStr = dataPoints[dataPoints.length - 1]?.date ? `${dataPoints[dataPoints.length - 1].date.slice(0,4)}.${dataPoints[dataPoints.length - 1].date.slice(4,6)}.${dataPoints[dataPoints.length - 1].date.slice(6,8)}` : '';

    allSpotTrends.push({
      spotName,
      currentRate: parseFloat(currentRate.toFixed(2)),
      maxRate: parseFloat(maxRate.toFixed(2)),
      minRate: parseFloat(minRate.toFixed(2)),
      avgRate: parseFloat(avgRate.toFixed(2)),
      predictedRate: parseFloat(predictedRate.toFixed(2)),
      changeRate: parseFloat(changeRate.toFixed(2)),
      trendDirection,
      cnctrGrade,
      forecastPeriod: `${startDateStr} ~ ${endDateStr} (향후 30일)`,
      dataPoints,
    });
  });

  const totalRegionalAvg = allSpotTrends.reduce((acc, cur) => acc + cur.avgRate, 0) / (allSpotTrends.length || 1);

  // 선택 관광지 매칭 시도
  let matchedSpotTrend: TourSpotTrendSummary | null = null;
  if (spotTitle && spotTitle.trim() !== '') {
    const cleanTitle = spotTitle.trim().replace(/\s+/g, '');
    matchedSpotTrend = allSpotTrends.find((st) => {
      const cleanSpot = st.spotName.trim().replace(/\s+/g, '');
      return (
        cleanSpot.includes(cleanTitle) ||
        cleanTitle.includes(cleanSpot) ||
        (cleanTitle.includes('홍제') && cleanSpot.includes('홍제'))
      );
    }) || null;
  }

  const topSpotTrend = allSpotTrends.length > 0 ? allSpotTrends[0] : null;

  const resultSummary: RegionalTrendSummary = {
    areaCd: targetAreaCd,
    areaNm,
    signguCd: targetSignguCd,
    signguNm,
    avgRegionalRate: parseFloat(totalRegionalAvg.toFixed(2)),
    matchedSpotTrend,
    topSpotTrend,
    allSpotTrends,
    isSpotSpecific: Boolean(matchedSpotTrend),
  };

  tourTrendCache[cacheKey] = resultSummary;
  return resultSummary;
}
