"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import SectionChat from "@/components/SectionChat";
import SubscribeForm from "@/components/SubscribeForm";
import { apiUrl } from "@/lib/api";

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444", Goldilocks: "#22c55e", Reflation: "#eab308", Deflation: "#3b82f6",
};

type RegimeData = { regime: string; periodStart?: string };
type TimingETF = {
  ticker: string; layer: string; color: string; isUcits: boolean;
  price: number; rsi: number; vsMa200: number; drawdown: number;
  high52w: number; low52w: number; ret1y: number; score: number; signal: string;
};

// ── Supply Chain Data ──
const SUPPLY_CHAIN = [
  {
    layer: "AI & Autonomous Systems",
    color: "#c084fc",
    description: "The intelligence layer. AI powers the robots, the self-driving, the chip design itself. Every competitor building robots needs AI — this is the horizontal enabler.",
    etfs: [
      { ticker: "BOTZ", ucits: "WTAI.L", name: "Global X Robotics & AI ETF", why: "Overlap with robotics, but AI-weighted. Nvidia, Fanuc, Keyence." },
      { ticker: "ARKQ", ucits: "—", name: "ARK Autonomous Tech & Robotics ETF", why: "Tesla, Kratos, UiPath, Iridium. ARK's bet on autonomous systems, drones, and robotics." },
      { ticker: "ROBT", ucits: "—", name: "First Trust AI & Robotics ETF", why: "AI-first selection. Companies where AI is core revenue, not a side project." },
      { ticker: "AIQ", ucits: "—", name: "Global X AI & Technology ETF", why: "Broad AI exposure: Nvidia, Microsoft, Alphabet, Meta. The platforms building AI infrastructure." },
    ],
    catalysts: [
      { date: "Ongoing", event: "AI capex: Microsoft, Google, Amazon spending $200B+ combined on AI infrastructure in 2025-2026" },
      { date: "2025-2026", event: "Autonomous driving reaching commercial scale (Waymo, Tesla FSD)" },
      { date: "2027+", event: "AI agents replacing white-collar tasks — demand for compute becomes insatiable" },
    ],
    parallel: "The internet created Google, Amazon, Facebook. AI will create companies of similar scale. But unlike the internet, AI also needs physical infrastructure (chips, power, cooling) — making the supply chain investable.",
  },
  {
    layer: "AI Chips",
    color: "#3b82f6",
    description: "The foundation. Terafab produces AI chips at unprecedented scale — powering robots, self-driving, datacenters.",
    etfs: [
      { ticker: "SMH", ucits: "SEMI.L", name: "VanEck Semiconductor ETF", why: "ASML, TSMC, Nvidia, Broadcom. The entire chip supply chain in one ETF." },
    ],
    catalysts: [
      { date: "2026", event: "Terafab announcement + site selection" },
      { date: "2027-2028", event: "Construction phase — equipment orders (ASML, Applied Materials)" },
      { date: "2029+", event: "Production ramp — chip output at scale" },
    ],
    parallel: "Gigafactory Nevada announced 2014. TSLA went from $40 to $400 by 2020. The supply chain (lithium, nickel, cobalt) moved first.",
  },
  {
    layer: "Robotics & Automation",
    color: "#22c55e",
    description: "The end product. Tesla Optimus + industrial robots. But Musk is just the first mover — Google, Amazon, Nvidia, and dozens of startups are building robots too.",
    etfs: [
      { ticker: "BOTZ", ucits: "RBOT.L", name: "Global X Robotics & AI ETF", why: "Fanuc, Intuitive Surgical, Keyence, ABB. The companies building and deploying robots at scale." },
      { ticker: "ROBO", ucits: "—", name: "ROBO Global Robotics & Automation", why: "Broader robotics exposure. 80+ companies across the automation value chain." },
      { ticker: "ARKQ", ucits: "—", name: "ARK Autonomous Tech & Robotics ETF", why: "Tesla, Kratos, UiPath, Iridium. ARK's bet on autonomous systems, drones, and robotics." },
    ],
    catalysts: [
      { date: "2025", event: "Figure AI, Apptronik, 1X — humanoid robot startups hitting pilot deployments" },
      { date: "2026", event: "Tesla Optimus limited production begins" },
      { date: "2027", event: "First commercial deployments — Tesla factories + Amazon warehouses" },
      { date: "2028-2030", event: "Multiple companies at scale — the industry, not just Tesla" },
    ],
    parallel: "Industrial robot installations grew 31% in 2021-2022 alone. China installed more robots than the rest of the world combined in 2023.",
  },
  {
    layer: "Copper & Wiring",
    color: "#e09030",
    description: "Every chip, every robot, every EV, every datacenter needs copper. Fabs are massive power consumers requiring extensive wiring.",
    etfs: [
      { ticker: "COPX", ucits: "COPP.L", name: "Global X Copper Miners ETF", why: "First Solar, Freeport-McMoRan, Southern Copper. Pure copper exposure." },
    ],
    catalysts: [
      { date: "Ongoing", event: "IEA projects copper demand doubles by 2035" },
      { date: "2026-2028", event: "Terafab construction phase = massive copper demand" },
      { date: "2030+", event: "Robot production at scale = sustained demand growth" },
    ],
    parallel: "EV wave: copper went from $2.50/lb (2020) to $5.87/lb (2026). Terafab adds a second demand wave on top.",
  },
  {
    layer: "Lithium & Batteries",
    color: "#a855f7",
    description: "Every robot needs a battery. Every self-driving car needs a bigger battery. Energy storage for fabs and datacenters.",
    etfs: [
      { ticker: "LIT", ucits: "—", name: "Global X Lithium & Battery Tech ETF", why: "Albemarle, SQM, Panasonic, BYD. Battery supply chain from mine to cell." },
    ],
    catalysts: [
      { date: "Ongoing", event: "Global battery demand growing 25%+ annually" },
      { date: "2027+", event: "Optimus robots at scale = new battery demand category" },
      { date: "2030", event: "Solid-state batteries commercialise — demand spike for new materials" },
    ],
    parallel: "Lithium price 5x'd from 2020-2022 during the EV ramp, then corrected 70%. The cycle will repeat with robots.",
  },
  {
    layer: "Rare Earths & Magnets",
    color: "#ef4444",
    description: "Robot motors, EV motors, wind turbines all need rare earth permanent magnets. China controls 60% of mining, 90% of processing.",
    etfs: [
      { ticker: "REMX", ucits: "—", name: "VanEck Rare Earth/Strategic Metals ETF", why: "MP Materials, Lynas, Pilbara Minerals. Non-China rare earth supply chain." },
    ],
    catalysts: [
      { date: "Ongoing", event: "US + EU building domestic rare earth processing (de-risking from China)" },
      { date: "2027+", event: "Robot motors at scale = rare earth demand surge" },
      { date: "2028", event: "MP Materials Texas processing plant operational" },
    ],
    parallel: "China restricted rare earth exports in 2010. Prices spiked 10x. The same playbook could trigger again during US-China tensions.",
  },
  {
    layer: "Energy & Power",
    color: "#eab308",
    description: "Chip fabs consume as much power as small cities. Datacenters for AI training are already straining grids. Robots need charging infrastructure.",
    etfs: [
      { ticker: "ICLN", ucits: "INRG.L", name: "iShares Global Clean Energy ETF", why: "Enphase, First Solar, Vestas. The clean energy buildout powering the AI revolution." },
    ],
    catalysts: [
      { date: "Ongoing", event: "US datacenter power demand growing 15% annually" },
      { date: "2027+", event: "Terafab + robot charging = new baseload demand" },
      { date: "2030", event: "Grid infrastructure upgrade cycle accelerates" },
    ],
    parallel: "Amazon, Google, Microsoft signed $20B+ in power purchase agreements in 2024 alone. Terafab will need similar scale.",
  },
];

