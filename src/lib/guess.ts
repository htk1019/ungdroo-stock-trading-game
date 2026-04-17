import { fetchHistory, type Candle } from './yahoo'
import { pickRandomTicker, findTicker, type Category } from './tickers'

export const GUESS_CHART_COUNT = 20
export const GUESS_WARMUP_DAYS = 252 // ≈ 1년치

export interface GuessHorizon {
  key: 'd' | 'w' | 'm'
  label: string          // 일 / 주 / 월
  days: number
}

export const GUESS_HORIZONS: GuessHorizon[] = [
  { key: 'd', label: '일', days: 1 },
  { key: 'w', label: '주', days: 5 },
  { key: 'm', label: '월', days: 21 },
]

export const DEFAULT_GUESS_HORIZON: GuessHorizon = GUESS_HORIZONS[1] // 주

export interface GuessChart {
  symbol: string
  name: string
  warmup: Candle[]      // 보이는 1년치
  future: Candle[]      // horizon.days 만큼의 정답 구간
  answerUp: boolean     // future 끝의 close > warmup 끝의 close
}

export interface GuessGameState {
  charts: GuessChart[]
  horizon: GuessHorizon
  step: number           // 현재 문제 index (0 ~ charts.length)
  guesses: boolean[]     // true=상승 예측, false=하락 예측
  correct: boolean[]
  ended: boolean
}

export function initGuessGame(charts: GuessChart[], horizon: GuessHorizon): GuessGameState {
  return { charts, horizon, step: 0, guesses: [], correct: [], ended: false }
}

export function submitGuess(g: GuessGameState, up: boolean): { correct: boolean; done: boolean } {
  if (g.ended) return { correct: false, done: true }
  const c = g.charts[g.step]
  const isCorrect = up === c.answerUp
  g.guesses.push(up)
  g.correct.push(isCorrect)
  g.step += 1
  if (g.step >= g.charts.length) g.ended = true
  return { correct: isCorrect, done: g.ended }
}

export interface GuessStats {
  total: number
  wins: number
  winRate: number
}

export function guessStats(g: GuessGameState): GuessStats {
  const total = g.correct.length
  const wins = g.correct.filter(Boolean).length
  const winRate = total > 0 ? (wins / total) * 100 : 0
  return { total, wins, winRate }
}

// 20개의 무작위 차트를 준비한다. 각 차트는 warmup 252일 + 정답 horizon.days일.
export async function prepareGuessCharts(
  categories: Category[],
  count: number,
  horizon: GuessHorizon,
  onProgress: (loaded: number, total: number) => void,
): Promise<GuessChart[]> {
  const charts: GuessChart[] = []
  const tried = new Set<string>()
  onProgress(0, count)
  const need = GUESS_WARMUP_DAYS + horizon.days
  const maxAttempts = count * 6
  let attempts = 0
  while (charts.length < count && attempts < maxAttempts) {
    attempts++
    const pick = pickRandomTicker(categories, tried)
    tried.add(pick.symbol)
    try {
      const { symbol, candles } = await fetchHistory(pick.symbol, '1d')
      if (candles.length < need + 5) continue
      const maxStart = candles.length - need
      const start = Math.floor(Math.random() * (maxStart + 1))
      const warmup = candles.slice(start, start + GUESS_WARMUP_DAYS)
      const future = candles.slice(start + GUESS_WARMUP_DAYS, start + GUESS_WARMUP_DAYS + horizon.days)
      const last = warmup[warmup.length - 1]
      const end = future[future.length - 1]
      if (end.close === last.close) continue // 동가는 스킵
      charts.push({
        symbol,
        name: findTicker(symbol)?.name ?? pick.name,
        warmup,
        future,
        answerUp: end.close > last.close,
      })
      onProgress(charts.length, count)
    } catch (e) {
      console.warn('guess fetch failed for', pick.symbol, e)
      continue
    }
  }
  if (charts.length < count) {
    throw new Error(`차트 불러오기 실패: ${charts.length}/${count} 개만 준비됨. 카테고리를 더 추가해보세요.`)
  }
  return charts
}
