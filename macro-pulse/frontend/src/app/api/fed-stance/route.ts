import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fed stance = synthesis of policy rate trajectory + liquidity trend + 10Y yield direction.
// Tepper principle: "Don't fight the Fed." This is the top-level signal that drives everything else.

type DataPoint = { date: string; value: number };

async function fetchFredCsv(seriesId: string, startDate: string): Promise<DataPoint[]> {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${startDate}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`FRED ${seriesId}: ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n");
  return lines
    .slice(1)
    .map((line) => {
      const [date, valueStr] = line.split(",");
      return { date, value: parseFloat(valueStr) };
    })
    .filter((p) => !isNaN(p.value));
}

export async function GET() {
  try {
    // Fed funds target (upper bound) — monthly. 6 months = ~6 data points.
    const startDate = "2024-01-01";

    // DFEDTARU = Federal Funds Target Range - Upper Limit (daily)
    // Using daily to get latest, but we'll sample 6mo ago for comparison
    const [targetRate, dgs10, walcl, tga, rrp] = await Promise.all([
      fetchFredCsv("DFEDTARU", startDate),
      fetchFredCsv("DGS10", startDate),
      fetchFredCsv("WALCL", startDate),
      fetchFredCsv("WTREGEN", startDate),
      fetchFredCsv("RRPONTSYD", startDate),
    ]);

    if (targetRate.length < 2 || dgs10.length < 60) {
      return NextResponse.json({ error: "Insufficient FRED data" }, { status: 500 });
    }

    // Policy rate direction — compare latest vs 6 months ago (~180 trading days)
    const latestRate = targetRate[targetRate.length - 1].value;
    const ratePast = targetRate[Math.max(0, targetRate.length - 180)].value;
    const rateDelta = latestRate - ratePast; // in percentage points
    const policyTrend: "hike" | "cut" | "hold" =
      rateDelta > 0.1 ? "hike" : rateDelta < -0.1 ? "cut" : "hold";

    // 10Y yield direction — 3 month change
    const latest10y = dgs10[dgs10.length - 1].value;
    const past10y = dgs10[Math.max(0, dgs10.length - 63)].value;
    const yield10yDelta = (latest10y - past10y) * 100; // bps
    const yieldTrend: "rising" | "falling" | "flat" =
      yield10yDelta > 20 ? "rising" : yield10yDelta < -20 ? "falling" : "flat";

    // Liquidity trend (mirror the liquidity route)
    const tgaMap = new Map(tga.map((p) => [p.date, p.value]));
    const findNearestBefore = (series: DataPoint[], target: string): number | null => {
      const eligible = series.filter((p) => p.date <= target);
      return eligible.length ? eligible[eligible.length - 1].value : null;
    };
    const netLiquidity: DataPoint[] = [];
    for (const w of walcl) {
      const tgaVal = tgaMap.get(w.date);
      const rrpVal = findNearestBefore(rrp, w.date);
      if (tgaVal !== undefined && rrpVal !== null) {
        netLiquidity.push({ date: w.date, value: w.value - tgaVal - rrpVal * 1000 });
      }
    }
    const liqLatest = netLiquidity[netLiquidity.length - 1].value;
    const liqPast = netLiquidity[Math.max(0, netLiquidity.length - 13)].value; // ~3 months (weekly)
    const liqDelta = ((liqLatest - liqPast) / Math.abs(liqPast)) * 100;
    const liquidityTrend: "expanding" | "contracting" | "flat" =
      liqDelta > 1 ? "expanding" : liqDelta < -1 ? "contracting" : "flat";

    // ── Classify Fed stance ──
    // Hawkish: hiking OR (hold + contracting + rising yields)
    // Dovish: cutting OR (hold + expanding + falling yields)
    // Paralyzed: hold + flat liquidity + flat yields (the "Fed stuck" state)
    // Transitioning: mixed signals that don't fit the above

    let stance: "hawkish" | "dovish" | "paralyzed" | "transitioning";
    let confidence: "high" | "medium" | "low";
    let reason: string;

    const hawkCount = [
      policyTrend === "hike",
      liquidityTrend === "contracting",
      yieldTrend === "rising",
    ].filter(Boolean).length;
    const doveCount = [
      policyTrend === "cut",
      liquidityTrend === "expanding",
      yieldTrend === "falling",
    ].filter(Boolean).length;

    if (hawkCount >= 2 && doveCount === 0) {
      stance = "hawkish";
      confidence = hawkCount === 3 ? "high" : "medium";
      reason = `Rates ${policyTrend === "hike" ? "rising" : "held high"}, liquidity ${liquidityTrend}, yields ${yieldTrend}. Growth stocks face headwind.`;
    } else if (doveCount >= 2 && hawkCount === 0) {
      stance = "dovish";
      confidence = doveCount === 3 ? "high" : "medium";
      reason = `Rates ${policyTrend === "cut" ? "falling" : "held low"}, liquidity ${liquidityTrend}, yields ${yieldTrend}. Growth stocks get tailwind.`;
    } else if (policyTrend === "hold" && liquidityTrend === "flat" && yieldTrend === "flat") {
      stance = "paralyzed";
      confidence = "high";
      reason = "Fed on hold, liquidity flat, yields flat. Markets in consolidation — waiting for a catalyst.";
    } else {
      stance = "transitioning";
      confidence = "low";
      const dominant = hawkCount > doveCount ? "hawkish" : doveCount > hawkCount ? "dovish" : "mixed";
      reason = `Mixed signals (${hawkCount} hawkish, ${doveCount} dovish). Leaning ${dominant}.`;
    }

    return NextResponse.json({
      stance,
      confidence,
      reason,
      components: {
        policyRate: {
          latest: latestRate,
          past: ratePast,
          deltaPct: Math.round(rateDelta * 100) / 100,
          trend: policyTrend,
        },
        liquidity: {
          trend: liquidityTrend,
          deltaPct: Math.round(liqDelta * 10) / 10,
        },
        yields: {
          latest: latest10y,
          deltaBps: Math.round(yield10yDelta),
          trend: yieldTrend,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
