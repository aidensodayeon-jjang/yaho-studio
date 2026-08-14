/**
 * YAHO STUDIO — Inbound (foreign-tourist) trend source via Google Trends.
 *
 * We do NOT try to detect trends from a thin video sample (not credible at this
 * scale). Instead we rank a curated universe of foreign-relevant Korea spots by
 * REAL global search interest (Google Trends interestOverTime). The universe is
 * honest reference data (the known inbound-relevant attractions); the ranking —
 * what's popular and what's rising — comes from actual aggregated search data.
 *
 *   인기 (popular)  = current global search interest (anchor-normalized).
 *   급상승 (rising) = recent-vs-prior growth in that interest.
 *
 * English query terms + worldwide geo ≈ foreign interest (Koreans search in
 * Korean). Google Trends is unofficial/flaky, so results are cached 24h and the
 * last good snapshot is served on failure.
 */

import googleTrends from 'google-trends-api';

// Curated inbound universe: { ko (display), en (Trends query), region, type }.
// Edit this list to change the candidate set — the ranking stays data-driven.
export const INBOUND_SPOTS = [
  { ko: '명동', en: 'Myeongdong', region: '서울', type: '쇼핑거리' },
  { ko: '경복궁', en: 'Gyeongbokgung', region: '서울', type: '고궁' },
  { ko: '북촌한옥마을', en: 'Bukchon Hanok Village', region: '서울', type: '한옥마을' },
  { ko: '남산서울타워', en: 'Namsan Seoul Tower', region: '서울', type: '전망대' },
  { ko: '홍대', en: 'Hongdae', region: '서울', type: '번화가' },
  { ko: '이태원', en: 'Itaewon', region: '서울', type: '번화가' },
  { ko: '인사동', en: 'Insadong', region: '서울', type: '전통거리' },
  { ko: '청계천', en: 'Cheonggyecheon', region: '서울', type: '하천' },
  { ko: '광장시장', en: 'Gwangjang Market', region: '서울', type: '전통시장' },
  { ko: '동대문디자인플라자', en: 'Dongdaemun Design Plaza', region: '서울', type: '전시' },
  { ko: '한강공원', en: 'Han River Park', region: '서울', type: '공원' },
  { ko: '강남', en: 'Gangnam', region: '서울', type: '번화가' },
  { ko: '롯데월드', en: 'Lotte World', region: '서울', type: '테마파크' },
  { ko: '서울 야경', en: 'Seoul at night', region: '서울', type: '야경' },
  { ko: '부산 해운대', en: 'Haeundae Beach', region: '부산', type: '해변' },
  { ko: '감천문화마을', en: 'Gamcheon Culture Village', region: '부산', type: '문화마을' },
  { ko: '제주도', en: 'Jeju Island', region: '제주', type: '섬' },
  { ko: '경주', en: 'Gyeongju', region: '경주', type: '역사도시' },
  { ko: '전주한옥마을', en: 'Jeonju Hanok Village', region: '전주', type: '한옥마을' },
  { ko: '안동하회마을', en: 'Andong Hahoe Village', region: '안동', type: '민속마을' },
  { ko: '남이섬', en: 'Nami Island', region: '가평', type: '섬' },
  { ko: '에버랜드', en: 'Everland', region: '용인', type: '테마파크' },
  { ko: 'DMZ', en: 'DMZ Korea', region: '경기', type: '안보관광' },
  { ko: '한복 체험', en: 'Hanbok experience', region: '서울', type: '체험' },
];

// A high-volume spot present in every batch so batches can be cross-normalized
// onto one scale (anchor := 100).
const ANCHOR = INBOUND_SPOTS[0]; // 명동 / Myeongdong

const CACHE_TTL = 24 * 60 * 60 * 1000; // Trends data is daily; cache a full day.
let cache = null; // { popular, rising, builtAt }
let cacheTime = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// Recent vs prior split of a normalized series → { recent, growthPct }.
function seriesStats(values) {
  const n = values.length;
  if (n === 0) return { recent: 0, prior: 0 };
  const mid = Math.floor(n * 0.7);
  return { recent: avg(values.slice(mid)), prior: avg(values.slice(0, mid)) };
}

