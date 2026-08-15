/**
 * YAHO STUDIO — YouTube trend board via channel RSS (quota-free).
 *
 * Inspired by github.com/daehyub71/utube-trend-tracer: poll YouTube channel RSS
 * feeds instead of the Search API. RSS is free (no quota) AND includes view
 * counts (<media:statistics views="…">), so we can rank recent videos by view
 * velocity — the credibility signal the thin Search-API sample never had.
 *
 * Scope: foreign / foreigner-facing Korea-travel channels → "what foreign
 * audiences are watching about Korea right now" (inbound-aligned).
 *
 *   트렌딩 = highest view velocity over recent uploads.
 *   급상승 = freshest uploads (<72h) climbing fastest.
 *
 * Curate CHANNELS freely — the ranking stays data-driven. Add a channel by its
 * channel_id (UC…); resolve one from a @handle at youtube.com/@handle.
 *
 * The board is not "travel spots" — it's what foreign audiences are trending on
 * about Korea broadly (K-beauty / Olive Young / 찜질방 / 한식 / cafes / spots …),
 * clustered into inbound-productizable THEMES by OpenAI and ranked by the real
 * view velocity of the videos behind each theme.
 */

import { llmGenerateJson } from './llm.js';

// Starter list (editable). name is display-only; id drives the RSS feed.
export const CHANNELS = [
  { id: 'UCk0hfXD3cn4o6VnbNT1EBUQ', name: 'Kwaktube' },
  { id: 'UCa-DreapaYm4Roo0CfUBGQg', name: 'Cari Cakes' },
  { id: 'UCBcuQ7eNvJzeJCsEZAwd6Bw', name: 'EuniUnni' },
  { id: 'UCB9etEztDELjmiVu8kP5R-g', name: 'KoreanBilly' },
  { id: 'UCVhMGNuLjgTh4UpQ7usdaRw', name: '블루문 여행자' },
  { id: 'UCsZBIFlE7IvE_bvfhX-FZQw', name: '가보고TV' },
];

const CACHE_TTL = 60 * 60 * 1000; // 1h — RSS is cheap, refresh hourly.
const RECENT_DAYS = 21;
let cache = null;
let cacheTime = 0;

function textBetween(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1] : '';
}

function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

// Parse one channel's RSS into video objects.
function parseFeed(xml, channelName, now) {
  const entries = xml.split('<entry>').slice(1);
  return entries.map((e) => {
    const videoId = textBetween(e, 'yt:videoId');
    const title = decodeEntities(textBetween(e, 'title'));
    const published = textBetween(e, 'published');
    const viewsMatch = e.match(/<media:statistics\s+views="(\d+)"/);
    const viewCount = viewsMatch ? Number(viewsMatch[1]) : 0;
    const pub = published ? new Date(published) : new Date();
    const hoursSince = Math.max((now - pub.getTime()) / (1000 * 60 * 60), 1);
    return {
      videoId,
      title,
      channelTitle: channelName,
      publishedAt: published,
      viewCount,
      viewsPerHour: Math.round(viewCount / hoursSince),
      hoursSince,
    };
  }).filter((v) => v.videoId && v.viewCount > 0);
}

async function fetchChannel(ch, now) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`RSS ${r.status} for ${ch.name}`);
  return parseFeed(await r.text(), ch.name, now);
}

function toItem(v, rank, risingRate) {
  const vph = v.viewsPerHour;
  const viralLevel = vph > 3000 ? 'HIGH' : vph > 500 ? 'MEDIUM' : 'LOW';
  return {
    title: v.title,
    summary: `${v.channelTitle} · 조회 ${v.viewCount.toLocaleString()} · ${vph.toLocaleString()}회/h`,
    trendScore: Math.min(100, Math.round(vph / 50)),
    entities: { regions: [], places: [], events: [], foods: [], contents: [] },
    youtubeSignal: {
      viralLevel,
      videoTitle: v.title,
      channelTitle: v.channelTitle,
      viewCount: v.viewCount,
      viewVelocity: vph,
      videoCount: 1,
      sourceVideoIds: [v.videoId],
    },
    naverSignal: { changeRate: null, trend: 'UNVERIFIED' },
    tourism: { score: 0, reason: '' },
    poiName: null,
    poiRegion: null,
    videoId: v.videoId,
    videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
    channelTitle: v.channelTitle,
    viewCount: v.viewCount,
    risingRate: typeof risingRate === 'number' ? risingRate : null,
    isNew: v.hoursSince <= 72,
    rank,
  };
}

