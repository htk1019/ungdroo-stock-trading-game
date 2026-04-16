import {
  collection, addDoc, query, orderBy, limit, getDocs, where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'leaderboard'
const NICK_KEY = 'stock-game:nickname'
const UNIQUE_NICK_KEY = 'stock-game:unique-nickname'

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

export function loadUniqueNickname(): string {
  return localStorage.getItem(UNIQUE_NICK_KEY) ?? ''
}

export function saveNickname(nick: string) {
  localStorage.setItem(NICK_KEY, nick.trim())
}

// Check if nickname exists in Firestore; if so, append a number to make it unique.
// The unique nickname is cached in localStorage so the same user keeps the same name.
export async function resolveUniqueNickname(nick: string): Promise<string> {
  const cached = localStorage.getItem(UNIQUE_NICK_KEY)
  // If the user already resolved this base nickname before, reuse it
  const base = nick.trim()
  if (cached && (cached === base || cached.startsWith(base))) {
    return cached
  }

  // Check if base nickname is already taken
  const q = query(collection(db, COLLECTION), where('nickname', '==', base), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) {
    localStorage.setItem(UNIQUE_NICK_KEY, base)
    return base
  }

  // Find the next available number
  for (let i = 2; i <= 999; i++) {
    const candidate = `${base}${i}`
    const q2 = query(collection(db, COLLECTION), where('nickname', '==', candidate), limit(1))
    const snap2 = await getDocs(q2)
    if (snap2.empty) {
      localStorage.setItem(UNIQUE_NICK_KEY, candidate)
      return candidate
    }
  }

  // Fallback: use timestamp
  const fallback = `${base}${Date.now() % 10000}`
  localStorage.setItem(UNIQUE_NICK_KEY, fallback)
  return fallback
}

export async function submitScore(entry: LeaderboardEntry) {
  await addDoc(collection(db, COLLECTION), {
    ...entry,
    createdAt: serverTimestamp(),
  })
}

export async function fetchTopScores(n = 20): Promise<LeaderboardRow[]> {
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
