// Synthesized sound effects using the Web Audio API — no audio files
// needed. Kept tiny on purpose.

let ctx: AudioContext | null = null
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

interface Note {
  freq: number        // Hz
  start: number       // seconds from now
  duration: number    // seconds
  type?: OscillatorType
  gain?: number       // peak volume (0..1)
}

function playNotes(notes: Note[]) {
  const c = getCtx()
  if (!c) return
  const now = c.currentTime
  for (const n of notes) {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = n.type ?? 'sine'
    osc.frequency.setValueAtTime(n.freq, now + n.start)
    const peak = n.gain ?? 0.25
    g.gain.setValueAtTime(0, now + n.start)
    g.gain.linearRampToValueAtTime(peak, now + n.start + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.duration)
    osc.connect(g).connect(c.destination)
    osc.start(now + n.start)
    osc.stop(now + n.start + n.duration + 0.02)
  }
}

// "Anime wow!" sample — plays the prerecorded clip at /win.mp3.
export function playWin() {
  if (typeof window === 'undefined') return
  const audio = new Audio('/win.mp3')
  audio.volume = 0.5
  audio.play().catch(() => {})
}

// "뜨헉!" sample — plays the prerecorded clip at /lose.mp3.
export function playLose() {
  if (typeof window === 'undefined') return
  const audio = new Audio('/lose.mp3')
  audio.volume = 0.9
  audio.play().catch(() => {})
}

// Tiny "띠링" — two quick bell chimes for per-trade P&L pops.
// Slightly different pitches for profit vs. loss so feedback is learnable
// by ear without being harsh.
export function playDing(good: boolean) {
  const base = good ? 1318.5 : 987.77 // profit: E6, loss: B5
  playNotes([
    { freq: base,        start: 0.00, duration: 0.14, type: 'sine', gain: 0.22 },
    { freq: base * 1.26, start: 0.06, duration: 0.18, type: 'sine', gain: 0.22 },
  ])
}

// "사랑스러워~" — 완전승리 (승리 + 승률 90% 이상)
export function playPerfectWin() {
  if (typeof window === 'undefined') return
  const audio = new Audio('/perfect-win.mp3')
  audio.volume = 0.9
  audio.play().catch(() => {})
}

// "이건 너무한 거 아니냐고" — 완전패배 (패배 + 승률 30% 이하)
export function playTotalDefeat() {
  if (typeof window === 'undefined') return
  const audio = new Audio('/total-defeat.mp3')
  audio.volume = 0.9
  audio.play().catch(() => {})
}

// "뭐지?" sample — plays the prerecorded clip at /meh.mp3.
export function playMeh() {
  if (typeof window === 'undefined') return
  const audio = new Audio('/meh.mp3')
  audio.volume = 0.4
  audio.play().catch(() => {})
}

// Combo sound — escalating fanfare that gets more dramatic with higher combos.
// 3-combo: short "빠바밤", 5-combo: triumphant arpeggio, 7+: epic power chord
export function playCombo(combo: number) {
  if (combo < 3) return
  const gain = Math.min(0.3, 0.18 + combo * 0.015)
  if (combo < 5) {
    // 3~4 combo: quick triple chime
    playNotes([
      { freq: 523.25, start: 0.00, duration: 0.12, type: 'triangle', gain },
      { freq: 659.25, start: 0.08, duration: 0.12, type: 'triangle', gain },
      { freq: 783.99, start: 0.16, duration: 0.20, type: 'triangle', gain },
    ])
  } else if (combo < 7) {
    // 5~6 combo: triumphant arpeggio
    playNotes([
      { freq: 523.25, start: 0.00, duration: 0.10, type: 'square', gain: gain * 0.7 },
      { freq: 659.25, start: 0.07, duration: 0.10, type: 'square', gain: gain * 0.7 },
      { freq: 783.99, start: 0.14, duration: 0.10, type: 'square', gain: gain * 0.8 },
      { freq: 1046.5, start: 0.21, duration: 0.30, type: 'triangle', gain },
    ])
  } else if (combo < 10) {
    // 7~9 combo: power chord fanfare
    playNotes([
      { freq: 261.63, start: 0.00, duration: 0.08, type: 'sawtooth', gain: gain * 0.5 },
      { freq: 523.25, start: 0.06, duration: 0.08, type: 'square', gain: gain * 0.6 },
      { freq: 659.25, start: 0.12, duration: 0.08, type: 'square', gain: gain * 0.7 },
      { freq: 783.99, start: 0.18, duration: 0.10, type: 'triangle', gain: gain * 0.8 },
      { freq: 1046.5, start: 0.24, duration: 0.10, type: 'triangle', gain: gain * 0.9 },
      { freq: 1318.5, start: 0.30, duration: 0.35, type: 'triangle', gain },
    ])
  } else {
    // 10+ combo: LEGENDARY double octave blast
    playNotes([
      { freq: 261.63, start: 0.00, duration: 0.06, type: 'sawtooth', gain: gain * 0.5 },
      { freq: 392.00, start: 0.05, duration: 0.06, type: 'sawtooth', gain: gain * 0.5 },
      { freq: 523.25, start: 0.10, duration: 0.06, type: 'square', gain: gain * 0.6 },
      { freq: 659.25, start: 0.15, duration: 0.08, type: 'square', gain: gain * 0.7 },
      { freq: 783.99, start: 0.20, duration: 0.08, type: 'triangle', gain: gain * 0.8 },
      { freq: 1046.5, start: 0.25, duration: 0.10, type: 'triangle', gain: gain * 0.9 },
      { freq: 1318.5, start: 0.30, duration: 0.10, type: 'triangle', gain },
      { freq: 1568.0, start: 0.35, duration: 0.40, type: 'sine', gain },
    ])
  }
}

// Combo break — sad descending tone
export function playComboBreak(lostCombo: number) {
  if (lostCombo < 3) return
  playNotes([
    { freq: 587.33, start: 0.00, duration: 0.15, type: 'sine', gain: 0.18 },
    { freq: 440.00, start: 0.10, duration: 0.15, type: 'sine', gain: 0.15 },
    { freq: 329.63, start: 0.20, duration: 0.25, type: 'sine', gain: 0.12 },
  ])
}
