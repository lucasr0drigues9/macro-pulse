"""
China macroeconomic data via World Bank API + FRED.
World Bank: GDP growth rate, CPI inflation
FRED: China CPI cross-reference

Note: Chinese official data should be interpreted with caution.
The Fed's own research (2025) suggests recent figures are broadly
credible but historically China has smoothed GDP data politically.
"""
import os, json, requests
from datetime import datetime, timedelta

FRED_KEY  = os.getenv("FRED_API_KEY")
CACHE_DIR = ".macro_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

WORLDBANK_BASE = "https://api.worldbank.org/v2"

WORLDBANK_SERIES = {
    "chn_gdp_growth": "NY.GDP.MKTP.KD.ZG",   # GDP growth rate (annual %)
    "chn_cpi_wb":     "FP.CPI.TOTL.ZG",       # CPI inflation (annual %)
    "chn_unemployment":"SL.UEM.TOTL.ZS",       # Unemployment (% of labour force)
    "chn_exports":    "NE.EXP.GNFS.ZS",        # Exports % of GDP (economic activity)
}

def fetch_worldbank(indicator, country="CN", limit=10):
    cache_file = f"{CACHE_DIR}/wb_{country}_{indicator.replace('.','_')}.json"
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(hours=24):
            return json.load(open(cache_file))
    try:
        url = f"{WORLDBANK_BASE}/country/{country}/indicator/{indicator}"
        params = {
            "format":   "json",
            "per_page": limit,
            "mrv":      limit,
        }
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
        if len(data) < 2:
            return []
        obs = [(o["date"], o["value"])
               for o in data[1]
               if o["value"] is not None]
        obs.sort(key=lambda x: x[0], reverse=True)
        json.dump(obs, open(cache_file, "w"))
        return obs
    except Exception as e:
        print(f"  ⚠️  World Bank fetch failed ({indicator}): {e}")
        return []

def fetch_fred_china():
    """CPI from FRED as cross-reference."""
    cache_file = f"{CACHE_DIR}/china_CHNCPIALLMINMEI.json"
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(hours=24):
            obs = json.load(open(cache_file))
            return [(o["date"], float(o["value"]))
                    for o in obs if o["value"] != "."]
    try:
        url = "https://api.stlouisfed.org/fred/series/observations"
        params = {
            "series_id":  "CHNCPIALLMINMEI",
            "api_key":    FRED_KEY,
            "file_type":  "json",
            "sort_order": "desc",
            "limit":      12,
        }
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        obs = r.json().get("observations", [])
        json.dump(obs, open(cache_file, "w"))
        return [(o["date"], float(o["value"]))
                for o in obs if o["value"] != "."]
    except Exception as e:
        print(f"  ⚠️  FRED CPI fetch failed: {e}")
        return []

def get_china_data():
    print("  Fetching China GDP growth (World Bank)...")
    gdp_growth = fetch_worldbank("NY.GDP.MKTP.KD.ZG", limit=6)

    print("  Fetching China CPI (World Bank)...")
    cpi_wb = fetch_worldbank("FP.CPI.TOTL.ZG", limit=6)

    print("  Fetching China CPI (FRED cross-reference)...")
    cpi_fred = fetch_fred_china()

    print("  Fetching China unemployment (World Bank)...")
    unemployment = fetch_worldbank("SL.UEM.TOTL.ZS", limit=6)

    return {
        "gdp_growth":   gdp_growth,
        "cpi_wb":       cpi_wb,
        "cpi_fred":     cpi_fred,
        "unemployment": unemployment,
    }

