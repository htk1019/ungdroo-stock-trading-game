import { useEffect, useRef, useState } from 'react'
import type { ThemeKey } from '../lib/theme'

interface BgmProps {
  active: boolean   // when false, music is paused (e.g. on result screen)
  themeKey: ThemeKey
}

const THEME_TRACKS: Record<ThemeKey, string[]> = {
  dark: ['duck'],
  rainbow: ['pingpong', 'phantasy'],
  neon: ['dilapidated', 'arcade'],
}

function pickThemeTrack(theme: ThemeKey): string {
  const pool = THEME_TRACKS[theme]
  return pool[Math.floor(Math.random() * pool.length)]
}

interface Track {
  key: string
  label: string
  src: string
}

const TRACKS: Track[] = [
  { key: 'duck',        label: '🦆 꽥꽥',   src: '/bgm-duck.mp3'        },
  { key: 'arcade',      label: '🕹️ 오락실',  src: '/bgm-arcade.mp3'      },
  { key: 'pingpong',    label: '🏓 탁구',   src: '/bgm-pingpong.mp3'    },
  { key: 'phantasy',    label: '⚔️ 모험',   src: '/bgm-phantasy.mp3'    },
  { key: 'ys',          label: '💎 보석',   src: '/bgm-ys.mp3'          },
  { key: 'motavia',     label: '🏜️ 사막',   src: '/bgm-motavia.mp3'     },
  { key: 'jijy',        label: '🎻 선율',   src: '/bgm-jijy.mp3'        },
  { key: 'dilapidated', label: '🏚️ 폐허',   src: '/bgm-dilapidated.mp3' },
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
export function Bgm({ active, themeKey }: BgmProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [muted, setMuted] = useState<boolean>(() => {
    return localStorage.getItem('bgm-muted') === '1'
  })
  // Random on every page load. Manual picks via the picker only persist
  // for the current session (intentionally not written to localStorage).
  const [trackKey, setTrackKey] = useState<string>(() => randomTrackKey())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const track = pickTrack(trackKey)

  // Try to start playback. Browsers require a user gesture for the first
  // play, so we attach click/keydown listeners until it succeeds.
  useEffect(() => {
    if (!active || started) return
    const tryStart = () => {
      const el = audioRef.current
      if (!el) return
      el.volume = 0.18
      el.muted = muted
      el.play().then(() => setStarted(true)).catch(() => { /* retry on next gesture */ })
    }
    window.addEventListener('click', tryStart)
    window.addEventListener('keydown', tryStart)
    window.addEventListener('touchstart', tryStart)
    tryStart()
    return () => {
      window.removeEventListener('click', tryStart)
      window.removeEventListener('keydown', tryStart)
      window.removeEventListener('touchstart', tryStart)
    }
  }, [active, started, muted])

  // Pause when leaving the active phase (result screen). Don't restart from 0
  // here — that interferes with smooth playback during setup→playing.
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (!active) el.pause()
    else if (started && !muted) el.play().catch(() => {})
  }, [active, started, muted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
    localStorage.setItem('bgm-muted', muted ? '1' : '0')
  }, [muted])

  // When theme changes, switch to the theme's default track
  const prevTheme = useRef(themeKey)
  useEffect(() => {
    if (prevTheme.current === themeKey) return
    prevTheme.current = themeKey
    const picked = pickThemeTrack(themeKey)
    if (picked !== trackKey) {
      setTrackKey(picked)
    }
  }, [themeKey, trackKey])

  // When the user picks a different track, reload the element and resume
  // playback if we're already past the first gesture.
  const prevTrack = useRef(trackKey)
  useEffect(() => {
    if (prevTrack.current === trackKey) return
    prevTrack.current = trackKey
    const el = audioRef.current
    if (!el) return
    el.load()
    if (started && active && !muted) el.play().catch(() => {})
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
