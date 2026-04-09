"""
European regime calculator using Eurostat data.
Same four-quadrant framework as US tracker but using EU indicators.
"""
from quadrant import momentum_direction, pct_change, QUADRANTS


def assess_eu_growth(data):
    """Assess EU growth direction from GDP, industrial production, retail sales, unemployment."""
    # GDP: quarterly — compare 1-quarter vs 4-quarter trend
    gdp_dir = momentum_direction(data.get("gdp", []), short=1, long=4)
    gdp_change = pct_change(data.get("gdp", []), periods=1)

    # Industrial production: monthly
    ip_dir = momentum_direction(data.get("industrial_production", []), short=3, long=12)
    ip_change = pct_change(data.get("industrial_production", []), periods=3)

    # Retail sales: monthly
    retail_dir = momentum_direction(data.get("retail_sales", []), short=3, long=12)
    retail_change = pct_change(data.get("retail_sales", []), periods=3)

    # Unemployment: inverted — rising unemployment = falling growth
    unemp_change = pct_change(data.get("unemployment", []), periods=3)
    unemp_dir = None
    if unemp_change is not None:
        unemp_dir = -1 if unemp_change > 0.1 else (1 if unemp_change < -0.1 else 0)

    signals = []
    if gdp_dir is not None:
        signals.append(gdp_dir)
    if ip_dir is not None:
        signals.append(ip_dir)
    if retail_dir is not None:
        signals.append(retail_dir)
    if unemp_dir is not None and unemp_dir != 0:
        signals.append(unemp_dir)

    score = sum(signals) / len(signals) if signals else 0
    return {
        "direction": "rising" if score > 0 else "falling",
        "score": round(score, 2),
        "detail": {
            "gdp_change_pct": gdp_change,
            "ip_change_pct": ip_change,
            "retail_change_pct": retail_change,
            "unemp_change_pct": unemp_change,
        },
    }


def assess_eu_inflation(data):
    """Assess EU inflation direction from HICP momentum."""
    # HICP: monthly year-over-year rate — direction of the rate itself
    hicp_dir = momentum_direction(data.get("hicp", []), short=3, long=12)
    hicp_change = pct_change(data.get("hicp", []), periods=3)

    signals = []
    if hicp_dir is not None:
        signals.append(hicp_dir)

    score = sum(signals) / len(signals) if signals else 0
    return {
        "direction": "rising" if score > 0 else "falling",
        "score": round(score, 2),
        "detail": {
            "hicp_change_pct": hicp_change,
        },
    }


def get_eu_quadrant(data):
    """Return EU regime using same four-quadrant mapping as US."""
    growth = assess_eu_growth(data)
    inflation = assess_eu_inflation(data)
    key = (growth["direction"], inflation["direction"])
    quadrant = QUADRANTS[key]
    return {
        "quadrant": quadrant,
        "growth": growth,
        "inflation": inflation,
    }


if __name__ == "__main__":
    from eurostat import get_all
    import contextlib, io
    with contextlib.redirect_stdout(io.StringIO()):
        data = get_all()
    result = get_eu_quadrant(data)
    print(f"EU Regime: {result['quadrant']['name']}")
    print(f"Growth: {result['growth']['direction']} (score {result['growth']['score']})")
    for k, v in result['growth']['detail'].items():
        print(f"  {k}: {v}")
    print(f"Inflation: {result['inflation']['direction']} (score {result['inflation']['score']})")
    for k, v in result['inflation']['detail'].items():
        print(f"  {k}: {v}")
