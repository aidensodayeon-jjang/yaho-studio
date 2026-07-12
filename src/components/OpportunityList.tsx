import { EchoCard } from '../types';
import { ECHO_CARDS } from '../data/mockData';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface OpportunityListProps {
  activeGenre: string;
  selectedEcho: EchoCard | null;
  onSelectEcho: (echo: EchoCard) => void;
}

export default function OpportunityList({ activeGenre, selectedEcho, onSelectEcho }: OpportunityListProps) {
  // Filter cards (ignoring genre strictly for demo, or filter if requested)
  // The image shows a horizontal scrolling list of all "오늘의 Opportunity"
  const cards = ECHO_CARDS.slice(0, 5);

  return (
    <div className="mb-8 font-sans">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">오늘의 Opportunity</h2>
          <div className="flex items-center space-x-2 text-[10px] text-neutral-500 font-medium">
            <span className="bg-neutral-100 px-2 py-0.5 rounded">AI 추천</span>
            <span className="bg-neutral-100 px-2 py-0.5 rounded">실시간 데이터 기반</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-xs text-neutral-600 font-medium hover:text-neutral-900 transition-colors">
            전체 보기
          </button>
          <div className="flex space-x-1">
            <button className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
              <ChevronLeft className="w-3 h-3 text-neutral-500" />
            </button>
            <button className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
              <ChevronRight className="w-3 h-3 text-neutral-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
        {cards.map((card, idx) => {
          const isSelected = selectedEcho?.id === card.id;
          const rank = String(idx + 1).padStart(2, '0');
          const isHigh = card.score >= 90;
          
          return (
            <div
              key={card.id}
              onClick={() => onSelectEcho(card)}
              className={`flex-shrink-0 w-[300px] bg-white rounded-xl border transition-all cursor-pointer flex flex-col p-4 relative ${
                isSelected ? 'border-neutral-900 shadow-md ring-1 ring-neutral-900' : 'border-neutral-200 shadow-sm hover:border-neutral-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 bg-black text-white rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
              )}
              
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs font-bold text-neutral-900">{rank}</span>
                <span className={`text-[10px] font-bold px-1.5 rounded-sm uppercase tracking-wider ${isHigh ? 'text-neutral-900 bg-neutral-100' : 'text-orange-500 bg-orange-50'}`}>
                  {isHigh ? 'HIGH' : 'MEDIUM'}
                </span>
                {idx === 0 && (
                  <span className="text-[10px] font-bold px-1.5 rounded-sm bg-neutral-900 text-white uppercase tracking-wider">
                    ACTIVE
                  </span>
                )}
                {idx === 2 && (
                  <span className="text-[10px] font-bold px-1.5 rounded-sm border border-neutral-200 text-neutral-600 uppercase tracking-wider">
                    NEW
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-neutral-900 mb-1 truncate">{card.title}</h3>
              <div className="flex items-center space-x-1 mb-4">
                {card.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-neutral-500">#{tag}</span>
                ))}
              </div>

              <div className="flex items-start justify-between mb-4 flex-1">
                <div className="flex flex-col">
                  <div className="w-12 h-12 rounded-full border-2 border-neutral-900 flex items-center justify-center mb-1 relative">
                    <span className="text-xl font-bold text-neutral-900">{card.score}</span>
                    {/* Fake progress ring using SVG or simple border, just using border for now */}
                  </div>
                  <span className="text-[8px] text-neutral-400 text-center leading-tight mt-1">Opportunity<br/>Score</span>
                </div>

                <div className="flex-1 px-3 space-y-1.5 mt-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-neutral-500 flex items-center gap-1"><span className="w-3 text-center">📈</span> SNS 언급량</span>
                    <span className="font-bold text-neutral-900">+{card.searchVolumeChange}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-neutral-500 flex items-center gap-1"><span className="w-3 text-center">👥</span> 외국인 비율</span>
                    <span className="font-bold text-neutral-900">+{card.postsChange}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-neutral-500 flex items-center gap-1"><span className="w-3 text-center">⏱️</span> 평균 체류시간</span>
                    <span className="font-bold text-neutral-900">{41 + idx * 5}분</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-neutral-500 flex items-center gap-1"><span className="w-3 text-center">💎</span> 상품/체험 부족</span>
                    <span className="font-bold text-neutral-900">{isHigh ? '높음' : '보통'}</span>
                  </div>
                </div>

                <div className="w-16 h-24 shrink-0 rounded-lg overflow-hidden ml-1">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100">
                <p className="text-[8px] text-neutral-400 mb-1.5">패키지에 포함된 체험</p>
                <div className="flex items-center gap-1 overflow-hidden">
                  {card.tags.map(tag => (
                    <span key={tag} className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">{tag}</span>
                  ))}
                  <span className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">피크닉</span>
                  <span className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">덕연이치킨</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
