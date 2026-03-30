import time
import json
from datetime import datetime, timedelta
import yfinance as yf

# ── Price cache ────────────────────────────────────────────────────────────────
PRICE_CACHE_FILE = "price_cache.json"
PRICE_CACHE_TTL  = 4  # hours

def load_price_cache() -> dict:
    try:
        with open(PRICE_CACHE_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_price_cache(cache: dict):
    with open(PRICE_CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)

def price_cache_get(symbol: str) -> dict | None:
    cache = load_price_cache()
    entry = cache.get(symbol)
    if not entry:
        return None
    saved_at = datetime.fromisoformat(entry["saved_at"])
    if datetime.now() - saved_at > timedelta(hours=PRICE_CACHE_TTL):
        return None
    return entry["data"]

def price_cache_set(symbol: str, data: dict):
    cache = load_price_cache()
    cache[symbol] = {"saved_at": datetime.now().isoformat(), "data": data}
    save_price_cache(cache)


# ── Country flags ──────────────────────────────────────────────────────────────
COUNTRY_FLAGS = {
    "United States":  "🇺🇸",
    "United Kingdom": "🇬🇧",
    "Norway":         "🇳🇴",
    "Sweden":         "🇸🇪",
    "Denmark":        "🇩🇰",
    "Finland":        "🇫🇮",
    "Germany":        "🇩🇪",
    "France":         "🇫🇷",
    "Netherlands":    "🇳🇱",
    "Switzerland":    "🇨🇭",
    "Ireland":        "🇮🇪",
    "China":          "🇨🇳",
    "Japan":          "🇯🇵",
    "Canada":         "🇨🇦",
    "Australia":      "🇦🇺",
    "Brazil":         "🇧🇷",
    "India":          "🇮🇳",
    "South Korea":    "🇰🇷",
    "Taiwan":         "🇹🇼",
    "Israel":         "🇮🇱",
    "Spain":          "🇪🇸",
    "Italy":          "🇮🇹",
    "Belgium":        "🇧🇪",
    "Singapore":      "🇸🇬",
    "Hong Kong":      "🇭🇰",
}

# ── Manual ticker overrides ────────────────────────────────────────────────────
NAME_TO_TICKER = {
    "ALPHABET":                   "GOOGL",
    "AMAZON COM":                 "AMZN",
    "APPLE":                      "AAPL",
    "MICROSOFT":                  "MSFT",
    "NVIDIA":                     "NVDA",
    "META PLATFORMS":             "META",
    "BERKSHIRE HATHAWAY":         "BRK-B",
    "TESLA":                      "TSLA",
    "JPMORGAN CHASE":             "JPM",
    "BANK OF AMERICA":            "BAC",
    "BANK AMERICA":               "BAC",
    "BANK AMER":                  "BAC",
    "COCA COLA":                  "KO",
    "AMERICAN EXPRESS":           "AXP",
    "CHEVRON":                    "CVX",
    "MOODYS":                     "MCO",
    "CAPITAL ONE FINANCIAL":      "COF",
    "CITIGROUP":                  "C",
    "PFIZER":                     "PFE",
    "UNITEDHEALTH":               "UNH",
    "MASTERCARD":                 "MA",
    "VISA":                       "V",
    "UBER TECHNOLOGIES":          "UBER",
    "LULULEMON ATHLETICA":        "LULU",
    "PALANTIR TECHNOLOGIES":      "PLTR",
    "HALLIBURTON":                "HAL",
    "MOLINA HEALTHCARE":          "MOH",
    "GENERAL MOTORS":             "GM",
    "ALLY FINANCIAL":             "ALLY",
    "HUNTSMAN":                   "HUN",
    "DIAGEO":                     "DEO",
    "NEW YORK TIMES":             "NYT",
    "SLM":                        "SLM",
    "KROGER":                     "KR",
    "AON":                        "AON",
    "TEXAS ROADHOUSE":            "TXRH",
    "DICKS SPORTING GOODS":       "DKS",
    "HILTON WORLDWIDE":           "HLT",
    "PHILLIPS 66":                "PSX",
    "DEXCOM":                     "DXCM",
    "WEYERHAEUSER":               "WY",
    "ENTERGY":                    "ETR",
    "CHECK POINT SOFTWARE TECH LT": "CHKP",
    "MONDAY COM":                 "MNDY",
    "BOOZ ALLEN HAMILTON":        "BAH",
    "CADENCE BANK":               "CADE",
    "VALMONT INDUSTRIES":         "VMI",
    "ACI WORLDWIDE":              "ACIW",
    "CRANE":                      "CR",
    "MANPOWERGROUP":              "MAN",
    "NATIONAL HEALTH INVESTMENTS": "NHI",
    "SOLVENTUM":                  "SOLV",
    "CAMPBELLS":                  "CPB",
    "QUIDELORTHO":                "QDEL",
    "MACOM TECH SOLUTIONS":       "MTSI",
    "LIBERTY MEDIA":              "FWONK",
    "LIBERTY LIVE":               "LLYVA",
    "KINDER MORGAN":              "KMI",
    "COMMUNITY HEALTH SYSTEMS":   "CYH",
    "ALLERGAN":                   "AGN",
    "KAYNE ANDERSON MLP INVT":    "KYN",
    "NRG YIELD":                  "NYLD",
    "CHIPOTLE MEXICAN GRILL":     "CMG",
    "ALIBABA":                    "BABA",
    "MERCADOLIBRE":               "MELI",
    "JD.COM":                     "JD",
    "ASML":                       "ASML",
    "REGENERON PHARMACEUTICALS":  "REGN",
    "LAUDER ESTEE":               "EL",
    "V F":                        "VFC",
    "JETBLUE AIRWAYS":            "JBLU",
    "TEREX":                      "TEX",
    "KBR":                        "KBR",
    "RYLAND":                     "RYL",
    "AXIALL":                     "AXLL",
    "NIKE":                       "NKE",
    "U S G":                      "USG",
    "CLEARWATER ANALYTICS":       "CWAN",
    "MILLROSE PPTYS":             "MRP",
    "MILLROSE PROPERTIES":        "MRP",
    "FACTSET RESH SYSTEMS":       "FDS",
    "FACTSET RESEARCH SYSTEMS":   "FDS",
    "KELLANOVA":                  "ACQUIRED",
    "GITLAB":                     "GTLB",
    "JOYY":                       "YY",
    "HYSTER-YALE":                "HY",
    "ALBERTSONS":                 "ACI",
    "DAVITA":                     "DVA",
    "HELLO":                      "MOMO",
    "U HAUL":                     "UHAL",
    "ELASTIC":                    "ESTC",
    "POWERFLEET":                 "AIOT",
    "SCHLUMBERGER":               "SLB",
    "COGNEX":                     "CGNX",
    "REVVITY":                    "RVTY",
    "SUPER MICRO COMPUTER":       "SMCI",
    "NEXTRACKER":                 "NXT",
    "ACUREN":                     "ACW",
    "FMC":                        "FMC",
    "SHAKE SHACK":                "SHAK",
    "IONQ":                       "IONQ",
    "HEALTHEQUITY":               "HQY",
    "REPLIGEN":                   "RGEN",
    "BLOOM ENERGY":               "BE",
    "OKLO":                       "OKLO",
    "FABRINET":                   "FN",
    "BRIDGEBIO PHARMA":           "BBIO",
    "NEBIUS GROUP N.V.":          "NBIS",
    "COHERENT":                   "COHR",
    "COMFORT SYS USA":            "FIX",
    "ECHOSTAR":                   "SATS",
    "NVENT ELECTRIC":             "NVT",
    "BRUNSWICK":                  "BC",
    "QXO":                        "QXO",
    "IONIS PHARMACEUTICALS":      "IONS",
    "INSMED":                     "INSM",
    "NEXTPOWER":                  "NXT",
    "NETSKOPE":                   "NTSK",
    "F&G ANNUITIES & LIFE":       "FG",
    "WW GRAINGER":                "GWW",
    "GRAINGER W W":               "GWW",
    "GRACO":                      "GGG",
    "AMRIZE":                     "AMRZ",
    "BROADCOM":                   "AVGO",
    "SEA":                        "SE",
    "JD COM":                     "JD",
    "FUTU HLDGS":                 "FUTU",
    "GRAB":                       "GRAB",
    "FULL TRUCK ALLIANCE":        "YMM",
    "ATOUR LIFESTYLE":            "ATAT",
    "ATRENEW":                    "RERE",
    "AMER SPORTS":                "AS",
    "GLOBANT S A":                "GLOB",
    "APOLLO GLOBAL MGMT":         "APO",
    "APOLLO GLOBAL MANAGEMENT":   "APO",
    "MSCI":                       "MSCI",
    "AKAMAI TECHNOLOGIES":        "AKAM",
    "INTUIT":                     "INTU",
    "GOLDMAN SACHS":              "GS",
    "LUMENTUM":                   "LITE",
    "COMERICA":              "CMA",
    "HILLENBRAND":           "HI",
    "CIDARA THERAPEUTICS":   "ACQUIRED",
    "AVIDITY BIOSCIENCES":   "RNA",
}

_ticker_cache = {}


def lookup_ticker(company: str) -> str | None:
    if company in NAME_TO_TICKER:
        return NAME_TO_TICKER[company]
    if company in _ticker_cache:
        return _ticker_cache[company]

    attempts = [company]
    words = company.split()
    if len(words) > 2:
        attempts.append(" ".join(words[:3]))
    if len(words) > 1:
        attempts.append(words[0])

    for attempt in attempts:
        try:
            time.sleep(0.3)
            results = yf.Search(attempt, max_results=3).quotes
            for r in results:
                symbol = r.get("symbol", "")
                if symbol and "." not in symbol and len(symbol) <= 5:
                    _ticker_cache[company] = symbol
                    return symbol
        except Exception:
            continue

    _ticker_cache[company] = None
    return None


def get_entry_score(ticker_symbol: str) -> dict:
    if ticker_symbol == "ACQUIRED":
        return {"entry": "n/a", "label": "🔒 acquired", "country": "", "flag": ""}

    cached = price_cache_get(ticker_symbol)
    if cached:
        return cached

    time.sleep(0.5)

    try:
        info      = yf.Ticker(ticker_symbol).info
        current   = info.get("currentPrice") or info.get("regularMarketPrice")
        week_low  = info.get("fiftyTwoWeekLow")
        week_high = info.get("fiftyTwoWeekHigh")

        if not all([current, week_low, week_high]):
            return {"entry": "unknown", "label": "❓ no data", "country": "", "flag": "🌐"}

        position = (current - week_low) / (week_high - week_low) * 100

        if position < 30:
            label = "✅ good entry"
        elif position < 60:
            label = "⚠️  fair entry"
        else:
            label = "❌ expensive"

        country = info.get("country", "")
        flag    = COUNTRY_FLAGS.get(country, "🌐")

        result = {
            "entry":    round(position, 1),
            "label":    label,
            "price":    current,
            "52w_low":  week_low,
            "52w_high": week_high,
            "country":  country,
            "flag":     flag,
        }
        price_cache_set(ticker_symbol, result)
        return result

    except Exception:
        return {"entry": "unknown", "label": "❓ no data", "country": "", "flag": "🌐"}


def enrich_with_prices(ranked: list[dict]) -> list[dict]:
    for stock in ranked:
        company = stock["ticker"]
        symbol  = lookup_ticker(company)

        if symbol:
            stock["symbol"]     = symbol
            stock["price_info"] = get_entry_score(symbol)
        else:
            stock["symbol"]     = "?"
            stock["price_info"] = {"entry": "unknown", "label": "❓ unmapped", "flag": "🌐"}

    return ranked
