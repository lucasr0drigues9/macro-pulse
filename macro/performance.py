"""
Tracks asset performance for regime-aligned ETFs
since the current regime started.
Regime start date comes from AI synthesis cache.
"""
import sys
import os
import io
import json
import contextlib
import yfinance as yf
from datetime import datetime

sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")

END_DATE = datetime.today().strftime("%Y-%m-%d")

SYNTHESIS_CACHE = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/geo_synthesis.json"


def get_regime_start_date():
    """Get regime start date from AI synthesis cache."""
    try:
        if os.path.exists(SYNTHESIS_CACHE):
            with open(SYNTHESIS_CACHE) as f:
                data = json.load(f)
            date_str = data.get("regime_start_date")
            if date_str and len(date_str) >= 10:
                # Validate it parses as a date
                datetime.strptime(date_str[:10], "%Y-%m-%d")
                return date_str[:10]
    except:
        pass
    return None


def get_regime():
    """Get current regime — same logic as macro_kelly."""
    try:
        from geopolitical import get_geopolitical_risks
        from fred import get_all
        from quadrant import get_quadrant

        with contextlib.redirect_stdout(io.StringIO()):
            us_data = get_all()
        result = get_quadrant(us_data)
        fred_regime = result["quadrant"]["name"]

        geo_data = get_geopolitical_risks()
        geo_regime = geo_data.get("overall_regime_bias") if geo_data else None

        if geo_regime and geo_regime != fred_regime:
            return geo_regime, True
        return fred_regime, False
    except:
        return "Reflation", False


# ETFs to track per regime — based on backtest results (2007-2026)
REGIME_ASSETS = {
    "Stagflation": {
        "XLE  — Energy stocks":    ("XLE",  "✅ Regime pick"),
        "GLD  — Gold":             ("GLD",  "✅ Regime pick"),
        "DBC  — Commodities":      ("DBC",  "✅ Regime pick"),
        "XLP  — Consumer staples": ("XLP",  "✅ Regime pick"),
        "XLU  — Utilities":        ("XLU",  "✅ Regime pick"),
        "QQQ  — Growth stocks":    ("QQQ",  "❌ Regime avoid"),
        "TLT  — Long bonds":       ("TLT",  "❌ Regime avoid"),
        "SPY  — S&P 500":          ("SPY",  "📊 Benchmark"),
    },
    "Reflation": {
        "GURU — Hedge fund 13F":   ("GURU", "✅ Best performer"),
        "XLE  — Energy stocks":    ("XLE",  "✅ Regime pick"),
        "XLI  — Industrials":      ("XLI",  "✅ Regime pick"),
        "GLD  — Gold":             ("GLD",  "✅ Regime pick"),
        "DBC  — Commodities":      ("DBC",  "✅ Regime pick"),
        "QQQ  — Growth stocks":    ("QQQ",  "❌ Regime avoid"),
        "TLT  — Long bonds":       ("TLT",  "❌ Regime avoid"),
        "SPY  — S&P 500":          ("SPY",  "📊 Benchmark"),
    },
    "Goldilocks": {
        "SPY  — S&P 500":          ("SPY",  "✅ Best performer"),
        "BRK-B — Berkshire":       ("BRK-B","✅ Best performer"),
        "QQQ  — Growth stocks":    ("QQQ",  "✅ Regime pick"),
        "GURU — Hedge fund 13F":   ("GURU", "✅ Regime pick"),
        "IWM  — Small caps":       ("IWM",  "✅ Regime pick"),
        "TLT  — Long bonds":       ("TLT",  "❌ Regime avoid"),
        "XLE  — Energy stocks":    ("XLE",  "❌ Regime avoid"),
    },
    "Deflation": {
        "GURU — Hedge fund 13F":   ("GURU", "✅ Best performer"),
        "TLT  — Long bonds":       ("TLT",  "✅ Regime pick"),
        "GLD  — Gold":             ("GLD",  "✅ Regime pick"),
        "XLP  — Consumer staples": ("XLP",  "✅ Regime pick"),
        "QQQ  — Growth stocks":    ("QQQ",  "❌ Regime avoid"),
        "XLE  — Energy stocks":    ("XLE",  "❌ Regime avoid"),
        "SPY  — S&P 500":          ("SPY",  "📊 Benchmark"),
    },
}

REGIME_EMOJIS = {
    "Reflation": "🟡", "Stagflation": "🔴",
    "Deflation": "🔵", "Goldilocks":  "🟢",
}


def get_return(ticker, start, end):
    try:
        hist = yf.Ticker(ticker).history(start=start, end=end)
        if hist.empty or len(hist) < 2:
            return None
        start_price = hist["Close"].iloc[0]
        end_price   = hist["Close"].iloc[-1]
        return round((end_price - start_price) / start_price * 100, 2)
    except:
        return None


def print_section(title, assets, start_date, sort=True):
    results = []
    for label, (ticker, category) in assets.items():
        ret = get_return(ticker, start_date, END_DATE)
        results.append((label, ticker, category, ret))

    if sort:
        results.sort(key=lambda x: x[3] if x[3] is not None else -999, reverse=True)

    print(f"\n  {title}")
    print(f"  {'─'*58}")
    print(f"  {'Asset':<28} {'Return':>8}   Category")
    print(f"  {'─'*26} {'─'*8}   {'─'*18}")

    for label, ticker, category, ret in results:
        ret_str = f"{ret:>+.1f}%" if ret is not None else "   n/a"
        print(f"  {label:<28} {ret_str:>7}   {category}")

    # Summary for picks vs avoids
    picks  = [r for r in results if "pick" in r[2] and r[3] is not None]
    avoids = [r for r in results if "avoid" in r[2] and r[3] is not None]
    if picks and avoids:
        avg_p = sum(r[3] for r in picks)  / len(picks)
        avg_a = sum(r[3] for r in avoids) / len(avoids)
        won   = "✅ Picks outperformed" if avg_p > avg_a else "❌ Avoids outperformed"
        print(f"\n  📈 Avg picks: {avg_p:>+.1f}%   📉 Avg avoids: {avg_a:>+.1f}%   {won}")


def run():
    regime, is_geo = get_regime()
    emoji = REGIME_EMOJIS.get(regime, "❓")
    assets = REGIME_ASSETS.get(regime, REGIME_ASSETS["Reflation"])
    source = "geopolitical signal" if is_geo else "FRED data"

    start_date = get_regime_start_date()
    if start_date:
        date_source = "AI synthesis"
    else:
        start_date = "2025-08-01"
        date_source = "fallback"

    print(f"\n{'='*65}")
    print(f"  📊 ASSET PERFORMANCE — {emoji} {regime.upper()} REGIME")
    print(f"  Since: {start_date}  (source: {date_source})")
    print(f"  Today: {END_DATE}  (regime source: {source})")
    print(f"{'='*65}")

    print_section(
        f"{emoji} {regime} — picks vs avoids",
        assets,
        start_date
    )

    print(f"\n  {'─'*60}")
    print(f"  ⚠️  Past performance within a regime does not guarantee")
    print(f"     future results. Regime transitions can reverse quickly.")
    print(f"\n{'='*65}\n")


if __name__ == "__main__":
    run()
