import re
import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
import warnings
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

INVESTORS = [
    {"name": "Warren Buffett",  "cik": "0001067983", "weight": 1.5},
    {"name": "Bill Ackman",     "cik": "0001336528", "weight": 1.2},
    {"name": "Michael Burry",   "cik": "0001649339", "weight": 1.2},
    {"name": "Mohnish Pabrai",  "cik": "0001173334", "weight": 1.0},
    {"name": "David Tepper",    "cik": "0001006438", "weight": 1.2},
    {"name": "George Soros",    "cik": "0001029160", "weight": 1.1},
]

HEADERS = {"User-Agent": "superinvestor-tracker contact@example.com"}

ACTION_MULTIPLIERS = {
    "new":      2.0,
    "adding":   1.5,
    "holding":  1.0,
    "trimming": 0.3,
}


def normalise(name: str) -> str:
    suffixes = [
        " INCORPORATED", " CORPORATION", " COMPANY",
        " INC", " CORP", " CO", " LTD", " PLC", " N V", " LLC",
        " NEW", " DEL", " MTN BE", " HLDG", " HLDGS", " HOLDG",
        " COS", " SHS", " ORD", " ADR", " P L C", " GROUP",
        " INTL", " INTERNATIONAL", " HOLDINGS", " HOLDING",
    ]
    name = name.upper().strip()
    changed = True
    while changed:
        changed = False
        for suffix in suffixes:
            if name.endswith(suffix):
                name = name[:-len(suffix)].strip()
                changed = True

    abbreviations = {
        r"\bAMER\b":  "AMERICA",
        r"\bBK\b":    "BANK",
        r"\bFINL\b":  "FINANCIAL",
        r"\bFIN\b":   "FINANCIAL",
        r"\bTECH\b":  "TECHNOLOGY",
        r"\bSYS\b":   "SYSTEMS",
        r"\bMGMT\b":  "MANAGEMENT",
        r"\bHLTH\b":  "HEALTH",
        r"\bGRP\b":   "GROUP",
        r"\bINTL\b":  "INTERNATIONAL",
    }
    for pattern, replacement in abbreviations.items():
        name = re.sub(pattern, replacement, name)

    return name.strip()


def portfolio_weight_multiplier(pct: float) -> float:
    if pct >= 20:   return 3.0
    elif pct >= 10: return 2.5
    elif pct >= 5:  return 2.0
    elif pct >= 2:  return 1.5
    elif pct >= 1:  return 1.2
    else:           return 1.0


def get_accessions(cik: str) -> list[str]:
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"  ⚠️  SEC API error for CIK {cik}: {e}")
        return []

    filings    = r.json().get("filings", {}).get("recent", {})
    forms      = filings.get("form", [])
    accessions = filings.get("accessionNumber", [])

    results = []
    for form, accession in zip(forms, accessions):
        if form == "13F-HR":
            results.append(accession.replace("-", ""))
        if len(results) == 2:
            break

    return results


def find_infotable_url(cik: str, accession: str) -> str | None:
    cik_int   = int(cik)
    index_url = f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{accession}/index.json"

    try:
        r = requests.get(index_url, headers=HEADERS, timeout=10)
        r.raise_for_status()
        items = r.json().get("directory", {}).get("item", [])
        for item in items:
            name = item.get("name", "").lower()
            if name.endswith(".xml") and name != "primary_doc.xml":
                return f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{accession}/{item['name']}"
    except Exception as e:
        print(f"  ⚠️  Index error: {e}")

    return None


