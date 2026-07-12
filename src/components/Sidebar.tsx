import { Home, Compass, PenTool, FolderKanban, BarChart3, Bookmark } from 'lucide-react';
import { GENRES } from '../data/mockData';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeGenre: string;
  setActiveGenre: (genre: string) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeGenre,
  setActiveGenre
}: SidebarProps) {
  const menuItems = [
    { id: 'home', label: '홈', icon: Home, subtitle: '' },
    { id: 'discover', label: 'Discover', icon: Compass, subtitle: '기회 탐색' },
    { id: 'studio', label: 'Studio', icon: PenTool, subtitle: '상품 기획 & 제작' },
    { id: 'projects', label: 'Projects', icon: FolderKanban, subtitle: '진행 중인 프로젝트' },
    { id: 'insight', label: 'Insight', icon: BarChart3, subtitle: '데이터 인사이트' },
    { id: 'bookmark', label: 'Bookmark', icon: Bookmark, subtitle: '저장한 Echo' }
  ];

  return (
    <aside className="w-64 bg-[#f7f7f5] border-r border-[#e6e6e6] flex flex-col h-screen overflow-y-auto shrink-0 select-none no-scrollbar">
      {/* Logo Area */}
      <div className="p-6 pb-4">
        <h1 className="text-xl font-bold font-display tracking-tight text-[#1f1f1f]">
          YAHO <span className="font-light">Studio</span>
        </h1>
        <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase mt-0.5">
          Echo to Tour
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 py-2 flex-col space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-md text-left transition-all ${
                isActive
                  ? 'bg-blue-50/70 text-blue-700 font-medium'
                  : 'text-[#4b4a47] hover:bg-neutral-200/50 hover:text-neutral-900'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? 'text-blue-600' : 'text-[#7f7f7f]'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                {item.subtitle && (
                  <span className="text-[10px] text-[#7f7f7f] -mt-0.5 font-light">
                    {item.subtitle}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-2 border-t border-[#e6e6e6]" />

      {/* Genre Title */}
      <div className="px-6 py-2">
        <h3 className="text-xs font-bold text-[#1f1f1f] tracking-wide uppercase">
          장르 (Genre)
        </h3>
      </div>

      {/* Genre List */}
      <div className="px-3 flex-1 space-y-0.5">
        {GENRES.map((g) => {
          const isActive = activeGenre === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGenre(g.id)}
              className={`w-full flex items-center px-3 py-1.5 rounded-md text-left transition-all text-xs ${
                isActive
                  ? 'bg-neutral-200/80 text-neutral-900 font-medium'
                  : 'text-[#5c5b57] hover:bg-neutral-200/40 hover:text-neutral-900'
              }`}
            >
              <span className="mr-2 text-sm shrink-0">{g.icon}</span>
              <span className="truncate">{g.name}</span>
            </button>
          );
        })}
      </div>

      {/* User Profile Card (Bottom) */}
      <div className="p-4 mt-auto border-t border-[#e6e6e6] bg-[#f2f2f0]/60">
        <div className="flex items-center space-x-3">
          <div className="relative shrink-0">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
              alt="MD 소다쌤"
              className="w-10 h-10 rounded-full object-cover border border-[#e6e6e6]"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-[#1f1f1f] truncate">MD 소다쌤</span>
              <span className="bg-blue-600 text-white text-[9px] font-bold px-1 rounded uppercase tracking-wider scale-90 shrink-0">
                Pro
              </span>
            </div>
            <p className="text-[10px] text-[#7f7f7f] truncate">여행사 상품기획팀</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
