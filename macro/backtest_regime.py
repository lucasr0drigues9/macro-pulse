"""
Backtest: Macro Regime ETF Strategy
Computes real win rate and win/loss ratio for regime-aligned ETFs
by replaying the Dalio quadrant classification on historical FRED data
and measuring ETF performance vs SPY during each regime period.

Results feed into macro_kelly.py's Kelly criterion sizing.

Usage:
  cd ~/finance-projects/macro && python3 backtest_regime.py
"""
import os
import sys
import json
import requests
from datetime import datetime, timedelta

sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")
from quadrant import assess_growth, assess_inflation, QUADRANTS

FRED_KEY  = os.getenv("FRED_API_KEY")
CACHE_DIR = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache"
RESULTS_CACHE = f"{CACHE_DIR}/backtest_results.json"

# Same ETF baskets as macro_kelly.py REGIME_ETFS
REGIME_ETFS = {
    # Must match macro_kelly.py REGIME_ETFS (SPY excluded — it's the benchmark)
    "Stagflation": ["XLE", "GLD", "DBC", "XLP", "XLU"],
    "Reflation":   ["XLE", "XLI", "BRK-B"],  # SPY excluded
    "Goldilocks":  ["QQQ", "ARKW", "FTEC", "ARKQ"],  # SPY excluded
    "Deflation":   ["TLT", "GLD", "FTEC"],
}

# ETFs the framework says to AVOID per regime
REGIME_AVOIDS = {
    "Stagflation": ["QQQ", "TLT", "IWM"],
    "Reflation":   ["TLT", "GLD", "DBC"],
    "Goldilocks":  ["GLD", "DBC", "XLE"],
    "Deflation":   ["DBC", "XLE", "QQQ"],
}

# Superinvestor proxies
SUPERINVESTOR_PROXIES = {
    "BRK-B": "Berkshire Hathaway (Buffett)",
    "GURU":  "Global X Guru ETF (top 13F picks)",
}

# ETF inception dates — skip ETF if period starts before this
ETF_INCEPTION = {
    "XLE": "1998-12-01", "GLD": "2004-11-01", "DBC": "2006-02-01",
    "XLP": "1998-12-01", "TIP": "2003-12-01", "XLU": "1998-12-01",
    "QQQ": "1999-03-01", "VGK": "2005-03-01", "XLI": "1998-12-01",
    "IWM": "2000-05-01", "TLT": "2002-07-01", "SPY": "1993-01-01",
    "AGG": "2003-09-01", "BRK-B": "1996-05-01", "GURU": "2012-06-01",
}

BACKTEST_START = "2007-01-01"


def fetch_fred_full(series_id, start="2005-01-01"):
    """Fetch full FRED history for a series. Cached permanently."""
    cache_file = f"{CACHE_DIR}/backtest_{series_id}.json"
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(days=7):
            return json.load(open(cache_file))

    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id":         series_id,
        "api_key":           FRED_KEY,
        "file_type":         "json",
        "sort_order":        "desc",
        "limit":             1000,
        "observation_start": start,
    }
    print(f"  📡 Fetching {series_id} from FRED...")
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json().get("observations", [])
    json.dump(data, open(cache_file, "w"))
    return data


def fetch_etf_monthly(ticker, start="2006-01-01"):
    """Fetch monthly close prices for an ETF. Cached for 7 days."""
    cache_file = f"{CACHE_DIR}/backtest_etf_{ticker}.json"
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(days=7):
            return json.load(open(cache_file))

    import yfinance as yf
    print(f"  📡 Fetching {ticker} price history...")
    hist = yf.Ticker(ticker).history(start=start, interval="1mo")
    if hist.empty:
        return {}
    prices = {}
    for date, row in hist.iterrows():
        key = date.strftime("%Y-%m-01")
        prices[key] = round(row["Close"], 2)
    with open(cache_file, "w") as f:
        json.dump(prices, f)
    return prices


