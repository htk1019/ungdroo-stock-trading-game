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
            종목과 시점을 모르는 채로 차트만 보고 매매하세요. 시뮬이 끝났을 때
            절대수익이 플러스이고 <span className="text-amber-300">Buy &amp; Hold</span>보다
            수익률도 높으면 <span className="text-emerald-400 font-semibold">승리</span>.
            거기에 <b>승률 90% 이상</b>이면 <span className="text-amber-300 font-semibold">👑 완벽승리</span>.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 mb-2">🎬 흐름</h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-[#e5e7eb]">
            <li>카테고리(미국/일본/한국/주가지수)와 <b>라운드 수</b>, <b>리밸런싱 주기</b>(일/주/월/분기/반기)를 고른다.</li>
            <li>랜덤 종목, 랜덤 시점의 <b>과거 1년</b> 일간 차트가 공개된다. (종목명은 비밀!)</li>
            <li>각 라운드마다 <b>롱 / 숏 / 플랫 / 홀드</b> 중 하나를 선택하면 다음 라운드까지 시간이 흐른다.</li>
            <li>필요하면 <b>🔮 훈수</b> 버튼으로 분석가 5명의 의견을 볼 수 있다(게임당 5회).</li>
            <li>모든 라운드가 끝나면 수익률, Buy &amp; Hold 비교, 복기 차트를 확인.</li>
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
          <p className="text-xs text-[#8b93a7] mt-2">모든 거래는 100% 비중, 수수료 0.1%(매수/매도 각), 시작 자금 $10,000.</p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 mb-2">🔮 훈수</h3>
          <p className="text-sm leading-relaxed text-[#e5e7eb] mb-2">
            분석가 5명이 지금까지 공개된 차트 기반 지표를 보고 각자의 스탠스를 알려준다. 게임당 5회 한정.
          </p>
          <ul className="space-y-1 text-xs text-[#8b93a7]">
            <li>🧓 <b className="text-[#e5e7eb]">이평 할배</b> — SMA5/20 크로스 (추세추종)</li>
            <li>🎯 <b className="text-[#e5e7eb]">MACD 박사</b> — MACD 시그널선 돌파 (추세추종)</li>
            <li>📏 <b className="text-[#e5e7eb]">RSI 선생</b> — 30/70 과매수·과매도 (밴드)</li>
            <li>🎈 <b className="text-[#e5e7eb]">BB 형님</b> — 볼린저 상/하단 터치 (밴드)</li>
            <li>🌫️ <b className="text-[#e5e7eb]">일목 도사</b> — 구름대 위/아래 (일목균형표)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 mb-2">📊 차트 & 지표</h3>
          <p className="text-sm text-[#e5e7eb] mb-2">
            차트 상단의 칩을 눌러 20종 이상 지표를 on/off. 기본은 SMA5·SMA20만 켜져 있다.
          </p>
          <ul className="space-y-1 text-xs text-[#8b93a7]">
            <li><b className="text-[#e5e7eb]">이평</b>: SMA 5/20/50/120, EMA 12/26, WMA20, KAMA</li>
            <li><b className="text-[#e5e7eb]">가격 오버레이</b>: 볼린저밴드, PSAR, VWAP, SuperTrend, 일목</li>
            <li><b className="text-[#e5e7eb]">모멘텀</b>: RSI, MACD, Stoch, StochRSI, CCI, %R, ROC, TRIX, AO</li>
            <li><b className="text-[#e5e7eb]">추세·변동</b>: ADX, ATR, %B, BBW</li>
            <li><b className="text-[#e5e7eb]">거래량</b>: Volume, OBV, MFI (지수는 거래량 없음)</li>
            <li>매매 화살표(매수/매도/공매도/환매)가 차트에 자동 표시됨</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 mb-2">🏆 기록 & 통계</h3>
          <ul className="space-y-1 text-sm text-[#e5e7eb]">
            <li><b>최고 기록</b>은 <b>연환산 수익률(CAGR)</b> 기준 (기간 편향 제거)</li>
            <li>최근 10게임 결과가 시작 화면에 표시됨</li>
            <li><b>승률 (포지션)</b>: 진입→청산 왕복 거래 중 수익 난 비율</li>
            <li><b>승률 (라운드)</b>: 포지션 보유 라운드에서 방향 맞춘 비율 (현금 제외)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 mb-2">📱 모바일</h3>
          <p className="text-sm text-[#e5e7eb]">
            휴대폰 가로 모드에서는 자동으로 좌측 차트 + 우측 사이드바 레이아웃으로 전환.
            지표 칩 패널은 접이식(▾)으로 숨겨져 차트 영역이 넓게 확보됨.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-bold text-amber-300 mb-2">⌨️ 단축키</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Key k="B" desc="롱 진입" />
            <Key k="S" desc="숏 진입" />
            <Key k="F" desc="플랫 (포지션 청산)" />
            <Key k="H" desc="홀드" />
            <Key k="Space" desc="홀드 (=다음 라운드)" />
            <Key k="Esc" desc="훈수/도움말 모달 닫기" />
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
