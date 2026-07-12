import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Paperclip, Database, BookOpen, Mic, Send } from 'lucide-react';
import { ChatMessage } from '../types';
import { CHAT_HISTORY } from '../data/mockData';

interface DataSummaryProps {
  onSendMessage?: (msg: string) => void;
}

export default function DataSummary({ onSendMessage }: DataSummaryProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_HISTORY);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('AI MD와 대화');
  const endRef = useRef<HTMLDivElement>(null);

  const tabs = ['AI MD와 대화', '기획서', '데이터 분석', '레퍼런스', '상품 구성'];

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden h-[360px] font-sans">
      
      {/* Top Tabs */}
      <div className="flex items-center px-4 pt-3 border-b border-neutral-100">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pr-3 space-y-6 no-scrollbar pb-8">
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <div key={msg.id} className="group">
                {isAI ? (
                  <div className="flex items-start gap-3 max-w-3xl">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 mt-1">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-neutral-900">AI MD</span>
                        <span className="text-[10px] text-neutral-400">{msg.time}</span>
                      </div>
                      <div className="text-sm text-neutral-700 font-light leading-relaxed whitespace-pre-line">
                        {msg.text}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-medium bg-neutral-50 px-2 py-1.5 rounded-md inline-flex mt-2">
                        <span>트렌드 스캔 완료</span>
                        <ArrowRight className="w-2.5 h-2.5 text-neutral-300" />
                        <span className="text-neutral-700">기획안 생성 완료</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 max-w-3xl ml-auto flex-row-reverse">
                     <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 mt-1 overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="User" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 space-y-1 text-right">
                       <div className="flex items-center space-x-2 justify-end">
                         <span className="text-[10px] text-neutral-400">{msg.time}</span>
                         <span className="text-xs font-bold text-neutral-900">YOU</span>
                       </div>
                       <div className="inline-block text-sm font-medium text-neutral-900 bg-neutral-100 px-4 py-2 rounded-2xl rounded-tr-sm text-left">
                         {msg.text}
                       </div>
                     </div>
                  </div>
                )}
              </div>
            );
          })}
          {isTyping && (
             <div className="flex items-start gap-3 max-w-3xl">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 mt-1">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-neutral-900">AI MD</span>
                  </div>
                  <div className="text-sm text-neutral-400 font-light flex items-center gap-1 h-6">
                    <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
             </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area (Claude/Cursor Style) */}
        <div className="mt-auto bg-white border border-neutral-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
          <form onSubmit={handleSend} className="flex flex-col relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="AI MD에게 메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
              className="w-full min-h-[48px] max-h-[120px] resize-none p-3 text-sm bg-transparent border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400"
            />
            
            <div className="flex items-center justify-between p-2 border-t border-neutral-100 bg-neutral-50/50 rounded-b-xl">
              <div className="flex items-center gap-1">
                <button type="button" className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-semibold">
                  <Paperclip className="w-3.5 h-3.5" /> 첨부파일
                </button>
                <button type="button" className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-semibold">
                  <Database className="w-3.5 h-3.5" /> 데이터
                </button>
                <button type="button" className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-semibold">
                  <BookOpen className="w-3.5 h-3.5" /> 참고자료
                </button>
                <button type="button" className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-semibold">
                  <Mic className="w-3.5 h-3.5" /> 음성입력
                </button>
              </div>
              
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
