"use client";

import { useEffect, useState } from "react";
import { assetPerformance as fallback, REGIME_COLORS, type RegimeName } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";

type AssetData = typeof fallback;

export default function AssetPerformance() {
  const [data, setData] = useState<AssetData>(fallback);

  useEffect(() => {
    fetch(apiUrl("/api/performance"))
      .then((r) => r.json())
      .then((d) => {
        setData({
          regime: d.regime as RegimeName,
          regimeStartDate: d.regimeStartDate,
          assets: d.assets,
        });
      })
      .catch(() => {});
  }, []);

  const { regime, regimeStartDate, assets } = data;
  const picks = assets.filter((a) => a.category === "pick");
  const avoids = assets.filter((a) => a.category === "avoid");
  const benchmark = assets.find((a) => a.category === "benchmark");

  const avgPicks = picks.length ? picks.reduce((s, a) => s + a.returnPct, 0) / picks.length : 0;
  const avgAvoids = avoids.length ? avoids.reduce((s, a) => s + a.returnPct, 0) / avoids.length : 0;
  const outperformed = avgPicks > avgAvoids;

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">
        <span style={{ color: REGIME_COLORS[regime].color }}>{regime}</span> — Picks vs Avoids
      </h2>
      <p className="text-xs text-[#555] mb-6">Since {regimeStartDate}</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#555] text-xs uppercase tracking-wider border-b border-[#222]">
              <th className="text-left py-2 pr-4">Asset</th>
              <th className="text-right py-2 px-4">Return</th>
              <th className="text-right py-2 pl-4">Category</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.ticker} className="border-b border-[#181818] hover:bg-[#111]">
                <td className="py-3 pr-4">
                  <span className="text-[#e0e0e0] font-bold">{asset.ticker}</span>
                  <span className="text-[#555] ml-2 text-xs">{asset.name}</span>
                </td>
                <td
                  className="text-right py-3 px-4 font-bold"
                  style={{ color: asset.returnPct >= 0 ? "#22c55e" : "#ef4444" }}
                >
                  {asset.returnPct >= 0 ? "+" : ""}
                  {asset.returnPct.toFixed(1)}%
                </td>
                <td className="text-right py-3 pl-4">
                  {asset.category === "pick" && <span className="text-[#22c55e]">✓ Pick</span>}
                  {asset.category === "avoid" && <span className="text-[#ef4444]">✗ Avoid</span>}
                  {asset.category === "benchmark" && <span className="text-[#555]">— Benchmark</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary row */}
      <div className="mt-4 p-3 rounded-lg bg-[#111] border border-[#222] flex flex-wrap gap-4 text-sm justify-center">
        <span>
          Avg picks: <span className="text-[#22c55e] font-bold">+{avgPicks.toFixed(1)}%</span>
        </span>
        <span className="text-[#333]">|</span>
        <span>
          Avg avoids:{" "}
          <span className={avgAvoids >= 0 ? "text-[#22c55e] font-bold" : "text-[#ef4444] font-bold"}>
            {avgAvoids >= 0 ? "+" : ""}{avgAvoids.toFixed(1)}%
          </span>
        </span>
        <span className="text-[#333]">|</span>
        <span style={{ color: outperformed ? "#22c55e" : "#ef4444" }}>
          Picks {outperformed ? "outperformed" : "underperformed"} by {Math.abs(avgPicks - avgAvoids).toFixed(1)}pp
        </span>
      </div>

      {benchmark && (
        <div className="mt-2 text-center text-xs text-[#555]">
          SPY benchmark: {benchmark.returnPct >= 0 ? "+" : ""}{benchmark.returnPct.toFixed(1)}%
        </div>
      )}

      <p className="mt-4 text-xs text-[#333] text-center italic">
        Past performance within a regime does not guarantee future results. Regime transitions can reverse quickly. This is not financial advice.
      </p>
    </section>
  );
}
