"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import SectionChat from "@/components/SectionChat";
import { ACCENT, GOLD, morocco, countries, type CountryEM } from "@/lib/emergingData";

// Structural data per country — catalysts, multi-regime matrix, long-term returns
const STRUCTURAL: Record<string, {
  return3y: number; return5y: number;
  catalysts: { event: string; date: string; impact: string }[];
  globalRegimeMatrix: { scenario: string; effect: string; fit: "strong" | "moderate" | "weak" }[];
  timeHorizon: string;
}> = {
  Morocco: {
    return3y: 8.2, return5y: 22.5,
    catalysts: [
      { event: "Xlinks Morocco-UK solar cable", date: "2029", impact: "3.6GW of Saharan solar directly to UK grid — transforms Morocco into European energy exporter" },
      { event: "Renault/Stellantis EV factory expansion", date: "2026-2027", impact: "Morocco becomes Europe's primary EV manufacturing nearshore hub" },
      { event: "OCP Group phosphate capacity doubling", date: "2027", impact: "Global food security dependency on Morocco deepens" },
    ],
    globalRegimeMatrix: [
      { scenario: "US Stagflation + EU Rebuilding", effect: "Strongest combination. EU autonomy spending flows directly to Morocco (manufacturing, solar, fertiliser).", fit: "strong" },
      { scenario: "China Deflation + EU Rebuilding", effect: "Positive. EU diversifying supply chains from China to North Africa. Morocco captures manufacturing relocations.", fit: "strong" },
      { scenario: "Global Goldilocks", effect: "Moderate. Growth benefits Morocco but the structural premium diminishes when everyone is growing.", fit: "moderate" },
      { scenario: "Global Deflation", effect: "Defensive. Phosphate demand is inelastic (food security), but manufacturing orders slow.", fit: "moderate" },
    ],
    timeHorizon: "5-10 years. Xlinks cable (2029), EV hub (2027), phosphate expansion (2027). The thesis plays out regardless of short-term regime — it's policy-driven EU spending.",
  },
  India: {
    return3y: 32.1, return5y: 68.4,
    catalysts: [
      { event: "First semiconductor fab production (Tata + TSMC)", date: "2027", impact: "India enters chip manufacturing — reduces China dependency for Asia" },
      { event: "UPI digital payments international expansion", date: "2025-2026", impact: "India's payment rail becomes EM standard — network effect monetisation" },
      { event: "Indian middle class crosses 500M", date: "2028", impact: "Domestic consumption becomes self-sustaining growth engine" },
    ],
    globalRegimeMatrix: [
      { scenario: "US Stagflation + China Deflation", effect: "Strong. Supply chains reroute from China to India. US seeks alternative manufacturing partner.", fit: "strong" },
      { scenario: "US Goldilocks + China Reflation", effect: "Mixed. Less urgency to diversify from China. India's growth premium narrows.", fit: "weak" },
      { scenario: "Global Reflation", effect: "Positive. Commodity demand lifts Indian industrials. IT exports surge on global capex.", fit: "strong" },
      { scenario: "Global Deflation", effect: "Challenging. India's growth story needs global demand. FDI slows.", fit: "weak" },
    ],
    timeHorizon: "3-7 years. Semiconductor fab (2027), middle class inflection (2028). Near-term regime matters — India underperforms in Stagflation due to oil import dependency.",
  },
  Brazil: {
    return3y: -8.5, return5y: 15.2,
    catalysts: [
      { event: "Pre-salt oil production ramp", date: "Ongoing", impact: "Brazil becomes top-5 global oil producer — Petrobras undervalued vs reserves" },
      { event: "Critical minerals (niobium, rare earths) strategy", date: "2026+", impact: "Brazil holds 98% of global niobium — essential for steel and aerospace alloys" },
      { event: "Amazon carbon credit market", date: "2027", impact: "Monetising the rainforest through carbon offsets — new revenue stream" },
    ],
    globalRegimeMatrix: [
      { scenario: "US Stagflation + Energy crisis", effect: "Strongest combination. Oil and commodity prices elevated. Real appreciates on commodity exports.", fit: "strong" },
      { scenario: "China Reflation", effect: "Very positive. China is Brazil's largest trade partner. Iron ore and soy demand surges.", fit: "strong" },
      { scenario: "Global Goldilocks", effect: "Moderate. Commodity prices stable but no premium. Carry trade attractive with high Selic rate.", fit: "moderate" },
      { scenario: "Global Deflation", effect: "Negative. Commodity prices collapse. Real weakens. Capital flight to USD.", fit: "weak" },
    ],
    timeHorizon: "3-5 years. Oil production ramp is immediate. Niobium thesis is 5+ years. Short-term returns driven by commodity cycle + Selic rate decisions.",
  },
  "Saudi Arabia": {
    return3y: 12.8, return5y: 45.3,
    catalysts: [
      { event: "Vision 2030 non-oil GDP milestones", date: "2026-2030", impact: "Tourism (NEOM, Red Sea), entertainment, and tech sectors diversify revenue" },
      { event: "Aramco secondary offering", date: "2026", impact: "Capital raising for diversification — signals confidence in transition" },
      { event: "BRICS+ payment infrastructure buildout", date: "2025-2027", impact: "Saudi becomes financial hub for non-dollar energy trade" },
    ],
    globalRegimeMatrix: [
      { scenario: "US Stagflation + Hormuz crisis", effect: "Strongest. Oil revenue surges. Alternative supply route status (Red Sea) becomes premium.", fit: "strong" },
      { scenario: "China Deflation", effect: "Negative for oil demand but positive for yuan settlement infrastructure buildout.", fit: "moderate" },
      { scenario: "Global Reflation", effect: "Very positive. Oil demand + Vision 2030 investment cycle + tourism opening.", fit: "strong" },
      { scenario: "Global Deflation", effect: "Challenging. Oil revenue falls. Vision 2030 spending hard to sustain.", fit: "weak" },
    ],
    timeHorizon: "5-10 years. Vision 2030 is the thesis. Short-term driven by oil price (Hormuz = strong tailwind). The non-oil diversification is the multi-decade bet.",
  },
  Indonesia: {
    return3y: -5.2, return5y: 12.8,
    catalysts: [
      { event: "Nickel downstream processing (battery-grade)", date: "2025-2027", impact: "Indonesia moves from raw nickel export to battery component manufacturing — 10x value capture" },
      { event: "New capital city Nusantara", date: "2028+", impact: "$32B infrastructure spend — construction, materials, real estate boom" },
      { event: "RCEP trade bloc maturation", date: "Ongoing", impact: "Indonesia positioned as ASEAN manufacturing hub within world's largest trade bloc" },
    ],
    globalRegimeMatrix: [
      { scenario: "US Stagflation + Energy transition", effect: "Strong. Nickel demand for batteries rises. Indonesia names the price.", fit: "strong" },
      { scenario: "China competition for nickel supply", effect: "Very positive. Both US and China court Indonesia for battery supply chain access.", fit: "strong" },
      { scenario: "Global Goldilocks", effect: "Positive. Manufacturing investment flows to ASEAN. Domestic consumption grows.", fit: "moderate" },
      { scenario: "Global Deflation", effect: "Negative. Commodity demand falls. Nickel premium disappears.", fit: "weak" },
    ],
    timeHorizon: "5-10 years. Nickel downstream processing (2025-2027) is the near-term catalyst. New capital (2028+) is the medium-term. Structural position in battery supply chain is the decade-long thesis.",
  },
  Turkey: {
    return3y: 42.5, return5y: 18.6,
    catalysts: [
      { event: "Bosphorus transit fee restructuring", date: "Ongoing", impact: "Turkey controls the only passage between Black Sea and Mediterranean — pricing power increasing" },
      { event: "Defence industry exports (Bayraktar, ASELSAN)", date: "Ongoing", impact: "Turkish drones proven in Ukraine, Libya, Azerbaijan — order book growing exponentially" },
      { event: "Gas hub ambitions (Russian + Azeri gas)", date: "2026+", impact: "Turkey positioning as Europe's alternative gas transit hub" },
    ],
    globalRegimeMatrix: [
      { scenario: "US Stagflation + EU energy crisis", effect: "Strong. Bosphorus premium. Gas hub value. Defence exports surge.", fit: "strong" },
      { scenario: "Russia-Ukraine resolution", effect: "Mixed. Bosphorus premium falls but reconstruction trade flows through Turkey.", fit: "moderate" },
      { scenario: "Global Goldilocks", effect: "Positive. Tourism booms. Lira stabilises. Manufacturing investment flows.", fit: "moderate" },
      { scenario: "Global Deflation", effect: "Negative. Turkey's high inflation + external debt = vulnerable in risk-off.", fit: "weak" },
    ],
    timeHorizon: "3-5 years. Defence exports and gas hub are near-term. Bosphorus pricing power is permanent. Risk: lira volatility can wipe out equity returns for foreign investors even if the thesis plays out.",
  },
};

