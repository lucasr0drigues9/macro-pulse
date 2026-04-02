"use client";

import { REGIME_COLORS } from "@/lib/mockData";

const seasons = [
  { name: "Stagflation", desc: "Falling growth, rising inflation", color: REGIME_COLORS.Stagflation.color },
  { name: "Goldilocks", desc: "Rising growth, falling inflation", color: REGIME_COLORS.Goldilocks.color },
  { name: "Reflation", desc: "Rising growth, rising inflation", color: REGIME_COLORS.Reflation.color },
  { name: "Deflation", desc: "Falling growth, falling inflation", color: REGIME_COLORS.Deflation.color },
];

const steps = [
  { num: "1", title: "Read the signals", desc: "FRED economic data + daily AI geopolitical analysis" },
  { num: "2", title: "Classify the regime", desc: "Map conditions to one of four economic seasons" },
  { num: "3", title: "Show what works", desc: "Which ETFs historically outperform in this regime" },
];

export default function Welcome() {
  return (
    <section className="px-4 pt-16 pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">Macro Pulse</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Track economic regimes in real time.<br className="hidden sm:block" /> Know what to own and when.
        </p>
        <p className="text-sm text-[#888] max-w-lg mx-auto leading-relaxed">
          The economy cycles through four seasons. Each one rewards different assets.
          This tool detects which season we&apos;re in using live economic data and
          AI-powered geopolitical analysis, then shows you what historically works.
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

      {/* Scroll prompt */}
      <div className="text-center">
        <span className="text-xs text-[#555]">See current regime ↓</span>
      </div>
    </section>
  );
}
