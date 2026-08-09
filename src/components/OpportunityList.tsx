import { EchoCard } from '../types';
import { TourSpotItem } from '../api/tourApi';
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { tourSpotToEchoCard } from '../utils/tourSpotAdapter';

interface OpportunityListProps {
  activeGenre: string;
  selectedEcho: EchoCard | null;
  onSelectEcho: (echo: EchoCard) => void;
  tourData?: TourSpotItem[];
  loading?: boolean;
  error?: string | null;
  isNationwideFallback?: boolean;
}

export default function OpportunityList({
  selectedEcho,
  onSelectEcho,
  tourData = [],
  loading = false,
  error = null,
  isNationwideFallback = false,
}: OpportunityListProps) {
  const hasTourData = tourData && tourData.length > 0;
  const isEmptyData = !loading && !error && tourData && tourData.length === 0;

  const cards: EchoCard[] = hasTourData
    ? tourData.slice(0, 6).map((spot, idx) => tourSpotToEchoCard(spot, idx))
    : [];

  return (
    <div className="font-sans">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">지금 주목할 관광 기회</h2>
          <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
            실시간 데이터 분석
          </span>
          {isNationwideFallback && !loading && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
              전국 검색 결과
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-neutral-200 text-neutral-500 text-xs">
          <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-2"></div>
          <span>관광 기회 데이터를 분석하고 있습니다...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 bg-red-50 rounded-2xl border border-red-200 text-red-600 text-xs px-4">
          <AlertCircle className="w-5 h-5 mb-1 text-red-500" />
          <span className="font-bold mb-0.5">데이터 조회 오류</span>
          <span className="text-red-500 text-center">{error}</span>
        </div>
      ) : isEmptyData ? (
        <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-neutral-200 text-neutral-500 text-xs">
          <span className="text-base mb-1">🔍</span>
          <span className="font-medium text-neutral-700">검색된 관광 기회가 없습니다.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {cards.map((card) => {
            const isSelected = selectedEcho?.id === card.id;

            return (
              <div
                key={card.id}
                onClick={() => onSelectEcho(card)}
                className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-neutral-900 shadow-md ring-2 ring-neutral-900 bg-neutral-50/30'
                    : 'border-neutral-200/80 hover:border-neutral-400 hover:shadow-sm'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 bg-neutral-900 text-white rounded-full p-1 shadow">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                <div>
                  {/* Card Header: Thumbnail Image, Title & Opportunity Score */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 relative">
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.endsWith('/images/placeholders/default.jpg')) return;
                            target.src = '/images/placeholders/default.jpg';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight leading-snug truncate">
                          {card.title}
                        </h3>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {card.addr1 || '위치 정보 확인 가능'}
                        </p>
                      </div>
                    </div>

                    {/* Clean Opportunity Score Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="bg-neutral-900 text-white px-2.5 py-1 rounded-lg flex items-baseline space-x-1 shadow-sm">
                        <span className="text-[9px] font-medium text-neutral-400">Score</span>
                        <span className="text-sm font-extrabold font-mono text-amber-400">{card.score}</span>
                      </div>
                    </div>
                  </div>

                  {/* Minimal Highlights (핵심 가치 3선) */}
                  <div className="space-y-1.5 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100/80 mb-3">
                    <div className="flex items-center text-[11px] text-neutral-700 font-medium">
                      <span className="text-green-600 font-bold mr-1.5">↑</span>
                      <span>방문 수요 지속 증가 추세</span>
                    </div>
                    <div className="flex items-center text-[11px] text-neutral-700 font-medium">
                      <span className="text-amber-500 font-bold mr-1.5">◎</span>
                      <span>관광상품화 개발 가능성 우수</span>
                    </div>
                    <div className="flex items-center text-[11px] text-neutral-700 font-medium">
                      <span className="text-indigo-600 font-bold mr-1.5">⌁</span>
                      <span>주변 연계 관광지 확장성 보유</span>
                    </div>
                  </div>

                  {/* One Line Summary */}
                  <p className="text-[11px] text-neutral-600 leading-relaxed italic bg-white p-2 rounded-lg border border-dashed border-neutral-200">
                    "{card.subtitle || '방문 수요는 높으나 독창적 대표 상품 개발이 요구되는 기회 지역입니다.'}"
                  </p>
                </div>

                {/* Bottom CTA Button */}
                <div className="mt-3.5 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-medium">클릭 시 분석 결과 확인</span>
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-neutral-900 underline' : 'text-neutral-500 group-hover:text-neutral-900'}`}>
                    기회 자세히 보기 →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