def build_regime_timeline():
    """Build monthly regime classification from 2007 to present using FRED data."""
    series_ids = {
        "gdp":          "GDPC1",
        "unemployment": "UNRATE",
        "cpi":          "CPIAUCSL",
        "pce":          "PCEPI",
        "ppi":          "PPIFIS",
        "retail_sales": "RSXFS",
    }

    # Fetch all series
    raw = {}
    for name, sid in series_ids.items():
        raw[name] = fetch_fred_full(sid)

    # Convert to ascending sorted lists
    def to_list(obs):
        vals = [(o["date"], float(o["value"]))
                for o in obs if o["value"] != "."]
        return sorted(vals, key=lambda x: x[0])

    data_asc = {k: to_list(v) for k, v in raw.items()}

    # Get all monthly reference dates from CPI (most complete monthly series)
    all_dates = sorted(set(d for d, _ in data_asc["cpi"]))
    ref_dates = [d for d in all_dates if d >= BACKTEST_START]

    timeline = []
    for date in ref_dates:
        # Slice each series up to this date, descending (as quadrant functions expect)
        snapshot = {}
        for key, vals in data_asc.items():
            up_to = [(d, v) for d, v in vals if d <= date]
            snapshot[key] = list(reversed(up_to))

        if len(snapshot["cpi"]) < 13 or len(snapshot["gdp"]) < 5:
            continue

        growth    = assess_growth(snapshot)
        inflation = assess_inflation(snapshot)
        qkey      = (growth["direction"], inflation["direction"])
        regime    = QUADRANTS[qkey]["name"]

        timeline.append({"date": date, "regime_raw": regime})

    # Apply regime smoothing — require 2 consecutive months before flipping
    # When confirmed, retroactively tag the pending months too
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
            # 2nd consecutive month of new regime — confirm and backfill
            confirmed = pending
            # Retroactively tag all pending months with the new regime
            for j in range(pending_start, i + 1):
                timeline[j]["regime"] = confirmed
            pending = None
        else:
            # New candidate — start tracking
            pending = raw
            pending_start = i
            timeline[i]["regime"] = confirmed

    return timeline


def identify_periods(timeline):
    """Group contiguous months with the same regime into periods.
    Then merge 1-month periods into the previous period (noise removal)."""
    if not timeline:
        return []

    periods = []
    current = {"regime": timeline[0]["regime"], "start": timeline[0]["date"]}

    for i in range(1, len(timeline)):
        if timeline[i]["regime"] != current["regime"]:
            current["end"] = timeline[i - 1]["date"]
            periods.append(current)
            current = {"regime": timeline[i]["regime"], "start": timeline[i]["date"]}

    current["end"] = timeline[-1]["date"]
    periods.append(current)

    # Merge 1-month periods into the previous period
    from datetime import datetime
    merged = []
    for p in periods:
        s = datetime.strptime(p["start"], "%Y-%m-%d")
        e = datetime.strptime(p["end"], "%Y-%m-%d")
        months = (e.year - s.year) * 12 + (e.month - s.month)
        if months < 2 and merged:
            # Absorb into previous period
            merged[-1]["end"] = p["end"]
        else:
            merged.append(dict(p))

    return merged


def compute_return(prices, start_date, end_date):
    """Compute return between two months from monthly price dict."""
    p_start = prices.get(start_date)
    p_end   = prices.get(end_date)
    if p_start and p_end and p_start > 0:
        return round((p_end - p_start) / p_start * 100, 2)
    return None


def compute_6040_return(prices, start_date, end_date):
    """Compute 60/40 portfolio return (60% SPY + 40% AGG)."""
    spy_ret = compute_return(prices.get("SPY", {}), start_date, end_date)
    agg_ret = compute_return(prices.get("AGG", {}), start_date, end_date)
    if spy_ret is not None and agg_ret is not None:
        return round(0.6 * spy_ret + 0.4 * agg_ret, 2)
    return spy_ret  # fallback to SPY if AGG not available


def compute_portfolio_return(prices, tickers, start_date, end_date):
    """Compute equal-weight portfolio return for a list of tickers."""
    rets = []
    for ticker in tickers:
        inception = ETF_INCEPTION.get(ticker, "1990-01-01")
        if start_date < inception:
            continue
        r = compute_return(prices.get(ticker, {}), start_date, end_date)
        if r is not None:
            rets.append(r)
    if rets:
        return round(sum(rets) / len(rets), 2)
    return None


