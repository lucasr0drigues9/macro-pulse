"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import SectionChat from "@/components/SectionChat";
import WorldOrderPosition from "@/components/WorldOrderPosition";
import { apiUrl } from "@/lib/api";
import {
  ACCENT, proxyIndicators, strategicCards,
  directETFs, proxyPlays, taiwanHedges, type ProxyIndicator,
} from "@/lib/chinaData";

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444", Goldilocks: "#22c55e", Reflation: "#eab308", Deflation: "#3b82f6",
};

// ── Sparkline ──
function Sparkline({ data, color }: { data: { month: string; value: number }[]; color: string }) {
  const w = 200, h = 40, px = 4, py = 4;
  const ys = data.map((d) => d.value);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const range = yMax - yMin || 1;
  const points = data.map((d, i) => {
    const x = px + (i / (data.length - 1)) * (w - px * 2);
    const y = py + (1 - (d.value - yMin) / range) * (h - py * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x = w - px;
        const y = py + (1 - (last.value - yMin) / range) * (h - py * 2);
        return <circle cx={x} cy={y} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

// ── Proxy Indicator Card ──
function IndicatorCard({ ind }: { ind: ProxyIndicator }) {
  const [open, setOpen] = useState(false);
  const trendColor = ind.trend === "rising" ? "#22c55e" : ind.trend === "declining" ? "#ef4444" : "#eab308";
  const sparkColor = ind.signal === "growth" ? "#3b82f6" : "#eab308";
  return (
    <div className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-4 text-left hover:bg-[#151515] transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-[#e0e0e0]">{ind.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: trendColor, backgroundColor: trendColor + "20" }}>{ind.trend}</span>
        </div>
        <div className="text-xs text-[#555] mb-2">{ind.subtitle}</div>
        <div className="text-lg font-bold" style={{ color: ACCENT }}>{ind.currentValue}</div>
        <Sparkline data={ind.history} color={sparkColor} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[#222] text-xs">
          <p className="text-[#888] mt-3 leading-relaxed">{ind.whyItMatters}</p>
          <p className="text-[#333] mt-2">Source: {ind.source}</p>
        </div>
      )}
    </div>
  );
}

type ChinaRegime = { regime: string; proxyRegime?: string; geoRegime?: string; geoContext?: string; lagWarning?: boolean; growth: string; inflation: string; confidence: string; consecutiveMonths: number; periodStart?: string };
type Allocation = { regime: string; periodStart?: string; cashTarget: number; overweight: { ticker: string; name: string; weight: number; conviction: number; rationale: string; returnSinceRegime?: number | null }[]; underweight: { ticker: string; name: string; reason: string; returnSinceRegime?: number | null }[] };
type Trigger = { name: string; current: string; threshold: string; status: string; action: string; urgency: string };
type TransitionData = { currentRegime: string; durationStats: { months: number }; outlook: { regime: string; probability: number; description: string; signals: string[]; etfs: { ticker: string; name: string; conviction: number }[] }[] };

export default function ChinaPage() {
  const [regime, setRegime] = useState<ChinaRegime | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [transition, setTransition] = useState<TransitionData | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/china/regime")).then((r) => r.json()).then((d) => { if (!d.error) setRegime(d); }).catch(() => {});
    fetch(apiUrl("/api/china/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setAllocation(d); }).catch(() => {});
    fetch(apiUrl("/api/china/triggers")).then((r) => r.json()).then((d) => { if (d.triggers) setTriggers(d.triggers); }).catch(() => {});
    fetch(apiUrl("/api/china/transition")).then((r) => r.json()).then((d) => { if (!d.error) setTransition(d); }).catch(() => {});
  }, []);

  const r = regime || { regime: "Deflation", proxyRegime: "Deflation", geoRegime: "Deflation", geoContext: "", lagWarning: false, growth: "falling", inflation: "falling", confidence: "Medium", consecutiveMonths: 18 };
  const regimeColor = REGIME_COLORS[r.regime] || "#888";
  const proxyRegime = r.proxyRegime || r.regime;
  const geoRegime = r.geoRegime || r.regime;
  const proxyColor = REGIME_COLORS[proxyRegime] || "#888";
  const geoColor = REGIME_COLORS[geoRegime] || "#888";
  const signalsDiverge = proxyRegime !== geoRegime;

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Header */}
      <section className="px-4 pt-12 pb-4 max-w-5xl mx-auto">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">China Tracker</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Official Chinese data is unreliable. This tracker uses proxy indicators to read the real economy.
        </p>
        <div className="p-3 rounded bg-[#111] border border-[#222] mt-4">
          <p className="text-xs text-[#555] italic leading-relaxed">
            The Li Keqiang index — named after the former Premier who reportedly told a US diplomat he ignored official GDP and tracked electricity, rail freight, and bank loans instead — is the foundation of this tracker.
          </p>
        </div>
        <SectionChat
          context="China Tracker on World Order View. Uses proxy indicators (Li Keqiang index, Caixin PMI, port throughput, copper imports, property prices, PPI) instead of official Chinese data to detect the real economic regime. Applies the same four-season framework as the US tracker."
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

        {/* Dual signal display — Proxy Data vs AI Geo */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Proxy Data Signal</div>
            <div className="text-lg font-bold" style={{ color: proxyColor }}>{proxyRegime}</div>
            <div className="text-[10px] text-[#555] mt-1">Li Keqiang index, Caixin PMI, PPI, property, ports</div>
          </div>
          <div className="p-3 rounded-lg border" style={{
            backgroundColor: signalsDiverge ? geoColor + "10" : "#111",
            borderColor: signalsDiverge ? geoColor + "40" : "#222",
          }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: signalsDiverge ? "#eab308" : "#555" }}>
              AI Geopolitical Signal {signalsDiverge && "⚡"}
            </div>
            <div className="text-lg font-bold" style={{ color: geoColor }}>{geoRegime}</div>
            <div className="text-[10px] text-[#555] mt-1">
              {r.geoContext || "No override — agrees with proxy data"}
            </div>
          </div>
        </div>

        {signalsDiverge && (
          <div className="mt-3 p-3 rounded bg-[#111] border border-[#eab30840]" style={{ backgroundColor: "#eab30810" }}>
            <p className="text-xs text-[#eab308] font-bold mb-1">Signals diverging — geopolitical events moving faster than proxy data</p>
            <p className="text-xs text-[#888] leading-relaxed">
              Proxy indicators lag by weeks to months. When a major event happens (Hormuz closure, PBOC emergency action, Taiwan escalation),
              the AI geo layer detects the regime shift before proxy data catches up. The confirmed regime above uses the more current signal.
            </p>
          </div>
        )}

        {!signalsDiverge && (
          <div className="mt-3 p-3 rounded bg-[#111] border border-[#222]">
            <p className="text-xs text-[#eab308] leading-relaxed">
              Both signals agree on {proxyRegime}. Proxy indicators and geopolitical analysis point in the same direction — but confidence is still lower than the US tracker due to Chinese data opacity.
            </p>
          </div>
        )}

        <SectionChat
          context="Current China regime signal. Shows the regime based on proxy indicators (not official data). Current reading and growth/inflation direction."
          label="Ask about this regime"
          suggestions={["How confident should I be in this signal?", "What would flip this to Reflation?", "How does PBOC policy affect the regime?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* Six Proxy Indicators */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">What the Real Data Shows</h2>
        <p className="text-xs text-[#555] mb-6">Six indicators that are harder to fake than official GDP. Click for details.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {proxyIndicators.map((ind) => (
            <IndicatorCard key={ind.name} ind={ind} />
          ))}
        </div>
        <SectionChat
          context="Six proxy indicators for China's real economy: Li Keqiang Index, Caixin Manufacturing PMI, Port Throughput, Copper Imports, New Home Prices, and Producer Price Index (PPI). Each is harder to manipulate than official GDP."
          label="Ask about the indicators"
          suggestions={["Which indicator is most reliable?", "Why is PPI so negative?", "What does the port data tell us?"]}
        />
      </section>

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
          <SectionChat
            context="China regime allocation. Shows ETF weights for the current Chinese regime. Higher cash target (20%) than US/EU due to data unreliability and geopolitical risk."
            label="Ask about China allocation"
            suggestions={["Why so much cash?", "Is FXI too risky right now?", "What about BABA directly?"]}
          />
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
          <p className="text-xs text-[#555] mb-1">When Beijing acts, these are the ETFs to watch</p>
          <p className="text-xs text-[#888] mb-4">
            Current: <span className="font-bold" style={{ color: REGIME_COLORS[transition.currentRegime] || "#888" }}>{transition.currentRegime}</span> — Month {transition.durationStats.months}
          </p>
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
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">ETFs to watch</div>
                    <div className="flex flex-wrap gap-2">
                      {o.etfs.map((e) => (
                        <span key={e.ticker} className="text-xs px-2 py-1 rounded bg-[#0a0a0a] border border-[#222]">
                          <span className="font-bold text-[#e0e0e0]">{e.ticker}</span>{" "}
                          <span className="text-[#555]">{e.name}</span>
                        </span>
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

      {/* How to Position — Three Approaches */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">How to Position on China</h2>
        <p className="text-xs text-[#555] mb-2">Three approaches with different risk profiles — honest about what can go wrong</p>
        <p className="text-xs text-[#888] mb-6">
          The regime allocation above shows the framework&apos;s systematic picks. Below are the specific vehicles — from direct exposure (highest risk) to proxy plays (lower risk) to Taiwan hedges (tail risk insurance).
        </p>

        {/* Direct China ETFs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 rounded" style={{ backgroundColor: "#ef4444" }} />
            <h3 className="text-sm font-bold text-[#e0e0e0]">Approach 1 — Direct China Exposure</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef444420] text-[#ef4444]">HIGH RISK</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {directETFs.map((etf) => (
              <div key={etf.ticker} className="p-4 rounded-lg bg-[#111] border border-[#222]">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-sm font-bold text-[#e0e0e0]">{etf.ticker}</span>
                    <span className="text-xs text-[#555] ml-2">{etf.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${etf.return1y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {etf.return1y >= 0 ? "+" : ""}{etf.return1y}%
                  </span>
                </div>
                <p className="text-xs text-[#888] leading-relaxed">{etf.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-[#1a0000] border border-[#ef444430]">
            <p className="text-xs text-[#ef4444] font-bold mb-1">Risk disclosure</p>
            <p className="text-[10px] text-[#888] leading-relaxed">
              Direct China ETFs carry <b className="text-[#ef4444]">regulatory risk</b> (US-listed Chinese ADRs face delisting threats under the HFCAA),{" "}
              <b className="text-[#ef4444]">geopolitical risk</b> (Taiwan conflict would destroy shareholder value overnight), and{" "}
              <b className="text-[#ef4444]">data reliability risk</b> (companies report under Chinese accounting standards with limited auditor access).
              Position sizing should reflect these additional risks — most frameworks suggest capping direct China at 5-10% of portfolio.
            </p>
          </div>
        </div>

        {/* Proxy Plays */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 rounded" style={{ backgroundColor: "#eab308" }} />
            <h3 className="text-sm font-bold text-[#e0e0e0]">Approach 2 — Proxy Plays</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#eab30820] text-[#eab308]">MODERATE RISK</span>
          </div>
          <p className="text-xs text-[#555] mb-3">
            Get China exposure without the regulatory and political risks of holding Chinese equities directly.
            These assets move with Chinese demand but are domiciled in safer jurisdictions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {proxyPlays.map((p) => (
              <div key={p.ticker} className="p-4 rounded-lg bg-[#111] border border-[#222]">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-sm font-bold text-[#e0e0e0]">{p.ticker}</span>
                    <span className="text-xs text-[#555] ml-2">{p.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${p.return1y >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {p.return1y >= 0 ? "+" : ""}{p.return1y}%
                  </span>
                </div>
                <p className="text-xs text-[#888] leading-relaxed">{p.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Taiwan Hedges */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <h3 className="text-sm font-bold text-[#e0e0e0]">Approach 3 — Taiwan Scenario Hedges</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f620] text-[#3b82f6]">TAIL RISK</span>
          </div>
          <p className="text-xs text-[#555] mb-3">
            Assets that historically benefit from military escalation scenarios. Not a bet on conflict — insurance against the tail risk that Dalio estimates at 30-40% probability by 2028.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {taiwanHedges.map((h) => (
              <div key={h.ticker} className="p-4 rounded-lg bg-[#111] border border-[#222]">
                <div className="mb-1">
                  <span className="text-sm font-bold text-[#e0e0e0]">{h.ticker}</span>
                  <span className="text-xs text-[#555] ml-2">{h.name}</span>
                </div>
                <p className="text-xs text-[#888] leading-relaxed">{h.case}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded bg-[#111] border border-[#222]">
            <p className="text-[10px] text-[#555] leading-relaxed">
              These are not predictions. They are historical patterns from previous geopolitical conflicts applied to the Taiwan risk scenario. The Hormuz closure is a live test case — the same assets that hedge Taiwan risk (gold, defence, energy) are already performing in the current environment.
            </p>
          </div>
        </div>

        <SectionChat
          context="How to position on China section. Three approaches: Direct exposure (FXI, KWEB, MCHI — high risk from delistings, Taiwan, data), Proxy plays (DBC, EEM, copper miners — China demand exposure without Chinese equity risk), and Taiwan hedges (GLD, XLE, LMT, RTX — tail risk insurance). Current regime: Deflation. Hormuz closure creates additional complexity."
          label="Ask about China positioning"
          suggestions={[
            "Which approach has the best risk-reward right now?",
            "How does the Hormuz closure change China positioning?",
            "What would make direct China ETFs attractive again?",
          ]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* Email signup */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <SubscribeForm
          title="Track China's Real Economy"
          description="Get notified when proxy indicators shift significantly or when Taiwan risk level changes."
          buttonLabel="Track China"
          source="china"
          waitlistFeature="china"
          accent={ACCENT}
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          China tracker uses proxy indicators and AI synthesis. Official Chinese data is used only where no reliable alternative exists. All regime signals carry lower confidence than US signals based on FRED data. Direct China investments carry additional regulatory, geopolitical, and data risks. Not personalised financial advice.
        </p>
        <div className="flex gap-4 justify-center mt-3">
          <a href="/" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Back to World Order View</a>
          <a href="/disclaimer" className="text-xs text-[#888] hover:text-[#e0e0e0] underline underline-offset-2">Disclaimer</a>
        </div>
      </footer>
    </main>
  );
}
