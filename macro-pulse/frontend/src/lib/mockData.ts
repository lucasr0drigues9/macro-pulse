// Mock data matching real Python tool output shapes
// Will be replaced with FastAPI calls in Step 2

export const REGIME_COLORS = {
  Stagflation: { color: "#ef4444", dim: "rgba(239, 68, 68, 0.15)", emoji: "🔴" },
  Goldilocks: { color: "#22c55e", dim: "rgba(34, 197, 94, 0.15)", emoji: "🟢" },
  Reflation: { color: "#eab308", dim: "rgba(234, 179, 8, 0.15)", emoji: "🟡" },
  Deflation: { color: "#3b82f6", dim: "rgba(59, 130, 246, 0.15)", emoji: "🔵" },
} as const;

export type RegimeName = keyof typeof REGIME_COLORS;

// Section 1 — Regime Indicator
export const regimeData = {
  confirmed: "Stagflation" as RegimeName,
  consecutiveMonths: 4,
  fredSignal: {
    regime: "Reflation" as RegimeName,
    note: "Based on Jan/Feb FRED data (1-2 month lag)",
    lastUpdated: "2026-03-14",
  },
  geoSignal: {
    regime: "Stagflation" as RegimeName,
    note: "AI synthesis updated daily — Iran/Hormuz crisis",
    lastUpdated: "2026-03-31",
  },
  lagWarning: true,
  earlyTransition: null as {
    targetRegime: RegimeName;
    flickeringIndicators: string[];
    confirmingIndicators: string[];
  } | null,
};

// Section 2 — Asset Performance
export const assetPerformance = {
  regimeStartDate: "2025-12-01",
  regime: "Stagflation" as RegimeName,
  assets: [
    { ticker: "XLE", name: "Energy Select SPDR", returnPct: 38.2, category: "pick" as const },
    { ticker: "GLD", name: "SPDR Gold Shares", returnPct: 22.7, category: "pick" as const },
    { ticker: "DBC", name: "Invesco DB Commodity", returnPct: 15.4, category: "pick" as const },
    { ticker: "XLP", name: "Consumer Staples SPDR", returnPct: 4.1, category: "pick" as const },
    { ticker: "XLU", name: "Utilities Select SPDR", returnPct: 2.8, category: "pick" as const },
    { ticker: "SPY", name: "S&P 500 ETF", returnPct: -8.3, category: "benchmark" as const },
    { ticker: "QQQ", name: "Nasdaq 100 ETF", returnPct: -14.6, category: "avoid" as const },
    { ticker: "TLT", name: "20+ Year Treasury", returnPct: -11.2, category: "avoid" as const },
    { ticker: "IWM", name: "Russell 2000 ETF", returnPct: -16.8, category: "avoid" as const },
    { ticker: "GURU", name: "Global Guru ETF", returnPct: -9.5, category: "avoid" as const },
  ],
};

// Section 3 — Portfolio Allocation
export const allocationData = {
  regime: "Stagflation" as RegimeName,
  overweight: [
    { ticker: "XLE", name: "Energy Select SPDR", weight: 30, conviction: 0.95, priceAssessment: "Still attractive" as const, rationale: "Hormuz blockade sustains energy scarcity premium. Supply disruption far from resolved." },
    { ticker: "GLD", name: "SPDR Gold Shares", weight: 20, conviction: 0.85, priceAssessment: "Fairly valued" as const, rationale: "Portfolio insurance against both stagflation and geopolitical escalation." },
    { ticker: "DBC", name: "Invesco DB Commodity", weight: 20, conviction: 0.90, priceAssessment: "Still attractive" as const, rationale: "Broad commodity exposure benefits from supply-side inflation pressures." },
    { ticker: "XLP", name: "Consumer Staples SPDR", weight: 15, conviction: 0.75, priceAssessment: "Fairly valued" as const, rationale: "Defensive positioning with pricing power during inflationary periods." },
    { ticker: "XLU", name: "Utilities Select SPDR", weight: 15, conviction: 0.70, priceAssessment: "Still attractive" as const, rationale: "Defensive yield play. Outperforms when growth slows and rates plateau." },
  ],
  underweight: [
    { ticker: "QQQ", name: "Nasdaq 100 ETF", rationale: "Growth stocks suffer from rising rates and declining consumer spending power." },
    { ticker: "TLT", name: "20+ Year Treasury", rationale: "Long duration bonds lose value as inflation expectations remain elevated." },
    { ticker: "IWM", name: "Russell 2000 ETF", rationale: "Small caps most exposed to economic slowdown and tightening credit." },
    { ticker: "GURU", name: "Global Guru ETF", rationale: "Superinvestor picks lag during stagflation — typically overweight growth." },
  ],
  earlyRotation: null as {
    targetRegime: RegimeName;
    positions: { ticker: string; name: string; weight: number; priceAssessment: string }[];
  } | null,
};

