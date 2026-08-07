import {
  TourDemand,
  VisitorStatistics,
  ForeignVisitorRatio,
  TourDiversity,
} from '../types/tourAnalytics';

/**
 * 1. 관광수요(검색량/소비동향) 조회 API
 * - 상태: API 승인 완료 / 실제 연동 미구현
 * - 참고: 현재 UI 및 Opportunity Score에서 사용하지 않음
 */
export async function fetchTourDemand(contentid?: string, keyword?: string): Promise<TourDemand> {
  throw new Error('fetchTourDemand API가 아직 구현되지 않았습니다. (API 승인 완료 / 실제 연동 미구현 - 현재 UI 및 Opportunity Score 미사용)');
}

/**
 * 2. 방문자 통계(방문자수/체류시간) 조회 API
 * - 상태: API 승인 완료 / 실제 연동 미구현
 * - 참고: 현재 UI 및 Opportunity Score에서 사용하지 않음 (대신 src/api/visitorAnalyticsApi.ts 활용)
 */
export async function fetchVisitorStatistics(contentid?: string, areaCode?: string): Promise<VisitorStatistics> {
  throw new Error('fetchVisitorStatistics API가 아직 구현되지 않았습니다. (API 승인 완료 / 실제 연동 미구현 - 현재 UI 및 Opportunity Score 미사용)');
}

/**
 * 3. 외지인/외국인 방문 비율 조회 API
 * - 상태: API 승인 완료 / 실제 연동 미구현
 * - 참고: 현재 UI 및 Opportunity Score에서 사용하지 않음 (대신 src/api/visitorAnalyticsApi.ts 활용)
 */
export async function fetchForeignVisitorRatio(contentid?: string, areaCode?: string): Promise<ForeignVisitorRatio> {
  throw new Error('fetchForeignVisitorRatio API가 아직 구현되지 않았습니다. (API 승인 완료 / 실제 연동 미구현 - 현재 UI 및 Opportunity Score 미사용)');
}

/**
 * 4. 관광 자원 다변화/풍부성 지수 조회 API
 * - 상태: API 승인 완료 / 실제 연동 미구현
 * - 참고: 현재 UI 및 Opportunity Score에서 사용하지 않음 (대신 src/api/relatedTourApi.ts 활용)
 */
export async function fetchTourDiversity(mapx?: string | number, mapy?: string | number): Promise<TourDiversity> {
  throw new Error('fetchTourDiversity API가 아직 구현되지 않았습니다. (API 승인 완료 / 실제 연동 미구현 - 현재 UI 및 Opportunity Score 미사용)');
}
