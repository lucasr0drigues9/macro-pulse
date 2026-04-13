"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import { ACCENT, GOLD, morocco, countries, type CountryEM } from "@/lib/emergingData";

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

      {/* Thesis now on World Order page */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
          <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">The Bigger Picture</h2>
          <p className="text-lg font-bold text-[#e0e0e0] mb-2">Why Emerging Markets Win in the Transition</p>
          <p className="text-xs text-[#555] mb-4 max-w-md mx-auto">
            Non-alignment premium, supply chain rerouting, commodity leverage — the thesis is now part of the World Order Monitor.
          </p>
          <a href="/world-order" className="inline-block px-6 py-3 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors">
            View the full world order narrative &rarr;
          </a>
        </div>
      </section>



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
