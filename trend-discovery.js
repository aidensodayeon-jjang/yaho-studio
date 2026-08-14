/**
 * YAHO STUDIO — Trend Discovery Engine
 *
 * Pipeline:
 *   YouTube collect (caller) → domestic filter → OpenAI cross-video clustering (PRIMARY)
 *   → deterministic evidence re-verification → generic rejection → scoring
 *   → Naver DataLab enrichment → unified schema
 *
 * Design principle: "LLM proposes, code verifies."
 *   The LLM reasons about which videos share a real tourism phenomenon, but
 *   every trend it returns is re-checked against the actual titles/descriptions
 *   of the source videos it cited. A trend whose anchor entity does not
 *   literally appear in ANY of its cited videos is dropped. This kills the
 *   "인천 = 이스라엘 성지순례" evidence-mismatch bug even when the model hallucinates.
 *
 * If OpenAI is unavailable, a deterministic engine runs instead. It never
 * invents places: regions come from a finite gazetteer, themes from tourism
 * suffix patterns, and a trend is emitted only when the same region+theme
 * co-occurs across ≥2 videos.
 */

import OpenAI from 'openai';

/* ------------------------------------------------------------------ *
 * Gazetteers & lexicons
 * ------------------------------------------------------------------ */

// Korean administrative regions + popular travel neighborhoods.
// Regions are a FINITE, enumerable set — safe to hardcode. POIs are NOT,
// so we never hardcode them; we detect them by suffix instead.
export const KOREAN_REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  '수원', '용인', '고양', '성남', '가평', '양평', '포천', '파주',
  '춘천', '강릉', '속초', '양양', '평창', '정선', '태백',
  '경주', '안동', '포항', '영주', '문경', '통영', '거제', '남해', '창원', '진주',
  '전주', '군산', '여수', '순천', '목포', '담양', '보성',
  '충주', '단양', '공주', '부여', '보령', '태안',
  '제주시', '서귀포',
  '성수', '성수동', '홍대', '연남', '연남동', '망원', '망원동', '합정',
  '강남', '이태원', '한남', '한남동', '을지로', '익선동', '서촌', '북촌',
  '삼청동', '해운대', '광안리', '서면', '전포', '송정', '기장',
  '월미도', '송도', '을왕리', '황리단길', '경리단길', '샤로수길',
];

// Words too generic to stand alone as a trend name.
export const GENERIC_TERMS = new Set([
  '여행', '국내여행', '해외여행', '관광', '맛집', '카페', '핫플', '데이트',
  '축제', '팝업', '공연', '전시', '브이로그', '먹방', '투어', '여행지',
  '성지순례', '나들이', '주말', '당일치기', '겨울', '여름', '봄', '가을',
  '코스', '추천', '베스트', '국내', '전국', '근교', '여행브이로그',
  ...KOREAN_REGIONS, // a bare region name alone is also too generic
]);

// STRONG, unambiguous POI/event suffixes only. Short/ambiguous ones (로, 길,
// 산, 섬, 사, 성, 능, 항 …) are deliberately excluded — they produced garbage
// POIs like "브이로" from "브이로그".
const POI_SUFFIXES = [
  '해수욕장', '해변', '해안도로', '한강공원', '수목원', '식물원', '동물원', '공원',
  '전통시장', '야시장', '시장', '카페거리', '거리', '골목', '광장', '스퀘어',
  '전망대', '타워', '폭포', '계곡', '둘레길', '올레길', '저수지', '호수',
  '팝업스토어', '팝업', '불꽃축제', '물축제', '페스티벌', '박람회', '엑스포', '축제',
  '아쿠아리움', '미술관', '박물관', '한옥마을', '놀이공원', '워터파크',
];

// Tokens that end with a suffix but are NOT places.
const POI_STOPWORDS = new Set(['브이로그', '여행브이로그', '먹방투어', '노포투어']);

