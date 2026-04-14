import { useEffect, useRef } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createSeriesMarkers,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type UTCTimestamp,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts'
import type { Candle } from '../lib/yahoo'
import type { Trade } from '../lib/engine'
import { smaSeries, emaSeries, rsiSeries, macdSeries } from '../lib/indicators'

interface ChartProps {
  candles: Candle[]
  trades: Trade[]
  hideVolume?: boolean   // true for indices (no volume data)
}

export function Chart({ candles, trades, hideVolume = false }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const sma5Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const sma20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const sma50Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const sma120Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ema12Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const rsiRef = useRef<ISeriesApi<'Line'> | null>(null)
  const rsi30Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const rsi70Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const macdRef = useRef<ISeriesApi<'Line'> | null>(null)
  const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null)
  const macdHistRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)

  // Build chart once — re-init if hideVolume flips (different pane layout).
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: '#12151c' },
        textColor: '#e5e7eb',
        panes: { separatorColor: '#252a36', separatorHoverColor: '#333a4d', enableResize: true },
      },
      grid: {
        vertLines: { color: '#1f2430' },
        horzLines: { color: '#1f2430' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#252a36' },
      timeScale: { borderColor: '#252a36', timeVisible: true, secondsVisible: false },
    })
    chartRef.current = chart

    const volPane = hideVolume ? -1 : 1
    const rsiPane = hideVolume ? 1 : 2
    const macdPane = hideVolume ? 2 : 3

    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
      borderVisible: false,
    }, 0)
    sma5Ref.current = chart.addSeries(LineSeries, {
      color: '#f472b6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    }, 0)
    sma20Ref.current = chart.addSeries(LineSeries, {
      color: '#fbbf24', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    }, 0)
    sma50Ref.current = chart.addSeries(LineSeries, {
      color: '#a78bfa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    }, 0)
    sma120Ref.current = chart.addSeries(LineSeries, {
      color: '#14b8a6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    }, 0)
    ema12Ref.current = chart.addSeries(LineSeries, {
      color: '#38bdf8', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    }, 0)

    if (!hideVolume) {
      volSeriesRef.current = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        color: '#64748b',
        priceLineVisible: false, lastValueVisible: false,
      }, volPane)
    } else {
      volSeriesRef.current = null
    }

    rsiRef.current = chart.addSeries(LineSeries, {
      color: '#e879f9', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    }, rsiPane)
    rsi30Ref.current = chart.addSeries(LineSeries, {
      color: '#475569', lineWidth: 1, lineStyle: LineStyle.Dashed,
      priceLineVisible: false, lastValueVisible: false,
    }, rsiPane)
    rsi70Ref.current = chart.addSeries(LineSeries, {
      color: '#475569', lineWidth: 1, lineStyle: LineStyle.Dashed,
      priceLineVisible: false, lastValueVisible: false,
    }, rsiPane)

    macdHistRef.current = chart.addSeries(HistogramSeries, {
      priceLineVisible: false, lastValueVisible: false,
    }, macdPane)
    macdRef.current = chart.addSeries(LineSeries, {
      color: '#60a5fa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    }, macdPane)
    macdSignalRef.current = chart.addSeries(LineSeries, {
      color: '#f97316', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    }, macdPane)

    markersRef.current = createSeriesMarkers(candleSeriesRef.current, [])

    requestAnimationFrame(() => {
      const panes = chart.panes()
      if (panes[0]) panes[0].setHeight(440)
      if (!hideVolume && panes[1]) panes[1].setHeight(60)
      if (panes[rsiPane]) panes[rsiPane].setHeight(55)
      if (panes[macdPane]) panes[macdPane].setHeight(55)
    })

    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [hideVolume])

  // Update data when candles change
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return

    const candleData = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open, high: c.high, low: c.low, close: c.close,
    }))
    candleSeriesRef.current!.setData(candleData)

    if (volSeriesRef.current) {
      const volData = candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)',
      }))
      volSeriesRef.current.setData(volData)
    }

    const sma5   = smaSeries(candles, 5).map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
    const sma20  = smaSeries(candles, 20).map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
    const sma50  = smaSeries(candles, 50).map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
    const sma120 = smaSeries(candles, 120).map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
    const ema12  = emaSeries(candles, 12).map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
    sma5Ref.current!.setData(sma5)
    sma20Ref.current!.setData(sma20)
    sma50Ref.current!.setData(sma50)
    sma120Ref.current!.setData(sma120)
    ema12Ref.current!.setData(ema12)

    const rsi = rsiSeries(candles, 14).map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
    rsiRef.current!.setData(rsi)
    if (rsi.length > 0) {
      rsi30Ref.current!.setData(rsi.map((p) => ({ time: p.time, value: 30 })))
      rsi70Ref.current!.setData(rsi.map((p) => ({ time: p.time, value: 70 })))
    }

    const macd = macdSeries(candles)
    macdRef.current!.setData(macd.map((p) => ({ time: p.time as UTCTimestamp, value: p.macd })))
    macdSignalRef.current!.setData(macd.map((p) => ({ time: p.time as UTCTimestamp, value: p.signal })))
    macdHistRef.current!.setData(macd.map((p) => ({
      time: p.time as UTCTimestamp,
      value: p.histogram,
      color: p.histogram >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)',
    })))

    // Show only the trailing ~1 year (252 daily bars) so the view is always
    // "last 1 year up to the current candle" regardless of how far the game
    // has progressed.
    const WINDOW = 252
    const lastIdx = candles.length - 1
    const fromIdx = Math.max(0, lastIdx - WINDOW + 1)
    chartRef.current.timeScale().setVisibleLogicalRange({ from: fromIdx, to: lastIdx })
  }, [candles])

  useEffect(() => {
    if (!markersRef.current) return
    // Korean labels + stronger colors so buy/sell points pop against the
    // candle chart.
    const style: Record<
      typeof trades[number]['side'],
      { color: string; pos: 'aboveBar' | 'belowBar'; shape: 'arrowUp' | 'arrowDown'; label: string }
    > = {
      BUY:   { color: '#16a34a', pos: 'belowBar', shape: 'arrowUp',   label: '매수' },
      SELL:  { color: '#dc2626', pos: 'aboveBar', shape: 'arrowDown', label: '매도' },
      SHORT: { color: '#d97706', pos: 'aboveBar', shape: 'arrowDown', label: '공매도' },
      COVER: { color: '#0284c7', pos: 'belowBar', shape: 'arrowUp',   label: '환매' },
    }
    const markers: SeriesMarker<Time>[] = trades.map((t) => ({
      time: t.time as UTCTimestamp,
      position: style[t.side].pos,
      color: style[t.side].color,
      shape: style[t.side].shape,
      size: 2,
      text: style[t.side].label,
    }))
    markersRef.current.setMarkers(markers)
  }, [trades])

  return <div ref={containerRef} className="w-full h-full" />
}
