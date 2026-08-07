import { EchoCard } from '../types';
import { TourSpotItem } from '../api/tourApi';
import { ECHO_CARDS } from '../data/mockData';
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { tourSpotToEchoCard } from '../utils/tourSpotAdapter';

const DEFAULT_IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80';

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
  // TourAPI 데이터가 존재하면 TourAPI 카드 구성, 
  // API 결과는 성공했으나 빈 배열일 경우 noData 상태
  const hasTourData = tourData && tourData.length > 0;
  const isEmptyData = !loading && !error && tourData && tourData.length === 0;

  const cards: EchoCard[] = hasTourData
    ? tourData.slice(0, 5).map((spot, idx) => tourSpotToEchoCard(spot, idx))
    : [];

  return (
    <div className="mb-4 font-sans">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">오늘의 Opportunity</h2>
          <div className="flex items-center space-x-2 text-[10px] text-neutral-500 font-medium">
            <span className="bg-neutral-100 px-2 py-0.5 rounded">AI 추천</span>
            <span className="bg-neutral-100 px-2 py-0.5 rounded">실시간 데이터 기반</span>
          </div>
          {isNationwideFallback && !loading && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
              선택한 필터에서 결과가 없어 전국 검색 결과를 표시합니다.
            </span>
          )}
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

      <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-1 min-h-[165px] items-center">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-500 text-xs">
            <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span>관광정보를 불러오는 중입니다...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 bg-red-50 rounded-xl border border-red-200 text-red-600 text-xs px-4">
            <AlertCircle className="w-5 h-5 mb-1 text-red-500" />
            <span className="font-bold mb-0.5">데이터 조회 오류</span>
            <span className="text-red-500 text-center">{error}</span>
          </div>
        ) : isEmptyData ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-500 text-xs">
            <span className="text-base mb-1">🔍</span>
            <span className="font-medium text-neutral-700">검색 결과가 없습니다.</span>
          </div>
        ) : (
          cards.map((card, idx) => {
            const isSelected = selectedEcho?.id === card.id;
            const rank = String(idx + 1).padStart(2, '0');
            const level = card.level || (card.score >= 90 ? 'HIGH' : card.score >= 75 ? 'MEDIUM' : 'LOW');
            const levelBadgeColor =
              level === 'HIGH'
                ? 'text-neutral-900 bg-neutral-100'
                : level === 'MEDIUM'
                ? 'text-orange-600 bg-orange-50'
                : 'text-neutral-500 bg-neutral-100';

            return (
              <div
                key={card.id}
                onClick={() => onSelectEcho(card)}
                className={`flex-shrink-0 w-[270px] bg-white rounded-xl border transition-all cursor-pointer flex flex-col p-3 relative ${
                  isSelected ? 'border-neutral-900 shadow-md ring-1 ring-neutral-900' : 'border-neutral-200 shadow-sm hover:border-neutral-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-black text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                )}

                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-bold text-neutral-900">{rank}</span>
                  <span className={`text-[10px] font-bold px-1.5 rounded-sm uppercase tracking-wider ${levelBadgeColor}`}>
                    {level}
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

                <h3 className="text-xs font-bold text-neutral-900 mb-0.5 truncate">{card.title}</h3>

                <div className="flex items-center space-x-1 mb-2">
                  {card.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] text-neutral-500">#{tag}</span>
                  ))}
                </div>

                <div className="flex items-start justify-between mb-2 flex-1">
                  <div className="flex flex-col items-center group/score relative">
                    <div className="w-10 h-10 rounded-full border-2 border-neutral-900 flex items-center justify-center mb-0.5 relative bg-white">
                      <span className="text-base font-bold text-neutral-900">{card.score}</span>
                    </div>
                    <span className="text-[7px] text-neutral-400 text-center leading-tight">Opportunity<br/>Score</span>

                    {/* Tooltip explaining score reasons */}
                    {card.scoreReasons && card.scoreReasons.length > 0 && (
                      <div className="absolute bottom-full mb-1 left-0 z-50 hidden group-hover/score:block w-48 p-2 bg-neutral-900 text-white text-[9px] rounded-md shadow-lg leading-relaxed">
                        <div className="font-bold border-b border-neutral-700 pb-1 mb-1">점수 산출 근거</div>
                        <ul className="space-y-0.5">
                          {card.scoreReasons.map((r, rIdx) => (
                            <li key={rIdx} className="truncate">• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 px-2 space-y-1 mt-0.5">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-neutral-500 flex items-center gap-0.5"><span className="w-3 text-center">📈</span> SNS 언급량 <span className="text-[7px] text-neutral-400 bg-neutral-100 px-0.5 rounded">예시</span></span>
                      <span className="font-bold text-neutral-900">+{card.searchVolumeChange}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-neutral-500 flex items-center gap-0.5"><span className="w-3 text-center">👥</span> 외국인 비율 <span className="text-[7px] text-neutral-400 bg-neutral-100 px-0.5 rounded">예시</span></span>
                      <span className="font-bold text-neutral-900">+{card.postsChange}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-neutral-500 flex items-center gap-0.5"><span className="w-3 text-center">⏱️</span> 평균 체류시간 <span className="text-[7px] text-neutral-400 bg-neutral-100 px-0.5 rounded">예시</span></span>
                      <span className="font-bold text-neutral-900">{41 + idx * 5}분</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-neutral-500 flex items-center gap-0.5"><span className="w-3 text-center">💎</span> 체험 부족도 <span className="text-[7px] text-neutral-400 bg-neutral-100 px-0.5 rounded">예시</span></span>
                      <span className="font-bold text-neutral-900">{level === 'HIGH' ? '높음' : '보통'}</span>
                    </div>
                  </div>

                  <div className="w-14 h-20 shrink-0 rounded-lg overflow-hidden ml-1 bg-neutral-100 border border-neutral-200 relative">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.endsWith('/images/placeholders/default.jpg')) {
                          return; // 무한 반복 방지
                        }
                        target.src = '/images/placeholders/default.jpg';
                      }}
                    />
                    {card.imageSource === 'placeholder' && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7px] font-medium py-0.5 text-center leading-tight">
                        테마 이미지
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-[8px] text-neutral-400 mb-1">패키지에 포함된 체험</p>
                  <div className="flex items-center gap-1 overflow-hidden">
                    {card.tags.map(tag => (
                      <span key={tag} className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">{tag}</span>
                    ))}
                    <span className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">피크닉</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