// Map a POI suffix → a concise, human-readable theme bucket used for both
// clustering keys and trend titles.
const SUFFIX_BUCKET = {
  '해수욕장': '해변', '해변': '해변', '해안도로': '해변',
  '전통시장': '시장', '야시장': '시장', '시장': '시장',
  '팝업스토어': '팝업', '팝업': '팝업',
  '불꽃축제': '축제', '물축제': '축제', '페스티벌': '축제', '축제': '축제',
  '박람회': '박람회', '엑스포': '박람회',
  '한강공원': '한강공원', '공원': '공원', '수목원': '수목원', '식물원': '식물원',
  '카페거리': '카페거리', '거리': '거리', '골목': '골목', '광장': '광장', '스퀘어': '광장',
  '전망대': '전망대', '타워': '전망대', '한옥마을': '한옥마을',
  '미술관': '전시', '박물관': '전시', '아쿠아리움': '아쿠아리움',
  '놀이공원': '테마파크', '워터파크': '워터파크',
  '폭포': '계곡', '계곡': '계곡', '둘레길': '둘레길', '올레길': '올레길',
  '저수지': '호수', '호수': '호수', '동물원': '동물원',
};

// Activity / experience terms → theme bucket (default: the term itself).
const ACTIVITY_BUCKET = {
  '러닝': '러닝', '마라톤': '러닝', '런닝크루': '러닝',
  '야경': '야경', '야간개장': '야경', '야시장': '야경',
  '캠핑': '캠핑', '차박': '캠핑', '글램핑': '캠핑',
  '서핑': '서핑', '스노클링': '서핑', '다이빙': '서핑',
  '벚꽃': '벚꽃', '단풍': '단풍', '억새': '단풍',
  '일출': '일출', '일몰': '일몰', '해돋이': '일출',
  '촬영지': '촬영지', '드라마촬영지': '촬영지', '영화촬영지': '촬영지', '성지순례': '촬영지',
  '카페투어': '카페투어', '피크닉': '피크닉', '템플스테이': '템플스테이',
  '한복': '한복', '플리마켓': '플리마켓', '트레킹': '트레킹', '등산': '트레킹',
};

const ACTIVITY_TERMS = Object.keys(ACTIVITY_BUCKET);

/* ------------------------------------------------------------------ *
 * Deterministic entity extraction (used for fallback AND verification)
 * ------------------------------------------------------------------ */

/**
 * Extract normalized tourism entities from text.
 * Returns { regions:Set, pois:Set<string>, activities:Set }.
 * POIs are detected via token / adjacent-bigram + strong-suffix matching, so
 * a space-separated place like "광안리 해수욕장" is captured as one unit.
 */
export function extractEntities(text) {
  const t = (text || '').toString();
  const regions = new Set();
  const pois = new Set();
  const activities = new Set();

  for (const r of KOREAN_REGIONS) {
    if (t.includes(r)) regions.add(normalizeRegion(r));
  }
  for (const a of ACTIVITY_TERMS) {
    if (t.includes(a)) activities.add(a);
  }

  const tokens = t.split(/[^가-힣A-Za-z0-9]+/).filter(Boolean);
  const grams = [...tokens];
  for (let i = 0; i < tokens.length - 1; i++) grams.push(`${tokens[i]} ${tokens[i + 1]}`);

  for (const g of grams) {
    if (g.length < 3 || GENERIC_TERMS.has(g) || POI_STOPWORDS.has(g)) continue;
    const suffix = POI_SUFFIXES.find((s) => g.endsWith(s));
    if (!suffix) continue;
    if (g === suffix) continue; // bare suffix, no place prefix
    pois.add(g.replace(/\s+/g, ' ').trim());
  }
  return { regions, pois, activities };
}

const REGION_NORMALIZE = {
  '성수동': '성수', '연남동': '연남', '망원동': '망원', '한남동': '한남',
  '제주시': '제주', '서귀포': '제주',
};
function normalizeRegion(r) {
  return REGION_NORMALIZE[r] || r;
}

// Theme bucket for a POI string (by its suffix) or an activity term.
function bucketForPoi(poi) {
  const suffix = POI_SUFFIXES.find((s) => poi.endsWith(s));
  return suffix ? SUFFIX_BUCKET[suffix] : null;
}

/* ------------------------------------------------------------------ *
 * Evidence verification — the core anti-hallucination gate
 * ------------------------------------------------------------------ */