async function interestBatchOnce(spots, startTime) {
  const keywords = spots.map((s) => s.en);
  const res = await googleTrends.interestOverTime({ keyword: keywords, startTime, geo: '', hl: 'en-US' });
  if (res.trim().startsWith('<')) throw new Error('rate-limited (429 HTML)');
  const timeline = JSON.parse(res).default?.timelineData || [];
  if (timeline.length === 0) throw new Error('empty timeline (likely rate-limited)');
  return spots.map((s, idx) => {
    const values = timeline.map((t) => (t.value && t.value[idx]) || 0);
    return { spot: s, ...seriesStats(values) };
  });
}

// One retry with backoff — Google Trends 429s intermittently.
async function interestBatch(spots, startTime) {
  try {
    return await interestBatchOnce(spots, startTime);
  } catch (err) {
    await sleep(8000);
    return await interestBatchOnce(spots, startTime);
  }
}

// Static fallback so the chart is never empty when Trends is unreachable.
// INBOUND_SPOTS is authored roughly popularity-first; use that order.
function buildFallback(now) {
  const popular = INBOUND_SPOTS.slice(0, 10).map((s, i) =>
    ({ ...toItem(s, Math.max(20, 70 - i * 5), null), rank: i + 1 })
  );
  return { popular, rising: [], builtAt: new Date(now).toISOString() };
}

function toItem(spot, interest, risingRate) {
  const viralLevel = interest >= 60 ? 'HIGH' : interest >= 25 ? 'MEDIUM' : 'LOW';
  return {
    title: spot.ko,
    summary: `${spot.region} · ${spot.type} — 외국인 검색 관심도 기반`,
    trendScore: Math.round(interest),
    entities: { regions: [spot.region], places: [spot.ko], events: [], foods: [], contents: [] },
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
    tourism: { score: Math.min(100, Math.round(interest) + 10), reason: `${spot.type} 방문 수요` },
    poiName: spot.ko,
    poiRegion: spot.region,
    risingRate: typeof risingRate === 'number' ? risingRate : null,
    isNew: false,
    searchInterest: Math.round(interest),
  };
}

/**
 * Rank the inbound universe by Google Trends. Returns { popular, rising, source }.
 * Cached 24h; serves the last good snapshot if Trends is unavailable.
 */
export async function fetchInboundTrends(now = Date.now()) {
  if (cache && now - cacheTime < CACHE_TTL) {
    return { ...cache, source: 'cache' };
  }

  const startTime = new Date(now - 90 * 24 * 60 * 60 * 1000);
  // Batches of (anchor + 4 others) so every batch shares the anchor.
  const others = INBOUND_SPOTS.filter((s) => s.en !== ANCHOR.en);
  const batches = [];
  for (let i = 0; i < others.length; i += 4) batches.push([ANCHOR, ...others.slice(i, i + 4)]);

  const stats = new Map(); // en -> { interest (anchor-normalized), growthPct }
  try {
    for (const batch of batches) {
      const results = await interestBatch(batch, startTime);
      const anchorRecent = results.find((r) => r.spot.en === ANCHOR.en)?.recent || 1;
      for (const r of results) {
        const interest = (r.recent / (anchorRecent || 1)) * 100; // anchor := 100
        const growthPct = r.prior > 0 ? Math.round(((r.recent - r.prior) / r.prior) * 100) : null;
        if (!stats.has(r.spot.en)) stats.set(r.spot.en, { interest, growthPct });
      }
      await sleep(3000); // be gentle with Google Trends (avoid 429)
    }
  } catch (err) {
    console.log('[Google Trends] failed:', err?.message || err);
    if (cache) return { ...cache, source: 'cache-fallback' };
    return { ...buildFallback(now), source: 'fallback-default' }; // never empty
  }

  const items = INBOUND_SPOTS.map((s) => {
    const st = stats.get(s.en) || { interest: 0, growthPct: null };
    return toItem(s, st.interest, st.growthPct);
  });

  const popular = [...items]
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 10)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  const rising = [...items]
    .filter((t) => typeof t.risingRate === 'number' && t.risingRate > 0)
    .sort((a, b) => (b.risingRate ?? 0) - (a.risingRate ?? 0))
    .slice(0, 10)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  cache = { popular, rising, builtAt: new Date(now).toISOString() };
  cacheTime = now;
  return { ...cache, source: 'live' };
}
