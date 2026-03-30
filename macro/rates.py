"""
Interest rate cycle analysis based on Ray Dalio's framework.
Tracks short-term rate cycle (Fed policy) and long-term debt cycle.

Key concepts:
  - Real interest rate = Fed Funds Rate - CPI inflation
  - Neutral rate ~ 2.5% (neither stimulative nor restrictive)
  - Debt/GDP > 100% = late long-term debt cycle
  - Rate trend = are we hiking, cutting or holding?
"""
import os, json, requests
from datetime import datetime, timedelta

FRED_KEY  = os.getenv("FRED_API_KEY")
CACHE_DIR = ".macro_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

RATE_SERIES = {
    "fed_funds":    "FEDFUNDS",          # Effective Fed Funds Rate
    "cpi":          "CPIAUCSL",          # CPI (for real rate calc)
    "debt_gdp":     "GFDEGDQ188S",       # Federal debt as % of GDP
    "mortgage_30y": "MORTGAGE30US",      # 30yr mortgage rate
    "debt_service": "TDSP",             # Household debt service ratio
    "m2":           "M2SL",             # Money supply (liquidity)
}

def fetch_series(series_id, limit=14):
    cache_file = f"{CACHE_DIR}/rates_{series_id}.json"
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(hours=24):
            return json.load(open(cache_file))
    try:
        url = "https://api.stlouisfed.org/fred/series/observations"
        params = {
            "series_id":  series_id,
            "api_key":    FRED_KEY,
            "file_type":  "json",
            "sort_order": "desc",
            "limit":      limit,
        }
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json().get("observations", [])
        vals = [(o["date"], float(o["value"]))
                for o in data if o["value"] != "."]
        json.dump(vals, open(cache_file, "w"))
        return vals
    except Exception as e:
        print(f"  ⚠️  Failed to fetch {series_id}: {e}")
        return []

def get_rate_data():
    result = {}
    for name, series_id in RATE_SERIES.items():
        print(f"  Fetching {name} ({series_id})...")
        result[name] = fetch_series(series_id)
    return result

def assess_rates(data):
    fed       = data.get("fed_funds", [])
    cpi       = data.get("cpi", [])
    debt_gdp  = data.get("debt_gdp", [])
    mortgage  = data.get("mortgage_30y", [])
    debt_svc  = data.get("debt_service", [])
    m2        = data.get("m2", [])

    # Current Fed Funds Rate
    fed_rate     = fed[0][1] if fed else None
    fed_6m_ago   = fed[5][1] if len(fed) > 5 else None
    fed_12m_ago  = fed[11][1] if len(fed) > 11 else None

    # Rate trend
    if fed_rate and fed_6m_ago:
        rate_change_6m = round(fed_rate - fed_6m_ago, 3)
        if rate_change_6m > 0.25:
            rate_trend = "hiking"
            trend_emoji = "📈"
        elif rate_change_6m < -0.25:
            rate_trend = "cutting"
            trend_emoji = "📉"
        else:
            rate_trend = "holding"
            trend_emoji = "↔️"
    else:
        rate_trend  = "unknown"
        trend_emoji = "❓"
        rate_change_6m = None

    # Real interest rate = Fed Funds - CPI YoY
    cpi_latest = float(cpi[0][1])  if cpi else None
    cpi_12m    = float(cpi[12][1]) if len(cpi) > 12 else None
    cpi_yoy    = round((cpi_latest - cpi_12m) / abs(cpi_12m) * 100, 2) if cpi_latest and cpi_12m and cpi_12m != 0 else None
    real_rate  = round(fed_rate - cpi_yoy, 2) if (fed_rate is not None and cpi_yoy is not None) else None

    # Rate environment
    NEUTRAL_RATE = 2.5
    if real_rate is None:
        rate_env = "unknown"
        rate_env_emoji = "❓"
    elif real_rate > 2.0:
        rate_env = "highly restrictive"
        rate_env_emoji = "🔴"
    elif real_rate > 0.5:
        rate_env = "restrictive"
        rate_env_emoji = "🟡"
    elif real_rate > -0.5:
        rate_env = "neutral"
        rate_env_emoji = "🟢"
    else:
        rate_env = "stimulative"
        rate_env_emoji = "🟢"

    # Long-term debt cycle
    debt_pct     = debt_gdp[0][1] if debt_gdp else None
    if debt_pct is None:
        lt_cycle = "unknown"
        lt_emoji = "❓"
    elif debt_pct > 130:
        lt_cycle = "extreme late cycle — debt crisis risk"
        lt_emoji = "🔴🔴"
    elif debt_pct > 100:
        lt_cycle = "late cycle — elevated debt burden"
        lt_emoji = "🔴"
    elif debt_pct > 70:
        lt_cycle = "mid cycle — manageable debt"
        lt_emoji = "🟡"
    else:
        lt_cycle = "early cycle — low debt burden"
        lt_emoji = "🟢"

    # Mortgage rate
    mortgage_rate = mortgage[0][1] if mortgage else None

    # Debt service ratio
    debt_svc_pct = debt_svc[0][1] if debt_svc else None

    # M2 money supply trend
    m2_latest = m2[0][1] if m2 else None
    m2_6m_ago = m2[5][1] if len(m2) > 5 else None
    m2_growth  = round((m2_latest - m2_6m_ago) / m2_6m_ago * 100, 2) if m2_latest and m2_6m_ago else None
    m2_trend   = "expanding" if (m2_growth and m2_growth > 0) else "contracting"

    # Quadrant impact
    def quadrant_impact(quadrant, rate_trend, rate_env):
        impacts = {
            ("Reflation", "holding", "restrictive"): (
                "Commodities/energy still favoured. Growth stocks partially "
                "protected by rate pause. Real estate constrained by high "
                "mortgage rates. Rate cuts would trigger broader rally."
            ),
            ("Reflation", "hiking", "restrictive"): (
                "Worst case for growth stocks — avoid. Commodities and "
                "energy strongly favoured. Bonds crushed. This was 2022."
            ),
            ("Reflation", "cutting", "neutral"): (
                "Best Reflation environment. Everything rallies but "
                "commodities lead. Growth stocks can participate."
            ),
            ("Goldilocks", "cutting", "neutral"): (
                "Ideal environment. Growth stocks, credit, real estate "
                "all perform well. Stay long risk assets."
            ),
            ("Stagflation", "holding", "restrictive"): (
                "Most dangerous combination. Cash and gold only refuges. "
                "Avoid equities and bonds."
            ),
            ("Deflation", "cutting", "stimulative"): (
                "Central bank fighting deflation. Bonds rally strongly. "
                "Watch for policy overcorrection leading to reflation."
            ),
            ("Reflation", "cutting", "restrictive"): (
                "Fed cutting but rates still restrictive. Commodities and "
                "energy lead. Growth stocks starting to recover. Real estate "
                "still constrained by mortgage rates. Late-cycle risk elevated."
            ),
            ("Reflation", "cutting", "highly"): (
                "Fed cutting aggressively from high levels. Everything rallies "
                "but watch for inflation re-acceleration. Commodities surge."
            ),
            ("Reflation", "holding", "highly"): (
                "Rates very restrictive, Fed on pause. Recession risk rising. "
                "Commodities resilient, growth stocks under pressure. "
                "Transition to Stagflation risk is elevated."
            ),
        }
        key = (quadrant, rate_trend, rate_env.split()[0])
        return impacts.get(key,
            "Rate cycle adds nuance to quadrant signal — "
            "monitor Fed communications for next move."
        )

    return {
        "fed_rate":       fed_rate,
        "fed_6m_ago":     fed_6m_ago,
        "fed_12m_ago":    fed_12m_ago,
        "rate_change_6m": rate_change_6m,
        "rate_trend":     rate_trend,
        "trend_emoji":    trend_emoji,
        "cpi_yoy":        cpi_yoy,
        "real_rate":      real_rate,
        "rate_env":       rate_env,
        "rate_env_emoji": rate_env_emoji,
        "debt_pct":       debt_pct,
        "lt_cycle":       lt_cycle,
        "lt_emoji":       lt_emoji,
        "mortgage_rate":  mortgage_rate,
        "debt_svc_pct":   debt_svc_pct,
        "m2_growth":      m2_growth,
        "m2_trend":       m2_trend,
        "quadrant_impact": quadrant_impact,
    }

