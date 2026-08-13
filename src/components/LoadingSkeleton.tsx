import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, Search, Database } from 'lucide-react';

interface LoadingSkeletonProps {
  message?: string;
  subMessage?: string;
  type?: 'card-grid' | 'trend-list' | 'detail';
}

const LOADING_STEPS = [
  { icon: Sparkles, text: "실시간 소셜 바이럴 신호 분석 중..." },
  { icon: Search, text: "네이버 검색 트렌드 데이터 연동 중..." },
  { icon: Compass, text: "한국관광공사 지역 관광자원 매칭 중..." },
  { icon: Database, text: "관광 상품화 매력도 스코어 산출 중..." }
];

export function LoadingSkeleton({
  message = "데이터를 분석하고 있습니다...",
  subMessage = "잠시만 기다려주세요",
  type = 'card-grid'
}: LoadingSkeletonProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const CurrentStepIcon = LOADING_STEPS[stepIndex].icon;

  if (type === 'trend-list') {
    return (
      <div className="w-full bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-4">
        {/* Dynamic Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center animate-pulse">
              <CurrentStepIcon className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <span className="text-xs font-bold text-neutral-800 animate-pulse">
              {LOADING_STEPS[stepIndex].text}
            </span>
          </div>
          <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
            데이터 수집 중
          </span>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-neutral-50/80 rounded-2xl border border-neutral-100 p-3 flex flex-col justify-between space-y-3 relative overflow-hidden"
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              
              <div className="flex items-center justify-between">
                <div className="w-4 h-3 bg-neutral-200 rounded animate-pulse" />
                <div className="w-16 h-3 bg-red-100/60 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="w-4/5 h-4 bg-neutral-200/80 rounded animate-pulse" />
                <div className="w-full h-2.5 bg-neutral-200/50 rounded animate-pulse" />
                <div className="w-2/3 h-2.5 bg-neutral-200/50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
      {/* Animated Loading Status Bar */}
      <div className="flex flex-col items-center justify-center py-4 space-y-3 text-center border-b border-neutral-100 pb-6">
        <div className="relative flex items-center justify-center">
          {/* Outer glowing pulsing ring */}
          <div className="absolute w-12 h-12 rounded-full bg-neutral-900/10 animate-ping" />
          {/* Inner animated spinner */}
          <div className="w-10 h-10 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin flex items-center justify-center">
            <CurrentStepIcon className="w-4 h-4 text-neutral-800" />
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-black text-neutral-900 tracking-tight">
            {message}
          </h4>
          <p className="text-[11px] font-medium text-amber-600 flex items-center justify-center gap-1.5 animate-pulse">
            <Sparkles className="w-3 h-3" />
            {LOADING_STEPS[stepIndex].text}
          </p>
          {subMessage && (
            <p className="text-[10px] text-neutral-400 font-normal">
              {subMessage}
            </p>
          )}
        </div>
      </div>

      {/* Skeleton Opportunity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 relative overflow-hidden"
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-neutral-100/70 to-transparent" />

            <div className="flex items-start space-x-3.5">
              {/* Image skeleton */}
              <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200/60 shrink-0 animate-pulse" />

              <div className="flex-1 space-y-2">
                {/* Title & Badge Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="w-3/5 h-4 bg-neutral-200 rounded animate-pulse" />
                  <div className="w-10 h-4 bg-neutral-100 rounded-md animate-pulse" />
                </div>
                {/* Location skeleton */}
                <div className="w-2/5 h-3 bg-neutral-150 bg-neutral-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Content lines skeleton */}
            <div className="space-y-2 pt-1 border-t border-neutral-100">
              <div className="w-full h-3 bg-neutral-100 rounded animate-pulse" />
              <div className="w-4/5 h-3 bg-neutral-100 rounded animate-pulse" />
            </div>

            {/* Tags & Action skeleton */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex space-x-1.5">
                <div className="w-12 h-5 bg-neutral-100 rounded-full animate-pulse" />
                <div className="w-14 h-5 bg-neutral-100 rounded-full animate-pulse" />
              </div>
              <div className="w-16 h-4 bg-neutral-200/80 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
