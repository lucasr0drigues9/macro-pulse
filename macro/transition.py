"""
Watches for early signals that the current quadrant is about to shift.
Flags individual indicators that are weakening at the margins
before they officially flip the growth or inflation direction.
"""

THRESHOLDS = {
    "gdp_change_pct":    {"warning": 0.5,  "direction": "growth"},
    "unemp_change_pct":  {"warning": 1.0,  "direction": "growth",  "inverse": True},
    "retail_change_pct": {"warning": 0.5,  "direction": "growth"},
    "cpi_change_pct":    {"warning": 0.3,  "direction": "inflation"},
    "pce_change_pct":    {"warning": 0.3,  "direction": "inflation"},
    "ppi_change_pct":    {"warning": 0.5,  "direction": "inflation"},
}

NEXT_QUADRANT = {
    ("rising",  "rising"):  {
        "if_growth_falls":    "Stagflation 🔴 — worst environment",
        "if_inflation_falls": "Goldilocks 🟢 — best environment",
    },
    ("rising",  "falling"): {
        "if_growth_falls":    "Deflation 🔵 — recession risk",
        "if_inflation_rises": "Reflation 🟡 — commodities outperform",
    },
    ("falling", "rising"):  {
        "if_growth_rises":    "Reflation 🟡 — commodities outperform",
        "if_inflation_falls": "Deflation 🔵 — recession risk",
    },
    ("falling", "falling"): {
        "if_growth_rises":    "Goldilocks 🟢 — best environment",
        "if_inflation_rises": "Stagflation 🔴 — worst environment",
    },
}

