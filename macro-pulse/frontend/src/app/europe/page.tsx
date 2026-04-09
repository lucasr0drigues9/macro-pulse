"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import Nav from "@/components/Nav";
import {
  SECTORS, COMPANIES, CATALYSTS, REGIME_FIT_EMOJI, RISK_COLORS,
  type Company,
} from "@/lib/europeData";

const SCORECARD = [
  { sector: "Defence", progress: 80, note: "Spending committed, contracts flowing", color: SECTORS.defence.color },
  { sector: "Energy", progress: 60, note: "LNG built, renewables scaling", color: SECTORS.energy.color },
  { sector: "Technology", progress: 50, note: "ASML + Safran — two world-class monopolies", color: SECTORS.technology.color },
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

function NordnetGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#1a1a1a] transition-colors">
        <span className="text-sm font-bold text-[#e0e0e0]">Buying these through Nordnet</span>
        <span className="text-[#555] text-sm">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[#222] text-xs text-[#888] leading-relaxed space-y-3">
          <div className="pt-3">
            <span className="text-[#6b8e5a] font-bold">EUAD</span> — Search &apos;iShares European Defence&apos; on Nordnet. Listed on London Stock Exchange and Euronext. Requires foreign markets agreement on Nordnet profile. EUR or GBP denominated depending on listing.
          </div>
          <div>
            <span className="text-[#e09030] font-bold">IOGP</span> — Search &apos;iShares Oil Gas&apos; on Nordnet. Listed on London Stock Exchange. Currency: USD. Requires foreign markets agreement.
          </div>
          <div>
            <span className="text-[#3b82f6] font-bold">ASML</span> — Search &apos;ASML&apos; on Nordnet. Available on both Euronext Amsterdam (EUR) and NASDAQ (USD). Amsterdam listing preferred for Norwegian investors to avoid USD conversion.
          </div>
          <div>
            <span className="text-[#a855f7] font-bold">NHY (Norsk Hydro)</span> — Directly on Oslo Børs. No foreign markets agreement needed. NOK denominated. Simplest to buy.
          </div>
          <p className="text-[#555] italic">Check current Nordnet availability as product access can change. Some UCITS ETFs require PRIIPs KID documentation before purchase.</p>
        </div>
      )}
    </div>
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

const EU_TICKERS = ["EUAD.L", "IOGP.L", "ASML.AS", "NHY.OL"];
const PERF_TICKERS = ["RHM.DE", "EUAD.L", "SAF.PA", "ASML.AS", "IOGP.L", "SPY", "NHY.OL"];

// European regime ETF picks — UCITS ETFs accessible on Nordnet for Norwegian investors
// These are cyclical regime plays, NOT the strategic autonomy thesis
type RegimePick = { ticker: string; name: string; rationale: string };
const EU_REGIME_PICKS: Record<string, RegimePick[]> = {
  Stagflation: [
    { ticker: "IOGP.L", name: "iShares Oil & Gas Exploration UCITS", rationale: "European energy majors (Equinor, TotalEnergies, Shell) — direct beneficiaries of energy price spikes" },
    { ticker: "SGLD.L", name: "Invesco Physical Gold ETC", rationale: "Gold in GBP — classic stagflation hedge, preserves purchasing power when real rates are negative" },
    { ticker: "EXH1.DE", name: "iShares STOXX Europe 600 Utilities", rationale: "Defensive sector with pricing power — passes energy costs through to consumers" },
  ],
  Reflation: [
    { ticker: "EXV5.DE", name: "iShares STOXX Europe 600 Oil & Gas", rationale: "Energy cyclicals lead when growth and inflation are both rising — direct commodity exposure" },
    { ticker: "EXV8.DE", name: "iShares STOXX Europe 600 Basic Resources", rationale: "Mining and materials — industrial recovery drives commodity demand" },
    { ticker: "EXSA.DE", name: "iShares STOXX Europe 600", rationale: "Broad European equity — captures the whole cyclical recovery" },
  ],
  Goldilocks: [
    { ticker: "EXSA.DE", name: "iShares STOXX Europe 600", rationale: "Broad European equity — best environment for risk assets, rising tide lifts everything" },
    { ticker: "IUIT.L", name: "iShares S&P 500 Information Technology UCITS", rationale: "Tech exposure for European investors — low rates and growth favour premium tech" },
    { ticker: "EXH9.DE", name: "iShares STOXX Europe 600 Health Care", rationale: "European pharma giants — quality compounders thrive in stable growth environments" },
  ],
  Deflation: [
    { ticker: "SGLD.L", name: "Invesco Physical Gold ETC", rationale: "Gold holds value when financial system stress rises — universal safe haven" },
    { ticker: "IBGL.L", name: "iShares Core Euro Govt Bond UCITS", rationale: "European government bonds rally when growth and inflation both fall — ECB cuts rates" },
    { ticker: "EXH4.DE", name: "iShares STOXX Europe 600 Food & Beverage", rationale: "Consumer staples — stable demand and dividends when the economy contracts" },
  ],
};

// All tickers we need live 1Y returns for (deduped)
const ALL_REGIME_PICK_TICKERS = Array.from(new Set(
  Object.values(EU_REGIME_PICKS).flat().map((p) => p.ticker)
));

// European playbook — what each regime means for Europe specifically
type PlaybookEntry = {
  description: string;
  whatHappens: string;
  outperform: { asset: string; why: string }[];
  underperform: { asset: string; why: string }[];
  historicalExamples: string[];
};

