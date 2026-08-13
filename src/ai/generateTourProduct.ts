import { VisitorAnalyticsSummary } from '../api/visitorAnalyticsApi';
import { RelatedTourSpot } from '../types/relatedTour';
import { OpportunityScoreBreakdown } from '../utils/calculateOpportunityScore';
import { AIAnalysisResult } from './analyzeOpportunity';

export interface CourseStep {
  order: number;
  placeName: string;
  description: string;
}

export interface ItineraryStep {
  day: string;
  spots: string[];
  desc: string;
}

export interface TourProductResult {
  productName: string;
  concept?: string;
  targetCustomers?: string[];
  duration: string;
  transportation?: string;
  estimatedPrice?: string;
  opportunityReason?: string;
  differentiation?: string;
  itinerary?: ItineraryStep[];
  expectedEffect?: string;
  oneLineIntro: string;
  targetCustomer: string;
  recommendedSeason: string;
  course: CourseStep[];
  keyExperience: string[];
  operationPlan: string;
  priceGuide: string;
  marketingPoints: string[];
  snsCopy: string;
  hashtags: string[];
  cautions: string[];
  sourceNote: string;
  generatedBy: 'gemini' | 'rule';
}

export interface ProductIdea {
  title: string;
  oneLineConcept: string;
  target: string;
  reason: string;
  tags: string[];
}

export interface TourProductInput {
  contentid?: string;
  title?: string;
  addr1?: string;
  contenttypeid?: string | number;
  overview?: string;
  score?: number;
  scoreBreakdown?: OpportunityScoreBreakdown;
  aiAnalysis?: AIAnalysisResult | null;
  relatedSpots?: RelatedTourSpot[];
  visitorData?: VisitorAnalyticsSummary | null;
  centralTourSpots?: string[];
  isCurrentSpotCentral?: boolean;
  currentSpotRank?: number | null;
  trendDirection?: 'RISING' | 'STABLE' | 'FALLING';
  trendChangeRate?: number;
  hasOriginalImage?: boolean;
  selectedIdea?: ProductIdea | null;
  // User-specified generation constraints (⑤ settings)
  userTarget?: string;
  userBudget?: string;
  userDuration?: string;
}

// 메모리 캐시 저장소 (Key: contentid 또는 title)
const tourProductCache = new Map<string, TourProductResult>();
const productIdeasCache = new Map<string, ProductIdea[]>();

/**
 * 0. AI 관광상품 아이디어 3개 생성 함수
 */
export async function generateProductIdeas(input: TourProductInput): Promise<ProductIdea[]> {
  const cacheKey = [
    input.contentid || input.title || 'default',
    input.userTarget || '',
    input.userBudget || '',
    input.userDuration || '',
  ].join('|') + '-ideas';
  if (productIdeasCache.has(cacheKey)) {
    return productIdeasCache.get(cacheKey)!;
  }

  const title = input.title || '관광지';
  const overview = input.overview || '';

  try {
    const response = await fetch('/api/generate-tour-product-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (response.ok) {
      const resJson = await response.json();
      if (resJson.success && Array.isArray(resJson.data) && resJson.data.length >= 3) {
        const ideas = resJson.data.slice(0, 3).map((item: any) => ({
          title: String(item.title || `${title} 로컬 투어`),
          oneLineConcept: String(item.oneLineConcept || `${title}와 주변 명소를 연결하는 콤보 코스`),
          target: String(item.target || '2030 자유여행객'),
          reason: String(item.reason || '방문 수요 및 연계 성장 가능성 우수'),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : ['#로컬관광', '#인기스팟', '#체험'],
        }));
        productIdeasCache.set(cacheKey, ideas);
        return ideas;
      }
    }
  } catch {
    // ignore
  }

  // Fallback Rule-Based Ideas 3종
  const fallbackIdeas: ProductIdea[] = [
    {
      title: `${title} NIGHT WALK`,
      oneLineConcept: `${title} 야간 경관과 주변 로컬 상권을 연결하는 야간 도보 프로그램`,
      target: '2030 직장인 & 연인',
      reason: '최근 야간 관광 수요 및 SNS 시각적 언급량이 매우 우수함',
      tags: ['#야간관광', '#로컬상권', '#2030'],
    },
    {
      title: `${title} 가족 미션 어드벤처`,
      oneLineConcept: `가족이 ${title} 주변을 이동하며 미션을 수행하는 체험형 관광상품`,
      target: '가족 단위 주말 여행객',
      reason: '체류시간 증대 효과가 크며 체험형 콘텐츠 결합에 적합함',
      tags: ['#가족여행', '#체험관광', '#주말'],
    },
    {
      title: `${title} LOCAL TASTE`,
      oneLineConcept: `${title} 산책과 지역 카페·음식점을 연결한 반일 로컬 미식 프로그램`,
      target: '식도락 & 미식 여행객',
      reason: '주변 상권 경제 활성화 및 맛집 연계 소비 유도',
      tags: ['#미식관광', '#카페', '#로컬'],
    },
  ];

  productIdeasCache.set(cacheKey, fallbackIdeas);
  return fallbackIdeas;
}