const FORWARD_CATALYSTS = [
  {
    category: "Supply deficits already locked in",
    categoryBadge: "mathematically certain",
    color: "#22c55e",
    intro: "New copper mines take 10-15 years from discovery to production. The 2028 deficit is already locked in — no policy change can fix it in time. The market is still pricing copper like a cyclical.",
    items: [
      {
        title: "Copper 2028 deficit",
        short: "IEA: demand doubles, supply can't catch up.",
        triggers: "COPX, COPP.L",
        fullThesis: "The IEA projects copper demand doubles from 25Mt to 50Mt by 2035. EVs use 3-4x more copper than ICE cars. AI datacenters need massive wiring. Every chip fab is a copper sink. But the supply side can't respond: the average copper mine takes 10-15 years from discovery to first production. The largest new mines (Kamoa-Kakula, Oyu Tolgoi Phase 2) won't fully offset depletion of Chile's aging giants (Escondida, Chuquicamata).",
        keyFacts: [
          "Current demand: 25Mt/yr (2024)",
          "Projected 2035 demand: 50Mt/yr (IEA)",
          "Supply pipeline through 2030: only +3Mt",
          "Chile mines down 20% since 2013 despite capex",
          "Grades falling: average 0.6% → 0.5% copper content",
        ],
        whatWouldBreak: "A massive recession that kills EV + datacenter demand simultaneously. Unlikely — both are policy-driven not cyclical.",
      },
      {
        title: "Rare earth processing bottleneck",
        short: "MP Materials Texas plant online 2028. Until then, China still controls 90%.",
        triggers: "REMX",
        fullThesis: "China doesn't dominate rare earth mining (~60%) — they dominate processing (~90%). The US and Europe are building domestic processing capacity, but the timeline is slow. MP Materials' Texas plant (the key non-China facility) isn't fully operational until 2028. Until then, any Chinese export restriction spikes prices 10x (the 2010 Senkaku playbook). After 2028, the Western supply chain becomes the default for defence and robot motors — a structural rerate for non-China miners.",
        keyFacts: [
          "China share of mining: 60%",
          "China share of processing: 90%",
          "MP Materials Texas plant: online 2028",
          "Lynas Malaysia expansion: 2027",
          "EU Critical Raw Materials Act: €3B committed",
        ],
        whatWouldBreak: "A US-China détente that unwinds tech decoupling. Extremely unlikely given current trajectory.",
      },
      {
        title: "Grid capacity shortage",
        short: "US datacenter power +20% in 5 years. Transmission takes 10+.",
        triggers: "ICLN, utilities, copper",
        fullThesis: "AI datacenters are already straining grids. A single hyperscaler datacenter consumes as much power as a small city. The US needs 20%+ more generation by 2030 just for datacenters, before accounting for EV adoption. But new transmission lines take 10+ years to permit and build. PJM Interconnection's queue has 230GW of stalled projects. The bottleneck isn't generation — it's getting power to where the chips are. This is why utilities are raising rates, hyperscalers are signing 20-year nuclear PPAs, and copper demand keeps outpacing consensus forecasts.",
        keyFacts: [
          "US datacenter demand: 20GW (2024) → 60GW+ (2030)",
          "PJM queue backlog: 230GW stalled",
          "Microsoft reopening Three Mile Island",
          "Amazon signed 20-year PPA with Talen Energy",
          "Transmission line average permit: 7-10 years",
        ],
        whatWouldBreak: "AI adoption stalling (possible but unlikely given capex guidance). More efficient chips (Nvidia Blackwell improves 4x but demand growing faster).",
      },
    ],
  },
  {
    category: "Policy escalations near-certain",
    categoryBadge: "political pattern",
    color: "#ef4444",
    intro: "US chip export controls to China have escalated every 6-9 months since 2022. Each escalation is a catalyst for domestic supply chain ETFs. China retaliates with rare earth restrictions. The cycle is locked in by US-China tensions.",
    items: [
      {
        title: "Next US chip export controls",
        short: "Historical pattern: every 6-9 months.",
        triggers: "SMH, domestic fab ETFs",
        fullThesis: "The US has escalated chip export controls to China five times since October 2022: initial AI chip ban, entity list expansion, EUV tool restrictions, 7nm process controls, and most recently HBM memory restrictions. Every cycle creates two effects: (1) short-term hit to exporters (Nvidia China revenue), (2) long-term tailwind for domestic fab buildout (more CHIPS Act spending, more orders for ASML, AMAT, LRCX). The pattern is locked in by bipartisan US-China tensions — neither party wants to look soft. Expect another escalation within 6-9 months.",
        keyFacts: [
          "5 escalations since Oct 2022",
          "Each ~6-9 months apart",
          "Nvidia China revenue: 20% → 5% since controls",
          "ASML China orders still growing (pre-EUV tools)",
          "CHIPS Act spending: $52B, $39B allocated",
        ],
        whatWouldBreak: "Political shift that reverses decoupling. No realistic scenario in current environment.",
      },
      {
        title: "China rare earth restrictions",
        short: "2010 playbook: 10x spike in weeks.",
        triggers: "REMX",
        fullThesis: "In 2010, during the Senkaku Islands dispute with Japan, China cut rare earth exports 40%. Prices spiked 10x in weeks. Neodymium went from $20/kg to $200/kg. China has threatened this again multiple times since 2023. The difference now: Western processing capacity is still 2-3 years away. If Beijing weaponises rare earths during a Taiwan incident or further tech escalation, REMX goes parabolic. Even without a crisis, China has been slowly tightening export quotas on gallium, germanium, and graphite — each announcement is a mini-catalyst.",
        keyFacts: [
          "2010 Senkaku incident: prices +1000% in weeks",
          "Neodymium (key for robot motors): China 87% processing",
          "Gallium export controls: imposed Aug 2023",
          "Graphite restrictions: Dec 2023",
          "Tungsten, antimony: added 2025",
        ],
        whatWouldBreak: "Chinese economic collapse forcing export revenue retention. Unlikely in the medium term.",
      },
      {
        title: "CHIPS Act 2.0 / EU Phase 2",
        short: "Already under discussion in Congress.",
        triggers: "SMH, equipment makers, domestic fab ETFs",
        fullThesis: "The original CHIPS Act ($52B) has been largely committed but recent assessments show it's not enough to re-shore advanced manufacturing. Bipartisan discussions in Congress point to a CHIPS Act 2.0 with additional funding for advanced packaging, materials, and workforce. The EU Chips Act (€43B) is similarly being evaluated for Phase 2 expansion given Europe's strategic vulnerability. Each new tranche is a direct tailwind for semiconductor equipment makers (ASML, Applied Materials, Lam Research, KLA) captured in SMH.",
        keyFacts: [
          "CHIPS Act 1.0: $52B (mostly committed)",
          "EU Chips Act: €43B",
          "TSMC Arizona got $6.6B subsidy + $5B loan",
          "Intel got $8.5B subsidy",
          "Micron got $6.1B subsidy",
        ],
        whatWouldBreak: "US government shutdown or defeat of industrial policy consensus. Unlikely given bipartisan support.",
      },
    ],
  },
  {
    category: "Specific company catalysts with dates",
    categoryBadge: "announced but unpriced",
    color: "#3b82f6",
    intro: "Companies have telegraphed these milestones. The market treats them as distant. When they hit, the supply chain reprices overnight.",
    items: [
      {
        title: "SpaceX IPO",
        short: "Expected 2026. Sentiment catalyst for entire Musk complex.",
        triggers: "SMH, BOTZ, ARKQ, TSLA",
        fullThesis: "SpaceX is expected to IPO in 2026, likely at a $250B+ valuation. It would be the largest tech IPO in history. Beyond the direct investment opportunity, the IPO reprices the entire Musk industrial complex: Tesla (Optimus, FSD), Terafab, Starlink, and the broader autonomous systems ecosystem. Public investors finally get access to a Musk asset that has proven scalable manufacturing (Starship reusability, Starlink constellation). Sentiment effect spills over to BOTZ, ARKQ, SMH as investors extrapolate the industrial automation thesis.",
        keyFacts: [
          "Current private valuation: ~$250B",
          "Starlink revenue: $8-10B/yr (estimate)",
          "Launch cadence: 100+ Falcon 9/yr",
          "Starship: commercial ops expected 2026",
          "Pre-IPO private shares trading actively",
        ],
        whatWouldBreak: "Launch failures, regulatory pushback, or Musk personal drama derailing timeline.",
      },
      {
        title: "Tesla Optimus scale",
        short: "First 10k+ units in production triggers robotics rerate.",
        triggers: "BOTZ, ARKQ, LIT, REMX",
        fullThesis: "Tesla has guided to 10k Optimus units by end 2026, scaling to 100k+ by 2028, and 1M+ by 2030. These targets are aspirational but the manufacturing process is already underway. The key inflection: when Optimus hits its first commercial deployment at Tesla factories (expected late 2026), the robotics supply chain reprices. BOTZ (Fanuc, Intuitive Surgical, Keyence) captures the broader industrial automation tailwind. ARKQ captures the autonomous tech thesis directly. Each Optimus uses ~3kg of rare earth magnets and ~15kg of lithium-ion battery — real materials demand, not just sentiment.",
        keyFacts: [
          "Tesla target: 10k units by end 2026",
          "Scaling: 100k (2028), 1M (2030)",
          "Materials per unit: ~3kg rare earths, ~15kg battery",
          "Competitors: Figure AI, 1X, Apptronik (all startups)",
          "Amazon already testing warehouses robotics",
        ],
        whatWouldBreak: "Musk timelines slipping 2+ years (possible). Safety incidents. Cost not dropping below $20k/unit.",
      },
      {
        title: "Terafab site selection",
        short: "Triggers equipment orders (ASML, Applied Materials).",
        triggers: "SMH",
        fullThesis: "Musk announced Terafab (the largest chip fabrication facility ever) but hasn't disclosed the site. When announced, this triggers a wave of equipment orders: ASML EUV machines ($200M+ each), Applied Materials deposition tools, Lam Research etching, KLA metrology. A 20-building fab complex needs 50+ EUV machines. That's $10B+ in orders to a handful of companies. SMH captures the entire equipment chain. Site announcement expected late 2026.",
        keyFacts: [
          "Terafab capacity target: 100M chips/year",
          "Equipment cost per advanced fab: $20-30B",
          "EUV machines needed: 50+",
          "Construction timeline: 3-4 years",
          "Expected first production: 2030",
        ],
        whatWouldBreak: "Musk abandoning or delaying the project (possible given history).",
      },
      {
        title: "TSMC Arizona Phase 2",
        short: "2027 milestone — first advanced node fab on US soil.",
        triggers: "SMH, CHIPS-adjacent ETFs",
        fullThesis: "TSMC Arizona Phase 1 (N4 node) is operational. Phase 2 (N3) starts production 2027. Phase 3 (N2) announced for 2028. This is the first advanced node chip production on US soil — a structural shift for the semiconductor supply chain. Apple, Nvidia, AMD have all committed to buying Arizona-made chips. When Phase 2 comes online and proves yield is comparable to Taiwan, the market reprices US chip sovereignty. SMH captures the equipment and fabless winners.",
        keyFacts: [
          "Phase 1 (N4): operating since 2024",
          "Phase 2 (N3): 2027 target",
          "Phase 3 (N2): 2028 target",
          "Total investment: $65B",
          "US subsidies: $6.6B grant + $5B loan",
        ],
        whatWouldBreak: "Yield issues (N3 has been problematic). Workforce shortages.",
      },
    ],
  },
  {
    category: "Consensus shifts — the biggest alpha",
    categoryBadge: "narrative repricing",
    color: "#a855f7",
    intro: "Wall Street still treats AI as a software story — Nvidia, Microsoft, Alphabet. The industrial supply chain is under-analysed. When institutional capital rotates from 'AI stocks' to 'AI infrastructure', COPX / LIT / REMX reprice dramatically. This is Druckenmiller's favourite setup: when the narrative is wrong and the facts are right.",
    items: [
      {
        title: "Software → Infrastructure repricing",
        short: "When analysts model materials demand, not just Nvidia revenue.",
        triggers: "COPX, LIT, REMX, ICLN",
        fullThesis: "Sell-side equity research is 95% focused on software names (Nvidia, Microsoft, Alphabet, Meta). Materials and energy analysts cover these themes separately and without the AI framing. When bank research teams start integrating the two — modelling copper demand per GW of datacenter capacity, lithium per humanoid robot, rare earths per MW of wind power — the supply chain ETFs reprice. This has already started (Goldman, JPM published AI infrastructure reports in 2025) but institutional money hasn't fully rotated yet. The setup: wait for the bulge brackets to publish 'deep dives' on materials. That's the retail-to-institutional handoff.",
        keyFacts: [
          "Sell-side AI coverage: ~95% software",
          "Copper analysts rarely mention AI demand",
          "First major AI-materials report: Goldman Oct 2025",
          "Pension AI allocation: <1% of AUM",
          "COPX institutional ownership: ~35% (low)",
        ],
        whatWouldBreak: "AI hype completely deflating (unlikely — capex is real).",
      },
      {
        title: "Pension fund rotation",
        short: "Underweight commodities since 2010. Even a 2% rotation moves markets.",
        triggers: "COPX, LIT, REMX, GLD",
        fullThesis: "Pension funds globally are underweight commodities — typically 1-3% of AUM vs historical highs of 8-10%. This is a legacy of the 2010s when commodities underperformed during the secular bull market in tech. But pensions need inflation hedges and real assets as bond yields normalise. Even a 2% rotation from bonds/tech into commodities represents $500B+ of inflows to a small asset class. COPX (market cap ~$2B), LIT (~$3B), REMX (~$1B) are micro relative to that potential flow. When one large pension announces a 'commodity rotation' framework, the rest follow within months.",
        keyFacts: [
          "Global pension AUM: ~$55T",
          "Current commodity allocation: 1-3%",
          "Historical peak: 8-10% (2008)",
          "COPX market cap: ~$2B",
          "Even 0.1% rotation: $55B flow",
        ],
        whatWouldBreak: "Rate cut cycle reversing and bonds rallying sharply. Would delay rotation by 1-2 years.",
      },
      {
        title: "'AI bubble' → 'AI buildout' narrative",
        short: "Media framing shift. Moves retail capital into real assets.",
        triggers: "COPX, LIT, REMX, ICLN, BOTZ",
        fullThesis: "Media framing of AI is still mostly 'bubble' or 'hype' — focused on overvaluation concerns and regulatory risk. When the narrative shifts to 'infrastructure buildout' and 'industrial revolution' (the Verge-to-WSJ progression), retail capital follows. This is a slower catalyst but compounds the institutional shifts. Consumer ETF flows into BOTZ, AIQ, ICLN accelerate. Robinhood and Nordnet users pile in. The media shift typically lags institutional shifts by 6-12 months but lasts longer once it starts.",
        keyFacts: [
          "Search 'AI bubble': still trending higher",
          "Search 'AI infrastructure': growing 2x faster",
          "WSJ coverage: shifting from 'bubble' to 'buildout'",
          "Financial Times launched AI infrastructure vertical 2025",
          "Retail ETF flows: still dominated by SPY, QQQ",
        ],
        whatWouldBreak: "A major AI scandal or product failure that revives the bubble narrative.",
      },
    ],
  },
];

