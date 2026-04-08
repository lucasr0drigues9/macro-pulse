export const ACCENT = "#22c55e";

export type DeterminantRating = { label: string; emoji: string; note: string };
export type ETFInfo = { ticker: string; name: string; return1y: number; topHoldings: string; expense: string };
export type CountryEM = {
  name: string;
  flag: string;
  alliance: string;
  allianceColor: string;
  signal: "Strong" | "Watch";
  signalColor: string;
  whyBenefits: string[];
  metrics: { label: string; value: string }[];
  determinants: DeterminantRating[];
  etfs: ETFInfo[];
  risks: string[];
  primaryThesis: string;
  keyCommodity: string;
  gdpGrowth: string;
  chinaTradeShare: string;
  usTradeShare: string;
  bestETF: string;
  bestETFReturn: number;
};

export const countries: CountryEM[] = [
  {
    name: "India",
    flag: "\uD83C\uDDEE\uD83C\uDDF3",
    alliance: "Neutral / Swing",
    allianceColor: "#eab308",
    signal: "Strong",
    signalColor: "#22c55e",
    whyBenefits: [
      "Largest democracy refusing to choose between US and China — receives investment and trade from both",
      "Primary beneficiary of China+1 manufacturing strategy — Apple, Samsung moving production to India",
      "Youngest large population in the world — demographic dividend driving domestic consumption for decades",
    ],
    metrics: [
      { label: "GDP Growth", value: "6.8% (2025)" },
      { label: "Manufacturing PMI", value: "57.2 (expanding)" },
      { label: "FDI Inflows", value: "$85B/year (growing)" },
      { label: "Population", value: "1.44B (median age 28)" },
    ],
    determinants: [
      { label: "Education/Innovation", emoji: "\uD83D\uDFE1", note: "IITs world-class, mass education improving fast" },
      { label: "Economic Output", emoji: "\uD83D\uDFE2", note: "Fastest growing large economy at 6-7%" },
      { label: "Military Strength", emoji: "\uD83D\uDFE2", note: "Third largest budget, nuclear power, Quad member" },
      { label: "Natural Resources", emoji: "\uD83D\uDFE1", note: "Limited oil/gas but strong solar and rare earths" },
      { label: "Internal Cohesion", emoji: "\uD83D\uDFE1", note: "Modi provides stability but religious tensions exist" },
    ],
    etfs: [
      { ticker: "INDA", name: "iShares MSCI India", return1y: 8.5, topHoldings: "Reliance, Infosys, HDFC Bank", expense: "0.64%" },
      { ticker: "INDY", name: "iShares India 50", return1y: 7.2, topHoldings: "Reliance, TCS, HDFC Bank", expense: "0.89%" },
      { ticker: "SMIN", name: "iShares India Small-Cap", return1y: 12.1, topHoldings: "Broad small-cap (400+ holdings)", expense: "0.75%" },
    ],
    risks: [
      "US-China conflict could force India to choose sides",
      "Pakistan border tensions and Kashmir instability",
      "Infrastructure gaps limiting growth pace",
      "Bureaucratic complexity for foreign investors",
    ],
    primaryThesis: "Decoupling beneficiary + swing state",
    keyCommodity: "IT services / labour",
    gdpGrowth: "6.8%",
    chinaTradeShare: "12%",
    usTradeShare: "18%",
    bestETF: "INDA",
    bestETFReturn: 8.5,
  },
  {
    name: "Brazil",
    flag: "\uD83C\uDDE7\uD83C\uDDF7",
    alliance: "Neutral / BRICS",
    allianceColor: "#eab308",
    signal: "Strong",
    signalColor: "#22c55e",
    whyBenefits: [
      "World's largest exporter of soybeans, beef, sugar, coffee, and iron ore — food security premium rises in a fragmented world",
      "BRICS member trading with China while maintaining Western market access — maximum optionality",
      "Enormous domestic market of 215M people insulating from global trade disruptions",
    ],
    metrics: [
      { label: "GDP Growth", value: "2.8% (2025)" },
      { label: "Soybean Exports", value: "#1 globally (100M+ tonnes)" },
      { label: "Iron Ore Exports", value: "#2 globally (via Vale)" },
      { label: "Population", value: "215M (median age 34)" },
    ],
    determinants: [
      { label: "Natural Resources", emoji: "\uD83D\uDFE2", note: "Extraordinary — Amazon, pre-salt oil, arable land, minerals" },
      { label: "Economic Output", emoji: "\uD83D\uDFE1", note: "9th largest GDP but volatile growth" },
      { label: "Internal Cohesion", emoji: "\uD83D\uDFE1", note: "Lula vs Bolsonaro divide, improving under current government" },
      { label: "Trade Share", emoji: "\uD83D\uDFE1", note: "Growing food exports, especially soy to China" },
      { label: "Infrastructure", emoji: "\uD83D\uDD34", note: "Poor logistics, underfunded ports and roads" },
    ],
    etfs: [
      { ticker: "EWZ", name: "iShares MSCI Brazil", return1y: -2.4, topHoldings: "Vale, Petrobras, Itau Unibanco", expense: "0.58%" },
      { ticker: "BRF", name: "VanEck Brazil Small-Cap", return1y: -5.1, topHoldings: "Broad small/mid-cap", expense: "0.60%" },
      { ticker: "FLBR", name: "Franklin FTSE Brazil", return1y: -1.8, topHoldings: "Vale, Petrobras, B3", expense: "0.19%" },
    ],
    risks: [
      "Commodity price cycles create extreme volatility",
      "Political instability history — Lula/Bolsonaro polarisation",
      "Currency (BRL) volatility erodes returns for foreign investors",
      "Deforestation policy risk for ESG-focused capital",
    ],
    primaryThesis: "Commodity superpower + food security",
    keyCommodity: "Soybeans, iron ore, oil",
    gdpGrowth: "2.8%",
    chinaTradeShare: "31%",
    usTradeShare: "11%",
    bestETF: "EWZ",
    bestETFReturn: -2.4,
  },
  {
    name: "Saudi Arabia",
    flag: "\uD83C\uDDF8\uD83C\uDDE6",
    alliance: "Shifting / Neutral",
    allianceColor: "#eab308",
    signal: "Strong",
    signalColor: "#22c55e",
    whyBenefits: [
      "Holds 17% of global proven oil reserves — energy security premium structurally elevated for years",
      "Actively diversifying away from dollar dependency — selling oil in yuan, accumulating gold, joined BRICS+",
      "Vision 2030 building non-oil economy — tourism, tech, manufacturing attracting global capital",
    ],
    metrics: [
      { label: "Oil Production", value: "9.0M bbl/day" },
      { label: "Sovereign Fund (PIF)", value: "$930B" },
      { label: "Non-Oil GDP Growth", value: "4.5% (2025)" },
      { label: "Vision 2030 Investment", value: "$3.3T planned" },
    ],
    determinants: [
      { label: "Natural Resources", emoji: "\uD83D\uDFE2", note: "World's largest proven oil reserves" },
      { label: "Financial Center", emoji: "\uD83D\uDFE2", note: "Tadawul growing, PIF $930B, Aramco world's most valuable company" },
      { label: "Military Strength", emoji: "\uD83D\uDFE1", note: "$75B budget but depends on US equipment" },
      { label: "Internal Cohesion", emoji: "\uD83D\uDFE1", note: "MBS centralised power, effective but autocratic" },
      { label: "Technology", emoji: "\uD83D\uDD34", note: "Importing rather than building, but AI investment growing" },
    ],
    etfs: [
      { ticker: "KSA", name: "iShares MSCI Saudi Arabia", return1y: 4.2, topHoldings: "Aramco, Al Rajhi Bank, STC", expense: "0.74%" },
      { ticker: "FLSA", name: "Franklin FTSE Saudi Arabia", return1y: 3.8, topHoldings: "Aramco, SNB, Al Rajhi", expense: "0.39%" },
    ],
    risks: [
      "Oil price dependency despite diversification effort",
      "Iran conflict proximity — Hormuz blockade directly impacts",
      "Succession and governance concentration risk",
      "Human rights concerns limiting some institutional investment",
    ],
    primaryThesis: "Energy monopoly + Vision 2030",
    keyCommodity: "Oil (17% global reserves)",
    gdpGrowth: "3.5%",
    chinaTradeShare: "20%",
    usTradeShare: "8%",
    bestETF: "KSA",
    bestETFReturn: 4.2,
  },
  {
    name: "Indonesia",
    flag: "\uD83C\uDDEE\uD83C\uDDE9",
    alliance: "Neutral",
    allianceColor: "#eab308",
    signal: "Watch",
    signalColor: "#eab308",
    whyBenefits: [
      "World's largest nickel reserves — critical for EV batteries, export ban forcing downstream processing",
      "270 million population — fourth largest, growing middle class driving consumption",
      "Strategic neutrality in ASEAN — swing state benefiting from US-China competition for influence",
    ],
    metrics: [
      { label: "GDP Growth", value: "5.1% (2025)" },
      { label: "Nickel Production", value: "#1 globally (50%+ of world)" },
      { label: "Population", value: "270M (median age 30)" },
      { label: "Manufacturing FDI", value: "Growing from China/Japan/Korea" },
    ],
    determinants: [
      { label: "Natural Resources", emoji: "\uD83D\uDFE2", note: "Nickel, palm oil, coal, tin — critical mineral wealth" },
      { label: "Economic Output", emoji: "\uD83D\uDFE1", note: "16th largest GDP, steady 5% growth" },
      { label: "Internal Cohesion", emoji: "\uD83D\uDFE1", note: "New president Prabowo, military background, continuity" },
      { label: "Trade Share", emoji: "\uD83D\uDFE1", note: "RCEP member, growing ASEAN trade hub" },
      { label: "Infrastructure", emoji: "\uD83D\uDFE1", note: "Jakarta metro, new capital Nusantara, improving but gaps remain" },
    ],
    etfs: [
      { ticker: "EIDO", name: "iShares MSCI Indonesia", return1y: -3.5, topHoldings: "Bank Central Asia, Telkom, Bank Rakyat", expense: "0.58%" },
      { ticker: "FLID", name: "Franklin FTSE Indonesia", return1y: -2.8, topHoldings: "BCA, Telkom, Bank Mandiri", expense: "0.19%" },
    ],
    risks: [
      "Nickel commodity concentration risk",
      "Infrastructure gaps across 17,000 islands",
      "China proximity creates alignment pressure",
      "Currency (IDR) volatility in risk-off environments",
    ],
    primaryThesis: "Critical minerals + ASEAN swing state",
    keyCommodity: "Nickel (50%+ global supply)",
    gdpGrowth: "5.1%",
    chinaTradeShare: "25%",
    usTradeShare: "10%",
    bestETF: "EIDO",
    bestETFReturn: -3.5,
  },
  {
    name: "Turkey",
    flag: "\uD83C\uDDF9\uD83C\uDDF7",
    alliance: "Volatile / NATO",
    allianceColor: "#ef4444",
    signal: "Watch",
    signalColor: "#eab308",
    whyBenefits: [
      "Controls the Bosphorus — the only passage between Black Sea and Mediterranean, enormous strategic value",
      "NATO member actively trading with Russia — unique position extracting value from both sides",
      "Growing manufacturing base capturing some European supply chain relocation, ultra-cheap after lira collapse",
    ],
    metrics: [
      { label: "Inflation", value: "35% (falling from 80%+ peak)" },
      { label: "Manufacturing PMI", value: "49.8 (near contraction)" },
      { label: "Tourism Revenue", value: "$56B/year (record)" },
      { label: "Lira vs USD", value: "-80% since 2020" },
    ],
    determinants: [
      { label: "Geopolitical Position", emoji: "\uD83D\uDFE2", note: "Bosphorus control, NATO member, bridge between Europe and Asia" },
      { label: "Military Strength", emoji: "\uD83D\uDFE1", note: "NATO's second largest army, drone warfare pioneer (Bayraktar)" },
      { label: "Economic Stability", emoji: "\uD83D\uDD34", note: "Inflation ravaged purchasing power, lira collapsed 80%" },
      { label: "Internal Cohesion", emoji: "\uD83D\uDFE1", note: "Erdogan consolidated power, opposition growing" },
      { label: "Leadership", emoji: "\uD83D\uDFE1", note: "Erdogan pragmatic on foreign policy but unpredictable on economics" },
    ],
    etfs: [
      { ticker: "TUR", name: "iShares MSCI Turkey", return1y: 15.2, topHoldings: "BIM, Turkcell, Koc Holding", expense: "0.58%" },
    ],
    risks: [
      "Currency (TRY) extreme volatility — 80%+ decline since 2020",
      "Inflation history — peaked at 80%+, still 35%",
      "Erdogan policy unpredictability on monetary policy",
      "NATO relationship tension over Russian S-400 purchase",
      "Forced to choose sides as US-Russia tensions escalate",
    ],
    primaryThesis: "Strategic geography + cheap currency",
    keyCommodity: "Geography (Bosphorus)",
    gdpGrowth: "3.2%",
    chinaTradeShare: "10%",
    usTradeShare: "6%",
    bestETF: "TUR",
    bestETFReturn: 15.2,
  },
];

export const regimeAlignment = [
  {
    regime: "Stagflation",
    emoji: "\uD83D\uDD34",
    current: true,
    performance: "Brazil and Saudi Arabia outperform — commodity exporters benefit from inflation and supply disruption",
    bestETFs: "EWZ, KSA",
  },
  {
    regime: "Reflation",
    emoji: "\uD83D\uDFE1",
    current: false,
    performance: "Indonesia and India outperform — industrial recovery drives commodity and manufacturing demand",
    bestETFs: "EIDO, INDA",
  },
  {
    regime: "Goldilocks",
    emoji: "\uD83D\uDFE2",
    current: false,
    performance: "India strongly outperforms — growth environment favours young consumption-driven economies",
    bestETFs: "INDA, SMIN",
  },
  {
    regime: "Deflation",
    emoji: "\uD83D\uDD35",
    current: false,
    performance: "Most emerging markets struggle — commodity prices fall, capital flows to safe havens",
    bestETFs: "Reduce exposure, hold GLD",
  },
];
