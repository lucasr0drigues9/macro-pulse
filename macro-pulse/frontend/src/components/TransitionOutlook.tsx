"use client";

import { useEffect, useState } from "react";
import { REGIME_COLORS, type RegimeName } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";

type EtfOpportunity = {
  ticker: string; name: string; price: number | null;
  rsi: number | null; timingScore: number; priceAssessment: string;
  conviction: number;
};

type RegimeOutlook = {
  regime: RegimeName; probability: number; source: string;
  signals: string[]; description: string;
  confirmationSignals: string[]; etfs: EtfOpportunity[];
};

type TransitionData = {
  currentRegime: string;
  outlook: RegimeOutlook[];
};

const assessmentColors: Record<string, string> = {
  "Cheap — good entry": "#22c55e",
  "Fair price": "#eab308",
  "Expensive — wait": "#ef4444",
  "No data": "#555",
};

export default function TransitionOutlook() {
  const [data, setData] = useState<TransitionData | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/transition"))
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data || data.outlook.length === 0) return null;

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Transition Radar</h2>
      <p className="text-xs text-[#555] mb-6">
        Scanning for regime shifts — ETFs ranked by transition probability and current price attractiveness
      </p>

      <div className="space-y-6">
        {data.outlook.map((outlook) => {
          const colors = REGIME_COLORS[outlook.regime] || { color: "#888", dim: "rgba(136,136,136,0.15)" };
          return (
            <div
              key={outlook.regime}
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: colors.color + "30" }}
            >
              {/* Regime header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: colors.dim }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.color }}
                  />
                  <div>
                    <span className="font-bold text-sm" style={{ color: colors.color }}>
                      {outlook.regime}
                    </span>
                    <span className="text-xs text-[#888] ml-2">{outlook.description}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: colors.color }}>
                    {outlook.probability}%
                  </div>
                  <div className="text-xs text-[#555]">likelihood</div>
                </div>
              </div>

              <div className="px-4 py-3 bg-[#111]">
                {/* Why this transition */}
                {outlook.source && (
                  <p className="text-xs text-[#888] mb-2">{outlook.source}</p>
                )}
                {outlook.signals.length > 0 && (
                  <div className="mb-3">
                    {outlook.signals.map((s, i) => (
                      <p key={i} className="text-xs text-[#555]">· {s}</p>
                    ))}
                  </div>
                )}

                {/* ETF opportunities — cheapest first */}
                <div className="space-y-2">
                  {outlook.etfs.map((etf) => {
                    const assessColor = assessmentColors[etf.priceAssessment] || "#888";
                    return (
                      <div
                        key={etf.ticker}
                        className="flex items-center justify-between p-2 rounded bg-[#0a0a0a]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-[#e0e0e0] w-12">{etf.ticker}</span>
                          <span className="text-xs text-[#555]">{etf.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          {etf.price && (
                            <span className="text-[#888]">${etf.price.toFixed(2)}</span>
                          )}
                          {etf.rsi !== null && (
                            <span className="text-[#555]">RSI {etf.rsi.toFixed(0)}</span>
                          )}
                          <span
                            className="px-2 py-0.5 rounded"
                            style={{ color: assessColor, backgroundColor: assessColor + "20" }}
                          >
                            {etf.priceAssessment}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Confirmation signals */}
                {outlook.confirmationSignals.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#181818]">
                    <span className="text-xs text-[#555]">What would confirm this transition:</span>
                    {outlook.confirmationSignals.map((s, i) => (
                      <p key={i} className="text-xs text-[#888] ml-2">· {s}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-[#333] text-center italic">
        Transition probabilities are estimates based on current indicator trends and geopolitical scenarios. They are not predictions. The regime may persist for months or shift without warning.
      </p>
    </section>
  );
}
