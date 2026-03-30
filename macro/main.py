import sys
from fred import get_all
from quadrant import get_quadrant
from yield_curve import assess_yield_curve
from history import build_history
from transition import print_transitions
from china import get_china_data, assess_china, print_china
from china_guidance import print_china_guidance
from rates import get_rate_data, print_rates, assess_rates
from performance import run as perf_run
from europe import get_europe_data, assess_europe, print_europe
from global_guidance import print_global_guidance
from geopolitical import run as geo_run

QUADRANT_HISTORY = {
    "Goldilocks":  "2009-2019 (post-GFC recovery), 2020 (post-Covid bounce)",
    "Reflation":   "2021-2022 (Covid recovery), 2024-2026 (current)",
    "Stagflation": "1970s oil crisis, 2022 peak (briefly)",
    "Deflation":   "2008 GFC, 2020 Covid crash (briefly)",
}

DALIO_QUOTE = {
    "Goldilocks":  "This is the sweet spot — own stocks, own credit, be long risk.",
    "Reflation":   "Inflation is rising — protect yourself with real assets and commodities.",
    "Stagflation": "The worst environment. Cash is king. Avoid bonds and equities.",
    "Deflation":   "Bonds outperform. The economy is contracting — be defensive.",
}

EQUITY_PROXIES = {
    "Goldilocks":  ["Tech", "Consumer discretionary", "Financials", "Growth stocks"],
    "Reflation":   ["Energy", "Materials", "Mining", "Industrials", "Commodity producers"],
    "Stagflation": ["Energy", "Gold miners", "Utilities", "Consumer staples"],
    "Deflation":   ["Utilities", "Consumer staples", "Healthcare", "Defensive dividend stocks"],
}

DIVERGENCE_NOTES = {
    ("Reflation",  "Deflation"):  "🔀 Classic divergence — US running hot while China fights deflation. Watch for Chinese stimulus to reflate.",
    ("Goldilocks", "Deflation"):  "🔀 US in sweet spot, China struggling. Risk of contagion if Chinese deflation deepens.",
    ("Stagflation","Deflation"):  "🔀 Worst case divergence — US stagflating, China deflating. Global recession risk elevated.",
    ("Reflation",  "Goldilocks"): "✅ Both economies growing. China cooling inflation faster than US.",
    ("Reflation",  "Reflation"):  "⚡ Both running hot — global inflation risk elevated.",
    ("Goldilocks", "Goldilocks"): "✅ Ideal global environment — both economies in sweet spot.",
    ("Deflation",  "Deflation"):  "🚨 Global deflation risk — both major economies contracting.",
    ("Stagflation","Reflation"):  "🔀 US stagflating while China still growing — dollar weakness likely.",
}

def divider(title=""):
    if title:
        print(f"\n{'='*65}")
        print(f"  {title}")
        print(f"{'='*65}")
    else:
        print(f"\n{'='*65}")

def section(title):
    print(f"\n  {'─'*60}")
    print(f"  {title}")

def print_us(us_data, rate_data):
    us_result = get_quadrant(us_data)
    yc        = assess_yield_curve(us_data)
    q         = us_result["quadrant"]
    g         = us_result["growth"]
    i         = us_result["inflation"]

    divider(f"🇺🇸  US ECONOMY — {q['emoji']} {q['name'].upper()}")
    print(f"\n  {q['description']}")
    print(f"\n  💬 \"{DALIO_QUOTE[q['name']]}\"")

    section("📈 GROWTH & INFLATION")
    print(f"\n  Growth:    {g['direction'].upper()}  (conviction: {abs(g['score'])*100:.0f}%)")
    print(f"     GDP growth (2 qtrs):       {g['detail']['gdp_change_pct']:>+.2f}%")
    print(f"     Unemployment change:        {g['detail']['unemp_change_pct']:>+.2f}%")
    print(f"     Retail sales change:        {g['detail']['retail_change_pct']:>+.2f}%")
    print(f"\n  Inflation: {i['direction'].upper()}  (conviction: {abs(i['score'])*100:.0f}%)")
    print(f"     CPI change (3 months):     {i['detail']['cpi_change_pct']:>+.2f}%")
    print(f"     PCE change (3 months):     {i['detail']['pce_change_pct']:>+.2f}%")
    print(f"     PPI change (3 months):     {i['detail']['ppi_change_pct']:>+.2f}%")

    section("📉 YIELD CURVE")
    print(f"\n  {yc['t10y2y_signal']} 10yr-2yr: {yc['t10y2y']:>+.3f}%  ({yc['t10y2y_interp']})")
    print(f"  {yc['t10y3m_signal']} 10yr-3m:  {yc['t10y3m']:>+.3f}%  ({yc['t10y3m_interp']})")
    if yc["recession_warning"]:
        print(f"\n  ⚠️  RECESSION WARNING — inverted for {yc['months_inverted']} of last 6 months")
    else:
        print(f"\n  ✅ No recession warning from yield curve")

    print_rates(rate_data, quadrant_name=q['name'])
    print_transitions(g, i)

    section("📅 QUADRANT HISTORY (last 6 months)")
    history = build_history()
    for h in history[-6:]:
        print(f"    {h['date']}  →  {h['quadrant']:<12}  "
              f"(growth: {h['growth']}, inflation: {h['inflation']})")

    section("📊 ASSET CLASS CONTEXT")
    print(f"\n  ✅ Best assets:   {', '.join(q['best_assets'])}")
    print(f"  ❌ Worst assets:  {', '.join(q['worst_assets'])}")
    print(f"\n  Equity sectors aligned: {', '.join(EQUITY_PROXIES[q['name']])}")
    print(f"\n  🕐 Historical examples: {QUADRANT_HISTORY[q['name']]}")

    section("⚠️  IMPORTANT NOTES")
    print(f"\n  • 13F filings cover equity positions only.")
    print(f"    Commodity, bond and cash positioning not visible.")
    print(f"\n  • Quadrant signals suggest tilting portfolio weights,")
    print(f"    not wholesale rotation.")
    divider()

    return q, g, i

