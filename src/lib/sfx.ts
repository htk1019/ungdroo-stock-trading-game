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

// "뭐지?" sample — plays the prerecorded clip at /meh.mp3.
export function playMeh() {
  if (typeof window === 'undefined') return
  const audio = new Audio('/meh.mp3')
  audio.volume = 0.4
  audio.play().catch(() => {})
}
