import { useEffect, useMemo, useState } from 'react'
import {
  type GameState, type Decision,
  submitRound, currentPrice, equityAt, positionOf,
  STARTING_CASH,
} from '../lib/engine'
import { Chart } from './Chart'
import { HintModal } from './HintModal'
import { findTicker } from '../lib/tickers'
import { playDing } from '../lib/sfx'
import { getAdvice, type Analyst } from '../lib/advice'

interface PlayProps {
  game: GameState
  onChange: () => void
  onEnd: () => void
}

function useIsLandscapeMobile() {
  const [isLandscape, setIsLandscape] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-height: 500px)')
    const handler = () => setIsLandscape(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isLandscape
}

export function Play({ game, onChange, onEnd }: PlayProps) {
  const [flash, setFlash] = useState<string | null>(null)
  const [cheer, setCheer] = useState<{ dollars: number; pct: number; good: boolean; key: number } | null>(null)
  const [hintAnalysts, setHintAnalysts] = useState<Analyst[] | null>(null)
  const isLandscape = useIsLandscapeMobile()

  const visibleCandles = useMemo(
    () => [...game.warmup, ...game.reveal.slice(0, game.step)],
    [game.warmup, game.reveal, game.step],
  )

  const price = currentPrice(game)
  const equity = equityAt(game, price)
  const earned = equity - STARTING_CASH
  const pnlPct = (equity / STARTING_CASH - 1) * 100
  const bmEquity = game.buyHoldCurve[game.buyHoldCurve.length - 1]
  const currentRound = Math.ceil(game.step / game.roundSize)
  const pos = positionOf(game)
  const hideVolume = findTicker(game.symbol)?.category === 'index'

  const setFlashMsg = (m: string) => {
    setFlash(m)
    window.setTimeout(() => setFlash((cur) => (cur === m ? null : cur)), 1500)
  }
  const handle = (d: Decision) => {
    const before = game.equityCurve[game.equityCurve.length - 1]
    const r = submitRound(game, d)
    if (!r.ok) setFlashMsg(`실패: ${r.reason ?? d}`)
    const after = game.equityCurve[game.equityCurve.length - 1]
    const delta = after - before
    if (r.ok && delta !== 0) {
      const pct = (delta / before) * 100
      const good = delta > 0
      setCheer({ dollars: delta, pct, good, key: Date.now() })
      playDing(good)
    }
    onChange()
    if (r.done) onEnd()
  }

  const requestHint = () => {
    if (game.hintsRemaining <= 0) {
      setFlashMsg('훈수 기회를 다 썼습니다.')
      return
    }
    const advice = getAdvice(visibleCandles)
    game.hintsRemaining--
    setHintAnalysts(advice)
    onChange()
  }

  useEffect(() => {
    if (!cheer) return
    const t = window.setTimeout(() => setCheer((c) => (c?.key === cheer.key ? null : c)), 1600)
    return () => window.clearTimeout(t)
  }, [cheer])

  const isFirstRound = game.step === 0
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'b' || e.key === 'B') handle('LONG')
      else if (e.key === 's' || e.key === 'S') handle('SHORT')
      else if (isFirstRound) return  // first round: no HOLD/FLAT
      else if (e.code === 'Space') { e.preventDefault(); handle('HOLD') }
      else if (e.key === 'f' || e.key === 'F') handle('FLAT')
      else if (e.key === 'h' || e.key === 'H') handle('HOLD')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  type ActionDef = { icon: string; title: string; desc: string; hotkey: string; onClick: () => void; bg: string }
  const actions: ActionDef[] = (() => {
    if (isFirstRound) return [
      { icon: '📈', title: '롱(매수) 진입', desc: '오른다에 베팅', hotkey: 'B', onClick: () => handle('LONG'), bg: 'bg-emerald-500 hover:bg-emerald-400' },
      { icon: '📉', title: '숏(공매도) 진입', desc: '내린다에 베팅', hotkey: 'S', onClick: () => handle('SHORT'), bg: 'bg-amber-500 hover:bg-amber-400' },
    ]
    if (pos === 'FLAT') return [
      { icon: '📈', title: '롱(매수) 진입', desc: '오른다에 베팅', hotkey: 'B', onClick: () => handle('LONG'), bg: 'bg-emerald-500 hover:bg-emerald-400' },
      { icon: '📉', title: '숏(공매도) 진입', desc: '내린다에 베팅', hotkey: 'S', onClick: () => handle('SHORT'), bg: 'bg-amber-500 hover:bg-amber-400' },
      { icon: '🪙', title: '관망 / 현금 유지', desc: `+${game.roundSize}일 그냥 진행`, hotkey: 'Space', onClick: () => handle('HOLD'), bg: 'bg-slate-500 hover:bg-slate-400' },
    ]
    if (pos === 'LONG') return [
      { icon: '💰', title: '롱 청산 → 현금', desc: '이익/손실 확정, 플랫으로', hotkey: 'F', onClick: () => handle('FLAT'), bg: 'bg-red-500 hover:bg-red-400' },
      { icon: '🔁', title: '숏으로 전환', desc: '롱 청산 후 바로 숏', hotkey: 'S', onClick: () => handle('SHORT'), bg: 'bg-amber-500 hover:bg-amber-400' },
      { icon: '✊', title: '롱 유지', desc: `+${game.roundSize}일 그대로 간다`, hotkey: 'Space', onClick: () => handle('HOLD'), bg: 'bg-indigo-500 hover:bg-indigo-400' },
    ]
    return [
      { icon: '💰', title: '숏 청산 → 현금', desc: '이익/손실 확정, 플랫으로', hotkey: 'F', onClick: () => handle('FLAT'), bg: 'bg-red-500 hover:bg-red-400' },
      { icon: '🔁', title: '롱으로 전환', desc: '숏 청산 후 바로 롱', hotkey: 'B', onClick: () => handle('LONG'), bg: 'bg-emerald-500 hover:bg-emerald-400' },
      { icon: '✊', title: '숏 유지', desc: `+${game.roundSize}일 그대로 간다`, hotkey: 'Space', onClick: () => handle('HOLD'), bg: 'bg-indigo-500 hover:bg-indigo-400' },
    ]
  })()

  if (isLandscape) {
    return (
      <div className="h-screen flex flex-row bg-[#0d1016]">
        <main className="flex-1 min-h-0 relative">
          <Chart candles={visibleCandles} trades={game.trades} hideVolume={hideVolume} />
          {flash && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-red-500/20 border border-red-500/50 text-red-200 text-xs z-20">
              {flash}
            </div>
          )}
          {cheer && (
            <div
              key={cheer.key}
              className={`absolute top-2 right-2 pointer-events-none select-none animate-pnl-pop z-10 rounded-lg px-2 py-1 backdrop-blur border-2 shadow-xl flex flex-col items-end leading-tight ${
                cheer.good
                  ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-200'
                  : 'bg-red-500/20 border-red-400/70 text-red-200'
              }`}
            >
              <div className="font-mono font-black text-sm">
                {cheer.dollars >= 0 ? '+' : ''}${Math.abs(cheer.dollars).toFixed(2)}
              </div>
              <div className="font-mono font-bold text-[10px] opacity-90">
                {cheer.pct >= 0 ? '+' : ''}{cheer.pct.toFixed(2)}%
              </div>
            </div>
          )}
        </main>

        <aside className="w-44 shrink-0 border-l border-[#252a36] bg-[#12151c] flex flex-col">
          <div className="px-2 py-1.5 border-b border-[#252a36] flex items-center justify-between gap-2">
            <h1 className="font-bold text-xs">🦆 4848</h1>
            <PositionBadge pos={pos} />
          </div>

          <div className="px-2 py-1 border-b border-[#252a36] text-[10px]">
            <div className="flex justify-between text-[#8b93a7]">
              <span>R {currentRound}/{game.roundCount}</span>
              <span className="font-mono text-[#e5e7eb]">${price.toFixed(2)}</span>
            </div>
            <div className="h-1 mt-1 bg-[#1a1e27] rounded-full overflow-hidden border border-[#252a36]">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all"
                style={{ width: `${(currentRound / game.roundCount) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-2 py-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] border-b border-[#252a36]">
            <div className="flex justify-between col-span-2">
              <span className="text-[#8b93a7]">현금</span>
              <span className="font-mono">${game.cash.toFixed(0)}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-[#8b93a7]">평가</span>
              <span className="font-mono">${equity.toFixed(0)}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-[#8b93a7]">BM</span>
              <span className="font-mono text-[#8b93a7]">${bmEquity.toFixed(0)}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-[#8b93a7]">번돈</span>
              <span className={`font-mono font-bold ${earned >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {earned >= 0 ? '+' : ''}${earned.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-[#8b93a7]">수익률</span>
              <span className={`font-mono font-bold ${pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
              </span>
            </div>
          </div>

          <button
            onClick={requestHint}
            disabled={game.hintsRemaining <= 0}
            className="mx-1.5 mt-1.5 rounded-md px-2 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-[#1a1e27] disabled:text-[#4a5162] disabled:cursor-not-allowed text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow transition active:scale-95"
          >
            🔮 훈수 <span className="font-mono opacity-80">({game.hintsRemaining})</span>
          </button>

          <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1">
            {actions.map((a) => (
              <button
                key={a.title}
                onClick={a.onClick}
                className={`flex-1 min-h-0 rounded-md ${a.bg} text-white flex items-center gap-2 px-2 py-1 shadow transition active:scale-95`}
              >
                <span className="text-xl leading-none shrink-0">{a.icon}</span>
                <span className="font-black text-[11px] leading-tight text-left flex-1 min-w-0">{a.title}</span>
              </button>
            ))}
          </div>
        </aside>
        {hintAnalysts && (
          <HintModal
            analysts={hintAnalysts}
            hintsRemaining={game.hintsRemaining}
            onClose={() => setHintAnalysts(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="px-3 sm:px-6 py-2 sm:py-4 border-b border-[#252a36] flex items-center justify-between gap-3 flex-wrap bg-[#12151c]">
        <div className="flex items-center gap-2 sm:gap-5 flex-wrap">
          <h1 className="font-bold text-base sm:text-lg">🦆 4848</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <PositionBadge pos={pos} />
            <span className="text-[#8b93a7]">
              <span className="hidden sm:inline">라운드 </span>
              <span className="text-[#e5e7eb] font-mono">{currentRound}/{game.roundCount}</span>
            </span>
            <span className="text-[#8b93a7] hidden sm:inline">+{game.roundSize}d/회</span>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-[#8b93a7] uppercase tracking-wider">현재가</span>
            <span className="font-mono text-sm sm:text-base font-bold text-[#e5e7eb]">${price.toFixed(2)}</span>
          </div>
          <button
            onClick={requestHint}
            disabled={game.hintsRemaining <= 0}
            className="rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-[#1a1e27] disabled:text-[#4a5162] disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center gap-1 shadow transition active:scale-95"
            title="분석가들의 의견 보기"
          >
            🔮 훈수 <span className="font-mono opacity-80">({game.hintsRemaining})</span>
          </button>
        </div>
        <div className="flex items-center gap-3 sm:gap-8 flex-wrap">
          <Stat label="현금" fullLabel="보유현금" value={`$${game.cash.toFixed(2)}`} />
          <Stat
            label="번돈"
            value={`${earned >= 0 ? '+' : ''}$${earned.toFixed(2)}`}
            color={earned >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
          <Stat label="평가" value={`$${equity.toFixed(2)}`} />
          <Stat label="BM" fullLabel="BM 금액" value={`$${bmEquity.toFixed(2)}`} />
          <Stat
            label="수익률"
            value={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}
            color={pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
        </div>
      </header>

      {/* Round progress bar */}
      <div className="px-3 sm:px-6 py-2 bg-[#0d1016] border-b border-[#252a36]">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline text-xs font-bold text-[#8b93a7] uppercase tracking-widest w-20">
            진행도
          </span>
          <div className="flex-1 h-2 sm:h-3 bg-[#1a1e27] rounded-full overflow-hidden border border-[#252a36]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all"
              style={{ width: `${(currentRound / game.roundCount) * 100}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-mono text-[#e5e7eb] w-14 sm:w-20 text-right">
            {currentRound} / {game.roundCount}
          </span>
        </div>
      </div>

      <main className="flex-1 min-h-0 relative">
        <Chart candles={visibleCandles} trades={game.trades} hideVolume={hideVolume} />
        {flash && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
            {flash}
          </div>
        )}
        {cheer && (
          <div
            key={cheer.key}
            className={`absolute top-4 right-4 sm:top-6 sm:right-6 pointer-events-none select-none animate-pnl-pop z-10 rounded-xl px-3 py-2 sm:px-4 sm:py-3 backdrop-blur border-2 shadow-xl flex flex-col items-end leading-tight ${
              cheer.good
                ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-200'
                : 'bg-red-500/20 border-red-400/70 text-red-200'
            }`}
          >
            <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold opacity-80">
              {cheer.good ? '💰 수익' : '💥 손실'}
            </div>
            <div className="font-mono font-black text-xl sm:text-3xl">
              {cheer.dollars >= 0 ? '+' : ''}${Math.abs(cheer.dollars).toFixed(2)}
            </div>
            <div className="font-mono font-bold text-xs sm:text-sm opacity-90">
              {cheer.pct >= 0 ? '+' : ''}{cheer.pct.toFixed(2)}%
            </div>
          </div>
        )}
      </main>

      <footer className="px-3 sm:px-6 py-2 sm:py-3 border-t border-[#252a36] bg-[#12151c]">
        <div className="text-[10px] sm:text-xs text-[#8b93a7] uppercase tracking-widest mb-2 font-bold">
          {isFirstRound  && <>1라운드 — <span className="text-amber-300">반드시 롱 또는 숏 선택</span> (관망 불가)</>}
          {!isFirstRound && pos === 'FLAT'  && <>현재 <span className="text-slate-300">무포지션(현금)</span> — 다음 라운드?</>}
          {!isFirstRound && pos === 'LONG'  && <>현재 <span className="text-emerald-300">롱(매수)</span> 보유 중 — 다음 라운드?</>}
          {!isFirstRound && pos === 'SHORT' && <>현재 <span className="text-amber-300">숏(공매도)</span> 보유 중 — 다음 라운드?</>}
        </div>
        <div className={`grid ${isFirstRound ? 'grid-cols-2' : 'grid-cols-3'} gap-2 sm:gap-3`}>
          {actions.map((a) => (
            <ActionCard key={a.title} {...a} />
          ))}
        </div>
      </footer>
      {hintAnalysts && (
        <HintModal
          analysts={hintAnalysts}
          hintsRemaining={game.hintsRemaining}
          onClose={() => setHintAnalysts(null)}
        />
      )}
    </div>
  )
}

function ActionCard({
  icon, title, desc, hotkey, onClick, bg,
}: {
  icon: string
  title: string
  desc: string
  hotkey: string
  onClick: () => void
  bg: string
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg sm:rounded-xl ${bg} text-white text-left p-2 sm:p-4 transition shadow-lg hover:scale-[1.02] active:scale-100 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3`}
    >
      <span className="text-2xl sm:text-4xl leading-none">{icon}</span>
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <div className="font-black text-[11px] sm:text-base leading-tight">{title}</div>
        <div className="hidden sm:block text-xs opacity-85 mt-0.5">{desc}</div>
      </div>
      <kbd className="hidden sm:block text-[10px] font-mono font-bold bg-black/30 border border-white/20 px-2 py-1 rounded self-start">
        {hotkey}
      </kbd>
    </button>
  )
}

function PositionBadge({ pos }: { pos: ReturnType<typeof positionOf> }) {
  const styles: Record<typeof pos, string> = {
    FLAT:  'bg-[#1a1e27] text-[#8b93a7] border-[#252a36]',
    LONG:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    SHORT: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  }
  const label: Record<typeof pos, string> = { FLAT: '무포지션', LONG: '롱', SHORT: '숏' }
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${styles[pos]}`}>
      {label[pos]}
    </span>
  )
}

function Stat({ label, fullLabel, value, color }: { label: string; fullLabel?: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-[10px] sm:text-xs text-[#8b93a7] uppercase tracking-wider mb-0.5">
        <span className="sm:hidden">{label}</span>
        <span className="hidden sm:inline">{fullLabel ?? label}</span>
      </span>
      <span className={`font-mono text-sm sm:text-2xl font-bold ${color ?? 'text-[#e5e7eb]'}`}>{value}</span>
    </div>
  )
}