def print_rates(data, quadrant_name="Reflation"):
    result = assess_rates(data)

    print(f"\n  {'─'*60}")
    print(f"  💰 INTEREST RATE CYCLE")
    print(f"\n  Short-term cycle (Fed policy):")
    if result["fed_rate"]:
        print(f"  {result['trend_emoji']} Fed Funds Rate:    {result['fed_rate']:.2f}%  "
              f"({result['rate_trend']})")
    if result["rate_change_6m"] is not None:
        print(f"     Change (6 months): {result['rate_change_6m']:>+.3f}pp")
    if result["real_rate"] is not None:
        print(f"  {result['rate_env_emoji']} Real Rate:         {result['real_rate']:>+.2f}%  "
              f"({result['rate_env']})")
    if result["mortgage_rate"]:
        print(f"     30yr Mortgage:     {result['mortgage_rate']:.2f}%")
    if result["debt_svc_pct"]:
        print(f"     Debt service ratio:{result['debt_svc_pct']:.1f}% of income")

    print(f"\n  Long-term cycle (Dalio debt cycle):")
    if result["debt_pct"]:
        print(f"  {result['lt_emoji']} Debt/GDP:          {result['debt_pct']:.1f}%  "
              f"({result['lt_cycle']})")
    if result["m2_growth"] is not None:
        print(f"     M2 money supply:   {result['m2_growth']:>+.2f}% (6m)  "
              f"({result['m2_trend']})")

    print(f"\n  📌 Rate cycle impact on {quadrant_name}:")
    impact = result["quadrant_impact"](
        quadrant_name,
        result["rate_trend"],
        result["rate_env"]
    )
    # Word wrap at 55 chars
    words  = impact.split()
    line   = "     "
    for word in words:
        if len(line) + len(word) > 60:
            print(line)
            line = "     " + word + " "
        else:
            line += word + " "
    if line.strip():
        print(line)

if __name__ == "__main__":
    print("\n💰 Fetching interest rate data...")
    data = get_rate_data()
    print_rates(data, quadrant_name="Reflation")
    print()
