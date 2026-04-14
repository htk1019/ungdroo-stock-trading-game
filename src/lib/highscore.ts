const KEY = 'stock-game:high-score'

export interface HighScore {
  returnPct: number
  symbol: string
  symbolName?: string
  at: number  // unix ms
}

export function loadHighScore(): HighScore | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (typeof v?.returnPct !== 'number' || typeof v?.symbol !== 'string') return null
    return v as HighScore
  } catch {
    return null
  }
}

// Returns the score that should be shown as "best" after considering `score`.
// If `score` beats the stored record, it is saved and returned.
export function recordHighScore(score: HighScore): { best: HighScore; isNew: boolean } {
  const prev = loadHighScore()
  if (!prev || score.returnPct > prev.returnPct) {
    localStorage.setItem(KEY, JSON.stringify(score))
    return { best: score, isNew: true }
  }
  return { best: prev, isNew: false }
}