const EU_PLAYBOOK: Record<string, PlaybookEntry> = {
  Stagflation: {
    description: "Falling growth + rising inflation",
    whatHappens: "Europe slows while energy and food prices surge. The ECB is trapped — raising rates kills weak demand, cutting rates fuels inflation. Europe is structurally vulnerable because of energy import dependence. The Hormuz crisis and Russia/Ukraine aftermath compound the problem. Companies with pricing power, energy exposure, or defensive cash flows win.",
    outperform: [
      { asset: "European Energy (IOGP.L)", why: "Equinor, TotalEnergies, Shell benefit directly from oil and gas price spikes — revenues tied to the commodity driving inflation." },
      { asset: "Gold (SGLD.L)", why: "Classic stagflation hedge — preserves purchasing power when real rates are negative and the ECB loses credibility." },
      { asset: "Utilities (EXH1.DE)", why: "Defensive sector with regulated pricing power — passes energy costs through to consumers. Electricity demand is inelastic." },
    ],
    underperform: [
      { asset: "European Tech", why: "High-growth European stocks like ASML get crushed when rates rise and valuations compress." },
      { asset: "Long Bonds (IBGL.L)", why: "Fixed coupons get destroyed by rising inflation. Duration is your enemy when the price level is unstable." },
      { asset: "European Small Caps", why: "Small companies have the least pricing power, highest debt sensitivity, and weakest defences against stagflation." },
    ],
    historicalExamples: ["1973–1975 (oil embargo)", "2022 (Russia-Ukraine energy shock)", "2025–2026 (Hormuz/Iran war)"],
  },
  Goldilocks: {
    description: "Rising growth + falling inflation",
    whatHappens: "The best environment for European risk assets — but rare given Europe's structural inflation challenges. The ECB has room to cut rates, corporate earnings grow, and valuation multiples expand. European tech, healthcare, and broad equity all benefit. This is when Europe most resembles the US growth story.",
    outperform: [
      { asset: "Broad Europe (EXSA.DE)", why: "Captures the whole cyclical and growth recovery — when everything works, owning the index is the simplest bet." },
      { asset: "Tech (IUIT.L)", why: "Low rates and growth favour premium growth stocks. European investors access tech primarily through UCITS tech ETFs." },
      { asset: "Healthcare (EXH9.DE)", why: "European pharma giants (Novartis, Roche, Sanofi) are quality compounders that thrive in stable growth environments." },
    ],
    underperform: [
      { asset: "Gold (SGLD.L)", why: "No inflation to hedge against. Opportunity cost of holding a non-yielding asset rises when equities are running." },
      { asset: "Defensive Staples", why: "Boring defensive sectors get left behind when growth-oriented assets are rallying." },
      { asset: "Commodities", why: "Cooling inflation means commodity prices are flat or falling. The hedge is unnecessary when the risk isn't present." },
    ],
    historicalExamples: ["2013–2015 (post-taper recovery)", "2017 (synchronised global growth)", "2023 Q4 (soft landing optimism)"],
  },
  Reflation: {
    description: "Rising growth + rising inflation",
    whatHappens: "The European economy is heating up and prices are rising with it. The ECB is beginning to worry but hasn't aggressively tightened yet. Cyclical sectors lead — industrials, materials, banks. Energy companies benefit from both commodity prices and demand growth. The sweet spot for European cyclicals before inflation forces the ECB to brake hard.",
    outperform: [
      { asset: "Oil & Gas (EXV5.DE)", why: "Direct commodity exposure during cyclical upturn. Revenues rise with both prices and volumes." },
      { asset: "Basic Resources (EXV8.DE)", why: "Mining and materials companies benefit directly from industrial recovery and commodity demand." },
      { asset: "Broad Europe (EXSA.DE)", why: "Cyclical sectors lead the broad index higher. STOXX 600 captures the whole rotation." },
    ],
    underperform: [
      { asset: "Long Bonds", why: "Rising inflation and growth expectations push yields higher, hammering bond prices. Duration is painful." },
      { asset: "Gold (SGLD.L)", why: "Gold underperforms when real rates are positive and growth assets offer better returns." },
      { asset: "Defensive Sectors", why: "Utilities and staples get left behind as capital rotates into cyclicals." },
    ],
    historicalExamples: ["2003–2006 (housing boom)", "2009–2011 (post-GFC recovery)", "2021 (reopening trade)"],
  },
  Deflation: {
    description: "Falling growth + falling inflation",
    whatHappens: "The European economy contracts and prices fall. The ECB cuts rates aggressively, cash flows dry up, credit tightens. Defensive positioning is required — bonds, gold, consumer staples. European defence companies are counter-cyclical (policy-committed spending) and hold up better than growth sectors. This is the regime for capital preservation, not growth.",
    outperform: [
      { asset: "Gold (SGLD.L)", why: "Store of value when financial system stress rises. Acts as the universal hedge when credibility falters." },
      { asset: "European Govt Bonds (IBGL.L)", why: "Bunds and OATs rally aggressively as the ECB cuts rates. Best asset class in deflation scenarios." },
      { asset: "Consumer Staples (EXH4.DE)", why: "Food, beverage, and household goods have stable demand regardless of the cycle. Dividends provide yield." },
    ],
    underperform: [
      { asset: "Oil & Gas", why: "Demand collapses with economic activity. Energy commodity prices crash as the cycle turns down." },
      { asset: "Basic Resources", why: "Industrial metals and mining companies face the sharpest demand destruction." },
      { asset: "European Tech", why: "Risk-off environment hurts growth stocks even when rates are falling. Earnings uncertainty dominates." },
    ],
    historicalExamples: ["2008–2009 (Global Financial Crisis)", "2020 Q1 (COVID crash)", "2011 Q3 (European debt crisis)"],
  },
};

type ReturnEntry = { return: number; price: number; startPrice: number };
type ReturnData = Record<string, ReturnEntry>;

function ReturnBadge({ ticker, returns, label }: { ticker: string; returns: ReturnData; label?: string }) {
  const data = returns[ticker];
  if (!data) return <span className="text-[10px] text-[#333]">loading...</span>;
  const ret = data["return"];
  const color = ret >= 0 ? "#22c55e" : "#ef4444";
  return <span className="text-xs font-bold" style={{ color }}>{ret >= 0 ? "+" : ""}{ret}%{label ? ` ${label}` : ""}</span>;
}

type EuRegimeData = {
  confirmed: string;
  eurostatRegime: string;
  eurostatPeriodStart: string | null;
  geoRegime: string | null;
  aiLastUpdated: string | null;
  lagWarning: boolean;
  consecutiveMonths: number;
  periodStart: string;
  growth: { direction: string; score: number; detail: Record<string, number> };
  inflation: { direction: string; score: number; detail: Record<string, number> };
  latest: {
    gdp: [string, number] | null;
    industrialProduction: [string, number] | null;
    retailSales: [string, number] | null;
    unemployment: [string, number] | null;
    hicp: [string, number] | null;
  };
};

type EuBacktestEntry = {
  regime: string;
  start: string;
  end: string;
  months: number;
  picksReturn: number | null;
  allRegimeReturns: Record<string, number | null>;
  bestRegime: string | null;
  frameworkCorrect: boolean | null;
  signalStrength?: string;
  signalContext?: string;
  aiRegime?: string;
  aiPicksReturn?: number | null;
  aiDiffersFromFred?: boolean;
  aiCorrect?: boolean | null;
  doubleMiss?: { event: string; blind_spot: string; winner_dynamic: string } | null;
};
type EuBacktest = { totalRegimes: number; yearRange: string; timeline: EuBacktestEntry[]; regimeBreakdown: Record<string, number> };