/**
 * 1. Rule-Based 관광상품 기획 생성 함수
 */
export function generateRuleBasedTourProduct(input: TourProductInput): TourProductResult {
  const title = (input.title || '관광지').trim();
  const overview = (input.overview || '').trim();
  const typeId = input.contenttypeid ? String(input.contenttypeid) : '';
  const fullText = (title + ' ' + overview).toLowerCase();
  const areaName = input.visitorData?.areaNm || '해당 지역';

  // 상품명 및 유형 파악
  let productName = `${title} 로컬 콤보 투어`;
  let oneLineIntro = `${title}와 주변 주요 명소를 알차게 둘러보는 프리미엄 로컬 가이드 투어`;
  let duration = '약 3 ~ 4시간 (반일 코스)';
  let recommendedSeason = '사계절 (봄/가을 집중 추천)';
  let priceGuide = '권장 가격대: 1인당 35,000원 ~ 49,000원 (가이드비 및 음료 포함)';

  if (typeId === '12' || fullText.includes('역사') || fullText.includes('궁') || fullText.includes('문화재')) {
    productName = `${title} 역사 감성 반일 투어`;
    oneLineIntro = `전문 설명과 함께 즐기는 ${title} 및 주변 역사 문화 명소 도보 탐방`;
    duration = '약 3시간 (오전/오후 선택)';
    priceGuide = '권장 가격대: 1인당 30,000원 ~ 45,000원 (해설 및 개방 티켓 포함)';
  } else if (typeId === '39' || fullText.includes('시장') || fullText.includes('음식') || fullText.includes('맛집')) {
    productName = `${title} 미식 & 식도락 스트리트 투어`;
    oneLineIntro = `${title}의 대표 먹거리와 로컬 맛집을 잇는 식도락 가이드 코스`;
    duration = '약 2.5시간';
    recommendedSeason = '사계절 내내';
    priceGuide = '권장 가격대: 1인당 40,000원 ~ 55,000원 (시식권 포함)';
  } else if (typeId === '28' || fullText.includes('자연') || fullText.includes('산') || fullText.includes('숲') || fullText.includes('폭포') || fullText.includes('계곡')) {
    productName = `${title} 웰니스 힐링 트레킹 투어`;
    oneLineIntro = `${title}의 사계절 자연과 산책로를 걸으며 만나는 상쾌한 웰니스 투어`;
    duration = '약 3.5시간';
    recommendedSeason = '봄 ~ 가을';
    priceGuide = '권장 가격대: 1인당 25,000원 ~ 38,000원';
  } else if (typeId === '15' || fullText.includes('축제') || fullText.includes('행사')) {
    productName = `${title} 시즌 페스티벌 특별 패키지`;
    oneLineIntro = `축제 현장 전용 도크와 시그니처 이벤트를 동시 체험하는 시즌 한정 코스`;
    duration = '약 4시간';
    recommendedSeason = '축제 및 행사이벤트 개최 시즌';
    priceGuide = '권장 가격대: 1인당 45,000원 ~ 60,000원';
  }

  // 코스 구성 (실제 연관 관광지 API 결과만 활용!)
  const course: CourseStep[] = [];
  course.push({
    order: 1,
    placeName: title,
    description: `메인 방문지로서 ${title}의 핵심 경관을 탐방하고 역사 및 콘텐츠 해설 진행`,
  });

  const validRelated = (input.relatedSpots || []).slice(0, 4);
  validRelated.forEach((spot, idx) => {
    course.push({
      order: idx + 2,
      placeName: spot.title,
      description: `연계 관광지인 ${spot.title}로 이동하여 주변 로컬 볼거리 탐방 및 자유시간 부여`,
    });
  });

  if (course.length === 1) {
    course.push({
      order: 2,
      placeName: `${title} 로컬 하이라이트 구간`,
      description: `${title} 단독 체험형 깊이 보기 및 포토존 자유 탐방`,
    });
  }

  const keyExperience: string[] = [
    `${title} 전문 가이드 스토리스토리텔링`,
    `연계 추천 스팟 연계 콤보 도보 동선`,
    `인증샷 명소 포토스팟 가이드`,
  ];

  const targetCustomer = input.aiAnalysis?.recommendedTarget || '2030 트렌디 여행객 및 소규모 자유 여행객(FIT)';
  const operationPlan = `소규모 그룹(최대 15인)으로 운용하며 전용 로컬 가이드 1인이 동행합니다. 주말 및 휴일 사전 예약제로 운영하는 것이 유리합니다.`;
  const marketingPoints = [
    `${areaName} 지역 유동 인프라를 연계한 동선 구성`,
    `TourAPI 실증 데이터 기반의 검증된 스팟 콤보 구성`,
    `자유 여행객(FIT) 맞춤형 가성비 콤보 패키지`,
  ];

  const snsCopy = `📍 [${title}] 아직도 모르는 사람이 있다고? 숨겨진 핫플부터 근처 알짜 명소까지 한번에 싹- 도는 꿀코스 공개! 📸`;
  const hashtags = [
    `#${title.replace(/\s+/g, '')}`,
    `#${areaName.replace(/\s+/g, '')}여행`,
    `#YAHO추천코스`,
    `#로컬투어`,
  ];

  const cautions = [
    '본 기획안은 한국관광공사 OpenAPI 데이터 및 현장 지표 기반의 1차 초안입니다.',
    '실제 투어 진행 전 동선 실측 및 개방 시간 사전 확인이 필요합니다.',
    '현지 입장료 및 교통비 변동 시 권장 가격 조정이 필요합니다.',
  ];

  return {
    productName,
    oneLineIntro,
    targetCustomer,
    recommendedSeason,
    duration,
    course,
    keyExperience,
    operationPlan,
    priceGuide,
    marketingPoints,
    snsCopy,
    hashtags,
    cautions,
    sourceNote: 'TourAPI & 빅데이터 실증 데이터 기반 룰베이스 상품기획안',
    generatedBy: 'rule',
  };
}

