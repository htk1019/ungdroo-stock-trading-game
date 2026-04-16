import { useEffect, useMemo, useState } from 'react'
import {
  type GameState, type Decision,
  submitRound, currentPrice, equityAt, positionOf,
  STARTING_CASH,
} from '../lib/engine'
import { Chart } from './Chart'
import { HintModal } from './HintModal'
import { findTicker } from '../lib/tickers'
import { playDing, playCombo, playComboBreak } from '../lib/sfx'
import { getAdvice, type Analyst } from '../lib/advice'
import { CHART_COLORS, type ThemeKey } from '../lib/theme'

interface PlayProps {
  game: GameState
  onChange: () => void
  onEnd: () => void
  themeKey?: ThemeKey
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

const THEME_CHAR: Partial<Record<ThemeKey, string>> = {
  rainbow: '/char-rainbow.png',
}

const THEME_BG: Partial<Record<ThemeKey, string>> = {
  neon: '/bg-neon.png',
}

export function Play({ game, onChange, onEnd, themeKey = 'dark' }: PlayProps) {
  const cc = CHART_COLORS[themeKey]
  const charImg = THEME_CHAR[themeKey]
  const bgImg = THEME_BG[themeKey]
  const [flash, setFlash] = useState<string | null>(null)
  const [cheer, setCheer] = useState<{ dollars: number; pct: number; good: boolean; key: number } | null>(null)
  const [hintAnalysts, setHintAnalysts] = useState<Analyst[] | null>(null)
  const [combo, setCombo] = useState(0)
  const [comboDisplay, setComboDisplay] = useState<{ count: number; key: number } | null>(null)
  const [comboBroke, setComboBroke] = useState<{ lost: number; key: number } | null>(null)
  const [loseStreak, setLoseStreak] = useState(0)
  const [tiltDuck, setTiltDuck] = useState<{ streak: number; key: number } | null>(null)
  const [proverb, setProverb] = useState<{ text: string; key: number } | null>(null)
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
      if (good) {
        const next = combo + 1
        setCombo(next)
        if (next >= 3) {
          setComboDisplay({ count: next, key: Date.now() })
          playCombo(next)
        }
        setLoseStreak(0)
      } else {
        if (combo >= 3) {
          setComboBroke({ lost: combo, key: Date.now() })
          playComboBreak(combo)
        }
        setCombo(0)
        const nextLose = loseStreak + 1
        setLoseStreak(nextLose)
        if (nextLose >= 5) {
          setTiltDuck({ streak: nextLose, key: Date.now() })
        }
      }
    }
    if (r.ok) {
      setProverb({ text: getRandomProverb(), key: Date.now() })
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

  useEffect(() => {
    if (!comboDisplay) return
    const t = window.setTimeout(() => setComboDisplay((c) => (c?.key === comboDisplay.key ? null : c)), 2000)
    return () => window.clearTimeout(t)
  }, [comboDisplay])

  useEffect(() => {
    if (!comboBroke) return
    const t = window.setTimeout(() => setComboBroke((c) => (c?.key === comboBroke.key ? null : c)), 2000)
    return () => window.clearTimeout(t)
  }, [comboBroke])

  useEffect(() => {
    if (!tiltDuck) return
    const t = window.setTimeout(() => setTiltDuck((c) => (c?.key === tiltDuck.key ? null : c)), 3500)
    return () => window.clearTimeout(t)
  }, [tiltDuck])

  useEffect(() => {
    if (!proverb) return
    const t = window.setTimeout(() => setProverb((c) => (c?.key === proverb.key ? null : c)), 3500)
    return () => window.clearTimeout(t)
  }, [proverb])

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
      <div className="h-screen flex flex-row" style={bgImg ? { backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center bottom' } : { background: cc.bg }}>
        <main className="flex-1 min-h-0 relative">
          {charImg && (
            <img src={charImg} alt="" className="absolute bottom-4 right-4 w-24 sm:w-36 opacity-10 pointer-events-none select-none z-0" draggable={false} />
          )}
          <Chart candles={visibleCandles} trades={game.trades} hideVolume={hideVolume} themeKey={themeKey} />
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
          {proverb && <ProverbBanner text={proverb.text} proverbKey={proverb.key} />}
        </main>

        <aside className="w-44 shrink-0 border-l flex flex-col" style={{ borderColor: cc.panelBorder, background: cc.panelBg, color: cc.primaryText }}>
          <div className="px-2 py-1.5 border-b flex items-center justify-between gap-2" style={{ borderColor: cc.panelBorder }}>
            <h1 className="font-bold text-xs">🦆 4848</h1>
            <PositionBadge pos={pos} />
          </div>
          {combo >= 2 && (
            <div className="px-2 py-1 border-b" style={{ borderColor: cc.panelBorder }}>
              <ComboCounter count={combo} />
            </div>
          )}

          <div className="px-2 py-1 border-b text-[10px]" style={{ borderColor: cc.panelBorder }}>
            <div className="flex justify-between" style={{ color: cc.mutedText }}>
              <span>R {currentRound}/{game.roundCount}</span>
              <span className="font-mono" style={{ color: cc.primaryText }}>${price.toFixed(2)}</span>
            </div>
            <div className="h-1 mt-1 rounded-full overflow-hidden border" style={{ background: cc.bg, borderColor: cc.panelBorder }}>
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all"
                style={{ width: `${(currentRound / game.roundCount) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-2 py-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] border-b" style={{ borderColor: cc.panelBorder }}>
            <div className="flex justify-between col-span-2">
              <span style={{ color: cc.mutedText }}>현금</span>
              <span className="font-mono">${game.cash.toFixed(0)}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span style={{ color: cc.mutedText }}>평가</span>
              <span className="font-mono">${equity.toFixed(0)}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span style={{ color: cc.mutedText }}>BM</span>
              <span className="font-mono" style={{ color: cc.mutedText }}>${bmEquity.toFixed(0)}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span style={{ color: cc.mutedText }}>번돈</span>
              <span className={`font-mono font-bold ${earned >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {earned >= 0 ? '+' : ''}${earned.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between col-span-2">
              <span style={{ color: cc.mutedText }}>수익률</span>
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
        {comboDisplay && <ComboPopup count={comboDisplay.count} comboKey={comboDisplay.key} />}
        {comboBroke && <ComboBreakPopup lost={comboBroke.lost} breakKey={comboBroke.key} />}
        {tiltDuck && <TiltDuckPopup streak={tiltDuck.streak} tiltKey={tiltDuck.key} />}
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
    <div className="h-screen flex flex-col" style={bgImg ? { color: cc.primaryText, backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center bottom' } : { color: cc.primaryText }}>
      <header className="px-3 sm:px-6 py-2 sm:py-4 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: cc.panelBorder, background: cc.headerBg }}>
        <div className="flex items-center gap-2 sm:gap-5 flex-wrap">
          <h1 className="font-bold text-base sm:text-lg">🦆 4848</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <PositionBadge pos={pos} />
            <span style={{ color: cc.mutedText }}>
              <span className="hidden sm:inline">라운드 </span>
              <span className="font-mono" style={{ color: cc.primaryText }}>{currentRound}/{game.roundCount}</span>
            </span>
            <span className="hidden sm:inline" style={{ color: cc.mutedText }}>+{game.roundSize}d/회</span>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: cc.mutedText }}>현재가</span>
            <span className="font-mono text-sm sm:text-base font-bold" style={{ color: cc.primaryText }}>${price.toFixed(2)}</span>
          </div>
          <button
            onClick={requestHint}
            disabled={game.hintsRemaining <= 0}
            className="rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center gap-1 shadow transition active:scale-95"
            title="분석가들의 의견 보기"
          >
            🔮 훈수 <span className="font-mono opacity-80">({game.hintsRemaining})</span>
          </button>
        </div>
        <div className="flex items-center gap-3 sm:gap-8 flex-wrap">
          <ComboCounter count={combo} />
          <Stat label="현금" fullLabel="보유현금" value={`$${game.cash.toFixed(2)}`} mutedColor={cc.mutedText} />
          <Stat
            label="번돈"
            value={`${earned >= 0 ? '+' : ''}$${earned.toFixed(2)}`}
            color={earned >= 0 ? 'text-emerald-400' : 'text-red-400'}
            mutedColor={cc.mutedText}
          />
          <Stat label="평가" value={`$${equity.toFixed(2)}`} mutedColor={cc.mutedText} />
          <Stat label="BM" fullLabel="BM 금액" value={`$${bmEquity.toFixed(2)}`} mutedColor={cc.mutedText} />
          <Stat
            label="수익률"
            value={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}
            color={pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}
            mutedColor={cc.mutedText}
          />
        </div>
      </header>

      {/* Round progress bar */}
      <div className="px-3 sm:px-6 py-2 border-b" style={{ background: cc.bg, borderColor: cc.panelBorder }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest w-20" style={{ color: cc.mutedText }}>
            진행도
          </span>
          <div className="flex-1 h-2 sm:h-3 rounded-full overflow-hidden border" style={{ background: cc.bg, borderColor: cc.panelBorder }}>
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all"
              style={{ width: `${(currentRound / game.roundCount) * 100}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-mono w-14 sm:w-20 text-right" style={{ color: cc.primaryText }}>
            {currentRound} / {game.roundCount}
          </span>
        </div>
      </div>

      <main className="flex-1 min-h-0 relative">
        <Chart candles={visibleCandles} trades={game.trades} hideVolume={hideVolume} themeKey={themeKey} />
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
        {proverb && <ProverbBanner text={proverb.text} proverbKey={proverb.key} />}
        {comboDisplay && <ComboPopup count={comboDisplay.count} comboKey={comboDisplay.key} />}
        {comboBroke && <ComboBreakPopup lost={comboBroke.lost} breakKey={comboBroke.key} />}
        {tiltDuck && <TiltDuckPopup streak={tiltDuck.streak} tiltKey={tiltDuck.key} />}
      </main>

      <footer className="px-3 sm:px-6 py-2 sm:py-3 border-t" style={{ borderColor: cc.panelBorder, background: cc.headerBg }}>
        <div className="text-[10px] sm:text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: cc.mutedText }}>
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

const COMBO_LABELS: { min: number; label: string; emoji: string; color: string }[] = [
  { min: 10, label: 'LEGENDARY',  emoji: '👑', color: 'from-yellow-400 via-red-500 to-purple-600' },
  { min: 7,  label: 'UNSTOPPABLE', emoji: '🔥', color: 'from-orange-500 to-red-600' },
  { min: 5,  label: 'AMAZING',    emoji: '⚡', color: 'from-cyan-400 to-blue-600' },
  { min: 3,  label: 'NICE',       emoji: '✨', color: 'from-emerald-400 to-teal-600' },
]

function getComboInfo(count: number) {
  return COMBO_LABELS.find(l => count >= l.min) ?? COMBO_LABELS[COMBO_LABELS.length - 1]
}

const COMBO_BREAK_MSGS = [
  '아 ㅋㅋㅋㅋ',
  '콤보 끊김 ㅠㅠ',
  '여기까지였나...',
  '버블 붕괴!',
  '현실은 참혹하다',
  '그것은 꿈이었다',
  '다시 바닥부터...',
]

/* ── 주식 격언 (거래마다 하나씩 스쳐지나감) ── */
const PROVERBS = [
  // 진지한 투자 격언 30선
  '남들이 공포할 때 사라',
  '계란은 한 바구니에 담지 마라',
  '소문에 사고 뉴스에 팔아라',
  '떨어지는 칼날을 잡지 마라',
  '무릎에서 사서 어깨에서 팔아라',
  '손절은 빠를수록 좋다',
  '추세는 친구다',
  '현금이 왕이다',
  '욕심부리면 도살당한다',
  '복리의 마법을 믿어라',
  '아는 것에 투자하라',
  '이번엔 다르다는 가장 위험한 말이다',
  '타이밍보다 시간이 중요하다',
  '손실은 짧게, 이익은 길게',
  '시장은 생각보다 오래 미쳐있다',
  '10년 못 가질 주식은 사지 마라',
  '강세장은 비관에서 태어난다',
  '돈이 일하게 하라',
  '과거 수익이 미래를 보장 못한다',
  '분산이 곧 방어다',
  '위험 없다 느낄 때가 가장 위험하다',
  '수익률 말고 원칙을 쫓아라',
  '공포에 사고 환희에 팔아라',
  '첫 손절이 최선의 손절이다',
  '싸게 사는 것보다 오래 버텨라',
  '대중과 반대로 가라',
  '빚으로 투자하지 마라',
  '기다림도 투자다',
  '한 방은 없다, 꾸준함이 답이다',
  '최고의 투자는 자기 자신이다',
  // 웃긴 격언
  '뇌동매매는 나의 힘',
  '존버는 승리한다... 가끔',
  '풀매수 풀매도, 이것이 사나이',
  '오늘도 개미는 열심히 일합니다',
  '주식은 예술이다, 손실도 예술이다',
  '내가 사면 떨어지고 팔면 오른다',
  '차트를 보지 마라... 그래도 보게 된다',
  '분산투자? 그게 뭔데 먹는 건데?',
  '급등주를 잡으려다 내 계좌가 급락',
  '인생은 짧고 숏은 위험하다',
  '주식으로 천만 원 버는 법: 일억으로 시작한다',
  'Buy high, sell low. 이것이 도',
  '아 맞다 여기 게임이었지',
  '이 캔들은 좀 수상하다...',
  '기술적 분석: 별자리 운세의 금융 버전',
  '워렌 버핏도 처음엔 이랬을 거야 (아닐걸)',
  '이건 투자가 아니라 도박이다 (맞음)',
  '마음을 비우면 계좌도 비워진다',
  '형 이거 빚이야?',
  '반등 올 거야... 아마... 아마도...',
]

let lastProverbIdx = -1
function getRandomProverb(): string {
  let idx: number
  do { idx = Math.floor(Math.random() * PROVERBS.length) } while (idx === lastProverbIdx)
  lastProverbIdx = idx
  return PROVERBS[idx]
}

function ProverbBanner({ text, proverbKey }: { text: string; proverbKey: number }) {
  return (
    <div
      key={proverbKey}
      className="absolute top-10 sm:top-14 left-0 w-full pointer-events-none select-none z-20 flex justify-center animate-proverb-slide"
    >
      <div className="px-4 py-1.5 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white/80 text-xs sm:text-sm font-medium italic">
        "{text}"
      </div>
    </div>
  )
}

const TILT_MSGS: { min: number; msgs: string[] }[] = [
  { min: 10, msgs: [
    '이 바닥 접겠습니다',
    '어머니 죄송합니다',
    '내 인생 차트도 하락 추세',
    '주식 관두고 치킨집 알아보는 중',
    '유서 대신 손절일지 남깁니다',
  ]},
  { min: 7, msgs: [
    '사표 쓰러 갑니다',
    '하... 나 왜 태어났지',
    '엄마 나 주식 안 할게...',
    '다음 생에는 부자집 오리로',
    '영혼까지 물타기 하는 중',
  ]},
  { min: 5, msgs: [
    '퇴사하고 싶다...',
    '오늘은 여기까지인가...',
    '차라리 적금을 들걸',
    '눈물이 앞을 가린다',
    '월급루팡이 낫겠다',
  ]},
]

function getTiltMsg(streak: number) {
  const tier = TILT_MSGS.find(t => streak >= t.min) ?? TILT_MSGS[TILT_MSGS.length - 1]
  return tier.msgs[Math.floor(Math.random() * tier.msgs.length)]
}

function TiltDuckPopup({ streak, tiltKey }: { streak: number; tiltKey: number }) {
  const msg = useMemo(() => getTiltMsg(streak), [streak])
  const duckFace = streak >= 10 ? '🪦' : streak >= 7 ? '😭' : '😢'
  return (
    <div
      key={tiltKey}
      className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 pointer-events-none select-none z-30 animate-tilt-duck"
    >
      <div className="flex flex-col items-center gap-2">
        {/* 말풍선 */}
        <div className="relative bg-white/95 text-gray-800 rounded-2xl px-4 py-3 shadow-xl max-w-xs text-center">
          <div className="font-bold text-sm sm:text-base">{msg}</div>
          <div className="text-[10px] text-gray-400 mt-1">{streak}연패 달성</div>
          {/* 말풍선 꼬리 */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45" />
        </div>
        {/* 우는 오리 */}
        <div className="text-6xl sm:text-8xl animate-shake">
          {duckFace === '🪦' ? (
            <span>🦆🪦</span>
          ) : (
            <span className="relative">
              🦆
              <span className="absolute -top-2 -right-2 text-2xl">{duckFace}</span>
              {streak >= 7 && <span className="absolute -top-1 -left-2 text-lg">💧</span>}
              {streak >= 10 && <span className="absolute top-0 right-[-1.5rem] text-lg">💧</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ComboPopup({ count, comboKey }: { count: number; comboKey: number }) {
  const info = getComboInfo(count)
  return (
    <div
      key={comboKey}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-30 animate-combo-pop"
    >
      <div className={`text-center bg-gradient-to-r ${info.color} bg-clip-text text-transparent`}>
        <div className="text-4xl sm:text-6xl font-black drop-shadow-lg">
          {info.emoji} {info.label}! {info.emoji}
        </div>
        <div className="text-2xl sm:text-4xl font-black mt-1 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
          {count} COMBO
        </div>
      </div>
    </div>
  )
}

function ComboBreakPopup({ lost, breakKey }: { lost: number; breakKey: number }) {
  const msg = COMBO_BREAK_MSGS[Math.floor(Math.random() * COMBO_BREAK_MSGS.length)]
  return (
    <div
      key={breakKey}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-30 animate-combo-break"
    >
      <div className="text-center">
        <div className="text-3xl sm:text-5xl font-black text-red-400 drop-shadow-lg">
          💔 {lost}콤보 끊김!
        </div>
        <div className="text-lg sm:text-2xl font-bold text-red-300/80 mt-1">
          {msg}
        </div>
      </div>
    </div>
  )
}

function ComboCounter({ count }: { count: number }) {
  if (count < 2) return null
  const info = count >= 3 ? getComboInfo(count) : null
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
      info
        ? 'bg-gradient-to-r ' + info.color + ' border-white/30 text-white animate-pulse'
        : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
    }`}>
      <span>{count >= 3 ? '🔥' : '🌱'}</span>
      <span className="font-mono">{count} COMBO</span>
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

function Stat({ label, fullLabel, value, color, mutedColor }: { label: string; fullLabel?: string; value: string; color?: string; mutedColor?: string }) {
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5" style={{ color: mutedColor ?? '#8b93a7' }}>
        <span className="sm:hidden">{label}</span>
        <span className="hidden sm:inline">{fullLabel ?? label}</span>
      </span>
      <span className={`font-mono text-sm sm:text-2xl font-bold ${color ?? ''}`} style={color ? undefined : { color: mutedColor ? undefined : '#e5e7eb' }}>{value}</span>
    </div>
  )
}
