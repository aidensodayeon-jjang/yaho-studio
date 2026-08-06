export interface TourSpotItem {
  contentid: string;
  title: string;
  addr1: string;
  firstimage?: string;
  mapx?: string;
  mapy?: string;
  contenttypeid: string;
}

export interface TourApiResponseHeader {
  resultCode: string;
  resultMsg: string;
}

export interface TourApiResponseItemRaw {
  contentid?: string;
  title?: string;
  addr1?: string;
  firstimage?: string;
  mapx?: string;
  mapy?: string;
  contenttypeid?: string;
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

const TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

export async function fetchTourSpotsByArea(areaCode: number = 1): Promise<TourSpotItem[]> {
  const rawServiceKey = import.meta.env.VITE_TOUR_API_KEY?.trim();

  if (!rawServiceKey) {
    throw new Error('인증키가 설정되지 않았습니다. .env.local 파일의 VITE_TOUR_API_KEY를 확인해주세요.');
  }

  let serviceKey = rawServiceKey;
  try {
    serviceKey = decodeURIComponent(rawServiceKey);
  } catch {
    // 디코딩 실패 시 원래 값 유지
  }

  const queryParams = new URLSearchParams({
    serviceKey: serviceKey,
    numOfRows: '10',
    pageNo: '1',
    MobileOS: 'ETC',
    MobileApp: 'YAHOStudio',
    _type: 'json',
    areaCode: String(areaCode),
    arrange: 'A',
  });

  const url = `${TOUR_API_BASE_URL}/areaBasedList2?${queryParams.toString()}`;

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
  if (!itemsData || typeof itemsData === 'string') {
    throw new Error('응답 데이터에 관광지 목록(items)이 누락되었거나 존재하지 않습니다.');
  }

  const rawItem = itemsData.item;
  if (!rawItem) {
    throw new Error('응답 데이터에 관광지 아이템(item)이 누락되었습니다.');
  }

  let rawList: TourApiResponseItemRaw[] = [];
  if (Array.isArray(rawItem)) {
    rawList = rawItem;
  } else if (typeof rawItem === 'object' && rawItem !== null) {
    rawList = [rawItem];
  } else {
    throw new Error('올바르지 않은 item 데이터 형식입니다.');
  }

  const spotList: TourSpotItem[] = rawList.map((item) => ({
    contentid: String(item.contentid ?? ''),
    title: String(item.title ?? ''),
    addr1: String(item.addr1 ?? ''),
    firstimage: item.firstimage ? String(item.firstimage) : undefined,
    mapx: item.mapx ? String(item.mapx) : undefined,
    mapy: item.mapy ? String(item.mapy) : undefined,
    contenttypeid: String(item.contenttypeid ?? ''),
  }));

  return spotList;
}

export async function fetchSeoulTourSpots(): Promise<TourSpotItem[]> {
  return fetchTourSpotsByArea(1);
}
