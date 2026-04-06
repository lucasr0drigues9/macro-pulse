"use client";

export default function Welcome() {
  return (
    <section className="px-4 pt-16 pb-8 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">Macro Pulse</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Hold SPY. Defend when it matters.
        </p>
        <p className="text-sm text-[#888] max-w-lg mx-auto leading-relaxed">
          The S&amp;P 500 works most of the time. But in confirmed Stagflation — when growth
          falls and inflation rises — XLE and GLD historically outperform. This free tool
          detects the regime so you know when to defend your portfolio.
        </p>
      </div>

      {/* Two modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-lg border border-[#22c55e30] bg-[rgba(34,197,94,0.03)]">
          <div className="text-xs text-[#22c55e] font-bold uppercase tracking-wider mb-2">Default — Hold SPY</div>
          <p className="text-xs text-[#888] leading-relaxed">
            Buy SPY every month. In growth regimes it&apos;s hard to beat. Don&apos;t overthink it.
          </p>
          <p className="text-xs text-[#555] mt-2">UCITS: SXR8.DE (iShares Core S&amp;P 500)</p>
        </div>
        <div className="p-4 rounded-lg border border-[#ef444430] bg-[rgba(239,68,68,0.03)]">
          <div className="text-xs text-[#ef4444] font-bold uppercase tracking-wider mb-2">Defend — Stagflation</div>
          <p className="text-xs text-[#888] leading-relaxed">
            When the tool signals Stagflation and the geopolitical situation confirms it, consider XLE + GLD. Short signals can be false — use your judgement.
          </p>
          <p className="text-xs text-[#555] mt-2">UCITS: IUES.L + IGLN.L</p>
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs text-[#555]">See current regime ↓</span>
      </div>
    </section>
  );
}
