/**
 * YAHO STUDIO — Foreign-tourist Korea trend keywords via OpenAI web search.
 *
 * The pragmatic approach: journalists and marketers already research and write
 * up the trends (부산병, 케어케이션, 1인 세신 …). Instead of building crawlers +
 * NLP + card-data validation, just let OpenAI web-search those articles and
 * extract meaningful, de-duplicated trend keywords — classified into
 * established-popular vs newly-rising (the static-vs-microtrend split).
 *
 * Uses the caller's OpenAI key (gpt-4o-mini-search-preview). Cached 12h.
 */

import OpenAI from 'openai';

const MODEL = 'gpt-4o-mini-search-preview';
const CACHE_TTL = 12 * 60 * 60 * 1000;
let cache = null;
let cacheTime = 0;

const PROMPT = `웹 검색을 사용해 지금(최근 몇 개월) 방한 외국인 관광객 사이에서 화제인 "한국 여행·라이프스타일 트렌드 키워드"를 찾아 정리하세요.
샤오홍슈/틱톡/레딧/블로그/뉴스/인바운드 플랫폼 리포트를 참고하세요.

[원칙]
- 두 종류를 모두 포함하세요:
  · "popular" = 외국인에게 이미 정착된 인기 (예: 명동 K-뷰티 쇼핑, 한류 성지순례, 한식 미식, 한강 피크닉) — 5~6개.
  · "rising" = 최근 급상승한 신조어·미세 트렌드 (예: 부산병, 케어케이션, 1인 세신, 퍼스널컬러, 성수동 카페) — 8~10개.
- 정적 대형 관념어(경복궁·남산타워 단독)보다 구체적이고 상품화 가능한 형태로.
- 의미가 겹치는 키워드는 하나로 합치세요.
- 인바운드 관광상품으로 만들 수 있어야 함.

[출력: 순수 JSON만. 마크다운 금지]
{
  "trends": [
    {
      "keyword": "부산병",
      "type": "rising",
      "heat": 92,
      "summary": "부산 여행 후 재방문 욕구를 느끼는 여행 후유증 신조어",
      "category": "로컬감성",
      "regions": ["부산"],
      "places": ["광안리", "감천문화마을"],
      "productHint": "부산병 치유 로컬 감성 체류 패키지"
    }
  ]
}`;

function extractJson(text) {
  const cleaned = (text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON in web-search response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function toItem(t, rank) {
  const heat = Math.max(0, Math.min(100, Number(t.heat) || 50));
  const viralLevel = heat >= 75 ? 'HIGH' : heat >= 45 ? 'MEDIUM' : 'LOW';
  return {
    title: t.keyword,
    summary: t.summary || `${t.category || ''} 외국인 관광 트렌드`.trim(),
    trendScore: heat,
    entities: {
      regions: Array.isArray(t.regions) ? t.regions : [],
      places: Array.isArray(t.places) ? t.places : [],
      events: [],
      foods: Array.isArray(t.foods) ? t.foods : [],
      contents: [t.keyword],
    },
    youtubeSignal: {
      viralLevel,
      videoTitle: '',
      channelTitle: '',
      viewCount: 0,
      viewVelocity: 0,
      videoCount: 0,
      sourceVideoIds: [],
    },
    naverSignal: { changeRate: null, trend: 'UNVERIFIED' },
    tourism: { score: Math.min(100, heat + 10), reason: t.productHint || '인바운드 상품화 가능 트렌드' },
    poiName: (Array.isArray(t.places) && t.places[0]) || null,
    poiRegion: (Array.isArray(t.regions) && t.regions[0]) || null,
    category: t.category || '',
    productHint: t.productHint || '',
    kind: 'keyword', // marks a web-trend keyword → keyword studio flow (not POI opportunity)
    isNew: t.type === 'rising',
    risingRate: null,
    rank,
  };
}

/**
 * Returns { popular, rising, source } of foreign-Korea trend keywords.
 * Cached 12h; serves last good snapshot on failure.
 */
export async function fetchWebTrends({ openaiKey, now = Date.now() }) {
  if (!openaiKey) throw new Error('OPENAI_API_KEY 필요');
  if (cache && now - cacheTime < CACHE_TTL) return { ...cache, source: 'cache' };

  let trends = [];
  try {
    const client = new OpenAI({ apiKey: openaiKey });
    const r = await client.chat.completions.create({
      model: MODEL,
      web_search_options: {},
      messages: [{ role: 'user', content: PROMPT }],
    });
    const parsed = extractJson(r.choices?.[0]?.message?.content || '');
    trends = Array.isArray(parsed) ? parsed : parsed.trends || [];
  } catch (err) {
    console.log('[Web Trends] failed:', err?.message || err);
    if (cache) return { ...cache, source: 'cache-fallback' };
    throw err;
  }

  // Dedupe by normalized keyword.
  const seen = new Set();
  const uniq = trends.filter((t) => {
    const k = (t.keyword || '').replace(/\s+/g, '').toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const items = uniq.map((t, i) => toItem(t, i + 1));
  // 인기 = 정착 인기(popular형); 급상승 = 신조어(rising형). 정착이 비면 전체 heat순으로 채움.
  const established = items.filter((t) => !t.isNew);
  const popular = (established.length > 0 ? established : items)
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 10)
    .map((t, i) => ({ ...t, rank: i + 1 }));
  const rising = items
    .filter((t) => t.isNew)
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 10)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  cache = { popular, rising, builtAt: new Date(now).toISOString() };
  cacheTime = now;
  return { ...cache, source: 'live' };
}
