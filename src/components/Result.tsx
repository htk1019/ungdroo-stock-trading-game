import { useEffect, useMemo, useRef, useState } from 'react'
import { computeStats, type GameState, INTERVAL_LABEL } from '../lib/engine'
import { findTicker } from '../lib/tickers'
import { EquityChart } from './EquityChart'
import { Chart } from './Chart'
import { playWin, playLose, playMeh, playTotalDefeat, playPerfectWin } from '../lib/sfx'
import { recordHighScore, addRecentGame } from '../lib/highscore'
import { submitScore, fetchTopScores, computeScore, type LeaderboardRow } from '../lib/leaderboard'
import { CHART_COLORS, type ThemeKey } from '../lib/theme'
import { simulateAnalysts, type AnalystSimResult } from '../lib/simulate'

interface ResultProps {
  game: GameState
  onReplay: () => void
  nickname: string
  themeKey?: ThemeKey
}

export function Result({ game, onReplay, nickname, themeKey = 'dark' }: ResultProps) {
  const cc = CHART_COLORS[themeKey]
  const stats = useMemo(() => computeStats(game), [game])
  const info = findTicker(game.symbol)

  const times = useMemo(() => {
    const ts: number[] = []
    ts.push(game.warmup[game.warmup.length - 1].time)
    for (let i = 0; i < game.step; i++) ts.push(game.reveal[i].time)
    return ts
  }, [game])

  const startDate = new Date(game.warmup[0].time * 1000).toISOString().slice(0, 10)
  const endDate = new Date(game.reveal[game.reveal.length - 1].time * 1000).toISOString().slice(0, 10)

  const beatBM = stats.alphaPct >= 0
  const profitable = stats.returnPct > 0
  const beat = beatBM && profitable
  const bothFail = !beatBM && !profitable
  const mixed = !beat && !bothFail
  const verdict: 'win' | 'mixed' | 'lose' | 'total-defeat' = beat
    ? 'win'
    : mixed
      ? 'mixed'
      : (bothFail && stats.winRate <= 30)
        ? 'total-defeat'
        : 'lose'
  const perfect = verdict === 'win' && stats.winRate >= 90
  const verdictImg = perfect ? '/perfect-win.png' : verdict === 'win' ? '/happy.png' : verdict === 'total-defeat' ? '/total-defeat.png' : verdict === 'lose' ? '/sad.png' : '/meh.png'
  const verdictAlt = perfect ? '완벽승리' : verdict === 'win' ? '승리' : verdict === 'total-defeat' ? '완전패배' : verdict === 'lose' ? '패배' : '애매'
  const verdictLabel = perfect ? '👑 완벽승리!' : verdict === 'win' ? '승리!' : verdict === 'total-defeat' ? '💀 완전패배!!!' : verdict === 'lose' ? '패배…' : '애매…'
  const verdictBorder = verdict === 'win' ? 'border-emerald-500/40' : (verdict === 'lose' || verdict === 'total-defeat') ? 'border-red-500/40' : 'border-amber-500/40'
  const verdictAnim = verdict === 'win' ? 'animate-bounce-slow' : (verdict === 'lose' || verdict === 'total-defeat') ? 'animate-shake' : ''
  const verdictLabelCls = verdict === 'win'
    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
    : (verdict === 'lose' || verdict === 'total-defeat')
      ? 'bg-red-500/15 border-red-500/60 text-red-300'
      : 'bg-amber-500/15 border-amber-500/60 text-amber-300'
  const verdictMsgCls = verdict === 'win'
    ? 'text-emerald-200'
    : (verdict === 'lose' || verdict === 'total-defeat')
      ? 'text-red-200'
      : 'text-amber-200'
  const verdictMsg = verdict === 'win'
    ? `🎉 절대수익 +${stats.returnPct.toFixed(2)}% & B&H 대비 +${stats.alphaPct.toFixed(2)}%p — 둘 다 이겼습니다.`
    : verdict === 'total-defeat'
      ? `💀 완전패배 — 돈도 잃고(${stats.returnPct.toFixed(2)}%) B&H에도 뒤지고 승률 ${stats.winRate.toFixed(1)}%... 이건 너무한 거 아니냐고.`
      : verdict === 'lose'
        ? `📉 패배 — 돈도 잃고(${stats.returnPct.toFixed(2)}%) B&H에도 뒤졌습니다(${stats.alphaPct.toFixed(2)}%p).`
        : !profitable
          ? `🤔 애매 — B&H는 이겼지만(${stats.alphaPct >= 0 ? '+' : ''}${stats.alphaPct.toFixed(2)}%p) 절대수익이 마이너스(${stats.returnPct.toFixed(2)}%)입니다.`
          : `🤔 애매 — 돈은 벌었지만(+${stats.returnPct.toFixed(2)}%) B&H에 뒤졌습니다(${stats.alphaPct.toFixed(2)}%p).`

  useEffect(() => {
    if (perfect) playPerfectWin()
    else if (verdict === 'win') playWin()
    else if (verdict === 'mixed') playMeh()
    else if (verdict === 'total-defeat') playTotalDefeat()
    else playLose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const analystResults = useMemo(() => simulateAnalysts(game), [game])
  const [selectedAnalyst, setSelectedAnalyst] = useState<number | null>(null)

  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [scoreHelpOpen, setScoreHelpOpen] = useState(false)
  const submitted = useRef(false)
  useEffect(() => {
    if (submitted.current) return
    submitted.current = true
    const entry = {
      cagrPct: stats.cagrPct,
      symbol: game.symbol,
      symbolName: info?.name,
      at: Date.now(),
    }
    recordHighScore(entry)
    addRecentGame(entry)
    // Only submit if alpha is positive (beat B&H)
    if (nickname.trim() && stats.alphaCagrPct >= 0) {
      const round2 = (x: number) => Math.round(x * 100) / 100
      const cagrR = round2(stats.cagrPct)
      const alphaR = round2(stats.alphaCagrPct)
      const mddR = round2(stats.maxDrawdownPct)
      const winR = round2(stats.winRateByRound)
      submitScore({
        nickname: nickname.trim(),
        cagrPct: cagrR,
        alphaPct: alphaR,
        mddPct: mddR,
        winRatePct: winR,
        score: computeScore({
          alphaPct: alphaR,
          cagrPct: cagrR,
          winRatePct: winR,
          mddPct: mddR,
          rounds: game.roundCount,
        }),
        symbol: game.symbol,
        symbolName: info?.name,
        rounds: game.roundCount,
        trades: game.trades.length,
        createdAt: null,
      }).then(() => {
        fetchTopScores(10).then(setLeaderboard).catch(console.error)
      }).catch(console.error)
    } else {
      fetchTopScores(10).then(setLeaderboard).catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen p-3 sm:p-6 flex flex-col gap-3 sm:gap-4" style={{ background: cc.bg, color: cc.primaryText }}>
      {/* ── Header ── */}
      <header className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-5">
          <img
            src={verdictImg}
            alt={verdictAlt}
            className={`w-20 h-20 sm:w-28 sm:h-28 object-contain rounded-xl border ${verdictBorder} ${verdictAnim}`}
            style={{ background: cc.panelBg }}
            draggable={false}
          />
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-1 sm:mb-2">
              <div className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border text-xl sm:text-3xl font-extrabold tracking-wider ${verdictLabelCls}`}>
                {verdictLabel}
              </div>
              <span className={`text-xs sm:text-sm font-semibold ${verdictMsgCls}`}>
                {verdictMsg}
              </span>
            </div>
            <p className="text-xs sm:text-base" style={{ color: cc.mutedText }}>
              <span className="font-semibold" style={{ color: cc.primaryText }}>{info?.name ?? game.symbol}</span>
              <span className="ml-2 text-[10px] sm:text-xs px-2 py-0.5 rounded" style={{ background: cc.panelBg }}>{game.symbol}</span>
              <span className="block sm:inline sm:ml-3 mt-1 sm:mt-0">{INTERVAL_LABEL[game.interval]} · {startDate} ~ {endDate}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onReplay}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm sm:text-base"
          >
            다시 도전
          </button>
        </div>
      </header>

      {/* ── Stats cards ── full-width compact grid */}
      <section className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <Card label="내 수익률" value={fmtPct(stats.returnPct)} accent={stats.returnPct >= 0 ? 'up' : 'down'} cc={cc} />
        <Card label="B&H 수익률" value={fmtPct(stats.buyHoldReturnPct)} accent={stats.buyHoldReturnPct >= 0 ? 'up' : 'down'} cc={cc} />
        <Card label="알파" value={fmtPct(stats.alphaPct)} accent={beat ? 'up' : 'down'} cc={cc} />
        <Card label={`CAGR (${stats.years.toFixed(1)}년)`} value={fmtPct(stats.cagrPct)} accent={stats.cagrPct >= 0 ? 'up' : 'down'} cc={cc} />
        <Card label="MDD" value={`${stats.maxDrawdownPct.toFixed(2)}%`} accent="down" cc={cc} />
        <Card label="샤프" value={stats.sharpe.toFixed(2)} cc={cc} />
        <Card label="승률 (포지션)" value={`${stats.winRate.toFixed(1)}%`} cc={cc} />
        <Card label="승률 (라운드)" value={`${stats.winRateByRound.toFixed(1)}%`} cc={cc} />
        <Card label="총 거래" value={`${stats.trades}회`} cc={cc} />
      </section>

      {/* ── 훈수꾼 복기 ── */}
      <section>
        <div className="text-sm font-bold mb-2" style={{ color: cc.mutedText }}>
          🔮 훈수꾼들은 어땠을까?
        </div>
        <div className="grid grid-cols-5 gap-2">
          {analystResults.map((a, i) => {
            const beatPlayer = a.returnPct > stats.returnPct
            const selected = selectedAnalyst === i
            return (
              <button
                key={a.name}
                onClick={() => setSelectedAnalyst(selected ? null : i)}
                className={`rounded-lg p-2 sm:p-3 border text-center transition active:scale-95 ${selected ? 'ring-2 ring-amber-400' : ''}`}
                style={{ background: cc.panelBg, borderColor: cc.panelBorder }}
              >
                <div className="text-2xl sm:text-3xl">{a.emoji}</div>
                <div className="text-[10px] sm:text-xs font-bold mt-1" style={{ color: cc.primaryText }}>{a.name}</div>
                <div className={`text-xs sm:text-sm font-mono font-bold mt-0.5 ${a.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtPct(a.returnPct)}
                </div>
                <div className={`text-[9px] sm:text-[10px] font-mono ${beatPlayer ? 'text-amber-300' : 'text-emerald-300/60'}`}>
                  {beatPlayer ? '😏 나보다 잘함' : '😌 내가 이김'}
                </div>
              </button>
            )
          })}
        </div>
        {selectedAnalyst !== null && (
          <AnalystDetail
            analyst={analystResults[selectedAnalyst]}
            playerReturn={stats.returnPct}
            times={times}
            playerCurve={game.equityCurve}
            buyHoldCurve={game.buyHoldCurve}
            cc={cc}
          />
        )}
      </section>

      {/* ── Replay chart ── */}
      <ReplaySection
        game={game}
        hideVolume={findTicker(game.symbol)?.category === 'index'}
        className="flex flex-col"
        chartClass="h-[55vh] sm:h-[60vh]"
        themeKey={themeKey}
        cc={cc}
      />

      {/* ── Bottom row: Equity | Trade log | Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Equity chart */}
        <section className="h-64 lg:h-72 rounded-xl overflow-hidden border" style={{ background: cc.panelBg, borderColor: cc.panelBorder }}>
          <EquityChart times={times} player={game.equityCurve} buyHold={game.buyHoldCurve} />
        </section>

        {/* Trade log */}
        <section className="rounded-xl overflow-hidden flex flex-col border" style={{ background: cc.panelBg, borderColor: cc.panelBorder }}>
          <div className="px-3 py-2 text-sm border-b shrink-0" style={{ color: cc.mutedText, borderColor: cc.panelBorder }}>
            거래 내역 ({game.trades.length})
          </div>
          <div className="flex-1 min-h-0 overflow-auto max-h-64 lg:max-h-none">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="text-[10px] uppercase sticky top-0" style={{ color: cc.mutedText, background: cc.panelBg }}>
                <tr>
                  <th className="text-left px-2 py-1.5">#</th>
                  <th className="text-left px-2 py-1.5">날짜</th>
                  <th className="text-left px-2 py-1.5">구분</th>
                  <th className="text-right px-2 py-1.5">가격</th>
                  <th className="text-right px-2 py-1.5">수수료</th>
                </tr>
              </thead>
              <tbody>
                {game.trades.map((tr, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: cc.gridLine }}>
                    <td className="px-2 py-1.5" style={{ color: cc.mutedText }}>{i + 1}</td>
                    <td className="px-2 py-1.5">{new Date(tr.time * 1000).toISOString().slice(0, 10)}</td>
                    <td className={`px-2 py-1.5 font-semibold ${tr.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tr.side}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono">${tr.price.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-mono" style={{ color: cc.mutedText }}>${tr.fee.toFixed(2)}</td>
                  </tr>
                ))}
                {game.trades.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center" style={{ color: cc.mutedText }}>매매 기록 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="rounded-xl overflow-hidden flex flex-col border border-amber-500/30" style={{ background: cc.panelBg }}>
          <div className="px-3 py-2 text-sm text-amber-300 font-bold border-b border-amber-500/20 shrink-0 flex items-center gap-1.5">
            <span>🏆 점수 랭킹</span>
            <button
              type="button"
              onClick={() => setScoreHelpOpen(true)}
              className="w-5 h-5 rounded-full border border-amber-400/50 text-[10px] font-bold text-amber-300 hover:bg-amber-400/20 hover:border-amber-400 transition"
              aria-label="점수 계산 방법"
              title="점수 계산 방법"
            >?</button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto max-h-64 lg:max-h-none">
            {leaderboard.length > 0 ? (
              <table className="w-full text-xs whitespace-nowrap">
                <thead className="text-[10px] uppercase sticky top-0" style={{ color: cc.mutedText, background: cc.panelBg }}>
                  <tr>
                    <th className="text-center px-2 py-1.5">#</th>
                    <th className="text-left px-2 py-1.5">닉네임</th>
                    <th className="text-right px-2 py-1.5">점수</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => {
                    const isMe = row.nickname === nickname.trim()
                    return (
                      <tr
                        key={i}
                        className={`border-t ${isMe ? 'bg-amber-500/10' : ''}`}
                        style={{ borderColor: cc.gridLine }}
                      >
                        <td className="text-center px-2 py-1.5 font-bold">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className={`px-2 py-1.5 font-bold truncate max-w-[100px] ${isMe ? 'text-amber-300' : ''}`}>
                          {row.nickname}
                        </td>
                        <td className={`px-2 py-1.5 text-right font-mono font-bold ${row.score >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {row.score >= 0 ? '+' : ''}{row.score.toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-full text-xs py-8" style={{ color: cc.mutedText }}>
                아직 기록이 없습니다
              </div>
            )}
          </div>
        </section>
      </div>
      {scoreHelpOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setScoreHelpOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#12151c] border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-[#e5e7eb]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-extrabold text-amber-300">🏆 점수 계산 방법</h2>
              <button
                onClick={() => setScoreHelpOpen(false)}
                className="text-[#8b93a7] hover:text-white text-2xl leading-none"
                aria-label="닫기"
              >×</button>
            </div>
            <div className="space-y-3 text-sm leading-relaxed">
              <div className="font-mono text-center text-amber-200 bg-black/40 rounded-lg py-3 px-3 border border-amber-500/20 text-[12px]">
                <div className="mb-1 text-[11px] text-amber-300/80">점수 =</div>
                <div>( 1.0×알파 + 0.3×CAGR</div>
                <div>+ 0.5×(승률−50) + 0.3×MDD )</div>
                <div className="mt-1">× √라운드</div>
              </div>
              <p>
                야구의 <b className="text-amber-300">WAR</b>처럼 여러 요소를 한 점수로 합칩니다.
                각 지표는 연율(%) 또는 %포인트 단위.
              </p>
              <ul className="space-y-1.5 text-[13px] text-[#c9cdd6] list-disc list-inside">
                <li>
                  <b className="text-emerald-300">알파(연)</b> × 1.0 — 벤치마크(Buy&Hold) 대비 초과수익.
                  핵심 실력.
                </li>
                <li>
                  <b className="text-emerald-300">CAGR(연)</b> × 0.3 — 절대 수익률 보정.
                </li>
                <li>
                  <b className="text-emerald-300">(승률 − 50)</b> × 0.5 — 동전던지기 대비 일관성.
                  40% 승률이면 −5점, 60%면 +5점.
                </li>
                <li>
                  <b className="text-red-300">MDD</b> × 0.3 — 최대낙폭은 음수라 자동 페널티.
                  −20% 드로다운 = −6점.
                </li>
                <li>
                  <b className="text-sky-300">√라운드</b> — 표본크기 보정.
                  5라운드 한방보다 100라운드 꾸준함을 10배 가중.
                </li>
              </ul>
              <p className="text-xs text-[#8b93a7]">
                알파가 음수이면 랭킹에 등록되지 않습니다 (Buy&Hold 이긴 기록만 올라감).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({
  label, value, accent, cc,
}: { label: string; value: string; accent?: 'up' | 'down'; cc: import('../lib/theme').ChartColors }) {
  const color = accent === 'up' ? 'text-emerald-400' : accent === 'down' ? 'text-red-400' : ''
  return (
    <div className="rounded-lg p-2 sm:p-3 border" style={{ background: cc.panelBg, borderColor: cc.panelBorder }}>
      <div className="text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5" style={{ color: cc.mutedText }}>{label}</div>
      <div className={`text-sm sm:text-lg font-mono font-semibold ${color}`} style={color ? undefined : { color: cc.primaryText }}>{value}</div>
    </div>
  )
}

function ReplaySection({
  game, hideVolume, className = '', chartClass = 'h-[70vh] sm:h-[75vh]', themeKey = 'dark', cc,
}: {
  game: GameState
  hideVolume: boolean
  className?: string
  chartClass?: string
  themeKey?: ThemeKey
  cc: import('../lib/theme').ChartColors
}) {
  const [open, setOpen] = useState(true)
  const allCandles = useMemo(
    () => [...game.warmup, ...game.reveal.slice(0, game.step)],
    [game.warmup, game.reveal, game.step],
  )

  return (
    <section className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition text-sm font-bold shrink-0"
        style={{ background: cc.panelBg, borderColor: cc.panelBorder, color: cc.primaryText }}
      >
        <span className="flex items-center gap-2">
          <span>복기 모드</span>
          <span className="text-xs font-normal" style={{ color: cc.mutedText }}>— 전체 차트 + 매매 포인트</span>
        </span>
        <span className="transition-transform" style={{ color: cc.mutedText, transform: open ? 'rotate(180deg)' : '' }}>▾</span>
      </button>
      {open && (
        <div className={`mt-2 rounded-xl overflow-hidden border ${chartClass}`} style={{ background: cc.panelBg, borderColor: cc.panelBorder }}>
          <Chart candles={allCandles} trades={game.trades} hideVolume={hideVolume} hideIndicators themeKey={themeKey} />
        </div>
      )}
    </section>
  )
}

function AnalystDetail({
  analyst, playerReturn, times, playerCurve, buyHoldCurve, cc,
}: {
  analyst: AnalystSimResult
  playerReturn: number
  times: number[]
  playerCurve: number[]
  buyHoldCurve: number[]
  cc: import('../lib/theme').ChartColors
}) {
  const delta = analyst.returnPct - playerReturn
  const beatMe = delta > 0
  const SIDE_LABEL: Record<string, string> = { BUY: '매수', SELL: '매도', SHORT: '공매도', COVER: '환매' }
  const SIDE_COLOR: Record<string, string> = { BUY: 'text-emerald-400', SELL: 'text-red-400', SHORT: 'text-amber-400', COVER: 'text-blue-400' }

  const comment = beatMe
    ? analyst.returnPct >= 0
      ? `${analyst.name}: "그러니까 내 말을 들었어야지 ㅋㅋ"`
      : `${analyst.name}: "나도 졌지만 너보단 낫잖아..."`
    : analyst.returnPct >= 0
      ? `${analyst.name}: "흠... 인정한다. 이번엔 네가 잘했다."`
      : `${analyst.name}: "우리 둘 다 망했구나... ㅎㅎ"`

  return (
    <div className="mt-3 rounded-xl border overflow-hidden" style={{ background: cc.panelBg, borderColor: cc.panelBorder }}>
      <div className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: cc.panelBorder }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{analyst.emoji}</span>
          <span className="font-bold" style={{ color: cc.primaryText }}>{analyst.name}</span>
          <span className={`text-sm font-mono font-bold ${analyst.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmtPct(analyst.returnPct)}
          </span>
          <span className={`text-xs font-mono ${beatMe ? 'text-amber-300' : 'text-emerald-300'}`}>
            (나와의 차이: {delta >= 0 ? '+' : ''}{delta.toFixed(2)}%p)
          </span>
        </div>
        <div className="text-xs italic" style={{ color: cc.mutedText }}>{comment}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* 수익 곡선 비교 */}
        <div className="h-48 sm:h-56">
          <EquityChart
            times={times}
            player={playerCurve}
            buyHold={buyHoldCurve}
            analyst={{ name: analyst.name, curve: analyst.equityCurve }}
          />
        </div>

        {/* 거래 내역 */}
        <div className="overflow-auto max-h-56 border-l" style={{ borderColor: cc.panelBorder }}>
          <table className="w-full text-xs whitespace-nowrap">
            <thead className="text-[10px] uppercase sticky top-0" style={{ color: cc.mutedText, background: cc.panelBg }}>
              <tr>
                <th className="text-left px-2 py-1.5">#</th>
                <th className="text-left px-2 py-1.5">날짜</th>
                <th className="text-left px-2 py-1.5">구분</th>
                <th className="text-right px-2 py-1.5">가격</th>
              </tr>
            </thead>
            <tbody>
              {analyst.trades.map((tr, i) => (
                <tr key={i} className="border-t" style={{ borderColor: cc.gridLine }}>
                  <td className="px-2 py-1" style={{ color: cc.mutedText }}>{i + 1}</td>
                  <td className="px-2 py-1">{new Date(tr.time * 1000).toISOString().slice(0, 10)}</td>
                  <td className={`px-2 py-1 font-semibold ${SIDE_COLOR[tr.side]}`}>{SIDE_LABEL[tr.side]}</td>
                  <td className="px-2 py-1 text-right font-mono">${tr.price.toFixed(2)}</td>
                </tr>
              ))}
              {analyst.trades.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center" style={{ color: cc.mutedText }}>매매 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}