def print_china_full(china_data):
    china_result = assess_china(china_data)
    divider(f"🇨🇳  CHINA ECONOMY — {china_result['emoji']} {china_result['quadrant'].upper()}")
    print_china(china_data)
    print_china_guidance(china_result)
    section("⚠️  IMPORTANT NOTES")
    print(f"\n  • Chinese official data — interpret with caution.")
    print(f"\n  • Quadrant signals suggest tilting portfolio weights,")
    print(f"    not wholesale rotation.")
    divider()
    return china_result

def print_global(q, china_result, eu_result=None):
    """Guidance only — no geo, no performance."""
    us_r = {"quadrant": q['name'], "emoji": q['emoji']}
    eu_r = eu_result if eu_result else {"quadrant": "unknown", "emoji": "❓"}
    print_global_guidance(us_r, china_result, eu_r)
    divider()

def print_global_full(q, china_result, eu_result=None):
    """Full version — guidance + geo + performance."""
    us_r = {"quadrant": q['name'], "emoji": q['emoji']}
    eu_r = eu_result if eu_result else {"quadrant": "unknown", "emoji": "❓"}
    print("\n  🌐 Fetching live geopolitical risks...")
    geo_run(quadrant=q['name'])
    print_global_guidance(us_r, china_result, eu_r)
    section("📊 ASSET PERFORMANCE SINCE CURRENT REGIME STARTED")
    perf_run()
    divider()

def print_europe_full(eu_data):
    eu_result = assess_europe(eu_data)
    divider(f"🇪🇺  EUROZONE — {eu_result['emoji']} {eu_result['quadrant'].upper()}")
    print_europe(eu_data)
    section("⚠️  IMPORTANT NOTES")
    print(f"\n  • Data sourced from FRED/ECB/Eurostat.")
    print(f"\n  • Unemployment data may lag by 1-2 quarters.")
    print(f"\n  • Quadrant signals suggest tilting portfolio weights,")
    print(f"    not wholesale rotation.")
    divider()
    return eu_result

def run_europe():
    print("\n📡 Fetching Europe macroeconomic data...")
    eu_data = get_europe_data()
    print_europe_full(eu_data)

def run_us():
    print("\n📡 Fetching US macroeconomic data...")
    us_data   = get_all()
    rate_data = get_rate_data()
    print_us(us_data, rate_data)

def run_china():
    print("\n📡 Fetching China macroeconomic data...")
    china_data = get_china_data()
    print_china_full(china_data)

def run_global():
    print("\n📡 Fetching all macroeconomic data...")
    print("  🇺🇸 US (FRED)...")
    us_data    = get_all()
    rate_data  = get_rate_data()
    print("  🇨🇳 China (World Bank + FRED)...")
    china_data = get_china_data()
    print("  🇪🇺 Europe (FRED/ECB)...")

    print("  🇪🇺 Europe (FRED/ECB)...")
    eu_data = get_europe_data()

    us_result    = get_quadrant(us_data)
    china_result = assess_china(china_data)
    eu_result    = assess_europe(eu_data)
    q = us_result["quadrant"]
    print_global_full(q, china_result, eu_result)

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "global"

    if mode == "us":
        run_us()
    elif mode == "china":
        run_china()
    elif mode == "europe":
        run_europe()
    elif mode == "global":
        run_global()
    elif mode == "guidance":
        # Global guidance only — no geo, no performance, no individual economies
        print("\n📡 Fetching macro data...")
        us_data    = get_all()
        rate_data  = get_rate_data()
        china_data = get_china_data()
        eu_data    = get_europe_data()
        us_result  = get_quadrant(us_data)
        china_result = assess_china(china_data)
        eu_result  = assess_europe(eu_data)
        q = us_result["quadrant"]
        print_global(q, china_result, eu_result)
    else:
        print(f"\nUsage: python3 main.py [us|china|europe|global]")
        print(f"  us      — US economy full analysis")
        print(f"  china   — China economy full analysis")
        print(f"  europe  — Eurozone full analysis")
        print(f"  global  — All economies + comparison (default)\n")
