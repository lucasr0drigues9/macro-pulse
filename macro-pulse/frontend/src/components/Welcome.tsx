"use client";

import { useState } from "react";
import { REGIME_COLORS, playbookData, type RegimeName } from "@/lib/mockData";
import SectionChat from "@/components/SectionChat";

const seasons: { name: RegimeName; desc: string }[] = [
  { name: "Stagflation", desc: "Defend — energy, gold, commodities outperform" },
  { name: "Goldilocks", desc: "Growth — SPY, Nasdaq, tech outperform" },
  { name: "Reflation", desc: "Expand — cyclicals and energy lead" },
  { name: "Deflation", desc: "Protect — gold and bonds preserve capital" },
];

export default function Welcome() {
  const [expanded, setExpanded] = useState<RegimeName | null>(null);

  return (
    <section className="px-4 pt-16 pb-8 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">US Regime Tracker</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          How the US economy affects the AI Race
        </p>
        <p className="text-sm text-[#555] max-w-lg mx-auto">
          The US macro regime determines whether AI and robotics ETFs are discounted (buy) or extended (wait). Track the regime to time your AI Race entry.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {seasons.map((s) => {
          const colors = REGIME_COLORS[s.name];
          const data = playbookData[s.name];
          const isOpen = expanded === s.name;

          return (
            <div key={s.name} className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : s.name)}
                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: colors.color }}
                  />
                  <div>
                    <span className="font-bold text-sm" style={{ color: colors.color }}>
                      {s.name}
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

      <SectionChat
        context="Welcome section of the US Regime Tracker on Macro World View. This page uses Ray Dalio's four-season framework (Stagflation, Goldilocks, Reflation, Deflation) to detect the current US economic regime using FRED data and an AI geopolitical layer. Below this section: live regime signal, asset performance, portfolio allocation, weekly calendar, triggers, transition outlook, and 19-year backtest history."
        label="Ask about this tool"
        suggestions={[
          "How does this regime tracker work?",
          "What's the difference between the four seasons?",
          "How should I use this page?",
        ]}
      />

      <div className="text-center mt-6">
        <span className="text-xs text-[#555]">See current regime ↓</span>
      </div>
    </section>
  );
}
