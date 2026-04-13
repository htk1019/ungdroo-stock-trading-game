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

// Cheerful "띠링!" — two bright bell-like notes rising quickly.
export function playWin() {
  playNotes([
    { freq: 1318.5, start: 0.00, duration: 0.22, type: 'triangle', gain: 0.35 }, // E6
    { freq: 1760.0, start: 0.09, duration: 0.28, type: 'triangle', gain: 0.35 }, // A6
    { freq: 2093.0, start: 0.20, duration: 0.45, type: 'triangle', gain: 0.35 }, // C7
  ])
}

// Sad "두둥탁" — two descending low tones and a short noise "thud".
export function playLose() {
  playNotes([
    { freq: 392.0, start: 0.00, duration: 0.35, type: 'sawtooth', gain: 0.25 }, // G4
    { freq: 311.1, start: 0.22, duration: 0.35, type: 'sawtooth', gain: 0.25 }, // Eb4
    { freq: 196.0, start: 0.46, duration: 0.55, type: 'sawtooth', gain: 0.28 }, // G3
  ])
  // Percussive "탁" thud via noise burst.
  const c = getCtx()
  if (!c) return
  const bufferSize = Math.floor(c.sampleRate * 0.12)
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const src = c.createBufferSource()
  src.buffer = buffer
  const g = c.createGain()
  g.gain.setValueAtTime(0.2, c.currentTime + 1.0)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.15)
  src.connect(g).connect(c.destination)
  src.start(c.currentTime + 1.0)
  src.stop(c.currentTime + 1.2)
}
