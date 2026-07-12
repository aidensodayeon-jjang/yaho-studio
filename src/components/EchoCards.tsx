import { ArrowRight } from 'lucide-react';
import { EchoCard } from '../types';
import { ECHO_CARDS } from '../data/mockData';

interface EchoCardsProps {
  activeGenre: string;
  selectedEcho: EchoCard | null;
  onSelectEcho: (echo: EchoCard) => void;
  onCreateProduct: (echo: EchoCard) => void;
  searchTerm: string;
}

export default function EchoCards({
  activeGenre,
  selectedEcho,
  onSelectEcho,
  onCreateProduct,
  searchTerm
}: EchoCardsProps) {
  // Filter and limit to 5 cards
  const filteredCards = ECHO_CARDS.filter((card) => {
    const matchesGenre = card.genreId === activeGenre;
    const matchesSearch = searchTerm
      ? card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    return matchesGenre && matchesSearch;
  }).slice(0, 5);

  return (
    <div className="flex flex-col font-sans select-none bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
          AI 추천 상품 TOP 5
        </h3>
        <button className="text-[10px] text-neutral-400 hover:text-neutral-900 flex items-center transition-colors">
          더보기 <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>

      {filteredCards.length === 0 ? (
        <div className="bg-neutral-50 rounded-xl p-10 text-center text-neutral-400 text-xs font-light">
          해당 조건의 기회가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {filteredCards.map((card, index) => {
            const isSelected = selectedEcho?.id === card.id;
            return (
              <div
                key={card.id}
                onClick={() => onSelectEcho(card)}
                className={`group flex flex-col cursor-pointer transition-all duration-300 ${
                  isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                }`}
              >
                {/* Square Image Area */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 shadow-sm border border-neutral-100 bg-neutral-50">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 w-5 h-5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold flex items-center justify-center rounded">
                    {index + 1}
                  </div>
                  
                  {/* Hot Badge */}
                  {card.isHot && (
                    <div className="absolute top-2 left-8 bg-blue-600/90 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                      HOT
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute inset-0 ring-2 ring-inset ring-blue-600 rounded-xl pointer-events-none"></div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                     <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateProduct(card);
                        }}
                        className="bg-white text-black px-3 py-1.5 rounded-full text-[10px] font-bold pointer-events-auto shadow-lg hover:scale-105 transition-transform"
                     >
                        상품 만들기
                     </button>
                  </div>
                </div>

                {/* Minimalist Content */}
                <h4 className="text-xs font-bold text-neutral-900 tracking-tight truncate mb-1">
                  {card.title}
                </h4>

                <div className="flex flex-col gap-0.5">
                  <div className="text-[9px] font-medium text-green-600">
                    <span className="text-neutral-400 font-normal">예상판매력</span> {card.score}
                  </div>
                  <div className="text-[9px] font-medium text-neutral-600">
                    <span className="text-neutral-400 font-normal">Confidence</span> {card.confidence}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
