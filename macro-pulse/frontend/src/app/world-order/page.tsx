"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import {
  countries, DETERMINANT_LABELS, DETERMINANT_KEYS, CAMP_COLORS, CAMP_LABELS,
  SIGNAL_COLORS, getOverallScore, getStrongestDeterminant, getWeakestDeterminant,
  type CountryData, type AllianceCamp,
} from "@/lib/worldOrderData";

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
      </section>

      {/* Email Alerts */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <SubscribeForm
          title="Track Alliance Shifts"
          description="Get notified when a country's alliance position shifts — UN voting changes, major treaties, or power score movements."
          buttonLabel="Track shifts"
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
