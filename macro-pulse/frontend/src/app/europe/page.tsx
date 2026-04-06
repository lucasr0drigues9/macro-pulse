"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";

// Sector colours
const SECTORS = {
  defence: { color: "#6b8e5a", label: "Defence", bg: "rgba(107, 142, 90, 0.08)" },
  energy: { color: "#e09030", label: "Energy Independence", bg: "rgba(224, 144, 48, 0.08)" },
  technology: { color: "#3b82f6", label: "Technology Sovereignty", bg: "rgba(59, 130, 246, 0.08)" },
  finance: { color: "#22c55e", label: "Financial Infrastructure", bg: "rgba(34, 197, 94, 0.08)" },
  materials: { color: "#a855f7", label: "Critical Materials", bg: "rgba(168, 85, 247, 0.08)" },
};

const COMPANIES = {
  defence: [
    { name: "Rheinmetall", ticker: "RHM.DE", exchange: "Frankfurt", thesis: "Leading European armoured vehicles and ammunition" },
    { name: "BAE Systems", ticker: "BA.L", exchange: "London", thesis: "UK defence prime, submarines, electronic warfare" },
    { name: "Leonardo", ticker: "LDO.MI", exchange: "Milan", thesis: "Italian defence/aerospace, helicopter leader" },
    { name: "Saab", ticker: "SAAB-B.ST", exchange: "Stockholm", thesis: "Swedish fighter jets (Gripen), radar systems" },
    { name: "Thales", ticker: "HO.PA", exchange: "Paris", thesis: "Defence electronics, cybersecurity, space" },
    { name: "Airbus", ticker: "AIR.PA", exchange: "Paris", thesis: "Military transport (A400M), helicopters, space" },
  ],
  energy: [
    { name: "Equinor", ticker: "EQNR.OL", exchange: "Oslo", thesis: "Norwegian energy giant, LNG + offshore wind" },
    { name: "TotalEnergies", ticker: "TTE.PA", exchange: "Paris", thesis: "LNG, renewables, hydrogen — most diversified" },
    { name: "Ørsted", ticker: "ORSTED.CO", exchange: "Copenhagen", thesis: "World leader in offshore wind" },
    { name: "Vestas Wind", ticker: "VWS.CO", exchange: "Copenhagen", thesis: "Global #1 wind turbine manufacturer" },
    { name: "Shell", ticker: "SHEL.L", exchange: "London", thesis: "LNG leader, energy transition player" },
  ],
  technology: [
    { name: "ASML", ticker: "ASML.AS", exchange: "Amsterdam", thesis: "Monopoly on EUV lithography — no chips without ASML" },
    { name: "SAP", ticker: "SAP.DE", exchange: "Frankfurt", thesis: "Enterprise software — European cloud leader" },
    { name: "Airbus", ticker: "AIR.PA", exchange: "Paris", thesis: "Duopoly with Boeing, European aerospace sovereignty" },
    { name: "Infineon", ticker: "IFX.DE", exchange: "Frankfurt", thesis: "Power semiconductors, automotive chips" },
    { name: "STMicroelectronics", ticker: "STMPA.PA", exchange: "Paris", thesis: "European semiconductor manufacturing" },
    { name: "Capgemini", ticker: "CAP.PA", exchange: "Paris", thesis: "IT consulting, digital transformation" },
  ],
  finance: [
    { name: "Euronext", ticker: "ENX.PA", exchange: "Paris", thesis: "Pan-European exchange — benefits from CMU" },
    { name: "Deutsche Börse", ticker: "DB1.DE", exchange: "Frankfurt", thesis: "Derivatives, clearing, market infrastructure" },
    { name: "London Stock Exchange", ticker: "LSEG.L", exchange: "London", thesis: "Data, analytics, capital markets infra" },
    { name: "UniCredit", ticker: "UCG.MI", exchange: "Milan", thesis: "Pan-European banking consolidation" },
    { name: "BNP Paribas", ticker: "BNP.PA", exchange: "Paris", thesis: "Largest eurozone bank, investment banking" },
    { name: "Deutsche Bank", ticker: "DBK.DE", exchange: "Frankfurt", thesis: "German banking restructuring story" },
  ],
  materials: [
    { name: "Umicore", ticker: "UMI.BR", exchange: "Brussels", thesis: "Battery materials, recycling, catalysis" },
    { name: "Norsk Hydro", ticker: "NHY.OL", exchange: "Oslo", thesis: "Aluminium, renewable energy, recycling" },
    { name: "Boliden", ticker: "BOL.ST", exchange: "Stockholm", thesis: "Nordic mining — zinc, copper, precious metals" },
    { name: "Glencore", ticker: "GLEN.L", exchange: "London", thesis: "Global commodities, cobalt, copper, recycling" },
    { name: "Northvolt", ticker: "PRIVATE", exchange: "—", thesis: "European battery gigafactory — in bankruptcy restructuring (status tracker)" },
  ],
};

