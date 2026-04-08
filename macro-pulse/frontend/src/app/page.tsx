"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { apiUrl } from "@/lib/api";

const tools = [
  {
    category: "US ECONOMY",
    title: "Regime Tracker",
    description: "Live detection of the current US economic regime using FRED data and AI geopolitical analysis — showing which assets historically outperform right now.",
    statusLabel: "regime",
    cta: "Open tracker",
    href: "/regimetracker",
    accent: "#ef4444",
    enabled: true,
  },
  {
    category: "GLOBAL ALLIANCES",
    title: "World Order Monitor",
    description: "UN voting records, trade ties, and Dalio's 18 determinants of national power — tracking which countries are rising, declining, and where opportunities are hiding.",
    statusLabel: "30 countries tracked",
    cta: "Open monitor",
    href: "/world-order",
    accent: "#b45309",
    enabled: true,
  },
  {
    category: "DECLINING POWER",
    title: "US Overextension Tracker",
    description: "Military commitments, debt trajectory, and reserve currency decline — tracking the indicators Dalio identifies as signs of imperial overextension.",
    statusLabel: "Debt $36.2T · 125% GDP · 3 active theaters",
    cta: "Open tracker",
    href: "/us-overextension",
    accent: "#f97316",
    enabled: true,
  },
  {
    category: "EUROPEAN REBUILD",
    title: "European Autonomy",
    description: "Europe is structurally building independence in defence, energy, and technology. The companies enabling this have outperformed SPY in every sector since Russia invaded Ukraine.",
    statusLabel: "Defence +820% · Safran +166% · ASML +108%",
    cta: "Open tracker",
    href: "/europe",
    accent: "#3b82f6",
    enabled: true,
  },
  {
    category: "RISING CHALLENGER",
    title: "China Tracker",
    description: "Official Chinese data is unreliable. This tracker uses proxy indicators — electricity consumption, port throughput, Caixin PMI, copper imports — to read China's actual economic regime.",
    statusLabel: "\uD83D\uDD35 Deflation — Month 18",
    cta: "Open tracker",
    href: "/china",
    accent: "#dc2626",
    enabled: true,
  },
  {
    category: "MULTIPOLAR BENEFICIARIES",
    title: "Emerging Markets",
    description: "As the US-China competition intensifies, swing states and commodity exporters capture the decoupling opportunity. Tracking India, Brazil, Saudi Arabia, Indonesia, and Turkey.",
    statusLabel: "5 economies · India, Brazil, Saudi, Indonesia, Turkey",
    cta: "Open tracker",
    href: "/emerging-markets",
    accent: "#22c55e",
    enabled: true,
  },
];

const REGIME_COLORS: Record<string, string> = {
  Stagflation: "#ef4444", Goldilocks: "#22c55e", Reflation: "#eab308", Deflation: "#3b82f6",
};

type PanelData = {
  regime: string; months: number; confidence?: string;
  picks: { ticker: string; name: string; ret: number }[];
};

