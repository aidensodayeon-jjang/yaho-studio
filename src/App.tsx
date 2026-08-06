import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import OpportunityList from './components/OpportunityList';
import OpportunityDetail from './components/OpportunityDetail';
import CreateProductModal from './components/CreateProductModal';
import { ChevronDown, Filter, Search } from 'lucide-react';
import { useTourData } from './hooks/useTourData';

import { EchoCard, Project } from './types';
import { ECHO_CARDS, RECENT_PROJECTS } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('opportunity');
  const [activeGenre, setActiveGenre] = useState('kpop');
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
  
  // Modal states (kept for compatibility)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEcho, setModalEcho] = useState<EchoCard | null>(null);
  const [modalCustomTitle, setModalCustomTitle] = useState('');

  const categories = [
    { typeId: 12, label: '관광지', icon: '🏛️' },
    { typeId: 14, label: '문화시설', icon: '🎨' },
    { typeId: 15, label: '축제/행사', icon: '🎉' },
    { typeId: 25, label: '여행코스', icon: '🗺️' },
    { typeId: 28, label: '레포츠', icon: '🏃' },
    { typeId: 32, label: '숙박', icon: '🏨' },
    { typeId: 38, label: '쇼핑', icon: '🛍️' },
    { typeId: 39, label: '음식점', icon: '🍳' },
  ];

  useEffect(() => {
    if (tourData && tourData.length > 0) {
      const firstSpot = tourData[0];
      const fallbackCard = ECHO_CARDS[0];
      setSelectedEcho({
        ...fallbackCard,
        id: firstSpot.contentid || 'tour-0',
        contentid: firstSpot.contentid,
        contenttypeid: firstSpot.contenttypeid,
        title: firstSpot.title || '관광지',
        addr1: firstSpot.addr1 || '',
        image: firstSpot.firstimage || fallbackCard.image,
      });
    } else {
      setSelectedEcho(null);
    }
  }, [tourData]);

  const handleSelectEcho = (echo: EchoCard) => {
    setSelectedEcho(echo);
  };

  const handleSaveProject = (newProject: Project) => {
    // mock save function to avoid error
    console.log("Saved project", newProject);
  };

  return (
    <div className="grid grid-cols-[240px_minmax(0,1fr)_320px] h-screen bg-[#fafafa] text-neutral-800 overflow-hidden font-sans antialiased">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main Content (Center) */}
      <main className="flex flex-col h-screen overflow-hidden bg-white border-r border-neutral-200">
        
        {/* Header / Filter Section */}
        <div className="px-6 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Good Morning, 소다쌤! 👋</h1>

            {/* Keyword Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-1.5">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (e.target.value.trim() === '' && keyword !== '') {
                      setKeyword('');
                    }
                  }}
                  placeholder="관광지명을 입력하세요"
                  className="pl-8 pr-7 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 w-52 transition-colors"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
                    title="검색어 초기화"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors"
              >
                검색
              </button>
            </form>
          </div>
          <p className="text-xs text-neutral-600 mb-3 flex items-center">
            AI MD가 회원님의 전략에 맞는 새로운 Opportunity를 발견했어요.
            <button className="ml-4 text-xs font-bold text-neutral-900 hover:underline flex items-center">
              추천 기준 확인하기 <ChevronDown className="w-3 h-3 ml-0.5 -rotate-90" />
            </button>
          </p>

          <div className="flex items-center space-x-4 mb-3">
            <span className="text-[11px] font-bold text-neutral-900 shrink-0">관광 유형</span>
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map(c => (
                <button
                  key={c.typeId}
                  onClick={() => setContentTypeId(c.typeId)}
                  className={`flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
                    contentTypeId === c.typeId
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <span className="mr-1">{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
              {regions.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setAreaCode(r.code)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    areaCode === r.code
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  📍 {r.name}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-1.5 bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 cursor-pointer hover:bg-neutral-50">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
              <span>일본</span> <ChevronDown className="w-3 h-3 text-neutral-400" />
            </div>
            <div className="flex items-center space-x-1.5 bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 cursor-pointer hover:bg-neutral-50">
              <span>👤 20~30대 여성</span> <ChevronDown className="w-3 h-3 text-neutral-400" />
            </div>
            <div className="flex items-center space-x-1.5 bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 cursor-pointer hover:bg-neutral-50">
              <span>☀️ 여름 (6~8월)</span> <ChevronDown className="w-3 h-3 text-neutral-400" />
            </div>
            <button className="flex items-center space-x-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 px-2 py-1.5">
              <Filter className="w-3 h-3" /> <span>필터 더보기</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-[#fafafa]">
          {activeTab === 'opportunity' ? (
            <div className="flex flex-col gap-4">
              <div className="shrink-0">
                <OpportunityList
                  activeGenre={activeGenre}
                  selectedEcho={selectedEcho}
                  onSelectEcho={handleSelectEcho}
                  tourData={tourData}
                  loading={loading}
                  error={error}
                  isNationwideFallback={isNationwideFallback}
                />
              </div>
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                <OpportunityDetail selectedEcho={selectedEcho} onSelectEcho={handleSelectEcho} />
              </div>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-neutral-400 h-full">
               <p>해당 메뉴의 기능은 준비 중입니다.</p>
             </div>
          )}
        </div>

      </main>

      {/* 3. Right Sidebar (AI Assistant & Profile) */}
      <RightSidebar selectedEcho={selectedEcho} />

      {/* Modals */}
      {isModalOpen && modalEcho && (
        <CreateProductModal
          isOpen={isModalOpen}
          echo={modalEcho}
          customTitle={modalCustomTitle}
          onClose={() => setIsModalOpen(false)}
          onSaveProject={handleSaveProject}
        />
      )}
    </div>
  );
}
