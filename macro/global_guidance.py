"""
Global investor guidance — synthesises US, China and Europe
macro readings into actionable cross-market allocation guidance.

This is the highest-level output of the macro tool.
"""

GLOBAL_NARRATIVES = {
    # (US, China, Europe)
    ("Reflation", "Deflation", "Reflation"): {
        "headline": "Two economies running hot, one fighting deflation.",
        "narrative": (
            "The global backdrop is broadly constructive. US and Europe "
            "are both in Reflation — growth positive, inflation elevated. "
            "China is the outlier, fighting deflation with significant "
            "stimulus capacity. The most asymmetric opportunity is China: "
            "priced for permanent deflation, but with high probability of "
            "a Beijing-driven recovery. Smart money (Tepper) is already "
            "positioned for it."
        ),
        "risk": (
            "Main risk is US Stagflation — retail sales barely positive "
            "and any deterioration would shift the regime. European energy "
            "price volatility remains a wildcard."
        ),
    },
    ("Reflation", "Reflation", "Reflation"): {
        "headline": "All three economies running hot — global inflation risk.",
        "narrative": (
            "Synchronised global Reflation is positive for commodities, "
            "energy and real assets across all markets. However, the "
            "combined inflation pressure raises the risk of central banks "
            "tightening too aggressively, which could flip all three "
            "economies toward Stagflation simultaneously."
        ),
        "risk": (
            "Coordinated policy tightening risk. Watch all three central "
            "banks simultaneously — Fed, ECB and PBOC."
        ),
    },
    ("Goldilocks", "Deflation", "Goldilocks"): {
        "headline": "US and Europe in sweet spot — China the contrarian bet.",
        "narrative": (
            "Best environment for developed market equities. US and Europe "
            "growth positive with cooling inflation. China deflation "
            "creates a high-conviction contrarian opportunity — if stimulus "
            "works, Chinese equities re-rate sharply while developed "
            "markets continue compounding steadily."
        ),
        "risk": (
            "China deflation contagion risk — if deep enough, could drag "
            "global commodity demand and hurt EM broadly."
        ),
    },
    ("Stagflation", "Deflation", "Stagflation"): {
        "headline": "Dangerous combination — defensive positioning required.",
        "narrative": (
            "US and Europe stagflating while China deflates is the worst "
            "global macro environment. Central banks face impossible "
            "choices. Capital preservation becomes the priority. "
            "Gold, cash and short-duration assets are the only refuges."
        ),
        "risk": (
            "Systemic risk elevated. Watch credit spreads and bank "
            "funding costs for early warning of financial stress."
        ),
    },
    ("Deflation", "Deflation", "Deflation"): {
        "headline": "Global deflation — recession risk is real.",
        "narrative": (
            "All three major economies contracting simultaneously is a "
            "rare and serious signal. Government bonds rally strongly. "
            "Cash preserves purchasing power. Avoid all risk assets until "
            "central bank policy response becomes clear."
        ),
        "risk": (
            "Debt deflation spiral risk — particularly dangerous given "
            "US Debt/GDP at 122%. Watch for coordinated global stimulus."
        ),
    },
}

