"""
European macroeconomic data via FRED (ECB/Eurostat series).
Covers the Eurozone as a whole.
"""
import os, json, requests
from datetime import datetime, timedelta

FRED_KEY  = os.getenv("FRED_API_KEY")
CACHE_DIR = ".macro_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

EUROPE_SERIES = {
    "eu_gdp":    "CLVMEURSCAB1GQEA19",
    "eu_cpi":    "CP0000EZ19M086NEST",
    "eu_unemp":  "LRHUTTTTEZM156S",
    "eu_retail": "OECDESLRTTO01GPSAQ",
    "eu_rate":   "ECBDFR",
}

def fetch_eu_series(series_id, limit=24):
    cache_file = f"{CACHE_DIR}/eu_{series_id}.json"
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
        print(f"    ⚠️  Failed {series_id}: {e}")
        return []

def get_europe_data():
    result = {}
    for name, series_id in EUROPE_SERIES.items():
        print(f"  Fetching {name} ({series_id})...")
        result[name] = fetch_eu_series(series_id)
    return result

def pct_change(values, periods=3):
    if len(values) < periods + 1:
        return None
    latest = float(values[0][1])
    prior  = float(values[periods][1])
    if prior == 0:
        return None
    return round((latest - prior) / abs(prior) * 100, 2)

def assess_europe(data):
    gdp    = data.get("eu_gdp", [])
    cpi    = data.get("eu_cpi", [])
    retail = data.get("eu_retail", [])
    unemp  = data.get("eu_unemp", [])
    rate   = data.get("eu_rate", [])

    gdp_change    = pct_change(gdp, periods=2)
    # Retail series is already a growth rate (not an index)
    # Use value directly rather than calculating pct change of pct change
    retail_change = float(retail[0][1]) if retail else None

    cpi_yoy = None
    if len(cpi) >= 13:
        cpi_latest = float(cpi[0][1])
        cpi_12m    = float(cpi[12][1])
        if cpi_12m != 0:
            cpi_yoy = round((cpi_latest - cpi_12m) / abs(cpi_12m) * 100, 2)

    cpi_3m = pct_change(cpi, periods=3)

    ecb_rate   = float(rate[0][1]) if rate else None
    ecb_6m_ago = float(rate[5][1]) if len(rate) > 5 else None
    rate_change = round(ecb_rate - ecb_6m_ago, 3) if ecb_rate and ecb_6m_ago else None
    if rate_change and rate_change < -0.1:
        rate_trend = "cutting"
    elif rate_change and rate_change > 0.1:
        rate_trend = "hiking"
    else:
        rate_trend = "holding"

    unemp_rate = float(unemp[0][1]) if unemp else None

    growth_signals = []
    if gdp_change    is not None: growth_signals.append(1 if gdp_change    > 0 else -1)
    if retail_change is not None: growth_signals.append(1 if retail_change > 0 else -1)
    growth_score = sum(growth_signals) / len(growth_signals) if growth_signals else 0
    growth_dir   = "rising" if growth_score > 0 else "falling"

    inf_signals = []
    if cpi_3m  is not None: inf_signals.append(1 if cpi_3m > 0 else -1)
    if cpi_yoy is not None: inf_signals.append(1 if cpi_yoy > 2 else (-1 if cpi_yoy < 0 else 0))
    inf_score = sum(inf_signals) / len(inf_signals) if inf_signals else 0
    inf_dir   = "rising" if inf_score > 0 else "falling"

    QUADRANTS = {
        ("rising",  "falling"): ("Goldilocks",  "🟢"),
        ("rising",  "rising"):  ("Reflation",   "🟡"),
        ("falling", "rising"):  ("Stagflation", "🔴"),
        ("falling", "falling"): ("Deflation",   "🔵"),
    }
    quadrant_name, emoji = QUADRANTS[(growth_dir, inf_dir)]

    return {
        "quadrant":      quadrant_name,
        "emoji":         emoji,
        "growth":        growth_dir,
        "inflation":     inf_dir,
        "gdp_change":    gdp_change,
        "cpi_yoy":       cpi_yoy,
        "cpi_3m":        cpi_3m,
        "retail_change": retail_change,
        "unemp_rate":    unemp_rate,
        "ecb_rate":      ecb_rate,
        "rate_change":   rate_change,
        "rate_trend":    rate_trend,
        "gdp_date":      gdp[0][0] if gdp else None,
        "cpi_date":      cpi[0][0] if cpi else None,
    }

EU_STRUCTURAL_CONTEXT = {
    "Goldilocks": (
        "Ideal environment — growth recovering, inflation cooling toward "
        "ECB 2% target. Rate cuts providing tailwind. Manufacturing "
        "showing signs of stabilisation after prolonged slump."
    ),
    "Reflation": (
        "Growth and inflation both rising. Services sector strong, "
        "manufacturing still weak. ECB balancing growth support "
        "against inflation persistence. Energy price risk remains."
    ),
    "Stagflation": (
        "Worst case — growth weak while inflation stays elevated. "
        "Energy import dependence creates structural inflation risk. "
        "ECB in difficult position between growth and price stability."
    ),
    "Deflation": (
        "Growth stalling, inflation falling below ECB 2% target. "
        "Manufacturing recession weighing on Germany and industrial "
        "core. ECB cutting rates but structural headwinds persist."
    ),
}

def wrap(text, width=62, indent="     "):
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

def print_europe(data):
    result = assess_europe(data)

    print(f"\n  {'─'*60}")
    print(f"  🇪🇺 EUROZONE — {result['emoji']} {result['quadrant'].upper()}")
    print(f"\n  📌 Structural context:")
    wrap(EU_STRUCTURAL_CONTEXT.get(result["quadrant"], ""))

    print(f"\n  📈 GROWTH: {result['growth'].upper()}")
    if result["gdp_change"] is not None:
        print(f"     GDP change (2 qtrs):    {result['gdp_change']:>+.2f}%  "
              f"({result['gdp_date'][:7] if result['gdp_date'] else 'n/a'})")
    if result["retail_change"] is not None:
        print(f"     Retail trade (2 qtrs):  {result['retail_change']:>+.2f}%")
    if result["unemp_rate"] is not None:
        print(f"     Unemployment:            {result['unemp_rate']:.1f}%")

    print(f"\n  🌡️  INFLATION: {result['inflation'].upper()}")
    if result["cpi_yoy"] is not None:
        print(f"     HICP YoY:               {result['cpi_yoy']:>+.2f}%  "
              f"(ECB target: 2.0%)")
    if result["cpi_3m"] is not None:
        print(f"     HICP 3m change:         {result['cpi_3m']:>+.3f}%")

    print(f"\n  🏦 ECB RATE")
    if result["ecb_rate"] is not None:
        trend_emoji = "📉" if result["rate_trend"] == "cutting" else (
                      "📈" if result["rate_trend"] == "hiking" else "↔️")
        print(f"     {trend_emoji} ECB deposit rate:    {result['ecb_rate']:.2f}%  "
              f"({result['rate_trend']})")
    if result["rate_change"] is not None:
        print(f"     Change (6 months):      {result['rate_change']:>+.3f}pp")

if __name__ == "__main__":
    print("\n🇪🇺 Fetching Europe macroeconomic data...")
    data   = get_europe_data()
    result = assess_europe(data)
    print(f"\n  Quadrant: {result['emoji']} {result['quadrant']}")
    print_europe(data)
    print()
