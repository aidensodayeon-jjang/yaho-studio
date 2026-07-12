import { PlayCircle, LayoutGrid, Radar, FolderKanban, Calendar, BarChart3, Users, Bot, Settings, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab
}: SidebarProps) {
  const menuItems = [
    { id: 'opportunity', label: 'Opportunity', icon: PlayCircle },
    { id: 'workspace', label: 'Workspace', icon: LayoutGrid },
    { id: 'trend-radar', label: 'Trend Radar', icon: Radar },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'data-insight', label: 'Data Insight', icon: BarChart3 },
    { id: 'partners', label: 'Partners', icon: Users },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const aiMdDna = [
    { label: '국가 / 시장', value: '일본' },
    { label: '지역', value: '서울' },
    { label: '장르', value: 'K-POP, 웰니스' },
    { label: '타겟', value: '20~30대 여성' },
    { label: '시즌', value: '여름 (6~8월)' },
    { label: '목표', value: '체험상품 개발' }
  ];

  return (
    <aside className="w-[240px] bg-white border-r border-neutral-200 flex flex-col h-screen overflow-y-auto shrink-0 select-none no-scrollbar font-sans text-neutral-800">
      {/* Logo Area */}
      <div className="p-6 pb-8 flex items-center space-x-3">
        <div className="w-8 h-8 bg-neutral-900 text-white flex items-center justify-center font-bold text-lg rounded-md">
          Y
        </div>
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-neutral-900 leading-none">
            YAHO <span className="font-light">Studio</span>
          </h1>
          <p className="text-[10px] font-medium text-neutral-500 mt-1">
            AI Tourism MD Studio
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="px-4 flex-col space-y-1 mb-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-neutral-100 font-bold text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-6 pb-6 space-y-6">
        {/* AI MD DNA */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-neutral-900">AI MD DNA</h3>
            <button className="text-[10px] text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded px-2 py-0.5 font-medium">편집</button>
          </div>
          <div className="space-y-2 mb-3">
            {aiMdDna.map((item, idx) => (
              <div key={idx} className="flex items-center text-[10px]">
                <span className="text-neutral-400 w-16 flex-shrink-0">{item.label}</span>
                <span className="text-neutral-800 font-medium truncate">{item.value}</span>
              </div>
            ))}
          </div>
          <button className="text-[10px] font-medium text-neutral-900 flex items-center hover:underline">
            프로필 상세 보기 <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        <div className="border-t border-neutral-200" />

        {/* Pro Plan */}
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Settings className="w-4 h-4 text-neutral-900" />
            <h3 className="text-sm font-bold text-neutral-900">Pro 플랜 이용 중</h3>
          </div>
          <p className="text-[10px] text-neutral-400 mb-3 pl-6">다음 결제일 2024.05.23</p>
          <button className="w-full py-2 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
            플랜 관리
          </button>
        </div>
      </div>
    </aside>
  );
}
