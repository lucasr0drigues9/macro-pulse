"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import SectionChat from "@/components/SectionChat";
import SubscribeForm from "@/components/SubscribeForm";
import { apiUrl } from "@/lib/api";

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
      { ticker: "ARKQ", ucits: "—", name: "ARK Autonomous Tech & Robotics ETF", why: "Tesla, Kratos, UiPath, Iridium. Conviction bet on autonomous systems and AI applications." },
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

const TIMELINE = [
  { year: "2014", event: "Tesla Gigafactory announced", impact: "TSLA at $10. Lithium, cobalt, nickel began multi-year rally. COPX was $15. Everyone said EVs were a niche.", era: "EV Wave" },
  { year: "2017", event: "Gigafactory production begins + competitors follow", impact: "VW, BMW, GM, Ford all announced EV plans. Battery supply chain scaled. The industry Musk created was now bigger than Tesla.", era: "EV Wave" },
  { year: "2020", event: "EV adoption inflection", impact: "TSLA 35x from 2014. COPX 5x. Lithium 5x. Every automaker building EVs proved the materials thesis.", era: "EV Wave" },
  { year: "2023", event: "ChatGPT + AI investment wave", impact: "SMH +117%. Datacenter buildout begins. Power demand surges.", era: "AI Wave" },
  { year: "2025", event: "SpaceX IPO expected", impact: "First public access to Musk's space + Starlink empire. Same ecosystem: AI, automation, advanced manufacturing.", era: "Robot Wave" },
  { year: "2026", event: "Terafab announced — competitors already moving", impact: "Samsung, Intel, TSMC all expanding fabs. Google DeepMind, Amazon robotics scaling. The industry is forming.", era: "Robot Wave" },
  { year: "2027-28", event: "Terafab construction + Optimus limited production", impact: "Materials demand spike: copper, rare earths, lithium. Every tech giant building robots and fabs in parallel.", era: "Robot Wave" },
  { year: "2029-30", event: "Full-scale robot + AI chip production", impact: "Multiple companies at scale. Materials supercycle in full swing. Grid infrastructure strain.", era: "Robot Wave" },
];