const CATALYSTS = {
  defence: [
    "NATO 3-4% GDP spending commitment — multi-year procurement cycle starting",
    "ReArm Europe €800bn plan — approved, funding being allocated",
    "Germany €100bn special defence fund — contracts being awarded",
  ],
  energy: [
    "European LNG terminal capacity doubled since 2022",
    "Offshore wind target: 120 GW by 2030 (currently ~35 GW installed)",
    "Nuclear restarts in multiple countries (France, Belgium, Netherlands)",
  ],
  technology: [
    "EU Chips Act: €43bn to build European semiconductor capacity",
    "ASML order backlog at record levels — 2+ year wait times",
    "EU AI Act implementation — creates regulatory moat for compliant companies",
  ],
  finance: [
    "EU Capital Markets Union — slow progress but joint bond issuance growing",
    "ECB digital euro — investigation phase, decision expected 2025-2026",
    "European banking consolidation wave (UniCredit/Commerzbank)",
  ],
  materials: [
    "EU Critical Raw Materials Act — targets 40% domestic processing by 2030",
    "Currently at ~3% domestic rare earth processing — massive gap to fill",
    "Northvolt bankruptcy highlights execution risk but validates demand",
  ],
};

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

const REGIME_FIT = [
  { regime: "Stagflation", color: "#ef4444", note: "Defence and energy benefit most. Same direction as current regime picks. Double tailwind right now." },
  { regime: "Reflation", color: "#eab308", note: "Cyclicals and industrials benefit. Defence manufacturing is cyclical. Still performs well." },
  { regime: "Goldilocks", color: "#22c55e", note: "Technology and finance benefit most. ASML, SAP, Euronext outperform. Theme transitions smoothly." },
  { regime: "Deflation", color: "#3b82f6", note: "Most defensive — some pressure. Government-backed spending continues regardless of cycle. Relative outperformance vs pure cyclicals." },
];

