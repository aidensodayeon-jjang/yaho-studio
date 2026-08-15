import { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, RefreshCw } from 'lucide-react';
import { YouTubePopularTrendItem } from '../hooks/useYouTubePopularTrends';

interface KeywordIdea {
  title: string;
  concept: string;
  target: string;
  duration: string;
  priceRange: string;
  spots?: string[];
}

interface KeywordBrief {
  what?: string;
  whyHot?: string;
  direction?: string;
}

const blankIdea = (): KeywordIdea => ({ title: '', concept: '', target: '외국인 관광객', duration: '', priceRange: '', spots: [] });

export default function KeywordStudio({ trend }: { trend: YouTubePopularTrendItem }) {
  const [brief, setBrief] = useState<KeywordBrief | null>(null);
  const [ideas, setIdeas] = useState<KeywordIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/keyword-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: trend.title,
          summary: trend.summary,
          category: trend.category,
          productHint: trend.productHint || trend.tourism?.reason,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '생성 실패');
      setBrief(json.brief || null);
      setIdeas(Array.isArray(json.ideas) ? json.ideas.map((i: any) => ({ ...blankIdea(), ...i })) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '생성 실패');
    } finally {
      setLoading(false);
    }
  }

  // Reset + regenerate whenever the selected keyword changes.
  useEffect(() => {
    setBrief(null);
    setIdeas([]);
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trend.title]);

  const updateIdea = (idx: number, patch: Partial<KeywordIdea>) =>
    setIdeas((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeIdea = (idx: number) => setIdeas((prev) => prev.filter((_, i) => i !== idx));
  const addIdea = () => setIdeas((prev) => [...prev, blankIdea()]);

  return (
    <div className="font-sans space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            🔎 트렌드 키워드
          </span>
          {trend.category && (
            <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{trend.category}</span>
          )}
          {trend.isNew && (
            <span className="text-[10px] font-black text-white bg-emerald-500 px-1.5 py-0.5 rounded">급상승</span>
          )}
        </div>
        <h2 className="text-xl font-black text-neutral-900 mt-2">{trend.title}</h2>
        {trend.summary && <p className="text-xs text-neutral-500 mt-1">{trend.summary}</p>}
      </div>

      {/* AI 키워드 브리핑 */}
      <div className="bg-neutral-900 text-white rounded-2xl p-5 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold">AI 키워드 브리핑</span>
        </div>
        {loading && !brief ? (
          <p className="text-xs text-neutral-300">AI가 키워드를 분석하고 있습니다…</p>
        ) : brief ? (
          <div className="space-y-2 text-xs leading-relaxed">
            <p><span className="text-amber-300 font-bold">무엇 · </span>{brief.what}</p>
            <p><span className="text-amber-300 font-bold">왜 뜨나 · </span>{brief.whyHot}</p>
            <p><span className="text-amber-300 font-bold">상품 방향 · </span>{brief.direction}</p>
          </div>
        ) : (
          <p className="text-xs text-neutral-400">{error || '브리핑을 불러오지 못했습니다.'}</p>
        )}
      </div>

      {/* 관광상품 아이디어 목록 (추가/수정 가능) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-neutral-900">관광상품 아이디어 목록</h3>
            <p className="text-xs text-neutral-400 mt-0.5">각 항목을 직접 수정하거나 새 상품을 추가할 수 있습니다.</p>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="text-[11px] font-bold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 다시 생성
          </button>
        </div>

        {loading && ideas.length === 0 ? (
          <div className="bg-neutral-50 rounded-2xl p-6 text-center text-xs text-neutral-500 border border-neutral-200">
            상품 아이디어를 생성하고 있습니다…
          </div>
        ) : (
          <div className="space-y-2.5">
            {ideas.map((idea, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-neutral-200 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    value={idea.title}
                    onChange={(e) => updateIdea(idx, { title: e.target.value })}
                    placeholder="상품명"
                    className="flex-1 text-sm font-extrabold text-neutral-900 outline-none border-b border-transparent focus:border-neutral-300 py-0.5"
                  />
                  <button onClick={() => removeIdea(idx)} className="text-neutral-300 hover:text-red-500 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={idea.concept}
                  onChange={(e) => updateIdea(idx, { concept: e.target.value })}
                  placeholder="한 줄 컨셉"
                  className="w-full text-xs text-neutral-600 outline-none border-b border-transparent focus:border-neutral-300 py-0.5"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input value={idea.target} onChange={(e) => updateIdea(idx, { target: e.target.value })} placeholder="타깃"
                    className="text-[11px] px-2 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-400" />
                  <input value={idea.duration} onChange={(e) => updateIdea(idx, { duration: e.target.value })} placeholder="기간"
                    className="text-[11px] px-2 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-400" />
                  <input value={idea.priceRange} onChange={(e) => updateIdea(idx, { priceRange: e.target.value })} placeholder="가격대"
                    className="text-[11px] px-2 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-400" />
                </div>
              </div>
            ))}

            <button
              onClick={addIdea}
              className="w-full border border-dashed border-neutral-300 rounded-2xl py-3 text-xs font-bold text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> 상품 추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
