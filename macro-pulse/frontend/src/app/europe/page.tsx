"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import { subscribeEmail } from "@/lib/subscribe";

type EuropeSignupPhase = "idle" | "submitting" | "awaiting_confirm" | "missing" | "error";
const EUROPE_SIGNUP_SOURCE = "europe";
import Nav from "@/components/Nav";
import PeriodChat from "@/components/PeriodChat";
import SectionChat from "@/components/SectionChat";
import {
  europeStrategicCards,
} from "@/lib/europeData";
import WorldOrderPosition from "@/components/WorldOrderPosition";








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
  periodAnalysis?: { event: string; why_data: string; why_ai: string; winner_dynamic: string } | null;
};
type EuBacktest = { totalRegimes: number; yearRange: string; timeline: EuBacktestEntry[]; regimeBreakdown: Record<string, number> };

const EU_REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444", Goldilocks: "#22c55e", Reflation: "#eab308", Deflation: "#3b82f6",
};

export default function EuropePage() {
  const [email, setEmail] = useState("");
  const [subPhase, setSubPhase] = useState<EuropeSignupPhase>("idle");
  const [subErrorMessage, setSubErrorMessage] = useState("");
  const [euRegime, setEuRegime] = useState<EuRegimeData | null>(null);
  const [euBacktest, setEuBacktest] = useState<EuBacktest | null>(null);
  const [regimePickReturns, setRegimePickReturns] = useState<ReturnData>({});
  const [expandedRegime, setExpandedRegime] = useState<string | null>(null);
  const [expandedTimelineIdx, setExpandedTimelineIdx] = useState<number | null>(null);
  const [europeInterpretation, setEuropeInterpretation] = useState<string | null>(null);

  // EU guidance layer state
  const [euAllocation, setEuAllocation] = useState<{ regime: string; periodStart?: string; cashTarget: number; overweight: { ticker: string; name: string; weight: number; conviction: number; rationale: string; returnSinceRegime?: number | null }[]; underweight: { ticker: string; name: string; reason: string; returnSinceRegime?: number | null }[] } | null>(null);
  const [euTriggers, setEuTriggers] = useState<{ name: string; current: string; threshold: string; status: string; action: string; urgency: string }[]>([]);
  const [euTransition, setEuTransition] = useState<{ currentRegime: string; durationStats: { months: number }; outlook: { regime: string; probability: number; description: string; signals: string[]; etfs: { ticker: string; name: string; conviction: number }[] }[] } | null>(null);
  const [euCalendar, setEuCalendar] = useState<{ name: string; source: string; date?: string; day?: string; impact: string; implication: string }[]>([]);

  useEffect(() => {
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
    // EU guidance layer
    fetch(apiUrl("/api/eu/allocation"))
      .then((r) => r.json())
      .then((d) => { if (!d.error) setEuAllocation(d); })
      .catch(() => {});
    fetch(apiUrl("/api/eu/triggers"))
      .then((r) => r.json())
      .then((d) => { if (d.triggers) setEuTriggers(d.triggers); })
      .catch(() => {});
    fetch(apiUrl("/api/eu/transition"))
      .then((r) => r.json())
      .then((d) => { if (!d.error) setEuTransition(d); })
      .catch(() => {});
    fetch(apiUrl("/api/eu/calendar"))
      .then((r) => r.json())
      .then((d) => { if (d.events) setEuCalendar(d.events); })
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
    if (!email || subPhase === "submitting") return;
    setSubPhase("submitting");
    setSubErrorMessage("");
    const result = await subscribeEmail({
      email,
      source: EUROPE_SIGNUP_SOURCE,
      waitlistFeatures: ["europe_tracker"],
    });
    if (result.ok) {
      setSubPhase("awaiting_confirm");
    } else {
      setSubErrorMessage(result.message);
      setSubPhase("error");
    }
  };

  const handleEuropeMissing = () => setSubPhase("missing");

  return (
    <main className="min-h-screen">
      <Nav />
      {/* Header */}
      <section className="px-4 pt-8 pb-4 max-w-5xl mx-auto">
        <div className="text-center mt-8 mb-6">
          <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">European Regime Tracker</h1>
          <p className="text-2xl sm:text-3xl text-[#e0e0e0] font-bold mb-3">
            How Europe affects the AI Race
          </p>
          <p className="text-sm text-[#555] max-w-lg mx-auto">
            Europe holds the key chokepoint: ASML&apos;s EUV lithography monopoly. No advanced chips exist without it. The EU regime determines defence automation spending (EUAD), energy buildout (ICLN), and whether European supply chain ETFs are discounted.
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

      {/* EU Portfolio Allocation */}
      {euAllocation && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">European Allocation</h2>
          <p className="text-xs text-[#555] mb-4">
            UCITS ETF weights for the current European regime — conviction-proportional with {euAllocation.cashTarget}% cash.
          </p>
          <div className="space-y-2 mb-4">
            {euAllocation.overweight.map((etf) => (
              <div key={etf.ticker} className="p-3 rounded-lg bg-[#111] border border-[#222] flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2 sm:w-48">
                  <span className="text-sm font-bold text-[#22c55e]">{etf.weight}%</span>
                  <span className="text-sm font-bold text-[#e0e0e0]">{etf.ticker}</span>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-[#888]">{etf.name}</span>
                  <p className="text-[10px] text-[#555] mt-0.5">{etf.rationale}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {typeof etf.returnSinceRegime === "number" && (
                    <span className={`text-sm font-bold ${etf.returnSinceRegime >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {etf.returnSinceRegime >= 0 ? "+" : ""}{etf.returnSinceRegime.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[10px] text-[#555]">Conv: {etf.conviction}</span>
                </div>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-[#111] border border-[#222] flex items-center gap-2">
              <span className="text-sm font-bold text-[#eab308]">{euAllocation.cashTarget}%</span>
              <span className="text-sm text-[#888]">Cash</span>
              <span className="text-xs text-[#555] ml-auto">Regime uncertainty buffer</span>
            </div>
          </div>
          {euAllocation.underweight.length > 0 && (
            <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818]">
              <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-2">Underweight in {euAllocation.regime}</div>
              <div className="space-y-1">
                {euAllocation.underweight.map((u) => (
                  <div key={u.ticker} className="text-xs">
                    <span className="text-[#e0e0e0] font-bold">{u.ticker}</span>{" "}
                    <span className="text-[#555]">{u.name}</span>{" "}
                    <span className="text-[#333]">— {u.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <SectionChat
            context="European portfolio allocation section. Shows UCITS ETF weights for the current EU regime with conviction scores. Overweight = ETFs that benefit from the current European regime. Underweight = ETFs suited for other regimes."
            label="Ask about EU allocation"
            suggestions={["Why these ETFs?", "How does this compare to the US allocation?", "What would change this?"]}
          />
        </section>
      )}

      {/* EU Calendar */}
      {euCalendar.length > 0 && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">European Calendar</h2>
          <p className="text-xs text-[#555] mb-4">Upcoming releases that affect the European regime signal</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {euCalendar.map((evt) => {
              const impactColor = evt.impact === "High" ? "#ef4444" : evt.impact === "Medium" ? "#eab308" : "#22c55e";
              return (
                <div key={evt.name} className="p-3 rounded-lg bg-[#111] border border-[#222]">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-xs font-bold text-[#e0e0e0] leading-tight">{evt.name}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded ml-2 shrink-0" style={{ color: impactColor, backgroundColor: impactColor + "20" }}>
                      {evt.impact}
                    </span>
                  </div>
                  {evt.date && <div className="text-[10px] text-[#555] mb-1">{evt.day ? `${evt.day}, ` : ""}{evt.date} · {evt.source}</div>}
                  {!evt.date && <div className="text-[10px] text-[#555] mb-1">{evt.source}</div>}
                  <p className="text-[10px] text-[#888] leading-relaxed">{evt.implication}</p>
                </div>
              );
            })}
          </div>
          <SectionChat
            context="European economic calendar. Shows upcoming ECB decisions, Eurostat releases, PMI data, and other events that affect the European regime signal."
            label="Ask about upcoming events"
            suggestions={["Which event matters most?", "How will ECB rate decision affect positioning?", "What's the market expecting?"]}
          />
        </section>
      )}

      {/* EU Triggers */}
      {euTriggers.length > 0 && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">European Regime Triggers</h2>
          <p className="text-xs text-[#555] mb-4">Live thresholds that would shift the European regime signal</p>
          <div className="space-y-2">
            {euTriggers.map((t) => {
              const statusColor = t.status === "crisis" ? "#ef4444" : t.status === "watch" ? "#eab308" : "#22c55e";
              const statusLabel = t.status === "crisis" ? "CRISIS" : t.status === "watch" ? "WATCH" : "STABLE";
              return (
                <div key={t.name} className="p-3 rounded-lg bg-[#111] border border-[#222] flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 sm:w-56">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: statusColor, backgroundColor: statusColor + "20" }}>{statusLabel}</span>
                    <span className="text-sm font-bold text-[#e0e0e0]">{t.name}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#888]">Current: <span className="text-[#e0e0e0]">{t.current}</span></div>
                    <div className="text-[10px] text-[#555] mt-0.5">{t.threshold}</div>
                  </div>
                  <div className="text-xs text-[#555] sm:text-right sm:max-w-[180px]">{t.action}</div>
                </div>
              );
            })}
          </div>
          <SectionChat
            context="European regime triggers. Shows ECB deposit rate, TTF gas price, Eurozone PMI, Italy-Germany spread, EUR/USD, and HICP inflation. Each has a threshold that would shift the European regime signal."
            label="Ask about EU triggers"
            suggestions={["Which trigger is closest to firing?", "How does the ECB rate affect the regime?", "What if gas prices spike again?"]}
          />
        </section>
      )}

      {/* EU Transition Outlook */}
      {euTransition && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">European Transition Radar</h2>
          <p className="text-xs text-[#555] mb-1">
            When triggers fire, these are the UCITS ETFs to watch — ranked by transition probability
          </p>
          <p className="text-xs text-[#888] mb-4">
            Current regime: <span className="font-bold" style={{ color: EU_REGIME_COLORS[euTransition.currentRegime] || "#888" }}>{euTransition.currentRegime}</span> — Month {euTransition.durationStats.months}
          </p>
          <div className="space-y-4">
            {euTransition.outlook.map((o) => {
              const color = EU_REGIME_COLORS[o.regime] || "#888";
              return (
                <div key={o.regime} className="rounded-lg border overflow-hidden" style={{ borderColor: color + "30" }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: color + "10" }}>
                    <div>
                      <span className="text-sm font-bold" style={{ color }}>{o.regime}</span>
                      <span className="text-xs text-[#555] ml-2">{o.probability}% probability</span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-[#888] mb-2">{o.description}</p>
                    {o.signals.length > 0 && (
                      <div className="mb-2">
                        <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Confirmation signals</div>
                        {o.signals.map((s, i) => (
                          <div key={i} className="text-[10px] text-[#888]">• {s}</div>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">ETFs to watch</div>
                    <div className="flex flex-wrap gap-2">
                      {o.etfs.map((e) => (
                        <span key={e.ticker} className="text-xs px-2 py-1 rounded bg-[#0a0a0a] border border-[#222]">
                          <span className="font-bold text-[#e0e0e0]">{e.ticker}</span>{" "}
                          <span className="text-[#555]">{e.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <SectionChat
            context="European transition outlook. Shows probability of transitioning from the current EU regime to each alternative, with confirmation signals and UCITS ETF opportunities per scenario."
            label="Ask about EU transitions"
            suggestions={["What's the most likely next EU regime?", "When should I start rotating?", "How does Europe's transition differ from the US?"]}
          />
        </section>
      )}

      <div className="border-t border-[#181818]" />

      <WorldOrderPosition
        title="Europe in the World Order Transition"
        subtitle="Four dimensions of Europe's position as the emerging third pole"
        cards={europeStrategicCards}
        accent="#3b82f6"
        chatContext="Europe's position in Dalio's world order transition. Covers strategic autonomy acceleration (defence spending 1.5% → 2.5%+ GDP), energy independence (Russian gas 40% → 8%), technology sovereignty (ASML 100% EUV monopoly, EU Chips Act €43B), and the EU as third pole between US and China. European defence stocks (EUAD +820% since Ukraine) are pricing in this structural shift."
        chatSuggestions={[
          "Is Europe becoming a third superpower?",
          "How does Hormuz closure affect European energy?",
          "Which European companies benefit most from autonomy?",
        ]}
      />

      <div className="border-t border-[#181818]" />

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


                          <PeriodChat context={{
                            region: "EU",
                            start: p.start,
                            end: p.end,
                            regime: p.regime,
                            aiRegime: p.aiRegime,
                            bestRegime: bestReg,
                            allRegimeReturns: p.allRegimeReturns,
                            periodAnalysis: p.periodAnalysis,
                          }} />
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


      {/* Link to autonomy thesis on World Order page */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
          <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">Beyond the Cycle</h2>
          <p className="text-lg font-bold text-[#e0e0e0] mb-2">European Strategic Autonomy</p>
          <p className="text-xs text-[#555] mb-4 max-w-md mx-auto">
            The structural 3-10 year thesis — defence, energy, technology, materials — is now part of the World Order Monitor.
          </p>
          <a href="/world-order" className="inline-block px-6 py-3 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors">
            View European autonomy thesis &rarr;
          </a>
        </div>
      </section>


      {/* Email */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="p-4 rounded-lg bg-[#111] border border-[#222] text-center">
          {(subPhase === "idle" || subPhase === "submitting" || subPhase === "error") && (
            <>
              <p className="text-sm text-[#e0e0e0] mb-1">Track the European autonomy theme</p>
              <p className="text-xs text-[#555] mb-3">Quarterly updates on milestones, policy, and company developments.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required disabled={subPhase === "submitting"} className="flex-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none text-center sm:text-left disabled:opacity-50" />
                <button type="submit" disabled={subPhase === "submitting"} className="px-6 py-2 bg-[#222] hover:bg-[#333] text-sm text-[#e0e0e0] rounded transition-colors disabled:opacity-50">{subPhase === "submitting" ? "Sending…" : "Track Europe"}</button>
              </form>
              {subPhase === "error" && subErrorMessage && (
                <p className="text-xs text-[#ef4444] mt-2" role="alert">{subErrorMessage}</p>
              )}
            </>
          )}

          {subPhase === "awaiting_confirm" && (
            <div className="max-w-md mx-auto py-2">
              <p className="text-sm text-[#22c55e] mb-2">You&apos;re subscribed.</p>
              <p className="text-xs text-[#888] mb-3 leading-relaxed">
                We just sent a welcome email to <b className="text-[#e0e0e0]">{email}</b> from{" "}
                <span className="text-[#e0e0e0]">hello@worldorderview.com</span>. Open it and click
                the <b className="text-[#22c55e]">&quot;Confirm I got this email ✓&quot;</b> button
                so we know our delivery pipeline is working.
              </p>
              <button type="button" onClick={handleEuropeMissing} className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 transition-colors">Didn&apos;t arrive?</button>
            </div>
          )}

          {subPhase === "missing" && (
            <div className="max-w-md mx-auto py-2 text-left">
              <p className="text-sm text-[#eab308] mb-2 text-center">Can&apos;t find it?</p>
              <ul className="text-xs text-[#888] space-y-1.5 mb-3 list-disc list-inside">
                <li>Check your spam / promotions folder for &quot;Welcome to World Order View&quot;</li>
                <li>Add <b className="text-[#e0e0e0]">hello@worldorderview.com</b> to your contacts so future alerts land in your inbox</li>
                <li>Still nothing after 5 minutes? Email <b className="text-[#e0e0e0]">hello@worldorderview.com</b> directly and we&apos;ll sort it out</li>
              </ul>
              <p className="text-[10px] text-[#555] text-center">You&apos;re still subscribed — we&apos;ll send the next update either way.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          Companies listed are for research and educational purposes only. This is not a recommendation to buy or sell any security. European strategic autonomy is a long-term structural thesis with significant execution risks. Past performance does not guarantee future results.
        </p>
        <div className="flex gap-4 justify-center mt-3">
          <a href="/" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Back to World Order View</a>
          <a href="/disclaimer" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Disclaimer</a>
        </div>
        <p className="text-xs text-[#555] mt-4">
          Built by <em>Lucas Rodrigues</em> — <a href="https://www.linkedin.com/in/lucas-rodrigues-27a51b1a3/" target="_blank" rel="noopener noreferrer" className="hover:text-[#888] underline underline-offset-2">follow along on LinkedIn</a>
        </p>
      </footer>
    </main>
  );
}
