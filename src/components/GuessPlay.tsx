import { useEffect, useMemo, useState } from 'react'
import { Chart } from './Chart'
import { type GuessChart, type GuessGameState, submitGuess } from '../lib/guess'
import { CHART_COLORS, type ThemeKey } from '../lib/theme'
import { playDing } from '../lib/sfx'

interface Props {
  game: GuessGameState
  onChange: () => void
  onEnd: () => void
  themeKey?: ThemeKey
}

const REVEAL_MS = 2800

interface RevealState {
  chart: GuessChart
  chartIdx: number      // 답한 문제의 인덱스 (0-based)
  correct: boolean
  guessUp: boolean
  actualUp: boolean
  fromPrice: number
  toPrice: number
  pctChange: number
  done: boolean
  key: number
  timer: number
}

export function GuessPlay({ game, onChange, onEnd, themeKey = 'dark' }: Props) {
  const cc = CHART_COLORS[themeKey]
  const [reveal, setReveal] = useState<RevealState | null>(null)

  // 답 고른 직후엔 방금 답한 차트를 계속 보여준다 — game.step은 이미 증가한 상태.
  const activeChart: GuessChart | undefined = reveal ? reveal.chart : game.charts[game.step]
  const activeIdx = reveal ? reveal.chartIdx : game.step

  const candles = useMemo(() => {
    if (!activeChart) return []
    if (reveal) return [...activeChart.warmup, ...activeChart.future]
    return activeChart.warmup
  }, [activeChart, reveal])

  const finishReveal = (r: RevealState) => {
    window.clearTimeout(r.timer)
    setReveal(null)
    if (r.done) onEnd()
    else onChange()
  }

  const handle = (up: boolean) => {
    if (reveal) return
    const ch = game.charts[game.step]
    if (!ch) return
    const chartIdx = game.step
    const fromPrice = ch.warmup[ch.warmup.length - 1].close
    const toPrice = ch.future[ch.future.length - 1].close
    const pctChange = ((toPrice - fromPrice) / fromPrice) * 100
    const r = submitGuess(game, up)
    playDing(r.correct)
    const key = Date.now()
    const timer = window.setTimeout(() => {
      setReveal((cur) => {
        if (cur?.key !== key) return cur
        if (r.done) onEnd()
        else onChange()
        return null
      })
    }, REVEAL_MS)
    setReveal({
      chart: ch,
      chartIdx,
      correct: r.correct,
      guessUp: up,
      actualUp: ch.answerUp,
      fromPrice,
      toPrice,
      pctChange,
      done: r.done,
      key,
      timer,
    })
    onChange()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (reveal) return
      if (e.key === 'ArrowUp' || e.key === 'b' || e.key === 'B') handle(true)
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') handle(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!activeChart) return null

  const answered = game.correct.length
  const correctSoFar = game.correct.filter(Boolean).length
  const runningRate = answered > 0 ? (correctSoFar / answered) * 100 : 0
  const progressPct = (answered / game.charts.length) * 100

  return (
    <div className="h-screen flex flex-col" style={{ background: cc.bg, color: cc.primaryText }}>
      <header
        className="px-3 sm:px-6 py-2 sm:py-4 border-b flex items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: cc.panelBorder, background: cc.headerBg }}
      >
        <div className="flex items-center gap-2 sm:gap-5 flex-wrap">
          <h1 className="font-bold text-base sm:text-lg">🎯 다음날 맞추기</h1>
          <span className="text-xs sm:text-sm" style={{ color: cc.mutedText }}>
            문제 <span className="font-mono font-bold" style={{ color: cc.primaryText }}>{activeIdx + 1}/{game.charts.length}</span>
          </span>
          <span className="text-xs sm:text-sm" style={{ color: cc.mutedText }}>
            정답 <span className="font-mono font-bold text-emerald-400">{correctSoFar}</span>
            <span className="mx-1">/</span>
            <span className="font-mono">{answered}</span>
            {answered > 0 && (
              <span className={`ml-2 font-mono font-bold ${runningRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                {runningRate.toFixed(0)}%
              </span>
            )}
          </span>
        </div>
        <div className="text-[10px] sm:text-xs font-mono" style={{ color: cc.mutedText }}>
          종목은 끝난 후 공개
        </div>
      </header>

      <div className="px-3 sm:px-6 py-2 border-b" style={{ background: cc.bg, borderColor: cc.panelBorder }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex-1 h-2 sm:h-3 rounded-full overflow-hidden border"
            style={{ background: cc.bg, borderColor: cc.panelBorder }}
          >
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span
            className="text-[10px] sm:text-xs font-mono w-14 sm:w-20 text-right"
            style={{ color: cc.primaryText }}
          >
            {answered} / {game.charts.length}
          </span>
        </div>
      </div>

      <main className="flex-1 min-h-0 relative">
        <Chart candles={candles} trades={[]} hideIndicators themeKey={themeKey} />
        {reveal && (
          <div
            key={reveal.key}
            className={`absolute top-3 left-1/2 -translate-x-1/2 select-none z-30 animate-pnl-pop rounded-2xl px-4 py-3 sm:px-6 sm:py-4 backdrop-blur border-2 shadow-xl ${
              reveal.correct
                ? 'bg-emerald-500/30 border-emerald-400/80 text-emerald-100'
                : 'bg-red-500/30 border-red-400/80 text-red-100'
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="text-3xl sm:text-5xl font-black leading-none">
                {reveal.correct ? '🎯 정답!' : '❌ 오답!'}
              </div>
              <div className="text-left leading-tight">
                <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold opacity-70">
                  {game.horizon.days}거래일 뒤 실제
                </div>
                <div className={`font-mono font-black text-lg sm:text-2xl ${reveal.actualUp ? 'text-emerald-200' : 'text-red-200'}`}>
                  {reveal.actualUp ? '📈 상승' : '📉 하락'} {reveal.pctChange >= 0 ? '+' : ''}{reveal.pctChange.toFixed(2)}%
                </div>
                <div className="text-[10px] sm:text-xs font-mono opacity-80">
                  ${reveal.fromPrice.toFixed(2)} → ${reveal.toPrice.toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => finishReveal(reveal)}
                className="ml-1 sm:ml-2 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 bg-black/40 hover:bg-black/60 border border-white/30 text-white text-xs sm:text-sm font-bold transition active:scale-95"
              >
                {reveal.done ? '결과 →' : '다음 →'}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer
        className="px-3 sm:px-6 py-2 sm:py-4 border-t"
        style={{ borderColor: cc.panelBorder, background: cc.headerBg }}
      >
        <div
          className="text-[10px] sm:text-xs uppercase tracking-widest mb-2 font-bold text-center"
          style={{ color: cc.mutedText }}
        >
          <span className="text-amber-300">{game.horizon.days}거래일({game.horizon.label})</span> 뒤 종가는{' '}
          <span className="text-amber-300">올라갈까? 내려갈까?</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={() => handle(true)}
            disabled={!!reveal}
            className="rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 sm:p-5 font-black text-lg sm:text-2xl transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <span>📈 오른다</span>
            <kbd className="hidden sm:inline text-[10px] font-mono font-bold bg-black/30 border border-white/20 px-1.5 py-0.5 rounded">B / ↑</kbd>
          </button>
          <button
            onClick={() => handle(false)}
            disabled={!!reveal}
            className="rounded-lg sm:rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 sm:p-5 font-black text-lg sm:text-2xl transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <span>📉 내린다</span>
            <kbd className="hidden sm:inline text-[10px] font-mono font-bold bg-black/30 border border-white/20 px-1.5 py-0.5 rounded">S / ↓</kbd>
          </button>
        </div>
      </footer>
    </div>
  )
}
