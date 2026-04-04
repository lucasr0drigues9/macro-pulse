"use client";

import { REGIME_COLORS } from "@/lib/mockData";

const seasons = [
  { name: "Stagflation", desc: "Defend — energy, gold, commodities outperform", color: REGIME_COLORS.Stagflation.color },
  { name: "Goldilocks", desc: "Attack — growth & innovation ETFs outperform", color: REGIME_COLORS.Goldilocks.color },
  { name: "Reflation", desc: "Expand — cyclicals and small caps lead", color: REGIME_COLORS.Reflation.color },
  { name: "Deflation", desc: "Protect — bonds, gold, and cash preserve capital", color: REGIME_COLORS.Deflation.color },
];

const steps = [
  { num: "1", title: "Detect the regime", desc: "AI geopolitical analysis + FRED economic data confirmation" },
  { num: "2", title: "Rotate to the right assets", desc: "Each regime has a specific set of ETFs that historically outperform" },
  { num: "3", title: "Buy what's cheap", desc: "Same thesis, better entry — prioritise attractively priced picks" },
];

export default function Welcome() {
  return (
    <section className="px-4 pt-16 pb-8 max-w-5xl mx-auto">
      {/* Header */}
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

      {/* Four seasons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {seasons.map((s) => (
          <div
            key={s.name}
            className="p-3 rounded-lg border text-center"
            style={{ borderColor: s.color + "30", backgroundColor: s.color + "10" }}
          >
            <div
              className="w-2 h-2 rounded-full mx-auto mb-2"
              style={{ backgroundColor: s.color }}
            />
            <div className="text-sm font-bold" style={{ color: s.color }}>
              {s.name}
            </div>
            <div className="text-xs text-[#888] mt-1">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
        {steps.map((step, i) => (
          <div key={step.num} className="flex-1 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs text-[#888]">{step.num}</span>
            </div>
            <div>
              <div className="text-sm font-bold text-[#e0e0e0]">{step.title}</div>
              <div className="text-xs text-[#888]">{step.desc}</div>
            </div>
            {i < steps.length - 1 && (
              <span className="hidden sm:block text-[#333] self-center ml-auto">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div className="p-3 rounded-lg bg-[#111] border border-[#222] mb-8">
        <p className="text-xs text-[#888] text-center leading-relaxed">
          <span className="text-[#e0e0e0]">19 years of data (2007–2026):</span> In Goldilocks, growth picks averaged +32% vs SPY +15%. In Stagflation, defensive picks returned +17% vs SPY +1%. In Deflation, picks stayed positive while SPY lost money. The framework outperformed in 82% of regime periods by owning the right assets at the right time.
        </p>
      </div>

      {/* Scroll prompt */}
      <div className="text-center">
        <span className="text-xs text-[#555]">See current regime ↓</span>
      </div>
    </section>
  );
}
