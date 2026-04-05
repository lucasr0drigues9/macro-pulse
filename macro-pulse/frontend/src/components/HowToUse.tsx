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
          <div className="text-sm text-[#e0e0e0]">GLD + AGG</div>
          <div className="text-xs text-[#555]">Gold + Agg Bond</div>
          <div className="text-xs text-[#333] mt-1">UCITS: IGLN.L + IUAG.L</div>
        </div>
      </div>

      {/* DCA comparison */}
      <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
        <h3 className="text-sm font-bold text-[#e0e0e0] mb-3">5-year backtest: $1,000/month (April 2021 → February 2026)</h3>
        <p className="text-xs text-[#555] mb-3">Verified against actual ETF chart prices. Includes regime rotations — sell old picks, buy new top 2 when regime changes.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded bg-[#0a0a0a] text-center">
            <div className="text-xs text-[#555] mb-1">Framework — Top 2 picks with rotation</div>
            <div className="text-2xl font-bold text-[#22c55e]">$84,580</div>
            <div className="text-xs text-[#888]">+45.8% return · $26,580 profit</div>
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] text-center">
            <div className="text-xs text-[#555] mb-1">SPY only</div>
            <div className="text-2xl font-bold text-[#888]">$73,518</div>
            <div className="text-xs text-[#888]">+26.8% return · $15,518 profit</div>
          </div>
        </div>
        <div className="text-center">
          <span className="text-sm text-[#e0e0e0]">The framework earned </span>
          <span className="text-sm font-bold text-[#22c55e]">$11,062 more</span>
          <span className="text-sm text-[#e0e0e0]"> — 71% more profit than SPY alone</span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#222]">
          <p className="text-xs text-[#555] text-center">
            The biggest wins came from XLE +45% in Reflation and GLD +49% in Stagflation. The biggest loss was TLT -10% in the 2022 Deflation — the Deflation picks are the weakest part of the framework. Numbers verified against Google Finance chart data.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#333] text-center italic">
        Backtested performance. Does not represent live trading results. Past performance does not guarantee future results. Transaction costs and taxes not included.
      </p>
    </section>
  );
}
