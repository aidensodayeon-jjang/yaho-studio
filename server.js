import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// 0. GET /api/trends (네이버 데이터랩 기반 검색어 트렌드 분석: 인기 TOP 10 & 급상승 TOP 10)
app.get('/api/trends', async (req, res) => {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();

  // 관광 관련 10개 키워드 그룹 (네이버 데이터랩 규격)
  const candidateKeywords = [
    { groupName: '러닝', keywords: ['러닝', '런닝', '러닝크루', '마라톤'] },
    { groupName: '야간관광', keywords: ['야간관광', '야경투어', '야간개장', '밤마실'] },
    { groupName: '미식여행', keywords: ['미식', '맛집투어', '식도락', '노포투어'] },
    { groupName: '웰니스', keywords: ['웰니스', '황톳길', '맨발걷기', '치유의숲'] },
    { groupName: 'K-POP', keywords: ['KPOP', '케이팝', '성지순례', '촬영지'] },
    { groupName: '성지순례', keywords: ['성지순례', '드라마촬영지', '영화촬영지'] },
    { groupName: '반려동물 여행', keywords: ['반려동물여행', '애견동반여행', '애견펜션'] },
    { groupName: '캠핑', keywords: ['캠핑', '글램핑', '차박'] },
    { groupName: '전통문화', keywords: ['전통문화', '한옥체험', '템플스테이'] },
    { groupName: '성수동 핫플', keywords: ['성수동', '성수동 팝업', '성수 핫플'] },
  ];

  // 오늘 기준 날짜 계산 (최근 30일 vs 이전 30일)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 60);

  const formatDate = (d) => d.toISOString().split('T')[0];

  if (!clientId || !clientSecret) {
    return res.json({
      success: false,
      reason: 'NO_KEY',
      message: 'NAVER_CLIENT_ID 및 NAVER_CLIENT_SECRET이 .env.local에 설정되지 않았습니다.',
      popularTrends: [],
      risingTrends: [],
    });
  }

  try {
    // 네이버 데이터랩 요청 (1회당 최대 5개 키워드그룹 제한 ➔ 2회 분할 요청)
    const batch1 = candidateKeywords.slice(0, 5);
    const batch2 = candidateKeywords.slice(5, 10);

    const fetchBatch = async (batch) => {
      const response = await fetch('https://openapi.naver.com/v1/datalab/search', {
        method: 'POST',
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          timeUnit: 'date',
          keywordGroups: batch,
        }),
      });

      if (!response.ok) return [];
      const resData = await response.json();
      return resData.results || [];
    };

    const [res1, res2] = await Promise.all([fetchBatch(batch1), fetchBatch(batch2)]);
    const allResults = [...res1, ...res2];

    const trendResults = allResults.map((group) => {
      const dataPoints = group.data || [];
      const mid = Math.floor(dataPoints.length / 2);
      const prevData = dataPoints.slice(0, mid);
      const recentData = dataPoints.slice(mid);

      const prevAvg = prevData.reduce((acc, curr) => acc + curr.ratio, 0) / (prevData.length || 1);
      const recentAvg = recentData.reduce((acc, curr) => acc + curr.ratio, 0) / (recentData.length || 1);

      const changeRate = prevAvg > 0
        ? Number((((recentAvg - prevAvg) / prevAvg) * 100).toFixed(1))
        : Number(recentAvg.toFixed(1));

      return {
        keyword: group.title,
        recentAverage: Number(recentAvg.toFixed(1)),
        previousAverage: Number(prevAvg.toFixed(1)),
        changeRate: changeRate,
        trend: changeRate > 0 ? 'rising' : changeRate === 0 ? 'stable' : 'falling',
      };
    });

    // 1. 인기 트렌드 TOP 10 (최근 30일 평균 검색 지수 기준 정렬)
    const popularTrends = [...trendResults]
      .sort((a, b) => b.recentAverage - a.recentAverage)
      .slice(0, 10);

    // 2. 급상승 트렌드 TOP 10 (검색 증가율 changeRate 기준 정렬)
    const risingTrends = [...trendResults]
      .sort((a, b) => b.changeRate - a.changeRate)
      .slice(0, 10);

    return res.json({
      success: true,
      source: 'NAVER DataLab',
      popularTrends,
      risingTrends,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '네이버 데이터랩 API 호출 중 에러가 발생했습니다.';
    return res.status(500).json({ success: false, error: errorMsg, popularTrends: [], risingTrends: [] });
  }
});

