import { useEffect, useMemo, useRef, useState } from 'react'
import { computeStats, type GameState, INTERVAL_LABEL } from '../lib/engine'
import { findTicker } from '../lib/tickers'
import { EquityChart } from './EquityChart'
import { Chart } from './Chart'
import { playWin, playLose, playMeh } from '../lib/sfx'
import { recordHighScore, addRecentGame, type HighScore } from '../lib/highscore'
import { submitScore, fetchTopScores, type LeaderboardRow } from '../lib/leaderboard'

interface ResultProps {
  game: GameState
  onReplay: () => void
  nickname: string
}

export function Result({ game, onReplay, nickname }: ResultProps) {
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
  const verdict: 'win' | 'mixed' | 'lose' = beat ? 'win' : mixed ? 'mixed' : 'lose'
  const perfect = verdict === 'win' && stats.winRate >= 90
  const verdictImg = verdict === 'win' ? '/happy.png' : verdict === 'lose' ? '/sad.png' : '/meh.png'
  const verdictAlt = perfect ? '완벽승리' : verdict === 'win' ? '승리' : verdict === 'lose' ? '패배' : '애매'
  const verdictLabel = perfect ? '👑 완벽승리!' : verdict === 'win' ? '승리!' : verdict === 'lose' ? '패배…' : '애매…'
  const verdictBorder = verdict === 'win' ? 'border-emerald-500/40' : verdict === 'lose' ? 'border-red-500/40' : 'border-amber-500/40'
  const verdictAnim = verdict === 'win' ? 'animate-bounce-slow' : verdict === 'lose' ? 'animate-shake' : ''
  const verdictLabelCls = verdict === 'win'
    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
    : verdict === 'lose'
      ? 'bg-red-500/15 border-red-500/60 text-red-300'
      : 'bg-amber-500/15 border-amber-500/60 text-amber-300'
  const verdictMsgCls = verdict === 'win'
    ? 'text-emerald-200'
    : verdict === 'lose'
      ? 'text-red-200'
      : 'text-amber-200'
  const verdictMsg = verdict === 'win'
    ? `🎉 절대수익 +${stats.returnPct.toFixed(2)}% & B&H 대비 +${stats.alphaPct.toFixed(2)}%p — 둘 다 이겼습니다.`
    : verdict === 'lose'
      ? `📉 패배 — 돈도 잃고(${stats.returnPct.toFixed(2)}%) B&H에도 뒤졌습니다(${stats.alphaPct.toFixed(2)}%p).`
      : !profitable
        ? `🤔 애매 — B&H는 이겼지만(${stats.alphaPct >= 0 ? '+' : ''}${stats.alphaPct.toFixed(2)}%p) 절대수익이 마이너스(${stats.returnPct.toFixed(2)}%)입니다.`
        : `🤔 애매 — 돈은 벌었지만(+${stats.returnPct.toFixed(2)}%) B&H에 뒤졌습니다(${stats.alphaPct.toFixed(2)}%p).`

  useEffect(() => {
    if (verdict === 'win') playWin()
    else if (verdict === 'mixed') playMeh()
    else playLose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [hs, setHs] = useState<{ best: HighScore; isNew: boolean } | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
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
    setHs(recordHighScore(entry))
    addRecentGame(entry)
    if (nickname.trim()) {
      submitScore({
        nickname: nickname.trim(),
        returnPct: Math.round(stats.returnPct * 100) / 100,
        alphaPct: Math.round(stats.alphaPct * 100) / 100,
        symbol: game.symbol,
        symbolName: info?.name,
        rounds: game.roundCount,
        trades: game.trades.length,
        createdAt: null,
      }).then(() => {
        fetchTopScores(20).then(setLeaderboard).catch(console.error)
      }).catch(console.error)
    } else {
      fetchTopScores(20).then(setLeaderboard).catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen p-3 sm:p-6 flex flex-col gap-3 sm:gap-4">
      {/* ── Header ── */}
      <header className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-5">
          <img
            src={verdictImg}
            alt={verdictAlt}
            className={`w-20 h-20 sm:w-28 sm:h-28 object-contain rounded-xl bg-black/40 border ${verdictBorder} ${verdictAnim}`}
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
            <p className="text-[#8b93a7] text-xs sm:text-base">
              <span className="font-semibold text-[#e5e7eb]">{info?.name ?? game.symbol}</span>
              <span className="ml-2 text-[10px] sm:text-xs px-2 py-0.5 bg-[#1a1e27] rounded">{game.symbol}</span>
              <span className="block sm:inline sm:ml-3 mt-1 sm:mt-0">{INTERVAL_LABEL[game.interval]} · {startDate} ~ {endDate}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {hs && (
            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm ${
              hs.isNew
                ? 'bg-amber-500/15 border-amber-400/60 text-amber-200 animate-pulse'
                : 'bg-[#1a1e27] border-[#252a36] text-[#8b93a7]'
            }`}>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold">
                {hs.isNew ? '🏆 신기록! (연환산)' : '🏆 최고 기록 (연환산)'}
              </div>
              <div className={`font-mono font-black text-sm sm:text-lg ${
                hs.best.cagrPct >= 0 ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {hs.best.cagrPct >= 0 ? '+' : ''}{hs.best.cagrPct.toFixed(2)}%
              </div>
              <div className="text-[9px] sm:text-[10px] opacity-80 truncate max-w-[120px] sm:max-w-[160px]">
                {hs.best.symbolName ?? hs.best.symbol}
              </div>
            </div>
          )}
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
        <Card label="내 수익률" value={fmtPct(stats.returnPct)} accent={stats.returnPct >= 0 ? 'up' : 'down'} />
        <Card label="B&H 수익률" value={fmtPct(stats.buyHoldReturnPct)} accent={stats.buyHoldReturnPct >= 0 ? 'up' : 'down'} />
        <Card label="알파" value={fmtPct(stats.alphaPct)} accent={beat ? 'up' : 'down'} />
        <Card label={`CAGR (${stats.years.toFixed(1)}년)`} value={fmtPct(stats.cagrPct)} accent={stats.cagrPct >= 0 ? 'up' : 'down'} />
        <Card label="MDD" value={`${stats.maxDrawdownPct.toFixed(2)}%`} accent="down" />
        <Card label="샤프" value={stats.sharpe.toFixed(2)} />
        <Card label="승률 (포지션)" value={`${stats.winRate.toFixed(1)}%`} />
        <Card label="승률 (라운드)" value={`${stats.winRateByRound.toFixed(1)}%`} />
        <Card label="총 거래" value={`${stats.trades}회`} />
      </section>

      {/* ── Replay chart ── */}
      <ReplaySection
        game={game}
        hideVolume={findTicker(game.symbol)?.category === 'index'}
        className="flex flex-col"
        chartClass="h-[55vh] sm:h-[60vh]"
      />

      {/* ── Bottom row: Equity | Trade log | Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Equity chart */}
        <section className="h-64 lg:h-72 bg-[#12151c] border border-[#252a36] rounded-xl overflow-hidden">
          <EquityChart times={times} player={game.equityCurve} buyHold={game.buyHoldCurve} />
        </section>

        {/* Trade log */}
        <section className="bg-[#12151c] border border-[#252a36] rounded-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 text-sm text-[#8b93a7] border-b border-[#252a36] shrink-0">
            거래 내역 ({game.trades.length})
          </div>
          <div className="flex-1 min-h-0 overflow-auto max-h-64 lg:max-h-none">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="text-[10px] text-[#8b93a7] uppercase sticky top-0 bg-[#12151c]">
                <tr>
                  <th className="text-left px-2 py-1.5">#</th>
                  <th className="text-left px-2 py-1.5">날짜</th>
                  <th className="text-left px-2 py-1.5">구분</th>
                  <th className="text-right px-2 py-1.5">가격</th>
                  <th className="text-right px-2 py-1.5">수수료</th>
                </tr>
              </thead>
              <tbody>
                {game.trades.map((t, i) => (
                  <tr key={i} className="border-t border-[#1f2430]">
                    <td className="px-2 py-1.5 text-[#8b93a7]">{i + 1}</td>
                    <td className="px-2 py-1.5">{new Date(t.time * 1000).toISOString().slice(0, 10)}</td>
                    <td className={`px-2 py-1.5 font-semibold ${t.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.side}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono">${t.price.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-[#8b93a7]">${t.fee.toFixed(2)}</td>
                  </tr>
                ))}
                {game.trades.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-[#8b93a7]">매매 기록 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="bg-[#12151c] border border-amber-500/30 rounded-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 text-sm text-amber-300 font-bold border-b border-amber-500/20 shrink-0">
            🏆 수익률 랭킹
          </div>
          <div className="flex-1 min-h-0 overflow-auto max-h-64 lg:max-h-none">
            {leaderboard.length > 0 ? (
              <table className="w-full text-xs whitespace-nowrap">
                <thead className="text-[10px] text-[#8b93a7] uppercase sticky top-0 bg-[#12151c]">
                  <tr>
                    <th className="text-center px-2 py-1.5">#</th>
                    <th className="text-left px-2 py-1.5">닉네임</th>
                    <th className="text-right px-2 py-1.5">수익률</th>
                    <th className="text-right px-2 py-1.5">알파</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => {
                    const isMe = row.nickname === nickname.trim()
                    return (
                      <tr
                        key={i}
                        className={`border-t border-[#1f2430] ${isMe ? 'bg-amber-500/10' : ''}`}
                      >
                        <td className="text-center px-2 py-1.5 font-bold">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className={`px-2 py-1.5 font-bold truncate max-w-[100px] ${isMe ? 'text-amber-300' : ''}`}>
                          {row.nickname}
                        </td>
                        <td className={`px-2 py-1.5 text-right font-mono font-bold ${row.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {row.returnPct >= 0 ? '+' : ''}{row.returnPct.toFixed(1)}%
                        </td>
                        <td className={`px-2 py-1.5 text-right font-mono ${row.alphaPct >= 0 ? 'text-emerald-300/70' : 'text-red-300/70'}`}>
                          {row.alphaPct >= 0 ? '+' : ''}{row.alphaPct.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-full text-[#8b93a7] text-xs py-8">
                아직 기록이 없습니다
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Card({
  label, value, accent,
}: { label: string; value: string; accent?: 'up' | 'down' }) {
  const color = accent === 'up' ? 'text-emerald-400' : accent === 'down' ? 'text-red-400' : 'text-[#e5e7eb]'
  return (
    <div className="bg-[#12151c] border border-[#252a36] rounded-lg p-2 sm:p-3">
      <div className="text-[9px] sm:text-[10px] text-[#8b93a7] uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm sm:text-lg font-mono font-semibold ${color}`}>{value}</div>
    </div>
  )
}

function ReplaySection({
  game, hideVolume, className = '', chartClass = 'h-[70vh] sm:h-[75vh]',
}: {
  game: GameState
  hideVolume: boolean
  className?: string
  chartClass?: string
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
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#12151c] border border-[#252a36] hover:border-[#333a4d] transition text-sm font-bold text-[#e5e7eb] shrink-0"
      >
        <span className="flex items-center gap-2">
          <span>복기 모드</span>
          <span className="text-xs font-normal text-[#8b93a7]">— 전체 차트 + 매매 포인트</span>
        </span>
        <span className={`transition-transform text-[#8b93a7] ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className={`mt-2 bg-[#12151c] border border-[#252a36] rounded-xl overflow-hidden ${chartClass}`}>
          <Chart candles={allCandles} trades={game.trades} hideVolume={hideVolume} hideIndicators />
        </div>
      )}
    </section>
  )
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}
