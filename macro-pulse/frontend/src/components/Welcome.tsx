"use client";

import { REGIME_COLORS } from "@/lib/mockData";

const seasons = [
  { name: "Stagflation", desc: "Defend — energy, gold, commodities outperform", color: REGIME_COLORS.Stagflation.color },
  { name: "Goldilocks", desc: "Growth — SPY, Nasdaq, tech outperform", color: REGIME_COLORS.Goldilocks.color },
  { name: "Reflation", desc: "Expand — cyclicals and energy lead", color: REGIME_COLORS.Reflation.color },
  { name: "Deflation", desc: "Protect — gold and bonds preserve capital", color: REGIME_COLORS.Deflation.color },
];

export default function Welcome() {
  return (
    <section className="px-4 pt-16 pb-8 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">Macro Pulse</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Know which assets to own<br className="hidden sm:block" /> in every economic season.
        </p>
        <p className="text-sm text-[#888] max-w-lg mx-auto leading-relaxed">
          The economy cycles through four regimes. Each one rewards different assets.
          This free tool detects the current regime using AI geopolitical analysis and economic data,
          then shows you which ETFs historically outperform — in growth and in crisis.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {seasons.map((s) => (
          <div
            key={s.name}
            className="p-3 rounded-lg border text-center"
            style={{ borderColor: s.color + "30", backgroundColor: s.color + "10" }}
          >
            <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: s.color }} />
            <div className="text-sm font-bold" style={{ color: s.color }}>{s.name}</div>
            <div className="text-xs text-[#888] mt-1">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <span className="text-xs text-[#555]">See current regime ↓</span>
      </div>
    </section>
  );
}
