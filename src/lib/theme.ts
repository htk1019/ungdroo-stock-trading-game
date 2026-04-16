export type ThemeKey = 'dark' | 'rainbow' | 'neon'

export interface Theme {
  key: ThemeKey
  label: string
  emoji: string
  // Setup screen
  pageBg: string
  cardBg: string
  cardBorder: string
  cardShadow: string
  titleColor: string
  subtitleColor: string
  sectionTitleColors: [string, string, string] // categories, rounds, rebalance
  chipActive: string
  chipInactive: string
  startBtn: string
  startBtnText: string
  textPrimary: string
  textMuted: string
  inputBorder: string
  inputBg: string
  inputText: string
}

const THEME_KEY = 'stock-game:theme'

export const THEMES: Record<ThemeKey, Theme> = {
  dark: {
    key: 'dark',
    label: '기본',
    emoji: '🌙',
    pageBg: '',
    cardBg: 'bg-[#12151c]',
    cardBorder: 'border-amber-400/70',
    cardShadow: 'shadow-[0_0_60px_rgba(251,191,36,0.25)]',
    titleColor: 'text-amber-300',
    subtitleColor: 'text-pink-200',
    sectionTitleColors: ['text-amber-300', 'text-fuchsia-300', 'text-sky-300'],
    chipActive: 'bg-amber-400/20 border-amber-400 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.35)]',
    chipInactive: 'bg-[#1a1e27] border-[#252a36] text-[#8b93a7] hover:border-amber-400/40',
    startBtn: 'bg-gradient-to-r from-pink-500 via-amber-400 to-orange-500 hover:from-pink-400 hover:via-amber-300 hover:to-orange-400 border-amber-200',
    startBtnText: 'text-[#0b0d12]',
    textPrimary: 'text-[#e5e7eb]',
    textMuted: 'text-[#8b93a7]',
    inputBorder: 'border-emerald-400/40 focus:border-emerald-400',
    inputBg: 'bg-[#1a1e27]',
    inputText: 'text-emerald-100',
  },
  rainbow: {
    key: 'rainbow',
    label: '무지개',
    emoji: '🌈',
    pageBg: 'bg-gradient-to-br from-pink-200 via-yellow-100 via-green-100 to-blue-200',
    cardBg: 'bg-white/80 backdrop-blur-sm',
    cardBorder: 'border-pink-400',
    cardShadow: 'shadow-[0_8px_40px_rgba(236,72,153,0.3)]',
    titleColor: 'text-pink-500',
    subtitleColor: 'text-purple-600',
    sectionTitleColors: ['text-orange-500', 'text-pink-500', 'text-blue-500'],
    chipActive: 'bg-pink-200 border-pink-400 text-pink-700 shadow-[0_0_12px_rgba(236,72,153,0.4)]',
    chipInactive: 'bg-white/60 border-pink-200 text-gray-500 hover:border-pink-300',
    startBtn: 'bg-gradient-to-r from-red-400 via-yellow-300 via-green-300 to-blue-400 hover:from-red-300 hover:via-yellow-200 hover:to-blue-300 border-pink-300',
    startBtnText: 'text-purple-900',
    textPrimary: 'text-gray-800',
    textMuted: 'text-gray-500',
    inputBorder: 'border-pink-300 focus:border-pink-500',
    inputBg: 'bg-white/70',
    inputText: 'text-pink-700',
  },
  neon: {
    key: 'neon',
    label: '네온',
    emoji: '💊',
    pageBg: 'bg-black',
    cardBg: 'bg-black/90',
    cardBorder: 'border-lime-400',
    cardShadow: 'shadow-[0_0_80px_rgba(0,255,0,0.3),0_0_120px_rgba(255,0,255,0.2)]',
    titleColor: 'text-lime-300',
    subtitleColor: 'text-cyan-300',
    sectionTitleColors: ['text-lime-400', 'text-magenta-400 text-fuchsia-400', 'text-cyan-400'],
    chipActive: 'bg-lime-500/20 border-lime-400 text-lime-200 shadow-[0_0_15px_rgba(0,255,0,0.5)]',
    chipInactive: 'bg-black border-gray-700 text-gray-500 hover:border-lime-500/50',
    startBtn: 'bg-gradient-to-r from-lime-500 via-cyan-400 to-fuchsia-500 hover:from-lime-400 hover:via-cyan-300 hover:to-fuchsia-400 border-lime-300',
    startBtnText: 'text-black',
    textPrimary: 'text-green-100',
    textMuted: 'text-green-600',
    inputBorder: 'border-cyan-500/50 focus:border-cyan-400',
    inputBg: 'bg-black/80',
    inputText: 'text-cyan-200',
  },
}

export function loadTheme(): ThemeKey {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved && saved in THEMES) return saved as ThemeKey
  return 'dark'
}

export function saveTheme(key: ThemeKey) {
  localStorage.setItem(THEME_KEY, key)
}

export const THEME_KEYS: ThemeKey[] = ['dark', 'rainbow', 'neon']
