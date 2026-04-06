"use client";

import { useEffect, useState } from "react";
import { REGIME_COLORS, type RegimeName } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";

type SignalStrength = "STRONG" | "MODERATE" | "WEAK";
type TimelineEntry = {
  regime: RegimeName; start: string; end: string; months: number;
  quarterLabel: string;
  picksReturn: number | null; spyReturn: number | null;
  profitable: boolean | null; beatSpy: boolean | null;
  signalStrength?: SignalStrength; signalContext?: string;
};
type BacktestData = {
  totalRegimes: number; yearRange: string;
  profitableCount: number; profitablePct: number;
  beatSpyCount: number; beatSpyPct: number;
  avoidAccuracy: number;
  bestCall: { start: string; regime: RegimeName; picksReturn: number; spyReturn: number } | null;
  worstCall: { start: string; regime: RegimeName; picksReturn: number; spyReturn: number } | null;
  regimeBreakdown: Record<string, { count: number; winRate: number; kellyHalf: number; observations: number }>;
  timeline: TimelineEntry[];
};

const STRENGTH_COLORS: Record<SignalStrength, { bg: string; text: string; border: string }> = {
  STRONG: { bg: "rgba(34,197,94,0.15)", text: "#22c55e", border: "rgba(34,197,94,0.3)" },
  MODERATE: { bg: "rgba(234,179,8,0.15)", text: "#eab308", border: "rgba(234,179,8,0.3)" },
  WEAK: { bg: "rgba(107,114,128,0.15)", text: "#6b7280", border: "rgba(107,114,128,0.3)" },
};

