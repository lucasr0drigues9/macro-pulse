"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import SectionChat from "@/components/SectionChat";
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 mb-4">
            {c.metrics.map((m) => (
              <div key={m.label} className="p-2 rounded bg-[#0a0a0a]">
                <div className="text-[10px] text-[#555]">{m.label}</div>
                <div className="text-xs font-bold" style={{ color: featured ? GOLD : ACCENT }}>{m.value}</div>
              </div>
            ))}
          </div>
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

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444", Goldilocks: "#22c55e", Reflation: "#eab308", Deflation: "#3b82f6",
};

export default function EmergingMarketsPage() {
  const allCountries = [morocco, ...countries];

  // Current US regime context — this drives which EMs benefit most right now
  const currentRegime = "Stagflation";

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Header */}
      <section className="px-4 pt-12 pb-4 max-w-5xl mx-auto">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">Emerging Markets</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Six economies positioned to profit from the world order transition.
        </p>
        <p className="text-xs text-[#555] max-w-2xl mb-4">
          When great powers compete, swing states win. These countries trade with both sides, control critical commodities, and capture the supply chains rerouting away from China.
        </p>
        <SectionChat
          context="Emerging markets page. Six countries (India, Brazil, Saudi Arabia, Indonesia, Turkey, Morocco) positioned to benefit from US-China competition. Current US regime: Stagflation — commodity exporters benefit."
          label="Ask about emerging markets"
          suggestions={["Which country benefits most from Hormuz?", "Is India overvalued?", "Best EM for a Nordnet ASK account?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* ETF Quick View — the investable summary */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The ETFs</h2>
        <p className="text-xs text-[#555] mb-4">One best ETF per country — with current regime fit. US is in <span className="font-bold" style={{ color: REGIME_COLORS[currentRegime] }}>{currentRegime}</span>.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {allCountries.map((c) => {
            const bestEtf = c.etfs[0];
            if (!bestEtf) return null;
            // Find current regime alignment
            const regimeFit = c.regimeAlignment.find((r) => r.regime === currentRegime);
            const fitEmoji = regimeFit?.rating || "➖";
            const fitNote = regimeFit?.note || "";
            return (
              <div key={c.name} className="p-3 rounded-lg bg-[#111] border border-[#222]" style={c.name === "Morocco" ? { borderColor: GOLD + "40" } : {}}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-xs font-bold text-[#e0e0e0]">{c.name}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[#e0e0e0]">{bestEtf.ticker}</span>
                  <span className={`text-sm font-bold ${bestEtf.return1y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {bestEtf.return1y >= 0 ? "+" : ""}{bestEtf.return1y}%
                  </span>
                </div>
                <div className="text-[10px] text-[#555] mb-2">{bestEtf.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#555]">{currentRegime} fit:</span>
                  <span className="text-[10px]">{fitEmoji} <span className="text-[#555]">{fitNote.length > 30 ? fitNote.slice(0, 30) + "..." : fitNote}</span></span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded bg-[#111] border border-[#ef444430]" style={{ backgroundColor: "#ef444410" }}>
          <p className="text-xs text-[#888] leading-relaxed">
            <span className="text-[#ef4444] font-bold">Current regime: {currentRegime}.</span> Commodity exporters (Saudi Arabia, Brazil, Indonesia) historically outperform during Stagflation because their exports rise in price while import costs are already denominated in local currencies. India and Turkey are more growth-sensitive — they perform better in Goldilocks/Reflation.
          </p>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Country Deep Dives */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Country Analysis</h2>
        <p className="text-xs text-[#555] mb-6">Click any country for Dalio determinants, all ETF options, regime alignment, and risk factors.</p>

        {/* Morocco featured */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: GOLD }}>Featured — the overlooked opportunity</div>
          <CountryCard c={morocco} featured />
        </div>

        <div className="space-y-3">
          {countries.map((c) => <CountryCard key={c.name} c={c} />)}
        </div>

        <SectionChat
          context="Country deep dives for 6 emerging markets. Each has Dalio's determinants, ETF options with expense ratios, regime alignment across all 4 seasons, and risk factors. Morocco featured as the overlooked EU nearshoring play."
          label="Ask about a specific country"
          suggestions={["Compare India vs Indonesia", "Which EM has the best risk-reward?", "Why is Morocco featured?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* Comparison Table — compact */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-4">Side by Side</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#555] uppercase tracking-wider border-b border-[#222]">
                <th className="text-left py-2 pr-2">Country</th>
                <th className="text-center py-2 px-2">Signal</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Thesis</th>
                <th className="text-right py-2 px-2">GDP</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Commodity</th>
                <th className="text-right py-2 px-2">ETF</th>
                <th className="text-right py-2 pl-2">1Y Return</th>
              </tr>
            </thead>
            <tbody>
              {allCountries.map((c) => (
                <tr key={c.name} className="border-b border-[#181818]" style={c.name === "Morocco" ? { backgroundColor: GOLD + "08" } : {}}>
                  <td className="py-3 pr-2 font-bold text-[#e0e0e0]">{c.flag} {c.name}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: c.signalColor, backgroundColor: c.signalColor + "20" }}>{c.signal}</span>
                  </td>
                  <td className="py-3 px-2 text-[#555] hidden sm:table-cell text-[10px]">{c.primaryThesis}</td>
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

      <div className="border-t border-[#181818]" />

      {/* World Order link */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="p-4 rounded-lg bg-[#111] border border-[#222] text-center">
          <p className="text-xs text-[#555] mb-3">
            Why these 6 countries benefit from the US-China transition — non-alignment premium, supply chain rerouting, commodity leverage.
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
          description="Get notified when a significant shift occurs in any of the six tracked economies."
          buttonLabel="Track opportunities"
          source="emerging_markets"
          waitlistFeature="emerging_markets"
          accent={ACCENT}
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          Emerging market investments carry additional risks including currency volatility, political instability, lower liquidity, and less regulatory protection. Not personalised financial advice.
        </p>
      </footer>
    </main>
  );
}
