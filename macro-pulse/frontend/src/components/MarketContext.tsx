"use client";

import { useSignals, type SignalState } from "@/lib/SignalProvider";

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444",
  Goldilocks: "#22c55e",
  Reflation: "#eab308",
  Deflation: "#3b82f6",
};

type InternalSignal = SignalState["internals"] extends { internals: (infer T)[] } | null ? T : never;

export default function MarketContext() {
  const { us, eu, cn, liquidity, yields, oil, internals } = useSignals();

  const regime = us?.regime || null;
  const regimeColor = regime ? REGIME_COLORS[regime] || "#888" : "#888";

  if (!regime && !liquidity && !yields) return null;

  const trendColor = liquidity
    ? liquidity.trend === "expanding" ? "#22c55e" : liquidity.trend === "contracting" ? "#ef4444" : "#888"
    : "#888";

  const sparkW = 300, sparkH = 30;

  // Compute sparkline points + the y-position of the starting value, for a dotted baseline
  function sparkPath(vals: number[]): { points: string; startY: number } {
    if (vals.length === 0) return { points: "", startY: sparkH / 2 };
    const min = Math.min(...vals) * 0.98;
    const range = Math.max(...vals) * 1.02 - min || 1;
    const points = vals
      .map((v, i) => `${(i / (vals.length - 1)) * sparkW},${sparkH - ((v - min) / range) * sparkH}`)
      .join(" ");
    const startY = sparkH - ((vals[0] - min) / range) * sparkH;
    return { points, startY };
  }

  const liqSpark = liquidity ? sparkPath(liquidity.sparkline.map((p) => p.value)) : { points: "", startY: 0 };
  const yieldSpark = yields ? sparkPath(yields.sparkline.map((p) => p.value)) : { points: "", startY: 0 };
  const oilSpark = oil ? sparkPath(oil.sparkline.map((p) => p.value)) : { points: "", startY: 0 };


  const threeM = liquidity?.changes.threeMonth ?? null;

  const yieldTrendColor = yields
    ? yields.trend === "rising" ? "#ef4444" : yields.trend === "falling" ? "#22c55e" : "#888"
    : "#888";
  const oilTrendColor = oil
    ? oil.trend === "rising" ? "#ef4444" : oil.trend === "falling" ? "#22c55e" : "#888"
    : "#888";
  const curveColor = yields
    ? yields.curveRegime === "inverted" ? "#ef4444"
    : yields.curveRegime === "flat" ? "#eab308"
    : yields.curveRegime === "normal" ? "#22c55e"
    : "#3b82f6"
    : "#888";

  return (
    <section id="market-context" className="px-4 py-6 max-w-5xl mx-auto scroll-mt-20">
      <div className="p-3 rounded-lg border border-[#222] bg-[#111]">
        {/* Compact signal rows — each is one line with sparkline, expandable for detail */}
        <div className="divide-y divide-[#1a1a1a]">
          {/* Liquidity */}
          {liquidity && (
            <div className="flex items-center gap-2 py-2 flex-wrap text-[10px]">
              <span className="uppercase tracking-wider text-[#555] w-20 flex-shrink-0">Liquidity</span>
              <span className="text-xs font-bold text-[#e0e0e0]">${(liquidity.latest.netLiquidity / 1000).toFixed(2)}T</span>
              <span className="font-bold px-1.5 py-0.5 rounded capitalize" style={{ color: trendColor, backgroundColor: trendColor + "20" }}>
                {liquidity.trend}
              </span>
              <span style={{ color: (threeM ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                {threeM !== null ? `${threeM >= 0 ? "+" : ""}${threeM}%` : "—"} 3m
              </span>
              <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="flex-1 min-w-[40px] h-5" preserveAspectRatio="none">
                <line x1="0" y1={liqSpark.startY} x2={sparkW} y2={liqSpark.startY} stroke="#555" strokeWidth="1" strokeDasharray="3,3" />
                <polyline points={liqSpark.points} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] text-[#444]">12m</span>
            </div>
          )}

          {/* 10Y yield */}
          {yields && (
            <div className="flex items-center gap-2 py-2 flex-wrap text-[10px]">
              <span className="uppercase tracking-wider text-[#555] w-20 flex-shrink-0">10Y yield</span>
              <span className="text-xs font-bold text-[#e0e0e0]">{yields.latest.tenYear.toFixed(2)}%</span>
              <span className="font-bold px-1.5 py-0.5 rounded capitalize" style={{ color: yieldTrendColor, backgroundColor: yieldTrendColor + "20" }}>
                {yields.trend}
              </span>
              <span
                title={`1 bps = 0.01%. Yield moved ${(yields.changes.threeMonthBps ?? 0) >= 0 ? "up" : "down"} ${Math.abs(yields.changes.threeMonthBps ?? 0)}bps over 3 months.`}
                style={{ color: (yields.changes.threeMonthBps ?? 0) >= 0 ? "#ef4444" : "#22c55e", cursor: "help", textDecoration: "underline dotted", textUnderlineOffset: "2px", textDecorationColor: "#333" }}
              >
                {yields.changes.threeMonthBps !== null ? `${yields.changes.threeMonthBps >= 0 ? "+" : ""}${yields.changes.threeMonthBps}bps` : "—"}
              </span>
              <span
                title="2s10s: 10Y yield minus 2Y yield. Inverted = recession signal (6-18mo)."
                style={{ color: curveColor, cursor: "help", textDecoration: "underline dotted", textUnderlineOffset: "2px", textDecorationColor: "#333" }}
              >
                2s10s {yields.latest.curve >= 0 ? "+" : ""}{yields.latest.curve.toFixed(2)}
              </span>
              <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="flex-1 min-w-[40px] h-5" preserveAspectRatio="none">
                <line x1="0" y1={yieldSpark.startY} x2={sparkW} y2={yieldSpark.startY} stroke="#555" strokeWidth="1" strokeDasharray="3,3" />
                <polyline points={yieldSpark.points} fill="none" stroke={yieldTrendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] text-[#444]">3m</span>
            </div>
          )}

          {/* Oil */}
          {oil && (
            <div className="flex items-center gap-2 py-2 flex-wrap text-[10px]">
              <span
                className="uppercase tracking-wider text-[#555] w-20 flex-shrink-0"
                title="Brent crude — leading inflation indicator. $10/bbl ≈ +0.4% CPI over 2-3 months."
                style={{ cursor: "help", textDecoration: "underline dotted", textUnderlineOffset: "2px", textDecorationColor: "#333" }}
              >Oil (Brent)</span>
              <span className="text-xs font-bold text-[#e0e0e0]">${oil.latest.brent.toFixed(2)}</span>
              <span className="font-bold px-1.5 py-0.5 rounded capitalize" style={{ color: oilTrendColor, backgroundColor: oilTrendColor + "20" }}>
                {oil.trend}
              </span>
              <span style={{ color: (oil.changes.threeMonth ?? 0) >= 0 ? "#ef4444" : "#22c55e" }}>
                {oil.changes.threeMonth !== null ? `${oil.changes.threeMonth >= 0 ? "+" : ""}${oil.changes.threeMonth}%` : "—"} 3m
              </span>
              <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="flex-1 min-w-[40px] h-5" preserveAspectRatio="none">
                <line x1="0" y1={oilSpark.startY} x2={sparkW} y2={oilSpark.startY} stroke="#555" strokeWidth="1" strokeDasharray="3,3" />
                <polyline points={oilSpark.points} fill="none" stroke={oilTrendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] text-[#444]">3m</span>
            </div>
          )}

          {/* Regime */}
          {regime && (
            <div className="flex items-center gap-2 py-2 flex-wrap text-[10px]">
              <span className="uppercase tracking-wider text-[#555] w-20 flex-shrink-0">Regime</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: regimeColor, backgroundColor: regimeColor + "20" }}>
                US {regime}
              </span>
              {eu && cn && [
                { label: "EU", r: eu.regime },
                { label: "CN", r: cn.regime },
              ].map((x) => {
                const c = REGIME_COLORS[x.r] || "#555";
                return (
                  <span key={x.label} className="px-1.5 py-0.5 rounded" style={{ backgroundColor: c + "15", border: `1px solid ${c}30` }}>
                    <span className="text-[#555]">{x.label}</span>{" "}
                    <span className="font-bold" style={{ color: c }}>{x.r}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Internals bar — Druckenmiller-style cross-asset confirmation */}
        {internals && internals.total > 0 && (() => {
          const confirm = internals.confirmationScore;
          const contradict = internals.contradictionScore;
          const scoreColor =
            confirm >= 3 ? "#22c55e" : contradict >= 3 ? "#ef4444" : "#888";
          const summary =
            confirm === internals.total
              ? `All ${internals.total} internals confirm ${regime}`
              : contradict >= 3
              ? `${contradict}/${internals.total} internals contradict ${regime}`
              : `${confirm}/${internals.total} confirm · ${contradict}/${internals.total} contradict ${regime}`;

          const dotColor = (a: InternalSignal["alignment"]) =>
            a === "agrees" ? "#22c55e" : a === "disagrees" ? "#ef4444" : "#555";

          return (
            <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
              <details className="group">
                <summary className="flex items-center gap-2 flex-wrap cursor-pointer hover:text-[#e0e0e0]">
                  <span className="text-[10px] uppercase tracking-wider text-[#555]">Internals</span>
                  <span className="text-[10px] font-bold" style={{ color: scoreColor }}>
                    {summary}
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    {internals.internals.map((s) => (
                      <span key={s.name} style={{ color: dotColor(s.alignment) }} title={s.name}>●</span>
                    ))}
                  </div>
                  <span className="text-[#555] group-open:rotate-90 transition-transform inline-block w-2 text-[10px]">›</span>
                </summary>
                <div className="mt-2 space-y-1">
                  {internals.internals.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-[10px]">
                      <span style={{ color: dotColor(s.alignment) }}>●</span>
                      <span className="text-[#888]">{s.name}</span>
                      <span className="text-[#555] capitalize">· {s.trend}</span>
                      <span className="ml-auto text-[#555]">
                        {s.change3m !== null ? `${s.change3m >= 0 ? "+" : ""}${s.change3m}% 3m` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          );
        })()}

        {/* (synthesis verdict removed — positioning strategy covers the same ground) */}

        {/* Positioning strategy — dynamic rotation phases based on current signals */}
        {(liquidity || oil || yields || internals) && (() => {
          const oilBrent = oil?.latest.brent ?? null;
          const oil3m = oil?.changes.threeMonth ?? null;
          const liq3m = liquidity?.changes.threeMonth ?? null;
          const yTrend = yields?.trend ?? "flat";
          const riskOnInternals = internals?.internals.filter((i) => i.signal === "risk-on").length ?? 0;
          // Determine which phase we're in
          type Phase = { id: string; label: string; color: string; allocation: string; description: string; active: boolean };

          const oilFalling = oil3m !== null && oil3m < -5;
          const oilBelow85 = oilBrent !== null && oilBrent < 85;
          const nowBullish = yTrend === "falling" && riskOnInternals >= 2;
          const comingBullish = oilFalling && (liq3m ?? 0) > 1;

          const phases: Phase[] = [
            {
              id: "gold-anchor",
              label: "Gold anchor",
              color: "#eab308",
              allocation: "60-70% gold (GLD) · 30-40% growth (SMH, BOTZ)",
              description: "Gold wins in both scenarios: oil stays high → inflation hedge; oil falls → real yields eventually drop → gold rallies. Meanwhile, growth is discounted 30-40% from peak — buy the structural thesis at these prices. Skip other materials — they already priced in the stagflation premium.",
              active: !oilBelow85 && !nowBullish && !comingBullish,
            },
            {
              id: "rotation",
              label: "Rotate toward growth",
              color: "#3b82f6",
              allocation: "40% gold · 60% growth",
              description: "Oil is falling, but inflation takes 2-3 more months to follow in CPI data. Gold keeps working while you wait — the Fed hasn't cut yet. Start shifting weight toward growth because the market is forward-looking and will price in the disinflation before CPI confirms it.",
              active: (oilBelow85 || oilFalling) && !nowBullish,
            },
            {
              id: "growth-tilt",
              label: "Growth tilt",
              color: "#22c55e",
              allocation: "25% gold · 75% growth",
              description: "CPI is now printing lower and the market has confirmed it: yields falling, internals risk-on. This is 2-3 months after oil dropped — the lag has played out. Growth multiples are expanding. Keep gold as a hedge but growth is now the primary position.",
              active: nowBullish && !comingBullish,
            },
            {
              id: "full-conviction",
              label: "Full conviction growth",
              color: "#22c55e",
              allocation: "15% gold · 85% growth",
              description: "All layers aligned: CPI confirmed disinflation, Fed cutting, liquidity expanding, internals risk-on, regime shifting to Goldilocks/Reflation. This is the high-conviction growth window the framework was designed to catch.",
              active: nowBullish && comingBullish,
            },
          ];

          const activePhase = phases.find((p) => p.active) ?? phases[0];

          return (
            <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
              {/* Positioning strategy — always open, prominent */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider text-[#555]">Positioning strategy</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: activePhase.color, backgroundColor: activePhase.color + "20" }}>
                    {activePhase.label}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#e0e0e0]">{activePhase.allocation}</p>
                <p className="text-[11px] text-[#888] leading-relaxed mt-1">{activePhase.description}</p>
              </div>

              {/* Timeline — all phases visible */}
              <div className="space-y-0">
                {phases.map((p, i) => {
                  const isActive = p.id === activePhase.id;
                  const isPast = phases.indexOf(activePhase) > i;
                  return (
                    <div key={p.id} className="flex gap-3" style={{ opacity: isActive ? 1 : isPast ? 0.4 : 0.6 }}>
                      <div className="flex flex-col items-center w-3 flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: isActive ? p.color : isPast ? "#333" : "#222", border: isActive ? `2px solid ${p.color}` : "1px solid #333" }} />
                        {i < phases.length - 1 && <div className="flex-1 w-px" style={{ backgroundColor: isPast ? "#333" : "#1a1a1a" }} />}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold" style={{ color: isActive ? p.color : "#555" }}>{p.label}</span>
                          <span className="text-[11px] text-[#888]">{p.allocation}</span>
                          {isActive && <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold" style={{ color: p.color, backgroundColor: p.color + "20" }}>You are here</span>}
                        </div>
                        <p className="text-[10px] text-[#555] leading-relaxed mt-1">{p.description}</p>
                      </div>
                    </div>
                  );
                })}
                  {/* Rotation logic visual */}
                  <div className="pt-3 mt-2 border-t border-[#1a1a1a]">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">How the rotation works</p>
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="border-b border-[#222]">
                          <th className="text-left text-[#555] font-normal py-1 pr-2">Phase</th>
                          <th className="text-left text-[#eab308] font-normal py-1 pr-2">Gold</th>
                          <th className="text-left text-[#3b82f6] font-normal py-1 pr-2">Growth</th>
                          <th className="text-left text-[#888] font-normal py-1">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-[#1a1a1a]">
                          <td className="py-1.5 pr-2 text-[#888]">1. Now</td>
                          <td className="py-1.5 pr-2 text-[#888]">Steady</td>
                          <td className="py-1.5 pr-2 text-[#888]">Discounted</td>
                          <td className="py-1.5 text-[#888]">Hold gold, start buying growth</td>
                        </tr>
                        <tr className="border-b border-[#1a1a1a]">
                          <td className="py-1.5 pr-2 text-[#888]">2. Oil falls</td>
                          <td className="py-1.5 pr-2 text-[#22c55e]">Rallying</td>
                          <td className="py-1.5 pr-2 text-[#888]">Recovering</td>
                          <td className="py-1.5 text-[#e0e0e0] font-bold">Sell gold into strength, add growth</td>
                        </tr>
                        <tr className="border-b border-[#1a1a1a]">
                          <td className="py-1.5 pr-2 text-[#888]">3. CPI confirms</td>
                          <td className="py-1.5 pr-2 text-[#22c55e]">Peak</td>
                          <td className="py-1.5 pr-2 text-[#22c55e]">Accelerating</td>
                          <td className="py-1.5 text-[#e0e0e0] font-bold">Sell more gold, growth now dominant</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pr-2 text-[#888]">4. Fed cuts</td>
                          <td className="py-1.5 pr-2 text-[#eab308]">Stalling</td>
                          <td className="py-1.5 pr-2 text-[#22c55e]">Full rally</td>
                          <td className="py-1.5 text-[#888]">15% gold hedge, 85% growth</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-[10px] text-[#888] mt-2 leading-relaxed">
                      Gold rallies <span className="text-[#e0e0e0]">before</span> the Fed cuts — markets price in disinflation 2-3 months ahead. By the time the Fed actually acts, gold has already moved 15-25%. The strategy is to <span className="text-[#e0e0e0]">sell gold into its rally</span> and use the proceeds to buy growth while it&apos;s still discounted. Waiting for Phase 4 to sell gold means missing the best prices on both sides.
                    </p>
                  </div>
                  <p className="text-[9px] text-[#555] italic leading-relaxed pt-2 border-t border-[#1a1a1a] mt-2">
                    This is a systematic framework output, not personalised financial advice. Phases advance automatically as signals change. Past performance does not guarantee future results. Always consult a qualified financial advisor before making investment decisions.
                  </p>
                </div>
              </div>
          );
        })()}

        {/* Compact glossary */}
        <details className="group mt-2 border-t border-[#1a1a1a]">
          <summary className="text-[10px] text-[#555] cursor-pointer hover:text-[#888] py-2 flex items-center gap-2">
            <span className="text-[#555] group-open:rotate-90 transition-transform inline-block w-2">›</span>
            <span>Signal glossary</span>
          </summary>
          <div className="pb-2 pl-4 text-[10px] text-[#888] leading-relaxed space-y-1">
            <div><span className="text-[#e0e0e0]">Liquidity</span> = Fed BS − TGA − RRP. Affects stocks with ~2-3 month lag. Growth 2-3x more sensitive than materials.</div>
            <div><span className="text-[#e0e0e0]">Oil</span> → CPI with 2-3 month lag. $10/bbl ≈ +0.4% CPI.</div>
            <div><span className="text-[#e0e0e0]">10Y yield</span> = discount rate for stocks. Rising = growth compressed. 2s10s inverted = recession in 6-18mo.</div>
            <div><span className="text-[#e0e0e0]">Internals</span>: Copper/Gold (industry vs safe-haven), HYG/LQD (credit risk appetite), IWM/SPY (small caps lead), UUP (dollar strength = risk-off).</div>
          </div>
        </details>
      </div>
    </section>
  );
}
