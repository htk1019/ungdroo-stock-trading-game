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

// Single hand-clap: bright, short noise burst shaped by a bandpass filter
// so it sounds percussive rather than like static.
function playClap(at: number, gain: number) {
  const c = getCtx()
  if (!c) return
  const dur = 0.06
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    // Sharp attack, quick decay shape.
    const env = Math.pow(1 - i / bufferSize, 2)
    data[i] = (Math.random() * 2 - 1) * env
  }
  const src = c.createBufferSource()
  src.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1400 + Math.random() * 400
  bp.Q.value = 0.7
  const g = c.createGain()
  g.gain.setValueAtTime(gain, c.currentTime + at)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur)
  src.connect(bp).connect(g).connect(c.destination)
  src.start(c.currentTime + at)
  src.stop(c.currentTime + at + dur + 0.02)
}

// Cheerful "띠링!" chime + a burst of applause.
export function playWin() {
  playNotes([
    { freq: 1318.5, start: 0.00, duration: 0.22, type: 'triangle', gain: 0.35 }, // E6
    { freq: 1760.0, start: 0.09, duration: 0.28, type: 'triangle', gain: 0.35 }, // A6
    { freq: 2093.0, start: 0.20, duration: 0.45, type: 'triangle', gain: 0.35 }, // C7
  ])
  // Applause: many slightly randomized claps over ~1.8 seconds.
  const start = 0.45
  const end = 2.2
  for (let t = start; t < end; t += 0.035 + Math.random() * 0.04) {
    const progress = (t - start) / (end - start)
    // Swell in, sustain, then taper off.
    const env = progress < 0.2 ? progress / 0.2 : 1 - Math.max(0, (progress - 0.6) / 0.4)
    playClap(t, 0.10 + 0.08 * env * Math.random())
  }
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

// Goofy "waah-waah-waaaah" — sad-trombone slides. Each note bends
// downward in pitch so it feels silly and disappointed.
export function playMeh() {
  const c = getCtx()
  if (!c) return
  const now = c.currentTime
  const slide = (start: number, dur: number, fromHz: number, toHz: number, peak = 0.22) => {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(fromHz, now + start)
    osc.frequency.exponentialRampToValueAtTime(toHz, now + start + dur)
    g.gain.setValueAtTime(0, now + start)
    g.gain.linearRampToValueAtTime(peak, now + start + 0.02)
    g.gain.linearRampToValueAtTime(peak * 0.9, now + start + dur * 0.7)
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
    osc.connect(g).connect(c.destination)
    osc.start(now + start)
    osc.stop(now + start + dur + 0.02)
  }
  slide(0.00, 0.22, 392.0, 329.6, 0.22) // waah (G4 → E4)
  slide(0.28, 0.22, 349.2, 293.7, 0.22) // waah (F4 → D4)
  slide(0.56, 0.70, 311.1, 196.0, 0.24) // waaaah (Eb4 → G3, longer)
}
