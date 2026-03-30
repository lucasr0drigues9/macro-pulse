"""
Connects the superinvestor tracker with the macro dashboard.
Tags each stock with its sector, maps to the current macro
regime, and surfaces alignment/divergence between smart money
positioning and the macroeconomic signal.
"""
import sys
import yfinance as yf
from datetime import datetime
sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")
from data_freshness import get_freshness_assessment, print_freshness_warning
from geopolitical import run as geo_run

sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")

SECTOR_QUADRANT_MAP = {
    "Reflation": {
        "aligned": ["Energy", "Basic Materials", "Industrials", "Utilities"],
        "neutral": ["Financial Services", "Real Estate", "Consumer Defensive"],
        "avoid":   ["Technology", "Communication Services", "Consumer Cyclical", "Healthcare"],
    },
    "Goldilocks": {
        "aligned": ["Technology", "Communication Services", "Consumer Cyclical", "Financial Services"],
        "neutral": ["Industrials", "Real Estate", "Healthcare"],
        "avoid":   ["Energy", "Basic Materials", "Utilities", "Consumer Defensive"],
    },
    "Stagflation": {
        "aligned": ["Energy", "Basic Materials", "Consumer Defensive", "Utilities"],
        "neutral": ["Healthcare"],
        "avoid":   ["Technology", "Communication Services", "Consumer Cyclical", "Financial Services", "Real Estate", "Industrials"],
    },
    "Deflation": {
        "aligned": ["Utilities", "Consumer Defensive", "Healthcare"],
        "neutral": ["Financial Services", "Real Estate"],
        "avoid":   ["Energy", "Basic Materials", "Industrials", "Technology", "Consumer Cyclical", "Communication Services"],
    },
}

SPECIAL_CASES = {
    "BABA":  "China reflation bet — Tepper thesis, not sector-driven",
    "NTES":  "China reflation bet — cheap on fundamentals",
    "FUTU":  "China reflation bet — financial services proxy",
    "PDD":   "China domestic consumption recovery play",
    "JD":    "China domestic consumption recovery play",
}

