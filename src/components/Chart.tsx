import { useEffect, useMemo, useRef, useState } from 'react'
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
import {
  smaSeries, emaSeries, wmaSeries, kamaSeries, rsiSeries, macdSeries, ichimokuSeries,
  bollingerBandsSeries, bbPercentBSeries, bbBandWidthSeries,
  superTrendSeries, stochasticSeries, stochRsiSeries, adxSeries,
  cciSeries, williamsRSeries, atrSeries, rocSeries, trixSeries,
  obvSeries, mfiSeries, psarSeries, awesomeOscSeries, vwapSeries,
} from '../lib/indicators'
import { IchimokuCloudPrimitive } from './IchimokuCloudPrimitive'

interface ChartProps {
  candles: Candle[]
  trades: Trade[]
  hideVolume?: boolean   // true for indices (no volume data)
}

type LineData = { time: UTCTimestamp; value: number }
type HistogramData = { time: UTCTimestamp; value: number; color?: string }

interface LineCfg { color: string; style?: LineStyle; lineWidth?: 1 | 2 }

interface OverlayDef {
  key: string
  label: string
  chipColor: string
  defaultOn: boolean
  lines: LineCfg[]
  requiresVolume?: boolean
  special?: 'ichimoku'
  compute: (candles: Candle[]) => LineData[][]
}

interface PaneSeriesCfg {
  kind: 'line' | 'histogram'
  color?: string
  style?: LineStyle
}

interface PaneDef {
  key: string
  label: string
  chipColor: string
  defaultOn: boolean
  height: number
  series: PaneSeriesCfg[]
  refLines?: number[]
  requiresVolume?: boolean
  compute: (candles: Candle[]) => (LineData | HistogramData)[][]
}

const ICHI = {
  tenkan: '#ef4444',
  kijun:  '#3b82f6',
  spanA:  '#22c55e',
  spanB:  '#f97316',
  chikou: '#a855f7',
}

// Time casting helper
const t = (n: number) => n as UTCTimestamp

// Mobile gets thicker lines for legibility on small screens.
const isMobile = typeof window !== 'undefined'
  && window.matchMedia('(max-width: 640px)').matches
const BASE_LW = (isMobile ? 2 : 1) as 1 | 2

