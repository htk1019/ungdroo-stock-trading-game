import { useCallback, useState } from 'react'
import { Setup } from './components/Setup'
import { Play } from './components/Play'
import { Result } from './components/Result'
import { Bgm } from './components/Bgm'
import { fetchHistory } from './lib/yahoo'
import { pickRandomTicker, type Category } from './lib/tickers'
import { initGame, pickWindow, WARMUP_DAYS, type GameState, type RoundSize } from './lib/engine'
import { loadNickname, saveNickname } from './lib/leaderboard'

const RANDOM_NAMES = [
  '개미투자자', '워렌버핏', '차트도사', '매수왕', '존버맨',
  '단타신', '풀매수', '손절장인', '떡상기원', '코스피지킴이',
  '주린이', '갓투자', '수익머신', '차트쟁이', '불타는계좌',
]
function randomNickname() {
  const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
  const num = Math.floor(Math.random() * 9000) + 1000
  return `${name}${num}`
}

type Phase = 'setup' | 'playing' | 'ended'

export default function App() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [game, setGame] = useState<GameState | null>(null)
  const [, setVersion] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nickname, setNickname] = useState(loadNickname)

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const start = async ({
    categories, roundCount, roundSize,
  }: { categories: Category[]; roundCount: number; roundSize: RoundSize }) => {
    setLoading(true)
    setError(null)
    // Assign random nickname if empty
    if (!nickname.trim()) {
      const rand = randomNickname()
      setNickname(rand)
      saveNickname(rand)
    }
    const tried = new Set<string>()
    const tradingDays = roundCount * roundSize.days
    try {
      for (let attempt = 0; attempt < 12; attempt++) {
        const pick = pickRandomTicker(categories, tried)
        tried.add(pick.symbol)
        try {
          const { symbol, candles } = await fetchHistory(pick.symbol, '1d')
          const window = pickWindow(candles, WARMUP_DAYS, tradingDays)
          if (!window) continue
          const g = initGame({
            symbol, interval: '1d',
            warmup: window.warmup, reveal: window.reveal,
            roundSize: roundSize.days, roundCount,
          })
          setGame(g)
          setPhase('playing')
          setLoading(false)
          return
        } catch (e) {
          console.warn('fetch failed for', pick.symbol, e)
          continue
        }
      }
      setError(`선택한 구성(${roundCount}×${roundSize.label})에 충분한 데이터를 가진 종목을 찾지 못했어요. 라운드 주기를 줄이거나 카테고리를 바꿔보세요.`)
    } finally {
      setLoading(false)
    }
  }

  const replay = () => {
    setGame(null)
    setPhase('setup')
  }

  let screen
  if (phase === 'setup' || !game) {
    screen = <Setup onStart={start} loading={loading} error={error} nickname={nickname} onNicknameChange={setNickname} />
  } else if (phase === 'playing') {
    screen = <Play game={game} onChange={bump} onEnd={() => setPhase('ended')} />
  } else {
    screen = <Result game={game} onReplay={replay} nickname={nickname} />
  }
  return (
    <>
      {screen}
      <Bgm active={phase !== 'ended'} />
    </>
  )
}
