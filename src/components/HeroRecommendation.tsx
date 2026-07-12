import { CheckCircle2, Star, ChevronRight, Bot } from 'lucide-react';
import { EchoCard } from '../types';

interface HeroRecommendationProps {
  selectedEcho: EchoCard;
  onPlanProduct: (echo: EchoCard) => void;
}

export default function HeroRecommendation({
  selectedEcho,
  onPlanProduct,
}: HeroRecommendationProps) {
  return (
    <div className="w-full bg-[#18181b] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center animate-fade-in-up font-sans select-none overflow-hidden relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={selectedEcho.image} alt={selectedEcho.title} className="w-full h-full object-cover opacity-40 blur-sm" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#18181b] via-[#18181b]/90 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 z-10">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Bot className="w-3 h-3 mr-1" />
            AI MD Recommendation
          </div>
          <h2 className="text-xs font-semibold text-neutral-300 mb-1 tracking-tight">오늘 출시하면 가장 성공 확률이 높은 상품</h2>
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight flex items-center space-x-3">
            <span>{selectedEcho.title}</span>
            {selectedEcho.isHot && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-sm align-middle tracking-wider uppercase">HOT</span>}
          </h1>
          <p className="text-xs text-neutral-400 font-medium mt-2 max-w-xl leading-relaxed">
            {selectedEcho.subtitle}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {selectedEcho.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-[10px] text-neutral-300 border border-white/5">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Content & Image */}
      <div className="w-full md:w-[400px] flex-shrink-0 z-10 flex flex-col items-end space-y-4">
        {/* Main Image View */}
        <div className="relative w-full h-[140px] rounded-xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer" onClick={() => onPlanProduct(selectedEcho)}>
           <img src={selectedEcho.image} alt={selectedEcho.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
           <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
              <div>
                <p className="text-[10px] text-neutral-300 mb-0.5 font-medium">예상 매출 상승</p>
                <p className="text-xl font-bold text-green-400">+{selectedEcho.score}% <span className="text-[10px] text-neutral-400 font-normal">/100</span></p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-neutral-300 mb-0.5 font-medium">Confidence</p>
                 <p className="text-xl font-bold text-white">{selectedEcho.confidence}%</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
