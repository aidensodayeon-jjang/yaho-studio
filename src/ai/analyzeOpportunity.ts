import { GoogleGenAI } from '@google/genai';

export interface AIAnalysisInput {
  contentid?: string;
  title?: string;
  overview?: string;
  addr1?: string;
  tel?: string;
  homepage?: string;
  contenttypeid?: string | number;
  hasOriginalImage?: boolean;
  imageSource?: 'tourApi' | 'placeholder';
  tags?: string[];
  score?: number;
  scoreBreakdown?: {
    dataCompleteness: number;
    productPotential: number;
    uniqueness: number;
    accessibility: number;
  };
  areaName?: string;
  categoryName?: string;
  [key: string]: unknown;
}

export interface AIAnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendedProduct: string;
  recommendedTarget: string;
  confidence?: number;
  sourceNote?: string;
  engineType?: 'gemini' | 'rule-based';
}

// 메모리 캐시 저장소 (contentid 또는 title 기준)
const analysisCache = new Map<string, AIAnalysisResult>();

/**
 * 1. Rule-Based 분석 함수 (기존 규칙 분석 담당)
 */
export function runRuleBasedAnalysis(item: AIAnalysisInput): AIAnalysisResult {
  const title = (item.title || '').trim();
  const overview = (item.overview || '').trim();
  const addr1 = (item.addr1 || '').trim();
  const tel = (item.tel || '').trim();
  const homepage = (item.homepage || '').trim();
  const typeId = item.contenttypeid ? String(item.contenttypeid) : '';
  const fullText = (title + ' ' + overview).toLowerCase();

  const hasImage = Boolean(
    item.hasOriginalImage ||
    (item.imageSource && item.imageSource === 'tourApi')
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];

  // 강점 (Strengths)
  if (typeId === '12' || fullText.includes('역사') || fullText.includes('문화재') || fullText.includes('전통') || fullText.includes('궁')) {
    strengths.push('역사·문화 콘텐츠 스토리가 풍부합니다.');
  }
  if (hasImage) {
    strengths.push('고품질 공식 대표 이미지가 확보되어 있습니다.');
  }
  if (overview.length >= 80) {
    strengths.push('상세 안내 및 개요 데이터가 충실하게 등록되어 있습니다.');
  }
  if (addr1 && (tel || homepage)) {
    strengths.push('기초 신뢰 정보(주소/연락처/홈페이지)가 잘 갖추어져 있습니다.');
  }
  if (strengths.length === 0) {
    strengths.push('접근성이 비교적 무난한 기본 관광자원입니다.');
  }

  // 약점 (Weaknesses)
  if (!overview || overview.length < 50) {
    weaknesses.push('상세 소개 정보(개요)가 다소 부족합니다.');
  }
  if (!hasImage) {
    weaknesses.push('공식 이미지가 없어 마케팅 홍보자료 보완이 필요합니다.');
  }
  if (!tel && !homepage) {
    weaknesses.push('공식 웹사이트 및 연락처 정보 미등록으로 상세 확인이 어렵습니다.');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('특별한 데이터 결측 없이 우수한 기본 정보를 보유하고 있습니다.');
  }

  // 기회 (Opportunities)
  if (typeId === '15' || fullText.includes('축제') || fullText.includes('행사') || fullText.includes('공연')) {
    opportunities.push('시즌별 계절형 이벤트/축제 연계 관광상품 개발 가능');
  }
  if (fullText.includes('바다') || fullText.includes('해변') || fullText.includes('야경') || fullText.includes('전망') || fullText.includes('야간')) {
    opportunities.push('야간 투어 및 감성 야경 관광 콘텐츠 확장 가능');
  }
  if (typeId === '38' || fullText.includes('시장') || fullText.includes('골목') || fullText.includes('상점')) {
    opportunities.push('로컬 상권 및 미식 투어 체류형 상품 적합');
  }
  if (typeId === '28' || fullText.includes('자연') || fullText.includes('산') || fullText.includes('숲') || fullText.includes('계곡')) {
    opportunities.push('웰니스 힐링 트레킹 및 자연 생태 체험 코스 기획 유효');
  }
  if (opportunities.length === 0) {
    opportunities.push('주변 대표 명소와 콤보 코스로 연계 상품화 가능');
  }

  // 추천 상품 (Recommended Product)
  let recommendedProduct = '반일 콤보 투어 패키지';
  if (typeId === '39' || fullText.includes('시장') || fullText.includes('음식') || fullText.includes('맛집')) {
    recommendedProduct = '로컬 미식 & 식도락 투어';
  } else if (typeId === '12' || fullText.includes('역사') || fullText.includes('궁')) {
    recommendedProduct = '역사 감성 반일 코스';
  } else if (typeId === '28' || fullText.includes('자연') || fullText.includes('산') || fullText.includes('숲') || fullText.includes('계곡')) {
    recommendedProduct = '웰니스 힐링 트레킹';
  } else if (typeId === '15' || fullText.includes('축제')) {
    recommendedProduct = '시즌 페스티벌 특별 패키지';
  }

  // 추천 타깃 (Recommended Target)
  let recommendedTarget = '2030 트렌디 여행객';
  if (fullText.includes('역사') || fullText.includes('박물관') || fullText.includes('문화')) {
    recommendedTarget = '역사 문화 선호 3040 세대 & 가족 단위';
  } else if (fullText.includes('바다') || fullText.includes('카페') || fullText.includes('야경')) {
    recommendedTarget = '인증샷과 감성을 즐기는 20대 K-POP/글로벌 팬';
  } else if (fullText.includes('자연') || fullText.includes('산') || fullText.includes('숲')) {
    recommendedTarget = '웰니스 힐링을 찾는 휴양 및 트레킹 여행객';
  }

  const summary = `${title || '관광지'}은(는) ${strengths[0]} ${opportunities[0]}을(를) 활용하여 ${recommendedTarget}을(를) 타깃으로 한 '${recommendedProduct}'(으)로 기획하기에 최적인 자원입니다.`;

  return {
    summary,
    strengths,
    weaknesses,
    opportunities,
    recommendedProduct,
    recommendedTarget,
    confidence: 85,
    sourceNote: 'TourAPI 기반 규칙 분석',
    engineType: 'rule-based',
  };
}

