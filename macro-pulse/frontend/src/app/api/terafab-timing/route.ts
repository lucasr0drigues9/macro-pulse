import { NextResponse } from "next/server";

const LAYERS = [
  { ticker: "AIQ",  ucits: "WTAI.L",  layer: "AI & Autonomous",     color: "#c084fc" },
  { ticker: "SMH",  ucits: "SEMI.L",  layer: "AI Chips",            color: "#3b82f6" },
  { ticker: "BOTZ", ucits: "RBOT.L",  layer: "Robotics",            color: "#22c55e" },
  { ticker: "ARKQ", ucits: null,       layer: "Autonomous Tech",     color: "#22c55e" },
  { ticker: "COPX", ucits: "COPP.L",  layer: "Copper & Wiring",     color: "#e09030" },
  { ticker: "LIT",  ucits: null,       layer: "Lithium & Batteries", color: "#a855f7" },
  { ticker: "REMX", ucits: null,       layer: "Rare Earths",         color: "#ef4444" },
  { ticker: "ICLN", ucits: "INRG.L",  layer: "Energy & Power",      color: "#eab308" },
];

async function fetchOne(symbol: string, layer: string, color: string, isUcits: boolean) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } });
  const json = await r.json();
  const closes: (number | null)[] = json.chart.result[0].indicators.quote[0].close;
  const valid = closes.filter((c): c is number => c !== null);
  if (valid.length < 50) return null;

  const current = valid[valid.length - 1];
  const high52w = Math.max(...valid);
  const low52w = Math.min(...valid);
  const ma200Slice = valid.slice(-200);
  const ma200 = ma200Slice.reduce((a, b) => a + b, 0) / ma200Slice.length;

  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = valid.length - 14; i < valid.length; i++) {
    const diff = valid[i] - valid[i - 1];
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }
  const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
  const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
  const rsi = Math.round(100 - 100 / (1 + rs));

  const drawdown = Math.round((current - high52w) / high52w * 1000) / 10;
  const vsMa200 = Math.round((current - ma200) / ma200 * 1000) / 10;
  const ret1y = Math.round((current - valid[0]) / valid[0] * 1000) / 10;

  let score = 0;
  if (vsMa200 < -10) score += 3; else if (vsMa200 < 0) score += 2; else if (vsMa200 < 5) score += 1;
  if (rsi < 30) score += 3; else if (rsi < 40) score += 2; else if (rsi < 50) score += 1;
  if (drawdown < -20) score += 3; else if (drawdown < -10) score += 2; else if (drawdown < -5) score += 1;

  const signal = score >= 7 ? "Strong Buy" : score >= 5 ? "Buy" : score >= 3 ? "Wait for pullback" : "Extended";

  return {
    ticker: symbol, layer, color, isUcits,
    price: Math.round(current * 100) / 100, rsi, vsMa200, drawdown,
    high52w: Math.round(high52w * 100) / 100,
    low52w: Math.round(low52w * 100) / 100,
    ret1y, score, signal,
  };
}

export async function GET() {
  const promises = LAYERS.flatMap((l) => {
    const arr = [fetchOne(l.ticker, l.layer, l.color, false).catch(() => null)];
    if (l.ucits) arr.push(fetchOne(l.ucits, l.layer, l.color, true).catch(() => null));
    return arr;
  });

  const results = (await Promise.all(promises)).filter((r) => r !== null);
  results.sort((a, b) => b!.score - a!.score || a!.drawdown - b!.drawdown);

  return NextResponse.json({ etfs: results });
}
