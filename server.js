import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { discoverTrends, extractEntities } from './trend-discovery.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// 메모리 캐시 (YouTube Quota 절약)
const youtubeCache = new Map();
const YOUTUBE_CACHE_TTL = 30 * 60 * 1000; // 30 mins

let popularTrendsCache = null;
let popularTrendsCacheTime = 0;
const POPULAR_TRENDS_TTL = 60 * 60 * 1000; // 1 hour

// V2 Cache Validation
function isValidV2Cache(data) {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.every(
      (item) =>
        typeof item.title === 'string' &&
        typeof item.trendScore === 'number' &&
        item.youtubeSignal &&
        item.naverSignal &&
        item.tourism
    )
  );
}

let trendDiscoveryDebug = {
  lastExecuted: null,
  extractionSource: 'none',
  seedsUsed: [],
  candidatesCount: 0,
  geminiStatus: 'not_run',
  validClustersCount: 0,
  domesticVideosCount: 0,
  foreignRejectedCount: 0,
  singleVideoRejectedCount: 0,
  genericTrendRejectedCount: 0,
  evidenceMismatchRejectedCount: 0,
  fallbackClustersCount: 0,
  rejectedList: [],
};

// 0-1. GET /api/youtube-popular-trends/debug
app.get('/api/youtube-popular-trends/debug', (req, res) => {
  console.log('🛠 [TREND DISCOVERY V2 DEBUG] ROUTE EXECUTED');
  return res.json({
    version: 'trend-discovery-v2',
    timestamp: new Date().toISOString(),
    ...trendDiscoveryDebug,
  });
});

