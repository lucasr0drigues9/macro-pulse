"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import SectionChat from "@/components/SectionChat";
import WorldOrderPosition from "@/components/WorldOrderPosition";
import PeriodChat from "@/components/PeriodChat";
import { apiUrl } from "@/lib/api";
import {
  ACCENT, strategicCards,
} from "@/lib/chinaData";

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444", Goldilocks: "#22c55e", Reflation: "#eab308", Deflation: "#3b82f6",
};

const chinaUcitsMapping = [
  { us: "GLD", ucits: "SGLD.L", name: "Invesco Physical Gold ETC", exchange: "London", regimes: "Stagflation, Deflation" },
  { us: "DBC", ucits: "EXXY.DE", name: "iShares Diversified Commodity Swap UCITS", exchange: "Xetra", regimes: "Stagflation" },
  { us: "EWH", ucits: "XCHA.L", name: "Xtrackers FTSE China 50 UCITS (closest proxy)", exchange: "London", regimes: "Stagflation" },
  { us: "FXI", ucits: "XCHA.L", name: "Xtrackers FTSE China 50 UCITS", exchange: "London", regimes: "Reflation, Goldilocks" },
  { us: "CHIQ", ucits: "XCHA.L", name: "Xtrackers FTSE China 50 UCITS (no direct consumer UCITS)", exchange: "London", regimes: "Reflation" },
  { us: "COPX", ucits: "COPP.L", name: "Global X Copper Miners UCITS", exchange: "London", regimes: "Reflation" },
  { us: "KWEB", ucits: "KWEB.L", name: "KraneShares CSI China Internet UCITS", exchange: "London", regimes: "Goldilocks" },
  { us: "AAXJ", ucits: "EIMI.L", name: "iShares MSCI EM IMI UCITS", exchange: "London", regimes: "Goldilocks" },
  { us: "TLT", ucits: "DTLA.L", name: "iShares USD Treasury Bond 20+yr UCITS", exchange: "London", regimes: "Deflation" },
  { us: "AGG", ucits: "IUAA.L", name: "iShares US Aggregate Bond UCITS", exchange: "London", regimes: "Deflation" },
];

