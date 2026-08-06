import {
  TourDemand,
  VisitorStatistics,
  ForeignVisitorRatio,
  TourDiversity,
} from '../types/tourAnalytics';

/**
 * 1. 관광수요(검색량/소비동향) 조회 API
 * TODO:
 * - API URL: https://apis.data.go.kr/B551011/DataLabService/searchKeyword (관광공사 투어빅데이터 랩 OpenAPI)
 * - 필요 파라미터: serviceKey, MobileOS, MobileApp, _type, keyword, startDate, endDate
 * - 반환값: Promise<TourDemand>
 */
export async function fetchTourDemand(contentid?: string, keyword?: string): Promise<TourDemand> {
  throw new Error('fetchTourDemand API가 아직 구현되지 않았습니다. (TODO: 한국관광공사 데이터랩 API 연동 준비 중)');
}

/**
 * 2. 방문자 통계(방문자수/체류시간) 조회 API
 * TODO:
 * - API URL: https://apis.data.go.kr/B551011/DataLabService/metraveler (관광공사 광역/기초지자체 방문자 통계 API)
 * - 필요 파라미터: serviceKey, MobileOS, MobileApp, _type, areaCode, signguCode, startYm, endYm
 * - 반환값: Promise<VisitorStatistics>
 */
export async function fetchVisitorStatistics(contentid?: string, areaCode?: string): Promise<VisitorStatistics> {
  throw new Error('fetchVisitorStatistics API가 아직 구현되지 않았습니다. (TODO: 한국관광공사 지자체 방문자 통계 API 연동 준비 중)');
}

/**
 * 3. 외지인/외국인 방문 비율 조회 API
 * TODO:
 * - API URL: https://apis.data.go.kr/B551011/DataLabService/locgoRevisiteRate (외국인 관광객/외지인 방문 비율 API)
 * - 필요 파라미터: serviceKey, MobileOS, MobileApp, _type, areaCode, year
 * - 반환값: Promise<ForeignVisitorRatio>
 */
export async function fetchForeignVisitorRatio(contentid?: string, areaCode?: string): Promise<ForeignVisitorRatio> {
  throw new Error('fetchForeignVisitorRatio API가 아직 구현되지 않았습니다. (TODO: 한국관광공사 외국인 방문 비율 API 연동 준비 중)');
}

/**
 * 4. 관광 자원 다변화/풍부성 지수 조회 API
 * TODO:
 * - API URL: https://apis.data.go.kr/B551011/KorService2/locationBasedList2 (위치기반 주변 관광자원 검색 API)
 * - 필요 파라미터: serviceKey, MobileOS, MobileApp, _type, mapX, mapY, radius
 * - 반환값: Promise<TourDiversity>
 */
export async function fetchTourDiversity(mapx?: string | number, mapy?: string | number): Promise<TourDiversity> {
  throw new Error('fetchTourDiversity API가 아직 구현되지 않았습니다. (TODO: 위치 기반 주변 관광자원 다양성 API 연동 준비 중)');
}
