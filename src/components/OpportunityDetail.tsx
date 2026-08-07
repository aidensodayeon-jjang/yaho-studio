import { useEffect, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Check, Phone, Globe, Info, Sparkles, Target, Package, ThumbsUp, AlertTriangle, Lightbulb, MapPin, Map, Users, TrendingUp, UserCheck, Globe2 } from 'lucide-react';
import { EchoCard } from '../types';
import { useTourDetail } from '../hooks/useTourDetail';
import { useRelatedTourSpots } from '../hooks/useRelatedTourSpots';
import { useVisitorAnalytics } from '../hooks/useVisitorAnalytics';
import { useCentralTourSpots } from '../hooks/useCentralTourSpots';
import { useTourTrend } from '../hooks/useTourTrend';
import { tourSpotToEchoCard } from '../utils/tourSpotAdapter';
import { getTourFallbackImage } from '../utils/getTourFallbackImage';
import { calculateOpportunityScore } from '../utils/calculateOpportunityScore';
import { analyzeOpportunity, AIAnalysisResult } from '../ai/analyzeOpportunity';
import { generateTourProduct, TourProductResult } from '../ai/generateTourProduct';

// HTML 태그 제거용 순수 텍스트 정화 함수
function stripHtmlTags(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

// homepage HTML String에서 안전한 href 링크 및 텍스트 추출 함수
function extractHomepageUrl(html?: string): { url: string | null; label: string } {
  if (!html) return { url: null, label: '' };
  
  const hrefMatch = html.match(/href=["']([^"']+)["']/i);
  const textContent = stripHtmlTags(html);
  
  if (hrefMatch && hrefMatch[1]) {
    return {
      url: hrefMatch[1],
      label: textContent || hrefMatch[1],
    };
  }
  
  // href 속성이 없고 일반 URL 형태 텍스트만 존재하는 경우
  if (textContent.startsWith('http://') || textContent.startsWith('https://')) {
    return {
      url: textContent,
      label: textContent,
    };
  }

  return { url: null, label: textContent };
}

interface OpportunityDetailProps {
  selectedEcho: EchoCard | null;
  areaCode?: number;
  onSelectEcho?: (echo: EchoCard) => void;
}

export default function OpportunityDetail({ selectedEcho, areaCode = 1, onSelectEcho }: OpportunityDetailProps) {
  if (!selectedEcho) return null;

  // TourAPI 상세 조회 hook 호출
  const { data: detailData, loading: detailLoading, error: detailError } = useTourDetail(
    selectedEcho.contentid,
    selectedEcho.contenttypeid
  );

  const displayTitle = detailData?.title || selectedEcho.title;
  const displayAddr = detailData?.addr1 || selectedEcho.addr1 || '';

  // 한국관광공사 DataLab 빅데이터 지역 방문자 분석 API 호출 (areaCode 및 주소 기반)
  const currentAreaCode = areaCode || 1;
  const { visitorData, loading: visitorLoading, error: visitorError } = useVisitorAnalytics(currentAreaCode, displayAddr);

  // 한국관광공사 기초지자체 중심 관광지 API 호출 (LocgoHubTarService1)
  const {
    spots: centralSpots,
    loading: centralLoading,
    error: centralError,
    signguNm: centralSignguNm,
    isCurrentSpotCentral,
    currentSpotRank,
  } = useCentralTourSpots(currentAreaCode, displayAddr, displayTitle);

  // 한국관광공사 관광지 집중률 방문자 추이 예측 API 호출 (TatsCnctrRateService)
  const {
    trendData,
    loading: trendLoading,
    error: trendError,
    isEmpty: trendIsEmpty,
  } = useTourTrend(currentAreaCode, displayAddr, displayTitle);

  const activeTrend = trendData?.matchedSpotTrend || trendData?.topSpotTrend || null;

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // AI 관광상품 기획안 상태
  const [productResult, setProductResult] = useState<TourProductResult | null>(null);
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [activeProductContentId, setActiveProductContentId] = useState<string | null>(null);

  const tabs = ['기회 분석 요약', '방문자 분석', 'SNS 트렌드', '리뷰/평가', '경쟁 분석', '상품 아이디어', '예상 효과', '실행 가이드'];

  const displayTel = detailData?.tel ? stripHtmlTags(detailData.tel) : selectedEcho.tel;
  const displayOverview = detailData?.overview ? stripHtmlTags(detailData.overview) : selectedEcho.overview;
  const homepageInfo = extractHomepageUrl(detailData?.homepage || selectedEcho.homepage);
  const displayContentId = selectedEcho.contentid || detailData?.contentid;

  // 연관 관광지 조회 hook 호출 (위치기반/카테고리 기반 + 주소/키워드 파싱)
  const { spots: relatedSpots, loading: relatedLoading, error: relatedError } = useRelatedTourSpots(
    selectedEcho.contentid || detailData?.contentid,
    detailData?.mapx || selectedEcho.mapx,
    detailData?.mapy || selectedEcho.mapy,
    detailData?.contenttypeid || selectedEcho.contenttypeid,
    displayTitle,
    displayAddr
  );

  // 1. TourAPI의 firstimage가 있으면 우선 사용
  const rawImage = detailData?.firstimage || selectedEcho.image;
  const hasOriginalImage = Boolean(
    rawImage &&
    rawImage.trim() !== '' &&
    !rawImage.includes('/images/placeholders/') &&
    !rawImage.includes('/images/place/')
  );

  const fallbackResult = getTourFallbackImage(displayTitle, selectedEcho.contenttypeid);
  const displayImage = hasOriginalImage ? rawImage! : fallbackResult.image;
  const isPlaceholderImage = !hasOriginalImage;
  const imageSource: 'tourApi' | 'placeholder' = hasOriginalImage ? 'tourApi' : 'placeholder';

  // 2. Opportunity Score 계산 (지역 트렌드/집중률 가점 + 중심성 가점 + 빅데이터 반영)
  const scoreResult = calculateOpportunityScore({
    title: displayTitle,
    firstimage: displayImage,
    overview: displayOverview,
    tel: displayTel,
    homepage: homepageInfo.url || undefined,
    mapx: detailData?.mapx || selectedEcho.mapx,
    mapy: detailData?.mapy || selectedEcho.mapy,
    addr1: displayAddr,
    contenttypeid: detailData?.contenttypeid || selectedEcho.contenttypeid,
    hasOriginalImage: hasOriginalImage,
    imageSource: imageSource,
    visitorData: visitorData,
    isCurrentSpotCentral: isCurrentSpotCentral,
    currentSpotRank: currentSpotRank,
    trendDirection: activeTrend?.trendDirection,
    trendChangeRate: activeTrend?.changeRate,
  });

  // 3. AI Opportunity Analysis 호출 (Gemini & Rule-Based)
  useEffect(() => {
    let isMounted = true;
    setAiLoading(true);

    async function loadAIAnalysis() {
      try {
        const res = await analyzeOpportunity({
          contentid: displayContentId,
          title: displayTitle,
          overview: displayOverview,
          addr1: displayAddr,
          tel: displayTel,
          homepage: homepageInfo.url || undefined,
          contenttypeid: detailData?.contenttypeid || selectedEcho.contenttypeid,
          hasOriginalImage: hasOriginalImage,
          imageSource: imageSource,
          tags: selectedEcho.tags,
          score: scoreResult.score,
          scoreBreakdown: scoreResult.breakdown,
          areaName: visitorData?.areaNm || centralSignguNm || '해당 지역',
          categoryName: selectedEcho.tags?.[0] || '관광',
          visitorData: visitorData,
          centralTourSpots: centralSpots.map((s) => s.hubTatsNm),
          isCurrentSpotCentral: isCurrentSpotCentral,
          currentSpotRank: currentSpotRank,
          trendDirection: activeTrend?.trendDirection,
          trendChangeRate: activeTrend?.changeRate,
          avgRegionalRate: trendData?.avgRegionalRate,
          isSpotSpecificTrend: Boolean(trendData?.isSpotSpecific),
        });

        if (isMounted) {
          setAiAnalysis(res);
          setAiLoading(false);
        }
      } catch {
        if (isMounted) {
          setAiLoading(false);
        }
      }
    }

    loadAIAnalysis();

    return () => {
      isMounted = false;
    };
  }, [displayContentId, displayTitle, displayOverview, displayAddr, visitorData, isCurrentSpotCentral, currentSpotRank, centralSpots, activeTrend, trendData]);

  // 관광지가 변경될 때 이전 기획안 결과 리셋
  useEffect(() => {
    setProductResult(null);
    setProductLoading(false);
    setActiveProductContentId(null);
  }, [displayContentId]);

  // AI 관광상품 기획안 생성 버튼 클릭 핸들러 (requestId 기법 적용)
  const handleGenerateProduct = async () => {
    const targetId = displayContentId || displayTitle;
    setActiveProductContentId(targetId);
    setProductLoading(true);
    setProductResult(null);

    try {
      const res = await generateTourProduct({
        contentid: displayContentId,
        title: displayTitle,
        addr1: displayAddr,
        contenttypeid: detailData?.contenttypeid || selectedEcho.contenttypeid,
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
        hasOriginalImage: hasOriginalImage,
      });

      // 빠른 상태 변경에 따른 requestId 검증
      if (activeProductContentId === targetId || displayContentId === targetId) {
        setProductResult(res);
        setProductLoading(false);
      }
    } catch {
      setProductLoading(false);
    }
  };

  const levelBadgeStyle =
    scoreResult.level === 'HIGH'
      ? 'bg-neutral-900 text-white'
      : scoreResult.level === 'MEDIUM'
      ? 'bg-orange-500 text-white'
      : 'bg-neutral-200 text-neutral-800';

  const categoryTypeLabel = (typeId?: string) => {
    switch (typeId) {
      case '12': return '관광지';
      case '14': return '문화시설';
      case '15': return '축제/행사';
      case '25': return '여행코스';
      case '28': return '레포츠';
      case '32': return '숙박';
      case '38': return '쇼핑';
      case '39': return '음식점';
      default: return '관광자원';
    }
  };

  return (
    <div className="font-sans flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 mt-1">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          </div>
          <span className="text-xs font-medium text-neutral-600">선택된 Opportunity</span>
          <span className="text-[10px] font-bold px-1.5 rounded-sm bg-neutral-100 text-neutral-900 tracking-wider">01</span>
          <span className={`text-[10px] font-bold px-1.5 rounded-sm uppercase tracking-wider ${levelBadgeStyle}`}>
            {scoreResult.level}
          </span>
          <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
            Score: {scoreResult.score}점
          </span>
          
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight ml-2">{displayTitle}</h2>
          
          {displayAddr && (
            <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded font-medium">
              📍 {displayAddr}
            </span>
          )}
          
          {displayContentId && (
            <span className="text-[10px] text-neutral-400 font-mono">
              (ID: {displayContentId})
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <p className="text-xs text-neutral-500 max-w-[200px] truncate">
            AI가 회원님의 프로필(시장: 일본, 타겟: 20~30대 여성)에 가장 적합하다고 판단한 Opportunity입니다.
          </p>
          <button className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors">
            이 Opportunity로 프로젝트 시작하기
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
            <Bookmark className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-4">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              idx === 0 ? 'border-neutral-900 text-neutral-900 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="pb-6 space-y-6">
        {detailLoading ? (
          <div className="flex flex-col items-center justify-center h-48 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-500 text-xs">
            <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span>상세정보를 불러오는 중입니다...</span>
          </div>
        ) : detailError ? (
          <div className="flex flex-col items-center justify-center h-48 bg-red-50 rounded-xl border border-red-200 text-red-600 text-xs p-4">
            <Info className="w-5 h-5 mb-1 text-red-500" />
            <span className="font-bold mb-1">상세정보 조회 에러</span>
            <span className="text-red-500 text-center">{detailError}</span>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Column: Images & Flow */}
            <div className="col-span-4 flex flex-col gap-4">
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 relative">
                <img
                  src={displayImage}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.endsWith('/images/placeholders/default.jpg')) {
                      return;
                    }
                    target.src = '/images/placeholders/default.jpg';
                  }}
                />
                {isPlaceholderImage && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-medium px-2 py-0.5 rounded backdrop-blur-sm">
                    테마 이미지 ({fallbackResult.fallbackLabel})
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <button className="text-neutral-400 hover:text-neutral-900"><ChevronLeft className="w-4 h-4"/></button>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${i===1 ? 'border-neutral-900' : 'border-transparent'}`}>
                      <img
                        src={displayImage}
                        alt=""
                        className="w-full h-full object-cover opacity-80"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.endsWith('/images/placeholders/default.jpg')) {
                            return;
                          }
                          target.src = '/images/placeholders/default.jpg';
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button className="text-neutral-400 hover:text-neutral-900"><ChevronRight className="w-4 h-4"/></button>
              </div>

              {/* 추가 안내 및 상세 정보 */}
              <div className="bg-neutral-50 rounded-lg p-3 space-y-2 border border-neutral-200 text-xs">
                {displayTel && (
                  <div className="flex items-center text-[11px] text-neutral-700">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
                    <span>{displayTel}</span>
                  </div>
                )}
                {homepageInfo.label && (
                  <div className="flex items-center text-[11px] text-neutral-700">
                    <Globe className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
                    {homepageInfo.url ? (
                      <a
                        href={homepageInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {homepageInfo.label}
                      </a>
                    ) : (
                      <span className="truncate">{homepageInfo.label}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2">
                <h4 className="text-xs font-bold text-neutral-900 mb-3">패키지 구성 (추천 코스)</h4>
                <div className="flex items-center justify-between">
                  {(selectedEcho.packageSteps || ['기본 투어\n코스', '주요 스팟\n체험', '휴식 및\n자유시간', '로컬 맛집\n방문']).map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center mb-1 bg-white">
                         <span className="text-[10px]">📍</span>
                      </div>
                      <span className="text-[9px] text-center text-neutral-600 whitespace-pre-line leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Column: Why, Data, Ideas */}
            <div className="col-span-4 flex flex-col gap-4">
              {displayOverview && (
                <div>
                  <h4 className="text-[11px] font-bold text-neutral-900 mb-1.5">관광지 개요 (Overview)</h4>
                  <p className="text-[10px] text-neutral-600 leading-relaxed bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 max-h-36 overflow-y-auto no-scrollbar">
                    {displayOverview}
                  </p>
                </div>
              )}

              {/* Opportunity Score 분석 근거 및 관광지 자체 점수 + 지역 빅데이터 가점 Breakdown */}
              <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-neutral-900 flex items-center">
                    🎯 Opportunity Score 분석 ({scoreResult.score}점 / {scoreResult.level})
                  </h4>
                </div>

                {/* 관광지 자체 점수 vs 빅데이터/트렌드 가점 총점 공식 */}
                <div className="bg-white p-2.5 rounded-lg border border-neutral-200 text-[10px] space-y-1">
                  <div className="flex items-center justify-between font-bold text-neutral-800">
                    <span>• 관광지 자체 기본 점수</span>
                    <span>{scoreResult.breakdown.dataCompleteness + scoreResult.breakdown.productPotential + scoreResult.breakdown.uniqueness + scoreResult.breakdown.accessibility}점</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 font-bold">
                    <span>• 지역 방문자 유동인구 가점</span>
                    <span>+{scoreResult.breakdown.visitorScoreBonus || 0}점</span>
                  </div>
                  <div className="flex items-center justify-between text-blue-700 font-bold">
                    <span>• 지역 중심 관광지 가점</span>
                    <span>+{scoreResult.breakdown.centralTourBonus || 0}점</span>
                  </div>
                  <div className="flex items-center justify-between text-indigo-700 font-bold">
                    <span>• 관광 트렌드/집중률 가점</span>
                    <span>+{scoreResult.breakdown.trendBonus || 0}점</span>
                  </div>
                  <div className="border-t border-dashed border-neutral-200 pt-1.5 flex items-center justify-between font-extrabold text-neutral-900 text-xs">
                    <span>= 최종 Opportunity Score</span>
                    <span className="text-neutral-900 font-mono text-sm">{scoreResult.score}점</span>
                  </div>
                </div>

                {/* 4대 영역 Breakdown Grid */}
                <div className="space-y-1.5">
                  <p className="text-[9.5px] font-bold text-neutral-600">관광지 자체 기본 점수 (최대 100점 항목)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded border border-neutral-200 flex flex-col">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-neutral-500 font-medium">데이터 완성도</span>
                        <span className="font-bold text-neutral-900">{scoreResult.breakdown.dataCompleteness} / 25점</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(scoreResult.breakdown.dataCompleteness / 25) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded border border-neutral-200 flex flex-col">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-neutral-500 font-medium">상품화 가능성</span>
                        <span className="font-bold text-neutral-900">{scoreResult.breakdown.productPotential} / 30점</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(scoreResult.breakdown.productPotential / 30) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded border border-neutral-200 flex flex-col">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-neutral-500 font-medium">희소성·차별성</span>
                        <span className="font-bold text-neutral-900">{scoreResult.breakdown.uniqueness} / 25점</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(scoreResult.breakdown.uniqueness / 25) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded border border-neutral-200 flex flex-col">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-neutral-500 font-medium">접근성·연계성</span>
                        <span className="font-bold text-neutral-900">{scoreResult.breakdown.accessibility} / 20점</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(scoreResult.breakdown.accessibility / 20) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 지역 빅데이터 가점 Breakdown */}
                <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-emerald-900">
                    <span>지역 빅데이터 가점 세부 내역</span>
                    <span>총 가점 +{scoreResult.breakdown.visitorScoreBonus || 0}점</span>
                  </div>
                  <div className="text-[9px] text-emerald-800 space-y-0.5 pt-0.5">
                    <div className="flex justify-between">
                      <span>• 지역 방문 규모 (유동인구)</span>
                      <span>{visitorData && visitorData.totalVisitors >= 10000000 ? '+5점 (월 1천만↑)' : visitorData && visitorData.totalVisitors >= 5000000 ? '+3점 (월 500만↑)' : '+0점'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 외지인 비율</span>
                      <span>{visitorData && visitorData.outsiderRatio >= 25 ? '+5점 (25%↑)' : visitorData && visitorData.outsiderRatio >= 20 ? '+3점 (20%↑)' : '+0점'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 외국인 비율</span>
                      <span>{visitorData && visitorData.foreignerRatio >= 1.5 ? '+5점 (1.5%↑)' : visitorData && visitorData.foreignerRatio >= 1.0 ? '+3점 (1.0%↑)' : '+0점'}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-2">
                  <p className="text-[10px] font-bold text-neutral-800 mb-1">주요 분석 리포트</p>
                  <ul className="space-y-1">
                    {scoreResult.reasons.map((reason, idx) => (
                      <li key={idx} className="text-[10px] text-neutral-700 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mr-2 shrink-0"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 한국관광공사 DataLab 지역별 방문자 분석 Card */}
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-neutral-900" />
                    <h4 className="text-xs font-bold text-neutral-900">
                      {visitorData ? `${visitorData.areaNm} 행정구역 전체 방문자 분석` : '지역 방문자 분석'}
                    </h4>
                    <span className="text-[9px] bg-neutral-900 text-white px-1.5 py-0.5 rounded font-medium">한국관광 데이터랩</span>
                  </div>
                  {visitorData && (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      기준: {visitorData.baseYm}
                    </span>
                  )}
                </div>

                {visitorLoading ? (
                  /* Skeleton UI */
                  <div className="animate-pulse space-y-2 py-1">
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-12 bg-neutral-200 rounded"></div>
                      <div className="h-12 bg-neutral-200 rounded"></div>
                      <div className="h-12 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                ) : visitorError ? (
                  /* API Error Message */
                  <div className="flex items-center justify-center py-4 text-xs text-neutral-500 bg-white rounded-lg border border-neutral-200">
                    <Info className="w-4 h-4 text-neutral-400 mr-1.5" />
                    <span>방문자 데이터를 불러올 수 없습니다.</span>
                  </div>
                ) : visitorData ? (
                  /* Actual Data Card */
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-neutral-700">
                      📍 <span className="font-bold text-neutral-900">{visitorData.areaNm}</span> 지역 전체 유동인구{' '}
                      <span className="font-extrabold text-neutral-900">{visitorData.totalVisitors.toLocaleString()}명</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded-lg border border-neutral-200 flex flex-col items-center">
                        <span className="text-[9px] text-neutral-500 mb-0.5 flex items-center gap-0.5">
                          <Users className="w-3 h-3 text-blue-500" /> 지역 전체 유동인구
                        </span>
                        <span className="text-xs font-extrabold text-neutral-900">
                          {visitorData.totalVisitors >= 10000
                            ? `${(visitorData.totalVisitors / 10000).toFixed(1)}만`
                            : visitorData.totalVisitors.toLocaleString()}명
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-neutral-200 flex flex-col items-center">
                        <span className="text-[9px] text-neutral-500 mb-0.5 flex items-center gap-0.5">
                          <Globe2 className="w-3 h-3 text-purple-500" /> 외국인 비율
                        </span>
                        <span className="text-xs font-extrabold text-purple-700">
                          {visitorData.foreignerVisitors >= 10000
                            ? `${(visitorData.foreignerVisitors / 10000).toFixed(1)}만`
                            : visitorData.foreignerVisitors.toLocaleString()}명
                        </span>
                        <span className="text-[8px] text-neutral-400 mt-0.5">({visitorData.foreignerRatio}%)</span>
                      </div>
                    </div>
                    {/* 오해 방지 안내 문구 */}
                    <p className="text-[9.5px] text-neutral-500 bg-white p-1.5 rounded border border-neutral-200 leading-tight">
                      ℹ️ 선택한 관광지 단독 방문자 수가 아니라, 해당 관광지가 위치한 <span className="font-bold text-neutral-700">{visitorData.areaNm} 행정구역 전체</span>의 방문 통계입니다.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* 한국관광공사 DataLab 기초지자체 중심 관광지 Card (LocgoHubTarService1) */}
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-neutral-900" />
                    <h4 className="text-xs font-bold text-neutral-900">
                      {centralSignguNm} 지역 중심 관광지
                    </h4>
                    <span className="text-[9px] bg-neutral-900 text-white px-1.5 py-0.5 rounded font-medium">티맵 모빌리티 빅데이터</span>
                  </div>
                  {centralSpots.length > 0 && (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      기준: {centralSpots[0].baseYm}
                    </span>
                  )}
                </div>

                {/* 선택 관광지 비교 배너 */}
                <div className={`p-2.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
                  isCurrentSpotCentral
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}>
                  <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrentSpotCentral ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div>
                    {isCurrentSpotCentral ? (
                      <p className="font-bold">
                        이 관광지는 <span className="underline decoration-2 font-extrabold">{centralSignguNm}</span>의 중심 관광지 목록({currentSpotRank ? `${currentSpotRank}위` : '포함'})에 해당합니다.
                      </p>
                    ) : (
                      <p className="font-medium">
                        현재 지역의 대표 중심 관광지는 아니지만, 새로운 관광상품 후보로 분석할 수 있습니다.
                      </p>
                    )}
                  </div>
                </div>

                {centralLoading ? (
                  <div className="animate-pulse space-y-2 py-1">
                    <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                    <div className="space-y-1.5">
                      <div className="h-8 bg-neutral-200 rounded"></div>
                      <div className="h-8 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                ) : centralError ? (
                  <div className="flex items-center justify-center py-3 text-xs text-neutral-500 bg-white rounded-lg border border-neutral-200">
                    <Info className="w-4 h-4 text-neutral-400 mr-1.5" />
                    <span>지역 중심 관광지 데이터를 불러올 수 없습니다.</span>
                  </div>
                ) : centralSpots.length === 0 ? (
                  <div className="flex items-center justify-center py-3 text-xs text-neutral-500 bg-white rounded-lg border border-neutral-200">
                    <Info className="w-4 h-4 text-neutral-400 mr-1.5" />
                    <span>이 지역의 중심 관광지 정보가 제공되지 않습니다.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-neutral-500 font-medium">
                      {centralSignguNm} 상위 앵커 관광지 (최대 5개)
                    </p>
                    <div className="space-y-1 bg-white p-2 rounded-lg border border-neutral-200 max-h-48 overflow-y-auto no-scrollbar">
                      {centralSpots.slice(0, 5).map((spot) => (
                        <div
                          key={spot.hubTatsCd || spot.hubRank}
                          className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-neutral-50 text-[10.5px]"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-extrabold flex items-center justify-center shrink-0">
                              {spot.hubRank}
                            </span>
                            <span className="font-bold text-neutral-900 truncate">{spot.hubTatsNm}</span>
                            <span className="text-[9px] text-neutral-400 bg-neutral-100 px-1 rounded shrink-0">
                              {spot.hubCtgryMclsNm || spot.hubCtgryLclsNm}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-neutral-500 font-mono shrink-0 ml-1">
                            {spot.signguNm}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 한국관광공사 DataLab 관광지 집중률 방문자 추이 예측 Card (TatsCnctrRateService) */}
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4 text-neutral-900" />
                    <h4 className="text-xs font-bold text-neutral-900">
                      관광 트렌드 및 방문 추이 예측
                    </h4>
                    <span className="text-[9px] bg-neutral-900 text-white px-1.5 py-0.5 rounded font-medium">KT 빅데이터 AI 예측</span>
                  </div>
                  {activeTrend && (
                    <span className="text-[9px] text-neutral-500 font-mono">
                      {activeTrend.forecastPeriod}
                    </span>
                  )}
                </div>

                {trendLoading ? (
                  <div className="animate-pulse space-y-2 py-1">
                    <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-10 bg-neutral-200 rounded"></div>
                      <div className="h-10 bg-neutral-200 rounded"></div>
                      <div className="h-10 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                ) : trendError ? (
                  <div className="flex items-center justify-center py-3 text-xs text-neutral-500 bg-white rounded-lg border border-neutral-200">
                    <Info className="w-4 h-4 text-neutral-400 mr-1.5" />
                    <span>관광 트렌드 데이터를 불러올 수 없습니다.</span>
                  </div>
                ) : trendIsEmpty || !activeTrend ? (
                  <div className="flex items-center justify-center py-3 text-xs text-neutral-500 bg-white rounded-lg border border-neutral-200">
                    <Info className="w-4 h-4 text-neutral-400 mr-1.5" />
                    <span>이 관광지 또는 지역의 관광 트렌드 정보가 제공되지 않습니다.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* 데이터 단위 안내 */}
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-bold text-neutral-900">
                        {trendData?.isSpotSpecific ? `🎯 [${activeTrend.spotName}] 핀포인트 추이` : `📍 [${centralSignguNm}] 지역 전체 관광 트렌드`}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        activeTrend.trendDirection === 'RISING'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : activeTrend.trendDirection === 'FALLING'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {activeTrend.trendDirection === 'RISING' ? '📈 상승 추세' : activeTrend.trendDirection === 'FALLING' ? '📉 하락 추세' : '➡️ 안정 추세'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded-lg border border-neutral-200 flex flex-col items-center">
                        <span className="text-[9px] text-neutral-500 mb-0.5">현재 집중률</span>
                        <span className="text-xs font-extrabold text-neutral-900">{activeTrend.currentRate}</span>
                        <span className="text-[8px] text-neutral-400 mt-0.5"> (상대 지수)</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-neutral-200 flex flex-col items-center">
                        <span className="text-[9px] text-neutral-500 mb-0.5">30일후 예측 집중률</span>
                        <span className="text-xs font-extrabold text-neutral-900">{activeTrend.predictedRate}</span>
                        <span className={`text-[8px] font-bold mt-0.5 ${activeTrend.changeRate >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                          ({activeTrend.changeRate >= 0 ? '+' : ''}{activeTrend.changeRate}%)
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-neutral-200 flex flex-col items-center">
                        <span className="text-[9px] text-neutral-500 mb-0.5">집중도 등급</span>
                        <span className={`text-xs font-extrabold ${activeTrend.cnctrGrade === 'HIGH' ? 'text-rose-600' : activeTrend.cnctrGrade === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'}`}>
                          {activeTrend.cnctrGrade === 'HIGH' ? '혼잡' : activeTrend.cnctrGrade === 'MEDIUM' ? '보통' : '여유'}
                        </span>
                        <span className="text-[8px] text-neutral-400 mt-0.5">(평균 {activeTrend.avgRate})</span>
                      </div>
                    </div>

                    {/* 지역 단위 안내 문구 (단독 매칭이 아닐 때) */}
                    {!trendData?.isSpotSpecific && (
                      <p className="text-[9.5px] text-neutral-500 bg-white p-1.5 rounded border border-neutral-200 leading-tight">
                        ℹ️ 이 데이터는 선택 관광지 단독이 아니라 해당 <span className="font-bold text-neutral-700">{centralSignguNm} 지역 전체</span>의 관광 추세 예측 데이터입니다.
                      </p>
                    )}
                  </div>
                )}
              </div>




              <div>
                <h4 className="text-[11px] font-bold text-neutral-900 mb-2">왜 지금 기회인가?</h4>
                <ul className="space-y-1.5">
                  {selectedEcho.reasonDetails.slice(0,4).map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-[10px] text-neutral-700">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-neutral-50 rounded-lg p-3">
                <h4 className="text-[10px] font-bold text-neutral-900 mb-1">핵심 인사이트</h4>
                <p className="text-[10px] text-neutral-600 leading-relaxed">
                  {selectedEcho.subtitle || '데이터 분석 결과 가장 매력적인 기회입니다.'}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
                  데이터 요약 <span className="text-[9px] font-normal text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">데모 예시 지표</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[9px] text-neutral-500 mb-1 flex items-center gap-1">SNS 언급량 추이 <span className="text-[7px] text-neutral-400">예시</span></p>
                    <p className="text-sm font-bold text-green-600 mb-1">+{selectedEcho.searchVolumeChange}%</p>
                    <div className="w-full h-6 bg-neutral-100 rounded relative overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                        <path d="M0,25 Q25,20 50,10 T100,5" fill="none" stroke="#16a34a" strokeWidth="2" />
                        <circle cx="100" cy="5" r="2" fill="#16a34a" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-neutral-500 mb-1 flex items-center gap-1">외국인 비율 <span className="text-[7px] text-neutral-400">예시</span></p>
                    <p className="text-sm font-bold text-green-600 mb-1">{selectedEcho.postsChange}%</p>
                    <div className="w-full flex justify-center mt-1">
                      <div className="w-8 h-8 rounded-full border-[3px] border-neutral-200 border-r-green-500 border-t-green-500 transform rotate-45"></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-neutral-500 mb-1 flex items-center gap-1">평균 체류시간 <span className="text-[7px] text-neutral-400">예시</span></p>
                    <p className="text-sm font-bold text-green-600 mb-1">{selectedEcho.stayTimeMinutes || 41}<span className="text-[9px] text-neutral-500 ml-0.5">분</span></p>
                    <div className="flex items-end h-6 gap-1 mt-1 justify-center">
                      <div className="w-2.5 h-3 bg-neutral-200 rounded-t"></div>
                      <div className="w-2.5 h-6 bg-green-500 rounded-t"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-neutral-900 mb-2">추천 상품 아이디어</h4>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {(selectedEcho.thumbnails || ['투어 패키지', '로컬 체험', '가이드 투어']).map((idea, idx) => {
                    const imgUrl = selectedEcho.thumbnailImages?.[idx];
                    return (
                      <div key={idea} className="flex flex-col gap-1 shrink-0 w-[60px]">
                        {imgUrl ? (
                          <div className="w-full h-[45px] rounded-md overflow-hidden bg-neutral-100 border border-neutral-200">
                            <img src={imgUrl} alt={idea} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-[45px] rounded-md bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                            <span className="text-[10px] text-neutral-300">🏞️</span>
                          </div>
                        )}
                        <span className="text-[9px] text-neutral-700 text-center font-medium truncate">
                          {idea}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Visit, Keyword, Consumer */}
            <div className="col-span-4 flex flex-col gap-4 pl-4 border-l border-neutral-100">
              <div>
                <h4 className="text-[11px] font-bold text-neutral-900 mb-2">방문 & 체류분석</h4>
                <div className="flex items-end gap-3 mb-3">
                  <div>
                    <p className="text-[9px] text-neutral-500 mb-0.5">평균 체류시간</p>
                    <p className="text-base font-bold text-green-600">{selectedEcho.stayTimeMinutes || 41}<span className="text-[10px] text-neutral-500 ml-0.5">분</span></p>
                  </div>
                  <div className="pb-1 text-[9px] text-neutral-400">
                    vs 지역 평균 2.2시간
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(selectedEcho.thumbnails || ['명소1', '명소2', '명소3']).map((name, i) => (
                    <div key={name} className="flex items-center text-[9px]">
                      <span className="w-12 text-neutral-600 shrink-0 truncate">{name}</span>
                      <div className="flex-1 h-1 bg-neutral-100 rounded-full mx-2 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${100 - i * 15}%` }}></div>
                      </div>
                      <span className="w-8 text-right text-neutral-500 shrink-0">{40 - i*5}분</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-neutral-900 mb-2">연관 키워드 TOP 5</h4>
                <div className="space-y-1.5">
                  {(selectedEcho.keywords || ['키워드1', '키워드2', '키워드3', '키워드4', '키워드5']).slice(0,5).map((kw, i) => (
                    <div key={kw} className="flex items-center text-[9px]">
                      <span className="w-12 text-neutral-600 shrink-0 truncate">{kw}</span>
                      <div className="flex-1 h-1 bg-neutral-100 rounded-full mx-2 overflow-hidden">
                        <div className="h-full bg-neutral-800 rounded-full" style={{ width: `${89 - i * 12}%` }}></div>
                      </div>
                      <span className="w-6 text-right text-neutral-500 shrink-0">{89 - i * 12}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-neutral-900 mb-2">소비 & 만족 포인트</h4>
                <ul className="space-y-1 mb-3">
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-neutral-700">사진 명소가 많아 인생샷 명소로 인기</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-neutral-700">웰니스 & 힐링 니즈 충족</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-neutral-700">체류시간 증가로 추가 소비 유도</span>
                  </li>
                </ul>
                
                <button className="text-[9px] font-medium text-neutral-900 flex items-center hover:underline w-full justify-center py-1.5 border border-neutral-200 rounded-md">
                  전체 리포트 보기 <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* AI Opportunity Analysis Section */}
        {aiLoading ? (
          <div className="mt-6 bg-neutral-900 rounded-xl p-6 text-white shadow-md border border-neutral-700 font-sans flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-300">AI가 관광상품 기회를 분석하고 있습니다...</span>
            </div>
            <p className="text-[10px] text-neutral-400">TourAPI 자원 데이터 기반 Gemini AI 진단 중</p>
          </div>
        ) : aiAnalysis ? (
          <div className="mt-6 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 rounded-xl p-4 text-white shadow-md border border-neutral-700 font-sans">
            <div className="flex items-center justify-between mb-3 border-b border-neutral-700 pb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold tracking-tight text-white uppercase">AI Opportunity Analysis</h3>
              </div>
              <div className="flex items-center space-x-2">
                {aiAnalysis.engineType === 'gemini' ? (
                  <span className="text-[9px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1">
                    <span>✨ Gemini AI 분석</span>
                    {typeof aiAnalysis.confidence === 'number' && (
                      <span className="text-[8px] bg-black/30 px-1.5 py-0.2 rounded text-purple-200">
                        {aiAnalysis.confidence}%
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-[9px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full font-medium">
                    규칙 기반 분석
                  </span>
                )}
              </div>
            </div>

            {/* AI 요약 */}
            <div className="bg-neutral-800/80 rounded-lg p-3 mb-3 border border-neutral-700/60">
              <p className="text-[11px] text-neutral-200 leading-relaxed font-medium">
                💡 <span className="font-bold text-white">AI 요약:</span> {aiAnalysis.summary}
              </p>
            </div>

            {/* 강점 / 약점 / 기회 3컬럼 Grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* 강점 */}
              <div className="bg-neutral-800/50 rounded-lg p-2.5 border border-neutral-700">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <ThumbsUp className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] font-bold text-green-400">강점 (Strengths)</span>
                </div>
                <ul className="space-y-1">
                  {aiAnalysis.strengths.map((s, idx) => (
                    <li key={idx} className="text-[9px] text-neutral-300 leading-tight flex items-start">
                      <span className="mr-1 text-green-400">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 약점 */}
              <div className="bg-neutral-800/50 rounded-lg p-2.5 border border-neutral-700">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400">약점 (Weaknesses)</span>
                </div>
                <ul className="space-y-1">
                  {aiAnalysis.weaknesses.map((w, idx) => (
                    <li key={idx} className="text-[9px] text-neutral-300 leading-tight flex items-start">
                      <span className="mr-1 text-amber-400">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 기회 */}
              <div className="bg-neutral-800/50 rounded-lg p-2.5 border border-neutral-700">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <Lightbulb className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-400">기회 (Opportunities)</span>
                </div>
                <ul className="space-y-1">
                  {aiAnalysis.opportunities.map((o, idx) => (
                    <li key={idx} className="text-[9px] text-neutral-300 leading-tight flex items-start">
                      <span className="mr-1 text-blue-400">•</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 추천 상품 & 추천 타깃 */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-neutral-700/60 mb-3">
              <div className="flex items-center space-x-2 bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                <Package className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[8px] text-neutral-400 font-medium uppercase">추천 상품</p>
                  <p className="text-[10px] font-bold text-purple-300 truncate">{aiAnalysis.recommendedProduct}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                <Target className="w-4 h-4 text-pink-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[8px] text-neutral-400 font-medium uppercase">추천 타깃</p>
                  <p className="text-[10px] font-bold text-pink-300 truncate">{aiAnalysis.recommendedTarget}</p>
                </div>
              </div>
            </div>

            {/* AI 관광상품 기획 생성 트리거 버튼 */}
            {!productResult && !productLoading && (
              <div className="pt-2 border-t border-neutral-700/50 flex justify-end">
                <button
                  onClick={handleGenerateProduct}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md flex items-center space-x-1.5 transition-all transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>✨ AI 관광상품 기획안 생성하기</span>
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* AI 관광상품 기획안 생성 로딩 UI */}
        {productLoading && (
          <div className="mt-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 rounded-xl p-6 text-white shadow-lg border border-amber-500/40 flex flex-col items-center justify-center space-y-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-sm font-bold text-amber-300">AI가 관광상품 기획안을 생성하고 있습니다...</span>
            </div>
            <p className="text-xs text-neutral-400">TourAPI 연관 관광지 및 빅데이터 기반 코스 설계 중</p>
          </div>
        )}

        {/* AI 관광상품 기획안 결과 UI Card */}
        {productResult && (
          <div className="mt-4 bg-white rounded-xl p-5 border border-neutral-300 shadow-md font-sans space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                  ✨
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 leading-tight">{productResult.productName}</h3>
                  <p className="text-xs text-neutral-500">{productResult.oneLineIntro}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {productResult.generatedBy === 'gemini' ? (
                  <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full font-bold">
                    ✨ Gemini AI 기획
                  </span>
                ) : (
                  <span className="text-[10px] bg-neutral-100 text-neutral-800 border border-neutral-300 px-2 py-0.5 rounded-full font-medium">
                    ⚙️ 규칙 기반 기획
                  </span>
                )}
              </div>
            </div>

            {/* 상품 정보 메타 데이터 Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <p className="text-[9px] text-neutral-400 font-medium">추천 타깃</p>
                <p className="text-xs font-bold text-neutral-800 truncate">{productResult.targetCustomer}</p>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <p className="text-[9px] text-neutral-400 font-medium">예상 소요시간</p>
                <p className="text-xs font-bold text-neutral-800 truncate">{productResult.duration}</p>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <p className="text-[9px] text-neutral-400 font-medium">추천 계절</p>
                <p className="text-xs font-bold text-neutral-800 truncate">{productResult.recommendedSeason}</p>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <p className="text-[9px] text-neutral-400 font-medium">권장 가격대</p>
                <p className="text-xs font-bold text-emerald-700 truncate">{productResult.priceGuide}</p>
              </div>
            </div>

            {/* 추천 코스 (실제 TourAPI 연관 관광지만 활용) */}
            <div className="bg-neutral-50 rounded-lg p-3.5 border border-neutral-200 space-y-2">
              <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                🗺️ 추천 투어 코스 <span className="text-[9.5px] font-normal text-neutral-500">(실제 TourAPI 연관 관광지 기반)</span>
              </h4>
              <div className="space-y-2">
                {productResult.course.map((step) => (
                  <div key={step.order} className="bg-white p-2.5 rounded-lg border border-neutral-200 flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      {step.order}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-neutral-900">{step.placeName}</h5>
                      <p className="text-[11px] text-neutral-600 leading-snug mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 핵심 체험 & 마케팅 포인트 & SNS 홍보 문구 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-1.5">
                <h4 className="text-xs font-bold text-neutral-900">✨ 핵심 체험</h4>
                <ul className="space-y-1">
                  {productResult.keyExperience.map((exp, idx) => (
                    <li key={idx} className="text-[11px] text-neutral-700 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 shrink-0"></span>
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-1.5">
                <h4 className="text-xs font-bold text-neutral-900">🎯 마케팅 셀링 포인트</h4>
                <ul className="space-y-1">
                  {productResult.marketingPoints.map((mp, idx) => (
                    <li key={idx} className="text-[11px] text-neutral-700 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2 shrink-0"></span>
                      <span>{mp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SNS 홍보 문구 & 해시태그 */}
            <div className="bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-200/80 space-y-2">
              <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                📱 SNS 홍보 카피 & 해시태그
              </h4>
              <p className="text-xs text-indigo-900 font-medium bg-white p-2 rounded border border-indigo-200 leading-relaxed">
                {productResult.snsCopy}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {productResult.hashtags.map((tag) => (
                  <span key={tag} className="text-[10px] text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 운영 방식 및 주의사항 */}
            <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 space-y-2 text-xs">
              <h4 className="font-bold text-neutral-900">⚙️ 운영 방식 & 주의사항</h4>
              <p className="text-neutral-700 text-[11px] leading-relaxed mb-2">{productResult.operationPlan}</p>
              <ul className="space-y-1 border-t border-neutral-200 pt-2">
                {productResult.cautions.map((c, idx) => (
                  <li key={idx} className="text-[10px] text-neutral-500 flex items-center">
                    <span className="mr-1.5">⚠️</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 데이터 신뢰성 안내 */}
            <div className="bg-neutral-100 p-2.5 rounded-lg border border-neutral-200 text-center">
              <p className="text-[10px] text-neutral-500 leading-tight">
                ℹ️ 본 기획안은 한국관광공사 OpenAPI 데이터와 YAHO Opportunity 분석을 기반으로 생성된 초안입니다. 운영 전 현장 확인과 가격 검토가 필요합니다.
              </p>
            </div>
          </div>
        )}


        {/* Related Tour Spots Section (연관 관광지) */}
        <div className="mt-6 pt-4 border-t border-neutral-200 font-sans">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Map className="w-4 h-4 text-neutral-900" />
              <h3 className="text-xs font-bold text-neutral-900 tracking-tight">연관 관광지 (주변 명소 코스)</h3>
              <span className="text-[10px] text-neutral-500 font-normal">반경 5km 내 연계 추천</span>
            </div>
            {relatedSpots.length > 0 && (
              <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                총 {relatedSpots.length}개 발견
              </span>
            )}
          </div>

          {relatedLoading ? (
            /* Skeleton Loading */
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-neutral-100 rounded-xl p-2 animate-pulse space-y-2 border border-neutral-200">
                  <div className="w-full aspect-square bg-neutral-200 rounded-lg"></div>
                  <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-2 bg-neutral-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : relatedError || relatedSpots.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-center text-xs text-neutral-500 font-medium">
              📍 연관 관광지 정보가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {relatedSpots.map((spot, idx) => {
                const echoCard = tourSpotToEchoCard(
                  {
                    contentid: spot.contentid,
                    title: spot.title,
                    addr1: spot.addr1 || '',
                    firstimage: spot.firstimage,
                    mapx: spot.mapx,
                    mapy: spot.mapy,
                    contenttypeid: spot.contenttypeid,
                  },
                  idx
                );

                return (
                  <div
                    key={spot.contentid}
                    onClick={() => {
                      if (onSelectEcho) {
                        onSelectEcho(echoCard);
                      }
                    }}
                    className="group bg-white rounded-xl border border-neutral-200 p-2 shadow-sm hover:border-neutral-900 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Area */}
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-2 bg-neutral-100 border border-neutral-100">
                        <img
                          src={echoCard.image}
                          alt={spot.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.endsWith('/images/placeholders/default.jpg')) {
                              return;
                            }
                            target.src = '/images/placeholders/default.jpg';
                          }}
                        />
                        {spot.distanceText && (
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                            {spot.distanceText}
                          </span>
                        )}
                        <span className="absolute top-1 left-1 bg-neutral-900/80 text-white text-[7px] font-bold px-1 py-0.5 rounded">
                          {categoryTypeLabel(spot.contenttypeid)}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-[11px] font-bold text-neutral-900 truncate tracking-tight mb-0.5 group-hover:text-blue-600 transition-colors">
                        {spot.title}
                      </h4>
                    </div>

                    {/* Address / Distance */}
                    <div className="flex items-center text-[9px] text-neutral-500 mt-1 truncate">
                      <MapPin className="w-2.5 h-2.5 mr-0.5 shrink-0 text-neutral-400" />
                      <span className="truncate">{spot.addr1 || '위치 정보 없음'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
