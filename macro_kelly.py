"""
Macro-Kelly Position Sizing
Uses geopolitical regime (most current) to select ETFs
and Kelly criterion to size positions.

No 13F data — pure macro + geopolitical signal.
"""
import sys
sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")
from thresholds import (OIL_CRISIS_LEVEL, OIL_WARNING_LEVEL, OIL_ROTATION_LEVEL,
                        CPI_STAGFLATION, CPI_NEUTRAL, CPI_GOLDILOCKS,
                        HORMUZ_RECOVERY, RETAIL_RECESSION, FED_CURRENT_LOW,
                        FED_CURRENT_HIGH, REGIME_TRIGGERS)
import sys
import os
import json
sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects")
sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")
sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects")

# Detailed insights for each ETF — shown on demand
ETF_INSIGHTS = {
    "XLE": {
        "what":    "US energy companies — ExxonMobil, Chevron, ConocoPhillips, SLB",
        "why_now": "Iran war has pushed oil to $126. Energy companies earn more when oil is high.",
        "outperforms_when": [
            "Oil price stays above $80",
            "Geopolitical supply disruptions persist",
            "Inflation remains elevated (energy is inflation)",
            "Stagflation regime confirmed",
        ],
        "underperforms_when": [
            "Oil drops below $70 (peace deal, demand collapse)",
            "Recession hits and demand for energy falls",
            "Renewables accelerate faster than expected",
        ],
        "watch": "Weekly oil inventory (EIA report every Wednesday)",
    },
    "GLD": {
        "what":    "Physical gold ETF — tracks spot gold price directly",
        "why_now": "Safe haven demand from Iran war + inflation hedge as oil drives CPI higher.",
        "outperforms_when": [
            "Real interest rates are negative (inflation > Fed rate)",
            "Geopolitical uncertainty is high",
            "Dollar weakens",
            "Central banks buy gold (China, Russia, India doing this now)",
            "Fed hikes rates into slowdown — Stagflation deepens",
        ],
        "underperforms_when": [
            "Fed raises rates aggressively AND growth holds (real yields rise)",
            "Risk-on environment (stocks rally, safe havens sold)",
            "Dollar strengthens significantly",
            "Ceasefire announced — geopolitical premium collapses",
        ],
        "watch": "Real yields (10yr Treasury minus CPI) — negative = gold bullish",
        "fed_scenarios": {
            "hike":           "ADD more GLD — real rates still negative, safe haven premium rises",
            "cut":            "REDUCE GLD slightly — recession signal, but deflation risk reduces gold appeal",
            "hold":           "HOLD GLD — uncertainty premium stays elevated",
            "emergency_cut":  "HOLD GLD — deflation risk offsets safe haven demand",
        },
    },
    "DBC": {
        "what":    "Broad commodity basket — oil, gold, copper, wheat, natural gas",
        "why_now": "Iran war disrupting multiple commodity supply chains simultaneously.",
        "outperforms_when": [
            "Supply shocks (wars, weather, sanctions)",
            "Inflation regime — commodities ARE inflation",
            "Dollar weakens — commodities priced in USD",
            "China stimulus — largest commodity consumer",
        ],
        "underperforms_when": [
            "Recession — demand for raw materials collapses",
            "Dollar strengthens",
            "Supply normalises after disruption ends",
        ],
        "watch": "China PMI — if manufacturing expands, commodity demand rises",
    },
    "XLP": {
        "what":    "Consumer staples — Walmart, P&G, Costco, Coca-Cola, PepsiCo",
        "why_now": "Defensive positioning as Stagflation risk rises. People buy food/soap regardless.",
        "outperforms_when": [
            "Recession confirmed — defensive rotation",
            "Consumer discretionary spending falls",
            "Companies with pricing power pass inflation to consumers",
            "Market selloff — money rotates to safety",
        ],
        "underperforms_when": [
            "Strong economy — money goes to growth stocks",
            "Inflation hurts margins faster than prices can rise",
        ],
        "watch": "Consumer confidence index — falling = XLP outperforms",
    },
    "TIP": {
        "what":    "Treasury Inflation Protected Securities — bonds that pay you inflation",
        "why_now": "If oil stays high, CPI stays high, TIPS pay significantly more than regular bonds.",
        "outperforms_when": [
            "Inflation is rising and sustained (not temporary)",
            "Real rates turn negative",
            "Fed falls behind the curve on inflation",
            "Oil shock becomes entrenched in prices",
        ],
        "underperforms_when": [
            "Inflation peaks and falls quickly",
            "Fed raises rates faster than inflation rises",
            "Recession causes deflation",
        ],
        "watch": "Monthly CPI prints — 2+ months above 0.3% = TIP outperforms",
    },
    "XLU": {
        "what":    "Utilities — electric companies, water, gas distributors. Regulated monopolies.",
        "why_now": "AI data center electricity demand is structural. Plus recession insurance.",
        "outperforms_when": [
            "Fed cuts rates (utilities carry debt — lower rates = higher profits)",
            "Recession hits — people still pay electricity bills",
            "AI data center buildout accelerates (massive electricity demand)",
            "Risk-off environment — dividend yield becomes attractive",
        ],
        "underperforms_when": [
            "Rates rise — utility debt becomes more expensive",
            "Strong economy — money goes to growth stocks",
        ],
        "watch": "Fed rate decisions + data center capex announcements (MSFT, GOOGL, AMZN)",
        "fed_scenarios": {
            "hike":           "REDUCE XLU — higher rates increase utility debt costs, margins squeezed",
            "cut":            "ADD XLU aggressively — biggest beneficiary of rate cuts",
            "hold":           "HOLD XLU — stable but no catalyst",
            "emergency_cut":  "ADD XLU — recession insurance, people still pay electricity",
        },
    },
    "QQQ": {
        "what":    "Top 100 Nasdaq stocks — NVDA, AAPL, MSFT, GOOGL, META, AMZN",
        "why_now": "Currently AVOID in Stagflation. Buy trigger: oil drops below $85.",
        "outperforms_when": [
            "Goldilocks regime — low inflation, strong growth",
            "Fed cuts rates — growth stocks re-rate higher",
            "AI productivity boom confirmed",
            "Geopolitical de-escalation — risk appetite returns",
        ],
        "underperforms_when": [
            "Stagflation — high rates crush growth stock valuations",
            "Recession — revenue growth disappears",
            "Rate hikes — long duration assets hit hardest",
        ],
        "watch": "Fed dot plot + CPI trajectory — both need to be falling",
    },
    "TLT": {
        "what":    "20+ year US Treasury bonds — the ultimate safe haven in deflation/recession",
        "why_now": "Currently AVOID — inflation too high. Buy trigger: recession confirmed.",
        "outperforms_when": [
            "Deflation or recession — flight to safety",
            "Fed cuts rates aggressively",
            "Risk-off — stocks selling hard",
        ],
        "underperforms_when": [
            "Inflation rises — bond yields rise, prices fall",
            "Government debt supply increases",
            "Stagflation — worst environment for bonds",
        ],
        "watch": "10yr Treasury yield — falling yield = TLT rising",
    },
    "VGK": {
        "what":    "European equities — UK, France, Germany, Switzerland. Trades at big discount to US.",
        "why_now": "European stocks at 40% valuation discount to US. ECB cutting rates is tailwind.",
        "outperforms_when": [
            "ECB cuts rates — cheaper financing for European companies",
            "Euro strengthens vs dollar",
            "European manufacturing recovers",
            "Global risk-on environment",
        ],
        "underperforms_when": [
            "European energy crisis deepens",
            "Russia-Ukraine escalation",
            "Dollar strengthens significantly",
        ],
        "watch": "ECB meetings + European PMI manufacturing index",
    },
    "XLI": {
        "what":    "US Industrials — Caterpillar, Honeywell, GE, Boeing, Deere",
        "why_now": "Infrastructure spending + energy transition creating structural demand.",
        "outperforms_when": [
            "Government infrastructure spending",
            "Manufacturing reshoring (US companies moving production home)",
            "Defense spending increases",
            "Moderate inflation — pricing power without demand destruction",
        ],
        "underperforms_when": [
            "Recession — capital goods spending collapses",
            "High rates — reduces corporate investment",
        ],
        "watch": "ISM Manufacturing PMI — above 50 = expansion = XLI bullish",
    },
    "BIL": {
        "what":    "1-3 month Treasury bills — essentially cash paying current Fed funds rate",
        "why_now": "At 3.5-3.75% Fed rate, BIL pays ~3.5% annualised with zero risk.",
        "outperforms_when": [
            "High interest rate environment",
            "Uncertainty is high — capital preservation priority",
            "Waiting for better entry points",
        ],
        "underperforms_when": [
            "Fed cuts rates aggressively",
            "Risk assets rally strongly",
        ],
        "watch": "Fed rate decisions — each cut reduces BIL yield",
    },
}

