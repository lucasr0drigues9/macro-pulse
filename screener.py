"""
Fundamental Screener
Runs the fundamentals engine across the full universe,
ranks by F.Score, overlays investor signals as context.
"""

import json
import time
import os
from datetime import datetime, timedelta
from fundamentals import get_fundamentals

SCREENER_CACHE = "screener_cache.json"
CACHE_TTL_DAYS = 1  # refresh daily


def load_screener_cache() -> dict:
    if not os.path.exists(SCREENER_CACHE):
        return {}
    with open(SCREENER_CACHE) as f:
        return json.load(f)

def save_screener_cache(data: dict):
    with open(SCREENER_CACHE, "w") as f:
        json.dump(data, f, indent=2)


def fundamentals_score(fund: dict) -> float | None:
    """Pure fundamentals score 0-9."""
    if not fund or "error" in fund:
        return None
    green = fund.get("green_count", 0)
    red   = fund.get("red_count", 0)
    return round(max(0.0, green * 1.5 - red * 1.0), 2)


def run_screener(
    universe:        list[str],
    investor_map:    dict[str, list[dict]],  # ticker -> list of {investor, action, pct, region, portfolio_total}
    top_n:           int = 30,
    min_score:       float = 4.5,
) -> list[dict]:
    """
    Screens the full universe by fundamentals.
    investor_map provides context — which investors hold each stock and how.
    Returns top_n stocks ranked by F.Score.
    """
    cache   = load_screener_cache()
    results = []
    total   = len(universe)

    print(f"\n  🔬  Screening {total} stocks...")
    print(f"  ⏳  This takes ~{total // 3} seconds on first run (cached after)\n")

    for i, ticker in enumerate(universe, 1):
        # Progress every 50 stocks
        if i % 50 == 0:
            pct = (i / total) * 100
            found = sum(1 for r in results if r["fscore"] is not None and r["fscore"] >= min_score)
            print(f"  [{i}/{total}] {pct:.0f}% complete — {found} qualifying stocks so far...")

        # Check cache
        if ticker in cache:
            entry = cache[ticker]
            age   = datetime.now() - datetime.fromisoformat(entry["saved_at"])
            if age < timedelta(days=CACHE_TTL_DAYS):
                fund   = entry["fundamentals"]
                fscore = fundamentals_score(fund)
                results.append({
                    "ticker":    ticker,
                    "fscore":    fscore,
                    "fund":      fund,
                    "investors": investor_map.get(ticker, []),
                })
                continue

        # Fetch fresh
        fund   = get_fundamentals(ticker)
        fscore = fundamentals_score(fund)

        # Cache it
        cache[ticker] = {
            "saved_at":    datetime.now().isoformat(),
            "fundamentals": fund,
        }

        # Save cache every 25 stocks to avoid losing progress
        if i % 25 == 0:
            save_screener_cache(cache)

        results.append({
            "ticker":    ticker,
            "fscore":    fscore,
            "fund":      fund,
            "investors": investor_map.get(ticker, []),
        })

        time.sleep(0.4)  # rate limit

    save_screener_cache(cache)

    # Filter and rank
    scored = [r for r in results if r["fscore"] is not None and r["fscore"] >= min_score]
    scored.sort(key=lambda x: (
        x["fscore"],
        len(x["investors"]),  # tiebreaker: more investors = higher
    ), reverse=True)

    return scored[:top_n]


def build_investor_map(all_holdings: list[dict]) -> dict[str, list[dict]]:
    """
    Build a ticker -> investors lookup from the holdings data.
    Uses the normalised company name as key — resolved via prices module.
    """
    from prices import lookup_ticker

    investor_map = {}
    for h in all_holdings:
        if h.get("action") == "sell":
            continue
        ticker = lookup_ticker(h["ticker"])
        if not ticker or ticker in ("?", "ACQUIRED"):
            continue
        if ticker not in investor_map:
            investor_map[ticker] = []
        investor_map[ticker].append({
            "investor":        h["investor_name"],
            "action":          h["action"],
            "pct":             h.get("pct", 0.0),
            "region":          h.get("region", ""),
            "portfolio_total": h.get("portfolio_total", 0),
            "weight":          h.get("weight", 1.0),
        })

    return investor_map
