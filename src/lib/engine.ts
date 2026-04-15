import type { Candle, Interval } from './yahoo'

export const INTERVAL_LABEL: Record<Interval, string> = {
  '1d': '일간',
  '1wk': '주간',
  '1mo': '월간',
  '3mo': '분기',
}

// Daily-only. Warmup shows ~1 year of past context. Trading length is
// round_count × round_size_in_days.
export const WARMUP_DAYS = 252

export interface RoundSize { key: 'd' | 'w' | 'm' | 'q' | 'h'; label: string; days: number }
export const ROUND_SIZES: RoundSize[] = [
  { key: 'd', label: '일',   days: 1 },
  { key: 'w', label: '주',   days: 5 },
  { key: 'm', label: '월',   days: 21 },
  { key: 'q', label: '분기', days: 63 },
  { key: 'h', label: '반기', days: 126 },
]
export const ROUND_COUNTS = [3, 5, 10, 20, 50, 100] as const

export const STARTING_CASH = 10_000
export const FEE_RATE = 0.001 // 0.1% per side
export const HINTS_PER_GAME = 5

// BUY/SELL are long open/close. SHORT/COVER are short open/close.
export type Side = 'BUY' | 'SELL' | 'SHORT' | 'COVER'

export type Position = 'FLAT' | 'LONG' | 'SHORT'

export function positionOf(g: { shares: number }): Position {
  if (g.shares > 1e-9) return 'LONG'
  if (g.shares < -1e-9) return 'SHORT'
  return 'FLAT'
}

export interface Trade {
  step: number          // index within trading candles (0-based)
  time: number          // unix sec
  side: Side
  price: number
  shares: number        // always positive quantity
  fee: number
}

export interface GameInit {
  symbol: string
  interval: Interval
  warmup: Candle[]    // visible from the start
  reveal: Candle[]    // revealed in chunks of `roundSize`
  roundSize: number   // days advanced per round
  roundCount: number  // total rounds
}

export interface GameState {
  symbol: string
  interval: Interval
  warmup: Candle[]
  reveal: Candle[]
  step: number       // # of revealed candles from `reveal`
  roundSize: number
  roundCount: number
  cash: number
  shares: number
  trades: Trade[]
  equityCurve: number[]
  buyHoldCurve: number[]
  ended: boolean
  hintsRemaining: number
}

export function pickWindow(
  candles: Candle[],
  warmupDays: number,
  tradingDays: number,
): { warmup: Candle[]; reveal: Candle[] } | null {
  const total = warmupDays + tradingDays
  if (candles.length < total + 5) return null
  const maxStart = candles.length - total
  const start = Math.floor(Math.random() * (maxStart + 1))
  const window = candles.slice(start, start + total)
  return {
    warmup: window.slice(0, warmupDays),
    reveal: window.slice(warmupDays),
  }
}

export function initGame(init: GameInit): GameState {
  // Baseline: buy & hold uses the open of the first revealed candle (the first
  // candle the player can react to after warmup).
  const entryPrice = init.reveal[0].open
  const buyHoldShares = STARTING_CASH / entryPrice
  return {
    symbol: init.symbol,
    interval: init.interval,
    warmup: init.warmup,
    reveal: init.reveal,
    step: 0,
    roundSize: init.roundSize,
    roundCount: init.roundCount,
    cash: STARTING_CASH,
    shares: 0,
    trades: [],
    equityCurve: [STARTING_CASH],
    buyHoldCurve: [buyHoldShares * entryPrice],
    ended: false,
    hintsRemaining: HINTS_PER_GAME,
  }
}

// Price the player transacts at when pressing buy/sell on the latest revealed
// candle. We use the close of the currently-visible last candle to keep things
// deterministic — you "act on what you see".
export function currentPrice(g: GameState): number {
  if (g.step === 0) return g.reveal[0].open
  return g.reveal[g.step - 1].close
}

export function equityAt(g: GameState, price: number): number {
  return g.cash + g.shares * price
}

// Average entry price for the currently open position (from the most recent
// open trade that hasn't been closed yet). Returns null when flat.
export function openEntryPrice(g: GameState): number | null {
  for (let i = g.trades.length - 1; i >= 0; i--) {
    const t = g.trades[i]
    if (t.side === 'BUY' || t.side === 'SHORT') return t.price
    if (t.side === 'SELL' || t.side === 'COVER') return null
  }
  return null
}

// Unrealized P&L of the current position in dollars (sign matches profit:
// long & price-up → positive; short & price-down → positive).
export function unrealizedPnl(g: GameState, price: number): number {
  const entry = openEntryPrice(g)
  if (entry == null || g.shares === 0) return 0
  // shares is positive for long, negative for short.
  return (price - entry) * g.shares
}

export interface ActionResult {
  ok: boolean
  reason?: string
}

