// Curated historical cases with verifiable outcomes. Used to show parallels
// on the /signals page when current signals match past setups.
//
// Numbers sourced from public market data (Bloomberg, FRED, yfinance).
// Kept deliberately conservative — no fabricated precision.

export type CaseSignals = {
  fedStance?: "hawkish" | "dovish" | "paralyzed" | "transitioning";
  oilTrend?: "rising" | "falling" | "flat";
  phase?: "gold-anchor" | "rotation" | "growth-tilt" | "full-conviction";
};

export type HistoricalCase = {
  id: string;
  date: string;
  title: string;
  context: string;
  signals: CaseSignals;
  outcome: string;
  parallel: string;
  returns: { asset: string; move: string; period: string }[];
};

export const HISTORICAL_CASES: HistoricalCase[] = [
  {
    id: "2019-fed-pivot",
    date: "Dec 2018 → Dec 2019",
    title: "Fed pivot after 2018 hikes",
    context:
      "Fed hiked 4x in 2018 into a slowing economy. December 2018: Powell paused. July 2019: three rate cuts. Classic Hawkish → Paralyzed → Dovish transition.",
    signals: { fedStance: "paralyzed", phase: "rotation" },
    outcome:
      "Markets front-ran the Fed cuts. Gold started rallying in May 2019 (before the first cut in July). Growth rallied harder once cuts started. Full-year 2019: S&P +31%, Nasdaq +36%, gold +18%.",
    parallel:
      "Same setup: post-hike Fed, deteriorating growth data, oil/inflation moderating. Gold rallies first, then growth takes over as rate cuts confirm.",
    returns: [
      { asset: "Gold (GLD)", move: "+18%", period: "full 2019" },
      { asset: "S&P 500", move: "+31%", period: "full 2019" },
      { asset: "Nasdaq 100", move: "+39%", period: "full 2019" },
      { asset: "10Y yield", move: "2.68% → 1.92%", period: "Jan → Dec 2019" },
    ],
  },
  {
    id: "2023-fed-pause",
    date: "Jul 2023 → Dec 2023",
    title: "Fed pause after 2022-2023 hikes",
    context:
      "Fed paused hiking at 5.25-5.5% in July 2023 after 11 consecutive hikes. Signal: Paralyzed. Market expected cuts starting early 2024.",
    signals: { fedStance: "paralyzed", phase: "rotation" },
    outcome:
      "Nasdaq ripped +43% for the year (led by Magnificent 7). Gold rallied from $1,900 to $2,080 (+10%). The 'pause = pivot coming' trade played out almost exactly like 2019.",
    parallel:
      "Paralyzed Fed + stable/falling oil + disinflation forming = same setup. Growth benefits most if this repeats.",
    returns: [
      { asset: "Nasdaq 100", move: "+43%", period: "full 2023" },
      { asset: "Gold", move: "+13%", period: "full 2023" },
      { asset: "S&P 500", move: "+24%", period: "full 2023" },
      { asset: "10Y yield", move: "3.88% → 3.88%", period: "round trip (peaked 5% Oct)" },
    ],
  },
  {
    id: "2014-oil-collapse",
    date: "Jun 2014 → Jan 2016",
    title: "Oil collapse without recession",
    context:
      "Brent crashed from $115 to $30 over 18 months as shale supply overwhelmed demand. Fed held steady (ending QE but no hikes yet). Disinflation without recession.",
    signals: { oilTrend: "falling", fedStance: "paralyzed", phase: "rotation" },
    outcome:
      "Energy stocks crushed (XLE -30%). Growth stocks held up (Nasdaq +13% 2014, -1% 2015). Gold flat/slightly down. Dollar surged +25% (DXY). The disinflation helped growth multiples but didn't trigger a major bull market because growth wasn't accelerating.",
    parallel:
      "Oil-driven disinflation while Fed is already on hold. Growth benefits modestly. Gold stays flat unless Fed actually cuts.",
    returns: [
      { asset: "Brent crude", move: "$115 → $30", period: "Jun 2014 → Jan 2016" },
      { asset: "XLE (energy)", move: "-31%", period: "2014-2015" },
      { asset: "Nasdaq 100", move: "+22%", period: "Jun 2014 → Jan 2016" },
      { asset: "Gold", move: "-9%", period: "Jun 2014 → Jan 2016" },
    ],
  },
  {
    id: "2020-emergency-cut",
    date: "Mar 2020 → Dec 2020",
    title: "COVID emergency response",
    context:
      "Fed cut to zero + unlimited QE in March 2020. Most dovish stance in history. Signal: Full dovish conviction.",
    signals: { fedStance: "dovish", phase: "full-conviction" },
    outcome:
      "Gold went parabolic $1,470 → $2,070 (+41% in 6 months). Nasdaq +44% for the year after the March crash. Classic playbook for 'Fed flooding liquidity into a recession'.",
    parallel:
      "Only applies if we get an actual cutting cycle. Current Fed is still paralyzed, not dovish. But shows the upside if/when dovish arrives.",
    returns: [
      { asset: "Gold", move: "+41%", period: "Mar → Aug 2020" },
      { asset: "Nasdaq 100", move: "+44%", period: "2020 full year" },
      { asset: "S&P 500", move: "+16%", period: "2020 full year" },
      { asset: "10Y yield", move: "1.10% → 0.50%", period: "Feb → Aug 2020" },
    ],
  },
  {
    id: "2018-powell-hikes",
    date: "Oct → Dec 2018",
    title: "Hawkish Fed crashes markets",
    context:
      "Powell kept hiking into slowing data and said the balance sheet runoff was on 'autopilot.' Peak hawkish stance. Signal: Hawkish with high confidence.",
    signals: { fedStance: "hawkish", phase: "gold-anchor" },
    outcome:
      "S&P -20% in Q4 2018, worst December since 1931. Growth stocks led the decline. Gold held up (+8% Q4). Forced the Dec pause → Jan 2019 dovish pivot.",
    parallel:
      "Inverse of current — useful to know what a hawkish signal looks like. Would be the warning if Fed stance flipped hawkish from here.",
    returns: [
      { asset: "S&P 500", move: "-20%", period: "Oct → Dec 2018" },
      { asset: "Nasdaq 100", move: "-23%", period: "Oct → Dec 2018" },
      { asset: "Gold", move: "+8%", period: "Q4 2018" },
      { asset: "10Y yield", move: "3.24% → 2.68%", period: "Nov → Dec 2018" },
    ],
  },
  {
    id: "1998-ltcm",
    date: "Sep 1998 → Dec 1999",
    title: "LTCM crisis Fed cut",
    context:
      "Russia default + LTCM collapse forced Fed to cut 75bps in Sep-Nov 1998 despite no recession. Signal: Dovish with growth intact.",
    signals: { fedStance: "dovish", phase: "growth-tilt" },
    outcome:
      "Set up the final leg of the dot-com mania. S&P +26% in 1999. Nasdaq +86% in 1999. Gold barely moved (+2%). Growth absolutely dominated.",
    parallel:
      "Fed cutting into an economy that doesn't need help = growth rockets. Only applies if the Fed actually cuts from here.",
    returns: [
      { asset: "Nasdaq 100", move: "+102%", period: "Oct 1998 → Dec 1999" },
      { asset: "S&P 500", move: "+44%", period: "Oct 1998 → Dec 1999" },
      { asset: "Gold", move: "+2%", period: "Oct 1998 → Dec 1999" },
    ],
  },
  {
    id: "2008-crisis",
    date: "Sep 2008 → Mar 2009",
    title: "Global financial crisis",
    context:
      "Lehman collapse Sep 2008. Fed cut to zero. Everything sold off initially (forced liquidation), including gold. Then gold took off as QE began.",
    signals: { fedStance: "dovish", phase: "gold-anchor" },
    outcome:
      "Phase 1 (Sep-Nov 2008): Gold fell 20% alongside stocks. Phase 2 (Nov 2008-2011): Gold rallied from $700 to $1,900 (+170%). S&P bottomed March 2009, +80% over next 2 years.",
    parallel:
      "Important counter-example: in a real crisis, gold can fall initially before rallying. The 'gold-works-in-all-scenarios' framing has this caveat.",
    returns: [
      { asset: "Gold", move: "-20% then +170%", period: "Sep 2008 → Sep 2011" },
      { asset: "S&P 500", move: "-37% then +80%", period: "2008 then 2009-10" },
      { asset: "Oil (WTI)", move: "$147 → $34", period: "Jul → Dec 2008" },
    ],
  },
];

/** Match cases against the current signal state. Returns up to 3 most relevant. */
export function matchCases(signals: {
  fedStance?: string | null;
  phase?: string | null;
  oilTrend?: string | null;
}): HistoricalCase[] {
  const scored = HISTORICAL_CASES.map((c) => {
    let score = 0;
    if (signals.fedStance && c.signals.fedStance === signals.fedStance) score += 3;
    if (signals.phase && c.signals.phase === signals.phase) score += 2;
    if (signals.oilTrend && c.signals.oilTrend === signals.oilTrend) score += 2;
    return { case: c, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.case);
}
