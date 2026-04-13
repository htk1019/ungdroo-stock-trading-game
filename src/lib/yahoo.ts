export type Interval = '1d' | '1wk' | '1mo' | '3mo'

export interface Candle {
  time: number // unix seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface YahooChartResp {
  chart: {
    result?: Array<{
      meta: { symbol: string; currency?: string; exchangeName?: string }
      timestamp: number[]
      indicators: {
        quote: Array<{
          open: (number | null)[]
          high: (number | null)[]
          low: (number | null)[]
          close: (number | null)[]
          volume: (number | null)[]
        }>
        adjclose?: Array<{ adjclose: (number | null)[] }>
      }
    }>
    error?: { code: string; description: string } | null
  }
}

export async function fetchHistory(
  symbol: string,
  interval: Interval,
): Promise<{ symbol: string; candles: Candle[] }> {
  // Use explicit period1/period2 bounds instead of range=max. Yahoo caps
  // non-US tickers (e.g. .KS, .T) at ~316 bars when using range=max but
  // returns full history when given explicit unix timestamps.
  const url = `/yf/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&period1=0&period2=2000000000&includePrePost=false&events=div%2Csplit`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)
  const data: YahooChartResp = await res.json()
  if (data.chart.error) throw new Error(data.chart.error.description)
  const r = data.chart.result?.[0]
  if (!r) throw new Error('No chart result')

  const ts = r.timestamp
  const q = r.indicators.quote[0]
  const adj = r.indicators.adjclose?.[0]?.adjclose
  const candles: Candle[] = []
  for (let i = 0; i < ts.length; i++) {
    const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i], v = q.volume[i]
    if (o == null || h == null || l == null || c == null) continue
    // Scale OHLC by the adjustment factor so back-adjusted prices (splits +
    // dividends) are used throughout the game. Fall back to raw close if
    // adjclose is missing (some tickers / older data).
    const a = adj?.[i]
    const factor = a != null && c !== 0 ? a / c : 1
    candles.push({
      time: ts[i],
      open: o * factor,
      high: h * factor,
      low: l * factor,
      close: c * factor,
      volume: v ?? 0,
    })
  }
  return { symbol: r.meta.symbol, candles }
}
