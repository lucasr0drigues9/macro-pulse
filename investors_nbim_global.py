"""
NBIM Global Holdings Module
Fetches NBIM's complete global equity portfolio directly from nbim.no API.
This covers ALL global holdings — not just the US 13F slice.
~9,000+ companies across every market in the world.
"""

import os
import io
import json
import requests
from datetime import datetime, date
from collections import defaultdict

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

HEADERS = {"User-Agent": "superinvestor-tracker contact@example.com"}

CACHE_DIR  = "."
EXCEL_CACHE = ".nbim_global_holdings.json"
CACHE_TTL_DAYS = 90  # Quarterly data — cache for 90 days

ACTION_MULTIPLIERS = {
    "new":      2.0,
    "adding":   1.5,
    "holding":  1.0,
    "trimming": 0.3,
}

WEIGHT = 2.0  # NBIM's investor weight


def get_latest_period_date() -> str:
    """
    NBIM publishes holdings twice a year:
    - Annual (Dec 31) — published ~February
    - Half-year (Jun 30) — published ~August
    Returns the most recent available period.
    """
    today = date.today()
    if today.month >= 8:
        # Half-year report out — use June 30
        return f"{today.year}-06-30"
    elif today.month >= 2:
        # Annual report out — use December 31 of previous year
        return f"{today.year - 1}-12-31"
    else:
        # Before Feb — use June 30 of previous year
        return f"{today.year - 1}-06-30"


def get_prev_period_date(period_date: str) -> str:
    """Returns the previous semi-annual period date."""
    d = datetime.strptime(period_date, "%Y-%m-%d").date()
    if d.month == 12:
        return f"{d.year}-06-30"
    else:
        return f"{d.year - 1}-12-31"


def load_cache() -> dict:
    try:
        with open(EXCEL_CACHE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_cache(data: dict):
    with open(EXCEL_CACHE, "w") as f:
        json.dump(data, f)


def fetch_holdings_for_date(quarter_date: str) -> dict[str, float]:
    """
    Fetches NBIM's full global equity holdings for a given quarter date.
    Returns {company_name: portfolio_percentage}
    """
    cache = load_cache()
    if quarter_date in cache:
        return cache[quarter_date]

    url = f"https://www.nbim.no/api/investments/v2/report/?assetType=eq&date={quarter_date}&fileType=xlsx"
    print(f"    ⬇️  Fetching NBIM global holdings for {quarter_date}...")

    try:
        r = requests.get(url, headers=HEADERS, timeout=60)
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"    ⚠️  Failed to fetch NBIM holdings: {e}")
        return {}

    if not HAS_OPENPYXL:
        print("    ⚠️  openpyxl not installed. Run: pip install openpyxl --break-system-packages")
        return {}

    try:
        wb     = openpyxl.load_workbook(io.BytesIO(r.content))
        ws     = wb.active
        rows   = list(ws.iter_rows(values_only=True))
        header = [str(c).strip().lower() if c else "" for c in rows[0]]

        # Find column indices
        name_col    = next((i for i, h in enumerate(header) if "name" in h or "company" in h or "issuer" in h), 0)
        value_col   = next((i for i, h in enumerate(header) if "value" in h or "market" in h), None)
        pct_col     = next((i for i, h in enumerate(header) if "%" in h or "percent" in h or "weight" in h), None)
        country_col = next((i for i, h in enumerate(header) if "country" in h), None)
        sector_col  = next((i for i, h in enumerate(header) if "sector" in h or "industry" in h), None)

        holdings = {}
        total_value = 0.0

        for row in rows[1:]:
            if not row or not row[name_col]:
                continue
            name = str(row[name_col]).strip().upper()
            if not name or name in ("NAME", "COMPANY", "ISSUER"):
                continue

            # Get value
            val = 0.0
            if value_col is not None and row[value_col]:
                try:
                    val = float(str(row[value_col]).replace(",", "").replace(" ", ""))
                except ValueError:
                    pass

            # Get percentage directly if available
            if pct_col is not None and row[pct_col]:
                try:
                    pct = float(str(row[pct_col]).replace("%", "").replace(",", "").strip())
                    holdings[name] = {
                        "pct":     round(pct, 6),
                        "country": str(row[country_col]).strip() if country_col and row[country_col] else "",
                        "sector":  str(row[sector_col]).strip() if sector_col and row[sector_col] else "",
                    }
                    continue
                except ValueError:
                    pass

            if val > 0:
                total_value += val
                holdings[name] = {
                    "pct":     0.0,  # Will calculate after
                    "value":   val,
                    "country": str(row[country_col]).strip() if country_col and row[country_col] else "",
                    "sector":  str(row[sector_col]).strip() if sector_col and row[sector_col] else "",
                }

        # Calculate percentages from values if not directly available
        if total_value > 0:
            for name, data in holdings.items():
                if data.get("pct", 0) == 0 and "value" in data:
                    data["pct"] = round((data["value"] / total_value) * 100, 6)

        print(f"    ✅  Loaded {len(holdings)} global holdings")
        cache[quarter_date] = holdings
        save_cache(cache)
        return holdings

    except Exception as e:
        print(f"    ⚠️  Failed to parse Excel: {e}")
        return {}


