import { SMA, EMA, RSI, MACD } from 'technicalindicators'
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
