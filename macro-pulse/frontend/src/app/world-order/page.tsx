"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import SectionChat from "@/components/SectionChat";
import WorldOrderPosition from "@/components/WorldOrderPosition";
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

  return (
    <div className="border-t border-[#222] bg-[#0a0a0a] p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div>
          <h4 className="text-xs text-[#555] uppercase tracking-wider mb-2">Power Profile — {country.name}</h4>
          <RadarChart scores={country.scores} color={color} />
          <div className="text-center mt-2">
            <span className="text-2xl font-bold" style={{ color }}>{overall}</span>
            <span className="text-xs text-[#555] ml-1">/ 10</span>
          </div>
        </div>

        {/* Scores table */}
        <div>
          <h4 className="text-xs text-[#555] uppercase tracking-wider mb-2">18 Determinants</h4>
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
            {DETERMINANT_KEYS.map((k) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-[#888] shrink-0">{DETERMINANT_LABELS[k]}</span>
                <div className="flex-1 h-2 bg-[#181818] rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{ width: `${(country.scores[k] || 0) * 10}%`, backgroundColor: color }}
                  />
                </div>
                <span className="w-6 text-right font-bold" style={{ color }}>{country.scores[k]}</span>
                <TrendArrow trend={country.scoreTrends[k]} />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-[#333]">Click a score for evidence</div>
        </div>
      </div>

      {/* Evidence */}
      <details className="mt-4">
        <summary className="text-xs text-[#555] cursor-pointer hover:text-[#888]">View evidence for all determinants</summary>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DETERMINANT_KEYS.map((k) => (
            <div key={k} className="p-2 rounded bg-[#111] text-xs">
              <span className="text-[#888] font-bold">{DETERMINANT_LABELS[k]}:</span>{" "}
              <span className="text-[#555]">{country.scoreEvidence[k]}</span>
            </div>
          ))}
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

// ── Main Page ──
export default function WorldOrderPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
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
          Empires used to compete with armies and navies. Now they compete with chips, robots, and AI. Whoever automates production fastest — building the most advanced fabs, deploying the most robots, controlling the supply chain — wins. That&apos;s why the AI Race is a geopolitical thesis, not just an investment one.
        </p>
      </section>

      {/* Three competitors */}
      <section className="px-4 py-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-[#f9731640] bg-[#f9731610] text-center">
            <div className="text-[10px] text-[#f97316] uppercase tracking-wider mb-1">🇺🇸 United States</div>
            <div className="text-sm font-bold text-[#e0e0e0]">Terafab + CHIPS Act</div>
            <div className="text-[10px] text-[#555] mt-1">$52B subsidies · Nvidia/Tesla lead</div>
          </div>
          <div className="p-3 rounded-lg border border-[#ef444440] bg-[#ef444410] text-center">
            <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-1">🇨🇳 China</div>
            <div className="text-sm font-bold text-[#e0e0e0]">#1 Robot Installer</div>
            <div className="text-[10px] text-[#555] mt-1">60% rare earths · 290k robots/yr</div>
          </div>
          <div className="p-3 rounded-lg border border-[#3b82f640] bg-[#3b82f610] text-center">
            <div className="text-[10px] text-[#3b82f6] uppercase tracking-wider mb-1">🇪🇺 Europe</div>
            <div className="text-sm font-bold text-[#e0e0e0]">ASML Monopoly</div>
            <div className="text-[10px] text-[#555] mt-1">EUV lithography · €43B Chips Act</div>
          </div>
        </div>
        <div className="p-3 mt-3 rounded bg-[#111] border border-[#222]">
          <p className="text-[10px] text-[#888] leading-relaxed text-center">
            <span className="text-[#e0e0e0] font-bold">Why this matters for your portfolio:</span> Every nation pouring money into AI and robotics = structural demand for the same supply chain: chips (SMH), copper (COPX), lithium (LIT), rare earths (REMX). The geopolitical competition <span className="text-[#e0e0e0]">accelerates</span> the AI Race thesis — governments are subsidising the demand.
          </p>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Big Cycle */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Where the US Sits in the Big Cycle</h2>
        <p className="text-xs text-[#555] mb-6">Dalio&apos;s six stages of empire — applied to the United States</p>
        <div className="space-y-2 mb-6">
          {bigCycleStages.map((s) => (
            <div key={s.stage} className="flex items-center gap-3 p-3 rounded-lg border"
              style={{ backgroundColor: s.active ? ACCENT + "15" : "#111", borderColor: s.active ? ACCENT + "40" : "#222" }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: s.active ? ACCENT : "#222", color: s.active ? "#000" : "#555" }}>{s.stage}</span>
              <div className="flex-1">
                <span className={`text-sm font-bold ${s.active ? "text-[#e0e0e0]" : "text-[#555]"}`}>{s.label}</span>
                <span className="text-xs text-[#333] ml-2">{s.period}</span>
              </div>
              {s.active && <span className="text-xs font-bold" style={{ color: ACCENT }}>← NOW</span>}
            </div>
          ))}
        </div>
        <SectionChat
          context="Big Cycle position. US is at Stage 5 of 6 (great power conflict). Same indicators as British Empire 1940s and Soviet Union 1980s."
          label="Ask about the big cycle"
          suggestions={["What comes after Stage 5?", "How long do declining powers last?", "Is this reversible?"]}
        />
      </section>


      <div className="border-t border-[#181818]" />

      {/* ══ US OVEREXTENSION — The declining power deep dive ══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">The Declining Power</h2>
        <p className="text-xl font-bold text-[#e0e0e0] mb-1">US Overextension</p>
        <p className="text-xs text-[#555] mb-6">Military overextension, debt unsustainability, and reserve currency erosion — the indicators Dalio identifies in every previous imperial decline.</p>

        {/* Dashboard indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {dashboardIndicators.map((ind) => (
            <div key={ind.label} className="p-3 rounded-lg bg-[#111] border border-[#222]">
              <div className="flex items-center gap-1.5 mb-1">
                <StatusDot status={ind.status} />
                <span className="text-[10px] text-[#555] uppercase tracking-wider">{ind.label}</span>
              </div>
              <div className="text-lg font-bold" style={{ color: ACCENT }}>{ind.value}</div>
              <div className="text-[10px] text-[#555]">{ind.detail}</div>
              <div className="text-[10px] text-[#333] mt-1">{ind.comparison}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Military Overextension */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Fighting on Multiple Fronts</h2>
        <p className="text-xs text-[#555] mb-4">History shows dominant powers cannot sustain wars on multiple fronts simultaneously.</p>
        <div className="overflow-x-auto mb-6">
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
              {militaryCommitments.map((c) => (
                <tr key={c.region} className="border-b border-[#181818]">
                  <td className="py-3 pr-2 font-bold text-[#e0e0e0]">{c.region}</td>
                  <td className="py-3 px-2 text-[#888]">{c.type}</td>
                  <td className="py-3 px-2 text-right" style={{ color: ACCENT }}>{c.annualCost}</td>
                  <td className="py-3 px-2 text-[#555] hidden sm:table-cell">{c.duration}</td>
                  <td className="py-3 pl-2 text-center"><StatusDot status={c.status} /></td>
                </tr>
              ))}
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

        {/* Key numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-[#111] border border-[#222] text-center">
            <div className="text-xs text-[#555]">National Debt</div>
            <div className="text-xl font-bold" style={{ color: ACCENT }}>$36.2T</div>
            <div className="text-[10px] text-[#555]">125% of GDP</div>
          </div>
          <div className="p-3 rounded-lg bg-[#111] border border-[#222] text-center">
            <div className="text-xs text-[#555]">Interest vs Defence</div>
            <div className="text-xl font-bold text-[#ef4444]">Interest wins</div>
            <div className="text-[10px] text-[#555]">First time in 2024</div>
          </div>
          <div className="p-3 rounded-lg bg-[#111] border border-[#222] text-center">
            <div className="text-xs text-[#555]">USD Reserves</div>
            <div className="text-xl font-bold text-[#3b82f6]">72% → 58%</div>
            <div className="text-[10px] text-[#555]">Since 2000</div>
          </div>
          <div className="p-3 rounded-lg bg-[#111] border border-[#222] text-center">
            <div className="text-xs text-[#555]">CBO Projection</div>
            <div className="text-xl font-bold text-[#ef4444]">166%</div>
            <div className="text-[10px] text-[#555]">Debt/GDP by 2054</div>
          </div>
        </div>

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

      {/* ══ CHINA — The rising challenger ══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">The Rising Challenger</h2>
        <p className="text-xl font-bold text-[#e0e0e0] mb-1">China&apos;s Path to Superpower</p>
        <p className="text-xs text-[#555] mb-6">Systematically building the capabilities Dalio identifies as markers of rising powers — while the incumbent overextends.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#ef4444" }}>
            <div className="text-xs font-bold text-[#ef4444] uppercase tracking-wider mb-2">Alliance Building</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              BRICS+ expanded to include Saudi Arabia, UAE, Egypt, Ethiopia, Iran. Belt and Road Initiative spans 140+ countries. Shanghai Cooperation Organisation provides military framework. China is building the institutional architecture of a parallel world order.
            </p>
            <div className="text-xs text-[#e0e0e0] font-bold">BRICS+ now represents 46% of world population</div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#eab308" }}>
            <div className="text-xs font-bold text-[#eab308] uppercase tracking-wider mb-2">Financial Infrastructure</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              CIPS (Cross-Border Interbank Payment System) processing $20T+ annually — a SWIFT alternative. Yuan share of global trade settlements at 4.7%, up from 1.9% in 2020. Bilateral currency swaps with 40+ countries. Digital yuan (e-CNY) piloted across 26 cities.
            </p>
            <div className="text-xs text-[#e0e0e0] font-bold">CIPS: $20T+ annual volume</div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#3b82f6" }}>
            <div className="text-xs font-bold text-[#3b82f6] uppercase tracking-wider mb-2">Technology Self-Sufficiency</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              US tech export restrictions forced domestic substitution — and it&apos;s working. Huawei&apos;s Kirin 9000s chip proved workaround capability. SMIC advancing to 7nm. China produces 80% of global solar panels, 60% of EVs, dominates battery supply chain. AI models (DeepSeek, Baidu ERNIE) closing the gap.
            </p>
            <div className="text-xs text-[#e0e0e0] font-bold">80% of global solar panel production</div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#22c55e" }}>
            <div className="text-xs font-bold text-[#22c55e] uppercase tracking-wider mb-2">Military Modernisation</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              Navy surpassed the US in total vessel count (370 vs 290). Hypersonic missiles deployed (DF-27). Third aircraft carrier (Fujian) with electromagnetic catapult. Nuclear arsenal expanding from ~350 to estimated 1,000+ warheads by 2030. Space station (Tiangong) operational.
            </p>
            <div className="text-xs text-[#e0e0e0] font-bold">370 naval vessels (US: 290)</div>
          </div>
        </div>

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

      <div className="border-t border-[#181818]" />

      {/* ══ EUROPEAN AUTONOMY — The emerging third pole ══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">The Emerging Third Pole</h2>
        <p className="text-xl font-bold text-[#e0e0e0] mb-1">European Strategic Autonomy</p>
        <p className="text-xs text-[#555] mb-4">Europe is building independence in defence, energy, and technology — forced by necessity, funded by governments, outperforming every benchmark since Ukraine.</p>

        {/* Compact: 4 positions in one row with stats integrated */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { ticker: "EUAD", sector: "Defence", stat: "1.5→2.5% GDP", color: "#6b8e5a", note: "All regimes" },
            { ticker: "IOGP", sector: "Energy", stat: "40→8% RU gas", color: "#e09030", note: "Stagflation pick" },
            { ticker: "ASML", sector: "Technology", stat: "100% EUV", color: "#3b82f6", note: "Single stock risk" },
            { ticker: "NHY", sector: "Materials", stat: "NOK listed", color: "#a855f7", note: "Stag + Reflation" },
          ].map((p) => (
            <div key={p.ticker} className="p-3 rounded-lg border text-center" style={{ borderColor: p.color + "40", backgroundColor: p.color + "08" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: p.color }}>{p.sector}</div>
              <div className="text-xl font-bold text-[#e0e0e0]">{p.ticker}</div>
              <div className="text-[10px] text-[#888] mt-1">{p.stat}</div>
              <div className="text-[10px] mt-1" style={{ color: p.color }}>{p.note}</div>
            </div>
          ))}
        </div>

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

      <div className="border-t border-[#181818]" />

      {/* ══ EMERGING MARKETS — The beneficiaries ══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">The Beneficiaries</h2>
        <p className="text-xl font-bold text-[#e0e0e0] mb-1">Emerging Market Swing States</p>
        <p className="text-xs text-[#555] mb-6">In every power transition Dalio documents, the countries that refuse to choose sides and trade with both powers capture disproportionate value.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { country: "India", flag: "\uD83C\uDDEE\uD83C\uDDF3", ticker: "INDA", edge: "Largest non-aligned economy. Buys Russian oil at discount AND receives US tech transfer.", metric: "+35% FDI YoY" },
            { country: "Saudi Arabia", flag: "\uD83C\uDDF8\uD83C\uDDE6", ticker: "KSA", edge: "Joined BRICS+, accepts yuan for oil, but maintains US security guarantee.", metric: "Vision 2030" },
            { country: "Brazil", flag: "\uD83C\uDDE7\uD83C\uDDF7", ticker: "EWZ", edge: "BRICS+ founding member. Commodity superpower (iron ore, soy, oil). Yuan trade settlement.", metric: "Commodity leverage" },
            { country: "Indonesia", flag: "\uD83C\uDDEE\uD83C\uDDE9", ticker: "EIDO", edge: "50% of global nickel. Battery supply chain critical. Plays US and China for investment.", metric: "50% global nickel" },
            { country: "Turkey", flag: "\uD83C\uDDF9\uD83C\uDDF7", ticker: "TUR", edge: "NATO member that buys Russian S-400s. Controls Bosphorus. Trades with everyone.", metric: "Bosphorus control" },
            { country: "Morocco", flag: "\uD83C\uDDF2\uD83C\uDDE6", ticker: "—", edge: "EU\u2019s nearshoring destination. Free trade with EU + US. Solar + manufacturing hub.", metric: "Nearshoring hub" },
          ].map((c) => (
            <div key={c.country} className="p-3 rounded-lg bg-[#111] border border-[#222]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{c.flag}</span>
                <span className="text-sm font-bold text-[#e0e0e0]">{c.country}</span>
              </div>
              {c.ticker !== "—" && <div className="text-[10px] text-[#22c55e] mb-1">{c.ticker}</div>}
              <p className="text-[10px] text-[#888] leading-relaxed mb-2">{c.edge}</p>
              <div className="text-[10px] font-bold" style={{ color: "#22c55e" }}>{c.metric}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#22c55e" }}>
            <div className="text-xs font-bold text-[#22c55e] uppercase tracking-wider mb-2">Non-Alignment Premium</div>
            <p className="text-xs text-[#888] leading-relaxed">Countries refusing to choose sides trade with both powers and extract concessions from both. India buys Russian oil at $30 discount AND receives US semiconductor investment.</p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#eab308" }}>
            <div className="text-xs font-bold text-[#eab308] uppercase tracking-wider mb-2">Supply Chain Rerouting</div>
            <p className="text-xs text-[#888] leading-relaxed">US-China decoupling reroutes global supply chains through neutral countries. Apple → India. Tesla → Mexico. EU → Morocco. This is structural, not cyclical.</p>
          </div>
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#ef4444" }}>
            <div className="text-xs font-bold text-[#ef4444] uppercase tracking-wider mb-2">Commodity Leverage</div>
            <p className="text-xs text-[#888] leading-relaxed">Energy transition + Hormuz crisis give commodity-rich EMs unprecedented pricing power. Indonesia (nickel), Brazil (iron ore), Saudi (oil) can name their terms.</p>
          </div>
        </div>

        {/* Historical parallels */}
        <div className="space-y-2 mb-6">
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Switzerland (1914-1945):</span> Neutral during both World Wars. Swiss banks held gold for all sides. The Swiss franc became a safe haven currency. GDP per capita surpassed all combatant nations by 1950. Neutrality was the most profitable strategy.
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Asian Tigers (1950-1990):</span> South Korea, Taiwan, Singapore, and Hong Kong exploited Cold War competition for investment from both blocs. US poured capital into Asian allies to counter communism. Annual GDP growth averaged 8%+ for three decades. Today&apos;s swing states are positioned for the same dynamic.
          </div>
          <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818] text-[10px] text-[#555] leading-relaxed">
            <span className="text-[#888] font-bold">Hormuz multiplier:</span> The US closure of Hormuz amplifies emerging market commodity leverage. Middle Eastern and African energy exporters become even more critical as alternative supply routes. Countries with overland pipeline access to China (Central Asia, Myanmar) gain strategic importance overnight.
          </div>
        </div>

        <div className="text-center">
          <Link href="/emerging-markets" className="inline-block px-6 py-3 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors">
            Full emerging markets tracker — 6 countries, ETFs, Dalio determinants →
          </Link>
        </div>

        <SectionChat
          context="Emerging market swing states in the world order transition. India, Saudi Arabia, Brazil, Indonesia, Turkey, Morocco. Non-alignment premium, supply chain rerouting, commodity leverage. Historical parallels: Switzerland in WWI/WWII, Asian Tigers during Cold War. Hormuz closure amplifies commodity leverage."
          label="Ask about emerging markets"
          suggestions={["Which swing state benefits most from Hormuz?", "How did Switzerland profit from neutrality?", "Is the non-alignment strategy sustainable?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      <div className="border-t border-[#181818]" />


      {/* ══ THE EVIDENCE ══ */}
      <section className="px-4 py-4 max-w-5xl mx-auto text-center">
        <div className="border-t border-[#222] pt-6">
          <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">The Evidence</h2>
          <p className="text-xs text-[#555]">Alliance positions and power scores across 30 economies — click any country for the full scorecard</p>
        </div>
      </section>

      {/* Alliance Tracker */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Which Side Is Each Country On?</h2>
        <p className="text-xs text-[#555] mb-4">Click any country to see its full power scorecard and investment signal.</p>

        {/* Visual summary — 3 blocs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {(["us_nato", "neutral", "china_russia"] as AllianceCamp[]).map((camp) => {
            const campCountries = sorted.filter((c) => c.allianceCamp === camp);
            const shifting = campCountries.filter((c) => c.stability !== "Stable");
            return (
              <div key={camp} className="p-4 rounded-lg border" style={{ borderColor: CAMP_COLORS[camp] + "40", backgroundColor: CAMP_COLORS[camp] + "08" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CAMP_COLORS[camp] }} />
                  <span className="text-sm font-bold text-[#e0e0e0]">{CAMP_LABELS[camp]}</span>
                  <span className="text-xs text-[#555] ml-auto">{campCountries.length} countries</span>
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
              </div>
            );
          })}
        </div>

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

      {/* Power Rankings — compact */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Global Power Rankings</h2>
        <p className="text-xs text-[#555] mb-4">Dalio&apos;s 18 determinants — who leads, who&apos;s closing the gap</p>

        {/* Top 3 highlighted */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {ranked.slice(0, 3).map((c, i) => {
            const score = getOverallScore(c.scores);
            const color = CAMP_COLORS[c.allianceCamp];
            return (
              <div key={c.code} className="p-3 rounded-lg border text-center" style={{ borderColor: color + "40", backgroundColor: color + "08" }}>
                <div className="text-xs text-[#555]">#{i + 1}</div>
                <div className="text-lg font-bold text-[#e0e0e0]">{c.name}</div>
                <div className="text-2xl font-bold mt-1" style={{ color }}>{score}</div>
                <div className="text-[10px] text-[#555] mt-1">Best: {getStrongestDeterminant(c.scores)}</div>
                <div className="text-[10px] text-[#555]">Weak: {getWeakestDeterminant(c.scores)}</div>
              </div>
            );
          })}
        </div>

        {/* Compact list for rest */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {ranked.slice(3).map((c, i) => {
            const score = getOverallScore(c.scores);
            const color = CAMP_COLORS[c.allianceCamp];
            return (
              <div key={c.code} className="flex items-center gap-2 p-2 rounded bg-[#111] border border-[#222]">
                <span className="text-xs text-[#333]">#{i + 4}</span>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-bold text-[#e0e0e0] flex-1">{c.name}</span>
                <span className="text-xs font-bold" style={{ color }}>{score}</span>
              </div>
            );
          })}
        </div>

        <SectionChat
          context="Global power rankings. Top 3: US, China, and the next closest. Based on Dalio's 18 determinants (education, tech, military, trade, finance, reserves, debt, equality, rule of law, infrastructure, resources, alliances, leadership)."
          label="Ask about power rankings"
          suggestions={["Why is China ranked where it is?", "Which country is rising fastest?", "What's the US weakest determinant?"]}
        />
      </section>


      <div className="border-t border-[#181818]" />

      <WorldOrderPosition
        title="The World Order Transition"
        subtitle="Four forces reshaping global power — and where capital flows as a result"
        cards={[
          {
            title: "US-China Power Transition",
            content: "Dalio's framework identifies the current period as Stage 5 of the big cycle — great power conflict. The US is the declining incumbent with 750+ military bases, $36.2T debt, and eroding reserve currency status. China is the rising challenger with expanding alliances (BRICS+, BRI), growing naval capability, and systematic de-dollarisation. The Hormuz closure is the latest flashpoint — the US using naval dominance to enforce economic compliance against China's shadow fleet.",
            keyMetric: "Stage 5 of 6 in Dalio's big cycle",
            status: "Critical",
          },
          {
            title: "Alliance Fragmentation",
            content: "The world is splitting into blocs faster than at any point since the Cold War. BRICS+ expanded to include Saudi Arabia, UAE, Egypt, Ethiopia, and Iran. NATO expanded to include Finland and Sweden. Swing states (India, Turkey, Indonesia, Saudi Arabia, Brazil) are playing both sides — maximising leverage by not committing. Their alignment choices will determine the balance of power.",
            keyMetric: "6 swing states control 40% of world GDP",
            status: "Accelerating",
          },
          {
            title: "De-dollarisation & Capital Flows",
            content: "USD share of global reserves fell from 72% to 58%. Central banks bought record gold (1,037 tonnes in 2023). BRICS+ is building payment alternatives (CIPS, bilateral settlements). The investment implication: assets that benefit from a multipolar financial system — gold, commodity exporters, and countries positioned as neutral trade hubs — outperform in this environment.",
            keyMetric: "USD reserves: 72% → 58%",
            status: "Accelerating",
          },
        ]}
        chatContext="The world order transition as described by Ray Dalio. US-China power competition, alliance fragmentation into blocs, de-dollarisation. How capital flows between declining powers (US), rising challengers (China), and swing states (India, Saudi, Turkey, Brazil, Indonesia)."
        chatSuggestions={[
          "Where should capital flow in this transition?",
          "Which swing states benefit most?",
          "How does this compare to the British Empire decline?",
        ]}
      />

      <div className="border-t border-[#181818]" />

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
