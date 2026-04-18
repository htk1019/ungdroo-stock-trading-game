export type ThemeKey = 'dark' | 'rainbow' | 'neon' | 'ssammai'

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
  fontClass: string // applied to the whole card
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
    fontClass: '',
  },
  rainbow: {
    key: 'rainbow',
    label: '무지개',
    emoji: '🌈',
    pageBg: 'bg-gradient-to-br from-pink-200 via-yellow-100 via-green-100 to-blue-200',
    cardBg: 'bg-white/90 backdrop-blur-sm bg-notebook',
    cardBorder: 'border-pink-400 border-dashed',
    cardShadow: 'shadow-[0_8px_40px_rgba(236,72,153,0.3)]',
    titleColor: 'text-pink-500',
    subtitleColor: 'text-purple-600',
    sectionTitleColors: ['text-orange-500', 'text-pink-500', 'text-blue-500'],
    chipActive: 'bg-pink-200 border-pink-400 border-dashed text-pink-700 shadow-[0_0_12px_rgba(236,72,153,0.4)]',
    chipInactive: 'bg-white/60 border-pink-200 border-dashed text-gray-500 hover:border-pink-300',
    startBtn: 'bg-gradient-to-r from-red-400 via-yellow-300 via-green-300 to-blue-400 hover:from-red-300 hover:via-yellow-200 hover:to-blue-300 border-pink-300',
    startBtnText: 'text-purple-900',
    textPrimary: 'text-gray-800',
    textMuted: 'text-gray-500',
    inputBorder: 'border-pink-300 focus:border-pink-500',
    inputBg: 'bg-white/70',
    inputText: 'text-pink-700',
    fontClass: "font-[Gaegu]",
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
    fontClass: "font-['Press_Start_2P']",
  },
  // ========== NEW: 쌈마이 (ssammai) — B급/찌라시/카바레 감성 ==========
  ssammai: {
    key: 'ssammai',
    label: '쌈마이',
    emoji: '🦆',
    pageBg: 'bg-[#f3e9c9]',
    cardBg: 'bg-[#fff4cf]',
    cardBorder: 'border-black border-[5px]',
    cardShadow: 'shadow-[10px_10px_0_0_#120a0a]',
    titleColor: 'text-[#e10e28]',
    subtitleColor: 'text-[#7a21c6]',
    sectionTitleColors: ['text-[#e10e28]', 'text-[#ff2d87]', 'text-[#120a0a]'],
    chipActive: 'bg-[#22ff55] border-black border-[3px] text-[#120a0a] shadow-[4px_4px_0_#120a0a]',
    chipInactive: 'bg-[#fff4cf] border-black border-[3px] text-[#5b4b3a] hover:bg-[#ffe600]',
    startBtn: 'bg-[#e10e28] hover:bg-[#ff2d87] border-black',
    startBtnText: 'text-[#ffe600]',
    textPrimary: 'text-[#120a0a]',
    textMuted: 'text-[#5b4b3a]',
    inputBorder: 'border-black border-[3px] focus:border-[#e10e28]',
    inputBg: 'bg-white',
    inputText: 'text-[#120a0a]',
    fontClass: "font-['Jua']",
  },
}

// Chart color scheme per theme (used by Chart.tsx + Play.tsx)
export interface ChartColors {
  bg: string
  text: string
  gridLine: string
  border: string
  separatorColor: string
  separatorHover: string
  upColor: string
  downColor: string
  // Play.tsx UI panels
  panelBg: string
  panelBorder: string
  headerBg: string
  mutedText: string
  primaryText: string
}

export const CHART_COLORS: Record<ThemeKey, ChartColors> = {
  dark: {
    bg: '#12151c',
    text: '#e5e7eb',
    gridLine: '#1f2430',
    border: '#252a36',
    separatorColor: '#252a36',
    separatorHover: '#333a4d',
    upColor: '#22c55e',
    downColor: '#ef4444',
    panelBg: '#12151c',
    panelBorder: '#252a36',
    headerBg: '#12151c',
    mutedText: '#8b93a7',
    primaryText: '#e5e7eb',
  },
  rainbow: {
    bg: '#fef9f0',
    text: '#4a3728',
    gridLine: '#f0e0d0',
    border: '#e8c8b8',
    separatorColor: '#e8c8b8',
    separatorHover: '#d4a894',
    upColor: '#16a34a',
    downColor: '#dc2626',
    panelBg: '#fef7ed',
    panelBorder: '#f5d0b0',
    headerBg: '#fef7ed',
    mutedText: '#a08060',
    primaryText: '#3d2b1f',
  },
  neon: {
    bg: '#050505',
    text: '#39ff14',
    gridLine: '#0a1a0a',
    border: '#1a3a1a',
    separatorColor: '#1a3a1a',
    separatorHover: '#2a5a2a',
    upColor: '#39ff14',
    downColor: '#ff073a',
    panelBg: '#080808',
    panelBorder: '#1a3a1a',
    headerBg: '#080808',
    mutedText: '#2a7a2a',
    primaryText: '#39ff14',
  },
  // ========== NEW: ssammai — KR 증권면 관례(빨강=상승, 파랑=하락) ==========
  ssammai: {
    bg: '#f3e9c9',
    text: '#120a0a',
    gridLine: '#d9c89a',
    border: '#120a0a',
    separatorColor: '#120a0a',
    separatorHover: '#e10e28',
    upColor: '#e10e28',   // 빨강 = 상승
    downColor: '#0055c4', // 파랑 = 하락
    panelBg: '#fff4cf',
    panelBorder: '#120a0a',
    headerBg: '#ffe600',
    mutedText: '#5b4b3a',
    primaryText: '#120a0a',
  },
}

export function loadTheme(): ThemeKey {
  const saved = localStorage.getItem(THEME_KEY) as ThemeKey | null
  if (saved && THEME_KEYS.includes(saved)) return saved
  return 'dark'
}

export function saveTheme(key: ThemeKey) {
  localStorage.setItem(THEME_KEY, key)
}

export const THEME_KEYS: ThemeKey[] = ['dark', 'rainbow', 'neon', 'ssammai']
