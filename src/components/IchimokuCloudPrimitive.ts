import type {
  ISeriesPrimitive,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  SeriesAttachedParameter,
  IChartApiBase,
  ISeriesApi,
  SeriesType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'
import type { CanvasRenderingTarget2D } from 'fancy-canvas'

export interface CloudPoint { time: number; value: number }

type Pt = { x: number; yA: number; yB: number; bullish: boolean }

class CloudRenderer implements IPrimitivePaneRenderer {
  private _segments: Pt[][]
  constructor(segments: Pt[][]) { this._segments = segments }

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context
      const hr = scope.horizontalPixelRatio
      const vr = scope.verticalPixelRatio
      ctx.save()
      for (const seg of this._segments) {
        if (seg.length < 2) continue
        for (let k = 0; k < seg.length - 1; k++) {
          const p0 = seg[k]
          const p1 = seg[k + 1]
          // Handle crossing: if sign differs, find intersection x and split into 2 polygons.
          if (p0.bullish !== p1.bullish) {
            const dx = p1.x - p0.x
            // yA and yB are pixel y. Find where yA line crosses yB line.
            const dA = p1.yA - p0.yA
            const dB = p1.yB - p0.yB
            const denom = dA - dB
            const t = denom === 0 ? 0.5 : (p0.yB - p0.yA) / denom
            const xi = p0.x + dx * t
            const yi = p0.yA + dA * t
            // first half: p0 .. (xi,yi,yi)
            fillTrap(ctx, hr, vr, p0.x, p0.yA, p0.yB, xi, yi, yi, p0.bullish)
            // second half: (xi,yi,yi) .. p1
            fillTrap(ctx, hr, vr, xi, yi, yi, p1.x, p1.yA, p1.yB, p1.bullish)
          } else {
            fillTrap(ctx, hr, vr, p0.x, p0.yA, p0.yB, p1.x, p1.yA, p1.yB, p0.bullish)
          }
        }
      }
      ctx.restore()
    })
  }
}

function fillTrap(
  ctx: CanvasRenderingContext2D, hr: number, vr: number,
  x0: number, yA0: number, yB0: number,
  x1: number, yA1: number, yB1: number,
  bullish: boolean,
) {
  ctx.fillStyle = bullish ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'
  ctx.beginPath()
  ctx.moveTo(x0 * hr, yA0 * vr)
  ctx.lineTo(x1 * hr, yA1 * vr)
  ctx.lineTo(x1 * hr, yB1 * vr)
  ctx.lineTo(x0 * hr, yB0 * vr)
  ctx.closePath()
  ctx.fill()
}

class CloudPaneView implements IPrimitivePaneView {
  private _src: IchimokuCloudPrimitive
  constructor(src: IchimokuCloudPrimitive) { this._src = src }

  zOrder(): 'bottom' | 'normal' | 'top' { return 'bottom' }

  renderer(): IPrimitivePaneRenderer | null {
    const { chart, series, spanA, spanB, visible } = this._src
    if (!visible || !chart || !series || spanA.length === 0 || spanB.length === 0) return null

    const byTime = new Map<number, { a?: number; b?: number }>()
    for (const p of spanA) {
      const e = byTime.get(p.time) ?? {}
      e.a = p.value
      byTime.set(p.time, e)
    }
    for (const p of spanB) {
      const e = byTime.get(p.time) ?? {}
      e.b = p.value
      byTime.set(p.time, e)
    }
    const times = [...byTime.keys()].sort((x, y) => x - y)
    const ts = chart.timeScale()

    // Split into contiguous segments (skip missing points / off-screen coords).
    const segments: Pt[][] = []
    let cur: Pt[] = []
    for (const t of times) {
      const e = byTime.get(t)!
      if (e.a === undefined || e.b === undefined) {
        if (cur.length) { segments.push(cur); cur = [] }
        continue
      }
      const x = ts.timeToCoordinate(t as UTCTimestamp)
      const yA = series.priceToCoordinate(e.a)
      const yB = series.priceToCoordinate(e.b)
      if (x == null || yA == null || yB == null) {
        if (cur.length) { segments.push(cur); cur = [] }
        continue
      }
      cur.push({
        x: x as number,
        yA: yA as number,
        yB: yB as number,
        bullish: (e.a as number) >= (e.b as number),
      })
    }
    if (cur.length) segments.push(cur)

    return new CloudRenderer(segments)
  }
}

export class IchimokuCloudPrimitive implements ISeriesPrimitive<Time> {
  chart: IChartApiBase<Time> | null = null
  series: ISeriesApi<SeriesType, Time> | null = null
  spanA: CloudPoint[] = []
  spanB: CloudPoint[] = []
  visible = false
  private _reqUpdate: (() => void) | null = null
  private _views = [new CloudPaneView(this)]

  attached(p: SeriesAttachedParameter<Time>) {
    this.chart = p.chart
    this.series = p.series
    this._reqUpdate = p.requestUpdate
  }
  detached() {
    this.chart = null
    this.series = null
    this._reqUpdate = null
  }
  updateAllViews(): void {}
  paneViews(): readonly IPrimitivePaneView[] { return this._views }

  setData(a: CloudPoint[], b: CloudPoint[]) {
    this.spanA = a
    this.spanB = b
    this._reqUpdate?.()
  }
  setVisible(v: boolean) {
    if (this.visible === v) return
    this.visible = v
    this._reqUpdate?.()
  }
}

