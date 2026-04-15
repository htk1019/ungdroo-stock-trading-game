import type { Candle } from './yahoo'
import {
  smaSeries, rsiSeries, macdSeries, bollingerBandsSeries, ichimokuSeries,
} from './indicators'

export type Stance = 'LONG' | 'SHORT' | 'HOLD'

export interface Analyst {
  name: string
  emoji: string
  stance: Stance
  reason: string
}

const UNKNOWN_REASON = '데이터가 부족해서 말을 아끼겠네.'

function last<T>(arr: T[]): T | undefined { return arr[arr.length - 1] }

export function getAdvice(candles: Candle[]): Analyst[] {
  const closes = candles.map((c) => c.close)
  const lastClose = last(closes) ?? 0

  const sma5 = smaSeries(candles, 5)
  const sma20 = smaSeries(candles, 20)
  const rsi = rsiSeries(candles, 14)
  const macd = macdSeries(candles)
  const bb = bollingerBandsSeries(candles, 20, 2)
  const ichi = ichimokuSeries(candles)

  const analysts: Analyst[] = []

  // 1. 이평 할배 — SMA5 vs SMA20 crossover
  {
    const a = last(sma5)?.value
    const b = last(sma20)?.value
    const aPrev = sma5[sma5.length - 2]?.value
    const bPrev = sma20[sma20.length - 2]?.value
    let stance: Stance = 'HOLD'
    let reason = UNKNOWN_REASON
    if (a !== undefined && b !== undefined && aPrev !== undefined && bPrev !== undefined) {
      const crossUp = aPrev <= bPrev && a > b
      const crossDown = aPrev >= bPrev && a < b
      if (crossUp) { stance = 'LONG'; reason = '골든크로스 떴다. 이럴 때 안 타면 언제 타노.' }
      else if (crossDown) { stance = 'SHORT'; reason = '데드크로스다. 손절 타이밍이야.' }
      else if (a > b) { stance = 'LONG'; reason = '단기가 장기 위에 있다. 추세 살아있어.' }
      else { stance = 'SHORT'; reason = '단기가 장기 아래다. 분위기 안 좋다.' }
    }
    analysts.push({ name: '이평 할배', emoji: '🧓', stance, reason })
  }

  // 2. RSI 선생 — over/under bounds
  {
    const v = last(rsi)?.value
    let stance: Stance = 'HOLD'
    let reason = UNKNOWN_REASON
    if (v !== undefined) {
      if (v < 30) { stance = 'LONG'; reason = `RSI ${v.toFixed(1)}. 과매도야, 반등 각.` }
      else if (v > 70) { stance = 'SHORT'; reason = `RSI ${v.toFixed(1)}. 과열이다, 조심해.` }
      else if (v > 50) { stance = 'LONG'; reason = `RSI ${v.toFixed(1)}. 중립 상단, 모멘텀 긍정.` }
      else { stance = 'SHORT'; reason = `RSI ${v.toFixed(1)}. 중립 하단, 힘이 빠지는 중.` }
    }
    analysts.push({ name: 'RSI 선생', emoji: '📏', stance, reason })
  }

  // 3. MACD 박사 — signal cross
  {
    const p = last(macd)
    const prev = macd[macd.length - 2]
    let stance: Stance = 'HOLD'
    let reason = UNKNOWN_REASON
    if (p && prev) {
      const nowDiff = p.macd - p.signal
      const prevDiff = prev.macd - prev.signal
      if (prevDiff <= 0 && nowDiff > 0) { stance = 'LONG'; reason = 'MACD 시그널선 돌파. 매수 신호 발효.' }
      else if (prevDiff >= 0 && nowDiff < 0) { stance = 'SHORT'; reason = 'MACD 시그널선 하향 돌파. 약세 전환.' }
      else if (nowDiff > 0) { stance = 'LONG'; reason = 'MACD가 시그널 위. 상승 추세 유지.' }
      else { stance = 'SHORT'; reason = 'MACD가 시그널 아래. 하방 압력 존재.' }
    }
    analysts.push({ name: 'MACD 박사', emoji: '🎯', stance, reason })
  }

  // 4. BB 형님 — band touch / middle
  {
    const p = last(bb)
    let stance: Stance = 'HOLD'
    let reason = UNKNOWN_REASON
    if (p) {
      const bandwidth = p.upper - p.lower
      const pctB = bandwidth > 0 ? (lastClose - p.lower) / bandwidth : 0.5
      if (pctB <= 0.1) { stance = 'LONG'; reason = '하단 밴드 접촉. 반등 기대해볼만.' }
      else if (pctB >= 0.9) { stance = 'SHORT'; reason = '상단 밴드 터치. 과열, 되돌림 조심.' }
      else if (pctB >= 0.5) { stance = 'LONG'; reason = `%B ${pctB.toFixed(2)}. 상단 쪽이라 강세.` }
      else { stance = 'SHORT'; reason = `%B ${pctB.toFixed(2)}. 하단 쪽이라 약세.` }
    }
    analysts.push({ name: 'BB 형님', emoji: '🎈', stance, reason })
  }

  // 5. 일목 도사 — price vs cloud (spanA/spanB)
  {
    // Ichimoku spanA/spanB are forward-shifted. Compare against most recent value.
    const a = last(ichi.spanA)?.value
    const b = last(ichi.spanB)?.value
    let stance: Stance = 'HOLD'
    let reason = UNKNOWN_REASON
    if (a !== undefined && b !== undefined) {
      const cloudTop = Math.max(a, b)
      const cloudBot = Math.min(a, b)
      if (lastClose > cloudTop) { stance = 'LONG'; reason = '구름 위에 있으니 강세로다. 순응하거라.' }
      else if (lastClose < cloudBot) { stance = 'SHORT'; reason = '구름 아래면 약세. 거스르지 마시게.' }
      else { stance = 'HOLD'; reason = '구름 속이라 방향 불명. 기다리세.' }
    }
    analysts.push({ name: '일목 도사', emoji: '🌫️', stance, reason })
  }

  return analysts
}

export function stanceColor(s: Stance): string {
  if (s === 'LONG') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/50'
  if (s === 'SHORT') return 'text-amber-300 bg-amber-500/15 border-amber-500/50'
  return 'text-slate-300 bg-slate-500/15 border-slate-500/50'
}

export function stanceLabel(s: Stance): string {
  if (s === 'LONG') return '롱'
  if (s === 'SHORT') return '숏'
  return '관망'
}