function RegimePanel({ label, flag, source, data, href, linkText, divergesFrom }: {
  label: string; flag: string; source: string; data: PanelData | null;
  href: string; linkText: string; divergesFrom?: string;
}) {
  const regime = data?.regime || "Loading";
  const color = REGIME_COLORS[regime] || "#555";

  return (
    <Link href={href} className="block">
      <div
        className="p-5 rounded-lg bg-[#111] border-l-2 border border-[#222] hover:bg-[#151515] transition-colors h-full"
        style={{ borderLeftColor: color }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{flag}</span>
            <span className="text-sm font-bold text-[#e0e0e0]">{label}</span>
          </div>
          <span className="text-[10px] text-[#333]">{source}</span>
        </div>

        {data ? (
          <>
            <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color }}>{regime}</div>
            <div className="text-xs text-[#555] mb-1">Month {data.months}</div>
            {data.confidence && <div className="text-[10px] text-[#555]">Confidence: {data.confidence}</div>}
            {divergesFrom && (
              <div className="text-[10px] text-[#eab308] mt-1">⚡ Diverging from {divergesFrom}</div>
            )}

            <div className="mt-3 space-y-1.5">
              {data.picks.map((p) => (
                <div key={p.ticker} className="flex items-center justify-between text-xs">
                  <span className="text-[#888]">{p.ticker} <span className="text-[#333]">{p.name}</span></span>
                  <span className="font-bold" style={{ color: p.ret >= 0 ? "#22c55e" : "#ef4444" }}>
                    {p.ret >= 0 ? "+" : ""}{p.ret}%
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-xs text-[#333] py-4">Loading regime data...</div>
        )}

        <div className="mt-3 text-xs text-[#555]">{linkText} →</div>
      </div>
    </Link>
  );
}

export default function LobbyPage() {
  const [regimeStatus, setRegimeStatus] = useState<string | null>(null);
  const [usData, setUsData] = useState<PanelData | null>(null);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [euData] = useState<PanelData>({
    regime: "Stagflation", months: 3, picks: [
      { ticker: "EUAD", name: "European Defence", ret: 62.0 },
      { ticker: "IOGP", name: "Oil & Gas", ret: 38.0 },
      { ticker: "NHY", name: "Norsk Hydro", ret: 12.0 },
    ],
  });
  const [cnData] = useState<PanelData>({
    regime: "Deflation", months: 18, confidence: "Medium", picks: [
      { ticker: "GLD", name: "Gold", ret: 15.4 },
      { ticker: "ACWX", name: "All World ex-US", ret: 3.2 },
    ],
  });

  useEffect(() => {
    // Fetch US regime + performance + calendar (for AI synthesis)
    Promise.all([
      fetch(apiUrl("/api/regime?mode=active")).then((r) => r.json()),
      fetch(apiUrl("/api/performance")).then((r) => r.json()),
      fetch(apiUrl("/api/calendar")).then((r) => r.json()).catch(() => null),
    ])
      .then(([regime, perf, calendar]) => {
        if (regime.confirmed) {
          const emoji = regime.confirmed === "Stagflation" ? "\uD83D\uDD34" : regime.confirmed === "Goldilocks" ? "\uD83D\uDFE2" : regime.confirmed === "Reflation" ? "\uD83D\uDFE1" : "\uD83D\uDD35";
          setRegimeStatus(`${emoji} ${regime.confirmed} — Month ${regime.consecutiveMonths}`);

          const picks = (perf.assets || [])
            .filter((a: { category: string }) => a.category === "pick")
            .slice(0, 3)
            .map((a: { ticker: string; name: string; returnPct: number }) => ({
              ticker: a.ticker, name: a.name, ret: a.returnPct,
            }));

          setUsData({
            regime: regime.confirmed,
            months: regime.consecutiveMonths,
            picks,
          });
        }

        // Build AI interpretation from synthesis
        if (calendar?.synthesis) {
          const s = calendar.synthesis;
          setAiInterpretation(s.situation || s.key_tension || null);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="px-4 pt-20 pb-12 max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl text-[#e0e0e0] font-bold leading-tight mb-6">
          Ray Dalio&apos;s framework predicts world order transitions and the investment opportunities they create. This platform tracks both in real time.
        </h1>
        <p className="text-sm text-[#555] max-w-2xl leading-relaxed mb-8">
          Six systematic tools tracking the decline of US dominance, the rise of new powers, and where capital should flow as the world order transitions.
        </p>

      </section>

      {/* Three-panel regime map */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-[#e0e0e0] mb-1">Three Economies. Three Regimes. One Picture.</h2>
        <p className="text-xs text-[#555] mb-6">Live economic regime signals across the US, Europe, and China — and the assets currently benefiting from each.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <RegimePanel
            label="United States" flag="\uD83C\uDDFA\uD83C\uDDF8" source="FRED + AI geo"
            data={usData} href="/regimetracker" linkText="Full US analysis"
          />
          <RegimePanel
            label="Europe" flag="\uD83C\uDDEA\uD83C\uDDFA" source="Eurostat + ECB"
            data={euData} href="/europe" linkText="Full European analysis"
            divergesFrom={usData && euData.regime !== usData.regime ? "US" : undefined}
          />
          <RegimePanel
            label="China" flag="\uD83C\uDDE8\uD83C\uDDF3" source="Proxy indicators"
            data={cnData} href="/china" linkText="Full China analysis"
            divergesFrom={usData && cnData.regime !== usData.regime ? "US" : undefined}
          />
        </div>

        {/* Divergence indicator */}
        {usData && (() => {
          const regimes = [usData.regime, euData.regime, cnData.regime];
          const unique = new Set(regimes);
          const dominant = regimes.sort((a, b) =>
            regimes.filter(r => r === b).length - regimes.filter(r => r === a).length
          )[0];
          const dominantColor = REGIME_COLORS[dominant] || "#555";

          if (unique.size === 1) {
            return (
              <div className="p-3 rounded-lg text-center text-xs" style={{ backgroundColor: dominantColor + "10", border: `1px solid ${dominantColor}30` }}>
                <span style={{ color: dominantColor }}>All three economies in <span className="font-bold">{dominant}</span> — global cycle dominant</span>
              </div>
            );
          } else if (unique.size === 3) {
            return (
              <div className="p-3 rounded-lg text-center text-xs animate-pulse" style={{ backgroundColor: "#ef444410", border: "1px solid #ef444430" }}>
                <span className="text-[#ef4444] font-bold">Global regime fragmentation</span>
                <span className="text-[#888]"> — three economies in different cycles</span>
              </div>
            );
          } else {
            const outlier = regimes.find(r => regimes.filter(x => x === r).length === 1);
            const outlierEcon = regimes[0] === outlier ? "US" : regimes[1] === outlier ? "Europe" : "China";
            return (
              <div className="p-3 rounded-lg text-center text-xs" style={{ backgroundColor: "#eab30810", border: "1px solid #eab30830" }}>
                <span className="text-[#eab308]">⚡ {outlierEcon} diverging from global <span className="font-bold">{dominant}</span> signal</span>
              </div>
            );
          }
        })()}

        {/* AI interpretation */}
        {aiInterpretation && (
          <div className="mt-4 p-4 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#555]">What this means right now</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#222] text-[#555]">AI synthesis</span>
            </div>
            <p className="text-xs text-[#888] italic leading-relaxed">{aiInterpretation}</p>
            <p className="text-[10px] text-[#333] mt-2">
              AI-generated interpretation. ETF mentions for educational purposes only. Not personalised financial advice.
            </p>
          </div>
        )}
      </section>

      {/* Six Tools */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-[#e0e0e0] mb-6">Six lenses. One thesis.</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const inner = (
              <div
                className={`p-5 rounded-lg bg-[#111] border-l-2 border border-[#222] transition-colors h-full flex flex-col ${
                  tool.enabled ? "hover:bg-[#151515] cursor-pointer" : "opacity-60"
                }`}
                style={{ borderLeftColor: tool.accent }}
              >
                <div className="text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: tool.accent }}>
                  {tool.category}
                </div>
                <h3 className="text-sm font-bold text-[#e0e0e0] mb-2">{tool.title}</h3>
                <p className="text-xs text-[#555] leading-relaxed mb-3 flex-1">{tool.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#888]">
                    {tool.category === "US ECONOMY" && regimeStatus ? regimeStatus : tool.statusLabel}
                  </span>
                  {tool.enabled ? (
                    <span className="text-xs text-[#888]">{tool.cta} →</span>
                  ) : (
                    <span className="text-[10px] text-[#333]">Coming soon</span>
                  )}
                </div>
              </div>
            );

            return tool.enabled ? (
              <Link key={tool.href} href={tool.href}>{inner}</Link>
            ) : (
              <div key={tool.href}>{inner}</div>
            );
          })}
        </div>
      </section>

      {/* What this is */}
      <section className="px-4 py-8 max-w-4xl mx-auto">
        <p className="text-xs text-[#555] leading-relaxed">
          Macro Pulse maps Ray Dalio&apos;s investment framework into six systematic tools — tracking the current economic regime, US overextension, European rebuilding, China&apos;s rise, emerging market opportunities, and the global alliance map. Built to surface actionable investment insights from the most important macro transition of the next decade.
        </p>
      </section>

      {/* Email signup */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
          <h2 className="text-lg font-bold text-[#e0e0e0] mb-2">Track the transition</h2>
          <p className="text-xs text-[#555] mb-4 max-w-md mx-auto">
            Regime change alerts, alliance shift notifications, and new analysis — delivered when it matters.
          </p>
          <div className="flex gap-2 max-w-sm mx-auto mb-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-3 py-2 rounded bg-[#0a0a0a] border border-[#222] text-sm text-[#e0e0e0] placeholder-[#333] focus:border-[#555] outline-none"
            />
            <button className="px-4 py-2 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors">
              Notify me
            </button>
          </div>
          <div className="flex gap-4 justify-center text-[10px] text-[#555]">
            <label className="flex items-center gap-1"><input type="checkbox" defaultChecked className="accent-[#555]" /> Regime change alerts</label>
            <label className="flex items-center gap-1"><input type="checkbox" defaultChecked className="accent-[#555]" /> New analysis</label>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#555]">
          Macro Pulse — Tracking the world order transition
        </p>
        <p className="text-xs text-[#333] mt-2 max-w-xl mx-auto">
          This website is for educational and informational purposes only. Nothing on this site constitutes personalised financial advice. All analysis is generated systematically from public data. Past performance does not guarantee future results.
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
