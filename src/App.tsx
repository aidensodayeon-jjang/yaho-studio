import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import OpportunityList from './components/OpportunityList';
import OpportunityDetail from './components/OpportunityDetail';
import CreateProductModal from './components/CreateProductModal';
import { ChevronDown, Filter } from 'lucide-react';

import { EchoCard, Project } from './types';
import { ECHO_CARDS, RECENT_PROJECTS } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('opportunity');
  const [activeGenre, setActiveGenre] = useState('kpop');
  
  const [selectedEcho, setSelectedEcho] = useState<EchoCard | null>(null);
  
  // Modal states (kept for compatibility)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEcho, setModalEcho] = useState<EchoCard | null>(null);
  const [modalCustomTitle, setModalCustomTitle] = useState('');

  useEffect(() => {
    const genreEchos = ECHO_CARDS.filter((card) => card.genreId === activeGenre);
    if (genreEchos.length > 0) {
      setSelectedEcho(genreEchos[0]);
    } else {
      setSelectedEcho(ECHO_CARDS[0]);
    }
  }, [activeGenre]);

  const handleSelectEcho = (echo: EchoCard) => {
    setSelectedEcho(echo);
  };

  const handleSaveProject = (newProject: Project) => {
    // mock save function to avoid error
    console.log("Saved project", newProject);
  };

  const genres = [
    { id: 'kpop', label: 'K-POP', icon: '🤍' },
    { id: 'drama', label: '드라마', icon: '📺' },
    { id: 'food', label: '미식', icon: '🍳' },
    { id: 'wellness', label: '웰니스', icon: '🧘‍♀️' },
    { id: 'nature', label: '자연', icon: '⛰️' },
    { id: 'activity', label: '액티비티', icon: '🏃' },
    { id: 'shopping', label: '쇼핑', icon: '🛍️' },
    { id: 'festival', label: '축제', icon: '🎉' },
    { id: 'culture', label: '문화/역사', icon: '🏛️' },
    { id: 'family', label: '가족여행', icon: '👨‍👩‍👧‍👦' },
  ];

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
          <div className="flex items-center space-x-2 mb-2">
            <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Good Morning, 소다쌤! 👋</h1>
          </div>
          <p className="text-xs text-neutral-600 mb-3 flex items-center">
            AI MD가 회원님의 전략에 맞는 새로운 Opportunity를 발견했어요.
            <button className="ml-4 text-xs font-bold text-neutral-900 hover:underline flex items-center">
              추천 기준 확인하기 <ChevronDown className="w-3 h-3 ml-0.5 -rotate-90" />
            </button>
          </p>

          <div className="flex items-center space-x-4 mb-3">
            <span className="text-[11px] font-bold text-neutral-900 shrink-0">관심 장르</span>
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
              {genres.map(g => (
                <button
                  key={g.id}
                  onClick={() => setActiveGenre(g.id)}
                  className={`flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
                    activeGenre === g.id
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <span className="mr-1">{g.icon}</span> {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5 bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 cursor-pointer hover:bg-neutral-50">
              <span>📍 서울</span> <ChevronDown className="w-3 h-3 text-neutral-400" />
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
            <div className="flex flex-col gap-4 h-full">
              <div className="shrink-0">
                <OpportunityList
                  activeGenre={activeGenre}
                  selectedEcho={selectedEcho}
                  onSelectEcho={handleSelectEcho}
                />
              </div>
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm flex-1 min-h-0 overflow-y-auto no-scrollbar">
                <OpportunityDetail selectedEcho={selectedEcho} />
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
