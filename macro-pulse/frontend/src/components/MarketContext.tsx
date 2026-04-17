"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444",
  Goldilocks: "#22c55e",
  Reflation: "#eab308",
  Deflation: "#3b82f6",
};

type RegimeData = { regime: string; periodStart?: string };
type LiquidityData = {
  latest: { date: string; netLiquidity: number; fedBalanceSheet: number; tga: number; rrp: number };
  changes: { oneMonth: number | null; threeMonth: number | null; twelveMonth: number | null };
  trend: "expanding" | "contracting" | "flat";
  peak: { date: string; value: number };
  trough: { date: string; value: number };
  pctFromPeak: number;
  sparkline: { date: string; value: number }[];
};
type YieldData = {
  latest: { date: string; tenYear: number; curve: number };
  changes: { oneMonthBps: number | null; threeMonthBps: number | null; twelveMonthBps: number | null; curveThreeMonthBps: number | null };
  trend: "rising" | "falling" | "flat";
  curveRegime: "steep" | "normal" | "flat" | "inverted";
  sparkline: { date: string; value: number }[];
};
type OilData = {
  latest: { date: string; brent: number; wti: number | null };
  changes: { oneMonth: number | null; threeMonth: number | null; twelveMonth: number | null };
  trend: "rising" | "falling" | "flat";
  sparkline: { date: string; value: number }[];
};
type InternalSignal = {
  name: string;
  value: number;
  change1m: number | null;
  change3m: number | null;
  trend: "rising" | "falling" | "flat";
  signal: "risk-on" | "risk-off" | "neutral";
  alignment: "agrees" | "disagrees" | "neutral";
};
type InternalsData = {
  regime: string;
  regimeType: "risk-on" | "risk-off";
  internals: InternalSignal[];
  confirmationScore: number;
  contradictionScore: number;
  total: number;
};

