"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { apiUrl } from "@/lib/api";
import { subscribeEmail } from "@/lib/subscribe";

type SignupPhase = "idle" | "submitting" | "awaiting_confirm" | "missing" | "error";
const SIGNUP_SOURCE = "home_regime_alerts";

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
    title: "US Overextension",
    description: "Military commitments, debt trajectory, and reserve currency decline — now integrated into the World Order Monitor with full context.",
    statusLabel: "Debt $36.2T · 125% GDP · 3 active theaters",
    cta: "Open monitor",
    href: "/world-order",
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
  const [capitalFlow, setCapitalFlow] = useState<{
    out_of: { ticker: string; name: string; reason: string }[];
    into: { ticker: string; name: string; reason: string }[];
  } | null>(null);
  const [currencies, setCurrencies] = useState<{
    name: string; label: string; measures: string;
    current: number; prev: number; changePct: number; trend: string;
  }[] | null>(null);
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

  // Email signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupRegimeAlerts, setSignupRegimeAlerts] = useState(true);
  const [signupNewAnalysis, setSignupNewAnalysis] = useState(true);
  const [signupPhase, setSignupPhase] = useState<SignupPhase>("idle");
  const [signupErrorMessage, setSignupErrorMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || signupPhase === "submitting") return;
    setSignupPhase("submitting");
    setSignupErrorMessage("");
    const features: string[] = [];
    if (signupNewAnalysis) features.push("new_analysis");
    const result = await subscribeEmail({
      email: signupEmail,
      source: SIGNUP_SOURCE,
      regimeAlerts: signupRegimeAlerts,
      waitlistFeatures: features,
    });
    if (result.ok) {
      setSignupPhase("awaiting_confirm");
    } else {
      setSignupErrorMessage(result.message);
      setSignupPhase("error");
    }
  };

  const handleSignupMissing = () => setSignupPhase("missing");

  useEffect(() => {
    // Fetch US regime + performance + AI interpretation
    Promise.all([
      fetch(apiUrl("/api/regime?mode=active")).then((r) => r.json()),
      fetch(apiUrl("/api/performance")).then((r) => r.json()),
      fetch(apiUrl("/api/interpretation")).then((r) => r.json()).catch(() => null),
    ])
      .then(([regime, perf, interp]) => {
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

        // Build AI interpretation + capital flow
        if (interp) {
          setAiInterpretation(interp.interpretation || interp.situation || null);
          if (interp.capitalFlow) setCapitalFlow(interp.capitalFlow);
        }
      })
      .catch(() => {});

    // Fetch currencies
    fetch(apiUrl("/api/currencies"))
      .then((r) => r.json())
      .then((d) => { if (d.pairs?.length) setCurrencies(d.pairs); })
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

        {/* AI interpretation — reserved height prevents layout shift while loading */}
        <div className="mt-4 min-h-[140px]">
          {aiInterpretation && (
            <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
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
        </div>

        {/* Capital Flow — reserved height prevents layout shift while loading */}
        <div className="mt-6 min-h-[340px]">
        {capitalFlow && (capitalFlow.into.length > 0 || capitalFlow.out_of.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#e0e0e0]">Where Is Capital Flowing?</h3>
                <p className="text-xs text-[#555]">Based on US Stagflation + EU Stagflation + China Deflation</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#222] text-[#555]">AI</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Into */}
              <div className="rounded-lg bg-[#111] border-l-2 border border-[#222] p-4" style={{ borderLeftColor: "#22c55e" }}>
                <div className="text-xs font-bold text-[#22c55e] uppercase tracking-wider mb-3">Capital flowing into</div>
                <div className="space-y-3">
                  {capitalFlow.into.map((item) => (
                    <div key={item.ticker}>
                      <div className="text-sm">
                        <span className="font-bold text-[#e0e0e0]">{item.ticker}</span>
                        <span className="text-[#555] ml-2">{item.name}</span>
                      </div>
                      <p className="text-[10px] text-[#555] italic mt-0.5">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Out of */}
              <div className="rounded-lg bg-[#111] border-l-2 border border-[#222] p-4" style={{ borderLeftColor: "#ef4444" }}>
                <div className="text-xs font-bold text-[#ef4444] uppercase tracking-wider mb-3">Capital flowing out of</div>
                <div className="space-y-3">
                  {capitalFlow.out_of.map((item) => (
                    <div key={item.ticker}>
                      <div className="text-sm">
                        <span className="font-bold text-[#e0e0e0]">{item.ticker}</span>
                        <span className="text-[#555] ml-2">{item.name}</span>
                      </div>
                      <p className="text-[10px] text-[#555] italic mt-0.5">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#333] mt-3 text-center">
              AI-generated capital flow analysis based on current regime combination. ETFs shown for educational purposes only. Not personalised financial advice.
            </p>
          </div>
        )}
        </div>
      </section>

      {/* Currency Confirmation — reserved height prevents layout shift while loading */}
      <div className="min-h-[700px]">
      {currencies && currencies.length > 0 && (() => {
        const usRegime = usData?.regime || "Stagflation";
        const euRegime = euData.regime;
        const cnRegime = cnData.regime;

        type Confirmation = { status: "confirmed" | "divergence" | "neutral"; text: string };

        function confirmDXY(trend: string): Confirmation {
          const leaving = usRegime === "Stagflation" || usRegime === "Deflation";
          if (trend === "neutral") return { status: "neutral", text: "Dollar stable — flows not yet decisive." };
          if (leaving) {
            return trend === "weakening"
              ? { status: "confirmed", text: `Dollar weakening confirms capital rotating from US assets — consistent with ${usRegime}.` }
              : { status: "divergence", text: `Dollar strengthening contradicts ${usRegime} — safe haven demand may be overriding regime flows.` };
          }
          return trend === "strengthening"
            ? { status: "confirmed", text: `Dollar strengthening confirms capital flowing toward US assets — consistent with ${usRegime}.` }
            : { status: "divergence", text: `Dollar weakening contradicts ${usRegime} signal — investigate before acting.` };
        }

        function confirmEURUSD(trend: string): Confirmation {
          const entering = euRegime === "Goldilocks" || euRegime === "Reflation";
          if (trend === "neutral") return { status: "neutral", text: "EUR/USD stable — European flows not decisive." };
          if (entering) {
            return trend === "strengthening"
              ? { status: "confirmed", text: "Euro strengthening confirms capital entering Europe." }
              : { status: "divergence", text: "Euro weakening contradicts European growth signal." };
          }
          return trend === "weakening"
            ? { status: "confirmed", text: `Euro weakening confirms capital leaving Europe — consistent with ${euRegime}.` }
            : { status: "divergence", text: `Euro strengthening contradicts European ${euRegime} signal.` };
        }

        function confirmUSDJPY(trend: string): Confirmation {
          if (trend === "neutral") return { status: "neutral", text: "Yen stable — carry trade dynamics not decisive." };
          if (trend === "weakening") // yen strengthening (USDJPY falling)
            return { status: "divergence", text: "Yen strengthening — carry trade unwinding. Historically precedes volatility within 2-4 weeks." };
          return { status: "confirmed", text: "Yen weakening — carry trade active, risk appetite high globally." };
        }

        function confirmCNH(trend: string): Confirmation {
          const leaving = cnRegime === "Stagflation" || cnRegime === "Deflation";
          if (trend === "neutral") return { status: "neutral", text: "Yuan stable — Chinese capital flows not decisive." };
          if (leaving) {
            return trend === "strengthening" // USD strengthening vs CNH = yuan weakening
              ? { status: "confirmed", text: `Yuan weakening confirms capital leaving China — consistent with ${cnRegime}.` }
              : { status: "divergence", text: `Yuan strengthening contradicts Chinese ${cnRegime} — policy intervention likely.` };
          }
          return trend === "weakening"
            ? { status: "confirmed", text: "Yuan strengthening confirms Chinese recovery — capital flowing toward China proxies." }
            : { status: "divergence", text: "Yuan weakening contradicts Chinese recovery signal." };
        }

        const confirmations = currencies.map((c) => {
          let conf: Confirmation;
          if (c.name === "DXY") conf = confirmDXY(c.trend);
          else if (c.name === "EUR/USD") conf = confirmEURUSD(c.trend);
          else if (c.name === "USD/JPY") conf = confirmUSDJPY(c.trend);
          else if (c.name === "USD/CNH") conf = confirmCNH(c.trend);
          else conf = { status: "neutral", text: "" };
          return { ...c, confirmation: conf };
        });

        const confirmed = confirmations.filter((c) => c.confirmation.status === "confirmed").length;
        const divergent = confirmations.filter((c) => c.confirmation.status === "divergence").length;

        let overallStatus: "confirmed" | "mixed" | "diverging";
        let overallText: string;
        let overallColor: string;

        if (confirmed >= 3 && divergent <= 1) {
          overallStatus = "confirmed";
          overallText = `Currency markets confirming regime signal — ${confirmed} of ${currencies.length} pairs aligned. High conviction.`;
          overallColor = "#22c55e";
        } else if (divergent >= 2) {
          overallStatus = "diverging";
          overallText = "Currency markets contradicting regime signal. Something the model isn't capturing may be driving flows. Reduce conviction.";
          overallColor = "#ef4444";
        } else {
          overallStatus = "mixed";
          overallText = "Currency markets sending mixed signals. Some flows confirm the regime, others diverge. Standard conviction.";
          overallColor = "#eab308";
        }

        const statusIcon = overallStatus === "confirmed" ? "\uD83D\uDFE2" : overallStatus === "diverging" ? "\uD83D\uDD34" : "\uD83D\uDFE1";

        return (
          <section className="px-4 py-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#e0e0e0]">Are the Flows Confirmed?</h2>
            </div>
            <p className="text-xs text-[#555] mb-4">
              Currency markets move faster than economic data. When they align with the regime signal, conviction is high.
            </p>

            {/* Overall score */}
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: overallColor + "10", border: `1px solid ${overallColor}30` }}>
              <div className="flex items-center gap-2 mb-1">
                <span>{statusIcon}</span>
                <span className="text-sm font-bold" style={{ color: overallColor }}>
                  FLOWS {overallStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#888]">{overallText}</p>
            </div>

            {/* Individual pairs */}
            <div className="space-y-2">
              {confirmations.map((c) => {
                const confColor = c.confirmation.status === "confirmed" ? "#22c55e" : c.confirmation.status === "divergence" ? "#eab308" : "#555";
                const confIcon = c.confirmation.status === "confirmed" ? "\u2705" : c.confirmation.status === "divergence" ? "\u26A0\uFE0F" : "\u27A1\uFE0F";
                const arrow = c.changePct > 0 ? "\u2191" : c.changePct < 0 ? "\u2193" : "\u2192";
                const changeColor = c.changePct > 0 ? "#22c55e" : c.changePct < 0 ? "#ef4444" : "#555";

                return (
                  <div key={c.name} className="p-3 rounded-lg bg-[#111] border border-[#222]">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-bold text-[#e0e0e0]">{c.name}</span>
                        <span className="text-xs text-[#555] ml-2">{c.measures}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#888]">{c.current.toFixed(c.current > 100 ? 1 : 4)}</span>
                        <span style={{ color: changeColor }}>{arrow} {c.changePct > 0 ? "+" : ""}{c.changePct}%</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs">
                      <span>{confIcon}</span>
                      <span style={{ color: confColor }}>{c.confirmation.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-[#333] mt-3 text-center">
              Rates updated daily · 30-day trend filters daily noise · Not a trading signal — use as regime confirmation only
            </p>
            <p className="text-[10px] text-[#333] mt-1 text-center italic">
              Framework inspired by Druckenmiller&apos;s principle that currency direction confirms capital flows before stock markets reflect them.
            </p>
          </section>
        );
      })()}
      </div>

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
          World Order View maps Ray Dalio&apos;s investment framework into six systematic tools — tracking the current economic regime, US overextension, European rebuilding, China&apos;s rise, emerging market opportunities, and the global alliance map. Built to surface actionable investment insights from the most important macro transition of the next decade.
        </p>
      </section>

      {/* Email signup */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
          <h2 className="text-lg font-bold text-[#e0e0e0] mb-2">Track the transition</h2>
          <p className="text-xs text-[#555] mb-4 max-w-md mx-auto">
            Regime change alerts, alliance shift notifications, and new analysis — delivered when it matters.
          </p>
          {(signupPhase === "idle" || signupPhase === "submitting" || signupPhase === "error") && (
            <form onSubmit={handleSignup}>
              <div className="flex gap-2 max-w-sm mx-auto mb-3">
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={signupPhase === "submitting"}
                  className="flex-1 px-3 py-2 rounded bg-[#0a0a0a] border border-[#222] text-sm text-[#e0e0e0] placeholder-[#333] focus:border-[#555] outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={signupPhase === "submitting"}
                  className="px-4 py-2 rounded bg-[#222] text-sm text-[#e0e0e0] hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  {signupPhase === "submitting" ? "Sending…" : "Notify me"}
                </button>
              </div>
              <div className="flex gap-4 justify-center text-[10px] text-[#555]">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signupRegimeAlerts}
                    onChange={(e) => setSignupRegimeAlerts(e.target.checked)}
                    className="accent-[#555]"
                  />
                  Regime change alerts
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signupNewAnalysis}
                    onChange={(e) => setSignupNewAnalysis(e.target.checked)}
                    className="accent-[#555]"
                  />
                  New analysis
                </label>
              </div>
              {signupPhase === "error" && signupErrorMessage && (
                <p className="text-xs text-[#ef4444] mt-3" role="alert">{signupErrorMessage}</p>
              )}
            </form>
          )}

          {signupPhase === "awaiting_confirm" && (
            <div className="max-w-md mx-auto py-2">
              <p className="text-sm text-[#22c55e] mb-2">You&apos;re subscribed.</p>
              <p className="text-xs text-[#888] mb-3 leading-relaxed">
                We just sent a welcome email to <b className="text-[#e0e0e0]">{signupEmail}</b> from{" "}
                <span className="text-[#e0e0e0]">hello@worldorderview.com</span>. Open it and click
                the <b className="text-[#22c55e]">&quot;Confirm I got this email ✓&quot;</b> button
                so we know our delivery pipeline is working.
              </p>
              <button
                type="button"
                onClick={handleSignupMissing}
                className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 transition-colors"
              >
                Didn&apos;t arrive?
              </button>
            </div>
          )}

          {signupPhase === "missing" && (
            <div className="max-w-md mx-auto py-2 text-left">
              <p className="text-sm text-[#eab308] mb-2 text-center">Can&apos;t find it?</p>
              <ul className="text-xs text-[#888] space-y-1.5 mb-3 list-disc list-inside">
                <li>Check your spam / promotions folder for &quot;Welcome to World Order View&quot;</li>
                <li>Add <b className="text-[#e0e0e0]">hello@worldorderview.com</b> to your contacts so future alerts land in your inbox</li>
                <li>Still nothing after 5 minutes? Email <b className="text-[#e0e0e0]">hello@worldorderview.com</b> directly and we&apos;ll sort it out</li>
              </ul>
              <p className="text-[10px] text-[#555] text-center">
                You&apos;re still subscribed — we&apos;ll send the next update either way.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center border-t border-[#181818]">
        <p className="text-xs text-[#555]">
          World Order View — Tracking the world order transition
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
