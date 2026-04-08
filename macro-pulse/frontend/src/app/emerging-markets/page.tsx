"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { ACCENT, countries, regimeAlignment, type CountryEM } from "@/lib/emergingData";

type SortKey = "name" | "signal" | "gdp" | "chinaT" | "usT" | "etfReturn";

function CountryCard({ c }: { c: CountryEM }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-4 text-left hover:bg-[#151515] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{c.flag}</span>
            <span className="text-sm font-bold text-[#e0e0e0]">{c.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: c.allianceColor, backgroundColor: c.allianceColor + "20" }}>
              {c.alliance}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: c.signalColor, backgroundColor: c.signalColor + "20" }}>
              {c.signal}
            </span>
            <span className="text-[#555] text-sm">{open ? "−" : "+"}</span>
          </div>
        </div>
        <div className="space-y-1">
          {c.whyBenefits.map((b, i) => (
            <p key={i} className="text-xs text-[#888] leading-relaxed">→ {b}</p>
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
                <div className="text-xs font-bold" style={{ color: ACCENT }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Determinants */}
          <div className="mb-4">
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Dalio&apos;s Determinants</div>
            <div className="space-y-1">
              {c.determinants.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-xs">
                  <span>{d.emoji}</span>
                  <span className="text-[#888] w-36">{d.label}</span>
                  <span className="text-[#555]">{d.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ETFs */}
          <div className="mb-4">
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Investment ETFs</div>
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
          </div>

          {/* Risks */}
          <div>
            <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-2">Risk Factors</div>
            <div className="space-y-1">
              {c.risks.map((r, i) => (
                <p key={i} className="text-[10px] text-[#555]">→ {r}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmergingMarketsPage() {
  const [sortKey, setSortKey] = useState<SortKey>("signal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...countries].sort((a, b) => {
    let va: string | number, vb: string | number;
    switch (sortKey) {
      case "name": va = a.name; vb = b.name; break;
      case "signal": va = a.signal === "Strong" ? 1 : 0; vb = b.signal === "Strong" ? 1 : 0; break;
      case "gdp": va = parseFloat(a.gdpGrowth); vb = parseFloat(b.gdpGrowth); break;
      case "chinaT": va = parseFloat(a.chinaTradeShare); vb = parseFloat(b.chinaTradeShare); break;
      case "usT": va = parseFloat(a.usTradeShare); vb = parseFloat(b.usTradeShare); break;
      case "etfReturn": va = a.bestETFReturn; vb = b.bestETFReturn; break;
      default: va = 0; vb = 0;
    }
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

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
          Five economies positioned to benefit from the world order transition — tracking why and how to invest.
        </p>
      </section>

      {/* Why Now */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-4">The Multipolar Opportunity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#3b82f6" }}>
            <div className="text-xs font-bold text-[#3b82f6] mb-2">The Decoupling Dividend</div>
            <p className="text-xs text-[#888] leading-relaxed">
              As the US and China decouple, global supply chains must relocate. Countries with young populations, competitive costs, and strategic neutrality become the factories of the next world order. India and Indonesia are the primary beneficiaries.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#eab308" }}>
            <div className="text-xs font-bold text-[#eab308] mb-2">The Commodity Premium</div>
            <p className="text-xs text-[#888] leading-relaxed">
              World order transitions create sustained commodity demand — rearmament requires metals, energy insecurity drives resource premiums. Countries sitting on commodity wealth benefit regardless of which power wins. Brazil and Saudi Arabia are the clearest cases.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: ACCENT }}>
            <div className="text-xs font-bold mb-2" style={{ color: ACCENT }}>The Swing State Advantage</div>
            <p className="text-xs text-[#888] leading-relaxed">
              Countries that refuse to choose sides can trade with both, receive investment from both, and extract concessions from both. India is the master of this strategy. Turkey, Saudi Arabia, and Indonesia are playing the same game.
            </p>
          </div>
        </div>
      </section>

      {/* Five Country Cards */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Five Economies</h2>
        <p className="text-xs text-[#555] mb-6">Click any country for full analysis, ETFs, and risk factors.</p>
        <div className="space-y-3">
          {countries.map((c) => <CountryCard key={c.name} c={c} />)}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Five Economies — Side by Side</h2>
        <p className="text-xs text-[#555] mb-4">Click column headers to sort</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#555] uppercase tracking-wider border-b border-[#222]">
                <th className="text-left py-2 pr-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("name")}>Country{arrow("name")}</th>
                <th className="text-center py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("signal")}>Signal{arrow("signal")}</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Thesis</th>
                <th className="text-right py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("gdp")}>GDP{arrow("gdp")}</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Commodity</th>
                <th className="text-right py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("chinaT")}>CN%{arrow("chinaT")}</th>
                <th className="text-right py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("usT")}>US%{arrow("usT")}</th>
                <th className="text-right py-2 px-2">ETF</th>
                <th className="text-right py-2 pl-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("etfReturn")}>1Y{arrow("etfReturn")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.name} className="border-b border-[#181818]">
                  <td className="py-3 pr-2 font-bold text-[#e0e0e0]">{c.flag} {c.name}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: c.signalColor, backgroundColor: c.signalColor + "20" }}>{c.signal}</span>
                  </td>
                  <td className="py-3 px-2 text-[#555] hidden sm:table-cell text-[10px]">{c.primaryThesis}</td>
                  <td className="py-3 px-2 text-right" style={{ color: ACCENT }}>{c.gdpGrowth}</td>
                  <td className="py-3 px-2 text-[#555] hidden sm:table-cell text-[10px]">{c.keyCommodity}</td>
                  <td className="py-3 px-2 text-right text-[#ef4444]">{c.chinaTradeShare}</td>
                  <td className="py-3 px-2 text-right text-[#3b82f6]">{c.usTradeShare}</td>
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

      {/* Common Thread */}
      <section className="px-4 py-8 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-4">What Connects These Five</h2>
        <p className="text-xs text-[#888] leading-relaxed">
          These five economies share one characteristic: they benefit from the world order transition regardless of which power wins. India captures manufacturing migration and plays both sides diplomatically. Brazil feeds and supplies a commodity-hungry world. Saudi Arabia holds the energy the transition runs on. Indonesia holds the metals the EV transition requires. Turkey controls a strait that is strategically irreplaceable. None of them need the US to remain dominant. None of them need China to win. They need the transition to continue — and all evidence suggests it will.
        </p>
      </section>

      {/* Regime Alignment */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Emerging Markets Across Regimes</h2>
        <p className="text-xs text-[#555] mb-4">Which countries benefit in each economic season</p>

        <div className="space-y-2 mb-4">
          {regimeAlignment.map((r) => (
            <div
              key={r.regime}
              className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center gap-2"
              style={{
                backgroundColor: r.current ? ACCENT + "10" : "#111",
                borderColor: r.current ? ACCENT + "40" : "#222",
              }}
            >
              <div className="flex items-center gap-2 sm:w-32">
                <span>{r.emoji}</span>
                <span className={`text-sm font-bold ${r.current ? "text-[#e0e0e0]" : "text-[#555]"}`}>{r.regime}</span>
                {r.current && <span className="text-[10px] font-bold" style={{ color: ACCENT }}>NOW</span>}
              </div>
              <div className="flex-1 text-xs text-[#888]">{r.performance}</div>
              <div className="text-xs text-[#555] sm:w-24 sm:text-right">{r.bestETFs}</div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded bg-[#111] border border-[#222]">
          <p className="text-xs text-[#888] leading-relaxed">
            Current US regime is <span className="text-[#ef4444] font-bold">Stagflation</span> while China is in <span className="text-[#3b82f6] font-bold">Deflation</span>. This creates a split: Saudi Arabia benefits from the energy supply shock, India is resilient due to domestic demand, but commodity exporters to China (Brazil iron ore, Indonesia nickel) face mixed signals — energy prices up but Chinese demand down.{" "}
            <Link href="/regimetracker" className="underline underline-offset-2 hover:text-[#e0e0e0]" style={{ color: ACCENT }}>US regime →</Link>{" "}
            <Link href="/china" className="underline underline-offset-2 hover:text-[#e0e0e0]" style={{ color: "#3b82f6" }}>China tracker →</Link>
          </p>
        </div>
      </section>

      {/* Email signup */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
          <h2 className="text-lg font-bold text-[#e0e0e0] mb-2">Track Emerging Market Opportunities</h2>
          <p className="text-xs text-[#555] mb-4 max-w-md mx-auto">
            Get notified when a significant shift occurs in any of the five tracked economies.
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input type="email" placeholder="your@email.com"
              className="flex-1 px-3 py-2 rounded bg-[#0a0a0a] border border-[#222] text-sm text-[#e0e0e0] placeholder-[#333] focus:border-[#555] outline-none" />
            <button className="px-4 py-2 rounded text-sm text-[#e0e0e0] hover:opacity-80 transition-opacity" style={{ backgroundColor: ACCENT }}>
              Track opportunities
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          Emerging market investments carry additional risks including currency volatility, political instability, lower liquidity, and less regulatory protection. Country-specific risks noted for each economy. Not personalised financial advice. Always do your own research.
        </p>
      </footer>
    </main>
  );
}
