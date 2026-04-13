// 게임 유니버스. 카테고리 4개로 단순화: 미국 / 일본 / 한국 / 주가지수.
// 자주 업데이트할 것. Yahoo Finance 심볼:
//   - 미국: 티커 (AAPL)
//   - 한국: .KS (005930.KS), .KQ (091990.KQ)
//   - 일본: .T (7203.T)

export type Category = 'us' | 'jp' | 'kr' | 'index'

export interface TickerInfo {
  symbol: string
  name: string
  category: Category
}

export const TICKERS: TickerInfo[] = [
  // ── 미국 ─────────────────────────────────────────────────────────────
  { symbol: 'AAPL',  name: 'Apple',             category: 'us' },
  { symbol: 'MSFT',  name: 'Microsoft',         category: 'us' },
  { symbol: 'GOOGL', name: 'Alphabet',          category: 'us' },
  { symbol: 'AMZN',  name: 'Amazon',            category: 'us' },
  { symbol: 'META',  name: 'Meta',              category: 'us' },
  { symbol: 'NVDA',  name: 'NVIDIA',            category: 'us' },
  { symbol: 'TSLA',  name: 'Tesla',             category: 'us' },
  { symbol: 'NFLX',  name: 'Netflix',           category: 'us' },
  { symbol: 'AMD',   name: 'AMD',               category: 'us' },
  { symbol: 'INTC',  name: 'Intel',             category: 'us' },
  { symbol: 'ORCL',  name: 'Oracle',            category: 'us' },
  { symbol: 'CRM',   name: 'Salesforce',        category: 'us' },
  { symbol: 'ADBE',  name: 'Adobe',             category: 'us' },
  { symbol: 'CSCO',  name: 'Cisco',             category: 'us' },
  { symbol: 'IBM',   name: 'IBM',               category: 'us' },
  { symbol: 'QCOM',  name: 'Qualcomm',          category: 'us' },
  { symbol: 'AVGO',  name: 'Broadcom',          category: 'us' },
  { symbol: 'TXN',   name: 'Texas Instruments', category: 'us' },
  { symbol: 'MU',    name: 'Micron',            category: 'us' },
  { symbol: 'PYPL',  name: 'PayPal',            category: 'us' },
  { symbol: 'UBER',  name: 'Uber',              category: 'us' },
  { symbol: 'JPM',   name: 'JPMorgan Chase',    category: 'us' },
  { symbol: 'BAC',   name: 'Bank of America',   category: 'us' },
  { symbol: 'GS',    name: 'Goldman Sachs',     category: 'us' },
  { symbol: 'MS',    name: 'Morgan Stanley',    category: 'us' },
  { symbol: 'WFC',   name: 'Wells Fargo',       category: 'us' },
  { symbol: 'V',     name: 'Visa',              category: 'us' },
  { symbol: 'MA',    name: 'Mastercard',        category: 'us' },
  { symbol: 'AXP',   name: 'American Express',  category: 'us' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway',category: 'us' },
  { symbol: 'BLK',   name: 'BlackRock',         category: 'us' },
  { symbol: 'JNJ',   name: 'Johnson & Johnson', category: 'us' },
  { symbol: 'PFE',   name: 'Pfizer',            category: 'us' },
  { symbol: 'MRK',   name: 'Merck',             category: 'us' },
  { symbol: 'LLY',   name: 'Eli Lilly',         category: 'us' },
  { symbol: 'UNH',   name: 'UnitedHealth',      category: 'us' },
  { symbol: 'ABBV',  name: 'AbbVie',            category: 'us' },
  { symbol: 'TMO',   name: 'Thermo Fisher',     category: 'us' },
  { symbol: 'ABT',   name: 'Abbott',            category: 'us' },
  { symbol: 'BMY',   name: 'Bristol-Myers',     category: 'us' },
  { symbol: 'WMT',   name: 'Walmart',           category: 'us' },
  { symbol: 'COST',  name: 'Costco',            category: 'us' },
  { symbol: 'TGT',   name: 'Target',            category: 'us' },
  { symbol: 'HD',    name: 'Home Depot',        category: 'us' },
  { symbol: 'LOW',   name: "Lowe's",            category: 'us' },
  { symbol: 'NKE',   name: 'Nike',              category: 'us' },
  { symbol: 'SBUX',  name: 'Starbucks',         category: 'us' },
  { symbol: 'MCD',   name: "McDonald's",        category: 'us' },
  { symbol: 'KO',    name: 'Coca-Cola',         category: 'us' },
  { symbol: 'PEP',   name: 'PepsiCo',           category: 'us' },
  { symbol: 'PG',    name: 'Procter & Gamble',  category: 'us' },
  { symbol: 'DIS',   name: 'Disney',            category: 'us' },
  { symbol: 'XOM',   name: 'ExxonMobil',        category: 'us' },
  { symbol: 'CVX',   name: 'Chevron',           category: 'us' },
  { symbol: 'COP',   name: 'ConocoPhillips',    category: 'us' },
  { symbol: 'BA',    name: 'Boeing',            category: 'us' },
  { symbol: 'CAT',   name: 'Caterpillar',       category: 'us' },
  { symbol: 'GE',    name: 'GE Aerospace',      category: 'us' },
  { symbol: 'F',     name: 'Ford',              category: 'us' },
  { symbol: 'GM',    name: 'General Motors',    category: 'us' },
  { symbol: 'DE',    name: 'Deere',             category: 'us' },

  // ── 일본 ─────────────────────────────────────────────────────────────
  { symbol: '7203.T', name: 'Toyota',           category: 'jp' },
  { symbol: '6758.T', name: 'Sony',             category: 'jp' },
  { symbol: '6861.T', name: 'Keyence',          category: 'jp' },
  { symbol: '9984.T', name: 'SoftBank Group',   category: 'jp' },
  { symbol: '8306.T', name: 'Mitsubishi UFJ',   category: 'jp' },
  { symbol: '7974.T', name: 'Nintendo',         category: 'jp' },
  { symbol: '6098.T', name: 'Recruit Holdings', category: 'jp' },
  { symbol: '7267.T', name: 'Honda',            category: 'jp' },
  { symbol: '4063.T', name: 'Shin-Etsu Chem',   category: 'jp' },
  { symbol: '6501.T', name: 'Hitachi',          category: 'jp' },
  { symbol: '8035.T', name: 'Tokyo Electron',   category: 'jp' },
  { symbol: '4502.T', name: 'Takeda Pharma',    category: 'jp' },

  // ── 한국 ─────────────────────────────────────────────────────────────
  { symbol: '005930.KS', name: '삼성전자',      category: 'kr' },
  { symbol: '000660.KS', name: 'SK하이닉스',    category: 'kr' },
  { symbol: '035420.KS', name: 'NAVER',         category: 'kr' },
  { symbol: '035720.KS', name: '카카오',        category: 'kr' },
  { symbol: '005380.KS', name: '현대차',        category: 'kr' },
  { symbol: '000270.KS', name: '기아',          category: 'kr' },
  { symbol: '051910.KS', name: 'LG화학',        category: 'kr' },
  { symbol: '006400.KS', name: '삼성SDI',       category: 'kr' },
  { symbol: '207940.KS', name: '삼성바이오로직스', category: 'kr' },
  { symbol: '068270.KS', name: '셀트리온',      category: 'kr' },
  { symbol: '105560.KS', name: 'KB금융',        category: 'kr' },
  { symbol: '055550.KS', name: '신한지주',      category: 'kr' },
  { symbol: '012330.KS', name: '현대모비스',    category: 'kr' },
  { symbol: '028260.KS', name: '삼성물산',      category: 'kr' },
  { symbol: '015760.KS', name: '한국전력',      category: 'kr' },
  { symbol: '003550.KS', name: 'LG',            category: 'kr' },
  { symbol: '066570.KS', name: 'LG전자',        category: 'kr' },
  { symbol: '017670.KS', name: 'SK텔레콤',      category: 'kr' },
  { symbol: '030200.KS', name: 'KT',            category: 'kr' },
  { symbol: '034730.KS', name: 'SK',            category: 'kr' },

  // ── 주가지수 / ETF (거래량 표시 X) ────────────────────────────────────
  { symbol: '^GSPC',  name: 'S&P 500',          category: 'index' },
  { symbol: '^IXIC',  name: 'NASDAQ Composite', category: 'index' },
  { symbol: '^DJI',   name: 'Dow Jones',        category: 'index' },
  { symbol: '^RUT',   name: 'Russell 2000',     category: 'index' },
  { symbol: '^N225',  name: 'Nikkei 225',       category: 'index' },
  { symbol: '^KS11',  name: 'KOSPI',            category: 'index' },
  { symbol: '^KQ11',  name: 'KOSDAQ',           category: 'index' },
  { symbol: '^HSI',   name: 'Hang Seng',        category: 'index' },
  { symbol: '^FTSE',  name: 'FTSE 100',         category: 'index' },
  { symbol: '^GDAXI', name: 'DAX',              category: 'index' },
  { symbol: '^STOXX50E', name: 'Euro Stoxx 50', category: 'index' },
]

export const CATEGORY_LABEL: Record<Category, string> = {
  us:    '미국',
  jp:    '일본',
  kr:    '한국',
  index: '주가지수',
}

export const ALL_CATEGORIES: Category[] = ['us', 'jp', 'kr', 'index']

export function pickRandomTicker(
  categories: Category[] = ALL_CATEGORIES,
  exclude: Set<string> = new Set(),
): TickerInfo {
  const cats = new Set(categories)
  const pool = TICKERS.filter((t) => cats.has(t.category) && !exclude.has(t.symbol))
  if (pool.length === 0) {
    const all = TICKERS.filter((t) => cats.has(t.category))
    return all[Math.floor(Math.random() * all.length)]
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

export function findTicker(symbol: string): TickerInfo | undefined {
  return TICKERS.find((t) => t.symbol === symbol)
}
