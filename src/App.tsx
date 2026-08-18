import React, { useState, useEffect } from 'react';
import OpportunityList from './components/OpportunityList';
import KeywordStudio from './components/KeywordStudio';
import OpportunityDetail from './components/OpportunityDetail';
import { Search, TrendingUp, Sparkles, KeyRound } from 'lucide-react';
import { useTourData } from './hooks/useTourData';
import { useNaverTrends } from './hooks/useNaverTrends';
import { useYouTubePopularTrends, YouTubePopularTrendItem } from './hooks/useYouTubePopularTrends';
import { EchoCard } from './types';
import { LoadingSkeleton } from './components/LoadingSkeleton';

export default function App() {
  const [areaCode, setAreaCode] = useState<number | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('거제 야호');
  const [selectedKeyword, setSelectedKeyword] = useState('거제 야호');
  // When a discovered trend is selected, its structured entities drive the
  // TourAPI POI lookup instead of the raw title. null for manual searches.
  const [selectedTrend, setSelectedTrend] = useState<YouTubePopularTrendItem | null>(null);

  // Three trend boards: 🔎 web keywords (OpenAI web search — 부산병/케어케이션),
  // 🔍 search interest (Google Trends), 🎥 foreign SNS (YouTube RSS themes).
  const [trendMode, setTrendMode] = useState<'web' | 'search' | 'sns'>('web');
  const webChart = useYouTubePopularTrends('/api/web-trends');
  const searchChart = useYouTubePopularTrends('/api/inbound-trends');
  const snsChart = useYouTubePopularTrends('/api/foreign-korea-trends');
  const activeChart = trendMode === 'web' ? webChart : trendMode === 'search' ? searchChart : snsChart;
  const popularTrends = activeChart.popular;
  const risingTrends = activeChart.rising;
  const trendHasBaseline = activeChart.hasBaseline;
  const autoDiscoveredTrends = activeChart.popular;
  const popularYtLoading = activeChart.loading;
  const popularYtError = activeChart.error;
  const { data: tourData, loading: tourLoading, error: tourError, isNationwideFallback } = useTourData(
    areaCode || 1,
    12,
    keyword,
    selectedTrend?.entities
  );
  const [selectedEcho, setSelectedEcho] = useState<EchoCard | null>(null);

  // autoDiscoveredTrends 로드 결과에 따른 state 동기화 & 에러 시 clear
  useEffect(() => {
    if (popularYtError || autoDiscoveredTrends.length === 0) {
      setSelectedEcho(null);
    } else if (autoDiscoveredTrends.length > 0) {
      // 수집 성공 시 첫 번째 트렌드로 기본 선택 동기화
      const first = autoDiscoveredTrends[0];
      setKeyword(first.title);
      setSelectedKeyword(first.title);
      setSelectedTrend(first);
    }
  }, [autoDiscoveredTrends, popularYtError]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      setKeyword(trimmed);
      setSelectedKeyword(trimmed);
      setSelectedTrend(null); // manual search: no structured entities
    }
  };

  const handleSelectTrend = (trend: YouTubePopularTrendItem) => {
    setSearchInput(trend.title);
    setKeyword(trend.title);
    setSelectedKeyword(trend.title);
    setSelectedTrend(trend); // entity-driven POI lookup
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setKeyword('러닝');
    setSelectedKeyword('러닝');
    setSelectedTrend(null);
  };

  const regions = [
    { code: undefined, name: '전국' },
    { code: 1, name: '서울' },
    { code: 6, name: '부산' },
    { code: 2, name: '인천' },
    { code: 3, name: '대전' },
    { code: 4, name: '대구' },
    { code: 5, name: '광주' },
    { code: 7, name: '울산' },
    { code: 39, name: '제주' },
  ];

  useEffect(() => {
    if (tourData && tourData.length > 0) {
      const firstSpot = tourData[0];
      setSelectedEcho({
        id: firstSpot.contentid || 'tour-0',
        rank: 1,
        isHot: true,
        image: firstSpot.firstimage || '/images/hongje_waterfall.png',
        title: firstSpot.title || '관광지',
        tags: ['관광자원', '기회발견'],
        score: 87,
        searchVolume: 0,
        searchVolumeChange: 0,
        posts: 0,
        postsChange: 0,
        genreId: 'general',
        subtitle: '방문 가능성과 주변 관광자원 연계성이 우수한 관광상품 개발 기회 지역입니다.',
        confidence: 95,
        reasonDetails: ['실시간 관광자원 기반 분석', '체류형 관광 코스 개발 가능성 보유'],
        addr1: firstSpot.addr1 || '',
        contentid: firstSpot.contentid,
        contenttypeid: firstSpot.contenttypeid,
      });
    } else {
      setSelectedEcho(null);
    }
  }, [tourData]);

  const handleSelectEcho = (echo: EchoCard) => {
    setSelectedEcho(echo);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200/80 px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-7 h-7 rounded-lg bg-neutral-900 text-white font-black flex items-center justify-center text-xs tracking-tighter">
              Y
            </span>
            <span className="font-extrabold text-sm tracking-tight text-neutral-900">
              YAHO STUDIO
            </span>
          </div>

          <div className="text-xs font-semibold text-neutral-400">
            TREND ➔ POI ➔ OPPORTUNITY ➔ AI
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* Hero Section */}
        <section className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-tight">
              지금 뜨는 트렌드에서<br />다음 여행상품을 발견합니다.
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium leading-relaxed">
              웹·검색·SNS에서 발굴한 외국인 방한 트렌드를 한국관광공사 POI·관광상품 기획으로 연결합니다.
            </p>
          </div>
        </section>

        {/* 1. Realtime Trend Chart (인기 TOP 10 + 급상승) */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black text-neutral-900 tracking-tight">외국인 관광 트렌드 차트</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex bg-neutral-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setTrendMode('web')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${trendMode === 'web' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  🔎 웹 트렌드
                </button>
                <button
                  onClick={() => setTrendMode('search')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${trendMode === 'search' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  🔍 검색
                </button>
                <button
                  onClick={() => setTrendMode('sns')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${trendMode === 'sns' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  🎥 SNS
                </button>
              </div>
              <span className="hidden sm:inline text-[10px] text-neutral-400 font-medium">
                {trendMode === 'web' ? '🔎 웹검색 실화제 키워드' : trendMode === 'search' ? '🌏 Google Trends 검색량' : '🎥 YouTube 조회속도'}
              </span>
            </div>
          </div>

          {popularYtLoading ? (
            <LoadingSkeleton type="trend-list" />
          ) : popularTrends.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center text-xs text-neutral-500">
              YouTube 트렌드 데이터를 불러오지 못했습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* 인기 트렌드 TOP 10 */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-3 space-y-1">
                <div className="flex items-center justify-between px-1.5 pb-1.5 mb-0.5 border-b border-neutral-100">
                  <span className="text-xs font-black text-neutral-900">🔥 인기 트렌드 TOP 10</span>
                  <span className="text-[9px] text-neutral-400 font-medium">{trendMode === 'web' ? '화제도순' : trendMode === 'search' ? '해외 검색 관심도순' : '조회속도순'}</span>
                </div>
                {popularTrends.map((t, idx) => {
                  const isSelected = selectedKeyword === t.title;
                  const rank = t.rank ?? idx + 1;
                  return (
                    <div
                      key={`pop-${t.title}`}
                      onClick={() => handleSelectTrend(t)}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer transition-all ${
                        isSelected ? 'bg-neutral-900/5 ring-1 ring-neutral-900' : 'hover:bg-neutral-100'
                      }`}
                    >
                      <span className={`w-5 text-center text-sm font-black tabular-nums ${rank <= 3 ? 'text-red-500' : 'text-neutral-300'}`}>{rank}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 truncate">{t.title}</p>
                        <p className="text-[9px] text-neutral-400 truncate">
                          {t.poiRegion || t.entities?.regions?.[0] || '국내'} · VIRAL {t.youtubeSignal?.viralLevel ?? '—'}
                        </p>
                      </div>
                      <span className="text-[11px] font-black text-neutral-700 tabular-nums shrink-0">{t.trendScore}</span>
                    </div>
                  );
                })}
              </div>

              {/* 급상승 트렌드 */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-3 space-y-1">
                <div className="flex items-center justify-between px-1.5 pb-1.5 mb-0.5 border-b border-neutral-100">
                  <span className="text-xs font-black text-neutral-900">📈 급상승 트렌드</span>
                  <span className="text-[9px] text-neutral-400 font-medium">{trendMode === 'web' ? '신조어·급상승' : trendMode === 'search' ? '검색 상승률순' : '신규 업로드'}</span>
                </div>
                {risingTrends.map((t, idx) => {
                  const isSelected = selectedKeyword === t.title;
                  const rank = t.rank ?? idx + 1;
                  return (
                    <div
                      key={`rise-${t.title}`}
                      onClick={() => handleSelectTrend(t)}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer transition-all ${
                        isSelected ? 'bg-neutral-900/5 ring-1 ring-neutral-900' : 'hover:bg-neutral-100'
                      }`}
                    >
                      <span className={`w-5 text-center text-sm font-black tabular-nums ${rank <= 3 ? 'text-emerald-500' : 'text-neutral-300'}`}>{rank}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 truncate">{t.title}</p>
                        <p className="text-[9px] text-neutral-400 truncate">
                          {t.poiRegion || t.entities?.regions?.[0] || '국내'} · VIRAL {t.youtubeSignal?.viralLevel ?? '—'}
                        </p>
                      </div>
                      {t.isNew ? (
                        <span className="text-[9px] font-black text-white bg-emerald-500 px-1.5 py-0.5 rounded shrink-0">NEW</span>
                      ) : t.risingRate != null ? (
                        <span className="text-[11px] font-black text-emerald-600 tabular-nums shrink-0">↑{t.risingRate}%</span>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-500 tabular-nums shrink-0">{(t.youtubeSignal?.viewVelocity ?? 0).toLocaleString()}/h</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* 2. Manual Keyword Search */}
        <section className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">직접 트렌드 찾아보기</span>
            <div className="flex items-center space-x-1 text-[11px] text-neutral-400">
              <span>지역:</span>
              <div className="inline-flex bg-neutral-100 p-0.5 rounded-lg">
                {regions.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => setAreaCode(r.code)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                      areaCode === r.code ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="관심 키워드나 콘텐츠 입력..."
                className="w-full pl-9 pr-8 py-2 text-xs text-neutral-900 placeholder-neutral-400 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
              />
              {searchInput && (
                <button type="button" onClick={handleClearSearch} className="absolute right-2.5 top-2 text-neutral-400 text-xs font-bold">
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              분석
            </button>
          </form>
        </section>

        {selectedTrend?.kind === 'keyword' ? (
          /* Keyword trend (부산병 등): AI 브리핑 + 편집 가능한 상품 아이디어 목록 */
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm">
            <KeywordStudio trend={selectedTrend} />
          </section>
        ) : (
          <>
            {/* 3. Opportunity Results Section (POI spot trends) */}
            <section className="space-y-4 pt-2">
              <OpportunityList
                selectedKeyword={selectedKeyword}
                selectedEcho={selectedEcho}
                onSelectEcho={handleSelectEcho}
                tourData={tourData}
                loading={tourLoading}
                error={tourError}
                isNationwideFallback={isNationwideFallback}
              />
            </section>

            {/* 4. Opportunity Detail & AI Product Creation Section */}
            {selectedEcho && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm pt-6">
                <OpportunityDetail
                  selectedEcho={selectedEcho}
                  areaCode={areaCode || 1}
                  onSelectEcho={handleSelectEcho}
                />
              </section>
            )}
          </>
        )}

      </main>

      <footer className="border-t border-neutral-200 bg-white py-8 mt-16 text-center text-xs text-neutral-400">
        YAHO STUDIO — 외국인 방한 트렌드 인텔리전스 & 한국관광공사 TourAPI 기반 관광상품 기획 엔진
      </footer>
    </div>
  );
}
