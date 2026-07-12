import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Sparkles, DollarSign, Users, Compass, CheckCircle2, ArrowRight } from 'lucide-react';
import { EchoCard, Project } from '../types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  echo: EchoCard | null;
  customTitle?: string;
  onSaveProject: (project: Project) => void;
}

export default function CreateProductModal({
  isOpen,
  onClose,
  echo,
  customTitle,
  onSaveProject
}: CreateProductModalProps) {
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

  useEffect(() => {
    if (echo) {
      setTitle(customTitle || `${echo.title} ${duration} 시그니처 힐링 패키지`);
    }
  }, [echo, customTitle, isOpen]);

  if (!isOpen || !echo) return null;

  const totalCost = stayCost + activityCost + foodCost;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        title: title,
        status: '기획 중',
        progress: 80, // initial drafting progress
        image: echo.image
      };
      onSaveProject(newProject);
      setIsSaving(false);
      setIsSaved(true);

      // Auto close after 1.5 seconds
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1500);
    }, 1000);
  };

  // Mock days program based on echo context
  const getItinerary = () => {
    if (echo.genreId === 'kpop') {
      return [
        {
          day: 'Day 1: 스타트 & 성지 투어',
          spots: ['K-POP 뮤비 촬영지 도보 투어', '인생샷 스팟 코칭', '현지 감성 한옥 디너'],
          desc: '현지 도착 후 에코에서 가장 화제가 된 뮤직비디오 배경지에서 전문 포토그래퍼 가이드와 스냅 촬영 진행.'
        },
        {
          day: 'Day 2: 하이라이트 팬덤 액티비티',
          spots: ['프라이빗 선상 요트 라이브', '콜라보 한정판 팝업스토어', '팬 연계 커뮤니티 파티'],
          desc: '이틀 차에는 인스타그램과 유튜브 버즈를 견인한 메인 테마 투어 진행. 단독 요트 대여로 프라이빗 뷰 선사.'
        },
        {
          day: 'Day 3: 로컬 미식 & 출발',
          spots: ['안목해변 오션뷰 디저트 크롤링', '로컬 명물 기프트 숍 방문', '출발지 복귀 리무진 탑승'],
          desc: '여행 마무리 단계. SNS 핫플로 등록된 카페들을 투어하며 기념 굿즈 세트를 수령하고 안전하게 귀가.'
        }
      ];
    } else if (echo.genreId === 'drama') {
      return [
        {
          day: 'Day 1: 명장면 속으로',
          spots: ['드라마 공식 촬영 가옥 방문', '레트로 교복/소품 대여', '주인공 최애 맛집 점심'],
          desc: '드라마 첫 화에 나온 대표 장소에서 명장면을 재현해보는 감성 스틸컷 촬영 세션 포함.'
        },
        {
          day: 'Day 2: 시그니처 뷰 & 시티 라이트',
          spots: ['노을 명소 오름 산책', '오션뷰 루프탑 럭셔리 디너', '미디어파사드 성곽 야행'],
          desc: '가장 극적인 노을 스팟과 대형 미디어쇼 야간 개장에 특화된 루트로, 참가자들의 SNS 업로드 유도.'
        },
        {
          day: 'Day 3: 감성 다도 & 복귀',
          spots: ['돌담 마을 다도 명상 클래스', '로컬 아티스트 소품샵 투어', '해안 드라이브 후 배송'],
          desc: 'MUJI 스타일의 정온하고 슬로우한 분위기 속에서 다도를 배우며, 기념 도자기를 선물하는 코스.'
        }
      ];
    } else {
      return [
        {
          day: 'Day 1: 로컬 맛의 시작',
          spots: ['백종원 가이드 선정 노포 탐방', '식재료 마켓 도슨트 투어', '전통 조리 기법 시연 클래스'],
          desc: '유튜브와 블로그 검색 지표 상위 맛집 방문 및 요리 명인과 함께하는 전통 미식 강의 수강.'
        },
        {
          day: 'Day 2: 야경 & 식도락',
          spots: ['항구 야시장 스탬프 미션', '민어/낙지 수산시장 경매 체험', '야간 포차 거리 프리패스'],
          desc: '현지의 활기찬 밤 정취를 느낄 수 있는 푸드 페스티벌 투어 코스로 높은 만족도 유치.'
        },
        {
          day: 'Day 3: 디저트 페어링 & 출발',
          spots: ['오션뷰 베이커리 에그타르트 시식', '특산품 로컬 에디션 바스켓 쇼핑', '해안 보도 산책'],
          desc: '달콤한 디저트 코스로 식도락 일정을 부드럽게 매듭짓고, 가벼운 자유 시간 후 복귀.'
        }
      ];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none font-sans">
      {/* Background Dim */}
      <div
        className="absolute inset-0 bg-[#1f1f1f]/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content Container (Notion Style Paper) */}
      <div className="relative bg-[#fdfdfd] w-[640px] max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 shadow-xl p-8 flex flex-col z-10 animate-slide-up no-scrollbar">
        
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
            <span>AI MD 상품 자동 설계 패키지</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Details */}
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
            <div className="flex items-center space-x-1.5 mb-2.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-neutral-800">AI 권장 루트 세부 일정</h4>
            </div>
            
            {/* Day blocks */}
            <div className="space-y-3">
              {getItinerary().map((dayData, idx) => (
                <div key={idx} className="bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-100">
                  <span className="text-[10px] font-bold text-blue-600">{dayData.day}</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed font-light">{dayData.desc}</p>
                  
                  {/* Spot mini tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {dayData.spots.map((spot, sidx) => (
                      <span key={sidx} className="bg-white text-neutral-700 text-[9px] px-2 py-0.5 rounded-md border border-neutral-200 flex items-center">
                        <MapPin className="w-2 h-2 text-red-500 mr-1 shrink-0" />
                        {spot}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

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

        {/* Footer controls */}
        <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all cursor-pointer"
          >
            기획 취소
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
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
  );
}
