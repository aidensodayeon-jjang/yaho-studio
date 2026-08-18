import { useState, useEffect, useRef } from 'react';
import { Sparkles, Plus, Trash2, RefreshCw, FileText, Check } from 'lucide-react';
import { YouTubePopularTrendItem } from '../hooks/useYouTubePopularTrends';

interface KeywordIdea {
  title: string;
  concept: string;
  target: string;
  duration: string;
  priceRange: string;
  spots?: string[];
}
interface KeywordBrief { what?: string; whyHot?: string; direction?: string }
interface ProductDetail {
  productName?: string;
  duration?: string;
  estimatedPrice?: string;
  priceGuide?: string;
  itinerary?: { day: string; spots: string[]; desc: string }[];
  marketingPoints?: string[];
}

const blankIdea = (): KeywordIdea => ({ title: '', concept: '', target: '외국인 관광객', duration: '', priceRange: '', spots: [] });
const storeKey = (kw: string) => `yaho-kw-studio:${kw}`;

export default function KeywordStudio({ trend }: { trend: YouTubePopularTrendItem }) {
  const [brief, setBrief] = useState<KeywordBrief | null>(null);
  const [ideas, setIdeas] = useState<KeywordIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);
  const [details, setDetails] = useState<Record<number, ProductDetail>>({});
  const [detailLoading, setDetailLoading] = useState<Record<number, boolean>>({});
  const hydrated = useRef(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setDetails({});
    try {
      const res = await fetch('/api/keyword-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: trend.title, summary: trend.summary, category: trend.category, productHint: trend.productHint || trend.tourism?.reason }),
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

  // On keyword change: load saved edits if present, otherwise generate fresh.
  useEffect(() => {
    hydrated.current = false;
    setDetails({});
    try {
      const raw = localStorage.getItem(storeKey(trend.title));
      if (raw) {
        const saved = JSON.parse(raw);
        setBrief(saved.brief || null);
        setIdeas(Array.isArray(saved.ideas) ? saved.ideas : []);
        hydrated.current = true;
        return;
      }
    } catch { /* ignore */ }
    setBrief(null);
    setIdeas([]);
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trend.title]);

  // Auto-save edits to localStorage.
  useEffect(() => {
    if (ideas.length === 0 && !brief) return;
    try {
      localStorage.setItem(storeKey(trend.title), JSON.stringify({ brief, ideas }));
      setSavedTick(true);
      const t = setTimeout(() => setSavedTick(false), 1200);
      return () => clearTimeout(t);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideas, brief]);

  const updateIdea = (i: number, patch: Partial<KeywordIdea>) => setIdeas((p) => p.map((it, x) => (x === i ? { ...it, ...patch } : it)));
  const removeIdea = (i: number) => { setIdeas((p) => p.filter((_, x) => x !== i)); setDetails((d) => { const n = { ...d }; delete n[i]; return n; }); };
  const addIdea = () => setIdeas((p) => [...p, blankIdea()]);

  async function developIdea(idx: number) {
    const idea = ideas[idx];
    setDetailLoading((s) => ({ ...s, [idx]: true }));
    try {
      const res = await fetch('/api/generate-tour-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trend.title,
          addr1: trend.poiRegion || '',
          overview: `${trend.summary || ''} / ${idea.concept}`,
          selectedIdea: { title: idea.title, oneLineConcept: idea.concept, target: idea.target, reason: idea.concept },
          userTarget: idea.target || undefined,
          userDuration: idea.duration || undefined,
          userBudget: idea.priceRange || undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) setDetails((d) => ({ ...d, [idx]: json.data }));
    } catch { /* ignore */ } finally {
      setDetailLoading((s) => ({ ...s, [idx]: false }));
    }
  }

  return (
    <div className="font-sans space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">🔎 트렌드 키워드</span>
          {trend.category && <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{trend.category}</span>}
          {trend.isNew && <span className="text-[10px] font-black text-white bg-emerald-500 px-1.5 py-0.5 rounded">급상승</span>}
          {savedTick && <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-0.5"><Check className="w-3 h-3" />저장됨</span>}
        </div>
        <h2 className="text-xl font-black text-neutral-900 mt-2">{trend.title}</h2>
        {trend.summary && <p className="text-xs text-neutral-500 mt-1">{trend.summary}</p>}
      </div>

      {/* AI 브리핑 */}
      <div className="bg-neutral-900 text-white rounded-2xl p-5 space-y-2.5">
        <div className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-400" /><span className="text-xs font-bold">AI 키워드 브리핑</span></div>
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

      {/* 상품 아이디어 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-neutral-900">관광상품 아이디어 목록</h3>
            <p className="text-xs text-neutral-400 mt-0.5">수정·추가하면 자동 저장됩니다. 각 상품을 상세 기획서로 발전시킬 수 있습니다.</p>
          </div>
          <button onClick={generate} disabled={loading} className="text-[11px] font-bold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 다시 생성
          </button>
        </div>

        {loading && ideas.length === 0 ? (
          <div className="bg-neutral-50 rounded-2xl p-6 text-center text-xs text-neutral-500 border border-neutral-200">상품 아이디어를 생성하고 있습니다…</div>
        ) : (
          <div className="space-y-2.5">
            {ideas.map((idea, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-neutral-200 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <input value={idea.title} onChange={(e) => updateIdea(idx, { title: e.target.value })} placeholder="상품명"
                    className="flex-1 text-sm font-extrabold text-neutral-900 outline-none border-b border-transparent focus:border-neutral-300 py-0.5" />
                  <button onClick={() => removeIdea(idx)} className="text-neutral-300 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
                <input value={idea.concept} onChange={(e) => updateIdea(idx, { concept: e.target.value })} placeholder="한 줄 컨셉"
                  className="w-full text-xs text-neutral-600 outline-none border-b border-transparent focus:border-neutral-300 py-0.5" />
                <div className="grid grid-cols-3 gap-2">
                  <input value={idea.target} onChange={(e) => updateIdea(idx, { target: e.target.value })} placeholder="타깃" className="text-[11px] px-2 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-400" />
                  <input value={idea.duration} onChange={(e) => updateIdea(idx, { duration: e.target.value })} placeholder="기간" className="text-[11px] px-2 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-400" />
                  <input value={idea.priceRange} onChange={(e) => updateIdea(idx, { priceRange: e.target.value })} placeholder="가격대" className="text-[11px] px-2 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-400" />
                </div>

                <button onClick={() => developIdea(idx)} disabled={detailLoading[idx]}
                  className="w-full mt-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold py-2 rounded-xl inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <FileText className="w-3.5 h-3.5" />{detailLoading[idx] ? '기획서 작성 중…' : details[idx] ? '기획서 다시 생성' : '상세 기획서 생성'}
                </button>

                {details[idx] && (
                  <div className="mt-1.5 bg-neutral-50 rounded-xl border border-neutral-200 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-neutral-900">{details[idx].productName}</span>
                      <span className="text-[10px] font-bold text-emerald-700">{details[idx].estimatedPrice || details[idx].priceGuide}</span>
                    </div>
                    <p className="text-[10px] text-neutral-500">소요: {details[idx].duration}</p>
                    {Array.isArray(details[idx].itinerary) && details[idx].itinerary!.length > 0 && (
                      <div className="space-y-1">
                        {details[idx].itinerary!.map((it, k) => (
                          <div key={k} className="text-[10.5px]">
                            <span className="font-bold text-neutral-800">{it.day}</span>
                            <span className="text-neutral-500"> — {(it.spots || []).join(' · ')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {Array.isArray(details[idx].marketingPoints) && details[idx].marketingPoints!.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {details[idx].marketingPoints!.slice(0, 4).map((m, k) => (
                          <span key={k} className="text-[9.5px] text-neutral-600 bg-white border border-neutral-200 px-1.5 py-0.5 rounded">{m}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <button onClick={addIdea} className="w-full border border-dashed border-neutral-300 rounded-2xl py-3 text-xs font-bold text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 inline-flex items-center justify-center gap-1.5 transition-colors">
              <Plus className="w-4 h-4" /> 상품 추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
