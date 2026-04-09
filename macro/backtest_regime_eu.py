"""
European regime timeline builder — same approach as US backtest_regime.py
but using Eurostat data.
"""
import os
import json
import requests
from datetime import datetime, timedelta

from eu_quadrant import get_eu_quadrant
from quadrant import QUADRANTS
import eurostat

CACHE_DIR = ".macro_cache"
BACKTEST_START = "2005-01-01"

# ETF baskets per regime — European UCITS ETFs accessible on Nordnet
# Must match the EU_REGIME_PICKS in the frontend europe/page.tsx
REGIME_ETFS_EU = {
    "Stagflation": ["IOGP.L", "SGLD.L", "EXH1.DE"],
    "Reflation":   ["EXV5.DE", "EXV8.DE", "EXSA.DE"],
    "Goldilocks":  ["EXSA.DE", "IUIT.L", "EXH9.DE"],
    "Deflation":   ["SGLD.L", "IBGL.L", "EXH4.DE"],
}

# All unique EU tickers we need price data for
ALL_EU_TICKERS = list(set(t for picks in REGIME_ETFS_EU.values() for t in picks))


def fetch_eu_etf_monthly(ticker, start="2010-01-01"):
    """Fetch monthly close prices for an EU ETF, cached for 7 days.
    Uses direct Yahoo query2 API with user-agent (bypasses yfinance quirks)."""
    cache_file = f"{CACHE_DIR}/backtest_etf_{ticker}.json"
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(days=7):
            return json.load(open(cache_file))

    print(f"  Fetching {ticker}...")
    try:
        url = f"https://query2.finance.yahoo.com/v8/finance/chart/{ticker}"
        params = {"range": "max", "interval": "1mo"}
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, params=params, headers=headers, timeout=30)
        data = r.json()
        result = data.get("chart", {}).get("result", [])
        if not result:
            return {}
        timestamps = result[0].get("timestamp", [])
        quote = result[0].get("indicators", {}).get("quote", [{}])[0]
        closes = quote.get("close", [])
        prices = {}
        for ts, close in zip(timestamps, closes):
            if close is None:
                continue
            d = datetime.fromtimestamp(ts)
            key = d.strftime("%Y-%m-01")
            if key >= start:
                prices[key] = round(float(close), 2)
        with open(cache_file, "w") as f:
            json.dump(prices, f)
        return prices
    except Exception as e:
        print(f"  Failed {ticker}: {e}")
        return {}


def load_all_eu_prices():
    """Load price data for all EU regime tickers (fetches if missing)."""
    prices = {}
    for ticker in ALL_EU_TICKERS:
        prices[ticker] = fetch_eu_etf_monthly(ticker)
    return prices


def build_eu_regime_timeline():
    """Build monthly regime classification for EU from 2005 to present using Eurostat."""
    # Fetch all series
    raw = {}
    for name in eurostat.SERIES:
        raw[name] = eurostat.fetch_series(name)

    # Convert to ascending sorted lists
    data_asc = {k: sorted(v, key=lambda x: x[0]) for k, v in raw.items()}

    # Get all monthly reference dates from HICP (most reliable monthly series)
    if "hicp" not in data_asc or not data_asc["hicp"]:
        return []

    all_dates = sorted(set(d for d, _ in data_asc["hicp"]))
    ref_dates = [d for d in all_dates if d >= BACKTEST_START]

    timeline = []
    for date in ref_dates:
        # Slice each series up to this date, descending (as quadrant functions expect)
        snapshot = {}
        for key, vals in data_asc.items():
            up_to = [(d, v) for d, v in vals if d <= date]
            snapshot[key] = list(reversed(up_to))

        # Need enough data to calculate momentum
        if len(snapshot.get("hicp", [])) < 13 or len(snapshot.get("gdp", [])) < 5:
            continue

        try:
            result = get_eu_quadrant(snapshot)
            regime = result["quadrant"]["name"]
            timeline.append({"date": date, "regime_raw": regime})
        except Exception:
            continue

    # Apply regime smoothing — require 2 consecutive months before flipping
    if len(timeline) < 2:
        for t in timeline:
            t["regime"] = t["regime_raw"]
        return timeline

    timeline[0]["regime"] = timeline[0]["regime_raw"]
    confirmed = timeline[0]["regime_raw"]
    pending = None
    pending_start = 0

    for i in range(1, len(timeline)):
        raw = timeline[i]["regime_raw"]
        if raw == confirmed:
            pending = None
            timeline[i]["regime"] = confirmed
        elif raw == pending:
            # Confirmed — backfill
            confirmed = pending
            for j in range(pending_start, i + 1):
                timeline[j]["regime"] = confirmed
            pending = None
        else:
            pending = raw
            pending_start = i
            timeline[i]["regime"] = confirmed

    return timeline


def identify_eu_periods(timeline):
    """Group contiguous months with the same regime into periods."""
    if not timeline:
        return []

    periods = []
    current = {"regime": timeline[0]["regime"], "start": timeline[0]["date"], "end": timeline[0]["date"]}

    for t in timeline[1:]:
        if t["regime"] == current["regime"]:
            current["end"] = t["date"]
        else:
            periods.append(current)
            current = {"regime": t["regime"], "start": t["date"], "end": t["date"]}
    periods.append(current)

    # Merge single-month periods into previous (noise removal)
    merged = []
    for p in periods:
        if not merged:
            merged.append(p)
            continue
        start_dt = datetime.strptime(p["start"], "%Y-%m-%d")
        end_dt = datetime.strptime(p["end"], "%Y-%m-%d")
        months = (end_dt.year - start_dt.year) * 12 + end_dt.month - start_dt.month + 1
        if months <= 1 and len(merged) > 0:
            # Extend previous period through this month
            merged[-1]["end"] = p["end"]
        else:
            merged.append(p)

    return merged


if __name__ == "__main__":
    import contextlib, io
    print("Building EU regime timeline...")
    with contextlib.redirect_stdout(io.StringIO()):
        timeline = build_eu_regime_timeline()
    print(f"Monthly entries: {len(timeline)}")

    periods = identify_eu_periods(timeline)
    print(f"\nRegime periods: {len(periods)}")
    for p in periods[-10:]:
        start_dt = datetime.strptime(p["start"], "%Y-%m-%d")
        end_dt = datetime.strptime(p["end"], "%Y-%m-%d")
        months = (end_dt.year - start_dt.year) * 12 + end_dt.month - start_dt.month + 1
        print(f"  {p['start'][:7]} → {p['end'][:7]}  {p['regime']:12s} ({months}mo)")