NAME_TO_SYMBOL = {
    "ALPHABET":              "GOOGL",
    "NVIDIA":                "NVDA",
    "AMAZON COM":            "AMZN",
    "META PLATFORMS":        "META",
    "APPLE":                 "AAPL",
    "MICROSOFT":             "MSFT",
    "UBER TECHNOLOGIES":     "UBER",
    "BROADCOM":              "AVGO",
    "TESLA":                 "TSLA",
    "PALANTIR TECHNOLOGIES": "PLTR",
    "NETEASE":               "NTES",
    "LUMENTUM":              "LITE",
    "SYNOPSYS":              "SNPS",
    "PFIZER":                "PFE",
    "BERKSHIRE HATHAWAY":    "BRK-B",
    "AMERICAN EXPRESS":      "AXP",
    "COCA COLA":             "KO",
    "CHEVRON":               "CVX",
    "OCCIDENTAL PETROLEUM":  "OXY",
    "BANK OF AMERICA":       "BAC",
    "CITIGROUP":             "C",
    "CONSTELLATION BRANDS":  "STZ",
    "DAVITA":                "DVA",
    "KRAFT HEINZ":           "KHC",
    "VISA":                  "V",
    "MASTERCARD":            "MA",
    "MOODYS":                "MCO",
    "NU HOLDINGS":           "NU",
    "VERISIGN":              "VRSN",
    "FUTU":                  "FUTU",
    "JD COM":                "JD",
    "PINDUODUO":             "PDD",
    "TRIP COM":              "TCOM",
    "ALIBABA":               "BABA",
    "MERCADOLIBRE":              "MELI",
    "ROCKET LAB":                "RKLB",
    "CLEARWATER ANALYTICS HLDGS I": "CWAN",
    "TAL EDUCATION":             "TAL",
    "UNITEDHEALTH":              "UNH",
    "ECHOSTAR":                  "SATS",
    "MILLROSE PPTYS":            "MRP",
    "CORE SCIENTIFIC":           "CORZ",
    "ZOETIS":                    "ZTS",
    "ASTERA LABS":               "ALAB",
    "NETFLIX":                   "NFLX",
    "BRIDGEBIO PHARMA":          "BBIO",
    "TERADYNE":                  "TER",
    "MP MATERIALS":              "MP",
    "APPLOVIN":                  "APP",
    "GRAB HOLDINGS LIMITED":     "GRAB",
    "SLB LIMITED":               "SLB",
    "WW GRAINGER":               "GWW",
    "CYBERARK SOFTWARE":         "CYBR",
    "ELECTRONIC ARTS":           "EA",
    "COMERICA":                  "CMA",
    "JPMORGAN CHASE & CO.":      "JPM",
    "KINDER MORGAN":             "KMI",
    "MONGODB":                   "MDB",
    "OPENDOOR TECHNOLOGIES":     "OPEN",
    "PLYMOUTH INDL REIT":        "PLYM",
    "DOORDASH":                  "DASH",
    "INTUITIVE SURGICAL":        "ISRG",
    "COUPANG":                   "CPNG",
    "ELI LILLY &":               "LLY",
    "COINBASE GLOBAL":           "COIN",
    "EVERSOURCE ENERGY":         "ES",
    "DEXCOM":                    "DXCM",
    "INTUIT":                    "INTU",
    "S&P GLOBAL":                "SPGI",
    "SEA":                       "SE",
    "EXACT SCIENCES":            "EXAS",
    "CHUBB LIMITED":             "CB",
    "MASTEC":                    "MTZ",
    "SYNCHRONY FINANCIAL":       "SYF",
    "WALMART":                   "WMT",
    "WARNER BROS DISCOVERY":     "WBD",
    "ELEVANCE HEALTH INC FORMERLY": "ELV",
    "FIRST CTZNS BANCSHARES INC D": "FCNCA",
    "HARTFORD INSURANCE":        "HIG",
    "STRATEGY":                  "MSTR",
    "NEW YORK TIMES":            "NYT",
    "RIVIAN AUTOMOTIVE":         "RIVN",
    "REDDIT":                    "RDDT",
    "GENERAL MTRS":              "GM",
    "NEW GOLD INC CDA":          "NGD",
    "SEMRUSH":                   "SEMR",
    "CIRCLE INTERNET":           "CRCL",
    "APPLIED DIGITAL":           "APLD",
    "SUPER GROUP SGHC LIMITED":  "SGHC",
    "JANUS HENDERSON":           "JHG",
    "AVIDITY BIOSCIENCES":       "RNA",
    "TANDEM DIABETES CARE":      "TNDM",
    "AMICUS THERAPEUTICS":       "FOLD",
    "LAUREATE EDUCATION":        "LAUR",
    "SEALED AIR":                "SEE",
    "ACUITY":                    "AYI",
    "ARCHER AVIATION":           "ACHR",
    "HALLIBURTON":               "HAL",
    "ENERGY TRANSFER PRTNRS L P":"ET",
    "LIBERTY LIVE":              "LLYVK",
    "RESTAURANT BRANDS":         "QSR",
    "CIDARA THERAPEUTICS":       "CDTX",
    "BILLIONTOONE":              "BONE",
    "QNITY ELECTRONICS":         "QNTY",
    "AMRIZE":                    "AMRZ",
    "NEXTPOWER":                 "NXTP",
    "LEGENCE":                   "LGCN",
    "FIGMA":                     "FIG",
    "CELCUITY":                  "CELC",
    "NETSKOPE":                  "NTSK",
    "MEDLINE":                   "MDL",
    "SPDR S&P 500 ETF TR":       "SPY",
}

_sector_cache = {
    # Private/small companies not on yfinance — hardcoded
    "CDTX": "Healthcare",
    "BONE": "Healthcare",
    "MDL":  "Healthcare",
    "QNTY": "Technology",
    "NXTP": "Utilities",
    "LGCN": "Industrials",
    "NTSK": "Technology",
    "FIGMA": "Technology",
    "FIG":   "Technology",
}

def resolve_symbol(name):
    upper = name.upper().strip()
    if upper in NAME_TO_SYMBOL:
        return NAME_TO_SYMBOL[upper]
    if len(name) <= 5 and name.replace("-","").isupper():
        return name
    return name

def get_sector(name, verbose=False):
    symbol = resolve_symbol(name)
    if symbol in _sector_cache:
        return symbol, _sector_cache[symbol]
    try:
        if verbose:
            print(f"    Looking up sector: {symbol}...")
        info   = yf.Ticker(symbol).info
        sector = info.get("sector", "Unknown")
        _sector_cache[symbol] = sector
        return symbol, sector
    except:
        return symbol, "Unknown"

def get_alignment(sector, quadrant):
    mapping = SECTOR_QUADRANT_MAP.get(quadrant, {})
    if sector in mapping.get("aligned", []):
        return "aligned",   "✅"
    elif sector in mapping.get("avoid", []):
        return "diverging", "⚠️ "
    else:
        return "neutral",   "➖"