def get_action(company: str, current: dict, previous: dict) -> str:
    if company in current and company not in previous:
        return "new"
    elif company in current and company in previous:
        curr_pct = current[company]["pct"]
        prev_pct = previous[company]["pct"]
        if curr_pct > prev_pct + 0.01:
            return "adding"
        elif curr_pct < prev_pct - 0.01:
            return "trimming"
        else:
            return "holding"
    else:
        return "sell"


def get_all_holdings() -> list[dict]:
    """
    Returns NBIM's full global holdings with buy/sell/add/trim signals.
    """
    print(f"  Fetching Norges Bank (Oil Fund) — GLOBAL portfolio...")

    current_date  = get_latest_period_date()
    previous_date = get_prev_period_date(current_date)

    current  = fetch_holdings_for_date(current_date)
    previous = fetch_holdings_for_date(previous_date)

    if not current:
        return []

    all_holdings = []
    # NBIM Excel reports values in NOK (not thousands, not millions — actual NOK)
    # Divide by 10.5 to get USD, then by 1000 to get USD thousands (consistent with other investors)
    NOK_TO_USD = 10.5
    total_value_nok = sum(d.get("value", 0) for d in current.values() if isinstance(d, dict))
    # Store in USD thousands (consistent with SEC investor files)
    # NOK values are in actual NOK → divide by 10.5 for USD → divide by 1000 for USD thousands
    total_value_thousands = total_value_nok / NOK_TO_USD / 1_000

    for company, data in current.items():
        pct = data["pct"]
        # Skip positions too tiny to be meaningful signals
        # For NBIM's $1.9T fund, 0.001% = ~$19M — still a real position
        if pct < 0.05 and data.get("action", "") != "sell":
            prev_pct_check = previous.get(company, {}).get("pct", 0.0)
            if prev_pct_check < 0.05:
                continue

        action   = get_action(company, current, previous)
        prev_pct = previous.get(company, {}).get("pct", 0.0)
        delta    = round(pct - prev_pct, 6)

        multiplier = ACTION_MULTIPLIERS.get(action, 0)
        pw_mult    = portfolio_weight_multiplier(pct) if action != "sell" else 0
        score      = round(WEIGHT * multiplier * pw_mult, 2)

        all_holdings.append({
            "ticker":          company,
            "investor_name":   "Norges Bank (Oil Fund)",
            "weight":          WEIGHT,
            "action":          action,
            "pct":             pct,
            "prev_pct":        prev_pct,
            "delta":           delta,
            "score":           score,
            "region":          "Nordic",
            "portfolio_total": total_value_thousands,
            "country":         data.get("country", ""),
            "sector":          data.get("sector", ""),
        })

    # Add sells
    for company, data in previous.items():
        if company not in current:
            all_holdings.append({
                "ticker":          company,
                "investor_name":   "Norges Bank (Oil Fund)",
                "weight":          WEIGHT,
                "action":          "sell",
                "pct":             0.0,
                "prev_pct":        data["pct"],
                "delta":           -data["pct"],
                "score":           0.0,
                "region":          "Nordic",
                "portfolio_total": total_value_thousands,
                "country":         data.get("country", ""),
                "sector":          data.get("sector", ""),
            })

    sells    = sum(1 for h in all_holdings if h["action"] == "sell")
    new      = sum(1 for h in all_holdings if h["action"] == "new")
    adding   = sum(1 for h in all_holdings if h["action"] == "adding")
    holding  = sum(1 for h in all_holdings if h["action"] == "holding")
    trimming = sum(1 for h in all_holdings if h["action"] == "trimming")

    print(f"  ✅  Norges Bank (Oil Fund): {len(all_holdings) - sells} holdings — "
          f"{new} new, {adding} adding, {holding} holding, {trimming} trimming, {sells} sold")

    return all_holdings


def portfolio_weight_multiplier(pct: float) -> float:
    if pct >= 20:   return 3.0
    elif pct >= 10: return 2.5
    elif pct >= 5:  return 2.0
    elif pct >= 2:  return 1.5
    elif pct >= 1:  return 1.2
    else:           return 1.0