REGION_OPPORTUNITY = {
    "us": {
        "Reflation": {
            "title": "🇺🇸 US — Momentum but watch for Stagflation",
            "value": (
                "Energy and commodities remain the textbook play. "
                "Growth stocks partially protected by Fed cutting cycle. "
                "Transition warning active — retail sales barely positive."
            ),
            "picks": ["XLE — Energy ETF", "DBC — Commodities ETF",
                      "GLD — Gold", "XLP — Consumer staples (hedge)"],
            "avoid": ["TLT — Long bonds", "Rate-sensitive growth stocks"],
        },
        "Goldilocks": {
            "title": "🇺🇸 US — Best environment for risk assets",
            "value": (
                "Own equities broadly. Tech and growth lead. "
                "Fed cutting into a growing economy is historically "
                "the strongest bull market setup."
            ),
            "picks": ["QQQ — Growth/Tech", "SPY — Broad market",
                      "VNQ — Real estate (rates falling)", "XLF — Financials"],
            "avoid": ["GLD — Gold loses appeal", "TLT — Less needed"],
        },
        "Stagflation": {
            "title": "🇺🇸 US — Defensive positioning required",
            "value": (
                "Capital preservation is the priority. "
                "Only assets with pricing power survive stagflation. "
                "Reduce equity exposure significantly."
            ),
            "picks": ["GLD — Gold", "DBC — Commodities",
                      "XLP — Consumer staples", "Cash"],
            "avoid": ["QQQ — Growth stocks crushed",
                      "TLT — Bonds hurt by inflation",
                      "VNQ — Real estate collapses"],
        },
        "Deflation": {
            "title": "🇺🇸 US — Recession positioning",
            "value": (
                "Bonds rally strongly. Cash preserves purchasing power. "
                "Wait for policy response before re-entering equities."
            ),
            "picks": ["TLT — Long bonds", "Cash", "XLU — Utilities",
                      "XLV — Healthcare"],
            "avoid": ["DBC — Commodities", "XLE — Energy", "Cyclicals"],
        },
    },
    "china": {
        "Deflation": {
            "title": "🇨🇳 China — High risk, high reward",
            "value": (
                "Most asymmetric opportunity globally. Priced for "
                "permanent deflation but Beijing has tools and incentive "
                "to stimulate. BABA at ~10x forward earnings vs 25x+ "
                "for US peers. Small position, significant upside if "
                "stimulus lands."
            ),
            "picks": ["BABA — Alibaba (AI/cloud leader)",
                      "NTES — NetEase (51% FCF yield)",
                      "PDD — Pinduoduo/Temu",
                      "FUTU — Chinese brokerage (48% margins)",
                      "EEM — EM ETF (China proxy)"],
            "avoid": ["Chinese property developers",
                      "Chinese banks (NPL risk)",
                      "Domestic consumption plays until stimulus confirmed"],
        },
        "Reflation": {
            "title": "🇨🇳 China — Stimulus working, ride the recovery",
            "value": (
                "Chinese equities re-rating. Commodities surging on "
                "demand recovery. Emerging markets broadly benefiting. "
                "This is the scenario Tepper positioned for."
            ),
            "picks": ["BABA, NTES, PDD — Chinese tech",
                      "DBC, copper — Commodity surge",
                      "EEM — Broad EM rally",
                      "Materials and industrials"],
            "avoid": ["USD — Weakens as capital flows east",
                      "Defensive Chinese bonds"],
        },
        "Goldilocks": {
            "title": "🇨🇳 China — Full recovery underway",
            "value": (
                "Best case achieved. Chinese equities fully re-rate. "
                "Property sector stabilised. Consumer confidence restored. "
                "Increase China allocation meaningfully."
            ),
            "picks": ["Broad Chinese equity exposure",
                      "Chinese consumer discretionary",
                      "Chinese financials"],
            "avoid": ["Defensive assets — no longer needed"],
        },
        "Stagflation": {
            "title": "🇨🇳 China — Avoid, wait for clarity",
            "value": (
                "Worst case for Chinese equities. Growth slowing while "
                "input costs rise. Reduce China exposure significantly."
            ),
            "picks": ["Cash", "Gold"],
            "avoid": ["Chinese equities broadly", "EM exposure"],
        },
    },
    "europe": {
        "Reflation": {
            "title": "🇪🇺 Europe — Undervalued, ECB tailwind",
            "value": (
                "European equities trade at a significant discount to US "
                "on every valuation metric. ECB still cutting into "
                "Reflation creates a powerful tailwind. Manufacturing "
                "recovering from 2024 trough. Best entry in years."
            ),
            "picks": ["VGK — European equity ETF",
                      "EWG — Germany (industrial recovery)",
                      "European banks (rate normalisation beneficiary)",
                      "European energy stocks"],
            "avoid": ["European long bonds — inflation not beaten yet",
                      "European property — still rate-sensitive"],
        },
        "Goldilocks": {
            "title": "🇪🇺 Europe — Ideal setup for catch-up rally",
            "value": (
                "European equities historically underperform in bad times "
                "and outperform significantly in Goldilocks when starting "
                "from cheap valuations. Strong catch-up potential vs US."
            ),
            "picks": ["VGK — Broad European exposure",
                      "European tech (SAP, ASML)",
                      "European consumer discretionary",
                      "EWG — German industrials"],
            "avoid": ["Gold — less needed in Goldilocks"],
        },
        "Stagflation": {
            "title": "🇪🇺 Europe — Most exposed to Stagflation",
            "value": (
                "Europe's energy import dependence makes it structurally "
                "vulnerable to Stagflation. Reduce European equity "
                "exposure. Energy stocks are the exception."
            ),
            "picks": ["European energy stocks",
                      "Consumer staples (Nestle, Unilever)",
                      "Gold"],
            "avoid": ["European industrials — demand collapses",
                      "European banks — credit risk rises",
                      "European consumer discretionary"],
        },
        "Deflation": {
            "title": "🇪🇺 Europe — ECB cutting aggressively",
            "value": (
                "European bonds rally strongly. ECB has more room to cut "
                "than Fed given lower starting debt levels. Defensive "
                "positioning until growth signals return."
            ),
            "picks": ["European government bonds",
                      "Defensive equities (utilities, healthcare)",
                      "Cash in EUR"],
            "avoid": ["European cyclicals", "European banks"],
        },
    },
}