function CountryCard({ c, featured }: { c: CountryEM; featured?: boolean }) {
  const [open, setOpen] = useState(false);
  const structural = STRUCTURAL[c.name];

  return (
    <div className="rounded-lg bg-[#111] border overflow-hidden" style={{ borderColor: featured ? GOLD + "60" : "#222" }}>
      <button onClick={() => setOpen(!open)} className="w-full p-4 text-left hover:bg-[#151515] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{c.flag}</span>
            <span className="text-sm font-bold text-[#e0e0e0]">{c.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: c.allianceColor, backgroundColor: c.allianceColor + "20" }}>{c.alliance}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: c.signalColor, backgroundColor: c.signalColor + "20" }}>{c.signal}</span>
          </div>
          <span className="text-[#555] text-sm shrink-0 ml-2">{open ? "−" : "+"}</span>
        </div>
        {/* Quick stats row */}
        <div className="flex flex-wrap gap-3 mb-2 text-[10px]">
          <span className="text-[#888]">GDP: <span style={{ color: ACCENT }}>{c.gdpGrowth}</span></span>
          <span className="text-[#888]">ETF: <span className="text-[#e0e0e0] font-bold">{c.bestETF}</span></span>
          <span className={c.bestETFReturn >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>1Y: {c.bestETFReturn >= 0 ? "+" : ""}{c.bestETFReturn}%</span>
          {structural && <span className={structural.return3y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>3Y: {structural.return3y >= 0 ? "+" : ""}{structural.return3y}%</span>}
          {structural && <span className={structural.return5y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>5Y: {structural.return5y >= 0 ? "+" : ""}{structural.return5y}%</span>}
        </div>
        <div className="space-y-1">
          {c.whyBenefits.slice(0, 2).map((b, i) => (
            <p key={i} className="text-xs text-[#888] leading-relaxed">{"\u2192"} {b}</p>
          ))}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#222]">
          {/* Time Horizon */}
          {structural && (
            <div className="mt-4 p-3 rounded bg-[#0a0a0a] border border-[#181818] mb-4">
              <div className="text-[10px] text-[#eab308] uppercase tracking-wider mb-1">Investment Horizon</div>
              <p className="text-xs text-[#888] leading-relaxed">{structural.timeHorizon}</p>
            </div>
          )}

          {/* Catalysts with dates */}
          {structural && (
            <div className="mb-4">
              <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Catalysts &amp; Timeline</div>
              <div className="space-y-2">
                {structural.catalysts.map((cat) => (
                  <div key={cat.event} className="flex gap-3 text-xs">
                    <span className="text-[#eab308] font-bold shrink-0 w-16">{cat.date}</span>
                    <div>
                      <span className="text-[#e0e0e0] font-bold">{cat.event}</span>
                      <p className="text-[10px] text-[#555] mt-0.5">{cat.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Global Regime Matrix */}
          {structural && (
            <div className="mb-4">
              <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">How Global Regimes Affect {c.name}</div>
              <div className="space-y-1.5">
                {structural.globalRegimeMatrix.map((g) => {
                  const fitColor = g.fit === "strong" ? "#22c55e" : g.fit === "moderate" ? "#eab308" : "#ef4444";
                  return (
                    <div key={g.scenario} className="flex items-start gap-2 text-xs p-2 rounded bg-[#0a0a0a]">
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: fitColor }} />
                      <div>
                        <span className="text-[#e0e0e0] font-bold">{g.scenario}</span>
                        <p className="text-[10px] text-[#555]">{g.effect}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETFs */}
          <div className="mb-4">
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Investment Options</div>
            <div className="space-y-2">
              {c.etfs.map((etf) => (
                <div key={etf.ticker} className="flex items-center justify-between p-2 rounded bg-[#0a0a0a]">
                  <div>
                    <span className="text-sm font-bold text-[#e0e0e0]">{etf.ticker}</span>
                    <span className="text-[10px] text-[#555] ml-2">{etf.name}</span>
                    <div className="text-[10px] text-[#333]">{etf.topHoldings} · ER: {etf.expense}</div>
                  </div>
                  <span className={`text-xs font-bold ${etf.return1y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {etf.return1y >= 0 ? "+" : ""}{etf.return1y}%
                  </span>
                </div>
              ))}
            </div>
            {c.etfNote && <p className="text-[10px] text-[#555] mt-2 italic">{c.etfNote}</p>}
          </div>

          {/* Risks */}
          <div>
            <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-2">Risk Factors</div>
            <div className="space-y-1">
              {c.risks.map((r, i) => (
                <p key={i} className="text-[10px] text-[#555]">{"\u2192"} {r}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmergingMarketsPage() {
  const allCountries = [morocco, ...countries];

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Header */}
      <section className="px-4 pt-12 pb-4 max-w-5xl mx-auto">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">Emerging Markets</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Structural bets on the world order transition — not regime trades.
        </p>
        <p className="text-xs text-[#555] max-w-2xl mb-2">
          These are 5-10 year positions in countries that benefit from the power transition itself — regardless of which quarter the US economy is in. The regime accelerates or slows the thesis, but doesn&apos;t change it.
        </p>
        <div className="p-3 rounded bg-[#111] border border-[#eab30830] mt-4 mb-4" style={{ backgroundColor: "#eab30808" }}>
          <p className="text-xs text-[#888] leading-relaxed">
            <span className="text-[#eab308] font-bold">Different time horizon:</span> The regime tracker rotates monthly based on FRED data. These positions are structural — you hold them through regime changes because the underlying catalyst (supply chain rerouting, commodity pricing power, demographic growth) takes years to play out. 1-year ETF returns tell you almost nothing about whether the thesis is working. Look at the catalysts and timelines instead.
          </p>
        </div>
        <SectionChat
          context="Emerging markets page. Six countries as structural 5-10 year bets on the world order transition. Not regime trades — these are held through regime changes. Key insight: 3 global regimes matter (US, EU, China), not just US."
          label="Ask about emerging markets"
          suggestions={["What's the difference between regime trades and structural bets?", "Which country has the nearest catalyst?", "Best EM for a Nordnet ASK account?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* The Investable Summary */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Six Countries. Six Structural Bets.</h2>
        <p className="text-xs text-[#555] mb-4">Best ETF per country with 1Y, 3Y, and 5Y returns. Green/red dots show how each combination of global regimes affects the thesis.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {allCountries.map((c) => {
            const bestEtf = c.etfs[0];
            const structural = STRUCTURAL[c.name];
            if (!bestEtf) return null;
            return (
              <div key={c.name} className="p-3 rounded-lg bg-[#111] border border-[#222]" style={c.name === "Morocco" ? { borderColor: GOLD + "40" } : {}}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.flag}</span>
                    <span className="text-sm font-bold text-[#e0e0e0]">{c.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[#e0e0e0]">{bestEtf.ticker}</span>
                </div>
                {/* Returns row */}
                <div className="flex gap-3 mb-2 text-xs">
                  <span className={bestEtf.return1y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
                    1Y: {bestEtf.return1y >= 0 ? "+" : ""}{bestEtf.return1y}%
                  </span>
                  {structural && (
                    <>
                      <span className={structural.return3y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
                        3Y: {structural.return3y >= 0 ? "+" : ""}{structural.return3y}%
                      </span>
                      <span className={structural.return5y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
                        5Y: {structural.return5y >= 0 ? "+" : ""}{structural.return5y}%
                      </span>
                    </>
                  )}
                </div>
                {/* Global regime fit dots */}
                {structural && (
                  <div className="flex gap-1.5">
                    {structural.globalRegimeMatrix.map((g) => {
                      const fitColor = g.fit === "strong" ? "#22c55e" : g.fit === "moderate" ? "#eab308" : "#ef4444";
                      return (
                        <div key={g.scenario} className="flex items-center gap-1" title={g.scenario}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fitColor }} />
                          <span className="text-[8px] text-[#555]">{g.scenario.split("+")[0].trim().replace("US ", "").replace("Global ", "").replace("China ", "CN ")}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Next catalyst */}
                {structural && structural.catalysts[0] && (
                  <div className="mt-2 text-[10px] text-[#555]">
                    Next: <span className="text-[#eab308]">{structural.catalysts[0].date}</span> — {structural.catalysts[0].event}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Country Deep Dives */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Country Analysis</h2>
        <p className="text-xs text-[#555] mb-6">Click for catalysts + timeline, global regime matrix, all ETF options, and risk factors.</p>

        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: GOLD }}>Featured — the overlooked opportunity</div>
          <CountryCard c={morocco} featured />
        </div>

        <div className="space-y-3">
          {countries.map((c) => <CountryCard key={c.name} c={c} />)}
        </div>

        <SectionChat
          context="Country deep dives with catalysts and timelines, global regime matrix (how US+EU+China regimes combine to affect each country), all ETF options, and risks. Structural 5-10 year positions."
          label="Ask about a specific country"
          suggestions={["Compare India vs Indonesia", "Which has the nearest catalyst?", "Best country if China reflates?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* World Order link */}
      <section className="px-4 py-6 max-w-5xl mx-auto">
        <div className="p-4 rounded-lg bg-[#111] border border-[#222] text-center">
          <p className="text-xs text-[#555] mb-3">
            Why swing states win during power transitions — the full thesis with historical parallels.
          </p>
          <a href="/world-order" className="inline-block px-5 py-2 rounded bg-[#222] text-xs text-[#e0e0e0] hover:bg-[#333] transition-colors">
            Full world order thesis →
          </a>
        </div>
      </section>

      {/* Email signup */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <SubscribeForm
          title="Track Emerging Market Opportunities"
          description="Get notified when catalysts fire or global regime shifts change the EM outlook."
          buttonLabel="Track opportunities"
          source="emerging_markets"
          waitlistFeature="emerging_markets"
          accent={ACCENT}
        />
      </section>

      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          Emerging market investments carry additional risks including currency volatility, political instability, lower liquidity, and less regulatory protection. Not personalised financial advice.
        </p>
      </footer>
    </main>
  );
}
