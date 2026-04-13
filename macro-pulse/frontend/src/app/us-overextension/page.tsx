"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import SubscribeForm from "@/components/SubscribeForm";
import SectionChat from "@/components/SectionChat";
import WorldOrderPosition from "@/components/WorldOrderPosition";
import {
  ACCENT, dashboardIndicators, militaryCommitments, debtTimeline,
  bigCycleStages, dedollarisation, centralBankGold, usStrategicCards,
} from "@/lib/usOverextensionData";

// ── Simple line chart (pure SVG) ──
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
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => {
          const y = py + pct * (h - py * 2);
          const val = yMax - pct * (yMax - yMin);
          return (
            <g key={pct}>
              <line x1={px} y1={y} x2={w - px} y2={y} stroke="#1a1a1a" strokeWidth="0.5" />
              <text x={px - 4} y={y + 3} textAnchor="end" fill="#333" fontSize="8" fontFamily="monospace">
                {val > 1000 ? `${(val / 1000).toFixed(0)}k` : val > 100 ? val.toFixed(0) : val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Thresholds */}
        {thresholds?.map((t) => (
          <g key={t.label}>
            <line x1={px} y1={toY(t.value)} x2={w - px} y2={toY(t.value)} stroke={t.color} strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={w - px + 4} y={toY(t.value) + 3} fill={t.color} fontSize="7" fontFamily="monospace">{t.label}</text>
          </g>
        ))}

        {/* X axis labels */}
        {data.filter((_, i) => i % 2 === 0).map((d) => (
          <text key={d[xKey]} x={toX(d[xKey])} y={h - 2} textAnchor="middle" fill="#333" fontSize="7" fontFamily="monospace">
            {d[xKey]}
          </text>
        ))}

        {/* Line */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(d[xKey])} cy={toY(d[yKey])} r="2.5" fill={color} />
        ))}
      </svg>
    </div>
  );
}

// ── Status badge ──
function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    critical: "#ef4444", warning: "#eab308", watch: "#3b82f6", stable: "#22c55e",
  };
  return <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: colors[status] || "#555" }} />;
}