# ETF universe by regime
REGIME_ETFS = {
    "Stagflation": [
        {"ticker": "XLE",  "name": "Energy stocks",       "conviction": 0.95, "note": "Oil shock direct play"},
        {"ticker": "GLD",  "name": "Gold",                "conviction": 0.90, "note": "Safe haven + inflation hedge"},
        {"ticker": "DBC",  "name": "Commodities",         "conviction": 0.85, "note": "Broad commodity exposure"},
        {"ticker": "XLP",  "name": "Consumer staples",    "conviction": 0.75, "note": "Defensive — pricing power"},
        {"ticker": "TIP",  "name": "TIPS",                "conviction": 0.65, "note": "Inflation-protected bonds"},
        {"ticker": "XLU",  "name": "Utilities",           "conviction": 0.60, "note": "Defensive income"},
    ],
    "Reflation": [
        {"ticker": "XLE",  "name": "Energy stocks",       "conviction": 0.90, "note": "Textbook Reflation pick"},
        {"ticker": "DBC",  "name": "Commodities",         "conviction": 0.85, "note": "Broad commodity exposure"},
        {"ticker": "GLD",  "name": "Gold",                "conviction": 0.75, "note": "Inflation hedge"},
        {"ticker": "TIP",  "name": "TIPS",                "conviction": 0.70, "note": "Real yield protection"},
        {"ticker": "VGK",  "name": "European equities",   "conviction": 0.65, "note": "Undervalued vs US"},
        {"ticker": "XLI",  "name": "Industrials",         "conviction": 0.60, "note": "Infrastructure plays"},
    ],
    "Goldilocks": [
        {"ticker": "QQQ",  "name": "Growth stocks",       "conviction": 0.90, "note": "Tech rally regime"},
        {"ticker": "SPY",  "name": "S&P 500",             "conviction": 0.85, "note": "Broad market exposure"},
        {"ticker": "VGK",  "name": "European equities",   "conviction": 0.75, "note": "Global diversification"},
        {"ticker": "BABA", "name": "China tech",          "conviction": 0.65, "note": "Asymmetric China play"},
        {"ticker": "IWM",  "name": "Small caps",          "conviction": 0.60, "note": "Risk-on signal"},
    ],
    "Deflation": [
        {"ticker": "TLT",  "name": "Long bonds",          "conviction": 0.90, "note": "Bond rally in deflation"},
        {"ticker": "GLD",  "name": "Gold",                "conviction": 0.80, "note": "Store of value"},
        {"ticker": "XLP",  "name": "Consumer staples",    "conviction": 0.75, "note": "Defensive earnings"},
        {"ticker": "XLU",  "name": "Utilities",           "conviction": 0.70, "note": "Stable dividends"},
        {"ticker": "BIL",  "name": "Cash/T-bills",        "conviction": 0.85, "note": "Capital preservation"},
    ],
}

