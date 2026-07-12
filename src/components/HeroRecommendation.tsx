import { CheckCircle2, Star, Sparkles, TrendingUp, ChevronRight, FileText, Bot } from 'lucide-react';
import { EchoCard } from '../types';

interface HeroRecommendationProps {
  selectedEcho: EchoCard;
  onPlanProduct: (echo: EchoCard) => void;
}

export default function HeroRecommendation({
  selectedEcho,
  onPlanProduct,
}: HeroRecommendationProps) {
  return (
    <div className="w-full bg-white rounded-3xl p-10 shadow-sm border border-neutral-100 flex flex-col md:flex-row gap-12 items-start animate-fade-in-up font-sans select-none mb-12">
      {/* Left Content (Text & Info) */}
      <div className="flex-1 space-y-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <Bot className="w-4 h-4 mr-1" />
            AI MD Recommendation
          </div>
          <h2 className="text-3xl font-light text-neutral-400 mb-2 tracking-tight">Good Morning.</h2>
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
            오늘 AI MD가 추천하는 상품<br />
            <span className="text-blue-600">[ {selectedEcho.title} ]</span>
          </h1>
          <p className="text-lg text-neutral-500 font-medium mt-4">
            {selectedEcho.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-8">
          <div>
            <p className="text-sm text-neutral-400 font-light mb-1">예상판매력</p>
            <p className="text-3xl font-bold font-display text-neutral-900 tracking-tight">
              {selectedEcho.score}
            </p>
          </div>
          <div className="w-px h-10 bg-neutral-200"></div>
          <div>
            <p className="text-sm text-neutral-400 font-light mb-1">Confidence</p>
            <p className="text-3xl font-bold font-display text-blue-600 tracking-tight">
              {selectedEcho.confidence}%
            </p>
          </div>
          <div className="w-px h-10 bg-neutral-200"></div>
          <div>
            <p className="text-sm text-neutral-400 font-light mb-1">추천도</p>
            <div className="flex items-center space-x-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => onPlanProduct(selectedEcho)}
          className="bg-black hover:bg-neutral-800 text-white font-semibold text-lg py-4 px-8 rounded-2xl flex items-center justify-center space-x-3 transition-all cursor-pointer shadow-lg hover:shadow-xl"
        >
          <span>상품 만들기</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right Content (Reasons & Data) */}
      <div className="w-full md:w-[400px] flex-shrink-0 bg-neutral-50 rounded-2xl p-8 border border-neutral-100">
        <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6">
          데이터 기반 추천 근거
        </h5>
        <ul className="space-y-4">
          {selectedEcho.reasonDetails.map((reason, index) => (
            <li key={index} className="flex items-start text-sm text-neutral-700">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
              <span className="leading-snug font-medium">{reason}</span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-neutral-200">
          <div>
            <span className="text-xs text-neutral-500 block mb-1">검색량 증가율</span>
            <span className="text-lg font-bold text-neutral-900">+{selectedEcho.searchVolumeChange}%</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 block mb-1">SNS 포스팅 증가</span>
            <span className="text-lg font-bold text-neutral-900">+{selectedEcho.postsChange}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