export default function TerafabPage() {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);
  const [timing, setTiming] = useState<TimingETF[]>([]);
  const [timingLoading, setTimingLoading] = useState(true);
  const [regime, setRegime] = useState<string | null>(null);
  const [regimeDuration, setRegimeDuration] = useState<{ avg: number; min: number; max: number; periods: number } | null>(null);

  useEffect(() => {
    fetch("/api/terafab-timing")
      .then((r) => r.json())
      .then((d) => { if (d.etfs) setTiming(d.etfs); })
      .catch(() => {})
      .finally(() => setTimingLoading(false));
    fetch(apiUrl("/api/allocation"))
      .then((r) => r.json())
      .then((d) => { if (d.regime) setRegime(d.regime); })
      .catch(() => {});
    fetch(apiUrl("/api/transition"))
      .then((r) => r.json())
      .then((d) => {
        if (d.durationStats) setRegimeDuration(d.durationStats);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Header */}
      <section className="px-4 pt-12 pb-4 max-w-5xl mx-auto">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">The AI & Robotics Race</h1>
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
        <SectionChat
          context="Terafab page. Elon Musk's largest chip fab ever. Thesis: Gigafactory drove the EV materials supercycle (COPX 5x), Terafab will drive an AI/robotics materials supercycle at 10-100x scale. Supply chain: chips (SMH) → robots (BOTZ) → copper (COPX) → lithium (LIT) → rare earths (REMX) → energy (ICLN)."
          label="Ask about the Terafab thesis"
          suggestions={["How does this compare to the Gigafactory impact?", "Which material bottlenecks first?", "Is it too late to enter?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* The EV → AI/Robot Parallel */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Proven Playbook</h2>
        <p className="text-xs text-[#555] mb-4">Gigafactory created a materials supercycle. Terafab is the same pattern at larger scale.</p>

        <div className="space-y-1 mb-6">
          {TIMELINE.map((t, i) => {
            const isRobot = t.era === "Robot Wave";
            const isAI = t.era === "AI Wave";
            const color = isRobot ? "#3b82f6" : isAI ? "#a855f7" : "#22c55e";
            return (
              <div key={i} className="flex gap-3 p-3 rounded-lg" style={{
                backgroundColor: isRobot ? "#3b82f608" : "#111",
                border: isRobot ? "1px solid #3b82f630" : "1px solid #222",
              }}>
                <div className="w-16 shrink-0">
                  <span className="text-xs font-bold" style={{ color }}>{t.year}</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#e0e0e0]">{t.event}</div>
                  <div className="text-[10px] text-[#888] mt-0.5">{t.impact}</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0 h-fit" style={{ color, backgroundColor: color + "20" }}>{t.era}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* First Mover → Industry */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">First Mover Creates the Industry</h2>
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

        {/* SpaceX IPO */}
        <div className="p-3 rounded-lg bg-[#111] border border-[#a855f730]" style={{ backgroundColor: "#a855f708" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#a855f7]">Upcoming catalyst: SpaceX IPO</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#a855f720] text-[#a855f7]">2025-2026</span>
          </div>
          <p className="text-xs text-[#888] leading-relaxed">
            SpaceX is expected to IPO soon — giving public investors access to Musk&apos;s space + Starlink empire for the first time. It&apos;s the same ecosystem: advanced manufacturing, AI-guided systems, autonomous operations, and massive infrastructure buildout. Tesla proved Musk&apos;s ability to scale physical production. SpaceX proves it in aerospace. Terafab is the convergence of both. Watch for the IPO as a sentiment catalyst across the entire Musk industrial complex.
          </p>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Supply Chain Map */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Supply Chain — Layer by Layer</h2>
        <p className="text-xs text-[#555] mb-6">Each layer of the Terafab supply chain has investable ETFs. Click for catalysts, parallels, and timing.</p>

        <div className="space-y-3">
          {SUPPLY_CHAIN.map((layer, i) => {
            const isOpen = expandedLayer === i;
            return (
              <div key={layer.layer} className="rounded-lg bg-[#111] border overflow-hidden" style={{ borderColor: layer.color + "30" }}>
                <button
                  onClick={() => setExpandedLayer(isOpen ? null : i)}
                  className="w-full p-4 text-left hover:bg-[#151515] transition-colors"
                >
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
                    {/* ETFs */}
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

                    {/* Catalysts */}
                    <div className="mb-4">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Catalysts &amp; Timeline</div>
                      {layer.catalysts.map((c) => (
                        <div key={c.event} className="flex gap-3 text-xs mb-1.5">
                          <span className="font-bold shrink-0 w-20" style={{ color: layer.color }}>{c.date}</span>
                          <span className="text-[#888]">{c.event}</span>
                        </div>
                      ))}
                    </div>

                    {/* Historical parallel */}
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
          context="Terafab supply chain. 6 layers: AI Chips (SMH), Robotics (BOTZ), Copper (COPX), Lithium (LIT), Rare Earths (REMX), Energy (ICLN). Each has specific catalysts and timelines. The thesis follows the Gigafactory playbook: factory announced → materials supply chain scales → 5-10x returns over a decade."
          label="Ask about the supply chain"
          suggestions={["Which layer moves first?", "What's the lithium risk after the 2022 crash?", "Is rare earth supply a real bottleneck?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* Entry Strategy */}
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

                // Categorise ETFs by regime sensitivity
                const materials = usEtfs.filter((e) => ["Copper & Wiring", "Lithium & Batteries", "Rare Earths"].includes(e.layer));
                const tech = usEtfs.filter((e) => ["AI Chips", "AI & Autonomous", "Autonomous Tech", "Robotics"].includes(e.layer));
                const matAvg = materials.length > 0 ? Math.round(materials.reduce((s, e) => s + e.ret1y, 0) / materials.length) : 0;
                const techAvg = tech.length > 0 ? Math.round(tech.reduce((s, e) => s + e.ret1y, 0) / tech.length) : 0;

                const regimeColor = isStagflation ? "#ef4444" : isDeflation ? "#3b82f6" : isGoldilocks ? "#22c55e" : "#eab308";

                return (
                  <div className="p-4 rounded-lg bg-[#111] border mb-4" style={{ borderColor: regimeColor + "30" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#555]">Current macro regime</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: regimeColor, backgroundColor: regimeColor + "20" }}>
                        {regime}
                      </span>
                      {regimeDuration && (
                        <span className="text-[10px] text-[#555] ml-auto">typically lasts {regimeDuration.avg} months (range {regimeDuration.min}–{regimeDuration.max})</span>
                      )}
                    </div>

                    {isStagflation && (
                      <div className="space-y-2">
                        <p className="text-xs text-[#888] leading-relaxed">
                          Stagflation is a <span className="text-[#e0e0e0] font-bold">tailwind for materials</span> and a <span className="text-[#e0e0e0] font-bold">headwind for growth/tech</span>. That&apos;s exactly what the data shows:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-[#0a0a0a] border border-[#22c55e30]">
                            <div className="text-[10px] text-[#555]">Materials (COPX, LIT, REMX)</div>
                            <div className="text-sm font-bold text-[#22c55e]">+{matAvg}% avg</div>
                            <div className="text-[10px] text-[#888] mt-1">Running hot <span className="text-[#e0e0e0]">because of stagflation</span>. Already priced for inflation — buying now means paying the premium.</div>
                          </div>
                          <div className="p-2 rounded bg-[#0a0a0a] border border-[#3b82f630]">
                            <div className="text-[10px] text-[#555]">Growth/Robotics (SMH, BOTZ, AIQ)</div>
                            <div className="text-sm font-bold text-[#3b82f6]">+{techAvg}% avg</div>
                            <div className="text-[10px] text-[#888] mt-1">Suppressed by stagflation — <span className="text-[#e0e0e0]">this is the dip</span>. Same structural demand, lower price. The macro is handing you a discount.</div>
                          </div>
                        </div>

                        {/* Two-phase strategy */}
                        <div className="p-3 rounded border border-[#3b82f640]" style={{ backgroundColor: "#3b82f608" }}>
                          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Recommended two-phase entry</div>
                          <div className="space-y-2">
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center shrink-0">
                                <span className="text-xs font-bold text-[#3b82f6] bg-[#3b82f620] w-6 h-6 rounded-full flex items-center justify-center">1</span>
                                <div className="w-px flex-1 bg-[#222] mt-1" />
                              </div>
                              <div className="pb-2">
                                <div className="text-xs font-bold text-[#e0e0e0]">Now — Buy the growth laggards</div>
                                <p className="text-[10px] text-[#888] mt-0.5">
                                  BOTZ, AIQ, ARKQ are cheap because stagflation punishes growth — not because the Terafab thesis is weaker. The structural demand (AI fabs, robot factories, autonomous systems) hasn&apos;t changed. You&apos;re buying the thesis at a regime-driven discount.
                                </p>
                                <div className="flex gap-2 mt-1.5">
                                  {tech.map((e) => (
                                    <span key={e.ticker} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#3b82f620] text-[#3b82f6]">{e.ticker} ${e.price}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center shrink-0">
                                <span className="text-xs font-bold text-[#e09030] bg-[#e0903020] w-6 h-6 rounded-full flex items-center justify-center">2</span>
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#e0e0e0]">After regime shifts — Rebalance into materials</div>
                                <p className="text-[10px] text-[#888] mt-0.5">
                                  When stagflation ends (oil drops, Hormuz reopens, Fed cuts), materials will pull back 15-20% as the inflation premium fades. That&apos;s the moment to add COPX, LIT, REMX at a discount — while your growth positions surge from the regime shift.
                                </p>
                                <div className="flex gap-2 mt-1.5">
                                  {materials.map((e) => (
                                    <span key={e.ticker} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e0903020] text-[#e09030]">{e.ticker} ${e.price}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
                          <p className="text-[10px] text-[#888] leading-relaxed">
                            <span className="text-[#e0e0e0] font-bold">Why this works:</span> You&apos;re using the regime to your advantage instead of fighting it. Growth ETFs are discounted now for macro reasons, not fundamental ones — the factories are still being built, the chips still being designed, the robots still being prototyped. When the macro headwind lifts, these names snap back while materials cool off, giving you a second entry point. You end up with the full supply chain at better average prices than buying everything today.
                          </p>
                        </div>
                      </div>
                    )}

                    {isGoldilocks && (
                      <p className="text-xs text-[#888] leading-relaxed">
                        Goldilocks (low inflation + growth) is the <span className="text-[#e0e0e0]">best regime for tech/robotics</span> — SMH, BOTZ, AIQ should outperform. Materials may cool off as inflation subsides, creating dip opportunities in COPX, LIT, REMX. Consider overweighting chips and robotics now.
                      </p>
                    )}

                    {isReflation && (
                      <p className="text-xs text-[#888] leading-relaxed">
                        Reflation (rising growth + rising inflation) benefits the <span className="text-[#e0e0e0]">entire supply chain</span> — both materials and tech. This is the ideal macro backdrop for the Terafab thesis. Spread equally across all layers.
                      </p>
                    )}

                    {isDeflation && (
                      <p className="text-xs text-[#888] leading-relaxed">
                        Deflation is the <span className="text-[#e0e0e0]">worst regime for this thesis</span> — falling prices crush commodity producers and reduce capex spending. This is when dip scores spike to 7-9. If you believe the structural thesis, deflation is the time to build your position at deep discounts.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Suggested allocation — split by category */}
              {(() => {
                const growthETFs = usEtfs.filter((e) => ["AI Chips", "AI & Autonomous", "Autonomous Tech", "Robotics"].includes(e.layer));
                const materialsETFs = usEtfs.filter((e) => ["Copper & Wiring", "Lithium & Batteries", "Rare Earths", "Energy & Power", "Utilities"].includes(e.layer));
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
                    {/* Growth / Tech */}
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
                    {/* Materials */}
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
          context="Terafab supply chain entry strategy. In stagflation: buy growth/robotics ETFs (BOTZ, AIQ, ARKQ, SMH) at a regime-driven discount — structural demand unchanged but macro suppresses prices. After regime shifts: rebalance into materials (COPX, LIT, REMX, ICLN) when they pull back from inflation premium. Two-phase approach gives better average prices across the full supply chain."
          label="Ask about entry strategy"
          suggestions={["Why buy growth now instead of materials?", "How much should I allocate monthly?", "What if stagflation lasts longer than expected?"]}
        />
      </section>

      <div className="border-t border-[#181818]" />

      {/* Risk Factors */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-4">What Could Go Wrong</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { risk: "Execution risk", detail: "Musk has a history of ambitious timelines. Gigafactory was years late. Terafab could be delayed significantly.", color: "#eab308" },
            { risk: "Competition (actually bullish)", detail: "Intel, Samsung, TSMC, Google, Amazon all building fabs and robots. More competitors = more materials demand. This is a risk for TSLA stock, but bullish for the supply chain ETFs.", color: "#22c55e" },
            { risk: "Materials already priced in", detail: "COPX +73%, SMH +117%. A lot of the thesis is in the price. A correction is likely before the next leg up.", color: "#ef4444" },
            { risk: "China retaliation", detail: "China controls 60% of rare earth mining, 90% of processing. Export restrictions would spike prices short-term but crash supply chains.", color: "#ef4444" },
            { risk: "Regulatory", detail: "AI regulation, environmental permits for mining, and CHIPS Act funding could all be delayed or reduced.", color: "#eab308" },
            { risk: "Robotics adoption slower than projected", detail: "Musk's 10-100x target is aspirational. Real adoption depends on cost, safety, regulation. Could take 15 years not 5.", color: "#eab308" },
          ].map((r) => (
            <div key={r.risk} className="p-3 rounded-lg bg-[#111] border border-[#222]">
              <div className="text-xs font-bold mb-1" style={{ color: r.color }}>{r.risk}</div>
              <p className="text-[10px] text-[#888] leading-relaxed">{r.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded bg-[#111] border border-[#222]">
          <p className="text-[10px] text-[#888] leading-relaxed">
            <span className="text-[#e0e0e0] font-bold">The key insight:</span> Even if Terafab is delayed or scaled back, the underlying demand (AI compute, automation, energy transition) exists independently. Every major tech company is building fabs and datacenters. The materials supply chain benefits regardless of whether Terafab specifically succeeds — it&apos;s a bet on the industrial trend, not on one factory.
          </p>
        </div>
      </section>

      <div className="border-t border-[#181818]" />

      {/* Subscribe */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <SubscribeForm
          title="Track the Terafab Supply Chain"
          description="Get notified when materials demand data shifts, new factory announcements drop, or entry timing improves."
          buttonLabel="Track this thesis"
          source="terafab"
          waitlistFeature="terafab"
          accent="#3b82f6"
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          This page tracks a speculative investment thesis based on announced but unbuilt infrastructure. Timelines are estimates. ETF mentions are for educational purposes only. Past performance (EV wave) does not guarantee similar results. Not personalised financial advice.
        </p>
      </footer>
    </main>
  );
}