// Open a 100%-cash long position. Requires FLAT state.
export function openLong(g: GameState): ActionResult {
  if (g.ended) return { ok: false, reason: '게임 종료됨' }
  if (positionOf(g) !== 'FLAT') return { ok: false, reason: '이미 포지션 있음' }
  if (g.cash <= 0) return { ok: false, reason: '현금 부족' }
  const price = currentPrice(g)
  const grossCost = g.cash / (1 + FEE_RATE)
  const shares = grossCost / price
  if (shares <= 0) return { ok: false, reason: '수량 0' }
  const fee = grossCost * FEE_RATE
  g.cash -= grossCost + fee
  g.shares += shares
  g.trades.push({ step: g.step, time: lastVisibleTime(g), side: 'BUY', price, shares, fee })
  return { ok: true }
}

// Open a short position of notional equal to current cash. Requires FLAT.
export function openShort(g: GameState): ActionResult {
  if (g.ended) return { ok: false, reason: '게임 종료됨' }
  if (positionOf(g) !== 'FLAT') return { ok: false, reason: '이미 포지션 있음' }
  if (g.cash <= 0) return { ok: false, reason: '증거금 부족' }
  const price = currentPrice(g)
  const notional = g.cash
  const shares = notional / price
  const fee = notional * FEE_RATE
  g.cash += notional - fee     // broker credits proceeds; cash now > starting
  g.shares -= shares
  g.trades.push({ step: g.step, time: lastVisibleTime(g), side: 'SHORT', price, shares, fee })
  return { ok: true }
}

// Close any open position (long or short) fully.
export function closePosition(g: GameState): ActionResult {
  if (g.ended) return { ok: false, reason: '게임 종료됨' }
  const pos = positionOf(g)
  if (pos === 'FLAT') return { ok: false, reason: '청산할 포지션 없음' }
  const price = currentPrice(g)
  if (pos === 'LONG') {
    const shares = g.shares
    const gross = shares * price
    const fee = gross * FEE_RATE
    g.cash += gross - fee
    g.shares = 0
    g.trades.push({ step: g.step, time: lastVisibleTime(g), side: 'SELL', price, shares, fee })
  } else {
    // SHORT → cover: buy back |shares|
    const shares = -g.shares
    const cost = shares * price
    const fee = cost * FEE_RATE
    g.cash -= cost + fee
    g.shares = 0
    g.trades.push({ step: g.step, time: lastVisibleTime(g), side: 'COVER', price, shares, fee })
  }
  return { ok: true }
}

function lastVisibleTime(g: GameState): number {
  // At step 0 the player acts on reveal[0].open — the first reveal candle.
  // Mapping the trade to reveal[0] keeps the BUY/SHORT arrow aligned with
  // the actual entry candle (previously it fell on the last warmup day).
  if (g.step === 0) return g.reveal[0].time
  return g.reveal[g.step - 1].time
}

// Reveal the next candle. Updates equity & buy-hold curves.
export function nextStep(g: GameState): { done: boolean } {
  if (g.ended) return { done: true }
  if (g.step >= g.reveal.length) {
    g.ended = true
    return { done: true }
  }
  g.step += 1
  const closePrice = g.reveal[g.step - 1].close
  g.equityCurve.push(equityAt(g, closePrice))
  const entry = g.reveal[0].open
  const bhShares = STARTING_CASH / entry
  g.buyHoldCurve.push(bhShares * closePrice)
  if (g.step >= g.reveal.length) g.ended = true
  return { done: g.ended }
}

// Advance by N candles at once. Stops early if game ends.
export function advance(g: GameState, n: number): { done: boolean } {
  let done = false
  for (let i = 0; i < n; i++) {
    const r = nextStep(g)
    if (r.done) { done = true; break }
  }
  return { done }
}

// Round-level decisions. Picking one transitions the position and advances
// one round's worth of candles in a single step.
export type Decision = 'LONG' | 'SHORT' | 'FLAT' | 'HOLD'

export function submitRound(g: GameState, d: Decision): { ok: boolean; reason?: string; done: boolean } {
  if (g.ended) return { ok: false, reason: '게임 종료됨', done: true }
  const cur = positionOf(g)
  if (d === 'LONG') {
    if (cur === 'SHORT') closePosition(g)
    if (positionOf(g) === 'FLAT') {
      const r = openLong(g); if (!r.ok) return { ok: false, reason: r.reason, done: false }
    }
  } else if (d === 'SHORT') {
    if (cur === 'LONG') closePosition(g)
    if (positionOf(g) === 'FLAT') {
      const r = openShort(g); if (!r.ok) return { ok: false, reason: r.reason, done: false }
    }
  } else if (d === 'FLAT') {
    if (cur !== 'FLAT') closePosition(g)
  }
  // HOLD: keep current position untouched.
  const { done } = advance(g, g.roundSize)
  return { ok: true, done }
}

