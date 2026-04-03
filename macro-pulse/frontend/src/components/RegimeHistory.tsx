"use client";

import { useEffect, useState } from "react";
import { REGIME_COLORS, type RegimeName } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";

type TimelineEntry = {
  regime: RegimeName; start: string; end: string; months: number;
  picksReturn: number | null; spyReturn: number | null;
  profitable: boolean | null; beatSpy: boolean | null;
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

export default function RegimeHistory() {
  const [data, setData] = useState<BacktestData | null>(null);
  const [filter, setFilter] = useState<string>("All");

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
      <p className="text-xs text-[#555] mb-6">
        How the framework performed across every economic season from 2007 to 2026.
      </p>

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
            return (
              <div
                key={i}
                className="p-3 rounded-lg bg-[#111] border border-[#222] flex flex-col sm:flex-row sm:items-center gap-2"
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
                <div className="text-xs text-[#555] sm:w-44">
                  {period.start} → {period.end} ({period.months}mo)
                </div>
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
                <div className="text-xs sm:text-right">
                  {period.profitable === true && <span className="text-[#22c55e]">✓ Profit</span>}
                  {period.profitable === false && <span className="text-[#ef4444]">✗ Loss</span>}
                  {period.profitable === null && <span className="text-[#333]">—</span>}
                </div>
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
