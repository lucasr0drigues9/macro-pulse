"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import SectionChat from "@/components/SectionChat";
import WorldOrderPosition from "@/components/WorldOrderPosition";
import { ACCENT, GOLD, morocco, countries, regimeAlignment, type CountryEM } from "@/lib/emergingData";

function CountryCard({ c, featured }: { c: CountryEM; featured?: boolean }) {
  const [open, setOpen] = useState(false);

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
        {c.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {c.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#181818] text-[#555]">{t}</span>
            ))}
          </div>
        )}
        <div className="space-y-1">
          {c.whyBenefits.map((b, i) => (
            <p key={i} className="text-xs text-[#888] leading-relaxed">{"\u2192"} {b}</p>
          ))}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#222]">
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 mb-4">
            {c.metrics.map((m) => (
              <div key={m.label} className="p-2 rounded bg-[#0a0a0a]">
                <div className="text-[10px] text-[#555]">{m.label}</div>
                <div className="text-xs font-bold" style={{ color: featured ? GOLD : ACCENT }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Determinants */}
          <div className="mb-4">
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Dalio&apos;s Determinants</div>
            <div className="space-y-1">
              {c.determinants.map((d) => (
                <div key={d.label} className="flex items-start gap-2 text-xs">
                  <span className="shrink-0">{d.emoji}</span>
                  <span className="text-[#888] w-36 shrink-0">{d.label}</span>
                  <span className="text-[#555]">{d.note}</span>
                </div>
              ))}
            </div>
          </div>

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

          {/* Regime Alignment */}
          <div className="mb-4">
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Regime Alignment</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {c.regimeAlignment.map((r) => (
                <div key={r.regime} className="p-2 rounded bg-[#0a0a0a] text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <span>{r.emoji}</span>
                    <span className="text-[#888]">{r.regime}</span>
                    <span>{r.rating}</span>
                  </div>
                  <div className="text-[10px] text-[#333]">{r.note}</div>
                </div>
              ))}
            </div>
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

type SortKey = "name" | "signal" | "gdp" | "euLink" | "etfReturn";

export default function EmergingMarketsPage() {
  const allCountries = [morocco, ...countries];

  const [sortKey, setSortKey] = useState<SortKey>("signal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...allCountries].sort((a, b) => {
    let va: string | number, vb: string | number;
    switch (sortKey) {
      case "name": va = a.name; vb = b.name; break;
      case "signal": va = a.signal === "Strong" ? 1 : 0; vb = b.signal === "Strong" ? 1 : 0; break;
      case "gdp": va = parseFloat(a.gdpGrowth); vb = parseFloat(b.gdpGrowth); break;
      case "euLink": va = a.euAutonomyLink; vb = b.euAutonomyLink; break;
      case "etfReturn": va = a.bestETFReturn; vb = b.bestETFReturn; break;
      default: va = 0; vb = 0;
    }
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Header */}
      <section className="px-4 pt-12 pb-4 max-w-5xl mx-auto">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">Emerging Markets</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          The multipolar world creates winners beyond the US and China.
        </p>
        <p className="text-sm text-[#555] max-w-2xl">
          Six economies positioned to benefit from the world order transition — tracking why and how to invest.
        </p>
      </section>

      {/* Why Now */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-4">The Multipolar Opportunity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#3b82f6" }}>
            <div className="text-xs font-bold text-[#3b82f6] mb-2">The Decoupling Dividend</div>
            <p className="text-xs text-[#888] leading-relaxed">
              As the US and China decouple, global supply chains must relocate. Countries with young populations, competitive costs, and strategic neutrality become the factories of the next world order. India and Morocco are the primary beneficiaries — India for scale, Morocco for European proximity.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#eab308" }}>
            <div className="text-xs font-bold text-[#eab308] mb-2">The Commodity Premium</div>
            <p className="text-xs text-[#888] leading-relaxed">
              World order transitions create sustained commodity demand — rearmament requires metals, energy insecurity drives resource premiums. Brazil and Saudi Arabia hold what the transition runs on.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: ACCENT }}>
            <div className="text-xs font-bold mb-2" style={{ color: ACCENT }}>The Swing State Advantage</div>
            <p className="text-xs text-[#888] leading-relaxed">
              Countries refusing to choose sides can trade with both powers and extract concessions from both. India perfected this. Turkey, Saudi Arabia, and Indonesia are playing the same game.
            </p>
          </div>
        </div>
        <SectionChat
          context="The multipolar opportunity section. As US-China competition intensifies, swing states (India, Turkey, Saudi Arabia, Indonesia, Brazil, Morocco) capture the decoupling opportunity. They trade with both powers and extract concessions from both sides."
          label="Ask about emerging markets"
          suggestions={["Which swing state benefits most from Hormuz?", "Is India the safest emerging market bet?", "How does de-dollarisation help these countries?"]}
        />
      </section>

      {/* Morocco Featured */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Overlooked Opportunity</h2>
          <p className="text-xs text-[#555]">Most emerging market analysis misses the country in Europe&apos;s backyard that benefits most from European strategic autonomy.</p>
        </div>
        <CountryCard c={morocco} featured />
      </section>

      {/* Five Core Economies */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Five More Opportunities</h2>
        <p className="text-xs text-[#555] mb-6">Swing states, commodity exporters, and decoupling beneficiaries. Click for full analysis.</p>
        <div className="space-y-3">
          {countries.map((c) => <CountryCard key={c.name} c={c} />)}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Six Economies — Side by Side</h2>
        <p className="text-xs text-[#555] mb-4">Click column headers to sort</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#555] uppercase tracking-wider border-b border-[#222]">
                <th className="text-left py-2 pr-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("name")}>Country{arrow("name")}</th>
                <th className="text-center py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("signal")}>Signal{arrow("signal")}</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Thesis</th>
                <th className="text-left py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("euLink")}>EU Link{arrow("euLink")}</th>
                <th className="text-right py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("gdp")}>GDP{arrow("gdp")}</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Commodity</th>
                <th className="text-right py-2 px-2">ETF</th>
                <th className="text-right py-2 pl-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("etfReturn")}>1Y{arrow("etfReturn")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.name} className="border-b border-[#181818]" style={c.name === "Morocco" ? { backgroundColor: GOLD + "08" } : {}}>
                  <td className="py-3 pr-2 font-bold text-[#e0e0e0]">{c.flag} {c.name}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: c.signalColor, backgroundColor: c.signalColor + "20" }}>{c.signal}</span>
                  </td>
                  <td className="py-3 px-2 text-[#555] hidden sm:table-cell text-[10px]">{c.primaryThesis}</td>
                  <td className="py-3 px-2 text-[10px]" style={{ color: "#3b82f6" }}>{c.euAutonomyLink}</td>
                  <td className="py-3 px-2 text-right" style={{ color: ACCENT }}>{c.gdpGrowth}</td>
                  <td className="py-3 px-2 text-[#555] hidden sm:table-cell text-[10px]">{c.keyCommodity}</td>
                  <td className="py-3 px-2 text-right text-[#888]">{c.bestETF}</td>
                  <td className={`py-3 pl-2 text-right font-bold ${c.bestETFReturn >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {c.bestETFReturn >= 0 ? "+" : ""}{c.bestETFReturn}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* EU Autonomy Connection */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-4">How European Independence Creates Emerging Market Demand</h2>
        <p className="text-xs text-[#888] leading-relaxed mb-4">
          European strategic autonomy is not just a European story. The {"\u20AC"}800 billion ReArm Europe fund, the LNG terminal buildout, the critical materials strategy, and the manufacturing relocation away from China all create direct demand flowing to emerging markets. Morocco gets manufacturing and solar contracts. Gulf states get energy contracts. India gets supply chain investment. Indonesia gets battery material contracts. The European page tracks the companies enabling this shift. This page tracks the economies that supply it.
        </p>
        <div className="text-center">
          <Link href="/europe" className="inline-block px-6 py-2 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors">
            View European Autonomy Tracker {"\u2192"}
          </Link>
        </div>
      </section>

      {/* Regime Alignment */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Which Emerging Markets Perform Best Right Now</h2>
        <p className="text-xs text-[#555] mb-4">Accounting for both US Stagflation and China Deflation</p>

        <div className="space-y-2 mb-4">
          {regimeAlignment.map((r) => (
            <div key={r.regime} className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-start gap-2"
              style={{ backgroundColor: r.current ? ACCENT + "10" : "#111", borderColor: r.current ? ACCENT + "40" : "#222" }}>
              <div className="flex items-center gap-2 sm:w-32 shrink-0">
                <span>{r.emoji}</span>
                <span className={`text-sm font-bold ${r.current ? "text-[#e0e0e0]" : "text-[#555]"}`}>{r.regime}</span>
                {r.current && <span className="text-[10px] font-bold" style={{ color: ACCENT }}>NOW</span>}
              </div>
              <div className="flex-1 text-xs text-[#888]">{r.performance}</div>
              <div className="text-xs text-[#555] sm:w-28 sm:text-right shrink-0">{r.bestETFs}</div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded bg-[#111] border border-[#222]">
          <p className="text-xs text-[#888] leading-relaxed">
            Current US regime is <span className="text-[#ef4444] font-bold">Stagflation</span> while China is in <span className="text-[#3b82f6] font-bold">Deflation</span>. Saudi Arabia benefits from energy supply shock. India resilient on domestic demand. Commodity exporters to China (Brazil iron ore, Indonesia nickel) face mixed signals. Morocco&apos;s phosphate premium rises on food security fears.{" "}
            <Link href="/regimetracker" className="underline underline-offset-2 hover:text-[#e0e0e0]" style={{ color: ACCENT }}>US regime {"\u2192"}</Link>{" "}
            <Link href="/china" className="underline underline-offset-2 hover:text-[#e0e0e0]" style={{ color: "#3b82f6" }}>China tracker {"\u2192"}</Link>
          </p>
        </div>

        <p className="mt-3 text-[10px] text-[#333] italic text-center">
          Regime alignment shows short-term fit. All six have structural multi-year theses regardless of current regime.
        </p>
        <SectionChat
          context="Emerging market regime alignment. Shows how each country (India, Brazil, Saudi Arabia, Indonesia, Turkey, Morocco) performs under each of the four macro regimes. Some benefit from Stagflation (commodity exporters), others from Goldilocks (growth stories). Current US regime: Stagflation."
          label="Ask about EM regime fit"
          suggestions={["Which EM benefits most from current Stagflation?", "What if the US shifts to Goldilocks?", "Is India overvalued?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      <WorldOrderPosition
        title="Emerging Markets in the World Order Transition"
        subtitle="Three reasons swing states capture disproportionate value during power transitions"
        cards={[
          {
            title: "The Non-Alignment Premium",
            content: "India, Turkey, Saudi Arabia, Indonesia, and Brazil refuse to choose sides in the US-China competition. This neutrality is a strategic asset — they trade with both powers, receive investment from both, and extract concessions by threatening to align with the other. India buys Russian oil at a discount AND receives US tech transfer. Saudi sells oil to China in yuan AND maintains its US security guarantee.",
            keyMetric: "6 swing states = 40% of world population",
            status: "Expanding",
          },
          {
            title: "Supply Chain Rerouting",
            content: "As US-China decoupling accelerates, global supply chains are rerouting through neutral countries. Vietnam, India, Mexico, Morocco, and Indonesia are the primary beneficiaries. Apple moved iPhone production to India. Tesla is building in Mexico. European manufacturers are moving to Morocco. This isn't temporary — it's a structural shift that creates decade-long growth runways.",
            keyMetric: "India FDI: +35% YoY (2024)",
            status: "Accelerating",
          },
          {
            title: "Commodity Leverage",
            content: "The energy transition AND the Hormuz crisis give commodity-rich EMs unprecedented leverage. Indonesia controls 50% of global nickel. Brazil has critical rare earths. Saudi Arabia can swing oil markets. Turkey controls the Bosphorus. In a world where physical resources matter more than financial assets, these countries gain pricing power that translates directly into GDP growth and currency strength.",
            keyMetric: "Indonesia: 50% of global nickel",
            status: "Critical",
          },
        ]}
        accent={ACCENT}
        chatContext="Emerging markets in the world order transition. Non-alignment premium (swing states trade with both powers), supply chain rerouting (Apple to India, Tesla to Mexico, EU to Morocco), commodity leverage (Indonesia nickel, Saudi oil, Turkey Bosphorus). How Hormuz closure amplifies EM commodity leverage."
        chatSuggestions={[
          "Which EM benefits most from Hormuz closure?",
          "Is supply chain rerouting permanent?",
          "How do I invest in the non-alignment premium?",
        ]}
      />

      <div className="border-t border-[#181818]" />

      {/* Email signup */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <SubscribeForm
          title="Track Emerging Market Opportunities"
          description="Get notified when a significant shift occurs in any of the six tracked economies or when European autonomy spending creates new demand."
          buttonLabel="Track opportunities"
          source="emerging_markets"
          waitlistFeature="emerging_markets"
          accent={ACCENT}
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          Emerging market investments carry additional risks including currency volatility, political instability, lower liquidity, and less regulatory protection. Country-specific risks noted above. Not personalised financial advice. Always do your own research.
        </p>
      </footer>
    </main>
  );
}