export default function MarketContext() {
  const [us, setUs] = useState<RegimeData | null>(null);
  const [eu, setEu] = useState<RegimeData | null>(null);
  const [cn, setCn] = useState<RegimeData | null>(null);
  const [liquidity, setLiquidity] = useState<LiquidityData | null>(null);
  const [yields, setYields] = useState<YieldData | null>(null);
  const [oil, setOil] = useState<OilData | null>(null);
  const [internals, setInternals] = useState<InternalsData | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setUs(d); }).catch(() => {});
    fetch(apiUrl("/api/eu/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setEu(d); }).catch(() => {});
    fetch(apiUrl("/api/china/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setCn(d); }).catch(() => {});
    fetch("/api/liquidity").then((r) => r.json()).then((d) => { if (!d.error) setLiquidity(d); }).catch(() => {});
    fetch("/api/yields").then((r) => r.json()).then((d) => { if (!d.error) setYields(d); }).catch(() => {});
    fetch(apiUrl("/api/oil")).then((r) => r.json()).then((d) => { if (!d.error) setOil(d); }).catch(() => {});
    fetch(apiUrl("/api/internals")).then((r) => r.json()).then((d) => { if (!d.error) setInternals(d); }).catch(() => {});
  }, []);

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

  const oneM = liquidity?.changes.oneMonth ?? null;
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
        {/* Stacked layout: liquidity / bonds / regime each on own row */}
        <div className="space-y-3">
          {/* Liquidity column */}
          {liquidity && (
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-[#555]">Fed liquidity</span>
                <span className="text-xs font-bold text-[#e0e0e0]">${(liquidity.latest.netLiquidity / 1000).toFixed(2)}T</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize" style={{ color: trendColor, backgroundColor: trendColor + "20" }}>
                  {liquidity.trend}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span style={{ color: (oneM ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                  1M {oneM !== null ? `${oneM >= 0 ? "+" : ""}${oneM}%` : "—"}
                </span>
                <span style={{ color: (threeM ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                  3M {threeM !== null ? `${threeM >= 0 ? "+" : ""}${threeM}%` : "—"}
                </span>
                <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="flex-1 min-w-[30px] h-6" preserveAspectRatio="none">
                  <line x1="0" y1={liqSpark.startY} x2={sparkW} y2={liqSpark.startY} stroke="#555" strokeWidth="1" strokeDasharray="3,3" />
                  <polyline points={liqSpark.points} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[9px] text-[#444]">12m</span>
              </div>
            </div>
          )}

          {/* Bond yields column */}
          {yields && (
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-[#555]">10Y yield</span>
                <span className="text-xs font-bold text-[#e0e0e0]">{yields.latest.tenYear.toFixed(2)}%</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize" style={{ color: yieldTrendColor, backgroundColor: yieldTrendColor + "20" }}>
                  {yields.trend}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span
                  title={yields.changes.threeMonthBps !== null
                    ? `Basis points: 1 bps = 0.01%. The 10Y yield moved ${yields.changes.threeMonthBps >= 0 ? "up" : "down"} ${Math.abs(yields.changes.threeMonthBps) / 100}% (${yields.changes.threeMonthBps >= 0 ? "+" : ""}${yields.changes.threeMonthBps} bps) over 3 months.`
                    : ""}
                  style={{ color: (yields.changes.threeMonthBps ?? 0) >= 0 ? "#ef4444" : "#22c55e", cursor: "help", textDecoration: "underline dotted", textUnderlineOffset: "2px", textDecorationColor: "#333" }}
                >
                  3M {yields.changes.threeMonthBps !== null ? `${yields.changes.threeMonthBps >= 0 ? "+" : ""}${yields.changes.threeMonthBps}bps` : "—"}
                </span>
                <span
                  title="2s10s curve = 10Y Treasury yield minus 2Y Treasury yield. Positive = normal. Negative/inverted = classic recession signal, usually 6-18 months ahead of a downturn."
                  style={{ color: curveColor, cursor: "help", textDecoration: "underline dotted", textUnderlineOffset: "2px", textDecorationColor: "#333" }}
                >
                  Curve {yields.latest.curve >= 0 ? "+" : ""}{yields.latest.curve.toFixed(2)}
                </span>
                <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="flex-1 min-w-[30px] h-6" preserveAspectRatio="none">
                  <line x1="0" y1={yieldSpark.startY} x2={sparkW} y2={yieldSpark.startY} stroke="#555" strokeWidth="1" strokeDasharray="3,3" />
                  <polyline points={yieldSpark.points} fill="none" stroke={yieldTrendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[9px] text-[#444]">3m</span>
              </div>
            </div>
          )}

          {/* Oil column */}
          {oil && (
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className="text-[10px] uppercase tracking-wider text-[#555]"
                  style={{ cursor: "help", textDecoration: "underline dotted", textUnderlineOffset: "2px", textDecorationColor: "#333" }}
                  title="Brent crude oil — the global benchmark (Europe/Norway standard). Oil is a leading inflation indicator: a $10/bbl move adds ~0.3-0.5% to headline CPI over 2-3 months. Every oil shock (1973, 1979, 2008, 2022) produced a Stagflation regime."
                >Oil (Brent)</span>
                <span className="text-xs font-bold text-[#e0e0e0]">${oil.latest.brent.toFixed(2)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize" style={{ color: oilTrendColor, backgroundColor: oilTrendColor + "20" }}>
                  {oil.trend}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span style={{ color: (oil.changes.oneMonth ?? 0) >= 0 ? "#ef4444" : "#22c55e" }}>
                  1M {oil.changes.oneMonth !== null ? `${oil.changes.oneMonth >= 0 ? "+" : ""}${oil.changes.oneMonth}%` : "—"}
                </span>
                <span style={{ color: (oil.changes.threeMonth ?? 0) >= 0 ? "#ef4444" : "#22c55e" }}>
                  3M {oil.changes.threeMonth !== null ? `${oil.changes.threeMonth >= 0 ? "+" : ""}${oil.changes.threeMonth}%` : "—"}
                </span>
                <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="flex-1 min-w-[30px] h-6" preserveAspectRatio="none">
                  <line x1="0" y1={oilSpark.startY} x2={sparkW} y2={oilSpark.startY} stroke="#555" strokeWidth="1" strokeDasharray="3,3" />
                  <polyline points={oilSpark.points} fill="none" stroke={oilTrendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[9px] text-[#444]">3m</span>
              </div>
            </div>
          )}

          {/* Regime column */}
          {regime && (
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-[#555]">US regime</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: regimeColor, backgroundColor: regimeColor + "20" }}>
                  {regime}
                </span>
              </div>
              {eu && cn && (
                <div className="flex items-center gap-1.5">
                  {[
                    { label: "EU", r: eu.regime },
                    { label: "CN", r: cn.regime },
                  ].map((x) => {
                    const c = REGIME_COLORS[x.r] || "#555";
                    return (
                      <span key={x.label} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: c + "15", border: `1px solid ${c}30` }}>
                        <span className="text-[#555]">{x.label}</span>{" "}
                        <span className="font-bold" style={{ color: c }}>{x.r}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Internals bar — Druckenmiller-style cross-asset confirmation */}
        {internals && internals.total > 0 && (() => {
          const confirm = internals.confirmationScore;
          const contradict = internals.contradictionScore;
          const scoreColor =
            confirm >= 3 ? "#22c55e" : contradict >= 3 ? "#ef4444" : "#eab308";
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

        {/* Two-horizon synthesis: Now (fast signals) + Coming (slow signals with magnitude weighting) */}
        {(liquidity || yields || oil || internals) && (() => {
          // ── FAST SIGNALS: yields + internals (what markets are pricing today) ──
          const yieldTailwind = yields?.trend === "falling";
          const yieldHeadwind = yields?.trend === "rising";
          const curveWarning = yields?.curveRegime === "inverted";
          const riskOnInternals = internals?.internals.filter((i) => i.signal === "risk-on").length ?? 0;
          const riskOffInternals = internals?.internals.filter((i) => i.signal === "risk-off").length ?? 0;

          let nowTail = 0, nowHead = 0;
          if (yieldTailwind) nowTail++;
          if (yieldHeadwind) nowHead++;
          if (riskOnInternals >= 3) nowTail++;
          if (riskOffInternals >= 3) nowHead++;
          if (curveWarning) nowHead++;

          let nowTone: "bullish" | "bearish" | "mixed" | "consolidation";
          let nowText: string;
          if (nowTail === 0 && nowHead === 0) {
            nowTone = "consolidation";
            nowText = "All fast signals flat. Markets in consolidation, no conviction either way.";
          } else if (nowTail >= 2 && nowHead === 0) {
            nowTone = "bullish";
            nowText = "Yields and internals agree: markets pricing risk-on today.";
          } else if (nowHead >= 2 && nowTail === 0) {
            nowTone = "bearish";
            nowText = "Yields and internals agree: markets pricing risk-off today.";
          } else if (nowTail > nowHead) {
            nowTone = "mixed";
            nowText = "Slight risk-on bias today but not decisive.";
          } else if (nowHead > nowTail) {
            nowTone = "mixed";
            nowText = "Slight risk-off bias today but not decisive.";
          } else {
            nowTone = "mixed";
            nowText = "Fast signals mixed. No clear read from today's market action.";
          }

          // ── SLOW SIGNALS: oil + liquidity (what's coming in 2-3 months, magnitude-weighted) ──
          // Rules of thumb:
          //   Oil: $10/bbl ≈ 0.4% CPI. At $80 baseline, 1% oil ≈ 0.032% CPI over 2-3mo. Each 1% CPI ≈ -10% forward stock pressure.
          //   Liquidity: 1% net liquidity ≈ +3% forward stock support (rough, based on historical QE epochs)
          const oil3m = oil?.changes.threeMonth ?? null;
          const liq3m = liquidity?.changes.threeMonth ?? null;

          const oilCpiPct = oil3m !== null ? Math.round(oil3m * 0.032 * 10) / 10 : null;      // % CPI coming
          const oilForwardStockPct = oilCpiPct !== null ? Math.round(-oilCpiPct * 10) : null;  // stock pressure
          const liqForwardStockPct = liq3m !== null ? Math.round(liq3m * 3) : null;            // stock support
          const netForward =
            oilForwardStockPct !== null && liqForwardStockPct !== null
              ? oilForwardStockPct + liqForwardStockPct
              : null;

          let comingTone: "bullish" | "bearish" | "mixed" | "consolidation";
          let comingHeadline: string;
          if (netForward === null) {
            comingTone = "consolidation";
            comingHeadline = "Forward read unavailable";
          } else if (netForward >= 10) {
            comingTone = "bullish";
            comingHeadline = `Net tailwind: ~+${netForward}% forward`;
          } else if (netForward <= -10) {
            comingTone = "bearish";
            comingHeadline = `Net headwind: ~${netForward}% forward`;
          } else if (netForward > 0) {
            comingTone = "mixed";
            comingHeadline = `Mild tailwind: ~+${netForward}% forward`;
          } else {
            comingTone = "mixed";
            comingHeadline = `Mild headwind: ~${netForward}% forward`;
          }

          // ── ALIGNMENT ──
          function toneRank(t: string) { return t === "bullish" ? 1 : t === "bearish" ? -1 : 0; }
          const alignmentScore = toneRank(nowTone) * toneRank(comingTone);

          let alignmentHeadline: string;
          let alignmentBody: string;
          let alignmentTone: "bullish" | "bearish" | "mixed" | "consolidation" = "mixed";
          if (nowTone === "consolidation" && comingTone === "consolidation") {
            alignmentHeadline = "All quiet";
            alignmentBody = "Nothing is moving. Rare. Use this window to plan, not trade.";
            alignmentTone = "consolidation";
          } else if (alignmentScore > 0) {
            alignmentHeadline = "Now and coming agree";
            alignmentBody = nowTone === "bullish"
              ? "Today's market + the slow forces both point to growth. High-conviction setup."
              : "Today's market + the slow forces both point to defensives. High-conviction setup.";
            alignmentTone = nowTone;
          } else if (alignmentScore < 0) {
            alignmentHeadline = "Now and coming disagree";
            alignmentBody = nowTone === "bullish"
              ? "Markets are risk-on today but slow forces say a storm is coming in 2-3 months. Use the strength to reduce, don't chase."
              : "Markets are risk-off today but slow forces say relief is coming in 2-3 months. Use the weakness to buy, don't panic.";
            alignmentTone = "mixed";
          } else if (nowTone === "consolidation") {
            alignmentHeadline = "Quiet now, storm brewing";
            alignmentBody = comingTone === "bearish"
              ? "Markets haven't caught up to the slow forces. Position for what's coming before it arrives."
              : "Markets haven't caught up to the slow tailwind. Accumulate while things are quiet.";
            alignmentTone = comingTone;
          } else {
            alignmentHeadline = "Loud now, quiet ahead";
            alignmentBody = "Today is moving but slow forces are balanced. Today's read is the dominant signal.";
            alignmentTone = nowTone;
          }

          const toneColor = (t: string) =>
            t === "bullish" ? "#22c55e" : t === "bearish" ? "#ef4444" : t === "mixed" ? "#eab308" : "#888";

          const nowColor = toneColor(nowTone);
          const comingColor = toneColor(comingTone);
          const alignColor = toneColor(alignmentTone);

          return (
            <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
              {/* Unified synthesis block — punchline first, detail collapsed */}
              <div className="p-3 rounded" style={{ backgroundColor: alignColor + "08", border: `1px solid ${alignColor}30` }}>
                {/* Punchline */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: alignColor }}>{alignmentHeadline}</span>
                </div>
                <p className="text-[12px] text-[#d0d0d0] leading-relaxed mb-2">{alignmentBody}</p>

                {/* Now + Coming compact summary line */}
                <div className="flex items-center gap-4 flex-wrap text-[10px] pt-2 border-t border-[#1a1a1a]">
                  <div>
                    <span className="text-[#555] uppercase tracking-wider">Now:</span>{" "}
                    <span style={{ color: nowColor }}>{nowText.split(".")[0]}</span>
                  </div>
                  <div>
                    <span className="text-[#555] uppercase tracking-wider">Coming 2-3mo:</span>{" "}
                    <span style={{ color: comingColor }}>{comingHeadline}</span>
                  </div>
                </div>

                {/* Details toggle */}
                {(oilCpiPct !== null || liqForwardStockPct !== null) && (
                  <details className="mt-2 group">
                    <summary className="text-[10px] text-[#555] cursor-pointer hover:text-[#888] flex items-center gap-1">
                      <span className="text-[#555] group-open:rotate-90 transition-transform inline-block w-2">›</span>
                      <span>How the net forward was computed</span>
                    </summary>
                    <div className="mt-2 pl-4 text-[10px] text-[#888] space-y-1 leading-relaxed">
                      {oilCpiPct !== null && (
                        <div>
                          <span className="text-[#e0e0e0] font-bold">Oil:</span> Brent {oil3m! >= 0 ? "+" : ""}{oil3m}% 3m → ~<span style={{ color: oilCpiPct > 0 ? "#ef4444" : "#22c55e" }}>{oilCpiPct > 0 ? "+" : ""}{oilCpiPct}% CPI coming</span> → ~<span style={{ color: oilForwardStockPct! > 0 ? "#22c55e" : "#ef4444" }}>{oilForwardStockPct! > 0 ? "+" : ""}{oilForwardStockPct}% stock pressure</span>
                        </div>
                      )}
                      {liqForwardStockPct !== null && (
                        <div>
                          <span className="text-[#e0e0e0] font-bold">Liquidity:</span> Fed {liq3m! >= 0 ? "+" : ""}{liq3m}% 3m → ~<span style={{ color: liqForwardStockPct > 0 ? "#22c55e" : "#ef4444" }}>{liqForwardStockPct > 0 ? "+" : ""}{liqForwardStockPct}% stock support</span>
                        </div>
                      )}
                      {netForward !== null && (
                        <div className="pt-1 border-t border-[#222]">
                          <span className="text-[#e0e0e0] font-bold">Net:</span> <span className="font-bold" style={{ color: comingColor }}>{netForward > 0 ? "+" : ""}{netForward}% forward</span> (2-3 months)
                        </div>
                      )}
                      <p className="text-[9px] text-[#555] pt-1 italic">
                        Rules of thumb: $10/bbl oil ≈ +0.4% CPI. Each 1% CPI ≈ -10% growth stock pressure. Each 1% liquidity ≈ +3% stock support.
                      </p>
                    </div>
                  </details>
                )}
              </div>
            </div>
          );
        })()}

        {/* Single expandable: learn more */}
        <details className="group mt-2 border-t border-[#1a1a1a]">
          <summary className="text-[10px] text-[#555] cursor-pointer hover:text-[#888] py-2 flex items-center gap-2">
            <span className="text-[#555] group-open:rotate-90 transition-transform inline-block w-2">›</span>
            <span>What this means &amp; how it works</span>
          </summary>
          <div className="pb-2 pl-4 space-y-2 text-[10px] text-[#888] leading-relaxed">
            {regime === "Stagflation" && <p><span className="text-[#e0e0e0] font-bold">Stagflation</span> suppresses growth (AI, robotics) while inflating materials. Growth ETFs are discounted — the thesis hasn&apos;t changed, only the headwind.</p>}
            {regime === "Goldilocks" && <p><span className="text-[#e0e0e0] font-bold">Goldilocks</span> is the best regime for AI &amp; Robotics — low inflation + growth benefits tech directly.</p>}
            {regime === "Reflation" && <p><span className="text-[#e0e0e0] font-bold">Reflation</span> lifts the entire supply chain — both growth and materials benefit.</p>}
            {regime === "Deflation" && <p><span className="text-[#e0e0e0] font-bold">Deflation</span> puts everything on sale. Best time to build the full position at deep discounts.</p>}
            {liquidity && (
              <p>
                <span className="text-[#e0e0e0] font-bold">Liquidity</span> ({`Net = Fed BS − TGA − RRP`}) helps both growth and materials, but growth is ~2-3x more sensitive.
                {liquidity.trend === "expanding" && <span className="text-[#22c55e]"> Expanding now = tailwind for growth, mild support for materials.</span>}
                {liquidity.trend === "contracting" && <span className="text-[#ef4444]"> Contracting now = growth gets hit harder, materials hold up better.</span>}
                {liquidity.trend === "flat" && <span className="text-[#eab308]"> Flat = regime and commodity fundamentals dominate.</span>}
              </p>
            )}
            {oil && (
              <p>
                <span className="text-[#e0e0e0] font-bold">Oil (Brent)</span> is upstream of inflation. A $10/bbl move adds ~0.3-0.5% to CPI over 2-3 months — which then pushes yields and drives regime shifts.
                {oil.trend === "rising" && <span className="text-[#ef4444]"> Rising now = inflationary pressure building, stagflation risk.</span>}
                {oil.trend === "falling" && <span className="text-[#22c55e]"> Falling now = disinflation tailwind, supportive of growth rerating.</span>}
                {oil.trend === "flat" && <span className="text-[#eab308]"> Flat = inflation neutral from oil side; other drivers (services, wages) take over.</span>}
              </p>
            )}
            {yields && (
              <p>
                <span className="text-[#e0e0e0] font-bold">10Y yield</span> is the discount rate for stock valuations. Higher yields compress growth multiples (long-duration cash flows) more than materials (short-duration).
                {yields.trend === "rising" && <span className="text-[#ef4444]"> Rising yields = headwind for growth.</span>}
                {yields.trend === "falling" && <span className="text-[#22c55e]"> Falling yields = tailwind for growth (multiple expansion).</span>}
                {" "}The <span className="text-[#e0e0e0] font-bold">2s10s curve</span> ({yields.latest.curve >= 0 ? "+" : ""}{yields.latest.curve.toFixed(2)}) shows growth expectations:
                {yields.curveRegime === "inverted" && <span className="text-[#ef4444]"> inverted = classic recession signal (6-18 months out).</span>}
                {yields.curveRegime === "flat" && <span className="text-[#eab308]"> flat = late-cycle, growth slowing.</span>}
                {yields.curveRegime === "normal" && <span className="text-[#22c55e]"> normal = healthy growth expectations.</span>}
                {yields.curveRegime === "steep" && <span className="text-[#3b82f6]"> steep = strong growth or inflation expectations.</span>}
              </p>
            )}
            {internals && internals.total > 0 && (
              <div>
                <p className="mb-1">
                  <span className="text-[#e0e0e0] font-bold">Market internals</span> are cross-asset ratios that reveal risk appetite before the data does (Druckenmiller&apos;s lens). Each one is either agreeing with the stated regime (green), contradicting it (red), or neutral (grey):
                </p>
                <ul className="space-y-0.5 mt-1">
                  {internals.internals.map((s) => {
                    const color = s.alignment === "agrees" ? "#22c55e" : s.alignment === "disagrees" ? "#ef4444" : "#555";
                    const chg = s.change3m !== null ? `${s.change3m >= 0 ? "+" : ""}${s.change3m}% 3m` : "—";
                    return (
                      <li key={s.name}>
                        <span style={{ color }}>●</span> <span className="text-[#e0e0e0]">{s.name}</span>: {s.trend} · {chg} → <span style={{ color }}>{s.signal}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2">
                  <span className="text-[#e0e0e0] font-bold">Copper/Gold</span> captures industrial demand vs safe-haven (rising = growth). <span className="text-[#e0e0e0] font-bold">HYG/LQD</span> is the credit spread (rising = risk appetite intact). <span className="text-[#e0e0e0] font-bold">IWM/SPY</span> shows if small caps are participating (they break first in downturns). <span className="text-[#e0e0e0] font-bold">UUP</span> is the dollar (strong dollar = risk-off, drains global liquidity).
                </p>
              </div>
            )}
            {regime && liquidity && (
              <p><span className="text-[#e0e0e0] font-bold">Combined:</span> when regime, liquidity, yields, and internals all agree, conviction is high. When they conflict (like stagflation + expanding liquidity + internals in transition), growth is discounted and quietly supported — a time to start building, not go all-in. Watch the 2s10s (leads regime 6-18mo) and internals (lead data by weeks).</p>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}
