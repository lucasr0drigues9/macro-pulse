"use client";

import { useEffect, useState } from "react";
import { regimeData as fallback, REGIME_COLORS, type RegimeName } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";
import { useMode } from "@/lib/mode";

type RegimeData = typeof fallback & { earlyRotation?: { targetRegime: string; totalPct: number; positions: { ticker: string; name: string; weight: number }[] } | null };

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function RegimeIndicator() {
  const { mode } = useMode();
  const [data, setData] = useState<RegimeData>(fallback);
  const [live, setLive] = useState(false);

  useEffect(() => {
    fetch(apiUrl(`/api/regime?mode=${mode}`))
      .then((r) => r.json())
      .then((d) => {
        setData({
          confirmed: d.confirmed as RegimeName,
          consecutiveMonths: d.consecutiveMonths,
          fredSignal: { regime: d.fredSignal.regime as RegimeName, note: d.fredSignal.note, lastUpdated: d.fredSignal.lastUpdated },
          geoSignal: { regime: d.geoSignal.regime as RegimeName, note: d.geoSignal.note, lastUpdated: d.geoSignal.lastUpdated },
          lagWarning: d.lagWarning,
          earlyTransition: d.earlyTransition,
          earlyRotation: d.earlyRotation || null,
        });
        setLive(true);
      })
      .catch(() => {});
  }, [mode]);

  const { confirmed, consecutiveMonths, fredSignal, geoSignal, lagWarning, earlyTransition, earlyRotation } = data;
  const regime = REGIME_COLORS[confirmed];
  const fredColor = REGIME_COLORS[fredSignal.regime];
  const geoColor = REGIME_COLORS[geoSignal.regime];

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      {live && (
        <div className="text-center mb-4">
          <span className="text-xs text-[#22c55e]">● live data</span>
        </div>
      )}

      {/* Main regime display */}
      <div
        className="text-center py-12 rounded-lg border"
        style={{ borderColor: regime.color + "40", backgroundColor: regime.dim }}
      >
        <div className="text-6xl sm:text-8xl font-bold tracking-tight" style={{ color: regime.color }}>
          {confirmed}
        </div>
        <div className="mt-3 text-lg text-[#888]">
          {ordinal(consecutiveMonths)} consecutive month
        </div>
      </div>

      {/* Signal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
          <div className="text-xs text-[#555] uppercase tracking-wider mb-2">FRED Signal</div>
          <div className="text-xl font-bold" style={{ color: fredColor.color }}>
            {fredSignal.regime}
          </div>
          <div className="text-xs text-[#555] mt-1">{fredSignal.note}</div>
          <div className="text-xs text-[#333] mt-2">Updated {fredSignal.lastUpdated}</div>
        </div>
        <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
          <div className="text-xs text-[#555] uppercase tracking-wider mb-2">Geopolitical Signal</div>
          <div className="text-xl font-bold" style={{ color: geoColor.color }}>
            {geoSignal.regime}
          </div>
          <div className="text-xs text-[#555] mt-1">{geoSignal.note}</div>
          <div className="text-xs text-[#333] mt-2">Updated {geoSignal.lastUpdated}</div>
        </div>
      </div>

      {/* Lag warning banner */}
      {lagWarning && (
        <div className="mt-4 p-3 rounded-lg bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.3)] text-center">
          <span className="text-sm text-[#eab308]">
            ⚠ Data lag active — geopolitical signal overriding FRED. FRED data lags reality by 1–2 months.
          </span>
        </div>
      )}

      {/* Early transition banner */}
      {earlyTransition && (
        <div className="mt-4 p-4 rounded-lg bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)]">
          <div className="text-sm font-bold text-[#3b82f6] mb-2">
            Early signal: {earlyTransition.targetRegime} transition detected
          </div>
          <div className="text-xs text-[#888]">
            Flickering: {earlyTransition.flickeringIndicators.join(", ")} · Still confirming {confirmed}: {earlyTransition.confirmingIndicators.join(", ")}
          </div>
          <div className="text-xs text-[#555] mt-1">Not yet confirmed. Requires 2 consecutive months.</div>
        </div>
      )}

      {/* Early rotation recommendation (Active/Aggressive modes) */}
      {earlyRotation && (
        <div className="mt-4 p-4 rounded-lg bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.3)]">
          <div className="text-sm font-bold text-[#eab308] mb-2">
            Early rotation: {earlyRotation.totalPct}% toward {earlyRotation.targetRegime}
          </div>
          <div className="flex flex-wrap gap-3">
            {earlyRotation.positions.map((p: { ticker: string; name: string; weight: number }) => (
              <div key={p.ticker} className="text-xs text-[#888]">
                <span className="text-[#e0e0e0] font-bold">{p.ticker}</span> {p.name} — {p.weight}%
              </div>
            ))}
          </div>
          <div className="text-xs text-[#555] mt-2">Starter positions before regime confirmation. Higher risk, earlier entry.</div>
        </div>
      )}
    </section>
  );
}
