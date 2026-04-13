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
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setUsAlloc(d); }).catch(() => {});
    fetch(apiUrl("/api/eu/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setEuAlloc(d); }).catch(() => {});
    fetch(apiUrl("/api/china/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setCnAlloc(d); }).catch(() => {});
    fetch(apiUrl("/api/interpretation")).then((r) => r.json()).then((d) => { if (d.interpretation || d.situation) setAiInterpretation(d.interpretation || d.situation); }).catch(() => {});
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

      {/* ══ WHAT TO OWN RIGHT NOW ══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-[#e0e0e0] mb-1">What to Own Right Now</h2>
        <p className="text-xs text-[#555] mb-4">ETF picks for each regime — conviction-weighted with live returns since the regime started.</p>

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

      {/* AI Interpretation — only show if it matches current regimes */}
      {aiInterpretation && (() => {
        const usRegime = usAlloc?.regime || "";
        const euRegime = euAlloc?.regime || "";
        const cnRegime = cnAlloc?.regime || "";
        const text = aiInterpretation.toLowerCase();
        // Check if the interpretation mentions regimes that don't match current signals
        const stale = (usRegime && text.includes("stagflation") && usRegime !== "Stagflation" && !text.includes(usRegime.toLowerCase()))
          || (euRegime && text.includes("europe") && text.includes("stagflation") && euRegime !== "Stagflation")
          || (cnRegime && text.includes("china") && text.includes("deflation") && cnRegime !== "Deflation");

        return (
          <section className="px-4 py-8 max-w-5xl mx-auto">
            <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#555]">What this means right now</span>
                <div className="flex items-center gap-2">
                  {stale && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#eab30820] text-[#eab308]">May be stale</span>}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#222] text-[#555]">AI synthesis</span>
                </div>
              </div>
              {stale && (
                <p className="text-[10px] text-[#eab308] mb-2">
                  This interpretation may reference outdated regime readings. The live signals above are more current.
                </p>
              )}
              <p className="text-xs text-[#888] italic leading-relaxed">{aiInterpretation}</p>
              <p className="text-[10px] text-[#333] mt-2">
                AI-generated interpretation. Refreshes every 24 hours. ETF mentions for educational purposes only.
              </p>
            </div>
          </section>
        );
      })()}

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
