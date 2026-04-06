"use client";

export default function HowToUse() {
  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Why This Works</h2>
      <p className="text-xs text-[#555] mb-6">Verified against Google Finance / Yahoo Charts (2021–2026)</p>

      <div className="p-4 rounded-lg bg-[#111] border border-[#222] mb-6">
        <h3 className="text-sm font-bold text-[#e0e0e0] mb-3">The one edge that&apos;s real</h3>
        <p className="text-xs text-[#888] leading-relaxed mb-3">
          We tested every regime&apos;s recommended picks against SPY using real chart prices.
          Most of the time, SPY does as well or better. But in <span className="text-[#ef4444]">Stagflation</span> —
          when the geopolitical situation confirms falling growth and rising inflation — XLE and GLD consistently outperform.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[#22c55e] font-bold mb-2">What works</div>
            <div className="space-y-1 text-xs text-[#888]">
              <p>• Stagflation Feb–Apr 2024: XLE +8.6%, GLD +11.9% vs SPY -1.2%</p>
              <p>• Stagflation Dec 2024–present: GLD +99%, XLE +23% vs SPY flat</p>
              <p>• Reflation 2021–2022: XLE +22.8% vs SPY -4.9%</p>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#ef4444] font-bold mb-2">What doesn&apos;t</div>
            <div className="space-y-1 text-xs text-[#888]">
              <p>• Deflation picks (GLD+AGG) underperform SPY 2 out of 3 times</p>
              <p>• Goldilocks picks barely match SPY (+13.7% vs +14.3%)</p>
              <p>• Short regime calls can be false signals — use judgement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
        <h3 className="text-sm font-bold text-[#e0e0e0] mb-3">The simple strategy</h3>
        <div className="space-y-3 text-xs text-[#888]">
          <div className="flex gap-3">
            <span className="text-[#22c55e] font-bold shrink-0">90% of the time:</span>
            <span>Buy SPY every month. Growth regimes are hard to beat with sector picks.</span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#ef4444] font-bold shrink-0">When Stagflation signals:</span>
            <span>If the geopolitical situation confirms it, consider rotating to XLE + GLD. These are the only picks that consistently outperform SPY in verified data. Short signals can be false — use your judgement.</span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#888] font-bold shrink-0">When it ends:</span>
            <span>Go back to SPY. Sign up for alerts so you don&apos;t miss the transition.</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#333] text-center italic">
        Returns verified against Google Finance and Yahoo Charts. Past performance does not guarantee future results.
      </p>
    </section>
  );
}
