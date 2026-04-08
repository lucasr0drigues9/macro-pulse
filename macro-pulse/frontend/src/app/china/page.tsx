"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import {
  ACCENT, chinaRegime, proxyIndicators, strategicCards,
  directETFs, proxyPlays, taiwanHedges, type ProxyIndicator,
} from "@/lib/chinaData";

// ── Sparkline (pure SVG) ──
function Sparkline({ data, color }: { data: { month: string; value: number }[]; color: string }) {
  const w = 200, h = 40, px = 4, py = 4;
  const ys = data.map((d) => d.value);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const range = yMax - yMin || 1;
  const points = data.map((d, i) => {
    const x = px + (i / (data.length - 1)) * (w - px * 2);
    const y = py + (1 - (d.value - yMin) / range) * (h - py * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x = w - px;
        const y = py + (1 - (last.value - yMin) / range) * (h - py * 2);
        return <circle cx={x} cy={y} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

// ── Proxy Indicator Card ──
function IndicatorCard({ ind }: { ind: ProxyIndicator }) {
  const [open, setOpen] = useState(false);
  const trendColor = ind.trend === "rising" ? "#22c55e" : ind.trend === "declining" ? "#ef4444" : "#eab308";
  const sparkColor = ind.signal === "growth" ? "#3b82f6" : "#eab308";

  return (
    <div className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-4 text-left hover:bg-[#151515] transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-[#e0e0e0]">{ind.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: trendColor, backgroundColor: trendColor + "20" }}>
            {ind.trend}
          </span>
        </div>
        <div className="text-xs text-[#555] mb-2">{ind.subtitle}</div>
        <div className="text-lg font-bold" style={{ color: ACCENT }}>{ind.currentValue}</div>
        <Sparkline data={ind.history} color={sparkColor} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[#222] text-xs">
          <p className="text-[#888] mt-3 leading-relaxed">{ind.whyItMatters}</p>
          <p className="text-[#333] mt-2">Source: {ind.source}</p>
        </div>
      )}
    </div>
  );
}

export default function ChinaPage() {
  const [expandedStrat, setExpandedStrat] = useState<number | null>(null);
  const r = chinaRegime;
  const regimeColor = r.name === "Deflation" ? "#3b82f6" : r.name === "Stagflation" ? "#ef4444" : r.name === "Goldilocks" ? "#22c55e" : "#eab308";

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Header */}
      <section className="px-4 pt-12 pb-4 max-w-5xl mx-auto">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">China Tracker</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Official Chinese data is unreliable. This tracker uses proxy indicators to read the real economy.
        </p>
        <div className="p-3 rounded bg-[#111] border border-[#222] mt-4">
          <p className="text-xs text-[#555] italic leading-relaxed">
            The Li Keqiang index — named after the former Premier who reportedly told a US diplomat he ignored official GDP and tracked electricity, rail freight, and bank loans instead — is the foundation of this tracker.
          </p>
        </div>
      </section>

      {/* Regime Signal */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Current Regime — Proxy Based</h2>
        <p className="text-xs text-[#555] mb-4">Same four-quadrant framework as the US tracker, but using proxy data</p>

        <div className="text-center py-10 rounded-lg border" style={{ borderColor: regimeColor + "40", backgroundColor: regimeColor + "10" }}>
          <div className="text-5xl sm:text-7xl font-bold tracking-tight" style={{ color: regimeColor }}>
            {r.name}
          </div>
          <div className="mt-2 text-sm text-[#888]">
            Month {r.consecutiveMonths} · Confidence: {r.confidence}
          </div>
          <div className="mt-2 flex justify-center gap-6 text-xs">
            <span className="text-[#555]">Growth: <span style={{ color: r.growth === "falling" ? "#ef4444" : "#22c55e" }}>{r.growth}</span></span>
            <span className="text-[#555]">Inflation: <span style={{ color: r.inflation === "falling" ? "#3b82f6" : "#ef4444" }}>{r.inflation}</span></span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded bg-[#111] border border-[#222]">
          <p className="text-xs text-[#eab308] leading-relaxed">
            This regime signal is based on proxy indicators, not official data. Confidence is lower than the US regime signal. Use as directional guidance only.
          </p>
        </div>
      </section>

      {/* Six Proxy Indicators */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">What the Real Data Shows</h2>
        <p className="text-xs text-[#555] mb-6">Six indicators that are harder to fake than official GDP. Click for details.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {proxyIndicators.map((ind) => (
            <IndicatorCard key={ind.name} ind={ind} />
          ))}
        </div>
      </section>

      {/* Strategic Position */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">China in the World Order Transition</h2>
        <p className="text-xs text-[#555] mb-6">Three dimensions of China&apos;s strategic trajectory</p>

        <div className="space-y-3">
          {strategicCards.map((card, i) => {
            const isOpen = expandedStrat === i;
            const statusColor = card.status === "Elevated" ? "#ef4444" : card.status === "Accelerating" ? "#eab308" : "#22c55e";
            return (
              <div key={card.title} className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
                <button
                  onClick={() => setExpandedStrat(isOpen ? null : i)}
                  className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-[#151515] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#e0e0e0]">{card.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: statusColor, backgroundColor: statusColor + "20" }}>
                      {card.status}
                    </span>
                  </div>
                  <span className="text-[#555] text-sm">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-[#222]">
                    <p className="text-xs text-[#888] mt-3 leading-relaxed">{card.content}</p>
                    <div className="mt-3 text-xs">
                      <span className="text-[#555]">Key metric: </span>
                      <span style={{ color: ACCENT }} className="font-bold">{card.keyMetric}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Investable Assets */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">How to Position on China</h2>
        <p className="text-xs text-[#555] mb-6">Direct exposure, proxy plays, and hedges — with honest risk assessment</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Direct ETFs */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#ef4444] font-bold mb-3">Direct China ETFs</h3>
            <div className="space-y-2">
              {directETFs.map((etf) => (
                <div key={etf.ticker} className="p-3 rounded bg-[#111] border border-[#222]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-[#e0e0e0]">{etf.ticker}</span>
                    <span className={`text-xs font-bold ${etf.return1y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {etf.return1y >= 0 ? "+" : ""}{etf.return1y}%
                    </span>
                  </div>
                  <div className="text-[10px] text-[#555]">{etf.name}</div>
                  <div className="text-[10px] text-[#333] mt-1">{etf.note}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2 rounded bg-[#1a0000] border border-[#ef444430]">
              <p className="text-[10px] text-[#ef4444] leading-relaxed">
                Direct China ETFs carry regulatory risk (US delistings), geopolitical risk (Taiwan), and data reliability risk. Position sizing should reflect these additional risks.
              </p>
            </div>
          </div>

          {/* Proxy Plays */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#eab308] font-bold mb-3">Proxy Plays</h3>
            <div className="space-y-2">
              {proxyPlays.map((p) => (
                <div key={p.ticker} className="p-3 rounded bg-[#111] border border-[#222]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-[#e0e0e0]">{p.ticker}</span>
                    <span className={`text-xs font-bold ${p.return1y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {p.return1y >= 0 ? "+" : ""}{p.return1y}%
                    </span>
                  </div>
                  <div className="text-[10px] text-[#555]">{p.name}</div>
                  <div className="text-[10px] text-[#333] mt-1">{p.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Taiwan Hedges */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#3b82f6] font-bold mb-3">Taiwan Scenario Hedges</h3>
            <div className="space-y-2">
              {taiwanHedges.map((h) => (
                <div key={h.ticker} className="p-3 rounded bg-[#111] border border-[#222]">
                  <span className="text-sm font-bold text-[#e0e0e0]">{h.ticker}</span>
                  <span className="text-[10px] text-[#555] ml-2">{h.name}</span>
                  <p className="text-[10px] text-[#333] mt-1">{h.case}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2 rounded bg-[#111] border border-[#222]">
              <p className="text-[10px] text-[#555] leading-relaxed">
                These are not predictions. They are historical patterns from previous geopolitical conflicts applied to the Taiwan risk scenario.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* US vs China Regime Comparison */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Two Economies. Two Regimes.</h2>
        <p className="text-xs text-[#555] mb-6">When US and Chinese regimes diverge, specific opportunities emerge.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg border border-[#222]" style={{ backgroundColor: "#ef444410", borderColor: "#ef444430" }}>
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">US Regime (FRED + Geo)</div>
            <div className="text-2xl font-bold text-[#ef4444]">Stagflation</div>
            <div className="text-xs text-[#555] mt-1">Growth: falling · Inflation: rising</div>
            <div className="text-xs text-[#888] mt-2">Picks: GLD, XLE, DBC, XLU</div>
          </div>
          <div className="p-4 rounded-lg border border-[#222]" style={{ backgroundColor: "#3b82f610", borderColor: "#3b82f630" }}>
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">China Regime (Proxy)</div>
            <div className="text-2xl font-bold text-[#3b82f6]">{r.name}</div>
            <div className="text-xs text-[#555] mt-1">Growth: {r.growth} · Inflation: {r.inflation}</div>
            <div className="text-xs text-[#888] mt-2">Signal: Defensive positioning, avoid direct exposure</div>
          </div>
        </div>

        <div className="p-3 rounded bg-[#111] border border-[#eab30830]" style={{ backgroundColor: "#eab30810" }}>
          <div className="text-xs text-[#eab308] font-bold mb-1">Regime divergence detected</div>
          <p className="text-xs text-[#888] leading-relaxed">
            US in Stagflation (energy-driven inflation from Hormuz) while China in Deflation (property crisis, demand collapse). Historical pattern: commodity exporters and gold outperform when the world&apos;s two largest economies are both stressed but for different reasons. The safe play is real assets (GLD, DBC) rather than either country&apos;s equities.
          </p>
        </div>
      </section>

      {/* Email signup */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
          <h2 className="text-lg font-bold text-[#e0e0e0] mb-2">Track China&apos;s Real Economy</h2>
          <p className="text-xs text-[#555] mb-4 max-w-md mx-auto">
            Get notified when proxy indicators shift significantly or when Taiwan risk level changes.
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-3 py-2 rounded bg-[#0a0a0a] border border-[#222] text-sm text-[#e0e0e0] placeholder-[#333] focus:border-[#555] outline-none"
            />
            <button className="px-4 py-2 rounded text-sm text-[#e0e0e0] hover:opacity-80 transition-opacity" style={{ backgroundColor: ACCENT }}>
              Track China
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          China tracker uses proxy indicators and AI synthesis. Official Chinese data is used only where no reliable alternative exists. All regime signals carry lower confidence than US signals based on FRED data. Direct China investments carry additional regulatory, geopolitical, and data risks. Not personalised financial advice.
        </p>
      </footer>
    </main>
  );
}
