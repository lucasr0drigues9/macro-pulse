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
        "why_now": "Iran war keeping oil above $100. Energy companies earn more when oil is high.",
        "backtest": "47% win rate vs SPY, +2.4% avg excess. Best in Stagflation (+39% since Dec 2025).",
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
        "why_now": "Safe haven demand from Iran war + inflation hedge. Down 15% from highs — potential entry.",
        "backtest": "41% win rate vs SPY, but works as portfolio insurance. Best in crisis periods.",
        "outperforms_when": [
            "Real interest rates are negative (inflation > Fed rate)",
            "Geopolitical uncertainty is high",
            "Dollar weakens",
            "Central banks buy gold (China, Russia, India doing this now)",
        ],
        "underperforms_when": [
            "Fed raises rates aggressively AND growth holds (real yields rise)",
            "Risk-on environment (stocks rally, safe havens sold)",
            "Dollar strengthens significantly",
            "Ceasefire announced — geopolitical premium collapses",
        ],
        "watch": "Real yields (10yr Treasury minus CPI) — negative = gold bullish",
    },
    "DBC": {
        "what":    "Broad commodity basket — oil, gold, copper, wheat, natural gas",
        "why_now": "Iran war disrupting multiple commodity supply chains. +30% since Dec 2025.",
        "backtest": "37% win rate vs SPY — dragged by non-crisis periods. Strong only during supply shocks.",
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
        "why_now": "Defensive positioning in Stagflation. People buy food/soap regardless.",
        "backtest": "43% win rate vs SPY. Works in Stagflation + Deflation as defensive hold.",
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
    "XLU": {
        "what":    "Utilities — electric companies, water, gas distributors. Regulated monopolies.",
        "why_now": "AI data center electricity demand is structural. Plus recession insurance.",
        "backtest": "50% win rate in Stagflation, +1.2% avg excess. Recent trend strong (+11.8% current period).",
        "outperforms_when": [
            "Fed cuts rates (utilities carry debt — lower rates = higher profits)",
            "AI data center buildout accelerates (massive electricity demand)",
            "Recession hits — people still pay electricity bills",
            "Risk-off environment — dividend yield becomes attractive",
        ],
        "underperforms_when": [
            "Rates rise — utility debt becomes more expensive",
            "Strong economy — money goes to growth stocks",
        ],
        "watch": "Fed rate decisions + data center capex announcements (MSFT, GOOGL, AMZN)",
    },
    "QQQ": {
        "what":    "Top 100 Nasdaq stocks — NVDA, AAPL, MSFT, GOOGL, META, AMZN",
        "why_now": "75% backtest win rate in Goldilocks. Currently AVOID in Stagflation.",
        "backtest": "75% win rate in Goldilocks. Buy trigger: regime shifts to Goldilocks.",
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
        "why_now": "Currently AVOID — inflation too high. Buy trigger: regime shifts to Deflation.",
        "backtest": "43% win rate vs SPY overall. Shines in crisis (2008: +17.9% excess).",
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
    "XLI": {
        "what":    "US Industrials — Caterpillar, Honeywell, GE, Boeing, Deere",
        "why_now": "69% backtest win rate. Infrastructure spending + defense demand.",
        "backtest": "69% win rate vs SPY, +1.4% avg excess. Best regime pick for Reflation.",
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
    "GURU": {
        "what":    "Global X Guru ETF — tracks top hedge fund picks from 13F filings",
        "why_now": "Backtest winner in Reflation (+8.0% avg) and Deflation (+6.4% avg).",
        "backtest": "Beats SPY 46% of periods, but dominates in Reflation and Deflation. Weak in Stagflation (+1.4%).",
        "outperforms_when": [
            "Trending markets (up or down) — hedge funds pick winners",
            "Reflation — smart money rotates into commodities/cyclicals early",
            "Deflation — hedge funds move to defensive quality stocks",
            "Stock-picking environment (not index-driven)",
        ],
        "underperforms_when": [
            "Stagflation — hedge funds get caught like everyone else",
            "Rapid regime changes — 13F data is 45 days old",
            "Broad market panic — even smart money sells",
        ],
        "watch": "13F filing season (Feb/May/Aug/Nov) — holdings update quarterly",
    },
    "BRK-B": {
        "what":    "Berkshire Hathaway Class B — Warren Buffett's entire portfolio in one stock",
        "why_now": "Buffett's quality + cash pile ($300B+). Best performer in Goldilocks (+4.5% avg).",
        "backtest": "Beats SPY 40% of periods. Excels in Goldilocks and crisis moments (2007: +19.8%).",
        "outperforms_when": [
            "Goldilocks — quality companies with pricing power thrive",
            "Market stress — massive cash pile allows buying distressed assets",
            "Insurance profits — Berkshire earns float income in any environment",
            "Value rotation — Buffett holdings are classic value stocks",
        ],
        "underperforms_when": [
            "Strong momentum/growth markets — Buffett doesn't own high-growth tech",
            "Stagflation — even quality stocks suffer (but less than most)",
            "Rapid tech disruption periods — portfolio is old-economy heavy",
        ],
        "watch": "Berkshire annual letter (Feb) + quarterly earnings for cash deployment signals",
    },
    "SPY": {
        "what":    "S&P 500 index — 500 largest US companies. The benchmark everything is measured against.",
        "why_now": "King of Goldilocks. Hard to beat in good times — just own the market.",
        "backtest": "THE benchmark. Regime picks only beat SPY 44% of periods, but beat 60/40 52%.",
        "outperforms_when": [
            "Goldilocks — broad market rallies lift all boats",
            "Strong corporate earnings across sectors",
            "Fed cutting rates — cheap money flows into equities",
            "Global investors buying US assets (dollar strength)",
        ],
        "underperforms_when": [
            "Stagflation — growth stocks (heavy in SPY) get crushed",
            "Deflation — flight to bonds, not equities",
            "Sector-specific shocks — SPY is concentrated in tech",
        ],
        "watch": "Earnings season (Jan/Apr/Jul/Oct) — forward guidance drives direction",
    },
    "IWM": {
        "what":    "Russell 2000 — 2000 smallest US public companies. Risk-on signal.",
        "why_now": "Small caps lead when economy is strong and rates are falling.",
        "backtest": "62% win rate in Goldilocks (small sample). High beta — amplifies market moves.",
        "outperforms_when": [
            "Economic expansion confirmed — small companies grow faster",
            "Fed cutting rates — small caps are most rate-sensitive",
            "Domestic US economy strong — less export exposed than large caps",
            "Risk appetite high — investors reach for growth",
        ],
        "underperforms_when": [
            "Recession — small companies fail first",
            "Rising rates — small caps carry more debt",
            "Risk-off — money flows to large cap safety",
        ],
        "watch": "Fed rate decisions + regional bank health — small caps need cheap credit",
    },
}

# ETF universe by regime — based on backtest results (2007-2026)
# Each regime uses whatever historically outperforms a 60/40 portfolio
REGIME_ETFS = {
    "Stagflation": [
        # Regime picks dominate here — backtest avg +3.1% vs SPY +2.2%, GURU +1.4%
        {"ticker": "XLE",  "name": "Energy stocks",       "conviction": 0.95, "note": "Oil shock direct play — 47% win, +2.4% avg"},
        {"ticker": "GLD",  "name": "Gold",                "conviction": 0.80, "note": "Safe haven + inflation hedge"},
        {"ticker": "DBC",  "name": "Commodities",         "conviction": 0.60, "note": "Broad commodity exposure"},
        {"ticker": "XLP",  "name": "Consumer staples",    "conviction": 0.45, "note": "Defensive — pricing power"},
        {"ticker": "XLU",  "name": "Utilities",           "conviction": 0.40, "note": "50% win rate + AI energy demand"},
    ],
    "Reflation": [
        # Growth regime — SPY does well, sector tilts add marginal alpha
        # SPY avg +7.5%, picks avg +6.2% — own the market + tilt toward cyclicals
        {"ticker": "SPY",  "name": "S&P 500",             "conviction": 0.90, "note": "Core holding — SPY avg +7.5% in Reflation, hard to beat"},
        {"ticker": "XLI",  "name": "Industrials",         "conviction": 0.70, "note": "Cyclical tilt — 88% win rate, +8.1% avg"},
        {"ticker": "IWM",  "name": "Small caps",          "conviction": 0.60, "note": "Small caps lead in early expansion — +8.1% avg"},
        {"ticker": "XLE",  "name": "Energy stocks",       "conviction": 0.45, "note": "Commodity inflation play — +8.1% avg"},
    ],
    "Goldilocks": [
        # Best environment for growth — SPY core + high-growth tilts
        {"ticker": "SPY",  "name": "S&P 500",             "conviction": 0.95, "note": "Core holding — +6.2% avg, 100% win rate, hard to beat"},
        {"ticker": "QQQ",  "name": "Nasdaq 100",          "conviction": 0.85, "note": "Broad growth — +8.5% avg, 100% win rate, 19yr track record"},
        {"ticker": "ARKW", "name": "ARK Next Gen Internet","conviction": 0.70, "note": "High-growth tilt — +17% avg in Goldilocks, volatile but powerful"},
        {"ticker": "WCLD", "name": "Cloud Computing",     "conviction": 0.65, "note": "Cloud/SaaS growth — +16.5% avg, 100% win rate (limited data)"},
        {"ticker": "BOTZ", "name": "Robotics & AI",       "conviction": 0.55, "note": "AI/automation theme — +7.2% avg, 100% win rate, steady"},
    ],
    "Deflation": [
        # Cash is king in deflation (purchasing power rises) — implemented via higher cash reserve
        {"ticker": "TLT",  "name": "Long bonds",          "conviction": 0.90, "note": "Bond rally as rates get cut — best deflation asset"},
        {"ticker": "GLD",  "name": "Gold",                "conviction": 0.80, "note": "Store of value when financial stress rises"},
        {"ticker": "XLU",  "name": "Utilities",           "conviction": 0.50, "note": "Defensive yield — stable demand regardless of cycle"},
        {"ticker": "XLP",  "name": "Consumer staples",    "conviction": 0.40, "note": "Defensive earnings — people still buy essentials"},
    ],
}

# Backtest params — loaded from real backtest if available, otherwise defaults
# Uses vs-60/40 benchmark (where the framework has a real edge)
HALF_KELLY = 0.5
_BACKTEST_CACHE = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/backtest_results.json"
_REGIME_KELLY = {}
try:
    if os.path.exists(_BACKTEST_CACHE):
        with open(_BACKTEST_CACHE) as _bf:
            _bt = json.load(_bf)
        # Use vs-60/40 numbers (where the framework beats the common alternative)
        _vs6040 = _bt.get("vs_6040", {})
        ETF_WIN_RATE = _vs6040.get("win_rate", _bt.get("win_rate", 0.52))
        ETF_WIN_LOSS = _vs6040.get("win_loss_ratio", _bt.get("win_loss_ratio", 1.15))
        _REGIME_KELLY = _bt.get("regime_kelly", {})
        _BACKTEST_SOURCE = f"backtest vs 60/40 ({_bt.get('computed_date', '?')})"
    else:
        raise FileNotFoundError
except:
    ETF_WIN_RATE = 0.52
    ETF_WIN_LOSS = 1.15
    _BACKTEST_SOURCE = "default (run backtest_regime.py to compute real values)"

# Which strategy wins per regime (from backtest 2007-2026)
_REGIME_BEST_STRATEGY = {
    "Stagflation": "Regime ETF picks dominate here (+3.1% avg) — framework's sweet spot",
    "Reflation":   "GURU (hedge fund 13F picks) leads at +8.0% avg — included in allocation",
    "Goldilocks":  "SPY + BRK-B lead — index investing is hard to beat here",
    "Deflation":   "GURU leads at +6.4% avg — combined with defensive picks for crash protection",
}

def kelly_fraction(regime=None):
    """Compute Kelly fraction, optionally using regime-specific backtest params."""
    wr = ETF_WIN_RATE
    wl = ETF_WIN_LOSS
    if regime and regime in _REGIME_KELLY:
        rk = _REGIME_KELLY[regime]
        # Only use regime-specific params if there's a positive Kelly
        r_wr = rk.get("win_rate", wr)
        r_wl = rk.get("win_loss_ratio", wl)
        r_q  = 1 - r_wr
        r_f  = (r_wr * r_wl - r_q) / r_wl if r_wl > 0 else 0
        if r_f > 0:
            wr = r_wr
            wl = r_wl
    q = 1 - wr
    f = (wr * wl - q) / wl if wl > 0 else 0
    return max(0, f * HALF_KELLY)

def get_dynamic_convictions():
    """Load ETF conviction overrides and cash target from AI synthesis cache.
    Returns (convictions_dict_or_None, cash_pct_or_None)."""
    cache = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/geo_synthesis.json"
    convictions = None
    cash_pct = None
    try:
        if os.path.exists(cache):
            with open(cache) as f:
                data = json.load(f)
            raw = data.get("etf_convictions")
            if raw and isinstance(raw, dict):
                convictions = {
                    k: max(0.5, min(1.0, float(v)))
                    for k, v in raw.items()
                }
            alloc = data.get("suggested_allocation", {})
            if "cash" in alloc:
                cash_pct = max(5, min(50, int(alloc["cash"])))
    except Exception:
        pass
    return convictions, cash_pct

def _get_regime_start_date():
    """Get regime start date from AI synthesis cache, fallback to 6 months ago."""
    cache = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/geo_synthesis.json"
    try:
        if os.path.exists(cache):
            with open(cache) as f:
                data = json.load(f)
            date_str = data.get("regime_start_date")
            if date_str and len(date_str) >= 10:
                from datetime import datetime
                datetime.strptime(date_str[:10], "%Y-%m-%d")
                return date_str[:10]
    except:
        pass
    # Fallback: 6 months ago
    from datetime import datetime, timedelta
    return (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")


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

def get_etf_timing(ticker):
    """Compute buy-timing signals for an ETF.
    Returns dict with rsi, sma_pct (price vs 20d SMA), pullback (from 50d high),
    signal ('BUY NOW', 'WAIT', 'FAIR VALUE'), and score (0-100, higher = better buy).
    """
    try:
        import yfinance as yf
        hist = yf.Ticker(ticker).history(period="6mo")
        if len(hist) < 50:
            return None
        close = hist["Close"]
        price = close.iloc[-1]

        # RSI(14)
        delta = close.diff()
        gain = delta.where(delta > 0, 0.0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0.0)).rolling(14).mean()
        rs = gain.iloc[-1] / loss.iloc[-1] if loss.iloc[-1] != 0 else 100
        rsi = round(100 - (100 / (1 + rs)), 1)

        # Price vs 20-day SMA (% above/below)
        sma20 = close.rolling(20).mean().iloc[-1]
        sma_pct = round((price - sma20) / sma20 * 100, 1)

        # Pullback from 50-day high
        high_50d = close.iloc[-50:].max()
        pullback = round((price - high_50d) / high_50d * 100, 1)

        # Composite score: 0-100 (higher = better time to buy)
        # RSI component: RSI 30 → 100pts, RSI 50 → 50pts, RSI 70 → 0pts
        rsi_score = max(0, min(100, (70 - rsi) / 40 * 100))
        # SMA component: -5% below SMA → 100pts, at SMA → 40pts, +5% above → 0pts
        sma_score = max(0, min(100, (5 - sma_pct) / 10 * 100))
        # Pullback component: -10% pullback → 100pts, 0% → 20pts
        pull_score = max(0, min(100, (-pullback) / 10 * 100))

        score = round(rsi_score * 0.4 + sma_score * 0.3 + pull_score * 0.3)

        if score >= 65:
            signal = "🟢 BUY NOW"
        elif score >= 40:
            signal = "🟡 FAIR VALUE"
        else:
            signal = "🔴 WAIT"

        return {
            "rsi": rsi, "sma_pct": sma_pct, "pullback": pullback,
            "score": score, "signal": signal, "price": round(price, 2),
            "sma20": round(sma20, 2), "high_50d": round(high_50d, 2),
        }
    except:
        return None


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

def get_etf_return(ticker, start=None):
    """Get ETF return since regime started."""
    try:
        import yfinance as yf
        from datetime import datetime
        if start is None:
            start = _get_regime_start_date()
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

        bt = info.get("backtest", "")
        if bt:
            print(f"  📊 Backtest: {bt}")

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

def print_buy_timing(etfs):
    """Show buy-timing signals for each ETF based on technicals."""
    print(f"\n{'='*70}")
    print(f"  ⏰ BUY TIMING — which ETFs to buy now vs wait")
    print(f"{'='*70}")
    print(f"  Uses RSI(14), price vs 20d SMA, and pullback from 50d high")
    print(f"  Higher score = better entry point right now\n")

    print(f"  {'ETF':<6} {'Signal':<14} {'Score':>5}  {'RSI':>5}  "
          f"{'vs SMA':>7}  {'Pullback':>8}  Reasoning")
    print(f"  {'─'*6} {'─'*14} {'─'*5}  {'─'*5}  "
          f"{'─'*7}  {'─'*8}  {'─'*30}")

    results = []
    for etf in etfs:
        t = get_etf_timing(etf["ticker"])
        if t:
            results.append((etf, t))

            reasons = []
            if t["rsi"] < 30:
                reasons.append("oversold")
            elif t["rsi"] > 70:
                reasons.append("overbought")
            if t["sma_pct"] < -2:
                reasons.append(f"below SMA")
            elif t["sma_pct"] > 3:
                reasons.append("extended above SMA")
            if t["pullback"] < -5:
                reasons.append(f"dip from high")
            if not reasons:
                reasons.append("neutral technicals")

            print(f"  {etf['ticker']:<6} {t['signal']:<14} {t['score']:>5}  "
                  f"{t['rsi']:>5.1f}  {t['sma_pct']:>+6.1f}%  "
                  f"{t['pullback']:>+7.1f}%  {', '.join(reasons)}")
        else:
            print(f"  {etf['ticker']:<6} {'❓ No data':<14}")

    # Summary
    buys = [r for r in results if r[1]["score"] >= 65]
    waits = [r for r in results if r[1]["score"] < 40]

    print(f"\n  {'─'*68}")
    if buys:
        tickers = ", ".join(r[0]["ticker"] for r in sorted(buys, key=lambda x: -x[1]["score"]))
        print(f"  🟢 Good entry now:  {tickers}")
    if waits:
        tickers = ", ".join(r[0]["ticker"] for r in waits)
        print(f"  🔴 Consider waiting: {tickers} — extended/overbought")
    if not buys and not waits:
        print(f"  🟡 All ETFs at fair value — no strong timing signal")

    print(f"\n  ⚠️  Timing is secondary to regime. If regime says buy, DCA in.")
    print(f"     These signals help optimise entry, not replace allocation.")
    print(f"\n{'='*70}\n")


def print_deploy_capital(etfs, regime):
    """Advise where to deploy new capital based on allocation + timing signals."""
    try:
        amount = float(input("\n  Amount to deploy ($): ").strip() or "0")
    except (ValueError, EOFError, KeyboardInterrupt):
        return
    if amount <= 0:
        print("  No amount entered.")
        return

    REGIME_EMOJIS = {
        "Reflation": "🟡", "Stagflation": "🔴",
        "Deflation": "🔵", "Goldilocks":  "🟢"
    }

    print(f"\n{'='*70}")
    print(f"  💰 DEPLOY ${amount:,.0f} — {REGIME_EMOJIS.get(regime,'')} {regime}")
    print(f"  Combining regime allocation with buy timing signals")
    print(f"{'='*70}")

    # Get timing data for each ETF
    etf_data = []
    for etf in etfs:
        timing = get_etf_timing(etf["ticker"])
        price  = get_etf_price(etf["ticker"]) if not timing else timing.get("price")
        etf_data.append({
            "ticker":     etf["ticker"],
            "name":       etf["name"],
            "conviction": etf["conviction"],
            "timing":     timing,
            "price":      price,
        })

    # Score each ETF: base conviction adjusted by timing
    # Timing score 0-100 → multiplier 0.5x to 1.5x
    conv_total = sum(e["conviction"] for e in etf_data)
    for e in etf_data:
        t_score = e["timing"]["score"] if e["timing"] else 50
        # timing multiplier: score 0 → 0.6x, score 50 → 1.0x, score 100 → 1.4x
        e["timing_mult"] = 0.6 + (t_score / 100) * 0.8
        e["adjusted_conv"] = e["conviction"] * e["timing_mult"]

    adj_total = sum(e["adjusted_conv"] for e in etf_data)

    # Allocate the capital
    CASH_HOLD = 0.0  # No cash buffer for new capital deployment
    deploy_total = amount * (1 - CASH_HOLD)

    print(f"\n  {'ETF':<7} {'Timing':<14} {'Base':>5} {'Adj':>5} "
          f"{'Deploy':>9} {'Shares':>7}  Action")
    print(f"  {'─'*7} {'─'*14} {'─'*5} {'─'*5} "
          f"{'─'*9} {'─'*7}  {'─'*25}")

    buy_now = []
    wait    = []

    for e in sorted(etf_data, key=lambda x: -x["adjusted_conv"]):
        alloc_pct = e["adjusted_conv"] / adj_total
        deploy    = round(deploy_total * alloc_pct)
        shares    = int(deploy / e["price"]) if e["price"] and e["price"] > 0 else 0
        price_str = f"${e['price']:.2f}" if e["price"] else "n/a"

        t = e["timing"]
        if t:
            signal = t["signal"]
            score  = t["score"]
        else:
            signal = "❓ No data"
            score  = 50

        if score >= 65:
            action = f"BUY {shares} @ {price_str}"
            buy_now.append((e, deploy, shares))
        elif score >= 40:
            action = f"buy {shares} @ {price_str}"
            buy_now.append((e, deploy, shares))
        else:
            action = f"WAIT — hold ${deploy} cash"
            wait.append((e, deploy))

        print(f"  {e['ticker']:<7} {signal:<14} {e['conviction']*100:>4.0f}% "
              f"{alloc_pct*100:>4.0f}% "
              f"${deploy:>8,} {shares:>7}  {action}")

    # Summary
    buy_total  = sum(d for _, d, _ in buy_now)
    wait_total = sum(d for _, d in wait)

    print(f"\n  {'─'*68}")
    print(f"  Deploy now:  ${buy_total:>8,.0f}  "
          f"({', '.join(e['ticker'] for e, _, _ in buy_now)})")
    if wait:
        print(f"  Hold cash:   ${wait_total:>8,.0f}  "
              f"({', '.join(e['ticker'] for e, _ in wait)} — wait for better entry)")
        print(f"\n  Check again in 1-2 weeks. If timing improves, deploy the rest.")
    else:
        print(f"  All picks at fair value or better — deploy full amount now.")

    # Suggest a DCA plan if amount is large
    if amount >= 1000 and wait:
        print(f"\n  💡 DCA suggestion: deploy ${buy_total:,.0f} now, "
              f"${wait_total:,.0f} in 2 weeks if timing improves.")

    print(f"\n{'='*70}\n")


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

    # Show regime-specific backtest stats
    rk = _REGIME_KELLY.get(regime)
    if rk:
        print(f"\n  Win rate ({regime}): {rk['win_rate']:.0%}  |  "
              f"Win/loss: {rk['win_loss_ratio']:.2f}x  |  "
              f"Obs: {rk['observations']}")
    else:
        print(f"\n  Win rate (global): {ETF_WIN_RATE:.0%}  |  "
              f"Win/loss: {ETF_WIN_LOSS:.2f}x")

    # Strategy insight from backtest
    strategy_note = _REGIME_BEST_STRATEGY.get(regime, "")
    if strategy_note:
        print(f"  📊 {strategy_note}")

    print(f"  Portfolio: ${portfolio_value:,.0f}")

    # Check for regime transition
    transition_regime = None
    transition_weight = 0  # 0 = no transition, 0.3 = early, 0.5 = strong
    try:
        from transition import assess_transitions
        from fred import get_all as _fred_get_all
        from quadrant import get_quadrant as _get_q
        import contextlib as _ctx2, io as _io2
        with _ctx2.redirect_stdout(_io2.StringIO()):
            _fd = _fred_get_all()
        _qr = _get_q(_fd)
        _trans = assess_transitions(_qr["growth"], _qr["inflation"])
        if _trans.get("likely_name") and _trans["likely_name"] != regime:
            transition_regime = _trans["likely_name"]
            n_warnings = len(_trans.get("warnings", []))
            n_severe = sum(1 for w in _trans.get("warnings", []) if w.get("severity") == "🔴")
            if n_severe >= 2:
                transition_weight = 0.40
            elif n_severe >= 1:
                transition_weight = 0.25
            elif n_warnings >= 2:
                transition_weight = 0.15
            else:
                transition_weight = 0.10
    except:
        pass

    etfs = REGIME_ETFS.get(regime, REGIME_ETFS["Reflation"])

    # If transitioning, build a blended ETF list
    if transition_regime and transition_weight > 0:
        trans_emoji = REGIME_EMOJIS.get(transition_regime, "❓")
        current_pct = round((1 - transition_weight) * 100)
        trans_pct   = round(transition_weight * 100)
        print(f"\n  ⚠️  TRANSITION DETECTED → {trans_emoji} {transition_regime}")
        print(f"  Blending: {current_pct}% {regime} / {trans_pct}% {transition_regime}")

        trans_etfs = REGIME_ETFS.get(transition_regime, [])
        trans_tickers = set(e["ticker"] for e in trans_etfs)

        # Sell priority: current holdings NOT in the incoming regime, worst fit first
        # ETFs that are "avoid" in the new regime should be sold first
        from performance import REGIME_ASSETS
        new_avoids = set()
        for label, (ticker, cat) in REGIME_ASSETS.get(transition_regime, {}).items():
            if "avoid" in cat.lower():
                new_avoids.add(ticker)

        sell_first = []   # in new regime's avoid list — sell immediately
        sell_later = []   # not in new regime but not avoided — can hold longer
        keep = []         # in both regimes — no action needed

        for etf in etfs:
            t = etf["ticker"]
            if t in trans_tickers:
                keep.append(etf)
            elif t in new_avoids:
                sell_first.append(etf)
            else:
                sell_later.append(etf)

        if sell_first or sell_later:
            print(f"\n  📉 SELL PRIORITY — rotate out of {regime} holdings:")
            if sell_first:
                print(f"  🔴 Sell first (avoided in {transition_regime}):")
                for etf in sell_first:
                    print(f"     {etf['ticker']:<7} {etf['name']}")
            if sell_later:
                print(f"  🟡 Sell when ready (not in {transition_regime}):")
                for etf in sell_later:
                    print(f"     {etf['ticker']:<7} {etf['name']}")
            if keep:
                print(f"  🟢 Keep (in both regimes):")
                for etf in keep:
                    print(f"     {etf['ticker']:<7} {etf['name']}")

        # Build blended allocation: merge both ETF lists with weighted convictions
        blended = {}
        for etf in etfs:
            t = etf["ticker"]
            blended[t] = {**etf, "conviction": etf["conviction"] * (1 - transition_weight)}
        for etf in trans_etfs:
            t = etf["ticker"]
            if t in blended:
                blended[t]["conviction"] += etf["conviction"] * transition_weight
            else:
                blended[t] = {**etf, "conviction": etf["conviction"] * transition_weight,
                              "note": f"[→{transition_regime}] {etf['note']}"}
        etfs = sorted(blended.values(), key=lambda e: -e["conviction"])

    # Load dynamic convictions + cash target from AI synthesis cache
    dynamic_convictions, dynamic_cash = get_dynamic_convictions()
    has_dynamic = bool(dynamic_convictions)

    # Cash buffer: AI-driven or hardcoded 15%
    DEFAULT_CASH = 15
    cash_target = dynamic_cash if dynamic_cash is not None else DEFAULT_CASH
    cash_source = "[AI]" if dynamic_cash is not None else "[HC]"
    MAX_INVESTED = (100 - cash_target) / 100.0

    print(f"\n  Fetching prices...")
    if has_dynamic:
        print(f"  📡 Using AI-dynamic conviction levels from synthesis cache")
    else:
        print(f"  📌 Using hardcoded conviction levels (run geo synthesis to enable AI levels)")
    print(f"  💰 Cash buffer: {cash_target}% {cash_source}")

    print(f"\n  {'─'*66}")
    print(f"  {'ETF':<6} {'Name':<22} {'Conv':>5} {'Src':<4}  {'Alloc':>7}  "
          f"{'Position':>10}  {'Return':>8}")
    print(f"  {'─'*6} {'─'*22} {'─'*5} {'─'*4}  {'─'*7}  "
          f"{'─'*10}  {'─'*8}")

    def effective_conviction(etf):
        if dynamic_convictions and etf["ticker"] in dynamic_convictions:
            return dynamic_convictions[etf["ticker"]], True
        return etf["conviction"], False

    # Distribute invested portion by conviction weight
    conv_total = sum(effective_conviction(e)[0] for e in etfs)

    total_pct = 0
    for etf in etfs:
        ticker              = etf["ticker"]
        conviction, is_ai   = effective_conviction(etf)
        src_tag             = "[AI]" if is_ai else "[HC]"

        # Allocation = conviction share of invested portion
        k_pct  = (conviction / conv_total) * MAX_INVESTED

        pos_val = round(portfolio_value * k_pct)
        price   = get_etf_price(ticker)
        shares  = int(pos_val / price) if price else 0
        ret     = get_etf_return(ticker)
        ret_str = f"{ret:+.1f}%" if ret is not None else "n/a"
        price_str = f"${price:.2f}" if price else "n/a"

        print(f"  {ticker:<6} {etf['name']:<22} {conviction*100:>4.0f}% {src_tag:<4}  "
              f"{k_pct*100:>6.1f}%  ${pos_val:>9,.0f}  {ret_str:>8}")
        print(f"         {etf['note']:<40} "
              f"@ {price_str} = {shares} shares")

        total_pct += k_pct * 100

    cash_pct = max(0, 100 - total_pct)
    cash_val = portfolio_value * cash_pct / 100

    print(f"\n  {'─'*66}")
    print(f"  {'Invested:':<30} {total_pct:>6.1f}%  "
          f"${portfolio_value * total_pct/100:>9,.0f}")
    print(f"  {'Cash (uninvested) ' + cash_source + ':':<30} {cash_pct:>6.1f}%  "
          f"${cash_val:>9,.0f}")

    # Live trigger monitor
    print(f"\n  {chr(9472)*66}")
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

    print(f"\n  ⚠️  {_BACKTEST_SOURCE}")
    print(f"     Benchmark: 60/40 portfolio (60% SPY + 40% AGG)")
    print(f"     Framework beats 60/40 but not SPY alone.")
    print(f"     Strongest edge in Stagflation — weakest in Reflation.")
    print(f"     Adjust cash % to your personal risk tolerance.")
    print(f"\n{'='*65}")
    try:
        _choice = input("  Press D to deploy capital, T for timing, I for insights, or Enter: ").strip().upper()
        if _choice == "D":
            # Use portfolio-aware deploy if holdings exist
            try:
                from portfolio import get_holdings, deploy_with_portfolio
                _holdings = get_holdings()
                if _holdings:
                    _amt = float(input("\n  Amount to deploy ($): ").strip() or "0")
                    if _amt > 0:
                        deploy_with_portfolio(_amt, etfs, regime)
                else:
                    print_deploy_capital(etfs, regime)
            except ImportError:
                print_deploy_capital(etfs, regime)
        elif _choice == "T":
            print_buy_timing(etfs)
        elif _choice == "I":
            print_etf_insights(etfs)
    except (EOFError, KeyboardInterrupt):
        pass

if __name__ == "__main__":
    try:
        val = float(input("\nPortfolio value ($): ").strip() or "10000")
    except:
        val = 10000
    print_macro_kelly(val)