export interface FinalStats {
  finalEquity: number
  returnPct: number
  buyHoldReturnPct: number
  alphaPct: number
  years: number
  cagrPct: number          // annualized player return
  buyHoldCagrPct: number   // annualized buy & hold return
  alphaCagrPct: number
  maxDrawdownPct: number
  sharpe: number           // annualized Sharpe
  trades: number
  winRate: number          // 포지션 기준: 청산된 왕복 거래 중 수익 난 비율
  winRateByRound: number   // 라운드 기준: 포지션(롱/숏) 보유 라운드에서 방향 맞춘 비율, 현금은 제외
}

// Per-interval periods-per-year — used to annualize Sharpe and CAGR fallback.
const PERIODS_PER_YEAR: Record<Interval, number> = {
  '1d': 252, '1wk': 52, '1mo': 12, '3mo': 4,
}

function cagr(total: number, years: number): number {
  if (years <= 0) return 0
  if (total <= -1) return -100
  return (Math.pow(1 + total, 1 / years) - 1) * 100
}

export function computeStats(g: GameState): FinalStats {
  const final = g.equityCurve[g.equityCurve.length - 1]
  const returnPct = (final / STARTING_CASH - 1) * 100
  const bhFinal = g.buyHoldCurve[g.buyHoldCurve.length - 1]
  const buyHoldReturnPct = (bhFinal / STARTING_CASH - 1) * 100

  // Max drawdown of equity curve
  let peak = g.equityCurve[0]
  let mdd = 0
  for (const v of g.equityCurve) {
    if (v > peak) peak = v
    const dd = (v / peak - 1) * 100
    if (dd < mdd) mdd = dd
  }

  // Per-step returns + annualized Sharpe
  const rets: number[] = []
  for (let i = 1; i < g.equityCurve.length; i++) {
    rets.push(g.equityCurve[i] / g.equityCurve[i - 1] - 1)
  }
  const mean = rets.reduce((a, b) => a + b, 0) / Math.max(rets.length, 1)
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(rets.length - 1, 1)
  const std = Math.sqrt(variance)
  const ppy = PERIODS_PER_YEAR[g.interval]
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(ppy) : 0

  // Elapsed years from the first revealed candle to the last.
  const firstTs = g.reveal[0].time
  const lastTs = g.reveal[Math.max(g.step - 1, 0)].time
  const years = Math.max((lastTs - firstTs) / (365.25 * 24 * 3600), 1 / 365.25)
  const cagrPct = cagr(returnPct / 100, years)
  const buyHoldCagrPct = cagr(buyHoldReturnPct / 100, years)

  // Win rate: pair each open with its next close. Since we always trade 100%
  // in/out, every closing trade is one complete round-trip.
  let entry: { side: 'LONG' | 'SHORT'; price: number } | null = null
  let wins = 0, closed = 0
  for (const t of g.trades) {
    if (t.side === 'BUY') entry = { side: 'LONG', price: t.price }
    else if (t.side === 'SHORT') entry = { side: 'SHORT', price: t.price }
    else if (t.side === 'SELL' && entry?.side === 'LONG') {
      closed += 1
      if (t.price > entry.price) wins += 1
      entry = null
    } else if (t.side === 'COVER' && entry?.side === 'SHORT') {
      closed += 1
      if (t.price < entry.price) wins += 1
      entry = null
    }
  }
  const winRate = closed > 0 ? (wins / closed) * 100 : 0

  // Round-based win rate: walk each completed round, reconstruct position at
  // start of round, and check if price moved in position's favor during round.
  // FLAT rounds are excluded from both numerator and denominator.
  const roundsDone = Math.floor(g.step / g.roundSize)
  let rPos: Position = 'FLAT'
  let rTradeIdx = 0
  let rWins = 0, rTotal = 0
  for (let r = 0; r < roundsDone; r++) {
    const startStep = r * g.roundSize
    const endStep = (r + 1) * g.roundSize - 1
    while (rTradeIdx < g.trades.length && g.trades[rTradeIdx].step === startStep) {
      const t = g.trades[rTradeIdx]
      if (t.side === 'BUY') rPos = 'LONG'
      else if (t.side === 'SHORT') rPos = 'SHORT'
      else rPos = 'FLAT'  // SELL or COVER
      rTradeIdx++
    }
    if (rPos === 'FLAT') continue
    const startPrice = r === 0 ? g.reveal[0].open : g.reveal[startStep - 1].close
    const endPrice = g.reveal[endStep].close
    const up = endPrice > startPrice
    rTotal++
    if ((rPos === 'LONG' && up) || (rPos === 'SHORT' && !up)) rWins++
  }
  const winRateByRound = rTotal > 0 ? (rWins / rTotal) * 100 : 0

  return {
    finalEquity: final,
    returnPct,
    buyHoldReturnPct,
    alphaPct: returnPct - buyHoldReturnPct,
    years,
    cagrPct,
    buyHoldCagrPct,
    alphaCagrPct: cagrPct - buyHoldCagrPct,
    maxDrawdownPct: mdd,
    sharpe,
    trades: g.trades.length,
    winRate,
    winRateByRound,
  }
}