/**
 * Return the subset of cited videos that genuinely support the trend — i.e.
 * whose title/description literally contains at least one anchor entity.
 */
export function verifyEvidence(anchors, sourceVideos) {
  const clean = anchors
    .filter(Boolean)
    .map((a) => a.toString().toLowerCase().trim())
    .filter((a) => a.length >= 2);
  if (clean.length === 0) return [];
  return sourceVideos.filter((v) => {
    const hay = `${v.title} ${v.description} ${(v.tags || []).join(' ')}`.toLowerCase();
    return clean.some((a) => hay.includes(a));
  });
}

/* ------------------------------------------------------------------ *
 * Scoring & unified schema
 * ------------------------------------------------------------------ */

/**
 * Build one trend item in the CANONICAL schema consumed by the frontend.
 * `videos` are the verified supporting videos (≥1).
 */
export function buildTrendItem({ title, summary, entities, videos, naver, reason }) {
  const sorted = [...videos].sort((a, b) => b.viewsPerHour - a.viewsPerHour);
  const rep = sorted[0];
  const viewVelocity = rep.viewsPerHour;
  const videoCount = videos.length;

  let viralLevel = 'LOW';
  let evidenceScore = 25;
  if (videoCount >= 3 && viewVelocity > 300) {
    viralLevel = 'HIGH';
    evidenceScore = 90;
  } else if (videoCount >= 2) {
    viralLevel = viewVelocity > 100 ? 'MEDIUM' : 'LOW';
    evidenceScore = viewVelocity > 100 ? 65 : 45;
  } else {
    viralLevel = viewVelocity > 200 ? 'MEDIUM' : 'LOW';
    evidenceScore = 30;
  }

  const normalizedViral = Math.min(100, Math.round(viewVelocity / 5));
  const naverChange = naver && typeof naver.changeRate === 'number' ? naver.changeRate : null;
  const naverScore = naverChange != null ? Math.max(0, Math.min(100, 50 + naverChange)) : 50;

  const trendScore = Math.min(
    100,
    Math.round(normalizedViral * 0.4 + evidenceScore * 0.35 + naverScore * 0.25)
  );

  const regions = [...(entities.regions || [])];
  const places = [...(entities.places || [])];
  const events = [...(entities.events || [])];
  const acts = [...(entities.activities || [])];

  return {
    title,
    summary: summary || reason || '소셜 유입이 증가한 국내 관광 연계 트렌드',
    trendScore,
    entities: { regions, places, events, foods: [...(entities.foods || [])], contents: acts },
    youtubeSignal: {
      viralLevel,
      videoTitle: rep.title || '',
      channelTitle: rep.channelTitle || '',
      viewCount: rep.viewCount || 0,
      viewVelocity,
      videoCount,
      sourceVideoIds: videos.map((v) => v.videoId),
    },
    naverSignal: {
      changeRate: naverChange,
      trend:
        naverChange == null ? 'UNVERIFIED' : naverChange > 0 ? 'rising' : naverChange < 0 ? 'falling' : 'stable',
    },
    tourism: {
      score: Math.min(100, trendScore + 10),
      reason: reason || summary || '지역 특화 관광 및 소셜 유입 증가',
    },
    poiName: places[0] || null,
    poiRegion: regions[0] || null,
  };
}

function reasonFor(title) {
  if (title.includes('팝업')) return '인기 팝업스토어 유입과 주변 상권을 결합한 코스 구성 가능';
  if (title.includes('러닝') || title.includes('마라톤')) return '야간·체험형 스포츠 관광 코스로 상품화 가능';
  if (title.includes('축제') || title.includes('페스티벌')) return '지역 대표 행사 참여와 인근 명소 연계 패키지';
  if (title.includes('시장') || title.includes('먹방')) return '전통시장 방문과 로컬 미식 체험 결합';
  if (title.includes('촬영지') || title.includes('성지순례')) return '콘텐츠 성지순례 방문 동선과 주변 관광자원 연계';
  if (title.includes('해변') || title.includes('해수욕장')) return '해변·워터 액티비티와 주변 상권 연계 코스';
  return '지역 특화 관광 자원과 소셜 유입 증가를 결합한 코스';
}

