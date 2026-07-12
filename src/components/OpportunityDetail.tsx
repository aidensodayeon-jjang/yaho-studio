import { Bookmark, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { EchoCard } from '../types';

interface OpportunityDetailProps {
  selectedEcho: EchoCard | null;
}

export default function OpportunityDetail({ selectedEcho }: OpportunityDetailProps) {
  if (!selectedEcho) return null;

  const tabs = ['기회 분석 요약', '방문자 분석', 'SNS 트렌드', '리뷰/평가', '경쟁 분석', '상품 아이디어', '예상 효과', '실행 가이드'];

  return (
    <div className="font-sans flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 mt-6">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          </div>
          <span className="text-xs font-medium text-neutral-600">선택된 Opportunity</span>
          <span className="text-[10px] font-bold px-1.5 rounded-sm bg-neutral-100 text-neutral-900 tracking-wider">01</span>
          <span className="text-[10px] font-bold px-1.5 rounded-sm bg-neutral-100 text-neutral-900 tracking-wider">HIGH</span>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight ml-2">{selectedEcho.title}</h2>
          <div className="flex items-center space-x-1 ml-2">
            {selectedEcho.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-neutral-500">#{tag}</span>
            ))}
          </div>
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
      <div className="flex border-b border-neutral-200 mb-6">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              idx === 0 ? 'border-neutral-900 text-neutral-900 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column: Images & Flow */}
          <div className="col-span-4 flex flex-col gap-4">
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
              <img src={selectedEcho.image} alt={selectedEcho.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            
            <div className="flex items-center justify-between">
              <button className="text-neutral-400 hover:text-neutral-900"><ChevronLeft className="w-4 h-4"/></button>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${i===1 ? 'border-neutral-900' : 'border-transparent'}`}>
                    <img src={selectedEcho.image} alt="" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <button className="text-neutral-400 hover:text-neutral-900"><ChevronRight className="w-4 h-4"/></button>
            </div>

            <div className="mt-4">
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
              <h4 className="text-[11px] font-bold text-neutral-900 mb-2">데이터 요약</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] text-neutral-500 mb-1">SNS 언급량 추이</p>
                  <p className="text-sm font-bold text-green-600 mb-1">+{selectedEcho.searchVolumeChange}%</p>
                  <div className="w-full h-6 bg-neutral-100 rounded relative overflow-hidden">
                    {/* Mock Line Chart */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <path d="M0,25 Q25,20 50,10 T100,5" fill="none" stroke="#16a34a" strokeWidth="2" />
                      <circle cx="100" cy="5" r="2" fill="#16a34a" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-neutral-500 mb-1">외국인 비율</p>
                  <p className="text-sm font-bold text-green-600 mb-1">{selectedEcho.postsChange}%</p>
                  <div className="w-full flex justify-center mt-1">
                    {/* Mock Donut */}
                    <div className="w-8 h-8 rounded-full border-[3px] border-neutral-200 border-r-green-500 border-t-green-500 transform rotate-45"></div>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-neutral-500 mb-1">평균 체류시간</p>
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
      </div>
    </div>
  );
}