/**
 * Fetch + rank the foreign Korea-travel video trend board.
 * Returns { popular (trending by velocity), rising (fresh fast-climbers) }.
 */
export async function fetchYoutubeInboundTrends(now = Date.now()) {
  if (cache && now - cacheTime < CACHE_TTL) return { ...cache, source: 'cache' };

  const settled = await Promise.allSettled(CHANNELS.map((ch) => fetchChannel(ch, now)));
  const all = [];
  for (const s of settled) if (s.status === 'fulfilled') all.push(...s.value);

  const cutoff = now - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const recent = all.filter((v) => new Date(v.publishedAt).getTime() >= cutoff);

  if (recent.length === 0) {
    if (cache) return { ...cache, source: 'cache-fallback' };
    return { popular: [], rising: [], source: 'empty', builtAt: new Date(now).toISOString() };
  }

  const popular = [...recent]
    .sort((a, b) => b.viewsPerHour - a.viewsPerHour)
    .slice(0, 10)
    .map((v, i) => toItem(v, i + 1, null));

  // 급상승: uploaded within 72h, ranked by velocity.
  const rising = [...recent]
    .filter((v) => v.hoursSince <= 72)
    .sort((a, b) => b.viewsPerHour - a.viewsPerHour)
    .slice(0, 10)
    .map((v, i) => toItem(v, i + 1, null));

  cache = { popular, rising, builtAt: new Date(now).toISOString() };
  cacheTime = now;
  return { ...cache, source: 'live' };
}

/* ------------------------------------------------------------------ *
 * Theme board — cluster the trending videos into foreign-Korea-interest
 * themes (OpenAI) ranked by aggregate view velocity.
 * ------------------------------------------------------------------ */

let themeCache = null;
let themeCacheTime = 0;

function themeItem(theme, vids, rank) {
  const totalVph = vids.reduce((s, v) => s + v.viewsPerHour, 0);
  const rep = [...vids].sort((a, b) => b.viewsPerHour - a.viewsPerHour)[0];
  const viralLevel = totalVph > 3000 ? 'HIGH' : totalVph > 800 ? 'MEDIUM' : 'LOW';
  const hasFresh = vids.some((v) => v.hoursSince <= 72);
  return {
    title: theme.title,
    summary: theme.summary || `외국인 관심 한국 트렌드 · ${vids.length}개 영상`,
    trendScore: Math.min(100, Math.round(totalVph / 60)),
    entities: {
      regions: theme.regions || [],
      places: theme.places || [],
      events: [],
      foods: theme.foods || [],
      contents: [theme.title],
    },
    youtubeSignal: {
      viralLevel,
      videoTitle: rep?.title || '',
      channelTitle: rep?.channelTitle || '',
      viewCount: rep?.viewCount || 0,
      viewVelocity: totalVph,
      videoCount: vids.length,
      sourceVideoIds: vids.map((v) => v.videoId),
    },
    naverSignal: { changeRate: null, trend: 'UNVERIFIED' },
    tourism: { score: Math.min(100, Math.round(totalVph / 60) + 10), reason: theme.productHint || '인바운드 상품화 가능 테마' },
    poiName: (theme.places && theme.places[0]) || null,
    poiRegion: (theme.regions && theme.regions[0]) || null,
    category: '외국인 SNS',
    productHint: theme.productHint || '',
    kind: 'keyword', // theme → keyword studio flow
    exampleVideoUrl: rep ? `https://www.youtube.com/watch?v=${rep.videoId}` : null,
    risingRate: null,
    isNew: hasFresh,
    rank,
  };
}

