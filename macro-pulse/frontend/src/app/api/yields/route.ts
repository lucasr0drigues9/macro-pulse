import { NextResponse } from "next/server";

// 10Y Treasury yield (DGS10) + 2s10s curve (T10Y2Y) from FRED.

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
    const startDate = "2020-01-01";

    const [dgs10, t10y2y] = await Promise.all([
      fetchFredCsv("DGS10", startDate),
      fetchFredCsv("T10Y2Y", startDate),
    ]);

    if (dgs10.length === 0 || t10y2y.length === 0) {
      return NextResponse.json({ error: "No data from FRED" }, { status: 500 });
    }

    const latest10y = dgs10[dgs10.length - 1];
    const latestCurve = t10y2y[t10y2y.length - 1];

    // Absolute deltas (bps) — for yields, percentage changes can be misleading
    // because a 1% yield moving to 2% is "100% up" but only 100 bps
    const bpsDelta = (series: DataPoint[], daysAgo: number): number | null => {
      if (series.length < daysAgo + 1) return null;
      const past = series[series.length - 1 - daysAgo].value;
      const current = series[series.length - 1].value;
      return Math.round((current - past) * 100); // bps
    }

    // DGS10 is daily (roughly 21 trading days/month, 63/quarter, 252/year)
    const change1m = bpsDelta(dgs10, 21);
    const change3m = bpsDelta(dgs10, 63);
    const change12m = bpsDelta(dgs10, 252);

    // Curve trajectory
    const curveChange3m = bpsDelta(t10y2y, 63);

    // Trend over 3 months
    const trend =
      change3m === null ? "flat" : change3m > 20 ? "rising" : change3m < -20 ? "falling" : "flat";

    // Curve regime
    const curveRegime =
      latestCurve.value > 0.5
        ? "steep"
        : latestCurve.value > 0
        ? "normal"
        : latestCurve.value > -0.25
        ? "flat"
        : "inverted";

    // Sparkline — last ~63 trading days (3 months), every 3rd point for ~21 points
    const sparkData = dgs10.slice(-63).filter((_, i) => i % 3 === 0);

    return NextResponse.json({
      latest: {
        date: latest10y.date,
        tenYear: Math.round(latest10y.value * 100) / 100,
        curve: Math.round(latestCurve.value * 100) / 100,
      },
      changes: {
        oneMonthBps: change1m,
        threeMonthBps: change3m,
        twelveMonthBps: change12m,
        curveThreeMonthBps: curveChange3m,
      },
      trend,
      curveRegime,
      sparkline: sparkData.map((p) => ({
        date: p.date,
        value: Math.round(p.value * 100) / 100,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