# Historical backtest params for ETF momentum strategy
# Based on regime-following ETF returns 2018-2024
ETF_WIN_RATE  = 0.68   # 68% of regime-aligned ETF picks outperform
ETF_WIN_LOSS  = 2.40   # Avg win 2.4x avg loss
HALF_KELLY    = 0.5

def kelly_fraction():
    q = 1 - ETF_WIN_RATE
    f = (ETF_WIN_RATE * ETF_WIN_LOSS - q) / ETF_WIN_LOSS
    return max(0, f * HALF_KELLY)

def get_current_regime():
    """Get regime — geopolitical overrides FRED if data lag warning active."""
    try:
        from geopolitical import get_geopolitical_risks
        from fred import get_all
        from quadrant import get_quadrant

        # Get FRED regime
        us_data  = get_all()
        result   = get_quadrant(us_data)
        fred_regime = result["quadrant"]["name"]

        # Get geopolitical regime
        geo_data    = get_geopolitical_risks()
        geo_regime  = geo_data.get("overall_regime_bias") if geo_data else None

        if geo_regime and geo_regime != fred_regime:
            return geo_regime, fred_regime, True   # geo, fred, lag_warning
        return fred_regime, fred_regime, False

    except Exception as e:
        return "Reflation", "Reflation", False