def analyse_alignment(rankings, quadrant, top_n=100):
    aligned   = []
    neutral   = []
    diverging = []
    for stock in rankings[:top_n]:
        name_upper = stock.get("ticker", "").upper()
        skip_terms = ["ETF TR", "ETF", "FUND", "TRUST", "PARTNERS L P",
                     "INVESTMENTS I", "SPDR", "ALPS", "ABENGOA",
                     "KAYNE ANDERSON", "CLEARBRIDGE", "TORTOISE",
                     "TEEKAY", "NRG YIELD", "SELECT SECTOR"]
        if any(t in name_upper for t in skip_terms):
            continue
        name    = stock.get("ticker", "")
        score   = round(float(stock.get("investor_score", stock.get("score", 0))), 1)
        symbol, sector = get_sector(name, verbose=True)
        status, emoji  = get_alignment(sector, quadrant)
        special = SPECIAL_CASES.get(symbol, SPECIAL_CASES.get(name, ""))
        entry = {
            "ticker":  symbol,
            "name":    name,
            "score":   score,
            "sector":  sector,
            "status":  status,
            "emoji":   emoji,
            "special": special,
        }
        if status == "aligned":
            aligned.append(entry)
        elif status == "diverging":
            diverging.append(entry)
        else:
            neutral.append(entry)
    return aligned, neutral, diverging

def print_alignment(rankings, quadrant, quadrant_emoji):
    print(f"\n{'='*65}")
    print(f"  🔗 SUPERINVESTOR vs MACRO ALIGNMENT")
    print(f"  Macro regime: {quadrant_emoji} {quadrant}")
    print(f"{'='*65}")

    aligned, neutral, diverging = analyse_alignment(rankings, quadrant)

    if aligned:
        print(f"\n  ✅ ALIGNED WITH MACRO — smart money + regime agree")
        print(f"  {'Symbol':<7} {'Score':>6}   {'Sector':<28} Note")
        print(f"  {'─'*6} {'─'*6}   {'─'*26} {'─'*20}")
        for s in aligned:
            note = s["special"] or f"Macro pick in {quadrant}"
            print(f"  {s['ticker']:<7} {s['score']:>6.1f}   {s['sector']:<28} {note}")

    if diverging:
        print(f"\n  ⚠️  DIVERGING FROM MACRO — smart money vs regime disagree")
        print(f"  {'Symbol':<7} {'Score':>6}   {'Sector':<28} Note")
        print(f"  {'─'*6} {'─'*6}   {'─'*26} {'─'*20}")
        for s in diverging:
            note = s["special"] or f"Macro says avoid in {quadrant}"
            print(f"  {s['ticker']:<7} {s['score']:>6.1f}   {s['sector']:<28} {note}")

    if neutral:
        print(f"\n  ➖ NEUTRAL — sector not strongly called by current regime")
        print(f"  {'Symbol':<7} {'Score':>6}   {'Sector':<28} Name")
        print(f"  {'─'*6} {'─'*6}   {'─'*26} {'─'*20}")
        for s in neutral:
            print(f"  {s['ticker']:<7} {s['score']:>6.1f}   {s['sector']:<28} {s['name']}")

    # Sector summary
    from collections import Counter
    all_stocks    = aligned + neutral + diverging
    known_stocks  = [s for s in all_stocks if s["sector"] != "Unknown"]
    sector_counts = Counter(s["sector"] for s in known_stocks)
    align_counts  = Counter(s["status"] for s in all_stocks)
    known_count   = len(known_stocks)
    total         = len(all_stocks)

    print(f"\n  {'─'*60}")
    print(f"  📊 SECTOR BREAKDOWN — top {total} holdings ({known_count} resolved)")
    print(f"\n  {'Sector':<28} {'Count':>5}   Alignment in {quadrant}")
    print(f"  {'─'*26} {'─'*5}   {'─'*20}")
    sector_align = SECTOR_QUADRANT_MAP.get(quadrant, {})
    for sector, count in sector_counts.most_common(12):
        if sector in sector_align.get("aligned", []):
            tag = "✅ aligned"
        elif sector in sector_align.get("avoid", []):
            tag = "⚠️  avoid"
        else:
            tag = "➖ neutral"
        print(f"  {sector:<28} {count:>5}   {tag}")

    n_aligned  = align_counts.get("aligned", 0)
    n_diverging = align_counts.get("diverging", 0)
    n_neutral  = align_counts.get("neutral", 0)
    print(f"\n  Overall: ✅ {n_aligned} aligned  ⚠️  {n_diverging} diverging  ➖ {n_neutral} neutral  ❓ {total-known_count} unknown")

    if diverging:
        print(f"\n  {'─'*60}")
        print(f"  💡 THE DIVERGENCE THESIS")
        print(f"\n  Smart money is buying {len(diverging)} stocks the macro says avoid.")
        if quadrant == "Reflation":
            print(f"""
  Two interpretations:

  1. Smart money is wrong — energy and commodities should
     outperform. Reflation picks (+20.2% since Aug 2025)
     vs growth stocks (+5.8%) supports this view.

  2. Smart money is right — AI is a structural productivity
     shift that is disinflationary long-term. If AI cuts
     costs across the economy, inflation cools and the
     regime shifts toward Goldilocks where tech wins.

  Historical precedent: In the 1990s, tech outperformed
  despite macro signals suggesting otherwise — internet
  productivity drove a decade of Goldilocks. The AI
  thesis is the same bet.""")

    print(f"\n{'='*65}\n")

