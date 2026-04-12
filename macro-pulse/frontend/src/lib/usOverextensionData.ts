export const ACCENT = "#f97316"; // orange

export const dashboardIndicators = [
  {
    label: "Military Bases",
    value: "750+",
    detail: "bases in 80 countries",
    comparison: "China has 1 overseas base",
    trend: "stable" as const,
    status: "critical" as const,
  },
  {
    label: "National Debt",
    value: "$36.2T",
    detail: "federal debt total",
    comparison: "Was $5.7T in 2000",
    trend: "up" as const,
    status: "critical" as const,
  },
  {
    label: "Debt / GDP",
    value: "125%",
    detail: "debt-to-GDP ratio",
    comparison: "Was 55% in 2000",
    trend: "up" as const,
    status: "critical" as const,
  },
  {
    label: "USD Reserve Share",
    value: "58%",
    detail: "of global reserves",
    comparison: "Was 72% in 2000",
    trend: "down" as const,
    status: "warning" as const,
  },
  {
    label: "Active Theaters",
    value: "3",
    detail: "simultaneous commitments",
    comparison: "Middle East, Europe, Indo-Pacific",
    trend: "up" as const,
    status: "critical" as const,
  },
];

export const militaryCommitments = [
  {
    region: "Middle East (Iran war)",
    type: "Active military",
    annualCost: "$25-35bn est.",
    duration: "Feb 2026 — ongoing",
    status: "critical" as const,
  },
  {
    region: "Ukraine support",
    type: "Weapons + intelligence",
    annualCost: "$30-40bn/year",
    duration: "Feb 2022 — ongoing",
    status: "warning" as const,
  },
  {
    region: "Taiwan / Indo-Pacific",
    type: "Naval presence + treaty",
    annualCost: "$15-20bn/year",
    duration: "Ongoing",
    status: "warning" as const,
  },
  {
    region: "NATO Europe",
    type: "Article 5 obligation",
    annualCost: "$20-25bn/year",
    duration: "1949 — ongoing",
    status: "watch" as const,
  },
  {
    region: "South Korea",
    type: "28,500 troops stationed",
    annualCost: "$4-5bn/year",
    duration: "1950 — ongoing",
    status: "stable" as const,
  },
];

export const debtTimeline = [
  { year: 2000, debt: 5.7, gdpPct: 55, usdReserve: 72, goldPrice: 279 },
  { year: 2002, debt: 6.2, gdpPct: 57, usdReserve: 67, goldPrice: 310 },
  { year: 2004, debt: 7.4, gdpPct: 60, usdReserve: 66, goldPrice: 410 },
  { year: 2006, debt: 8.5, gdpPct: 62, usdReserve: 66, goldPrice: 604 },
  { year: 2008, debt: 10.0, gdpPct: 68, usdReserve: 64, goldPrice: 870 },
  { year: 2010, debt: 13.6, gdpPct: 91, usdReserve: 62, goldPrice: 1225 },
  { year: 2012, debt: 16.1, gdpPct: 100, usdReserve: 62, goldPrice: 1670 },
  { year: 2014, debt: 17.8, gdpPct: 101, usdReserve: 63, goldPrice: 1266 },
  { year: 2016, debt: 19.6, gdpPct: 105, usdReserve: 65, goldPrice: 1150 },
  { year: 2018, debt: 21.5, gdpPct: 105, usdReserve: 62, goldPrice: 1280 },
  { year: 2020, debt: 27.8, gdpPct: 127, usdReserve: 59, goldPrice: 1770 },
  { year: 2022, debt: 31.4, gdpPct: 120, usdReserve: 59, goldPrice: 1800 },
  { year: 2024, debt: 34.0, gdpPct: 122, usdReserve: 58, goldPrice: 2400 },
  { year: 2026, debt: 36.2, gdpPct: 125, usdReserve: 58, goldPrice: 4800 },
];

