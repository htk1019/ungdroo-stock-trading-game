interface HelpModalProps {
  onClose: () => void
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#12151c] border border-[#252a36] rounded-2xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-extrabold">게임 방법</h2>
          <button
            onClick={onClose}
            className="text-[#8b93a7] hover:text-white text-2xl leading-none"
            aria-label="닫기"
          >×</button>
        </div>

        <section className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 mb-2">🎯 목표</h3>
          <p className="text-sm leading-relaxed text-[#e5e7eb]">
            종목과 시점을 모르는 채로 차트만 보고 매매하세요. 시뮬이 끝났을 때 같은 돈으로 사두고 가만히 있었을 경우 (<span className="text-amber-300">Buy &amp; Hold</span>)보다 수익률이 높으면 <span className="text-emerald-400 font-semibold">승리</span>.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 mb-2">🎬 흐름</h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-[#e5e7eb]">
            <li>카테고리(미국/일본/한국/주가지수)와 <b>라운드 수</b>, <b>리밸런싱 주기</b>(일/주/월/분기/반기)를 고른다.</li>
            <li>랜덤 종목, 랜덤 시점의 <b>과거 1년</b> 일간 차트가 공개된다. (종목명은 비밀!)</li>
            <li>각 라운드마다 <b>롱 / 숏 / 플랫 / 홀드</b> 중 하나를 선택하면 다음 라운드까지 시간이 흐른다.</li>
            <li>모든 라운드가 끝나면 수익률과 Buy &amp; Hold 비교 결과를 확인.</li>
          </ol>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 mb-2">💼 포지션</h3>
          <ul className="space-y-1.5 text-sm text-[#e5e7eb]">
            <li><span className="inline-block w-14 text-emerald-300 font-semibold">롱</span> 현금 100%로 주식을 산다 (오르면 이익)</li>
            <li><span className="inline-block w-14 text-amber-300 font-semibold">숏</span> 공매도 (내리면 이익)</li>
            <li><span className="inline-block w-14 text-slate-300 font-semibold">플랫</span> 포지션 청산 (현금 보유)</li>
            <li><span className="inline-block w-14 text-indigo-300 font-semibold">홀드</span> 현재 포지션 유지하며 시간만 흐름</li>
          </ul>
          <p className="text-xs text-[#8b93a7] mt-2">모든 거래는 100% 비중, 수수료 0.1%, 시작 자금 $10,000.</p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 mb-2">📊 차트 읽기</h3>
          <ul className="space-y-1 text-sm text-[#e5e7eb]">
            <li>상단: 캔들 + <span className="text-amber-300">SMA20</span> / <span className="text-violet-300">SMA50</span> / <span className="text-sky-300">EMA12</span></li>
            <li>거래량 (주가지수는 생략)</li>
            <li>RSI(14) — 70 이상 과매수, 30 이하 과매도</li>
            <li>MACD(12,26,9) — 추세 전환 힌트</li>
            <li>매매 화살표가 차트에 표시됨</li>
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-bold text-amber-300 mb-2">⌨️ 단축키</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Key k="B" desc="롱" />
            <Key k="S" desc="숏" />
            <Key k="F" desc="플랫" />
            <Key k="H" desc="홀드" />
            <Key k="Space" desc="홀드 (=다음 라운드)" />
          </div>
        </section>
      </div>
    </div>
  )
}

function Key({ k, desc }: { k: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="px-2 py-0.5 rounded bg-[#1a1e27] border border-[#252a36] font-mono text-xs">{k}</kbd>
      <span className="text-[#8b93a7]">{desc}</span>
    </div>
  )
}