def wrap_print(text, width=62, indent="  "):
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

REGIME_PLAYBOOK = {
    "Reflation": {
        "current_action": (
            "Stay in energy and commodities. The macro signal is confirmed "
            "and sustained 8+ months. XLE +45.5%, DBC +32.1% since August."
        ),
        "if_transition_stagflation": (
            "REDUCE equities broadly. ADD Gold (GLD), Consumer staples (XLP), Cash. "
            "HOLD Energy — only sector that survives stagflation."
        ),
        "if_transition_goldilocks": (
            "ROTATE from XLE/DBC into QQQ/NVDA/MSFT. "
            "Watch for 2 consecutive months of CPI below +0.2% as the signal."
        ),
        "superinvestor_divergence_note": (
            "Smart money holding tech through Reflation pain — underperforming "
            "energy picks by ~15% since August. They're paying an opportunity "
            "cost betting Goldilocks arrives."
        ),
    },
    "Goldilocks": {
        "current_action": (
            "Own growth stocks and tech broadly. Superinvestors fully "
            "vindicated here — AI positioning pays off."
        ),
        "if_transition_reflation": (
            "ADD Energy (XLE), Commodities (DBC), TIPS. "
            "REDUCE long-duration growth stocks."
        ),
        "if_transition_stagflation": (
            "EMERGENCY REDUCE most equities. ADD Gold, Cash, Consumer staples."
        ),
        "superinvestor_divergence_note": (
            "Smart money fully aligned in Goldilocks — AI thesis vindicated."
        ),
    },
    "Stagflation": {
        "current_action": (
            "Capital preservation priority. Gold, cash, energy, "
            "consumer staples only. Reduce equities significantly."
        ),
        "if_transition_reflation": (
            "ADD Energy, Commodities, TIPS. Cautiously re-enter cyclicals."
        ),
        "if_transition_deflation": (
            "ADD Long bonds (TLT), Cash, Utilities. Recession incoming."
        ),
        "superinvestor_divergence_note": (
            "Tech holdings under maximum pressure. Watch for forced selling "
            "— could create entry opportunity."
        ),
    },
    "Deflation": {
        "current_action": (
            "Bonds rally strongly. Cash preserves purchasing power. "
            "Wait for policy response before re-entering equities."
        ),
        "if_transition_goldilocks": (
            "ADD Growth stocks, Tech, Consumer discretionary. "
            "Superinvestor AI thesis begins to work."
        ),
        "if_transition_reflation": (
            "ADD Energy, Commodities, TIPS. REDUCE long bonds."
        ),
        "superinvestor_divergence_note": (
            "Tech resilient in deflation — AI productivity thesis "
            "gains credibility as costs fall."
        ),
    },
}

