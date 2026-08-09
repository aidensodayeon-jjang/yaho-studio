import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Sparkles, DollarSign, Users, CheckCircle2, ArrowRight, RefreshCw, AlertCircle, TrendingUp, Lightbulb } from 'lucide-react';
import { EchoCard, Project } from '../types';
import { useTourDetail } from '../hooks/useTourDetail';
import { useRelatedTourSpots } from '../hooks/useRelatedTourSpots';
import { useVisitorAnalytics } from '../hooks/useVisitorAnalytics';
import { useCentralTourSpots } from '../hooks/useCentralTourSpots';
import { useTourTrend } from '../hooks/useTourTrend';
import { calculateOpportunityScore } from '../utils/calculateOpportunityScore';
import { analyzeOpportunity, AIAnalysisResult } from '../ai/analyzeOpportunity';
import { generateTourProduct, TourProductResult } from '../ai/generateTourProduct';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  echo: EchoCard | null;
  areaCode?: number;
  customTitle?: string;
  onSaveProject: (project: Project) => void;
}

export default function CreateProductModal({
  isOpen,
  onClose,
  echo,
  areaCode = 1,
  customTitle,
  onSaveProject
}: CreateProductModalProps) {
  const [productData, setProductData] = useState<TourProductResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('2박 3일');
  const [transport, setTransport] = useState('전용 리무진');
  const [targetAudience, setTargetAudience] = useState('2030 여성 & K-콘텐츠 팬층');
  
  // Cost states
  const [stayCost, setStayCost] = useState(180000); // per person
  const [activityCost, setActivityCost] = useState(120000);
  const [foodCost, setFoodCost] = useState(90000);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Tour API 및 관련 빅데이터 Hook 호출
  const contentId = echo?.contentid || echo?.id;
  const contentTypeId = echo?.contenttypeid;

  const { data: detailData } = useTourDetail(contentId, contentTypeId);
  const displayTitle = detailData?.title || echo?.title || '';
  const displayAddr = detailData?.addr1 || echo?.addr1 || '';
  const displayOverview = detailData?.overview ? detailData.overview.replace(/<[^>]*>?/gm, '').trim() : echo?.overview;

  const currentAreaCode = areaCode || 1;
  const { visitorData } = useVisitorAnalytics(currentAreaCode, displayAddr);
  const { spots: centralSpots, isCurrentSpotCentral, currentSpotRank } = useCentralTourSpots(currentAreaCode, displayAddr, displayTitle);
  const { trendData } = useTourTrend(currentAreaCode, displayAddr, displayTitle);
  const activeTrend = trendData?.matchedSpotTrend || trendData?.topSpotTrend || null;

  const { spots: relatedSpots } = useRelatedTourSpots(
    contentId,
    detailData?.mapx || echo?.mapx,
    detailData?.mapy || echo?.mapy,
    contentTypeId,
    displayTitle,
    displayAddr
  );

  const scoreResult = calculateOpportunityScore({
    title: displayTitle,
    firstimage: detailData?.firstimage || echo?.image,
    overview: displayOverview,
    addr1: displayAddr,
    contenttypeid: contentTypeId,
    visitorData,
    isCurrentSpotCentral,
    currentSpotRank,
    trendDirection: activeTrend?.trendDirection,
    trendChangeRate: activeTrend?.changeRate,
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    if (!isOpen || !echo) return;

    let isMounted = true;
    async function loadAnalysis() {
      try {
        const res = await analyzeOpportunity({
          contentid: contentId,
          title: displayTitle,
          overview: displayOverview,
          addr1: displayAddr,
          contenttypeid: contentTypeId,
          score: scoreResult.score,
          scoreBreakdown: scoreResult.breakdown,
          areaName: visitorData?.areaNm || '해당 지역',
          visitorData: visitorData,
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
  }, [isOpen, echo, contentId, displayTitle, displayOverview, displayAddr, contentTypeId, visitorData, centralSpots, isCurrentSpotCentral, currentSpotRank, activeTrend]);

  // Gemini API 기반 관광상품 기획서 생성 핸들러
  const handleGenerate = async () => {
    if (!echo) return;
    setLoading(true);
    setError(null);

    try {
      const result = await generateTourProduct({
        contentid: contentId,
        title: displayTitle,
        addr1: displayAddr,
        contenttypeid: contentTypeId,
        overview: displayOverview,
        score: scoreResult.score,
        scoreBreakdown: scoreResult.breakdown,
        aiAnalysis: aiAnalysis,
        relatedSpots: relatedSpots,
        visitorData: visitorData,
        centralTourSpots: centralSpots.map((s) => s.hubTatsNm),
        isCurrentSpotCentral: isCurrentSpotCentral,
        currentSpotRank: currentSpotRank,
        trendDirection: activeTrend?.trendDirection,
        trendChangeRate: activeTrend?.changeRate,
      });

      setProductData(result);
      setTitle(customTitle || result.productName);
      setDuration(result.duration || '2박 3일');
      setTransport(result.transportation || '전용 리무진');
      setTargetAudience(result.targetCustomers ? result.targetCustomers.join(', ') : result.targetCustomer);
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '관광상품 생성 중 오류가 발생했습니다.';
      setError(msg);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && echo) {
      handleGenerate();
    } else {
      setProductData(null);
      setError(null);
    }
  }, [isOpen, echo?.id || echo?.contentid]);

  if (!isOpen || !echo) return null;

  const totalCost = stayCost + activityCost + foodCost;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        title: title,
        status: '기획 중',
        progress: 80,
        image: echo.image
      };
      onSaveProject(newProject);
      setIsSaving(false);
      setIsSaved(true);

      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none font-sans">
      {/* Background Dim */}
      <div
        className="absolute inset-0 bg-[#1f1f1f]/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content Container (Notion Style Paper) */}
      <div className="relative bg-[#fdfdfd] w-[680px] max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 shadow-xl p-8 flex flex-col z-10 animate-slide-up no-scrollbar">
        
        {/* Success Splash Screen */}
        {isSaved ? (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 animate-scale-up">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">기획서 생성 완료!</h3>
            <p className="text-xs text-[#7f7f7f] mt-1">
              {title} 상품이 성공적으로 저장되었습니다.<br />
              &lsquo;최근 프로젝트&rsquo; 목록에서 분석 진행 상태를 보실 수 있습니다.
            </p>
          </div>
        ) : null}

        {/* Header Close */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-5">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>AI MD 관광상품 자동 기획 엔진 (Gemini 2.5 Flash API)</span>
            {productData?.generatedBy === 'gemini' && (
              <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.5 rounded font-extrabold ml-1">Gemini AI</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-neutral-800">
              관광데이터를 분석해 상품을 기획하고 있습니다...
            </p>
            <p className="text-[11px] text-neutral-400">
              한국관광공사 TourAPI, 빅데이터 유동인구, 연관 관광지 코스를 조합 중입니다.
            </p>
          </div>
        ) : error ? (
          /* Error State with Retry */
          <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-red-50/50 rounded-xl border border-red-100 p-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="text-center">
              <h4 className="text-xs font-bold text-red-900">관광상품 생성 실패</h4>
              <p className="text-[11px] text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={handleGenerate}
              className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>다시 생성</span>
            </button>
          </div>
        ) : (
          /* Main Input & Product Details */
          <div className="space-y-5">
            {/* Title Area */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                여행 상품명 (Product Name)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-base font-bold text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:bg-white focus:border-neutral-400 transition-all"
              />
            </div>

            {/* Concept & Opportunity Reason */}
            {productData?.concept && (
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span>상품 기획 컨셉 및 Opportunity 분석 이유</span>
                </div>
                <p className="text-[11px] text-blue-950 font-medium leading-relaxed">
                  {productData.concept}
                </p>
                {productData.opportunityReason && (
                  <p className="text-[10px] text-blue-800 pt-1 leading-normal border-t border-blue-200/50 mt-1">
                    💡 <span className="font-bold">상품화 가치근거:</span> {productData.opportunityReason}
                  </p>
                )}
              </div>
            )}

            {/* Quick Config Specs */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  기본 일정
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2"
                >
                  <option value="1박 2일">1박 2일 (컴팩트)</option>
                  <option value="2박 3일">2박 3일 (권장)</option>
                  <option value="3박 4일">3박 4일 (프리미엄)</option>
                  <option value="반일 4시간">반일 코스 (4시간)</option>
                  <option value="당일 코스">당일 풀코스</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  교통수단
                </label>
                <select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  className="w-full text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2"
                >
                  <option value="전용 리무진">전용 우등 리무진</option>
                  <option value="도보 해설 가이드">도보 해설 가이드</option>
                  <option value="KTX/철도 연계">KTX/철도 연계 패키지</option>
                  <option value="자차/카셰어링">자차이동 제휴 쿠폰</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  주 타겟층
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:border-neutral-400 transition-all"
                />
              </div>
            </div>

            {/* Mini Divider */}
            <div className="border-t border-neutral-100 my-1" />

            {/* Itinerary Title */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-neutral-800">AI 연관 관광지 연계 추천 코스 (Itinerary)</h4>
                </div>
                {productData?.estimatedPrice && (
                  <span className="text-[10px] bg-neutral-100 text-neutral-800 font-bold px-2 py-0.5 rounded">
                    권장가: {productData.estimatedPrice}
                  </span>
                )}
              </div>
              
              {/* Day / Itinerary blocks */}
              <div className="space-y-3">
                {productData?.itinerary && productData.itinerary.length > 0 ? (
                  productData.itinerary.map((dayData, idx) => (
                    <div key={idx} className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-100">
                      <span className="text-[10px] font-bold text-blue-600">{dayData.day}</span>
                      <p className="text-[10px] text-neutral-600 mt-0.5 leading-relaxed font-light">{dayData.desc}</p>
                      
                      {/* Spot mini tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {dayData.spots.map((spot, sidx) => (
                          <span key={sidx} className="bg-white text-neutral-800 font-medium text-[9.5px] px-2 py-0.5 rounded-md border border-neutral-200 flex items-center">
                            <MapPin className="w-2.5 h-2.5 text-red-500 mr-1 shrink-0" />
                            {spot}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  productData?.course.map((c, idx) => (
                    <div key={idx} className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-100 flex items-start space-x-2">
                      <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {c.order}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-neutral-900">{c.placeName}</span>
                        <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">{c.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Differentiation & Expected Effect */}
            {(productData?.differentiation || productData?.expectedEffect) && (
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                {productData?.differentiation && (
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <span className="font-bold text-neutral-800 block mb-0.5">✨ 차별화 & 분산 효과</span>
                    <p className="text-neutral-600 leading-normal">{productData.differentiation}</p>
                  </div>
                )}
                {productData?.expectedEffect && (
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <span className="font-bold text-neutral-800 block mb-0.5">📈 예상되는 지역 파급 효과</span>
                    <p className="text-neutral-600 leading-normal">{productData.expectedEffect}</p>
                  </div>
                )}
              </div>
            )}

            {/* Pricing slider controls */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-neutral-500" />
                  <h4 className="text-xs font-bold text-neutral-800">1인 예상 기획 원가 추정</h4>
                </div>
                <span className="text-xs font-bold text-blue-600">총합: {totalCost.toLocaleString()}원</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-[10px]">
                <div>
                  <div className="flex justify-between text-neutral-500 mb-1 font-medium">
                    <span>숙소 (인당)</span>
                    <span className="font-semibold text-neutral-800">{(stayCost / 10000).toFixed(0)}만원</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="400000"
                    step="10000"
                    value={stayCost}
                    onChange={(e) => setStayCost(Number(e.target.value))}
                    className="w-full accent-blue-600 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-neutral-500 mb-1 font-medium">
                    <span>콘텐츠/액티비티</span>
                    <span className="font-semibold text-neutral-800">{(activityCost / 10000).toFixed(0)}만원</span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="300000"
                    step="10000"
                    value={activityCost}
                    onChange={(e) => setActivityCost(Number(e.target.value))}
                    className="w-full accent-blue-600 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-neutral-500 mb-1 font-medium">
                    <span>미식/식비</span>
                    <span className="font-semibold text-neutral-800">{(foodCost / 10000).toFixed(0)}만원</span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="200000"
                    step="5000"
                    value={foodCost}
                    onChange={(e) => setFoodCost(Number(e.target.value))}
                    className="w-full accent-blue-600 h-1 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center justify-between">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>AI 기획서 다시 생성</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all cursor-pointer"
            >
              기획 취소
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="bg-[#18181b] hover:bg-neutral-800 text-white font-semibold text-xs py-2 px-5 rounded-lg flex items-center space-x-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:bg-neutral-400"
            >
              {isSaving ? (
                <span>저장 중...</span>
              ) : (
                <>
                  <span>기획서 완성 및 저장</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

