"""
Yield curve analysis.

T10Y2Y — 10yr minus 2yr treasury spread (market's recession signal)
T10Y3M — 10yr minus 3month spread (Fed's preferred recession indicator)

Interpretation:
  > +1.0%  — steep curve, healthy growth expected
  0 to +1% — flat curve, slowing growth
  < 0%     — inverted, recession warning
  < -0.5%  — deeply inverted, strong recession signal
"""

def assess_yield_curve(data):
    t10y2y_series = data.get("t10y2y", [])
    t10y3m_series = data.get("t10y3m", [])

    t10y2y = t10y2y_series[0][1] if t10y2y_series else None
    t10y3m = t10y3m_series[0][1] if t10y3m_series else None

    # Trend — is the curve steepening or flattening?
    def trend(series, periods=3):
        if len(series) < periods + 1:
            return None
        return round(series[0][1] - series[periods][1], 3)

    t10y2y_trend = trend(t10y2y_series)
    t10y3m_trend = trend(t10y3m_series)

    def interpret(val):
        if val is None:
            return "unknown"
        if val > 1.0:
            return "steep — healthy growth expected"
        if val > 0:
            return "flat — growth slowing"
        if val > -0.5:
            return "inverted — recession warning"
        return "deeply inverted — strong recession signal"

    def signal(val):
        if val is None:
            return "⬜"
        if val > 1.0:
            return "🟢"
        if val > 0:
            return "🟡"
        if val > -0.5:
            return "🔴"
        return "🔴🔴"

    # Recession probability (simplified)
    # Historically, T10Y3M inversion of >6 months = ~70%+ recession within 12-18 months
    t10y3m_vals  = [v for _, v in t10y3m_series[:6]]
    months_inv   = sum(1 for v in t10y3m_vals if v < 0)
    rec_warning  = months_inv >= 3

    return {
        "t10y2y":        t10y2y,
        "t10y3m":        t10y3m,
        "t10y2y_trend":  t10y2y_trend,
        "t10y3m_trend":  t10y3m_trend,
        "t10y2y_signal": signal(t10y2y),
        "t10y3m_signal": signal(t10y3m),
        "t10y2y_interp": interpret(t10y2y),
        "t10y3m_interp": interpret(t10y3m),
        "months_inverted": months_inv,
        "recession_warning": rec_warning,
    }

if __name__ == "__main__":
    from fred import get_all
    data = get_all()
    yc   = assess_yield_curve(data)

    print(f"\n{'='*60}")
    print(f"  📉 YIELD CURVE ANALYSIS")
    print(f"{'='*60}")
    print(f"\n  {yc['t10y2y_signal']} 10yr - 2yr spread:  {yc['t10y2y']:>+.3f}%")
    print(f"     {yc['t10y2y_interp']}")
    print(f"     Trend (3 months): {yc['t10y2y_trend']:>+.3f}% "
          f"({'steepening' if yc['t10y2y_trend'] and yc['t10y2y_trend'] > 0 else 'flattening'})")

    print(f"\n  {yc['t10y3m_signal']} 10yr - 3m spread:  {yc['t10y3m']:>+.3f}%")
    print(f"     {yc['t10y3m_interp']}")
    print(f"     Trend (3 months): {yc['t10y3m_trend']:>+.3f}% "
          f"({'steepening' if yc['t10y3m_trend'] and yc['t10y3m_trend'] > 0 else 'flattening'})")

    print(f"\n  Months inverted (last 6): {yc['months_inverted']}/6")
    if yc["recession_warning"]:
        print(f"\n  ⚠️  RECESSION WARNING — curve inverted for "
              f"{yc['months_inverted']} of last 6 months.")
        print(f"     Historically this precedes recession by 12-18 months.")
    else:
        print(f"\n  ✅ No sustained inversion — recession not imminent by this measure.")
    print(f"\n{'='*60}\n")
