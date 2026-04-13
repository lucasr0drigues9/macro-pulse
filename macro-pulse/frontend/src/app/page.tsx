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

export default function HomePage() {
  const [us, setUs] = useState<RegimeData | null>(null);
  const [eu, setEu] = useState<RegimeData | null>(null);
  const [cn, setCn] = useState<RegimeData | null>(null);
  const [duration, setDuration] = useState<{ avg: number; min: number; max: number; periods: number } | null>(null);
  const [timing, setTiming] = useState<TimingETF[]>([]);
  const [timingLoading, setTimingLoading] = useState(true);
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);

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
          <SectionChat
            context="Welcome to Macro World View. The AI Race is creating the next materials supercycle. Current macro regime affects entry timing — stagflation suppresses growth ETFs (buy now at discount), materials are inflated (wait for regime shift). The site covers the AI Race thesis with supply chain ETFs, US/EU/China regime trackers, and the world order transition."
            label="Ask about the AI Race thesis"
            suggestions={["What is the AI Race?", "How do I use the regime to time my entry?", "What ETFs should I start with?"]}
          />
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
        <div className="p-3 rounded-lg bg-[#111] border border-[#a855f730]" style={{ backgroundColor: "#a855f708" }}>
          <p className="text-xs text-[#888] leading-relaxed">
            SpaceX is expected to IPO soon — giving public investors access to Musk&apos;s space + Starlink empire for the first time. Same ecosystem: advanced manufacturing, AI-guided systems, autonomous operations, massive infrastructure buildout.
          </p>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Supply Chain Map */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Supply Chain — Layer by Layer</h2>
        <p className="text-xs text-[#555] mb-6">Each layer has investable ETFs. Click for catalysts, parallels, and timing.</p>
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
          WHEN TO ENTER
      ════════════════════════════════════════════ */}

      <section className="px-4 py-8 max-w-5xl mx-auto">
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
