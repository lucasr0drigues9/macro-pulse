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

export default function MarketContext() {
  const [us, setUs] = useState<RegimeData | null>(null);
  const [eu, setEu] = useState<RegimeData | null>(null);
  const [cn, setCn] = useState<RegimeData | null>(null);
  const [liquidity, setLiquidity] = useState<LiquidityData | null>(null);
  const [yields, setYields] = useState<YieldData | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setUs(d); }).catch(() => {});
    fetch(apiUrl("/api/eu/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setEu(d); }).catch(() => {});
    fetch(apiUrl("/api/china/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setCn(d); }).catch(() => {});
    fetch("/api/liquidity").then((r) => r.json()).then((d) => { if (!d.error) setLiquidity(d); }).catch(() => {});
    fetch("/api/yields").then((r) => r.json()).then((d) => { if (!d.error) setYields(d); }).catch(() => {});
  }, []);

  const regime = us?.regime || null;
  const regimeColor = regime ? REGIME_COLORS[regime] || "#888" : "#888";

  if (!regime && !liquidity && !yields) return null;

  const trendColor = liquidity
    ? liquidity.trend === "expanding" ? "#22c55e" : liquidity.trend === "contracting" ? "#ef4444" : "#888"
    : "#888";

  let points = "";
  const sparkW = 300, sparkH = 30;
  if (liquidity) {
    const vals = liquidity.sparkline.map((p) => p.value);
    const min = Math.min(...vals) * 0.98;
    const range = Math.max(...vals) * 1.02 - min || 1;
    points = vals.map((v, i) => `${(i / (vals.length - 1)) * sparkW},${sparkH - ((v - min) / range) * sparkH}`).join(" ");
  }

  let yieldPoints = "";
  if (yields) {
    const vals = yields.sparkline.map((p) => p.value);
    const min = Math.min(...vals) * 0.98;
    const range = Math.max(...vals) * 1.02 - min || 1;
    yieldPoints = vals.map((v, i) => `${(i / (vals.length - 1)) * sparkW},${sparkH - ((v - min) / range) * sparkH}`).join(" ");
  }

  const oneM = liquidity?.changes.oneMonth ?? null;
  const threeM = liquidity?.changes.threeMonth ?? null;

  const yieldTrendColor = yields
    ? yields.trend === "rising" ? "#ef4444" : yields.trend === "falling" ? "#22c55e" : "#888"
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
        {/* Three-column layout: liquidity + bonds + regime */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="flex-1 min-w-[30px] h-4" preserveAspectRatio="none">
                  <polyline points={points} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
                <span style={{ color: (yields.changes.threeMonthBps ?? 0) >= 0 ? "#ef4444" : "#22c55e" }}>
                  3M {yields.changes.threeMonthBps !== null ? `${yields.changes.threeMonthBps >= 0 ? "+" : ""}${yields.changes.threeMonthBps}bps` : "—"}
                </span>
                <span style={{ color: curveColor }}>
                  Curve {yields.latest.curve >= 0 ? "+" : ""}{yields.latest.curve.toFixed(2)}
                </span>
                <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="flex-1 min-w-[30px] h-4" preserveAspectRatio="none">
                  <polyline points={yieldPoints} fill="none" stroke={yieldTrendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
            {regime && liquidity && (
              <p><span className="text-[#e0e0e0] font-bold">Combined:</span> when regime, liquidity, and yields agree, conviction is high. When they conflict (like stagflation + expanding liquidity + rising yields), growth is discounted and quietly supported — a time to start building, not go all-in. Watch the 2s10s: it leads the regime by 6-18 months.</p>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}