/* ------------------------------------------------------------------ *
 * PRIMARY engine — OpenAI cross-video clustering
 * ------------------------------------------------------------------ */

export async function clusterWithOpenAI({ openaiKey, videos, model = 'gpt-4o-mini' }) {
  const client = new OpenAI({ apiKey: openaiKey });

  // Strip lone surrogates (from slicing emoji mid-pair) and control chars —
  // otherwise the OpenAI request body is rejected as invalid JSON (400).
  const clean = (str) =>
    (str || '')
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
      .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .trim();

  const list = videos
    .map((v, i) => {
      const tags = (v.tags || []).map(clean).join(', ');
      return `[${i}] 제목:${clean(v.title)}\n    설명:${clean(v.description).slice(0, 140)}\n    태그:${tags}\n    (채널:${clean(v.channelTitle)} | 조회:${v.viewCount} | 시청속도:${v.viewsPerHour}/h)`;
    })
    .join('\n');

  const system =
    '당신은 대한민국 국내 관광·핫플레이스 트렌드 분석가입니다. YouTube/Shorts 콘텐츠에서 ' +
    '지금 SNS에서 화제가 되고 있는 "구체적인 실제 장소·업장(카페·수영장·펜션·전시·팝업·맛집 등의 상호명/브랜드명)"을 ' +
    '지역과 묶어 포착합니다. 해외여행, 정치/시사, 연예 가십, 광고는 제외합니다.';

  const user = `아래는 최근 국내에서 유입 속도가 높은 YouTube/Shorts 콘텐츠입니다. (제목·설명·태그 포함)

${list}

[작업]
지금 SNS에서 화제가 되는 "구체적인 장소/업장 고유명사"를 지역과 묶어 트렌드로 추출하세요.
지향하는 형태 예시: "경주 리센느", "거제 리센트", "영월 왕사남", "양양 서피비치", "포항 스페이스워크".

[엄격 규칙]
1. trendTitle = "지역 + 실제 상호/장소 고유명사" 형태.
   - ✅ 좋음: 실제 카페·수영장·펜션·전시·팝업·맛집의 고유한 이름 (예: 리센느, 왕사남, 서피비치)
   - ❌ 절대 금지: "OO 여행", "OO 맛집 코스", "OO 여행 추천", "OO 힐링" 같은 일반명사 조합. 단독 지역명도 금지.
2. 고유명사는 반드시 영상 제목/설명/태그에 실제로 등장하는 단어여야 합니다. 지어내지 마세요.
3. 해시태그(#영월왕사남 등)에서 상호명을 적극적으로 찾아내세요.
4. 아직 대중적으로 유명하지 않아도, 최근 여러 콘텐츠에 반복 등장하는 신상 스팟을 우선하세요.
5. 진짜 화제 스팟이 적으면 적게 반환하세요. 억지로 일반명사로 채우지 마세요.
6. sourceVideoIndexes = 그 스팟이 실제 등장한 영상 번호만.
7. anchor = 그 장소의 핵심 고유명사 한 단어(검증에 사용). 오직 순수 JSON.

[JSON 형상]
{
  "trends": [
    {
      "trendTitle": "경주 리센느",
      "summary": "경주 신상 감성카페 '리센느' 방문 콘텐츠가 급증",
      "anchor": "리센느",
      "entities": { "regions": ["경주"], "places": ["리센느"], "events": [], "activities": ["카페투어"] },
      "sourceVideoIndexes": [0, 3]
    }
  ]
}`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.trends || [];
}

/* ------------------------------------------------------------------ *
 * FALLBACK engine — deterministic region × theme clustering
 * ------------------------------------------------------------------ */