export const bigCycleStages = [
  { stage: 1, label: "New order established", period: "1945", active: false },
  { stage: 2, label: "Peace and prosperity", period: "1945–1970s", active: false },
  { stage: 3, label: "Excess and overextension", period: "1970s–2008", active: false },
  { stage: 4, label: "Financial crisis and internal conflict", period: "2008–2020", active: false },
  { stage: 5, label: "Great power conflict", period: "2020–present", active: true },
  { stage: 6, label: "New order being determined", period: "→ Next", active: false },
];

export const dedollarisation = [
  { country: "Russia", action: "Settled 40% of trade in yuan by 2025, frozen $300B reserves", severity: "high" as const },
  { country: "China", action: "BRICS push for alternative, yuan oil contracts with Saudi Arabia", severity: "high" as const },
  { country: "Saudi Arabia", action: "Accepted yuan for oil sales, joined BRICS+", severity: "medium" as const },
  { country: "India", action: "Rupee-ruble trade for Russian oil, bilateral settlement growing", severity: "medium" as const },
  { country: "Iran", action: "Entirely sanctioned from dollar system, yuan/barter trade", severity: "high" as const },
  { country: "Brazil", action: "Yuan trade settlement with China, BRICS+ active member", severity: "low" as const },
];

export const centralBankGold = [
  { bank: "People's Bank of China", tonnes2023: 225, tonnes2024: 44, trend: "Massive accumulation, 17 consecutive months in 2023" },
  { bank: "National Bank of Poland", tonnes2023: 130, tonnes2024: 90, trend: "Largest European buyer, NATO member hedging dollar" },
  { bank: "Reserve Bank of India", tonnes2023: 16, tonnes2024: 45, trend: "Accelerating purchases, diversifying from USD" },
  { bank: "Central Bank of Turkey", tonnes2023: 76, tonnes2024: 52, trend: "Rebuilding reserves after 2023 lira crisis sales" },
  { bank: "Czech National Bank", tonnes2023: 19, tonnes2024: 20, trend: "Doubling gold share of reserves to 10%+" },
];

export const usStrategicCards = [
  {
    title: "Military Overextension",
    content: "750+ bases in 80 countries. Three active theaters (Middle East/Iran, Ukraine support, Pacific deterrence). Defence budget $886B (3.4% GDP) but cost of simultaneous commitments exceeds capacity. Hormuz blockade enforcement adds a fourth operational demand on an already stretched Navy.",
    keyMetric: "3 active theaters + Hormuz enforcement",
    status: "Critical",
  },
  {
    title: "Dollar Reserve Status Erosion",
    content: "USD share of global reserves fell from 72% (2000) to 58% (2025). BRICS+ nations actively building alternatives: CIPS ($20T+), yuan oil contracts, bilateral settlement agreements. Gold reserves accumulation by China, India, Poland signals central banks hedging USD. Weaponising SWIFT (Russia sanctions) accelerated the diversification trend.",
    keyMetric: "USD reserve share: 58% (was 72%)",
    status: "Declining",
  },
  {
    title: "Debt Trajectory",
    content: "National debt $36.2T (125% GDP). Interest payments exceeded defence spending in 2024 for the first time. CBO projects debt-to-GDP reaching 166% by 2054. Fiscal space to respond to next crisis is constrained. Each rate hike costs ~$200B in additional annual interest. This is Dalio's 'printing money' phase of the big cycle.",
    keyMetric: "Interest > Defence spending (2024)",
    status: "Unsustainable",
  },
  {
    title: "Internal Polarisation",
    content: "Dalio identifies internal conflict as a late-stage imperial indicator. Wealth inequality at 1920s levels. Political polarisation at highest since Civil War era by Pew Research metrics. Institutional trust (Congress, media, courts) at historic lows. Social cohesion erosion reduces capacity for collective sacrifice — critical during great power competition.",
    keyMetric: "Institutional trust: historic lows",
    status: "Elevated",
  },
];
