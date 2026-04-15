import type { Candle } from './yahoo'
import {
  smaSeries, rsiSeries, macdSeries, bollingerBandsSeries, ichimokuSeries,
} from './indicators'

export type Stance = 'LONG' | 'SHORT' | 'HOLD'
export type AnalystGroup = 'trend' | 'band' | 'ichimoku'

export const GROUP_LABEL: Record<AnalystGroup, string> = {
  trend: '추세추종',
  band: '밴드',
  ichimoku: '일목균형표',
}

export interface Analyst {
  name: string
  emoji: string
  stance: Stance
  reason: string
  group: AnalystGroup
}

const UNKNOWN_REASON = '데이터가 부족해서 말을 아끼겠다.'

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

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

  // 1. 이평 할배 — 경상도 할아버지 말투, SMA5 vs SMA20 crossover
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
      if (crossUp) {
        stance = 'LONG'
        reason = pick([
          '어이 골든크로스 떴다카이! 이럴 때 안 타믄 우야노!',
          '야야, 5선이 20선 뚫었데이. 할배 때도 이럴 땐 샀다 마.',
          '골든크로스 떴구마. 손주야, 얼른 한 주라도 사둬라.',
        ])
      } else if (crossDown) {
        stance = 'SHORT'
        reason = pick([
          '데드크로스 떴데이… 할배 손모가지 걸고 손절각이다 마.',
          '아이고야 5선이 20선 밑으로 갔뿟네. 튀어라, 튀어!',
          '떨어질 놈은 떨어진다카이. 할배 말 안 들으면 후회한다.',
        ])
      } else if (a > b) {
        stance = 'LONG'
        reason = pick([
          '단기선이 장기선 위에 있으이. 추세 살아있데이.',
          '위에서 놀고 있구마. 분위기 좋다 좋다.',
        ])
      } else {
        stance = 'SHORT'
        reason = pick([
          '단기선이 밑에 깔려있데이. 분위기 영 글렀다 마.',
          '할배 눈엔 영 아이다. 조심하그라.',
        ])
      }
    }
    analysts.push({ name: '이평 할배', emoji: '🧓', stance, reason, group: 'trend' })
  }

  // 2. RSI 선생 — 엄격한 학원 강사 말투
  {
    const v = last(rsi)?.value
    let stance: Stance = 'HOLD'
    let reason = UNKNOWN_REASON
    if (v !== undefined) {
      if (v < 30) {
        stance = 'LONG'
        reason = pick([
          `자, RSI ${v.toFixed(1)}. 교과서에 나오는 과매도 구간입니다. 안 사면 시험에서 감점.`,
          `RSI ${v.toFixed(1)} — 이 정도면 반등 안 오면 제가 강의 그만둡니다.`,
        ])
      } else if (v > 70) {
        stance = 'SHORT'
        reason = pick([
          `RSI ${v.toFixed(1)}. 과열입니다. 욕심 부리는 학생은 항상 물려요.`,
          `${v.toFixed(1)}이면 상투 냄새 납니다. 분할 매도라도 하세요, 제발.`,
        ])
      } else if (v > 50) {
        stance = 'LONG'
        reason = pick([
          `RSI ${v.toFixed(1)}. 중립 상단입니다. 모멘텀은 살아있어요, 집중하세요.`,
          `${v.toFixed(1)} — 괜찮습니다. 다만 방심은 금물.`,
        ])
      } else {
        stance = 'SHORT'
        reason = pick([
          `RSI ${v.toFixed(1)}. 중립 하단. 힘이 빠지고 있습니다, 주의하세요.`,
          `${v.toFixed(1)} — 애매하지만 약세 쪽입니다. 과제 다시 풀어보세요.`,
        ])
      }
    }
    analysts.push({ name: 'RSI 선생', emoji: '📏', stance, reason, group: 'band' })
  }

  // 3. MACD 박사 — 영어 섞는 잘난척 학자
  {
    const p = last(macd)
    const prev = macd[macd.length - 2]
    let stance: Stance = 'HOLD'
    let reason = UNKNOWN_REASON
    if (p && prev) {
      const nowDiff = p.macd - p.signal
      const prevDiff = prev.macd - prev.signal
      if (prevDiff <= 0 && nowDiff > 0) {
        stance = 'LONG'
        reason = pick([
          'Bullish crossover가 방금 confirm 되었군요. 포지션 진입, reasonable합니다.',
          '시그널선을 upward로 돌파. 이건 textbook buy signal입니다, 동료들.',
        ])
      } else if (prevDiff >= 0 && nowDiff < 0) {
        stance = 'SHORT'
        reason = pick([
          'Bearish crossover 발생. momentum이 reverse 되었습니다, 안타깝지만.',
          '시그널선 하향 break. 제 paper에서도 언급한 패턴입니다.',
        ])
      } else if (nowDiff > 0) {
        stance = 'LONG'
        reason = pick([
          'MACD가 시그널선 위에서 stable. 추세가 intact합니다.',
          'Positive momentum 유지 중. Hold the line.',
        ])
      } else {
        stance = 'SHORT'
        reason = pick([
          'MACD가 시그널선 아래. Downward pressure가 present합니다.',
          'Negative divergence 가능성, caution 권고합니다.',
        ])
      }
    }
    analysts.push({ name: 'MACD 박사', emoji: '🎯', stance, reason, group: 'trend' })
  }

  // 4. BB 형님 — 건달/형님 말투
  {
    const p = last(bb)
    let stance: Stance = 'HOLD'
    let reason = UNKNOWN_REASON
    if (p) {
      const bandwidth = p.upper - p.lower
      const pctB = bandwidth > 0 ? (lastClose - p.lower) / bandwidth : 0.5
      if (pctB <= 0.1) {
        stance = 'LONG'
        reason = pick([
          '야 바닥 찍었다. 형님 믿고 가라, 이 밴드 튕길 때 됐다.',
          '하단 밴드 박았네… 여기서 안 사면 나중에 땅을 치고 후회한다.',
        ])
      } else if (pctB >= 0.9) {
        stance = 'SHORT'
        reason = pick([
          '야 천장 쳤어. 여기서 더 따라가? 개미들 장례식 가고 싶냐?',
          '상단 밴드 찍었다. 고점에서 도망쳐, 빨리.',
        ])
      } else if (pctB >= 0.5) {
        stance = 'LONG'
        reason = pick([
          `%B ${pctB.toFixed(2)} — 중간 위다. 형님이 봤을 땐 아직 갈 수 있어.`,
          '상단 쪽에 붙어있네. 추세 좀 더 본다.',
        ])
      } else {
        stance = 'SHORT'
        reason = pick([
          `%B ${pctB.toFixed(2)} — 하단 쪽이야. 형님 감으론 별로다.`,
          '분위기 안 좋다. 몸 사려라.',
        ])
      }
    }
    analysts.push({ name: 'BB 형님', emoji: '🎈', stance, reason, group: 'band' })
  }

  // 5. 일목 도사 — 무협/선인 말투
  {
    const a = last(ichi.spanA)?.value
    const b = last(ichi.spanB)?.value
    let stance: Stance = 'HOLD'
    let reason = UNKNOWN_REASON
    if (a !== undefined && b !== undefined) {
      const cloudTop = Math.max(a, b)
      const cloudBot = Math.min(a, b)
      if (lastClose > cloudTop) {
        stance = 'LONG'
        reason = pick([
          '가격이 구름 위에 올라섰노라. 하늘의 뜻이니 순응하시게.',
          '구름 위는 양(陽)의 기운이 성하도다. 주저 말고 나아가라.',
        ])
      } else if (lastClose < cloudBot) {
        stance = 'SHORT'
        reason = pick([
          '구름 아래는 음(陰)의 기운이니라. 거스르는 자는 패한다.',
          '가격이 구름 밑에 있거늘, 어찌 사려 하는가. 멈추시게.',
        ])
      } else {
        stance = 'HOLD'
        reason = pick([
          '구름 속은 혼돈이로다. 길이 보이지 않으니 기다림이 상책이네.',
          '음양이 다투는 중이라. 섣부른 움직임은 화를 부르노라.',
        ])
      }
    }
    analysts.push({ name: '일목 도사', emoji: '🌫️', stance, reason, group: 'ichimoku' })
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
