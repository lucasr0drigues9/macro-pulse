"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { REGIME_COLORS, type RegimeName } from "@/lib/mockData";

type EtfValue = {
  ticker: string; name: string; price: number; rsi: number;
  fiveyrPosition: number; fiveyrLabel: string;
  regimes: string[]; currentRegimePick: boolean;
};

export default function ValueScanner() {
  const [data, setData] = useState<{ regime: string; etfs: EtfValue[] } | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/value-scanner"))
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data || !data.etfs.length) return null;

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Value Scanner</h2>
      <p className="text-xs text-[#555] mb-6">All framework ETFs ranked by 5-year price position — cheapest at the top</p>

      <div className="space-y-2">
        {data.etfs.map((etf) => {
          const posColor = etf.fiveyrPosition <= 25 ? "#22c55e" : etf.fiveyrPosition >= 75 ? "#ef4444" : "#eab308";
          const barWidth = Math.max(2, etf.fiveyrPosition);

          return (
            <div
              key={etf.ticker}
              className="p-3 rounded-lg bg-[#111] border border-[#222]"
            >
              <div className="flex items-center gap-3">
                {/* Ticker + name */}
                <div className="w-24 shrink-0">
                  <span className="text-sm font-bold text-[#e0e0e0]">{etf.ticker}</span>
                  <div className="text-xs text-[#555]">{etf.name}</div>
                </div>

                {/* 5yr bar */}
                <div className="flex-1">
                  <div className="h-4 bg-[#181818] rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, backgroundColor: posColor }}
                    />
                    {/* Midpoint marker */}
                    <div className="absolute top-0 left-1/2 w-px h-full bg-[#333]" />
                  </div>
                </div>

                {/* Position + price */}
                <div className="w-32 text-right shrink-0">
                  <span className="text-sm font-bold" style={{ color: posColor }}>
                    {etf.fiveyrPosition}%
                  </span>
                  <span className="text-xs text-[#555] ml-1">${etf.price.toFixed(2)}</span>
                  <div className="text-xs" style={{ color: posColor }}>
                    {etf.fiveyrLabel}
                  </div>
                </div>

                {/* Regime badges */}
                <div className="w-24 shrink-0 hidden sm:flex flex-wrap gap-1 justify-end">
                  {etf.regimes.map((r) => (
                    <span
                      key={r}
                      className="text-xs px-1 rounded"
                      style={{
                        color: REGIME_COLORS[r as RegimeName]?.color || "#888",
                        backgroundColor: (REGIME_COLORS[r as RegimeName]?.color || "#888") + "15",
                        border: etf.currentRegimePick && r === data.regime ? `1px solid ${REGIME_COLORS[r as RegimeName]?.color}40` : "none",
                      }}
                    >
                      {r.slice(0, 4)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-[#555] text-center">
        0% = at 5-year low (green) · 50% = midpoint · 100% = at 5-year high (red).
        ETFs near the bottom of their range may offer better entry points for their respective regimes.
      </p>
    </section>
  );
}
