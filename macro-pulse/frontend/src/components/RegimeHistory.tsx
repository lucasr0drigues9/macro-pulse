"use client";

import { useEffect, useState } from "react";
import { REGIME_COLORS, type RegimeName } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";

type TimelineEntry = {
  regime: RegimeName; start: string; end: string; months: number;
  quarterLabel: string;
  picksReturn: number | null; spyReturn: number | null;
  profitable: boolean | null; beatSpy: boolean | null;
  signalContext?: string;
  geoRegime?: RegimeName; geoPicksReturn?: number | null;
  allRegimeReturns?: Record<string, number | null>;
  bestRegime?: RegimeName;
  frameworkCorrect?: boolean;
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
        <p className="text-xs text-[#e0e0e0] font-bold mb-2">FRED vs AI — why context matters</p>
        <p className="text-xs text-[#888] leading-relaxed">
          FRED data can lag reality by months. When a major event happens (war, pandemic, policy shift), the <span className="text-[#3b82f6]">AI geopolitical layer</span> detects the real regime before FRED catches up. Click any period to see the narrative at the time — and where the AI would have overridden FRED with a better call.
        </p>
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
            const isExpanded = expanded === i;
            const hasGeoOverride = !!period.geoRegime;
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
                  {hasGeoOverride && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}
                    >
                      AI: {period.geoRegime}
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
                  <div className="mx-3 p-3 rounded-b-lg border border-t-0 border-[#222] text-xs leading-relaxed bg-[#0a0a0a]">
                    <p className="text-[#888]">
                      {period.signalContext || "No additional context available for this period."}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-[#555]">
                        FRED regime: <span style={{ color: colors.color }} className="font-bold">{period.regime}</span> picks{" "}
                        {period.picksReturn !== null ? (
                          <span style={{ color: period.picksReturn >= 0 ? "#22c55e" : "#ef4444" }} className="font-bold">
                            {period.picksReturn >= 0 ? "+" : ""}{period.picksReturn.toFixed(1)}%
                          </span>
                        ) : "N/A"}
                      </span>
                      <span className="text-[#555]">
                        SPY:{" "}
                        {period.spyReturn !== null ? (
                          <span style={{ color: period.spyReturn >= 0 ? "#22c55e" : "#ef4444" }} className="font-bold">
                            {period.spyReturn >= 0 ? "+" : ""}{period.spyReturn.toFixed(1)}%
                          </span>
                        ) : "N/A"}
                      </span>
                    </div>

                    {/* All 4 regimes performance comparison */}
                    {period.allRegimeReturns && (
                      <div className="mt-3 p-2 rounded bg-[#111] border border-[#222]">
                        <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">
                          How all 4 regime picks performed during this period
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(["Stagflation", "Goldilocks", "Reflation", "Deflation"] as const).map((r) => {
                            const ret = period.allRegimeReturns?.[r];
                            const rColor = REGIME_COLORS[r]?.color || "#555";
                            const isBest = period.bestRegime === r;
                            const isActual = period.regime === r;
                            return (
                              <div
                                key={r}
                                className="p-1.5 rounded"
                                style={{
                                  backgroundColor: isBest ? "#22c55e10" : "#0a0a0a",
                                  border: isBest ? "1px solid #22c55e40" : "1px solid #1a1a1a",
                                }}
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className="text-[10px] font-bold" style={{ color: rColor }}>{r}</span>
                                  {isActual && <span className="text-[8px] text-[#555]">[called]</span>}
                                  {isBest && <span className="text-[8px] text-[#22c55e]">★</span>}
                                </div>
                                <div className="text-xs font-bold" style={{ color: ret === null || ret === undefined ? "#333" : ret >= 0 ? "#22c55e" : "#ef4444" }}>
                                  {ret === null || ret === undefined ? "—" : `${ret >= 0 ? "+" : ""}${ret.toFixed(1)}%`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {period.frameworkCorrect !== undefined && period.frameworkCorrect !== null && (
                          <div className="mt-2 text-[10px]" style={{ color: period.frameworkCorrect ? "#22c55e" : "#eab308" }}>
                            {period.frameworkCorrect
                              ? `✓ Framework called ${period.regime} and those picks had the best return`
                              : `⚠ Framework called ${period.regime} but ${period.bestRegime} picks outperformed`}
                          </div>
                        )}
                      </div>
                    )}
                    {period.geoRegime && (
                      <div className="mt-2 p-2 rounded bg-[#111] border border-[#222]">
                        <div className="text-[10px] text-[#3b82f6] uppercase tracking-wider mb-1">AI geopolitical layer would have flagged</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                          <span style={{ color: REGIME_COLORS[period.geoRegime]?.color }} className="font-bold">
                            {period.geoRegime}
                          </span>
                          {period.geoPicksReturn !== null && period.geoPicksReturn !== undefined && (
                            <span className="text-[#555]">
                              picks:{" "}
                              <span style={{ color: period.geoPicksReturn >= 0 ? "#22c55e" : "#ef4444" }} className="font-bold">
                                {period.geoPicksReturn >= 0 ? "+" : ""}{period.geoPicksReturn.toFixed(1)}%
                              </span>
                            </span>
                          )}
                          {period.geoPicksReturn !== null && period.geoPicksReturn !== undefined && period.picksReturn !== null && (
                            <span className={period.geoPicksReturn > period.picksReturn ? "text-[#22c55e]" : "text-[#ef4444]"}>
                              {period.geoPicksReturn > period.picksReturn
                                ? `AI picks would have gained +${(period.geoPicksReturn - period.picksReturn).toFixed(1)}pp more`
                                : `FRED picks were better by +${(period.picksReturn - period.geoPicksReturn).toFixed(1)}pp`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {!period.geoRegime && (
                      <div className="mt-1 text-[10px] text-[#333]">
                        AI would have agreed with FRED — no override needed
                      </div>
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
            const withOverride = s.timeline.filter((t) => t.geoRegime && t.geoPicksReturn !== null && t.geoPicksReturn !== undefined && t.picksReturn !== null);
            const aiBetter = withOverride.filter((t) => (t.geoPicksReturn ?? 0) > (t.picksReturn ?? 0));
            return withOverride.length > 0 ? (
              <div className="flex justify-between">
                <span className="text-[#555]">AI override beat FRED</span>
                <span className="text-[#3b82f6] font-bold">
                  {aiBetter.length}/{withOverride.length} ({Math.round(aiBetter.length / withOverride.length * 100)}%)
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
