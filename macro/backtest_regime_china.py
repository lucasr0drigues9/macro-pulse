"""
China regime backtest — builds a historical timeline using proxy indicators
and computes ETF basket returns for each period.

Unlike the US/EU backtests which derive regimes from monthly economic data,
China's backtest uses a manually curated timeline based on known economic
periods (similar to SIGNAL_STRENGTH for the US). This is more honest than
pretending we have reliable monthly Chinese data going back to 2010.
"""
import os
import json
import requests
from datetime import datetime

CACHE_DIR = ".macro_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# ── China regime timeline ──
# Based on proxy indicators, World Bank data, and known economic events.
# Each entry: (start_date, end_date, regime, context)
CHINA_REGIME_HISTORY = [
    ("2010-01", "2011-06", "Reflation", "Post-GFC stimulus. 4 trillion yuan package driving infrastructure boom. GDP growth 10%+."),
    ("2011-07", "2012-09", "Stagflation", "Inflation above 6% from stimulus overshoot. PBOC tightening. Property curbs introduced."),
    ("2012-10", "2013-12", "Goldilocks", "Inflation controlled at 2-3%. Growth stabilising at 7.5%. New leadership under Xi Jinping."),
    ("2014-01", "2015-06", "Deflation", "PPI negative for 3+ years. Manufacturing overcapacity. Shadow banking cleanup."),
    ("2015-07", "2015-12", "Deflation", "Stock market crash (Jun-Aug 2015). Yuan devaluation Aug 2015. Capital flight."),
    ("2016-01", "2016-12", "Reflation", "Massive stimulus. Property boom. Supply-side reform cutting steel/coal overcapacity."),
    ("2017-01", "2018-03", "Goldilocks", "Growth 6.8%, inflation 2%. Deleveraging campaign. Tech sector thriving."),
    ("2018-04", "2019-03", "Stagflation", "US-China trade war begins. Tariffs imposed. PPI rising while growth slowing."),
    ("2019-04", "2019-12", "Deflation", "Trade war escalation. Manufacturing PMI below 50. PPI turned negative."),
    ("2020-01", "2020-06", "Deflation", "COVID-19 origin. Wuhan lockdown. GDP -6.8% Q1 2020. Deepest contraction ever."),
    ("2020-07", "2021-06", "Reflation", "First to recover from COVID. Exports booming. PPI surging. Commodity super-cycle."),
    ("2021-07", "2022-03", "Stagflation", "Evergrande crisis. Property sector collapse begins. PPI above 10% while growth slowing."),
    ("2022-04", "2022-12", "Deflation", "Zero-COVID lockdowns. Shanghai lockdown Apr-Jun. Consumer confidence collapsed."),
    ("2023-01", "2023-06", "Reflation", "COVID reopening Dec 2022. Initial reopening bounce. Pent-up demand."),
    ("2023-07", "2024-09", "Deflation", "Reopening fizzled. Property crisis deepened. CPI near zero, PPI negative. Youth unemployment crisis."),
    ("2024-10", "2026-03", "Deflation", "Property prices -8.5% YoY. PPI -2.8%. Consumer deflation. PBOC cutting but insufficient."),
    ("2026-04", "2026-12", "Stagflation", "Hormuz closure cut shadow fleet oil supply. Energy costs rising while economy still deflating."),
]

# ETF baskets for China regime backtesting
# Mix of China-exposed ETFs and global China proxies
CHINA_BACKTEST_ETFS = {
    "Stagflation": ["GLD", "XLE", "DBC"],
    "Reflation":   ["FXI", "DBC", "EEM"],
    "Goldilocks":  ["FXI", "KWEB", "EEM"],
    "Deflation":   ["GLD", "TLT", "XLP"],
}

ALL_TICKERS = list(set(t for picks in CHINA_BACKTEST_ETFS.values() for t in picks))


def fetch_etf_monthly(ticker, start="2010-01-01"):
    """Fetch monthly close prices for an ETF, cached."""
    cache_file = f"{CACHE_DIR}/backtest_etf_{ticker}.json"
    if os.path.exists(cache_file):
        age = datetime.now().timestamp() - os.path.getmtime(cache_file)
        if age < 7 * 86400:  # 7 day cache
            with open(cache_file) as f:
                return json.load(f)

    try:
        import yfinance as yf
        h = yf.Ticker(ticker).history(start=start, interval="1mo")
        if h.empty:
            return {}
        monthly = {}
        for date, row in h.iterrows():
            key = date.strftime("%Y-%m-01")
            monthly[key] = round(float(row["Close"]), 2)
        with open(cache_file, "w") as f:
            json.dump(monthly, f)
        return monthly
    except Exception:
        return {}


def load_all_prices():
    prices = {}
    for ticker in ALL_TICKERS:
        prices[ticker] = fetch_etf_monthly(ticker)
    return prices


def compute_portfolio_return(prices, tickers, start, end):
    """Average return across tickers for a period."""
    returns = []
    for t in tickers:
        p = prices.get(t, {})
        s_price = p.get(start)
        e_price = p.get(end)
        if s_price and e_price and s_price > 0:
            returns.append((e_price - s_price) / s_price * 100)
    return round(sum(returns) / len(returns), 1) if returns else None


def build_china_backtest():
    """Build the full China backtest — regime periods with basket returns."""
    prices = load_all_prices()

    periods = []
    for start, end, regime, context in CHINA_REGIME_HISTORY:
        start_date = f"{start}-01"
        end_date = f"{end}-01"

        # Compute returns for all 4 baskets
        all_returns = {}
        for r_name in ["Stagflation", "Goldilocks", "Reflation", "Deflation"]:
            ret = compute_portfolio_return(
                prices, CHINA_BACKTEST_ETFS.get(r_name, []), start_date, end_date
            )
            all_returns[r_name] = ret

        # Best performing basket
        valid = {k: v for k, v in all_returns.items() if v is not None}
        best = max(valid, key=lambda k: valid[k]) if valid else None
        framework_correct = best == regime if best else None

        # Duration in months
        try:
            s = datetime.strptime(start_date, "%Y-%m-%d")
            e = datetime.strptime(end_date, "%Y-%m-%d")
            months = max(1, (e.year - s.year) * 12 + (e.month - s.month))
        except Exception:
            months = 1

        periods.append({
            "regime": regime,
            "start": start,
            "end": end,
            "months": months,
            "signalContext": context,
            "picksReturn": all_returns.get(regime),
            "allRegimeReturns": all_returns,
            "bestRegime": best,
            "frameworkCorrect": framework_correct,
        })

    return periods


if __name__ == "__main__":
    periods = build_china_backtest()
    correct = sum(1 for p in periods if p["frameworkCorrect"])
    total = sum(1 for p in periods if p["frameworkCorrect"] is not None)
    print(f"China backtest: {len(periods)} periods, {correct}/{total} correct")
    for p in periods:
        mark = "✓" if p["frameworkCorrect"] else "✗" if p["frameworkCorrect"] is False else "?"
        print(f"  {mark} {p['start']}→{p['end']} {p['regime']:12} picks={p['picksReturn'] or 'N/A':>6} best={p['bestRegime'] or '?'}")
