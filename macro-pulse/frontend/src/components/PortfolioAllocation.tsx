"use client";

import { useEffect, useState } from "react";
import { allocationData as fallback, REGIME_COLORS, type RegimeName } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";

type Overweight = {
  ticker: string; name: string; weight: number; conviction: number;
  priceAssessment: string; rationale: string;
  timing?: { price: number; rsi: number; score: number; fiveyrPosition?: number | null; fiveyrLabel?: string | null } | null;
};
type Underweight = { ticker: string; name: string; rationale: string };
type AllocData = {
  regime: RegimeName; kellyFraction: number; cashTarget: number;
  overweight: Overweight[]; underweight: Underweight[];
};
function AssessmentBadge({ assessment }: { assessment: string }) {
  const colors: Record<string, string> = {
    "Still attractive": "#22c55e",
    "Fairly valued": "#eab308",
    Extended: "#ef4444",
  };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded"
      style={{
        color: colors[assessment] || "#888",
        backgroundColor: (colors[assessment] || "#888") + "20",
      }}
    >
      {assessment}
    </span>
  );
}

function AllocationBar({ ticker, weight, color }: { ticker: string; weight: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-[#888] w-10 text-right">{ticker}</span>
      <div className="flex-1 h-5 bg-[#181818] rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${weight}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-[#888] w-10">{weight}%</span>
    </div>
  );
}

export default function PortfolioAllocation() {
  const [data, setData] = useState<AllocData | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/allocation"))
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  const regime = (data?.regime || fallback.regime) as RegimeName;
  const overweight = data?.overweight || fallback.overweight;
  const underweight = data?.underweight || fallback.underweight;
  const regimeColor = REGIME_COLORS[regime].color;

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Current Allocation Recommendation</h2>
      <p className="text-xs text-[#555] mb-6">
        Based on confirmed {regime} regime
        {data?.kellyFraction !== undefined && (
          <span className="ml-2 text-[#888]">· Half-Kelly: {(data.kellyFraction * 100).toFixed(1)}%</span>
        )}
      </p>

      {/* Bar chart */}
      <div className="p-4 rounded-lg bg-[#111] border border-[#222] mb-6">
        {overweight.map((etf) => (
          <AllocationBar key={etf.ticker} ticker={etf.ticker} weight={etf.weight} color={regimeColor} />
        ))}
      </div>

      {/* Overweight / Underweight columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-[#22c55e] uppercase tracking-wider mb-3">
            Overweight — Buy/Hold
          </h3>
          <div className="space-y-3">
            {overweight.map((etf) => (
              <div key={etf.ticker} className="p-3 rounded bg-[#111] border border-[#181818]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{etf.ticker} <span className="text-[#555] font-normal text-xs">{etf.name}</span></span>
                  <span className="text-xs text-[#888]">{etf.weight}%</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <AssessmentBadge assessment={etf.priceAssessment} />
                  <span className="text-xs text-[#555]">Conviction: {(etf.conviction * 100).toFixed(0)}%</span>
                  {"timing" in etf && etf.timing && (
                    <>
                      <span className="text-xs text-[#333]">RSI: {etf.timing.rsi}</span>
                      {etf.timing.fiveyrPosition != null && (
                        <span className={`text-xs ${etf.timing.fiveyrPosition <= 25 ? "text-[#22c55e]" : etf.timing.fiveyrPosition >= 75 ? "text-[#ef4444]" : "text-[#888]"}`}>
                          5yr: {etf.timing.fiveyrPosition}% {etf.timing.fiveyrLabel}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs text-[#888]">{etf.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#ef4444] uppercase tracking-wider mb-3">
            Underweight — Avoid
          </h3>
          <div className="space-y-3">
            {underweight.map((etf) => (
              <div key={etf.ticker} className="p-3 rounded bg-[#111] border border-[#181818]">
                <span className="font-bold text-sm">{etf.ticker} <span className="text-[#555] font-normal text-xs">{etf.name}</span></span>
                <p className="text-xs text-[#888] mt-1">{etf.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg bg-[#111] border border-[#222]">
        <p className="text-xs text-[#888] leading-relaxed">
          <span className="text-[#e0e0e0] font-bold">Buying tip:</span> All regime picks have the same macro tailwind. Prioritise the ones marked <span className="text-[#22c55e]">Still attractive</span> — same thesis, better entry price. ETFs marked <span className="text-[#ef4444]">Extended</span> may still perform but offer less upside from current levels. Allocation updates automatically when the regime changes.
        </p>
      </div>

      <p className="mt-4 text-xs text-[#333] text-center italic">
        This is a systematic framework output, not personalised financial advice. Always do your own research.
      </p>
    </section>
  );
}
