"""
Universe Builder
Combines S&P 500 + all tickers ever held by our investors into a single
deduplicated screening universe.
"""

import json
import time
import requests
from bs4 import BeautifulSoup

CACHE_FILE = "universe_cache.json"


def get_sp500_tickers() -> list[str]:
    """Scrape S&P 500 constituents from Wikipedia."""
    try:
        r = requests.get(
            "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
            headers={"User-Agent": "superinvestor-tracker contact@example.com"},
            timeout=30
        )
        soup   = BeautifulSoup(r.text, "html.parser")
        table  = soup.find("table", {"id": "constituents"})
        tickers = []
        for row in table.find_all("tr")[1:]:
            cells = row.find_all("td")
            if cells:
                ticker = cells[0].get_text(strip=True).replace(".", "-")
                tickers.append(ticker)
        print(f"  ✅  S&P 500: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"  ⚠️  S&P 500 fetch failed: {e}")
        return []


def get_investor_tickers() -> list[str]:
    """
    Pull all unique tickers from the current investor holdings
    by importing all investor modules and reading their INVESTORS lists,
    then fetching one quarter of 13F data per fund.
    """
    from prices import lookup_ticker

    # Import all investor modules
    from investors import INVESTORS as us_investors
    from investors_nordic import INVESTORS as nordic_investors
    from investors_asia import INVESTORS as asia_investors
    from investors_uk import INVESTORS as uk_investors

    all_investors = us_investors + nordic_investors + asia_investors + uk_investors

    headers    = {"User-Agent": "superinvestor-tracker contact@example.com"}
    tickers    = set()
    name_cache = {}

    for investor in all_investors:
        try:
            # Get most recent accession
            url = f"https://data.sec.gov/submissions/CIK{investor['cik']}.json"
            r   = requests.get(url, headers=headers, timeout=30)
            r.raise_for_status()

            filings    = r.json().get("filings", {}).get("recent", {})
            forms      = filings.get("form", [])
            accessions = filings.get("accessionNumber", [])

            accession = None
            for form, acc in zip(forms, accessions):
                if form in ("13F-HR", "13F-HR/A"):
                    accession = acc.replace("-", "")
                    break

            if not accession:
                continue

            cik_int   = int(investor["cik"])
            index_url = f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{accession}/index.json"
            r2        = requests.get(index_url, headers=headers, timeout=30)
            r2.raise_for_status()
            items     = r2.json().get("directory", {}).get("item", [])

            xml_url = None
            for item in items:
                name = item.get("name", "").lower()
                if name.endswith(".xml") and name != "primary_doc.xml":
                    xml_url = f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{accession}/{item['name']}"
                    break

            if not xml_url:
                continue

            r3   = requests.get(xml_url, headers=headers, timeout=120)
            soup = BeautifulSoup(r3.text, "html.parser")

            for table in soup.find_all("infotable"):
                name_tag   = table.find("nameofissuer")
                cusip_tag  = table.find("cusip")
                if name_tag:
                    name_cache[name_tag.get_text(strip=True)] = True

            time.sleep(0.3)

        except Exception as e:
            print(f"  ⚠️  {investor['name']}: {e}")
            continue

    # Resolve company names to tickers via prices module
    print(f"  🔍  Resolving {len(name_cache)} company names to tickers...")
    resolved = 0
    for name in name_cache:
        ticker = lookup_ticker(name)
        if ticker and ticker not in ("?", "ACQUIRED"):
            tickers.add(ticker)
            resolved += 1

    print(f"  ✅  Investor holdings: {resolved} tickers resolved")
    return list(tickers)


def build_universe(force_refresh: bool = False) -> list[str]:
    """
    Returns the full screening universe — S&P 500 + investor holdings.
    Cached for 7 days since it changes slowly.
    """
    import os
    from datetime import datetime, timedelta

    if not force_refresh and os.path.exists(CACHE_FILE):
        with open(CACHE_FILE) as f:
            data = json.load(f)
        age = datetime.now() - datetime.fromisoformat(data["saved_at"])
        if age < timedelta(days=7):
            tickers = data["tickers"]
            print(f"  📦  Universe: {len(tickers)} tickers (cached)")
            return tickers

    print("  🌍  Building screening universe...")
    sp500    = get_sp500_tickers()
    investor = get_investor_tickers()

    universe = list(set(sp500 + investor))
    universe.sort()

    with open(CACHE_FILE, "w") as f:
        json.dump({"saved_at": datetime.now().isoformat(), "tickers": universe}, f)

    print(f"  ✅  Universe: {len(universe)} unique tickers")
    return universe
