import React, { useState, useEffect } from 'react';
import OpportunityList from './components/OpportunityList';
import OpportunityDetail from './components/OpportunityDetail';
import { Search, Sparkles } from 'lucide-react';
import { useTourData } from './hooks/useTourData';
import { EchoCard } from './types';

export default function App() {
  const [areaCode, setAreaCode] = useState<number | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  
  const { data: tourData, loading, error, isNationwideFallback } = useTourData(areaCode || 1, 12, keyword);
  const [selectedEcho, setSelectedEcho] = useState<EchoCard | null>(null);

  const popularKeywords = ['러닝', '야간관광', '미식', '웰니스', 'K-POP', '가족체험', '성수동', '전통문화'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setKeyword(trimmed);
    setSelectedKeyword(trimmed);
  };

  const handleKeywordClick = (kw: string) => {
    setSearchInput(kw);
    setKeyword(kw);
    setSelectedKeyword(kw);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setKeyword('');
    setSelectedKeyword('');
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
      {/* SaaS Style Header Navbar */}
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
            트렌드 ➔ 기회검증 ➔ AI 상품화
          </div>
        </div>
      </header>

      {/* Main Container: Apple/Notion SaaS Centered 1-Column Layout */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* 1. Hero Keyword Input Section */}
        <section className="space-y-6 text-center max-w-2xl mx-auto">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-tight">
              트렌드에서<br />새로운 여행상품을 발견합니다.
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium leading-relaxed">
              요즘 뜨는 키워드나 컨셉을 입력하고 관광상품 기회를 검증해보세요.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
            <div className="flex items-center bg-white border border-neutral-300 hover:border-neutral-400 focus-within:border-neutral-900 rounded-2xl p-2 shadow-sm transition-all">
              <Search className="w-5 h-5 text-neutral-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="러닝, K-POP 촬영지, 야간관광, 미식..."
                className="w-full pl-3 pr-2 py-2 text-sm text-neutral-900 placeholder-neutral-400 bg-transparent focus:outline-none font-medium"
              />
              {searchInput && (
                <button type="button" onClick={handleClearSearch} className="text-neutral-400 hover:text-neutral-600 text-xs font-bold px-2">
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                기회 찾기
              </button>
            </div>
          </form>

          {/* Region Filter & Popular Keywords */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="text-neutral-400 font-medium">인기 트렌드:</span>
            {popularKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => handleKeywordClick(kw)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedKeyword === kw
                    ? 'bg-neutral-900 text-white font-bold'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {kw}
              </button>
            ))}

            <div className="w-full flex justify-center items-center space-x-1 mt-2">
              <span className="text-[11px] text-neutral-400 font-medium">지역 필터:</span>
              <div className="inline-flex bg-neutral-100 p-0.5 rounded-lg">
                {regions.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => setAreaCode(r.code)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      areaCode === r.code ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Opportunity Results Section */}
        <section className="space-y-4 pt-4 border-t border-neutral-100">
          <OpportunityList
            selectedKeyword={selectedKeyword}
            selectedEcho={selectedEcho}
            onSelectEcho={handleSelectEcho}
            tourData={tourData}
            loading={loading}
            error={error}
            isNationwideFallback={isNationwideFallback}
          />
        </section>

        {/* 3. Opportunity Detail & AI Product Creation Section */}
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

      <footer className="border-t border-neutral-200 bg-white py-8 mt-20 text-center text-xs text-neutral-400">
        YAHO STUDIO — 한국관광공사 OpenAPI 기반 관광상품 기획 가공 엔진
      </footer>
    </div>
  );
}
