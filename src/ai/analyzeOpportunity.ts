import { GoogleGenAI } from '@google/genai';
import { VisitorAnalyticsSummary } from '../api/visitorAnalyticsApi';

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
    visitorScoreBonus?: number;
    centralTourBonus?: number;
  };
  areaName?: string;
  categoryName?: string;
  visitorData?: VisitorAnalyticsSummary | null;
  centralTourSpots?: string[]; // 해당 지역 중심 관광지 목록 (명칭)
  isCurrentSpotCentral?: boolean; // 중심 관광지 포함 여부
  currentSpotRank?: number | null; // 중심 관광지 순위
  trendDirection?: 'RISING' | 'STABLE' | 'FALLING';
  trendChangeRate?: number;
  avgRegionalRate?: number;
  isSpotSpecificTrend?: boolean;
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
 * 1. Rule-Based 분석 함수 (한국관광 데이터랩 빅데이터 연동)
 */
export function runRuleBasedAnalysis(item: AIAnalysisInput): AIAnalysisResult {
  const title = (item.title || '').trim();
  const overview = (item.overview || '').trim();
  const addr1 = (item.addr1 || '').trim();
  const tel = (item.tel || '').trim();
  const homepage = (item.homepage || '').trim();
  const typeId = item.contenttypeid ? String(item.contenttypeid) : '';
  const fullText = (title + ' ' + overview).toLowerCase();
  const vData = item.visitorData;

  const hasImage = Boolean(
    item.hasOriginalImage ||
    (item.imageSource && item.imageSource === 'tourApi')
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];

  // 관광 트렌드/집중률 추이 반영 (관광지 단독 vs 지역 단위 구별)
  if (item.trendDirection === 'RISING') {
    if (item.isSpotSpecificTrend) {
      opportunities.push(`향후 30일간 집중률 예측이 상승 추세(+${item.trendChangeRate}%)로 우수한 방문 모멘텀을 보유하고 있습니다.`);
    } else {
      opportunities.push(`해당 지역(${item.areaName || '지역'}) 전체의 관광 수요 및 집중률 예측이 상승 추세(+${item.trendChangeRate}%)로 나타납니다.`);
    }
  } else if (item.trendDirection === 'STABLE') {
    opportunities.push(`해당 지역의 관광 집중도가 안정적인 수준을 유지할 것으로 예측됩니다.`);
  }

  // 중심 관광지 포함 여부 실증 강점/기회 반영
  if (item.isCurrentSpotCentral) {
    strengths.push(`${item.areaName || '해당 지역'} 중심 관광지 목록 ${item.currentSpotRank ? `${item.currentSpotRank}위` : ''}에 포함되어 기본 유동 및 인지도가 우수합니다.`);
  }

  // 빅데이터 방문자 유입 기반 실증 강점 분석
  if (vData && vData.totalVisitors > 0) {
    const totalMan = Math.round(vData.totalVisitors / 10000);
    strengths.push(`${vData.areaNm} 기준 월 ${totalMan.toLocaleString()}만 명 규모의 대형 기초 유동 인구가 형성되어 있습니다.`);
  }

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

  // 기회 (Opportunities) - 기초지자체 중심 관광지 연계 원칙 적용
  if (!item.isCurrentSpotCentral && item.centralTourSpots && item.centralTourSpots.length > 0) {
    const topCentral = item.centralTourSpots.slice(0, 2).join(', ');
    opportunities.push(`지역 대표 중심 관광지(${topCentral})와 연계하여 콤보 투어 및 신규 코스를 개발할 기회가 큽니다.`);
  } else if (item.isCurrentSpotCentral) {
    opportunities.push('지역 대표 앵커 스팟으로서 랜드마크 중심 테마 패키지 구성에 유리합니다.');
  }

  if (vData) {
    if (vData.foreignerRatio >= 1.0) {
      opportunities.push(`${vData.areaNm} 지역 전체의 외국인 방문 비율이 ${vData.foreignerRatio}%로 인바운드 외국인 대상 글로벌 관광상품 개발 가능성이 높습니다.`);
    }
    if (vData.outsiderRatio >= 20.0) {
      opportunities.push(`${vData.areaNm} 지역 전체 방문자 중 외지인 비율이 ${vData.outsiderRatio}%에 달해 광역 및 외지 관광객 대상 당일/숙박 투어 개발에 적합합니다.`);
    }
  }

  if (opportunities.length === 0) {
    opportunities.push('주변 대표 명소와 콤보 코스로 연계 상품화 가능');
  }

  // 추천 상품 (Recommended Product)
  let recommendedProduct = '반일 콤보 투어 패키지';
  if (vData && vData.foreignerRatio >= 1.5) {
    recommendedProduct = 'K-Culture 글로벌 프리미엄 인바운드 투어';
  } else if (typeId === '39' || fullText.includes('시장') || fullText.includes('음식') || fullText.includes('맛집')) {
    recommendedProduct = '로컬 미식 & 식도락 투어';
  } else if (typeId === '12' || fullText.includes('역사') || fullText.includes('궁')) {
    recommendedProduct = '역사 감성 반일 코스';
  } else if (typeId === '28' || fullText.includes('자연') || fullText.includes('산') || fullText.includes('숲') || fullText.includes('계곡')) {
    recommendedProduct = '웰니스 힐링 트레킹';
  }

  // 추천 타깃 (Recommended Target)
  let recommendedTarget = '2030 트렌디 여행객';
  if (vData && vData.foreignerRatio >= 1.5) {
    recommendedTarget = 'K-컬처 및 한국 문화에 관심 높은 FIT 외국인 관광객';
  } else if (fullText.includes('역사') || fullText.includes('박물관') || fullText.includes('문화')) {
    recommendedTarget = '역사 문화 선호 3040 세대 & 가족 단위';
  }

  const summary = item.isCurrentSpotCentral
    ? `${title}은(는) ${item.areaName || '해당 지역'} 중심 관광지 목록에 포함된 앵커 스팟으로, 지역 유동 수요를 기반으로 ${recommendedTarget} 대상 '${recommendedProduct}'(으)로 기획하기에 최적입니다.`
    : `${title}은(는) 지역 중심 관광지 연계 가능성을 바탕으로 ${recommendedTarget} 대상 '${recommendedProduct}'(으)로 기획하기에 적합한 신규 오퍼튜니티 자원입니다.`;

  return {
    summary,
    strengths,
    weaknesses,
    opportunities,
    recommendedProduct,
    recommendedTarget,
    confidence: 88,
    sourceNote: 'TourAPI & 기초지자체 중심 관광지 빅데이터 기반 분석',
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

  const centralListStr = item.centralTourSpots && item.centralTourSpots.length > 0
    ? item.centralTourSpots.join(', ')
    : '데이터 없음';

  const trendStr = item.trendDirection
    ? `${item.isSpotSpecificTrend ? '관광지 단독' : `${item.areaName || '지역'} 전체`} 향후 30일 집중률 예측: ${item.trendDirection === 'RISING' ? '상승 추세' : item.trendDirection === 'STABLE' ? '안정 추세' : '하락 추세'} (${item.trendChangeRate ? `${item.trendChangeRate}%` : '변화율 미비'})`
    : '관광 트렌드 예측 정보 미제공';

  const prompt = `
당신은 대한민국 한국관광공사 TourAPI, 한국관광 데이터랩, 기초지자체 중심 관광지 빅데이터 및 관광지 집중률 트렌드 예측 전문 관광상품 MD 겸 AI 오퍼튜니티 분석가입니다.
제공된 데이터만 근거로 엄격히 분석하여 관광상품 기회를 진단하세요.

[원칙 및 금지사항]
1. 관광 트렌드/집중률 분석 가이드라인:
   - "최근 관광 수요가 상승 추세로 나타납니다.", "해당 지역의 방문 추이가 다음 기간에도 증가할 것으로 예측됩니다." 형태로 객관적 서술하세요.
   - 트렌드 데이터를 특정 개별 관광지 확정 수치로 왜곡하지 마시고 지역 단위/예측 수치임을 정확히 명시하세요.
2. 중심 관광지 분석 가이드라인:
   - 해당 관광지가 중심 관광지 목록에 포함된 경우: "지역 중심 관광지 목록에 포함되어 기본 유동 및 수요를 확보한 장소입니다." 형태로 긍정 분석하세요.
   - 해당 관광지가 중심 관광지 목록에 미포함된 경우: 절대 "인기 없는 관광지"라고 단정하거나 부정적으로 비하하지 마시고, "지역 대표 중심 관광지와 연계해 신규 코스를 개발할 가능성이 있는 신규 기회 자원입니다."로 건설적 기회로 해석하세요.
3. 빅데이터 방문자 통계는 개별 관광지 단독 수치가 아니라 해당 지역 행정구역 전체 유동인구임을 명시하세요.
4. 제공되지 않은 가상의 방문자수, 후기, 외국인 수치를 추정하지 마세요.
5. 반드시 한국어로 순수한 JSON 형식으로만 반환하세요.

[입력 관광지 & 빅데이터]
- 관광지명: ${item.title || '데이터 없음'}
- 주소: ${item.addr1 || '데이터 없음'}
- 상세 개요: ${item.overview || '데이터 없음'}
- 해당 지역 기초지자체 중심 관광지 목록: ${centralListStr}
- 선택 관광지의 중심 관광지 포함 여부: ${item.isCurrentSpotCentral ? `포함 (${item.currentSpotRank ? `${item.currentSpotRank}위` : '목록 내'})` : '미포함 (신규 연계 후보 자원)'}
- 관광지 집중률 및 추이 예측: ${trendStr}
- 검색 지역: ${item.areaName || '서울/전국'}

[반환 JSON 구조]
{
  "summary": "한 문단으로 요약된 기회 분석 (150자 이내)",
  "strengths": ["강점 1", "강점 2"],
  "weaknesses": ["약점 1", "약점 2"],
  "opportunities": ["기회 1", "기회 2"],
  "recommendedProduct": "추천 관광상품명",
  "recommendedTarget": "추천 타깃 고객층",
  "confidence": 95,
  "sourceNote": "TourAPI & 데이터랩 빅데이터/집중률 예측 분석"
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const rawText = response.text || '';
  const cleanedText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  let parsed: Partial<AIAnalysisResult>;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    throw new Error('Gemini 응답 JSON 파싱 실패');
  }

  return {
    summary: parsed.summary || `${item.title || '관광지'}에 대한 Gemini 기회 분석 결과입니다.`,
    strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['관광자원 기본 데이터 보유'],
    weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : ['상세 정보 보완 권장'],
    opportunities: Array.isArray(parsed.opportunities) && parsed.opportunities.length > 0 ? parsed.opportunities : ['주변 연계 코스 개발 가능'],
    recommendedProduct: parsed.recommendedProduct || '로컬 콤보 투어',
    recommendedTarget: parsed.recommendedTarget || '2030 자유 여행객',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 92,
    sourceNote: parsed.sourceNote || 'TourAPI & 데이터랩 빅데이터 기반 Gemini AI 분석',
    engineType: 'gemini',
  };
}

/**
 * 3. 통합 Opportunity 분석 함수
 */
export async function analyzeOpportunity(item: AIAnalysisInput): Promise<AIAnalysisResult> {
  const cacheKey = `${String(item.contentid || item.title || '')}_${item.visitorData?.areaCode || ''}`;

  if (cacheKey && analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!;
  }

  let result: AIAnalysisResult;

  try {
    result = await runGeminiAnalysis(item);
  } catch (error) {
    result = runRuleBasedAnalysis(item);
  }

  if (cacheKey) {
    analysisCache.set(cacheKey, result);
  }

  return result;
}