def print_action_plan(quadrant, transition_result, diverging_count, aligned_count):
    playbook = REGIME_PLAYBOOK.get(quadrant, {})
    if not playbook:
        return

    print(f"\n{'='*65}")
    print(f"  🎯 RECOMMENDED ACTION PLAN")
    print(f"{'='*65}")
    print(f"\n  Current regime: {quadrant}")
    print(f"\n  📌 RIGHT NOW:")
    wrap_print(playbook["current_action"])

    likely = transition_result.get("likely_name")
    if likely:
        key = f"if_transition_{likely.lower()}"
        if key in playbook:
            print(f"\n  ⚠️  IF {likely.upper()} ARRIVES:")
            wrap_print(playbook[key])

    for k, v in playbook.items():
        if k.startswith("if_transition_") and k != f"if_transition_{likely.lower() if likely else ''}":
            scenario = k.replace("if_transition_", "").title()
            print(f"\n  📍 IF {scenario.upper()} ARRIVES:")
            wrap_print(v)
            break

    total = diverging_count + aligned_count
    pct   = int(diverging_count / total * 100) if total > 0 else 0
    print(f"\n  {'─'*60}")
    print(f"  🔗 SUPERINVESTOR CONTEXT")
    print(f"\n  {pct}% of top holdings diverge from macro signal.")
    wrap_print(playbook["superinvestor_divergence_note"])

    if quadrant == "Reflation" and pct > 60:
        print(f"""
  💡 OPTIMAL STRATEGY given current data:

  Phase 1 — Now:    Hold energy/commodities (macro confirmed)
  Phase 2 — Watch:  Monitor CPI monthly + retail sales
  Phase 3 — Signal: CPI < +0.2% for 2 months → rotate to tech
  Phase 4 — Rotate: XLE/DBC → QQQ/NVDA/MSFT

  This captures Reflation gains now AND positions for the
  AI/Goldilocks regime the superinvestors are betting on.""")

    print(f"\n{'='*65}\n")


# 13F filing schedule
# Each tuple: (filing_date, quarter, data_from_date)
FILING_SCHEDULE = [
    (datetime(2026,  2, 14), "Q4 2025", datetime(2025, 12, 31)),
    (datetime(2026,  5, 15), "Q1 2026", datetime(2026,  3, 31)),
    (datetime(2026,  8, 14), "Q2 2026", datetime(2026,  6, 30)),
    (datetime(2026, 11, 14), "Q3 2026", datetime(2026,  9, 30)),
    (datetime(2027,  2, 14), "Q4 2026", datetime(2026, 12, 31)),
]

# Filing season = within 30 days AFTER a filing date
FILING_SEASON_DAYS = 30

def get_filing_status():
    """
    Returns the current filing status:
    - FILING_SEASON: within 30 days after a filing date (high confidence)
    - BETWEEN_FILINGS: more than 30 days after last filing (low confidence)
    """
    today = datetime.now()

    # Check if we're in filing season (after a recent filing)
    for i, (filing_date, quarter, data_from) in enumerate(FILING_SCHEDULE):
        if filing_date <= today:
            days_since = (today - filing_date).days
            if days_since <= FILING_SEASON_DAYS:
                # Find next filing
                next_idx = i + 1
                if next_idx < len(FILING_SCHEDULE):
                    next_date, next_quarter, _ = FILING_SCHEDULE[next_idx]
                    days_to_next = (next_date - today).days
                else:
                    next_date, next_quarter, days_to_next = None, None, None
                return {
                    "mode":           "FILING_SEASON",
                    "emoji":          "🟢",
                    "current_quarter": quarter,
                    "filing_date":    filing_date.strftime("%B %d, %Y"),
                    "days_since":     days_since,
                    "data_from":      data_from.strftime("%B %d, %Y"),
                    "next_quarter":   next_quarter,
                    "next_date":      next_date.strftime("%B %d, %Y") if next_date else None,
                    "days_to_next":   days_to_next,
                    "confidence":     "HIGH",
                    "recommendation": "RUN FULL ALIGNMENT ANALYSIS",
                }

    # Find the most recent past filing and next upcoming filing
    past_filings   = [(d, q, df) for d, q, df in FILING_SCHEDULE if d <= today]
    future_filings = [(d, q, df) for d, q, df in FILING_SCHEDULE if d > today]

    last_filing, last_quarter, last_data = past_filings[-1] if past_filings else (None, None, None)
    next_filing, next_quarter, _         = future_filings[0] if future_filings else (None, None, None)

    days_since_last = (today - last_filing).days if last_filing else None
    days_to_next    = (next_filing - today).days if next_filing else None

    if days_to_next and days_to_next <= 14:
        emoji      = "🟡"
        confidence = "LOW — FILING IMMINENT"
    else:
        emoji      = "🔴"
        confidence = "LOW"

    return {
        "mode":            "BETWEEN_FILINGS",
        "emoji":           emoji,
        "current_quarter": last_quarter,
        "filing_date":     last_filing.strftime("%B %d, %Y") if last_filing else None,
        "days_since":      days_since_last,
        "data_from":       last_data.strftime("%B %d, %Y") if last_data else None,
        "next_quarter":    next_quarter,
        "next_date":       next_filing.strftime("%B %d, %Y") if next_filing else None,
        "days_to_next":    days_to_next,
        "confidence":      confidence,
        "recommendation":  "MACRO SIGNALS ONLY — superinvestor data too stale",
    }

