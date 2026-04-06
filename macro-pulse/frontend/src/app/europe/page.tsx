"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";
import {
  SECTORS, COMPANIES, CATALYSTS, REGIME_FIT_EMOJI, RISK_COLORS,
  type Company,
} from "@/lib/europeData";

const SCORECARD = [
  { sector: "Defence", progress: 80, note: "Spending committed, contracts flowing", color: SECTORS.defence.color },
  { sector: "Energy", progress: 60, note: "LNG built, renewables scaling", color: SECTORS.energy.color },
  { sector: "Technology", progress: 40, note: "Early stage, ASML is the anchor", color: SECTORS.technology.color },
  { sector: "Finance", progress: 30, note: "CMU stalling, joint bonds growing", color: SECTORS.finance.color },
  { sector: "Materials", progress: 20, note: "Most work to do, China still dominant", color: SECTORS.materials.color },
];

const RISKS = [
  "Peace in Ukraine removes urgency — defence spending commitments weaken",
  "Political fragmentation — EU reverts to national interests over collective action",
  "Chinese EV/solar dominance — European industry loses competitiveness before independence achieved",
  "Debt sustainability — defence spending triggers fiscal crisis in high-debt countries (Italy, France)",
  "Trump deal with Russia — energy crisis resolves, urgency disappears",
];

const REGIME_FIT_SECTION = [
  { regime: "Stagflation", color: "#ef4444", note: "Defence and energy benefit most. Same direction as current regime picks. Double tailwind right now." },
  { regime: "Reflation", color: "#eab308", note: "Cyclicals and industrials benefit. Defence manufacturing is cyclical. Still performs well." },
  { regime: "Goldilocks", color: "#22c55e", note: "Technology and finance benefit most. ASML, SAP, Euronext outperform. Theme transitions smoothly." },
  { regime: "Deflation", color: "#3b82f6", note: "Most defensive — some pressure. Government-backed spending continues regardless of cycle." },
];

