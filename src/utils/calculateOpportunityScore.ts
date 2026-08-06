import { TourAnalytics } from '../types/tourAnalytics';

export interface OpportunityScoreInput {
  title?: string;
  firstimage?: string;
  overview?: string;
  tel?: string;
  homepage?: string;
  mapx?: string | number;
  mapy?: string | number;
  addr1?: string;
  contenttypeid?: string | number;
  hasOriginalImage?: boolean;
  imageSource?: 'tourApi' | 'placeholder';
}

export interface OpportunityScoreBreakdown {
  dataCompleteness: number; // A. 데이터 완성도 (최대 25점)
  productPotential: number; // B. 관광상품화 가능성 (최대 30점)
  uniqueness: number;       // C. 희소성·차별성 (최대 25점)
  accessibility: number;    // D. 접근성·연계 가능성 (최대 20점)
}

export interface OpportunityScoreResult {
  score: number;
  dataQuality: number; // 데이터 완성도 기반 품질 점수
  analytics: TourAnalytics | null; // 추가 OpenAPI 분석 데이터 (현재 null)
  aiScore: number | null; // 향후 AI 가공 점수 (현재 null)
  totalScore: number; // 최종 통합 점수
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  breakdown: OpportunityScoreBreakdown;
  reasons: string[];
}