// Section 4 — Weekly Calendar
export const calendarData = [
  { name: "CPI (March)", source: "Bureau of Labor Statistics", date: "2026-04-10", day: "Thursday", impact: "High" as const, implication: "Energy component will dominate headline CPI. Core services key for Fed policy direction." },
  { name: "Initial Jobless Claims", source: "Department of Labor", date: "2026-04-03", day: "Thursday", impact: "Medium" as const, implication: "Rising claims would confirm growth slowdown leg of stagflation." },
  { name: "ISM Manufacturing PMI", source: "ISM", date: "2026-04-01", day: "Tuesday", impact: "High" as const, implication: "Below 50 confirms manufacturing contraction — supports stagflation read." },
  { name: "FOMC Minutes (March)", source: "Federal Reserve", date: "2026-04-09", day: "Wednesday", impact: "Medium" as const, implication: "Watch for language on energy shock persistence vs growth risks." },
  { name: "Retail Sales (March)", source: "Census Bureau", date: "2026-04-15", day: "Tuesday", impact: "High" as const, implication: "Consumer spending under pressure from energy costs — key growth signal." },
];

// Section 5 — Regime Triggers
export const triggersData = [
  { name: "Strait of Hormuz Daily Transits", current: "6/day", threshold: "Below 3/day for 7 consecutive days", status: "watch" as const, action: "Full stagflation regime activation — oil supply shock", urgency: "HIGH" as const },
  { name: "WTI Crude Oil Price", current: "$109.60", threshold: "Sustained above $120/bbl for 10 days", status: "watch" as const, action: "Stagflation regime lock-in — energy crisis confirmed", urgency: "HIGH" as const },
  { name: "US Core CPI Monthly", current: "Awaiting April 10 data", threshold: "Above 0.7% MoM for 2 months", status: "stable" as const, action: "Accelerate to entrenched stagflation", urgency: "HIGH" as const },
  { name: "Federal Reserve Emergency Cut", current: "Held at 3.50–3.75%", threshold: "50+ bps cut citing energy shock", status: "stable" as const, action: "Shift to crisis management regime", urgency: "MEDIUM" as const },
  { name: "China Trade Retaliation", current: "Section 301 investigations launched", threshold: "Tariffs on >$200B additional US goods", status: "watch" as const, action: "Supply chain disruption amplifies stagflation", urgency: "MEDIUM" as const },
  { name: "SPR Emergency Release", current: "No release announced", threshold: "Emergency release >50M barrels", status: "stable" as const, action: "Temporary reflation extension — buys time", urgency: "LOW" as const },
];

