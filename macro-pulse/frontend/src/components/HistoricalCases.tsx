"use client";

import { useSignals } from "@/lib/SignalProvider";
import { matchCases } from "@/lib/historicalCases";

export default function HistoricalCases() {
  const { fedStance, oil } = useSignals();

  // Infer current phase from oil/liquidity — same logic as MarketContext
  const oilFalling = oil?.trend === "falling";
  const oilBelow85 = (oil?.latest.brent ?? 999) < 85;
  const phase = oilFalling || oilBelow85 ? "rotation" : "gold-anchor";
  const oilTrend = oil?.trend ?? null;

  const cases = matchCases({
    fedStance: fedStance?.stance ?? null,
    phase,
    oilTrend,
  });

  if (cases.length === 0) return null;

  return (
    <section className="px-4 py-6 max-w-5xl mx-auto">
      <div className="p-4 rounded-lg border border-[#222] bg-[#111]">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <h2 className="text-sm font-bold text-[#e0e0e0]">Historical parallels</h2>
          <span className="text-[10px] text-[#555]">Periods when signals matched today&apos;s setup</span>
        </div>
        <p className="text-[11px] text-[#888] leading-relaxed mb-4">
          Past performance does not guarantee future results. These are illustrative parallels, not predictions — real outcomes depend on factors that weren&apos;t the same at all.
        </p>

        <div className="divide-y divide-[#1a1a1a] border-t border-[#1a1a1a]">
          {cases.map((c) => (
            <details key={c.id} className="group">
              <summary className="flex items-baseline gap-2 flex-wrap cursor-pointer hover:bg-[#0a0a0a] py-3 px-1 -mx-1">
                <span className="text-[#555] group-open:rotate-90 transition-transform inline-block w-2 text-[10px]">›</span>
                <span className="text-[10px] text-[#555] uppercase tracking-wider">{c.date}</span>
                <h3 className="text-[13px] font-bold text-[#e0e0e0]">{c.title}</h3>
              </summary>

              <div className="pb-4 pl-4 border-l-2 border-[#333] ml-1">
                <p className="text-[11px] text-[#888] leading-relaxed mb-2">
                  <span className="text-[#555] uppercase tracking-wider text-[10px]">Then: </span>
                  {c.context}
                </p>

                <p className="text-[11px] text-[#d0d0d0] leading-relaxed mb-2">
                  <span className="text-[#555] uppercase tracking-wider text-[10px]">What happened: </span>
                  {c.outcome}
                </p>

                {c.returns.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mb-2">
                    {c.returns.map((r, i) => (
                      <div key={i} className="text-[10px] text-[#888] bg-[#0a0a0a] border border-[#1a1a1a] rounded px-2 py-1">
                        <div className="text-[9px] text-[#555]">{r.asset}</div>
                        <div className="font-bold text-[#e0e0e0]">{r.move}</div>
                        <div className="text-[9px] text-[#555]">{r.period}</div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-[#22c55e] leading-relaxed italic">
                  <span className="text-[#555] uppercase tracking-wider text-[10px] not-italic">Parallel: </span>
                  {c.parallel}
                </p>
              </div>
            </details>
          ))}
        </div>

        <p className="text-[9px] text-[#555] italic leading-relaxed pt-4 border-t border-[#1a1a1a] mt-4">
          Historical returns shown are approximate, sourced from public market data. Use as thesis support, not as a trading signal. Each period had unique drivers that may not repeat.
        </p>
      </div>
    </section>
  );
}
