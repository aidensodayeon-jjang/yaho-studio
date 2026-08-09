import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, ChevronDown, ChevronUp, Layers, Package, Target, Lightbulb, Users, MapPin, TrendingUp, Info } from 'lucide-react';
import { EchoCard } from '../types';
import { useTourDetail } from '../hooks/useTourDetail';
import { useRelatedTourSpots } from '../hooks/useRelatedTourSpots';
import { useVisitorAnalytics } from '../hooks/useVisitorAnalytics';
import { useCentralTourSpots } from '../hooks/useCentralTourSpots';
import { useTourTrend } from '../hooks/useTourTrend';
import { calculateOpportunityScore } from '../utils/calculateOpportunityScore';
import { analyzeOpportunity, AIAnalysisResult } from '../ai/analyzeOpportunity';
import { generateProductIdeas, generateTourProduct, ProductIdea, TourProductResult } from '../ai/generateTourProduct';

function stripHtmlTags(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

interface OpportunityDetailProps {
  selectedEcho: EchoCard | null;
  areaCode?: number;
  onSelectEcho?: (echo: EchoCard) => void;
  onCreateProduct?: (echo: EchoCard) => void;
}

export default function OpportunityDetail({ selectedEcho, areaCode = 1, onSelectEcho, onCreateProduct }: OpportunityDetailProps) {
  if (!selectedEcho) return null;

  const { data: detailData, loading: detailLoading } = useTourDetail(
    selectedEcho.contentid,
    selectedEcho.contenttypeid
  );

  const displayTitle = detailData?.title || selectedEcho.title;
  const displayAddr = detailData?.addr1 || selectedEcho.addr1 || '';
  const displayOverview = detailData?.overview ? stripHtmlTags(detailData.overview) : selectedEcho.overview;

  const currentAreaCode = areaCode || 1;
  const { visitorData, loading: visitorLoading } = useVisitorAnalytics(currentAreaCode, displayAddr);
  const { spots: centralSpots, loading: centralLoading, isCurrentSpotCentral, currentSpotRank, signguNm: centralSignguNm } = useCentralTourSpots(currentAreaCode, displayAddr, displayTitle);
  const { trendData, loading: trendLoading } = useTourTrend(currentAreaCode, displayAddr, displayTitle);
  const activeTrend = trendData?.matchedSpotTrend || trendData?.topSpotTrend || null;

  const { spots: relatedSpots, loading: relatedLoading } = useRelatedTourSpots(
    selectedEcho.contentid || detailData?.contentid,
    detailData?.mapx || selectedEcho.mapx,
    detailData?.mapy || selectedEcho.mapy,
    detailData?.contenttypeid || selectedEcho.contenttypeid,
    displayTitle,
    displayAddr
  );

  // Score Calculation
  const scoreResult = calculateOpportunityScore({
    title: displayTitle,
    firstimage: detailData?.firstimage || selectedEcho.image,
    overview: displayOverview,
    addr1: displayAddr,
    contenttypeid: detailData?.contenttypeid || selectedEcho.contenttypeid,
    visitorData,
    isCurrentSpotCentral,
    currentSpotRank,
    trendDirection: activeTrend?.trendDirection,
    trendChangeRate: activeTrend?.changeRate,
  });

  // AI Opportunity Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);

  // Step 5: Product Ideas (3개) State
  const [productIdeas, setProductIdeas] = useState<ProductIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState<boolean>(false);
  const [selectedIdea, setSelectedIdea] = useState<ProductIdea | null>(null);

  // Step 6: Detailed Tour Product State
  const [detailedProduct, setDetailedProduct] = useState<TourProductResult | null>(null);
  const [detailedLoading, setDetailedLoading] = useState<boolean>(false);

  // Step 3 Expandable Accordion State
  const [isDataExpanded, setIsDataExpanded] = useState<boolean>(false);

  // Reset states when selected spot changes
  useEffect(() => {
    setProductIdeas([]);
    setSelectedIdea(null);
    setDetailedProduct(null);
    setIsDataExpanded(false);
  }, [selectedEcho.id]);

  // Load AI Analysis
  useEffect(() => {
    let isMounted = true;
    async function loadAnalysis() {
      try {
        const res = await analyzeOpportunity({
          contentid: selectedEcho.contentid,
          title: displayTitle,
          overview: displayOverview,
          addr1: displayAddr,
          contenttypeid: selectedEcho.contenttypeid,
          score: scoreResult.score,
          scoreBreakdown: scoreResult.breakdown,
          areaName: visitorData?.areaNm || '해당 지역',
          visitorData,
          centralTourSpots: centralSpots.map((s) => s.hubTatsNm),
          isCurrentSpotCentral,
          currentSpotRank,
          trendDirection: activeTrend?.trendDirection,
          trendChangeRate: activeTrend?.changeRate,
        });
        if (isMounted) setAiAnalysis(res);
      } catch {
        // ignore
      }
    }
    loadAnalysis();
    return () => { isMounted = false; };
  }, [selectedEcho.id, displayTitle, displayOverview, displayAddr, visitorData, centralSpots, isCurrentSpotCentral, currentSpotRank, activeTrend]);

  // 1단계: AI 상품 아이디어 3개 생성
  const handleGenerateIdeas = async () => {
    setIdeasLoading(true);
    try {
      const ideas = await generateProductIdeas({
        contentid: selectedEcho.contentid,
        title: displayTitle,
        addr1: displayAddr,
        overview: displayOverview,
        score: scoreResult.score,
        aiAnalysis,
        relatedSpots,
        visitorData,
      });
      setProductIdeas(ideas);
    } catch {
      // ignore
    } finally {
      setIdeasLoading(false);
    }
  };

  // 2단계: 아이디어 하나 선택 시 상세 관광상품 생성
  const handleDevelopIdea = async (idea: ProductIdea) => {
    setSelectedIdea(idea);
    setDetailedLoading(true);
    try {
      const product = await generateTourProduct({
        contentid: selectedEcho.contentid,
        title: displayTitle,
        addr1: displayAddr,
        contenttypeid: selectedEcho.contenttypeid,
        overview: displayOverview,
        score: scoreResult.score,
        scoreBreakdown: scoreResult.breakdown,
        aiAnalysis,
        relatedSpots,
        visitorData,
        centralTourSpots: centralSpots.map((s) => s.hubTatsNm),
        isCurrentSpotCentral,
        currentSpotRank,
        trendDirection: activeTrend?.trendDirection,
        trendChangeRate: activeTrend?.changeRate,
        selectedIdea: idea,
      });
      setDetailedProduct(product);
    } catch {
      // ignore
    } finally {
      setDetailedLoading(false);
    }
  };

  return (
    <div className="font-sans space-y-6">

      {/* Header: Title, Image & Opportunity Score */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-neutral-100 pb-4 gap-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 relative">
            <img
              src={detailData?.firstimage || selectedEcho.image}
              alt={displayTitle}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.endsWith('/images/placeholders/default.jpg')) return;
                target.src = '/images/placeholders/default.jpg';
              }}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">{displayTitle}</h1>
              <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded shrink-0">
                {displayAddr || '대한민국 핫플 기회'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
              {displayOverview || '데이터 기반 관광상품 개발 기회가 포착된 주요 기회 지역입니다.'}
            </p>
          </div>
        </div>

        {/* Opportunity Score Highlight */}
        <div className="flex items-center space-x-3 bg-neutral-900 text-white px-4 py-2.5 rounded-2xl shadow-sm shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Opportunity Score</p>
            <p className="text-xl font-extrabold font-mono text-amber-400 leading-none mt-0.5">{scoreResult.score} <span className="text-xs text-neutral-400 font-normal">/ 100</span></p>
          </div>
        </div>
      </div>

      {/* [1. 왜 여기가 기회인가?] */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-neutral-900 tracking-tight flex items-center gap-1.5">
          <span>🎯</span> 왜 여기가 관광상품 기회인가?
        </h2>

        {/* 4대 기회 근거 요약 박스 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80">
            <p className="text-[10px] text-neutral-500 font-medium mb-1">방문 수요</p>
            <p className="text-sm font-extrabold text-green-600 flex items-center gap-1">
              ↑ 지속 증가 <span className="text-[9px] font-normal text-neutral-400">(상승 추모)</span>
            </p>
          </div>

          <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80">
            <p className="text-[10px] text-neutral-500 font-medium mb-1">관광 집중도</p>
            <p className="text-sm font-extrabold text-neutral-800">
              낮음 <span className="text-[9px] font-normal text-neutral-400">(분산 가능성)</span>
            </p>
          </div>

          <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80">
            <p className="text-[10px] text-neutral-500 font-medium mb-1">연관 관광지</p>
            <p className="text-sm font-extrabold text-indigo-600">
              {relatedSpots.length > 0 ? `${relatedSpots.length}곳 연계` : '독자 코스'}
            </p>
          </div>

          <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80">
            <p className="text-[10px] text-neutral-500 font-medium mb-1">상품화 가능성</p>
            <p className="text-sm font-extrabold text-amber-600">
              높음 <span className="text-[9px] font-normal text-amber-700">({scoreResult.level})</span>
            </p>
          </div>
        </div>

        {/* AI Opportunity Insight Box */}
        <div className="bg-neutral-900 rounded-2xl p-4 text-white shadow-sm border border-neutral-800 space-y-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">AI Opportunity Insight</h3>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed font-medium">
            "{aiAnalysis ? aiAnalysis.summary : `${displayTitle}은(는) 방문 수요 및 외지인 유입 지표가 훌륭하지만 독자적인 대표 관광상품 공급이 부족합니다. 주변 연계 스팟과 결합 시 독창적인 체류형 로컬 관광상품으로 확장 가능성이 매우 높습니다.`}"
          </p>
        </div>
      </div>

      {/* [2. AI 상품 아이디어 만들기 (3개 제안)] */}
      <div className="pt-2 border-t border-neutral-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-neutral-900 tracking-tight flex items-center gap-1.5">
              <span>✨</span> AI 관광상품 아이디어 제안
            </h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              데이터 근거를 기반으로 AI가 3가지 맞춤형 관광상품 아이디어를 기획해 드립니다.
            </p>
          </div>

          {productIdeas.length === 0 && (
            <button
              onClick={handleGenerateIdeas}
              disabled={ideasLoading}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {ideasLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>아이디어 기획 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI 상품 아이디어 만들기</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Display 3 Product Ideas Cards */}
        {productIdeas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {productIdeas.map((idea, idx) => {
              const isChosen = selectedIdea?.title === idea.title;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                    isChosen ? 'border-neutral-900 ring-2 ring-neutral-900 shadow-md bg-neutral-50/40' : 'border-neutral-200/90 hover:border-neutral-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium truncate max-w-[120px]">{idea.target}</span>
                    </div>

                    <h3 className="text-sm font-extrabold text-neutral-900 mb-1 leading-snug">{idea.title}</h3>
                    <p className="text-[11px] text-neutral-600 leading-relaxed mb-3 line-clamp-2">{idea.oneLineConcept}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {idea.tags.map((tag) => (
                        <span key={tag} className="text-[9.5px] text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDevelopIdea(idea)}
                    disabled={detailedLoading}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center space-x-1"
                  >
                    {detailedLoading && isChosen ? (
                      <span>발전시키는 중...</span>
                    ) : (
                      <>
                        <span>이 아이디어 발전시키기</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 6 Result: Detailed Tour Product */}
        {detailedLoading && (
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 flex flex-col items-center justify-center space-y-2">
            <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-neutral-800">선택된 아이디어를 바탕으로 상세 관광상품 기획서를 생성하고 있습니다...</span>
            <span className="text-[10px] text-neutral-400">TourAPI 연관 관광지 동선 설계 및 가격 가이드 구성 중</span>
          </div>
        )}

        {detailedProduct && (
          <div className="bg-white rounded-2xl p-5 border border-neutral-300 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  ✨ 완성형 상세 기획서
                </span>
                <h3 className="text-base font-extrabold text-neutral-900 mt-1">{detailedProduct.productName}</h3>
                <p className="text-xs text-neutral-500">{detailedProduct.concept}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[9px] text-neutral-400 font-medium">타깃 고객</span>
                <p className="font-bold text-neutral-900 truncate">{detailedProduct.targetCustomer}</p>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[9px] text-neutral-400 font-medium">소요시간</span>
                <p className="font-bold text-neutral-900 truncate">{detailedProduct.duration}</p>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[9px] text-neutral-400 font-medium">권장 교통</span>
                <p className="font-bold text-neutral-900 truncate">{detailedProduct.transportation || '전용 이동'}</p>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[9px] text-neutral-400 font-medium">권장 가격대</span>
                <p className="font-bold text-emerald-700 truncate">{detailedProduct.priceGuide}</p>
              </div>
            </div>

            {/* Course Itinerary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-900">🗺️ 추천 투어 동선 코스</h4>
              <div className="space-y-1.5">
                {detailedProduct.course.map((step) => (
                  <div key={step.order} className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/80 flex items-start space-x-2.5">
                    <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.order}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-neutral-900">{step.placeName}</h5>
                      <p className="text-[10.5px] text-neutral-600 leading-snug">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* [3. 상세 데이터 근거 - Expandable Accordion] */}
      <div className="pt-2 border-t border-neutral-100">
        <button
          onClick={() => setIsDataExpanded(!isDataExpanded)}
          className="w-full bg-neutral-50 hover:bg-neutral-100 p-3.5 rounded-2xl border border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-800 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-neutral-600" />
            <span>데이터 근거 자세히 보기 (TourAPI & 한국관광 데이터랩 상세 지표)</span>
          </div>
          {isDataExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Expanded Details */}
        {isDataExpanded && (
          <div className="mt-3 p-4 bg-white rounded-2xl border border-neutral-200 space-y-4">
            {/* Opportunity Score Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-900">🎯 Opportunity Score 산출 세부 내역</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500">데이터 완성도:</span> <span className="font-bold">{scoreResult.breakdown.dataCompleteness}점</span>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500">상품화 가능성:</span> <span className="font-bold">{scoreResult.breakdown.productPotential}점</span>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500">희소성:</span> <span className="font-bold">{scoreResult.breakdown.uniqueness}점</span>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500">접근성:</span> <span className="font-bold">{scoreResult.breakdown.accessibility}점</span>
                </div>
              </div>
            </div>

            {/* Visitor & Central Spots */}
            {visitorData && (
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-neutral-900">📊 {visitorData.areaNm} 방문자 데이터 통계</h4>
                <p className="text-[11px] text-neutral-600">
                  월 유동인구 <span className="font-bold text-neutral-900">{visitorData.totalVisitors.toLocaleString()}명</span> (외지인 {visitorData.outsiderRatio}%, 외국인 {visitorData.foreignerRatio}%)
                </p>
              </div>
            )}

            {/* Related Spots */}
            {relatedSpots.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-900">🗺️ 반경 5km 연관 관광지 ({relatedSpots.length}개)</h4>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {relatedSpots.slice(0, 6).map((spot) => (
                    <div key={spot.contentid} className="w-28 shrink-0 bg-neutral-50 p-2 rounded-xl border border-neutral-200 text-[10px]">
                      <p className="font-bold text-neutral-900 truncate">{spot.title}</p>
                      <p className="text-neutral-400 truncate">{spot.distanceText || '주변 명소'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
