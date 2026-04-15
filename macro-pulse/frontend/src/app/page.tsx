"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import SectionChat from "@/components/SectionChat";
import { apiUrl } from "@/lib/api";

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444", Goldilocks: "#22c55e", Reflation: "#eab308", Deflation: "#3b82f6",
};

type ETFPick = { ticker: string; name?: string; weight?: number; returnSinceRegime?: number | null };
type RegimeData = { regime: string; periodStart?: string; overweight?: ETFPick[] };
type TimingETF = {
  ticker: string; layer: string; color: string; isUcits: boolean;
  price: number; rsi: number; vsMa200: number; drawdown: number;
  high52w: number; low52w: number; ret1y: number; score: number; signal: string;
};

export default function HomePage() {
  const [us, setUs] = useState<RegimeData | null>(null);
  const [eu, setEu] = useState<RegimeData | null>(null);
  const [cn, setCn] = useState<RegimeData | null>(null);
  const [duration, setDuration] = useState<{ avg: number; min: number; max: number } | null>(null);
  const [timing, setTiming] = useState<TimingETF[]>([]);

  useEffect(() => {
    fetch(apiUrl("/api/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setUs(d); }).catch(() => {});
    fetch(apiUrl("/api/eu/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setEu(d); }).catch(() => {});
    fetch(apiUrl("/api/china/allocation")).then((r) => r.json()).then((d) => { if (!d.error) setCn(d); }).catch(() => {});
    fetch(apiUrl("/api/transition")).then((r) => r.json()).then((d) => { if (d.durationStats) setDuration(d.durationStats); }).catch(() => {});
    fetch("/api/terafab-timing").then((r) => r.json()).then((d) => { if (d.etfs) setTiming(d.etfs); }).catch(() => {});
  }, []);

  const regime = us?.regime || null;
  const regimeColor = regime ? REGIME_COLORS[regime] || "#888" : "#888";
  const usEtfs = timing.filter((t) => !t.isUcits);
  const growthETFs = usEtfs.filter((e) => ["AI Chips", "AI & Autonomous", "Autonomous Tech", "Robotics"].includes(e.layer));
  const materialsETFs = usEtfs.filter((e) => ["Copper & Wiring", "Lithium & Batteries", "Rare Earths", "Energy & Power"].includes(e.layer));
  const growthAvg = growthETFs.length > 0 ? Math.round(growthETFs.reduce((s, e) => s + e.ret1y, 0) / growthETFs.length) : null;
  const matAvg = materialsETFs.length > 0 ? Math.round(materialsETFs.reduce((s, e) => s + e.ret1y, 0) / materialsETFs.length) : null;
  const topPerformer = usEtfs.length > 0 ? [...usEtfs].sort((a, b) => b.ret1y - a.ret1y)[0] : null;
  const topLaggard = usEtfs.length > 0 ? [...usEtfs].sort((a, b) => a.ret1y - b.ret1y)[0] : null;

  return (
    <main className="min-h-screen">
      <Nav />

      {/* ═══════════════════════════════
          HERO
      ═══════════════════════════════ */}
      <section className="px-4 pt-20 pb-12 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl text-[#e0e0e0] font-bold leading-tight mb-4">
          The AI & Robotics Race is creating the next materials supercycle
        </h1>
        <p className="text-sm text-[#555] max-w-xl mx-auto mb-6">
          Every AI fab, robot factory, and datacenter needs chips, copper, lithium, and rare earths. The supply chain is investable today — and the current macro regime tells you exactly when to enter.
        </p>
        <Link href="/ai-race" className="inline-block text-sm font-bold px-6 py-3 rounded bg-[#3b82f620] text-[#3b82f6] hover:bg-[#3b82f630] transition-colors border border-[#3b82f640]">
          Read the full thesis →
        </Link>
        <div className="mt-4">
          <SectionChat
            context="Welcome to Macro World View. The AI & Robotics Race thesis: every AI fab, robot factory, and datacenter needs the same materials — chips, copper, lithium, rare earths. Supply chain ETFs (SMH, BOTZ, COPX, LIT, REMX, ICLN) benefit regardless of which company wins. Current macro regime affects entry timing. The site has dedicated pages for the full AI & Robotics Race thesis, US/EU/China regime trackers, and the world order transition."
            label="Ask about this thesis"
            suggestions={["What is the AI & Robotics Race supply chain?", "Which ETFs should I start with?", "How does the macro regime affect entry timing?"]}
          />
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* ═══════════════════════════════
          CURRENT REGIME STRIP
      ═══════════════════════════════ */}
      {regime && (
        <section className="px-4 py-6 max-w-5xl mx-auto">
          <div className="p-3 rounded-lg border flex flex-wrap items-center gap-3" style={{ borderColor: regimeColor + "30", backgroundColor: regimeColor + "06" }}>
            <span className="text-[10px] uppercase tracking-wider text-[#555]">Current regime</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: regimeColor, backgroundColor: regimeColor + "20" }}>{regime}</span>
            {duration && <span className="text-[10px] text-[#555]">avg {duration.avg} months</span>}

            {us && eu && cn && (
              <div className="flex gap-1.5 ml-auto">
                {[
                  { label: "US", r: us.regime },
                  { label: "EU", r: eu.regime },
                  { label: "CN", r: cn.regime },
                ].map((x) => {
                  const c = REGIME_COLORS[x.r] || "#555";
                  return (
                    <div key={x.label} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: c + "15", border: `1px solid ${c}40` }}>
                      <span className="text-[#555]">{x.label}</span>{" "}
                      <span className="font-bold" style={{ color: c }}>{x.r}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {regime === "Stagflation" && (
            <p className="text-xs text-[#888] mt-2 leading-relaxed">
              Growth ETFs (AI, robotics) are <span className="text-[#e0e0e0] font-bold">discounted right now</span> — the macro is handing you a regime-driven discount on the AI & Robotics Race thesis.
            </p>
          )}
          {regime === "Goldilocks" && <p className="text-xs text-[#888] mt-2">Best regime for AI/robotics ETFs. Spread across the full supply chain.</p>}
          {regime === "Reflation" && <p className="text-xs text-[#888] mt-2">Lifts the entire supply chain — equal-weight growth and materials.</p>}
          {regime === "Deflation" && <p className="text-xs text-[#888] mt-2">Everything on sale. Best time to build positions at deep discounts.</p>}
        </section>
      )}

      <div className="border-t border-[#181818]" />

      {/* ═══════════════════════════════
          DASHBOARD 1 — AI & Robotics Race
      ═══════════════════════════════ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-lg font-bold text-[#e0e0e0]">The AI & Robotics Race</h2>
          <Link href="/ai-race" className="text-[10px] text-[#3b82f6] hover:underline">Full thesis →</Link>
        </div>
        <p className="text-xs text-[#555] mb-4">The main investment thesis: supply chain ETFs for the AI and robotics industrial revolution.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Supply Chain */}
          <Link href="/ai-race" className="block">
            <div className="p-4 rounded-lg bg-[#111] border border-[#3b82f630] hover:bg-[#151515] transition-colors h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-wider">Supply Chain</div>
                <span className="text-[#555] text-xs">→</span>
              </div>
              <h3 className="text-sm font-bold text-[#e0e0e0] mb-1">7 investable layers</h3>
              <p className="text-[10px] text-[#555] leading-relaxed mb-3">
                Chips (SMH) → Robots (BOTZ) → Copper (COPX) → Lithium (LIT) → Rare earths (REMX) → Energy (ICLN).
              </p>
              {growthAvg !== null && matAvg !== null && (
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <div className="p-2 rounded bg-[#0a0a0a] border border-[#1a1a1a] text-center">
                    <div className="text-[10px] text-[#555]">Growth</div>
                    <div className="text-xs font-bold text-[#3b82f6]">+{growthAvg}% 1Y</div>
                  </div>
                  <div className="p-2 rounded bg-[#0a0a0a] border border-[#1a1a1a] text-center">
                    <div className="text-[10px] text-[#555]">Materials</div>
                    <div className="text-xs font-bold text-[#e09030]">+{matAvg}% 1Y</div>
                  </div>
                </div>
              )}
            </div>
          </Link>

          {/* Forward Catalysts */}
          <Link href="/ai-race#forward-catalysts" className="block">
            <div className="p-4 rounded-lg bg-[#111] border border-[#22c55e30] hover:bg-[#151515] transition-colors h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wider">Druckenmiller Lens</div>
                <span className="text-[#555] text-xs">→</span>
              </div>
              <h3 className="text-sm font-bold text-[#e0e0e0] mb-1">Forward Catalysts</h3>
              <p className="text-[10px] text-[#555] leading-relaxed mb-3">
                13 catalysts certain to hit but not yet priced in. Alpha comes from what will become known.
              </p>
              <div className="flex flex-wrap gap-1 mt-auto">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22c55e20] text-[#22c55e]">Supply deficits</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef444420] text-[#ef4444]">Policy</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f620] text-[#3b82f6]">Companies</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#a855f720] text-[#a855f7]">Consensus</span>
              </div>
            </div>
          </Link>

          {/* When to Enter */}
          <Link href="/ai-race#when-to-enter" className="block">
            <div className="p-4 rounded-lg bg-[#111] border border-[#e0903030] hover:bg-[#151515] transition-colors h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-[#e09030] uppercase tracking-wider">Entry Timing</div>
                <span className="text-[#555] text-xs">→</span>
              </div>
              <h3 className="text-sm font-bold text-[#e0e0e0] mb-1">When to Enter</h3>
              <p className="text-[10px] text-[#555] leading-relaxed mb-3">
                Regime-aware two-phase strategy. Buy growth discounted in stagflation, rebalance into materials when regime shifts.
              </p>
              {topPerformer && topLaggard && (
                <div className="mt-auto pt-2 border-t border-[#1a1a1a]">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#22c55e]">Leading: <span className="text-[#e0e0e0] font-bold">{topPerformer.ticker}</span></span>
                    <span className="text-[#3b82f6]">Dip: <span className="text-[#e0e0e0] font-bold">{topLaggard.ticker}</span></span>
                  </div>
                </div>
              )}
            </div>
          </Link>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* ═══════════════════════════════
          DASHBOARD 2 — Regime Trackers
      ═══════════════════════════════ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-lg font-bold text-[#e0e0e0]">Regime Trackers</h2>
          <span className="text-[10px] text-[#555]">Live macro context</span>
        </div>
        <p className="text-xs text-[#555] mb-4">Track the three economies that drive the AI & Robotics Race entry timing. The US regime is the primary signal.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* US — Primary */}
          <Link href="/regimetracker" className="block">
            <div className="p-4 rounded-lg bg-[#111] border-2 hover:bg-[#151515] transition-colors h-full flex flex-col" style={{ borderColor: us ? REGIME_COLORS[us.regime] + "50" : "#333", backgroundColor: us ? REGIME_COLORS[us.regime] + "08" : "#111" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🇺🇸</span>
                <h3 className="text-sm font-bold text-[#e0e0e0]">United States</h3>
                <span className="text-[9px] font-bold ml-auto px-1.5 py-0.5 rounded bg-[#3b82f620] text-[#3b82f6] uppercase tracking-wider">Primary</span>
              </div>
              {us && (
                <div className="mb-2">
                  <div className="text-[10px] text-[#555] uppercase tracking-wider">Current regime</div>
                  <div className="text-base font-bold" style={{ color: REGIME_COLORS[us.regime] }}>{us.regime}</div>
                </div>
              )}
              <p className="text-[10px] text-[#555] leading-relaxed mb-2">
                Determines whether AI/robotics ETFs are discounted or extended. The leading entry-timing signal.
              </p>
              {us?.overweight && us.overweight.length > 0 && (
                <div className="mt-auto pt-2 border-t border-[#1a1a1a]">
                  <div className="text-[10px] text-[#555] mb-1">Current picks</div>
                  <div className="flex flex-wrap gap-1">
                    {us.overweight.slice(0, 3).map((p) => (
                      <span key={p.ticker} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                        <span className="text-[#e0e0e0] font-bold">{p.ticker}</span>
                        {typeof p.returnSinceRegime === "number" && (
                          <span className={`ml-1 ${p.returnSinceRegime >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {p.returnSinceRegime >= 0 ? "+" : ""}{p.returnSinceRegime}%
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Link>

          {/* Europe */}
          <Link href="/europe" className="block">
            <div className="p-4 rounded-lg bg-[#111] border hover:bg-[#151515] transition-colors h-full flex flex-col" style={{ borderColor: eu ? REGIME_COLORS[eu.regime] + "30" : "#222" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🇪🇺</span>
                <h3 className="text-sm font-bold text-[#e0e0e0]">Europe</h3>
              </div>
              {eu && (
                <div className="mb-2">
                  <div className="text-[10px] text-[#555] uppercase tracking-wider">Current regime</div>
                  <div className="text-base font-bold" style={{ color: REGIME_COLORS[eu.regime] }}>{eu.regime}</div>
                </div>
              )}
              <p className="text-[10px] text-[#555] leading-relaxed mb-2">
                ASML EUV monopoly — the chokepoint for all advanced chips. €43B Chips Act + €800B ReArm Europe.
              </p>
              {eu?.overweight && eu.overweight.length > 0 && (
                <div className="mt-auto pt-2 border-t border-[#1a1a1a]">
                  <div className="text-[10px] text-[#555] mb-1">Current picks</div>
                  <div className="flex flex-wrap gap-1">
                    {eu.overweight.slice(0, 3).map((p) => (
                      <span key={p.ticker} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                        <span className="text-[#e0e0e0] font-bold">{p.ticker}</span>
                        {typeof p.returnSinceRegime === "number" && (
                          <span className={`ml-1 ${p.returnSinceRegime >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {p.returnSinceRegime >= 0 ? "+" : ""}{p.returnSinceRegime}%
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Link>

          {/* China */}
          <Link href="/china" className="block">
            <div className="p-4 rounded-lg bg-[#111] border hover:bg-[#151515] transition-colors h-full flex flex-col" style={{ borderColor: cn ? REGIME_COLORS[cn.regime] + "30" : "#222" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🇨🇳</span>
                <h3 className="text-sm font-bold text-[#e0e0e0]">China</h3>
              </div>
              {cn && (
                <div className="mb-2">
                  <div className="text-[10px] text-[#555] uppercase tracking-wider">Current regime</div>
                  <div className="text-base font-bold" style={{ color: REGIME_COLORS[cn.regime] }}>{cn.regime}</div>
                </div>
              )}
              <p className="text-[10px] text-[#555] leading-relaxed mb-2">
                60% rare earth mining, 90% processing, #1 robot installer. Tracked via proxy indicators.
              </p>
              {cn?.overweight && cn.overweight.length > 0 && (
                <div className="mt-auto pt-2 border-t border-[#1a1a1a]">
                  <div className="text-[10px] text-[#555] mb-1">Current picks</div>
                  <div className="flex flex-wrap gap-1">
                    {cn.overweight.slice(0, 3).map((p) => (
                      <span key={p.ticker} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                        <span className="text-[#e0e0e0] font-bold">{p.ticker}</span>
                        {typeof p.returnSinceRegime === "number" && (
                          <span className={`ml-1 ${p.returnSinceRegime >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {p.returnSinceRegime >= 0 ? "+" : ""}{p.returnSinceRegime}%
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Link>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* ═══════════════════════════════
          DASHBOARD 3 — World Order
      ═══════════════════════════════ */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-lg font-bold text-[#e0e0e0]">World Order</h2>
          <Link href="/world-order" className="text-[10px] text-[#b45309] hover:underline">Full monitor →</Link>
        </div>
        <p className="text-xs text-[#555] mb-4">The geopolitical context that accelerates the AI & Robotics Race thesis.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Race to Automate */}
          <Link href="/world-order" className="block">
            <div className="p-4 rounded-lg bg-[#111] border border-[#b4530930] hover:bg-[#151515] transition-colors h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-[#b45309] uppercase tracking-wider">The Big Picture</div>
                <span className="text-[#555] text-xs">→</span>
              </div>
              <h3 className="text-sm font-bold text-[#e0e0e0] mb-1">The Race to Automate</h3>
              <p className="text-[10px] text-[#555] leading-relaxed mb-3">
                The race to automate will decide who leads the next world order. Nations pouring money into the same supply chain.
              </p>
              <div className="flex flex-wrap gap-1 mt-auto">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f9731620] text-[#f97316]">🇺🇸 Terafab</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef444420] text-[#ef4444]">🇨🇳 Robots</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f620] text-[#3b82f6]">🇪🇺 ASML</span>
              </div>
            </div>
          </Link>

          {/* Alliance Map */}
          <Link href="/world-order#alliance-tracker" className="block">
            <div className="p-4 rounded-lg bg-[#111] border border-[#eab30830] hover:bg-[#151515] transition-colors h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-[#eab308] uppercase tracking-wider">Alliance Map</div>
                <span className="text-[#555] text-xs">→</span>
              </div>
              <h3 className="text-sm font-bold text-[#e0e0e0] mb-1">Which side is each country on?</h3>
              <p className="text-[10px] text-[#555] leading-relaxed mb-3">
                10 countries tracked across US-NATO, China-Russia, and neutral blocs. Watch for shifting alliances — they precede territorial changes.
              </p>
              <div className="flex gap-2 mt-auto text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-[#3b82f620] text-[#3b82f6]">US-NATO</span>
                <span className="px-1.5 py-0.5 rounded bg-[#eab30820] text-[#eab308]">Neutral</span>
                <span className="px-1.5 py-0.5 rounded bg-[#ef444420] text-[#ef4444]">China-Russia</span>
              </div>
            </div>
          </Link>

          {/* Emerging Markets */}
          <Link href="/world-order#emerging-markets" className="block">
            <div className="p-4 rounded-lg bg-[#111] border border-[#22c55e30] hover:bg-[#151515] transition-colors h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wider">Optionality</div>
                <span className="text-[#555] text-xs">→</span>
              </div>
              <h3 className="text-sm font-bold text-[#e0e0e0] mb-1">Emerging Markets</h3>
              <p className="text-[10px] text-[#555] leading-relaxed mb-3">
                6 countries holding pieces of the AI & Robotics Race supply chain. Small-allocation bets on structural advantages.
              </p>
              <div className="flex flex-wrap gap-1 mt-auto text-[10px]">
                <span>🇮🇳</span><span>🇮🇩</span><span>🇧🇷</span><span>🇸🇦</span><span>🇻🇳</span><span>🇲🇽</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* ═══════════════════════════════
          SUBSCRIBE
      ═══════════════════════════════ */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <SubscribeForm
          title="The AI & Robotics Race — Weekly"
          description="One email per week: new factory announcements, supply chain disruptions, ETF entry opportunities, and robotics milestones. What happened and does it change the plan."
          buttonLabel="Subscribe"
          source="home_ai_race"
          waitlistFeature="ai_race_weekly"
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#555]">Macro World View — Tracking the AI & Robotics Race and the world order transition</p>
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
