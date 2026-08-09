import { EchoCard } from '../types';
import { TourSpotItem } from '../api/tourApi';
import { tourSpotToEchoCard } from '../utils/tourSpotAdapter';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface OpportunityListProps {
  selectedKeyword?: string;
  selectedEcho: EchoCard | null;
  onSelectEcho: (echo: EchoCard) => void;
  tourData?: TourSpotItem[];
  loading?: boolean;
  error?: string | null;
  isNationwideFallback?: boolean;
}

export default function OpportunityList({
  selectedKeyword,
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
    ? tourData.slice(0, 4).map((spot, idx) => tourSpotToEchoCard(spot, idx))
    : [];

  const titleText = selectedKeyword
    ? `"${selectedKeyword}"에서 발견한 관광상품 기회`
    : '지금 주목할 관광상품 기회';

  return (
    <div className="font-sans space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-neutral-900 tracking-tight">
          {titleText}
        </h2>
        {hasTourData && (
          <span className="text-xs font-bold text-neutral-400">
            {cards.length}개 관광자원 포착
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-neutral-200 text-neutral-500 text-xs">
          <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-2"></div>
          <span>한국관광공사 데이터를 분석하여 관광 기회를 찾고 있습니다...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 bg-red-50 rounded-2xl border border-red-200 text-red-600 text-xs px-4">
          <AlertCircle className="w-5 h-5 mb-1 text-red-500" />
          <span className="font-bold mb-0.5">관광자원 조회 실패</span>
          <span className="text-red-500 text-center">{error}</span>
        </div>
      ) : isEmptyData ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-neutral-200 text-neutral-500 text-xs text-center space-y-1">
          <span className="text-xl">🔍</span>
          <span className="font-bold text-neutral-800">연결 가능한 관광자원을 찾지 못했습니다.</span>
          <span className="text-neutral-400">다른 키워드나 지역으로 검색해보세요.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const isSelected = selectedEcho?.id === card.id;

            return (
              <div
                key={card.id}
                onClick={() => onSelectEcho(card)}
                className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'border-neutral-900 ring-2 ring-neutral-900 shadow-sm bg-neutral-50/20'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Spot Image & Title */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 relative">
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
                      <h3 className="text-base font-extrabold text-neutral-900 tracking-tight leading-snug truncate">
                        {card.title}
                      </h3>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {card.addr1 || '위치 정보 확인 가능'}
                      </p>
                    </div>
                  </div>

                  {/* Summary Concept */}
                  <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                    "{selectedKeyword ? `'${selectedKeyword}' 트렌드와 연결할 수 있는 관광자원이 포착되었습니다.` : (card.subtitle || '관광 수요와 연계 가능성이 우수한 기회 자원입니다.')}"
                  </p>
                </div>

                {/* Bottom CTA */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400">
                    {card.contenttypeid === '12' ? '관광지' : card.contenttypeid === '14' ? '문화시설' : card.contenttypeid === '39' ? '음식점' : '관광자원'}
                  </span>

                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1 group-hover:underline">
                    기회 분석하기 <ArrowRight className="w-3.5 h-3.5" />
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
