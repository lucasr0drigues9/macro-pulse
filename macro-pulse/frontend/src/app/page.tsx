"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import SectionChat from "@/components/SectionChat";
import SubscribeForm from "@/components/SubscribeForm";
import { apiUrl } from "@/lib/api";

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444", Goldilocks: "#22c55e", Reflation: "#eab308", Deflation: "#3b82f6",
};

type ETFPick = { ticker: string; name: string; weight: number; returnSinceRegime?: number | null };
type RegimeAllocation = { regime: string; overweight: ETFPick[]; periodStart?: string };

export default function HomePage() {
  const [usAlloc, setUsAlloc] = useState<RegimeAllocation | null>(null);
  const [euAlloc, setEuAlloc] = useState<RegimeAllocation | null>(null);
  const [cnAlloc, setCnAlloc] = useState<RegimeAllocation | null>(null);
  const [usPerformance, setUsPerformance] = useState<{ assets: { ticker: string; name: string; returnPct: number; category: string }[]; regimeStartDate: string } | null>(null);
  const [timing, setTiming] = useState<{ ticker: string; theme: string; color: string; isUcits: boolean; price: number; rsi: number; vsMa200: number; drawdown: number; high52w: number; low52w: number; score: number; signal: string }[]>([]);
  useEffect(() => {
    fetch(apiUrl("/api/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setUsAlloc(d); }).catch(() => {});
    fetch(apiUrl("/api/eu/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setEuAlloc(d); }).catch(() => {});
    fetch(apiUrl("/api/china/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setCnAlloc(d); }).catch(() => {});
    fetch(apiUrl("/api/performance")).then((r) => r.json()).then((d) => { if (d.assets) setUsPerformance(d); }).catch(() => {});
    fetch(apiUrl("/api/structural-timing")).then((r) => r.json()).then((d) => { if (d.themes) setTiming(d.themes); }).catch(() => {});
  }, []);

  function AllocationColumn({ flag, label, data, href, source }: {
    flag: string; label: string; data: RegimeAllocation | null; href: string; source: string;
  }) {
    const regime = data?.regime || "Loading";
    const color = REGIME_COLORS[regime] || "#555";
    return (
      <div className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
        <div className="p-4 text-center" style={{ backgroundColor: color + "10", borderBottom: `1px solid ${color}30` }}>
          <div className="text-lg mb-1">{flag}</div>
          <div className="text-xs text-[#888]">{label}</div>
          <div className="text-xl font-bold mt-1" style={{ color }}>{regime}</div>
          <div className="text-[10px] text-[#555] mt-1">{source}</div>
        </div>
        <div className="p-3">
          {data ? (
            <div className="space-y-2">
              {data.overweight.slice(0, 4).map((etf) => (
                <div key={etf.ticker} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#e0e0e0]">{etf.ticker}</span>
                    <span className="text-[10px] text-[#555] ml-1">{etf.weight}%</span>
                  </div>
                  {typeof etf.returnSinceRegime === "number" && (
                    <span className={`text-xs font-bold ${etf.returnSinceRegime >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {etf.returnSinceRegime >= 0 ? "+" : ""}{etf.returnSinceRegime}%
                    </span>
                  )}
                </div>
              ))}
              {data.periodStart && (
                <div className="text-[10px] text-[#333] mt-1">Returns since {data.periodStart}</div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#333] py-4 text-center">Loading picks...</div>
          )}
          <Link href={href} className="block text-center mt-3 text-xs text-[#555] hover:text-[#888] underline underline-offset-2">
            Full tracker →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Hero — compact */}
      <section className="px-4 pt-16 pb-8 max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl text-[#e0e0e0] font-bold leading-tight mb-4">
          Three economies. Three regimes. The ETFs that benefit from each — right now.
        </h1>
        <p className="text-xs text-[#555] max-w-2xl">
          Ray Dalio&apos;s four-season framework applied to the US, Europe, and China. Live regime signals drive ETF allocation. Updated daily.
        </p>
      </section>

      {/* ══ GLOBAL REGIME SIGNAL ══ */}
      {usAlloc && euAlloc && cnAlloc && (() => {
        const regimes = [
          { label: "US", regime: usAlloc.regime, start: usPerformance?.regimeStartDate || usAlloc.periodStart },
          { label: "EU", regime: euAlloc.regime, start: euAlloc.periodStart },
          { label: "CN", regime: cnAlloc.regime, start: cnAlloc.periodStart },
        ];
        // Find the dominant regime
        const regimeCounts: Record<string, number> = {};
        for (const r of regimes) {
          regimeCounts[r.regime] = (regimeCounts[r.regime] || 0) + 1;
        }
        const dominant = Object.entries(regimeCounts).sort((a, b) => b[1] - a[1])[0];
        const dominantRegime = dominant[0];
        const dominantCount = dominant[1];
        const dominantColor = REGIME_COLORS[dominantRegime] || "#888";
        const allSame = dominantCount === 3;
        const majority = dominantCount >= 2;

        // Find the oldest regime start for the dominant signal (that's where returns actually come from)
        const dominantStarts = regimes
          .filter((r) => r.regime === dominantRegime && r.start)
          .map((r) => r.start!)
          .sort();
        const oldestStart = dominantStarts[0];

        // Get returns from US performance since dominant regime start (most liquid market)
        const picks = usPerformance?.assets?.filter((a) => a.category === "pick").slice(0, 5) || [];

        const conviction = allSame ? "Maximum" : majority ? "High" : "Mixed";
        const convictionColor = allSame ? "#22c55e" : majority ? "#eab308" : "#ef4444";

        return (
          <section className="px-4 py-8 max-w-5xl mx-auto">
            <div className="p-4 rounded-lg border" style={{ borderColor: dominantColor + "40", backgroundColor: dominantColor + "08" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-[#555] uppercase tracking-wider">Global Regime Signal</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: dominantColor }}>{dominantRegime}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: convictionColor }}>{conviction} conviction</div>
                  <div className="text-xs text-[#555]">{dominantCount} of 3 economies aligned</div>
                </div>
              </div>

              {/* Three regime badges */}
              <div className="flex gap-2 mb-4">
                {regimes.map((r) => {
                  const color = REGIME_COLORS[r.regime] || "#555";
                  const matches = r.regime === dominantRegime;
                  return (
                    <div key={r.label} className="flex-1 p-2 rounded text-center" style={{
                      backgroundColor: matches ? color + "15" : "#111",
                      border: `1px solid ${matches ? color + "40" : "#222"}`,
                    }}>
                      <div className="text-[10px] text-[#555]">{r.label}</div>
                      <div className="text-xs font-bold" style={{ color }}>{r.regime}</div>
                    </div>
                  );
                })}
              </div>

              {/* Returns since dominant regime started */}
              {picks.length > 0 && oldestStart && (
                <div>
                  <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">
                    Top picks performance since {dominantRegime} started ({oldestStart.slice(0, 7)})
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {picks.map((p) => (
                      <div key={p.ticker} className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#e0e0e0]">{p.ticker}</span>
                        <span className={`text-xs font-bold ${p.returnPct >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {p.returnPct >= 0 ? "+" : ""}{p.returnPct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interaction explanation */}
              <div className="mt-3 text-[10px] text-[#888] leading-relaxed">
                {allSame && (
                  <span>All three economies in {dominantRegime} — strongest possible signal. Capital flows are unidirectional. These returns reflect the full global alignment.</span>
                )}
                {majority && !allSame && (() => {
                  const outlier = regimes.find((r) => r.regime !== dominantRegime);
                  return (
                    <span>{dominantCount} of 3 in {dominantRegime}. {outlier?.label} diverging with {outlier?.regime} — {
                      outlier?.regime === "Deflation" ? "deflationary pressure from that economy may moderate the global signal but doesn't reverse it." :
                      outlier?.regime === "Goldilocks" ? "growth in that economy supports risk assets alongside the dominant signal." :
                      "the divergence creates cross-currents but the majority signal dominates capital flows."
                    }</span>
                  );
                })()}
                {!majority && (
                  <span>Three different regimes — no dominant signal. Capital flows are fragmented. Real assets (gold, commodities) tend to outperform during regime confusion.</span>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ══ WHAT TO OWN RIGHT NOW ══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-[#e0e0e0] mb-1">What to Own — By Region</h2>
        <p className="text-xs text-[#555] mb-4">Per-region ETF picks. Returns shown since each region&apos;s regime started — see Global Signal above for the combined view.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AllocationColumn
            flag={"\uD83C\uDDFA\uD83C\uDDF8"}
            label="United States"
            data={usAlloc}
            href="/regimetracker"
            source="FRED + AI Geo"
          />
          <AllocationColumn
            flag={"\uD83C\uDDEA\uD83C\uDDFA"}
            label="Europe"
            data={euAlloc}
            href="/europe"
            source="Eurostat + ECB"
          />
          <AllocationColumn
            flag={"\uD83C\uDDE8\uD83C\uDDF3"}
            label="China"
            data={cnAlloc}
            href="/china"
            source="Proxy + AI Geo"
          />
        </div>

        <SectionChat
          context="Home page showing live ETF allocations for US (FRED-based), Europe (Eurostat-based), and China (proxy-based) regimes. Each column shows the current regime and the top ETF picks with returns since the regime started."
          label="Ask about current positioning"
          suggestions={["Why are all three in different regimes?", "Which ETFs overlap across regions?", "What would change these picks?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* What this means — derived from live regime data, not cached synthesis */}
      {usAlloc && euAlloc && cnAlloc && (() => {
        const us = usAlloc.regime;
        const eu = euAlloc.regime;
        const cn = cnAlloc.regime;

        // Build interpretation from the actual live data
        const allStagflation = us === "Stagflation" && eu === "Stagflation" && cn === "Stagflation";
        const allSame = us === eu && eu === cn;

        let interpretation = "";
        if (allStagflation) {
          interpretation = `All three economies are in Stagflation — the strongest possible bearish signal for growth assets. Energy (XLE, IOGP.L), gold (GLD, SGLD.L), and commodities (DBC) benefit from inflation pressure across all major economies simultaneously. The Hormuz closure is the common catalyst, cutting oil supply to both Western and Chinese markets. This alignment is rare and historically produces the strongest returns for real assets.`;
        } else if (allSame) {
          interpretation = `All three economies are in ${us}. When the world's three largest economic blocs agree on the same regime, capital flows are unidirectional and conviction is at its highest. The current picks are supported by global alignment.`;
        } else {
          const regimes = [
            { label: "US", regime: us },
            { label: "Europe", regime: eu },
            { label: "China", regime: cn },
          ];
          const unique = Array.from(new Set(regimes.map((r) => r.regime)));
          if (unique.length === 2) {
            const majority = regimes.filter((r) => r.regime === us).length >= 2 ? us : eu;
            const outlierEntry = regimes.find((r) => r.regime !== majority);
            interpretation = `${regimes.filter((r) => r.regime === majority).map((r) => r.label).join(" and ")} are in ${majority}, while ${outlierEntry?.label} diverges with ${outlierEntry?.regime}. The majority signal (${majority}) dominates global capital flows — position primarily for ${majority} but monitor ${outlierEntry?.label} for signs of convergence or further divergence.`;
          } else {
            interpretation = `Three different regimes across three economies: US (${us}), Europe (${eu}), China (${cn}). No dominant signal — capital flows are fragmented. In this environment, real assets (gold, commodities) tend to outperform as they benefit from uncertainty regardless of which regime wins.`;
          }
        }

        return (
          <section className="px-4 py-8 max-w-5xl mx-auto">
            <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#555]">What this means right now</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22c55e20] text-[#22c55e]">Live</span>
              </div>
              <p className="text-xs text-[#888] leading-relaxed">{interpretation}</p>
            </div>
          </section>
        );
      })()}

      <div className="border-t border-[#181818]" />

      {/* ══ STRUCTURAL THEMES — hold through regime changes ══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-[#e0e0e0] mb-1">Structural Themes</h2>
        <p className="text-xs text-[#555] mb-4">Secular trends that work across all regimes — hold these alongside your regime picks, not instead of them.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {[
            {
              theme: "Energy Transition",
              ticker: "COPX",
              name: "Global X Copper Miners",
              ucits: "COPP.L",
              color: "#22c55e",
              why: "EVs use 3-4x more copper than ICE cars. Grid infrastructure for renewables needs massive copper. Supply constrained — Chile/Peru mines depleting.",
              catalyst: "IEA projects copper demand doubles by 2035. No substitute exists.",
              regime: "Works in all regimes — demand is policy-driven, not cyclical.",
            },
            {
              theme: "European Defence",
              ticker: "EUAD",
              name: "iShares European Defence UCITS",
              ucits: "EUAD.L",
              color: "#6b8e5a",
              why: "NATO Europe defence spending 1.5% → 2.5%+ GDP. €800B ReArm Europe fund. Rheinmetall, BAE, Leonardo, Saab.",
              catalyst: "Government commitments locked in for a decade. Hormuz + Ukraine accelerate.",
              regime: "Works in all regimes — sovereign spending is immune to macro cycles.",
            },
            {
              theme: "De-dollarisation",
              ticker: "GLD",
              name: "SPDR Gold",
              ucits: "SGLD.L",
              color: "#eab308",
              why: "Central banks bought 1,037 tonnes in 2023 — record. USD reserves 72% → 58%. BRICS+ building alternatives. Hormuz weaponises dollar system.",
              catalyst: "Every US sanction accelerates diversification. Trend is multi-decade.",
              regime: "Strong in Stagflation + Deflation. Moderate in others. Never a bad hold during transitions.",
            },
            {
              theme: "AI Infrastructure",
              ticker: "SMH",
              name: "VanEck Semiconductor ETF",
              ucits: "SEMI.L",
              color: "#3b82f6",
              why: "Holds the entire AI supply chain: ASML (lithography monopoly), TSMC (90% of advanced chips), Nvidia (AI GPUs), Broadcom, AMD. No single-stock risk.",
              catalyst: "AI capex cycle is multi-year. Every hyperscaler expanding. Chips Act ($52B US + €43B EU) funds the buildout.",
              regime: "Best in Goldilocks/Reflation. Underperforms in Stagflation but the structural demand is independent of macro.",
            },
          ].map((t) => (
            <div key={t.ticker} className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: t.color }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.color }}>{t.theme}</div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-[#e0e0e0]">{t.ticker}</span>
                <span className="text-[10px] text-[#555]">{t.name}</span>
              </div>
              <p className="text-[10px] text-[#888] leading-relaxed mb-2">{t.why}</p>
              <div className="text-[10px] leading-relaxed mb-1">
                <span className="text-[#e0e0e0] font-bold">Catalyst: </span>
                <span className="text-[#555]">{t.catalyst}</span>
              </div>
              <div className="text-[10px] leading-relaxed mb-2">
                <span className="text-[#e0e0e0] font-bold">Regime fit: </span>
                <span className="text-[#555]">{t.regime}</span>
              </div>
              <div className="text-[10px] text-[#333]">UCITS: {t.ucits}</div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded bg-[#111] border border-[#222]">
          <p className="text-[10px] text-[#888] leading-relaxed">
            <span className="text-[#e0e0e0] font-bold">Why these are different from regime picks:</span> Regime picks rotate when the economic season changes — you sell XLE when Stagflation ends. Structural themes don&apos;t rotate — the energy transition doesn&apos;t stop because the US enters Goldilocks. Hold both: regime picks for the cycle, structural themes for the decade.
          </p>
        </div>

        <SectionChat
          context="Structural themes on the home page. Four secular trends that work across all regimes: Energy Transition (COPX/COPP.L — copper demand doubles by 2035), European Defence (EUAD — €800B fund), De-dollarisation (GLD/SGLD — central bank gold buying), AI Infrastructure (ASML — EUV monopoly). These complement regime picks, not replace them."
          label="Ask about structural themes"
          suggestions={["How do I size structural vs regime positions?", "Which theme has the strongest catalyst right now?", "Are there other structural themes I'm missing?"]}
        />
      </section>

      {/* ══ ENTRY TIMING ══ */}
      {timing.length > 0 && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-lg font-bold text-[#e0e0e0] mb-1">Entry Timing</h2>
          <p className="text-xs text-[#555] mb-4">Should you buy now or wait for a pullback? RSI, distance from 200-day moving average, and drawdown from 52-week high.</p>

          <div className="space-y-2 mb-4">
            {timing.filter((t) => !t.isUcits).map((t) => {
              const signalColor = t.signal === "Strong Buy" ? "#22c55e" : t.signal === "Buy" ? "#22c55e" : t.signal === "Wait for pullback" ? "#eab308" : "#ef4444";
              const rsiColor = t.rsi < 30 ? "#22c55e" : t.rsi < 50 ? "#eab308" : t.rsi > 70 ? "#ef4444" : "#888";
              const maColor = t.vsMa200 < 0 ? "#22c55e" : t.vsMa200 < 10 ? "#eab308" : "#ef4444";
              const ucitsMatch = timing.find((u) => u.isUcits && u.theme === t.theme);
              return (
                <div key={t.ticker} className="p-3 rounded-lg bg-[#111] border border-[#222]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 rounded" style={{ backgroundColor: t.color }} />
                      <div>
                        <span className="text-sm font-bold text-[#e0e0e0]">{t.ticker}</span>
                        <span className="text-[10px] text-[#555] ml-2">{t.theme}</span>
                        {ucitsMatch && <span className="text-[10px] text-[#333] ml-2">UCITS: {ucitsMatch.ticker}</span>}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded" style={{ color: signalColor, backgroundColor: signalColor + "20" }}>
                      {t.signal}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-[10px] text-[#555]">Price</div>
                      <div className="text-xs font-bold text-[#e0e0e0]">${t.price}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#555]">RSI</div>
                      <div className="text-xs font-bold" style={{ color: rsiColor }}>{t.rsi}</div>
                      <div className="text-[8px] text-[#333]">{t.rsi < 30 ? "Oversold" : t.rsi > 70 ? "Overbought" : "Neutral"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#555]">vs 200MA</div>
                      <div className="text-xs font-bold" style={{ color: maColor }}>{t.vsMa200 >= 0 ? "+" : ""}{t.vsMa200}%</div>
                      <div className="text-[8px] text-[#333]">{t.vsMa200 < 0 ? "Below — dip" : t.vsMa200 < 10 ? "Near" : "Extended"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#555]">From High</div>
                      <div className="text-xs font-bold" style={{ color: t.drawdown < -10 ? "#22c55e" : t.drawdown < -5 ? "#eab308" : "#888" }}>{t.drawdown}%</div>
                      <div className="text-[8px] text-[#333]">{t.drawdown < -20 ? "Deep dip" : t.drawdown < -10 ? "Pullback" : "Near high"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded bg-[#111] border border-[#222]">
            <p className="text-[10px] text-[#888] leading-relaxed">
              <span className="text-[#e0e0e0] font-bold">How to read this:</span> &quot;Strong Buy&quot; = RSI oversold + below 200MA + significant drawdown from high. These moments are rare for structural themes — they typically happen during broad market panics (COVID crash, banking crisis). &quot;Extended&quot; = the thesis is intact but the price has run ahead. Consider waiting for a pullback or dollar-cost averaging instead of a lump sum.
            </p>
          </div>

          <SectionChat
            context="Entry timing for structural theme ETFs. Shows RSI, distance from 200-day moving average, and drawdown from 52-week high. Scoring: Strong Buy (oversold + below MA + deep drawdown), Buy, Wait for pullback, Extended. For long-term structural positions, timing matters less but buying dips improves returns."
            label="Ask about entry timing"
            suggestions={["Should I wait for a pullback on COPX?", "What RSI level is a good entry?", "Is dollar-cost averaging better than timing?"]}
          />
        </section>
      )}

      <div className="border-t border-[#181818]" />

      {/* ══ GO DEEPER ══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-[#e0e0e0] mb-4">Go Deeper</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* World Order */}
          <Link href="/world-order" className="block">
            <div className="p-5 rounded-lg bg-[#111] border-l-2 border border-[#222] hover:bg-[#151515] transition-colors h-full" style={{ borderLeftColor: "#b45309" }}>
              <div className="text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: "#b45309" }}>THE THESIS</div>
              <h3 className="text-sm font-bold text-[#e0e0e0] mb-2">World Order Monitor</h3>
              <p className="text-xs text-[#555] leading-relaxed mb-3">
                Why the world order is changing and where capital flows as a result. US decline (Stage 5 of 6), China&apos;s rise (370 ships, BRICS+), European autonomy (EUAD +820%), and the alliance map.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-[#b4530920] text-[#b45309]">Alliance tracker</span>
                <span className="px-1.5 py-0.5 rounded bg-[#b4530920] text-[#b45309]">Historical parallels</span>
                <span className="px-1.5 py-0.5 rounded bg-[#b4530920] text-[#b45309]">Power rankings</span>
              </div>
              <div className="mt-3 text-xs text-[#888]">Open monitor →</div>
            </div>
          </Link>

          {/* Emerging Markets */}
          <Link href="/emerging-markets" className="block">
            <div className="p-5 rounded-lg bg-[#111] border-l-2 border border-[#222] hover:bg-[#151515] transition-colors h-full" style={{ borderLeftColor: "#22c55e" }}>
              <div className="text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: "#22c55e" }}>STRUCTURAL BETS</div>
              <h3 className="text-sm font-bold text-[#e0e0e0] mb-2">Emerging Markets</h3>
              <p className="text-xs text-[#555] leading-relaxed mb-3">
                Six countries positioned to profit from the transition. 5-10 year positions with specific catalysts and dates — India (semiconductor fab 2027), Saudi (Vision 2030), Indonesia (50% global nickel).
              </p>
              <div className="flex flex-wrap gap-2 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-[#22c55e20] text-[#22c55e]">6 countries</span>
                <span className="px-1.5 py-0.5 rounded bg-[#22c55e20] text-[#22c55e]">Catalyst timelines</span>
                <span className="px-1.5 py-0.5 rounded bg-[#22c55e20] text-[#22c55e]">Multi-regime matrix</span>
              </div>
              <div className="mt-3 text-xs text-[#888]">Explore opportunities →</div>
            </div>
          </Link>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Email signup */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <SubscribeForm
          title="Track the transition"
          description="Regime change alerts, daily briefing, and new analysis — delivered when it matters."
          buttonLabel="Notify me"
          source="home_regime_alerts"
          waitlistFeature="home_alerts"
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#555]">
          World Order View — Tracking the world order transition
        </p>
        <p className="text-xs text-[#333] mt-2 max-w-xl mx-auto">
          This website is for educational and informational purposes only. Nothing on this site constitutes personalised financial advice. All analysis is generated systematically from public economic data. Past performance does not guarantee future results.
        </p>
        <div className="flex gap-4 justify-center mt-3">
          <a href="/disclaimer" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Disclaimer</a>
          <a href="/terms" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Terms of Service</a>
        </div>
        <p className="text-xs text-[#555] mt-4">
          Built by Lucas Rodrigues — turning economic data into investment signals. <a href="https://www.linkedin.com/in/lucas-rodrigues-27a51b1a3/" target="_blank" rel="noopener noreferrer" className="hover:text-[#888] underline underline-offset-2">LinkedIn</a>
        </p>
      </footer>
    </main>
  );
}
