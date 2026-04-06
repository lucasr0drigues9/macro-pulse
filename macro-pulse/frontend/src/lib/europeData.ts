export type RegimeFit = "strong" | "positive" | "neutral" | "negative";

export type Company = {
  name: string;
  ticker: string;
  exchange: string;
  thesis: string;
  whyNow: string;
  bullCase: string;
  bearCase: string;
  riskLevel: "Conservative" | "Moderate" | "Aggressive" | "Conservative-Moderate" | "Moderate-Aggressive";
  regimeFit: {
    stagflation: RegimeFit;
    goldilocks: RegimeFit;
    reflation: RegimeFit;
    deflation: RegimeFit;
  };
  note?: string;
};

export const SECTORS = {
  defence: { color: "#6b8e5a", label: "Defence", bg: "rgba(107, 142, 90, 0.08)" },
  energy: { color: "#e09030", label: "Energy Independence", bg: "rgba(224, 144, 48, 0.08)" },
  technology: { color: "#3b82f6", label: "Technology Sovereignty", bg: "rgba(59, 130, 246, 0.08)" },
  finance: { color: "#22c55e", label: "Financial Infrastructure", bg: "rgba(34, 197, 94, 0.08)" },
  materials: { color: "#a855f7", label: "Critical Materials", bg: "rgba(168, 85, 247, 0.08)" },
} as const;

