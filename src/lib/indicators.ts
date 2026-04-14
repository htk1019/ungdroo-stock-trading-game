import {
  SMA, EMA, WMA, RSI, MACD, BollingerBands,
  Stochastic, StochasticRSI, ADX, CCI, WilliamsR, ATR,
  OBV, MFI, PSAR, AwesomeOscillator, ROC, TRIX, VWAP,
} from 'technicalindicators'
import type { Candle } from './yahoo'

export interface IndicatorPoint {
  time: number
  value: number
}

export interface MacdPoint {
  time: number
  macd: number
  signal: number
  histogram: number
}

function alignWithTimes<T>(times: number[], values: (T | undefined)[]): { time: number; value: T }[] {
  const out: { time: number; value: T }[] = []
  for (let i = 0; i < times.length; i++) {
    const v = values[i]
    if (v !== undefined) out.push({ time: times[i], value: v })
  }
  return out
}

export function smaSeries(candles: Candle[], period: number): IndicatorPoint[] {
  const closes = candles.map((c) => c.close)
  const result = SMA.calculate({ period, values: closes })
  // SMA outputs (closes.length - period + 1) values; pad front with undefined
  const padded = Array<number | undefined>(closes.length).fill(undefined)
  for (let i = 0; i < result.length; i++) padded[i + period - 1] = result[i]
  return alignWithTimes(candles.map((c) => c.time), padded).map((p) => ({
    time: p.time, value: p.value as number,
  }))
}

export function emaSeries(candles: Candle[], period: number): IndicatorPoint[] {
  const closes = candles.map((c) => c.close)
  const result = EMA.calculate({ period, values: closes })
  const padded = Array<number | undefined>(closes.length).fill(undefined)
  for (let i = 0; i < result.length; i++) padded[i + period - 1] = result[i]
  return alignWithTimes(candles.map((c) => c.time), padded).map((p) => ({
    time: p.time, value: p.value as number,
  }))
}

export function rsiSeries(candles: Candle[], period = 14): IndicatorPoint[] {
  const closes = candles.map((c) => c.close)
  const result = RSI.calculate({ period, values: closes })
  const padded = Array<number | undefined>(closes.length).fill(undefined)
  // RSI emits closes.length - period values, starting at index `period`
  for (let i = 0; i < result.length; i++) padded[i + period] = result[i]
  return alignWithTimes(candles.map((c) => c.time), padded).map((p) => ({
    time: p.time, value: p.value as number,
  }))
}

export interface IchimokuSeries {
  tenkan: IndicatorPoint[]   // 전환선 (9)
  kijun: IndicatorPoint[]    // 기준선 (26)
  spanA: IndicatorPoint[]    // 선행스팬 A (forward-shifted)
  spanB: IndicatorPoint[]    // 선행스팬 B (forward-shifted)
  chikou: IndicatorPoint[]   // 후행스팬 (backward-shifted)
}

export function ichimokuSeries(
  candles: Candle[],
  conversionPeriod = 9,
  basePeriod = 26,
  spanBPeriod = 52,
  displacement = 26,
): IchimokuSeries {
  const n = candles.length
  const hlMid = (period: number): (number | undefined)[] => {
    const arr: (number | undefined)[] = Array(n).fill(undefined)
    for (let i = period - 1; i < n; i++) {
      let hi = -Infinity, lo = Infinity
      for (let j = i - period + 1; j <= i; j++) {
        if (candles[j].high > hi) hi = candles[j].high
        if (candles[j].low < lo) lo = candles[j].low
      }
      arr[i] = (hi + lo) / 2
    }
    return arr
  }

  const tenkanArr = hlMid(conversionPeriod)
  const kijunArr = hlMid(basePeriod)
  const spanBArr = hlMid(spanBPeriod)

  const tenkan: IndicatorPoint[] = []
  const kijun: IndicatorPoint[] = []
  for (let i = 0; i < n; i++) {
    if (tenkanArr[i] !== undefined) tenkan.push({ time: candles[i].time, value: tenkanArr[i]! })
    if (kijunArr[i] !== undefined) kijun.push({ time: candles[i].time, value: kijunArr[i]! })
  }

  // Span A/B computed at bar (i-displacement), plotted at bar i
  // (i.e., leading the price by `displacement` bars, capped at current candles).
  const spanA: IndicatorPoint[] = []
  const spanB: IndicatorPoint[] = []
  for (let i = 0; i < n; i++) {
    const src = i - displacement
    if (src < 0) continue
    const t = tenkanArr[src], k = kijunArr[src], b = spanBArr[src]
    if (t !== undefined && k !== undefined) {
      spanA.push({ time: candles[i].time, value: (t + k) / 2 })
    }
    if (b !== undefined) {
      spanB.push({ time: candles[i].time, value: b })
    }
  }

  // Chikou: today's close plotted `displacement` bars back.
  const chikou: IndicatorPoint[] = []
  for (let i = 0; i < n; i++) {
    const dst = i - displacement
    if (dst >= 0) chikou.push({ time: candles[dst].time, value: candles[i].close })
  }

  return { tenkan, kijun, spanA, spanB, chikou }
}

