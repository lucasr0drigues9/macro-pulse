"use client";

export default function Welcome() {
  return (
    <section className="px-4 pt-16 pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">Macro Pulse</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Hold SPY. Defend when it matters.
        </p>
        <p className="text-sm text-[#888] max-w-lg mx-auto leading-relaxed">
          The S&amp;P 500 works most of the time. But in confirmed crisis regimes — Stagflation
          and Deflation — defensive assets protect your portfolio. This free tool tells you
          when to stop holding the market and start defending.
        </p>
      </div>

      {/* Two modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="p-4 rounded-lg border border-[#22c55e30] bg-[rgba(34,197,94,0.03)]">
          <div className="text-xs text-[#22c55e] font-bold uppercase tracking-wider mb-2">Default — Hold SPY</div>
          <div className="text-sm text-[#e0e0e0] mb-2">Goldilocks &amp; Reflation</div>
          <p className="text-xs text-[#888] leading-relaxed">
            In growth regimes, the S&amp;P 500 is hard to beat with sector picks. Just buy SPY every month. Don&apos;t overthink it.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-[#ef444430] bg-[rgba(239,68,68,0.03)]">
          <div className="text-xs text-[#ef4444] font-bold uppercase tracking-wider mb-2">Defend — When Crisis Confirmed</div>
          <div className="text-sm text-[#e0e0e0] mb-2">Stagflation → XLE + GLD · Deflation → GLD + AGG</div>
          <p className="text-xs text-[#888] leading-relaxed">
            Only rotate to defensive picks after a crisis regime has been confirmed for 4+ months. Short signals are unreliable — wait for the regime to prove itself.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
        <div className="flex-1 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs text-[#888]">1</span>
          </div>
          <div>
            <div className="text-sm font-bold text-[#e0e0e0]">Buy SPY every month</div>
            <div className="text-xs text-[#888]">Your default. Works in Goldilocks and Reflation.</div>
          </div>
        </div>
        <span className="hidden sm:block text-[#333] self-center">→</span>
        <div className="flex-1 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs text-[#888]">2</span>
          </div>
          <div>
            <div className="text-sm font-bold text-[#e0e0e0]">Watch the regime signal</div>
            <div className="text-xs text-[#888]">When Stagflation or Deflation is detected, wait for 4-month confirmation.</div>
          </div>
        </div>
        <span className="hidden sm:block text-[#333] self-center">→</span>
        <div className="flex-1 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs text-[#888]">3</span>
          </div>
          <div>
            <div className="text-sm font-bold text-[#e0e0e0]">Defend when confirmed</div>
            <div className="text-xs text-[#888]">Rotate to defensive picks. Back to SPY when the crisis ends.</div>
          </div>
        </div>
      </div>

      {/* Key insight */}
      <div className="p-3 rounded-lg bg-[#111] border border-[#222] mb-8">
        <p className="text-xs text-[#888] text-center leading-relaxed">
          <span className="text-[#e0e0e0]">Why wait 4 months?</span> Short regime signals are wrong half the time — acting on them loses money. But regimes that last 4+ months are confirmed trends where defensive picks consistently outperform. Stagflation picks averaged +14.1% (100% win rate) in confirmed periods vs +10.4% in short ones.
        </p>
      </div>

      {/* Scroll prompt */}
      <div className="text-center">
        <span className="text-xs text-[#555]">See current regime ↓</span>
      </div>
    </section>
  );
}