/**
 * 2. 서버 백엔드 API (/api/generate-tour-product) 호출 함수
 */
export async function generateTourProduct(input: TourProductInput): Promise<TourProductResult> {
  // Cache key includes the selected idea AND user settings, so choosing a
  // different idea or changing target/budget/duration regenerates instead of
  // returning a stale cached product.
  const cacheKey = [
    input.contentid || input.title || 'default',
    input.selectedIdea?.title || '',
    input.userTarget || '',
    input.userBudget || '',
    input.userDuration || '',
  ].join('|');
  if (tourProductCache.has(cacheKey)) {
    return tourProductCache.get(cacheKey)!;
  }

  const title = input.title || '관광지';
  const relatedNames = (input.relatedSpots || []).slice(0, 5).map((s) => s.title);

  try {
    const response = await fetch('/api/generate-tour-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const resJson = await response.json();
    if (!resJson.success || !resJson.data) {
      throw new Error(resJson.error || 'Server error');
    }

    const parsed = resJson.data;

    // 코스 장소 검증
    const validPlaceNames = new Set([title, ...relatedNames]);
    const rawItinerary = Array.isArray(parsed.itinerary) ? parsed.itinerary : [];
    
    const itinerary = rawItinerary.map((item: any, idx: number) => {
      const rawSpots = Array.isArray(item.spots) ? item.spots.map(String) : [title];
      const validSpots = rawSpots.map((sp: string) => {
        const matched = Array.from(validPlaceNames).find(v => sp.includes(v) || v.includes(sp));
        return matched || sp;
      });

      return {
        day: String(item.day || `Day ${idx + 1}: 메인 코스`),
        spots: validSpots.length > 0 ? validSpots : [title],
        desc: String(item.desc || `${title} 중심 가이드 탐방 진행`),
      };
    });

    const courseSteps: CourseStep[] = itinerary.flatMap((it: any, dayIdx: number) => {
      return (it.spots || []).map((spotName: string, spotIdx: number) => ({
        order: dayIdx * 10 + spotIdx + 1,
        placeName: spotName,
        description: it.desc,
      }));
    });

    const result: TourProductResult = {
      productName: String(parsed.productName || `${title} 로컬 콤보 투어`),
      concept: String(parsed.concept || `${title} 중심의 검증된 로컬 가이드 패키지`),
      targetCustomers: Array.isArray(parsed.targetCustomers) && parsed.targetCustomers.length > 0
        ? parsed.targetCustomers.map(String)
        : (input.userTarget ? [input.userTarget] : ['2030 자유여행객']),
      duration: String(parsed.duration || input.userDuration || '2박 3일'),
      transportation: String(parsed.transportation || '전용 리무진'),
      estimatedPrice: String(parsed.estimatedPrice || (input.userBudget ? `1인당 ${input.userBudget} 내외` : '1인당 35,000원 ~ 49,000원')),
      opportunityReason: String(parsed.opportunityReason || '지역 방문자 및 연계 관광 데이터 지표 우수'),
      differentiation: String(parsed.differentiation || '독창적 로컬 동선 및 체류시간 증대 효과'),
      itinerary: itinerary.length > 0 ? itinerary : [
        {
          day: 'Day 1: 메인 코스',
          spots: [title],
          desc: `${title}의 핵심 경관 및 가이드 스토리텔링`
        }
      ],
      marketingPoints: Array.isArray(parsed.marketingPoints) ? parsed.marketingPoints.map(String) : ['TourAPI 빅데이터 검증'],
      expectedEffect: String(parsed.expectedEffect || '지역 체류시간 증가 및 경제 활성화'),

      // 하위 호환 필드
      oneLineIntro: String(parsed.concept || `${title} 로컬 패키지`),
      targetCustomer: Array.isArray(parsed.targetCustomers) && parsed.targetCustomers.length > 0
        ? parsed.targetCustomers.join(', ')
        : (input.userTarget || '2030 여행객'),
      recommendedSeason: '사계절 추천',
      course: courseSteps.length > 0 ? courseSteps : generateRuleBasedTourProduct(input).course,
      keyExperience: Array.isArray(parsed.marketingPoints) ? parsed.marketingPoints.map(String) : [`${title} 가이드 탐방`],
      operationPlan: String(parsed.transportation || '소규모 전용 가이드 투어'),
      priceGuide: String(parsed.estimatedPrice || (input.userBudget ? `1인당 ${input.userBudget} 내외` : '1인당 35,000원 ~ 49,000원')),
      snsCopy: `📍 [${title}] AI가 강추하는 로컬 관광상품 코스 공개!`,
      hashtags: [`#${title.replace(/\s+/g, '')}`, `#YAHO스튜디오`],
      cautions: ['운영 전 현동선 실측 필요'],
      sourceNote: 'TourAPI & Node.js 백엔드 Gemini 2.5 Flash API 실증 기반 기획안',
      generatedBy: 'gemini',
    };

    tourProductCache.set(cacheKey, result);
    return result;
  } catch {
    const fallbackResult = generateRuleBasedTourProduct(input);
    tourProductCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}
