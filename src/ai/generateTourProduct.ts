import { GoogleGenAI } from '@google/genai';
import { VisitorAnalyticsSummary } from '../api/visitorAnalyticsApi';
import { RelatedTourSpot } from '../types/relatedTour';
import { OpportunityScoreBreakdown } from '../utils/calculateOpportunityScore';
import { AIAnalysisResult } from './analyzeOpportunity';

export interface CourseStep {
  order: number;
  placeName: string;
  description: string;
}

export interface TourProductResult {
  productName: string;
  oneLineIntro: string;
  targetCustomer: string;
  recommendedSeason: string;
  duration: string;
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
}

// 메모리 캐시 저장소 (Key: contentid 또는 title)
const tourProductCache = new Map<string, TourProductResult>();

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
 * 2. Gemini 연동 AI 관광상품 기획 생성 함수
 */
export async function generateTourProduct(input: TourProductInput): Promise<TourProductResult> {
  const cacheKey = input.contentid || input.title || 'default';
  if (tourProductCache.has(cacheKey)) {
    return tourProductCache.get(cacheKey)!;
  }

  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : process.env.VITE_GEMINI_API_KEY)?.trim();

  // API 키가 없으면 Rule-Based로 즉시 Fallback
  if (!apiKey) {
    const ruleResult = generateRuleBasedTourProduct(input);
    tourProductCache.set(cacheKey, ruleResult);
    return ruleResult;
  }

  // 실증 전달 데이터 가공
  const title = input.title || '관광지';
  const relatedNames = (input.relatedSpots || []).slice(0, 5).map((s) => s.title);
  const relatedNamesStr = relatedNames.length > 0 ? relatedNames.join(', ') : '없음 (단독 스팟 구성)';

  const prompt = `
당신은 대한민국 한국관광공사 TourAPI 데이터 전문 인바운드/로컬 관광상품 전문 MD(Merchandiser)입니다.
제공된 한국관광공사 실시간 API 데이터만을 근거로 구체적인 관광상품 기획안(JSON)을 작성해 주세요.

[엄격한 제약사항 및 원칙 - 위반 시 무효]
1. 코스(course) 구성 시 반드시 전달된 관광지명("${title}")과 실제 연관 관광지 목록([${relatedNamesStr}])에 있는 장소 이름만 사용하세요. 목록에 없는 가상의 장소를 절대 임의로 지어내거나 추가하지 마세요.
2. 방문자 수, 외국인 비율 통계는 특정 관광지 단독 수치가 아니라 해당 지역 행정구역 전체 유동인구 데이터임을 인식하고 서술하세요.
3. 예측 데이터(트렌드 방향 등)는 확정 사실이 아닌 예측이라고 서술하세요.
4. 가격은 "권장 가격대"로 표기하고 확정가로 단정하지 마세요.
5. 정확히 지정된 JSON 구조로만 반환하고 마크다운 코드블록이나 불필요한 설명을 포함하지 마세요.
6. 한국어로 작성해 주세요.

[전달된 실제 데이터]
- 메인 관광지명: ${title}
- 주소: ${input.addr1 || '정보 없음'}
- contentTypeId: ${input.contenttypeid || '정보 없음'}
- 상세 개요: ${input.overview || '정보 없음'}
- Opportunity Score: ${input.score ?? '정보 없음'}점
- 실제 연관 관광지 목록: ${relatedNamesStr}
- 지역 방문자 데이터: ${input.visitorData ? `${input.visitorData.areaNm} 월 ${Math.round(input.visitorData.totalVisitors / 10000)}만명 유동인구` : '데이터 미제공'}
- 중심 관광지 포함 여부: ${input.isCurrentSpotCentral ? `포함 (${input.currentSpotRank ? `${input.currentSpotRank}위` : '목록 내'})` : '미포함 (신규 연계 자원)'}
- 관광 트렌드 예측: ${input.trendDirection ? `${input.trendDirection === 'RISING' ? '상승 추세' : '안정 추세'} (${input.trendChangeRate}%)` : '미제공'}

[반환 JSON 객체 형식]
{
  "productName": "관광상품명",
  "oneLineIntro": "한줄 소개 문구",
  "targetCustomer": "추천 타깃 고객층",
  "recommendedSeason": "추천 계절",
  "duration": "예상 소요시간",
  "course": [
    { "order": 1, "placeName": "${title}", "description": "1번 장소 설명" }
  ],
  "keyExperience": ["핵심 체험 1", "핵심 체험 2", "핵심 체험 3"],
  "operationPlan": "운영 방식 및 단체 규모 가이드",
  "priceGuide": "권장 가격대 (예: 1인당 35,000원 ~ 45,000원)",
  "marketingPoints": ["마케팅 셀링포인트 1", "마케팅 셀링포인트 2"],
  "snsCopy": "SNS 홍보 문구",
  "hashtags": ["#해시태그1", "#해시태그2"],
  "cautions": ["운영 주의사항 1", "운영 주의사항 2"]
}
`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = response.text || '';
    // 마크다운 코드블록 제거
    const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText);

    // 코스 장소 검증: 연관 관광지 목록 + 선택 관광지명에 포함되지 않는 환각 장소 정화
    const validPlaceNames = new Set([title, ...relatedNames]);
    const filteredCourse: CourseStep[] = (parsed.course || []).map((c: CourseStep, idx: number) => {
      let pName = String(c.placeName || '').trim();
      // 유효한 장소가 아니면 제목이나 연관 관광지 장소로 대체
      const matched = Array.from(validPlaceNames).find(v => pName.includes(v) || v.includes(pName));
      if (matched) {
        pName = matched;
      } else {
        pName = validPlaceNames.has(pName) ? pName : (relatedNames[idx - 1] || title);
      }
      return {
        order: idx + 1,
        placeName: pName,
        description: String(c.description || `${pName} 방문 탐방`),
      };
    });

    const result: TourProductResult = {
      productName: String(parsed.productName || `${title} 로컬 투어`),
      oneLineIntro: String(parsed.oneLineIntro || `${title} 중심 추천 관광 패키지`),
      targetCustomer: String(parsed.targetCustomer || '2030 여행객 및 FIT 자유여행객'),
      recommendedSeason: String(parsed.recommendedSeason || '사계절 추천'),
      duration: String(parsed.duration || '약 3 ~ 4시간'),
      course: filteredCourse.length > 0 ? filteredCourse : generateRuleBasedTourProduct(input).course,
      keyExperience: Array.isArray(parsed.keyExperience) ? parsed.keyExperience.map(String) : [`${title} 탐방`],
      operationPlan: String(parsed.operationPlan || '소규모 가이드 투어 운영'),
      priceGuide: String(parsed.priceGuide || '권장 가격대: 1인 35,000원 ~ 45,000원'),
      marketingPoints: Array.isArray(parsed.marketingPoints) ? parsed.marketingPoints.map(String) : ['실증 데이터 기반 코스'],
      snsCopy: String(parsed.snsCopy || `📍 [${title}] 추천 투어 코스!`),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : [`#${title.replace(/\s+/g, '')}`],
      cautions: Array.isArray(parsed.cautions) ? parsed.cautions.map(String) : ['운영 전 현장 답사 필요'],
      sourceNote: 'TourAPI & Gemini AI 빅데이터 기반 상품기획안',
      generatedBy: 'gemini',
    };

    tourProductCache.set(cacheKey, result);
    return result;
  } catch {
    // API 호출 및 JSON 파싱 실패 시 Rule-Based 자동 Fallback
    const fallbackResult = generateRuleBasedTourProduct(input);
    tourProductCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}