// 1. POST /api/generate-tour-product-ideas (새 1단계: 3개 아이디어 생성)
app.post('/api/generate-tour-product-ideas', async (req, res) => {
  const input = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return res.status(400).json({ error: 'GEMINI_API_KEY가 서버에 설정되어 있지 않습니다.' });
  }

  const title = input.title || '관광지';
  const areaName = input.visitorData?.areaNm || '해당 지역';
  const overview = input.overview || '';
  const score = input.score ?? 85;
  const aiSummary = input.aiAnalysis?.summary || '방문 수요 및 로컬 관광 연계 가능성 우수';

  const prompt = `
당신은 대한민국 대표 인바운드/로컬 관광상품 전문 기획 MD입니다.
한국관광공사 TourAPI 및 관광 빅데이터 분석 결과를 바탕으로, 아래 관광지에 대한 차별화된 "관광상품 아이디어 3개"를 기획해 주세요.

[관광지 정보]
- 관광지명: ${title}
- 위치/지역: ${input.addr1 || areaName}
- Opportunity Score: ${score}점
- 상세 개요: ${overview}
- AI 진단 요약: ${aiSummary}

[기획 원칙]
1. 단순 여행 추천이 아닌 실제 상품화가 가능한 정교한 컨셉 3개를 제안하세요.
2. 각각의 아이디어는 타겟 고객층과 기획 이유가 명확해야 합니다.
3. 3개 아이디어의 색깔(컨셉, 타깃, 스타일)이 서로 다르고 독창적이어야 합니다.
4. 순수한 JSON 배열만 반환하세요. 마크다운(\`\`\`json 등)은 금지합니다.

[반환 JSON 형상]
[
  {
    "title": "아이디어 제목 1 (예: 홍제천 NIGHT WALK)",
    "oneLineConcept": "한 줄 컨셉 설명",
    "target": "타깃 고객층 (예: 2030 직장인 & 연인)",
    "reason": "이 아이디어를 제안하는 데이터/기획적 근거",
    "tags": ["태그1", "태그2", "태그3"]
  },
  {
    "title": "아이디어 제목 2",
    "oneLineConcept": "한 줄 컨셉 설명",
    "target": "타깃 고객층",
    "reason": "이 아이디어를 제안하는 데이터/기획적 근거",
    "tags": ["태그1", "태그2", "태그3"]
  },
  {
    "title": "아이디어 제목 3",
    "oneLineConcept": "한 줄 컨셉 설명",
    "target": "타깃 고객층",
    "reason": "이 아이디어를 제안하는 데이터/기획적 근거",
    "tags": ["태그1", "태그2", "태그3"]
  }
]
`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = response.text || '';
    const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText);

    return res.json({ success: true, data: parsed, generatedBy: 'gemini' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Gemini API 아이디어 생성 중 에러가 발생했습니다.';
    return res.status(500).json({ error: errorMsg });
  }
});