TRANSITION_GUIDANCE = {
    "Stagflation": {
        "description": (
            "Growth slowing while inflation stays high. "
            "The most difficult environment for most portfolios."
        ),
        "move_toward": [
            "Gold (GLD) — safe haven and inflation hedge",
            "Commodities (DBC) — real assets hold value",
            "Energy stocks (XLE) — pricing power survives",
            "Consumer staples (XLP) — defensive, non-cyclical",
            "Cash — preserve capital, wait for clarity",
        ],
        "move_away": [
            "Growth stocks (QQQ) — hit by both slowing growth and high rates",
            "Long bonds (TLT) — crushed by persistent inflation",
            "Real estate — rate-sensitive, consumer demand falls",
            "Consumer discretionary — discretionary spending collapses",
            "Credit — default risk rises as growth slows",
        ],
        "confirmation_signals": [
            "Retail sales turns negative for 2+ consecutive months",
            "CPI stays above +0.4% monthly despite slowing growth",
            "Unemployment rises above 5% while PPI remains elevated",
            "GDP growth turns negative (official recession)",
        ],
        "watch_releases": [
            "Retail sales (monthly — key growth indicator)",
            "CPI monthly (inflation persistence check)",
            "NFP jobs report (unemployment trend)",
            "Fed meeting (will they prioritise inflation or growth?)",
        ],
        "timing_note": (
            "You don't need to act yet — this is an early warning. "
            "Retail sales at +0.37% would need to turn negative AND "
            "inflation remain above 0.4% monthly to confirm the shift. "
            "Gradual repositioning over 1-2 months is appropriate."
        ),
    },
    "Goldilocks": {
        "description": (
            "Inflation cooling while growth stays positive. "
            "The best environment for most risk assets."
        ),
        "move_toward": [
            "Growth stocks (QQQ) — expansion without inflation penalty",
            "Tech (XLK) — best sector in Goldilocks historically",
            "Corporate bonds — credit spreads tighten",
            "Real estate (VNQ) — as rates fall, property recovers",
            "Consumer discretionary — spending power increases",
        ],
        "move_away": [
            "Commodities (DBC) — inflation hedge no longer needed",
            "Gold — loses appeal as inflation cools",
            "Energy stocks — oil demand softens with inflation",
            "Cash — opportunity cost rises in bull market",
        ],
        "confirmation_signals": [
            "CPI drops below +0.2% monthly for 2+ months",
            "PCE falls toward Fed 2% target",
            "GDP growth stays above 2% annualised",
            "Fed signals rate cuts are on the table",
        ],
        "watch_releases": [
            "CPI monthly (key — watching for inflation to cool)",
            "PCE monthly (Fed's preferred inflation measure)",
            "GDP quarterly (growth staying positive?)",
            "Fed meeting minutes (tone on inflation)",
        ],
        "timing_note": (
            "This would be the most positive outcome. "
            "If inflation cools toward 2% while growth holds, "
            "growth stocks and tech would likely rally strongly. "
            "Begin gradually rotating from commodities to tech "
            "on any signs of sustained inflation deceleration."
        ),
    },
    "Deflation": {
        "description": (
            "Both growth and inflation falling. "
            "Recession risk rises. Capital preservation becomes priority."
        ),
        "move_toward": [
            "Government bonds (TLT) — rally strongly in deflation",
            "Defensive equities — utilities, healthcare, staples",
            "Cash — purchasing power increases as prices fall",
            "Gold — safe haven during uncertainty",
            "Short-duration bonds — lower interest rate risk",
        ],
        "move_away": [
            "Commodities — demand collapses in recession",
            "Energy stocks — oil price falls sharply",
            "Cyclical stocks — industrials, materials, financials",
            "High-yield credit — default risk spikes",
            "Real estate — forced selling in recessions",
        ],
        "confirmation_signals": [
            "GDP contracts for 2 consecutive quarters",
            "CPI turns negative (actual deflation)",
            "Unemployment rises sharply above 5.5%",
            "Credit spreads widen significantly",
        ],
        "watch_releases": [
            "GDP quarterly (official recession confirmation)",
            "CPI monthly (watching for deflation)",
            "Credit spreads (high yield vs treasuries)",
            "Fed emergency meetings (crisis response signal)",
        ],
        "timing_note": (
            "Deflation transitions tend to happen quickly. "
            "If retail sales turns negative AND CPI falls below zero, "
            "act decisively. Bonds and cash outperform everything. "
            "This scenario is less likely given current inflation data."
        ),
    },
    "Reflation": {
        "description": (
            "Growth recovering while inflation picks up. "
            "Commodities and real assets lead the rally."
        ),
        "move_toward": [
            "Commodities (DBC) — primary beneficiary",
            "Energy stocks (XLE) — pricing power",
            "TIPS — inflation protection with growth",
            "Real estate (VNQ) — hard assets appreciate",
            "Industrials and materials",
        ],
        "move_away": [
            "Long bonds (TLT) — inflation erodes fixed payments",
            "Cash — real value erodes with inflation",
            "Defensive growth stocks — rotation into cyclicals",
        ],
        "confirmation_signals": [
            "GDP growth accelerates above 2% annualised",
            "CPI rises above 0.3% monthly consistently",
            "PMI manufacturing above 50 and rising",
            "Oil and commodity prices trending upward",
        ],
        "watch_releases": [
            "GDP quarterly (growth acceleration)",
            "CPI monthly (inflation pickup)",
            "ISM Manufacturing PMI (industrial activity)",
            "Commodity prices (leading inflation indicator)",
        ],
        "timing_note": (
            "Reflation transitions are generally positive. "
            "Begin rotating from defensive assets toward "
            "commodities and energy on confirmed growth pickup. "
            "This is the current regime — already in effect."
        ),
    },
}

