"use client";

import Link from "next/link";
import { useSignals } from "@/lib/SignalProvider";

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444",
  Goldilocks: "#22c55e",
  Reflation: "#eab308",
  Deflation: "#3b82f6",
};

export default function SignalStrip() {
  const { us, liquidity, yields, oil, loaded } = useSignals();

  const regime = us?.regime || null;
  const regimeColor = regime ? REGIME_COLORS[regime] || "#888" : "#888";

  const trendColor = (t: string | undefined) =>
    t === "expanding" || t === "falling" ? "#22c55e"
    : t === "contracting" || t === "rising" ? "#ef4444"
    : "#888";

  const oilTrendColor = (t: string | undefined) =>
    t === "rising" ? "#ef4444" : t === "falling" ? "#22c55e" : "#888";

  if (!loaded && !regime && !liquidity) return null;

  return (
    <section className="px-4 py-4 max-w-5xl mx-auto">
      <Link href="/signals" className="block">
        <div className="p-3 rounded-lg border border-[#222] bg-[#111] hover:bg-[#151515] transition-colors">
          <div className="flex items-center gap-3 flex-wrap text-[10px]">
            {regime && (
              <span className="font-bold px-2 py-0.5 rounded" style={{ color: regimeColor, backgroundColor: regimeColor + "20" }}>
                {regime}
              </span>
            )}
            {liquidity && (
              <span className="text-[#888]">
                Liquidity{" "}
                <span className="font-bold capitalize" style={{ color: trendColor(liquidity.trend) }}>
                  {liquidity.trend}
                </span>
                {liquidity.changes.threeMonth !== null && (
                  <span style={{ color: trendColor(liquidity.trend) }}>
                    {" "}{liquidity.changes.threeMonth >= 0 ? "+" : ""}{liquidity.changes.threeMonth}%
                  </span>
                )}
              </span>
            )}
            {yields && (
              <span className="text-[#888]">
                10Y{" "}
                <span className="font-bold" style={{ color: trendColor(yields.trend) }}>
                  {yields.latest.tenYear.toFixed(2)}%
                </span>
              </span>
            )}
            {oil && (
              <span className="text-[#888]">
                Oil{" "}
                <span className="font-bold" style={{ color: oilTrendColor(oil.trend) }}>
                  ${oil.latest.brent.toFixed(0)}
                </span>
              </span>
            )}
            <span className="text-[#555] ml-auto">Signal dashboard →</span>
          </div>
        </div>
      </Link>
    </section>
  );
}
