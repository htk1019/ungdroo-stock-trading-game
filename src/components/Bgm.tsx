import { useEffect, useRef, useState } from 'react'

interface BgmProps {
  active: boolean   // when false, music is paused (e.g. on result screen)
}

// Persistent background music with a mute toggle.
// Browsers block raw autoplay, so we start the audio on the first user
// gesture (click / keydown) that happens anywhere in the app.
export function Bgm({ active }: BgmProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [muted, setMuted] = useState<boolean>(() => {
    return localStorage.getItem('bgm-muted') === '1'
  })
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!active || started) return
    const tryStart = () => {
      const el = audioRef.current
      if (!el) return
      el.volume = 0.35
      el.muted = muted
      el.play().then(() => setStarted(true)).catch(() => { /* will retry on next gesture */ })
    }
    window.addEventListener('click', tryStart, { once: false })
    window.addEventListener('keydown', tryStart, { once: false })
    tryStart()
    return () => {
      window.removeEventListener('click', tryStart)
      window.removeEventListener('keydown', tryStart)
    }
  }, [active, started, muted])

  // Pause / resume when the active flag flips (e.g. game ends → stop music).
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (!active) {
      el.pause()
    } else if (started && !muted) {
      el.currentTime = 0
      el.play().catch(() => {})
    }
  }, [active, started, muted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
    localStorage.setItem('bgm-muted', muted ? '1' : '0')
  }, [muted])

  return (
    <>
      <audio ref={audioRef} src="/bgm.mp3" loop preload="auto" />
      <button
        onClick={() => setMuted((m) => !m)}
        className="fixed bottom-4 right-4 z-50 w-11 h-11 rounded-full bg-[#1a1e27]/90 border border-[#252a36] hover:border-amber-400/60 text-lg shadow-lg backdrop-blur"
        title={muted ? '음악 켜기' : '음악 끄기'}
        aria-label="음악 토글"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </>
  )
}
