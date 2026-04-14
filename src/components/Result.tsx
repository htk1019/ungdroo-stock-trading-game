import { useEffect, useMemo } from 'react'
import { computeStats, type GameState, INTERVAL_LABEL } from '../lib/engine'
import { findTicker } from '../lib/tickers'
import { EquityChart } from './EquityChart'
import { playWin, playLose } from '../lib/sfx'

interface ResultProps {
  game: GameState
  onReplay: () => void
}

export function Result({ game, onReplay }: ResultProps) {
  const stats = useMemo(() => computeStats(game), [game])
  const info = findTicker(game.symbol)

  // Build a time axis that pairs each equity sample with a candle time.
  // equityCurve[0] is the "before reveal[0]" snapshot — pin it to the last warmup time.
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
  const verdictImg = verdict === 'win' ? '/happy.png' : verdict === 'lose' ? '/sad.png' : '/meh.png'
  const verdictAlt = verdict === 'win' ? '승리' : verdict === 'lose' ? '패배' : '절반의 성공'
  const verdictBorder = verdict === 'win' ? 'border-emerald-500/40' : verdict === 'lose' ? 'border-red-500/40' : 'border-amber-500/40'
  const verdictAnim = verdict === 'win' ? 'animate-bounce-slow' : verdict === 'lose' ? 'animate-shake' : ''
  const beatBadge = beat
    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200'
    : 'bg-red-500/15 border-red-500/60 text-red-200'
  const verdictMsg = beat
    ? `🎉 절대수익 +${stats.returnPct.toFixed(2)}% & B&H 대비 +${stats.alphaPct.toFixed(2)}%p — 둘 다 이겼습니다.`
    : !profitable && !beatBM
      ? `📉 패배 — 돈도 잃고(${stats.returnPct.toFixed(2)}%) B&H에도 뒤졌습니다(${stats.alphaPct.toFixed(2)}%p).`
      : !profitable
        ? `📉 패배 — B&H는 이겼지만(${stats.alphaPct >= 0 ? '+' : ''}${stats.alphaPct.toFixed(2)}%p) 절대수익이 마이너스(${stats.returnPct.toFixed(2)}%)입니다.`
        : `📉 패배 — 돈은 벌었지만(+${stats.returnPct.toFixed(2)}%) B&H에 뒤졌습니다(${stats.alphaPct.toFixed(2)}%p).`

  // Play the win/lose sting once on mount.
  useEffect(() => {
    if (beat) playWin(); else playLose()
    // intentionally ignore beat in deps — play only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen p-3 sm:p-6 flex flex-col gap-4 sm:gap-6">
      {/* Header */}
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
              <div
                className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border text-xl sm:text-3xl font-extrabold tracking-wider ${
                  beat
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/60 text-red-300'
                }`}
              >
                {beat ? '승리!' : '패배…'}
              </div>
              <span className={`text-xs sm:text-sm font-semibold ${beat ? 'text-emerald-200' : 'text-red-200'}`}>
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
        <button
          onClick={onReplay}
          className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm sm:text-base"
        >
          다시 도전
        </button>
      </header>

      {/* Headline cards — total return */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="내 수익률 (누적)" value={fmtPct(stats.returnPct)} accent={stats.returnPct >= 0 ? 'up' : 'down'} />
        <Card label="Buy & Hold (누적)" value={fmtPct(stats.buyHoldReturnPct)} accent={stats.buyHoldReturnPct >= 0 ? 'up' : 'down'} />
        <Card label="알파 (vs B&H)" value={fmtPct(stats.alphaPct)} accent={beat ? 'up' : 'down'} />
        <Card label="최종 자산" value={`$${stats.finalEquity.toFixed(2)}`} />
      </section>

      {/* Annualized (CAGR) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label={`내 수익률 (연환산, ${stats.years.toFixed(1)}년)`} value={fmtPct(stats.cagrPct)} accent={stats.cagrPct >= 0 ? 'up' : 'down'} />
        <Card label="Buy & Hold (연환산)" value={fmtPct(stats.buyHoldCagrPct)} accent={stats.buyHoldCagrPct >= 0 ? 'up' : 'down'} />
        <Card label="알파 (연환산)" value={fmtPct(stats.alphaCagrPct)} accent={stats.alphaCagrPct >= 0 ? 'up' : 'down'} />
        <Card label="기간" value={`${stats.years.toFixed(2)}년`} />
      </section>

      <div className={`px-2 sm:px-4 py-2 rounded-lg border text-xs opacity-90 flex flex-wrap gap-x-3 gap-y-1 ${beatBadge}`}>
        <span>절대수익 {profitable ? '✅' : '❌'} {stats.returnPct >= 0 ? '+' : ''}{stats.returnPct.toFixed(2)}%</span>
        <span>B&H 초과 {beatBM ? '✅' : '❌'} {stats.alphaPct >= 0 ? '+' : ''}{stats.alphaPct.toFixed(2)}%p (연 {stats.alphaCagrPct >= 0 ? '+' : ''}{stats.alphaCagrPct.toFixed(2)}%p)</span>
      </div>

      {/* Equity chart */}
      <section className="h-72 bg-[#12151c] border border-[#252a36] rounded-xl overflow-hidden">
        <EquityChart times={times} player={game.equityCurve} buyHold={game.buyHoldCurve} />
      </section>

      {/* Secondary stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="최대 낙폭 (MDD)" value={`${stats.maxDrawdownPct.toFixed(2)}%`} accent="down" />
        <Card label="샤프 (연환산)" value={stats.sharpe.toFixed(2)} />
        <Card label="총 거래" value={`${stats.trades}회`} />
        <Card label="승률" value={`${stats.winRate.toFixed(1)}%`} />
      </section>

      {/* Trade log */}
      <section className="bg-[#12151c] border border-[#252a36] rounded-xl overflow-hidden">
        <div className="px-2 sm:px-4 py-2 text-sm text-[#8b93a7] border-b border-[#252a36]">
          거래 내역 ({game.trades.length})
        </div>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-xs sm:text-sm whitespace-nowrap">
            <thead className="text-xs text-[#8b93a7] uppercase">
              <tr>
                <th className="text-left px-2 sm:px-4 py-2">#</th>
                <th className="text-left px-2 sm:px-4 py-2">날짜</th>
                <th className="text-left px-2 sm:px-4 py-2">구분</th>
                <th className="text-right px-2 sm:px-4 py-2">가격</th>
                <th className="text-right px-2 sm:px-4 py-2">수량</th>
                <th className="text-right px-2 sm:px-4 py-2">수수료</th>
              </tr>
            </thead>
            <tbody>
              {game.trades.map((t, i) => (
                <tr key={i} className="border-t border-[#1f2430]">
                  <td className="px-2 sm:px-4 py-2 text-[#8b93a7]">{i + 1}</td>
                  <td className="px-2 sm:px-4 py-2">{new Date(t.time * 1000).toISOString().slice(0, 10)}</td>
                  <td className={`px-2 sm:px-4 py-2 font-semibold ${t.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.side}
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-right font-mono">${t.price.toFixed(2)}</td>
                  <td className="px-2 sm:px-4 py-2 text-right font-mono">{t.shares.toFixed(4)}</td>
                  <td className="px-2 sm:px-4 py-2 text-right font-mono text-[#8b93a7]">${t.fee.toFixed(2)}</td>
                </tr>
              ))}
              {game.trades.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-[#8b93a7]">매매 기록 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Card({
  label, value, accent,
}: { label: string; value: string; accent?: 'up' | 'down' }) {
  const color = accent === 'up' ? 'text-emerald-400' : accent === 'down' ? 'text-red-400' : 'text-[#e5e7eb]'
  return (
    <div className="bg-[#12151c] border border-[#252a36] rounded-xl p-3 sm:p-4">
      <div className="text-[10px] sm:text-xs text-[#8b93a7] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg sm:text-2xl font-mono font-semibold ${color}`}>{value}</div>
    </div>
  )
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}
