// Simulate how each analyst (훈수꾼) would have traded the same chart.
import type { Candle } from './yahoo'
import type { GameState } from './engine'
import { STARTING_CASH, FEE_RATE } from './engine'
import {
  smaSeries, rsiSeries, macdSeries, bollingerBandsSeries, ichimokuSeries,
} from './indicators'

type Position = 'FLAT' | 'LONG' | 'SHORT'
type Decision = 'LONG' | 'SHORT' | 'FLAT'

export interface AnalystTrade {
  time: number
  side: 'BUY' | 'SELL' | 'SHORT' | 'COVER'
  price: number
}

export interface AnalystSimResult {
  name: string
  emoji: string
  trades: AnalystTrade[]
  equityCurve: number[]
  returnPct: number
  cagrPct: number
}

type DecideFn = (candles: Candle[]) => Decision

function smaDecide(candles: Candle[]): Decision {
  const sma5 = smaSeries(candles, 5)
  const sma20 = smaSeries(candles, 20)
  const a = sma5[sma5.length - 1]?.value
  const b = sma20[sma20.length - 1]?.value
  if (a === undefined || b === undefined) return 'FLAT'
  return a > b ? 'LONG' : 'SHORT'
}

function rsiDecide(candles: Candle[]): Decision {
  const rsi = rsiSeries(candles, 14)
  const v = rsi[rsi.length - 1]?.value
  if (v === undefined) return 'FLAT'
  if (v < 30) return 'LONG'
  if (v > 70) return 'SHORT'
  return v > 50 ? 'LONG' : 'SHORT'
}

function macdDecide(candles: Candle[]): Decision {
  const m = macdSeries(candles)
  const p = m[m.length - 1]
  if (!p) return 'FLAT'
  return p.macd > p.signal ? 'LONG' : 'SHORT'
}

function bbDecide(candles: Candle[]): Decision {
  const bb = bollingerBandsSeries(candles, 20, 2)
  const p = bb[bb.length - 1]
  if (!p) return 'FLAT'
  const lastClose = candles[candles.length - 1].close
  const bw = p.upper - p.lower
  const pctB = bw > 0 ? (lastClose - p.lower) / bw : 0.5
  if (pctB <= 0.1) return 'LONG'
  if (pctB >= 0.9) return 'SHORT'
  return pctB >= 0.5 ? 'LONG' : 'SHORT'
}

function ichiDecide(candles: Candle[]): Decision {
  const ichi = ichimokuSeries(candles)
  const a = ichi.spanA[ichi.spanA.length - 1]?.value
  const b = ichi.spanB[ichi.spanB.length - 1]?.value
  if (a === undefined || b === undefined) return 'FLAT'
  const lastClose = candles[candles.length - 1].close
  const top = Math.max(a, b)
  const bot = Math.min(a, b)
  if (lastClose > top) return 'LONG'
  if (lastClose < bot) return 'SHORT'
  return 'FLAT'
}

const ANALYSTS: { name: string; emoji: string; decide: DecideFn }[] = [
  { name: '이평 할배', emoji: '🧓', decide: smaDecide },
  { name: 'RSI 선생',  emoji: '📏', decide: rsiDecide },
  { name: 'MACD 박사', emoji: '🎯', decide: macdDecide },
  { name: 'BB 형님',   emoji: '🎈', decide: bbDecide },
  { name: '일목 도사',  emoji: '🌫️', decide: ichiDecide },
]

function simulate(
  warmup: Candle[], reveal: Candle[], roundSize: number, roundCount: number,
  decide: DecideFn,
): { trades: AnalystTrade[]; equityCurve: number[] } {
  let cash = STARTING_CASH
  let shares = 0
  let pos = 'FLAT' as Position
  const trades: AnalystTrade[] = []
  const equityCurve: number[] = [STARTING_CASH]

  const getPrice = (step: number) => {
    if (step === 0) return reveal[0].open
    return reveal[step - 1].close
  }

  const equity = (price: number) => cash + shares * price

  const closePosAt = (price: number, time: number) => {
    if (pos === 'LONG') {
      const gross = shares * price
      const fee = gross * FEE_RATE
      cash += gross - fee
      shares = 0
      trades.push({ time, side: 'SELL', price })
    } else if (pos === 'SHORT') {
      const qty = -shares
      const cost = qty * price
      const fee = cost * FEE_RATE
      cash -= cost + fee
      shares = 0
      trades.push({ time, side: 'COVER', price })
    }
    pos = 'FLAT'
  }

  const openLongAt = (price: number, time: number) => {
    const gross = cash / (1 + FEE_RATE)
    const qty = gross / price
    const fee = gross * FEE_RATE
    cash -= gross + fee
    shares = qty
    pos = 'LONG'
    trades.push({ time, side: 'BUY', price })
  }

  const openShortAt = (price: number, time: number) => {
    const notional = cash
    const qty = notional / price
    const fee = notional * FEE_RATE
    cash += notional - fee
    shares = -qty
    pos = 'SHORT'
    trades.push({ time, side: 'SHORT', price })
  }

  for (let round = 0; round < roundCount; round++) {
    const step = round * roundSize
    if (step >= reveal.length) break

    const visible = [...warmup, ...reveal.slice(0, step)]
    const price = getPrice(step)
    const time = step === 0 ? reveal[0].time : reveal[step - 1].time

    // First round must enter a position
    const decision = visible.length > 0 ? decide(visible) : 'FLAT'

    if (round === 0) {
      // Must enter LONG or SHORT
      if (decision === 'SHORT') openShortAt(price, time)
      else openLongAt(price, time) // default to LONG if FLAT
    } else {
      if (decision === 'LONG' && pos !== 'LONG') {
        if (pos !== 'FLAT') closePosAt(price, time)
        openLongAt(price, time)
      } else if (decision === 'SHORT' && pos !== 'SHORT') {
        if (pos !== 'FLAT') closePosAt(price, time)
        openShortAt(price, time)
      } else if (decision === 'FLAT' && pos !== 'FLAT') {
        closePosAt(price, time)
      }
    }

    // Advance roundSize candles
    for (let i = 0; i < roundSize; i++) {
      const s = step + i + 1
      if (s > reveal.length) break
      const cp = reveal[s - 1].close
      equityCurve.push(equity(cp))
    }
  }

  // Force-close at the end
  const lastStep = Math.min(roundCount * roundSize, reveal.length)
  if (pos !== 'FLAT' && lastStep > 0) {
    const finalPrice = reveal[lastStep - 1].close
    const finalTime = reveal[lastStep - 1].time
    closePosAt(finalPrice, finalTime)
  }

  return { trades, equityCurve }
}

export function simulateAnalysts(game: GameState): AnalystSimResult[] {
  const totalSteps = game.roundCount * game.roundSize
  const years = totalSteps / 252

  return ANALYSTS.map(({ name, emoji, decide }) => {
    const { trades, equityCurve } = simulate(
      game.warmup, game.reveal, game.roundSize, game.roundCount, decide,
    )
    const finalEquity = equityCurve[equityCurve.length - 1]
    const totalReturn = finalEquity / STARTING_CASH - 1
    const returnPct = totalReturn * 100
    const cagrPct = years > 0
      ? (Math.pow(Math.max(0, 1 + totalReturn), 1 / years) - 1) * 100
      : returnPct
    return { name, emoji, trades, equityCurve, returnPct, cagrPct }
  })
}