const EU_REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444", Goldilocks: "#22c55e", Reflation: "#eab308", Deflation: "#3b82f6",
};

export default function EuropePage() {
  const [thesisOpen, setThesisOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [returns, setReturns] = useState<ReturnData>({});
  const [invasionReturns, setInvasionReturns] = useState<ReturnData>({});
  const [euRegime, setEuRegime] = useState<EuRegimeData | null>(null);
  const [euBacktest, setEuBacktest] = useState<EuBacktest | null>(null);
  const [regimePickReturns, setRegimePickReturns] = useState<ReturnData>({});
  const [expandedRegime, setExpandedRegime] = useState<string | null>(null);
  const [expandedTimelineIdx, setExpandedTimelineIdx] = useState<number | null>(null);
  const [europeInterpretation, setEuropeInterpretation] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl(`/api/returns?tickers=${EU_TICKERS.join(",")}`))
      .then((r) => r.json())
      .then((d) => setReturns(d.returns || {}))
      .catch(() => {});
    fetch(apiUrl(`/api/returns?tickers=${PERF_TICKERS.join(",")}&start=2022-02-24`))
      .then((r) => r.json())
      .then((d) => setInvasionReturns(d.returns || {}))
      .catch(() => {});
    fetch(apiUrl("/api/eu/regime"))
      .then((r) => r.json())
      .then((d) => { if (!d.error) setEuRegime(d); })
      .catch(() => {});
    fetch(apiUrl("/api/eu/backtest"))
      .then((r) => r.json())
      .then((d) => { if (!d.error) setEuBacktest(d); })
      .catch(() => {});
    fetch(apiUrl("/api/interpretation"))
      .then((r) => r.json())
      .then((d) => { if (d.europeInterpretation) setEuropeInterpretation(d.europeInterpretation); })
      .catch(() => {});
  }, []);

  // Fetch regime picks returns using the regime start date (only after euRegime loads)
  useEffect(() => {
    if (!euRegime?.periodStart) return;
    const start = euRegime.periodStart.slice(0, 10);
    const batchSize = 10;
    for (let i = 0; i < ALL_REGIME_PICK_TICKERS.length; i += batchSize) {
      const batch = ALL_REGIME_PICK_TICKERS.slice(i, i + batchSize).join(",");
      fetch(apiUrl(`/api/returns?tickers=${batch}&start=${start}`))
        .then((r) => r.json())
        .then((d) => setRegimePickReturns((prev) => ({ ...prev, ...(d.returns || {}) })))
        .catch(() => {});
    }
  }, [euRegime?.periodStart]);

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
      <Nav />
      {/* Header */}
      <section className="px-4 pt-8 pb-4 max-w-5xl mx-auto">
        <div className="text-center mt-8 mb-6">
          <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">European Regime Tracker</h1>
          <p className="text-2xl sm:text-3xl text-[#e0e0e0] font-bold mb-3">
            Markets rotate. Europe follows its own cycle.
          </p>
          <p className="text-sm text-[#555] max-w-md mx-auto">
            Four seasons. Four strategies. One European framework.
          </p>
        </div>

        {/* Expandable regime menu */}
        <div className="space-y-3 mb-8">
          {(["Stagflation", "Goldilocks", "Reflation", "Deflation"] as const).map((regime) => {
            const color = EU_REGIME_COLORS[regime];
            const data = EU_PLAYBOOK[regime];
            const isOpen = expandedRegime === regime;

            return (
              <div key={regime} className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
                <button
                  onClick={() => setExpandedRegime(isOpen ? null : regime)}
                  className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div>
                      <span className="font-bold text-sm" style={{ color }}>{regime}</span>
                      <span className="text-xs text-[#555] ml-2">{data.description}</span>
                    </div>
                  </div>
                  <span className="text-[#555] text-sm">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-[#181818]">
                    <p className="text-sm text-[#888] mt-4 mb-4 leading-relaxed">{data.whatHappens}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-[#22c55e] mb-2">Outperform</h4>
                        <div className="space-y-2">
                          {data.outperform.map((a) => (
                            <div key={a.asset} className="p-2 rounded bg-[#0a0a0a]">
                              <div className="text-sm font-bold text-[#e0e0e0]">{a.asset}</div>
                              <div className="text-xs text-[#888] mt-0.5">{a.why}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-[#ef4444] mb-2">Underperform</h4>
                        <div className="space-y-2">
                          {data.underperform.map((a) => (
                            <div key={a.asset} className="p-2 rounded bg-[#0a0a0a]">
                              <div className="text-sm font-bold text-[#e0e0e0]">{a.asset}</div>
                              <div className="text-xs text-[#888] mt-0.5">{a.why}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-[#555] mb-1">Historical examples</h4>
                      <p className="text-xs text-[#888]">{data.historicalExamples.join(" · ")}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <span className="text-xs text-[#555]">See current European regime ↓</span>
        </div>
      </section>

      {/* European Regime Indicator — mirrors US RegimeIndicator layout */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        {euRegime && <div className="text-center mb-4"><span className="text-xs text-[#22c55e]">● live data</span></div>}

        {euRegime ? (() => {
          // confirmed = AI override if geo differs, else eurostatRegime
          const color = EU_REGIME_COLORS[euRegime.confirmed] || "#555";
          const fmt = (v: [string, number] | null) => v ? v[1].toFixed(1) : "—";
          const geoRegime = euRegime.geoRegime || euRegime.confirmed;
          const eurostatRegime = euRegime.eurostatRegime;
          const geoColor = EU_REGIME_COLORS[geoRegime] || "#555";
          const eurostatColor = EU_REGIME_COLORS[eurostatRegime] || "#555";
          const diverge = euRegime.lagWarning;
          const geoText = europeInterpretation || "";

          const diverge2 = geoRegime !== eurostatRegime;
          void color; // kept for compile; unused now that we show two separate signs

          return (
            <>
              {/* Two big regime signs side by side — AI and Data as equals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* AI Layer */}
                <div
                  className="text-center py-10 rounded-lg border"
                  style={{ borderColor: geoColor + "40", backgroundColor: geoColor + "10" }}
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#555] mb-2">AI Geopolitical Layer</div>
                  <div className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: geoColor }}>
                    {geoRegime}
                  </div>
                  <div className="mt-3 text-xs text-[#555]">Based on current events</div>
                  {euRegime.aiLastUpdated && (
                    <div className="mt-1 text-[10px] text-[#333]">
                      Updated {euRegime.aiLastUpdated}
                    </div>
                  )}
                </div>

                {/* Eurostat Data */}
                <div
                  className="text-center py-10 rounded-lg border"
                  style={{ borderColor: eurostatColor + "40", backgroundColor: eurostatColor + "10" }}
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#555] mb-2">Eurostat Data</div>
                  <div className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: eurostatColor }}>
                    {eurostatRegime}
                  </div>
                  <div className="mt-3 text-xs text-[#555]">Based on latest hard data</div>
                  {euRegime.eurostatPeriodStart && (
                    <div className="mt-1 text-[10px] text-[#333]">
                      Since {euRegime.eurostatPeriodStart.slice(0, 7)} · {euRegime.consecutiveMonths} month{euRegime.consecutiveMonths !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Divergence banner */}
              {diverge2 ? (
                <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: "#eab30810", borderColor: "#eab30830" }}>
                  <div className="text-xs text-[#eab308] font-bold mb-1">⚡ AI and Data diverge</div>
                  <p className="text-xs text-[#888] leading-relaxed">
                    The geopolitical layer reads <span style={{ color: geoColor }} className="font-bold">{geoRegime}</span> while Eurostat data shows <span style={{ color: eurostatColor }} className="font-bold">{eurostatRegime}</span>. This happens when a real-world catalyst (war, energy shock, policy shift) hasn&apos;t yet transmitted into the hard data — or when the AI is reasoning from a narrative the data doesn&apos;t support. Neither is definitive. Watch HICP and industrial production in the coming releases to see which signal wins.
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: "#22c55e10", borderColor: "#22c55e30" }}>
                  <div className="text-xs text-[#22c55e] font-bold mb-1">✓ Signals aligned</div>
                  <p className="text-xs text-[#888]">
                    Both the AI geopolitical layer and Eurostat data agree: Europe is in <span style={{ color: geoColor }} className="font-bold">{geoRegime}</span>. Highest conviction signal.
                  </p>
                </div>
              )}

              {/* Data breakdown */}
              <div className="mt-4 p-4 rounded-lg bg-[#111] border border-[#222]">
                <div className="text-xs text-[#555] uppercase tracking-wider mb-3">Eurostat indicators (latest)</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-[#555]">GDP QoQ</div>
                    <div className="text-[#e0e0e0] font-bold">{fmt(euRegime.latest.gdp)}%</div>
                    <div className="text-[10px] text-[#333]">{euRegime.latest.gdp?.[0]?.slice(0, 7) || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#555]">Industrial Prod</div>
                    <div className="text-[#e0e0e0] font-bold">{fmt(euRegime.latest.industrialProduction)}</div>
                    <div className="text-[10px] text-[#333]">{euRegime.latest.industrialProduction?.[0]?.slice(0, 7) || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#555]">Retail Sales</div>
                    <div className="text-[#e0e0e0] font-bold">{fmt(euRegime.latest.retailSales)}</div>
                    <div className="text-[10px] text-[#333]">{euRegime.latest.retailSales?.[0]?.slice(0, 7) || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#555]">Unemployment</div>
                    <div className="text-[#e0e0e0] font-bold">{fmt(euRegime.latest.unemployment)}%</div>
                    <div className="text-[10px] text-[#333]">{euRegime.latest.unemployment?.[0]?.slice(0, 7) || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#555]">HICP YoY</div>
                    <div className="text-[#e0e0e0] font-bold">{fmt(euRegime.latest.hicp)}%</div>
                    <div className="text-[10px] text-[#333]">{euRegime.latest.hicp?.[0]?.slice(0, 7) || "—"}</div>
                  </div>
                </div>
              </div>

              {/* Full AI interpretation */}
              {europeInterpretation && (
                <div className="mt-4 p-4 rounded-lg bg-[#111] border border-[#222]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-[#e0e0e0]">Why the AI reads {geoRegime}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#222] text-[#555]">AI synthesis</span>
                  </div>
                  <p className="text-xs text-[#888] italic leading-relaxed">{geoText}</p>
                </div>
              )}

              {/* How to read — unchanged */}
              <div className="mt-4 p-4 rounded-lg bg-[#111] border border-[#222]">
                <div className="text-xs text-[#888] leading-relaxed">
                  <span className="text-[#e0e0e0] font-bold">How to read these signals:</span> The AI geopolitical layer detects European regime changes in real time by analysing current events (ECB policy, energy crises, elections). Eurostat data is a <span className="text-[#eab308]">confirmation signal</span> — it tells you the regime has been confirmed by hard data, not that it&apos;s starting. When both signals agree, conviction is highest. When they diverge, neither is definitive.
                </div>
              </div>

              {/* Invisible reference to satisfy unused vars — diverge came from lagWarning but we compute diverge2 from regime strings directly */}
              {diverge && null}
            </>
          );
        })() : (
          <div className="text-center py-12 text-sm text-[#555]">Loading European regime from Eurostat...</div>
        )}
      </section>

      {/* Current Regime Picks — European ETFs that historically perform in this regime */}
      {euRegime && (() => {
        // Follow the Eurostat data regime for picks (data-driven, not narrative)
        const currentRegime = euRegime.eurostatRegime || euRegime.confirmed;
        const picks = EU_REGIME_PICKS[currentRegime] || [];
        const regimeColor = EU_REGIME_COLORS[currentRegime] || "#555";
        if (picks.length === 0) return null;

        return (
          <section className="px-4 py-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-[#e0e0e0]">
                Data-driven Picks
              </h2>
              <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ color: regimeColor, backgroundColor: regimeColor + "20" }}>
                {currentRegime}
              </span>
            </div>
            <p className="text-xs text-[#555] mb-4">
              European UCITS ETFs that historically perform in {currentRegime} — based on Eurostat data. Returns since the current regime started ({euRegime.periodStart?.slice(0, 7)}). If you trust the AI layer more, rotate to its picks from the grid below.
            </p>

            <div className="space-y-3">
              {picks.map((pick) => {
                const data = regimePickReturns[pick.ticker];
                const ret = data ? data["return"] : null;
                return (
                  <div key={pick.ticker} className="p-4 rounded-lg bg-[#111] border border-[#222]">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-sm font-bold text-[#e0e0e0]">{pick.ticker}</span>
                        <span className="text-xs text-[#555] ml-2">{pick.name}</span>
                      </div>
                      {ret !== null ? (
                        <span className="text-xs font-bold shrink-0" style={{ color: ret >= 0 ? "#22c55e" : "#ef4444" }}>
                          {ret >= 0 ? "+" : ""}{ret}% since regime
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#333]">loading...</span>
                      )}
                    </div>
                    <p className="text-xs text-[#888] leading-relaxed">{pick.rationale}</p>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[#555] mt-4 text-center italic">
              These are short-term regime plays. The strategic autonomy positions below are structural multi-year themes that work across regimes.
            </p>
          </section>
        );
      })()}

      {/* AI-driven Picks — shown only when AI regime differs from data regime */}
      {euRegime && euRegime.geoRegime && euRegime.geoRegime !== euRegime.eurostatRegime && (() => {
        const aiRegime = euRegime.geoRegime;
        const picks = EU_REGIME_PICKS[aiRegime] || [];
        const regimeColor = EU_REGIME_COLORS[aiRegime] || "#555";
        if (picks.length === 0) return null;

        return (
          <section className="px-4 py-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-[#e0e0e0]">
                AI-driven Picks
              </h2>
              <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ color: regimeColor, backgroundColor: regimeColor + "20" }}>
                {aiRegime}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#222] text-[#555]">AI geo layer</span>
            </div>
            <p className="text-xs text-[#555] mb-4">
              If you trust the AI geopolitical layer over the lagging Eurostat data, these are the European UCITS ETFs that historically perform in {aiRegime} — reasoning from current events rather than hard data.
            </p>

            <div className="space-y-3">
              {picks.map((pick) => {
                const data = regimePickReturns[pick.ticker];
                const ret = data ? data["return"] : null;
                return (
                  <div key={pick.ticker} className="p-4 rounded-lg bg-[#111] border" style={{ borderColor: regimeColor + "30" }}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-sm font-bold text-[#e0e0e0]">{pick.ticker}</span>
                        <span className="text-xs text-[#555] ml-2">{pick.name}</span>
                      </div>
                      {ret !== null ? (
                        <span className="text-xs font-bold shrink-0" style={{ color: ret >= 0 ? "#22c55e" : "#ef4444" }}>
                          {ret >= 0 ? "+" : ""}{ret}% since regime
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#333]">loading...</span>
                      )}
                    </div>
                    <p className="text-xs text-[#888] leading-relaxed">{pick.rationale}</p>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[#555] mt-4 text-center italic">
              The AI layer and Eurostat data currently disagree. Compare both sets of picks and decide which signal you trust more given the current environment.
            </p>
          </section>
        );
      })()}

      {/* All European Regime Picks — Reference with performance comparison */}
      {(() => {
        // Compute average return per regime since the current regime started
        const regimeAvgs: Record<string, number | null> = {};
        (["Stagflation", "Reflation", "Goldilocks", "Deflation"] as const).forEach((regime) => {
          const picks = EU_REGIME_PICKS[regime] || [];
          const returns = picks
            .map((p) => regimePickReturns[p.ticker]?.return)
            .filter((r): r is number => typeof r === "number");
          regimeAvgs[regime] = returns.length > 0
            ? Math.round((returns.reduce((a, b) => a + b, 0) / returns.length) * 10) / 10
            : null;
        });
        const validAvgs = Object.entries(regimeAvgs).filter(([, v]) => v !== null) as [string, number][];
        const winner = validAvgs.length > 0
          ? validAvgs.reduce((a, b) => (a[1] > b[1] ? a : b))[0]
          : null;

        return (
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">European ETFs Across All Regimes</h2>
        <p className="text-xs text-[#555] mb-4">
          What historically performs in each economic season. Returns shown are since the current regime started ({euRegime?.periodStart?.slice(0, 7) || "—"}) — the average per regime shows which framework call is actually working right now.
        </p>

        {/* Leader summary */}
        {winner && (
          <div className="p-3 rounded-lg mb-4 border" style={{
            backgroundColor: EU_REGIME_COLORS[winner] + "10",
            borderColor: EU_REGIME_COLORS[winner] + "40",
          }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#555]">Currently winning:</span>
              <span className="text-sm font-bold" style={{ color: EU_REGIME_COLORS[winner] }}>{winner}</span>
              <span className="text-xs font-bold" style={{ color: EU_REGIME_COLORS[winner] }}>
                avg {regimeAvgs[winner]! >= 0 ? "+" : ""}{regimeAvgs[winner]}%
              </span>
            </div>
            <p className="text-[10px] text-[#555]">
              The {winner} picks have the best average return since the current regime started. If this doesn&apos;t match the current signal above, the framework&apos;s call may be wrong — or the underperforming regime&apos;s picks may be set up for a catch-up rally.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["Stagflation", "Reflation", "Goldilocks", "Deflation"] as const).map((regime) => {
            const picks = EU_REGIME_PICKS[regime] || [];
            const color = EU_REGIME_COLORS[regime];
            const isCurrent = euRegime?.confirmed === regime;
            const isWinner = winner === regime;
            const avg = regimeAvgs[regime];
            return (
              <div
                key={regime}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: isCurrent || isWinner ? color + "10" : "#111",
                  border: `1px solid ${isCurrent || isWinner ? color + "60" : "#222"}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-bold" style={{ color }}>{regime}</span>
                    {avg !== null && (
                      <span className="text-xs font-bold" style={{ color: avg >= 0 ? "#22c55e" : "#ef4444" }}>
                        avg {avg >= 0 ? "+" : ""}{avg}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isWinner && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: "#22c55e", backgroundColor: "#22c55e20" }}>
                        LEADING
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color, backgroundColor: color + "20" }}>
                        NOW
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {picks.map((pick) => {
                    const data = regimePickReturns[pick.ticker];
                    const ret = data ? data["return"] : null;
                    return (
                      <div key={pick.ticker} className="p-2 rounded bg-[#0a0a0a]">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-[#e0e0e0]">{pick.ticker}</span>
                          {ret !== null ? (
                            <span className="text-[10px] font-bold" style={{ color: ret >= 0 ? "#22c55e" : "#ef4444" }}>
                              {ret >= 0 ? "+" : ""}{ret}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#333]">—</span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#555]">{pick.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[#555] mt-4 text-center italic">
          All UCITS-compliant ETFs, accessible on Nordnet. Returns since current regime started, live from Yahoo Finance.
        </p>
      </section>
        );
      })()}

      {/* EU Regime History */}
      {euBacktest && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">
            {euBacktest.totalRegimes} Regimes. {euBacktest.yearRange}. Every European Call.
          </h2>
          <p className="text-xs text-[#555] mb-4">
            Historical regime timeline built from Eurostat data using the same four-quadrant framework as the US tracker.
          </p>

          {/* Regime breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(["Stagflation", "Goldilocks", "Reflation", "Deflation"] as const).map((regime) => {
              const count = euBacktest.regimeBreakdown[regime] || 0;
              const color = EU_REGIME_COLORS[regime];
              const pct = Math.round((count / euBacktest.totalRegimes) * 100);
              return (
                <div key={regime} className="p-3 rounded-lg text-center" style={{ borderColor: color + "30", backgroundColor: color + "10", border: "1px solid" }}>
                  <div className="text-xs text-[#888] mb-1">{regime}</div>
                  <div className="text-lg font-bold" style={{ color }}>{count}</div>
                  <div className="text-xs text-[#555]">{pct}% of periods</div>
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <h3 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-3">Recent Timeline — click to compare regime picks</h3>
          <div className="space-y-2">
            {euBacktest.timeline.slice(0, 15).map((p, i) => {
              const color = EU_REGIME_COLORS[p.regime] || "#555";
              const isExpanded = expandedTimelineIdx === i;
              const ret = p.picksReturn;
              return (
                <div key={i}>
                  <div
                    className="p-3 rounded-lg bg-[#111] border border-[#222] flex items-center gap-3 cursor-pointer hover:bg-[#151515] transition-colors"
                    onClick={() => setExpandedTimelineIdx(isExpanded ? null : i)}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm font-bold sm:w-28" style={{ color }}>{p.regime}</span>
                    <span className="text-xs text-[#888]">{p.start} → {p.end}</span>
                    <span className="text-xs text-[#555]">{p.months}mo</span>
                    <span className="ml-auto flex items-center gap-2">
                      {ret !== null && ret !== undefined && (
                        <span className="text-xs font-bold" style={{ color: ret >= 0 ? "#22c55e" : "#ef4444" }}>
                          {ret >= 0 ? "+" : ""}{ret.toFixed(1)}%
                        </span>
                      )}
                      <span className="text-[#333] text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                    </span>
                  </div>
                  {isExpanded && p.allRegimeReturns && (
                    <div className="mx-3 p-3 rounded-b-lg border border-t-0 border-[#222] bg-[#0a0a0a]">
                      {/* Signal context if present */}
                      {p.signalContext && (
                        <p className="text-xs text-[#888] mb-3 italic leading-relaxed">{p.signalContext}</p>
                      )}

                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">
                        How all 4 regime picks performed during this period
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(["Stagflation", "Goldilocks", "Reflation", "Deflation"] as const).map((r) => {
                          const rRet = p.allRegimeReturns?.[r];
                          const rColor = EU_REGIME_COLORS[r];
                          const isBest = p.bestRegime === r;
                          const isActual = p.regime === r;
                          return (
                            <div
                              key={r}
                              className="p-1.5 rounded"
                              style={{
                                backgroundColor: isBest ? "#22c55e10" : "#111",
                                border: isBest ? "1px solid #22c55e40" : "1px solid #1a1a1a",
                              }}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-[10px] font-bold" style={{ color: rColor }}>{r}</span>
                                {isActual && <span className="text-[8px] text-[#555]">[called]</span>}
                                {isBest && <span className="text-[8px] text-[#22c55e]">★</span>}
                              </div>
                              <div className="text-xs font-bold" style={{ color: rRet === null || rRet === undefined ? "#333" : rRet >= 0 ? "#22c55e" : "#ef4444" }}>
                                {rRet === null || rRet === undefined ? "—" : `${rRet >= 0 ? "+" : ""}${rRet.toFixed(1)}%`}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 3-way comparison: Eurostat / AI Geo / Best */}
                      {p.aiRegime && p.bestRegime && (() => {
                        const aiReg = p.aiRegime!;
                        const bestReg = p.bestRegime!;
                        const bestRet = p.allRegimeReturns?.[bestReg];
                        return (
                        <div className="mt-3 p-2 rounded bg-[#111] border border-[#222]">
                          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Eurostat vs AI geopolitical vs actual winner</div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded bg-[#0a0a0a]">
                              <div className="text-[9px] text-[#555] uppercase">Eurostat data</div>
                              <div className="text-xs font-bold" style={{ color: EU_REGIME_COLORS[p.regime] }}>
                                {p.regime}
                              </div>
                              {typeof p.picksReturn === "number" && (
                                <div className="text-[10px] mt-0.5" style={{ color: p.picksReturn >= 0 ? "#22c55e" : "#ef4444" }}>
                                  {p.picksReturn >= 0 ? "+" : ""}{p.picksReturn.toFixed(1)}%
                                </div>
                              )}
                            </div>
                            <div
                              className="p-2 rounded"
                              style={{
                                backgroundColor: p.aiDiffersFromFred ? "#9ca3af15" : "#0a0a0a",
                                border: p.aiDiffersFromFred ? "1px solid #9ca3af40" : "1px solid transparent",
                              }}
                            >
                              <div className="text-[9px] text-[#9ca3af] uppercase">AI geo</div>
                              {p.aiDiffersFromFred ? (
                                <>
                                  <div className="text-xs font-bold" style={{ color: EU_REGIME_COLORS[aiReg] }}>
                                    {aiReg}
                                  </div>
                                  {typeof p.aiPicksReturn === "number" && (
                                    <div className="text-[10px] mt-0.5" style={{ color: p.aiPicksReturn >= 0 ? "#22c55e" : "#ef4444" }}>
                                      {p.aiPicksReturn >= 0 ? "+" : ""}{p.aiPicksReturn.toFixed(1)}%
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="text-xs font-bold text-[#555]">= same as data</div>
                                  <div className="text-[10px] mt-0.5 text-[#333]">no override</div>
                                </>
                              )}
                            </div>
                            <div
                              className="p-2 rounded"
                              style={{
                                backgroundColor: "#22c55e10",
                                border: "1px solid #22c55e40",
                              }}
                            >
                              <div className="text-[9px] text-[#22c55e] uppercase">Winner ★</div>
                              <div className="text-xs font-bold" style={{ color: EU_REGIME_COLORS[bestReg] }}>
                                {bestReg}
                              </div>
                              {typeof bestRet === "number" && (
                                <div className="text-[10px] mt-0.5 text-[#22c55e]">
                                  +{bestRet.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 text-[10px] leading-relaxed">
                            {p.frameworkCorrect && p.aiCorrect && (
                              <span className="text-[#22c55e]">✓ Both Eurostat and AI agreed with the winner — strongest signal.</span>
                            )}
                            {!p.frameworkCorrect && p.aiCorrect && (
                              <span className="text-[#9ca3af]">✓ AI geo would have correctly called {bestReg} while Eurostat was wrong.</span>
                            )}
                            {p.frameworkCorrect && !p.aiCorrect && (
                              <span className="text-[#eab308]">⚠ Eurostat got it right but AI would have missed it.</span>
                            )}
                            {!p.frameworkCorrect && !p.aiCorrect && (
                              <span className="text-[#ef4444]">✗ Both Eurostat and AI missed — {bestReg} picks outperformed.</span>
                            )}
                          </div>

                          {/* Post-mortem for double-miss periods */}
                          {!p.frameworkCorrect && !p.aiCorrect && p.doubleMiss && (
                            <div className="mt-2 p-2 rounded bg-[#0a0a0a] border border-[#ef444425]">
                              <div className="text-[9px] text-[#ef4444] uppercase tracking-wider mb-2">
                                Post-mortem — why both layers missed
                              </div>
                              <div className="space-y-1.5">
                                <div className="text-[10px] leading-relaxed">
                                  <span className="text-[#e0e0e0] font-bold">What happened: </span>
                                  <span className="text-[#888]">{p.doubleMiss.event}</span>
                                </div>
                                <div className="text-[10px] leading-relaxed">
                                  <span className="text-[#e0e0e0] font-bold">Blind spot: </span>
                                  <span className="text-[#888]">{p.doubleMiss.blind_spot}</span>
                                </div>
                                <div className="text-[10px] leading-relaxed">
                                  <span className="text-[#e0e0e0] font-bold">Why {bestReg} won: </span>
                                  <span className="text-[#888]">{p.doubleMiss.winner_dynamic}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {euBacktest.timeline.length > 15 && (
            <div className="mt-3 text-center text-xs text-[#333]">
              Showing 15 most recent of {euBacktest.timeline.length} European regime periods
            </div>
          )}

          <p className="mt-4 text-xs text-[#333] text-center italic">
            Eurostat data with 2-month regime smoothing. Click any period to see how all 4 regime picks actually performed.
          </p>
        </section>
      )}

      {/* Transition to autonomy thesis */}
      <div className="px-4 pt-12 pb-4 max-w-5xl mx-auto text-center">
        <div className="border-t border-[#222] pt-8">
          <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">Beyond the Cycle</h2>
          <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold">European Strategic Autonomy</p>
          <p className="text-xs text-[#555] mt-2 max-w-lg mx-auto">
            The structural 3-10 year investment theme that runs alongside short-term regimes.
          </p>
        </div>
      </div>

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

      {/* Simple Version */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Simple Version</h2>
        <p className="text-xs text-[#555] mb-6">Four positions that capture the entire European strategic autonomy theme without managing 25 individual stocks.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Defence */}
          <div className="p-4 rounded-lg border border-[#6b8e5a30] bg-[rgba(107,142,90,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-lg font-bold text-[#6b8e5a]">EUAD</span>
                <span className="text-xs text-[#555] ml-2">iShares European Defence UCITS ETF</span>
              </div>
              <div className="flex items-center gap-2">
                <ReturnBadge ticker="EUAD.L" returns={returns} />
                <span className="text-xs px-2 py-0.5 rounded bg-[rgba(107,142,90,0.15)] text-[#6b8e5a]">Defence</span>
              </div>
            </div>
            <p className="text-xs text-[#555] mb-2">London Stock Exchange / Euronext</p>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              Holds only European defence companies — Rheinmetall, BAE Systems, Leonardo, Saab, Thales. Pure-play European rearmament with no US exposure. Policy-driven spending means this works across all macro regimes.
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#22c55e]">✅ All regimes</span>
              <span className="text-[#86c55e]">Conservative-Moderate</span>
            </div>
            <a href="https://finance.yahoo.com/quote/EUAD.L/" target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 mt-2 inline-block">View on Yahoo Finance</a>
          </div>

          {/* Energy */}
          <div className="p-4 rounded-lg border border-[#e0903030] bg-[rgba(224,144,48,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-lg font-bold text-[#e09030]">IOGP</span>
                <span className="text-xs text-[#555] ml-2">iShares Oil &amp; Gas Exploration UCITS</span>
              </div>
              <div className="flex items-center gap-2">
                <ReturnBadge ticker="IOGP.L" returns={returns} />
                <span className="text-xs px-2 py-0.5 rounded bg-[rgba(224,144,48,0.15)] text-[#e09030]">Energy</span>
              </div>
            </div>
            <p className="text-xs text-[#555] mb-2">London Stock Exchange</p>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              Holds Equinor, TotalEnergies, Shell and other European energy majors. Captures both the energy independence theme and the current Stagflation tailwind simultaneously.
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#ef4444]">✅✅ Stagflation (current)</span>
              <span className="text-[#86c55e]">Conservative-Moderate</span>
            </div>
            <a href="https://www.nordnet.no/market/search?query=IOGP" target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 mt-2 inline-block">View on Nordnet</a>
          </div>

          {/* Technology */}
          <div className="p-4 rounded-lg border border-[#3b82f630] bg-[rgba(59,130,246,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-lg font-bold text-[#3b82f6]">ASML</span>
                <span className="text-xs text-[#555] ml-2">ASML Holding NV</span>
              </div>
              <div className="flex items-center gap-2">
                <ReturnBadge ticker="ASML.AS" returns={returns} />
                <span className="text-xs px-2 py-0.5 rounded bg-[rgba(59,130,246,0.15)] text-[#3b82f6]">Technology</span>
              </div>
            </div>
            <p className="text-xs text-[#555] mb-2">Euronext Amsterdam / NASDAQ</p>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              No ETF captures European technology sovereignty as cleanly as owning ASML directly. Global monopoly on EUV lithography — every advanced chip requires their equipment. ASML IS the European tech thesis.
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#eab308]">➖ Neutral (Goldilocks preferred)</span>
              <span className="text-[#eab308]">Moderate</span>
            </div>
            <p className="text-xs text-[#eab308] mt-1">⚠ Single stock — higher concentration risk but no adequate ETF alternative exists</p>
            <a href="https://www.nordnet.no/market/search?query=ASML" target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 mt-2 inline-block">View on Nordnet</a>
          </div>

          {/* Materials */}
          <div className="p-4 rounded-lg border border-[#a855f730] bg-[rgba(168,85,247,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-lg font-bold text-[#a855f7]">NHY</span>
                <span className="text-xs text-[#555] ml-2">Norsk Hydro ASA</span>
              </div>
              <div className="flex items-center gap-2">
                <ReturnBadge ticker="NHY.OL" returns={returns} />
                <span className="text-xs px-2 py-0.5 rounded bg-[rgba(168,85,247,0.15)] text-[#a855f7]">Materials</span>
              </div>
            </div>
            <p className="text-xs text-[#555] mb-2">Oslo Børs (Nordnet — NOK)</p>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              Norwegian aluminium and renewable energy company. Lowest-carbon aluminium globally via hydropower. Aluminium is critical for defence, aerospace, and EV manufacturing.
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#22c55e]">✅ Stagflation / ✅✅ Reflation</span>
              <span className="text-[#86c55e]">Conservative-Moderate</span>
            </div>
            <p className="text-xs text-[#a855f7] mt-1">Norwegian investors: NOK denominated, Nordnet accessible, government partial owner</p>
            <a href="https://www.nordnet.no/market/search?query=NHY" target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 mt-2 inline-block">View on Nordnet</a>
          </div>
        </div>

        {/* Notable addition */}
        <div className="p-3 rounded-lg border border-[#eab30830] bg-[rgba(234,179,8,0.03)] mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-[#eab308]">Worth knowing: Safran (SAF.PA)</span>
          </div>
          <p className="text-xs text-[#888] leading-relaxed">
            The only European company with sovereign capabilities in commercial aviation, military propulsion, AND space simultaneously. Tracked in both Defence and Technology sectors below.
          </p>
          <a href="https://www.nordnet.no/market/search?query=SAF" target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 mt-1 inline-block">View on Nordnet</a>
        </div>

        {/* Coverage summary */}
        <div className="p-3 rounded-lg bg-[#111] border border-[#222] text-center text-xs text-[#888] mb-4">
          Combined: Defence ✅ | Energy ✅ | Technology ✅ | Materials ✅ | Finance ➖
        </div>
        <p className="text-xs text-[#555] text-center mb-6">
          Financial infrastructure has no clean ETF — consider Euronext (ENX) directly for this exposure, or accept the gap.
        </p>

        {/* Performance since Feb 2022 */}
        <div className="p-4 rounded-lg bg-[#111] border border-[#222] mb-6">
          <h3 className="text-sm font-bold text-[#e0e0e0] mb-2">Since Russia&apos;s invasion of Ukraine (February 2022)</h3>
          <p className="text-xs text-[#555] mb-3">The structural catalyst date for European strategic autonomy</p>
          <div className="space-y-2 text-xs">
            {PERF_TICKERS.map((t) => {
              const d = invasionReturns[t];
              const names: Record<string, string> = {
                "RHM.DE": "Rheinmetall (held inside EUAD)",
                "EUAD.L": "iShares European Defence ETF",
                "SAF.PA": "Safran",
                "ASML.AS": "ASML",
                "IOGP.L": "iShares Oil & Gas",
                "SPY": "S&P 500",
                "NHY.OL": "Norsk Hydro",
              };
              return (
                <div key={t} className="flex justify-between items-center">
                  <span className="text-[#888]">{t} — {names[t] || t}{d ? ` ($${d.startPrice} → $${d.price})` : ""}</span>
                  {d ? (
                    <span className={`font-bold ${d["return"] >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {d["return"] >= 0 ? "+" : ""}{d["return"]}%
                    </span>
                  ) : (
                    <span className="text-[#333]">loading...</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#555] mt-2">* EUAD launched after February 2022 — return shown since inception. Rheinmetall shown as individual stock to demonstrate underlying European defence performance.</p>
          <p className="text-xs text-[#888] mt-2">
            European defence massively outperformed — policy-driven spending immune to macro cycles. EUAD captures this in one ETF with zero US exposure. Live prices from Yahoo Finance.
          </p>
          <p className="text-xs text-[#333] mt-2 italic">Past performance does not guarantee future results. February 2022 chosen as the structural catalyst date.</p>
        </div>

        {/* Nordnet guide */}
        <NordnetGuide />

        {/* Disclaimer */}
        <p className="text-xs text-[#333] text-center italic mt-4">
          ETF and stock selection for educational purposes only. Not a recommendation to buy or sell. Always verify current availability on your broker. Currency risk applies to non-NOK positions. Not personalised financial advice.
        </p>
      </section>

      {/* Divider */}
      <div className="px-4 py-6 max-w-5xl mx-auto text-center">
        <div className="border-t border-[#222] pt-6">
          <span className="text-xs text-[#555]">Want to go deeper? Explore all 25+ companies across five sectors below ↓</span>
        </div>
      </div>

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

      {/* European Autonomy Beyond Europe */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">European Autonomy Creates Demand Beyond Europe</h2>
        <p className="text-xs text-[#555] mb-4">The countries supplying Europe&apos;s independence are themselves investment opportunities.</p>

        <p className="text-xs text-[#888] leading-relaxed mb-6">
          Europe&apos;s structural shift toward independence requires raw materials, energy, and manufacturing capacity that Europe cannot fully supply itself. The emerging economies enabling this shift — providing LNG, critical metals, solar capacity, and manufacturing alternatives to China — benefit directly from European spending regardless of which power wins the world order transition.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#f97316" }}>
            <div className="text-xs font-bold text-[#f97316] mb-2">Energy Supply</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              Europe replacing Russian gas creates long-term LNG contracts with Gulf states and North Africa.
            </p>
            <div className="text-[10px] text-[#555] mb-2">Key beneficiaries: Saudi Arabia, UAE, Morocco, Algeria</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#888]">KSA — iShares MSCI Saudi Arabia</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#22c55e" }}>
            <div className="text-xs font-bold text-[#22c55e] mb-2">Critical Materials</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              European defence and green energy transition requires copper, cobalt, lithium, and rare earths at scale.
            </p>
            <div className="text-[10px] text-[#555] mb-2">Key beneficiaries: Indonesia (nickel), Brazil (iron ore), Morocco (phosphates)</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#888]">EIDO — iShares MSCI Indonesia</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#3b82f6" }}>
            <div className="text-xs font-bold text-[#3b82f6] mb-2">Manufacturing Relocation</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              European companies moving supply chains away from China are choosing Morocco, Turkey, and India — close, competitive, and politically safe.
            </p>
            <div className="text-[10px] text-[#555] mb-2">Key beneficiaries: Morocco, Turkey, India</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#888]">INDA — iShares MSCI India</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#ef4444" }}>
            <div className="text-xs font-bold text-[#ef4444] mb-2">Defence Customers</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              European defence companies need customers. Gulf states and Eastern European nations questioning US reliability are buying European weapons and equipment.
            </p>
            <div className="text-[10px] text-[#555] mb-2">Key beneficiaries: Saudi Arabia, UAE, Poland, Turkey</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#888]">TUR — iShares MSCI Turkey</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/emerging-markets" className="inline-block px-6 py-2 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors">
            Explore emerging markets →
          </a>
        </div>
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