def assess_china(data):
    gdp    = data.get("gdp_growth", [])
    cpi_wb = data.get("cpi_wb", [])
    cpi_fr = data.get("cpi_fred", [])

    # GDP growth — compare latest vs prior year
    latest_gdp  = gdp[0][1] if gdp else None
    prior_gdp   = gdp[1][1] if len(gdp) > 1 else None
    gdp_trend   = "rising"  if (latest_gdp and prior_gdp and latest_gdp > prior_gdp) else "falling"
    gdp_change  = round(latest_gdp - prior_gdp, 2) if (latest_gdp and prior_gdp) else None

    # Inflation — World Bank annual CPI
    latest_cpi  = cpi_wb[0][1] if cpi_wb else None
    prior_cpi   = cpi_wb[1][1] if len(cpi_wb) > 1 else None
    inf_trend   = "rising"  if (latest_cpi and prior_cpi and latest_cpi > prior_cpi) else "falling"

    # FRED CPI cross-reference (monthly, more recent)
    fred_cpi_change = None
    if len(cpi_fr) >= 4:
        fred_cpi_change = round(cpi_fr[0][1] - cpi_fr[3][1], 3)
        # Override inflation direction with more recent monthly data
        inf_trend = "rising" if fred_cpi_change > 0 else "falling"

    QUADRANTS = {
        ("rising",  "falling"): ("Goldilocks",  "🟢"),
        ("rising",  "rising"):  ("Reflation",   "🟡"),
        ("falling", "rising"):  ("Stagflation", "🔴"),
        ("falling", "falling"): ("Deflation",   "🔵"),
    }
    quadrant_name, emoji = QUADRANTS[(gdp_trend, inf_trend)]

    return {
        "quadrant":        quadrant_name,
        "emoji":           emoji,
        "growth":          gdp_trend,
        "inflation":       inf_trend,
        "latest_gdp":      latest_gdp,
        "prior_gdp":       prior_gdp,
        "gdp_change":      gdp_change,
        "gdp_year":        gdp[0][0] if gdp else None,
        "latest_cpi":      latest_cpi,
        "fred_cpi_change": fred_cpi_change,
        "fred_cpi_date":   cpi_fr[0][0] if cpi_fr else None,
    }

CHINA_STRUCTURAL_CONTEXT = {
    "Deflation": (
        "Two-speed economy: tech, EVs and renewables growing strongly\n"
        "     while property and heavy industry contract. Official GDP\n"
        "     masks deflationary pressure at the consumer level.\n"
        "     Pivot underway toward services, domestic consumption and\n"
        "     high-tech self-sufficiency (AI, semiconductors, green energy)."
    ),
    "Reflation": (
        "Stimulus working — both growth and inflation picking up.\n"
        "     New economy (tech, EVs, renewables) pulling traditional\n"
        "     sectors along. Watch for property market stabilisation."
    ),
    "Goldilocks": (
        "Ideal transition — high-quality growth with stable prices.\n"
        "     Services now 57%+ of GDP. Domestic consumption expanding.\n"
        "     New economy sectors (AI, EVs, green tech) leading growth."
    ),
    "Stagflation": (
        "Difficult environment — growth slowing while input costs rise.\n"
        "     Likely driven by energy/commodity price pressures.\n"
        "     Structural transition toward services may be stalling."
    ),
}

def print_china(data):
    result = assess_china(data)

    print(f"\n  {'─'*60}")
    print(f"  🇨🇳 CHINA — {result['emoji']} {result['quadrant'].upper()}")
    print(f"  ⚠️  Chinese official data — interpret with caution.")
    print(f"\n  📌 Structural context:")
    print(f"     {CHINA_STRUCTURAL_CONTEXT.get(result['quadrant'], '')}")

    print(f"\n  📈 GROWTH: {result['growth'].upper()}")
    if result["latest_gdp"]:
        print(f"     GDP growth ({result['gdp_year']}):     {result['latest_gdp']:>+.2f}% (official)")
    if result["gdp_change"]:
        trend_word = "accelerating" if result["gdp_change"] > 0 else "slowing"
        print(f"     Trend vs prior year:      {result['gdp_change']:>+.2f}pp ({trend_word})")

    print(f"\n  🌡️  INFLATION: {result['inflation'].upper()}")
    if result["latest_cpi"]:
        print(f"     CPI annual (World Bank):  {result['latest_cpi']:>+.2f}%")
    if result["fred_cpi_change"] is not None:
        print(f"     CPI 3m change (FRED):     {result['fred_cpi_change']:>+.3f}%  "
              f"(as of {result['fred_cpi_date']})")

if __name__ == "__main__":
    print("\n🇨🇳 Fetching China macroeconomic data...")
    data = get_china_data()
    print_china(data)
    print()
