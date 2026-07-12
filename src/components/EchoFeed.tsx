import { useState, useEffect } from 'react';
import { ArrowRight, Instagram, Youtube, Newspaper, Share2, Flame, TrendingUp } from 'lucide-react';
import { REALTIME_FEED } from '../data/mockData';

interface EchoFeedProps {
  onCreateProduct: (title: string, tags: string[], image: string) => void;
}

function Sparkline({ data, strokeColor, id }: { data: number[]; strokeColor: string; id: string }) {
  const width = 120;
  const height = 30;
  const padding = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 4) - padding * 2;
    return { x, y };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const xc = (current.x + next.x) / 2;
    const yc = (current.y + next.y) / 2;
    pathD += ` Q ${current.x} ${current.y}, ${xc} ${yc}`;
  }
  pathD += ` T ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${id})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2" fill={strokeColor} />
    </svg>
  );
}

export default function EchoFeed({ onCreateProduct }: EchoFeedProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdate(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 10000); // Update time every 10 seconds to simulate live feed without crazy animations
    return () => clearInterval(timer);
  }, []);

  const getChannelStyles = (channel: string) => {
    switch (channel) {
      case 'Instagram': return { bg: 'bg-pink-50', text: 'text-pink-600', stroke: '#db2777', icon: Instagram };
      case 'YouTube': return { bg: 'bg-red-50', text: 'text-red-600', stroke: '#dc2626', icon: Youtube };
      case 'Naver': return { bg: 'bg-emerald-50', text: 'text-emerald-600', stroke: '#059669', icon: TrendingUp };
      case 'News': return { bg: 'bg-slate-50', text: 'text-slate-600', stroke: '#475569', icon: Newspaper };
      case 'TikTok': return { bg: 'bg-zinc-50', text: 'text-zinc-800', stroke: '#18181b', icon: Flame };
      case 'X': return { bg: 'bg-blue-50', text: 'text-blue-500', stroke: '#0ea5e9', icon: Share2 };
      default: return { bg: 'bg-neutral-50', text: 'text-neutral-600', stroke: '#737373', icon: TrendingUp };
    }
  };

  return (
    <div className="flex flex-col space-y-4 font-sans select-none border-t border-neutral-100 pt-12 pb-20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Real-time Echo Feed</h3>
          <div className="flex items-center space-x-1.5 bg-neutral-100 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] text-neutral-600 font-medium">Live</span>
          </div>
        </div>
        <p className="text-xs text-neutral-400 font-mono">Last updated: {lastUpdate}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {REALTIME_FEED.map((item) => {
          const styles = getChannelStyles(item.channel);
          const ChannelIcon = styles.icon;

          return (
            <div key={item.id} className="flex flex-col border-l border-neutral-200 pl-4 py-1">
              <div className="flex items-center space-x-2 mb-3">
                <ChannelIcon className={`w-4 h-4 ${styles.text}`} />
                <span className="text-xs font-bold text-neutral-800 tracking-wider uppercase">{item.channel}</span>
              </div>
              
              <h4 className="text-sm font-semibold text-neutral-900 truncate mb-1" title={item.title}>
                {item.title}
              </h4>
              
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-xl font-light text-neutral-800">{item.value}</span>
                <span className="text-xs font-medium text-emerald-600">{item.change}</span>
              </div>
              
              <p className="text-[10px] text-neutral-400 mb-4">{item.subValue}</p>

              <div className="w-full mt-auto mb-4">
                <Sparkline data={item.chartData} strokeColor={styles.stroke} id={item.id} />
              </div>

              <button
                onClick={() => onCreateProduct(item.title, [item.channel, '트렌드 기획'], 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60')}
                className="text-[10px] text-neutral-500 hover:text-blue-600 font-medium flex items-center group transition-colors cursor-pointer mt-2"
              >
                <span>이슈로 기획하기</span>
                <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