def parse_holdings(cik: str, accession: str) -> tuple[dict, float]:
    """
    Returns (percentages_dict, total_portfolio_value_in_thousands)
    """
    url = find_infotable_url(cik, accession)
    if not url:
        return {}, 0.0

    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        r.raise_for_status()
    except requests.RequestException:
        return {}, 0.0

    soup   = BeautifulSoup(r.text, "html.parser")
    values = {}

    # Read the multiplier from the first entry to determine value units
    # SEC 13F multiplier: 1=dollars, 1000=thousands, 1000000=millions
    value_multiplier = None

    for table in soup.find_all("infotable"):
        name_tag  = table.find("nameofissuer")
        value_tag = table.find("value")
        mult_tag  = table.find("multiplier")

        if value_multiplier is None and mult_tag:
            try:
                value_multiplier = float(mult_tag.get_text(strip=True).replace(",", ""))
            except ValueError:
                pass

        if not name_tag or not value_tag:
            continue
        name = name_tag.get_text(strip=True)
        if not name or name.upper() in ("NA", "N/A", "NONE", ""):
            continue
        try:
            value = float(value_tag.get_text(strip=True).replace(",", ""))
        except ValueError:
            continue
        key = normalise(name)
        values[key] = values.get(key, 0) + value

    if not values:
        return {}, 0.0

    total = sum(values.values())
    if total == 0:
        return {}, 0.0

    # Convert total to USD thousands for consistency with fmt_portfolio
    # multiplier=1000 → values already in thousands → use as-is
    # multiplier=1 or None → values in dollars → divide by 1000
    # multiplier=1000000 → values in millions → multiply by 1000
    if value_multiplier == 1000:
        total_thousands = total           # already in thousands
    elif value_multiplier == 1_000_000:
        total_thousands = total * 1000    # millions → thousands
    else:
        # Default: assume dollars if multiplier missing or = 1
        # But use heuristic: large totals (>1T) are likely dollars
        if total > 1_000_000_000:
            total_thousands = total / 1000
        else:
            total_thousands = total

    pcts = {name: round((val / total) * 100, 6) for name, val in values.items()}
    return pcts, total_thousands


def get_action(company: str, current: dict, previous: dict) -> str:
    if company in current and company not in previous:
        return "new"
    elif company in current and company in previous:
        prev_pct = previous[company]
        curr_pct = current[company]
        if curr_pct > prev_pct + 0.5:
            return "adding"
        elif curr_pct < prev_pct - 0.5:
            return "trimming"
        else:
            return "holding"
    else:
        return "sell"


def fetch_holdings(investor: dict) -> tuple[list[dict], float]:
    """
    Returns (holdings_list, total_portfolio_value_in_thousands)
    """
    accessions = get_accessions(investor["cik"])

    if not accessions:
        print(f"  ⚠️  No filings found for {investor['name']}")
        return [], 0.0

    current_holdings, total_value = parse_holdings(investor["cik"], accessions[0])
    previous_holdings, _          = parse_holdings(investor["cik"], accessions[1]) if len(accessions) >= 2 else ({}, 0.0)

    holdings = []
    for company, pct in current_holdings.items():
        action   = get_action(company, current_holdings, previous_holdings)
        prev_pct = previous_holdings.get(company, 0.0)
        delta    = round(pct - prev_pct, 2)
        holdings.append({
            "ticker":   company,
            "action":   action,
            "pct":      pct,
            "prev_pct": prev_pct,
            "delta":    delta,
        })

    for company in (set(previous_holdings) - set(current_holdings)):
        holdings.append({
            "ticker":   company,
            "action":   "sell",
            "pct":      0.0,
            "prev_pct": previous_holdings[company],
            "delta":    -previous_holdings[company],
        })

    return holdings, total_value


def get_all_holdings() -> list[dict]:
    all_holdings = []

    for investor in INVESTORS:
        print(f"  Fetching {investor['name']}...")
        holdings, total_value = fetch_holdings(investor)

        for holding in holdings:
            action     = holding["action"]
            pct        = holding["pct"]
            multiplier = ACTION_MULTIPLIERS.get(action, 0)
            pw_mult    = portfolio_weight_multiplier(pct) if action != "sell" else 0
            score      = round(investor["weight"] * multiplier * pw_mult, 2)

            all_holdings.append({
                "ticker":          holding["ticker"],
                "investor_name":   investor["name"],
                "weight":          investor["weight"],
                "action":          action,
                "pct":             pct,
                "prev_pct":        holding["prev_pct"],
                "delta":           holding["delta"],
                "score":           score,
                "region":          "US",
                "portfolio_total": total_value,
            })

        sells    = sum(1 for h in holdings if h["action"] == "sell")
        adding   = sum(1 for h in holdings if h["action"] == "adding")
        trimming = sum(1 for h in holdings if h["action"] == "trimming")
        print(f"  ✅  {investor['name']}: {len(holdings) - sells} holdings — "
              f"{sum(1 for h in holdings if h['action'] == 'new')} new, "
              f"{adding} adding, "
              f"{sum(1 for h in holdings if h['action'] == 'holding')} holding, "
              f"{trimming} trimming, "
              f"{sells} sold")

    return all_holdings
