import { useState, useEffect } from 'react';

export interface YouTubePopularTrendItem {
  title: string;
  summary: string;
  keywords: string[];
  youtubeSignal: {
    viralLevel: string;
    videoTitle: string;
    channelTitle: string;
    viewCount: number;
  };
  naverSignal: {
    changeRate: number;
    trend: string;
  };
}

export function useYouTubePopularTrends() {
  const [trends, setTrends] = useState<YouTubePopularTrendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchPopularTrends() {
      setLoading(true);
      try {
        const response = await fetch('/api/youtube-popular-trends');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            setTrends(json.data);
          } else {
            setTrends([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'YouTube 자동 발견 트렌드 수집 실패');
          setTrends([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPopularTrends();
    return () => { isMounted = false; };
  }, []);

  return { trends, loading, error };
}