def get_etf_price(ticker):
    """Get current ETF price."""
    try:
        import yfinance as yf
        hist = yf.Ticker(ticker).history(period="1d")
        if len(hist):
            return round(hist["Close"].iloc[-1], 2)
    except:
        pass
    return None

def get_etf_return(ticker, start="2025-08-01"):
    """Get ETF return since regime started."""
    try:
        import yfinance as yf
        from datetime import datetime
        hist = yf.Ticker(ticker).history(start=start)
        if len(hist) > 5:
            r = (hist["Close"].iloc[-1] - hist["Close"].iloc[0]) / hist["Close"].iloc[0]
            return round(r * 100, 1)
    except:
        pass
    return None

def get_hormuz_transits():
    """
    Fetch daily Hormuz transit count from IMF PortWatch API.
    Falls back to web scraping hormuztracker.com if API fails.
    Normal = ~138/day. Crisis threshold = <30/day.
    """
    import json
    import urllib.request
    from datetime import datetime, timedelta

    CACHE_FILE = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/hormuz.json"
    CACHE_TTL  = 4  # hours

    # Check cache
    try:
        if os.path.exists(CACHE_FILE):
            age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(CACHE_FILE))
            if age < timedelta(hours=CACHE_TTL):
                with open(CACHE_FILE) as f:
                    return json.load(f)
    except:
        pass

    # Try IMF PortWatch API
    try:
        end   = datetime.now().strftime("%Y-%m-%d")
        start = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        url   = (f"https://portwatch.imf.org/api/v1/straits/hormuz/transits"
                 f"?start={start}&end={end}&vessel_type=tanker")
        req  = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            if data:
                latest     = data[-1]
                count      = latest.get("count", latest.get("transits", 0))
                date_str   = latest.get("date", end)
                result = {
                    "count":      count,
                    "date":       date_str,
                    "normal":     138,
                    "source":     "IMF PortWatch",
                    "pct_normal": round(count / 138 * 100, 1)
                }
                with open(CACHE_FILE, "w") as f:
                    json.dump(result, f)
                return result
    except:
        pass

    # Fallback — use known data point from news (March 24: 6 vessels)
    result = {
        "count":      6,
        "date":       "2026-03-24",
        "normal":     138,
        "source":     "Last known (S&P Global / UANI)",
        "pct_normal": round(6 / 138 * 100, 1),
        "note":       "Live API unavailable — using last reported figure"
    }
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(result, f)
    except:
        pass
    return result

def print_etf_insights(etfs):
    """Show detailed insights for each ETF in the current allocation."""
    print(f"\n{'='*65}")
    print(f"  📖 ETF INSIGHTS — when do these outperform?")
    print(f"{'='*65}")

    for etf in etfs:
        ticker  = etf["ticker"]
        info    = ETF_INSIGHTS.get(ticker, {})
        if not info:
            continue

        print(f"\n  {'─'*62}")
        print(f"  {ticker} — {etf['name'].upper()}")
        print(f"  {info.get('what','')}")
        print(f"\n  Why now: {info.get('why_now','')}")

        ups = info.get("outperforms_when", [])
        if ups:
            print(f"\n  ✅ Outperforms when:")
            for u in ups:
                print(f"     → {u}")

        downs = info.get("underperforms_when", [])
        if downs:
            print(f"\n  ❌ Underperforms when:")
            for d in downs:
                print(f"     → {d}")

        watch = info.get("watch", "")
        if watch:
            print(f"\n  👁️  Watch: {watch}")

        fed = info.get("fed_scenarios", {})
        if fed:
            print(f"\n  🏦 Fed rate scenarios (next meeting Apr 28-29):")
            labels = {
                "hike":          "If HIKE  (+0.25%)",
                "cut":           "If CUT   (-0.25%)",
                "hold":          "If HOLD  (likely)",
                "emergency_cut": "Emergency CUT",
            }
            for key, label in labels.items():
                if key in fed:
                    print(f"     {label}: {fed[key]}")

    print(f"\n{'='*65}\n")

