export interface TourDemand {
  contentid?: string;
  areaCode?: string;
  searchVolume?: number;
  searchVolumeChange?: number;
  demandScore?: number; // 0~100
}

export interface VisitorStatistics {
  contentid?: string;
  areaCode?: string;
  totalVisitors?: number;
  monthlyVisitors?: number;
  visitorGrowthRate?: number; // percentage
  avgStayMinutes?: number;
}

export interface ForeignVisitorRatio {
  contentid?: string;
  areaCode?: string;
  foreignVisitorRatio?: number; // 0~100 percentage
  topCountries?: Array<{ country: string; ratio: number }>;
}

export interface TourDiversity {
  contentid?: string;
  areaCode?: string;
  categoryCount?: number;
  nearbySpotCount?: number;
  diversityScore?: number; // 0~100
}

export interface TourAnalytics {
  demand: TourDemand | null;
  visitorStats: VisitorStatistics | null;
  foreignRatio: ForeignVisitorRatio | null;
  diversity: TourDiversity | null;
}
