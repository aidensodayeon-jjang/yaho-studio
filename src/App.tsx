import React, { useState, useEffect } from 'react';
import OpportunityList from './components/OpportunityList';
import OpportunityDetail from './components/OpportunityDetail';
import { Search, TrendingUp, Sparkles, KeyRound } from 'lucide-react';
import { useTourData } from './hooks/useTourData';
import { useNaverTrends } from './hooks/useNaverTrends';
import { useYouTubePopularTrends } from './hooks/useYouTubePopularTrends';
import { EchoCard } from './types';

export default function App() {
  const [areaCode, setAreaCode] = useState<number | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('거제 야호');
  const [selectedKeyword, setSelectedKeyword] = useState('거제 야호');

  const { trends: autoDiscoveredTrends, loading: popularYtLoading } = useYouTubePopularTrends();
  const { data: tourData, loading: tourLoading, error: tourError, isNationwideFallback } = useTourData(areaCode || 1, 12, keyword);
  const [selectedEcho, setSelectedEcho] = useState<EchoCard | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      setKeyword(trimmed);
      setSelectedKeyword(trimmed);
    }
  };

  const handleSelectTrendKeyword = (kw: string) => {
    setSearchInput(kw);
    setKeyword(kw);
    setSelectedKeyword(kw);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setKeyword('러닝');
    setSelectedKeyword('러닝');
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
              네이버 데이터랩 실증 트렌드 지수와 한국관광공사 POI 자원을 실시간으로 연결합니다.
            </p>
          </div>
        </section>

        {/* 1. YouTube Social Discovery Pool Trend Section */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black text-neutral-900 tracking-tight">
                지금 포착된 관광 트렌드 {autoDiscoveredTrends.length > 0 ? autoDiscoveredTrends.length : ''}
              </h2>
            </div>

            <span className="text-[10px] text-neutral-400 font-medium">
              YouTube 소셜 바이럴 신호 · NAVER 검색 관심도 검증
            </span>
          </div>

          {popularYtLoading ? (
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center text-xs text-neutral-400">
              YouTube 소셜 바이럴 신호(최근 7일)를 분석하여 실제 관광 트렌드/장소를 탐지하고 있습니다...
            </div>
          ) : autoDiscoveredTrends.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center text-xs text-neutral-500">
              YouTube 트렌드 데이터를 불러오지 못했습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {autoDiscoveredTrends.map((t, idx) => {
                const isSelected = selectedKeyword === t.title;
                const rankNum = String(idx + 1).padStart(2, '0');
                return (
                  <div
                    key={t.title}
                    onClick={() => handleSelectTrendKeyword(t.title)}
                    className={`bg-white rounded-2xl border p-3 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-neutral-900 ring-2 ring-neutral-900 bg-neutral-50/40 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-extrabold text-neutral-400">{rankNum}</span>
                      <span className="text-[8.5px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                        YT DISCOVERY
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-black text-neutral-900 truncate mb-1">{t.title}</h3>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9.5px]">
                          <span className="text-neutral-400">YouTube</span>
                          <span className="font-bold text-red-500">VIRAL {t.youtubeSignal.viralLevel}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9.5px]">
                          <span className="text-neutral-400">NAVER</span>
                          {t.naverSignal.changeRate !== null ? (
                            <span className="font-extrabold text-green-600">↑ {t.naverSignal.changeRate}%</span>
                          ) : (
                            <span className="text-[8.5px] font-medium text-neutral-400">검증 데이터 없음</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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

        {/* 3. Opportunity Results Section */}
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

      </main>

      <footer className="border-t border-neutral-200 bg-white py-8 mt-16 text-center text-xs text-neutral-400">
        YAHO STUDIO — NAVER DataLab & 한국관광공사 TourAPI 기반 관광상품 기획 가공 엔진
      </footer>
    </div>
  );
}