// Section 6 — Regime Playbook
export const playbookData: Record<RegimeName, {
  description: string;
  whatHappens: string;
  outperform: { asset: string; why: string }[];
  underperform: { asset: string; why: string }[];
  historicalExamples: string[];
}> = {
  Stagflation: {
    description: "Falling growth + Rising inflation",
    whatHappens: "The economy slows while prices keep rising. Central banks are trapped — raising rates kills growth further, cutting rates fuels inflation. Corporate margins compress as input costs rise but pricing power fades. This is the most destructive regime for traditional portfolios.",
    outperform: [
      { asset: "Energy (XLE)", why: "Energy companies earn more as oil/gas prices spike. Their revenues are directly tied to the commodity driving inflation." },
      { asset: "Gold (GLD)", why: "Gold is the classic stagflation hedge — it holds value when currencies lose purchasing power and real rates are negative." },
      { asset: "Commodities (DBC)", why: "Physical commodities are the inflation itself. Holding them is a direct bet on the input costs that are causing the problem." },
      { asset: "Consumer Staples (XLP)", why: "People still buy food and toothpaste. These companies have pricing power and stable demand regardless of the cycle." },
    ],
    underperform: [
      { asset: "Nasdaq/Growth (QQQ)", why: "High-growth companies depend on cheap capital and expanding multiples. Both vanish when rates rise and growth slows." },
      { asset: "Long Bonds (TLT)", why: "Rising inflation erodes the fixed coupons that bonds pay. Duration is your enemy when the price level is unstable." },
      { asset: "Small Caps (IWM)", why: "Small companies have less pricing power, higher debt sensitivity, and less ability to weather economic contraction." },
    ],
    historicalExamples: ["1973–1975 (oil embargo)", "1979–1982 (Volcker era)", "2022 (post-COVID supply shock)", "2025–2026 (Iran/Hormuz crisis)"],
  },
  Goldilocks: {
    description: "Rising growth + Falling inflation",
    whatHappens: "The best of all worlds. The economy expands while inflation cools, giving central banks room to cut rates or hold steady. Corporate earnings grow, multiples expand, and risk appetite is high. SPY is the core — it's hard to beat with sector picks. Layer high-growth ETFs on top for extra upside.",
    outperform: [
      { asset: "S&P 500 (SPY)", why: "Core holding. +6.2% avg, 100% win rate. When everything is rising, owning the whole market is the simplest and most reliable strategy." },
      { asset: "Nasdaq 100 (QQQ)", why: "Broad growth exposure. +8.5% avg, 100% win rate across 19 years. The default growth tilt on top of SPY." },
      { asset: "ARK Next Gen Internet (ARKW)", why: "High-growth tilt — +17% avg in Goldilocks. Volatile but powerful when growth runs and rates fall. Limited data." },
      { asset: "Fidelity MSCI IT (FTEC)", why: "Broad tech exposure holding AI winners — Nvidia, Microsoft, Apple. +9.9% avg in Goldilocks, benefits from capex expansion." },
      { asset: "Autonomous Tech & Robotics (ARKQ)", why: "AI, robotics, and automation. +15.1% avg in Goldilocks, 100% win rate. Benefits from capex expansion in growth regimes." },
    ],
    underperform: [
      { asset: "Gold (GLD)", why: "No inflation to hedge against. Opportunity cost of holding a non-yielding asset rises when equities are running." },
      { asset: "Commodities (DBC)", why: "Falling inflation means commodity prices are declining. The hedge is unnecessary when the risk isn't present." },
      { asset: "Energy (XLE)", why: "Energy underperforms unless there's a specific supply disruption. In Goldilocks, demand growth is orderly, not inflationary." },
    ],
    historicalExamples: ["1995–1999 (late 90s boom)", "2013–2015 (post-taper recovery)", "2017 (synchronised global growth)", "2023 Q4 (soft landing optimism)"],
  },
  Reflation: {
    description: "Rising growth + Rising inflation",
    whatHappens: "The economy is heating up and prices are rising with it. Central banks are beginning to worry but haven't tightened aggressively yet. In this regime, broad market exposure works well — SPY averages +7.5%. The framework tilts toward cyclical sectors that benefit most from the expansion.",
    outperform: [
      { asset: "S&P 500 (SPY)", why: "Core holding. Broad market captures the economic expansion. +7.5% avg in Reflation — the benchmark to beat." },
      { asset: "Energy (XLE)", why: "Top Reflation performer. Energy revenues rise with commodity prices. +10.7% avg." },
      { asset: "Industrials (XLI)", why: "Cyclical tilt. Manufacturing and infrastructure benefit directly from economic expansion. +9.6% avg." },
      { asset: "Berkshire Hathaway (BRK-B)", why: "Quality compounder. Insurance float benefits from rising rates, diverse holdings capture expansion. +8.9% avg." },
    ],
    underperform: [
      { asset: "Long Bonds (TLT)", why: "Rising inflation and growth expectations push long-term yields higher, hammering bond prices. -1.4% avg." },
      { asset: "Gold (GLD)", why: "Gold underperforms during reflation because real rates are positive and growth assets offer better returns. +2.8% avg." },
      { asset: "Cloud SaaS (WCLD)", why: "Cloud-only companies get crushed when rates rise and face AI disruption risk. -16.4% avg in Reflation." },
    ],
    historicalExamples: ["2003–2006 (housing boom)", "2009–2011 (post-GFC recovery)", "2021 (reopening trade)", "2025 Q1 (pre-Hormuz expansion)"],
  },
  Deflation: {
    description: "Falling growth + Falling inflation",
    whatHappens: "The economy contracts and prices fall. Central banks cut rates aggressively. Cash flows dry up, credit tightens, and risk appetite collapses. This regime requires a split approach: defend capital with bonds and gold, but position for the recovery with cloud/growth ETFs that historically capture the rebound.",
    outperform: [
      { asset: "Long Bonds (TLT)", why: "When rates are cut aggressively, existing long-duration bonds surge in price. +4.7% avg, 86% win rate — the most reliable deflation asset." },
      { asset: "Gold (GLD)", why: "Store of value when financial system stress rises. +5.9% avg, 71% win rate." },
      { asset: "Fidelity MSCI IT (FTEC)", why: "Recovery upside — AI winners (Nvidia, MSFT, Apple) rebound first as rate cuts fuel growth expectations. +6.9% avg in Deflation, 75% win rate." },
      { asset: "Cash", why: "Purchasing power increases as prices fall. The framework holds higher cash reserves in this regime." },
    ],
    underperform: [
      { asset: "Energy (XLE)", why: "Falling demand crushes energy prices. Oil is one of the most cyclically sensitive commodities. -5.2% avg." },
      { asset: "Commodities (DBC)", why: "Broad commodity demand collapses with economic activity. -3.5% avg." },
      { asset: "Small Caps (IWM)", why: "Small companies most exposed to credit tightening and economic contraction. -3.8% avg." },
    ],
    historicalExamples: ["2008–2009 (Global Financial Crisis)", "2020 Q1 (COVID crash)", "2015–2016 (China slowdown scare)", "2011 Q3 (European debt crisis)"],
  },
};