function CompanyRow({ company, sectorColor }: { company: Company; sectorColor: string }) {
  const [expanded, setExpanded] = useState(false);

  const nordnetUrl = company.ticker !== "PRIVATE"
    ? `https://www.nordnet.no/market/search?query=${company.ticker.split(".")[0]}`
    : null;
  const yahooUrl = company.ticker !== "PRIVATE"
    ? `https://finance.yahoo.com/quote/${company.ticker}/`
    : null;

  return (
    <>
      <tr
        className="border-b border-[#181818] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-2 pr-2 text-[#e0e0e0] font-bold">{company.name}</td>
        <td className="py-2 pr-2" style={{ color: sectorColor }}>{company.ticker}</td>
        <td className="py-2 pr-2 text-[#555] hidden sm:table-cell">{company.exchange}</td>
        <td className="py-2 pr-2 hidden sm:table-cell">
          <span className="text-xs px-2 py-0.5 rounded" style={{
            color: RISK_COLORS[company.riskLevel] || "#888",
            backgroundColor: (RISK_COLORS[company.riskLevel] || "#888") + "20",
          }}>
            {company.riskLevel}
          </span>
        </td>
        <td className="py-2 text-right text-[#555] text-xs">{expanded ? "▾" : "▸"}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="pb-4 pt-1">
            <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-xs space-y-3">
              {/* Why Now */}
              <div>
                <span className="text-[#e0e0e0] font-bold">WHY NOW</span>
                <p className="text-[#888] mt-1 leading-relaxed">{company.whyNow}</p>
              </div>

              {/* Note if exists */}
              {company.note && (
                <div className="p-2 rounded bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.2)]">
                  <span className="text-[#eab308]">⚠ {company.note}</span>
                </div>
              )}

              {/* Regime Fit */}
              <div>
                <span className="text-[#e0e0e0] font-bold">REGIME FIT</span>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span><span className="text-[#ef4444]">Stagflation</span> {REGIME_FIT_EMOJI[company.regimeFit.stagflation]}</span>
                  <span><span className="text-[#22c55e]">Goldilocks</span> {REGIME_FIT_EMOJI[company.regimeFit.goldilocks]}</span>
                  <span><span className="text-[#eab308]">Reflation</span> {REGIME_FIT_EMOJI[company.regimeFit.reflation]}</span>
                  <span><span className="text-[#3b82f6]">Deflation</span> {REGIME_FIT_EMOJI[company.regimeFit.deflation]}</span>
                </div>
              </div>

              {/* Bull / Bear */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[#22c55e] font-bold">BULL CASE</span>
                  <p className="text-[#888] mt-1 leading-relaxed">{company.bullCase}</p>
                </div>
                <div>
                  <span className="text-[#ef4444] font-bold">BEAR CASE</span>
                  <p className="text-[#888] mt-1 leading-relaxed">{company.bearCase}</p>
                </div>
              </div>

              {/* Risk + Links */}
              <div className="flex items-center justify-between pt-2 border-t border-[#181818]">
                <div>
                  <span className="text-[#555]">Risk: </span>
                  <span style={{ color: RISK_COLORS[company.riskLevel] || "#888" }}>{company.riskLevel}</span>
                </div>
                <div className="flex gap-3">
                  {nordnetUrl && (
                    <a href={nordnetUrl} target="_blank" rel="noopener noreferrer" className="text-[#555] hover:text-[#888] underline underline-offset-2">
                      Nordnet
                    </a>
                  )}
                  {yahooUrl && (
                    <a href={yahooUrl} target="_blank" rel="noopener noreferrer" className="text-[#555] hover:text-[#888] underline underline-offset-2">
                      Yahoo Finance
                    </a>
                  )}
                </div>
              </div>

              <p className="text-[#333] italic">This analysis is for educational purposes only. Not personalised financial advice. Always do your own research.</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SectorCard({ sector, companies, catalysts }: {
  sector: { color: string; label: string; bg: string };
  companies: Company[];
  catalysts: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  // Sort by current regime alignment (stagflation = strong first)
  const sorted = [...companies].sort((a, b) => {
    const order = { strong: 0, positive: 1, neutral: 2, negative: 3 };
    return (order[a.regimeFit.stagflation] || 3) - (order[b.regimeFit.stagflation] || 3);
  });

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: sector.color + "30" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-[#1a1a1a] transition-colors"
        style={{ backgroundColor: sector.bg }}
      >
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sector.color }} />
          <span className="text-sm font-bold" style={{ color: sector.color }}>{sector.label}</span>
          <span className="text-xs text-[#555]">{companies.length} companies</span>
        </div>
        <span className="text-[#555] text-sm">{expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: sector.color + "20" }}>
          <p className="text-xs text-[#555] mt-3 mb-2">Click a company to see the investment case</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#555] uppercase tracking-wider border-b border-[#222]">
                  <th className="text-left py-2 pr-2">Company</th>
                  <th className="text-left py-2 pr-2">Ticker</th>
                  <th className="text-left py-2 pr-2 hidden sm:table-cell">Exchange</th>
                  <th className="text-left py-2 pr-2 hidden sm:table-cell">Risk</th>
                  <th className="text-right py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <CompanyRow key={c.ticker} company={c} sectorColor={sector.color} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-[#181818]">
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">Catalysts</div>
            {catalysts.map((c, i) => (
              <p key={i} className="text-xs text-[#888] mb-1">• {c}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EuropePage() {
  const [thesisOpen, setThesisOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch(apiUrl("/api/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, waitlistFeatures: ["europe_tracker"] }),
      });
    } catch {}
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="px-4 pt-16 pb-8 max-w-5xl mx-auto">
        <a href="/" className="text-xs text-[#555] hover:text-[#888]">← Back to Macro Pulse</a>
        <div className="text-center mt-8 mb-6">
          <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">Macro Pulse</h1>
          <p className="text-2xl sm:text-3xl text-[#e0e0e0] font-bold mb-3">European Strategic Autonomy</p>
          <p className="text-sm text-[#888] max-w-lg mx-auto leading-relaxed">
            Tracking Europe&apos;s structural shift toward independence in defence, energy, technology,
            finance, and critical materials. A multi-year investment theme independent of short-term macro regimes.
          </p>
          <p className="text-xs text-[#555] mt-3 italic">
            This is a long-term structural theme tracker, not a short-term regime signal. These positions are held across multiple macro regimes.
          </p>
        </div>
      </section>

      {/* Thesis */}
      <section className="px-4 pb-8 max-w-5xl mx-auto">
        <div className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
          <button onClick={() => setThesisOpen(!thesisOpen)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#1a1a1a] transition-colors">
            <span className="text-sm font-bold text-[#e0e0e0]">Why this matters</span>
            <span className="text-[#555] text-sm">{thesisOpen ? "−" : "+"}</span>
          </button>
          {thesisOpen && (
            <div className="px-4 pb-4 border-t border-[#222] space-y-3 text-xs text-[#888] leading-relaxed">
              <p className="pt-3"><span className="text-[#e0e0e0] font-bold">1. The old model broke.</span> The post-war assumptions that made Europe dependent on the US for security and Russia for energy have broken down simultaneously. The Iran/Hormuz crisis, Trump-era transatlantic tensions, and the Ukraine war destroyed two pillars of European security at once.</p>
              <p><span className="text-[#e0e0e0] font-bold">2. Europe must build its own capabilities.</span> Across defence, energy, technology, finance, and critical materials, Europe is being forced to invest hundreds of billions in autonomous infrastructure. This isn&apos;t optional — it&apos;s existential.</p>
              <p><span className="text-[#e0e0e0] font-bold">3. This creates a structural investment tailwind.</span> Unlike cyclical themes that depend on the macro regime, European strategic autonomy is a 3-10 year capital deployment cycle backed by government commitments and existential necessity.</p>
            </div>
          )}
        </div>
      </section>

      {/* Sector Trackers */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Sector Trackers</h2>
        <p className="text-xs text-[#555] mb-6">Five dimensions of European strategic independence — click a company for the investment case</p>
        <div className="space-y-3">
          {(Object.entries(SECTORS) as [string, typeof SECTORS.defence][]).map(([key, sector]) => (
            <SectorCard
              key={key}
              sector={sector}
              companies={COMPANIES[key] || []}
              catalysts={CATALYSTS[key] || []}
            />
          ))}
        </div>
      </section>

      {/* Scorecard */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">How Far Has Europe Come?</h2>
        <p className="text-xs text-[#555] mb-6">Progress toward strategic independence</p>
        <div className="space-y-3">
          {SCORECARD.map((s) => (
            <div key={s.sector} className="flex items-center gap-3">
              <span className="text-xs text-[#888] w-24 text-right">{s.sector}</span>
              <div className="flex-1 h-5 bg-[#181818] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.progress}%`, backgroundColor: s.color }} />
              </div>
              <span className="text-xs font-bold w-10" style={{ color: s.color }}>{s.progress}%</span>
              <span className="text-xs text-[#555] hidden sm:block w-48">{s.note}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#555] mt-4 text-center italic">Progress assessments updated quarterly.</p>
      </section>

      {/* Risks */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">What Could Derail This Theme</h2>
        <div className="space-y-2 mt-4">
          {RISKS.map((r, i) => (
            <div key={i} className="p-3 rounded-lg bg-[#111] border border-[#222]">
              <p className="text-xs text-[#888]"><span className="text-[#ef4444]">⚠</span> {r}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Regime Fit */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">European Autonomy Across Regimes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {REGIME_FIT_SECTION.map((r) => (
            <div key={r.regime} className="p-3 rounded-lg bg-[#111] border border-[#222]">
              <div className="text-sm font-bold mb-1" style={{ color: r.color }}>{r.regime}</div>
              <p className="text-xs text-[#888] leading-relaxed">{r.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#555] mt-4 text-center italic">
          Unlike regime picks which rotate, European strategic autonomy is a 3-10 year structural theme.
        </p>
      </section>

      {/* Email */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="p-4 rounded-lg bg-[#111] border border-[#222] text-center">
          {submitted ? (
            <p className="text-sm text-[#22c55e]">You&apos;re tracking. Quarterly updates on European strategic autonomy.</p>
          ) : (
            <>
              <p className="text-sm text-[#e0e0e0] mb-1">Track the European autonomy theme</p>
              <p className="text-xs text-[#555] mb-3">Quarterly updates on milestones, policy, and company developments.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="flex-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none text-center sm:text-left" />
                <button type="submit" className="px-6 py-2 bg-[#222] hover:bg-[#333] text-sm text-[#e0e0e0] rounded transition-colors">Track Europe</button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          Companies listed are for research and educational purposes only. This is not a recommendation to buy or sell any security. European strategic autonomy is a long-term structural thesis with significant execution risks. Past performance does not guarantee future results.
        </p>
        <div className="flex gap-4 justify-center mt-3">
          <a href="/" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Back to Macro Pulse</a>
          <a href="/disclaimer" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Disclaimer</a>
        </div>
        <p className="text-xs text-[#555] mt-4">
          Built by <em>Lucas Rodrigues</em> — <a href="https://www.linkedin.com/in/lucas-rodrigues-27a51b1a3/" target="_blank" rel="noopener noreferrer" className="hover:text-[#888] underline underline-offset-2">follow along on LinkedIn</a>
        </p>
      </footer>
    </main>
  );
}
