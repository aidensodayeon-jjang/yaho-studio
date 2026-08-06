export interface TourSpotItem {
  contentid: string;
  title: string;
  addr1: string;
  firstimage?: string;
  mapx?: string;
  mapy?: string;
  contenttypeid: string;
}

export interface TourDetailItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1?: string;
  addr2?: string;
  tel?: string;
  homepage?: string;
  overview?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
  zipcode?: string;
}

export interface TourApiResponseHeader {
  resultCode: string;
  resultMsg: string;
}

export interface TourApiResponseItemRaw {
  contentid?: string;
  contenttypeid?: string;
  title?: string;
  addr1?: string;
  addr2?: string;
  tel?: string;
  homepage?: string;
  overview?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
  zipcode?: string;
  [key: string]: unknown;
}

export interface TourApiResponseBody {
  items?: {
    item?: TourApiResponseItemRaw[] | TourApiResponseItemRaw | string;
  } | string;
  numOfRows?: number;
  pageNo?: number;
  totalCount?: number;
}

export interface TourApiResponse {
  response?: {
    header?: TourApiResponseHeader;
    body?: TourApiResponseBody;
  };
}

export interface FetchTourSpotsResult {
  spots: TourSpotItem[];
  isNationwideFallback: boolean;
}

const TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

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

