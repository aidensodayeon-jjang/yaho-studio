import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { EchoCard } from '../types';
import { useTourDetail } from '../hooks/useTourDetail';
import { useRelatedTourSpots } from '../hooks/useRelatedTourSpots';
import { useVisitorAnalytics } from '../hooks/useVisitorAnalytics';
import { useCentralTourSpots } from '../hooks/useCentralTourSpots';
import { useTourTrend } from '../hooks/useTourTrend';
import { calculateOpportunityScore } from '../utils/calculateOpportunityScore';
import { analyzeOpportunity, AIAnalysisResult } from '../ai/analyzeOpportunity';
import { generateProductIdeas, generateTourProduct, ProductIdea, TourProductResult } from '../ai/generateTourProduct';
import { useYouTubeTrend } from '../hooks/useYouTubeTrend';

function stripHtmlTags(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

interface OpportunityDetailProps {
  selectedEcho: EchoCard | null;
  areaCode?: number;
  onSelectEcho?: (echo: EchoCard) => void;
}

export default function OpportunityDetail({ selectedEcho, areaCode = 1, onSelectEcho }: OpportunityDetailProps) {
  if (!selectedEcho) return null;

  const { data: detailData } = useTourDetail(
    selectedEcho.contentid,
    selectedEcho.contenttypeid
  );

  const displayTitle = detailData?.title || selectedEcho.title;
  const displayAddr = detailData?.addr1 || selectedEcho.addr1 || '';
  const displayOverview = detailData?.overview ? stripHtmlTags(detailData.overview) : selectedEcho.overview;

  // YouTube Social Trend Hook 호출
  const { data: ytData } = useYouTubeTrend(displayTitle);

  const currentAreaCode = areaCode || 1;
  const { visitorData } = useVisitorAnalytics(currentAreaCode, displayAddr);
  const { spots: centralSpots, isCurrentSpotCentral, currentSpotRank } = useCentralTourSpots(currentAreaCode, displayAddr, displayTitle);
  const { trendData } = useTourTrend(currentAreaCode, displayAddr, displayTitle);
  const activeTrend = trendData?.matchedSpotTrend || trendData?.topSpotTrend || null;

  const { spots: relatedSpots } = useRelatedTourSpots(
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

  // ⑤ User-specified generation settings (target / budget / duration)
  const [userTarget, setUserTarget] = useState<string>('');
  const [userBudget, setUserBudget] = useState<string>('');
  const [userDuration, setUserDuration] = useState<string>('');

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
        userTarget: userTarget || undefined,
        userBudget: userBudget || undefined,
        userDuration: userDuration || undefined,
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
        userTarget: userTarget || undefined,
        userBudget: userBudget || undefined,
        userDuration: userDuration || undefined,
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

      {/* Spot Header: Title & Spot Hero Image */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-neutral-100 pb-5 gap-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 relative">
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
                {displayAddr || '관광 기회 자원'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
              {displayOverview || '데이터 기반 관광상품 개발 가능성이 포착된 관광자원입니다.'}
            </p>
          </div>
        </div>
      </div>

      {/* [1. 이 관광자원이 정말 상품 기회일까?] */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-neutral-900 tracking-tight">
          이 관광자원이 정말 상품 기회일까?
        </h2>

        {/* 3대 핵심 근거 요약 박스 (방문 흐름, 주변 관광자원, 관광 집중도) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
            <p className="text-xs text-neutral-400 font-medium mb-1">방문 흐름</p>
            <p className="text-base font-extrabold text-green-600">
              {visitorData ? `↑ ${visitorData.areaNm} 월 ${Math.round(visitorData.totalVisitors / 10000)}만` : '↑ 지속 유입'}
            </p>
          </div>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
            <p className="text-xs text-neutral-400 font-medium mb-1">주변 관광자원</p>
            <p className="text-base font-extrabold text-neutral-900">
              {relatedSpots.length > 0 ? `${relatedSpots.length}곳 보유` : '연계 가능'}
            </p>
          </div>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
            <p className="text-xs text-neutral-400 font-medium mb-1">관광 집중도</p>
            <p className="text-base font-extrabold text-neutral-800">
              {activeTrend?.cnctrGrade ? (activeTrend.cnctrGrade === 'HIGH' ? '높음' : '낮음 (여유)') : '낮음 (상품화 적합)'}
            </p>
          </div>
        </div>

        {/* AI Insight Summary */}
        <div className="bg-neutral-900 rounded-2xl p-4 text-white shadow-sm space-y-1.5">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">AI 기회 검증 요약</span>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed font-medium">
            "{aiAnalysis ? aiAnalysis.summary : `${displayTitle}은(는) 유동 인구가 충분하고 주변 관광자원과 연결이 수월하지만, 아직 독립된 시그니처 관광상품 공급이 부족해 신규 기획 가치가 우수합니다.`}"
          </p>
        </div>
      </div>

      {/* YouTube Social Viral Context (대표 영상 3개 근거) */}
      {ytData && ytData.topVideos && ytData.topVideos.length > 0 && (
        <div className="bg-red-50/60 rounded-2xl p-4 border border-red-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-red-700 flex items-center gap-1.5">
              <span>▶</span> YouTube 바이럴 대표 콘텐츠 (실제 반응 근거)
            </span>
            <span className="text-[10px] text-red-500 font-bold bg-white px-2 py-0.5 rounded border border-red-200">
              Viral {ytData.viralLevel.toUpperCase()} (시간당 {ytData.avgViewsPerHour.toLocaleString()}회 시청)
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {ytData.topVideos.slice(0, 3).map((vid) => (
              <div key={vid.videoId} className="bg-white p-2.5 rounded-xl border border-red-100/80 flex items-center justify-between text-[11px]">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-bold text-neutral-900 truncate">{vid.title}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{vid.channelTitle} · {new Date(vid.publishedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-red-600">{(vid.viewCount / 10000).toFixed(1)}만회</span>
                  <span className="text-[9px] text-neutral-400 block">누적 조회</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* [2. AI 상품 아이디어 만들기] */}
      <div className="pt-2 border-t border-neutral-100 space-y-4">
        <div>
          <h2 className="text-sm font-black text-neutral-900 tracking-tight">
            AI 관광상품 아이디어
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            타깃·예산·기간을 먼저 정하면 AI가 그에 맞춰 3가지 상품 아이디어를 생성합니다.
          </p>
        </div>

        {/* ⑤ Generation settings — set BEFORE generating; applied to ideas AND detailed product */}
        <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-700">상품 설정</span>
            <span className="text-[9.5px] text-neutral-400">설정값을 AI 생성에 반영합니다</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[9.5px] font-bold text-neutral-500 block mb-1">타깃 고객</label>
              <select
                value={userTarget}
                onChange={(e) => setUserTarget(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-neutral-200 bg-white focus:border-neutral-900 outline-none"
              >
                <option value="">AI 추천</option>
                <option value="2030 커플">2030 커플</option>
                <option value="가족 단위">가족 단위</option>
                <option value="외국인 관광객">외국인 관광객</option>
                <option value="4050 부부">4050 부부</option>
                <option value="친구·우정 여행">친구·우정 여행</option>
                <option value="나홀로 여행">나홀로 여행</option>
                <option value="MZ 직장인">MZ 직장인</option>
                <option value="시니어 (5060)">시니어 (5060)</option>
              </select>
            </div>
            <div>
              <label className="text-[9.5px] font-bold text-neutral-500 block mb-1">1인 예산</label>
              <select
                value={userBudget}
                onChange={(e) => setUserBudget(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-neutral-200 bg-white focus:border-neutral-900 outline-none"
              >
                <option value="">제한 없음</option>
                <option value="3만원 이하">3만원 이하</option>
                <option value="5만원 내외">5만원 내외</option>
                <option value="10만원 내외">10만원 내외</option>
                <option value="15만원 이상">15만원 이상</option>
              </select>
            </div>
            <div>
              <label className="text-[9.5px] font-bold text-neutral-500 block mb-1">기간</label>
              <select
                value={userDuration}
                onChange={(e) => setUserDuration(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-neutral-200 bg-white focus:border-neutral-900 outline-none"
              >
                <option value="">AI 추천</option>
                <option value="반일 (3~4시간)">반일 (3~4시간)</option>
                <option value="당일 (1일)">당일 (1일)</option>
                <option value="1박 2일">1박 2일</option>
                <option value="2박 3일">2박 3일</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generate (or regenerate with current settings) */}
        <button
          onClick={handleGenerateIdeas}
          disabled={ideasLoading}
          className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all inline-flex items-center justify-center space-x-1.5 disabled:opacity-50"
        >
          {ideasLoading ? (
            <span>아이디어 기획 중...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{productIdeas.length > 0 ? '설정 반영해 다시 생성' : 'AI 상품 아이디어 만들기'}</span>
            </>
          )}
        </button>

        {/* Display 3 Product Ideas */}
        {productIdeas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {productIdeas.map((idea, idx) => {
              const isChosen = selectedIdea?.title === idea.title;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                    isChosen ? 'border-neutral-900 ring-2 ring-neutral-900 shadow-md bg-neutral-50/40' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
                        0{idx + 1}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium truncate max-w-[120px]">{idea.target}</span>
                    </div>

                    <h3 className="text-sm font-extrabold text-neutral-900 mb-1 leading-snug">{idea.title}</h3>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-3 line-clamp-2">{idea.oneLineConcept}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {idea.tags.map((tag) => (
                        <span key={tag} className="text-[9.5px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded font-medium">
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

        {/* Step 3 Result: Detailed Tour Product */}
        {detailedLoading && (
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 flex flex-col items-center justify-center space-y-2">
            <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-neutral-800">선택한 아이디어를 바탕으로 상세 관광상품 기획서를 작성하고 있습니다...</span>
          </div>
        )}

        {detailedProduct && (
          <div className="bg-white rounded-2xl p-5 border border-neutral-300 shadow-md space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                ✨ 상세 관광상품 기획서
              </span>
              <h3 className="text-base font-extrabold text-neutral-900 mt-1.5">{detailedProduct.productName}</h3>
              <p className="text-xs text-neutral-500">{detailedProduct.concept}</p>
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

      {/* [3. 분석 근거 자세히 보기 - Accordion] */}
      <div className="pt-2 border-t border-neutral-100">
        <button
          onClick={() => setIsDataExpanded(!isDataExpanded)}
          className="w-full bg-neutral-50 hover:bg-neutral-100 p-3.5 rounded-2xl border border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-800 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-neutral-600" />
            <span>분석 근거 자세히 보기 (TourAPI & 관광공사 상세 데이터)</span>
          </div>
          {isDataExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isDataExpanded && (
          <div className="mt-3 p-4 bg-white rounded-2xl border border-neutral-200 space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-neutral-900 mb-1">🎯 Opportunity Score 상세 점수</h4>
              <p className="text-neutral-500 text-[11px]">
                총점 {scoreResult.score}점 (완성도 {scoreResult.breakdown.dataCompleteness}점 / 상품성 {scoreResult.breakdown.productPotential}점 / 희소성 {scoreResult.breakdown.uniqueness}점 / 접근성 {scoreResult.breakdown.accessibility}점)
              </p>
            </div>

            {visitorData && (
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">📊 {visitorData.areaNm} 지역 유동인구 데이터</h4>
                <p className="text-neutral-500 text-[11px]">
                  월 유동인구 {visitorData.totalVisitors.toLocaleString()}명 (외지인 {visitorData.outsiderRatio}%, 외국인 {visitorData.foreignerRatio}%)
                </p>
              </div>
            )}

            {relatedSpots.length > 0 && (
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">🗺️ 연관 관광자원 ({relatedSpots.length}개)</h4>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {relatedSpots.slice(0, 6).map((spot) => (
                    <div key={spot.contentid} className="w-28 shrink-0 bg-neutral-50 p-2 rounded-xl border border-neutral-200 text-[10px]">
                      <p className="font-bold text-neutral-900 truncate">{spot.title}</p>
                      <p className="text-neutral-400 truncate">{spot.distanceText || '주변 장소'}</p>
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
