"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import SectionChat from "@/components/SectionChat";
import {
  countries, DETERMINANT_LABELS, DETERMINANT_KEYS, CAMP_COLORS, CAMP_LABELS,
  SIGNAL_COLORS, getOverallScore, getStrongestDeterminant, getWeakestDeterminant,
  type CountryData, type AllianceCamp,
} from "@/lib/worldOrderData";
import {
  ACCENT, dashboardIndicators, militaryCommitments, debtTimeline,
  bigCycleStages, dedollarisation, centralBankGold,
} from "@/lib/usOverextensionData";

// ── Line Chart (from US Overextension) ──
function LineChart({ data, xKey, yKey, label, color, thresholds }: {
  data: { [k: string]: number }[];
  xKey: string; yKey: string; label: string; color: string;
  thresholds?: { value: number; label: string; color: string }[];
}) {
  const w = 600, h = 200, px = 40, py = 20;
  const xs = data.map((d) => d[xKey]);
  const ys = data.map((d) => d[yKey]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys, ...(thresholds?.map((t) => t.value) || [])) * 0.9;
  const yMax = Math.max(...ys, ...(thresholds?.map((t) => t.value) || [])) * 1.05;
  const toX = (v: number) => px + ((v - xMin) / (xMax - xMin)) * (w - px * 2);
  const toY = (v: number) => py + (1 - (v - yMin) / (yMax - yMin)) * (h - py * 2);
  const points = data.map((d) => `${toX(d[xKey])},${toY(d[yKey])}`).join(" ");
  return (
    <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
      <div className="text-xs text-[#888] mb-2">{label}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {[0.25, 0.5, 0.75].map((pct) => {
          const y = py + pct * (h - py * 2);
          const val = yMax - pct * (yMax - yMin);
          return (<g key={pct}><line x1={px} y1={y} x2={w - px} y2={y} stroke="#1a1a1a" strokeWidth="0.5" /><text x={px - 4} y={y + 3} textAnchor="end" fill="#333" fontSize="8" fontFamily="monospace">{val > 1000 ? `${(val / 1000).toFixed(0)}k` : val > 100 ? val.toFixed(0) : val.toFixed(1)}</text></g>);
        })}
        {thresholds?.map((t) => (<g key={t.label}><line x1={px} y1={toY(t.value)} x2={w - px} y2={toY(t.value)} stroke={t.color} strokeWidth="0.5" strokeDasharray="4,4" /><text x={w - px + 4} y={toY(t.value) + 3} fill={t.color} fontSize="7" fontFamily="monospace">{t.label}</text></g>))}
        {data.filter((_, i) => i % 2 === 0).map((d) => (<text key={d[xKey]} x={toX(d[xKey])} y={h - 2} textAnchor="middle" fill="#333" fontSize="7" fontFamily="monospace">{d[xKey]}</text>))}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (<circle key={i} cx={toX(d[xKey])} cy={toY(d[yKey])} r="2.5" fill={color} />))}
      </svg>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { critical: "#ef4444", warning: "#eab308", watch: "#3b82f6", stable: "#22c55e" };
  return <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: colors[status] || "#555" }} />;
}

