import { useEffect } from 'react'
import { type Analyst, stanceColor, stanceLabel } from '../lib/advice'

interface Props {
  analysts: Analyst[]
  hintsRemaining: number  // count AFTER consuming this hint
  onClose: () => void
}

export function HintModal({ analysts, hintsRemaining, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#12151c] border-2 border-[#333a4d] rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#252a36] sticky top-0 bg-[#12151c]">
          <h2 className="font-bold text-base sm:text-lg text-[#e5e7eb]">
            🔮 훈수 한 마디
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#8b93a7]">
              남은 훈수 <span className="text-amber-300 font-bold">{hintsRemaining}</span>회
            </span>
            <button
              onClick={onClose}
              className="text-[#8b93a7] hover:text-[#e5e7eb] text-xl leading-none px-2"
            >
              ×
            </button>
          </div>
        </div>

        <ul className="p-3 sm:p-4 flex flex-col gap-2">
          {analysts.map((a) => (
            <li
              key={a.name}
              className="flex items-start gap-3 p-3 rounded-lg bg-[#1a1e27] border border-[#252a36]"
            >
              <span className="text-2xl sm:text-3xl leading-none shrink-0">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm sm:text-base text-[#e5e7eb]">{a.name}</span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] sm:text-xs font-bold ${stanceColor(a.stance)}`}>
                    {stanceLabel(a.stance)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#8b93a7] mt-1 leading-snug">
                  {a.reason}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="px-4 py-3 border-t border-[#252a36] text-[11px] text-[#64748b] text-center">
          훈수는 보조 지표일 뿐, 결정은 본인 책임입니다.
        </div>
      </div>
    </div>
  )
}
