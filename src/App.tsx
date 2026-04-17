import { useCallback, useState } from 'react'
import { Setup, type GameMode } from './components/Setup'
import { Play } from './components/Play'
import { Result } from './components/Result'
import { GuessPlay } from './components/GuessPlay'
import { GuessResult } from './components/GuessResult'
import { Bgm } from './components/Bgm'
import { fetchHistory } from './lib/yahoo'
import { pickRandomTicker, type Category } from './lib/tickers'
import { initGame, pickWindow, WARMUP_DAYS, type GameState, type RoundSize } from './lib/engine'
import {
  initGuessGame,
  prepareGuessCharts,
  MAX_GUESS_COUNT,
  type GuessGameState,
  type GuessHorizon,
} from './lib/guess'
import { loadNickname, saveNickname } from './lib/leaderboard'
import { loadTheme, type ThemeKey } from './lib/theme'

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
  const [mode, setMode] = useState<GameMode>('classic')
  const [game, setGame] = useState<GameState | null>(null)
  const [guessGame, setGuessGame] = useState<GuessGameState | null>(null)
  const [, setVersion] = useState(0)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nickname, setNickname] = useState(loadNickname)
  const [themeKey, setThemeKey] = useState<ThemeKey>(loadTheme)

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const assignNicknameIfEmpty = () => {
    if (!nickname.trim()) {
      const rand = randomNickname()
      setNickname(rand)
      saveNickname(rand)
    }
  }

  const startClassic = async ({
    categories, roundCount, roundSize,
  }: { categories: Category[]; roundCount: number; roundSize: RoundSize }) => {
    setLoading(true)
    setError(null)
    assignNicknameIfEmpty()
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
          setMode('classic')
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

  const startGuess = async ({ categories, horizon, count }: { categories: Category[]; horizon: GuessHorizon; count: number }) => {
    setLoading(true)
    setError(null)
    const n = Math.max(1, Math.min(MAX_GUESS_COUNT, Math.floor(count)))
    setProgress({ loaded: 0, total: n })
    assignNicknameIfEmpty()
    try {
      const charts = await prepareGuessCharts(categories, n, horizon, (loaded, total) => {
        setProgress({ loaded, total })
      })
      const g = initGuessGame(charts, horizon)
      setGuessGame(g)
      setMode('guess')
      setPhase('playing')
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : '차트 불러오기 실패')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const start = async (args: {
    mode: GameMode
    categories: Category[]
    roundCount: number
    roundSize: RoundSize
    guessHorizon: GuessHorizon
    guessCount: number
  }) => {
    if (args.mode === 'guess') return startGuess({ categories: args.categories, horizon: args.guessHorizon, count: args.guessCount })
    return startClassic(args)
  }

  const replay = () => {
    setGame(null)
    setGuessGame(null)
    setPhase('setup')
  }

  let screen: React.ReactNode = null
  if (phase === 'setup') {
    screen = (
      <Setup
        onStart={start}
        loading={loading}
        progress={progress}
        error={error}
        nickname={nickname}
        onNicknameChange={setNickname}
        onThemeChange={setThemeKey}
      />
    )
  } else if (phase === 'playing') {
    if (mode === 'guess' && guessGame) {
      screen = (
        <GuessPlay
          game={guessGame}
          onChange={bump}
          onEnd={() => setPhase('ended')}
          themeKey={themeKey}
        />
      )
    } else if (game) {
      screen = <Play game={game} onChange={bump} onEnd={() => setPhase('ended')} themeKey={themeKey} />
    }
  } else {
    if (mode === 'guess' && guessGame) {
      screen = <GuessResult game={guessGame} onReplay={replay} themeKey={themeKey} />
    } else if (game) {
      screen = <Result game={game} onReplay={replay} nickname={nickname} themeKey={themeKey} />
    }
  }

  return (
    <>
      {screen}
      <Bgm active={phase !== 'ended'} themeKey={themeKey} />
    </>
  )
}