function SectorCard({ sector, companies, catalysts }: {
  sector: { color: string; label: string; bg: string };
  companies: typeof COMPANIES.defence;
  catalysts: string[];
}) {
  const [expanded, setExpanded] = useState(false);

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
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#555] uppercase tracking-wider border-b border-[#222]">
                  <th className="text-left py-2 pr-2">Company</th>
                  <th className="text-left py-2 pr-2">Ticker</th>
                  <th className="text-left py-2 pr-2">Exchange</th>
                  <th className="text-left py-2">Thesis</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.ticker} className="border-b border-[#181818]">
                    <td className="py-2 pr-2 text-[#e0e0e0] font-bold">{c.name}</td>
                    <td className="py-2 pr-2" style={{ color: sector.color }}>{c.ticker}</td>
                    <td className="py-2 pr-2 text-[#555]">{c.exchange}</td>
                    <td className="py-2 text-[#888]">{c.thesis}</td>
                  </tr>
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

      {/* Section 1 — The Thesis */}
      <section className="px-4 pb-8 max-w-5xl mx-auto">
        <div className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
          <button
            onClick={() => setThesisOpen(!thesisOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-sm font-bold text-[#e0e0e0]">Why this matters</span>
            <span className="text-[#555] text-sm">{thesisOpen ? "−" : "+"}</span>
          </button>
          {thesisOpen && (
            <div className="px-4 pb-4 border-t border-[#222] space-y-3 text-xs text-[#888] leading-relaxed">
              <p className="pt-3">
                <span className="text-[#e0e0e0] font-bold">1. The old model broke.</span> The post-war assumptions that made Europe dependent on the US for security and Russia for energy have broken down simultaneously. The Iran/Hormuz crisis, Trump-era transatlantic tensions, and the Ukraine war destroyed two pillars of European security at once.
              </p>
              <p>
                <span className="text-[#e0e0e0] font-bold">2. Europe must build its own capabilities.</span> Across defence, energy, technology, finance, and critical materials, Europe is being forced to invest hundreds of billions in autonomous infrastructure. This isn&apos;t optional — it&apos;s existential.
              </p>
              <p>
                <span className="text-[#e0e0e0] font-bold">3. This creates a structural investment tailwind.</span> Unlike cyclical themes that depend on the macro regime, European strategic autonomy is a 3-10 year capital deployment cycle backed by government commitments and existential necessity. The companies building this infrastructure benefit regardless of whether we&apos;re in Stagflation or Goldilocks.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Section 2 — Five Sector Trackers */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Sector Trackers</h2>
        <p className="text-xs text-[#555] mb-6">Five dimensions of European strategic independence</p>
        <div className="space-y-3">
          {(Object.entries(SECTORS) as [string, typeof SECTORS.defence][]).map(([key, sector]) => (
            <SectorCard
              key={key}
              sector={sector}
              companies={COMPANIES[key as keyof typeof COMPANIES]}
              catalysts={CATALYSTS[key as keyof typeof CATALYSTS]}
            />
          ))}
        </div>
      </section>

      {/* Section 3 — Autonomy Scorecard */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">How Far Has Europe Come?</h2>
        <p className="text-xs text-[#555] mb-6">Progress toward strategic independence across each dimension</p>
        <div className="space-y-3">
          {SCORECARD.map((s) => (
            <div key={s.sector} className="flex items-center gap-3">
              <span className="text-xs text-[#888] w-24 text-right">{s.sector}</span>
              <div className="flex-1 h-5 bg-[#181818] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.progress}%`, backgroundColor: s.color }}
                />
              </div>
              <span className="text-xs font-bold w-10" style={{ color: s.color }}>{s.progress}%</span>
              <span className="text-xs text-[#555] hidden sm:block w-48">{s.note}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#555] mt-4 text-center italic">Progress assessments updated quarterly based on policy milestones and capital deployment data.</p>
      </section>

      {/* Section 4 — Risks */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">What Could Derail This Theme</h2>
        <p className="text-xs text-[#555] mb-4">Structural risks to the European autonomy thesis</p>
        <div className="space-y-2">
          {RISKS.map((r, i) => (
            <div key={i} className="p-3 rounded-lg bg-[#111] border border-[#222]">
              <p className="text-xs text-[#888]">
                <span className="text-[#ef4444]">⚠</span> {r}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5 — Regime Fit */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">European Autonomy Across Regimes</h2>
        <p className="text-xs text-[#555] mb-4">How this structural theme performs in each macro regime</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REGIME_FIT.map((r) => (
            <div key={r.regime} className="p-3 rounded-lg bg-[#111] border border-[#222]">
              <div className="text-sm font-bold mb-1" style={{ color: r.color }}>{r.regime}</div>
              <p className="text-xs text-[#888] leading-relaxed">{r.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#555] mt-4 text-center italic">
          Unlike regime picks which rotate every few months, European strategic autonomy is a 3-10 year structural theme. It complements the regime framework rather than replacing it.
        </p>
      </section>

      {/* Section 6 — Email Signup */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="p-4 rounded-lg bg-[#111] border border-[#222] text-center">
          {submitted ? (
            <p className="text-sm text-[#22c55e]">You&apos;re tracking. Quarterly updates on European strategic autonomy progress.</p>
          ) : (
            <>
              <p className="text-sm text-[#e0e0e0] mb-1">Track the European autonomy theme</p>
              <p className="text-xs text-[#555] mb-3">
                Get quarterly updates on milestone achievements, new policy announcements, and what it means for the companies above.
              </p>
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
                  Track Europe
                </button>
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
