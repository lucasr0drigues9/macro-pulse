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

export default function LobbyPage() {
  const [regimeStatus, setRegimeStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/regime?mode=active"))
      .then((r) => r.json())
      .then((d) => {
        if (d.confirmed) {
          const emoji = d.confirmed === "Stagflation" ? "\uD83D\uDD34" : d.confirmed === "Goldilocks" ? "\uD83D\uDFE2" : d.confirmed === "Reflation" ? "\uD83D\uDFE1" : "\uD83D\uDD35";
          setRegimeStatus(`${emoji} ${d.confirmed} — Month ${d.consecutiveMonths}`);
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

        {/* Live signal bar */}
        <Link
          href="/regimetracker"
          className="inline-block p-3 rounded-lg bg-[#111] border border-[#222] hover:border-[#333] transition-colors"
        >
          <div className="text-xs text-[#555] mb-1">Current US regime</div>
          <div className="text-sm text-[#e0e0e0] font-bold">
            {regimeStatus || "Loading..."}
          </div>
          <div className="text-xs text-[#555] mt-1">
            See the full analysis →
          </div>
        </Link>
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
