import { useState } from 'react'
import { ALL_CATEGORIES, CATEGORY_LABEL, type Category } from '../lib/tickers'
import { ROUND_SIZES, ROUND_COUNTS, WARMUP_DAYS, type RoundSize } from '../lib/engine'
import { HelpModal } from './HelpModal'

interface SetupProps {
  onStart: (args: { categories: Category[]; roundCount: number; roundSize: RoundSize }) => void
  loading: boolean
  error: string | null
}

export function Setup({ onStart, loading, error }: SetupProps) {
  const [categories, setCategories] = useState<Set<Category>>(new Set(['kr']))
  const [roundCount, setRoundCount] = useState<number>(20)
  const [roundSize, setRoundSize] = useState<RoundSize>(ROUND_SIZES[1]) // 주
  const [showHelp, setShowHelp] = useState(false)

  const toggleCat = (c: Category) => {
    const next = new Set(categories)
    if (next.has(c)) next.delete(c); else next.add(c)
    if (next.size === 0) return
    setCategories(next)
  }

  const tradingDays = roundCount * roundSize.days

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      <div className="w-full max-w-3xl bg-[#12151c] border border-[#252a36] rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <button
          onClick={() => setShowHelp(true)}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#1a1e27] border border-[#252a36] hover:border-amber-400/60 text-[#e5e7eb] font-bold text-sm"
          title="도움말"
        >
          ?
        </button>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative">
            <img
              src="/duck.png"
              alt="trader duck"
              className="w-80 h-80 object-contain drop-shadow-2xl select-none"
              draggable={false}
            />
            <div className="absolute -top-2 -right-4 text-3xl rotate-12 select-none">ㅋㅋㅋ</div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-b from-amber-200 to-amber-400 bg-clip-text text-transparent">
              주식을 이겨라!
            </h1>
            <img
              src="/niga.png"
              alt="ㅋ 니가?"
              className="h-12 w-auto rounded-md border border-[#252a36] select-none"
              draggable={false}
            />
          </div>
          <p className="text-[#8b93a7] mt-3 text-sm">
            종목은 비밀. 최근 1년 차트만 보고 판단해서 <span className="text-amber-300 font-semibold">Buy &amp; Hold</span>를 이기면 승리.
          </p>
        </div>

        <section className="mb-5">
          <h2 className="text-xs font-semibold text-[#8b93a7] uppercase tracking-widest mb-2">
            어떤 종목에서 뽑을까?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={`py-2.5 rounded-xl border text-sm font-bold transition ${
                  categories.has(c)
                    ? 'bg-amber-400/15 border-amber-400/60 text-amber-200'
                    : 'bg-[#1a1e27] border-[#252a36] text-[#8b93a7] hover:border-[#3a4154]'
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-5">
          <h2 className="text-xs font-semibold text-[#8b93a7] uppercase tracking-widest mb-2">
            몇 라운드?
          </h2>
          <div className="grid grid-cols-6 gap-2">
            {ROUND_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setRoundCount(n)}
                className={`py-2.5 rounded-xl border text-sm font-bold transition ${
                  roundCount === n
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                    : 'bg-[#1a1e27] border-[#252a36] text-[#8b93a7] hover:border-[#3a4154]'
                }`}
              >
                {n}라운드
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xs font-semibold text-[#8b93a7] uppercase tracking-widest mb-2">
            라운드별 리밸런싱 주기
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {ROUND_SIZES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRoundSize(r)}
                className={`py-2.5 rounded-xl border text-sm font-bold transition ${
                  roundSize.key === r.key
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                    : 'bg-[#1a1e27] border-[#252a36] text-[#8b93a7] hover:border-[#3a4154]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#8b93a7] mt-2 text-center">
            총 트레이딩 기간 ≈ <span className="text-[#e5e7eb] font-mono">{tradingDays}거래일</span>
            {' '}({(tradingDays / 252).toFixed(1)}년)
          </p>
        </section>

        <button
          onClick={() => onStart({ categories: Array.from(categories), roundCount, roundSize })}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:from-[#1a1e27] disabled:to-[#1a1e27] disabled:text-[#5a6175] text-[#0b0d12] font-extrabold text-lg transition shadow-lg shadow-amber-500/20"
        >
          {loading ? '딸깍… 딸깍…' : '딸깍! 시작하기'}
        </button>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 text-xs text-[#8b93a7] space-y-1 text-center">
          <p>
            과거 {WARMUP_DAYS}일(약 1년) 차트 공개 · 시작자금 $10,000 · 수수료 0.1% · 포지션 100%
          </p>
          <p>
            ⌨️ <kbd className="px-1.5 py-0.5 bg-[#1a1e27] rounded">Space</kbd> 다음 라운드
            · <kbd className="px-1.5 py-0.5 bg-[#1a1e27] rounded">B</kbd> 매수/환매
            · <kbd className="px-1.5 py-0.5 bg-[#1a1e27] rounded">S</kbd> 매도/공매도
            · <kbd className="px-1.5 py-0.5 bg-[#1a1e27] rounded">H</kbd> 홀드
          </p>
        </div>
      </div>
    </div>
  )
}
