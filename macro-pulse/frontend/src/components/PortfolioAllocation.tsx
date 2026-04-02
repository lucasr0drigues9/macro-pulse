"use client";

import { useEffect, useState } from "react";
import { allocationData as fallback, REGIME_COLORS, type RegimeName } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";
import { useMode, MODE_CONFIG } from "@/lib/mode";

type Overweight = {
  ticker: string; name: string; weight: number; conviction: number;
  priceAssessment: string; rationale: string;
  timing?: { price: number; rsi: number; score: number } | null;
};
type Underweight = { ticker: string; name: string; rationale: string };
type EarlyRotation = {
  targetRegime: string; totalPct: number;
  positions: { ticker: string; name: string; weight: number; conviction: number; priceAssessment: string; rationale: string }[];
} | null;
type AllocData = {
  regime: RegimeName; kellyFraction: number; cashTarget: number;
  overweight: Overweight[]; underweight: Underweight[];
  earlyRotation?: EarlyRotation;
  mode?: string;
};
type CalcResult = {
  regime: string; currency: string; deployable: number; cashReserve: number;
  kellyFraction: number;
  allocations: { ticker: string; name: string; weight: number; amount: number; conviction: number }[];
};

function AssessmentBadge({ assessment }: { assessment: string }) {
  const colors: Record<string, string> = {
    "Still attractive": "#22c55e",
    "Fairly valued": "#eab308",
    Extended: "#ef4444",
  };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded"
      style={{
        color: colors[assessment] || "#888",
        backgroundColor: (colors[assessment] || "#888") + "20",
      }}
    >
      {assessment}
    </span>
  );
}

