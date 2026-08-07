export interface CentralTourSpotItemRaw {
  baseYm?: string; // 기준연월 (예: "202405")
  areaCd?: string; // 광역지역코드 (예: "11")
  areaNm?: string; // 광역지역명 (예: "서울특별시")
  signguCd?: string; // 시군구코드 (예: "11410")
  signguNm?: string; // 시군구명 (예: "서대문구")
  hubTatsCd?: string; // 중심관광지 고유코드
  hubTatsNm?: string; // 중심관광지명 (예: "홍제천폭포마당", "경복궁")
  hubCtgryLclsNm?: string; // 대분류 카테고리 (예: "관광지", "숙박")
  hubCtgryMclsNm?: string; // 중분류 카테고리 (예: "자연관광", "역사관광", "쇼핑")
  hubRank?: string; // 중심관광지 순위 (예: "1", "8")
  mapX?: string; // 경도 좌표 (예: "126.9374867403")
  mapY?: string; // 위도 좌표 (예: "37.5813774915")
  [key: string]: unknown;
}

export interface CentralTourSpotItem {
  baseYm: string;
  areaCd: string;
  areaNm: string;
  signguCd: string;
  signguNm: string;
  hubTatsCd: string;
  hubTatsNm: string;
  hubCtgryLclsNm: string;
  hubCtgryMclsNm: string;
  hubRank: number;
  mapX?: string;
  mapY?: string;
}

export interface CentralTourApiResponseHeader {
  resultCode: string;
  resultMsg: string;
}

export interface CentralTourApiResponseBody {
  items?: {
    item?: CentralTourSpotItemRaw[] | CentralTourSpotItemRaw | string;
  } | string;
  numOfRows?: number;
  pageNo?: number;
  totalCount?: number;
}

export interface CentralTourApiResponse {
  response?: {
    header?: CentralTourApiResponseHeader;
    body?: CentralTourApiResponseBody;
  };
}
