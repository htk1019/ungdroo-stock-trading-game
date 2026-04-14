import { useEffect, useRef, useState } from 'react'

interface BgmProps {
  active: boolean   // when false, music is paused (e.g. on result screen)
}

interface Track {
  key: string
  label: string
  src: string
}

const TRACKS: Track[] = [
  { key: 'pingpong', label: '🏓 핑퐁',   src: '/bgm-pingpong.mp3' },
  { key: 'duck',     label: '🦆 오리',   src: '/bgm-duck.mp3'     },
]

function pickTrack(key: string): Track {
  return TRACKS.find((t) => t.key === key) ?? TRACKS[0]
}

function randomTrackKey(): string {
  return TRACKS[Math.floor(Math.random() * TRACKS.length)].key
}

// Persistent background music with a mute toggle and a track picker.
// Browsers block raw autoplay, so we start the audio on the first user
// gesture (click / keydown) that happens anywhere in the app.
export function Bgm({ active }: BgmProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [muted, setMuted] = useState<boolean>(() => {
    return localStorage.getItem('bgm-muted') === '1'
  })
  const [trackKey, setTrackKey] = useState<string>(() => {
    return localStorage.getItem('bgm-track') ?? randomTrackKey()
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const track = pickTrack(trackKey)

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

  // When the selected track changes, reload and (if appropriate) resume play.
  useEffect(() => {
    localStorage.setItem('bgm-track', trackKey)
    const el = audioRef.current
    if (!el) return
    el.load()
    if (started && active && !muted) {
      el.play().catch(() => {})
    }
  }, [trackKey, started, active, muted])

  return (
    <>
      <audio ref={audioRef} src={track.src} loop preload="auto" />
      <div className="fixed top-2 left-2 z-50 flex flex-col items-start gap-1.5 opacity-60 hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMuted((m) => !m)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1a1e27]/85 border border-[#252a36] hover:border-amber-400/60 text-base shadow-lg backdrop-blur"
            title={muted ? '음악 켜기' : '음악 끄기'}
            aria-label="음악 토글"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1a1e27]/85 border border-[#252a36] hover:border-amber-400/60 text-base shadow-lg backdrop-blur"
            title="배경음 선택"
            aria-label="배경음 선택"
          >
            🎵
          </button>
        </div>
        {pickerOpen && (
          <div className="rounded-lg bg-[#1a1e27]/95 border border-[#252a36] shadow-lg backdrop-blur p-1 flex flex-col">
            {TRACKS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTrackKey(t.key); setPickerOpen(false) }}
                className={`text-left text-xs px-3 py-2 rounded whitespace-nowrap ${
                  t.key === trackKey
                    ? 'bg-amber-400/20 text-amber-200 font-bold'
                    : 'hover:bg-[#252a36] text-[#e5e7eb]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
