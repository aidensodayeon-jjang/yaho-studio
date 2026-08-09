import React, { useState, useEffect } from 'react';
import OpportunityList from './components/OpportunityList';
import OpportunityDetail from './components/OpportunityDetail';
import { Search } from 'lucide-react';
import { useTourData } from './hooks/useTourData';
import { EchoCard } from './types';

export default function App() {
  const [areaCode, setAreaCode] = useState(1);
  const [contentTypeId, setContentTypeId] = useState<number>(12);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  
  const { data: tourData, loading, error, isNationwideFallback } = useTourData(areaCode, contentTypeId, keyword);
  const [selectedEcho, setSelectedEcho] = useState<EchoCard | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setKeyword('');
  };

  const regions = [
    { code: 1, name: '서울' },
    { code: 6, name: '부산' },
    { code: 2, name: '인천' },
    { code: 3, name: '대전' },
    { code: 4, name: '대구' },
    { code: 5, name: '광주' },
    { code: 7, name: '울산' },
    { code: 39, name: '제주' },
  ];

  const categories = [
    { typeId: 12, label: '관광지' },
    { typeId: 14, label: '문화시설' },
    { typeId: 15, label: '축제/행사' },
    { typeId: 25, label: '여행코스' },
    { typeId: 28, label: '레포츠' },
    { typeId: 32, label: '숙박' },
    { typeId: 38, label: '쇼핑' },
    { typeId: 39, label: '음식점' },
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
        tags: ['관광기회', '빅데이터'],
        score: 87,
        searchVolume: 15420,
        searchVolumeChange: 168,
        posts: 10200,
        postsChange: 42,
        genreId: 'kpop',
        subtitle: '방문 수요는 높으나 독창적 관광상품이 부족한 기회 지역입니다.',
        confidence: 95,
        reasonDetails: ['방문 유동인구 지속 증가', '체류시간 확대 가능성 우수'],
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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-xl bg-neutral-900 text-white font-extrabold flex items-center justify-center text-xs tracking-tighter">
              YS
            </span>
            <span className="font-extrabold text-sm tracking-tight text-neutral-900 uppercase">
              YAHO Studio
            </span>
          </div>

          <div className="text-xs font-semibold text-neutral-500 hidden sm:block">
            관광 데이터 기반 기획 가공 플랫폼
          </div>
        </div>
      </header>

      {/* Main SaaS Container (1-Column Centered Layout) */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* 1. Hero Header Section */}
        <section className="space-y-4 text-center max-w-2xl mx-auto py-2">
          <div className="inline-flex items-center space-x-1.5 bg-neutral-100 text-neutral-800 text-[11px] font-bold px-3 py-1 rounded-full border border-neutral-200">
            <span>✨ AI 관광상품 기획 엔진</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-tight">
            데이터로 발견하는<br />새로운 관광상품의 기회
          </h1>

          <p className="text-xs sm:text-sm text-neutral-500 font-medium leading-relaxed">
            지역 관광데이터 속 숨겨진 기회를 분석하고 AI와 함께 실전 상품으로 발전시키세요.
          </p>

          {/* Filter Toolbar: Region + Category + Search */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {/* Region Select */}
            <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-1 shadow-sm">
              <span className="text-[11px] font-bold text-neutral-400 px-2">지역</span>
              <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[260px]">
                {regions.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => setAreaCode(r.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      areaCode === r.code ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Select */}
            <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-1 shadow-sm">
              <span className="text-[11px] font-bold text-neutral-400 px-2">유형</span>
              <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[260px]">
                {categories.slice(0, 4).map((c) => (
                  <button
                    key={c.typeId}
                    onClick={() => setContentTypeId(c.typeId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      contentTypeId === c.typeId ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Keyword Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-1.5 bg-white border border-neutral-200 rounded-xl p-1 shadow-sm">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (e.target.value.trim() === '' && keyword !== '') setKeyword('');
                  }}
                  placeholder="관광지명 검색..."
                  className="pl-8 pr-6 py-1 bg-transparent text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none w-36"
                />
                {searchInput && (
                  <button type="button" onClick={handleClearSearch} className="absolute right-2 text-neutral-400 text-xs font-bold">
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-xs font-bold">
                검색
              </button>
            </form>
          </div>
        </section>

        {/* 2. Opportunity Grid Section ("지금 주목할 관광 기회") */}
        <section className="space-y-4">
          <OpportunityList
            activeGenre="kpop"
            selectedEcho={selectedEcho}
            onSelectEcho={handleSelectEcho}
            tourData={tourData}
            loading={loading}
            error={error}
            isNationwideFallback={isNationwideFallback}
          />
        </section>

        {/* 3. Opportunity Detail & AI Product Generator Section */}
        {selectedEcho && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm">
            <OpportunityDetail
              selectedEcho={selectedEcho}
              areaCode={areaCode}
              onSelectEcho={handleSelectEcho}
            />
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 mt-16 text-center text-xs text-neutral-400 font-medium">
        YAHO Studio © 2026. 한국관광공사 TourAPI 및 관광 빅데이터 실시간 연동.
      </footer>
    </div>
  );
}
