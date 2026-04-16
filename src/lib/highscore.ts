const KEY = 'stock-game:high-score:v2'
const RECENT_KEY = 'stock-game:recent:v1'
const RECENT_MAX = 10

export interface HighScore {
  cagrPct: number
  symbol: string
  symbolName?: string
  at: number  // unix ms
}

export function loadHighScore(): HighScore | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (typeof v?.cagrPct !== 'number' || typeof v?.symbol !== 'string') return null
    return v as HighScore
  } catch {
    return null
  }
}

// Returns the score that should be shown as "best" after considering `score`.
// If `score` beats the stored record, it is saved and returned.
export function recordHighScore(score: HighScore): { best: HighScore; isNew: boolean } {
  const prev = loadHighScore()
  if (!prev || score.cagrPct > prev.cagrPct) {
    localStorage.setItem(KEY, JSON.stringify(score))
    return { best: score, isNew: true }
  }
  return { best: prev, isNew: false }
}

export function loadRecentGames(): HighScore[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const v = JSON.parse(raw)
    if (!Array.isArray(v)) return []
    return v.filter((x) => typeof x?.cagrPct === 'number' && typeof x?.symbol === 'string') as HighScore[]
  } catch {
    return []
  }
}

export function addRecentGame(score: HighScore): HighScore[] {
  const prev = loadRecentGames()
  const next = [score, ...prev].slice(0, RECENT_MAX)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

export function clearRecentGames() {
  localStorage.removeItem(RECENT_KEY)
}
