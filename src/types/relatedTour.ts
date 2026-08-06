export interface RelatedTourSpot {
  contentid: string;
  title: string;
  addr1?: string;
  firstimage?: string;
  mapx?: string;
  mapy?: string;
  contenttypeid: string;
  distance?: number; // 거리 (미터단위 또는 km단위)
  distanceText?: string; // 거리 표시용 텍스트 (예: "1.2km", "800m")
}

export interface FetchRelatedTourSpotsResult {
  spots: RelatedTourSpot[];
  contentId: string;
}