export const COMPANIES: Record<string, Company[]> = {
  defence: [
    {
      name: "Rheinmetall", ticker: "RHM.DE", exchange: "Frankfurt",
      thesis: "Leading European armoured vehicles and ammunition",
      whyNow: "Germany's largest defence manufacturer, direct beneficiary of German defence spending doubling from €50bn to €100bn+. Tank and ammunition manufacturer at full capacity with multi-year order backlog.",
      bullCase: "NATO 3-4% GDP commitment turns into decades of procurement. Rheinmetall becomes Europe's defence prime, doubling revenue by 2028.",
      bearCase: "Peace deal reduces urgency. Government procurement delays push contracts right. Competition from other European primes intensifies.",
      riskLevel: "Conservative-Moderate",
      regimeFit: { stagflation: "strong", goldilocks: "positive", reflation: "positive", deflation: "positive" },
    },
    {
      name: "BAE Systems", ticker: "BA.L", exchange: "London",
      thesis: "UK's largest defence company, submarines and cyber",
      whyNow: "Benefits from both UK and European rearmament. Major contracts in submarines (AUKUS), fighter jets, and cyber defence. Decades of order backlog provides revenue visibility.",
      bullCase: "AUKUS submarine program delivers decades of guaranteed revenue. European defence spending creates additional upside beyond core UK contracts.",
      bearCase: "UK defence budget comes under pressure from other fiscal priorities. AUKUS timeline slips.",
      riskLevel: "Conservative",
      regimeFit: { stagflation: "positive", goldilocks: "positive", reflation: "positive", deflation: "positive" },
    },
    {
      name: "Leonardo", ticker: "LDO.MI", exchange: "Milan",
      thesis: "Italian defence giant, helicopters and electronics",
      whyNow: "EU's push to develop common defence procurement benefits Italian manufacturers directly. Helicopter and electronics specialist with growing European market share.",
      bullCase: "EU common procurement framework directs spending to Leonardo as southern European champion. Helicopter division captures NATO replacement cycle.",
      bearCase: "Italian political instability affects government support. EU procurement fragmentation continues favouring national champions.",
      riskLevel: "Moderate",
      regimeFit: { stagflation: "positive", goldilocks: "positive", reflation: "positive", deflation: "neutral" },
    },
    {
      name: "Saab", ticker: "SAAB-B.ST", exchange: "Stockholm",
      thesis: "Swedish fighter jets (Gripen), radar systems",
      whyNow: "Gripen fighter jet demand surging as Nordic countries rearm. Sweden's NATO accession means Saab is now inside NATO procurement framework, opening new markets.",
      bullCase: "Gripen becomes NATO's affordable fighter option. Nordic defence cooperation deepens with Saab as anchor.",
      bearCase: "Gripen loses competitions to F-35 or Eurofighter. Smaller company with concentrated revenue risk.",
      riskLevel: "Moderate",
      regimeFit: { stagflation: "positive", goldilocks: "positive", reflation: "positive", deflation: "neutral" },
    },
    {
      name: "Thales", ticker: "HO.PA", exchange: "Paris",
      thesis: "Defence electronics, cybersecurity, space",
      whyNow: "French electronics and cybersecurity company. Digital warfare and satellite systems are the fastest growing defence segments — Thales is at the centre.",
      bullCase: "Cybersecurity and space become dominant defence spending categories. Thales captures disproportionate share of high-tech defence budgets.",
      bearCase: "Government austerity reduces tech-focused defence budgets in favour of traditional hardware.",
      riskLevel: "Conservative-Moderate",
      regimeFit: { stagflation: "positive", goldilocks: "strong", reflation: "positive", deflation: "positive" },
    },
    {
      name: "Airbus", ticker: "AIR.PA", exchange: "Paris",
      thesis: "Military transport (A400M), helicopters, space",
      whyNow: "Defence division growing rapidly alongside commercial aviation backlog. A400M military transport and NH90 helicopter programs benefit from European rearmament.",
      bullCase: "Defence division spins off or re-rates. Commercial backlog provides stability while defence grows.",
      bearCase: "Supply chain issues delay defence program deliveries. Commercial aviation cycle turns.",
      riskLevel: "Conservative-Moderate",
      regimeFit: { stagflation: "neutral", goldilocks: "strong", reflation: "strong", deflation: "neutral" },
    },
  ],
  energy: [
    {
      name: "Equinor", ticker: "EQNR.OL", exchange: "Oslo",
      thesis: "Norwegian energy giant, LNG + offshore wind",
      whyNow: "Norway's state-controlled energy company, largest gas supplier to Europe. Direct beneficiary of high oil prices in current Stagflation. NOK-denominated, accessible on Nordnet for Norwegian investors.",
      bullCase: "Oil stays above $80 for years. European gas dependence on Norway deepens. Offshore wind division scales profitably.",
      bearCase: "Oil crashes on peace deal. Offshore wind economics deteriorate further. Norwegian tax regime tightens.",
      riskLevel: "Conservative",
      regimeFit: { stagflation: "strong", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
    {
      name: "TotalEnergies", ticker: "TTE.PA", exchange: "Paris",
      thesis: "French integrated energy, major LNG trader",
      whyNow: "One of Europe's largest LNG traders, directly positioned for European energy security. Most diversified European energy major with significant renewables portfolio.",
      bullCase: "LNG premium persists as Europe replaces Russian pipeline gas permanently. Renewables division reaches profitability.",
      bearCase: "Energy transition accelerates faster than expected. French regulatory environment tightens.",
      riskLevel: "Conservative",
      regimeFit: { stagflation: "strong", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
    {
      name: "Ørsted", ticker: "ORSTED.CO", exchange: "Copenhagen",
      thesis: "World leader in offshore wind",
      whyNow: "Struggled in 2023-2024 due to high interest rates making project economics difficult. Rate cuts would dramatically improve project viability. Stock significantly off highs.",
      bullCase: "Rate cuts restore offshore wind economics. European wind targets create decades of project pipeline. First-mover advantage in execution.",
      bearCase: "Interest rates stay high longer. Project cost inflation continues. Competition from Chinese wind manufacturers.",
      riskLevel: "Aggressive",
      regimeFit: { stagflation: "negative", goldilocks: "strong", reflation: "neutral", deflation: "neutral" },
      note: "Currently out of favour — long-term structural tailwind intact but near-term headwinds from rates.",
    },
    {
      name: "Vestas Wind", ticker: "VWS.CO", exchange: "Copenhagen",
      thesis: "Global #1 wind turbine manufacturer",
      whyNow: "European offshore wind expansion requires enormous turbine procurement. Order book growing but margins under pressure from cost inflation.",
      bullCase: "European wind targets drive order book. Margins recover as supply chains normalise.",
      bearCase: "Chinese turbine manufacturers undercut on price. Project delays reduce near-term demand.",
      riskLevel: "Moderate-Aggressive",
      regimeFit: { stagflation: "negative", goldilocks: "strong", reflation: "positive", deflation: "neutral" },
    },
    {
      name: "Shell", ticker: "SHEL.L", exchange: "London",
      thesis: "LNG leader, energy transition player",
      whyNow: "Global LNG leader with the largest trading operation. European energy security requires long-term LNG supply contracts — Shell is the natural counterparty.",
      bullCase: "LNG becomes permanent European energy pillar. Shell's trading arm captures volatility premium.",
      bearCase: "Energy transition reduces fossil fuel demand faster than expected. Activist pressure on capital allocation.",
      riskLevel: "Conservative",
      regimeFit: { stagflation: "strong", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
  ],
  technology: [
    {
      name: "ASML", ticker: "ASML.AS", exchange: "Amsterdam",
      thesis: "Monopoly on EUV lithography — no chips without ASML",
      whyNow: "Effective global monopoly on extreme ultraviolet lithography machines. Every advanced chip globally requires ASML machines. No competitor exists or is likely to exist for a decade. 2+ year order backlog.",
      bullCase: "AI chip demand drives unprecedented equipment spending. China restrictions create pricing power. Monopoly sustains margins above 50%.",
      bearCase: "China export restrictions reduce addressable market by 15-20%. Semiconductor cycle downturn delays orders.",
      riskLevel: "Conservative-Moderate",
      regimeFit: { stagflation: "neutral", goldilocks: "strong", reflation: "positive", deflation: "neutral" },
    },
    {
      name: "SAP", ticker: "SAP.DE", exchange: "Frankfurt",
      thesis: "Europe's largest software company, enterprise ERP",
      whyNow: "Dominant in enterprise resource planning. Transitioning to cloud subscription model which increases revenue predictability. AI integration accelerating enterprise demand.",
      bullCase: "Cloud transition completes — recurring revenue drives re-rating. AI features increase per-seat pricing.",
      bearCase: "Cloud migration stalls. Competition from Oracle and Workday intensifies.",
      riskLevel: "Conservative",
      regimeFit: { stagflation: "neutral", goldilocks: "strong", reflation: "positive", deflation: "positive" },
    },
    {
      name: "Airbus", ticker: "AIR.PA", exchange: "Paris",
      thesis: "Duopoly with Boeing, European aerospace sovereignty",
      whyNow: "Boeing's quality crisis has shifted orders toward Airbus. 10+ year order backlog at record levels. Only viable alternative for single-aisle commercial aircraft.",
      bullCase: "Boeing struggles persist for years. Airbus captures 65%+ market share. Production rate increases to 75 A320s/month.",
      bearCase: "Supply chain constraints limit production ramp. New Boeing management restores competitiveness.",
      riskLevel: "Conservative-Moderate",
      regimeFit: { stagflation: "neutral", goldilocks: "strong", reflation: "strong", deflation: "neutral" },
    },
    {
      name: "Infineon", ticker: "IFX.DE", exchange: "Frankfurt",
      thesis: "Power semiconductors, automotive chips",
      whyNow: "German semiconductor company specialising in power semiconductors and automotive chips. EV transition requires massive power semiconductor content per vehicle — 3x more chips than ICE vehicles.",
      bullCase: "EV adoption accelerates. Power semiconductor content per vehicle keeps rising. EU Chips Act funding supports expansion.",
      bearCase: "EV adoption slows. Automotive semiconductor cycle turns down. Chinese competitors gain share.",
      riskLevel: "Moderate",
      regimeFit: { stagflation: "negative", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
    {
      name: "STMicroelectronics", ticker: "STMPA.PA", exchange: "Paris",
      thesis: "Franco-Italian chip maker, automotive and industrial",
      whyNow: "Major supplier to European automotive industry for EV transition chips. Joint venture with GlobalFoundries building new fab in France with EU Chips Act support.",
      bullCase: "European semiconductor reshoring succeeds. STM captures European automotive supply chain.",
      bearCase: "Automotive chip demand normalises after shortage-driven over-ordering. Chinese competition intensifies.",
      riskLevel: "Moderate",
      regimeFit: { stagflation: "negative", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
    {
      name: "Capgemini", ticker: "CAP.PA", exchange: "Paris",
      thesis: "IT consulting, digital transformation",
      whyNow: "European IT consulting leader. Digital transformation and AI implementation require consulting support — Capgemini is the European-headquartered alternative to Accenture.",
      bullCase: "AI implementation cycle drives consulting demand. European companies prefer European partners for strategic technology projects.",
      bearCase: "IT spending cuts in downturn. AI automates some consulting services.",
      riskLevel: "Moderate",
      regimeFit: { stagflation: "negative", goldilocks: "strong", reflation: "positive", deflation: "negative" },
    },
  ],
  finance: [
    {
      name: "Deutsche Börse", ticker: "DB1.DE", exchange: "Frankfurt",
      thesis: "Exchange, clearing, and financial infrastructure",
      whyNow: "Owns Clearstream (clearing) and Eurex (derivatives). Collects fees regardless of market direction — benefits from volatility and volume growth. Infrastructure business model.",
      bullCase: "European capital markets deepen. Clearing and settlement volumes grow structurally. New products drive revenue diversification.",
      bearCase: "EU regulatory changes increase competition. Trading volumes normalise.",
      riskLevel: "Conservative",
      regimeFit: { stagflation: "positive", goldilocks: "positive", reflation: "positive", deflation: "positive" },
    },
    {
      name: "Euronext", ticker: "ENX.PA", exchange: "Paris",
      thesis: "Pan-European exchange, benefits from CMU",
      whyNow: "Operates exchanges in Paris, Amsterdam, Brussels, Dublin, Oslo, Milan, Lisbon. Direct beneficiary of deeper European capital markets. Every new listing and trade increases revenue.",
      bullCase: "Capital Markets Union progresses. European IPO market recovers. Trading volumes grow with market development.",
      bearCase: "CMU stalls permanently. Competition from other exchanges. Low IPO activity persists.",
      riskLevel: "Conservative-Moderate",
      regimeFit: { stagflation: "neutral", goldilocks: "strong", reflation: "positive", deflation: "neutral" },
    },
    {
      name: "London Stock Exchange", ticker: "LSEG.L", exchange: "London",
      thesis: "Financial data and infrastructure powerhouse",
      whyNow: "Despite Brexit, LSEG remains Europe's largest financial data company. Refinitiv acquisition made it a data powerhouse competing with Bloomberg. Recurring data revenue is highly defensive.",
      bullCase: "Data business grows at 6-8% annually. Financial infrastructure becomes essential utility with pricing power.",
      bearCase: "Brexit-related business migration continues. Bloomberg competes more aggressively.",
      riskLevel: "Conservative",
      regimeFit: { stagflation: "positive", goldilocks: "positive", reflation: "positive", deflation: "positive" },
    },
    {
      name: "BNP Paribas", ticker: "BNP.PA", exchange: "Paris",
      thesis: "Europe's largest bank, infrastructure financier",
      whyNow: "Rising European defence and infrastructure spending requires financing — BNP is the natural financier of large European projects. Benefits from higher rates.",
      bullCase: "European infrastructure boom creates lending opportunities. Capital markets revenue grows with EU bond issuance.",
      bearCase: "Rate cuts compress net interest margins. Credit quality deteriorates in downturn.",
      riskLevel: "Moderate",
      regimeFit: { stagflation: "neutral", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
    {
      name: "UniCredit", ticker: "UCG.MI", exchange: "Milan",
      thesis: "Pan-European banking consolidation",
      whyNow: "Pursuing Commerzbank acquisition — would create true pan-European bank. CEO Orcel driving aggressive shareholder returns and operational improvement.",
      bullCase: "Commerzbank deal succeeds. Pan-European banking model proves superior. Continued shareholder returns.",
      bearCase: "German political opposition blocks Commerzbank. Italian sovereign risk reprices bank.",
      riskLevel: "Moderate",
      regimeFit: { stagflation: "neutral", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
    {
      name: "Deutsche Bank", ticker: "DBK.DE", exchange: "Frankfurt",
      thesis: "German banking restructuring story",
      whyNow: "Multi-year restructuring showing results. German economy needs a strong investment bank for infrastructure financing and capital markets development.",
      bullCase: "Restructuring completes successfully. German economic recovery drives corporate banking revenue.",
      bearCase: "Restructuring stalls. German economic weakness persists. Legacy costs resurface.",
      riskLevel: "Moderate-Aggressive",
      regimeFit: { stagflation: "negative", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
  ],
  materials: [
    {
      name: "Glencore", ticker: "GLEN.L", exchange: "London",
      thesis: "Global commodities, cobalt, copper, recycling",
      whyNow: "Largest cobalt producer globally. Major copper producer. Both metals essential for electrification. Trading arm profits from commodity volatility.",
      bullCase: "Copper supply deficit drives prices higher. Cobalt demand from batteries sustains premium. Trading profits add counter-cyclical revenue.",
      bearCase: "Commodity price collapse. ESG pressure on mining operations. Governance concerns return.",
      riskLevel: "Moderate",
      regimeFit: { stagflation: "strong", goldilocks: "neutral", reflation: "strong", deflation: "negative" },
    },
    {
      name: "Norsk Hydro", ticker: "NHY.OL", exchange: "Oslo",
      thesis: "Norwegian aluminium, renewable energy, recycling",
      whyNow: "Aluminium critical for aerospace, defence, and EV manufacturing. Norwegian hydropower gives Hydro the lowest-carbon aluminium globally — increasingly required by EU regulations.",
      bullCase: "Green aluminium premium grows as EU carbon border tax bites. Defence and EV demand drives volume growth.",
      bearCase: "Aluminium price weakness. Energy costs in Norway rise. Chinese overcapacity suppresses prices.",
      riskLevel: "Conservative-Moderate",
      regimeFit: { stagflation: "positive", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
    {
      name: "Boliden", ticker: "BOL.ST", exchange: "Stockholm",
      thesis: "Nordic mining — copper, zinc, precious metals",
      whyNow: "Copper is the most critical metal for electrification — every EV, wind turbine, and solar panel requires significant copper. European-based mining with strong ESG credentials.",
      bullCase: "Copper supply deficit materialises. European recycling regulations drive demand for responsible sourcing.",
      bearCase: "Copper demand growth slows. Mining operational disruptions. Metal prices enter prolonged downturn.",
      riskLevel: "Moderate",
      regimeFit: { stagflation: "positive", goldilocks: "neutral", reflation: "strong", deflation: "negative" },
    },
    {
      name: "Umicore", ticker: "UMI.BR", exchange: "Brussels",
      thesis: "Battery materials, recycling, catalysis",
      whyNow: "EU battery regulation requires minimum recycled content — Umicore is perfectly positioned as European battery recycling leader. Cathode materials for EV batteries.",
      bullCase: "EU battery recycling mandates drive demand. Cathode material market grows with EV adoption.",
      bearCase: "Chinese competition in battery materials intensifies. EV adoption slows. Recycling economics don't scale.",
      riskLevel: "Moderate-Aggressive",
      regimeFit: { stagflation: "negative", goldilocks: "positive", reflation: "strong", deflation: "negative" },
    },
    {
      name: "Northvolt", ticker: "PRIVATE", exchange: "—",
      thesis: "European battery gigafactory — in bankruptcy restructuring",
      whyNow: "Filed for bankruptcy restructuring in late 2024. Highlights the execution risk of European industrial independence but also validates the demand — multiple European automakers need a non-Chinese battery supplier.",
      bullCase: "Restructuring succeeds with new ownership. European automakers commit offtake agreements. Becomes European battery champion.",
      bearCase: "Restructuring fails. Assets acquired piecemeal. European battery independence set back by years.",
      riskLevel: "Aggressive",
      regimeFit: { stagflation: "negative", goldilocks: "positive", reflation: "positive", deflation: "negative" },
      note: "Private company — status tracker only. Not investable. Included because it's the most important European battery story.",
    },
  ],
};

export const CATALYSTS: Record<string, string[]> = {
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

export const REGIME_FIT_EMOJI: Record<RegimeFit, string> = {
  strong: "✅✅",
  positive: "✅",
  neutral: "➖",
  negative: "❌",
};

export const RISK_COLORS: Record<string, string> = {
  "Conservative": "#22c55e",
  "Conservative-Moderate": "#86c55e",
  "Moderate": "#eab308",
  "Moderate-Aggressive": "#e08030",
  "Aggressive": "#ef4444",
};