def run_backtest():
    """Run the full backtest and compute win rate + win/loss ratio."""
    print(f"\n{'='*70}")
    print(f"  📊 REGIME ETF BACKTEST — {BACKTEST_START} to present")
    print(f"{'='*70}")

    # Step 1: Build regime timeline
    print(f"\n  Step 1: Building regime timeline from FRED data...")
    timeline = build_regime_timeline()
    print(f"  ✅ {len(timeline)} monthly regime classifications")

    # Step 2: Identify regime periods
    periods = identify_periods(timeline)
    print(f"  ✅ {len(periods)} regime periods identified")

    # Show regime distribution
    from collections import Counter
    regime_months = Counter(t["regime"] for t in timeline)
    print(f"\n  Regime distribution (months):")
    for regime, count in sorted(regime_months.items(), key=lambda x: -x[1]):
        pct = count / len(timeline) * 100
        print(f"    {regime:<14} {count:>3} months  ({pct:.0f}%)")

    # Step 3: Fetch ETF prices (picks + avoids + benchmarks)
    print(f"\n  Step 2: Fetching ETF price history...")
    all_tickers = set()
    for etfs in REGIME_ETFS.values():
        all_tickers.update(etfs)
    for etfs in REGIME_AVOIDS.values():
        all_tickers.update(etfs)
    all_tickers.update(["SPY", "AGG"])
    all_tickers.update(SUPERINVESTOR_PROXIES.keys())

    prices = {}
    for ticker in sorted(all_tickers):
        prices[ticker] = fetch_etf_monthly(ticker)

    # ═══════════════════════════════════════════════════════════════
    # ANALYSIS 1: Picks vs SPY (original backtest)
    # ═══════════════════════════════════════════════════════════════
    print(f"\n  Step 3: Computing returns...")
    observations = []

    for period in periods:
        regime = period["regime"]
        start  = period["start"]
        end    = period["end"]
        if start == end:
            continue

        spy_ret = compute_return(prices["SPY"], start, end)
        if spy_ret is None:
            continue

        etfs = REGIME_ETFS.get(regime, [])
        for ticker in etfs:
            inception = ETF_INCEPTION.get(ticker, "1990-01-01")
            if start < inception:
                continue
            etf_ret = compute_return(prices[ticker], start, end)
            if etf_ret is None:
                continue
            excess = round(etf_ret - spy_ret, 2)
            observations.append({
                "regime": regime, "ticker": ticker,
                "period": f"{start} → {end}",
                "etf_return": etf_ret, "spy_return": spy_ret,
                "excess": excess, "win": excess > 0,
            })

    wins   = [o for o in observations if o["win"]]
    losses = [o for o in observations if not o["win"]]
    total      = len(observations)
    win_count  = len(wins)
    win_rate   = win_count / total if total > 0 else 0
    avg_win    = sum(o["excess"] for o in wins) / len(wins) if wins else 0
    avg_loss   = sum(abs(o["excess"]) for o in losses) / len(losses) if losses else 1
    win_loss   = avg_win / avg_loss if avg_loss > 0 else 0
    q_k = 1 - win_rate
    kelly_full = (win_rate * win_loss - q_k) / win_loss if win_loss > 0 else 0
    kelly_half = max(0, kelly_full * 0.5)

    print(f"\n{'='*70}")
    print(f"  📈 ANALYSIS 1: REGIME PICKS vs SPY")
    print(f"  Question: Do our ETF picks beat just holding SPY?")
    print(f"{'='*70}")
    print(f"\n  Observations: {total}  |  Wins: {win_count}  |  Losses: {len(losses)}")
    print(f"  Win rate:     {win_rate:.1%}  |  W/L ratio: {win_loss:.2f}x")
    print(f"  Half Kelly:   {kelly_half*100:.1f}%")

    print(f"\n  {'Regime':<14} {'Obs':>5} {'Wins':>5} {'WinRate':>8} "
          f"{'AvgWin':>8} {'AvgLoss':>8} {'W/L':>6}")
    print(f"  {'─'*14} {'─'*5} {'─'*5} {'─'*8} {'─'*8} {'─'*8} {'─'*6}")
    for regime in ["Stagflation", "Reflation", "Goldilocks", "Deflation"]:
        r_obs = [o for o in observations if o["regime"] == regime]
        if not r_obs:
            continue
        r_wins   = [o for o in r_obs if o["win"]]
        r_losses = [o for o in r_obs if not o["win"]]
        r_wr     = len(r_wins) / len(r_obs)
        r_aw     = sum(o["excess"] for o in r_wins) / len(r_wins) if r_wins else 0
        r_al     = sum(abs(o["excess"]) for o in r_losses) / len(r_losses) if r_losses else 0
        r_wl     = r_aw / r_al if r_al > 0 else 0
        print(f"  {regime:<14} {len(r_obs):>5} {len(r_wins):>5} {r_wr:>7.0%} "
              f"{r_aw:>+7.1f}% {r_al:>7.1f}%  {r_wl:>5.2f}x")

    # Per-ETF breakdown
    print(f"\n  {'ETF':<6} {'Obs':>5} {'Wins':>5} {'WinRate':>8} {'AvgExcess':>10}")
    print(f"  {'─'*6} {'─'*5} {'─'*5} {'─'*8} {'─'*10}")
    etf_tickers = sorted(set(o["ticker"] for o in observations))
    for ticker in etf_tickers:
        t_obs  = [o for o in observations if o["ticker"] == ticker]
        t_wins = [o for o in t_obs if o["win"]]
        t_wr   = len(t_wins) / len(t_obs)
        t_avg  = sum(o["excess"] for o in t_obs) / len(t_obs)
        print(f"  {ticker:<6} {len(t_obs):>5} {len(t_wins):>5} {t_wr:>7.0%} "
              f"{t_avg:>+9.1f}%")

    # ═══════════════════════════════════════════════════════════════
    # ANALYSIS 2: Picks vs 60/40 Portfolio
    # ═══════════════════════════════════════════════════════════════
    obs_6040 = []
    for period in periods:
        regime = period["regime"]
        start  = period["start"]
        end    = period["end"]
        if start == end:
            continue

        bench_ret = compute_6040_return(prices, start, end)
        if bench_ret is None:
            continue

        etfs = REGIME_ETFS.get(regime, [])
        for ticker in etfs:
            inception = ETF_INCEPTION.get(ticker, "1990-01-01")
            if start < inception:
                continue
            etf_ret = compute_return(prices[ticker], start, end)
            if etf_ret is None:
                continue
            excess = round(etf_ret - bench_ret, 2)
            obs_6040.append({
                "regime": regime, "ticker": ticker,
                "etf_return": etf_ret, "bench_return": bench_ret,
                "excess": excess, "win": excess > 0,
            })

    wins_6040   = [o for o in obs_6040 if o["win"]]
    losses_6040 = [o for o in obs_6040 if not o["win"]]
    total_6040  = len(obs_6040)
    wr_6040     = len(wins_6040) / total_6040 if total_6040 > 0 else 0
    aw_6040     = sum(o["excess"] for o in wins_6040) / len(wins_6040) if wins_6040 else 0
    al_6040     = sum(abs(o["excess"]) for o in losses_6040) / len(losses_6040) if losses_6040 else 1
    wl_6040     = aw_6040 / al_6040 if al_6040 > 0 else 0
    q_6040      = 1 - wr_6040
    kf_6040     = (wr_6040 * wl_6040 - q_6040) / wl_6040 if wl_6040 > 0 else 0
    kh_6040     = max(0, kf_6040 * 0.5)

    print(f"\n{'='*70}")
    print(f"  📈 ANALYSIS 2: REGIME PICKS vs 60/40 PORTFOLIO (60% SPY + 40% AGG)")
    print(f"  Question: Do our picks beat a standard balanced portfolio?")
    print(f"{'='*70}")
    print(f"\n  Observations: {total_6040}  |  Wins: {len(wins_6040)}  |  Losses: {len(losses_6040)}")
    print(f"  Win rate:     {wr_6040:.1%}  |  W/L ratio: {wl_6040:.2f}x")
    print(f"  Half Kelly:   {kh_6040*100:.1f}%")

    print(f"\n  {'Regime':<14} {'Obs':>5} {'Wins':>5} {'WinRate':>8} "
          f"{'AvgWin':>8} {'AvgLoss':>8} {'W/L':>6}")
    print(f"  {'─'*14} {'─'*5} {'─'*5} {'─'*8} {'─'*8} {'─'*8} {'─'*6}")
    for regime in ["Stagflation", "Reflation", "Goldilocks", "Deflation"]:
        r_obs = [o for o in obs_6040 if o["regime"] == regime]
        if not r_obs:
            continue
        r_wins   = [o for o in r_obs if o["win"]]
        r_losses = [o for o in r_obs if not o["win"]]
        r_wr     = len(r_wins) / len(r_obs)
        r_aw     = sum(o["excess"] for o in r_wins) / len(r_wins) if r_wins else 0
        r_al     = sum(abs(o["excess"]) for o in r_losses) / len(r_losses) if r_losses else 0
        r_wl     = r_aw / r_al if r_al > 0 else 0
        print(f"  {regime:<14} {len(r_obs):>5} {len(r_wins):>5} {r_wr:>7.0%} "
              f"{r_aw:>+7.1f}% {r_al:>7.1f}%  {r_wl:>5.2f}x")

    # ═══════════════════════════════════════════════════════════════
    # ANALYSIS 3: Avoid Signal — do the "avoid" ETFs actually underperform?
    # ═══════════════════════════════════════════════════════════════
    avoid_obs = []
    for period in periods:
        regime = period["regime"]
        start  = period["start"]
        end    = period["end"]
        if start == end:
            continue

        spy_ret = compute_return(prices["SPY"], start, end)
        if spy_ret is None:
            continue

        avoids = REGIME_AVOIDS.get(regime, [])
        for ticker in avoids:
            inception = ETF_INCEPTION.get(ticker, "1990-01-01")
            if start < inception:
                continue
            etf_ret = compute_return(prices[ticker], start, end)
            if etf_ret is None:
                continue
            excess = round(etf_ret - spy_ret, 2)
            avoid_obs.append({
                "regime": regime, "ticker": ticker,
                "period": f"{start} → {end}",
                "etf_return": etf_ret, "spy_return": spy_ret,
                "excess": excess,
                "correctly_avoided": excess < 0,  # Did it underperform? (good avoid)
            })

    correct_avoids = [o for o in avoid_obs if o["correctly_avoided"]]
    wrong_avoids   = [o for o in avoid_obs if not o["correctly_avoided"]]
    avoid_total    = len(avoid_obs)
    avoid_rate     = len(correct_avoids) / avoid_total if avoid_total > 0 else 0
    avg_avoided_loss = sum(abs(o["excess"]) for o in correct_avoids) / len(correct_avoids) if correct_avoids else 0
    avg_missed_gain  = sum(o["excess"] for o in wrong_avoids) / len(wrong_avoids) if wrong_avoids else 0

    print(f"\n{'='*70}")
    print(f"  📈 ANALYSIS 3: AVOID SIGNAL — do the 'avoid' ETFs underperform SPY?")
    print(f"  Question: Does the framework correctly warn you away from losers?")
    print(f"{'='*70}")
    print(f"\n  Avoid observations:    {avoid_total}")
    print(f"  Correctly avoided:     {len(correct_avoids)} (underperformed SPY)")
    print(f"  Incorrectly avoided:   {len(wrong_avoids)} (actually beat SPY)")
    print(f"  Avoid accuracy:        {avoid_rate:.1%}")
    print(f"  Avg loss avoided:      {avg_avoided_loss:+.1f}% (damage you dodged)")
    print(f"  Avg gain missed:       {avg_missed_gain:+.1f}% (cost of being wrong)")

    print(f"\n  {'Regime':<14} {'Obs':>5} {'Correct':>8} {'Accuracy':>9} "
          f"{'AvgAvoided':>11} {'AvgMissed':>10}")
    print(f"  {'─'*14} {'─'*5} {'─'*8} {'─'*9} {'─'*11} {'─'*10}")
    for regime in ["Stagflation", "Reflation", "Goldilocks", "Deflation"]:
        r_obs = [o for o in avoid_obs if o["regime"] == regime]
        if not r_obs:
            continue
        r_correct = [o for o in r_obs if o["correctly_avoided"]]
        r_wrong   = [o for o in r_obs if not o["correctly_avoided"]]
        r_rate    = len(r_correct) / len(r_obs)
        r_avoided = sum(abs(o["excess"]) for o in r_correct) / len(r_correct) if r_correct else 0
        r_missed  = sum(o["excess"] for o in r_wrong) / len(r_wrong) if r_wrong else 0
        print(f"  {regime:<14} {len(r_obs):>5} {len(r_correct):>8} {r_rate:>8.0%} "
              f"{r_avoided:>+10.1f}% {r_missed:>+9.1f}%")

    # Per-avoided-ETF
    print(f"\n  {'ETF':<6} {'Obs':>5} {'Correct':>8} {'Accuracy':>9} {'AvgExcess':>10}")
    print(f"  {'─'*6} {'─'*5} {'─'*8} {'─'*9} {'─'*10}")
    avoid_tickers = sorted(set(o["ticker"] for o in avoid_obs))
    for ticker in avoid_tickers:
        t_obs     = [o for o in avoid_obs if o["ticker"] == ticker]
        t_correct = [o for o in t_obs if o["correctly_avoided"]]
        t_rate    = len(t_correct) / len(t_obs)
        t_avg     = sum(o["excess"] for o in t_obs) / len(t_obs)
        print(f"  {ticker:<6} {len(t_obs):>5} {len(t_correct):>8} {t_rate:>8.0%} "
              f"{t_avg:>+9.1f}%")

    # ═══════════════════════════════════════════════════════════════
    # ANALYSIS 4: Portfolio-level — picks vs SPY vs 60/40 vs superinvestors
    # ═══════════════════════════════════════════════════════════════
    period_results = []
    for period in periods:
        regime = period["regime"]
        start  = period["start"]
        end    = period["end"]
        if start == end:
            continue

        spy_ret    = compute_return(prices["SPY"], start, end)
        bench_6040 = compute_6040_return(prices, start, end)
        pick_ret   = compute_portfolio_return(prices, REGIME_ETFS.get(regime, []), start, end)
        avoid_ret  = compute_portfolio_return(prices, REGIME_AVOIDS.get(regime, []), start, end)

        # Superinvestor proxies
        si_rets = {}
        for si_ticker in SUPERINVESTOR_PROXIES:
            inception = ETF_INCEPTION.get(si_ticker, "1990-01-01")
            if start >= inception:
                si_rets[si_ticker] = compute_return(prices.get(si_ticker, {}), start, end)

        if spy_ret is not None and pick_ret is not None:
            period_results.append({
                "regime": regime, "start": start, "end": end,
                "pick_ret": pick_ret, "spy_ret": spy_ret,
                "bench_6040": bench_6040, "avoid_ret": avoid_ret,
                **{f"si_{k}": v for k, v in si_rets.items()},
            })

    EMOJIS = {"Reflation":"🟡","Stagflation":"🔴","Deflation":"🔵","Goldilocks":"🟢"}

    print(f"\n{'='*70}")
    print(f"  📈 ANALYSIS 4: PORTFOLIO-LEVEL COMPARISON")
    print(f"  Regime picks vs SPY vs 60/40 vs superinvestors per period")
    print(f"{'='*70}")

    picks_beat_spy = sum(1 for p in period_results if p["pick_ret"] > p["spy_ret"])
    picks_beat_6040 = sum(1 for p in period_results
                         if p["bench_6040"] is not None and p["pick_ret"] > p["bench_6040"])
    avoids_lost = sum(1 for p in period_results
                      if p["avoid_ret"] is not None and p["avoid_ret"] < p["spy_ret"])
    n_with_6040 = sum(1 for p in period_results if p["bench_6040"] is not None)
    n_with_avoid = sum(1 for p in period_results if p["avoid_ret"] is not None)

    print(f"\n  {len(period_results)} regime periods analysed:")
    print(f"  Picks beat SPY:     {picks_beat_spy}/{len(period_results)} "
          f"({picks_beat_spy/len(period_results)*100:.0f}%)")
    if n_with_6040:
        print(f"  Picks beat 60/40:   {picks_beat_6040}/{n_with_6040} "
              f"({picks_beat_6040/n_with_6040*100:.0f}%)")
    if n_with_avoid:
        print(f"  Avoids lost to SPY: {avoids_lost}/{n_with_avoid} "
              f"({avoids_lost/n_with_avoid*100:.0f}%)")

    # Per-regime portfolio comparison (with superinvestors)
    print(f"\n  {'Regime':<14} {'#':>3} {'Picks':>8} {'SPY':>8} "
          f"{'60/40':>8} {'BRK-B':>8} {'GURU':>8} {'Avoid':>8}")
    print(f"  {'─'*14} {'─'*3} {'─'*8} {'─'*8} "
          f"{'─'*8} {'─'*8} {'─'*8} {'─'*8}")
    for regime in ["Stagflation", "Reflation", "Goldilocks", "Deflation"]:
        r_ps = [p for p in period_results if p["regime"] == regime]
        if not r_ps:
            continue
        n = len(r_ps)
        def _avg(key):
            vals = [p[key] for p in r_ps if p.get(key) is not None]
            return sum(vals) / len(vals) if vals else None
        avg_pick  = _avg("pick_ret")
        avg_spy   = _avg("spy_ret")
        avg_6040  = _avg("bench_6040")
        avg_brkb  = _avg("si_BRK-B")
        avg_guru  = _avg("si_GURU")
        avg_avoid = _avg("avoid_ret")
        def _fmt(v):
            return f"{v:>+7.1f}%" if v is not None else "     n/a"
        print(f"  {EMOJIS.get(regime,'')}{regime:<13} {n:>3} {_fmt(avg_pick)} {_fmt(avg_spy)} "
              f"{_fmt(avg_6040)} {_fmt(avg_brkb)} {_fmt(avg_guru)} {_fmt(avg_avoid)}")

    # Show all periods in detail
    print(f"\n  {'─'*92}")
    print(f"  {'Period':<26} {'Regime':<14} {'Picks':>8} {'SPY':>8} "
          f"{'60/40':>8} {'BRK-B':>8} {'GURU':>8} {'Avoid':>8}")
    print(f"  {'─'*26} {'─'*14} {'─'*8} {'─'*8} {'─'*8} {'─'*8} {'─'*8} {'─'*8}")
    for p in period_results:
        emoji = EMOJIS.get(p["regime"], "")
        def _f(key):
            v = p.get(key)
            return f"{v:>+7.1f}%" if v is not None else "     n/a"
        print(f"  {p['start']} → {p['end']}  {emoji}{p['regime']:<13} "
              f"{_f('pick_ret')} {_f('spy_ret')} {_f('bench_6040')} "
              f"{_f('si_BRK-B')} {_f('si_GURU')} {_f('avoid_ret')}")

    # ═══════════════════════════════════════════════════════════════
    # ANALYSIS 5: Superinvestor proxies vs everything
    # ═══════════════════════════════════════════════════════════════
    print(f"\n{'='*70}")
    print(f"  📈 ANALYSIS 5: SUPERINVESTOR PROXIES vs ALL STRATEGIES")
    print(f"  BRK-B = Buffett  |  GURU = top 13F hedge fund picks")
    print(f"{'='*70}")

    for si_ticker, si_name in SUPERINVESTOR_PROXIES.items():
        si_key = f"si_{si_ticker}"
        si_periods = [p for p in period_results if p.get(si_key) is not None]
        if not si_periods:
            print(f"\n  {si_ticker} ({si_name}): no data available")
            continue

        n = len(si_periods)
        si_avg   = sum(p[si_key] for p in si_periods) / n
        spy_avg  = sum(p["spy_ret"] for p in si_periods) / n
        pick_avg = sum(p["pick_ret"] for p in si_periods) / n
        b64_vals = [p["bench_6040"] for p in si_periods if p["bench_6040"] is not None]
        b64_avg  = sum(b64_vals) / len(b64_vals) if b64_vals else None

        # Win rates
        si_beat_spy   = sum(1 for p in si_periods if p[si_key] > p["spy_ret"])
        si_beat_picks = sum(1 for p in si_periods if p[si_key] > p["pick_ret"])
        picks_beat_si = sum(1 for p in si_periods if p["pick_ret"] > p[si_key])

        print(f"\n  {si_ticker} — {si_name}")
        print(f"  {'─'*60}")
        print(f"  Periods analysed:         {n}")
        print(f"  Avg return per period:    {si_avg:+.1f}%")
        print(f"  SPY avg same periods:     {spy_avg:+.1f}%")
        print(f"  Regime picks avg:         {pick_avg:+.1f}%")
        if b64_avg is not None:
            print(f"  60/40 avg:                {b64_avg:+.1f}%")
        print(f"\n  {si_ticker} beat SPY:          {si_beat_spy}/{n} ({si_beat_spy/n*100:.0f}%)")
        print(f"  {si_ticker} beat regime picks:  {si_beat_picks}/{n} ({si_beat_picks/n*100:.0f}%)")
        print(f"  Regime picks beat {si_ticker}:  {picks_beat_si}/{n} ({picks_beat_si/n*100:.0f}%)")

        # Per-regime breakdown
        print(f"\n  {'Regime':<14} {'#':>3} {si_ticker:>8} {'Picks':>8} {'SPY':>8} {'Winner':>14}")
        print(f"  {'─'*14} {'─'*3} {'─'*8} {'─'*8} {'─'*8} {'─'*14}")
        for regime in ["Stagflation", "Reflation", "Goldilocks", "Deflation"]:
            r_ps = [p for p in si_periods if p["regime"] == regime]
            if not r_ps:
                continue
            rn = len(r_ps)
            r_si   = sum(p[si_key] for p in r_ps) / rn
            r_pick = sum(p["pick_ret"] for p in r_ps) / rn
            r_spy  = sum(p["spy_ret"] for p in r_ps) / rn
            best = max([("Picks", r_pick), (si_ticker, r_si), ("SPY", r_spy)], key=lambda x: x[1])
            print(f"  {EMOJIS.get(regime,'')}{regime:<13} {rn:>3} {r_si:>+7.1f}% "
                  f"{r_pick:>+7.1f}% {r_spy:>+7.1f}% {'→ '+best[0]:>14}")

    # ═══════════════════════════════════════════════════════════════
    # REGIME PERIODS (for reference)
    # ═══════════════════════════════════════════════════════════════
    print(f"\n  {'─'*68}")
    print(f"  REGIME PERIODS:")
    for p in periods:
        months = len([t for t in timeline
                      if t["date"] >= p["start"] and t["date"] <= p["end"]])
        emoji = EMOJIS.get(p["regime"], "❓")
        print(f"  {emoji} {p['start']} → {p['end']}  {p['regime']:<14} ({months}m)")

    # ═══════════════════════════════════════════════════════════════
    # Save results — use vs-60/40 numbers for Kelly sizing
    # ═══════════════════════════════════════════════════════════════
    # Compute per-regime Kelly using 60/40 benchmark (where edge exists)
    regime_kelly = {}
    for regime in ["Stagflation", "Reflation", "Goldilocks", "Deflation"]:
        r_obs = [o for o in obs_6040 if o["regime"] == regime]
        if not r_obs:
            continue
        r_wins   = [o for o in r_obs if o["win"]]
        r_losses = [o for o in r_obs if not o["win"]]
        r_wr     = len(r_wins) / len(r_obs)
        r_aw     = sum(o["excess"] for o in r_wins) / len(r_wins) if r_wins else 0
        r_al     = sum(abs(o["excess"]) for o in r_losses) / len(r_losses) if r_losses else 1
        r_wl     = r_aw / r_al if r_al > 0 else 0
        r_q      = 1 - r_wr
        r_kf     = (r_wr * r_wl - r_q) / r_wl if r_wl > 0 else 0
        regime_kelly[regime] = {
            "win_rate":       round(r_wr, 4),
            "win_loss_ratio": round(r_wl, 4),
            "kelly_full":     round(r_kf, 4),
            "kelly_half":     round(max(0, r_kf * 0.5), 4),
            "observations":   len(r_obs),
        }

    results = {
        "computed_date":  datetime.now().strftime("%Y-%m-%d"),
        "backtest_start": BACKTEST_START,
        "total_obs":      total,
        "win_rate":       round(win_rate, 4),
        "avg_win":        round(avg_win, 2),
        "avg_loss":       round(avg_loss, 2),
        "win_loss_ratio": round(win_loss, 4),
        "kelly_full":     round(kelly_full, 4),
        "kelly_half":     round(kelly_half, 4),
        "vs_6040": {
            "win_rate":       round(wr_6040, 4),
            "win_loss_ratio": round(wl_6040, 4),
            "kelly_half":     round(kh_6040, 4),
        },
        "avoid_accuracy": round(avoid_rate, 4),
        "regime_kelly":   regime_kelly,
        "picks_beat_spy_pct":   round(picks_beat_spy / len(period_results), 4) if period_results else 0,
        "picks_beat_6040_pct":  round(picks_beat_6040 / n_with_6040, 4) if n_with_6040 else 0,
        "avoids_underperformed_pct": round(avoids_lost / n_with_avoid, 4) if n_with_avoid else 0,
    }
    with open(RESULTS_CACHE, "w") as f:
        json.dump(results, f, indent=2)

    # Summary
    print(f"\n{'='*70}")
    print(f"  📋 SUMMARY")
    print(f"{'='*70}")
    print(f"\n  vs SPY:   {win_rate:.0%} win rate, {win_loss:.2f}x W/L → Kelly: {kelly_half*100:.1f}%")
    print(f"  vs 60/40: {wr_6040:.0%} win rate, {wl_6040:.2f}x W/L → Kelly: {kh_6040*100:.1f}%")
    print(f"  Avoid accuracy: {avoid_rate:.0%}")
    print(f"  Picks beat SPY portfolio-level: {picks_beat_spy}/{len(period_results)}")
    print(f"  Picks beat 60/40 portfolio-level: {picks_beat_6040}/{n_with_6040}")
    print(f"\n  💾 Results saved to {RESULTS_CACHE}")
    print(f"\n{'='*70}\n")

    return results


if __name__ == "__main__":
    run_backtest()