export default function HomePage() {
  const [us, setUs] = useState<RegimeData | null>(null);
  const [eu, setEu] = useState<RegimeData | null>(null);
  const [cn, setCn] = useState<RegimeData | null>(null);
  const [duration, setDuration] = useState<{ avg: number; min: number; max: number; periods: number } | null>(null);
  const [timing, setTiming] = useState<TimingETF[]>([]);
  const [timingLoading, setTimingLoading] = useState(true);
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);
  const [expandedCatalyst, setExpandedCatalyst] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setUs(d); }).catch(() => {});
    fetch(apiUrl("/api/eu/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setEu(d); }).catch(() => {});
    fetch(apiUrl("/api/china/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setCn(d); }).catch(() => {});
    fetch(apiUrl("/api/transition")).then((r) => r.json()).then((d) => { if (d.durationStats) setDuration(d.durationStats); }).catch(() => {});
    fetch("/api/terafab-timing").then((r) => r.json()).then((d) => { if (d.etfs) setTiming(d.etfs); }).catch(() => {}).finally(() => setTimingLoading(false));
  }, []);

  const regime = us?.regime || null;
  const regimeColor = regime ? REGIME_COLORS[regime] || "#888" : "#888";

  return (
    <main className="min-h-screen">
      <Nav />

      {/* ════════════════════════════════════════════
          WELCOME
      ════════════════════════════════════════════ */}

      <section className="px-4 pt-20 pb-12 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl text-[#e0e0e0] font-bold leading-tight mb-4">
          The AI Race is creating the next materials supercycle
        </h1>
        <p className="text-sm text-[#555] max-w-xl mx-auto mb-6">
          Every AI fab, robot factory, and datacenter needs chips, copper, lithium, and rare earths. The supply chain is investable today — and the current macro regime tells you exactly when to enter.
        </p>
        <SectionChat
          context="Welcome to Macro World View. The AI Race is creating the next materials supercycle — every AI fab, robot factory, and datacenter needs chips (SMH), robotics (BOTZ), copper (COPX), lithium (LIT), rare earths (REMX), energy (ICLN). The supply chain is investable today. Current macro regime affects entry timing: stagflation suppresses growth ETFs (buy now at discount), materials are inflated (wait for regime shift). The site covers the AI Race thesis, US/EU/China regime trackers, and the world order transition."
          label="Ask about this thesis"
          suggestions={["What is the AI Race supply chain?", "Which ETFs should I start with?", "How does the macro regime affect entry timing?"]}
        />
      </section>

      {/* Regime context */}
      {regime && (
        <section className="px-4 pb-8 max-w-4xl mx-auto">
          <div className="p-4 rounded-lg border" style={{ borderColor: regimeColor + "40", backgroundColor: regimeColor + "08" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-wider text-[#555]">Current macro regime</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: regimeColor, backgroundColor: regimeColor + "20" }}>
                {regime}
              </span>
              {duration && (
                <span className="text-[10px] text-[#555]">typically lasts {duration.avg} months (range {duration.min}–{duration.max})</span>
              )}
            </div>
            {us && eu && cn && (
              <div className="flex gap-2 mb-3">
                {[
                  { label: "US", r: us.regime },
                  { label: "EU", r: eu.regime },
                  { label: "CN", r: cn.regime },
                ].map((x) => {
                  const c = REGIME_COLORS[x.r] || "#555";
                  return (
                    <div key={x.label} className="flex-1 p-2 rounded text-center" style={{ backgroundColor: c + "15", border: `1px solid ${c}40` }}>
                      <div className="text-[10px] text-[#555]">{x.label}</div>
                      <div className="text-xs font-bold" style={{ color: c }}>{x.r}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-[#888] leading-relaxed">
              {regime === "Stagflation" && <>Stagflation suppresses growth stocks (AI, robotics) while inflating materials (copper, lithium). <span className="text-[#e0e0e0] font-bold">Growth ETFs are discounted right now</span> — the AI Race thesis hasn&apos;t changed, only the macro headwind. Buy growth now, add materials after the regime shifts.</>}
              {regime === "Goldilocks" && <>Goldilocks is the <span className="text-[#e0e0e0] font-bold">best regime for the AI Race</span> — low inflation + growth benefits tech and robotics directly. Spread across the full supply chain.</>}
              {regime === "Reflation" && <>Reflation lifts the <span className="text-[#e0e0e0] font-bold">entire AI Race supply chain</span> — both growth and materials benefit. Equal-weight across all layers.</>}
              {regime === "Deflation" && <>Deflation puts everything on sale. <span className="text-[#e0e0e0] font-bold">Best time to build your AI Race position</span> — buy aggressively across the full supply chain at deep discounts.</>}
            </p>
          </div>
        </section>
      )}

      <div className="border-t border-[#181818]" />

      {/* ════════════════════════════════════════════
          AI RACE — THE THESIS
      ════════════════════════════════════════════ */}

      {/* Pattern */}
      <section id="ai-race" className="px-4 pt-12 pb-4 max-w-5xl mx-auto">
        <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">The AI Race</h2>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Terafab → AI Chips → Robots → Materials Supercycle
        </p>
        <p className="text-xs text-[#555] max-w-2xl mb-4">
          The same person who proved the EV thesis (Tesla Gigafactory → lithium/copper supercycle) is now building the largest chip factory ever. The supply chain that feeds it is investable today.
        </p>
        <div className="p-3 rounded bg-[#111] border border-[#3b82f630]" style={{ backgroundColor: "#3b82f608" }}>
          <p className="text-xs text-[#888] leading-relaxed">
            <span className="text-[#3b82f6] font-bold">The pattern:</span> Musk announced the Gigafactory in 2014. Tesla stock was $10 — today it&apos;s $353 (35x). But the real story was the industry he created: every major automaker followed, and COPX went from $15 to $83 (5x) because ALL of them needed the same materials. Terafab is the same playbook. Musk is the first mover, but Google, Amazon, Meta, Samsung, and Intel are all building AI fabs and robots. The competitors don&apos;t dilute the thesis — they multiply it. Every new entrant needs chips, copper, lithium, and rare earths.
          </p>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Proven Playbook */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Proven Playbook</h2>
        <p className="text-xs text-[#555] mb-4">Musk doesn&apos;t need to win. He just needs to prove the market exists — the same way he did with EVs.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-[#111] border border-[#22c55e30]">
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">The EV precedent</div>
            <div className="space-y-1.5 text-xs text-[#888]">
              <p><span className="text-[#22c55e] font-bold">2014:</span> Musk announces Gigafactory. Skeptics say EVs are a niche.</p>
              <p><span className="text-[#22c55e] font-bold">2017:</span> VW, BMW, GM announce their own EV programs.</p>
              <p><span className="text-[#22c55e] font-bold">2020:</span> Every major automaker is building EVs. Industry &gt; Tesla.</p>
              <p><span className="text-[#22c55e] font-bold">Result:</span> Tesla stock 35x. But COPX 5x, lithium 5x — because <span className="text-[#e0e0e0]">all competitors needed the same materials.</span></p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#111] border border-[#3b82f630]">
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">The AI/Robot repeat</div>
            <div className="space-y-1.5 text-xs text-[#888]">
              <p><span className="text-[#3b82f6] font-bold">2026:</span> Musk announces Terafab. Skeptics say humanoid robots are years away.</p>
              <p><span className="text-[#3b82f6] font-bold">Already:</span> Google, Amazon, Figure AI, Apptronik, 1X all building robots.</p>
              <p><span className="text-[#3b82f6] font-bold">Already:</span> Samsung, Intel, TSMC all expanding chip fabs.</p>
              <p><span className="text-[#3b82f6] font-bold">Thesis:</span> The industry Musk catalyses will be <span className="text-[#e0e0e0]">10-100x the EV wave</span> — and they all need the same supply chain.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* ════════════════════════════════════════════
          WHEN TO ENTER
      ════════════════════════════════════════════ */}

      <section id="when-to-enter" className="px-4 py-8 max-w-5xl mx-auto scroll-mt-20">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">When to Enter</h2>
        <p className="text-xs text-[#555] mb-4">This is a 5-10 year thesis. The question isn&apos;t IF — it&apos;s HOW to build your position across the supply chain.</p>

        {timingLoading ? (
          <div className="text-xs text-[#555] py-8 text-center">Loading live market data...</div>
        ) : (() => {
          const usEtfs = timing.filter((t) => !t.isUcits);
          return (
            <>
              {/* Regime context */}
              {regime && (() => {
                const r = regime.toLowerCase();
                const isStagflation = r.includes("stagflation");
                const isDeflation = r.includes("deflation");
                const isGoldilocks = r.includes("goldilocks");
                const isReflation = r.includes("reflation");

                const materials = usEtfs.filter((e) => ["Copper & Wiring", "Lithium & Batteries", "Rare Earths"].includes(e.layer));
                const tech = usEtfs.filter((e) => ["AI Chips", "AI & Autonomous", "Autonomous Tech", "Robotics"].includes(e.layer));
                const matAvg = materials.length > 0 ? Math.round(materials.reduce((s, e) => s + e.ret1y, 0) / materials.length) : 0;
                const techAvg = tech.length > 0 ? Math.round(tech.reduce((s, e) => s + e.ret1y, 0) / tech.length) : 0;
                const rc = isStagflation ? "#ef4444" : isDeflation ? "#3b82f6" : isGoldilocks ? "#22c55e" : "#eab308";

                return (
                  <div className="p-4 rounded-lg bg-[#111] border mb-4" style={{ borderColor: rc + "30" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#555]">Current macro regime</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: rc, backgroundColor: rc + "20" }}>{regime}</span>
                      {duration && <span className="text-[10px] text-[#555] ml-auto">typically lasts {duration.avg} months (range {duration.min}–{duration.max})</span>}
                    </div>

                    {isStagflation && (
                      <div className="space-y-2">
                        <p className="text-xs text-[#888] leading-relaxed">
                          Stagflation is a <span className="text-[#e0e0e0] font-bold">tailwind for materials</span> and a <span className="text-[#e0e0e0] font-bold">headwind for growth/tech</span>:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-[#0a0a0a] border border-[#22c55e30]">
                            <div className="text-[10px] text-[#555]">Materials (COPX, LIT, REMX)</div>
                            <div className="text-sm font-bold text-[#22c55e]">+{matAvg}% avg</div>
                            <div className="text-[10px] text-[#888] mt-1">Running hot <span className="text-[#e0e0e0]">because of stagflation</span>.</div>
                          </div>
                          <div className="p-2 rounded bg-[#0a0a0a] border border-[#3b82f630]">
                            <div className="text-[10px] text-[#555]">Growth/Robotics (SMH, BOTZ, AIQ)</div>
                            <div className="text-sm font-bold text-[#3b82f6]">+{techAvg}% avg</div>
                            <div className="text-[10px] text-[#888] mt-1">Suppressed — <span className="text-[#e0e0e0]">this is the dip</span>.</div>
                          </div>
                        </div>
                        <div className="p-3 rounded border border-[#3b82f640]" style={{ backgroundColor: "#3b82f608" }}>
                          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Recommended two-phase entry</div>
                          <div className="space-y-2">
                            <div className="flex gap-3">
                              <span className="text-xs font-bold text-[#3b82f6] bg-[#3b82f620] w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span>
                              <div>
                                <div className="text-xs font-bold text-[#e0e0e0]">Now — Buy the growth laggards</div>
                                <p className="text-[10px] text-[#888] mt-0.5">Same structural demand, lower price. The macro is handing you a discount.</p>
                                <div className="flex gap-2 mt-1.5 flex-wrap">
                                  {tech.map((e) => <span key={e.ticker} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#3b82f620] text-[#3b82f6]">{e.ticker} ${e.price}</span>)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-xs font-bold text-[#e09030] bg-[#e0903020] w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span>
                              <div>
                                <div className="text-xs font-bold text-[#e0e0e0]">After regime shifts — Rebalance into materials</div>
                                <p className="text-[10px] text-[#888] mt-0.5">Materials shed their inflation premium (-15-20%). Add at a discount while growth surges.</p>
                                <div className="flex gap-2 mt-1.5 flex-wrap">
                                  {materials.map((e) => <span key={e.ticker} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e0903020] text-[#e09030]">{e.ticker} ${e.price}</span>)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {isGoldilocks && <p className="text-xs text-[#888]">Goldilocks is the <span className="text-[#e0e0e0]">best regime for tech/robotics</span>. Spread across the full supply chain.</p>}
                    {isReflation && <p className="text-xs text-[#888]">Reflation benefits the <span className="text-[#e0e0e0]">entire supply chain</span>. Equal-weight across all layers.</p>}
                    {isDeflation && <p className="text-xs text-[#888]">Deflation is the <span className="text-[#e0e0e0]">best time to build positions</span> at deep discounts across the full supply chain.</p>}
                  </div>
                );
              })()}

              {/* Growth vs Materials grid */}
              {(() => {
                const growthETFs = usEtfs.filter((e) => ["AI Chips", "AI & Autonomous", "Autonomous Tech", "Robotics"].includes(e.layer));
                const materialsETFs = usEtfs.filter((e) => ["Copper & Wiring", "Lithium & Batteries", "Rare Earths", "Energy & Power"].includes(e.layer));
                const growthAvg = growthETFs.length > 0 ? Math.round(growthETFs.reduce((s, e) => s + e.ret1y, 0) / growthETFs.length) : 0;
                const matAvgRet = materialsETFs.length > 0 ? Math.round(materialsETFs.reduce((s, e) => s + e.ret1y, 0) / materialsETFs.length) : 0;
                const EtfCard = ({ t }: { t: TimingETF }) => {
                  const retColor = t.ret1y > 20 ? "#22c55e" : t.ret1y > 0 ? "#888" : "#ef4444";
                  return (
                    <div className="p-2 rounded bg-[#0a0a0a] border text-center" style={{ borderColor: t.color + "30" }}>
                      <div className="text-xs font-bold text-[#e0e0e0]">{t.ticker}</div>
                      <div className="text-[10px] text-[#555]">{t.layer}</div>
                      <div className="text-[10px] font-bold mt-1" style={{ color: retColor }}>{t.ret1y >= 0 ? "+" : ""}{t.ret1y}% <span className="text-[#333]">1Y</span></div>
                      <div className="text-[10px] text-[#555] mt-0.5">${t.price}</div>
                    </div>
                  );
                };
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-[#111] border border-[#3b82f630]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] text-[#555] uppercase tracking-wider">Growth &amp; Tech</div>
                        <span className="text-[10px] font-bold text-[#3b82f6]">avg +{growthAvg}% 1Y</span>
                      </div>
                      <p className="text-[10px] text-[#888] mb-2">AI chips, robotics, autonomous systems. These lag in stagflation but surge when growth returns.</p>
                      <div className="grid grid-cols-2 gap-2">
                        {growthETFs.map((t) => <EtfCard key={t.ticker} t={t} />)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#111] border border-[#e0903030]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] text-[#555] uppercase tracking-wider">Materials &amp; Energy</div>
                        <span className="text-[10px] font-bold text-[#e09030]">avg +{matAvgRet}% 1Y</span>
                      </div>
                      <p className="text-[10px] text-[#888] mb-2">Copper, lithium, rare earths, energy. Inflation hedges — they run hot in stagflation.</p>
                      <div className="grid grid-cols-2 gap-2">
                        {materialsETFs.map((t) => <EtfCard key={t.ticker} t={t} />)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          );
        })()}

        <SectionChat
          context="AI Race entry strategy. In stagflation: buy growth/robotics ETFs (BOTZ, AIQ, ARKQ, SMH) at a regime-driven discount. After regime shifts: rebalance into materials (COPX, LIT, REMX, ICLN)."
          label="Ask about entry strategy"
          suggestions={["Why buy growth now instead of materials?", "How much should I allocate monthly?", "What if stagflation lasts longer than expected?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* ════════════════════════════════════════════
          FORWARD CATALYSTS — Druckenmiller lens
      ════════════════════════════════════════════ */}

      <section id="forward-catalysts" className="px-4 py-8 max-w-5xl mx-auto scroll-mt-20">
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-xl font-bold text-[#e0e0e0]">Forward Catalysts</h2>
          <span className="text-[10px] text-[#555] italic">— Druckenmiller lens</span>
        </div>
        <p className="text-xs text-[#555] mb-4 max-w-2xl">
          Stan Druckenmiller&apos;s rule: the market prices in what&apos;s known. Alpha comes from what <span className="text-[#e0e0e0]">will</span> become known but isn&apos;t yet. These are events and facts that are mathematically or politically certain but not yet in the price.
        </p>

        {/* 4 categories — data-driven with expandable cards */}
        <div className="space-y-3">
          {FORWARD_CATALYSTS.map((cat, idx) => (
            <div key={cat.category} className="p-4 rounded-lg bg-[#111] border" style={{ borderColor: cat.color + "30" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" style={{ color: cat.color, backgroundColor: cat.color + "20" }}>{idx + 1}</span>
                <span className="text-sm font-bold text-[#e0e0e0]">{cat.category}</span>
                <span className="text-[10px] text-[#555] ml-auto">{cat.categoryBadge}</span>
              </div>
              <p className="text-[10px] text-[#888] leading-relaxed mb-3">{cat.intro}</p>

              <div className={`grid gap-2 ${cat.items.length === 4 ? "grid-cols-1 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
                {cat.items.map((item) => {
                  const id = `${cat.category}-${item.title}`;
                  const isOpen = expandedCatalyst === id;
                  return (
                    <button
                      key={item.title}
                      onClick={() => setExpandedCatalyst(isOpen ? null : id)}
                      className="p-2 rounded bg-[#0a0a0a] border text-left transition-colors hover:bg-[#141414]"
                      style={{ borderColor: isOpen ? cat.color + "60" : "#1a1a1a" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold mb-0.5" style={{ color: cat.color }}>{item.title}</div>
                        <span className="text-[#555] text-[10px] leading-none">{isOpen ? "−" : "+"}</span>
                      </div>
                      <div className="text-[10px] text-[#555]">{item.short} <span className="text-[#e0e0e0]">Triggers: {item.triggers}</span></div>
                    </button>
                  );
                })}
              </div>

              {/* Expanded detail drawer */}
              {cat.items.map((item) => {
                const id = `${cat.category}-${item.title}`;
                if (expandedCatalyst !== id) return null;
                return (
                  <div key={`detail-${id}`} className="mt-3 p-3 rounded border" style={{ borderColor: cat.color + "40", backgroundColor: cat.color + "06" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold" style={{ color: cat.color }}>{item.title}</div>
                      <button onClick={() => setExpandedCatalyst(null)} className="text-[#555] text-xs hover:text-[#888]">close ×</button>
                    </div>

                    <p className="text-[11px] text-[#888] leading-relaxed mb-3">{item.fullThesis}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                        <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Key facts</div>
                        <ul className="space-y-1">
                          {item.keyFacts.map((f) => (
                            <li key={f} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                              <span style={{ color: cat.color }}>•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-2 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                        <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-1.5">What would break this</div>
                        <p className="text-[10px] text-[#888] leading-relaxed">{item.whatWouldBreak}</p>
                        <div className="mt-2 pt-2 border-t border-[#181818]">
                          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">How to position</div>
                          <div className="text-[10px] text-[#e0e0e0]">{item.triggers}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded bg-[#111] border border-[#222]">
          <p className="text-[10px] text-[#888] leading-relaxed">
            <span className="text-[#e0e0e0] font-bold">Druckenmiller&apos;s rule applied:</span> &quot;The best way to make money is to not lose money.&quot; These catalysts aren&apos;t trades — they&apos;re reasons the thesis keeps compounding even if timing is wrong. You don&apos;t need to predict which one hits first. You need to be positioned before any of them do.
          </p>
        </div>

        <SectionChat
          context="Forward Catalysts — Druckenmiller-style forward-looking analysis. Focuses on events that are certain but not yet priced in: copper/rare earth supply deficits locked in by mine timelines, policy escalations (chip export controls, rare earth restrictions, CHIPS Act 2.0), specific company catalysts (SpaceX IPO, Optimus scale, Terafab site), and consensus shifts (Wall Street still treats AI as software, not industrial). The alpha comes from being positioned before the narrative changes."
          label="Ask about forward catalysts"
          suggestions={["Which catalyst has the shortest timeline?", "How would I know when consensus is shifting?", "What would invalidate the copper deficit thesis?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* ════════════════════════════════════════════
          SUPPLY CHAIN DEEP DIVE
      ════════════════════════════════════════════ */}

      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Supply Chain — Layer by Layer</h2>
        <p className="text-xs text-[#555] mb-6">A deeper look at each layer. Click to expand for catalysts, parallels, and timing.</p>
        <div className="space-y-3">
          {SUPPLY_CHAIN.map((layer, i) => {
            const isOpen = expandedLayer === i;
            return (
              <div key={layer.layer} className="rounded-lg bg-[#111] border overflow-hidden" style={{ borderColor: layer.color + "30" }}>
                <button onClick={() => setExpandedLayer(isOpen ? null : i)} className="w-full p-4 text-left hover:bg-[#151515] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 rounded" style={{ backgroundColor: layer.color }} />
                      <div>
                        <span className="text-sm font-bold text-[#e0e0e0]">{layer.layer}</span>
                        <div className="flex gap-2 mt-1">
                          {layer.etfs.map((e) => (
                            <span key={e.ticker} className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: layer.color, backgroundColor: layer.color + "20" }}>
                              {e.ticker} {e.ucits !== "—" && `/ ${e.ucits}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[#555] text-sm">{isOpen ? "−" : "+"}</span>
                  </div>
                  <p className="text-xs text-[#888] leading-relaxed">{layer.description}</p>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: layer.color + "20" }}>
                    <div className="mt-4 mb-4">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">How to invest</div>
                      {layer.etfs.map((e) => (
                        <div key={e.ticker} className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a] mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-[#e0e0e0]">{e.ticker}</span>
                            {e.ucits !== "—" && <span className="text-[10px] text-[#555]">UCITS: {e.ucits}</span>}
                          </div>
                          <div className="text-[10px] text-[#555]">{e.name}</div>
                          <p className="text-[10px] text-[#888] mt-1">{e.why}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mb-4">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Catalysts &amp; Timeline</div>
                      {layer.catalysts.map((c) => (
                        <div key={c.event} className="flex gap-3 text-xs mb-1.5">
                          <span className="font-bold shrink-0 w-20" style={{ color: layer.color }}>{c.date}</span>
                          <span className="text-[#888]">{c.event}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818]">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Historical parallel</div>
                      <p className="text-[10px] text-[#888] leading-relaxed">{layer.parallel}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <SectionChat
          context="AI Race supply chain. 7 layers: AI & Autonomous (AIQ, BOTZ), AI Chips (SMH), Robotics (BOTZ, ROBO), Copper (COPX), Lithium (LIT), Rare Earths (REMX), Energy (ICLN). Each has specific catalysts and timelines."
          label="Ask about the supply chain"
          suggestions={["Which layer moves first?", "What's the lithium risk after the 2022 crash?", "Is rare earth supply a real bottleneck?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* ════════════════════════════════════════════
          WAR ACCELERATES TECHNOLOGY
      ════════════════════════════════════════════ */}

      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">War Accelerates Technology</h2>
        <p className="text-xs text-[#555] mb-4">Every major technological leap in history was funded by nations competing to survive. The AI Race is no different.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { era: "WW2", tech: "Jet engines, radar, nuclear", result: "Created the aerospace and energy industries" },
            { era: "Cold War", tech: "Internet, GPS, satellites", result: "Created the tech industry worth $10T+" },
            { era: "Space Race", tech: "Microchips, materials science", result: "Enabled the semiconductor revolution" },
            { era: "Now", tech: "AI, robots, autonomous systems", result: "Creating the next industrial revolution" },
          ].map((e) => (
            <div key={e.era} className="p-2 rounded-lg bg-[#111] border border-[#222]">
              <div className="text-xs font-bold text-[#e0e0e0] mb-1">{e.era}</div>
              <div className="text-[10px] text-[#888]">{e.tech}</div>
              <div className="text-[10px] text-[#555] mt-1">{e.result}</div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded bg-[#111] border border-[#3b82f630]" style={{ backgroundColor: "#3b82f608" }}>
          <p className="text-xs text-[#888] leading-relaxed">
            <span className="text-[#3b82f6] font-bold">Why this matters now:</span> The US ($52B CHIPS Act + Terafab), China (290k robots/year + chip independence push), and Europe (€43B Chips Act + ASML monopoly protection) are all pouring unprecedented money into AI and automation — not because it&apos;s profitable, but because <span className="text-[#e0e0e0]">falling behind is an existential threat</span>. Governments don&apos;t cut defence spending during a war, and they won&apos;t cut AI spending during the automation race. This makes the supply chain demand <span className="text-[#e0e0e0]">government-backed and recession-resistant</span> — even in stagflation, the spending continues.
          </p>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* ════════════════════════════════════════════
          REGIME TRACKERS — context for the thesis
      ════════════════════════════════════════════ */}

      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-[#e0e0e0] mb-1">Regime Trackers</h2>
        <p className="text-xs text-[#555] mb-4">The macro context that drives the AI Race entry timing.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { flag: "🇺🇸", label: "US", data: us, href: "/regimetracker" },
            { flag: "🇪🇺", label: "Europe", data: eu, href: "/europe" },
            { flag: "🇨🇳", label: "China", data: cn, href: "/china" },
            { flag: "🌐", label: "World Order", data: null, href: "/world-order" },
          ].map((r) => {
            const reg = r.data?.regime;
            const c = reg ? REGIME_COLORS[reg] || "#555" : "#555";
            return (
              <Link key={r.label} href={r.href} className="block">
                <div className="p-4 rounded-lg bg-[#111] border border-[#222] hover:bg-[#151515] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.flag}</span>
                    <span className="text-xs font-bold text-[#e0e0e0]">{r.label}</span>
                    {reg && <span className="text-xs font-bold px-1.5 py-0.5 rounded ml-auto" style={{ color: c, backgroundColor: c + "20" }}>{reg}</span>}
                    {!reg && <span className="text-[10px] text-[#555] ml-auto">→</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Subscribe */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <SubscribeForm
          title="The AI Race — Weekly"
          description="One email per week: new factory announcements, supply chain disruptions, ETF entry opportunities, and robotics milestones. What happened and does it change the plan."
          buttonLabel="Subscribe"
          source="home_ai_race"
          waitlistFeature="ai_race_weekly"
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#555]">Macro World View — Tracking the AI Race and the world order transition</p>
        <p className="text-xs text-[#333] mt-2 max-w-xl mx-auto">
          This website is for educational and informational purposes only. Nothing on this site constitutes personalised financial advice. Past performance does not guarantee future results.
        </p>
        <div className="flex gap-4 justify-center mt-3">
          <a href="/disclaimer" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Disclaimer</a>
          <a href="/terms" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Terms of Service</a>
        </div>
        <p className="text-xs text-[#555] mt-4">
          Built by Lucas Rodrigues — turning economic data into investment signals. <a href="https://www.linkedin.com/in/lucas-rodrigues-27a51b1a3/" target="_blank" rel="noopener noreferrer" className="hover:text-[#888] underline underline-offset-2">LinkedIn</a>
        </p>
      </footer>
    </main>
  );
}
