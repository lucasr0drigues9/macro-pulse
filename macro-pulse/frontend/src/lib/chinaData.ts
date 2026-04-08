export const ACCENT = "#ef4444";

export const chinaRegime = {
  name: "Deflation",
  growth: "falling" as const,
  inflation: "falling" as const,
  confidence: "Medium" as const,
  consecutiveMonths: 18,
  emoji: "\uD83D\uDD35",
};

export type ProxyIndicator = {
  name: string;
  subtitle: string;
  currentValue: string;
  trend: "rising" | "stable" | "declining";
  signal: "growth" | "inflation";
  whyItMatters: string;
  source: string;
  history: { month: string; value: number }[];
};

export const proxyIndicators: ProxyIndicator[] = [
  {
    name: "Li Keqiang Index",
    subtitle: "Electricity + Rail freight + Bank loans",
    currentValue: "4.2% composite growth",
    trend: "declining",
    signal: "growth",
    whyItMatters: "Named after former Premier Li Keqiang who reportedly used these three indicators instead of official GDP. The composite tracks real physical activity, not reported figures.",
    source: "National Energy Administration, Railway Administration, PBOC",
    history: [
      { month: "2025-05", value: 6.1 }, { month: "2025-06", value: 5.8 },
      { month: "2025-07", value: 5.5 }, { month: "2025-08", value: 5.2 },
      { month: "2025-09", value: 4.9 }, { month: "2025-10", value: 4.8 },
      { month: "2025-11", value: 4.6 }, { month: "2025-12", value: 4.5 },
      { month: "2026-01", value: 4.4 }, { month: "2026-02", value: 4.3 },
      { month: "2026-03", value: 4.2 }, { month: "2026-04", value: 4.2 },
    ],
  },
  {
    name: "Caixin Manufacturing PMI",
    subtitle: "Private sector factory activity",
    currentValue: "49.2",
    trend: "declining",
    signal: "growth",
    whyItMatters: "Caixin PMI covers smaller private firms. Below 50 = contraction. Often diverges from official NBS PMI which is biased toward large state firms.",
    source: "Caixin/S&P Global, monthly",
    history: [
      { month: "2025-05", value: 51.8 }, { month: "2025-06", value: 51.2 },
      { month: "2025-07", value: 50.8 }, { month: "2025-08", value: 50.4 },
      { month: "2025-09", value: 50.1 }, { month: "2025-10", value: 49.8 },
      { month: "2025-11", value: 49.5 }, { month: "2025-12", value: 49.3 },
      { month: "2026-01", value: 49.1 }, { month: "2026-02", value: 49.4 },
      { month: "2026-03", value: 49.2 }, { month: "2026-04", value: 49.2 },
    ],
  },
  {
    name: "Port Throughput",
    subtitle: "Shanghai + Shenzhen container volume",
    currentValue: "7.8M TEU/month",
    trend: "declining",
    signal: "growth",
    whyItMatters: "Physical goods cannot be faked. Port volumes measure actual economic activity before it shows up in any official statistic.",
    source: "Shanghai International Port Group, Shenzhen Port Authority",
    history: [
      { month: "2025-05", value: 8.9 }, { month: "2025-06", value: 8.7 },
      { month: "2025-07", value: 8.5 }, { month: "2025-08", value: 8.3 },
      { month: "2025-09", value: 8.1 }, { month: "2025-10", value: 8.0 },
      { month: "2025-11", value: 7.9 }, { month: "2025-12", value: 7.8 },
      { month: "2026-01", value: 7.6 }, { month: "2026-02", value: 7.7 },
      { month: "2026-03", value: 7.8 }, { month: "2026-04", value: 7.8 },
    ],
  },
  {
    name: "Copper Imports",
    subtitle: "Monthly import volume",
    currentValue: "2.1M tonnes/month",
    trend: "stable",
    signal: "growth",
    whyItMatters: "China consumes 50%+ of global copper. Import volumes signal real industrial demand before it shows up in any official statistic.",
    source: "General Administration of Customs China",
    history: [
      { month: "2025-05", value: 2.4 }, { month: "2025-06", value: 2.3 },
      { month: "2025-07", value: 2.3 }, { month: "2025-08", value: 2.2 },
      { month: "2025-09", value: 2.1 }, { month: "2025-10", value: 2.1 },
      { month: "2025-11", value: 2.1 }, { month: "2025-12", value: 2.0 },
      { month: "2026-01", value: 2.0 }, { month: "2026-02", value: 2.1 },
      { month: "2026-03", value: 2.1 }, { month: "2026-04", value: 2.1 },
    ],
  },
  {
    name: "Producer Price Index",
    subtitle: "Factory gate prices",
    currentValue: "-2.8% YoY",
    trend: "declining",
    signal: "inflation",
    whyItMatters: "PPI is harder to manipulate than CPI and gives advance warning of inflation trends. Negative PPI = deflationary pressure through the supply chain.",
    source: "National Bureau of Statistics, monthly",
    history: [
      { month: "2025-05", value: -1.2 }, { month: "2025-06", value: -1.5 },
      { month: "2025-07", value: -1.8 }, { month: "2025-08", value: -2.0 },
      { month: "2025-09", value: -2.2 }, { month: "2025-10", value: -2.4 },
      { month: "2025-11", value: -2.5 }, { month: "2025-12", value: -2.6 },
      { month: "2026-01", value: -2.7 }, { month: "2026-02", value: -2.8 },
      { month: "2026-03", value: -2.8 }, { month: "2026-04", value: -2.8 },
    ],
  },
  {
    name: "Property Price Index",
    subtitle: "70-city average residential",
    currentValue: "-8.5% YoY",
    trend: "declining",
    signal: "inflation",
    whyItMatters: "Property is 70% of Chinese household wealth. The Evergrande crisis showed how property deflation transmits to consumer confidence and the broader economy.",
    source: "NBS 70-city index, monthly",
    history: [
      { month: "2025-05", value: -4.2 }, { month: "2025-06", value: -4.8 },
      { month: "2025-07", value: -5.3 }, { month: "2025-08", value: -5.9 },
      { month: "2025-09", value: -6.4 }, { month: "2025-10", value: -6.8 },
      { month: "2025-11", value: -7.2 }, { month: "2025-12", value: -7.6 },
      { month: "2026-01", value: -7.9 }, { month: "2026-02", value: -8.2 },
      { month: "2026-03", value: -8.5 }, { month: "2026-04", value: -8.5 },
    ],
  },
];

