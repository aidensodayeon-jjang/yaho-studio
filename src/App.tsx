import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DataSummary from './components/DataSummary';
import GenreSelector from './components/GenreSelector';
import EchoCards from './components/EchoCards';
import EchoFeed from './components/EchoFeed';
import HeroRecommendation from './components/HeroRecommendation';
import CreateProductModal from './components/CreateProductModal';

import { EchoCard, Project } from './types';
import { ECHO_CARDS, RECENT_PROJECTS } from './data/mockData';

export default function App() {
  // Navigation and filtering states
  const [activeTab, setActiveTab] = useState('home');
  const [activeGenre, setActiveGenre] = useState('kpop');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Active Echo and Product Creation states
  const [selectedEcho, setSelectedEcho] = useState<EchoCard | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>(RECENT_PROJECTS);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEcho, setModalEcho] = useState<EchoCard | null>(null);
  const [modalCustomTitle, setModalCustomTitle] = useState('');

  // Auto-select first echo card belonging to the selected genre
  useEffect(() => {
    const genreEchos = ECHO_CARDS.filter((card) => card.genreId === activeGenre);
    if (genreEchos.length > 0) {
      setSelectedEcho(genreEchos[0]);
    } else {
      setSelectedEcho(null);
    }
  }, [activeGenre]);

  // Handle selected Echo
  const handleSelectEcho = (echo: EchoCard) => {
    setSelectedEcho(echo);
  };

  // Open product creator modal from an Echo card
  const handleCreateProductFromCard = (echo: EchoCard) => {
    setModalEcho(echo);
    setModalCustomTitle(`${echo.title} 2박 3일 시그니처 투어`);
    setIsModalOpen(true);
  };

  // Open product creator from Right AI Recommendation Panel
  const handlePlanFromRecommendation = (echo: EchoCard) => {
    setModalEcho(echo);
    setModalCustomTitle(`${echo.title} 2박 3일 BEST 기획 상품`);
    setIsModalOpen(true);
  };

  // Open product creator from a general feed keyword
  const handleCreateProductFromFeed = (title: string, tags: string[], image: string) => {
    // Dynamically fabricate a minimal EchoCard matching the feed keyword
    const tempEcho: EchoCard = {
      id: `feed-temp-${Date.now()}`,
      rank: 1,
      isHot: true,
      image: image,
      title: title,
      tags: tags,
      score: 95,
      searchVolume: 12500,
      searchVolumeChange: 182,
      posts: 8700,
      postsChange: 156,
      genreId: activeGenre,
      subtitle: '지금 가장 핫한 실시간 키워드를 연계한 상품 기획안입니다.',
      confidence: 95,
      reasonDetails: [
        '소셜 버즈 및 숏폼 조회수 급상승 순위 1위 키워드 반영',
        '밀레니얼/젠지 타겟 핫플레이스 위주 패키지 자동 구성',
        '대체 불가능한 현지 단독 미식 제휴 연계',
        '경쟁사 등록 상품 0개로 출시 시 시장 점유 독점 가능'
      ]
    };
    setModalEcho(tempEcho);
    setModalCustomTitle(`${title} 실시간 트렌드 패키지`);
    setIsModalOpen(true);
  };

  // Save new drafted project
  const handleSaveProject = (newProject: Project) => {
    setRecentProjects((prev) => [newProject, ...prev]);
  };

  // User search can also filter the side genre list or help find matches
  const handleChatPromptSent = (prompt: string) => {
    // Simple filter matching: if prompt mentions food, drama, festivals, switch active genre
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('미식') || promptLower.includes('음식') || promptLower.includes('맛집')) {
      setActiveGenre('food');
    } else if (promptLower.includes('드라마') || promptLower.includes('촬영')) {
      setActiveGenre('drama');
    } else if (promptLower.includes('축제') || promptLower.includes('불꽃')) {
      setActiveGenre('festival');
    } else if (promptLower.includes('kpop') || promptLower.includes('케이팝') || promptLower.includes('리센느')) {
      setActiveGenre('kpop');
    }
  };

  return (
    <div className="flex h-screen bg-[#fafafa] text-neutral-800 overflow-hidden font-sans antialiased">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeGenre={activeGenre}
        setActiveGenre={setActiveGenre}
      />

      {/* Main Area Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-white">
        {/* 2. Top Header Navigation */}
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        {/* 3. Page Layout based on Active Tab */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'home' ? (
            <main className="flex-1 flex overflow-hidden">
              {/* Left Column (Main Scrollable Workspace Area) */}
              <div className="flex-1 overflow-y-auto px-12 py-10 space-y-12 bg-white no-scrollbar transition-colors duration-500">
                {/* Hero Section: AI MD Recommendation */}
                {selectedEcho && (
                  <HeroRecommendation
                    selectedEcho={selectedEcho}
                    onPlanProduct={handlePlanFromRecommendation}
                  />
                )}

                {/* Section 1: 오늘의 데이터 요약 (Chat Prompt & Processing Pipeline) */}
                <DataSummary onSendMessage={handleChatPromptSent} />

                {/* Section 2: 장르 선택 (Horizontal pill selectors) */}
                <GenreSelector activeGenre={activeGenre} setActiveGenre={setActiveGenre} />

                {/* Section 3: AI 추천 Echo 카드 그리드 */}
                <EchoCards
                  activeGenre={activeGenre}
                  selectedEcho={selectedEcho}
                  onSelectEcho={handleSelectEcho}
                  onCreateProduct={handleCreateProductFromCard}
                  searchTerm={searchTerm}
                />

                {/* Section 4: 실시간 Echo Feed 가로형 그리드 */}
                <EchoFeed onCreateProduct={handleCreateProductFromFeed} />
              </div>
            </main>
          ) : (
            // Simple placeholder screen for other sidebar tabs (Discover, Studio, Projects, etc.)
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-neutral-400 font-sans select-none bg-[#fafafa]/45">
              <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 mb-4">
                {activeTab === 'discover' && '🔍'}
                {activeTab === 'studio' && '🎨'}
                {activeTab === 'projects' && '📁'}
                {activeTab === 'insight' && '📈'}
                {activeTab === 'bookmark' && '🔖'}
              </div>
              <h3 className="text-sm font-bold text-neutral-800 capitalize">{activeTab} 페이지</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                현재 {activeTab} 탭은 기획 중입니다. 좌측 메뉴의 &lsquo;홈&rsquo; 탭에서 다양한 실시간 관광 Echo 분석과 AI MD 추천 시스템을 테스트해 보세요.
              </p>
              <button
                onClick={() => setActiveTab('home')}
                className="mt-4 px-4 py-1.5 bg-[#18181b] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                홈으로 돌아가기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Product Draft Proposal Modal Sheet */}
      <CreateProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        echo={modalEcho}
        customTitle={modalCustomTitle}
        onSaveProject={handleSaveProject}
      />
    </div>
  );
}
