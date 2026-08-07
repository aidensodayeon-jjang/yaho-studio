export interface TourTrendItemRaw {
  baseYmd?: string; // 예: "20260807"
  areaCd?: string; // 예: "11"
  areaNm?: string; // 예: "서울특별시"
  signguCd?: string; // 예: "11410"
  signguNm?: string; // 예: "서대문구"
  tAtsNm?: string; // 관광지명 (예: "국립대한민국임시정부기념관", "봉원사(서울)")
  cnctrRate?: string; // 집중률 상대 지수 (0 ~ 100 상대 수치, 예: "49.95")
  [key: string]: unknown;
}

export interface TourTrendDayPoint {
  date: string; // YYYY-MM-DD 또는 YYYYMMDD
  cnctrRate: number; // 0~100 집중률
}

export interface TourSpotTrendSummary {
  spotName: string;
  currentRate: number; // 오늘/첫날 집중률
  maxRate: number; // 향후 30일 최대 집중률
  minRate: number; // 향후 30일 최소 집중률
  avgRate: number; // 향후 30일 평균 집중률
  predictedRate: number; // 30일 후/마지막날 예측 집중률
  changeRate: number; // 증감률 (%)
  trendDirection: 'RISING' | 'STABLE' | 'FALLING'; // 상승/안정/하락 추세
  cnctrGrade: 'HIGH' | 'MEDIUM' | 'LOW'; // 혼잡도/집중도 등급 (70↑ HIGH, 40↑ MEDIUM, 그외 LOW)
  forecastPeriod: string; // 예: "2026.08.07 ~ 2026.09.05 (향후 30일)"
  dataPoints: TourTrendDayPoint[];
}

export interface RegionalTrendSummary {
  areaCd: string;
  areaNm: string;
  signguCd: string;
  signguNm: string;
  avgRegionalRate: number; // 지역 전체 평균 집중률
  matchedSpotTrend: TourSpotTrendSummary | null; // 선택된 관광지 자체 매칭 데이터 (있을 경우)
  topSpotTrend: TourSpotTrendSummary | null; // 지역 대표 관광지 트렌드
  allSpotTrends: TourSpotTrendSummary[];
  isSpotSpecific: boolean; // 선택 관광지 단독 매칭 여부
}

export interface TourTrendApiResponseHeader {
  resultCode: string;
  resultMsg: string;
}

export interface TourTrendApiResponseBody {
  items?: {
    item?: TourTrendItemRaw[] | TourTrendItemRaw | string;
  } | string;
  numOfRows?: number;
  pageNo?: number;
  totalCount?: number;
}

export interface TourTrendApiResponse {
  response?: {
    header?: TourTrendApiResponseHeader;
    body?: TourTrendApiResponseBody;
  };
}
