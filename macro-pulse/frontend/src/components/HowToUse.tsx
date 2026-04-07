"use client";

export default function HowToUse() {
  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">What the Data Shows</h2>
      <p className="text-xs text-[#555] mb-6">Honest assessment — what works and what doesn&apos;t</p>

      <div className="p-4 rounded-lg bg-[#111] border border-[#222] mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[#22c55e] font-bold mb-2">Where the framework adds value</div>
            <div className="space-y-1 text-xs text-[#888]">
              <p>• <span className="text-[#e0e0e0]">Stagflation:</span> XLE + GLD consistently outperform SPY — the strongest signal</p>
              <p>• <span className="text-[#e0e0e0]">Deflation:</span> GLD + AGG protect capital when SPY loses money</p>
              <p>• <span className="text-[#e0e0e0]">Goldilocks:</span> Growth picks (QQQ, ARKW, FTEC) can outperform SPY significantly</p>
              <p>• <span className="text-[#e0e0e0]">Reflation:</span> XLE and cyclicals add value alongside SPY</p>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#ef4444] font-bold mb-2">Honest limitations</div>
            <div className="space-y-1 text-xs text-[#888]">
              <p>• Short regime signals (&lt;4 months) can be false — use judgement</p>
              <p>• Deflation picks protect capital but miss rallies when SPY recovers fast (e.g. 2023 AI boom)</p>
              <p>• Growth regime picks don&apos;t always beat just holding SPY</p>
              <p>• Backtest returns use close prices which may differ slightly from your broker</p>
              <p>• Past performance does not guarantee future results</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
        <h3 className="text-sm font-bold text-[#e0e0e0] mb-3">The practical approach</h3>
        <div className="space-y-2 text-xs text-[#888]">
          <p>• Check the regime signal and see what the framework recommends</p>
          <p>• Use the price assessments to prioritise cheaper picks over extended ones</p>
          <p>• Watch the triggers for regime change signals</p>
          <p>• Use the Transition Radar to prepare for what comes next</p>
          <p>• Sign up for email alerts so you don&apos;t have to check manually</p>
          <p>• <span className="text-[#e0e0e0]">Always verify returns against Google Finance or Yahoo Charts before acting</span></p>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#333] text-center italic">
        This is a systematic framework for educational purposes. Not personalised financial advice. Always do your own research.
      </p>
    </section>
  );
}