export function clusterDeterministic(videos, debug) {
  // key: `${region}|${bucket}` → { region, bucket, videos:Set, poiCounts:Map }
  const clusters = new Map();

  for (const video of videos) {
    const text = `${video.title} ${video.description}`;
    const { regions, pois, activities } = extractEntities(text);
    if (regions.size === 0) continue; // a trend needs a real Korean region anchor

    // Themes present in this video: from POI suffixes and from activities.
    const themes = new Map(); // bucket -> representative specific POI (or null)
    for (const p of pois) {
      const b = bucketForPoi(p);
      if (b && !themes.has(b)) themes.set(b, p);
    }
    for (const a of activities) {
      const b = ACTIVITY_BUCKET[a] || a;
      if (!themes.has(b)) themes.set(b, null);
    }
    if (themes.size === 0) continue; // region alone is too generic

    for (const region of regions) {
      for (const [bucket, specificPoi] of themes) {
        const key = `${region}|${bucket}`;
        if (!clusters.has(key)) {
          clusters.set(key, { region, bucket, videos: new Set(), poiCounts: new Map() });
        }
        const c = clusters.get(key);
        c.videos.add(video);
        if (specificPoi) c.poiCounts.set(specificPoi, (c.poiCounts.get(specificPoi) || 0) + 1);
      }
    }
  }

  if (debug) debug.fallbackClustersCount = clusters.size;

  const results = [];
  for (const [, c] of clusters) {
    const vids = [...c.videos];
    // The whole point of clustering: require ≥2 distinct videos.
    if (vids.length < 2) {
      debug && debug.singleVideoRejectedCount++;
      continue;
    }

    // Title: prefer the most common specific POI; else "지역 테마".
    let title;
    const places = [];
    if (c.poiCounts.size > 0) {
      const best = [...c.poiCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      places.push(best);
      title = best.includes(c.region) ? best : `${c.region} ${best}`;
    } else {
      title = `${c.region} ${c.bucket}`;
    }
    if (GENERIC_TERMS.has(title.trim())) {
      debug && debug.genericTrendRejectedCount++;
      continue;
    }

    results.push({
      trendTitle: title,
      summary: '',
      anchor: places[0] || c.region,
      entities: {
        regions: [c.region],
        places,
        events: ['축제', '팝업', '박람회'].includes(c.bucket) ? [c.bucket] : [],
        activities: places.length === 0 ? [c.bucket] : [],
      },
      videos: vids,
    });
  }
  return results;
}

/* ------------------------------------------------------------------ *
 * Naver DataLab enrichment (best-effort)
 * ------------------------------------------------------------------ */

async function enrichWithNaver({ trends, clientId, clientSecret }) {
  if (!clientId || !clientSecret || trends.length === 0) return new Map();

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 60);
  const fmt = (d) => d.toISOString().split('T')[0];

  const groups = trends.slice(0, 10).map((t) => {
    const kws = Array.from(
      new Set([...(t.entities.regions || []), ...(t.entities.places || []), ...(t.entities.events || [])])
    )
      .filter(Boolean)
      .slice(0, 5);
    return { groupName: t.title, keywords: kws.length ? kws : [t.title] };
  });

  const fetchBatch = async (batch) => {
    if (batch.length === 0) return [];
    try {
      const r = await fetch('https://openapi.naver.com/v1/datalab/search', {
        method: 'POST',
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          timeUnit: 'date',
          keywordGroups: batch,
        }),
      });
      if (!r.ok) return [];
      return (await r.json()).results || [];
    } catch {
      return [];
    }
  };

  const [a, b] = await Promise.all([fetchBatch(groups.slice(0, 5)), fetchBatch(groups.slice(5, 10))]);
  const byTitle = new Map();
  for (const g of [...a, ...b]) {
    const dp = g.data || [];
    if (dp.length === 0) continue;
    const mid = Math.floor(dp.length / 2);
    const prev = dp.slice(0, mid).reduce((s, x) => s + x.ratio, 0) / (mid || 1);
    const recent = dp.slice(mid).reduce((s, x) => s + x.ratio, 0) / (dp.length - mid || 1);
    const changeRate = prev > 0 ? Number((((recent - prev) / prev) * 100).toFixed(1)) : Number(recent.toFixed(1));
    byTitle.set(g.title, { changeRate });
  }
  return byTitle;
}

/* ------------------------------------------------------------------ *
 * ORCHESTRATOR
 * ------------------------------------------------------------------ */

/**
 * Collapse near-duplicate trends. Input must be pre-sorted by trendScore desc
 * so the first (best) representative of a duplicate group is kept. Two trends
 * are duplicates if they share the same specific POI, or one title contains
 * the other, or their source-video sets substantially overlap.
 */
