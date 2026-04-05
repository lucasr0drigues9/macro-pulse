"use client";

export default function HowToUse() {
  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">How to Get the Best Results</h2>
      <p className="text-xs text-[#555] mb-6">The simplest strategy that works — backed by 5 years of data</p>

      {/* The top 2 per regime — US + UCITS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-lg border border-[#ef444430] bg-[rgba(239,68,68,0.05)]">
          <div className="text-xs text-[#ef4444] font-bold mb-1">Stagflation</div>
          <div className="text-sm text-[#e0e0e0]">XLE + GLD</div>
          <div className="text-xs text-[#555]">Energy + Gold</div>
          <div className="text-xs text-[#333] mt-1">UCITS: IUES.L + IGLN.L</div>
        </div>
        <div className="p-3 rounded-lg border border-[#22c55e30] bg-[rgba(34,197,94,0.05)]">
          <div className="text-xs text-[#22c55e] font-bold mb-1">Goldilocks</div>
          <div className="text-sm text-[#e0e0e0]">QQQ + FTEC</div>
          <div className="text-xs text-[#555]">Nasdaq + Tech</div>
          <div className="text-xs text-[#333] mt-1">UCITS: CNDX.L + XDWT.DE</div>
        </div>
        <div className="p-3 rounded-lg border border-[#eab30830] bg-[rgba(234,179,8,0.05)]">
          <div className="text-xs text-[#eab308] font-bold mb-1">Reflation</div>
          <div className="text-sm text-[#e0e0e0]">SPY + XLE</div>
          <div className="text-xs text-[#555]">S&amp;P 500 + Energy</div>
          <div className="text-xs text-[#333] mt-1">UCITS: SXR8.DE + IUES.L</div>
        </div>
        <div className="p-3 rounded-lg border border-[#3b82f630] bg-[rgba(59,130,246,0.05)]">
          <div className="text-xs text-[#3b82f6] font-bold mb-1">Deflation</div>
          <div className="text-sm text-[#e0e0e0]">TLT + GLD</div>
          <div className="text-xs text-[#555]">Bonds + Gold</div>
          <div className="text-xs text-[#333] mt-1">UCITS: DTLA.L + IGLN.L</div>
        </div>
      </div>

      {/* DCA comparison */}
      <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
        <h3 className="text-sm font-bold text-[#e0e0e0] mb-3">5-year backtest: $1,000/month (April 2021 → March 2026)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded bg-[#0a0a0a] text-center">
            <div className="text-xs text-[#555] mb-1">Framework — Top 2 picks</div>
            <div className="text-2xl font-bold text-[#22c55e]">$101,284</div>
            <div className="text-xs text-[#888]">+71.7% return · $42,284 profit</div>
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] text-center">
            <div className="text-xs text-[#555] mb-1">SPY only</div>
            <div className="text-2xl font-bold text-[#888]">$80,542</div>
            <div className="text-xs text-[#888]">+36.5% return · $21,542 profit</div>
          </div>
        </div>
        <div className="text-center">
          <span className="text-sm text-[#e0e0e0]">The framework earned </span>
          <span className="text-sm font-bold text-[#22c55e]">$20,742 more</span>
          <span className="text-sm text-[#e0e0e0]"> — nearly double the profit of SPY</span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#222]">
          <p className="text-xs text-[#555] text-center">
            We also tested: top 1 pick only (+61%), cheapest pick (+54%), equal split across all picks (+43%). The top 2 strategy consistently performed best — enough concentration to capture the edge, enough diversification to smooth the ride.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#333] text-center italic">
        Backtested performance. Does not represent live trading results. Past performance does not guarantee future results. Transaction costs and taxes not included.
      </p>
    </section>
  );
}