/**
 * 2. Gemini API 연동 분석 함수
 */
export async function runGeminiAnalysis(item: AIAnalysisInput): Promise<AIAnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
당신은 대한민국 한국관광공사 TourAPI 전문 관광상품 MD 겸 AI 오퍼튜니티 분석가입니다.
제공된 TourAPI 데이터만 근거로 엄격히 분석하여 관광상품 기회를 진단하세요.

[제한사항 및 원칙]
1. 제공된 데이터만 근거로 분석하세요.
2. 존재하지 않는 관광지 정보나 가상의 소문/후기를 생성하지 마세요 (환각 금지).
3. 아직 연동되지 않은 데이터(방문자수, SNS 언급량, 외국인 비율 등)는 절대로 추정하여 사실처럼 작성하지 마세요.
4. 데이터가 없는 항목은 반드시 "데이터 부족" 또는 "미등록"으로 표시하세요.
5. 반드시 한국어로 답변하세요.
6. 다른 설명 없이 오직 순수한 JSON 형식으로만 반환하세요.

[입력 관광지 데이터]
- 관광지명: ${item.title || '데이터 없음'}
- contentTypeId: ${item.contenttypeid || '데이터 없음'}
- 주소: ${item.addr1 || '데이터 없음'}
- 상세 개요: ${item.overview || '데이터 없음'}
- 전화번호 유무: ${item.tel ? '있음' : '없음'}
- 홈페이지 유무: ${item.homepage ? '있음' : '없음'}
- 실제 이미지 유무: ${item.hasOriginalImage ? '있음' : '없음'}
- Opportunity Score: ${item.score ?? '데이터 없음'}
- Score Breakdown: ${JSON.stringify(item.scoreBreakdown || {})}
- 검색 지역: ${item.areaName || '서울/전국'}
- 검색 관광유형: ${item.categoryName || '전체'}

[반환 JSON 구조]
{
  "summary": "한 문단으로 요약된 기회 분석 (150자 이내)",
  "strengths": ["강점 1", "강점 2"],
  "weaknesses": ["약점 1", "약점 2"],
  "opportunities": ["기회 1", "기회 2"],
  "recommendedProduct": "추천 관광상품명",
  "recommendedTarget": "추천 타깃 고객층",
  "confidence": 95,
  "sourceNote": "TourAPI 기반 분석"
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const rawText = response.text || '';
  // 마크다운 코드블록 제거 (예: ```json ... ```)
  const cleanedText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  let parsed: Partial<AIAnalysisResult>;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    throw new Error('Gemini 응답 JSON 파싱 실패');
  }

  // 필드 누락 시 기본값 매구기
  return {
    summary: parsed.summary || `${item.title || '관광지'}에 대한 Gemini 기회 분석 결과입니다.`,
    strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['관광자원 기본 데이터 보유'],
    weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : ['상세 정보 보완 권장'],
    opportunities: Array.isArray(parsed.opportunities) && parsed.opportunities.length > 0 ? parsed.opportunities : ['주변 연계 코스 개발 가능'],
    recommendedProduct: parsed.recommendedProduct || '로컬 콤보 투어',
    recommendedTarget: parsed.recommendedTarget || '2030 자유 여행객',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 90,
    sourceNote: parsed.sourceNote || 'TourAPI 기반 Gemini AI 분석',
    engineType: 'gemini',
  };
}

/**
 * 3. 통합 Opportunity 분석 함수
 * - 메모리 캐시 확인
 * - Gemini API 우선 호출
 * - 실패 시 Rule-Based 자동 Fallback
 */
export async function analyzeOpportunity(item: AIAnalysisInput): Promise<AIAnalysisResult> {
  const cacheKey = String(item.contentid || item.title || '');

  // 동일 contentId/title에 대한 메모리 캐시 확인
  if (cacheKey && analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!;
  }

  let result: AIAnalysisResult;

  try {
    // 1차 시도: Gemini AI 분석
    result = await runGeminiAnalysis(item);
  } catch (error) {
    // 2차 Fallback: Rule-Based 분석
    result = runRuleBasedAnalysis(item);
  }

  // 캐시에 저장
  if (cacheKey) {
    analysisCache.set(cacheKey, result);
  }

  return result;
}
