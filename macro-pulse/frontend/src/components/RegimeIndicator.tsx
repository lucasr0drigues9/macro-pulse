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

type RegimeOrigin = {
  regime: string; detectedDate: string; headline: string;
  situation: string; keyTension: string;
  whatWouldEndIt: string; whatWouldDeepen: string;
} | null;

export default function RegimeIndicator() {
  const { mode } = useMode();
  const [data, setData] = useState<RegimeData>(fallback);
  const [live, setLive] = useState(false);
  const [origin, setOrigin] = useState<RegimeOrigin>(null);

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
        setOrigin(d.regimeOrigin || null);
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
          <div className="text-xs text-[#555] uppercase tracking-wider mb-2">Regime Detection — Geopolitical AI</div>
          <div className="text-xl font-bold" style={{ color: geoColor.color }}>
            {geoSignal.regime}
          </div>
          <div className="text-xs text-[#555] mt-1">{geoSignal.note}</div>
          <div className="text-xs text-[#333] mt-2">Updated daily · {geoSignal.lastUpdated}</div>
        </div>
        <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
          <div className="text-xs text-[#555] uppercase tracking-wider mb-2">Confirmation Signal — FRED (Q4 2025 data)</div>
          <div className="text-xl font-bold" style={{ color: fredColor.color }}>
            {fredSignal.regime}
          </div>
          <div className="text-xs text-[#555] mt-1">{fredSignal.note}</div>
          {lagWarning && (
            <div className="text-xs text-[#eab308] mt-2">
              FRED previously confirmed Stagflation (Nov 2025 – Feb 2026 using Q2–Q3 data). The Q4 2025 GDP showed a brief growth recovery, reverting the signal to Reflation. The AI layer overrides this because the Iran/Hormuz crisis has since made that recovery irrelevant.
            </div>
          )}
          <div className="text-xs text-[#333] mt-2">Latest data: {fredSignal.lastUpdated}</div>
        </div>
      </div>

      {/* FRED confirmation explanation */}
      <div className="mt-4 p-4 rounded-lg bg-[#111] border border-[#222]">
        <div className="text-xs text-[#888] leading-relaxed">
          <span className="text-[#e0e0e0] font-bold">How to read these signals:</span> The geopolitical AI layer detects regime changes in real time by analysing current events daily. FRED economic data is a <span className="text-[#eab308]">confirmation signal</span>, not a detection tool — it tells you the regime has been confirmed, not that it&apos;s starting. FRED is structurally slow: GDP is reported as a single number per quarter (no monthly breakdown), unemployment is a lagging indicator, and even monthly data like CPI reflects conditions 1-2 months ago.
        </div>
        {lagWarning && (
          <div className="text-xs text-[#eab308] mt-2 pt-2 border-t border-[#222]">
            FRED currently reads {fredSignal.regime} because its latest GDP data (Q4 2025) still shows pre-crisis growth. When Q1 2026 GDP is released in late April, it will likely confirm what the geopolitical layer has been signalling since the war started. By then, investors who waited for FRED confirmation will have missed months of positioning opportunity.
          </div>
        )}
      </div>

      {/* Why this regime was flagged */}
      {origin && (
        <div className="mt-4 p-4 rounded-lg bg-[#111] border border-[#222]">
          <div className="text-sm font-bold text-[#e0e0e0] mb-2">Why {origin.regime} was flagged</div>
          <div className="text-xs text-[#555] mb-3 p-2 rounded bg-[#0a0a0a] leading-relaxed">
            <span className="text-[#888]">Nov 2025:</span> FRED data first detected Stagflation conditions — rising inflation meeting slowing growth. Regime picks began outperforming (+14% vs SPY +0.7% through February).
            <br /><span className="text-[#888]">Oct 2025:</span> A brief Reflation reading appeared but lasted only one month — absorbed into the Stagflation trend by the smoothing filter.
            <br /><span className="text-[#888]">Feb 28, 2026:</span> The US-Israel airstrikes on Iran and the Strait of Hormuz blockade deepened the existing Stagflation into a full energy crisis, validating the signal the data had been showing for months.
          </div>
          <p className="text-xs text-[#888] leading-relaxed mb-3">{origin.situation}</p>
          {origin.keyTension && (
            <p className="text-xs text-[#eab308] mb-3">{origin.keyTension}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {origin.whatWouldEndIt && (
              <div className="p-2 rounded bg-[#0a0a0a]">
                <div className="text-xs text-[#22c55e] font-bold mb-1">What would end it</div>
                <div className="text-xs text-[#888]">{origin.whatWouldEndIt}</div>
              </div>
            )}
            {origin.whatWouldDeepen && (
              <div className="p-2 rounded bg-[#0a0a0a]">
                <div className="text-xs text-[#ef4444] font-bold mb-1">What would deepen it</div>
                <div className="text-xs text-[#888]">{origin.whatWouldDeepen}</div>
              </div>
            )}
          </div>
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