export default function USOverextensionPage() {
  return (
    <main className="min-h-screen">
      <Nav />

      {/* Header */}
      <section className="px-4 pt-12 pb-8 max-w-5xl mx-auto">
        <h1 className="text-sm tracking-[0.3em] uppercase text-[#888] mb-3">US Overextension Tracker</h1>
        <p className="text-xl sm:text-2xl text-[#e0e0e0] font-bold mb-3">
          Military overextension, debt unsustainability, and reserve currency erosion.
        </p>
        <p className="text-[10px] text-[#333]">
          Framework based on Ray Dalio&apos;s Principles for Dealing with the Changing World Order.
        </p>
      </section>

      {/* Dashboard indicators */}
      <section className="px-4 py-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
        <p className="text-xs text-[#555] mb-4">
          History shows dominant powers cannot sustain wars on multiple fronts simultaneously. Dalio identifies this as a key indicator of imperial overextension.
        </p>

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

        {/* Historical parallel */}
        <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
          <h3 className="text-sm font-bold text-[#e0e0e0] mb-2">The Two-Front Problem</h3>
          <p className="text-xs text-[#888] leading-relaxed mb-3">
            Dalio documents that overextended empires cannot successfully fight wars on two or more fronts simultaneously. The British Empire reached this point in the 1940s. The Soviet Union reached it in the 1980s. The US currently has active military involvement in the Middle East, ongoing support commitments in Europe, and treaty obligations in Asia — three simultaneous theaters.
          </p>
          <p className="text-xs text-[#555] italic">
            &ldquo;The US has 750-800 military bases in 70-80 countries and has commitments that create expensive vulnerabilities all over the world.&rdquo; — Ray Dalio, April 2026
          </p>
        </div>
        <SectionChat
          context="Military overextension section. US has 750+ bases in 80 countries, three active theaters (Middle East/Iran, Ukraine support, Pacific), plus Hormuz enforcement. Defence budget $886B. Dalio's pattern: overextended empires cannot fight on multiple fronts."
          label="Ask about military overextension"
          suggestions={["How does Hormuz enforcement add to overextension?", "What happened when the British Empire was overextended?", "Can the US afford three theaters?"]}
        />
      </section>

      {/* Debt and Financial Overextension */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Financial Burden</h2>
        <p className="text-xs text-[#555] mb-6">
          Wars are financed by debt. Debt devalues currency. Dalio&apos;s principle: sell debt, buy gold.
        </p>

        <div className="space-y-6">
          <LineChart
            data={debtTimeline}
            xKey="year" yKey="debt"
            label="US National Debt ($T) — 2000 to 2026"
            color={ACCENT}
          />

          <LineChart
            data={debtTimeline}
            xKey="year" yKey="gdpPct"
            label="Debt as % of GDP — 2000 to 2026"
            color="#ef4444"
            thresholds={[
              { value: 80, label: "80% warning", color: "#eab308" },
              { value: 100, label: "100% critical", color: "#ef4444" },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LineChart
              data={debtTimeline}
              xKey="year" yKey="usdReserve"
              label="USD Share of Global Reserves (%)"
              color="#3b82f6"
            />
            <LineChart
              data={debtTimeline}
              xKey="year" yKey="goldPrice"
              label="Gold Price ($/oz) — inverse of USD confidence"
              color="#eab308"
            />
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg border border-[#222]" style={{ backgroundColor: ACCENT + "10", borderColor: ACCENT + "30" }}>
          <p className="text-xs text-[#888] leading-relaxed">
            <span className="font-bold" style={{ color: ACCENT }}>Dalio&apos;s principle applied to current data:</span> When debt is unsustainable and wars require more borrowing, financial assets lose purchasing power while real assets preserve it. The current regime signal is Stagflation. GLD is up +15% since December.{" "}
            <Link href="/regimetracker" className="underline underline-offset-2 hover:text-[#e0e0e0]" style={{ color: ACCENT }}>See regime tracker →</Link>
          </p>
        </div>
        <SectionChat
          context="US debt and financial overextension. National debt $36.2T (125% GDP). Interest payments exceeded defence spending in 2024. CBO projects 166% debt-to-GDP by 2054. Each rate hike costs ~$200B in additional annual interest."
          label="Ask about the debt trajectory"
          suggestions={["When does debt become unsustainable?", "What assets protect against currency debasement?", "How does this compare to Japan's debt?"]}
        />
      </section>

      {/* Reserve Currency Erosion */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Dollar Dominance in Decline</h2>
        <p className="text-xs text-[#555] mb-6">
          Reserve currency status is one of Dalio&apos;s 18 determinants of national power. Its erosion is both a symptom and accelerant of decline.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">USD Reserve Share</div>
            <div className="text-2xl font-bold text-[#3b82f6] mb-1">58%</div>
            <div className="text-xs text-[#555]">Down from 72% in 2000</div>
            <div className="text-[10px] text-[#333] mt-2">
              The British pound fell from 64% to under 5% between 1900 and 1980 as the British Empire declined.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2">De-dollarisation</div>
            <div className="space-y-1.5 mt-2">
              {dedollarisation.map((d) => (
                <div key={d.country} className="text-xs">
                  <span className={d.severity === "high" ? "text-[#ef4444]" : d.severity === "medium" ? "text-[#eab308]" : "text-[#555]"}>
                    {d.country}
                  </span>
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
            <div className="text-[10px] text-[#333] mt-2">
              Countries reducing dollar exposure are simultaneously accumulating gold.
            </div>
          </div>
        </div>
      </section>

      {/* Big Cycle position */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Where the US Sits in the Big Cycle</h2>
        <p className="text-xs text-[#555] mb-6">Dalio&apos;s six stages of empire — applied to the United States</p>

        <div className="space-y-2 mb-6">
          {bigCycleStages.map((s) => (
            <div
              key={s.stage}
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{
                backgroundColor: s.active ? ACCENT + "15" : "#111",
                borderColor: s.active ? ACCENT + "40" : "#222",
              }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  backgroundColor: s.active ? ACCENT : "#222",
                  color: s.active ? "#000" : "#555",
                }}
              >
                {s.stage}
              </span>
              <div className="flex-1">
                <span className={`text-sm font-bold ${s.active ? "text-[#e0e0e0]" : "text-[#555]"}`}>
                  {s.label}
                </span>
                <span className="text-xs text-[#333] ml-2">{s.period}</span>
              </div>
              {s.active && <span className="text-xs font-bold" style={{ color: ACCENT }}>← NOW</span>}
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
          <p className="text-xs text-[#888] leading-relaxed mb-4">
            The indicators on this page — military overextension, debt unsustainability, reserve currency erosion, and multi-front conflicts — are the same indicators Dalio documents in every previous imperial decline. This does not mean the US will collapse. It means capital is likely to rotate toward the economies building the capabilities to lead or benefit from the next order.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/world-order" className="text-xs px-3 py-1.5 rounded bg-[#222] text-[#888] hover:text-[#e0e0e0] transition-colors">
              Who is rising? → World Order Monitor
            </Link>
            <Link href="/europe" className="text-xs px-3 py-1.5 rounded bg-[#222] text-[#888] hover:text-[#e0e0e0] transition-colors">
              European opportunities →
            </Link>
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
            <p className="text-xs text-[#888] leading-relaxed mb-3">
              Wars and debt monetisation historically destroy the purchasing power of bonds and cash. Gold is the historical hedge. Current GLD performance confirms the pattern.
            </p>
            <Link href="/regimetracker" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2">
              See current regime →
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "#3b82f6" }}>Geographic diversification</div>
            <p className="text-xs text-[#888] leading-relaxed mb-3">
              Seven of the ten greatest world powers in 1900 saw wealth virtually wiped out at least once in the following 50 years. Investors concentrated in a single country face this risk.
            </p>
            <Link href="/world-order" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2">
              World Order Monitor →
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "#22c55e" }}>Beneficiaries of US retreat</div>
            <p className="text-xs text-[#888] leading-relaxed mb-3">
              When dominant powers overextend, allies rebuild capabilities and rivals expand influence. Both create investment opportunities.
            </p>
            <Link href="/europe" className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2">
              European Autonomy →
            </Link>
          </div>
        </div>

        <p className="mt-4 text-xs text-[#333] text-center italic">
          Investment implications based on Dalio&apos;s published historical research applied to current data. Not personalised financial advice.
        </p>
      </section>

      <div className="border-t border-[#181818]" />

      <WorldOrderPosition
        title="US in the World Order Transition"
        subtitle="Four dimensions of America's position as the declining incumbent power"
        cards={usStrategicCards}
        accent={ACCENT}
        chatContext="US position in Ray Dalio's world order transition. Military overextension (750+ bases, 3 theaters + Hormuz), dollar reserve erosion (72%→58%), debt trajectory ($36.2T, interest > defence), internal polarisation. Stage 5 of Dalio's big cycle."
        chatSuggestions={[
          "How does Hormuz fit Dalio's framework?",
          "What historical empires show this pattern?",
          "Which assets benefit from US decline?",
        ]}
      />

      <div className="border-t border-[#181818]" />

      {/* Email signup */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <SubscribeForm
          title="Track US Overextension"
          description="Get notified when key indicators shift — debt milestones, new military commitments, reserve currency changes."
          buttonLabel="Track indicators"
          source="us_overextension"
          waitlistFeature="us_overextension"
          accent={ACCENT}
        />
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#333] max-w-xl mx-auto">
          Data from FRED, IMF COFER, World Gold Council, and public sources. AI-generated analysis for educational purposes only. Not personalised financial advice. Always do your own research.
        </p>
      </footer>
    </main>
  );
}