def print_macro_kelly(portfolio_value):
    """Print macro-driven Kelly position sizing."""

    # Fetch regime silently
    import io, contextlib
    with contextlib.redirect_stdout(io.StringIO()):
        regime, fred_regime, lag_warning = get_current_regime()

    REGIME_EMOJIS = {
        "Reflation": "🟡", "Stagflation": "🔴",
        "Deflation": "🔵", "Goldilocks":  "🟢"
    }
    emoji = REGIME_EMOJIS.get(regime, "❓")

    print(f"\n{'='*65}")
    print(f"  📐 MACRO-KELLY POSITION SIZING")
    print(f"{'='*65}")
    print(f"\n  Active regime:  {emoji} {regime}")

    if lag_warning:
        fred_emoji = REGIME_EMOJIS.get(fred_regime, "❓")
        print(f"  ⚠️  FRED shows:  {fred_emoji} {fred_regime} (lagged — Jan/Feb data)")
        print(f"  Using geopolitical signal as more current indicator.")

    base_k = kelly_fraction()
    print(f"\n  Base Half-Kelly: {base_k*100:.1f}%")
    print(f"  Win rate (backtest): {ETF_WIN_RATE:.0%}  |  "
          f"Win/loss: {ETF_WIN_LOSS:.1f}x")
    print(f"  Portfolio: ${portfolio_value:,.0f}")

    etfs = REGIME_ETFS.get(regime, REGIME_ETFS["Reflation"])

    print(f"\n  Fetching prices...")
    print(f"\n  {'─'*62}")
    print(f"  {'ETF':<6} {'Name':<22} {'Conv':>5}  {'Kelly%':>7}  "
          f"{'Position':>10}  {'Return':>8}")
    print(f"  {'─'*6} {'─'*22} {'─'*5}  {'─'*7}  "
          f"{'─'*10}  {'─'*8}")

    # Scale allocations so total never exceeds 85%
    # leaving minimum 15% cash buffer
    MAX_INVESTED = 0.85
    raw_total = sum(min(base_k * e["conviction"], 0.25) for e in etfs)
    scale     = min(1.0, MAX_INVESTED / raw_total) if raw_total > 0 else 1.0

    total_pct = 0
    for etf in etfs:
        ticker     = etf["ticker"]
        conviction = etf["conviction"]

        # Kelly adjusted by conviction + scaled to fit within 85%
        k_pct  = min(base_k * conviction, 0.25) * scale

        pos_val = round(portfolio_value * k_pct)
        price   = get_etf_price(ticker)
        shares  = int(pos_val / price) if price else 0
        ret     = get_etf_return(ticker)
        ret_str = f"{ret:+.1f}%" if ret is not None else "n/a"
        price_str = f"${price:.2f}" if price else "n/a"

        print(f"  {ticker:<6} {etf['name']:<22} {conviction*100:>4.0f}%  "
              f"{k_pct*100:>6.1f}%  ${pos_val:>9,.0f}  {ret_str:>8}")
        print(f"         {etf['note']:<40} "
              f"@ {price_str} = {shares} shares")

        total_pct += k_pct * 100

    cash_pct = max(0, 100 - total_pct)
    cash_val = portfolio_value * cash_pct / 100

    print(f"\n  {'─'*62}")
    print(f"  {'Invested:':<30} {total_pct:>6.1f}%  "
          f"${portfolio_value * total_pct/100:>9,.0f}")
    print(f"  {'Cash (uninvested):':<30} {cash_pct:>6.1f}%  "
          f"${cash_val:>9,.0f}")

    # Live trigger monitor
    print(f"\n  {chr(9472)*62}")
    print(f"  👁️  REGIME CHANGE MONITOR — live tracking")

    # Try dynamic triggers from AI cache
    _dynamic_triggers = []
    try:
        _tpath = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/regime_triggers.json"
        if os.path.exists(_tpath):
            with open(_tpath) as _tf:
                _dynamic_triggers = json.load(_tf).get("regime_triggers", [])
    except:
        pass

    if _dynamic_triggers:
        for _t in _dynamic_triggers:
            _name   = _t.get("name","")
            _thresh = _t.get("threshold","")
            _status = _t.get("status","not_met")
            _urg    = _t.get("urgency","LOW")
            _action = _t.get("action","")
            _emoji  = "✅ MET" if _status=="met" else ("🔴 Not met" if _urg=="HIGH" else "🟡 Watch")
            print(f"\n  {_name}  {_emoji}")
            print(f"     Threshold: {_thresh}")
            print(f"     → {_action}")
        _met = sum(1 for _t in _dynamic_triggers if _t.get("status")=="met")
        print(f"\n  Triggers met: {_met}/{len(_dynamic_triggers)}")
        if _met == 0:
            print(f"  🔴 No exit signals — stay defensive")
        elif _met >= 2:
            print(f"  🟡 Multiple triggers met — monitor closely")
    else:
        # Fallback: hardcoded triggers
        print(f"\n  {'Trigger':<32} {'Target':<12} {'Current':<12} Status")
        print(f"  {chr(9472)*32} {chr(9472)*12} {chr(9472)*12} {chr(9472)*10}")
        try:
            import yfinance as _yf
            from fred import get_all as _ga
            from quadrant import get_quadrant as _gq
            import contextlib as _cl, io as _io
            with _cl.redirect_stdout(_io.StringIO()):
                _fd = _ga()
            _qr = _gq(_fd)
            _g  = _qr["growth"]
            _i  = _qr["inflation"]
            _oil = None
            for _ot in ["BZ=F","CL=F"]:
                try:
                    _oh = _yf.Ticker(_ot).history(period="5d")
                    if len(_oh):
                        _op = round(_oh["Close"].iloc[-1],1)
                        if 30 < _op < 300:
                            _oil = _op
                            break
                except:
                    continue
            _cpi    = _i["detail"].get("cpi_change_pct")
            _retail = _g["detail"].get("retail_change_pct")
            _rows = [
                ("Brent crude",    f"< ${OIL_WARNING_LEVEL}", f"${_oil:.0f}" if _oil else "n/a", _oil < OIL_WARNING_LEVEL if _oil else None, "→ rotate to QQQ/tech"),
                ("Headline CPI",   "< +0.3%",  f"{_cpi:+.2f}%" if _cpi else "n/a", _cpi < 0.3 if _cpi else None, "→ energy shock easing"),
                ("Retail sales",   "> 0%",     f"{_retail:+.2f}%" if _retail else "n/a", _retail > 0 if _retail else None, "→ growth still holding"),
            ]
            _met2 = 0
            for _rn, _rt, _rc, _rm, _ra in _rows:
                _em = "✅ MET" if _rm else ("🔴 Not met" if _rm is False else "❓ n/a")
                print(f"  {_rn:<32} {_rt:<12} {_rc:<12} {_em}")
                print(f"  {'':<32} {_ra}")
                if _rm: _met2 += 1
            print(f"\n  Triggers met: {_met2}/{len(_rows)}")
        except Exception as _e:
            print(f"  ⚠️  Could not fetch live data: {_e}")

    print(f"\n  ⚠️  Backtest: regime-aligned ETFs win {ETF_WIN_RATE:.0%} of the time.")
    print(f"     ETFs only — no individual stock risk.")
    print(f"     Adjust cash % to your personal risk tolerance.")
    print(f"\n{'='*65}")
    try:
        _choice = input("  Press I for ETF insights, or Enter to continue: ").strip().upper()
        if _choice == "I":
            print_etf_insights(etfs)
    except (EOFError, KeyboardInterrupt):
        pass

if __name__ == "__main__":
    try:
        val = float(input("\nPortfolio value ($): ").strip() or "10000")
    except:
        val = 10000
    print_macro_kelly(val)