// Generic helper: indicator libraries emit outputs aligned to END of input,
// so last N values correspond to last N candles.
function attachEnd<T>(values: T[], candles: Candle[]): { time: number; value: T }[] {
  const offset = candles.length - values.length
  if (offset < 0) return []
  return values.map((v, i) => ({ time: candles[offset + i].time, value: v }))
}

export function wmaSeries(candles: Candle[], period: number): IndicatorPoint[] {
  const result = WMA.calculate({ period, values: candles.map((c) => c.close) })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

export interface BBPoint { time: number; upper: number; middle: number; lower: number }
export function bollingerBandsSeries(candles: Candle[], period = 20, stdDev = 2): BBPoint[] {
  const result = BollingerBands.calculate({ period, stdDev, values: candles.map((c) => c.close) })
  const offset = candles.length - result.length
  if (offset < 0) return []
  return result.map((r, i) => ({
    time: candles[offset + i].time,
    upper: r.upper, middle: r.middle, lower: r.lower,
  }))
}

// %B = (close - lower) / (upper - lower). 0 = at lower band, 1 = at upper band.
export function bbPercentBSeries(candles: Candle[], period = 20, stdDev = 2): IndicatorPoint[] {
  const bb = bollingerBandsSeries(candles, period, stdDev)
  const closeByTime = new Map(candles.map((c) => [c.time, c.close]))
  const out: IndicatorPoint[] = []
  for (const b of bb) {
    const close = closeByTime.get(b.time)
    if (close === undefined) continue
    const range = b.upper - b.lower
    if (range === 0) continue
    out.push({ time: b.time, value: (close - b.lower) / range })
  }
  return out
}

// BandWidth = (upper - lower) / middle. Volatility expansion/contraction proxy.
export function bbBandWidthSeries(candles: Candle[], period = 20, stdDev = 2): IndicatorPoint[] {
  const bb = bollingerBandsSeries(candles, period, stdDev)
  return bb
    .filter((b) => b.middle !== 0)
    .map((b) => ({ time: b.time, value: (b.upper - b.lower) / b.middle }))
}

export interface StochPoint { time: number; k: number; d: number }
export function stochasticSeries(candles: Candle[], period = 14, signalPeriod = 3): StochPoint[] {
  const result = Stochastic.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    period, signalPeriod,
  })
  const offset = candles.length - result.length
  if (offset < 0) return []
  return result
    .map((r, i) => ({ time: candles[offset + i].time, k: r.k, d: r.d }))
    .filter((p) => Number.isFinite(p.k) && Number.isFinite(p.d))
}

export function stochRsiSeries(
  candles: Candle[], rsiPeriod = 14, stochasticPeriod = 14, kPeriod = 3, dPeriod = 3,
): StochPoint[] {
  const result = StochasticRSI.calculate({
    values: candles.map((c) => c.close),
    rsiPeriod, stochasticPeriod, kPeriod, dPeriod,
  })
  const offset = candles.length - result.length
  if (offset < 0) return []
  return result
    .map((r, i) => ({ time: candles[offset + i].time, k: r.k, d: r.d }))
    .filter((p) => Number.isFinite(p.k) && Number.isFinite(p.d))
}

export interface AdxPoint { time: number; adx: number; pdi: number; mdi: number }
export function adxSeries(candles: Candle[], period = 14): AdxPoint[] {
  const result = ADX.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    period,
  })
  const offset = candles.length - result.length
  if (offset < 0) return []
  return result
    .map((r, i) => ({ time: candles[offset + i].time, adx: r.adx, pdi: r.pdi, mdi: r.mdi }))
    .filter((p) => Number.isFinite(p.adx))
}

export function cciSeries(candles: Candle[], period = 20): IndicatorPoint[] {
  const result = CCI.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    period,
  })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

export function williamsRSeries(candles: Candle[], period = 14): IndicatorPoint[] {
  const result = WilliamsR.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    period,
  })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

export function atrSeries(candles: Candle[], period = 14): IndicatorPoint[] {
  const result = ATR.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    period,
  })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

export function rocSeries(candles: Candle[], period = 12): IndicatorPoint[] {
  const result = ROC.calculate({ values: candles.map((c) => c.close), period })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

export function trixSeries(candles: Candle[], period = 14): IndicatorPoint[] {
  const result = TRIX.calculate({ values: candles.map((c) => c.close), period })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

export function obvSeries(candles: Candle[]): IndicatorPoint[] {
  const result = OBV.calculate({
    close: candles.map((c) => c.close),
    volume: candles.map((c) => c.volume),
  })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

export function mfiSeries(candles: Candle[], period = 14): IndicatorPoint[] {
  const result = MFI.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    volume: candles.map((c) => c.volume),
    period,
  })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

export function psarSeries(candles: Candle[], step = 0.02, max = 0.2): IndicatorPoint[] {
  const result = PSAR.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    step, max,
  })
  return attachEnd(result, candles)
    .map((p) => ({ time: p.time, value: p.value as number }))
    .filter((p) => Number.isFinite(p.value))
}