export default function RegimeHistory() {
  const [data, setData] = useState<BacktestData | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/backtest"))
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const s = data;
  const filteredTimeline = filter === "All"
    ? s.timeline
    : s.timeline.filter((t) => t.regime === filter);

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">
        {s.totalRegimes} Regimes. 19 Years. Every Call Shown.
      </h2>
      <p className="text-xs text-[#555] mb-3">
        How the framework performed across every economic season from 2007 to 2026.
      </p>
      <div className="p-3 rounded bg-[#111] border border-[#222] mb-4">
        <p className="text-xs text-[#888] leading-relaxed">
          <span className="text-[#e0e0e0] font-bold">How to read this data:</span> Regime labels are based on FRED economic data, which is a <span className="text-[#eab308]">confirmation signal</span> — it reflects conditions from the recent past, not the present. GDP is reported as a single number per quarter with no monthly breakdown, so the regime label for any given month is partly based on GDP data that&apos;s 1-3 months old.
        </p>
      </div>

      <div className="p-3 rounded bg-[#111] border border-[#222] mb-6">
        <p className="text-xs text-[#e0e0e0] font-bold mb-2">Signal strength — the key insight</p>
        <p className="text-xs text-[#888] leading-relaxed mb-3">
          Not all regime signals are equal. When the regime has an <span className="text-[#22c55e]">obvious real-world catalyst</span> (war, pandemic, massive stimulus), picks outperform <span className="text-[#22c55e] font-bold">89% of the time</span>. When the signal is ambiguous, picks only beat SPY 36% of the time. Click any period to see what was happening.
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>STRONG</span>
            <span className="text-[10px] text-[#888]">Obvious catalyst, 6+mo — 89% win rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(234,179,8,0.15)", color: "#eab308", border: "1px solid rgba(234,179,8,0.3)" }}>MODERATE</span>
            <span className="text-[10px] text-[#888]">Mixed signals — ~38% win rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(107,114,128,0.15)", color: "#6b7280", border: "1px solid rgba(107,114,128,0.3)" }}>WEAK</span>
            <span className="text-[10px] text-[#888]">Ambiguous, short — ~36% win rate</span>
          </div>
        </div>
      </div>

      {/* Regime breakdown cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {(["Stagflation", "Goldilocks", "Reflation", "Deflation"] as const).map((regime) => {
          const bd = s.regimeBreakdown[regime];
          const colors = REGIME_COLORS[regime];
          if (!bd) return null;
          return (
            <button
              key={regime}
              onClick={() => setFilter(filter === regime ? "All" : regime)}
              className="p-3 rounded-lg border text-center transition-all"
              style={{
                borderColor: filter === regime ? colors.color : colors.color + "30",
                backgroundColor: filter === regime ? colors.color + "25" : colors.dim,
              }}
            >
              <div className="text-xs text-[#888] mb-1">{regime}</div>
              <div className="text-lg font-bold" style={{ color: colors.color }}>
                {bd.winRate.toFixed(0)}%
              </div>
              <div className="text-xs text-[#555]">
                profitable · {bd.count} periods
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter indicator */}
      {filter !== "All" && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-[#555]">
            Filtering: <span style={{ color: REGIME_COLORS[filter as RegimeName]?.color }}>{filter}</span>
          </span>
          <button onClick={() => setFilter("All")} className="text-xs text-[#555] hover:text-[#888]">
            (show all)
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-3">Regime Timeline</h3>
        <div className="space-y-2">
          {filteredTimeline.map((period, i) => {
            const colors = REGIME_COLORS[period.regime];
            const strength = period.signalStrength as SignalStrength | undefined;
            const sc = strength ? STRENGTH_COLORS[strength] : null;
            const isExpanded = expanded === i;
            return (
              <div key={i}>
                <div
                  className="p-3 rounded-lg bg-[#111] border border-[#222] flex flex-col sm:flex-row sm:items-center gap-2 cursor-pointer hover:bg-[#151515] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : i)}
                >
                  <div className="flex items-center gap-2 sm:w-36">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: colors.color }}
                    />
                    <span className="text-sm font-bold" style={{ color: colors.color }}>
                      {period.regime}
                    </span>
                  </div>
                  <div className="text-xs text-[#888] sm:w-40">
                    {period.start} → {period.end} ({period.months}mo)
                  </div>
                  {sc && strength && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                    >
                      {strength}
                    </span>
                  )}
                  <div className="flex-1 flex items-center gap-4 text-xs">
                    <span>
                      Picks:{" "}
                      {period.picksReturn !== null ? (
                        <span
                          style={{ color: period.picksReturn >= 0 ? "#22c55e" : "#ef4444" }}
                          className="font-bold"
                        >
                          {period.picksReturn >= 0 ? "+" : ""}
                          {period.picksReturn.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[#333]">N/A</span>
                      )}
                    </span>
                    <span>
                      SPY:{" "}
                      {period.spyReturn !== null ? (
                        <span
                          style={{ color: period.spyReturn >= 0 ? "#22c55e" : "#ef4444" }}
                          className="font-bold"
                        >
                          {period.spyReturn >= 0 ? "+" : ""}
                          {period.spyReturn.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[#333]">N/A</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-right">
                    {period.profitable === true && <span className="text-[#22c55e]">✓ Profit</span>}
                    {period.profitable === false && <span className="text-[#ef4444]">✗ Loss</span>}
                    {period.profitable === null && <span className="text-[#333]">—</span>}
                    <span className="text-[#333] text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div
                    className="mx-3 p-3 rounded-b-lg border border-t-0 border-[#222] text-xs text-[#888] leading-relaxed"
                    style={{ backgroundColor: sc ? sc.bg : "#0a0a0a" }}
                  >
                    {period.signalContext || (
                      <span className="text-[#555]">
                        {strength === "STRONG" ? "Strong catalyst with clear market impact." : strength === "WEAK" ? "Ambiguous signal — no obvious catalyst at the time." : "Mixed signals — some indicators pointed this way but conviction was moderate."}
                      </span>
                    )}
                    {period.beatSpy === true && period.picksReturn !== null && period.spyReturn !== null && (
                      <span className="text-[#22c55e] ml-2">
                        Picks beat SPY by {(period.picksReturn - period.spyReturn).toFixed(1)}pp
                      </span>
                    )}
                    {period.beatSpy === false && period.picksReturn !== null && period.spyReturn !== null && (
                      <span className="text-[#ef4444] ml-2">
                        SPY beat picks by {(period.spyReturn - period.picksReturn).toFixed(1)}pp
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {filter === "All" && s.timeline.length < s.totalRegimes && (
          <div className="mt-2 text-center text-xs text-[#333]">
            Showing most recent {s.timeline.length} of {s.totalRegimes} regime periods
          </div>
        )}
      </div>

      {/* Scorecard */}
      <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
        <h3 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-3">Scorecard</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm">
          <div className="flex justify-between">
            <span className="text-[#555]">Total regimes</span>
            <span className="text-[#e0e0e0] font-bold">{s.totalRegimes} ({s.yearRange})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#555]">Profitable periods</span>
            <span className="text-[#22c55e] font-bold">
              {s.profitableCount}/{s.totalRegimes} ({s.profitablePct}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#555]">Beat SPY</span>
            <span className="text-[#888] font-bold">
              {s.beatSpyCount}/{s.totalRegimes} ({s.beatSpyPct}%)
            </span>
          </div>
          {(() => {
            const strong = s.timeline.filter((t) => t.signalStrength === "STRONG" && t.beatSpy !== null);
            const strongWins = strong.filter((t) => t.beatSpy);
            return strong.length > 0 ? (
              <div className="flex justify-between">
                <span className="text-[#555]">STRONG signals beat SPY</span>
                <span className="text-[#22c55e] font-bold">
                  {strongWins.length}/{strong.length} ({Math.round(strongWins.length / strong.length * 100)}%)
                </span>
              </div>
            ) : null;
          })()}
          {s.bestCall && (
            <div className="flex justify-between">
              <span className="text-[#555]">Best call</span>
              <span className="font-bold">
                <span style={{ color: REGIME_COLORS[s.bestCall.regime]?.color }}>{s.bestCall.regime}</span>{" "}
                <span className="text-[#555]">{s.bestCall.start}</span>{" "}
                <span className="text-[#22c55e]">{s.bestCall.picksReturn >= 0 ? "+" : ""}{s.bestCall.picksReturn.toFixed(1)}%</span>
              </span>
            </div>
          )}
          {s.worstCall && (
            <div className="flex justify-between sm:col-span-2">
              <span className="text-[#555]">Worst call</span>
              <span className="font-bold">
                <span style={{ color: REGIME_COLORS[s.worstCall.regime]?.color }}>{s.worstCall.regime}</span>{" "}
                <span className="text-[#555]">{s.worstCall.start}</span>{" "}
                <span className="text-[#ef4444]">{s.worstCall.picksReturn >= 0 ? "+" : ""}{s.worstCall.picksReturn.toFixed(1)}%</span>{" "}
                <span className="text-[#555]">vs SPY {s.worstCall.spyReturn >= 0 ? "+" : ""}{s.worstCall.spyReturn.toFixed(1)}%</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-[#333] text-center italic">
        Backtested performance with 2-month regime smoothing. Does not represent live trading results. Past performance does not guarantee future results.
      </p>
    </section>
  );
}
