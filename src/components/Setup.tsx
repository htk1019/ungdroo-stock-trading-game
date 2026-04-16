import { useEffect, useRef, useState } from 'react'
import { ALL_CATEGORIES, CATEGORY_LABEL, type Category } from '../lib/tickers'
import { ROUND_SIZES, ROUND_COUNTS, type RoundSize } from '../lib/engine'
import { HelpModal } from './HelpModal'
import { loadHighScore, loadRecentGames, clearRecentGames } from '../lib/highscore'
import { saveNickname, checkNicknameExists } from '../lib/leaderboard'
import { THEMES, THEME_KEYS, loadTheme, saveTheme, type ThemeKey } from '../lib/theme'

interface SetupProps {
  onStart: (args: { categories: Category[]; roundCount: number; roundSize: RoundSize }) => void
  loading: boolean
  error: string | null
  nickname: string
  onNicknameChange: (nick: string) => void
  onThemeChange: (key: ThemeKey) => void
}

export function Setup({ onStart, loading, error, nickname, onNicknameChange, onThemeChange }: SetupProps) {
  const [categories, setCategories] = useState<Set<Category>>(new Set(['kr']))
  const [roundCount, setRoundCount] = useState<number>(20)
  const [roundSize, setRoundSize] = useState<RoundSize>(ROUND_SIZES[1]) // 주
  const [showHelp, setShowHelp] = useState(false)
  const [themeKey, setThemeKey] = useState<ThemeKey>(loadTheme)
  const highScore = loadHighScore()
  const [recent, setRecent] = useState(loadRecentGames)
  const [nickTaken, setNickTaken] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const t = THEMES[themeKey]

  const cycleTheme = () => {
    const idx = THEME_KEYS.indexOf(themeKey)
    const next = THEME_KEYS[(idx + 1) % THEME_KEYS.length]
    setThemeKey(next)
    saveTheme(next)
    onThemeChange(next)
  }

  const handleNicknameChange = (value: string) => {
    onNicknameChange(value)
    saveNickname(value)
    setNickTaken(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (!trimmed) return
    debounceRef.current = setTimeout(() => {
      checkNicknameExists(trimmed).then(setNickTaken).catch(() => {})
    }, 500)
  }

  useEffect(() => {
    const trimmed = nickname.trim()
    if (trimmed) {
      checkNicknameExists(trimmed).then(setNickTaken).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleCat = (c: Category) => {
    const next = new Set(categories)
    if (next.has(c)) next.delete(c); else next.add(c)
    if (next.size === 0) return
    setCategories(next)
  }

  const tradingDays = roundCount * roundSize.days
  const isDark = themeKey === 'dark'

  return (
    <div className={`min-h-screen flex items-center justify-center p-3 sm:p-6 relative overflow-hidden ${t.pageBg}`}>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Theme toggle — top-left corner */}
      <button
        onClick={cycleTheme}
        className={`fixed top-2 right-2 sm:top-4 sm:right-4 z-50 px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
          isDark
            ? 'bg-[#1a1e27] border-[#252a36] text-[#8b93a7] hover:border-amber-400/50'
            : themeKey === 'rainbow'
              ? 'bg-white/70 border-pink-300 text-pink-600 hover:border-pink-400'
              : 'bg-black border-lime-500/50 text-lime-400 hover:border-lime-400'
        }`}
        title="테마 변경"
      >
        {t.emoji} {t.label}
      </button>

      {/* 배경 장식 — 다크 테마에서만 표시 */}
      {isDark && (
        <>
          <div aria-hidden className="absolute inset-0 pointer-events-none hidden sm:block">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-purple-900/10 to-amber-900/20" />
            <span className="absolute top-8  left-10  text-5xl animate-spin-slow">✨</span>
            <span className="absolute top-16 right-24 text-6xl animate-bounce">💰</span>
            <span className="absolute bottom-24 left-16 text-5xl animate-pulse">📈</span>
            <span className="absolute bottom-12 right-12 text-5xl animate-spin-slow">🎰</span>
            <span className="absolute top-1/2 left-4 text-4xl animate-bounce">🪙</span>
            <span className="absolute top-1/3 right-6 text-4xl animate-pulse">💸</span>
            <span className="absolute top-6    right-1/3 text-3xl rotate-12 animate-blink">★</span>
            <span className="absolute bottom-6 left-1/3  text-3xl -rotate-12 animate-blink">★</span>
            <img src="/meme1.png" alt="" className="absolute bottom-6 left-6 w-28 opacity-60 rotate-[-8deg] rounded-lg border border-white/10 select-none" draggable={false} />
            <img src="/meme2.png" alt="" className="absolute top-6 right-6 w-24 opacity-60 rotate-[6deg] rounded-lg border border-white/10 select-none" draggable={false} />
          </div>
          <div aria-hidden className="absolute inset-0 pointer-events-none sm:hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-purple-900/10 to-amber-900/20" />
            <img src="/meme1.png" alt="" className="absolute bottom-2 left-2 w-16 opacity-40 rotate-[-8deg] rounded select-none" draggable={false} />
            <img src="/meme2.png" alt="" className="absolute top-2 right-2 w-14 opacity-40 rotate-[6deg] rounded select-none" draggable={false} />
          </div>
        </>
      )}

      {/* 무지개 테마 배경 장식 */}
      {themeKey === 'rainbow' && (
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <span className="absolute top-10 left-8 text-6xl animate-bounce">🌈</span>
          <span className="absolute top-20 right-16 text-5xl animate-spin-slow">🦄</span>
          <span className="absolute bottom-20 left-12 text-5xl animate-pulse">⭐</span>
          <span className="absolute bottom-10 right-10 text-4xl animate-bounce">🌸</span>
          <span className="absolute top-1/2 left-6 text-4xl animate-spin-slow">🍭</span>
          <span className="absolute top-1/3 right-8 text-5xl animate-pulse">🎀</span>
          <span className="absolute top-8 left-1/3 text-3xl rotate-12 animate-blink">☆</span>
          <span className="absolute bottom-8 right-1/3 text-3xl -rotate-12 animate-blink">♡</span>
        </div>
      )}

      {/* 네온 테마 배경 장식 */}
      {themeKey === 'neon' && (
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,0,0.05),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,0,255,0.05),transparent_60%)]" />
          <span className="absolute top-10 left-10 text-5xl animate-pulse">⚡</span>
          <span className="absolute top-16 right-20 text-4xl animate-blink">💀</span>
          <span className="absolute bottom-20 left-16 text-5xl animate-bounce">🎮</span>
          <span className="absolute bottom-10 right-14 text-4xl animate-spin-slow">👾</span>
          <span className="absolute top-1/2 left-6 text-3xl animate-blink">▶</span>
          <span className="absolute top-1/3 right-8 text-3xl animate-pulse">◆</span>
        </div>
      )}

      <div className={`w-full max-w-3xl ${t.cardBg} border-2 sm:border-4 ${t.cardBorder} rounded-2xl sm:rounded-3xl p-5 sm:p-10 ${t.cardShadow} relative overflow-hidden z-10 ${t.fontClass}`}>
        {/* 레인보우 테두리 스트라이프 */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-rainbow-stripe" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-rainbow-stripe" />

        <button
          onClick={() => setShowHelp(true)}
          className={`absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 font-black text-base sm:text-lg z-20 ${
            isDark
              ? 'bg-[#1a1e27] border-amber-400/60 hover:border-amber-300 text-amber-200'
              : themeKey === 'rainbow'
                ? 'bg-white/80 border-pink-400 hover:border-pink-500 text-pink-500'
                : 'bg-black border-lime-500 hover:border-lime-400 text-lime-400'
          }`}
          title="도움말"
        >
          ?
        </button>

        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-4 sm:mb-6 mt-2 sm:mt-4 relative">
          {isDark && (
            <>
              <div className="hidden sm:block absolute -top-1 left-2 text-amber-300 text-xs font-black rotate-[-18deg] select-none leading-tight">
                🔥 오늘의<br/>한탕 🔥
              </div>
              <div className="hidden sm:block absolute -top-1 right-14 text-pink-300 text-xs font-black rotate-[12deg] select-none leading-tight animate-blink">
                🚨 대박 🚨<br/>신호 감지!
              </div>
            </>
          )}
          {themeKey === 'rainbow' && (
            <>
              <div className="hidden sm:block absolute -top-1 left-2 text-orange-500 text-xs font-black rotate-[-18deg] select-none leading-tight">
                🌟 오늘의<br/>한탕 🌟
              </div>
              <div className="hidden sm:block absolute -top-1 right-14 text-purple-500 text-xs font-black rotate-[12deg] select-none leading-tight animate-blink">
                ✨ 대박 ✨<br/>신호 감지!
              </div>
            </>
          )}
          {themeKey === 'neon' && (
            <>
              <div className="hidden sm:block absolute -top-1 left-2 text-lime-400 text-xs font-black rotate-[-18deg] select-none leading-tight">
                ⚡ 오늘의<br/>한탕 ⚡
              </div>
              <div className="hidden sm:block absolute -top-1 right-14 text-fuchsia-400 text-xs font-black rotate-[12deg] select-none leading-tight animate-blink">
                💀 대박 💀<br/>신호 감지!
              </div>
            </>
          )}

          <div className="relative animate-wobble">
            <img
              src="/duck.png"
              alt="trader duck"
              className="w-36 h-36 sm:w-64 sm:h-64 object-contain drop-shadow-[0_10px_30px_rgba(251,191,36,0.35)] select-none"
              draggable={false}
            />
            <div className="absolute -top-2 -right-2 text-xl sm:text-3xl rotate-12 select-none">ㅋㅋㅋ</div>
            <div className="absolute -top-4 -left-4 text-lg sm:text-2xl -rotate-12 select-none animate-bounce">💸</div>
            <div className="absolute -bottom-2 -right-6 sm:-right-8 text-lg sm:text-2xl rotate-6 select-none animate-bounce">📈</div>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap">
            <span className={`text-lg sm:text-xl font-black animate-blink ${t.titleColor}`}>★</span>
            <h1 className={`text-2xl sm:text-4xl md:text-5xl font-black tracking-tight ${t.titleColor} ${isDark ? 'animate-neon' : ''}`}>
              4848로 주식을 이겨라!
            </h1>
            <img
              src="/niga.png"
              alt="ㅋ 니가?"
              className={`h-8 sm:h-12 w-auto rounded-md border-2 select-none animate-wobble ${t.cardBorder}`}
              draggable={false}
            />
            <span className={`text-lg sm:text-xl font-black animate-blink ${t.titleColor}`}>★</span>
          </div>
          <p className={`mt-2 sm:mt-3 text-sm sm:text-base font-bold px-2 ${t.subtitleColor}`}>
            ❗ 종목은 <u>비밀</u>! 차트만 보고 <span className={t.titleColor}>Buy &amp; Hold</span> ⚡️발라버려⚡️ 승리! ❗
          </p>
        </div>

        <section className="mb-4">
          <h2 className={`text-sm font-black uppercase tracking-widest mb-2 ${t.sectionTitleColors[0]}`}>
            🎯 어떤 종목?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={`py-2 sm:py-3 rounded-xl border-2 text-sm font-black transition ${
                  categories.has(c) ? t.chipActive : t.chipInactive
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h2 className={`text-sm font-black uppercase tracking-widest mb-2 ${t.sectionTitleColors[1]}`}>
            🔥 몇 라운드?
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ROUND_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setRoundCount(n)}
                className={`py-2 sm:py-3 rounded-xl border-2 text-sm font-black transition ${
                  roundCount === n ? t.chipActive : t.chipInactive
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className={`text-sm font-black uppercase tracking-widest mb-2 ${t.sectionTitleColors[2]}`}>
            ⚡ 리밸런싱 주기
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {ROUND_SIZES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRoundSize(r)}
                className={`py-2 sm:py-3 rounded-xl border-2 text-sm font-black transition ${
                  roundSize.key === r.key ? t.chipActive : t.chipInactive
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className={`text-xs mt-2 text-center font-bold ${t.textMuted}`}>
            총 트레이딩 기간 ≈ <span className="font-mono">{tradingDays}거래일</span>
            {' '}({(tradingDays / 252).toFixed(1)}년)
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-black text-emerald-300 uppercase tracking-widest mb-2">
            🏆 닉네임 (랭킹용)
          </h2>
          <input
            type="text"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            placeholder="미입력 시 랜덤 닉네임 배정"
            maxLength={20}
            className={`w-full px-4 py-3 rounded-xl border-2 font-bold placeholder:text-[#5a6175] focus:outline-none transition ${t.inputBorder} ${t.inputBg} ${t.inputText}`}
          />
          {nickTaken && (
            <p className="mt-1.5 text-xs text-amber-300 font-bold">
              ⚠️ 이미 사용 중인 닉네임입니다. 본인이면 그대로 진행, 아니면 다른 닉네임을 입력하세요.
            </p>
          )}
        </section>

        <button
          onClick={() => onStart({ categories: Array.from(categories), roundCount, roundSize })}
          disabled={loading}
          className={`btn-shine w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl ${t.startBtn} disabled:from-[#1a1e27] disabled:via-[#1a1e27] disabled:to-[#1a1e27] disabled:text-[#5a6175] ${t.startBtnText} font-black text-lg sm:text-xl transition shadow-[0_0_30px_rgba(251,191,36,0.5)] relative overflow-hidden border-2`}
        >
          {loading ? '⏳ 딸깍… 딸깍… 딸깍…' : '🎰 딸깍! 시작하기 🎰'}
        </button>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border-2 border-red-500/60 text-red-200 text-sm font-bold">
            ⚠️ {error}
          </div>
        )}

        {highScore && (
          <div className={`mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold ${
            isDark
              ? 'bg-amber-500/10 border-amber-400/50 text-amber-100'
              : themeKey === 'rainbow'
                ? 'bg-orange-100 border-orange-300 text-orange-700'
                : 'bg-lime-500/10 border-lime-500/50 text-lime-200'
          }`}>
            <span>🏆 최고 기록 (연환산)</span>
            <span className={`font-mono font-black text-base ${highScore.cagrPct >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {highScore.cagrPct >= 0 ? '+' : ''}{highScore.cagrPct.toFixed(2)}%
            </span>
            <span className={`text-xs ${t.textMuted}`}>
              ({highScore.symbolName ?? highScore.symbol})
            </span>
          </div>
        )}

        {recent.length > 0 && (
          <div className={`mt-3 px-3 py-2 rounded-xl border ${
            isDark ? 'bg-[#12151c]/70 border-[#252a36]' : themeKey === 'rainbow' ? 'bg-white/50 border-pink-200' : 'bg-black/50 border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted}`}>
                최근 게임 ({recent.length})
              </span>
              <button
                onClick={() => { clearRecentGames(); setRecent([]) }}
                className="text-[10px] text-red-400/70 hover:text-red-300 font-bold transition"
              >
                전체 삭제
              </button>
            </div>
            <ul className="flex flex-col gap-0.5 max-h-40 overflow-auto">
              {recent.map((r) => (
                <li key={r.at} className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span className={`shrink-0 w-16 ${t.textMuted}`}>
                    {new Date(r.at).toISOString().slice(5, 10).replace('-', '/')}
                  </span>
                  <span className={`truncate flex-1 min-w-0 ${t.textPrimary}`}>
                    {r.symbolName ?? r.symbol}
                  </span>
                  <span className={`font-bold shrink-0 ${r.cagrPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.cagrPct >= 0 ? '+' : ''}{r.cagrPct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`mt-5 text-xs space-y-1 text-center font-bold ${t.textMuted}`}>
          <p>
            💵 시작자금 $10,000 · 💸 수수료 0.1% · 🎯 포지션 100%
          </p>
          <p>
            ⌨️ <kbd className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-[#1a1e27] border-amber-400/30' : themeKey === 'rainbow' ? 'bg-white/60 border-pink-300' : 'bg-black border-lime-500/30'}`}>Space</kbd> 다음
            · <kbd className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-[#1a1e27] border-emerald-400/30' : themeKey === 'rainbow' ? 'bg-white/60 border-green-300' : 'bg-black border-lime-500/30'}`}>B</kbd> 매수
            · <kbd className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-[#1a1e27] border-rose-400/30' : themeKey === 'rainbow' ? 'bg-white/60 border-red-300' : 'bg-black border-fuchsia-500/30'}`}>S</kbd> 숏
            · <kbd className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-[#1a1e27] border-slate-400/30' : themeKey === 'rainbow' ? 'bg-white/60 border-gray-300' : 'bg-black border-cyan-500/30'}`}>F</kbd> 플랫
          </p>
        </div>
      </div>
    </div>
  )
}
