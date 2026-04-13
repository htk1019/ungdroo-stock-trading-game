import { useEffect, useMemo, useState } from 'react'
import {
  type GameState, type Decision,
  submitRound, currentPrice, equityAt, positionOf,
  STARTING_CASH,
} from '../lib/engine'
import { Chart } from './Chart'
import { findTicker } from '../lib/tickers'

interface PlayProps {
  game: GameState
  onChange: () => void
  onEnd: () => void
}

export function Play({ game, onChange, onEnd }: PlayProps) {
  const [flash, setFlash] = useState<string | null>(null)
  const [cheer, setCheer] = useState<{ text: string; good: boolean; key: number } | null>(null)

  const visibleCandles = useMemo(
    () => [...game.warmup, ...game.reveal.slice(0, game.step)],
    [game.warmup, game.reveal, game.step],
  )

  const price = currentPrice(game)
  const equity = equityAt(game, price)
  const pnlPct = (equity / STARTING_CASH - 1) * 100
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
      setCheer({
        text: good ? `굿! +${pct.toFixed(2)}%` : `땡! ${pct.toFixed(2)}%`,
        good,
        key: Date.now(),
      })
    }
    onChange()
    if (r.done) onEnd()
  }

  useEffect(() => {
    if (!cheer) return
    const t = window.setTimeout(() => setCheer((c) => (c?.key === cheer.key ? null : c)), 1200)
    return () => window.clearTimeout(t)
  }, [cheer])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') { e.preventDefault(); handle('HOLD') }
      else if (e.key === 'b' || e.key === 'B') handle('LONG')
      else if (e.key === 's' || e.key === 'S') handle('SHORT')
      else if (e.key === 'f' || e.key === 'F') handle('FLAT')
      else if (e.key === 'h' || e.key === 'H') handle('HOLD')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="h-screen flex flex-col">
      <header className="px-6 py-3 border-b border-[#252a36] flex items-center justify-between bg-[#12151c]">
        <div className="flex items-center gap-6">
          <h1 className="font-bold text-lg">🦆 주식을 이겨라!</h1>
          <div className="flex items-center gap-3 text-sm">
            <PositionBadge pos={pos} />
            <span className="text-[#8b93a7]">
              라운드 <span className="text-[#e5e7eb] font-mono">{currentRound}/{game.roundCount}</span>
            </span>
            <span className="text-[#8b93a7]">+{game.roundSize}d/회</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <Stat label="현재가" value={`$${price.toFixed(2)}`} />
          <Stat label="현금" value={`$${game.cash.toFixed(2)}`} />
          <Stat label="보유" value={`${game.shares.toFixed(4)}`} />
          <Stat label="평가" value={`$${equity.toFixed(2)}`} />
          <Stat
            label="수익률"
            value={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}
            color={pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
        </div>
      </header>

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
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none animate-cheer text-6xl md:text-7xl font-extrabold drop-shadow-2xl ${
              cheer.good ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {cheer.text}
          </div>
        )}
      </main>

      <footer className="px-6 py-4 border-t border-[#252a36] bg-[#12151c] flex items-center gap-3 flex-wrap">
        <span className="text-xs text-[#8b93a7] uppercase tracking-widest mr-2">
          다음 라운드 포지션
        </span>
        <div className="flex-1" />

        <Decide onClick={() => handle('LONG')}  active={pos === 'LONG'}
          bg="bg-emerald-500 hover:bg-emerald-400" label="롱 (B)" />
        <Decide onClick={() => handle('SHORT')} active={pos === 'SHORT'}
          bg="bg-amber-500 hover:bg-amber-400" label="숏 (S)" />
        <Decide onClick={() => handle('FLAT')}  active={pos === 'FLAT'}
          bg="bg-slate-500 hover:bg-slate-400" label="플랫 (F)" />
        <Decide onClick={() => handle('HOLD')}  active={false}
          bg="bg-indigo-500 hover:bg-indigo-400" label={`홀드 +${game.roundSize}d (Space)`} />
      </footer>
    </div>
  )
}

function Decide({
  onClick, active, bg, label,
}: { onClick: () => void; active: boolean; bg: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-lg text-white font-semibold transition ${bg} ${
        active ? 'ring-2 ring-white/40' : ''
      }`}
    >
      {label}
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

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-[10px] text-[#8b93a7] uppercase tracking-wider">{label}</span>
      <span className={`font-mono text-sm ${color ?? 'text-[#e5e7eb]'}`}>{value}</span>
    </div>
  )
}