function AllocationBar({ ticker, weight, color }: { ticker: string; weight: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-[#888] w-10 text-right">{ticker}</span>
      <div className="flex-1 h-5 bg-[#181818] rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${weight}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-[#888] w-10">{weight}%</span>
    </div>
  );
}

function Calculator() {
  const { mode } = useMode();
  const modeConfig = MODE_CONFIG[mode];
  const [portfolioSize, setPortfolioSize] = useState<string>("");
  const [cashAvailable, setCashAvailable] = useState<string>("");
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);

  const calculate = async () => {
    const total = parseFloat(portfolioSize) || 0;
    const cash = parseFloat(cashAvailable) || 0;
    if (total <= 0 || cash <= 0 || !consent) return;

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/calculate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioSize: total, cashAvailable: cash, currency, mode }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // Fallback to client-side calculation
      const deployable = Math.min(cash, total);
      setResult({
        regime: "Stagflation", currency, deployable, cashReserve: 0, kellyFraction: 0,
        allocations: fallback.overweight.map((etf) => ({
          ticker: etf.ticker, name: etf.name, conviction: etf.conviction,
          amount: Math.round((deployable * etf.weight) / 100), weight: etf.weight,
        })),
      });
    }
    setLoading(false);
  };

  const sym = currency === "EUR" ? "€" : "$";

  return (
    <div className="mt-8 p-4 rounded-lg bg-[#111] border border-[#222]">
      <h4 className="text-sm font-bold text-[#e0e0e0] mb-1">Position Calculator</h4>
      <p className="text-xs text-[#555] mb-4">
        Mode: <span style={{ color: modeConfig.color }}>{modeConfig.label}</span>
        {" · "}Cash reserve: {modeConfig.cashPct}%
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setCurrency("EUR")}
          className={`px-3 py-1 text-xs rounded ${currency === "EUR" ? "bg-[#222] text-[#e0e0e0]" : "text-[#555]"}`}
        >
          EUR
        </button>
        <button
          onClick={() => setCurrency("USD")}
          className={`px-3 py-1 text-xs rounded ${currency === "USD" ? "bg-[#222] text-[#e0e0e0]" : "text-[#555]"}`}
        >
          USD
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#555] block mb-1">Total portfolio size ({sym})</label>
          <input
            type="number"
            value={portfolioSize}
            onChange={(e) => setPortfolioSize(e.target.value)}
            placeholder="100000"
            className="w-full bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#555] block mb-1">Cash available to deploy ({sym})</label>
          <input
            type="number"
            value={cashAvailable}
            onChange={(e) => setCashAvailable(e.target.value)}
            placeholder="25000"
            className="w-full bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-[#888] mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="rounded mt-0.5"
        />
        <span>I understand this tool is for educational purposes only and does not constitute financial advice</span>
      </label>

      <button
        onClick={calculate}
        disabled={loading || !consent}
        className="w-full sm:w-auto px-6 py-2 bg-[#222] hover:bg-[#333] text-sm text-[#e0e0e0] rounded transition-colors disabled:opacity-50"
      >
        {loading ? "Calculating..." : "Calculate allocation"}
      </button>

      {result && (
        <div className="mt-4">
          {/* Kelly info bar */}
          <div className="flex flex-wrap gap-4 text-xs text-[#555] mb-3">
            <span>Kelly fraction: <span className="text-[#e0e0e0]">{(result.kellyFraction * 100).toFixed(1)}%</span></span>
            <span>Deployable: <span className="text-[#22c55e]">{sym}{result.deployable.toLocaleString()}</span></span>
            <span>Cash reserve: <span className="text-[#888]">{sym}{result.cashReserve.toLocaleString()}</span></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#555] text-xs uppercase tracking-wider border-b border-[#222]">
                  <th className="text-left py-2">ETF</th>
                  <th className="text-right py-2">Weight</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {result.allocations.map((r) => (
                  <tr key={r.ticker} className="border-b border-[#181818]">
                    <td className="py-2">
                      <span className="font-bold">{r.ticker}</span>
                      <span className="text-[#555] ml-2 text-xs">{r.name}</span>
                    </td>
                    <td className="text-right py-2 text-[#888]">{r.weight}%</td>
                    <td className="text-right py-2 font-bold text-[#22c55e]">
                      {sym}{r.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-right text-xs text-[#555]">
              Total deployed: {sym}{result.allocations.reduce((s, r) => s + r.amount, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-[#333] italic">No user data is stored. Calculation runs on the server and result is discarded.</p>
    </div>
  );
}

export default function PortfolioAllocation() {
  const { mode } = useMode();
  const [data, setData] = useState<AllocData | null>(null);

  useEffect(() => {
    fetch(apiUrl(`/api/allocation?mode=${mode}`))
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [mode]);

  // Use API data or fall back to mock
  const regime = (data?.regime || fallback.regime) as RegimeName;
  const overweight = data?.overweight || fallback.overweight;
  const underweight = data?.underweight || fallback.underweight;
  const regimeColor = REGIME_COLORS[regime].color;

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Current Allocation Recommendation</h2>
      <p className="text-xs text-[#555] mb-6">
        Based on confirmed {regime} regime
        {data?.kellyFraction !== undefined && (
          <span className="ml-2 text-[#888]">· Half-Kelly: {(data.kellyFraction * 100).toFixed(1)}%</span>
        )}
      </p>

      {/* Bar chart */}
      <div className="p-4 rounded-lg bg-[#111] border border-[#222] mb-6">
        {overweight.map((etf) => (
          <AllocationBar key={etf.ticker} ticker={etf.ticker} weight={etf.weight} color={regimeColor} />
        ))}
        {data?.earlyRotation?.positions.map((pos) => (
          <AllocationBar key={pos.ticker} ticker={pos.ticker} weight={pos.weight} color="#eab308" />
        ))}
      </div>

      {/* Overweight / Underweight / Early Rotation columns */}
      <div className={`grid grid-cols-1 ${data?.earlyRotation ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6`}>
        <div>
          <h3 className="text-sm font-bold text-[#22c55e] uppercase tracking-wider mb-3">
            Overweight — Buy/Hold
          </h3>
          <div className="space-y-3">
            {overweight.map((etf) => (
              <div key={etf.ticker} className="p-3 rounded bg-[#111] border border-[#181818]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{etf.ticker} <span className="text-[#555] font-normal text-xs">{etf.name}</span></span>
                  <span className="text-xs text-[#888]">{etf.weight}%</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <AssessmentBadge assessment={etf.priceAssessment} />
                  <span className="text-xs text-[#555]">Conviction: {(etf.conviction * 100).toFixed(0)}%</span>
                  {"timing" in etf && etf.timing && (
                    <span className="text-xs text-[#333]">RSI: {etf.timing.rsi}</span>
                  )}
                </div>
                <p className="text-xs text-[#888]">{etf.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        {data?.earlyRotation && (
          <div>
            <h3 className="text-sm font-bold text-[#eab308] uppercase tracking-wider mb-3">
              Early Rotation — {data.earlyRotation.targetRegime} ({data.earlyRotation.totalPct}%)
            </h3>
            <div className="space-y-3">
              {data.earlyRotation.positions.map((pos) => (
                <div key={pos.ticker} className="p-3 rounded bg-[rgba(234,179,8,0.05)] border border-[rgba(234,179,8,0.2)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{pos.ticker} <span className="text-[#555] font-normal text-xs">{pos.name}</span></span>
                    <span className="text-xs text-[#eab308]">{pos.weight}%</span>
                  </div>
                  <AssessmentBadge assessment={pos.priceAssessment} />
                  <p className="text-xs text-[#888] mt-1">{pos.rationale}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#555] mt-2 italic">
              Regime not yet confirmed. Starter positions only. Full rotation if confirmed.
            </p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-[#ef4444] uppercase tracking-wider mb-3">
            Underweight — Avoid
          </h3>
          <div className="space-y-3">
            {underweight.map((etf) => (
              <div key={etf.ticker} className="p-3 rounded bg-[#111] border border-[#181818]">
                <span className="font-bold text-sm">{etf.ticker} <span className="text-[#555] font-normal text-xs">{etf.name}</span></span>
                <p className="text-xs text-[#888] mt-1">{etf.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-[#555] text-center">
        Buy recommendations factor in current ETF prices relative to historical regime averages. Allocation updates automatically when the regime changes or an early signal fires.
      </p>

      <Calculator />

      <p className="mt-4 text-xs text-[#333] text-center italic">
        This is a systematic framework output, not personalised financial advice. Always do your own research.
      </p>
    </section>
  );
}
