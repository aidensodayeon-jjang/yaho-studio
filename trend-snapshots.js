/**
 * YAHO STUDIO — Trend snapshot store & rising-rate computation.
 *
 * To make the trend chart behave like a real ranking chart (인기가요 순위차트)
 * rather than a fresh random draw each load, we persist periodic snapshots of
 * the discovered trends and compute a REAL growth rate by comparing the current
 * run against a baseline snapshot from ~24h earlier.
 *
 * Cold start: until there is a baseline (first day, before data accumulates),
 * `computeRising` marks all trends as velocity-based so the 급상승 list is never
 * empty — it just carries `risingRate: null` and the caller ranks by velocity.
 *
 * Storage is a bounded JSON file (no DB): data/trend-snapshots.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'trend-snapshots.json');

const MAX_SNAPSHOTS = 60; // bounded history
const MIN_SAVE_INTERVAL_MS = 60 * 60 * 1000; // don't snapshot more than 1×/hour
const BASELINE_TARGET_MS = 24 * 60 * 60 * 1000; // compare against ~24h ago
const BASELINE_MIN_AGE_MS = 2 * 60 * 60 * 1000; // baseline must be ≥2h old

export function normalizeKey(title) {
  return (title || '').toString().toLowerCase().replace(/\s+/g, '');
}

function readSnapshots() {
  try {
    const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSnapshots(snapshots) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshots.slice(-MAX_SNAPSHOTS)), 'utf8');
  } catch (err) {
    console.log('[Snapshots] write failed:', err?.message || err);
  }
}

/**
 * Persist a snapshot of the current trends (throttled to ≤1/hour).
 * `trends` are canonical trend items (with title, trendScore, youtubeSignal).
 */
export function saveSnapshot(trends, now = Date.now()) {
  if (!Array.isArray(trends) || trends.length === 0) return;
  const snapshots = readSnapshots();
  const last = snapshots[snapshots.length - 1];
  if (last && now - last.ts < MIN_SAVE_INTERVAL_MS) return; // throttle

  snapshots.push({
    ts: now,
    trends: trends.map((t) => ({
      key: normalizeKey(t.title),
      title: t.title,
      trendScore: t.trendScore,
      viewVelocity: t.youtubeSignal?.viewVelocity ?? 0,
    })),
  });
  writeSnapshots(snapshots);
}

/**
 * Attach `risingRate` (number | null) and `isNew` (bool) to each trend.
 * - risingRate: % change in trendScore vs the ~24h baseline (rounded).
 * - isNew: trend not present in the baseline snapshot (just appeared).
 * - When no usable baseline exists yet (cold start), all get
 *   risingRate:null / isNew:false and the caller ranks 급상승 by velocity.
 */
export function computeRising(trends, now = Date.now()) {
  const snapshots = readSnapshots();
  const older = snapshots.filter((s) => now - s.ts >= BASELINE_MIN_AGE_MS);

  let baseline = null;
  if (older.length > 0) {
    const target = now - BASELINE_TARGET_MS;
    baseline = older.reduce((best, s) =>
      Math.abs(s.ts - target) < Math.abs(best.ts - target) ? s : best
    );
  }

  if (!baseline) {
    return {
      hasBaseline: false,
      trends: trends.map((t) => ({ ...t, risingRate: null, isNew: false })),
    };
  }

  const baseMap = new Map(baseline.trends.map((t) => [t.key, t.trendScore]));
  const withRising = trends.map((t) => {
    const key = normalizeKey(t.title);
    if (baseMap.has(key)) {
      const base = baseMap.get(key);
      const rate = base > 0 ? Math.round(((t.trendScore - base) / base) * 100) : 0;
      return { ...t, risingRate: rate, isNew: false };
    }
    return { ...t, risingRate: null, isNew: true };
  });

  return { hasBaseline: true, baselineTs: baseline.ts, trends: withRising };
}

/**
 * Split trends into the two chart lists.
 * - popular: top by trendScore.
 * - rising: NEW trends first, then largest positive growth; on cold start,
 *   fall back to raw view velocity so the list is populated day one.
 */
export function buildCharts(trendsWithRising, hasBaseline, topN = 10) {
  const popular = [...trendsWithRising]
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, topN)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  let rising;
  if (hasBaseline) {
    rising = [...trendsWithRising]
      .filter((t) => t.isNew || (typeof t.risingRate === 'number' && t.risingRate > 0))
      .sort((a, b) => {
        // NEW trends first, then by risingRate desc.
        if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
        return (b.risingRate ?? 0) - (a.risingRate ?? 0);
      })
      .slice(0, topN)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  } else {
    rising = [...trendsWithRising]
      .sort((a, b) => (b.youtubeSignal?.viewVelocity ?? 0) - (a.youtubeSignal?.viewVelocity ?? 0))
      .slice(0, topN)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }

  return { popular, rising };
}
