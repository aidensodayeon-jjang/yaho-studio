import { Bell, Search, Command } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Header({ searchTerm, setSearchTerm }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#e6e6e6] shrink-0">
      {/* Greeting and description */}
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-[#1f1f1f] flex items-center gap-1.5 font-sans tracking-tight">
          안녕하세요, 소다쌤! <span className="animate-bounce origin-bottom-right">👋</span>
        </h2>
        <p className="text-xs text-[#7f7f7f] mt-0.5 font-light">
          AI 관광 MD와 함께 최고의 여행상품을 기획해보세요.
        </p>
      </div>

      {/* Right control elements (Search, Alerts, Avatar) */}
      <div className="flex items-center space-x-5">
        {/* Search input with Apple style command key */}
        <div className="relative w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-neutral-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="어떤 여행상품을 만들고 싶으신가요?"
            className="w-full pl-9 pr-14 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200/50 focus:bg-white border-none rounded-lg text-neutral-800 transition-colors focus:ring-1 focus:ring-neutral-400 font-sans"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 bg-white border border-neutral-200 rounded shadow-2xs font-mono">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </kbd>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 text-neutral-500 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-full transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        {/* Small Profile Thumbnail */}
        <div className="shrink-0">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
            alt="소다쌤 Profile"
            className="w-8 h-8 rounded-full object-cover border border-[#e6e6e6]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
