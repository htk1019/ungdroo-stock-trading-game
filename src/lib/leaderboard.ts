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
  score: number
  symbol: string
  symbolName?: string
  rounds: number
  trades: number
}

// WAR-like score: 연간 알파 × √rounds.
// 긴 게임일수록 가중치 커지고, 짧은 게임 한방 CAGR은 √로 눌림.
export function computeScore(alphaPct: number, rounds: number): number {
  if (!Number.isFinite(alphaPct) || !Number.isFinite(rounds) || rounds <= 0) return 0
  return Math.round(alphaPct * Math.sqrt(rounds) * 100) / 100
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
      : computeScore(oldData.alphaPct ?? 0, oldData.rounds ?? 0)
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
      : computeScore(data.alphaPct ?? 0, data.rounds ?? 0)
    return {
      nickname: data.nickname,
      cagrPct: data.cagrPct,
      alphaPct: data.alphaPct,
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