def assess_transitions(growth, inflation):
    warnings = []
    g_detail = growth["detail"]
    i_detail = inflation["detail"]
    all_details = {**g_detail, **i_detail}

    for metric, config in THRESHOLDS.items():
        val = all_details.get(metric)
        if val is None:
            continue
        threshold = config["warning"]
        inverse   = config.get("inverse", False)
        direction = config["direction"]

        if not inverse and 0 < val < threshold:
            warnings.append({
                "metric":    metric,
                "value":     val,
                "direction": direction,
                "message":   f"{metric.replace('_', ' ')} barely positive ({val:+.2f}%) — watch for flip to negative",
                "severity":  "⚠️",
            })
        elif not inverse and -threshold < val < 0:
            warnings.append({
                "metric":    metric,
                "value":     val,
                "direction": direction,
                "message":   f"{metric.replace('_', ' ')} slightly negative ({val:+.2f}%) — trend weakening",
                "severity":  "🔴",
            })
        elif inverse and val > threshold:
            warnings.append({
                "metric":    metric,
                "value":     val,
                "direction": direction,
                "message":   f"{metric.replace('_', ' ')} rising sharply ({val:+.2f}%) — growth deteriorating",
                "severity":  "🔴",
            })

    key          = (growth["direction"], inflation["direction"])
    next_options = NEXT_QUADRANT.get(key, {})

    growth_warnings    = [w for w in warnings if w["direction"] == "growth"]
    inflation_warnings = [w for w in warnings if w["direction"] == "inflation"]

    likely_transition = None
    likely_name       = None
    if growth_warnings and not inflation_warnings:
        if growth["direction"] == "rising":
            likely_transition = next_options.get("if_growth_falls")
            likely_name       = "Stagflation"
        else:
            likely_transition = next_options.get("if_growth_rises")
            likely_name       = "Reflation"
    elif inflation_warnings and not growth_warnings:
        if inflation["direction"] == "rising":
            likely_transition = next_options.get("if_inflation_falls")
            likely_name       = "Goldilocks"
        else:
            likely_transition = next_options.get("if_inflation_rises")
            likely_name       = "Stagflation"

    return {
        "warnings":           warnings,
        "growth_warnings":    growth_warnings,
        "inflation_warnings": inflation_warnings,
        "next_options":       next_options,
        "likely_transition":  likely_transition,
        "likely_name":        likely_name,
    }

def print_transitions(growth, inflation):
    result = assess_transitions(growth, inflation)

    print(f"\n  {'─'*60}")
    print(f"  🔭 TRANSITION WATCH")

    if not result["warnings"]:
        print(f"\n  ✅ All indicators solid — no transition signals detected")
    else:
        print(f"\n  Marginal indicators to watch:")
        for w in result["warnings"]:
            print(f"    {w['severity']}  {w['message']}")

    print(f"\n  Possible next quadrants:")
    for condition, quadrant in result["next_options"].items():
        print(f"    • {condition.replace('_', ' ').title()}: {quadrant}")

    if result["likely_transition"] and result["likely_name"]:
        name     = result["likely_name"]
        guidance = TRANSITION_GUIDANCE.get(name, {})

        print(f"\n  📍 Most likely transition: {result['likely_transition']}")
        print(f"\n  {'─'*60}")
        print(f"  🧭 IF {name.upper()} ARRIVES — WHAT TO DO")
        print(f"\n  {guidance.get('description', '')}")

        print(f"\n  MOVE TOWARD:")
        for item in guidance.get("move_toward", []):
            print(f"    ✅ {item}")

        print(f"\n  MOVE AWAY FROM:")
        for item in guidance.get("move_away", []):
            print(f"    ❌ {item}")

        print(f"\n  CONFIRMATION SIGNALS TO WATCH:")
        for item in guidance.get("confirmation_signals", []):
            print(f"    📍 {item}")

        print(f"\n  KEY DATA RELEASES:")
        for item in guidance.get("watch_releases", []):
            print(f"    📅 {item}")

        print(f"\n  ⏱️  TIMING NOTE:")
        note  = guidance.get("timing_note", "")
        words = note.split()
        line  = "     "
        for word in words:
            if len(line) + len(word) > 62:
                print(line)
                line = "     " + word + " "
            else:
                line += word + " "
        if line.strip():
            print(line)

if __name__ == "__main__":
    from fred import get_all
    from quadrant import get_quadrant
    data   = get_all()
    result = get_quadrant(data)
    print_transitions(result["growth"], result["inflation"])