ALLOCATION_TEMPLATES = {
    ("Reflation", "Deflation", "Reflation"): {
        "commodities":   20,
        "energy":        15,
        "chinese_eq":    15,
        "european_eq":   15,
        "us_growth":     10,
        "gold":          10,
        "tips":          10,
        "cash":           5,
    },
    ("Goldilocks", "Deflation", "Goldilocks"): {
        "us_growth":     25,
        "european_eq":   20,
        "chinese_eq":    15,
        "commodities":   10,
        "gold":          10,
        "tips":           5,
        "cash":          15,
    },
    ("Stagflation", "Deflation", "Stagflation"): {
        "gold":          25,
        "commodities":   20,
        "cash":          25,
        "tips":          15,
        "energy":        10,
        "chinese_eq":     5,
        "us_growth":      0,
        "european_eq":    0,
    },
    ("Deflation", "Deflation", "Deflation"): {
        "cash":          35,
        "gold":          20,
        "tips":          20,
        "us_growth":      0,
        "european_eq":    5,
        "chinese_eq":     5,
        "commodities":    5,
        "energy":        10,
    },
}

ALLOCATION_LABELS = {
    "commodities":  "Commodities (DBC)",
    "energy":       "Energy stocks (XLE)",
    "chinese_eq":   "Chinese equities",
    "european_eq":  "European equities",
    "us_growth":    "US growth (QQQ)",
    "gold":         "Gold (GLD)",
    "tips":         "TIPS",
    "cash":         "Cash",
}

def get_default_allocation(us_q, china_q, eu_q):
    key = (us_q, china_q, eu_q)
    if key in ALLOCATION_TEMPLATES:
        return ALLOCATION_TEMPLATES[key]
    # Default to Reflation/Deflation/Reflation as closest
    return ALLOCATION_TEMPLATES[("Reflation", "Deflation", "Reflation")]

def bar(pct, width=20):
    filled = int(pct / 100 * width)
    return "█" * filled + "░" * (width - filled)

def wrap(text, width=62, indent="  "):
    words = text.split()
    line  = indent
    for word in words:
        if len(line) + len(word) > width:
            print(line)
            line = indent + word + " "
        else:
            line += word + " "
    if line.strip():
        print(line)