// 2. POST /api/generate-tour-product (기존 2단계: 선택된 아이디어를 발전시켜 상세 기획서 생성)
app.post('/api/generate-tour-product', async (req, res) => {
  const input = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return res.status(400).json({ error: 'GEMINI_API_KEY가 서버에 설정되어 있지 않습니다.' });
  }

  const title = input.title || '관광지';
  const selectedIdeaTitle = input.selectedIdea?.title || input.title || '관광지';
  const selectedIdeaConcept = input.selectedIdea?.oneLineConcept || '';
  const selectedIdeaTarget = input.selectedIdea?.target || '';
  const selectedIdeaReason = input.selectedIdea?.reason || '';

  const relatedNames = (input.relatedSpots || []).slice(0, 5).map((s) => s.title);
  const relatedNamesStr = relatedNames.length > 0 ? relatedNames.join(', ') : '없음 (단독 스팟 구성)';

  const prompt = `
당신은 대한민국 한국관광공사 TourAPI 데이터 및 관광 빅데이터 분석 전문 인바운드/로컬 관광상품 기획 전문 MD입니다.
사용자가 선택한 특정 관광상품 아이디어([${selectedIdeaTitle}])를 바탕으로 실제 판매 가능한 정교하고 구조화된 상세 관광상품 기획안(JSON)을 작성해 주세요.

[선택된 아이디어 컨셉]
- 상품 아이디어명: ${selectedIdeaTitle}
- 컨셉: ${selectedIdeaConcept}
- 타깃 고객: ${selectedIdeaTarget}
- 기획 배경: ${selectedIdeaReason}

[관광상품 설계 핵심 원칙]
1. 선택된 아이디어를 바탕으로 실제 상품 기획서를 구체화할 것.
2. 전달받은 연관 관광지 목록([${relatedNamesStr}])을 최대한 활용해 실제 이동 동선 및 추천 코스(itinerary)를 설계할 것. 가상의 미확인 장소를 임의로 지어내지 말 것.
3. 지역상권 연계와 관광객 체류시간 증가를 함께 고려할 것.
4. 실제 가이드 투어 또는 콤보 패키지로 즉시 판매 가능한 수준으로 구체적 작성할 것.

[전달된 실제 관광 데이터]
- 메인 관광지명: ${title}
- 주소/위치: ${input.addr1 || '정보 없음'}
- 관광지 상세 개요: ${input.overview || '정보 없음'}
- Opportunity Score: ${input.score ?? '정보 없음'}점
- 실제 연관 관광지 목록: ${relatedNamesStr}
- 지역 방문자 데이터: ${input.visitorData ? `${input.visitorData.areaNm} 월 ${Math.round(input.visitorData.totalVisitors / 10000)}만명 유동인구` : '데이터 미제공'}

[응답 형상 및 엄격한 JSON 규칙]
반드시 다음 구조의 순수한 JSON 객체 하나만 출력해야 합니다. 마크다운 코드블록(\`\`\`json ...)이나 텍스트 전후 설명을 절대 포함하지 마세요.

{
  "productName": "${selectedIdeaTitle}",
  "concept": "${selectedIdeaConcept || '선택 아이디어 기반 실증 패키지'}",
  "targetCustomers": ["${selectedIdeaTarget || '2030 여행객'}"],
  "duration": "예상 소요시간 (예: 2박 3일 또는 반일 4시간)",
  "transportation": "권장 교통수단 (예: 도보 및 대중교통 또는 전용 버스)",
  "estimatedPrice": "1인당 권장 기획 가격대 (예: 1인당 35,000원 ~ 45,000원)",
  "opportunityReason": "${selectedIdeaReason || '데이터 지표 우수'}",
  "differentiation": "기존 상용 투어 대비 차별화 포인트 및 체류시간/분산 효과",
  "itinerary": [
    {
      "day": "Day 1: 코스 제목",
      "spots": ["${title}", "연관 장소 1"],
      "desc": "해당 일정의 구체적인 가이드 해설 및 동선 설명"
    }
  ],
  "marketingPoints": ["마케팅 셀링포인트 1", "마케팅 셀링포인트 2"],
  "expectedEffect": "지역 상권 연계 및 체류시간 증대 등 예상되는 효과"
}
`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = response.text || '';
    const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText);

    return res.json({ success: true, data: parsed, generatedBy: 'gemini' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Gemini API 호출 중 에러가 발생했습니다.';
    return res.status(500).json({ error: errorMsg });
  }
});

// 3. POST /api/analyze-opportunity (기존 AI Opportunity Analysis 유지)
app.post('/api/analyze-opportunity', async (req, res) => {
  const item = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return res.status(400).json({ error: 'GEMINI_API_KEY가 서버에 설정되어 있지 않습니다.' });
  }

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

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = response.text || '';
    const cleanedText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return res.json({ success: true, data: parsed });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Gemini API 호출 중 에러가 발생했습니다.';
    return res.status(500).json({ error: errorMsg });
  }
});

// Production 정적 파일 제공
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
