import { useState } from 'react';
import { Send, Plus, ChevronRight, PenTool, Sparkles, Megaphone, FileText, Users } from 'lucide-react';
import { EchoCard } from '../types';

interface RightSidebarProps {
  selectedEcho: EchoCard | null;
}

export default function RightSidebar({ selectedEcho }: RightSidebarProps) {
  const [input, setInput] = useState('');

  const aiMdProfile = [
    { icon: '🌍', label: '국가 / 시장', value: '일본', dot: 'bg-red-500' },
    { icon: '📍', label: '지역', value: '서울' },
    { icon: '🎯', label: '장르', value: 'K-POP, 웰니스' },
    { icon: '👥', label: '타겟', value: '20~30대 여성' },
    { icon: '☀️', label: '시즌', value: '여름 (6~8월)' },
    { icon: '🎯', label: '목표', value: '체험상품 개발' }
  ];

  const recommendedActions = [
    { icon: PenTool, label: '패키지 기획 및 상품 구성하기' },
    { icon: Sparkles, label: '황톳길 + 피크닉 연계 상품 개발' },
    { icon: Megaphone, label: '덕연이치킨 제휴 협의 제안' },
    { icon: FileText, label: 'SNS 숏폼 콘텐츠 기획하기' },
    { icon: Users, label: '인플루언서 협업 제안하기' }
  ];

  return (
    <aside className="w-[320px] bg-[#fafafa] border-l border-neutral-200 flex flex-col h-screen shrink-0 font-sans text-neutral-800">
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-6 gap-6">
        
        {/* AI MD Profile */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900">AI MD Profile</h3>
            <button className="text-[10px] text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded px-2 py-1 font-medium bg-neutral-50">편집</button>
          </div>
          <div className="space-y-3 mb-5">
            {aiMdProfile.map((item, idx) => (
              <div key={idx} className="flex items-center text-xs">
                <span className="w-6 text-center shrink-0">{item.icon}</span>
                <span className="text-neutral-500 w-20 shrink-0">{item.label}</span>
                <div className="flex items-center text-neutral-900 font-medium truncate">
                  {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot} mr-1.5`}></span>}
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
            <span className="text-[10px] text-neutral-500 font-medium">프로필 정확도</span>
            <div className="flex items-center flex-1 ml-3 space-x-2">
              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 w-[92%] rounded-full"></div>
              </div>
              <span className="text-xs font-bold text-neutral-900">92%</span>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm flex flex-col flex-1 min-h-[400px]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-neutral-900 text-white flex items-center justify-center font-bold text-xs rounded-md">Y</div>
              <h3 className="text-sm font-bold text-neutral-900">AI Assistant</h3>
            </div>
            <button className="flex items-center text-[10px] text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-full px-2.5 py-1 font-medium">
              <Plus className="w-3 h-3 mr-0.5" /> 새 대화
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar pb-2">
            <div>
              <p className="text-[10px] text-neutral-400 mb-1">현재 분석 중</p>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-neutral-900 truncate pr-2">{selectedEcho?.title || '선택된 기회 없음'}</h4>
                <div className="border border-neutral-200 rounded-full px-2 py-0.5 text-[10px] font-bold text-neutral-600 flex items-center shrink-0">
                  Opportunity <span className="text-black ml-1">{selectedEcho?.score || 0}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-neutral-700 leading-relaxed space-y-3">
              <p className="whitespace-pre-wrap">
                {selectedEcho?.aiAssistantContext || `${selectedEcho?.title || '상품'}는 일본 20~30대 여성에게 매우 매력적인 상품이 될 가능성이 높아요. 🌱`}
              </p>
              <div>
                <p className="font-bold text-neutral-900 mb-1">핵심 분석 결과</p>
                <ul className="space-y-1 text-neutral-600">
                  {selectedEcho?.reasonDetails?.slice(0,4).map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-neutral-900 mb-2">AI 추천 액션</p>
              <div className="space-y-1.5">
                {(selectedEcho?.aiRecommendedActions || recommendedActions.map(a => a.label)).map((label, idx) => {
                  const Icon = recommendedActions[idx % recommendedActions.length].icon;
                  return (
                    <button key={idx} className="w-full flex items-center p-2 rounded-lg border border-neutral-100 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-200 transition-colors text-left group">
                      <div className="w-5 h-5 rounded bg-white border border-neutral-200 flex items-center justify-center mr-2 shrink-0 group-hover:border-neutral-300">
                        <Icon className="w-3 h-3 text-neutral-600" />
                      </div>
                      <span className="text-[11px] font-medium text-neutral-700 truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Fixed Chat Input */}
      <div className="p-4 bg-white border-t border-neutral-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="w-full bg-[#f5f5f5] text-sm text-neutral-900 rounded-2xl py-3 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-neutral-300 placeholder:text-neutral-400"
          />
          <button className="absolute right-1.5 top-1.5 w-8 h-8 bg-neutral-900 rounded-xl text-white flex items-center justify-center hover:bg-neutral-800 transition-colors">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