def print_global_guidance(us_result, china_result, eu_result):
    us_q    = us_result["quadrant"] if isinstance(us_result, dict) else us_result
    china_q = china_result["quadrant"] if isinstance(china_result, dict) else china_result
    eu_q    = eu_result["quadrant"] if isinstance(eu_result, dict) else eu_result

    us_e    = us_result.get("emoji", "🟡") if isinstance(us_result, dict) else "🟡"
    china_e = china_result.get("emoji", "🔵") if isinstance(china_result, dict) else "🔵"
    eu_e    = eu_result.get("emoji", "🟡") if isinstance(eu_result, dict) else "🟡"

    print(f"\n{'='*65}")
    print(f"  🌍  GLOBAL INVESTOR GUIDANCE")
    print(f"{'='*65}")

    # Check geopolitical regime bias for contradiction warning
    geo_bias = None
    try:
        import sys
        sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")
        from geopolitical import get_geopolitical_risks
        geo_data = get_geopolitical_risks()
        if geo_data:
            geo_bias = geo_data.get("overall_regime_bias")
    except:
        pass

    print(f"\n  Current global picture (FRED macro data — lagged 1-3 months):")
    print(f"  🇺🇸 US:     {us_e} {us_q:<12} — growth positive, inflation sticky")
    print(f"  🇨🇳 China:  {china_e} {china_q:<12} — stimulus expected, undervalued")
    print(f"  🇪🇺 Europe: {eu_e} {eu_q:<12} — modest growth, inflation near target")

    if geo_bias and geo_bias != us_q:
        print(f"\n  ⚠️  DATA LAG WARNING")
        print(f"  FRED data shows: {us_e} {us_q} (reflects Jan/Feb 2026)")
        _emojis = {"Reflation":"🟡","Stagflation":"🔴","Deflation":"🔵","Goldilocks":"🟢"}
        print(f"  Geopolitical monitor shows: {_emojis.get(geo_bias,'❓')} {geo_bias} (current)")
        print(f"\n  The macro quadrant has NOT yet captured the Iran war oil shock.")
        print(f"  Next FRED data release will likely confirm regime shift to {geo_bias}.")
        print(f"  Treat geopolitical signal as the more current indicator.")

    # Big picture narrative
    key       = (us_q, china_q, eu_q)
    narrative = GLOBAL_NARRATIVES.get(key, GLOBAL_NARRATIVES.get(
        ("Reflation", "Deflation", "Reflation"), {}))

    print(f"\n  {'─'*60}")
    print(f"  📖 THE BIG PICTURE")
    if narrative.get("headline"):
        print(f"\n  {narrative['headline']}")
    if narrative.get("narrative"):
        print()
        wrap(narrative["narrative"])
    if narrative.get("risk"):
        print(f"\n  ⚠️  Key risk:")
        wrap(narrative["risk"])

    # Per-region opportunities
    print(f"\n  {'─'*60}")
    print(f"  💡 WHERE THE VALUE IS")

    for region, q, result in [
        ("us",     us_q,    us_result),
        ("china",  china_q, china_result),
        ("europe", eu_q,    eu_result),
    ]:
        opp = REGION_OPPORTUNITY.get(region, {}).get(q, {})
        if not opp:
            continue
        print(f"\n  {opp['title']}")
        print(f"  Value:")
        wrap(opp["value"], indent="    ")
        print(f"\n  Picks:  {', '.join(opp['picks'][:3])}")
        if opp.get("avoid"):
            print(f"  Avoid:  {', '.join(opp['avoid'][:2])}")

    # Allocation template
    print(f"\n  {'─'*60}")
    print(f"  📊 SUGGESTED GLOBAL ALLOCATION TILT")
    print(f"  (Directional guide — adjust to your risk tolerance)\n")

    alloc = get_default_allocation(us_q, china_q, eu_q)
    for key, pct in sorted(alloc.items(), key=lambda x: x[1], reverse=True):
        if pct == 0:
            continue
        label = ALLOCATION_LABELS.get(key, key)
        print(f"  {label:<28} {bar(pct, 15)}  {pct}%")

    # Key risks
    print(f"\n  {'─'*60}")
    print(f"  🔭 KEY RISKS TO MONITOR GLOBALLY\n")
    print(f"  📍 US retail sales — if negative, Stagflation risk rises")
    print(f"  📍 China PBOC stimulus — if announced, rotate into EM")
    print(f"  📍 European energy prices — key inflation wildcard")
    print(f"  📍 Fed rate path — further cuts unlock real estate globally")
    print(f"  📍 USD strength — weakening dollar benefits EM and gold")

    print(f"\n  {'─'*60}")
    print(f"  ⚠️  DISCLAIMER")
    print(f"\n  This is a personal research tool, not financial advice.")
    print(f"  Allocations are directional tilts, not precise targets.")
    print(f"  Always do your own research before investing.")
    print(f"  Past regime performance does not guarantee future results.")
    print(f"\n{'='*65}\n")

if __name__ == "__main__":
    from china import get_china_data, assess_china
    from europe import get_europe_data, assess_europe
    from fred import get_all
    from quadrant import get_quadrant

    print("\n📡 Fetching data for global guidance test...")
    us_data    = get_all()
    china_data = get_china_data()
    eu_data    = get_europe_data()

    us_result    = get_quadrant(us_data)["quadrant"]
    china_result = assess_china(china_data)
    eu_result    = assess_europe(eu_data)

    us_r = {"quadrant": us_result["name"], "emoji": us_result["emoji"]}
    print_global_guidance(us_r, china_result, eu_result)