async function requestTourApi(
  operation: string,
  paramsObj: Record<string, string>
): Promise<TourSpotItem[]> {
  const queryParams = new URLSearchParams(paramsObj);
  const url = `${TOUR_API_BASE_URL}/${operation}?${queryParams.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`네트워크 오류가 발생하였습니다: ${errorMsg}`);
  }

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      // 무시
    }
    throw new Error(`HTTP 오류가 발생하였습니다. (상태 코드: ${response.status} ${response.statusText})${errorBody ? ` - 본문: ${errorBody}` : ''}`);
  }

  let data: TourApiResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error('응답 데이터를 JSON 형태로 파싱하지 못했습니다.');
  }

  const header = data?.response?.header;
  if (header && header.resultCode !== '0000') {
    throw new Error(`API 오류가 발생하였습니다. (코드: ${header.resultCode}, 메시지: ${header.resultMsg})`);
  }

  const itemsData = data?.response?.body?.items;
  if (!itemsData || typeof itemsData === 'string') {
    return [];
  }

  const rawItem = itemsData.item;
  if (!rawItem) {
    return [];
  }

  let rawList: TourApiResponseItemRaw[] = [];
  if (Array.isArray(rawItem)) {
    rawList = rawItem;
  } else if (typeof rawItem === 'object' && rawItem !== null) {
    rawList = [rawItem];
  } else {
    return [];
  }

  return rawList.map((item) => ({
    contentid: String(item.contentid ?? ''),
    title: String(item.title ?? ''),
    addr1: String(item.addr1 ?? ''),
    firstimage: item.firstimage ? String(item.firstimage) : undefined,
    mapx: item.mapx ? String(item.mapx) : undefined,
    mapy: item.mapy ? String(item.mapy) : undefined,
    contenttypeid: String(item.contenttypeid ?? ''),
  }));
}

export async function fetchTourSpots(
  areaCode?: number,
  contentTypeId?: number,
  keyword?: string
): Promise<FetchTourSpotsResult> {
  const serviceKey = getDecodedServiceKey();
  const trimmedKeyword = keyword?.trim();

  // 기본 공통 파라미터
  const baseParams: Record<string, string> = {
    serviceKey: serviceKey,
    numOfRows: '10',
    pageNo: '1',
    MobileOS: 'ETC',
    MobileApp: 'YAHOStudio',
    _type: 'json',
  };

  // 키워드가 없는 경우: areaBasedList2 호출
  if (!trimmedKeyword || trimmedKeyword === '') {
    const params: Record<string, string> = { ...baseParams, arrange: 'A' };
    if (areaCode && areaCode > 0) {
      params.areaCode = String(areaCode);
    }
    if (contentTypeId && contentTypeId > 0) {
      params.contentTypeId = String(contentTypeId);
    }

    const spots = await requestTourApi('areaBasedList2', params);
    return { spots, isNationwideFallback: false };
  }

  // 키워드가 있는 경우: 3단계 검색 전략
  // 1차 검색: 현재 선택된 areaCode + contentTypeId 적용
  const firstParams: Record<string, string> = { ...baseParams, keyword: trimmedKeyword };
  if (areaCode && areaCode > 0) {
    firstParams.areaCode = String(areaCode);
  }
  if (contentTypeId && contentTypeId > 0) {
    firstParams.contentTypeId = String(contentTypeId);
  }

  const firstSpots = await requestTourApi('searchKeyword2', firstParams);
  // 1차 결과에서 대표 명소(예: 경복궁 자체)가 아닌 하위 매장만 나오는 경우 대비
  const hasExactTitle = firstSpots.some(s => s.title === trimmedKeyword);
  if (firstSpots.length > 0 && hasExactTitle) {
    return { spots: firstSpots, isNationwideFallback: false };
  }

  // 2차 검색: 해당 지역(areaCode) 내 키워드 검색 (contentTypeId 제약 해제)
  if (areaCode && areaCode > 0) {
    const secondParams: Record<string, string> = {
      ...baseParams,
      keyword: trimmedKeyword,
      areaCode: String(areaCode),
    };
    const secondSpots = await requestTourApi('searchKeyword2', secondParams);
    const hasExactTitleInSecond = secondSpots.some(s => s.title === trimmedKeyword);
    if (secondSpots.length > 0 && hasExactTitleInSecond) {
      return { spots: secondSpots, isNationwideFallback: false };
    }
  }

  // 3차 검색: 전국 통합 검색 (한국관광공사 DB상 areacode가 누락된 주요 대표 명소 포함)
  const thirdSpots = await requestTourApi('searchKeyword2', {
    ...baseParams,
    keyword: trimmedKeyword,
  });

  if (thirdSpots.length > 0) {
    // 3차 검색 결과에서 제목 정확도가 높은 아이템(예: "경복궁")을 상단에 정렬
    thirdSpots.sort((a, b) => {
      if (a.title === trimmedKeyword) return -1;
      if (b.title === trimmedKeyword) return 1;
      return 0;
    });

    // 만약 1차 결과가 원래 존재했었다면 완전 fallback 경고 문구를 띄우지 않고 자연스럽게 통합 결과를 보여줌
    return {
      spots: thirdSpots,
      isNationwideFallback: areaCode !== 1 && areaCode !== undefined,
    };
  }

  // 결과가 없는 경우 1차 결과가 있었다면 1차 결과 반환
  if (firstSpots.length > 0) {
    return { spots: firstSpots, isNationwideFallback: false };
  }

  return { spots: [], isNationwideFallback: false };
}

export async function fetchTourSpotsByArea(areaCode: number = 1): Promise<TourSpotItem[]> {
  const res = await fetchTourSpots(areaCode);
  return res.spots;
}

export async function fetchSeoulTourSpots(): Promise<TourSpotItem[]> {
  const res = await fetchTourSpots(1);
  return res.spots;
}

export async function fetchTourDetail(
  contentId: string,
  contentTypeId?: string
): Promise<TourDetailItem> {
  if (!contentId || contentId.trim() === '') {
    throw new Error('contentId가 지정되지 않았습니다.');
  }

  const serviceKey = getDecodedServiceKey();

  const paramsObj: Record<string, string> = {
    serviceKey: serviceKey,
    MobileOS: 'ETC',
    MobileApp: 'YAHOStudio',
    _type: 'json',
    contentId: contentId.trim(),
    defaultYN: 'Y',
    firstImageYN: 'Y',
    areacodeYN: 'Y',
    catcodeYN: 'Y',
    addrinfoYN: 'Y',
    mapinfoYN: 'Y',
    overviewYN: 'Y',
  };

  if (contentTypeId && contentTypeId.trim() !== '') {
    paramsObj.contentTypeId = contentTypeId.trim();
  }

  const queryParams = new URLSearchParams(paramsObj);
  const url = `${TOUR_API_BASE_URL}/detailCommon2?${queryParams.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`네트워크 오류가 발생하였습니다: ${errorMsg}`);
  }

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      // 본문 읽기 실패 시 무시
    }
    throw new Error(`HTTP 오류가 발생하였습니다. (상태 코드: ${response.status} ${response.statusText})${errorBody ? ` - 본문: ${errorBody}` : ''}`);
  }

  let data: TourApiResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error('응답 데이터를 JSON 형태로 파싱하지 못했습니다.');
  }

  const header = data?.response?.header;
  if (header && header.resultCode !== '0000') {
    throw new Error(`API 오류가 발생하였습니다. (코드: ${header.resultCode}, 메시지: ${header.resultMsg})`);
  }

  const itemsData = data?.response?.body?.items;
  let detailObj: TourApiResponseItemRaw = {};

  if (itemsData && typeof itemsData === 'object') {
    const rawItem = itemsData.item;
    if (Array.isArray(rawItem) && rawItem.length > 0) {
      detailObj = rawItem[0];
    } else if (typeof rawItem === 'object' && rawItem !== null) {
      detailObj = rawItem as TourApiResponseItemRaw;
    }
  }

  return {
    contentid: String(detailObj.contentid ?? contentId),
    contenttypeid: String(detailObj.contenttypeid ?? contentTypeId ?? ''),
    title: String(detailObj.title ?? ''),
    addr1: detailObj.addr1 ? String(detailObj.addr1) : undefined,
    addr2: detailObj.addr2 ? String(detailObj.addr2) : undefined,
    tel: detailObj.tel ? String(detailObj.tel) : undefined,
    homepage: detailObj.homepage ? String(detailObj.homepage) : undefined,
    overview: detailObj.overview ? String(detailObj.overview) : undefined,
    firstimage: detailObj.firstimage ? String(detailObj.firstimage) : undefined,
    firstimage2: detailObj.firstimage2 ? String(detailObj.firstimage2) : undefined,
    mapx: detailObj.mapx ? String(detailObj.mapx) : undefined,
    mapy: detailObj.mapy ? String(detailObj.mapy) : undefined,
    zipcode: detailObj.zipcode ? String(detailObj.zipcode) : undefined,
  };
}
