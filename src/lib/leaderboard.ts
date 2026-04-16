import {
  collection, addDoc, query, orderBy, limit, getDocs, where,
  deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'leaderboard'
const NICK_KEY = 'stock-game:nickname'

export interface LeaderboardEntry {
  nickname: string
  returnPct: number
  alphaPct: number
  symbol: string
  symbolName?: string
  rounds: number
  trades: number
  createdAt: unknown // serverTimestamp
}

export interface LeaderboardRow {
  nickname: string
  returnPct: number
  alphaPct: number
  symbol: string
  symbolName?: string
  rounds: number
  trades: number
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
  // Check if this nickname already has a score
  const q = query(
    collection(db, COLLECTION),
    where('nickname', '==', entry.nickname),
    limit(1),
  )
  const snap = await getDocs(q)

  if (!snap.empty) {
    const existing = snap.docs[0]
    const oldPct = existing.data().returnPct as number
    // Only replace if new score is higher
    if (entry.returnPct <= oldPct) return
    await deleteDoc(existing.ref)
  }

  await addDoc(collection(db, COLLECTION), {
    ...entry,
    createdAt: serverTimestamp(),
  })
}

export async function fetchTopScores(n = 10): Promise<LeaderboardRow[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy('returnPct', 'desc'),
    limit(n),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      nickname: data.nickname,
      returnPct: data.returnPct,
      alphaPct: data.alphaPct,
      symbol: data.symbol,
      symbolName: data.symbolName,
      rounds: data.rounds,
      trades: data.trades,
    }
  })
}
