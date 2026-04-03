"use client";

import { REGIME_COLORS } from "@/lib/mockData";

const seasons = [
  { name: "Stagflation", desc: "SPY struggles — defend with energy, gold, commodities", color: REGIME_COLORS.Stagflation.color },
  { name: "Goldilocks", desc: "SPY thrives — hold the market", color: REGIME_COLORS.Goldilocks.color },
  { name: "Reflation", desc: "SPY does well — tilt toward cyclicals", color: REGIME_COLORS.Reflation.color },
  { name: "Deflation", desc: "SPY loses money — defend with bonds, gold, cash", color: REGIME_COLORS.Deflation.color },
];

const steps = [
  { num: "1", title: "Detect the regime", desc: "AI geopolitical analysis + FRED confirmation signal" },
  { num: "2", title: "Hold or defend", desc: "Growth regime → hold SPY. Crisis regime → rotate to defensive picks" },
  { num: "3", title: "Buy what's cheap", desc: "Same regime thesis, better entry price — the calculator does this for you" },
];

export default function Welcome() {
  return (
    <section className="px-4 pt-16 pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">Macro Pulse</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          The S&amp;P 500 works most of the time.<br className="hidden sm:block" /> This tool tells you when it doesn&apos;t.
        </p>
        <p className="text-sm text-[#888] max-w-lg mx-auto leading-relaxed">
          In growth regimes, holding SPY is hard to beat. But in Stagflation and Deflation,
          the S&amp;P 500 underperforms or loses money — and defensive assets take over.
          This free tool detects which regime we&apos;re in so you know when to defend your portfolio.
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
          <span className="text-[#e0e0e0]">19 years of data (2007–2026):</span> In Goldilocks and Reflation, SPY averaged +6-7% — hard to beat with sector picks. In Stagflation and Deflation, defensive picks returned +2-7% while SPY averaged -1% to +5%. The framework&apos;s value is knowing when to stop holding the market and start defending.
        </p>
      </div>

      {/* Scroll prompt */}
      <div className="text-center">
        <span className="text-xs text-[#555]">See current regime ↓</span>
      </div>
    </section>
  );
}