const OVERLAY_DEFS: OverlayDef[] = [
  { key: 'sma5',   label: 'SMA5',   chipColor: '#f472b6', defaultOn: true,
    lines: [{ color: '#f472b6' }],
    compute: (c) => [smaSeries(c, 5).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'sma20',  label: 'SMA20',  chipColor: '#fbbf24', defaultOn: true,
    lines: [{ color: '#fbbf24' }],
    compute: (c) => [smaSeries(c, 20).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'sma50',  label: 'SMA50',  chipColor: '#a78bfa', defaultOn: false,
    lines: [{ color: '#a78bfa' }],
    compute: (c) => [smaSeries(c, 50).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'sma120', label: 'SMA120', chipColor: '#14b8a6', defaultOn: false,
    lines: [{ color: '#14b8a6' }],
    compute: (c) => [smaSeries(c, 120).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'ema12',  label: 'EMA12',  chipColor: '#38bdf8', defaultOn: false,
    lines: [{ color: '#38bdf8' }],
    compute: (c) => [emaSeries(c, 12).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'ema26',  label: 'EMA26',  chipColor: '#818cf8', defaultOn: false,
    lines: [{ color: '#818cf8' }],
    compute: (c) => [emaSeries(c, 26).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'wma20',  label: 'WMA20',  chipColor: '#facc15', defaultOn: false,
    lines: [{ color: '#facc15' }],
    compute: (c) => [wmaSeries(c, 20).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'kama',   label: 'KAMA',   chipColor: '#fb923c', defaultOn: false,
    lines: [{ color: '#fb923c', lineWidth: 2 }],
    compute: (c) => [kamaSeries(c, 10, 2, 30).map((p) => ({ time: t(p.time), value: p.value }))] },

  { key: 'bb',     label: 'BB',     chipColor: '#10b981', defaultOn: false,
    lines: [
      { color: '#10b981' },
      { color: '#f59e0b', style: LineStyle.Dashed },
      { color: '#10b981' },
    ],
    compute: (c) => {
      const bb = bollingerBandsSeries(c, 20, 2)
      return [
        bb.map((p) => ({ time: t(p.time), value: p.upper })),
        bb.map((p) => ({ time: t(p.time), value: p.middle })),
        bb.map((p) => ({ time: t(p.time), value: p.lower })),
      ]
    } },
  { key: 'psar',   label: 'PSAR',   chipColor: '#fb7185', defaultOn: false,
    lines: [{ color: '#fb7185', style: LineStyle.Dotted, lineWidth: 2 }],
    compute: (c) => [psarSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'vwap',   label: 'VWAP',   chipColor: '#a3e635', defaultOn: false,
    requiresVolume: true,
    lines: [{ color: '#a3e635' }],
    compute: (c) => [vwapSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'st',     label: 'ST',     chipColor: '#22c55e', defaultOn: false,
    lines: [
      { color: '#22c55e', lineWidth: 2 },
      { color: '#ef4444', lineWidth: 2 },
    ],
    compute: (c) => {
      const st = superTrendSeries(c, 10, 3)
      const up: LineData[] = []
      const down: LineData[] = []
      for (const p of st) {
        if (p.trend === 1) up.push({ time: t(p.time), value: p.value })
        else down.push({ time: t(p.time), value: p.value })
      }
      return [up, down]
    } },

  { key: 'ichimoku', label: '일목', chipColor: '#22c55e', defaultOn: false,
    special: 'ichimoku',
    lines: [
      { color: ICHI.tenkan },
      { color: ICHI.kijun },
      { color: ICHI.spanA },
      { color: ICHI.spanB },
      { color: ICHI.chikou, style: LineStyle.Dashed },
    ],
    compute: (c) => {
      const i = ichimokuSeries(c)
      return [
        i.tenkan.map((p) => ({ time: t(p.time), value: p.value })),
        i.kijun.map((p) => ({ time: t(p.time), value: p.value })),
        i.spanA.map((p) => ({ time: t(p.time), value: p.value })),
        i.spanB.map((p) => ({ time: t(p.time), value: p.value })),
        i.chikou.map((p) => ({ time: t(p.time), value: p.value })),
      ]
    } },
]

const PANE_DEFS: PaneDef[] = [
  // Volume group
  { key: 'volume', label: '거래량', chipColor: '#64748b', defaultOn: false, height: 60,
    requiresVolume: true,
    series: [{ kind: 'histogram' }],
    compute: (c) => [c.map((x) => ({
      time: t(x.time), value: x.volume,
      color: x.close >= x.open ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)',
    }))] },
  { key: 'obv',    label: 'OBV',    chipColor: '#84cc16', defaultOn: false, height: 55,
    requiresVolume: true,
    series: [{ kind: 'line', color: '#84cc16' }],
    compute: (c) => [obvSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'mfi',    label: 'MFI',    chipColor: '#facc15', defaultOn: false, height: 55,
    requiresVolume: true, refLines: [20, 80],
    series: [{ kind: 'line', color: '#facc15' }],
    compute: (c) => [mfiSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },

  // Momentum / oscillators
  { key: 'rsi',    label: 'RSI',    chipColor: '#e879f9', defaultOn: false, height: 55,
    refLines: [30, 70],
    series: [{ kind: 'line', color: '#e879f9' }],
    compute: (c) => [rsiSeries(c, 14).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'macd',   label: 'MACD',   chipColor: '#60a5fa', defaultOn: false, height: 55,
    series: [
      { kind: 'histogram' },
      { kind: 'line', color: '#60a5fa' },
      { kind: 'line', color: '#f97316' },
    ],
    compute: (c) => {
      const m = macdSeries(c)
      return [
        m.map((p) => ({
          time: t(p.time), value: p.histogram,
          color: p.histogram >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)',
        })),
        m.map((p) => ({ time: t(p.time), value: p.macd })),
        m.map((p) => ({ time: t(p.time), value: p.signal })),
      ]
    } },
  { key: 'stoch',  label: 'Stoch',  chipColor: '#fbbf24', defaultOn: false, height: 55,
    refLines: [20, 80],
    series: [
      { kind: 'line', color: '#fbbf24' },
      { kind: 'line', color: '#f97316' },
    ],
    compute: (c) => {
      const s = stochasticSeries(c)
      return [
        s.map((p) => ({ time: t(p.time), value: p.k })),
        s.map((p) => ({ time: t(p.time), value: p.d })),
      ]
    } },
  { key: 'stochrsi', label: 'StochRSI', chipColor: '#c084fc', defaultOn: false, height: 55,
    refLines: [20, 80],
    series: [
      { kind: 'line', color: '#c084fc' },
      { kind: 'line', color: '#f472b6' },
    ],
    compute: (c) => {
      const s = stochRsiSeries(c)
      return [
        s.map((p) => ({ time: t(p.time), value: p.k })),
        s.map((p) => ({ time: t(p.time), value: p.d })),
      ]
    } },
  { key: 'cci',    label: 'CCI',    chipColor: '#2dd4bf', defaultOn: false, height: 55,
    refLines: [-100, 100],
    series: [{ kind: 'line', color: '#2dd4bf' }],
    compute: (c) => [cciSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'wr',     label: '%R',     chipColor: '#fb923c', defaultOn: false, height: 55,
    refLines: [-80, -20],
    series: [{ kind: 'line', color: '#fb923c' }],
    compute: (c) => [williamsRSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'roc',    label: 'ROC',    chipColor: '#d946ef', defaultOn: false, height: 55,
    refLines: [0],
    series: [{ kind: 'line', color: '#d946ef' }],
    compute: (c) => [rocSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'trix',   label: 'TRIX',   chipColor: '#67e8f9', defaultOn: false, height: 55,
    refLines: [0],
    series: [{ kind: 'line', color: '#67e8f9' }],
    compute: (c) => [trixSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'ao',     label: 'AO',     chipColor: '#60a5fa', defaultOn: false, height: 55,
    series: [{ kind: 'histogram' }],
    compute: (c) => {
      const ao = awesomeOscSeries(c)
      return [ao.map((p, i) => ({
        time: t(p.time), value: p.value,
        color: i > 0 && p.value >= ao[i - 1].value
          ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)',
      }))]
    } },

  // Trend / Volatility
  { key: 'adx',    label: 'ADX',    chipColor: '#f87171', defaultOn: false, height: 55,
    refLines: [25],
    series: [
      { kind: 'line', color: '#f87171' },
      { kind: 'line', color: '#22c55e' },
      { kind: 'line', color: '#ef4444' },
    ],
    compute: (c) => {
      const a = adxSeries(c)
      return [
        a.map((p) => ({ time: t(p.time), value: p.adx })),
        a.map((p) => ({ time: t(p.time), value: p.pdi })),
        a.map((p) => ({ time: t(p.time), value: p.mdi })),
      ]
    } },
  { key: 'atr',    label: 'ATR',    chipColor: '#94a3b8', defaultOn: false, height: 55,
    series: [{ kind: 'line', color: '#94a3b8' }],
    compute: (c) => [atrSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'bbpb',   label: '%B',     chipColor: '#34d399', defaultOn: false, height: 55,
    refLines: [0, 0.5, 1],
    series: [{ kind: 'line', color: '#34d399' }],
    compute: (c) => [bbPercentBSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
  { key: 'bbw',    label: 'BBW',    chipColor: '#10b981', defaultOn: false, height: 55,
    series: [{ kind: 'line', color: '#10b981' }],
    compute: (c) => [bbBandWidthSeries(c).map((p) => ({ time: t(p.time), value: p.value }))] },
]

// UI grouping of chips.
const GROUPS: { label: string; keys: string[] }[] = [
  { label: '이평', keys: ['sma5', 'sma20', 'sma50', 'sma120', 'ema12', 'ema26', 'wma20', 'kama'] },
  { label: '가격', keys: ['bb', 'psar', 'vwap', 'st', 'ichimoku'] },
  { label: '모멘텀', keys: ['rsi', 'macd', 'stoch', 'stochrsi', 'cci', 'wr', 'roc', 'trix', 'ao'] },
  { label: '추세·변동', keys: ['adx', 'atr', 'bbpb', 'bbw'] },
  { label: '거래량', keys: ['volume', 'obv', 'mfi'] },
]

const OVERLAY_BY_KEY = new Map(OVERLAY_DEFS.map((d) => [d.key, d]))
const PANE_BY_KEY = new Map(PANE_DEFS.map((d) => [d.key, d]))

export function Chart({ candles, trades, hideVolume = false }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const overlayRefs = useRef<Map<string, ISeriesApi<'Line'>[]>>(new Map())
  const paneSeriesRefs = useRef<Map<string, ISeriesApi<'Line' | 'Histogram'>[]>>(new Map())
  const paneRefLineRefs = useRef<Map<string, ISeriesApi<'Line'>[]>>(new Map())
  const cloudRef = useRef<IchimokuCloudPrimitive | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)

  const [overlayOn, setOverlayOn] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {}
    for (const d of OVERLAY_DEFS) o[d.key] = d.defaultOn
    return o
  })
  const [paneOn, setPaneOn] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {}
    for (const d of PANE_DEFS) o[d.key] = d.defaultOn
    return o
  })

  // Signature of active panes (drives chart re-init since pane layout is static per-init).
  const activePanes = useMemo(
    () => PANE_DEFS.filter((d) => paneOn[d.key] && !(d.requiresVolume && hideVolume)),
    [paneOn, hideVolume],
  )
  const paneSig = activePanes.map((d) => d.key).join(',')

  // Build chart whenever pane layout changes.
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: '#12151c' },
        textColor: '#e5e7eb',
        panes: { separatorColor: '#252a36', separatorHoverColor: '#333a4d', enableResize: true },
      },
      grid: { vertLines: { color: '#1f2430' }, horzLines: { color: '#1f2430' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#252a36' },
      timeScale: { borderColor: '#252a36', timeVisible: true, secondsVisible: false },
    })
    chartRef.current = chart

    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
      borderVisible: false,
    }, 0)

    // Overlay series on pane 0
    overlayRefs.current.clear()
    for (const def of OVERLAY_DEFS) {
      if (def.requiresVolume && hideVolume) continue
      const on = overlayOn[def.key]
      const refs: ISeriesApi<'Line'>[] = []
      for (const lc of def.lines) {
        const s = chart.addSeries(LineSeries, {
          color: lc.color,
          lineWidth: lc.lineWidth ?? BASE_LW,
          lineStyle: lc.style ?? LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: false,
          visible: on,
        }, 0)
        refs.push(s)
      }
      overlayRefs.current.set(def.key, refs)
    }

    // Ichimoku cloud primitive
    const cloud = new IchimokuCloudPrimitive()
    cloud.visible = overlayOn.ichimoku
    candleSeriesRef.current.attachPrimitive(cloud)
    cloudRef.current = cloud

    // Separate panes
    paneSeriesRefs.current.clear()
    paneRefLineRefs.current.clear()
    let nextPane = 1
    for (const def of activePanes) {
      const paneIdx = nextPane++
      const refs: ISeriesApi<'Line' | 'Histogram'>[] = []
      for (const sc of def.series) {
        if (sc.kind === 'line') {
          refs.push(chart.addSeries(LineSeries, {
            color: sc.color ?? '#94a3b8',
            lineWidth: BASE_LW,
            lineStyle: sc.style ?? LineStyle.Solid,
            priceLineVisible: false, lastValueVisible: false,
          }, paneIdx))
        } else {
          refs.push(chart.addSeries(HistogramSeries, {
            color: sc.color ?? '#64748b',
            priceFormat: def.key === 'volume' ? { type: 'volume' } : undefined,
            priceLineVisible: false, lastValueVisible: false,
          }, paneIdx))
        }
      }
      paneSeriesRefs.current.set(def.key, refs)

      if (def.refLines && def.refLines.length) {
        const rl: ISeriesApi<'Line'>[] = def.refLines.map(() => chart.addSeries(LineSeries, {
          color: '#475569', lineWidth: 1, lineStyle: LineStyle.Dashed,
          priceLineVisible: false, lastValueVisible: false,
        }, paneIdx))
        paneRefLineRefs.current.set(def.key, rl)
      }
    }

    markersRef.current = createSeriesMarkers(candleSeriesRef.current, [])

    requestAnimationFrame(() => {
      const panes = chart.panes()
      // Leave pane 0 unset so it expands into remaining container space.
      let pi = 1
      for (const def of activePanes) {
        if (panes[pi]) panes[pi].setHeight(def.height)
        pi++
      }
    })

    return () => {
      chart.remove()
      chartRef.current = null
      overlayRefs.current.clear()
      paneSeriesRefs.current.clear()
      paneRefLineRefs.current.clear()
      cloudRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paneSig, hideVolume])

  // Toggle overlay visibility without rebuilding the chart.
  useEffect(() => {
    for (const def of OVERLAY_DEFS) {
      const refs = overlayRefs.current.get(def.key)
      if (!refs) continue
      for (const s of refs) s.applyOptions({ visible: overlayOn[def.key] })
    }
    cloudRef.current?.setVisible(!!overlayOn.ichimoku)
  }, [overlayOn])

  // Update all data when candles change.
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return

    candleSeriesRef.current!.setData(candles.map((c) => ({
      time: t(c.time), open: c.open, high: c.high, low: c.low, close: c.close,
    })))

    for (const def of OVERLAY_DEFS) {
      const refs = overlayRefs.current.get(def.key)
      if (!refs) continue
      const data = def.compute(candles)
      for (let i = 0; i < refs.length; i++) refs[i].setData(data[i] ?? [])
      if (def.special === 'ichimoku' && cloudRef.current) {
        cloudRef.current.setData(
          (data[2] ?? []).map((p) => ({ time: p.time as number, value: p.value })),
          (data[3] ?? []).map((p) => ({ time: p.time as number, value: p.value })),
        )
      }
    }

    for (const def of activePanes) {
      const refs = paneSeriesRefs.current.get(def.key)
      if (!refs) continue
      const data = def.compute(candles)
      for (let i = 0; i < refs.length; i++) {
        const s = refs[i]
        const d = data[i] ?? []
        // Both LineData and HistogramData are compatible with the respective series API.
        ;(s as ISeriesApi<'Line' | 'Histogram'>).setData(d as never)
      }
      // Reference lines use the first data series' time range for x-alignment.
      const rl = paneRefLineRefs.current.get(def.key)
      if (rl && def.refLines && data[0] && data[0].length > 0) {
        const times = data[0].map((p) => p.time)
        for (let i = 0; i < rl.length; i++) {
          rl[i].setData(times.map((tm) => ({ time: tm, value: def.refLines![i] })))
        }
      }
    }

    // Trailing ~1 year visible window
    const WINDOW = 252
    const lastIdx = candles.length - 1
    const fromIdx = Math.max(0, lastIdx - WINDOW + 1)
    chartRef.current.timeScale().setVisibleLogicalRange({ from: fromIdx, to: lastIdx })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, paneSig, hideVolume])

  useEffect(() => {
    if (!markersRef.current) return
    const style: Record<
      typeof trades[number]['side'],
      { color: string; pos: 'aboveBar' | 'belowBar'; shape: 'arrowUp' | 'arrowDown'; label: string }
    > = {
      BUY:   { color: '#22c55e', pos: 'belowBar', shape: 'arrowUp',   label: '▲ 매수' },
      SELL:  { color: '#ef4444', pos: 'aboveBar', shape: 'arrowDown', label: '▼ 매도' },
      SHORT: { color: '#f59e0b', pos: 'aboveBar', shape: 'arrowDown', label: '▼ 공매도' },
      COVER: { color: '#3b82f6', pos: 'belowBar', shape: 'arrowUp',   label: '▲ 환매' },
    }
    const markers: SeriesMarker<Time>[] = trades.map((tr) => ({
      time: t(tr.time),
      position: style[tr.side].pos,
      color: style[tr.side].color,
      shape: style[tr.side].shape,
      size: 3,
      text: style[tr.side].label,
    }))
    markersRef.current.setMarkers(markers)
  }, [trades, paneSig])

  const toggleKey = (key: string) => {
    if (OVERLAY_BY_KEY.has(key)) setOverlayOn((s) => ({ ...s, [key]: !s[key] }))
    else if (PANE_BY_KEY.has(key)) setPaneOn((s) => ({ ...s, [key]: !s[key] }))
  }

  const [indicatorOpen, setIndicatorOpen] = useState(false)

  // Count active indicators for the badge
  const activeCount = useMemo(() => {
    let count = 0
    for (const d of OVERLAY_DEFS) if (overlayOn[d.key]) count++
    for (const d of PANE_DEFS) if (paneOn[d.key]) count++
    return count
  }, [overlayOn, paneOn])

  const chipPanel = GROUPS.map((g) => {
    const chips = g.keys
      .map((k) => {
        const od = OVERLAY_BY_KEY.get(k)
        if (od) {
          if (od.requiresVolume && hideVolume) return null
          return { key: k, label: od.label, color: od.chipColor, on: !!overlayOn[k] }
        }
        const pd = PANE_BY_KEY.get(k)
        if (pd) {
          if (pd.requiresVolume && hideVolume) return null
          return { key: k, label: pd.label, color: pd.chipColor, on: !!paneOn[k] }
        }
        return null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
    if (chips.length === 0) return null
    return (
      <div key={g.label} className="flex flex-wrap items-center gap-1">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#64748b] w-12 sm:w-14 shrink-0">
          {g.label}
        </span>
        {chips.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            color={c.color}
            on={c.on}
            onToggle={() => toggleKey(c.key)}
          />
        ))}
      </div>
    )
  })

  return (
    <div className="w-full h-full flex flex-col">
      {/* Desktop: always show chips */}
      <div className="hidden sm:flex shrink-0 flex-col gap-1 p-2 bg-[#12151c]/90 border-b border-[#252a36]">
        {chipPanel}
      </div>

      {/* Mobile: collapsible */}
      <div className="sm:hidden shrink-0 bg-[#12151c]/90 border-b border-[#252a36]">
        <button
          type="button"
          onClick={() => setIndicatorOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-[#8b93a7] active:bg-[#1a1e27]"
        >
          <span className="flex items-center gap-1.5">
            <span>지표</span>
            {activeCount > 0 && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                {activeCount}
              </span>
            )}
          </span>
          <span className={`transition-transform ${indicatorOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {indicatorOpen && (
          <div className="flex flex-col gap-1 px-2 pb-2">
            {chipPanel}
          </div>
        )}
      </div>

      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  )
}

function Chip({
  label, color, on, onToggle,
}: { label: string; color: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1 px-2 py-1 sm:px-1.5 sm:py-0.5 rounded border text-[11px] sm:text-[10px] font-mono font-semibold transition min-h-[28px] sm:min-h-0 active:scale-95 ${
        on
          ? 'bg-[#12151c]/85 border-[#333a4d] text-[#e5e7eb] hover:bg-[#1a1e27]/90'
          : 'bg-[#12151c]/60 border-[#252a36] text-[#64748b] hover:text-[#8b93a7] line-through'
      }`}
      title={on ? `${label} 숨기기` : `${label} 표시`}
    >
      <span
        className="inline-block w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-sm"
        style={{ backgroundColor: on ? color : '#3a3f4b' }}
      />
      {label}
      <span className="opacity-60">{on ? '×' : '+'}</span>
    </button>
  )
}
