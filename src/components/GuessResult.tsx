import { useEffect, useMemo, useRef, useState } from 'react'
import { type GuessGameState, guessStats } from '../lib/guess'
import { Chart } from './Chart'
import { playWin, playLose, playMeh, playTotalDefeat, playPerfectWin } from '../lib/sfx'
import { CHART_COLORS, type ThemeKey } from '../lib/theme'
import { findTicker } from '../lib/tickers'

interface Props {
  game: GuessGameState
  onReplay: () => void
  themeKey?: ThemeKey
}

interface Verdict {
  img: string
  label: string
  msg: string
  cls: string
  play: () => void
}

// 20% 단위 승률 평가 — 이미지 재활용
function getVerdict(rate: number): Verdict {
  if (rate >= 100)
    return {
      img: '/perfect-win.png',
      label: '👑 완벽 적중!!!',
      msg: '20문제 전부 정답! 당신은 시장의 신.',
      cls: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300',
      play: playPerfectWin,
    }
  if (rate >= 80)
    return {
      img: '/happy.png',
      label: '🎯 승리!',
      msg: '승률 80% 이상 — 감이 좋다!',
      cls: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300',
      play: playWin,
    }
  if (rate >= 60)
    return {
      img: '/happy.png',
      label: '😎 괜찮아!',
      msg: '동전던지기보단 훨씬 낫다.',
      cls: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300',
      play: playWin,
    }
  if (rate >= 40)
    return {
      img: '/meh.png',
      label: '🤔 애매...',
      msg: '딱 동전던지기 수준.',
      cls: 'bg-amber-500/15 border-amber-500/60 text-amber-300',
      play: playMeh,
    }
  if (rate >= 20)
    return {
      img: '/sad.png',
      label: '📉 패배',
      msg: '차라리 반대로 찍는게 낫지 않을까?',
      cls: 'bg-red-500/15 border-red-500/60 text-red-300',
      play: playLose,
    }
  return {
    img: '/total-defeat.png',
    label: '💀 완전패배!!!',
    msg: '이건 너무한 거 아니냐고.',
    cls: 'bg-red-500/15 border-red-500/60 text-red-300',
    play: playTotalDefeat,
  }
}

export function GuessResult({ game, onReplay, themeKey = 'dark' }: Props) {
  const cc = CHART_COLORS[themeKey]
  const stats = useMemo(() => guessStats(game), [game])
  const verdict = useMemo(() => getVerdict(stats.winRate), [stats.winRate])
  const played = useRef(false)
  useEffect(() => {
    if (played.current) return
    played.current = true
    verdict.play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const opened = openIdx !== null ? game.charts[openIdx] : null

  return (
    <div
      className="min-h-screen p-3 sm:p-6 flex flex-col gap-3 sm:gap-4"
      style={{ background: cc.bg, color: cc.primaryText }}
    >
      <header className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-5">
          <img
            src={verdict.img}
            alt=""
            className="w-20 h-20 sm:w-28 sm:h-28 object-contain rounded-xl border"
            style={{ borderColor: cc.panelBorder, background: cc.panelBg }}
            draggable={false}
          />
          <div>
            <div
              className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border text-xl sm:text-3xl font-extrabold tracking-wider mb-1 ${verdict.cls}`}
            >
              {verdict.label}
            </div>
            <p className="text-sm sm:text-base font-semibold opacity-90">{verdict.msg}</p>
            <p className="mt-1 text-xs sm:text-sm" style={{ color: cc.mutedText }}>
              정답{' '}
              <span className="font-mono font-bold" style={{ color: cc.primaryText }}>
                {stats.wins} / {stats.total}
              </span>
              <span className="mx-2">·</span>
              승률{' '}
              <span
                className={`font-mono font-bold ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {stats.winRate.toFixed(0)}%
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={onReplay}
          className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm sm:text-base"
        >
          다시 도전
        </button>
      </header>

      <section className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {game.charts.map((c, i) => {
          const correct = game.correct[i]
          const guess = game.guesses[i]
          const isOpen = openIdx === i
          const info = findTicker(c.symbol)
          return (
            <button
              key={i}
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className={`rounded-lg p-2 border text-left transition active:scale-95 ${
                isOpen ? 'ring-2 ring-amber-400' : ''
              } ${correct ? 'border-emerald-500/40' : 'border-red-500/40'}`}
              style={{ background: cc.panelBg }}
            >
              <div
                className="flex items-center justify-between text-[10px] font-mono"
                style={{ color: cc.mutedText }}
              >
                <span>#{i + 1}</span>
                <span className={correct ? 'text-emerald-400' : 'text-red-400'}>
                  {correct ? '✓' : '✗'}
                </span>
              </div>
              <div
                className="text-[11px] sm:text-xs font-bold truncate"
                style={{ color: cc.primaryText }}
              >
                {info?.name ?? c.name}
              </div>
              <div className="text-[10px] font-mono" style={{ color: cc.mutedText }}>
                예측 {guess ? '📈' : '📉'} · 정답 {c.answerUp ? '📈' : '📉'}
              </div>
            </button>
          )
        })}
      </section>

      {opened && openIdx !== null && (
        <section
          className="rounded-xl overflow-hidden border"
          style={{ background: cc.panelBg, borderColor: cc.panelBorder }}
        >
          <div
            className="px-3 py-2 border-b flex items-center justify-between flex-wrap gap-2"
            style={{ borderColor: cc.panelBorder }}
          >
            <div className="text-sm font-bold">
              #{openIdx + 1} {findTicker(opened.symbol)?.name ?? opened.name}
              <span className="ml-2 text-xs font-mono" style={{ color: cc.mutedText }}>
                ({opened.symbol})
              </span>
            </div>
            <div className="text-xs font-mono">
              예측{' '}
              <span
                className={game.guesses[openIdx] ? 'text-emerald-400' : 'text-red-400'}
              >
                {game.guesses[openIdx] ? '📈 상승' : '📉 하락'}
              </span>
              <span className="mx-1" style={{ color: cc.mutedText }}>
                /
              </span>
              정답{' '}
              <span className={opened.answerUp ? 'text-emerald-400' : 'text-red-400'}>
                {opened.answerUp ? '📈 상승' : '📉 하락'}
              </span>
            </div>
          </div>
          <div className="h-[45vh] sm:h-[55vh]">
            <Chart
              candles={[...opened.warmup, ...opened.future]}
              trades={[]}
              hideIndicators
              themeKey={themeKey}
            />
          </div>
        </section>
      )}
    </div>
  )
}