// Section 7 — Regime History (backtesting)
export const backtestSummary = {
  totalRegimes: 52,
  yearRange: "2007–2026",
  picksOutperformedSpy: 23,
  picksOutperformedPct: 44.2,
  avgOutperformance: 2.1,
  bestCall: { date: "2008-09", regime: "Deflation" as RegimeName, picksReturn: 12.4, spyReturn: -38.5 },
  worstCall: { date: "2017-06", regime: "Reflation" as RegimeName, picksReturn: -3.2, spyReturn: 8.7 },
  regimeBreakdown: {
    Stagflation: { count: 14, winRate: 53.6, avgReturn: 6.6 },
    Goldilocks: { count: 8, winRate: 58.3, avgReturn: 4.2 },
    Reflation: { count: 16, winRate: 52.1, avgReturn: 1.8 },
    Deflation: { count: 14, winRate: 48.2, avgReturn: 3.9 },
  },
};

export const regimeTimeline = [
  { regime: "Stagflation" as RegimeName, start: "2025-12", end: "Present", months: 4, picksReturn: 16.6, spyReturn: -8.3, outperformed: true },
  { regime: "Reflation" as RegimeName, start: "2025-06", end: "2025-11", months: 6, picksReturn: 8.2, spyReturn: 11.4, outperformed: false },
  { regime: "Goldilocks" as RegimeName, start: "2025-01", end: "2025-05", months: 5, picksReturn: 14.1, spyReturn: 10.2, outperformed: true },
  { regime: "Reflation" as RegimeName, start: "2024-07", end: "2024-12", months: 6, picksReturn: 5.6, spyReturn: 7.1, outperformed: false },
  { regime: "Goldilocks" as RegimeName, start: "2024-01", end: "2024-06", months: 6, picksReturn: 12.8, spyReturn: 15.3, outperformed: false },
  { regime: "Deflation" as RegimeName, start: "2023-07", end: "2023-12", months: 6, picksReturn: 9.4, spyReturn: 6.7, outperformed: true },
  { regime: "Stagflation" as RegimeName, start: "2022-06", end: "2023-06", months: 13, picksReturn: 11.2, spyReturn: -4.8, outperformed: true },
  { regime: "Reflation" as RegimeName, start: "2021-03", end: "2022-05", months: 15, picksReturn: 18.4, spyReturn: 12.6, outperformed: true },
  { regime: "Deflation" as RegimeName, start: "2020-02", end: "2021-02", months: 13, picksReturn: 22.1, spyReturn: 16.3, outperformed: true },
  { regime: "Goldilocks" as RegimeName, start: "2019-01", end: "2020-01", months: 13, picksReturn: 19.5, spyReturn: 28.9, outperformed: false },
];