export const strategicCards = [
  {
    title: "Alliance Position",
    content: "Core allies: Russia, Iran, North Korea, Pakistan. Growing Global South influence via Belt and Road (140+ countries). SCO, BRICS+, RCEP provide institutional framework. Key shift: Saudi Arabia joining BRICS+ signals oil-for-yuan era beginning.",
    keyMetric: "140+ BRI member countries",
    status: "Expanding",
  },
  {
    title: "Economic Decoupling",
    content: "US tech export restrictions (semiconductors, AI chips) forcing domestic substitution. Huawei's Kirin 9000s chip showed workaround capability. CIPS alternative to SWIFT processing $20T+ annually. Yuan share of global trade settlements reached 4.7%, up from 1.9% in 2020. Bilateral currency swaps with 40+ countries.",
    keyMetric: "CIPS: $20T+ annual volume",
    status: "Accelerating",
  },
  {
    title: "Taiwan Risk",
    content: "Dalio estimates 30-40% probability of military conflict by 2028. PLA conducting regular large-scale exercises. US strategic ambiguity increasingly strained by arms sales and diplomatic visits. A Taiwan conflict would destroy semiconductor supply chains (TSMC makes 90% of advanced chips) and end the US-China economic relationship entirely.",
    keyMetric: "30-40% conflict probability (Dalio)",
    status: "Elevated",
  },
];

export const directETFs = [
  { ticker: "MCHI", name: "iShares MSCI China", return1y: -12.4, risk: "High", note: "Broad China exposure, 600+ holdings" },
  { ticker: "KWEB", name: "KraneShares China Internet", return1y: -18.7, risk: "High", note: "Alibaba, Tencent, JD, PDD — regulatory risk" },
  { ticker: "FXI", name: "iShares China Large-Cap", return1y: -9.8, risk: "High", note: "50 largest Chinese companies, state bank heavy" },
  { ticker: "GXC", name: "SPDR S&P China", return1y: -11.2, risk: "High", note: "Broad exposure including A-shares via Stock Connect" },
  { ticker: "CNYA", name: "iShares MSCI China A", return1y: -7.5, risk: "Medium-High", note: "Domestic A-shares, less exposed to US delisting risk" },
];

export const proxyPlays = [
  { ticker: "VALE", name: "Vale SA", exposure: "70%+ of revenue from iron ore to China", return1y: -5.2, note: "Brazilian iron ore — China buys 70% of seaborne supply" },
  { ticker: "BHP", name: "BHP Group", exposure: "50%+ revenue from China demand", return1y: 2.1, note: "Australian mining — copper and iron ore" },
  { ticker: "RIO", name: "Rio Tinto", exposure: "55% revenue from China", return1y: -1.8, note: "Iron ore, copper, aluminium — China's industrial backbone" },
  { ticker: "FCX", name: "Freeport-McMoRan", exposure: "40% copper goes to China", return1y: -8.3, note: "World's largest public copper producer" },
  { ticker: "EQNR", name: "Equinor (Norway)", exposure: "Energy exports, growing LNG to Asia", return1y: 15.2, note: "Norwegian energy — indirect China energy demand play" },
];

export const taiwanHedges = [
  { ticker: "GLD", name: "SPDR Gold", case: "Universal crisis hedge — outperforms in every geopolitical escalation" },
  { ticker: "ACWX", name: "All World ex-US", case: "Reduces US concentration risk if US-China relationship breaks" },
  { ticker: "DBA", name: "Agriculture ETF", case: "Food security premium in conflict — grain and soft commodity prices spike" },
  { ticker: "XLU", name: "Utilities SPDR", case: "Domestic US infrastructure — defensive if global trade collapses" },
];
