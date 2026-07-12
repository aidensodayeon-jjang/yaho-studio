import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';
import { ChatMessage } from '../types';
import { CHAT_HISTORY } from '../data/mockData';

interface DataSummaryProps {
  onSendMessage?: (msg: string) => void;
}

export default function DataSummary({ onSendMessage }: DataSummaryProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_HISTORY);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userMsg,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsTyping(true);

    if (onSendMessage) {
      onSendMessage(userMsg);
    }

    setTimeout(() => {
      let replyText = `데이터 분석 파이프라인 가동 완료. "${userMsg}" 키워드에 맞춰 소셜 트렌드를 스캔했습니다.\n\n`;
      if (userMsg.includes('K-POP') || userMsg.includes('케이팝')) {
        replyText += 'K-POP 장르의 실시간 트렌드 지표가 매우 높습니다. 리센느, BTS 팬투어, 에스파 팝업 등 유망 테마를 분석해 추천해 드렸습니다.';
      } else if (userMsg.includes('부산') || userMsg.includes('불꽃축제')) {
        replyText += '부산 불꽃축제 및 BTS 테마는 요트 투어 및 한정 VIP 패키지와 결합 시 40% 이상의 높은 마진을 확보할 수 있는 검증된 모델입니다.';
      } else if (userMsg.includes('음식') || userMsg.includes('미식') || userMsg.includes('맛집')) {
        replyText += '미식 카테고리는 최근 인스타그램 검색 상승률이 168%에 이릅니다. 목포 해산물 밤마실 투어를 우선 확인해보세요.';
      } else {
        replyText += '현재 SNS에서 가장 핫하게 언급되는 키워드들을 조합해 기획안을 준비했습니다. AI MD 추천 패널을 확인해보세요.';
      }

      const newAiMessage: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, newAiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="w-full font-sans select-none pb-8 border-b border-neutral-100 mb-12">
      <div className="flex items-center space-x-2 mb-8">
        <Sparkles className="w-5 h-5 text-neutral-400" />
        <h3 className="text-xl font-semibold text-neutral-800 tracking-tight">Workspace</h3>
        <span className="text-sm font-light text-neutral-400 ml-4">실시간 트렌드 분석 및 상품 기획</span>
      </div>

      {/* Notion-style Document Body */}
      <div className="space-y-8 max-h-[400px] overflow-y-auto no-scrollbar pb-10">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div key={msg.id} className="group">
              {isAI ? (
                <div className="pl-6 border-l-2 border-neutral-200">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">AI MD</span>
                    <span className="text-[10px] text-neutral-400">{msg.time}</span>
                  </div>
                  <div className="text-base text-neutral-700 font-light leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </div>
                  {/* Subtle progress indicator */}
                  <div className="mt-3 flex items-center space-x-2 text-xs text-neutral-400 font-medium">
                    <span>데이터 수집 완료</span>
                    <ArrowRight className="w-3 h-3 text-neutral-300" />
                    <span>트렌드 분석 완료</span>
                    <ArrowRight className="w-3 h-3 text-neutral-300" />
                    <span className="text-neutral-800">기획안 생성됨</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-neutral-800 tracking-wider uppercase">You</span>
                    <span className="text-[10px] text-neutral-400">{msg.time}</span>
                  </div>
                  <div className="text-lg font-medium text-neutral-900">
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {isTyping && (
          <div className="pl-6 border-l-2 border-neutral-200">
             <div className="flex items-center space-x-2 mb-1.5">
                <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">AI MD</span>
              </div>
              <div className="text-base text-neutral-400 font-light flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Notion-style Input */}
      <form onSubmit={handleSend} className="mt-6 flex items-center border-b border-neutral-200 py-2 group-focus-within:border-neutral-400 transition-colors">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 원하는 상품의 키워드나 테마를 입력하세요..."
          className="flex-1 text-lg font-light bg-transparent border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-300 px-0"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 text-neutral-400 hover:text-neutral-800 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <CornerDownLeft className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
