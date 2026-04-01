"""
Determines which of Dalio's 4 Economic Quadrants we're currently in.

Axes:
  Growth    — is the economy growing above or below trend?
  Inflation — is inflation rising or falling?

Quadrants:
  1. Rising growth  + Falling inflation  → Goldilocks   (best for stocks)
  2. Rising growth  + Rising inflation   → Reflation    (best for commodities)
  3. Falling growth + Rising inflation   → Stagflation  (worst — cash/commodities)
  4. Falling growth + Falling inflation  → Deflation    (best for bonds)

Methodology:
  Instead of checking if levels are higher (almost always true),
  we check if the RATE of change is accelerating or decelerating.
  Short-term momentum (3-period) vs long-term trend (12-period for monthly,
  4-period for quarterly). Accelerating = "rising", decelerating = "falling".
"""

def pct_change(values, periods=3):
    """Simple percent change over N periods. Values are descending (newest first)."""
    if len(values) < periods + 1:
        return None
    latest = values[0][1]
    prior  = values[periods][1]
    if prior == 0:
        return None
    return round((latest - prior) / abs(prior) * 100, 2)


def momentum_direction(values, short=3, long=12):
    """Compare short-term rate of change to long-term rate of change.
    Returns +1 if accelerating, -1 if decelerating, None if insufficient data.
    Values are descending (newest first).
    """
    if len(values) < long + 1:
        # Fall back to simple direction if not enough history for long window
        change = pct_change(values, short)
        if change is None:
            return None
        return 1 if change > 0 else -1

    latest = values[0][1]
    short_prior = values[short][1]
    long_prior  = values[long][1]

    if short_prior == 0 or long_prior == 0:
        return None

    # Annualise both rates to make them comparable
    short_rate = (latest / short_prior) ** (12 / short) - 1
    long_rate  = (latest / long_prior) ** (12 / long) - 1

    return 1 if short_rate > long_rate else -1


def assess_growth(data):
    # GDP: quarterly data — compare 1-quarter change to 2-quarter trend
    gdp_dir   = momentum_direction(data["gdp"], short=1, long=4)
    gdp_change = pct_change(data["gdp"], periods=1)  # Latest quarter-over-quarter

    # Unemployment: rising = bad for growth (inverted)
    # Use simple 3-month change — unemployment is already a rate
    unemp_change = pct_change(data["unemployment"], periods=3)
    unemp_dir = None
    if unemp_change is not None:
        # Rising unemployment = falling growth (inverted), with dead zone
        unemp_dir = -1 if unemp_change > 0.3 else (1 if unemp_change < -0.3 else 0)

    # Retail sales: short vs long momentum
    retail_dir   = momentum_direction(data["retail_sales"], short=3, long=12)
    retail_change = pct_change(data["retail_sales"], periods=3)

    signals = []
    if gdp_dir is not None:
        signals.append(gdp_dir)
    if unemp_dir is not None and unemp_dir != 0:
        signals.append(unemp_dir)
    if retail_dir is not None:
        signals.append(retail_dir)

    score = sum(signals) / len(signals) if signals else 0
    return {
        "direction": "rising" if score > 0 else "falling",
        "score":     round(score, 2),
        "detail": {
            "gdp_change_pct":    gdp_change,
            "unemp_change_pct":  unemp_change,
            "retail_change_pct": retail_change,
        }
    }


def assess_inflation(data):
    # For each inflation indicator: is the rate accelerating or decelerating?
    cpi_dir   = momentum_direction(data["cpi"], short=3, long=12)
    pce_dir   = momentum_direction(data["pce"], short=3, long=12)
    ppi_dir   = momentum_direction(data["ppi"], short=3, long=12)

    cpi_change = pct_change(data["cpi"], periods=3)
    pce_change = pct_change(data["pce"], periods=3)
    ppi_change = pct_change(data["ppi"], periods=3)

    signals = []
    for d in [cpi_dir, pce_dir, ppi_dir]:
        if d is not None:
            signals.append(d)

    score = sum(signals) / len(signals) if signals else 0
    return {
        "direction": "rising" if score > 0 else "falling",
        "score":     round(score, 2),
        "detail": {
            "cpi_change_pct": cpi_change,
            "pce_change_pct": pce_change,
            "ppi_change_pct": ppi_change,
        }
    }


QUADRANTS = {
    ("rising",  "falling"): {
        "name":        "Goldilocks",
        "number":      1,
        "emoji":       "🟢",
        "description": "Growth above trend, inflation cooling. Best environment for stocks and credit.",
        "best_assets":  ["Equities", "Corporate bonds", "Real estate"],
        "worst_assets": ["Cash", "Commodities"],
    },
    ("rising",  "rising"): {
        "name":        "Reflation",
        "number":      2,
        "emoji":       "🟡",
        "description": "Growth and inflation both rising. Commodities and real assets outperform.",
        "best_assets":  ["Commodities", "Energy stocks", "TIPS", "Real estate"],
        "worst_assets": ["Long-duration bonds", "Growth stocks"],
    },
    ("falling", "rising"): {
        "name":        "Stagflation",
        "number":      3,
        "emoji":       "🔴",
        "description": "The worst quadrant. Growth slowing while inflation rises.",
        "best_assets":  ["Cash", "Commodities", "Gold"],
        "worst_assets": ["Equities", "Bonds", "Credit"],
    },
    ("falling", "falling"): {
        "name":        "Deflation",
        "number":      4,
        "emoji":       "🔵",
        "description": "Growth and inflation both falling. Bonds and defensive assets outperform.",
        "best_assets":  ["Government bonds", "Defensive equities", "Cash"],
        "worst_assets": ["Commodities", "Cyclical stocks", "Credit"],
    },
}

def get_quadrant(data):
    growth    = assess_growth(data)
    inflation = assess_inflation(data)
    key       = (growth["direction"], inflation["direction"])
    quadrant  = QUADRANTS[key]
    return {
        "quadrant":  quadrant,
        "growth":    growth,
        "inflation": inflation,
    }

if __name__ == "__main__":
    from fred import get_all
    data   = get_all()
    result = get_quadrant(data)
    q = result["quadrant"]
    g = result["growth"]
    i = result["inflation"]
    print(f"\n{'='*60}")
    print(f"  {q['emoji']}  Quadrant {q['number']}: {q['name'].upper()}")
    print(f"{'='*60}")
    print(f"\n  {q['description']}")
    print(f"\n  Growth:    {g['direction'].upper()}  (score: {g['score']})")
    for k, v in g["detail"].items():
        print(f"    {k}: {v}%")
    print(f"\n  Inflation: {i['direction'].upper()}  (score: {i['score']})")
    for k, v in i["detail"].items():
        print(f"    {k}: {v}%")
    print(f"\n  Best assets:  {', '.join(q['best_assets'])}")
    print(f"  Worst assets: {', '.join(q['worst_assets'])}")
    print(f"\n{'='*60}\n")
