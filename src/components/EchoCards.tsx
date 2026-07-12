import { ArrowRight, Sparkles } from 'lucide-react';
import { EchoCard } from '../types';
import { ECHO_CARDS, GENRES } from '../data/mockData';

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
  // Filter and limit to 3 cards for minimalist UX
  const filteredCards = ECHO_CARDS.filter((card) => {
    const matchesGenre = card.genreId === activeGenre;
    const matchesSearch = searchTerm
      ? card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    return matchesGenre && matchesSearch;
  }).slice(0, 3);

  const activeGenreName = GENRES.find((g) => g.id === activeGenre)?.name || 'K-POP';

  return (
    <div className="flex flex-col space-y-6 font-sans select-none mb-16">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <div className="flex items-baseline space-x-3">
          <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
            {activeGenreName} Echo Insights
          </h3>
          <p className="text-sm text-neutral-400 font-light">
            데이터 기반의 유망 기회
          </p>
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <div className="bg-neutral-50 rounded-2xl p-16 text-center text-neutral-400 text-sm font-light">
          해당 조건의 기회가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredCards.map((card) => {
            const isSelected = selectedEcho?.id === card.id;
            return (
              <div
                key={card.id}
                onClick={() => onSelectEcho(card)}
                className={`group flex flex-col cursor-pointer transition-all duration-300 ${
                  isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {/* Minimalist Image Area */}
                <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-4 shadow-sm">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 ring-4 ring-inset ring-blue-600 rounded-2xl pointer-events-none"></div>
                  )}
                </div>

                {/* Minimalist Content */}
                <h4 className="text-lg font-bold text-neutral-900 tracking-tight mb-4">
                  {card.title}
                </h4>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="block text-xs text-neutral-400 uppercase tracking-widest mb-1 font-semibold">Confidence</span>
                    <span className="text-2xl font-light text-neutral-800">{card.confidence}%</span>
                  </div>
                  <div className="w-px h-8 bg-neutral-200"></div>
                  <div>
                    <span className="block text-xs text-neutral-400 uppercase tracking-widest mb-1 font-semibold">Opp. Score</span>
                    <div className="flex items-center text-2xl font-light text-neutral-800">
                      <Sparkles className="w-4 h-4 text-amber-400 mr-1" />
                      {card.score}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateProduct(card);
                  }}
                  className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl font-medium text-sm transition-colors flex items-center justify-center space-x-2"
                >
                  <span>이 Echo로 상품 만들기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