// ── Radar Chart (pure SVG) ──
function RadarChart({ scores, color }: { scores: Record<string, number>; color: string }) {
  const keys = DETERMINANT_KEYS;
  const n = keys.length;
  const cx = 160, cy = 160, maxR = 120;
  const angleStep = (2 * Math.PI) / n;

  function point(i: number, val: number) {
    const angle = angleStep * i - Math.PI / 2;
    const r = (val / 10) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const rings = [2, 4, 6, 8, 10];
  const dataPoints = keys.map((k, i) => point(i, scores[k] || 0));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[320px] mx-auto">
      {/* Grid rings */}
      {rings.map((v) => (
        <polygon
          key={v}
          points={keys.map((_, i) => { const p = point(i, v); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="#222" strokeWidth="0.5"
        />
      ))}
      {/* Axis lines */}
      {keys.map((_, i) => {
        const p = point(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1a1a1a" strokeWidth="0.5" />;
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill={color + "30"} stroke={color} strokeWidth="1.5" />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
      {/* Labels */}
      {keys.map((k, i) => {
        const p = point(i, 12.5);
        const anchor = p.x < cx - 10 ? "end" : p.x > cx + 10 ? "start" : "middle";
        return (
          <text key={k} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="central"
            fill="#555" fontSize="7" fontFamily="monospace"
          >
            {DETERMINANT_LABELS[k]}
          </text>
        );
      })}
    </svg>
  );
}

// ── Trend Arrow ──
function TrendArrow({ trend }: { trend: string }) {
  if (trend === "up") return <span className="text-[#22c55e]">↑</span>;
  if (trend === "down") return <span className="text-[#ef4444]">↓</span>;
  return <span className="text-[#555]">→</span>;
}

// ── Country Detail Panel ──
function CountryDetail({ country }: { country: CountryData }) {
  const color = CAMP_COLORS[country.allianceCamp];
  const overall = getOverallScore(country.scores);
  const sig = country.investment;

  // Group determinants into thematic categories
  const DETERMINANT_GROUPS: { label: string; keys: string[] }[] = [
    { label: "Economy", keys: ["economicOutput", "tradeShare", "debtLevels", "costCompetitiveness"] },
    { label: "Finance", keys: ["financialCenter", "reserveCurrency", "competitiveness"] },
    { label: "Power", keys: ["military", "alliances", "technology", "naturalResources"] },
    { label: "Society", keys: ["education", "infrastructure", "ruleOfLaw", "politicalCohesion", "wealthGaps", "characterValues", "leadershipQuality"] },
  ];

  return (
    <div className="border-t border-[#222] bg-[#0a0a0a] p-3">
      {/* Compact header: overall + theme groups */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-xl font-bold" style={{ color }}>{overall}</span>
        <span className="text-[10px] text-[#555]">/ 10 overall</span>
        <span className="text-[10px] text-[#555] ml-auto uppercase tracking-wider">18 determinants — grouped</span>
      </div>

      <div className="space-y-2">
        {DETERMINANT_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[9px] text-[#555] uppercase tracking-wider mb-1">{group.label}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {group.keys.map((k) => {
                const score = country.scores[k] || 0;
                const label = DETERMINANT_LABELS[k];
                return (
                  <div key={k} className="px-1.5 py-1 rounded bg-[#111] border border-[#1a1a1a]">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-[#888] truncate">{label}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
                        <TrendArrow trend={country.scoreTrends[k]} />
                      </div>
                    </div>
                    <div className="h-0.5 bg-[#181818] rounded overflow-hidden mt-0.5">
                      <div className="h-full rounded" style={{ width: `${score * 10}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Radar + evidence — both collapsible */}
      <details className="mt-3">
        <summary className="text-[10px] text-[#555] cursor-pointer hover:text-[#888] uppercase tracking-wider">View radar chart + evidence ↓</summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 flex flex-col items-center justify-center">
            <RadarChart scores={country.scores} color={color} />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {DETERMINANT_KEYS.map((k) => (
              <div key={k} className="p-1.5 rounded bg-[#111] border border-[#1a1a1a]">
                <div className="text-[10px] font-bold" style={{ color }}>{DETERMINANT_LABELS[k]}</div>
                <div className="text-[10px] text-[#888] leading-snug mt-0.5">{country.scoreEvidence[k]}</div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* Investment Implication */}
      <div className="mt-4 p-3 rounded-lg border border-[#222] bg-[#111]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs uppercase tracking-wider text-[#555]">Investment Signal</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ color: SIGNAL_COLORS[sig.signal], backgroundColor: SIGNAL_COLORS[sig.signal] + "20" }}
          >
            {sig.signal}
          </span>
        </div>
        <p className="text-xs text-[#888] mb-2">{sig.reasoning}</p>
        {sig.relatedAssets.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {sig.relatedAssets.map((a) => (
              <span key={a} className="text-xs px-2 py-0.5 rounded bg-[#181818] text-[#888]">{a}</span>
            ))}
          </div>
        )}
        <p className="text-[10px] text-[#333] mt-2 italic">
          AI-generated analysis for educational purposes only. Not personalised financial advice.
        </p>
      </div>
    </div>
  );
}

// ── Sort helpers ──
type SortKey = "name" | "camp" | "usAlign" | "cnAlign" | "stability" | "score";
type SortDir = "asc" | "desc";

function sortCountries(list: CountryData[], key: SortKey, dir: SortDir) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let va: number | string, vb: number | string;
    switch (key) {
      case "name": va = a.name; vb = b.name; break;
      case "camp": va = a.allianceCamp; vb = b.allianceCamp; break;
      case "usAlign": va = a.unAlignmentUS; vb = b.unAlignmentUS; break;
      case "cnAlign": va = a.unAlignmentChina; vb = b.unAlignmentChina; break;
      case "stability": va = a.stability; vb = b.stability; break;
      case "score": va = getOverallScore(a.scores); vb = getOverallScore(b.scores); break;
      default: va = a.name; vb = b.name;
    }
    if (typeof va === "string") return dir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return dir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });
  return sorted;
}

// ── Competitor drill-down data ──
const COMPETITORS = [
  {
    id: "us",
    flag: "🇺🇸",
    name: "United States",
    headline: "Terafab + CHIPS Act",
    oneLine: "$52B subsidies · Nvidia/Tesla lead",
    color: "#f97316",
    thesis: "The US is leveraging industrial policy to rebuild domestic chip and automation capacity after 40 years of offshoring. Bipartisan consensus on tech decoupling means government spending is structural, not cyclical. Musk's Terafab is the capstone announcement — but Intel, TSMC Arizona, Samsung Texas, and Micron NY are all part of the same reshoring wave.",
    strengths: [
      "Leading AI software + chip design (Nvidia, AMD, Broadcom)",
      "Capital markets depth for scaling companies",
      "CHIPS Act $52B committed + more in pipeline",
      "World-leading research (MIT, Stanford, Berkeley)",
      "Energy independence + abundant compute power",
    ],
    weaknesses: [
      "Manufacturing capacity hollowed out — depends on TSMC",
      "$36.2T national debt constrains future spending",
      "Rare earth + lithium processing nearly zero domestic",
      "Political polarisation threatens continuity of policy",
    ],
    keyBets: [
      "Terafab (Musk) — largest chip fab ever announced",
      "Intel Ohio fab — 2027 target",
      "TSMC Arizona — Phase 2 (N3) production 2027",
      "Micron NY — $100B megafab",
    ],
    aiRaceExposure: "SMH captures the equipment winners. US hyperscalers (via AIQ) dominate AI software. BOTZ/ARKQ for robotics. The supply chain ETFs benefit regardless of which specific US company wins.",
  },
  {
    id: "cn",
    flag: "🇨🇳",
    name: "China",
    headline: "#1 Robot Installer",
    oneLine: "60% rare earths · 290k robots/yr",
    color: "#ef4444",
    thesis: "China is racing to automate faster than demographic collapse. Working-age population peaked in 2015 and is shrinking 10M/year. The only way to maintain manufacturing dominance is aggressive industrial robot deployment. Beijing is also building chip independence (SMIC, Huawei) to bypass US export controls. The combination of demographic pressure + tech decoupling makes automation existential for China's economic model.",
    strengths: [
      "Installs more industrial robots than rest of world combined (290k/yr)",
      "Controls 60% of rare earth mining, 90% of processing",
      "Dominant in battery supply chain (CATL, BYD)",
      "Huawei/SMIC proving chip workaround capability",
      "Massive engineering workforce",
    ],
    weaknesses: [
      "Blocked from EUV lithography (ASML)",
      "Stuck at 7nm without major capex cycles",
      "Property crisis dragging consumer demand",
      "Demographic collapse accelerating",
      "VIE structure risk for foreign equity investors",
    ],
    keyBets: [
      "SMIC 7nm production scaling",
      "Humanoid robot programs (Unitree, Fourier)",
      "EV dominance (BYD now #1 globally)",
      "Rare earth processing monopoly as leverage",
    ],
    aiRaceExposure: "COPX and REMX benefit from Chinese demand regardless of political risk. BOTZ captures Japanese/European robotics sold INTO China. Avoid direct Chinese equity (KWEB, FXI) due to VIE structure — the demand is better captured through the supply chain.",
  },
  {
    id: "eu",
    flag: "🇪🇺",
    name: "Europe",
    headline: "ASML Monopoly",
    oneLine: "EUV lithography · €43B Chips Act",
    color: "#3b82f6",
    thesis: "Europe holds the single most important chokepoint in the AI & Robotics Race: ASML's EUV lithography machines. Every advanced chip in the world — Nvidia, TSMC, Samsung — requires ASML equipment. No substitute exists. Europe is also fast-tracking defence automation (€800B ReArm Europe) and building domestic chip capacity (€43B Chips Act). The autonomy push is government-funded and decade-long.",
    strengths: [
      "100% monopoly on EUV lithography (ASML)",
      "€43B Chips Act committed",
      "€800B ReArm Europe driving defence automation",
      "Strong industrial base (Siemens, ABB, Schneider)",
      "Leading clean energy deployment",
    ],
    weaknesses: [
      "Dependent on US for advanced AI models",
      "Fragmented capital markets",
      "Energy costs still elevated post-Ukraine",
      "Slow regulatory processes vs US/China",
      "Under US political pressure to limit China sales",
    ],
    keyBets: [
      "ASML — monopoly on EUV ($200M+ per machine)",
      "Rheinmetall + BAE — defence automation scaling",
      "Infineon + STMicro — automotive chip leaders",
      "Siemens + ABB — industrial automation giants",
    ],
    aiRaceExposure: "SMH is heavily weighted toward ASML (Europe's entry into the AI & Robotics Race). EUAD for defence automation. ICLN for the European energy buildout. Europe is the most direct play on the supply chain's bottleneck layer.",
  },
];

// ── Emerging Markets drill-down data ──
const EMERGING_MARKETS = [
  {
    id: "india",
    country: "India",
    flag: "🇮🇳",
    role: "The neutral chip alternative",
    short: "Non-aligned, English-speaking, 1.4B people. Building its own semiconductor fab ecosystem (Tata-PSMC Gujarat 2027). When US-China tensions force decoupling, India becomes the default for companies hedging both sides.",
    etfs: "INDA, EPI",
    color: "#f97316",
    fullThesis: "India is the only major economy that can scale chip manufacturing outside both US and Chinese spheres of influence. The Modi government has committed $10B in semiconductor subsidies. Tata Electronics broke ground on India's first advanced fab in partnership with PSMC (Taiwan) — expected operational by 2027. Apple already assembles iPhones in India (22% of production by 2025). The country is positioning as the default hedge for global tech supply chains.",
    keyCatalysts: [
      "Tata-PSMC Gujarat fab operational — 2027",
      "Apple India production share: 5% (2022) → 25% (2026)",
      "Micron ATMP facility (assembly/test/packaging) — 2026",
      "Foxconn-Vedanta semiconductor JV — in progress",
      "India Semiconductor Mission: $10B subsidies",
    ],
    risks: [
      "Fab execution risk — India has no advanced node experience",
      "Infrastructure gaps (power, water, logistics)",
      "Rupee volatility",
      "Modi succession politics",
    ],
    howToPosition: "INDA (MSCI India broad) for the overall growth story. EPI (WisdomTree India Earnings) for value tilt. Consider direct exposure to Indian IT services (Infosys, TCS) which benefit from the AI spend cycle.",
  },
  {
    id: "indonesia",
    country: "Indonesia",
    flag: "🇮🇩",
    role: "Nickel & battery metals",
    short: "Controls ~50% of global nickel reserves — critical for lithium-ion batteries and robot motors. Building downstream processing to capture more value. Every EV and humanoid robot needs Indonesian nickel.",
    etfs: "EIDO",
    color: "#22c55e",
    fullThesis: "Indonesia holds approximately 50% of global nickel reserves and is the world's largest producer (~1.8M tonnes/year). In 2020, Jakarta banned raw nickel exports to force downstream processing on shore — a bold industrial policy move that paid off. Chinese firms (Tsingshan, Huayou, CATL) poured $30B+ into Indonesian nickel processing and battery manufacturing. The country is moving from commodity exporter to integrated battery supply chain hub. Every Tesla battery, every Optimus robot, every EV contains Indonesian nickel.",
    keyCatalysts: [
      "Nickel ore export ban enforced since 2020",
      "$30B+ Chinese investment in downstream processing",
      "CATL battery plant Morowali — online 2025",
      "Ford Nickel JV (Vale, Huayou) — 2026 ramp",
      "World's 4th largest population — domestic EV market scaling",
    ],
    risks: [
      "Environmental concerns around deep-sea tailings",
      "Indonesian government policy reversal risk",
      "Over-dependence on Chinese offtake agreements",
      "Nickel price volatility (current low)",
    ],
    howToPosition: "EIDO (iShares MSCI Indonesia) for broad exposure. LIT captures the global lithium/nickel supply chain, including Indonesian-sourced material. Direct exposure via Vale (VALE) which has a major Indonesian nickel operation.",
  },
  {
    id: "brazil",
    country: "Brazil",
    flag: "🇧🇷",
    role: "Iron ore + agri + lithium",
    short: "Non-aligned swing state. Vale is the world's #2 iron ore producer. Sigma Lithium scaling production. China-aligned via BRICS+ but keeps US trade open.",
    etfs: "EWZ",
    color: "#eab308",
    fullThesis: "Brazil is the ultimate non-aligned commodity superpower. Vale produces 300M tonnes of iron ore annually (#2 globally). The country holds massive lithium reserves (Brazilian Lithium Triangle). Embraer is a global aerospace player. Agriculture dominance (soy, beef, coffee) provides stable cash flow. Brazil joined BRICS+ but maintains strong trade with the US and EU. Under Lula, Brazil is positioning as the honest broker between China and the West — a role that captures capital flows from both sides.",
    keyCatalysts: [
      "Sigma Lithium production ramp — 2025-2026",
      "BRICS+ New Development Bank expansion",
      "Vale SAR (Special Administrative Region) — iron ore export tax reform",
      "Petrobras pre-salt oil expansion",
      "Central bank holds 130 tonnes gold reserves",
    ],
    risks: [
      "Political volatility (Lula → next election cycle)",
      "Currency (BRL) volatility",
      "Commodity price cycles",
      "Amazon deforestation sanctions risk",
    ],
    howToPosition: "EWZ (iShares MSCI Brazil) for broad exposure. COPX captures copper miners including Vale. LIT captures lithium miners including Sigma. Direct exposure via Vale (VALE) and Petrobras (PBR) for commodity-specific plays.",
  },
  {
    id: "saudi",
    country: "Saudi Arabia",
    flag: "🇸🇦",
    role: "Oil wealth → AI infrastructure",
    short: "Vision 2030 is literally building AI datacenters in the desert (NEOM, Humain Project). $40B AI fund announced 2024. Saudi is converting oil wealth into AI/robotics capacity — and they're doing it with Chinese chips, bypassing US export controls.",
    etfs: "KSA",
    color: "#b45309",
    fullThesis: "Saudi Arabia is pivoting from oil to AI infrastructure faster than any major economy. The Public Investment Fund (PIF) committed $40B to an AI fund in 2024. The Humain Project (launched 2025) is building one of the world's largest AI compute clusters. NEOM includes dedicated AI R&D zones. Critically, Saudi is hedging US export controls by buying Chinese chips (Huawei Ascend) and negotiating with both Nvidia and Chinese alternatives. With $1T+ in PIF assets and zero debt constraints, Saudi can simply outspend competitors.",
    keyCatalysts: [
      "Humain Project — $100B+ AI compute buildout",
      "NEOM — $500B megaproject with AI zones",
      "PIF AI Fund — $40B committed 2024",
      "Nvidia + Cerebras partnerships for Saudi datacenters",
      "BRICS+ membership since 2024",
    ],
    risks: [
      "Oil price volatility (PIF funded by oil revenue)",
      "Succession risk (MBS is driving the vision)",
      "US export control pressure on Saudi-China tech ties",
      "Vision 2030 execution risk (NEOM delays)",
    ],
    howToPosition: "KSA (iShares MSCI Saudi Arabia) for broad exposure. Saudi Aramco for direct oil revenue. Infrastructure ETFs benefit from NEOM buildout. Note: Saudi market has lower liquidity than developed markets.",
  },
  {
    id: "vietnam",
    country: "Vietnam",
    flag: "🇻🇳",
    role: "The China+1 beneficiary",
    short: "Every US-China escalation pushes manufacturing to Vietnam. Samsung, Apple, Foxconn all expanding Vietnamese production. Rare earth deposits too — Vietnam has the second-largest reserves outside China.",
    etfs: "VNM",
    color: "#3b82f6",
    fullThesis: "Vietnam is the structural winner of US-China decoupling. Samsung produces 50%+ of its global smartphone output in Vietnam. Apple has shifted iPad and MacBook production to Vietnamese facilities. Foxconn is expanding aggressively. Critically, Vietnam holds the world's second-largest rare earth reserves (~22M tonnes vs China's 44M) — largely undeveloped but increasingly strategic. Vietnam's GDP has grown 6%+ annually for a decade on the back of manufacturing exports. Politically neutral, geographically perfect, demographically young (median age 32).",
    keyCatalysts: [
      "Samsung Vietnam: 50%+ of global smartphone production",
      "Apple iPad/MacBook assembly relocating from China",
      "Rare earth reserves: 22M tonnes (2nd globally)",
      "Upgraded to emerging market status by FTSE (pending MSCI)",
      "Bilateral trade agreements with EU, UK, CPTPP",
    ],
    risks: [
      "Manufacturing concentration in coastal provinces",
      "Wage inflation eroding cost advantage",
      "Dong currency volatility",
      "Rare earth development requires major capex cycle",
    ],
    howToPosition: "VNM (VanEck Vietnam) for broad exposure. Frontier market status means limited liquidity but outsized upside. Vietnam's manufacturing exposure is best captured via global supply chain ETFs (SMH) which include Vietnamese-listed Apple suppliers.",
  },
  {
    id: "mexico",
    country: "Mexico",
    flag: "🇲🇽",
    role: "Nearshoring + lithium",
    short: "USMCA gives tariff-free access to the US market. Auto and electronics supply chains relocating from China. Sonora lithium reserves (nationalised 2023). Every CHIPS Act and EV dollar creates Mexican jobs.",
    etfs: "EWW",
    color: "#a855f7",
    fullThesis: "Mexico is the direct beneficiary of US nearshoring. USMCA provides tariff-free access for goods with 75%+ North American content. As companies flee China, Mexico captures the manufacturing — especially autos, electronics, and medical devices. Tesla Gigafactory Monterrey (planned) would be the largest EV plant globally. Foxconn, Lenovo, and BMW have all announced Mexican expansions. Sonora state holds massive lithium reserves (partially nationalised in 2023 but foreign JVs allowed). Mexican manufacturing FDI hit $35B in 2023 — record levels.",
    keyCatalysts: [
      "Tesla Gigafactory Monterrey (paused but not cancelled)",
      "Foxconn, Lenovo, BMW expansion announcements",
      "Sonora lithium production ramp — 2026-2027",
      "USMCA renewal negotiations — 2026",
      "Mexican FDI record: $35B in 2023",
    ],
    risks: [
      "Sheinbaum government policy uncertainty",
      "Cartel security concerns affecting logistics",
      "Peso volatility during US election cycles",
      "USMCA renegotiation risk",
    ],
    howToPosition: "EWW (iShares MSCI Mexico) for broad exposure. Mexican industrial REITs (FIBRA Prologis) benefit from warehouse demand. Cemex (CX) for infrastructure buildout. Peso-denominated bonds for currency/yield exposure.",
  },
];

// ── US Overextension indicator drill-downs ──
const INDICATOR_DETAILS: Record<string, {
  fullContext: string;
  keyFacts: string[];
  historicalParallel: string;
  investmentImplication: string;
}> = {
  "Military Bases": {
    fullContext: "The US operates 750+ military installations in 80 countries, the largest overseas military footprint in history. By comparison, China has one overseas base (Djibouti) and Russia has three. The cost of maintaining this presence is ~$100-150B annually before accounting for active conflict operations. Dalio identifies military overextension as a key marker of imperial decline — every historical empire from Rome to Britain went through the same pattern: global military presence becomes unaffordable faster than it can be withdrawn.",
    keyFacts: [
      "750+ US bases in 80+ countries (Pentagon figures)",
      "Annual cost: $100-150B in peacetime operations",
      "China overseas bases: 1 (Djibouti)",
      "Russia overseas bases: 3 (Syria, Vietnam, Kyrgyzstan)",
      "Active presence in every major region globally",
    ],
    historicalParallel: "The Roman Empire at its peak had legions stationed from Britain to Mesopotamia. By the 3rd century, the cost of defending the borders consumed most state revenue. The empire split because it couldn't afford unified command.",
    investmentImplication: "Military overextension creates demand for defense automation (EUAD, ITA) as labour-intensive bases become unsustainable. It also accelerates de-dollarisation as occupied countries seek alternatives.",
  },
  "National Debt": {
    fullContext: "US federal debt reached $36.2T in 2024, up from $5.7T in 2000 — a 6x increase in 24 years. The debt is no longer growing from pandemic emergencies or wars alone — it's structural. CBO projects 166% debt/GDP by 2054. Interest payments on the debt exceeded defence spending for the first time in 2024 ($880B vs $874B). Each Fed rate hike increases the debt service burden geometrically.",
    keyFacts: [
      "Total federal debt: $36.2T (2024)",
      "Debt in 2000: $5.7T — a 6.35x increase",
      "Annual interest payments: $880B (2024)",
      "Defence spending: $874B — interest now exceeds",
      "CBO projection: 166% debt/GDP by 2054",
    ],
    historicalParallel: "The Dutch Republic's debt hit 250% of GDP during the Fourth Anglo-Dutch War (1780-84). Interest consumed 70% of tax revenue. Within 10 years, the guilder lost reserve status and Amsterdam lost its financial center role to London.",
    investmentImplication: "Unsustainable debt leads to currency debasement. Gold (GLD) is the historical hedge. TIPS and short-duration treasuries outperform long bonds as yields eventually rise. Real assets beat financial assets during debasement cycles.",
  },
  "Debt / GDP": {
    fullContext: "Debt-to-GDP ratio hit 125% in 2024, up from 55% in 2000. At 125%, the US is in territory previously reached only during WWII. The key difference: WWII debt fell rapidly after the war as GDP grew and spending normalized. Current debt is rising even in peacetime. The 80-100% threshold is what economists call the 'Reinhart-Rogoff zone' — where growth starts to meaningfully decelerate. 125% is past that.",
    keyFacts: [
      "Current debt/GDP: 125% (Q4 2024)",
      "Year 2000: 55%",
      "WWII peak: 121% (1946)",
      "Reinhart-Rogoff concern zone: 80-100%",
      "Japan (for context): 260% but almost all domestic-held",
    ],
    historicalParallel: "Post-WWII Britain hit 270% debt/GDP. The pound was devalued 30% in 1949 and again 14% in 1967. IMF bailout required in 1976. Reserve share fell from 64% to under 5% over 40 years.",
    investmentImplication: "High debt/GDP limits policy flexibility — the Fed can't fight inflation aggressively without crashing the debt service. This creates structural bias toward monetary accommodation, which is bullish for gold, hard assets, and commodities.",
  },
  "USD Reserve Share": {
    fullContext: "The USD's share of global central bank reserves has fallen from 72% in 2000 to 58% in 2024 — a steady 14-point decline. The replacement isn't one currency, but a basket: EUR, JPY, CNY, and notably gold (which hit record central bank purchases in 2023-2024). The shift accelerated after the 2022 freezing of Russian FX reserves, which spooked every non-aligned central bank into questioning USD safety.",
    keyFacts: [
      "Current USD reserve share: 58% (IMF COFER data)",
      "Year 2000: 72%",
      "Year 2008: 64%",
      "Central bank gold buying: 1,037 tonnes (2023, record)",
      "Yuan share: 2.3% (up from 0% in 2016)",
    ],
    historicalParallel: "The Dutch guilder lost reserve status over 40 years (1780-1820). The pound lost reserve status over 30 years (1914-1944). Both transitions were gradual in numbers but sudden in perception — the market moved before the institutions did.",
    investmentImplication: "De-dollarisation is the single strongest case for gold (GLD, SGLD.L). Central banks are the largest buyers. It also supports emerging market sovereign bonds, BRICS+ currencies, and anything that benefits from reduced USD dominance.",
  },
  "Active Theaters": {
    fullContext: "The US is currently committed to three simultaneous major theaters: Middle East (Iran/Hormuz), Europe (Ukraine, NATO forward presence), and Indo-Pacific (Taiwan/China deterrence). No dominant power in history has sustained three simultaneous major theaters without bankrupting itself. Britain tried in WWII (Europe + Pacific + North Africa) and ended the war bankrupt — which ended the empire. Dalio's rule: 3-front commitments force either consolidation or defeat.",
    keyFacts: [
      "Middle East: Active war (Iran, Hormuz enforcement)",
      "Europe: Ukraine support + NATO forward deployment",
      "Indo-Pacific: Taiwan deterrence + freedom of navigation",
      "Total annual cost of 3 theaters: ~$200-250B estimated",
      "Historical precedent: no empire has sustained 3 fronts",
    ],
    historicalParallel: "Britain in WWII fought Germany in Europe, Japan in Asia, and Italy in North Africa simultaneously. The war was won but the empire was bankrupted. Within 2 years of victory, Britain began dismantling the empire (India independence 1947, Palestine 1948, etc).",
    investmentImplication: "Multi-front commitments accelerate debt issuance. Accelerates the shift from USD to alternatives. Benefits defence stocks (EUAD for Europe, ITA for US) and commodities (oil, gold) which gain on geopolitical risk premium.",
  },
};

// ── Big Cycle stage drill-downs ──
const STAGE_DETAILS: Record<number, {
  context: string;
  keyEvents: string[];
  historicalParallel: string;
  investmentLens: string;
}> = {
  1: {
    context: "After WWII, the US emerged as the dominant global power. Bretton Woods (1944) established the dollar as the world's reserve currency, tied to gold at $35/oz. The US held 75% of global gold reserves. The Marshall Plan rebuilt Europe. The UN, IMF, World Bank were founded under US leadership. This is when the 'American Century' officially began — Dalio's Stage 1: the winner of the last conflict sets the rules for the next cycle.",
    keyEvents: [
      "1944: Bretton Woods conference — USD tied to gold",
      "1945: WWII ends — US controls 50% of world GDP",
      "1945: UN founded, US leads Security Council",
      "1947: Marshall Plan — $13B to rebuild Europe",
      "1949: NATO established — Western military alliance",
    ],
    historicalParallel: "1815: The Congress of Vienna established British dominance after Napoleon's defeat. 1648: Treaty of Westphalia established Dutch dominance after the Thirty Years' War. Every major cycle begins with a winner setting the rules.",
    investmentLens: "Stage 1 is the most prosperous investment era — new infrastructure, rebuilding, stable currency. Bonds yield well, equities compound, real assets appreciate. The losers: holders of the previous reserve currency (pound sterling fell 30% vs USD in this decade).",
  },
  2: {
    context: "The 1950s-1970s were the 'golden age' of the American century. GDP grew 4-5% annually. The middle class expanded dramatically. Interstate highways, space program, civil rights movement, mass consumerism. The dollar was strong, debt was low, productivity was high. Dalio identifies this as Stage 2: peace and prosperity — where capital compounds, education rises, and standards of living improve across the board.",
    keyEvents: [
      "1950s: GI Bill, suburban expansion, highway system",
      "1960s: Space race, civil rights, Apollo 11",
      "1964: Medicare/Medicaid established",
      "1965-75: Global productivity peak",
      "End of era: Nixon ends gold standard (1971)",
    ],
    historicalParallel: "Britain 1815-1870: the Pax Britannica. Europe stable, Britain dominant, industrial revolution compounding wealth. Ended with rising challengers (Germany, US). Every peace & prosperity stage ends when the losers of the last war catch up.",
    investmentLens: "Stage 2 is the best decade for equities and productivity growth. Long-duration bonds work. Real estate appreciates. Innovation and tech lead. But the end of Stage 2 is always masked by optimism — the 1960s looked like endless prosperity until the 1970s happened.",
  },
  3: {
    context: "The 1970s-2000s saw the US start to over-extend. Vietnam War debt forced Nixon off the gold standard (1971). Stagflation, oil crises, and rising Soviet power challenged the order. Reagan rebuilt military power (beating the USSR) but also tripled national debt. The US shifted from creditor to debtor nation. Financialisation replaced manufacturing. The 2000s brought tax cuts, two wars, and the biggest debt buildup since WWII. Dalio's Stage 3: excess and overextension — where the declining power stops being disciplined.",
    keyEvents: [
      "1971: Nixon ends gold standard",
      "1973: Oil crisis, stagflation",
      "1985: US becomes net debtor nation",
      "1991: Soviet Union collapses — sole superpower moment",
      "2001-08: Iraq + Afghanistan wars, housing bubble",
    ],
    historicalParallel: "Britain 1870-1914: high empire but financial leverage building. Germany catching up in industry. Britain still dominant but increasingly fragile. Dutch Republic 1650-1780 went through the same phase — still dominant but overextended.",
    investmentLens: "Stage 3 looks like continued prosperity but debt is compounding faster than GDP. Equities still work but volatility rises. Gold starts outperforming. Long bonds become risky. The key: wealth concentrates at the top, middle class gets squeezed — a marker of late Stage 3.",
  },
  4: {
    context: "2008-2020 was the financial crisis era. The 2008 Global Financial Crisis nearly collapsed the banking system. QE (money printing) began. Debt doubled as the Fed pumped $4T into markets. Wealth inequality exploded — asset owners benefited while workers' real wages stagnated. Social cohesion frayed (Tea Party, Occupy, 2016 populism, 2020 riots). Dalio identifies this as Stage 4: financial crisis and internal conflict. The empire is still dominant externally but cracking internally.",
    keyEvents: [
      "2008: Lehman collapses, $700B TARP bailout",
      "2009-14: QE1, QE2, QE3 — Fed balance sheet $900B → $4.5T",
      "2016: Brexit + Trump election (populist revolts)",
      "2020: COVID pandemic, $5T+ stimulus, riots",
      "2020: Debt/GDP crosses 125% (wartime levels)",
    ],
    historicalParallel: "Britain 1914-1945: WWI devastated finances, 1930s brought populism and Great Depression, WWII finished the empire despite 'winning'. France 1780-1789: financial crisis from American war debt, internal conflict, Revolution. Stage 4 always precedes Stage 5.",
    investmentLens: "Stage 4 is when gold starts to shine — central banks begin diversifying, debt monetization accelerates, traditional bonds stop working. Equities still rise in nominal terms but lose purchasing power. Hard assets (commodities, real estate) outperform financial assets.",
  },
  5: {
    context: "This is where we are now. 2020-present: Great Power Conflict. Ukraine war (2022), Iran-Hormuz crisis (2026), Taiwan tensions, chip export wars, BRICS+ expansion, rare earth weaponization. The US is fighting three active theaters. China is building a parallel order. Russia is at war with NATO via Ukraine. Alliances are fragmenting. Dalio's Stage 5 is the most dangerous phase — every historical transition has either ended in open war or grudging accommodation. No escape from Stage 5 is peaceful.",
    keyEvents: [
      "2022: Russia invades Ukraine — largest European war since WWII",
      "2022: US-China chip export controls begin",
      "2024: BRICS+ expands to include Saudi, UAE, Iran",
      "2026: Iran war, Hormuz closure",
      "Ongoing: Taiwan tensions, AUKUS submarines, defence buildups",
    ],
    historicalParallel: "1914-1918 (WWI): Stage 5 transitioned to open war between declining Britain and rising Germany. 1939-1945 (WWII): Second Stage 5 with Britain, US, USSR, Germany, Japan. 1775-1783: Stage 5 was the American Revolution — Britain couldn't hold its empire cheaply. Every Stage 5 ends in conflict of some form.",
    investmentLens: "Stage 5 is when gold goes parabolic — central banks are buyers, not speculators. Defence stocks (EUAD, ITA) lead. Commodities (COPX, LIT, REMX) benefit from military spending. The AI & Robotics Race supply chain is Stage 5 investing — governments will spend regardless of the economy because falling behind is existential.",
  },
  6: {
    context: "Stage 6 is the reset — where the new world order is established after the conflict. Who emerges dominant depends on: (1) who survives Stage 5 with their productive capacity intact, (2) who controls the critical resources, (3) who wins the hearts of the neutral bloc. The US might retain dominance in a diminished form. China might emerge as equal or superior. A multipolar world might stabilise. It's genuinely uncertain — Dalio's framework doesn't predict the outcome, only that a transition is happening.",
    keyEvents: [
      "Pending: end of current Stage 5 (unclear timing)",
      "Possible outcomes: negotiated settlement, cold war continuation, open conflict",
      "Key variables: Taiwan, Hormuz, Ukraine peace terms",
      "Capital flows: where do central bank reserves go?",
      "Technology leadership: who wins the AI & Robotics Race?",
    ],
    historicalParallel: "1945: Bretton Woods established the USD system. 1815: Congress of Vienna established the British system. 1648: Westphalia established the Dutch system. Each Stage 6 creates the rules for the next 80-100 years — the winners of Stage 5 write them.",
    investmentLens: "Stage 6 is when the biggest fortunes are made — being positioned for the NEW order before it's established. The AI & Robotics Race supply chain is this bet: the new industrial order will be built on AI and robotics, regardless of who wins politically. Materials, chips, and automation will be the foundation of whatever comes next.",
  },
};

// ── Alliance bloc drill-downs ──
const BLOC_DETAILS: Record<AllianceCamp, {
  context: string;
  keyDynamics: string[];
  historicalParallel: string;
  investmentImplication: string;
}> = {
  us_nato: {
    context: "The US-NATO bloc was the dominant Western alliance for 75 years. After the Ukraine invasion, NATO expanded (Finland, Sweden) and defence spending accelerated. But internal tensions are rising: Germany is under economic pressure from losing cheap Russian energy, the US is pushing European allies to pay more, and Japan is being pulled harder into the Indo-Pacific containment strategy. The alliance is still strong but less cohesive than during the Cold War — members increasingly pursue independent defence and industrial strategies.",
    keyDynamics: [
      "NATO 32 members after Finland (2023) and Sweden (2024) joined",
      "Germany: economic strain from energy transition, pivoting military spending",
      "Japan: doubling defence budget 2022-2027, closer US ties",
      "Norway: non-NATO energy exporter, benefits from all sides",
      "US pushing 2% → 2.5% GDP defence commitment",
    ],
    historicalParallel: "NATO's closest precedent is the Anglo-Japanese Alliance (1902-1923) — a treaty system that worked brilliantly for 20 years but couldn't adapt when the rising power (Japan) had different priorities than the declining power (Britain). Alliances work when interests align. They fray when they diverge.",
    investmentImplication: "US-aligned defence spending drives EUAD (European defence ETF — Rheinmetall, BAE, Leonardo) and ITA (US defence). German industrial automation (BOTZ holds Siemens) benefits from rebuilding. Norwegian energy (NHY, Equinor) benefits from European energy autonomy.",
  },
  neutral: {
    context: "The neutral bloc is the most important group in the current world order — they're the swing voters. India, Saudi Arabia, Turkey, Brazil, Indonesia, Mexico and other middle powers are actively playing both sides, extracting concessions from US and China. India buys Russian oil at a discount AND receives US semiconductor investment. Saudi Arabia joined BRICS+ but maintains US security guarantees. This group captures disproportionate value by refusing to commit. Most are members of BRICS+ even while maintaining Western economic ties.",
    keyDynamics: [
      "Saudi Arabia: joined BRICS+, accepts yuan for oil, still hosts US CENTCOM",
      "India: largest democracy, non-aligned, building domestic chip industry",
      "Turkey: NATO member that buys Russian S-400s, controls Bosphorus",
      "Brazil: BRICS+ founding member, keeps US trade open, commodity superpower",
      "Most neutral countries are trending 'more neutral' (not picking sides)",
    ],
    historicalParallel: "The Non-Aligned Movement during the Cold War (1961-1991) — India, Egypt, Yugoslavia, Indonesia — extracted massive development aid from both the US and Soviet Union by refusing to commit to either side. Today's neutral bloc is following the same playbook with better leverage (they control critical commodities, population, geography).",
    investmentImplication: "This is the group with the best risk-adjusted returns. INDA (India), EWZ (Brazil), EIDO (Indonesia), KSA (Saudi Arabia), EWW (Mexico), TUR (Turkey). Small allocations but structural upside. See the Emerging Markets section above for full country breakdowns.",
  },
  china_russia: {
    context: "The China-Russia bloc is a marriage of convenience between the rising challenger and the wounded former superpower. China provides economic lifeline, Russia provides commodities, energy, and a distraction from Chinese ambitions in Asia. The 'no-limits partnership' declared in 2022 hasn't produced a formal military alliance but has created economic interdependence. North Korea and Iran are adjacent members. The bloc is small but geographically enormous and controls critical commodities.",
    keyDynamics: [
      "China + Russia 'no-limits partnership' (Feb 2022)",
      "Russia: increasingly dependent on Chinese yuan + trade",
      "China: buying discounted Russian oil and gas",
      "Adjacent: North Korea, Iran, Belarus, Myanmar",
      "Bloc controls 25%+ of global landmass and energy",
    ],
    historicalParallel: "The Axis powers (Germany-Italy-Japan 1940-1945) were a similar marriage of convenience among revisionist powers. Each had distinct goals but shared an interest in overturning the existing order. The partnership lasted as long as they were winning — it didn't survive contact with setbacks.",
    investmentImplication: "Avoid direct exposure to this bloc's equities due to sanctions risk and VIE structure issues for Chinese stocks. Capture the commodity flow indirectly through global resource ETFs — COPX, REMX, LIT benefit from Russian and Chinese commodity production regardless of political risk. Gold (GLD) is the safest hedge against escalation.",
  },
};

// ── Financial Burden card drill-downs ──
const DEBT_CARD_DETAILS: Record<string, {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  context: string;
  keyFacts: string[];
  historicalParallel: string;
  investmentImplication: string;
}> = {
  national_debt: {
    title: "National Debt",
    value: "$36.2T",
    subtitle: "125% of GDP",
    color: "#f97316",
    context: "US federal debt reached $36.2T in 2024 — a 6x increase from $5.7T in 2000. This is no longer emergency debt from pandemics or wars. It's structural, compounding, and rising faster than GDP. The debt/GDP ratio of 125% puts the US in territory reached previously only during WWII. The difference: post-WWII debt fell rapidly as GDP grew and spending normalized. Current debt rises even in peacetime. Dalio's framework identifies this as the clearest marker of late-cycle empire — unsustainable debt accumulation without a mechanism for rapid repayment.",
    keyFacts: [
      "Total federal debt: $36.2T (2024)",
      "Year 2000: $5.7T — a 6.35x increase in 24 years",
      "Added ~$8T in the last 4 years alone (COVID + recovery + deficits)",
      "Deficit running at $1.8T/year (6% of GDP)",
      "No realistic path to balance under current law",
    ],
    historicalParallel: "The Dutch Republic hit 250% debt/GDP during the Fourth Anglo-Dutch War (1780-84). Interest consumed 70% of tax revenue. Within 10 years, the guilder lost reserve status. Amsterdam lost its financial center role to London.",
    investmentImplication: "Unsustainable debt leads to currency debasement. Gold (GLD, SGLD.L) is the historical hedge. Hard assets (COPX, commodities) beat financial assets. Short-duration bonds over long bonds as yields eventually rise.",
  },
  interest_defence: {
    title: "Interest vs Defence",
    value: "Interest wins",
    subtitle: "First time in 2024",
    color: "#ef4444",
    context: "In 2024, interest payments on the national debt exceeded defence spending for the first time ever. $880B in interest vs $874B in defence. This is Dalio's clearest late-cycle indicator: when servicing past debt costs more than maintaining the military, the empire has crossed into structural decline. Every Fed rate hike makes this ratio worse — the debt keeps rolling over at higher yields. At current trajectories, interest will consume 20%+ of federal revenue by 2030 — making it impossible to increase defence or entitlement spending without adding to the debt.",
    keyFacts: [
      "Interest payments 2024: $880B",
      "Defence spending 2024: $874B",
      "First time in US history interest > defence",
      "Projected interest 2030: $1.4T+ (20% of revenue)",
      "Average cost of debt rising as low-rate debt rolls off",
    ],
    historicalParallel: "The Ottoman Empire in the late 19th century had interest payments exceed 60% of state revenue by 1881, forcing the 'Ottoman Public Debt Administration' — European creditors took direct control of Ottoman finances. The empire didn't formally collapse until 1923 but lost financial sovereignty 40 years earlier.",
    investmentImplication: "Interest payments crowding out other spending creates pressure to monetize (inflate) the debt. This is the most bullish indicator for gold and real assets. Bearish for long-duration bonds. The Fed has less room to raise rates without crashing the debt service.",
  },
  usd_reserves: {
    title: "USD Reserves",
    value: "72% → 58%",
    subtitle: "Since 2000",
    color: "#3b82f6",
    context: "The USD's share of global central bank reserves has fallen from 72% (2000) to 58% (2024) — a 14-point decline over 24 years. The shift accelerated after 2022 when the US froze Russian FX reserves, spooking every non-aligned central bank. Central banks bought 1,037 tonnes of gold in 2023 — a record — and another 1,000+ tonnes in 2024. The replacement isn't one alternative currency, it's a basket: EUR, JPY, CNY, and especially gold. Dalio calls this the slow-then-sudden phase of reserve currency decline.",
    keyFacts: [
      "USD reserves 2000: 72% of global",
      "USD reserves 2024: 58%",
      "Decline rate: ~0.6% per year (accelerating)",
      "Central bank gold buying 2023: 1,037 tonnes (record)",
      "Yuan share: 0% (2016) → 2.3% (2024)",
    ],
    historicalParallel: "The Dutch guilder lost reserve status over 40 years (1780-1820). The pound lost reserve status over 30 years (1914-1944). Both declines looked slow for decades then suddenly accelerated — capital flight happens before institutions adjust.",
    investmentImplication: "Strongest structural case for gold (GLD, SGLD.L). Central banks are the largest buyers and they're buying with intent, not speculation. Also supports non-USD sovereign bonds and commodity-linked currencies (AUD, CAD, NOK).",
  },
  cbo_projection: {
    title: "CBO Projection",
    value: "166%",
    subtitle: "Debt/GDP by 2054",
    color: "#ef4444",
    context: "The Congressional Budget Office — a non-partisan government agency — projects US debt/GDP will reach 166% by 2054 under current law. This is CBO's base case, not a worst-case scenario. It assumes no new major spending programs, no recessions, no wars beyond current commitments. Even with those optimistic assumptions, the trajectory is unsustainable. Every analyst who has modelled US debt concludes that current policy is incompatible with current promises. Something has to give: taxes rise, spending falls, debt is monetized (inflation), or default.",
    keyFacts: [
      "CBO 2054 projection: 166% debt/GDP",
      "Current: 125% debt/GDP",
      "Annual deficit assumption: 6% of GDP average",
      "Excludes: new wars, recessions, major new programs",
      "Social Security trust fund depletion: 2035",
    ],
    historicalParallel: "Japan has been at 260%+ debt/GDP for over a decade without a crisis — BUT Japan's debt is 95% domestically held and the yen is not the world's reserve currency. The US doesn't have either of those advantages.",
    investmentImplication: "The CBO projection is a slow-motion warning. Markets usually price these risks at the inflection point, not in advance. Protects against the tail risk: gold, hard assets, diversification into non-USD assets (Nordic currencies, Swiss franc, emerging market bonds).",
  },
};

// ── Military commitment drill-downs ──
const COMMITMENT_DETAILS: Record<string, {
  context: string;
  keyFacts: string[];
  historicalParallel: string;
  investmentImplication: string;
}> = {
  "Middle East (Iran war)": {
    context: "The Middle East commitment escalated dramatically with the February 2026 Iran war and the US-enforced closure of the Strait of Hormuz. Active naval operations, carrier strike groups (USS Gerald R. Ford + 2 others), Central Command forces, missile defence systems, and continuous air operations. The commitment is open-ended — no exit strategy, no declared endpoint. Each month of operations adds to the cost and strain on naval assets.",
    keyFacts: [
      "3 carrier strike groups deployed to 5th Fleet AOR",
      "Annual run-rate: $25-35bn (conservative estimate)",
      "Hormuz transits: 6/day vs normal 138/day",
      "Oil premium: Brent at $100-110 (was $75 pre-war)",
      "Iran proxies active: Houthis (Red Sea), Hezbollah, Iraq militias",
    ],
    historicalParallel: "The Gulf War (1991) cost $61B in 1991 dollars (~$140B today) but was short and decisive — 43 days. Iraq (2003-2011) cost $2T over 8 years. Iran is geographically larger, more populous, and has real military capability. Open-ended operations historically average 10+ years.",
    investmentImplication: "Bullish for oil (XLE, IOGP), gold (GLD), defence (ITA, EUAD). Bearish for airlines, shipping (HACK), and European manufacturing dependent on Middle East oil. COPX benefits from copper demand for military electronics.",
  },
  "Ukraine support": {
    context: "US and European support for Ukraine has exceeded $200B cumulative since February 2022. Current annual run-rate is $30-40B in direct weapons, intelligence, and financial aid. The conflict has become a war of attrition — Russia can outproduce Western weapons on a monthly basis because Moscow put its economy on a war footing in 2023. Each year of continued support adds to the cumulative cost with no clear endpoint.",
    keyFacts: [
      "Cumulative US support: $175B+ since Feb 2022",
      "Annual run-rate: $30-40B (2024)",
      "EU contribution: matching roughly dollar-for-dollar",
      "Stocks depleted: Javelin, HIMARS, artillery shells",
      "Russian production pace: 3M shells/year (vs US/EU 2M)",
    ],
    historicalParallel: "Vietnam War cost the US $168B (~$1T today) over 12 years. The support was similarly open-ended and ended only when Congress cut funding. Ukraine hasn't reached that point yet — but Congressional fatigue is rising in 2024-2025.",
    investmentImplication: "Drives European defence spending (EUAD strongly bullish — Rheinmetall, BAE, Leonardo all at record backlogs). US defence stocks (ITA) benefit from weapon replenishment. Agricultural ETFs affected by Ukrainian grain exports.",
  },
  "Taiwan / Indo-Pacific": {
    context: "The Indo-Pacific commitment is the largest and most strategic — centred on Taiwan deterrence and freedom of navigation in the South China Sea. 7th Fleet (the largest US fleet) plus Marines on Okinawa, bases in Japan, South Korea, Philippines, and Guam. The commitment is less about active conflict and more about maintaining the balance of power that prevents Chinese territorial expansion. Every Chinese naval expansion triggers a US response, increasing the cost.",
    keyFacts: [
      "7th Fleet: 50-70 ships including 1-2 carriers",
      "Bases: Japan (54,000 troops), Korea (28,500), Guam, Philippines",
      "Annual cost: $15-20B (conservative, excludes black budget)",
      "Taiwan arms sales: $20B+ backlog",
      "AUKUS commitment: nuclear subs to Australia ($368B over 30 years)",
    ],
    historicalParallel: "The British maintained a similar 'balance of power' role in the Pacific before WWII. The strategy worked until Japan struck first in 1941. Maintaining deterrence requires unambiguous capability — any perceived US weakness invites Chinese testing.",
    investmentImplication: "Central to the AI & Robotics Race thesis — the Indo-Pacific competition IS the AI & Robotics Race in geopolitical form. SMH (chip supply chain), BOTZ (defence automation), EUAD (allied defence buildout) all benefit. Taiwan exposure (EWT) is high-risk/high-reward given Taiwan Strait tensions.",
  },
  "NATO Europe": {
    context: "NATO Article 5 obligations have been the cornerstone of US foreign policy since 1949. After the Ukraine invasion, NATO expanded to include Finland and Sweden, adding new borders with Russia. US forward-deployed forces in Europe grew from 65,000 (2020) to 100,000+ (2024). The annual cost is small in peacetime but would scale massively in any direct conflict with Russia.",
    keyFacts: [
      "100,000+ US troops in Europe (up from 65,000 in 2020)",
      "Annual cost: $20-25B direct",
      "32 member states since 2024 (Finland, Sweden added)",
      "NATO 2% GDP commitment: 23 of 32 now meeting target",
      "European defence spending: 1.5% → 2.5%+ trajectory",
    ],
    historicalParallel: "The 1950s NATO commitment was designed to contain a specific Soviet threat. When the Cold War ended, the commitment didn't scale down — it expanded. Alliance systems tend to outlive their original purpose and become self-perpetuating costs.",
    investmentImplication: "Drives EUAD (European defence ETF) directly — Rheinmetall, BAE, Leonardo, Thales, Saab all benefit from European defence spending. €800B ReArm Europe fund is a decade-long tailwind. EUAD is up 820% since 2022 and has more runway.",
  },
  "South Korea": {
    context: "The 28,500 US troops in South Korea date from the 1950-53 Korean War ceasefire (there's still no formal peace treaty). The commitment is the oldest continuous US military presence overseas. While the cost is relatively modest, it represents the template for indefinite alliances — a 75-year commitment that no administration has managed to wind down.",
    keyFacts: [
      "28,500 US troops stationed (down from 37,000 in 2008)",
      "Annual cost: $4-5B (South Korea pays $1B/year host nation support)",
      "Duration: 75 years (1950 — ongoing)",
      "DMZ patrol + deterrence mission",
      "No formal peace treaty with North Korea",
    ],
    historicalParallel: "The US kept troops in Germany from 1945 until the 1990s reunification (45 years). Japan is similar — 80 years of continuous presence. Once a commitment becomes 'normal', the political cost of withdrawing exceeds the economic cost of staying.",
    investmentImplication: "Small direct implication but symbolic. The 'cannot be withdrawn' nature of these commitments is what makes military overextension a structural (not cyclical) cost. Supports the thesis that defence spending only goes up.",
  },
};

// ── European positions drill-down data ──
const EU_POSITIONS = [
  {
    id: "euad",
    ticker: "EUAD",
    sector: "Defence",
    stat: "1.5→2.5% GDP",
    color: "#6b8e5a",
    note: "All regimes",
    fullThesis: "EUAD is the purest play on European defence autonomy. NATO Europe is committed to raising defence spending from 1.5% to 2.5%+ of GDP — a €800B multi-decade programme (ReArm Europe). The top holdings are Rheinmetall (ammunition, Leopard tanks), BAE Systems (UK defence giant), Leonardo (Italy), Thales (France), and Saab (Sweden). These companies have decade-long order books locked in by sovereign contracts. Unlike US defence stocks which are political footballs, European defence has cross-party support due to Ukraine and Hormuz.",
    catalysts: [
      "Rheinmetall 2030 capacity: 3x current ammo production",
      "ReArm Europe €800B fund deploying through 2030",
      "Ukraine reconstruction contracts ($500B+)",
      "European missile defence (European Sky Shield)",
      "NATO 2% → 2.5% → 3% trajectory locked in",
    ],
    risks: [
      "Ceasefire in Ukraine → temporary pullback",
      "Political shift in key member states",
      "Execution capacity constraints",
    ],
    aiRaceConnection: "Defence automation is the AI & Robotics Race in uniform. Modern weapons systems require AI targeting, autonomous drones, and robotic ammo production. Every defence dollar increasingly flows to chips, copper, rare earths, and lithium. EUAD captures this spend directly.",
  },
  {
    id: "iogp",
    ticker: "IOGP",
    sector: "Energy",
    stat: "40→8% RU gas",
    color: "#e09030",
    note: "Stagflation pick",
    fullThesis: "Europe's energy independence from Russia is a decade-long transition. Russian gas imports dropped from 40% of EU supply (2021) to 8% (2024). The replacement is LNG from the US, Norway, Qatar, and massive renewables buildout. IOGP (iShares STOXX Europe 600 Oil & Gas) captures European oil majors (Shell, BP, TotalEnergies, Eni, Equinor) — all of whom have repositioned as LNG hubs and clean energy operators. European energy ETFs outperformed the S&P since the Ukraine invasion because of this structural shift.",
    catalysts: [
      "LNG import capacity: 30% increase by 2026",
      "European North Sea wind: 300GW by 2050",
      "Hydrogen strategy: €180B committed",
      "Carbon pricing tightening (ETS reforms)",
      "Hormuz → European LNG premium",
    ],
    risks: [
      "Ukraine ceasefire → reduced risk premium",
      "EU Green Deal rollback (CDU, far-right)",
      "Norway export capacity ceiling",
    ],
    aiRaceConnection: "AI datacenters need baseload power. Europe is building it with a mix of nuclear (France), offshore wind (UK, Germany), and LNG (Netherlands, Spain hubs). European energy companies are positioning as hyperscaler power suppliers.",
  },
  {
    id: "asml",
    ticker: "ASML",
    sector: "Technology",
    stat: "100% EUV",
    color: "#3b82f6",
    note: "Single stock risk",
    fullThesis: "ASML is the most important company in the world that most people don't know exists. They make the EUV lithography machines required to produce any chip smaller than 7nm. Nvidia, TSMC, Samsung, Intel — all depend on ASML. The machines cost $200M+ each and require a decade of advance ordering. There is no competition. China is blocked from buying them (US export controls). ASML's backlog is €40B+ and growing. Single-stock risk is real but so is the monopoly moat.",
    catalysts: [
      "High-NA EUV machines: first commercial delivery 2026",
      "Backlog: €40B+ and growing",
      "Intel, TSMC, Samsung all placing advance orders",
      "CHIPS Act + EU Chips Act drive US/EU fab buildouts",
      "China export controls actually help ASML (no competition)",
    ],
    risks: [
      "US pressure to stop Dutch exports to China (China is 30% of revenue)",
      "Single-stock concentration risk",
      "Cyclical semiconductor downturns",
      "Next-gen lithography breakthroughs (unlikely 5+ years)",
    ],
    aiRaceConnection: "ASML is Europe's entry ticket into the AI & Robotics Race. Every AI chip goes through ASML machines. SMH (VanEck Semiconductor ETF) holds ~10% in ASML — the cleanest way to capture both US design leadership and European equipment dominance.",
  },
  {
    id: "nhy",
    ticker: "NHY",
    sector: "Materials",
    stat: "NOK listed",
    color: "#a855f7",
    note: "Stag + Reflation",
    fullThesis: "Norsk Hydro (NHY.OL) is Europe's largest aluminum producer and a sleeper AI & Robotics Race play. Aluminum is critical for datacenter cooling systems, chip packaging, and EV/robot structural components. NHY is also a leading renewable energy producer in Norway (hydro, wind) which powers its low-carbon aluminum. The company's 'green aluminum' commands a premium from tech buyers (Apple, Microsoft) that need to meet sustainability targets. Listed in Oslo in NOK — currency hedged exposure to commodities + European industrial production.",
    catalysts: [
      "Apple, Microsoft, Google premium green aluminum contracts",
      "Datacenter cooling aluminum demand (+40% by 2028)",
      "EU Critical Raw Materials Act prioritises aluminum",
      "Norway cheap hydro power advantage",
      "Aluminium price cycle recovery",
    ],
    risks: [
      "Aluminium commodity price volatility",
      "NOK currency exposure",
      "Energy cost pressure in European smelters",
      "Chinese aluminium oversupply",
    ],
    aiRaceConnection: "Overlooked AI & Robotics Race angle — every datacenter needs aluminum heat sinks and structural frames. Every humanoid robot uses aluminum. NHY has low-carbon aluminum pricing premium as tech companies hit scope 3 emissions targets. Niche but high-conviction European industrial play.",
  },
];

// ── China pillars drill-down data ──
const CHINA_PILLARS = [
  {
    id: "alliance",
    title: "Alliance Building",
    color: "#ef4444",
    short: "BRICS+ expanded to include Saudi Arabia, UAE, Egypt, Ethiopia, Iran. Belt and Road Initiative spans 140+ countries. Shanghai Cooperation Organisation provides military framework. China is building the institutional architecture of a parallel world order.",
    metric: "BRICS+ now represents 46% of world population",
    fullThesis: "China's alliance strategy is methodical and long-term. BRICS+ (joined by Saudi Arabia, UAE, Egypt, Ethiopia, Iran in 2024) now represents 46% of global population and 36% of GDP. The Belt and Road Initiative (BRI) has deployed $1T+ in infrastructure across 140+ countries, creating economic dependencies that translate to political influence. The Shanghai Cooperation Organisation (SCO) provides a military/security framework that's growing quietly. Unlike US alliances which are rigid treaty-based, China's alliances are transactional and expand organically through trade and infrastructure.",
    keyMetrics: [
      "BRICS+: 10 members, 46% of population, 36% of GDP",
      "BRI: 140+ countries, $1T+ investment",
      "SCO: 9 members including India, Russia, Iran",
      "China-Russia no-limits partnership (2022)",
      "Saudi-Iran détente brokered by China (2023)",
    ],
    watchFor: "Next BRICS+ expansion round. Argentina, Bolivia, Algeria considered. Any NATO-allied country joining BRI (currently Italy withdrew).",
    investmentImplication: "This builds a parallel trading system that uses less USD. Accelerates de-dollarisation thesis (GLD). Creates markets for Chinese goods that bypass Western restrictions.",
  },
  {
    id: "finance",
    title: "Financial Infrastructure",
    color: "#eab308",
    short: "CIPS processing $20T+ annually — a SWIFT alternative. Yuan share of global trade settlements at 4.7%, up from 1.9% in 2020. Bilateral currency swaps with 40+ countries. Digital yuan (e-CNY) piloted across 26 cities.",
    metric: "CIPS: $20T+ annual volume",
    fullThesis: "China is building a parallel financial system that bypasses the US-dominated SWIFT network. CIPS (Cross-Border Interbank Payment System) handled $20T+ in transactions in 2024 — still small vs SWIFT ($150T) but growing 40%+ annually. Yuan's share of global trade settlements has jumped from 1.9% (2020) to 4.7% (2024). The digital yuan (e-CNY) is piloted in 26 cities with real-time settlement capability. Bilateral currency swap lines with 40+ countries allow direct trade without USD conversion. The goal isn't to replace the dollar — it's to create enough optionality that China can't be economically isolated by US sanctions.",
    keyMetrics: [
      "CIPS annual volume: $20T (up from $3T in 2020)",
      "Yuan trade settlement: 4.7% (up from 1.9%)",
      "Currency swap lines: 40+ countries",
      "Digital yuan pilots: 26 cities, 300M users",
      "Central bank gold reserves: 2,264 tonnes (record high)",
    ],
    watchFor: "Saudi Arabia accepting yuan for oil (some already). BRICS common currency proposal (ongoing but stalled). Russia's CBR ban on USD transactions with Iran/North Korea.",
    investmentImplication: "Accelerates gold demand (GLD). Central banks diversifying from USD into gold. Chinese equity exposure risky (VIE structure) but the structural trend is real.",
  },
  {
    id: "tech",
    title: "Technology Self-Sufficiency",
    color: "#3b82f6",
    short: "US tech export restrictions forced domestic substitution — and it's working. Huawei's Kirin 9000s chip proved workaround capability. SMIC advancing to 7nm. China produces 80% of global solar panels, 60% of EVs, dominates battery supply chain.",
    metric: "80% of global solar panel production",
    fullThesis: "US export controls (Oct 2022, Oct 2023, multiple updates in 2024-2025) were designed to cripple China's chip industry. They've partially succeeded (blocked from EUV) but also accelerated domestic substitution. Huawei's Kirin 9000s (7nm, built without EUV) shocked the industry. SMIC is producing 7nm at commercial scale. China still can't do 5nm or below, but for most applications 7nm is sufficient. More importantly, China dominates the layers where physical manufacturing matters: 80% of global solar panels, 60% of EVs, 75% of lithium battery production. The US has chip design, China has chip manufacturing. Both are stuck with each other.",
    keyMetrics: [
      "Solar panels: 80% global production",
      "EVs: 60% global production (BYD #1 globally)",
      "Lithium batteries: 75% production, CATL dominant",
      "Huawei Kirin 9000s: 7nm without EUV",
      "SMIC 7nm production: at scale, 5nm attempted",
    ],
    watchFor: "SMIC advancing to 5nm. AI model releases (DeepSeek, Qwen) closing the gap with GPT-5. Next round of US export controls (expected every 6-9 months). Chinese EUV lithography research breakthroughs.",
    investmentImplication: "COPX, LIT, REMX benefit from Chinese manufacturing dominance (they process the raw materials China needs). BOTZ captures Western robotics sold into China. Avoid direct Chinese tech equity — structural risk.",
  },
  {
    id: "military",
    title: "Military Modernisation",
    color: "#22c55e",
    short: "Navy surpassed the US in total vessel count (370 vs 290). Hypersonic missiles deployed (DF-27). Third aircraft carrier (Fujian) with electromagnetic catapult. Nuclear arsenal expanding from ~350 to estimated 1,000+ warheads by 2030.",
    metric: "370 naval vessels (US: 290)",
    fullThesis: "China's military modernisation is the most consequential shift in the global balance of power in 50 years. The PLA Navy now has 370+ vessels vs the US Navy's 290 — though the US maintains a qualitative edge (tonnage, carrier air wings, submarine tech). China's third carrier (Fujian) has electromagnetic catapults rivaling the US Ford class. Hypersonic missiles (DF-27, DF-41) can hit US carriers from range. Nuclear arsenal is tripling from ~350 warheads to 1,000+ by 2030. Space station (Tiangong) is operational and growing. The Western Pacific is no longer uncontested US territory.",
    keyMetrics: [
      "Naval vessels: 370 (US: 290)",
      "Hypersonic missiles: DF-27, DF-41 deployed",
      "Aircraft carriers: 3 operational (Type 003 Fujian with EMALS)",
      "Nuclear warheads: 350 → 1,000+ by 2030",
      "Space station: Tiangong operational since 2021",
    ],
    watchFor: "Any Taiwan-related escalation. New Chinese base announcements in Pacific (Solomon Islands precedent). Hypersonic test intercepts. Nuclear arsenal milestones.",
    investmentImplication: "Defence automation beneficiaries (EUAD for European defence, BOTZ for industrial automation). Escalation risk benefits gold (GLD) and reduces valuations for China-exposed equities. US defence ETFs (ITA) also benefit from arms race.",
  },
];

// ── Main Page ──
export default function WorldOrderPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);
  const [expandedEM, setExpandedEM] = useState<string | null>(null);
  const [expandedChinaPillar, setExpandedChinaPillar] = useState<string | null>(null);
  const [expandedEUPosition, setExpandedEUPosition] = useState<string | null>(null);
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [expandedCommitment, setExpandedCommitment] = useState<string | null>(null);
  const [expandedDebtCard, setExpandedDebtCard] = useState<string | null>(null);
  const [expandedBloc, setExpandedBloc] = useState<AllianceCamp | null>(null);
  const [expandedRanking, setExpandedRanking] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = sortCountries(countries, sortKey, sortDir);
  const ranked = [...countries].sort((a, b) => getOverallScore(b.scores) - getOverallScore(a.scores));

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <main className="min-h-screen">
      <Nav />
      {/* Header */}
      <section className="px-4 pt-16 pb-8 max-w-5xl mx-auto text-center">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">World Order</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          The race to automate will decide who leads the next world order
        </p>
        <p className="text-sm text-[#555] max-w-lg mx-auto mb-6">
          Empires used to compete with armies and navies. Now they compete with chips, robots, and AI. Whoever automates production fastest — building the most advanced fabs, deploying the most robots, controlling the supply chain — wins. That&apos;s why the AI & Robotics Race is a geopolitical thesis, not just an investment one.
        </p>
      </section>

      {/* Three competitors */}
      <section className="px-4 py-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COMPETITORS.map((c) => {
            const isOpen = expandedCompetitor === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setExpandedCompetitor(isOpen ? null : c.id)}
                className="p-3 rounded-lg border text-center transition-colors hover:bg-[#151515]"
                style={{ borderColor: c.color + (isOpen ? "80" : "40"), backgroundColor: c.color + (isOpen ? "15" : "10") }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: c.color }}>{c.flag} {c.name}</span>
                  <span className="text-[#555] text-[10px] leading-none ml-1">{isOpen ? "−" : "+"}</span>
                </div>
                <div className="text-sm font-bold text-[#e0e0e0]">{c.headline}</div>
                <div className="text-[10px] text-[#555] mt-1">{c.oneLine}</div>
              </button>
            );
          })}
        </div>

        {/* Expanded drill-down drawer */}
        {COMPETITORS.map((c) => {
          if (expandedCompetitor !== c.id) return null;
          return (
            <div key={`detail-${c.id}`} className="mt-3 p-4 rounded-lg border" style={{ borderColor: c.color + "40", backgroundColor: c.color + "06" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.flag}</span>
                  <div>
                    <div className="text-sm font-bold text-[#e0e0e0]">{c.name} — {c.headline}</div>
                    <div className="text-[10px] text-[#555]">{c.oneLine}</div>
                  </div>
                </div>
                <button onClick={() => setExpandedCompetitor(null)} className="text-[#555] text-xs hover:text-[#888]">close ×</button>
              </div>

              <p className="text-xs text-[#888] leading-relaxed mb-4">{c.thesis}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] text-[#22c55e] uppercase tracking-wider mb-2">Strengths</div>
                  <ul className="space-y-1">
                    {c.strengths.map((s) => (
                      <li key={s} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span className="text-[#22c55e]">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-2">Weaknesses</div>
                  <ul className="space-y-1">
                    {c.weaknesses.map((w) => (
                      <li key={w} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span className="text-[#ef4444]">−</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a] mb-3">
                <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: c.color }}>Key bets to watch</div>
                <ul className="space-y-1">
                  {c.keyBets.map((b) => (
                    <li key={b} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                      <span style={{ color: c.color }}>•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded border" style={{ borderColor: c.color + "30", backgroundColor: c.color + "08" }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: c.color }}>How to capture this via the AI & Robotics Race supply chain</div>
                <p className="text-[10px] text-[#888] leading-relaxed">{c.aiRaceExposure}</p>
              </div>
            </div>
          );
        })}

        <div className="p-3 mt-3 rounded bg-[#111] border border-[#222]">
          <p className="text-[10px] text-[#888] leading-relaxed text-center">
            <span className="text-[#e0e0e0] font-bold">Why this matters for your portfolio:</span> Every nation pouring money into AI and robotics = structural demand for the same supply chain: chips (SMH), copper (COPX), lithium (LIT), rare earths (REMX). The geopolitical competition <span className="text-[#e0e0e0]">accelerates</span> the AI & Robotics Race thesis — governments are subsidising the demand.
          </p>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Alliance Tracker */}
      <section id="alliance-tracker" className="px-4 py-8 max-w-5xl mx-auto scroll-mt-20">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Which Side Is Each Country On?</h2>
        <p className="text-xs text-[#555] mb-4">Click any country to see its full power scorecard and investment signal.</p>

        {/* Visual summary — 3 blocs (clickable for detail) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {(["us_nato", "neutral", "china_russia"] as AllianceCamp[]).map((camp) => {
            const campCountries = sorted.filter((c) => c.allianceCamp === camp);
            const shifting = campCountries.filter((c) => c.stability !== "Stable");
            const isOpen = expandedBloc === camp;
            return (
              <button
                key={camp}
                onClick={() => setExpandedBloc(isOpen ? null : camp)}
                className="p-4 rounded-lg border text-left transition-colors hover:bg-[#151515]"
                style={{ borderColor: CAMP_COLORS[camp] + (isOpen ? "80" : "40"), backgroundColor: CAMP_COLORS[camp] + (isOpen ? "15" : "08") }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CAMP_COLORS[camp] }} />
                  <span className="text-sm font-bold text-[#e0e0e0]">{CAMP_LABELS[camp]}</span>
                  <span className="text-xs text-[#555] ml-auto">{campCountries.length} countries</span>
                  <span className="text-[#555] text-[10px] leading-none">{isOpen ? "−" : "+"}</span>
                </div>
                <div className="space-y-2">
                  {campCountries.map((c) => {
                    const sig = c.investment;
                    const isShifting = c.stability !== "Stable";
                    return (
                      <div key={c.code} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#e0e0e0]">{c.name}</span>
                          {isShifting && <span className="text-[10px] text-[#eab308]">⚡{c.trend.replace("Moving toward ", "→ ").replace(" bloc", "")}</span>}
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: SIGNAL_COLORS[sig.signal], backgroundColor: SIGNAL_COLORS[sig.signal] + "20" }}>
                          {sig.signal}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {shifting.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#222] text-[10px] text-[#eab308]">
                    {shifting.length} shifting — watch for realignment
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bloc drill-down drawer */}
        {expandedBloc && BLOC_DETAILS[expandedBloc] && (() => {
          const detail = BLOC_DETAILS[expandedBloc];
          const color = CAMP_COLORS[expandedBloc];
          return (
            <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: color + "40", backgroundColor: color + "06" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <div className="text-sm font-bold text-[#e0e0e0]">{CAMP_LABELS[expandedBloc]}</div>
                </div>
                <button onClick={() => setExpandedBloc(null)} className="text-[#555] text-xs hover:text-[#888]">close ×</button>
              </div>

              <p className="text-xs text-[#888] leading-relaxed mb-4">{detail.context}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color }}>Key dynamics</div>
                  <ul className="space-y-1">
                    {detail.keyDynamics.map((d) => (
                      <li key={d} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span style={{ color }}>•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Historical parallel</div>
                  <p className="text-[10px] text-[#888] leading-relaxed">{detail.historicalParallel}</p>
                </div>
              </div>

              <div className="p-3 rounded border" style={{ borderColor: color + "30", backgroundColor: color + "08" }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color }}>Investment implication</div>
                <p className="text-[10px] text-[#888] leading-relaxed">{detail.investmentImplication}</p>
              </div>
            </div>
          );
        })()}

        {/* Key insight */}
        {(() => {
          const shifting = sorted.filter((c) => c.stability !== "Stable");
          return shifting.length > 0 && (
            <div className="p-3 rounded bg-[#eab30810] border border-[#eab30830] mb-6">
              <p className="text-xs text-[#eab308] font-bold mb-1">{shifting.length} countries are actively shifting alignment</p>
              <p className="text-xs text-[#888]">
                {shifting.map((c) => `${c.name} (${c.trend})`).join(" · ")}
              </p>
            </div>
          );
        })()}

        {/* Detailed table — expandable */}
        <details className="mb-4">
          <summary className="text-xs text-[#555] cursor-pointer hover:text-[#888] mb-4">View detailed alliance data table ↓</summary>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#555] uppercase tracking-wider border-b border-[#222]">
                <th className="text-left py-2 pr-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("name")}>
                  Country{arrow("name")}
                </th>
                <th className="text-center py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("camp")}>
                  Camp{arrow("camp")}
                </th>
                <th className="text-right py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("usAlign")}>
                  US%{arrow("usAlign")}
                </th>
                <th className="text-right py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("cnAlign")}>
                  CN%{arrow("cnAlign")}
                </th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Trade Partner</th>
                <th className="text-center py-2 px-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("stability")}>
                  Stability{arrow("stability")}
                </th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Trend</th>
                <th className="text-right py-2 pl-2 cursor-pointer hover:text-[#888]" onClick={() => toggleSort("score")}>
                  Score{arrow("score")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.flatMap((c) => {
                const color = CAMP_COLORS[c.allianceCamp];
                const isExpanded = expanded === c.code;
                const score = getOverallScore(c.scores);
                const rows = [
                  <tr
                    key={c.code}
                    className="border-b border-[#181818] hover:bg-[#111] cursor-pointer transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : c.code)}
                  >
                    <td className="py-3 pr-2">
                      <span className="font-bold text-[#e0e0e0]">{c.name}</span>
                      <span className="text-[#333] ml-1">{isExpanded ? "▲" : "▼"}</span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ color, backgroundColor: color + "20" }}>
                        {CAMP_LABELS[c.allianceCamp]}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 text-[#3b82f6]">{c.unAlignmentUS}%</td>
                    <td className="text-right py-3 px-2 text-[#ef4444]">{c.unAlignmentChina}%</td>
                    <td className="py-3 px-2 text-[#555] hidden sm:table-cell">{c.primaryTradePartner}</td>
                    <td className="text-center py-3 px-2">
                      <span className={c.stability === "Stable" ? "text-[#22c55e]" : c.stability === "Volatile" ? "text-[#ef4444]" : "text-[#eab308]"}>
                        {c.stability}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-[#555] hidden sm:table-cell text-[10px]">{c.trend}</td>
                    <td className="text-right py-3 pl-2 font-bold" style={{ color }}>{score}</td>
                  </tr>,
                ];
                if (isExpanded) {
                  rows.push(
                    <tr key={c.code + "-detail"}>
                      <td colSpan={8}>
                        <CountryDetail country={c} />
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>
        </details>
        <SectionChat
          context="Alliance tracker showing 10 countries classified as US-aligned, China-aligned, or Non-aligned/Swing. Visual bloc summary shows investment signals per country and which ones are actively shifting alignment."
          label="Ask about alliances"
          suggestions={["Which countries are shifting alignment?", "How does Hormuz affect alliance positions?", "What determines a swing state?"]}
        />
        <div className="mt-4 space-y-2">
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Historical parallel:</span> Before WWI, the Ottoman Empire switched from British to German alignment (1914). Within 4 years, the entire Middle Eastern map was redrawn. Alliance shifts precede territorial changes by years.
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Historical parallel:</span> Saudi Arabia&apos;s 1973 oil embargo against the US — a key ally shifting leverage — crashed markets 45% and ended the post-war economic order. Today Saudi joined BRICS+ and accepts yuan for oil.
          </div>
        </div>
      </section>

      {/* Emerging Markets — positioned for the AI & Robotics Race */}
      <section id="emerging-markets" className="px-4 py-8 max-w-5xl mx-auto scroll-mt-20">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Emerging Markets in the AI & Robotics Race</h2>
        <p className="text-xs text-[#555] mb-4 max-w-2xl">
          The world order shift isn&apos;t just US vs China — it creates winners among countries that sit on the right resources or geography. Each of these nations holds a specific piece of the AI & Robotics Race supply chain that becomes more valuable as the established powers compete.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {EMERGING_MARKETS.map((em) => {
            const isOpen = expandedEM === em.id;
            return (
              <button
                key={em.id}
                onClick={() => setExpandedEM(isOpen ? null : em.id)}
                className="p-4 rounded-lg bg-[#111] border text-left transition-colors hover:bg-[#151515]"
                style={{ borderColor: em.color + (isOpen ? "60" : "30") }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{em.flag}</span>
                  <div>
                    <div className="text-sm font-bold text-[#e0e0e0]">{em.country}</div>
                    <div className="text-[10px] font-bold" style={{ color: em.color }}>{em.role}</div>
                  </div>
                  <span className="text-[10px] font-bold ml-auto px-1.5 py-0.5 rounded" style={{ color: em.color, backgroundColor: em.color + "20" }}>
                    {em.etfs}
                  </span>
                  <span className="text-[#555] text-[10px] leading-none">{isOpen ? "−" : "+"}</span>
                </div>
                <p className="text-[10px] text-[#888] leading-relaxed">{em.short}</p>
              </button>
            );
          })}
        </div>

        {/* EM Expanded drill-down */}
        {EMERGING_MARKETS.map((em) => {
          if (expandedEM !== em.id) return null;
          return (
            <div key={`em-detail-${em.id}`} className="mb-4 p-4 rounded-lg border" style={{ borderColor: em.color + "40", backgroundColor: em.color + "06" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{em.flag}</span>
                  <div>
                    <div className="text-sm font-bold text-[#e0e0e0]">{em.country} — {em.role}</div>
                    <div className="text-[10px] text-[#555]">{em.etfs}</div>
                  </div>
                </div>
                <button onClick={() => setExpandedEM(null)} className="text-[#555] text-xs hover:text-[#888]">close ×</button>
              </div>

              <p className="text-xs text-[#888] leading-relaxed mb-4">{em.fullThesis}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: em.color }}>Key catalysts</div>
                  <ul className="space-y-1">
                    {em.keyCatalysts.map((c) => (
                      <li key={c} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span style={{ color: em.color }}>•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-2">Risks</div>
                  <ul className="space-y-1">
                    {em.risks.map((r) => (
                      <li key={r} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span className="text-[#ef4444]">−</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded border" style={{ borderColor: em.color + "30", backgroundColor: em.color + "08" }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: em.color }}>How to position</div>
                <p className="text-[10px] text-[#888] leading-relaxed">{em.howToPosition}</p>
              </div>
            </div>
          );
        })}

        {/* The 3 EM meta-themes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#22c55e" }}>
            <div className="text-xs font-bold text-[#22c55e] uppercase tracking-wider mb-2">Non-Alignment Premium</div>
            <p className="text-[10px] text-[#888] leading-relaxed">Countries refusing to choose sides trade with both powers and extract concessions from both. India buys Russian oil at $30 discount AND receives US semiconductor investment.</p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#eab308" }}>
            <div className="text-xs font-bold text-[#eab308] uppercase tracking-wider mb-2">Supply Chain Rerouting</div>
            <p className="text-[10px] text-[#888] leading-relaxed">US-China decoupling reroutes global supply chains through neutral countries. Apple → India. Tesla → Mexico. EU → Morocco. This is structural, not cyclical.</p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#ef4444" }}>
            <div className="text-xs font-bold text-[#ef4444] uppercase tracking-wider mb-2">Commodity Leverage</div>
            <p className="text-[10px] text-[#888] leading-relaxed">Energy transition + Hormuz crisis give commodity-rich EMs unprecedented pricing power. Indonesia (nickel), Brazil (iron ore), Saudi (oil) can name their terms.</p>
          </div>
        </div>

        {/* Historical parallels */}
        <div className="space-y-2 mb-4">
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Switzerland (1914-1945):</span> Neutral during both World Wars. Swiss banks held gold for all sides. The Swiss franc became a safe haven currency. GDP per capita surpassed all combatant nations by 1950. Neutrality was the most profitable strategy.
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Asian Tigers (1950-1990):</span> South Korea, Taiwan, Singapore, and Hong Kong exploited Cold War competition for investment from both blocs. US poured capital into Asian allies to counter communism. Annual GDP growth averaged 8%+ for three decades. Today&apos;s swing states are positioned for the same dynamic.
          </div>
        </div>

        <div className="p-3 rounded bg-[#111] border border-[#222]">
          <p className="text-[10px] text-[#888] leading-relaxed">
            <span className="text-[#e0e0e0] font-bold">How to think about these:</span> These aren&apos;t core positions — they&apos;re optionality. The core AI & Robotics Race thesis is supply chain ETFs (SMH, BOTZ, COPX, LIT, REMX) which capture the demand from all competitors. Emerging market ETFs are a way to bet on specific countries that host the resources or manufacturing capacity as the world order reshuffles. Small allocations, long horizons, and only the countries with durable structural advantages.
          </p>
        </div>

        <SectionChat
          context="Emerging Markets positioned for the AI & Robotics Race: India (neutral chip alternative), Indonesia (nickel/battery metals), Brazil (iron ore and lithium), Saudi Arabia (oil-to-AI conversion via Vision 2030), Vietnam (China+1 manufacturing beneficiary), Mexico (nearshoring via USMCA). Each holds a specific piece of the AI & Robotics Race supply chain that becomes more valuable as US-China competition intensifies. Three meta-themes: Non-alignment premium, supply chain rerouting, commodity leverage. Historical parallels: Switzerland in WWI/WWII, Asian Tigers during Cold War."
          label="Ask about emerging market positioning"
          suggestions={["Which EM has the strongest AI & Robotics Race exposure?", "How do I size EM positions vs supply chain ETFs?", "Is India a better bet than Vietnam for chip manufacturing?"]}
        />
      </section>

      {/* Power Rankings — compact */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Global Power Rankings</h2>
        <p className="text-xs text-[#555] mb-4">Dalio&apos;s 18 determinants — who leads, who&apos;s closing the gap</p>

        {/* Top 3 highlighted — clickable */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {ranked.slice(0, 3).map((c, i) => {
            const score = getOverallScore(c.scores);
            const color = CAMP_COLORS[c.allianceCamp];
            const isOpen = expandedRanking === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setExpandedRanking(isOpen ? null : c.code)}
                className="p-3 rounded-lg border text-center transition-colors hover:bg-[#151515]"
                style={{ borderColor: color + (isOpen ? "80" : "40"), backgroundColor: color + (isOpen ? "15" : "08") }}
              >
                <div className="flex items-center justify-center gap-1">
                  <div className="text-xs text-[#555]">#{i + 1}</div>
                  <span className="text-[#555] text-[10px] leading-none">{isOpen ? "−" : "+"}</span>
                </div>
                <div className="text-lg font-bold text-[#e0e0e0]">{c.name}</div>
                <div className="text-2xl font-bold mt-1" style={{ color }}>{score}</div>
                <div className="text-[10px] text-[#555] mt-1">Best: {getStrongestDeterminant(c.scores)}</div>
                <div className="text-[10px] text-[#555]">Weak: {getWeakestDeterminant(c.scores)}</div>
              </button>
            );
          })}
        </div>

        {/* Compact list for rest — clickable */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {ranked.slice(3).map((c, i) => {
            const score = getOverallScore(c.scores);
            const color = CAMP_COLORS[c.allianceCamp];
            const isOpen = expandedRanking === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setExpandedRanking(isOpen ? null : c.code)}
                className="flex items-center gap-2 p-2 rounded bg-[#111] border text-left transition-colors hover:bg-[#151515]"
                style={{ borderColor: isOpen ? color + "60" : "#222" }}
              >
                <span className="text-xs text-[#333]">#{i + 4}</span>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-bold text-[#e0e0e0] flex-1">{c.name}</span>
                <span className="text-xs font-bold" style={{ color }}>{score}</span>
                <span className="text-[#555] text-[10px] leading-none">{isOpen ? "−" : "+"}</span>
              </button>
            );
          })}
        </div>

        {/* Expanded country detail drawer */}
        {expandedRanking && (() => {
          const country = ranked.find((c) => c.code === expandedRanking);
          if (!country) return null;
          const color = CAMP_COLORS[country.allianceCamp];
          return (
            <div className="mb-4 rounded-lg border overflow-hidden" style={{ borderColor: color + "40" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: color + "10" }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#e0e0e0]">{country.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color, backgroundColor: color + "20" }}>
                    {country.allianceCamp.replace("_", "-").toUpperCase()}
                  </span>
                </div>
                <button onClick={() => setExpandedRanking(null)} className="text-[#555] text-xs hover:text-[#888]">close ×</button>
              </div>
              <CountryDetail country={country} />
            </div>
          );
        })()}

        <SectionChat
          context="Global power rankings. Top 3: US, China, and the next closest. Based on Dalio's 18 determinants (education, tech, military, trade, finance, reserves, debt, equality, rule of law, infrastructure, resources, alliances, leadership)."
          label="Ask about power rankings"
          suggestions={["Why is China ranked where it is?", "Which country is rising fastest?", "What's the US weakest determinant?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />


      {/* ════════════════════════════════════════════
          HISTORICAL FRAMEWORK — Dalio's Big Cycle + evidence
      ════════════════════════════════════════════ */}

      <section className="px-4 pt-8 pb-4 max-w-5xl mx-auto text-center">
        <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">Historical Framework</h2>
        <p className="text-xs text-[#555] max-w-xl mx-auto">The long-cycle evidence behind the world order transition — Dalio&apos;s 6 stages, US decline indicators, and the rise of the challengers.</p>
      </section>

      {/* Big Cycle */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Where the US Sits in the Big Cycle</h2>
        <p className="text-xs text-[#555] mb-6">Dalio&apos;s six stages of empire — applied to the United States</p>
        <div className="space-y-2 mb-6">
          {bigCycleStages.map((s) => {
            const isOpen = expandedStage === s.stage;
            const detail = STAGE_DETAILS[s.stage];
            return (
              <div key={s.stage}>
                <button
                  onClick={() => setExpandedStage(isOpen ? null : s.stage)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-[#151515]"
                  style={{ backgroundColor: s.active ? ACCENT + "15" : "#111", borderColor: isOpen ? ACCENT + "60" : s.active ? ACCENT + "40" : "#222" }}
                >
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: s.active ? ACCENT : "#222", color: s.active ? "#000" : "#555" }}>{s.stage}</span>
                  <div className="flex-1">
                    <span className={`text-sm font-bold ${s.active ? "text-[#e0e0e0]" : "text-[#555]"}`}>{s.label}</span>
                    <span className="text-xs text-[#333] ml-2">{s.period}</span>
                  </div>
                  {s.active && <span className="text-xs font-bold" style={{ color: ACCENT }}>← NOW</span>}
                  <span className="text-[#555] text-[10px] leading-none shrink-0 ml-2">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && detail && (
                  <div className="mt-2 p-4 rounded-lg border" style={{ borderColor: ACCENT + "40", backgroundColor: ACCENT + "06" }}>
                    <p className="text-xs text-[#888] leading-relaxed mb-4">{detail.context}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                        <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: ACCENT }}>Key events</div>
                        <ul className="space-y-1">
                          {detail.keyEvents.map((e) => (
                            <li key={e} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                              <span style={{ color: ACCENT }}>•</span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                        <div className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Historical parallel</div>
                        <p className="text-[10px] text-[#888] leading-relaxed">{detail.historicalParallel}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded border" style={{ borderColor: ACCENT + "30", backgroundColor: ACCENT + "08" }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Investment lens</div>
                      <p className="text-[10px] text-[#888] leading-relaxed">{detail.investmentLens}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <SectionChat
          context="Big Cycle position. US is at Stage 5 of 6 (great power conflict). Same indicators as British Empire 1940s and Soviet Union 1980s."
          label="Ask about the big cycle"
          suggestions={["What comes after Stage 5?", "How long do declining powers last?", "Is this reversible?"]}
        />
      </section>


      <div className="border-t border-[#181818]" />

      {/* ══ ACT I — The declining power ══ */}
      <section className="px-4 py-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-0.5 w-8 bg-[#f97316]" />
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#f97316]">Act I — The Declining Power</span>
        </div>
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">US Overextension</h2>
        <p className="text-xs text-[#555] mb-6">Military overextension, debt unsustainability, and reserve currency erosion — the indicators Dalio identifies in every previous imperial decline.</p>

        {/* Dashboard indicators — clickable for detail */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          {dashboardIndicators.map((ind) => {
            const isOpen = expandedIndicator === ind.label;
            return (
              <button
                key={ind.label}
                onClick={() => setExpandedIndicator(isOpen ? null : ind.label)}
                className="p-3 rounded-lg bg-[#111] border text-left transition-colors hover:bg-[#151515]"
                style={{ borderColor: isOpen ? ACCENT + "60" : "#222" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <StatusDot status={ind.status} />
                  <span className="text-[10px] text-[#555] uppercase tracking-wider">{ind.label}</span>
                  <span className="text-[#555] text-[10px] leading-none ml-auto">{isOpen ? "−" : "+"}</span>
                </div>
                <div className="text-lg font-bold" style={{ color: ACCENT }}>{ind.value}</div>
                <div className="text-[10px] text-[#555]">{ind.detail}</div>
                <div className="text-[10px] text-[#333] mt-1">{ind.comparison}</div>
              </button>
            );
          })}
        </div>

        {/* Indicator drill-down drawer */}
        {expandedIndicator && INDICATOR_DETAILS[expandedIndicator] && (() => {
          const ind = dashboardIndicators.find((i) => i.label === expandedIndicator)!;
          const detail = INDICATOR_DETAILS[expandedIndicator];
          return (
            <div className="mb-8 p-4 rounded-lg border" style={{ borderColor: ACCENT + "40", backgroundColor: ACCENT + "06" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusDot status={ind.status} />
                  <div>
                    <div className="text-sm font-bold text-[#e0e0e0]">{ind.label}</div>
                    <div className="text-[10px] text-[#555]">{ind.value} · {ind.detail} · {ind.comparison}</div>
                  </div>
                </div>
                <button onClick={() => setExpandedIndicator(null)} className="text-[#555] text-xs hover:text-[#888]">close ×</button>
              </div>

              <p className="text-xs text-[#888] leading-relaxed mb-4">{detail.fullContext}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: ACCENT }}>Key facts</div>
                  <ul className="space-y-1">
                    {detail.keyFacts.map((f) => (
                      <li key={f} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span style={{ color: ACCENT }}>•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Historical parallel</div>
                  <p className="text-[10px] text-[#888] leading-relaxed">{detail.historicalParallel}</p>
                </div>
              </div>

              <div className="p-3 rounded border" style={{ borderColor: ACCENT + "30", backgroundColor: ACCENT + "08" }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Investment implication</div>
                <p className="text-[10px] text-[#888] leading-relaxed">{detail.investmentImplication}</p>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Military Overextension */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Fighting on Multiple Fronts</h2>
        <p className="text-xs text-[#555] mb-4">History shows dominant powers cannot sustain wars on multiple fronts simultaneously. Click any row for detail.</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#555] uppercase tracking-wider border-b border-[#222]">
                <th className="text-left py-2 pr-2">Region</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-right py-2 px-2">Est. Cost/Year</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Duration</th>
                <th className="text-center py-2 pl-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {militaryCommitments.flatMap((c) => {
                const isOpen = expandedCommitment === c.region;
                const detail = COMMITMENT_DETAILS[c.region];
                const rows = [
                  <tr
                    key={c.region}
                    onClick={() => setExpandedCommitment(isOpen ? null : c.region)}
                    className="border-b border-[#181818] hover:bg-[#111] cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-2 font-bold text-[#e0e0e0]">
                      {c.region}
                      <span className="text-[#333] ml-1 text-[10px]">{isOpen ? "▲" : "▼"}</span>
                    </td>
                    <td className="py-3 px-2 text-[#888]">{c.type}</td>
                    <td className="py-3 px-2 text-right" style={{ color: ACCENT }}>{c.annualCost}</td>
                    <td className="py-3 px-2 text-[#555] hidden sm:table-cell">{c.duration}</td>
                    <td className="py-3 pl-2 text-center"><StatusDot status={c.status} /></td>
                  </tr>,
                ];
                if (isOpen && detail) {
                  rows.push(
                    <tr key={c.region + "-detail"}>
                      <td colSpan={5} className="p-0">
                        <div className="m-2 p-4 rounded-lg border" style={{ borderColor: ACCENT + "40", backgroundColor: ACCENT + "06" }}>
                          <p className="text-xs text-[#888] leading-relaxed mb-3">{detail.context}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: ACCENT }}>Key facts</div>
                              <ul className="space-y-1">
                                {detail.keyFacts.map((f) => (
                                  <li key={f} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                                    <span style={{ color: ACCENT }}>•</span>
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                              <div className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Historical parallel</div>
                              <p className="text-[10px] text-[#888] leading-relaxed">{detail.historicalParallel}</p>
                            </div>
                          </div>

                          <div className="p-3 rounded border" style={{ borderColor: ACCENT + "30", backgroundColor: ACCENT + "08" }}>
                            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Investment implication</div>
                            <p className="text-[10px] text-[#888] leading-relaxed">{detail.investmentImplication}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>
        <SectionChat
          context="Military overextension. US has 750+ bases in 80 countries, three active theaters plus Hormuz enforcement. Defence budget $886B."
          label="Ask about military overextension"
          suggestions={["How does Hormuz add to overextension?", "What happened to the British Empire?", "Can the US afford three theaters?"]}
        />
        <div className="mt-4 space-y-2">
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Spanish Empire (1588-1648):</span> Simultaneous wars in the Netherlands, France, England, and the Ottoman frontier bankrupted Spain three times. The Armada defeat (1588) didn&apos;t end the empire — the multi-front cost did.
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">British Empire (1939-1947):</span> Fighting Germany in Europe + Japan in Asia simultaneously forced Britain to liquidate $4.5B in US-held assets and take $31B in Lend-Lease debt. Within 2 years of victory, the empire was dissolving.
          </div>
        </div>
      </section>

      {/* Debt */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Financial Burden</h2>
        <p className="text-xs text-[#555] mb-4">Wars are financed by debt. Debt devalues currency. Dalio&apos;s principle: sell debt, buy gold.</p>

        {/* Key numbers — clickable for detail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {Object.entries(DEBT_CARD_DETAILS).map(([id, d]) => {
            const isOpen = expandedDebtCard === id;
            return (
              <button
                key={id}
                onClick={() => setExpandedDebtCard(isOpen ? null : id)}
                className="p-3 rounded-lg bg-[#111] border text-center transition-colors hover:bg-[#151515]"
                style={{ borderColor: isOpen ? d.color + "60" : "#222" }}
              >
                <div className="flex items-center justify-center gap-1">
                  <div className="text-xs text-[#555]">{d.title}</div>
                  <span className="text-[#555] text-[10px] leading-none">{isOpen ? "−" : "+"}</span>
                </div>
                <div className="text-xl font-bold" style={{ color: d.color }}>{d.value}</div>
                <div className="text-[10px] text-[#555]">{d.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Debt card drill-down drawer */}
        {expandedDebtCard && DEBT_CARD_DETAILS[expandedDebtCard] && (() => {
          const d = DEBT_CARD_DETAILS[expandedDebtCard];
          return (
            <div className="mb-4 p-4 rounded-lg border" style={{ borderColor: d.color + "40", backgroundColor: d.color + "06" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-[#e0e0e0]">{d.title}</div>
                  <div className="text-[10px]" style={{ color: d.color }}>{d.value} · {d.subtitle}</div>
                </div>
                <button onClick={() => setExpandedDebtCard(null)} className="text-[#555] text-xs hover:text-[#888]">close ×</button>
              </div>

              <p className="text-xs text-[#888] leading-relaxed mb-4">{d.context}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: d.color }}>Key facts</div>
                  <ul className="space-y-1">
                    {d.keyFacts.map((f) => (
                      <li key={f} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span style={{ color: d.color }}>•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Historical parallel</div>
                  <p className="text-[10px] text-[#888] leading-relaxed">{d.historicalParallel}</p>
                </div>
              </div>

              <div className="p-3 rounded border" style={{ borderColor: d.color + "30", backgroundColor: d.color + "08" }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: d.color }}>Investment implication</div>
                <p className="text-[10px] text-[#888] leading-relaxed">{d.investmentImplication}</p>
              </div>
            </div>
          );
        })()}

        {/* Charts — expandable */}
        <details className="mb-2">
          <summary className="text-xs text-[#555] cursor-pointer hover:text-[#888]">View historical charts ↓</summary>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LineChart data={debtTimeline} xKey="year" yKey="debt" label="National Debt ($T)" color={ACCENT} />
              <LineChart data={debtTimeline} xKey="year" yKey="gdpPct" label="Debt as % of GDP" color="#ef4444"
                thresholds={[{ value: 80, label: "80%", color: "#eab308" }, { value: 100, label: "100%", color: "#ef4444" }]} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LineChart data={debtTimeline} xKey="year" yKey="usdReserve" label="USD Reserve Share (%)" color="#3b82f6" />
              <LineChart data={debtTimeline} xKey="year" yKey="goldPrice" label="Gold Price ($/oz)" color="#eab308" />
            </div>
          </div>
        </details>

        <SectionChat
          context="US debt trajectory. $36.2T (125% GDP). Interest exceeded defence spending in 2024. CBO projects 166% by 2054."
          label="Ask about the debt"
          suggestions={["When does debt become unsustainable?", "What protects against debasement?", "How does this compare to Japan?"]}
        />
        <div className="mt-4 space-y-2">
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Dutch Republic (1780s):</span> The Fourth Anglo-Dutch War (1780-84) pushed Dutch debt to 250% of GDP. Interest payments consumed 70% of tax revenue. Within a decade, the guilder lost reserve status and Amsterdam lost its financial center role to London.
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">British Empire (1945):</span> Post-WWII debt hit 270% of GDP. Britain was forced to devalue the pound 30% (1949) and again 14% (1967). Gold reserves depleted. IMF bailout required (1976). The pound&apos;s reserve share fell from 64% to under 5% over 40 years.
          </div>
        </div>
      </section>

      {/* Dollar Erosion */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Dollar Dominance in Decline</h2>
        <p className="text-xs text-[#555] mb-6">Reserve currency erosion is both symptom and accelerant of decline.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">USD Reserve Share</div>
            <div className="text-2xl font-bold text-[#3b82f6] mb-1">58%</div>
            <div className="text-xs text-[#555]">Down from 72% in 2000</div>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">De-dollarisation</div>
            <div className="space-y-1.5 mt-2">
              {dedollarisation.map((d) => (
                <div key={d.country} className="text-xs">
                  <span className={d.severity === "high" ? "text-[#ef4444]" : d.severity === "medium" ? "text-[#eab308]" : "text-[#555]"}>{d.country}</span>
                  <span className="text-[#333] ml-1">— {d.action}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">Central Bank Gold Buying</div>
            <div className="space-y-1.5 mt-2">
              {centralBankGold.slice(0, 4).map((cb) => (
                <div key={cb.bank} className="text-xs">
                  <span className="text-[#eab308]">{cb.bank.split(" ").pop()}</span>
                  <span className="text-[#333] ml-1">— {cb.tonnes2023}t (2023)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Guilder → Pound (1780-1820):</span> The Dutch guilder was the world&apos;s reserve currency for 80 years. The transition to sterling took ~40 years and was accelerated by war debt, not a single event. Gold flowed from Amsterdam to London gradually, then suddenly.
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Sterling → Dollar (1914-1944):</span> The pound lost reserve status over 30 years. WWI forced Britain off the gold standard (1914). Bretton Woods (1944) formalised the dollar&apos;s dominance. But the actual capital flight happened in the 1930s — the market moved before the institutions did.
          </div>
        </div>
      </section>

      {/* Investment Implications */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">What Overextension Means for Investors</h2>
        <p className="text-xs text-[#555] mb-6">Historical patterns applied to current positioning</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "#eab308" }}>Sell debt / Buy gold</div>
            <p className="text-xs text-[#888] leading-relaxed mb-3">Wars and debt monetisation destroy bond and cash purchasing power. Gold is the historical hedge.</p>
            <Link href="/regimetracker" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2">See current regime →</Link>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "#3b82f6" }}>Geographic diversification</div>
            <p className="text-xs text-[#888] leading-relaxed mb-3">Seven of the ten greatest powers in 1900 saw wealth virtually wiped out at least once in the following 50 years.</p>
            <Link href="/emerging-markets" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2">Emerging Markets →</Link>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "#22c55e" }}>Beneficiaries of US retreat</div>
            <p className="text-xs text-[#888] leading-relaxed mb-3">When dominant powers overextend, allies rebuild and rivals expand. Both create opportunities.</p>
            <span className="text-xs text-[#555]">See European Autonomy section below ↓</span>
          </div>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* ══ ACT II — The rising challenger ══ */}
      <section className="px-4 py-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-0.5 w-8 bg-[#ef4444]" />
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#ef4444]">Act II — The Rising Challenger</span>
        </div>
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">China&apos;s Path to Superpower</h2>
        <p className="text-xs text-[#555] mb-6">Systematically building the capabilities Dalio identifies as markers of rising powers — while the incumbent overextends.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {CHINA_PILLARS.map((p) => {
            const isOpen = expandedChinaPillar === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setExpandedChinaPillar(isOpen ? null : p.id)}
                className="p-4 rounded-lg bg-[#111] border-l-2 border text-left transition-colors hover:bg-[#151515]"
                style={{ borderLeftColor: p.color, borderColor: isOpen ? p.color + "50" : "#222" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: p.color }}>{p.title}</div>
                  <span className="text-[#555] text-[10px] leading-none">{isOpen ? "−" : "+"}</span>
                </div>
                <p className="text-xs text-[#888] leading-relaxed mb-2">{p.short}</p>
                <div className="text-xs text-[#e0e0e0] font-bold">{p.metric}</div>
              </button>
            );
          })}
        </div>

        {/* China pillar expanded detail */}
        {CHINA_PILLARS.map((p) => {
          if (expandedChinaPillar !== p.id) return null;
          return (
            <div key={`china-detail-${p.id}`} className="mb-6 p-4 rounded-lg border" style={{ borderColor: p.color + "40", backgroundColor: p.color + "06" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold uppercase tracking-wider" style={{ color: p.color }}>{p.title}</div>
                <button onClick={() => setExpandedChinaPillar(null)} className="text-[#555] text-xs hover:text-[#888]">close ×</button>
              </div>

              <p className="text-xs text-[#888] leading-relaxed mb-4">{p.fullThesis}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: p.color }}>Key metrics</div>
                  <ul className="space-y-1">
                    {p.keyMetrics.map((m) => (
                      <li key={m} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span style={{ color: p.color }}>•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] text-[#eab308] uppercase tracking-wider mb-2">What to watch next</div>
                  <p className="text-[10px] text-[#888] leading-relaxed">{p.watchFor}</p>
                </div>
              </div>

              <div className="p-3 rounded border" style={{ borderColor: p.color + "30", backgroundColor: p.color + "08" }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: p.color }}>Investment implication</div>
                <p className="text-[10px] text-[#888] leading-relaxed">{p.investmentImplication}</p>
              </div>
            </div>
          );
        })}

        <div className="p-4 rounded-lg bg-[#111] border border-[#ef444430]" style={{ backgroundColor: "#ef444410" }}>
          <div className="text-xs text-[#ef4444] font-bold mb-2">The Hormuz Confrontation</div>
          <p className="text-xs text-[#888] leading-relaxed">
            The US permanent closure of the Strait of Hormuz — specifically targeting Iran&apos;s shadow fleet tankers to China — is the first direct US action threatening China&apos;s energy supply chain. China&apos;s response will define whether this remains a cold war or escalates. The shadow fleet was China&apos;s workaround for sanctions; cutting it forces China to either accept US dominance over its energy supply or challenge it directly.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/china" className="inline-block px-6 py-3 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors">
            Full China tracker — regime, allocation, proxy indicators →
          </Link>
        </div>

        <SectionChat
          context="China as the rising challenger in Dalio's world order framework. Alliance building (BRICS+, BRI 140+ countries), financial infrastructure (CIPS $20T, yuan 4.7% of trade), technology self-sufficiency (Huawei, solar, EVs, AI), military modernisation (370 ships, hypersonics). Hormuz shadow fleet confrontation with the US."
          label="Ask about China's rise"
          suggestions={["How does China compare to the US at each stage?", "Can China replace the dollar?", "What does Hormuz mean for China's energy security?"]}
        />
        <div className="mt-4 space-y-2">
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">US overtaking Britain (1870-1945):</span> The US surpassed Britain in GDP by 1890 but didn&apos;t become the dominant power until 1945 — a 55-year gap. Rising powers build capabilities for decades before the transition moment. China&apos;s GDP surpassed the US in PPP terms in 2014.
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Germany&apos;s naval challenge (1898-1914):</span> Kaiser Wilhelm&apos;s naval build-up (1898 Naval Laws) directly threatened British sea dominance. Britain responded with the Dreadnought programme. The arms race consumed resources from both sides and ended in war. China&apos;s naval expansion follows the same pattern — 370 ships vs 290.
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Japan&apos;s tech rise (1960-1990):</span> Japan went from making cheap transistor radios (1955) to dominating semiconductors, automobiles, and electronics in 30 years. US responded with trade restrictions (1986 Semiconductor Agreement). China&apos;s trajectory is faster — EVs, solar, batteries, and AI in 15 years — and the US response (CHIPS Act, export bans) mirrors the same playbook.
          </div>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* ══ ACT III — The third pole ══ */}
      <section className="px-4 py-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-0.5 w-8 bg-[#3b82f6]" />
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#3b82f6]">Act III — The Third Pole</span>
        </div>
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">European Strategic Autonomy</h2>
        <p className="text-xs text-[#555] mb-4">Europe is building independence in defence, energy, and technology — forced by necessity, funded by governments, outperforming every benchmark since Ukraine.</p>

        {/* 4 positions — expandable */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {EU_POSITIONS.map((p) => {
            const isOpen = expandedEUPosition === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setExpandedEUPosition(isOpen ? null : p.id)}
                className="p-3 rounded-lg border text-center transition-colors hover:bg-[#151515]"
                style={{ borderColor: p.color + (isOpen ? "80" : "40"), backgroundColor: p.color + (isOpen ? "15" : "08") }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: p.color }}>{p.sector}</div>
                  <span className="text-[#555] text-[10px] leading-none">{isOpen ? "−" : "+"}</span>
                </div>
                <div className="text-xl font-bold text-[#e0e0e0]">{p.ticker}</div>
                <div className="text-[10px] text-[#888] mt-1">{p.stat}</div>
                <div className="text-[10px] mt-1" style={{ color: p.color }}>{p.note}</div>
              </button>
            );
          })}
        </div>

        {/* EU position expanded drill-down */}
        {EU_POSITIONS.map((p) => {
          if (expandedEUPosition !== p.id) return null;
          return (
            <div key={`eu-detail-${p.id}`} className="mb-4 p-4 rounded-lg border" style={{ borderColor: p.color + "40", backgroundColor: p.color + "06" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-[#e0e0e0]">{p.ticker} — {p.sector}</div>
                  <div className="text-[10px]" style={{ color: p.color }}>{p.stat} · {p.note}</div>
                </div>
                <button onClick={() => setExpandedEUPosition(null)} className="text-[#555] text-xs hover:text-[#888]">close ×</button>
              </div>

              <p className="text-xs text-[#888] leading-relaxed mb-4">{p.fullThesis}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: p.color }}>Catalysts</div>
                  <ul className="space-y-1">
                    {p.catalysts.map((c) => (
                      <li key={c} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span style={{ color: p.color }}>•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-2">Risks</div>
                  <ul className="space-y-1">
                    {p.risks.map((r) => (
                      <li key={r} className="text-[10px] text-[#888] leading-relaxed flex gap-1.5">
                        <span className="text-[#ef4444]">−</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded border" style={{ borderColor: p.color + "30", backgroundColor: p.color + "08" }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: p.color }}>AI & Robotics Race connection</div>
                <p className="text-[10px] text-[#888] leading-relaxed">{p.aiRaceConnection}</p>
              </div>
            </div>
          );
        })}

        {/* The thesis in one line + historical backing */}
        <div className="p-3 rounded bg-[#111] border border-[#222] mb-4">
          <p className="text-xs text-[#888] leading-relaxed">
            <span className="text-[#3b82f6] font-bold">Byzantine pattern:</span> When the protecting power can no longer guarantee security, dependencies build their own. Byzantium survived 1,000 years after Rome fell.{" "}
            <span className="text-[#eab308] font-bold">Cold War parallel:</span> EU, single market, and euro were all built during US-Soviet competition. This time Europe adds military independence.{" "}
            <span className="text-[#22c55e] font-bold">Dalio&apos;s rule:</span> Regions that avoid direct conflict, build capabilities, and trade with both sides benefit most in every transition. Europe is doing all three.
          </p>
        </div>

        <div className="text-center">
          <Link href="/europe" className="inline-block px-5 py-2 rounded bg-[#222] text-xs text-[#e0e0e0] hover:bg-[#333] transition-colors">
            Full European tracker — regime, allocation, timeline →
          </Link>
        </div>

        <SectionChat
          context="European strategic autonomy as the third pole in the world order transition. Historical analogies: Byzantine Empire surviving after Rome split, Cold War Western Europe emerging as economic pole, Dalio's framework showing regions that avoid conflict and build capabilities benefit most. Four positions: EUAD, IOGP, ASML, NHY."
          label="Ask about European autonomy"
          suggestions={["Why is EUAD up 820%?", "Does European autonomy work in all regimes?", "How does Hormuz accelerate this?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* Email Alerts */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <SubscribeForm
          title="Track Alliance Shifts"
          description="Get notified when a country's alliance position shifts — UN voting changes, major treaties, or power score movements."
          buttonLabel="Track shifts"
          source="world_order"
          waitlistFeature="world_order"
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          AI-generated analysis based on public data for educational purposes only.
          Alliance positions and power scores are approximations. Not personalised financial advice.
          Always do your own research.
        </p>
      </footer>
    </main>
  );
}
