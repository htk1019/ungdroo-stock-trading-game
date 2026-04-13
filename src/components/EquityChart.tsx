import { useEffect, useRef } from 'react'
import {
  createChart, LineSeries, type IChartApi, type UTCTimestamp,
} from 'lightweight-charts'

interface EquityChartProps {
  times: number[]
  player: number[]
  buyHold: number[]
}

export function EquityChart({ times, player, buyHold }: EquityChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, {
      autoSize: true,
      layout: { background: { color: '#12151c' }, textColor: '#e5e7eb' },
      grid: { vertLines: { color: '#1f2430' }, horzLines: { color: '#1f2430' } },
      rightPriceScale: { borderColor: '#252a36' },
      timeScale: { borderColor: '#252a36', timeVisible: true, secondsVisible: false },
    })
    chartRef.current = chart

    const playerSeries = chart.addSeries(LineSeries, {
      color: '#818cf8', lineWidth: 2, title: '내 자산',
    })
    const bhSeries = chart.addSeries(LineSeries, {
      color: '#94a3b8', lineWidth: 2, title: 'Buy & Hold',
    })

    playerSeries.setData(
      times.map((t, i) => ({ time: t as UTCTimestamp, value: player[i] })),
    )
    bhSeries.setData(
      times.map((t, i) => ({ time: t as UTCTimestamp, value: buyHold[i] })),
    )
    chart.timeScale().fitContent()

    return () => { chart.remove(); chartRef.current = null }
  }, [times, player, buyHold])

  return <div ref={ref} className="w-full h-full" />
}
