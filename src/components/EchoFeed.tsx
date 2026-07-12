import { useState, useEffect } from 'react';
import { ArrowRight, Instagram, Youtube, Newspaper, Share2, Flame, TrendingUp } from 'lucide-react';
import { REALTIME_FEED } from '../data/mockData';

interface EchoFeedProps {
  onCreateProduct: (title: string, tags: string[], image: string) => void;
}

export default function EchoFeed({ onCreateProduct }: EchoFeedProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdate(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getChannelStyles = (channel: string) => {
    switch (channel) {
      case 'Instagram': return { bg: 'bg-pink-50', text: 'text-pink-600', icon: Instagram };
      case 'YouTube': return { bg: 'bg-red-50', text: 'text-red-600', icon: Youtube };
      case 'Naver': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: TrendingUp };
      case 'News': return { bg: 'bg-slate-50', text: 'text-slate-600', icon: Newspaper };
      case 'TikTok': return { bg: 'bg-zinc-50', text: 'text-zinc-800', icon: Flame };
      case 'X': return { bg: 'bg-blue-50', text: 'text-blue-500', icon: Share2 };
      default: return { bg: 'bg-neutral-50', text: 'text-neutral-600', icon: TrendingUp };
    }
  };

  return (
    <div className="flex flex-col font-sans select-none bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-xs font-bold text-neutral-900">오늘의 Echo</h3>
          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-sm bg-red-50">
            <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-[8px] text-red-600 font-bold tracking-wider uppercase">Live</span>
          </div>
        </div>
        <p className="text-[9px] text-neutral-400">실시간 트렌드</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {REALTIME_FEED.slice(0, 6).map((item) => {
          const styles = getChannelStyles(item.channel);
          const ChannelIcon = styles.icon;

          return (
            <div 
              key={item.id} 
              className="flex flex-col bg-neutral-50/50 border border-neutral-100 rounded-xl p-2.5 hover:bg-neutral-50 transition-colors cursor-pointer group"
              onClick={() => onCreateProduct(item.title, [item.channel, '트렌드 기획'], 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60')}
            >
              <div className={`w-5 h-5 rounded-md ${styles.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <ChannelIcon className={`w-3 h-3 ${styles.text}`} />
              </div>
              
              <div className="flex flex-col space-y-0.5">
                <span className="text-xs font-bold text-neutral-900 tracking-tight">{item.change}</span>
                <span className="text-[9px] font-medium text-neutral-400">{item.value}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <button className="w-full mt-3 py-1.5 text-[9px] font-semibold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors flex items-center justify-center">
        <span>더보기</span>
        <ArrowRight className="w-3 h-3 ml-1" />
      </button>
    </div>
  );
}
