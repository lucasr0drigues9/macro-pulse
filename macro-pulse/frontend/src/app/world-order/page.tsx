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
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">The World Order Monitor</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Which countries are winning — and where the opportunities are.
        </p>
        <p className="text-sm text-[#555] max-w-lg mx-auto mb-4">
          Tracking alliance shifts, power scores, and investment implications across 10 major economies.
        </p>
        <p className="text-[10px] text-[#333]">
          Framework based on Ray Dalio&apos;s Principles for Dealing with the Changing World Order.
        </p>
      </section>

      {/* Alliance Tracker */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Which Side Is Each Country On?</h2>
        <p className="text-xs text-[#555] mb-4">Click any country to see its full power scorecard and investment signal.</p>

        {/* Legend */}
        <div className="flex gap-4 mb-4">
          {(["us_nato", "china_russia", "neutral"] as AllianceCamp[]).map((camp) => (
            <div key={camp} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CAMP_COLORS[camp] }} />
              <span className="text-xs text-[#888]">{CAMP_LABELS[camp]}</span>
            </div>
          ))}
        </div>

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
        <SectionChat
          context="Alliance tracker showing 30 countries classified as US-aligned, China-aligned, or Non-aligned/Swing. Based on UN voting patterns, trade ties, military alliances, and diplomatic relationships. Click any country to see Dalio's 18 determinants with evidence."
          label="Ask about alliances"
          suggestions={["Which countries are shifting alignment?", "How does Hormuz affect alliance positions?", "What determines a swing state?"]}
        />
      </section>

      {/* Power Rankings */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Global Power Rankings</h2>
        <p className="text-xs text-[#555] mb-4">Ranked by overall power score across Dalio&apos;s 18 determinants</p>

        <div className="space-y-2">
          {ranked.map((c, i) => {
            const score = getOverallScore(c.scores);
            const color = CAMP_COLORS[c.allianceCamp];
            const strongest = getStrongestDeterminant(c.scores);
            const weakest = getWeakestDeterminant(c.scores);
            const sig = c.investment.signal;
            return (
              <div key={c.code} className="flex items-center gap-3 p-3 rounded-lg bg-[#111] border border-[#222]">
                <span className="text-lg font-bold text-[#333] w-8 text-right">#{i + 1}</span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="font-bold text-sm text-[#e0e0e0] w-28">{c.name}</span>
                <div className="flex-1 h-3 bg-[#181818] rounded overflow-hidden hidden sm:block">
                  <div className="h-full rounded" style={{ width: `${score * 10}%`, backgroundColor: color }} />
                </div>
                <span className="font-bold text-sm w-8" style={{ color }}>{score}</span>
                <span className="text-[10px] text-[#555] hidden md:inline w-24">Best: {strongest}</span>
                <span className="text-[10px] text-[#555] hidden md:inline w-24">Weak: {weakest}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: SIGNAL_COLORS[sig], backgroundColor: SIGNAL_COLORS[sig] + "20" }}
                >
                  {sig}
                </span>
              </div>
            );
          })}
        </div>

        <SectionChat
          context="Global power rankings based on Dalio's 18 determinants of national power (education, technology, military, trade, financial center status, reserve currency, etc). Countries ranked by overall score with strongest/weakest determinant shown."
          label="Ask about power rankings"
          suggestions={["Why is China ranked where it is?", "Which country is rising fastest?", "How does military spending affect the ranking?"]}
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
      </section>

      {/* Debt */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Financial Burden</h2>
        <p className="text-xs text-[#555] mb-6">Wars are financed by debt. Debt devalues currency. Dalio&apos;s principle: sell debt, buy gold.</p>
        <div className="space-y-6">
          <LineChart data={debtTimeline} xKey="year" yKey="debt" label="US National Debt ($T) — 2000 to 2026" color={ACCENT} />
          <LineChart data={debtTimeline} xKey="year" yKey="gdpPct" label="Debt as % of GDP — 2000 to 2026" color="#ef4444"
            thresholds={[{ value: 80, label: "80% warning", color: "#eab308" }, { value: 100, label: "100% critical", color: "#ef4444" }]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LineChart data={debtTimeline} xKey="year" yKey="usdReserve" label="USD Share of Global Reserves (%)" color="#3b82f6" />
            <LineChart data={debtTimeline} xKey="year" yKey="goldPrice" label="Gold Price ($/oz) — inverse of USD confidence" color="#eab308" />
          </div>
        </div>
        <SectionChat
          context="US debt trajectory. $36.2T (125% GDP). Interest exceeded defence spending in 2024. CBO projects 166% by 2054."
          label="Ask about the debt"
          suggestions={["When does debt become unsustainable?", "What protects against debasement?", "How does this compare to Japan?"]}
        />
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
      </section>

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
            <Link href="/europe" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2">European Autonomy →</Link>
          </div>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* ══ EUROPEAN AUTONOMY — The emerging third pole ══ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-2">The Emerging Third Pole</h2>
        <p className="text-xl font-bold text-[#e0e0e0] mb-1">European Strategic Autonomy</p>
        <p className="text-xs text-[#555] mb-6">Europe is structurally building independence in defence, energy, and technology. The companies enabling this have outperformed SPY in every sector since Russia invaded Ukraine.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#6b8e5a" }}>
            <div className="text-xs font-bold text-[#6b8e5a] uppercase tracking-wider mb-2">Defence</div>
            <div className="text-2xl font-bold text-[#e0e0e0] mb-1">EUAD</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">iShares European Defence UCITS ETF — pure-play European rearmament. Rheinmetall, BAE, Leonardo, Saab. {"\u20AC"}800B ReArm Europe fund.</p>
            <div className="text-xs text-[#22c55e]">Works in all regimes — policy-driven spending</div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#e09030" }}>
            <div className="text-xs font-bold text-[#e09030] uppercase tracking-wider mb-2">Energy Independence</div>
            <div className="text-2xl font-bold text-[#e0e0e0] mb-1">IOGP</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">iShares Oil &amp; Gas UCITS — Equinor, TotalEnergies, Shell. Russian gas share fell from 40% to 8%.</p>
            <div className="text-xs text-[#ef4444]">Stagflation pick + structural energy thesis</div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#3b82f6" }}>
            <div className="text-xs font-bold text-[#3b82f6] uppercase tracking-wider mb-2">Technology Sovereignty</div>
            <div className="text-2xl font-bold text-[#e0e0e0] mb-1">ASML</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">100% global monopoly on EUV lithography. Every advanced chip requires their equipment. The EU Chips Act ({"\u20AC"}43B) backstops this.</p>
            <div className="text-xs text-[#eab308]">Single stock risk — but no ETF alternative exists</div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border-l-2 border border-[#222]" style={{ borderLeftColor: "#a855f7" }}>
            <div className="text-xs font-bold text-[#a855f7] uppercase tracking-wider mb-2">Critical Materials</div>
            <div className="text-2xl font-bold text-[#e0e0e0] mb-1">NHY</div>
            <p className="text-xs text-[#888] leading-relaxed mb-2">Norsk Hydro — lowest-carbon aluminium globally. Critical for defence, aerospace, EVs. Norwegian, NOK denominated, Nordnet accessible.</p>
            <div className="text-xs text-[#22c55e]">Stagflation + Reflation pick</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded bg-[#111] border border-[#222] text-center">
            <div className="text-xs text-[#555]">Defence spending</div>
            <div className="text-lg font-bold text-[#e0e0e0]">1.5% → 2.5%+</div>
            <div className="text-[10px] text-[#555]">GDP commitment</div>
          </div>
          <div className="p-3 rounded bg-[#111] border border-[#222] text-center">
            <div className="text-xs text-[#555]">Russian gas</div>
            <div className="text-lg font-bold text-[#e0e0e0]">40% → 8%</div>
            <div className="text-[10px] text-[#555]">of EU imports</div>
          </div>
          <div className="p-3 rounded bg-[#111] border border-[#222] text-center">
            <div className="text-xs text-[#555]">EUAD since launch</div>
            <div className="text-lg font-bold text-[#22c55e]">+820%</div>
            <div className="text-[10px] text-[#555]">Rheinmetall</div>
          </div>
          <div className="p-3 rounded bg-[#111] border border-[#222] text-center">
            <div className="text-xs text-[#555]">EU Chips Act</div>
            <div className="text-lg font-bold text-[#e0e0e0]">{"\u20AC"}43B</div>
            <div className="text-[10px] text-[#555]">semiconductor investment</div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/europe" className="inline-block px-6 py-3 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors">
            Full European tracker — regime, allocation, 25+ companies →
          </Link>
        </div>

        <SectionChat
          context="European strategic autonomy section within the World Order Monitor. Four key positions: EUAD (defence), IOGP (energy), ASML (technology), NHY (materials). Europe building independence forced by Ukraine war + Hormuz crisis. Defence spending 1.5→2.5%+ GDP. Russian gas 40→8%."
          label="Ask about European autonomy"
          suggestions={["Why is EUAD up 820%?", "Does European autonomy work in all regimes?", "How does Hormuz accelerate this?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      <WorldOrderPosition
        title="The World Order Transition"
        subtitle="Three forces reshaping global power — and where capital flows as a result"
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
