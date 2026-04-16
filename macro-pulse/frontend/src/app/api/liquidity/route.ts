import { NextResponse } from "next/server";

// Net Liquidity = Fed Balance Sheet - Treasury General Account - Reverse Repo
// All in millions of USD (from FRED)

type DataPoint = { date: string; value: number };

async function fetchFredCsv(seriesId: string, startDate: string): Promise<DataPoint[]> {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${startDate}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`FRED ${seriesId}: ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n");
  // Skip header
  return lines
    .slice(1)
    .map((line) => {
      const [date, valueStr] = line.split(",");
      const value = parseFloat(valueStr);
      return { date, value };
    })
    .filter((p) => !isNaN(p.value));
}

// Align two series by date (returns only dates present in both)
function alignSeries(a: DataPoint[], b: DataPoint[]): { date: string; a: number; b: number }[] {
  const bMap = new Map(b.map((p) => [p.date, p.value]));
  return a
    .filter((p) => bMap.has(p.date))
    .map((p) => ({ date: p.date, a: p.value, b: bMap.get(p.date)! }));
}

// For weekly series (WALCL), find the nearest date on or before target
function findNearestBefore(series: DataPoint[], target: string): number | null {
  const eligible = series.filter((p) => p.date <= target);
  if (eligible.length === 0) return null;
  return eligible[eligible.length - 1].value;
}

export async function GET() {
  try {
    const startDate = "2020-01-01"; // ~5 years of history

    // Fetch all three series in parallel
    const [walcl, tga, rrp] = await Promise.all([
      fetchFredCsv("WALCL", startDate),       // Fed balance sheet (weekly, Wed)
      fetchFredCsv("WTREGEN", startDate),      // Treasury General Account (weekly, Wed)
      fetchFredCsv("RRPONTSYD", startDate),    // Reverse Repo (daily)
    ]);

    if (walcl.length === 0 || tga.length === 0 || rrp.length === 0) {
      return NextResponse.json({ error: "No data from FRED" }, { status: 500 });
    }

    // Build net liquidity time series using WALCL dates (weekly, Wednesdays)
    // For each WALCL date, find matching TGA (same date) and nearest RRP value
    const tgaMap = new Map(tga.map((p) => [p.date, p.value]));

    const netLiquidity: DataPoint[] = [];
    for (const w of walcl) {
      const tgaVal = tgaMap.get(w.date);
      const rrpVal = findNearestBefore(rrp, w.date);
      if (tgaVal !== undefined && rrpVal !== null) {
        // WALCL is in millions, TGA in millions, RRP in billions → convert RRP to millions
        const net = w.value - tgaVal - rrpVal * 1000;
        netLiquidity.push({ date: w.date, value: net });
      }
    }

    if (netLiquidity.length === 0) {
      return NextResponse.json({ error: "No aligned data points" }, { status: 500 });
    }

    // Current values
    const latest = netLiquidity[netLiquidity.length - 1];
    const latestWalcl = walcl[walcl.length - 1];
    const latestTga = tga[tga.length - 1];
    const latestRrp = rrp[rrp.length - 1];

    // Compute changes
    function changeVsN(series: DataPoint[], weeksAgo: number): number | null {
      if (series.length < weeksAgo + 1) return null;
      const past = series[series.length - 1 - weeksAgo].value;
      const current = series[series.length - 1].value;
      return ((current - past) / Math.abs(past)) * 100;
    }

    // WALCL is weekly, so 4 weeks = 1 month, 13 weeks = 3 months, 52 weeks = 1 year
    const change1m = changeVsN(netLiquidity, 4);
    const change3m = changeVsN(netLiquidity, 13);
    const change12m = changeVsN(netLiquidity, 52);

    // Direction over last 3 months
    const trend =
      change3m === null ? "flat" : change3m > 1 ? "expanding" : change3m < -1 ? "contracting" : "flat";

    // Sparkline data — last 52 weeks, downsampled to ~26 points
    const sparkData = netLiquidity.slice(-52).filter((_, i) => i % 2 === 0);

    // Peak and trough in the last 5 years
    const peakPoint = netLiquidity.reduce((max, p) => (p.value > max.value ? p : max), netLiquidity[0]);
    const troughPoint = netLiquidity.reduce((min, p) => (p.value < min.value ? p : min), netLiquidity[0]);
    const pctFromPeak = ((latest.value - peakPoint.value) / peakPoint.value) * 100;

    return NextResponse.json({
      latest: {
        date: latest.date,
        netLiquidity: Math.round(latest.value / 1000), // convert to billions
        fedBalanceSheet: Math.round(latestWalcl.value / 1000),
        tga: Math.round(latestTga.value / 1000),
        rrp: Math.round(latestRrp.value), // already in billions
      },
      changes: {
        oneMonth: change1m !== null ? Math.round(change1m * 10) / 10 : null,
        threeMonth: change3m !== null ? Math.round(change3m * 10) / 10 : null,
        twelveMonth: change12m !== null ? Math.round(change12m * 10) / 10 : null,
      },
      trend,
      peak: {
        date: peakPoint.date,
        value: Math.round(peakPoint.value / 1000),
      },
      trough: {
        date: troughPoint.date,
        value: Math.round(troughPoint.value / 1000),
      },
      pctFromPeak: Math.round(pctFromPeak * 10) / 10,
      sparkline: sparkData.map((p) => ({
        date: p.date,
        value: Math.round(p.value / 1000),
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