export function dedupeTrends(items) {
  const kept = [];
  for (const it of items) {
    const poi = (it.poiName || '').trim();
    const ids = new Set(it.youtubeSignal.sourceVideoIds);
    const dup = kept.some((k) => {
      if (poi && k.poiName && k.poiName.trim() === poi) return true;
      if (k.title.includes(it.title) || it.title.includes(k.title)) return true;
      const kIds = k.youtubeSignal.sourceVideoIds;
      const overlap = kIds.filter((id) => ids.has(id)).length;
      const minLen = Math.min(kIds.length, ids.size) || 1;
      return overlap / minLen >= 0.6;
    });
    if (!dup) kept.push(it);
  }
  return kept;
}

export async function discoverTrends({
  domesticVideos,
  openaiKey,
  naverClientId,
  naverClientSecret,
  debug,
}) {
  const videos = domesticVideos.slice(0, 30);

  let rawClusters = [];
  let extractionSource = 'fallback';

  if (openaiKey && videos.length > 0) {
    try {
      const clusters = await clusterWithOpenAI({ openaiKey, videos });
      rawClusters = clusters.map((c) => ({
        trendTitle: c.trendTitle,
        summary: c.summary,
        anchor: c.anchor,
        entities: {
          regions: c.entities?.regions || [],
          places: c.entities?.places || [],
          events: c.entities?.events || [],
          activities: c.entities?.activities || [],
        },
        videos: (c.sourceVideoIndexes || []).map((i) => videos[i]).filter(Boolean),
      }));
      extractionSource = 'openai';
      if (debug) debug.geminiStatus = 'openai_success';
    } catch (err) {
      if (debug) {
        debug.geminiStatus = 'openai_error_fallback';
        debug.rejectedList.push({ name: 'openai', stage: 'LLM_ERROR', reason: err?.message || String(err) });
      }
      extractionSource = 'fallback';
    }
  }

  if (extractionSource === 'fallback') {
    rawClusters = clusterDeterministic(videos, debug);
  }
  if (debug) debug.extractionSource = extractionSource;

  // VERIFY (both engines).
  const verified = [];
  for (const c of rawClusters) {
    const title = (c.trendTitle || '').trim();
    if (!title || GENERIC_TERMS.has(title)) {
      debug && debug.genericTrendRejectedCount++;
      debug && debug.rejectedList.push({ name: title || '(빈 제목)', stage: 'GENERIC_FILTER', reason: 'generic/단독 트렌드' });
      continue;
    }
    if (title.split(/\s+/).length < 2 && !POI_SUFFIXES.some((s) => title.includes(s))) {
      debug && debug.genericTrendRejectedCount++;
      debug && debug.rejectedList.push({ name: title, stage: 'GENERIC_SINGLE_FILTER', reason: '단일 토큰 트렌드' });
      continue;
    }

    const anchors = [c.anchor, ...(c.entities.places || []), ...(c.entities.regions || []), ...(c.entities.events || [])];
    const supporting = verifyEvidence(anchors, c.videos || []);
    if (supporting.length === 0) {
      debug && debug.evidenceMismatchRejectedCount++;
      debug && debug.rejectedList.push({ name: title, stage: 'EVIDENCE_VALIDATION', reason: '근거 영상에 트렌드 핵심 단어 부재' });
      continue;
    }
    verified.push({ ...c, trendTitle: title, videos: supporting });
  }

  if (debug) debug.validClustersCount = verified.length;

  const naverMap = await enrichWithNaver({
    trends: verified.map((v) => ({ title: v.trendTitle, entities: v.entities })),
    clientId: naverClientId,
    clientSecret: naverClientSecret,
  });

  const built = verified
    .map((c) =>
      buildTrendItem({
        title: c.trendTitle,
        summary: c.summary,
        entities: c.entities,
        videos: c.videos,
        naver: naverMap.get(c.trendTitle) || null,
        reason: reasonFor(c.trendTitle),
      })
    )
    .sort((a, b) => b.trendScore - a.trendScore);

  const data = dedupeTrends(built).slice(0, 10);
  return { data, extractionSource };
}
