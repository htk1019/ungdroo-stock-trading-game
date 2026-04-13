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

  const beat = stats.alphaPct >= 0
  const beatBadge = beat
    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200'
    : 'bg-red-500/15 border-red-500/60 text-red-200'

  // Play the win/lose sting once on mount.
  useEffect(() => {
    if (beat) playWin(); else playLose()
    // intentionally ignore beat in deps — play only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-5">
          <img
            src={beat ? '/happy.png' : '/sad.png'}
            alt={beat ? '승리' : '패배'}
            className={`w-28 h-28 object-contain rounded-xl bg-black/40 border ${
              beat ? 'border-emerald-500/40' : 'border-red-500/40'
            } ${beat ? 'animate-bounce-slow' : 'animate-shake'}`}
            draggable={false}
          />
          <div>
            <div
              className={`inline-block px-4 py-1.5 rounded-xl border text-3xl font-extrabold tracking-wider mb-2 ${
                beat
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/60 text-red-300'
              }`}
            >
              {beat ? '승리!' : '패배…'}
            </div>
            <p className="text-[#8b93a7]">
              <span className="font-semibold text-[#e5e7eb]">{info?.name ?? game.symbol}</span>
              <span className="ml-2 text-xs px-2 py-0.5 bg-[#1a1e27] rounded">{game.symbol}</span>
              <span className="ml-3">{INTERVAL_LABEL[game.interval]} · {startDate} ~ {endDate}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onReplay}
          className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold"
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

      <div className={`px-4 py-2 rounded-lg border text-sm ${beatBadge}`}>
        {beat
          ? `🎉 Buy & Hold를 누적 ${stats.alphaPct.toFixed(2)}%p (연 ${stats.alphaCagrPct.toFixed(2)}%p) 이겼습니다.`
          : `📉 Buy & Hold에 누적 ${Math.abs(stats.alphaPct).toFixed(2)}%p (연 ${Math.abs(stats.alphaCagrPct).toFixed(2)}%p) 뒤졌습니다.`}
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
        <div className="px-4 py-2 text-sm text-[#8b93a7] border-b border-[#252a36]">
          거래 내역 ({game.trades.length})
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[#8b93a7] uppercase">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">날짜</th>
                <th className="text-left px-4 py-2">구분</th>
                <th className="text-right px-4 py-2">가격</th>
                <th className="text-right px-4 py-2">수량</th>
                <th className="text-right px-4 py-2">수수료</th>
              </tr>
            </thead>
            <tbody>
              {game.trades.map((t, i) => (
                <tr key={i} className="border-t border-[#1f2430]">
                  <td className="px-4 py-2 text-[#8b93a7]">{i + 1}</td>
                  <td className="px-4 py-2">{new Date(t.time * 1000).toISOString().slice(0, 10)}</td>
                  <td className={`px-4 py-2 font-semibold ${t.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.side}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">${t.price.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-mono">{t.shares.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right font-mono text-[#8b93a7]">${t.fee.toFixed(2)}</td>
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
    <div className="bg-[#12151c] border border-[#252a36] rounded-xl p-4">
      <div className="text-xs text-[#8b93a7] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-mono font-semibold ${color}`}>{value}</div>
    </div>
  )
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}