export function calculateOpportunityScore(item: OpportunityScoreInput): OpportunityScoreResult {
  const title = (item.title || '').trim();
  const overview = (item.overview || '').trim();
  const addr1 = (item.addr1 || '').trim();
  const tel = (item.tel || '').trim();
  const homepage = (item.homepage || '').trim();

  // A. 데이터 완성도 (최대 25점)
  let dataCompleteness = 0;

  const hasOriginalImg = Boolean(
    item.hasOriginalImage ||
    (item.firstimage &&
      item.firstimage.trim() !== '' &&
      !item.firstimage.includes('/images/placeholders/') &&
      !item.firstimage.includes('/images/place/'))
  );

  if (hasOriginalImg) dataCompleteness += 6;

  if (overview.length >= 80) {
    dataCompleteness += 7;
  }

  if (homepage !== '') {
    dataCompleteness += 4;
  }

  if (tel !== '') {
    dataCompleteness += 3;
  }

  const hasCoordinates = Boolean(
    item.mapx && item.mapy && String(item.mapx).trim() !== '' && String(item.mapy).trim() !== '' && String(item.mapx) !== '0' && String(item.mapy) !== '0'
  );
  const hasAddr = addr1 !== '';

  if (hasAddr && hasCoordinates) {
    dataCompleteness += 5;
  }

  dataCompleteness = Math.min(25, dataCompleteness);

  // B. 관광상품화 가능성 (최대 30점)
  let productPotential = 0;
  const typeId = item.contenttypeid ? String(item.contenttypeid) : '';

  switch (typeId) {
    case '15': // 축제/행사
      productPotential += 20;
      break;
    case '25': // 여행코스
      productPotential += 18;
      break;
    case '28': // 레포츠
      productPotential += 17;
      break;
    case '12': // 관광지
      productPotential += 15;
      break;
    case '14': // 문화시설
      productPotential += 13;
      break;
    case '39': // 음식점
      productPotential += 12;
      break;
    case '38': // 쇼핑
      productPotential += 11;
      break;
    case '32': // 숙박
      productPotential += 10;
      break;
    default:
      productPotential += 10;
      break;
  }

  // 추가 키워드 가점: 체험, 투어, 축제, 공연, 야경, 전망대, 둘레길, 전통, 공방, 시장 (키워드당 +2, 최대 +10)
  const productKeywords = ['체험', '투어', '축제', '공연', '야경', '전망대', '둘레길', '전통', '공방', '시장'];
  const fullText = (title + ' ' + overview).toLowerCase();

  let kwAdd = 0;
  for (const kw of productKeywords) {
    if (fullText.includes(kw)) {
      kwAdd += 2;
    }
  }
  kwAdd = Math.min(10, kwAdd);
  productPotential += kwAdd;
  productPotential = Math.min(30, productPotential);

  // C. 희소성·차별성 (최대 25점)
  let uniqueness = 0;
  const lowerTitle = title.toLowerCase();
  const lowerOverview = overview.toLowerCase();
  const combinedText = lowerTitle + ' ' + lowerOverview;

  // 키워드 그룹 1: 역사, 문화재, 전통, 한옥, 궁, 성곽, 사찰 (+5)
  const group1 = ['역사', '문화재', '전통', '한옥', '궁', '성곽', '사찰', '유적'];
  if (group1.some((kw) => combinedText.includes(kw))) {
    uniqueness += 5;
  }

  // 키워드 그룹 2: 자연, 계곡, 폭포, 섬, 해변, 숲, 생태 (+5)
  const group2 = ['자연', '계곡', '폭포', '섬', '해변', '숲', '생태', '산', '공원', '한강'];
  if (group2.some((kw) => combinedText.includes(kw))) {
    uniqueness += 5;
  }

  // 키워드 그룹 3: 야간, 야경, 전망, 포토, 미디어, 체험 (+5)
  const group3 = ['야간', '야경', '전망', '포토', '미디어', '체험', '불꽃', '타워', '랜드마크'];
  if (group3.some((kw) => combinedText.includes(kw))) {
    uniqueness += 5;
  }

  // 지역 고유명이나 특색 설명이 overview 150자 이상이면 +5
  if (overview.length >= 150) {
    uniqueness += 5;
  }

  // 제목이 너무 일반적인 경우 감점 ("공원", "카페", "식당", "호텔", "시장" 단독 또는 매우 짧은 일반명 -5)
  const genericNames = ['공원', '카페', '식당', '호텔', '시장'];
  const isGenericTitle = genericNames.some((gn) => title === gn || title === `${gn} ` || (title.length <= 4 && title.includes(gn)));
  if (isGenericTitle) {
    uniqueness -= 5;
  }

  uniqueness = Math.max(0, Math.min(25, uniqueness));

  // D. 접근성·연계 가능성 (최대 20점)
  let accessibility = 0;

  if (hasAddr) accessibility += 4;
  if (hasCoordinates) accessibility += 4;
  if (tel !== '') accessibility += 2;
  if (homepage !== '') accessibility += 2;

  // 제목 또는 overview에 역, 지하철, 버스, 주차, 도보, 인근, 주변, 연계가 있으면 키워드당 +2 (최대 +8)
  const accessKeywords = ['역', '지하철', '버스', '주차', '도보', '인근', '주변', '연계'];
  let accessKwAdd = 0;
  for (const akw of accessKeywords) {
    if (fullText.includes(akw)) {
      accessKwAdd += 2;
    }
  }
  accessKwAdd = Math.min(8, accessKwAdd);
  accessibility += accessKwAdd;
  accessibility = Math.min(20, accessibility);

  // 영역별 합계 및 0~100 clamp
  const rawScore = dataCompleteness + productPotential + uniqueness + accessibility;
  const score = Math.max(0, Math.min(100, rawScore));

  // 레벨 산정: HIGH(80 이상), MEDIUM(60~79), LOW(59 이하)
  let level: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (score >= 80) {
    level = 'HIGH';
  } else if (score >= 60) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  // 영역별 구체적 이유(reasons) 조합
  const reasons: string[] = [];

  if (productPotential >= 20) {
    reasons.push('축제·체험형 콘텐츠로 관광상품화 가능성이 높음');
  } else if (productPotential >= 15) {
    reasons.push('주요 관광 테마 자원으로 상품 기획 가능성 양호');
  } else {
    reasons.push('단일 시설 위주로 타 체험 요소 연계 필요');
  }

  if (uniqueness >= 15) {
    reasons.push('역사·자연 및 야경 특색이 명확하여 차별화 가능');
  } else if (uniqueness >= 10) {
    reasons.push('지역 고유 특색이 담겨 있어 테마 구성에 유리');
  } else {
    reasons.push('일반적인 상권/시설로 차별화 포인트 보완 필요');
  }

  if (accessibility >= 14) {
    reasons.push('주소/좌표 및 교통 연계 키워드가 확보되어 코스 구성 용이');
  } else {
    reasons.push('위치/교통 정보 보완으로 접근 편의성 확보 권장');
  }

  if (hasOriginalImg && overview.length >= 80) {
    reasons.push('공식 이미지와 풍부한 개요 정보를 갖춘 완성도 높은 데이터');
  } else if (!hasOriginalImg) {
    reasons.push('공식 이미지가 없어 홍보자료 보완이 필요함');
  } else if (overview.length < 80) {
    reasons.push('상세 설명(개요) 정보 보완 권장');
  }

  return {
    score,
    dataQuality: dataCompleteness,
    analytics: null,
    aiScore: null,
    totalScore: score,
    level,
    breakdown: {
      dataCompleteness,
      productPotential,
      uniqueness,
      accessibility,
    },
    reasons,
  };
}
