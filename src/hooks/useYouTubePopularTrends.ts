import { useState, useEffect } from 'react';

export interface YouTubePopularTrendItem {
  title: string;
  summary: string;
  trendScore: number;
  entities?: {
    people?: string[];
    artists?: string[];
    regions?: string[];
    places?: string[];
    events?: string[];
    foods?: string[];
    memes?: string[];
    contents?: string[];
  };
  youtubeSignal: {
    viralLevel: string;
    videoTitle: string;
    channelTitle: string;
    viewCount: number;
    viewVelocity: number;
    videoCount: number;
    sourceVideoIds: string[];
  };
  naverSignal: {
    changeRate: number | null;
    trend: string;
  };
  tourism?: {
    score: number;
    reason: string;
  };
  poiName?: string | null;
  poiRegion?: string | null;
  // Ranking-chart fields
  rank?: number;
  risingRate?: number | null;
  isNew?: boolean;
}

export function useYouTubePopularTrends(url: string = '/api/inbound-trends') {
  const [popular, setPopular] = useState<YouTubePopularTrendItem[]>([]);
  const [rising, setRising] = useState<YouTubePopularTrendItem[]>([]);
  const [hasBaseline, setHasBaseline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchPopularTrends() {
      setLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        if (!isMounted) return;

        // New chart shape: { popular, rising }. Fall back to the old flat
        // array / { data } shape for safety.
        const pop = Array.isArray(json.popular)
          ? json.popular
          : Array.isArray(json) ? json
          : Array.isArray(json.data) ? json.data
          : [];
        setPopular(pop);
        setRising(Array.isArray(json.rising) ? json.rising : pop);
        setHasBaseline(Boolean(json.hasBaseline));
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'YouTube 자동 발견 트렌드 수집 실패');
          setPopular([]);
          setRising([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPopularTrends();
    return () => { isMounted = false; };
  }, [url]);

  // `trends` kept as an alias of `popular` for backward compatibility.
  return { popular, rising, hasBaseline, trends: popular, loading, error };
}
