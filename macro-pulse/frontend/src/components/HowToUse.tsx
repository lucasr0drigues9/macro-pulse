"use client";

export default function HowToUse() {
  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">How to Get the Best Results</h2>
      <p className="text-xs text-[#555] mb-6">Based on 5 years of verified chart data (2021–2026)</p>

      {/* The strategy */}
      <div className="p-4 rounded-lg bg-[#111] border border-[#222] mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-bold text-[#22c55e] mb-2">Default: Hold SPY</div>
            <p className="text-xs text-[#888] leading-relaxed">
              Buy SPY (or UCITS: SXR8.DE) every month. In growth regimes (Goldilocks, Reflation),
              the broad market is hard to beat with sector picks. This is your baseline.
            </p>
          </div>
          <div>
            <div className="text-sm font-bold text-[#ef4444] mb-2">Defend: When Crisis Confirmed 4+ Months</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              When Stagflation or Deflation has been active for 4+ months, rotate your monthly
              investment into defensive picks. Back to SPY when the crisis ends.
            </p>
            <div className="space-y-1">
              <div className="text-xs">
                <span className="text-[#ef4444]">Stagflation →</span>
                <span className="text-[#e0e0e0] ml-1">XLE + GLD</span>
                <span className="text-[#555] ml-1">(UCITS: IUES.L + IGLN.L)</span>
              </div>
              <div className="text-xs">
                <span className="text-[#3b82f6]">Deflation →</span>
                <span className="text-[#e0e0e0] ml-1">GLD + AGG</span>
                <span className="text-[#555] ml-1">(UCITS: IGLN.L + IUAG.L)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why this works */}
      <div className="p-4 rounded-lg bg-[#111] border border-[#222] mb-6">
        <h3 className="text-sm font-bold text-[#e0e0e0] mb-3">Why wait for 4 months?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#888]">
          <div>
            <div className="text-[#ef4444] font-bold mb-1">Short regime calls (under 4 months)</div>
            <p className="leading-relaxed">
              Win rate: ~60%. Average return: +3-10%. These often reverse before the picks
              have time to work. Acting on every short signal leads to unnecessary trading
              and losses from false signals.
            </p>
          </div>
          <div>
            <div className="text-[#22c55e] font-bold mb-1">Confirmed regimes (4+ months)</div>
            <p className="leading-relaxed">
              Win rate: 86-100%. Average return: +9-14%. Once a regime is confirmed, the picks
              consistently outperform. The trade-off: you miss the first few months, but you
              avoid all the false signals.
            </p>
          </div>
        </div>
      </div>

      {/* Verified performance */}
      <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
        <h3 className="text-sm font-bold text-[#e0e0e0] mb-3">Verified against Google Finance charts (2021–2026)</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#888]">Confirmed Stagflation (Dec 2024 – Feb 2026)</span>
            <span className="text-[#22c55e] font-bold">XLE +23%, GLD +99%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">Confirmed Deflation (Oct 2022 – Dec 2022)</span>
            <span className="text-[#22c55e] font-bold">GLD +10%, AGG +5%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">Short Stagflation (Jun – Sep 2021)</span>
            <span className="text-[#ef4444] font-bold">XLE -7%, GLD -2%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">Short Goldilocks (Feb – Apr 2024)</span>
            <span className="text-[#ef4444] font-bold">QQQ -5%, FTEC -5%</span>
          </div>
        </div>
        <p className="text-xs text-[#555] mt-3 text-center">
          The confirmed crisis periods made money. The short signals lost money. Waiting works.
        </p>
      </div>

      <p className="mt-4 text-xs text-[#333] text-center italic">
        Backtested and verified performance. Does not represent guaranteed future results. Transaction costs and taxes not included.
      </p>
    </section>
  );
}
