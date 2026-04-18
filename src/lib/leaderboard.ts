import {
  collection, addDoc, query, orderBy, limit, getDocs, where,
  deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { containsProfanity } from './profanity'

const COLLECTION = 'leaderboard'
const NICK_KEY = 'stock-game:nickname'

export interface LeaderboardEntry {
  nickname: string
  cagrPct: number
  alphaPct: number
  mddPct: number        // 음수 (예: -15 = 최대낙폭 15%)
  winRatePct: number    // 0~100 (라운드 기준)
  score: number
  symbol: string
  symbolName?: string
  rounds: number
  trades: number
  createdAt: unknown // serverTimestamp
}

export interface LeaderboardRow {
  nickname: string
  cagrPct: number
  alphaPct: number
  mddPct: number
  winRatePct: number
  score: number
  symbol: string
  symbolName?: string
  rounds: number
  trades: number
}

export interface ScoreInputs {
  alphaPct: number
  cagrPct: number
  winRatePct: number   // 0~100
  mddPct: number       // 음수 (예: -15)
  rounds: number
}

// 복합 점수 (WAR식).
//   base = 1.0×알파 + 0.3×CAGR + 0.5×(승률-50) + 0.3×MDD
//   score = base × √rounds
// - 알파(1.0): 핵심 실력
// - CAGR(0.3): 절대 수익 보정
// - 승률-50(0.5): 동전던지기 대비 일관성 보상
// - MDD(0.3): 음수이므로 자동 페널티
// - √rounds: 표본크기 보정 (짧은 게임 한방 억제)
export const SCORE_WEIGHTS = {
  alpha: 1.0,
  cagr: 0.3,
  winRate: 0.5,
  mdd: 0.3,
} as const

export function computeScore(inputs: ScoreInputs): number {
  const safe = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0)
  const rounds = safe(inputs.rounds)
  if (rounds <= 0) return 0
  const base =
    SCORE_WEIGHTS.alpha * safe(inputs.alphaPct) +
    SCORE_WEIGHTS.cagr * safe(inputs.cagrPct) +
    SCORE_WEIGHTS.winRate * (safe(inputs.winRatePct) - 50) +
    SCORE_WEIGHTS.mdd * safe(inputs.mddPct)
  return Math.round(base * Math.sqrt(rounds) * 100) / 100
}

export function loadNickname(): string {
  return localStorage.getItem(NICK_KEY) ?? ''
}

export function saveNickname(nick: string) {
  localStorage.setItem(NICK_KEY, nick.trim())
}

export async function checkNicknameExists(nick: string): Promise<boolean> {
  const q = query(
    collection(db, COLLECTION),
    where('nickname', '==', nick.trim()),
    limit(1),
  )
  const snap = await getDocs(q)
  return !snap.empty
}

export async function submitScore(entry: LeaderboardEntry) {
  // Skip leaderboard registration for profane nicknames
  if (containsProfanity(entry.nickname)) return

  const q = query(
    collection(db, COLLECTION),
    where('nickname', '==', entry.nickname),
    limit(1),
  )
  const snap = await getDocs(q)

  if (!snap.empty) {
    const existing = snap.docs[0]
    const oldData = existing.data()
    const oldScore = typeof oldData.score === 'number'
      ? oldData.score
      : computeScore({
          alphaPct: oldData.alphaPct ?? 0,
          cagrPct: oldData.cagrPct ?? 0,
          winRatePct: oldData.winRatePct ?? 0,
          mddPct: oldData.mddPct ?? 0,
          rounds: oldData.rounds ?? 0,
        })
    if (entry.score <= oldScore) return
    await deleteDoc(existing.ref)
  }

  await addDoc(collection(db, COLLECTION), {
    ...entry,
    createdAt: serverTimestamp(),
  })
}

export async function fetchTopScores(n = 10): Promise<LeaderboardRow[]> {
  // 오래된 엔트리는 score 필드가 없을 수 있어 클라에서 계산·정렬.
  // 상한을 넉넉히 받아 정렬 후 상위 n개만 반환.
  const q = query(
    collection(db, COLLECTION),
    orderBy('cagrPct', 'desc'),
    limit(Math.max(n * 5, 50)),
  )
  const snap = await getDocs(q)
  const rows: LeaderboardRow[] = snap.docs.map((d) => {
    const data = d.data()
    const score = typeof data.score === 'number'
      ? data.score
      : computeScore({
          alphaPct: data.alphaPct ?? 0,
          cagrPct: data.cagrPct ?? 0,
          winRatePct: data.winRatePct ?? 0,
          mddPct: data.mddPct ?? 0,
          rounds: data.rounds ?? 0,
        })
    return {
      nickname: data.nickname,
      cagrPct: data.cagrPct,
      alphaPct: data.alphaPct,
      mddPct: data.mddPct ?? 0,
      winRatePct: data.winRatePct ?? 0,
      score,
      symbol: data.symbol,
      symbolName: data.symbolName,
      rounds: data.rounds,
      trades: data.trades,
    }
  })
  rows.sort((a, b) => b.score - a.score)
  return rows.slice(0, n)
}
