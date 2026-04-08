export const ACCENT = "#22c55e";
export const GOLD = "#b45309";

export type DeterminantRating = { label: string; emoji: string; note: string };
export type ETFInfo = { ticker: string; name: string; return1y: number; topHoldings: string; expense: string };
export type RegimeAlignmentEntry = { regime: string; emoji: string; rating: string; note: string };
export type CountryEM = {
  name: string;
  flag: string;
  alliance: string;
  allianceColor: string;
  signal: "Strong" | "Watch";
  signalColor: string;
  tags: string[];
  whyBenefits: string[];
  metrics: { label: string; value: string }[];
  determinants: DeterminantRating[];
  etfs: ETFInfo[];
  etfNote?: string;
  regimeAlignment: RegimeAlignmentEntry[];
  risks: string[];
  primaryThesis: string;
  keyCommodity: string;
  gdpGrowth: string;
  euAutonomyLink: string;
  bestETF: string;
  bestETFReturn: number;
};

export const morocco: CountryEM = {
  name: "Morocco",
  flag: "\uD83C\uDDF2\uD83C\uDDE6",
  alliance: "Pro-European",
  allianceColor: "#22c55e",
  signal: "Strong",
  signalColor: "#22c55e",
  tags: ["\uD83C\uDDEA\uD83C\uDDFA Primary EU Autonomy Beneficiary", "\uD83C\uDFED Manufacturing Hub", "\u2600\uFE0F Solar Energy"],
  whyBenefits: [
    "14km from Spain across the Strait of Gibraltar — Europe's closest manufacturing and energy partner",
    "Controls 70% of world phosphate reserves — Europe's food security depends on Moroccan fertiliser",
    "Enormous Atlantic solar potential — Xlinks project plans to cable Moroccan solar directly to the UK",
    "Established auto manufacturing — Renault and Stellantis already produce for European markets",
  ],
  metrics: [
    { label: "Phosphate Reserves", value: "70% of world supply" },
    { label: "GDP Growth", value: "3.5% (2025)" },
    { label: "EU FDI Inflows", value: "Growing 15%+ annually" },
    { label: "Distance to Spain", value: "14 kilometres" },
  ],
  determinants: [
    { label: "Natural Resources", emoji: "\uD83D\uDFE2", note: "World's largest phosphate reserves — strategic food security resource" },
    { label: "Geopolitical Position", emoji: "\uD83D\uDFE2", note: "Gateway to Europe, 14km from Spain, EU trade agreements" },
    { label: "Political Stability", emoji: "\uD83D\uDFE2", note: "Most stable North African country, consistent governance" },
    { label: "Cost Competitiveness", emoji: "\uD83D\uDFE2", note: "Competitive labour costs, French-speaking workforce" },
    { label: "Infrastructure", emoji: "\uD83D\uDFE1", note: "TGV rail, Tangier port world-class, but gaps remain inland" },
  ],
  etfs: [
    { ticker: "AFK", name: "VanEck Africa ETF", return1y: -1.2, topHoldings: "Morocco is component — diluted pan-Africa exposure", expense: "0.78%" },
    { ticker: "MOS", name: "Mosaic Company (US)", return1y: 5.4, topHoldings: "US phosphate producer — pricing tied to Moroccan supply", expense: "N/A" },
    { ticker: "NTR", name: "Nutrien (Canada)", return1y: 2.1, topHoldings: "Fertiliser giant — benefits from phosphate supply constraints", expense: "N/A" },
  ],
  etfNote: "No dedicated Morocco ETF exists for retail investors. AFK gives diluted exposure. MOS and NTR are proxy plays through phosphate/fertiliser pricing. This is a market gap that will likely be filled as Morocco's strategic importance grows.",
  regimeAlignment: [
    { regime: "Stagflation", emoji: "\uD83D\uDD34", rating: "\uD83D\uDFE1", note: "Phosphate premium from food security fears" },
    { regime: "Reflation", emoji: "\uD83D\uDFE1", rating: "\uD83D\uDFE2", note: "Industrial recovery drives manufacturing demand" },
    { regime: "Goldilocks", emoji: "\uD83D\uDFE2", rating: "\uD83D\uDFE2", note: "European capex expansion flows to nearest partner" },
    { regime: "Deflation", emoji: "\uD83D\uDD35", rating: "\uD83D\uDFE1", note: "Phosphates defensive, manufacturing slows" },
  ],
  risks: [
    "No dedicated retail ETF — limited direct investment access",
    "Casablanca Stock Exchange limited accessibility for Western investors",
    "Algeria border tension and Western Sahara territorial dispute",
    "Dependent on European political will to deepen partnership",
    "Small economy — capacity constraints as demand scales",
  ],
  primaryThesis: "Europe's backyard partner",
  keyCommodity: "Phosphates (70% world)",
  gdpGrowth: "3.5%",
  euAutonomyLink: "Primary",
  bestETF: "MOS (proxy)",
  bestETFReturn: 5.4,
};