function ChinaUcitsMapping() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-6">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#e0e0e0]">European Investors — UCITS Equivalents</h3>
            <p className="text-xs text-[#555]">EU/EEA regulated alternatives available on Nordnet and other European brokers</p>
          </div>
          <span className="text-[#555] text-sm">{expanded ? "−" : "+"}</span>
        </div>
      </button>
      {expanded && (
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#555] uppercase tracking-wider border-b border-[#222]">
                  <th className="text-left py-2 pr-2">US ETF</th>
                  <th className="text-left py-2 pr-2">UCITS</th>
                  <th className="text-left py-2 pr-2 hidden sm:table-cell">Name</th>
                  <th className="text-left py-2">Regimes</th>
                </tr>
              </thead>
              <tbody>
                {chinaUcitsMapping.map((row) => (
                  <tr key={`${row.us}-${row.ucits}`} className="border-b border-[#181818]">
                    <td className="py-2 pr-2 text-[#e0e0e0] font-bold">{row.us}</td>
                    <td className="py-2 pr-2 text-[#eab308]">{row.ucits}</td>
                    <td className="py-2 pr-2 text-[#888] hidden sm:table-cell">{row.name}</td>
                    <td className="py-2 text-[#555]">{row.regimes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-[#555]">
              No direct UCITS equivalent for CHIQ (China Consumer). Use <span className="text-[#eab308]">XCHA.L</span> (China 50) as the closest alternative — it holds the largest Chinese companies including consumer names.
            </p>
            <p className="text-xs text-[#555]">
              For ASK accounts on Nordnet, prefer accumulating (Acc) versions to avoid dividend tax drag. All listed ETFs are available on London Stock Exchange (.L) or Xetra (.DE).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

type ChinaRegime = {
  regime: string; proxyRegime?: string; geoRegime?: string; geoContext?: string; lagWarning?: boolean;
  growth: string; inflation: string; confidence: string; consecutiveMonths: number; periodStart?: string;
  indicators?: {
    copper?: { value: number; momentum3m: number };
    fxi?: { value: number; momentum3m: number };
    cnh?: { value: number; change1m: number };
    cpi?: { value: number; date: string };
  };
};
type Allocation = { regime: string; periodStart?: string; cashTarget: number; overweight: { ticker: string; name: string; weight: number; conviction: number; rationale: string; returnSinceRegime?: number | null }[]; underweight: { ticker: string; name: string; reason: string; returnSinceRegime?: number | null }[] };
type Trigger = { name: string; current: string; threshold: string; status: string; action: string; urgency: string };
type TransitionData = { currentRegime: string; durationStats: { months: number }; outlook: { regime: string; probability: number; description: string; signals: string[]; etfs: { ticker: string; name: string; conviction: number; returnSinceRegime?: number | null }[] }[] };
type BacktestEntry = { regime: string; start: string; end: string; months: number; current?: boolean; signalStrength?: string; signalContext?: string; picksReturn: number | null; allRegimeReturns: Record<string, number | null>; bestRegime: string | null; frameworkCorrect: boolean | null; aiRegime?: string; aiPicksReturn?: number | null; aiDiffersFromProxy?: boolean; aiCorrect?: boolean | null; regimeETFs?: Record<string, string[]> };
type ChinaBacktest = { totalRegimes: number; yearRange: string; timeline: BacktestEntry[]; regimeBreakdown: Record<string, number> };

export default function ChinaPage() {
  const [regime, setRegime] = useState<ChinaRegime | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [transition, setTransition] = useState<TransitionData | null>(null);
  const [backtest, setBacktest] = useState<ChinaBacktest | null>(null);
  const [expandedTimeline, setExpandedTimeline] = useState<number | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/china/regime")).then((r) => r.json()).then((d) => { if (!d.error) setRegime(d); }).catch(() => {});
    fetch(apiUrl("/api/china/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setAllocation(d); }).catch(() => {});
    fetch(apiUrl("/api/china/triggers")).then((r) => r.json()).then((d) => { if (d.triggers) setTriggers(d.triggers); }).catch(() => {});
    fetch(apiUrl("/api/china/transition")).then((r) => r.json()).then((d) => { if (!d.error) setTransition(d); }).catch(() => {});
    fetch(apiUrl("/api/china/backtest")).then((r) => r.json()).then((d) => { if (!d.error) setBacktest(d); }).catch(() => {});
  }, []);

  const r = regime || { regime: "Deflation", proxyRegime: "Deflation", geoRegime: "Deflation", geoContext: "", lagWarning: false, growth: "falling", inflation: "falling", confidence: "Medium", consecutiveMonths: 18 };
  const regimeColor = REGIME_COLORS[r.regime] || "#888";

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Header */}
      <section className="px-4 pt-12 pb-4 max-w-5xl mx-auto">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">China Tracker</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          How China affects the AI & Robotics Race
        </p>
        <p className="text-xs text-[#555] max-w-2xl mb-4">
          China controls 60% of rare earth mining, 90% of processing, and installs more industrial robots than the rest of the world combined. The Chinese regime determines rare earth supply risk (REMX), copper demand (COPX), and whether the AI & Robotics Race supply chain faces bottlenecks or abundance.
        </p>
        <div className="p-3 rounded bg-[#111] border border-[#222] mt-4">
          <p className="text-xs text-[#555] italic leading-relaxed">
            Official Chinese data is unreliable. This tracker uses proxy indicators — the Li Keqiang approach: track what moves markets (FXI, copper, CNH) instead of what Beijing reports.
          </p>
        </div>
        <SectionChat
          context="China Tracker on Macro World View. Uses proxy indicators (Li Keqiang index, Caixin PMI, port throughput, copper imports, property prices, PPI) instead of official Chinese data to detect the real economic regime. Applies the same four-season framework as the US tracker."
          label="Ask about this tool"
          suggestions={["Why not use official Chinese data?", "How does this compare to the US tracker?", "What is the Li Keqiang index?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* Regime Signal */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Current Regime — Proxy Based</h2>
        <p className="text-xs text-[#555] mb-4">Same four-quadrant framework as the US tracker, but using proxy data</p>

        <div className="text-center py-10 rounded-lg border" style={{ borderColor: regimeColor + "40", backgroundColor: regimeColor + "10" }}>
          <div className="text-5xl sm:text-7xl font-bold tracking-tight" style={{ color: regimeColor }}>
            {r.regime}
          </div>
          <div className="mt-2 text-sm text-[#888]">
            Month {r.consecutiveMonths} · Since {r.periodStart || "—"} · Confidence: {r.confidence}
          </div>
          <div className="mt-2 flex justify-center gap-6 text-xs">
            <span className="text-[#555]">Growth: <span style={{ color: r.growth === "falling" ? "#ef4444" : "#22c55e" }}>{r.growth}</span></span>
            <span className="text-[#555]">Inflation: <span style={{ color: r.inflation === "falling" ? "#3b82f6" : "#ef4444" }}>{r.inflation}</span></span>
          </div>
        </div>

        {/* Proxy signal source */}
        <div className="mt-4 p-3 rounded-lg bg-[#111] border border-[#222]">
          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Proxy Data Signal</div>
          <div className="text-xs text-[#888] leading-relaxed">
            Based on Li Keqiang index, Caixin PMI, PPI, property prices, port throughput, and copper imports — the same metrics Chinese officials reportedly track internally. Confidence is still lower than the US tracker due to Chinese data opacity.
          </div>
        </div>

        <SectionChat
          context="Current China regime signal. Shows the regime based on proxy indicators (not official data). Current reading and growth/inflation direction."
          label="Ask about this regime"
          suggestions={["How confident should I be in this signal?", "What would flip this to Reflation?", "How does PBOC policy affect the regime?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* Live Market Indicators */}
      {regime?.indicators && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Live Market Signals</h2>
          <p className="text-xs text-[#555] mb-4">Real-time data driving the regime calculation — updated daily from global markets.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { key: "copper" as const, label: "Copper (Growth · 30%)", subtitle: "Diluted by energy transition + Hormuz premium", prefix: "$" },
              { key: "fxi" as const, label: "FXI (Growth · 70%)", subtitle: "Purest real-time signal on China", prefix: "$" },
            ].map(({ key, label, subtitle, prefix }) => {
              const ind = regime.indicators?.[key] as { value: number; momentum3m: number; recent6mAvg?: number; prior6mAvg?: number; trend?: string; history?: { date: string; value: number }[] } | undefined;
              if (!ind) return null;
              const trendColor = ind.trend === "rising" ? "#22c55e" : "#ef4444";
              const trendLabel = ind.trend === "rising" ? "Trending up" : "Trending down";
              return (
                <div key={key} className="p-3 rounded-lg bg-[#111] border border-[#222]">
                  <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{label}</div>
                  <div className="text-lg font-bold text-[#e0e0e0]">{prefix}{ind.value}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${ind.momentum3m >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      3m: {ind.momentum3m >= 0 ? "+" : ""}{ind.momentum3m}%
                    </span>
                    <span className="text-[10px]" style={{ color: trendColor }}>{trendLabel}</span>
                  </div>
                  {/* Sparkline */}
                  {ind.history && ind.history.length > 3 && (() => {
                    const vals = ind.history.map((h) => h.value);
                    const min = Math.min(...vals) * 0.97;
                    const max = Math.max(...vals) * 1.03;
                    const range = max - min || 1;
                    const w = 120, h = 30, px = 2, py = 2;
                    const points = vals.map((v, i) => {
                      const x = px + (i / (vals.length - 1)) * (w - px * 2);
                      const y = py + (1 - (v - min) / range) * (h - py * 2);
                      return `${x},${y}`;
                    }).join(" ");
                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 mt-1">
                        <polyline points={points} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    );
                  })()}
                  <div className="text-[10px] text-[#555] mt-1">{subtitle}</div>
                </div>
              );
            })}
            {regime.indicators.cnh && (
              <div className="p-3 rounded-lg bg-[#111] border border-[#222]">
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">USD/CNH (Yuan)</div>
                <div className="text-lg font-bold text-[#e0e0e0]">{regime.indicators.cnh.value}</div>
                <div className={`text-xs font-bold ${regime.indicators.cnh.change1m <= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  1m: {regime.indicators.cnh.change1m >= 0 ? "+" : ""}{regime.indicators.cnh.change1m}%
                  <span className="text-[#555] font-normal ml-1">({regime.indicators.cnh.change1m > 0 ? "weakening" : "strengthening"})</span>
                </div>
                <div className="text-[10px] text-[#555] mt-1">Capital flow direction</div>
              </div>
            )}
            {regime.indicators.cpi && (() => {
              const cpi = regime.indicators.cpi as { value: number; date: string; recent6mAvg?: number; prior6mAvg?: number; trend?: string; history?: { date: string; value: number }[] };
              const trendColor = cpi.trend === "rising" ? "#eab308" : "#3b82f6";
              const trendLabel = cpi.trend === "rising" ? "Rising toward zero" : "Falling deeper";
              return (
                <div className="p-3 rounded-lg bg-[#111] border border-[#222]">
                  <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">CPI YoY (Inflation)</div>
                  <div className="text-lg font-bold text-[#e0e0e0]">{cpi.value}%</div>
                  <div className="text-xs font-bold" style={{ color: trendColor }}>{trendLabel}</div>
                  {/* Sparkline */}
                  {cpi.history && cpi.history.length > 3 && (() => {
                    const vals = cpi.history.map((h) => h.value);
                    const min = Math.min(...vals) - 0.3;
                    const max = Math.max(...vals) + 0.3;
                    const range = max - min || 1;
                    const w = 120, h = 30, px = 2, py = 2;
                    const points = vals.map((v, i) => {
                      const x = px + (i / (vals.length - 1)) * (w - px * 2);
                      const y = py + (1 - (v - min) / range) * (h - py * 2);
                      return `${x},${y}`;
                    }).join(" ");
                    // Zero line
                    const zeroY = py + (1 - (0 - min) / range) * (h - py * 2);
                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 mt-1">
                        <line x1={px} y1={zeroY} x2={w - px} y2={zeroY} stroke="#333" strokeWidth="0.5" strokeDasharray="2,2" />
                        <polyline points={points} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    );
                  })()}
                  <div className="text-[10px] text-[#333] mt-1">FRED — {cpi.date.slice(0, 7)}</div>
                </div>
              );
            })()}
          </div>

          <div className="p-3 rounded bg-[#111] border border-[#222]">
            <p className="text-[10px] text-[#888] leading-relaxed">
              <span className="text-[#e0e0e0] font-bold">How this drives the regime:</span> Growth is measured primarily by FXI equity sentiment (70% weight) supplemented by copper demand (30% weight). Copper is increasingly driven by the global energy transition and Hormuz premium rather than Chinese demand alone — FXI is a purer China signal. Inflation uses FRED China CPI (monthly, lagged but real). Yuan direction confirms: weakening = capital flight (bearish), strengthening = confidence (bullish). All data from public markets — no reliance on Chinese official statistics.
            </p>
          </div>
        </section>
      )}

      <div className="border-t border-[#181818]" />

      {/* China Allocation */}
      {allocation && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">China Regime Allocation</h2>
          <p className="text-xs text-[#555] mb-4">
            ETF positioning for China {allocation.regime} — {allocation.cashTarget}% cash due to higher uncertainty.
            {allocation.periodStart && (
              <span className="text-[#888]"> Returns shown since regime started ({allocation.periodStart}).</span>
            )}
          </p>
          <div className="space-y-2 mb-4">
            {allocation.overweight.map((etf) => (
              <div key={etf.ticker} className="p-3 rounded-lg bg-[#111] border border-[#222] flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2 sm:w-48">
                  <span className="text-sm font-bold text-[#22c55e]">{etf.weight}%</span>
                  <span className="text-sm font-bold text-[#e0e0e0]">{etf.ticker}</span>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-[#888]">{etf.name}</span>
                  <p className="text-[10px] text-[#555] mt-0.5">{etf.rationale}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {typeof etf.returnSinceRegime === "number" && (
                    <span className={`text-sm font-bold ${etf.returnSinceRegime >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {etf.returnSinceRegime >= 0 ? "+" : ""}{etf.returnSinceRegime}%
                    </span>
                  )}
                  <span className="text-[10px] text-[#555]">Conv: {etf.conviction}</span>
                </div>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-[#111] border border-[#222] flex items-center gap-2">
              <span className="text-sm font-bold text-[#eab308]">{allocation.cashTarget}%</span>
              <span className="text-sm text-[#888]">Cash</span>
              <span className="text-xs text-[#555] ml-auto">Higher than US/EU due to China data uncertainty + geopolitical risk</span>
            </div>
          </div>
          {allocation.underweight.length > 0 && (
            <div className="p-3 rounded bg-[#0a0a0a] border border-[#181818]">
              <div className="text-[10px] text-[#ef4444] uppercase tracking-wider mb-2">Avoid during China {allocation.regime}</div>
              <div className="space-y-1">
                {allocation.underweight.map((u) => (
                  <div key={u.ticker} className="flex items-center gap-2 text-xs">
                    <span className="text-[#e0e0e0] font-bold">{u.ticker}</span>
                    <span className="text-[#555]">{u.name}</span>
                    {typeof u.returnSinceRegime === "number" && (
                      <span className={`font-bold ${u.returnSinceRegime >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {u.returnSinceRegime >= 0 ? "+" : ""}{u.returnSinceRegime}%
                      </span>
                    )}
                    <span className="text-[#333]">— {u.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Global context warning */}
          <div className="p-3 rounded bg-[#eab30808] border border-[#eab30830] mb-4">
            <p className="text-xs text-[#eab308] font-bold mb-1">These picks assume China&apos;s regime in isolation</p>
            <p className="text-[10px] text-[#888] leading-relaxed">
              When global regimes conflict, the dominant signal often overpowers regional picks. Right now the US is in Stagflation — which pushes bond yields up (hurting TLT) and commodity prices up (boosting copper miners like COPX). The <a href="/" className="text-[#eab308] underline underline-offset-2">Global Regime Signal on the home page</a> shows the combined view across all three economies.
            </p>
          </div>

          {/* Cross-regime outperformer alert */}
          {(() => {
            const outperformers = allocation.underweight
              .filter((u) => typeof u.returnSinceRegime === "number" && u.returnSinceRegime > 10)
              .sort((a, b) => (b.returnSinceRegime || 0) - (a.returnSinceRegime || 0));
            if (outperformers.length === 0) return null;

            // Contextual explanations per ticker
            const explanations: Record<string, { driver: string; globalLink: string; signal: string }> = {
              COPX: {
                driver: "Energy transition demand (EVs, grid, renewables) + Hormuz commodity premium",
                globalLink: "Copper demand is structural and global — doesn't depend on China reflating. US Stagflation adds commodity premium on top.",
                signal: "If copper stays strong while China deflates, it means demand is coming from elsewhere. Watch for China PMI to confirm or deny.",
              },
              FXI: {
                driver: "Anticipation of PBOC stimulus or reopening-like bounce",
                globalLink: "Markets may be pricing in a policy response before it shows up in data. Chinese equities rallied 40%+ in late 2022 before any data confirmed the pivot.",
                signal: "If FXI rises while copper falls, it's speculation not fundamentals. Both rising together = genuine reflation signal.",
              },
              CHIQ: {
                driver: "Chinese consumer recovery expectations or rotation from US growth stocks",
                globalLink: "When US Stagflation hurts US tech, some capital rotates to undervalued Chinese consumer names.",
                signal: "Sustainable only if domestic consumption data (retail sales, consumer confidence) improves.",
              },
              AAXJ: {
                driver: "Broad Asia ex-Japan benefits from supply chain rerouting and India growth",
                globalLink: "AAXJ captures India, Korea, Taiwan alongside China — the non-China components may be driving returns.",
                signal: "Check if AAXJ is up because of India/Korea or because of China. FXI relative performance tells you.",
              },
              EEM: {
                driver: "Broad emerging market rally from commodity prices and dollar weakness",
                globalLink: "When USD weakens during Stagflation, EM assets mechanically appreciate in dollar terms.",
                signal: "Dollar direction (DXY) is the key variable — if dollar strengthens, EM gains reverse quickly.",
              },
              DBC: {
                driver: "Broad commodity basket benefits from Hormuz oil disruption + global inflation",
                globalLink: "DBC is in both the China Stagflation and US Stagflation baskets. It's responding to the dominant global signal, not China specifically.",
                signal: "This is the US Stagflation signal bleeding into China metrics. The Global Regime Signal captures this correctly.",
              },
            };

            return (
              <div className="p-4 rounded bg-[#22c55e08] border border-[#22c55e30] mb-4">
                <p className="text-xs text-[#22c55e] font-bold mb-2">Cross-regime outperformers — why are they up?</p>
                <div className="space-y-3">
                  {outperformers.map((u) => {
                    const ctx = explanations[u.ticker];
                    return (
                      <div key={u.ticker} className="p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#e0e0e0]">{u.ticker} <span className="text-[#555] font-normal">{u.name}</span></span>
                          <span className="text-sm font-bold text-[#22c55e]">+{u.returnSinceRegime}%</span>
                        </div>
                        {ctx ? (
                          <div className="space-y-1.5">
                            <div className="text-[10px] leading-relaxed">
                              <span className="text-[#e0e0e0] font-bold">What&apos;s driving it: </span>
                              <span className="text-[#888]">{ctx.driver}</span>
                            </div>
                            <div className="text-[10px] leading-relaxed">
                              <span className="text-[#e0e0e0] font-bold">Global connection: </span>
                              <span className="text-[#888]">{ctx.globalLink}</span>
                            </div>
                            <div className="text-[10px] leading-relaxed">
                              <span className="text-[#e0e0e0] font-bold">What to watch: </span>
                              <span className="text-[#888]">{ctx.signal}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-[#555]">{u.reason}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <SectionChat
                  context={`Cross-regime outperformers on the China page. Current regime: ${allocation.regime}. These ETFs from other baskets are outperforming: ${outperformers.map((u) => `${u.ticker} +${u.returnSinceRegime}%`).join(", ")}. US is in Stagflation which drives commodity and energy assets higher globally. The question is whether this signals a China regime shift or just US dominance.`}
                  label="Ask about these outperformers"
                  suggestions={["Is this a regime shift signal?", "Should I buy the outperformers instead?", "How do I tell if copper is rising because of China or because of Hormuz?"]}
                />
              </div>
            );
          })()}

          <SectionChat
            context="China regime allocation with global context warning. When US Stagflation dominates, it can hurt China Deflation picks (TLT down from rising yields) while boosting cross-regime assets (copper miners up from commodity premium). The Global Regime Signal on the home page shows the combined view."
            label="Ask about China allocation"
            suggestions={["Why is TLT down despite China Deflation?", "Should I follow China picks or global signal?", "Why is COPX outperforming?"]}
          />

          {/* UCITS Mapping */}
          <ChinaUcitsMapping />
        </section>
      )}

      <div className="border-t border-[#181818]" />

      {/* China Triggers */}
      {triggers.length > 0 && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">China Regime Triggers</h2>
          <p className="text-xs text-[#555] mb-4">Thresholds that would shift the Chinese regime signal</p>
          <div className="space-y-2">
            {triggers.map((t) => {
              const statusColor = t.status === "crisis" ? "#ef4444" : t.status === "watch" ? "#eab308" : "#22c55e";
              const statusLabel = t.status === "crisis" ? "CRISIS" : t.status === "watch" ? "WATCH" : "STABLE";
              return (
                <div key={t.name} className="p-3 rounded-lg bg-[#111] border border-[#222] flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 sm:w-56">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: statusColor, backgroundColor: statusColor + "20" }}>{statusLabel}</span>
                    <span className="text-sm font-bold text-[#e0e0e0]">{t.name}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#888]">Current: <span className="text-[#e0e0e0]">{t.current}</span></div>
                    <div className="text-[10px] text-[#555] mt-0.5">{t.threshold}</div>
                  </div>
                  <div className="text-xs text-[#555] sm:text-right sm:max-w-[180px]">{t.action}</div>
                </div>
              );
            })}
          </div>
          <SectionChat
            context="China regime triggers: PBOC LPR rate, Caixin PMI, PPI, property prices, USD/CNH, Taiwan strait risk. Shows which indicators are in crisis, watch, or stable status."
            label="Ask about China triggers"
            suggestions={["Which trigger matters most right now?", "What would PBOC easing do?", "How does Hormuz affect China?"]}
          />
        </section>
      )}

      <div className="border-t border-[#181818]" />

      {/* China Transition Outlook */}
      {transition && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">China Transition Radar</h2>
          <p className="text-xs text-[#555] mb-1">Current regime ETFs + what to rotate into when the regime shifts</p>
          <p className="text-xs text-[#888] mb-4">
            Current: <span className="font-bold" style={{ color: REGIME_COLORS[transition.currentRegime] || "#888" }}>{transition.currentRegime}</span> — Month {transition.durationStats.months}
          </p>

          {/* Current regime ETFs */}
          {allocation && (
            <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: (REGIME_COLORS[transition.currentRegime] || "#888") + "40", backgroundColor: (REGIME_COLORS[transition.currentRegime] || "#888") + "10" }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: REGIME_COLORS[transition.currentRegime] || "#888" }}>
                Current picks — {transition.currentRegime}
              </div>
              <div className="space-y-1.5">
                {allocation.overweight.map((etf) => (
                  <div key={etf.ticker} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#e0e0e0]">{etf.ticker}</span>
                      <span className="text-[#555] ml-2">{etf.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {typeof etf.returnSinceRegime === "number" && (
                        <span className={`font-bold ${etf.returnSinceRegime >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {etf.returnSinceRegime >= 0 ? "+" : ""}{etf.returnSinceRegime}%
                        </span>
                      )}
                      <span className="text-[#555]">{etf.weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-3">If the regime shifts → rotate to:</div>
          <div className="space-y-4">
            {transition.outlook.map((o) => {
              const color = REGIME_COLORS[o.regime] || "#888";
              return (
                <div key={o.regime} className="rounded-lg border overflow-hidden" style={{ borderColor: color + "30" }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: color + "10" }}>
                    <div>
                      <span className="text-sm font-bold" style={{ color }}>{o.regime}</span>
                      <span className="text-xs text-[#555] ml-2">{o.probability}% probability</span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-[#888] mb-2">{o.description}</p>
                    {o.signals.length > 0 && (
                      <div className="mb-2">
                        <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Confirmation signals</div>
                        {o.signals.map((s, i) => (
                          <div key={i} className="text-[10px] text-[#888]">• {s}</div>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">ETFs to buy if this transition confirms</div>
                    <div className="space-y-1.5">
                      {o.etfs.map((e) => (
                        <div key={e.ticker} className="p-2 rounded bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#e0e0e0]">{e.ticker}</span>
                            <span className="text-[10px] text-[#555] ml-2">{e.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {typeof e.returnSinceRegime === "number" && (
                              <span className={`text-xs font-bold ${e.returnSinceRegime >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                                {e.returnSinceRegime >= 0 ? "+" : ""}{e.returnSinceRegime}%
                              </span>
                            )}
                            <span className="text-[10px] text-[#555]">Conv: {e.conviction}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <SectionChat
            context="China transition outlook. Shows probability of transitioning from current Deflation to Reflation (Tepper thesis), Goldilocks, or Stagflation. Each scenario has confirmation signals and ETFs to watch."
            label="Ask about China transitions"
            suggestions={["Is the Tepper thesis still alive?", "What would confirm China reflation?", "How does the Hormuz closure affect this?"]}
          />
        </section>
      )}

      <div className="border-t border-[#181818]" />

      {/* US vs China Regime Comparison */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Two Economies. Two Regimes.</h2>
        <p className="text-xs text-[#555] mb-6">When US and Chinese regimes diverge, specific opportunities emerge.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg border border-[#222]" style={{ backgroundColor: "#ef444410", borderColor: "#ef444430" }}>
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">US Regime (FRED + Geo)</div>
            <div className="text-2xl font-bold text-[#ef4444]">Stagflation</div>
            <div className="text-xs text-[#555] mt-1">Growth: slowing · Inflation: rising (energy-driven)</div>
            <div className="text-xs text-[#888] mt-2">Picks: XLE, GLD, DBC, XLP, XLU</div>
          </div>
          <div className="p-4 rounded-lg border border-[#222]" style={{ backgroundColor: regimeColor + "10", borderColor: regimeColor + "30" }}>
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">China Regime (Proxy)</div>
            <div className="text-2xl font-bold" style={{ color: regimeColor }}>{r.regime}</div>
            <div className="text-xs text-[#555] mt-1">Growth: {r.growth} · Inflation: {r.inflation}</div>
            <div className="text-xs text-[#888] mt-2">Month {r.consecutiveMonths} · Confidence: {r.confidence}</div>
          </div>
        </div>

        <div className="p-3 rounded bg-[#111] border border-[#eab30830]" style={{ backgroundColor: "#eab30810" }}>
          <div className="text-xs text-[#eab308] font-bold mb-1">Regime divergence detected</div>
          <p className="text-xs text-[#888] leading-relaxed">
            US in Stagflation (energy-driven from Hormuz closure) while China in {r.regime} (property crisis, demand collapse). Historical pattern: when the world&apos;s two largest economies are both stressed but for different reasons, real assets (GLD, DBC) outperform both countries&apos; equities. The Hormuz full closure adds a new dimension — China&apos;s shadow fleet supply route is cut, potentially forcing a direct confrontation.
          </p>
        </div>

        <SectionChat
          context="US vs China regime comparison. US in Stagflation (Hormuz-driven energy crisis). China in Deflation (property crisis). Divergence creates opportunities in real assets. The Hormuz full closure cuts China's shadow fleet oil supply from Iran."
          label="Ask about the divergence"
          suggestions={["What assets benefit from this divergence?", "Has this combination happened before?", "What resolves the divergence?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      <WorldOrderPosition
        title="China in the World Order Transition"
        subtitle="Three dimensions of China's strategic trajectory as the rising challenger"
        cards={strategicCards}
        accent={ACCENT}
        chatContext="China's strategic position in the world order: Alliance expansion (Russia, Iran, BRICS+, BRI 140+ countries), Economic decoupling (CIPS $20T+, yuan 4.7% of trade), and Taiwan risk (Dalio 30-40% conflict probability). China is the rising power in Dalio's framework, challenging US dominance."
        chatSuggestions={[
          "How does the Hormuz closure affect China?",
          "Is de-dollarisation accelerating?",
          "What's the Taiwan invasion probability?",
        ]}
      />

      <div className="border-t border-[#181818]" />

      {/* China Regime History */}
      {backtest && (
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">
            {backtest.totalRegimes} Regimes. {backtest.yearRange}. Every China Call.
          </h2>
          <p className="text-xs text-[#555] mb-2">
            Historical regime timeline based on proxy indicators — same four-quadrant framework applied to China&apos;s real economy.
          </p>
          <div className="p-3 rounded bg-[#111] border border-[#222] mb-4">
            <p className="text-xs text-[#888] leading-relaxed mb-2">
              <span className="text-[#e0e0e0] font-bold">Why this backtest works differently:</span> The US and EU trackers derive regimes automatically from monthly data feeds (FRED/Eurostat). For China, we tested every available proxy combination:
            </p>
            <ul className="text-[10px] text-[#555] space-y-1 list-disc list-inside mb-2">
              <li>Imports YoY + CPI momentum → <span className="text-[#ef4444]">28% accuracy</span> (worse than random)</li>
              <li>Exports YoY + CPI YoY → <span className="text-[#ef4444]">0% match</span> with known economic reality</li>
              <li>Copper YoY + CPI acceleration → <span className="text-[#ef4444]">11% accuracy</span></li>
            </ul>
            <p className="text-[10px] text-[#888] leading-relaxed mb-2">
              <span className="text-[#e0e0e0]">The root cause:</span> Chinese CPI stays between +1% and +4% even during deep deflation (2022 lockdowns, 2023 property crisis). The real deflation signal is <span className="text-[#e0e0e0]">PPI</span> (producer prices), which went to -3% — but PPI isn&apos;t available via any free API (FRED, World Bank, OECD all lack it).
            </p>
            <p className="text-[10px] text-[#888] leading-relaxed">
              So this timeline uses expert-curated periods based on PPI + GDP + proxy indicators, verified against known economic events. <span className="text-[#e0e0e0]">The ETF returns are real market data</span> — the regime labels are the curated part. This is transparency over false precision.
            </p>
          </div>

          {/* Regime breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(["Stagflation", "Goldilocks", "Reflation", "Deflation"] as const).map((reg) => {
              const count = backtest.regimeBreakdown[reg] || 0;
              const color = REGIME_COLORS[reg] || "#888";
              return (
                <div key={reg} className="p-3 rounded-lg border text-center" style={{ borderColor: color + "30", backgroundColor: color + "10" }}>
                  <div className="text-xs text-[#888] mb-1">{reg}</div>
                  <div className="text-lg font-bold" style={{ color }}>{count}</div>
                  <div className="text-xs text-[#555]">periods</div>
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {backtest.timeline.map((p, i) => {
              const color = REGIME_COLORS[p.regime] || "#888";
              const isOpen = expandedTimeline === i;
              return (
                <div key={i}>
                  <div
                    className="p-3 rounded-lg bg-[#111] border border-[#222] flex flex-col sm:flex-row sm:items-center gap-2 cursor-pointer hover:bg-[#151515] transition-colors"
                    onClick={() => setExpandedTimeline(isOpen ? null : i)}
                  >
                    <div className="flex items-center gap-2 sm:w-36">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm font-bold" style={{ color }}>{p.regime}</span>
                    </div>
                    <div className="text-xs text-[#888] sm:w-40">
                      {p.start} → {p.end} ({p.months}mo)
                    </div>
                    <div className="flex-1 text-xs">
                      {p.current ? (
                        <span className="text-[#eab308]">Active — too early to score</span>
                      ) : (
                        <>
                          Picks:{" "}
                          {p.picksReturn !== null ? (
                            <span className="font-bold" style={{ color: p.picksReturn >= 0 ? "#22c55e" : "#ef4444" }}>
                              {p.picksReturn >= 0 ? "+" : ""}{p.picksReturn.toFixed(1)}%
                            </span>
                          ) : <span className="text-[#333]">N/A</span>}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {!p.current && p.frameworkCorrect === true && <span className="text-[#22c55e]">✓ Correct</span>}
                      {!p.current && p.frameworkCorrect === false && <span className="text-[#ef4444]">✗ {p.bestRegime} won</span>}
                      {p.current && <span className="text-[#eab308]">Live</span>}
                      <span className="text-[#333] text-[10px]">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mx-3 p-3 rounded-b-lg border border-t-0 border-[#222] text-xs bg-[#0a0a0a]">
                      <p className="text-[#888] mb-3">{p.signalContext || "No additional context."}</p>

                      {/* All 4 baskets */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        {(["Stagflation", "Goldilocks", "Reflation", "Deflation"] as const).map((reg) => {
                          const ret = p.allRegimeReturns?.[reg];
                          const rColor = REGIME_COLORS[reg] || "#555";
                          const isBest = p.bestRegime === reg;
                          const isCalled = p.regime === reg;
                          const etfs = p.regimeETFs?.[reg] || [];
                          return (
                            <div key={reg} className="p-1.5 rounded" style={{
                              backgroundColor: isBest ? "#22c55e10" : "#0a0a0a",
                              border: isBest ? "1px solid #22c55e40" : "1px solid #1a1a1a",
                            }}>
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-[10px] font-bold" style={{ color: rColor }}>{reg}</span>
                                {isCalled && <span className="text-[8px] text-[#555]">[called]</span>}
                                {isBest && <span className="text-[8px] text-[#22c55e]">★</span>}
                              </div>
                              <div className="text-xs font-bold" style={{ color: ret == null ? "#333" : ret >= 0 ? "#22c55e" : "#ef4444" }}>
                                {ret == null ? "—" : `${ret >= 0 ? "+" : ""}${ret.toFixed(1)}%`}
                              </div>
                              {etfs.length > 0 && (
                                <div className="text-[8px] text-[#555] mt-0.5">{etfs.join(" · ")}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 2-way comparison: Proxy signal vs actual winner */}
                      {p.bestRegime && (() => {
                        const bestReg = p.bestRegime!;
                        const bestRet = p.allRegimeReturns?.[bestReg];
                        const frameworkCorrect = p.frameworkCorrect;
                        return (
                        <div className="mt-3 p-2 rounded bg-[#111] border border-[#222]">
                          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Proxy signal vs actual winner</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded bg-[#0a0a0a]">
                              <div className="text-[9px] text-[#555] uppercase">Proxy signal</div>
                              <div className="text-xs font-bold" style={{ color: REGIME_COLORS[p.regime] || "#555" }}>{p.regime}</div>
                              {typeof p.picksReturn === "number" && (
                                <div className="text-[10px] mt-0.5" style={{ color: p.picksReturn >= 0 ? "#22c55e" : "#ef4444" }}>
                                  {p.picksReturn >= 0 ? "+" : ""}{p.picksReturn.toFixed(1)}%
                                </div>
                              )}
                            </div>
                            <div className="p-2 rounded" style={{ backgroundColor: "#22c55e10", border: "1px solid #22c55e40" }}>
                              <div className="text-[9px] text-[#22c55e] uppercase">Actual winner ★</div>
                              <div className="text-xs font-bold" style={{ color: REGIME_COLORS[bestReg] || "#555" }}>{bestReg}</div>
                              {typeof bestRet === "number" && (
                                <div className="text-[10px] mt-0.5 text-[#22c55e]">+{bestRet.toFixed(1)}%</div>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 text-[10px] leading-relaxed">
                            {frameworkCorrect ? (
                              <span className="text-[#22c55e]">✓ Proxy signal correctly called {bestReg}.</span>
                            ) : (
                              <span className="text-[#ef4444]">✗ Proxy signal missed — {bestReg} picks outperformed.</span>
                            )}
                          </div>
                        </div>
                        );
                      })()}

                      <PeriodChat context={{
                        region: "China",
                        start: p.start,
                        end: p.end,
                        regime: p.regime,
                        bestRegime: p.bestRegime || undefined,
                        allRegimeReturns: p.allRegimeReturns,
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-[#333] text-center italic">
            China regime timeline based on proxy indicators and known economic events. ETF returns are real but regime classifications carry lower confidence than US/EU backtests.
          </p>
        </section>
      )}

      <div className="border-t border-[#181818]" />

      {/* Email signup */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <SubscribeForm
          title="The AI & Robotics Race — Weekly"
          description="One email per week: new factory announcements, supply chain disruptions, ETF entry opportunities, and robotics milestones. What happened and does it change the plan."
          buttonLabel="Subscribe"
          source="china"
          waitlistFeature="ai_race_weekly"
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          China tracker uses proxy indicators and AI synthesis. Official Chinese data is used only where no reliable alternative exists. All regime signals carry lower confidence than US signals based on FRED data. Direct China investments carry additional regulatory, geopolitical, and data risks. Not personalised financial advice.
        </p>
        <div className="flex gap-4 justify-center mt-3">
          <a href="/" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Back to Macro World View</a>
          <a href="/disclaimer" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Disclaimer</a>
        </div>
      </footer>
    </main>
  );
}
