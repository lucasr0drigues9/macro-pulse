"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { REGIME_COLORS, type RegimeName } from "@/lib/mockData";

type EtfValue = {
  ticker: string; name: string; price: number; rsi: number;
  fiveyrPosition: number; fiveyrLabel: string;
  change3m: number | null; change1m: number | null;
  dipFromHigh: number | null; isDip: boolean;
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

  const dips = data.etfs.filter((e) => e.isDip);
  const rest = data.etfs.filter((e) => !e.isDip);

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Value Scanner</h2>
      <p className="text-xs text-[#555] mb-6">All framework ETFs ranked by 5-year price position — dips highlighted</p>

      {/* Dips section */}
      {dips.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#22c55e] uppercase tracking-wider mb-3">
            Dips detected — down 5%+ from 3-month high
          </h3>
          <div className="space-y-2">
            {dips.map((etf) => (
              <EtfCard key={etf.ticker} etf={etf} regime={data.regime} highlight />
            ))}
          </div>
        </div>
      )}

      {dips.length === 0 && (
        <div className="p-3 rounded-lg bg-[#111] border border-[#222] mb-6 text-center">
          <p className="text-xs text-[#555]">No significant dips detected right now. All ETFs are within 5% of their 3-month highs.</p>
        </div>
      )}

      {/* All ETFs */}
      <h3 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-3">
        All ETFs — 5-year range
      </h3>
      <div className="space-y-2">
        {rest.map((etf) => (
          <EtfCard key={etf.ticker} etf={etf} regime={data.regime} />
        ))}
      </div>

      <p className="mt-4 text-xs text-[#555] text-center">
        5yr range: 0% = at 5-year low · 100% = at 5-year high. Dip = dropped 5%+ from 3-month high.
      </p>
    </section>
  );
}

function EtfCard({ etf, regime, highlight }: { etf: EtfValue; regime: string; highlight?: boolean }) {
  const posColor = etf.fiveyrPosition <= 25 ? "#22c55e" : etf.fiveyrPosition >= 75 ? "#ef4444" : "#eab308";
  const barWidth = Math.max(2, etf.fiveyrPosition);
  const borderColor = highlight ? "#22c55e30" : "#222";
  const bgColor = highlight ? "rgba(34, 197, 94, 0.03)" : "#111";

  return (
    <div
      className="p-3 rounded-lg border"
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <div className="flex items-center gap-3">
        {/* Ticker + name + dip badge */}
        <div className="w-28 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-[#e0e0e0]">{etf.ticker}</span>
            {etf.isDip && (
              <span className="text-xs px-1 rounded bg-[rgba(34,197,94,0.15)] text-[#22c55e]">DIP</span>
            )}
          </div>
          <div className="text-xs text-[#555]">{etf.name}</div>
        </div>

        {/* 5yr bar */}
        <div className="flex-1 hidden sm:block">
          <div className="h-4 bg-[#181818] rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${barWidth}%`, backgroundColor: posColor }}
            />
            <div className="absolute top-0 left-1/2 w-px h-full bg-[#333]" />
          </div>
        </div>

        {/* Changes */}
        <div className="w-20 text-right shrink-0">
          {etf.dipFromHigh != null && (
            <div className={`text-xs font-bold ${etf.dipFromHigh <= -5 ? "text-[#22c55e]" : etf.dipFromHigh >= 0 ? "text-[#ef4444]" : "text-[#888]"}`}>
              {etf.dipFromHigh >= 0 ? "+" : ""}{etf.dipFromHigh}%
            </div>
          )}
          <div className="text-xs text-[#555]">from 3mo high</div>
        </div>

        {/* Position + price */}
        <div className="w-28 text-right shrink-0">
          <span className="text-sm font-bold" style={{ color: posColor }}>
            {etf.fiveyrPosition}%
          </span>
          <span className="text-xs text-[#555] ml-1">${etf.price.toFixed(0)}</span>
          <div className="text-xs" style={{ color: posColor }}>
            {etf.fiveyrLabel}
          </div>
        </div>

        {/* Regime badges */}
        <div className="w-20 shrink-0 hidden sm:flex flex-wrap gap-1 justify-end">
          {etf.regimes.map((r) => (
            <span
              key={r}
              className="text-xs px-1 rounded"
              style={{
                color: REGIME_COLORS[r as RegimeName]?.color || "#888",
                backgroundColor: (REGIME_COLORS[r as RegimeName]?.color || "#888") + "15",
                border: etf.currentRegimePick && r === regime ? `1px solid ${REGIME_COLORS[r as RegimeName]?.color}40` : "none",
              }}
            >
              {r.slice(0, 4)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
