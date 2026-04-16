// Korean + English profanity filter
// Matches partial/full occurrences (case-insensitive)
const BAD_WORDS = [
  // Korean
  '시발', '씨발', '시바', '씨바', '씹', '좆', '짓밥',
  '개새끼', '새끼', '병신', '지랄', '염병', '엿먹',
  '꺼져', '닥쳐', '미친', '또라이', '찐따', '한남',
  '한녀', '느금마', '느금', '니미', '니엄마', '엄창',
  '보지', '자지', '섹스', '성교', '강간',
  'ㅅㅂ', 'ㅆㅂ', 'ㅂㅅ', 'ㅈㄹ', 'ㅗ', 'ㅅㅂㄹㅁ',
  'tlqkf', 'tiqkf', // 시발 키보드
  // English
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock',
  'pussy', 'nigger', 'nigga', 'cunt', 'whore', 'slut',
  'bastard', 'damn', 'penis', 'vagina', 'rape',
]

const pattern = new RegExp(BAD_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i')

export function containsProfanity(text: string): boolean {
  return pattern.test(text.replace(/\s/g, ''))
}
