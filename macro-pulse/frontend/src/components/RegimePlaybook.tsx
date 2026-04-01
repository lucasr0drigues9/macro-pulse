"use client";

import { useState } from "react";
import { playbookData, REGIME_COLORS, type RegimeName } from "@/lib/mockData";

const regimeOrder: RegimeName[] = ["Stagflation", "Goldilocks", "Reflation", "Deflation"];

export default function RegimePlaybook() {
  const [expanded, setExpanded] = useState<RegimeName | null>(null);

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Why Each Asset Class Performs in Each Season</h2>
      <p className="text-xs text-[#555] mb-6">Understanding the mechanics behind the allocations</p>

      <div className="space-y-3">
        {regimeOrder.map((regime) => {
          const data = playbookData[regime];
          const colors = REGIME_COLORS[regime];
          const isOpen = expanded === regime;

          return (
            <div key={regime} className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : regime)}
                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: colors.color }}
                  />
                  <div>
                    <span className="font-bold text-sm" style={{ color: colors.color }}>
                      {regime}
                    </span>
                    <span className="text-xs text-[#555] ml-2">{data.description}</span>
                  </div>
                </div>
                <span className="text-[#555] text-sm">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-[#181818]">
                  <p className="text-sm text-[#888] mt-4 mb-4 leading-relaxed">{data.whatHappens}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-[#22c55e] mb-2">Outperform</h4>
                      <div className="space-y-2">
                        {data.outperform.map((a) => (
                          <div key={a.asset} className="p-2 rounded bg-[#0a0a0a]">
                            <div className="text-sm font-bold text-[#e0e0e0]">{a.asset}</div>
                            <div className="text-xs text-[#888] mt-0.5">{a.why}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-[#ef4444] mb-2">Underperform</h4>
                      <div className="space-y-2">
                        {data.underperform.map((a) => (
                          <div key={a.asset} className="p-2 rounded bg-[#0a0a0a]">
                            <div className="text-sm font-bold text-[#e0e0e0]">{a.asset}</div>
                            <div className="text-xs text-[#888] mt-0.5">{a.why}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-[#555] mb-1">Historical examples</h4>
                    <p className="text-xs text-[#888]">{data.historicalExamples.join(" · ")}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
