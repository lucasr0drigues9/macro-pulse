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

type DurationStats = {
  avg: number; min: number; max: number; periods: number;
} | null;

type RotationPhase = {
  phase: string; action: string; picks: string; signal: string;
};
type RotationSequence = {
  title: string; phases: RotationPhase[];
} | null;

type TransitionData = {
  currentRegime: string;
  durationStats: DurationStats;
  rotationSequence: RotationSequence;
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
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch(apiUrl("/api/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, regimeAlerts: true }),
      });
    } catch {}
    setSubmitted(true);
  };

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
      <p className="text-xs text-[#555] mb-2">
        When the triggers above start moving, these are the ETFs to watch — ranked by transition probability and current price
      </p>
      {data.durationStats && (
        <p className="text-xs text-[#888] mb-2">
          {data.currentRegime} has historically lasted {data.durationStats.min}–{data.durationStats.max} months (avg {data.durationStats.avg}mo across {data.durationStats.periods} periods).
        </p>
      )}
      <p className="text-xs text-[#888] mb-6">
        Historically, waiting for regime confirmation before rotating still captured 65% of the move. This is a watchlist — know what to buy when the triggers fire, not a signal to buy now.
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

      {/* Rotation sequence */}
      {data.rotationSequence && (
        <div className="mt-8 p-4 rounded-lg bg-[#111] border border-[#222]">
          <h3 className="text-sm font-bold text-[#e0e0e0] mb-1">{data.rotationSequence.title}</h3>
          <p className="text-xs text-[#555] mb-4">The likely path through regimes — not a prediction, but the historical pattern.</p>
          <div className="space-y-3">
            {data.rotationSequence.phases.map((phase, i) => {
              const isNow = i === 0;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{
                        backgroundColor: isNow ? "#22c55e20" : "#222",
                        color: isNow ? "#22c55e" : "#555",
                        border: isNow ? "1px solid #22c55e40" : "1px solid #333",
                      }}
                    >
                      {isNow ? "●" : i}
                    </div>
                    {i < data.rotationSequence!.phases.length - 1 && (
                      <div className="w-px h-8 bg-[#222]" />
                    )}
                  </div>
                  <div className="pb-2">
                    <div className="text-sm font-bold text-[#e0e0e0]">{phase.phase}</div>
                    <div className="text-xs text-[#888] mt-0.5">{phase.action}</div>
                    <div className="text-xs text-[#555] mt-1">
                      ETFs: <span className="text-[#888]">{phase.picks}</span>
                    </div>
                    <div className="text-xs text-[#555] mt-0.5">
                      Signal: <span className="text-[#eab308]">{phase.signal}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Email signup */}
      <div className="mt-8 p-4 rounded-lg bg-[#111] border border-[#222] text-center">
        {submitted ? (
          <p className="text-sm text-[#22c55e]">You&apos;re in. We&apos;ll alert you when the regime shifts.</p>
        ) : (
          <>
            <p className="text-sm text-[#e0e0e0] mb-1">Don&apos;t miss the transition</p>
            <p className="text-xs text-[#555] mb-3">Get notified when triggers fire so you can act at the right time.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none text-center sm:text-left"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#222] hover:bg-[#333] text-sm text-[#e0e0e0] rounded transition-colors"
              >
                Alert me
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-[#333] text-center italic">
        Transition probabilities are estimates based on current indicator trends and geopolitical scenarios. They are not predictions. The regime may persist for months or shift without warning.
      </p>
    </section>
  );
}