def print_filing_status():
    status = get_filing_status()
    mode   = status["mode"]

    print(f"\n{'='*65}")
    print(f"  📅 13F FILING STATUS")
    print(f"{'='*65}")
    print(f"\n  {status['emoji']} Mode: {mode.replace('_', ' ')}")
    print(f"  Confidence:  {status['confidence']}")
    print(f"  Recommendation: {status['recommendation']}")

    if mode == "FILING_SEASON":
        print(f"\n  ✅ {status['current_quarter']} filings released {status['days_since']} days ago")
        print(f"     Data reflects positions as of: {status['data_from']}")
        print(f"\n  This is the highest-value window for alignment analysis.")
        print(f"  Superinvestor positioning is relatively fresh and actionable.")
        if status['days_to_next']:
            print(f"\n  Next filing ({status['next_quarter']}): "
                  f"{status['next_date']} ({status['days_to_next']} days)")
    else:
        print(f"\n  Last filing: {status['current_quarter']} "
              f"({status['days_since']} days ago)")
        print(f"     Data reflects positions as of: {status['data_from']}")
        print(f"\n  ⚠️  Superinvestor positions are stale.")
        print(f"     Significant market moves since filing date mean")
        print(f"     actual current positioning is likely very different.")
        print(f"\n  📍 What to focus on instead:")
        print(f"     → Macro regime signals (FRED data — always current)")
        print(f"     → Geopolitical risk monitor (refreshes every 6h)")
        print(f"     → Asset performance tracker (live prices)")
        print(f"     → Transition watch (early warning system)")
        if status['days_to_next']:
            print(f"\n  ⏳ Next filing ({status['next_quarter']}): "
                  f"{status['next_date']} ({status['days_to_next']} days away)")
            if status['days_to_next'] <= 14:
                print(f"     🔔 FILING IMMINENT — prepare to run full analysis soon")
                print(f"        When available, clear cache:")
                print(f"        rm ~/finance-projects/macro/.macro_cache/sector_*.json")

def run(mode="global"):
    import os
    os.chdir("/home/lucas_r0drigues9/finance-projects")
    sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects")
    sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")

    print("\n📡 Fetching macro regime...")
    from macro.fred import get_all
    from macro.quadrant import get_quadrant
    from macro.transition import assess_transitions
    us_data  = get_all()
    result   = get_quadrant(us_data)
    quadrant = result["quadrant"]["name"]
    emoji    = result["quadrant"]["emoji"]
    g        = result["growth"]
    i        = result["inflation"]

    print(f"📡 Fetching superinvestor rankings ({mode})...")
    from investors import get_all_holdings as get_us
    from ranking import rank_stocks

    if mode == "us":
        all_holdings = get_us()
    elif mode == "nordic":
        from investors_nordic import get_all_holdings as get_nordic
        all_holdings = get_nordic()
    elif mode == "asia":
        from investors_asia import get_all_holdings as get_asia
        all_holdings = get_asia()
    elif mode == "uk":
        from investors_uk import get_all_holdings as get_uk
        all_holdings = get_uk()
    else:
        from investors_nordic import get_all_holdings as get_nordic
        from investors_asia import get_all_holdings as get_asia
        from investors_uk import get_all_holdings as get_uk
        all_holdings = get_us() + get_nordic() + get_asia() + get_uk()

    ranked, _  = rank_stocks(all_holdings)
    min_score  = 3.0 if mode == "us" else 4.0
    top_n      = 25  if mode == "us" else 50
    ranked     = [r for r in ranked if r.get("investor_score", r.get("score", 0)) >= min_score]
    rankings   = ranked[:top_n]

    # Data freshness warning
    print("\n📊 Checking 13F data freshness...")
    freshness = get_freshness_assessment()
    print_freshness_warning(freshness)

    print_alignment(rankings, quadrant, emoji)

    # Get transition data for action plan (no geo output here)
    from macro.transition import assess_transitions as _at
    _trans = _at(g, i)

    print_filing_status()
    trans_result             = assess_transitions(g, i)
    aligned, neutral, diverg = analyse_alignment(rankings, quadrant)
    print_action_plan(quadrant, trans_result, len(diverg), len(aligned))


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "global"
    run(mode)