export function awesomeOscSeries(candles: Candle[]): IndicatorPoint[] {
  const result = AwesomeOscillator.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    fastPeriod: 5, slowPeriod: 34, format: (n) => n,
  })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

export function vwapSeries(candles: Candle[]): IndicatorPoint[] {
  const result = VWAP.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    volume: candles.map((c) => c.volume),
  })
  return attachEnd(result, candles).map((p) => ({ time: p.time, value: p.value as number }))
}

// Kaufman's Adaptive Moving Average.
// ER = |close[i] - close[i-period]| / sum(|Δclose|) over the same window.
// SC = (ER*(fastSC - slowSC) + slowSC)^2, where fastSC=2/(fast+1), slowSC=2/(slow+1).
// KAMA[i] = KAMA[i-1] + SC * (close[i] - KAMA[i-1]); seeded with close[period-1] per spec.
export function kamaSeries(
  candles: Candle[], period = 10, fast = 2, slow = 30,
): IndicatorPoint[] {
  const n = candles.length
  if (n <= period) return []
  const closes = candles.map((c) => c.close)
  const fastSC = 2 / (fast + 1)
  const slowSC = 2 / (slow + 1)

  // Seed: KAMA_period = close[period-1] (the period-th close itself).
  const seed = closes[period - 1]
  const out: IndicatorPoint[] = [{ time: candles[period - 1].time, value: seed }]
  let prev = seed
  for (let i = period; i < n; i++) {
    const change = Math.abs(closes[i] - closes[i - period])
    let volatility = 0
    for (let j = i - period + 1; j <= i; j++) {
      volatility += Math.abs(closes[j] - closes[j - 1])
    }
    const er = volatility === 0 ? 0 : change / volatility
    const sc = Math.pow(er * (fastSC - slowSC) + slowSC, 2)
    const k = prev + sc * (closes[i] - prev)
    out.push({ time: candles[i].time, value: k })
    prev = k
  }
  return out
}

// Super Trend (Olivier Seban). ATR-based trend follower drawn on the price chart.
// trend = 1 → line at finalLower (uptrend), -1 → line at finalUpper (downtrend).
// ATR uses Wilder's smoothing (RMA) seeded with the SMA of the first `period` TRs.
export interface SuperTrendPoint { time: number; value: number; trend: 1 | -1 }

export function superTrendSeries(
  candles: Candle[], period = 10, multiplier = 3,
): SuperTrendPoint[] {
  const n = candles.length
  if (n < period + 1) return []

  // True Range
  const tr: number[] = new Array(n)
  tr[0] = candles[0].high - candles[0].low
  for (let i = 1; i < n; i++) {
    const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close
    tr[i] = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc))
  }

  // ATR (Wilder / RMA), seeded with SMA of first `period` TRs at index period-1.
  const atr: number[] = new Array(n).fill(NaN)
  let sum = 0
  for (let i = 0; i < period; i++) sum += tr[i]
  atr[period - 1] = sum / period
  for (let i = period; i < n; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period
  }

  const out: SuperTrendPoint[] = []
  let prevFinalUpper = 0, prevFinalLower = 0
  let trend: 1 | -1 = 1

  for (let i = period - 1; i < n; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2
    const basicUpper = hl2 + multiplier * atr[i]
    const basicLower = hl2 - multiplier * atr[i]
    const prevClose = candles[i - 1]?.close ?? candles[i].close

    let finalUpper: number, finalLower: number
    if (i === period - 1) {
      finalUpper = basicUpper
      finalLower = basicLower
      trend = candles[i].close > finalUpper ? 1 : -1
    } else {
      finalUpper = prevClose <= prevFinalUpper
        ? Math.min(basicUpper, prevFinalUpper) : basicUpper
      finalLower = prevClose >= prevFinalLower
        ? Math.max(basicLower, prevFinalLower) : basicLower
      if (trend === 1 && candles[i].close < finalLower) trend = -1
      else if (trend === -1 && candles[i].close > finalUpper) trend = 1
    }

    out.push({
      time: candles[i].time,
      value: trend === 1 ? finalLower : finalUpper,
      trend,
    })
    prevFinalUpper = finalUpper
    prevFinalLower = finalLower
  }
  return out
}

export function macdSeries(
  candles: Candle[],
  fast = 12, slow = 26, signal = 9,
): MacdPoint[] {
  const closes = candles.map((c) => c.close)
  const result = MACD.calculate({
    values: closes,
    fastPeriod: fast,
    slowPeriod: slow,
    signalPeriod: signal,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })
  // MACD emits values starting at index (slow - 1); signal starts later
  const offset = slow - 1
  const out: MacdPoint[] = []
  for (let i = 0; i < result.length; i++) {
    const r = result[i]
    if (r.MACD === undefined || r.signal === undefined) continue
    out.push({
      time: candles[i + offset].time,
      macd: r.MACD,
      signal: r.signal,
      histogram: r.histogram ?? 0,
    })
  }
  return out
}
