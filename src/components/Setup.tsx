import { useState } from 'react'
import { ALL_CATEGORIES, CATEGORY_LABEL, type Category } from '../lib/tickers'
import { ROUND_SIZES, ROUND_COUNTS, type RoundSize } from '../lib/engine'
import { HelpModal } from './HelpModal'
import { loadHighScore, loadRecentGames } from '../lib/highscore'

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
  const highScore = loadHighScore()
  const recent = loadRecentGames()

  const toggleCat = (c: Category) => {
    const next = new Set(categories)
    if (next.has(c)) next.delete(c); else next.add(c)
    if (next.size === 0) return
    setCategories(next)
  }

  const tradingDays = roundCount * roundSize.days

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* 쌈마이 배경 장식 — 데스크톱 전용 */}
      <div aria-hidden className="absolute inset-0 pointer-events-none hidden sm:block">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-purple-900/10 to-amber-900/20" />
        <span className="absolute top-8  left-10  text-5xl animate-spin-slow">✨</span>
        <span className="absolute top-16 right-24 text-6xl animate-bounce">💰</span>
        <span className="absolute bottom-24 left-16 text-5xl animate-pulse">📈</span>
        <span className="absolute bottom-12 right-12 text-5xl animate-spin-slow">🎰</span>
        <span className="absolute top-1/2 left-4 text-4xl animate-bounce">🪙</span>
        <span className="absolute top-1/3 right-6 text-4xl animate-pulse">💸</span>
        <span className="absolute top-6    right-1/3 text-3xl rotate-12 animate-blink">★</span>
        <span className="absolute bottom-6 left-1/3  text-3xl -rotate-12 animate-blink">★</span>
        <img src="/meme1.png" alt="" className="absolute bottom-6 left-6 w-28 opacity-60 rotate-[-8deg] rounded-lg border border-white/10 select-none" draggable={false} />
        <img src="/meme2.png" alt="" className="absolute top-6 right-6 w-24 opacity-60 rotate-[6deg] rounded-lg border border-white/10 select-none" draggable={false} />
      </div>
      {/* 모바일용 은은한 배경 그라디언트 + 밈 */}
      <div aria-hidden className="absolute inset-0 pointer-events-none sm:hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-purple-900/10 to-amber-900/20" />
        <img src="/meme1.png" alt="" className="absolute bottom-2 left-2 w-16 opacity-40 rotate-[-8deg] rounded select-none" draggable={false} />
        <img src="/meme2.png" alt="" className="absolute top-2 right-2 w-14 opacity-40 rotate-[6deg] rounded select-none" draggable={false} />
      </div>

      <div className="w-full max-w-3xl bg-[#12151c] border-2 sm:border-4 border-amber-400/70 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-[0_0_60px_rgba(251,191,36,0.25)] relative overflow-hidden z-10">
        {/* 레인보우 테두리 스트라이프 */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-rainbow-stripe" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-rainbow-stripe" />

        <button
          onClick={() => setShowHelp(true)}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1a1e27] border-2 border-amber-400/60 hover:border-amber-300 text-amber-200 font-black text-base sm:text-lg z-20"
          title="도움말"
        >
          ?
        </button>

        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-4 sm:mb-6 mt-2 sm:mt-4 relative">
          <div className="hidden sm:block absolute -top-1 left-2 text-amber-300 text-xs font-black rotate-[-18deg] select-none leading-tight">
            🔥 오늘의<br/>한탕 🔥
          </div>
          <div className="hidden sm:block absolute -top-1 right-14 text-pink-300 text-xs font-black rotate-[12deg] select-none leading-tight animate-blink">
            🚨 대박 🚨<br/>신호 감지!
          </div>

          <div className="relative animate-wobble">
            <img
              src="/duck.png"
              alt="trader duck"
              className="w-36 h-36 sm:w-64 sm:h-64 object-contain drop-shadow-[0_10px_30px_rgba(251,191,36,0.35)] select-none"
              draggable={false}
            />
            <div className="absolute -top-2 -right-2 text-xl sm:text-3xl rotate-12 select-none">ㅋㅋㅋ</div>
            <div className="absolute -top-4 -left-4 text-lg sm:text-2xl -rotate-12 select-none animate-bounce">💸</div>
            <div className="absolute -bottom-2 -right-6 sm:-right-8 text-lg sm:text-2xl rotate-6 select-none animate-bounce">📈</div>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap">
            <span className="text-amber-300 text-lg sm:text-xl font-black animate-blink">★</span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-amber-300 animate-neon">
              4848로 주식을 이겨라!
            </h1>
            <img
              src="/niga.png"
              alt="ㅋ 니가?"
              className="h-8 sm:h-12 w-auto rounded-md border-2 border-amber-400/60 select-none animate-wobble"
              draggable={false}
            />
            <span className="text-amber-300 text-lg sm:text-xl font-black animate-blink">★</span>
          </div>
          <p className="text-pink-200 mt-2 sm:mt-3 text-sm sm:text-base font-bold px-2">
            ❗ 종목은 <u>비밀</u>! 차트만 보고 <span className="text-amber-300">Buy &amp; Hold</span> ⚡️발라버려⚡️ 승리! ❗
          </p>
        </div>

        <section className="mb-4">
          <h2 className="text-sm font-black text-amber-300 uppercase tracking-widest mb-2">
            🎯 어떤 종목?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={`py-2 sm:py-3 rounded-xl border-2 text-sm font-black transition ${
                  categories.has(c)
                    ? 'bg-amber-400/20 border-amber-400 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                    : 'bg-[#1a1e27] border-[#252a36] text-[#8b93a7] hover:border-amber-400/40'
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h2 className="text-sm font-black text-fuchsia-300 uppercase tracking-widest mb-2">
            🔥 몇 라운드?
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ROUND_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setRoundCount(n)}
                className={`py-2 sm:py-3 rounded-xl border-2 text-sm font-black transition ${
                  roundCount === n
                    ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-100 shadow-[0_0_12px_rgba(217,70,239,0.4)]'
                    : 'bg-[#1a1e27] border-[#252a36] text-[#8b93a7] hover:border-fuchsia-400/40'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-black text-sky-300 uppercase tracking-widest mb-2">
            ⚡ 리밸런싱 주기
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {ROUND_SIZES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRoundSize(r)}
                className={`py-2 sm:py-3 rounded-xl border-2 text-sm font-black transition ${
                  roundSize.key === r.key
                    ? 'bg-sky-500/20 border-sky-400 text-sky-100 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    : 'bg-[#1a1e27] border-[#252a36] text-[#8b93a7] hover:border-sky-400/40'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-amber-200 mt-2 text-center font-bold">
            총 트레이딩 기간 ≈ <span className="font-mono text-amber-100">{tradingDays}거래일</span>
            {' '}({(tradingDays / 252).toFixed(1)}년)
          </p>
        </section>

        <button
          onClick={() => onStart({ categories: Array.from(categories), roundCount, roundSize })}
          disabled={loading}
          className="btn-shine w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-pink-500 via-amber-400 to-orange-500 hover:from-pink-400 hover:via-amber-300 hover:to-orange-400 disabled:from-[#1a1e27] disabled:via-[#1a1e27] disabled:to-[#1a1e27] disabled:text-[#5a6175] text-[#0b0d12] font-black text-lg sm:text-xl transition shadow-[0_0_30px_rgba(251,191,36,0.5)] relative overflow-hidden border-2 border-amber-200"
        >
          {loading ? '⏳ 딸깍… 딸깍… 딸깍…' : '🎰 딸깍! 시작하기 🎰'}
        </button>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border-2 border-red-500/60 text-red-200 text-sm font-bold">
            ⚠️ {error}
          </div>
        )}

        {highScore && (
          <div className="mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border-2 border-amber-400/50 text-amber-100 text-sm font-bold">
            <span>🏆 최고 기록 (연환산)</span>
            <span className={`font-mono font-black text-base ${highScore.cagrPct >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {highScore.cagrPct >= 0 ? '+' : ''}{highScore.cagrPct.toFixed(2)}%
            </span>
            <span className="text-amber-200/80 text-xs">
              ({highScore.symbolName ?? highScore.symbol})
            </span>
          </div>
        )}

        {recent.length > 0 && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-[#12151c]/70 border border-[#252a36]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#8b93a7] mb-1.5">
              최근 게임 ({recent.length})
            </div>
            <ul className="flex flex-col gap-0.5 max-h-40 overflow-auto">
              {recent.map((r) => (
                <li key={r.at} className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-[#8b93a7] shrink-0 w-16">
                    {new Date(r.at).toISOString().slice(5, 10).replace('-', '/')}
                  </span>
                  <span className="text-[#e5e7eb] truncate flex-1 min-w-0">
                    {r.symbolName ?? r.symbol}
                  </span>
                  <span className={`font-bold shrink-0 ${r.cagrPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.cagrPct >= 0 ? '+' : ''}{r.cagrPct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 text-xs text-amber-200/80 space-y-1 text-center font-bold">
          <p>
            💵 시작자금 $10,000 · 💸 수수료 0.1% · 🎯 포지션 100%
          </p>
          <p>
            ⌨️ <kbd className="px-1.5 py-0.5 bg-[#1a1e27] rounded border border-amber-400/30">Space</kbd> 다음
            · <kbd className="px-1.5 py-0.5 bg-[#1a1e27] rounded border border-emerald-400/30">B</kbd> 매수
            · <kbd className="px-1.5 py-0.5 bg-[#1a1e27] rounded border border-rose-400/30">S</kbd> 숏
            · <kbd className="px-1.5 py-0.5 bg-[#1a1e27] rounded border border-slate-400/30">F</kbd> 플랫
          </p>
        </div>
      </div>
    </div>
  )
}