export async function fetchForeignKoreaThemes({ openaiKey, geminiKey, now = Date.now() }) {
  if (themeCache && now - themeCacheTime < CACHE_TTL) return { ...themeCache, source: 'cache' };

  // Collect recent videos (reuse the raw board's data).
  const settled = await Promise.allSettled(CHANNELS.map((ch) => fetchChannel(ch, now)));
  const all = [];
  for (const s of settled) if (s.status === 'fulfilled') all.push(...s.value);
  const cutoff = now - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const recent = all
    .filter((v) => new Date(v.publishedAt).getTime() >= cutoff)
    .sort((a, b) => b.viewsPerHour - a.viewsPerHour)
    .slice(0, 30);

  if (recent.length === 0) {
    if (themeCache) return { ...themeCache, source: 'cache-fallback' };
    return { popular: [], rising: [], source: 'empty', builtAt: new Date(now).toISOString() };
  }

  const list = recent
    .map((v, i) => `[${i}] ${v.title} (채널:${v.channelTitle}, ${v.viewsPerHour}회/h)`)
    .join('\n');

  const system =
    '당신은 인바운드(외국인) 관광·라이프스타일 트렌드 분석가입니다. 외국인 대상 한국 콘텐츠에서 ' +
    '지금 외국인이 관심갖는 "한국 트렌드 테마"를 뽑아 인바운드 상품화 관점으로 묶습니다.';
  const user = `아래는 외국인 대상 한국 유튜브 영상들입니다 (조회속도 포함).

${list}

[작업]
외국인이 지금 관심갖는 "한국 트렌드 테마"로 클러스터링하세요. 관광 스팟에 국한하지 말고,
K-뷰티/올리브영 쇼핑, 한국 찜질방·사우나, 한식·먹방, 다이소 쇼핑, 성수동 카페, 한강 피크닉,
한복 체험, K-POP 성지 등 인바운드 체험상품이 될 수 있는 테마를 폭넓게 뽑으세요.

[규칙]
1. title = 구체적이고 상품화 가능한 테마명 (예: "올리브영 K-뷰티 쇼핑", "한국 찜질방 체험").
2. sourceVideoIndexes = 그 테마를 뒷받침하는 영상 번호.
3. regions/places = 관련 지역·장소가 명확하면만 채우고, 없으면 빈 배열.
4. productHint = 이 테마로 만들 수 있는 인바운드 상품 한 줄.
5. 오직 순수 JSON.

[JSON 형상]
{ "themes": [ { "title": "올리브영 K-뷰티 쇼핑", "summary": "외국인의 올리브영 쇼핑 콘텐츠 급증", "regions": ["서울"], "places": ["명동"], "foods": [], "productHint": "명동 올리브영 K-뷰티 쇼핑 가이드 투어", "sourceVideoIndexes": [0,2] } ] }`;

  let themes = [];
  try {
    const { data } = await llmGenerateJson({ system, user, openaiKey, geminiKey, temperature: 0.4 });
    themes = Array.isArray(data) ? data : data.themes || [];
  } catch (err) {
    console.log('[YouTube themes] LLM failed:', err?.message || err);
    if (themeCache) return { ...themeCache, source: 'cache-fallback' };
    return { popular: [], rising: [], source: 'llm-error', builtAt: new Date(now).toISOString() };
  }

  const built = themes
    .map((t) => {
      const vids = (t.sourceVideoIndexes || []).map((i) => recent[i]).filter(Boolean);
      return vids.length > 0 ? { theme: t, vids } : null;
    })
    .filter(Boolean)
    .map(({ theme, vids }) => themeItem(theme, vids, 0));

  const popular = [...built].sort((a, b) => b.trendScore - a.trendScore).slice(0, 10).map((t, i) => ({ ...t, rank: i + 1 }));
  const rising = [...built].filter((t) => t.isNew).sort((a, b) => b.youtubeSignal.viewVelocity - a.youtubeSignal.viewVelocity).slice(0, 10).map((t, i) => ({ ...t, rank: i + 1 }));

  themeCache = { popular, rising, builtAt: new Date(now).toISOString() };
  themeCacheTime = now;
  return { ...themeCache, source: 'live' };
}
