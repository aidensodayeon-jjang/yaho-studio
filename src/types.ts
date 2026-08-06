export interface Genre {
  id: string;
  name: string;
  icon: string;
}

export interface EchoCard {
  id: string;
  rank: number;
  isHot: boolean;
  image: string;
  title: string;
  tags: string[];
  score: number;
  searchVolume: number;
  searchVolumeChange: number; // e.g. 182 (percentage)
  posts: number;
  postsChange: number; // percentage
  youtubeViews?: string; // some have views instead of posts
  youtubeViewsChange?: number;
  genreId: string;
  subtitle: string;
  confidence: number;
  reasonDetails: string[];
  packageSteps?: string[];
  thumbnails?: string[];
  thumbnailImages?: string[];
  aiAssistantContext?: string;
  aiRecommendedActions?: string[];
  stayTimeMinutes?: number;
  targetStayTimeMinutes?: number;
  keywords?: string[];
  addr1?: string;
  contentid?: string;
  contenttypeid?: string;
  tel?: string;
  homepage?: string;
  overview?: string;
  hasOriginalImage?: boolean;
  imageSource?: 'tourApi' | 'placeholder';
  fallbackCategory?: string;
  fallbackLabel?: string;
}

export interface FeedItem {
  id: string;
  channel: 'Instagram' | 'YouTube' | 'Naver' | 'News' | 'TikTok' | 'X';
  title: string;
  value: string;
  change: string; // e.g., "+182%", "156만", "+128%"
  subValue: string; // e.g., "관련 게시물 12,540건", "조회수 (7일)", "검색량(7일) 8,730건"
  trendType: 'up' | 'down' | 'stable';
  chartData: number[]; // 5-6 points for the sparkline
}

export interface Project {
  id: string;
  title: string;
  status: '기획 중' | '분석 중' | '완료';
  progress: number;
  image: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}