// 0-2. GET /api/youtube-popular-trends (V2 DISCOVERY)
app.get('/api/youtube-popular-trends', async (req, res) => {
  console.log('\n🚀 [TREND DISCOVERY V2] ROUTE EXECUTED', new Date().toISOString());

  // Reset debug metrics
  trendDiscoveryDebug = {
    lastExecuted: new Date().toISOString(),
    extractionSource: 'none',
    seedsUsed: [],
    candidatesCount: 0,
    geminiStatus: 'not_run',
    validClustersCount: 0,
    domesticVideosCount: 0,
    foreignRejectedCount: 0,
    singleVideoRejectedCount: 0,
    genericTrendRejectedCount: 0,
    evidenceMismatchRejectedCount: 0,
    fallbackClustersCount: 0,
    rejectedList: [],
  };

  const ytKey = process.env.YOUTUBE_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const navClientId = process.env.NAVER_CLIENT_ID?.trim();
  const navClientSecret = process.env.NAVER_CLIENT_SECRET?.trim();

  const now = Date.now();
  if (popularTrendsCache && isValidV2Cache(popularTrendsCache) && now - popularTrendsCacheTime < POPULAR_TRENDS_TTL) {
    console.log('[Cache] Returning cached V2 popular trends:', popularTrendsCache.length);
    return res.json({
      version: 'trend-discovery-v2',
      success: true,
      source: 'cache-v2',
      data: popularTrendsCache,
    });
  }

  if (!ytKey) {
    return res.json({
      version: 'trend-discovery-v2',
      success: false,
      reason: 'NO_YOUTUBE_KEY',
      message: 'YOUTUBE_API_KEY가 .env.local에 설정되지 않았습니다.',
      data: [],
    });
  }

  const seeds = ['여행', '국내여행', '핫플', '맛집', '축제', '팝업', '촬영지', '여행 브이로그', '성지순례', 'K-POP 촬영지', '데이트'];

  try {
    const publishedAfter = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const shuffledSeeds = seeds.sort(() => 0.5 - Math.random()).slice(0, 7);
    trendDiscoveryDebug.seedsUsed = shuffledSeeds;

    console.log('\n=================== [1] SEED SEARCH ===================');
    const fetchedItemsMap = new Map();

    for (const seed of shuffledSeeds) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(seed)}&type=video&publishedAfter=${publishedAfter}&regionCode=KR&order=date&maxResults=15&key=${ytKey}`;
      try {
        const sRes = await fetch(searchUrl);
        if (sRes.ok) {
          const sJson = await sRes.json();
          const items = sJson.items || [];
          items.forEach((it) => {
            if (it.id?.videoId) fetchedItemsMap.set(it.id.videoId, it);
          });
        }
      } catch (err) {
        console.log(`Seed "${seed}" Fetch Error:`, err instanceof Error ? err.message : err);
      }
    }

    const uniqueVideoIds = Array.from(fetchedItemsMap.keys());
    if (uniqueVideoIds.length === 0) {
      return res.json({ version: 'trend-discovery-v2', success: true, source: 'live', data: [] });
    }

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${uniqueVideoIds.slice(0, 50).join(',')}&key=${ytKey}`;
    const vRes = await fetch(videosUrl);
    const vJson = await vRes.json();
    const videoDetails = vJson.items || [];

    const parsedViralVideos = videoDetails.map((v) => {
      const stats = v.statistics || {};
      const snippet = v.snippet || {};
      const viewCount = Number(stats.viewCount || 0);
      const pubDate = snippet.publishedAt ? new Date(snippet.publishedAt) : new Date();
      const hoursSince = Math.max((now - pubDate.getTime()) / (1000 * 60 * 60), 1);
      const viewsPerHour = Math.round(viewCount / hoursSince);

      return {
        videoId: v.id,
        title: snippet.title || '',
        description: (snippet.description || '').slice(0, 150),
        channelTitle: snippet.channelTitle || '',
        publishedAt: snippet.publishedAt || '',
        tags: (snippet.tags || []).slice(0, 5),
        viewCount,
        likeCount: Number(stats.likeCount || 0),
        commentCount: Number(stats.commentCount || 0),
        viewsPerHour,
      };
    });

    const viralCandidates = parsedViralVideos.filter((v) => v.viewsPerHour >= 10);
    viralCandidates.sort((a, b) => b.viewsPerHour - a.viewsPerHour);
    trendDiscoveryDebug.candidatesCount = viralCandidates.length;

    // Filter Out Non-Domestic / Overseas Travel Videos.
    // A foreign keyword only rejects a video when it has NO domestic tourism
    // signal — otherwise K-콘텐츠 촬영지/성지순례 (e.g. an 에스파 뮤비 촬영지 video that
    // happens to mention a foreign city) get wrongly dropped.
    const foreignKeywords = ['도쿄', '일본', '오사카', '후쿠오카', '대만', '베트남', '다낭', '나트랑', '방콕', '태국', '이스라엘', '유럽', '파리', '런던', '뉴욕', '미국', '호주', '발리', '괌', '사이판', '하와이', '스페인', '이탈리아', '칭다오', '중국'];
    const domesticMarkers = ['국내', '한국', '국내여행', '촬영지', '성지순례', '드라마촬영지', '영화촬영지', '한옥', '템플스테이', '전통시장', '한강', '제주', '경주', '전주', '강릉', '속초'];

    const domesticCandidates = viralCandidates.filter((v) => {
      const text = `${v.title} ${v.description}`;
      const lower = text.toLowerCase();
      const containsForeign = foreignKeywords.some((fk) => lower.includes(fk.toLowerCase()));
      if (!containsForeign) return true;

      // Foreign keyword present — keep only if there is a clear domestic anchor:
      // a Korean region from the gazetteer, or an explicit domestic marker.
      const { regions } = extractEntities(text);
      const hasDomesticSignal = regions.size > 0 || domesticMarkers.some((m) => text.includes(m));
      if (!hasDomesticSignal) {
        trendDiscoveryDebug.foreignRejectedCount++;
        trendDiscoveryDebug.rejectedList.push({
          name: v.title,
          stage: 'FOREIGN_FILTER',
          reason: '해외 여행 / 비국관광 영상 제외 (국내 신호 없음)',
        });
        return false;
      }
      return true;
    });

    trendDiscoveryDebug.domesticVideosCount = domesticCandidates.length;

    // ==================== TREND DISCOVERY (OpenAI primary → deterministic fallback) ====================
    const { data: finalTrendList, extractionSource } = await discoverTrends({
      domesticVideos: domesticCandidates,
      openaiKey,
      naverClientId: navClientId,
      naverClientSecret: navClientSecret,
      debug: trendDiscoveryDebug,
    });

    console.log(`[Trend Discovery] source=${extractionSource} trends=${finalTrendList.length}`);

    trendDiscoveryDebug.validClustersCount = finalTrendList.length;

    // Only cache a non-empty, schema-valid result (avoid caching an empty run).
    if (isValidV2Cache(finalTrendList)) {
      popularTrendsCache = finalTrendList;
      popularTrendsCacheTime = now;
    }

    return res.json({
      version: 'trend-discovery-v2',
      success: true,
      source: extractionSource === 'openai' ? 'openai' : 'fallback-deterministic-v2',
      data: finalTrendList,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Tourism Social Discovery V2 실패';
    return res.status(500).json({ version: 'trend-discovery-v2', success: false, error: errorMsg, data: [] });
  }
});

// GET /api/youtube-trend?keyword=러닝
app.get('/api/youtube-trend', async (req, res) => {
  const keyword = String(req.query.keyword || '러닝').trim();
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (!apiKey) {
    return res.json({
      success: false,
      reason: 'NO_KEY',
      message: 'YOUTUBE_API_KEY가 .env.local에 설정되지 않았습니다.',
      data: null,
    });
  }

  // 1. 메모리 캐시 확인
  const now = Date.now();
  if (youtubeCache.has(keyword)) {
    const cached = youtubeCache.get(keyword);
    if (now - cached.timestamp < YOUTUBE_CACHE_TTL) {
      return res.json({ success: true, source: 'cache', data: cached.data });
    }
  }

  try {
    // 2. YouTube search.list (최신 관광/여행 관련 10개 영상 검색)
    const searchQuery = `${keyword} 여행 관광`;
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&order=relevance&maxResults=10&key=${apiKey}`;
    
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const errTxt = await searchRes.text();
      return res.status(searchRes.status).json({ success: false, error: errTxt, data: null });
    }

    const searchJson = await searchRes.json();
    const items = searchJson.items || [];
    if (items.length === 0) {
      const emptyResult = {
        keyword,
        videoCount: 0,
        totalViews: 0,
        avgViewsPerHour: 0,
        viralLevel: 'low',
        topVideos: [],
        geminiContext: null,
      };
      youtubeCache.set(keyword, { timestamp: now, data: emptyResult });
      return res.json({ success: true, data: emptyResult });
    }

    const videoIds = items.map((it) => it.id.videoId).filter(Boolean).join(',');

    // 3. YouTube videos.list (statistics 수집)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    const videosJson = await videosRes.json();
    const videoDetails = videosJson.items || [];

    let totalViews = 0;
    let totalViewsPerHour = 0;
    const topVideos = [];
    const videoSnippetTexts = [];

    for (const v of videoDetails) {
      const stats = v.statistics || {};
      const snippet = v.snippet || {};
      const viewCount = Number(stats.viewCount || 0);
      const publishedAt = snippet.publishedAt ? new Date(snippet.publishedAt) : new Date();

      const hoursSince = Math.max((now - publishedAt.getTime()) / (1000 * 60 * 60), 1);
      const viewsPerHour = viewCount / hoursSince;

      totalViews += viewCount;
      totalViewsPerHour += viewsPerHour;

      topVideos.push({
        videoId: v.id,
        title: snippet.title || '',
        channelTitle: snippet.channelTitle || '',
        publishedAt: snippet.publishedAt || '',
        viewCount,
        likeCount: Number(stats.likeCount || 0),
        commentCount: Number(stats.commentCount || 0),
        viewsPerHour: Math.round(viewsPerHour),
      });

      videoSnippetTexts.push(`- 제목: ${snippet.title} | 설명: ${(snippet.description || '').slice(0, 100)}`);
    }

    const videoCount = topVideos.length;
    const avgViewsPerHour = videoCount > 0 ? Math.round(totalViewsPerHour / videoCount) : 0;

    // Viral Level 판단 (high / medium / low)
    const viralLevel = avgViewsPerHour > 1000 || totalViews > 300000 ? 'high' : avgViewsPerHour > 200 || totalViews > 50000 ? 'medium' : 'low';

    // 4. Gemini를 이용한 Trend Context 추출 (왜 뜨는지 한줄 요약 및 관광 키워드 추출)
    let geminiContext = null;
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey && videoSnippetTexts.length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const prompt = `
다음은 YouTube에서 최근 관심 폭발 중인 "${keyword}" 관련 영상들입니다.
${videoSnippetTexts.slice(0, 5).join('\n')}

[요청]
1. 왜 이 키워드가 최근 YouTube에서 뜨고 있는지 1~2문장으로 객관적 요약(summary)해 주세요.
2. 이 트렌드와 연결되는 대표적인 관광 연계 키워드(entities: regions, places, activities, themes)를 추출해 주세요.
3. 순수 JSON만 반환하세요.

[JSON 형상]
{
  "summary": "요약 한 문장",
  "entities": {
    "regions": ["지역명"],
    "places": ["장소/스팟명"],
    "activities": ["활동/체험명"],
    "themes": ["테마"]
  }
}
`;
        const aiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const rawText = aiRes.text || '';
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        geminiContext = JSON.parse(cleanJson);
      } catch {
        geminiContext = {
          summary: `최근 YouTube에서 '${keyword}' 관련 콘텐츠 시청률과 관심도가 눈에 띄게 상승하고 있습니다.`,
          entities: {
            regions: ['서울'],
            places: ['한강공원'],
            activities: [keyword],
            themes: ['로컬관광'],
          },
        };
      }
    }

    const finalData = {
      keyword,
      videoCount,
      totalViews,
      avgViewsPerHour,
      viralLevel,
      topVideos: topVideos.slice(0, 3), // 대표 3개만 반환
      geminiContext,
    };

    // 캐시 저장 (30분)
    youtubeCache.set(keyword, { timestamp: now, data: finalData });

    return res.json({ success: true, source: 'YouTube API v3', data: finalData });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'YouTube API 호출 실패';
    return res.status(500).json({ success: false, error: errorMsg, data: null });
  }
});

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

      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        console.log('[Naver DataLab] HTTP', response.status, errTxt.slice(0, 200));
        return [];
      }
      const resData = await response.json();
      return resData.results || [];
    };

    const [res1, res2] = await Promise.all([fetchBatch(batch1), fetchBatch(batch2)]);
    const allResults = [...res1, ...res2];

    let trendResults = [];
    let usedFallbackSample = false;

    if (allResults.length > 0) {
      trendResults = allResults.map((group) => {
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
    } else {
      // NAVER DataLab 인증 실패(401) 또는 미등록 시 샘플 백업 데이터.
      // ⚠️ 실제 검색량이 아니라 예시값이므로 source로 명확히 구분해 반환한다.
      usedFallbackSample = true;
      const fallbackList = [
        { keyword: '러닝', recentAverage: 88.5, previousAverage: 65.2, changeRate: 35.7, trend: 'rising' },
        { keyword: '야간관광', recentAverage: 82.1, previousAverage: 66.0, changeRate: 24.4, trend: 'rising' },
        { keyword: '미식여행', recentAverage: 94.0, previousAverage: 81.0, changeRate: 16.0, trend: 'rising' },
        { keyword: '성수동 핫플', recentAverage: 91.2, previousAverage: 79.5, changeRate: 14.7, trend: 'rising' },
        { keyword: '웰니스', recentAverage: 76.4, previousAverage: 67.0, changeRate: 14.0, trend: 'rising' },
        { keyword: 'K-POP', recentAverage: 89.0, previousAverage: 79.0, changeRate: 12.7, trend: 'rising' },
        { keyword: '반려동물 여행', recentAverage: 68.3, previousAverage: 61.0, changeRate: 12.0, trend: 'rising' },
        { keyword: '캠핑', recentAverage: 72.0, previousAverage: 65.0, changeRate: 10.8, trend: 'rising' },
        { keyword: '성지순례', recentAverage: 64.0, previousAverage: 59.0, changeRate: 8.5, trend: 'rising' },
        { keyword: '전통문화', recentAverage: 58.0, previousAverage: 54.0, changeRate: 7.4, trend: 'rising' },
      ];
      trendResults = fallbackList;
    }

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
      source: usedFallbackSample ? 'fallback-sample' : 'NAVER DataLab',
      naverVerified: !usedFallbackSample,
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