export const countries: CountryEM[] = [
  {
    name: "India",
    flag: "\uD83C\uDDEE\uD83C\uDDF3",
    alliance: "Neutral / Swing",
    allianceColor: "#eab308",
    signal: "Strong",
    signalColor: "#22c55e",
    tags: ["\uD83C\uDDEA\uD83C\uDDFA EU Autonomy Beneficiary", "\uD83C\uDFED Manufacturing Alternative", "\u2696\uFE0F Swing State"],
    whyBenefits: [
      "Largest democracy refusing to choose between US and China — receives investment and trade from both",
      "Primary beneficiary of China+1 manufacturing strategy — Apple, Samsung moving production to India",
      "European companies choosing India as manufacturing partner as part of de-China strategy",
      "Youngest large population driving domestic consumption for decades",
    ],
    metrics: [
      { label: "GDP Growth", value: "6.8% (2025)" },
      { label: "Manufacturing PMI", value: "57.2 (expanding)" },
      { label: "FDI Inflows", value: "$85B/year (growing)" },
      { label: "Population", value: "1.44B (median age 28)" },
    ],
    determinants: [
      { label: "Education/Innovation", emoji: "\uD83D\uDFE1", note: "IITs world-class, mass education improving rapidly" },
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
    regimeAlignment: [
      { regime: "Goldilocks", emoji: "\uD83D\uDFE2", rating: "\uD83D\uDFE2\uD83D\uDFE2", note: "Best environment — growth favours young economies" },
      { regime: "Reflation", emoji: "\uD83D\uDFE1", rating: "\uD83D\uDFE2", note: "Industrial recovery drives manufacturing demand" },
      { regime: "Stagflation", emoji: "\uD83D\uDD34", rating: "\uD83D\uDFE1", note: "Domestic demand insulates but energy imports hurt" },
      { regime: "Deflation", emoji: "\uD83D\uDD35", rating: "\uD83D\uDD34", note: "Capital flight to safe havens" },
    ],
    risks: [
      "US-China conflict could force India to choose sides",
      "Pakistan border tensions and Kashmir instability",
      "Infrastructure gaps limiting growth pace",
      "Rupee currency volatility",
    ],
    primaryThesis: "Decoupling beneficiary + swing state",
    keyCommodity: "IT services / labour",
    gdpGrowth: "6.8%",
    euAutonomyLink: "Manufacturing",
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
    tags: ["\uD83C\uDF3E Commodity Exporter", "\uD83C\uDDEA\uD83C\uDDFA EU Food Security"],
    whyBenefits: [
      "World's largest exporter of soybeans, beef, sugar, coffee, iron ore — food security premium rises in fragmented world",
      "BRICS member trading with China while maintaining Western market access — maximum optionality",
      "European food security concerns increase Brazilian agricultural export value",
      "Enormous domestic market of 215M insulating from global trade disruptions",
    ],
    metrics: [
      { label: "GDP Growth", value: "2.8% (2025)" },
      { label: "Soybean Exports", value: "#1 globally (100M+ tonnes)" },
      { label: "Iron Ore Exports", value: "#2 globally (Via Vale)" },
      { label: "Population", value: "215M (median age 34)" },
    ],
    determinants: [
      { label: "Natural Resources", emoji: "\uD83D\uDFE2", note: "Extraordinary — Amazon, pre-salt oil, arable land, minerals" },
      { label: "Economic Output", emoji: "\uD83D\uDFE1", note: "9th largest GDP but volatile growth" },
      { label: "Internal Cohesion", emoji: "\uD83D\uDFE1", note: "Lula vs Bolsonaro divide, improving" },
      { label: "Trade Diversification", emoji: "\uD83D\uDFE2", note: "Sells to both US and China" },
      { label: "Infrastructure", emoji: "\uD83D\uDD34", note: "Poor logistics, underfunded ports and roads" },
    ],
    etfs: [
      { ticker: "EWZ", name: "iShares MSCI Brazil", return1y: -2.4, topHoldings: "Petrobras, Vale, Itau Unibanco", expense: "0.58%" },
      { ticker: "BRF", name: "VanEck Brazil Small-Cap", return1y: -5.1, topHoldings: "Broad small/mid-cap", expense: "0.60%" },
      { ticker: "FLBR", name: "Franklin FTSE Brazil", return1y: -1.8, topHoldings: "Vale, Petrobras, B3", expense: "0.19%" },
    ],
    regimeAlignment: [
      { regime: "Stagflation", emoji: "\uD83D\uDD34", rating: "\uD83D\uDFE2\uD83D\uDFE2", note: "Commodity inflation benefits exporters directly" },
      { regime: "Reflation", emoji: "\uD83D\uDFE1", rating: "\uD83D\uDFE2", note: "Industrial demand boosts iron ore and oil" },
      { regime: "Goldilocks", emoji: "\uD83D\uDFE2", rating: "\uD83D\uDFE1", note: "Mixed — growth good but commodities less scarce" },
      { regime: "Deflation", emoji: "\uD83D\uDD35", rating: "\uD83D\uDD34", note: "Commodity prices collapse with demand" },
    ],
    risks: [
      "Commodity price cycles create extreme volatility",
      "BRL currency volatility erodes returns for foreign investors",
      "Political instability history — Lula/Bolsonaro polarisation",
      "Deforestation policy ESG risk",
    ],
    primaryThesis: "Commodity superpower + food security",
    keyCommodity: "Soybeans, iron ore, oil",
    gdpGrowth: "2.8%",
    euAutonomyLink: "Food security",
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
    tags: ["\u26FD Energy Exporter", "\uD83C\uDDEA\uD83C\uDDFA EU Energy Supplier", "\u2696\uFE0F Swing State"],
    whyBenefits: [
      "17% of global proven oil reserves — energy security premium structurally elevated for years",
      "Actively replacing Russian energy for European buyers — new LNG and pipeline agreements",
      "Diversifying away from dollar — selling oil in yuan, accumulating gold, joined BRICS+",
      "Vision 2030 building non-oil economy attracting global capital",
    ],
    metrics: [
      { label: "Oil Production", value: "9.0M bbl/day" },
      { label: "Sovereign Fund (PIF)", value: "$930B" },
      { label: "Non-Oil GDP Growth", value: "4.5% (2025)" },
      { label: "Vision 2030 Investment", value: "$3.3T planned" },
    ],
    determinants: [
      { label: "Natural Resources", emoji: "\uD83D\uDFE2", note: "World's largest proven oil reserves" },
      { label: "Financial Center", emoji: "\uD83D\uDFE2", note: "PIF $930B, Aramco world's most valuable company" },
      { label: "Military Strength", emoji: "\uD83D\uDFE1", note: "$75B budget but depends on US equipment" },
      { label: "Internal Cohesion", emoji: "\uD83D\uDFE1", note: "MBS centralised power, effective but autocratic" },
      { label: "Technology", emoji: "\uD83D\uDD34", note: "Importing rather than building, but AI investment growing" },
    ],
    etfs: [
      { ticker: "KSA", name: "iShares MSCI Saudi Arabia", return1y: 4.2, topHoldings: "Aramco, Al Rajhi Bank, STC", expense: "0.74%" },
      { ticker: "FLSA", name: "Franklin FTSE Saudi Arabia", return1y: 3.8, topHoldings: "Aramco, SNB, Al Rajhi", expense: "0.39%" },
    ],
    etfNote: "Saudi Arabia not accessible via most European brokers directly. KSA and FLSA are most practical routes.",
    regimeAlignment: [
      { regime: "Stagflation", emoji: "\uD83D\uDD34", rating: "\uD83D\uDFE2\uD83D\uDFE2", note: "Direct energy price beneficiary — Hormuz windfall" },
      { regime: "Reflation", emoji: "\uD83D\uDFE1", rating: "\uD83D\uDFE2", note: "Energy demand grows with economy" },
      { regime: "Goldilocks", emoji: "\uD83D\uDFE2", rating: "\uD83D\uDFE1", note: "Stable dividends, less upside" },
      { regime: "Deflation", emoji: "\uD83D\uDD35", rating: "\uD83D\uDD34", note: "Oil demand and prices fall" },
    ],
    risks: [
      "Oil price dependency despite diversification efforts",
      "Iran conflict proximity — Hormuz blockade directly impacts",
      "Succession and governance concentration risk",
      "Human rights concerns limiting institutional investment",
    ],
    primaryThesis: "Energy monopoly + Vision 2030",
    keyCommodity: "Oil (17% global reserves)",
    gdpGrowth: "3.5%",
    euAutonomyLink: "Energy supplier",
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
    tags: ["\uD83D\uDD0B Critical Materials", "\uD83C\uDFED Manufacturing Alternative"],
    whyBenefits: [
      "World's largest nickel reserves — critical for EV batteries, export ban forcing downstream processing",
      "270 million population — fourth largest, growing middle class",
      "European battery manufacturers increasingly sourcing Indonesian nickel for EU supply chain compliance",
      "Strategic neutrality in ASEAN — swing state benefiting from US-China competition",
    ],
    metrics: [
      { label: "GDP Growth", value: "5.1% (2025)" },
      { label: "Nickel Production", value: "#1 globally (50%+ of world)" },
      { label: "Population", value: "270M (median age 30)" },
      { label: "EU Nickel Exports", value: "Growing for EV compliance" },
    ],
    determinants: [
      { label: "Natural Resources", emoji: "\uD83D\uDFE2", note: "Nickel, palm oil, coal, tin — critical mineral wealth" },
      { label: "Economic Output", emoji: "\uD83D\uDFE1", note: "16th largest GDP, steady 5% growth" },
      { label: "Internal Cohesion", emoji: "\uD83D\uDFE1", note: "New president Prabowo, military background, continuity" },
      { label: "Trade Share", emoji: "\uD83D\uDFE1", note: "RCEP member, growing ASEAN trade hub" },
      { label: "Infrastructure", emoji: "\uD83D\uDFE1", note: "Jakarta metro, new capital Nusantara, improving" },
    ],
    etfs: [
      { ticker: "EIDO", name: "iShares MSCI Indonesia", return1y: -3.5, topHoldings: "Bank Central Asia, Telkom, Astra", expense: "0.58%" },
      { ticker: "FLID", name: "Franklin FTSE Indonesia", return1y: -2.8, topHoldings: "BCA, Telkom, Bank Mandiri", expense: "0.19%" },
    ],
    regimeAlignment: [
      { regime: "Reflation", emoji: "\uD83D\uDFE1", rating: "\uD83D\uDFE2\uD83D\uDFE2", note: "Industrial metals demand peaks" },
      { regime: "Stagflation", emoji: "\uD83D\uDD34", rating: "\uD83D\uDFE1", note: "Nickel holds value but China demand weak" },
      { regime: "Goldilocks", emoji: "\uD83D\uDFE2", rating: "\uD83D\uDFE2", note: "Growth environment benefits EV supply chain" },
      { regime: "Deflation", emoji: "\uD83D\uDD35", rating: "\uD83D\uDD34", note: "Commodity prices fall with demand" },
    ],
    risks: [
      "Nickel price concentration risk",
      "Infrastructure gaps across 17,000 islands",
      "China proximity creates alignment pressure",
      "Currency (IDR) volatility in risk-off environments",
    ],
    primaryThesis: "Critical minerals + ASEAN swing state",
    keyCommodity: "Nickel (50%+ global supply)",
    gdpGrowth: "5.1%",
    euAutonomyLink: "Battery materials",
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
    tags: ["\uD83D\uDDFA\uFE0F Strategic Chokepoint", "\uD83C\uDDEA\uD83C\uDDFA EU Autonomy Beneficiary", "\u2696\uFE0F Swing State"],
    whyBenefits: [
      "Controls the Bosphorus — only passage between Black Sea and Mediterranean, irreplaceable strategic value",
      "NATO member actively trading with Russia — extracting value from both sides",
      "Growing defence industry — Bayraktar drones proven in Ukraine, becoming European supply chain partner",
      "Manufacturing base capturing European relocation from China, ultra-cheap after lira collapse",
    ],
    metrics: [
      { label: "Inflation", value: "35% (from 80%+ peak)" },
      { label: "Manufacturing PMI", value: "49.8 (near contraction)" },
      { label: "Tourism Revenue", value: "$56B/year (record)" },
      { label: "Lira vs USD", value: "-80% since 2020" },
    ],
    determinants: [
      { label: "Geopolitical Position", emoji: "\uD83D\uDFE2", note: "Bosphorus control, NATO, bridge Europe-Asia" },
      { label: "Military Strength", emoji: "\uD83D\uDFE1", note: "NATO's second largest army, drone warfare pioneer" },
      { label: "Economic Stability", emoji: "\uD83D\uDD34", note: "Inflation ravaged purchasing power, lira collapsed" },
      { label: "Internal Cohesion", emoji: "\uD83D\uDFE1", note: "Erdogan consolidated power, opposition growing" },
      { label: "Leadership", emoji: "\uD83D\uDFE1", note: "Pragmatic foreign policy, unpredictable economics" },
    ],
    etfs: [
      { ticker: "TUR", name: "iShares MSCI Turkey", return1y: 15.2, topHoldings: "Akbank, Turk Telekom, Eregli Demir", expense: "0.58%" },
    ],
    etfNote: "Highest risk of the six tracked here. Strategic position is exceptional but execution risk is high due to inflation history and political unpredictability.",
    regimeAlignment: [
      { regime: "Reflation", emoji: "\uD83D\uDFE1", rating: "\uD83D\uDFE2", note: "Industrial recovery, tourism boom" },
      { regime: "Stagflation", emoji: "\uD83D\uDD34", rating: "\uD83D\uDFE1", note: "Mixed — energy importer but strategic services" },
      { regime: "Goldilocks", emoji: "\uD83D\uDFE2", rating: "\uD83D\uDFE1", note: "Moderate growth benefit" },
      { regime: "Deflation", emoji: "\uD83D\uDD35", rating: "\uD83D\uDD34", note: "Capital flight, currency pressure" },
    ],
    risks: [
      "TRY currency extreme volatility — 80%+ decline since 2020",
      "Inflation history — peaked at 80%+, still 35%",
      "Erdogan policy unpredictability on monetary policy",
      "NATO relationship tension over Russian S-400",
      "Forced to choose sides as tensions escalate",
    ],
    primaryThesis: "Strategic geography + cheap currency",
    keyCommodity: "Geography (Bosphorus)",
    gdpGrowth: "3.2%",
    euAutonomyLink: "Defence + manufacturing",
    bestETF: "TUR",
    bestETFReturn: 15.2,
  },
];

export const regimeAlignment = [
  {
    regime: "Stagflation",
    emoji: "\uD83D\uDD34",
    current: true,
    performance: "Saudi Arabia benefits most — oil windfall from Hormuz. Brazil mixed: energy inflation helps oil but China Deflation hurts iron ore. Morocco's phosphate premium rises on food security fears. India resilient on domestic demand. Indonesia and Turkey face headwinds from weak Chinese commodity demand.",
    bestETFs: "KSA, INDA, MOS",
  },
  {
    regime: "Reflation",
    emoji: "\uD83D\uDFE1",
    current: false,
    performance: "Indonesia and India outperform — industrial recovery drives commodity and manufacturing demand. Morocco benefits from European capex expansion.",
    bestETFs: "EIDO, INDA, AFK",
  },
  {
    regime: "Goldilocks",
    emoji: "\uD83D\uDFE2",
    current: false,
    performance: "India strongly outperforms — growth environment favours young consumption-driven economies. Morocco captures European investment surge.",
    bestETFs: "INDA, SMIN",
  },
  {
    regime: "Deflation",
    emoji: "\uD83D\uDD35",
    current: false,
    performance: "Most emerging markets struggle — commodity prices fall, capital flows to safe havens. Morocco's phosphates most defensive.",
    bestETFs: "Reduce exposure, hold GLD",
  },
];
