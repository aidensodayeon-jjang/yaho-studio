import { useState, useEffect } from 'react';

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  viewsPerHour: number;
}

export interface YouTubeTrendData {
  keyword: string;
  videoCount: number;
  totalViews: number;
  avgViewsPerHour: number;
  viralLevel: 'high' | 'medium' | 'low';
  topVideos: YouTubeVideoItem[];
  geminiContext?: {
    summary: string;
    entities?: {
      regions?: string[];
      places?: string[];
      activities?: string[];
      themes?: string[];
    };
  } | null;
}

export function useYouTubeTrend(keyword: string) {
  const [data, setData] = useState<YouTubeTrendData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!keyword) return;

    let isMounted = true;
    async function fetchYouTubeTrend() {
      setLoading(true);
      try {
        const response = await fetch(`/api/youtube-trend?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        if (isMounted) {
          if (json.success && json.data) {
            setData(json.data);
          } else {
            setData(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'YouTube 트렌드 수집 실패');
          setData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchYouTubeTrend();
    return () => { isMounted = false; };
  }, [keyword]);

  return { data, loading, error };
}
