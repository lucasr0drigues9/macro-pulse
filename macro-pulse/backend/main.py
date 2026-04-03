"""
Macro Pulse — FastAPI backend
Wraps the existing Python CLI tool into REST endpoints.
"""

import sys
import os

# Resolve paths — works both locally and on Railway
# Locally: backend is at finance-projects/macro-pulse/backend/
# Railway: deployed from repo root, backend at /app/macro-pulse/backend/
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(_THIS_DIR))  # finance-projects/
MACRO = os.path.join(ROOT, "macro")

# If ROOT doesn't contain macro/, we're likely deployed from a different structure
# Try the Railway layout where repo root is /app
if not os.path.isdir(MACRO):
    ROOT = "/app"
    MACRO = os.path.join(ROOT, "macro")

sys.path.insert(0, ROOT)
sys.path.insert(0, MACRO)
sys.path.insert(0, _THIS_DIR)  # backend dir for emails module

# Change working directory to macro/ so cache paths resolve
if os.path.isdir(MACRO):
    os.chdir(MACRO)

# Seed cache on startup if empty (Railway wipes filesystem on deploy)
def _seed_cache_on_startup():
    import json
    try:
        from cache_seed import SEED_DATA
    except ImportError:
        return
    cache_dirs = [
        os.path.join(MACRO, ".macro_cache"),
        "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache",
    ]
    for cache_dir in cache_dirs:
        os.makedirs(cache_dir, exist_ok=True)
        for filename, content in SEED_DATA.items():
            fpath = os.path.join(cache_dir, filename)
            if not os.path.exists(fpath):
                with open(fpath, "w") as f:
                    json.dump(content, f)

_seed_cache_on_startup()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Macro Pulse API", version="0.2.0")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "0.2.0", "modes": list(MODE_CONFIG.keys())}


@app.post("/api/seed-cache")
async def seed_cache(request: Request):
    """Upload local cache files to production. Auth via cron secret."""
    import json
    cron_secret = os.getenv("CRON_SECRET", "")
    if cron_secret and request.headers.get("x-cron-secret") != cron_secret:
        return {"error": "Unauthorized"}
    body = await request.json()
    # Write to both possible cache locations (relative + hardcoded in geopolitical.py)
    cache_dirs = [
        os.path.join(MACRO, ".macro_cache"),
        "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache",
    ]
    written = []
    for cache_dir in cache_dirs:
        os.makedirs(cache_dir, exist_ok=True)
        for filename, content in body.items():
            fpath = os.path.join(cache_dir, filename)
            with open(fpath, "w") as f:
                json.dump(content, f)
    written = list(body.keys())
    return {"ok": True, "written": written}

# Mode configuration — affects regime confirmation and sizing
MODE_CONFIG = {
    "conservative": {"confirmation_months": 2, "early_rotation_pct": 0, "cash_pct": 25},
    "active":       {"confirmation_months": 1, "early_rotation_pct": 10, "cash_pct": 15},
    "aggressive":   {"confirmation_months": 0, "early_rotation_pct": 25, "cash_pct": 5},
}

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://macro-pulse.*\.vercel\.app|https://macro-pulse\.io|http://localhost:3000",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/regime")
def get_regime(mode: str = "active"):
    """Section 1 — Current regime indicator with both signals. Mode affects confirmation."""
    from macro_kelly import get_current_regime, REGIME_ETFS
    from fred import get_all
    from quadrant import get_quadrant
    from geopolitical import get_geopolitical_risks, get_synthesis
    from transition import assess_transitions

    mode_cfg = MODE_CONFIG.get(mode, MODE_CONFIG["active"])

    # Core regime data
    regime, fred_regime, lag_warning = get_current_regime()

    # FRED quadrant details
    fred_data = get_all()
    quadrant = get_quadrant(fred_data)

    # Geopolitical data
    geo = get_geopolitical_risks() or {}
    geo_regime = geo.get("overall_regime_bias", regime)

    # Early transition check
    early_transition = None
    transitions = None
    try:
        transitions = assess_transitions(quadrant["growth"], quadrant["inflation"])
        if transitions.get("likely_name") and transitions["likely_name"] != regime:
            flickering = [w["metric"] for w in transitions.get("warnings", [])]
            confirming = [
                k for k in ["gdp_change_pct", "unemp_change_pct", "retail_change_pct",
                            "cpi_change_pct", "pce_change_pct", "ppi_change_pct"]
                if k not in flickering
            ]
            early_transition = {
                "targetRegime": transitions["likely_name"],
                "flickeringIndicators": flickering,
                "confirmingIndicators": confirming,
            }
    except Exception:
        pass

    # Mode-adjusted regime: aggressive acts on early signals immediately
    confirmed_regime = regime
    if mode_cfg["confirmation_months"] == 0 and early_transition:
        # Aggressive: treat early signal as confirmed
        confirmed_regime = early_transition["targetRegime"]
    elif mode_cfg["confirmation_months"] == 1 and early_transition:
        # Active: if geo agrees with early signal, treat as confirmed
        if geo_regime == early_transition["targetRegime"]:
            confirmed_regime = early_transition["targetRegime"]

    # Synthesis for headline/regime start date
    synthesis = None
    try:
        import json
        cache_path = os.path.join(MACRO, ".macro_cache", "geo_synthesis.json")
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                synthesis = json.load(f)
    except Exception:
        pass

    regime_start = synthesis.get("regime_start_date", "2025-12-01") if synthesis else "2025-12-01"
    consecutive_months = _count_consecutive_months(confirmed_regime)

    # Early rotation recommendation based on mode
    early_rotation = None
    if early_transition and mode_cfg["early_rotation_pct"] > 0 and confirmed_regime == regime:
        target = early_transition["targetRegime"]
        target_etfs = REGIME_ETFS.get(target, [])
        rotation_pct = mode_cfg["early_rotation_pct"]
        early_rotation = {
            "targetRegime": target,
            "totalPct": rotation_pct,
            "positions": [
                {"ticker": e["ticker"], "name": e["name"], "weight": round(rotation_pct * e["conviction"] / sum(x["conviction"] for x in target_etfs[:3]))}
                for e in target_etfs[:3]
            ],
        }

    return {
        "confirmed": confirmed_regime,
        "consecutiveMonths": consecutive_months,
        "fredSignal": {
            "regime": fred_regime,
            "note": _build_fred_note(fred_data, quadrant),
            "lastUpdated": _latest_fred_date(fred_data),
        },
        "geoSignal": {
            "regime": geo_regime,
            "note": geo.get("overall_summary", "")[:120],
            "lastUpdated": _geo_cache_date(),
        },
        "lagWarning": lag_warning,
        "earlyTransition": early_transition,
        "earlyRotation": early_rotation,
        "regimeStartDate": regime_start,
        "regimeOrigin": _build_regime_origin(synthesis, confirmed_regime, regime_start),
        "mode": mode,
    }


@app.get("/api/performance")
def get_performance():
    """Section 2 — Asset performance for current regime picks vs avoids."""
    from macro_kelly import get_current_regime, get_etf_return, REGIME_ETFS

    regime, _, _ = get_current_regime()
    picks = REGIME_ETFS.get(regime, [])
    pick_tickers = {e["ticker"] for e in picks}

    # All ETFs to track
    all_etfs = {
        "XLE": "Energy Select SPDR", "GLD": "SPDR Gold Shares",
        "DBC": "Invesco DB Commodity", "XLP": "Consumer Staples SPDR",
        "XLU": "Utilities Select SPDR", "SPY": "S&P 500 ETF",
        "QQQ": "Nasdaq 100 ETF", "TLT": "20+ Year Treasury",
        "IWM": "Russell 2000 ETF", "GURU": "Global Guru ETF",
        "BRK-B": "Berkshire Hathaway", "XLI": "Industrials SPDR",
        "TIP": "TIPS Bond ETF", "VGK": "Europe ETF", "AGG": "US Agg Bond",
    }

    # Get regime start date
    regime_start = _get_regime_start()

    assets = []
    for ticker, name in all_etfs.items():
        ret = get_etf_return(ticker, regime_start)
        if ret is None:
            continue

        if ticker == "SPY":
            category = "benchmark"
        elif ticker in pick_tickers:
            category = "pick"
        else:
            category = "avoid"

        assets.append({
            "ticker": ticker,
            "name": name,
            "returnPct": round(ret, 1),
            "category": category,
        })

    # Sort: picks first, then benchmark, then avoids
    order = {"pick": 0, "benchmark": 1, "avoid": 2}
    assets.sort(key=lambda a: (order.get(a["category"], 3), -a["returnPct"]))

    return {
        "regime": regime,
        "regimeStartDate": regime_start,
        "assets": assets,
    }


@app.get("/api/allocation")
def get_allocation(mode: str = "active"):
    """Section 3 Part A — Regime weights with smart buy guidance. Mode changes allocation."""
    from macro_kelly import (
        get_current_regime, REGIME_ETFS, get_etf_timing,
        get_dynamic_convictions, kelly_fraction,
    )
    from transition import assess_transitions
    from fred import get_all
    from quadrant import get_quadrant

    mode_cfg = MODE_CONFIG.get(mode, MODE_CONFIG["active"])
    regime, fred_regime, lag_warning = get_current_regime()
    picks = REGIME_ETFS.get(regime, [])
    pick_tickers = {e["ticker"] for e in picks}

    # Dynamic conviction overrides from AI synthesis
    dyn_convictions, cash_pct = get_dynamic_convictions()

    # Kelly fraction — mode adjusts aggressiveness
    kelly = kelly_fraction(regime)

    # Fixed cash per mode — not derived from AI synthesis
    cash_target = mode_cfg["cash_pct"]

    # Check for early transition signals
    early_transition = None
    try:
        fred_data = get_all()
        quadrant = get_quadrant(fred_data)
        transitions = assess_transitions(quadrant["growth"], quadrant["inflation"])
        if transitions.get("likely_name") and transitions["likely_name"] != regime:
            early_transition = transitions["likely_name"]
    except Exception:
        pass

    # ── Build overweight list ──
    # Conservative: flat weights (averaged toward equal), more diversified
    # Active: conviction-proportional (standard)
    # Aggressive: conviction-proportional with less cash, acts faster
    overweight = []
    total_conviction = sum(
        _get_conviction(e["ticker"], e["conviction"], dyn_convictions)
        for e in picks
    )
    avg_conviction = total_conviction / len(picks) if picks else 1

    for etf in picks:
        ticker = etf["ticker"]
        conviction = _get_conviction(ticker, etf["conviction"], dyn_convictions)

        if mode == "conservative":
            # Flatten toward equal weight
            w = (conviction + avg_conviction) / 2
            weight = round(w / (total_conviction / 2 + avg_conviction * len(picks) / 2) * (100 - cash_target))
        else:
            # Active + Aggressive: conviction-proportional
            weight = round(conviction / total_conviction * (100 - cash_target))

        timing = get_etf_timing(ticker)
        if timing:
            score = timing["score"]
            assessment = "Still attractive" if score >= 65 else "Fairly valued" if score >= 40 else "Extended"
            price_info = {"price": timing["price"], "rsi": timing["rsi"], "score": timing["score"]}
        else:
            assessment = "Fairly valued"
            price_info = None

        overweight.append({
            "ticker": ticker,
            "name": etf["name"],
            "weight": weight,
            "conviction": round(conviction, 2),
            "priceAssessment": assessment,
            "rationale": etf["note"],
            "timing": price_info,
        })

    # ── Early rotation — Active and Aggressive add incoming regime positions ──
    early_rotation = None
    if early_transition and mode_cfg["early_rotation_pct"] > 0:
        target_etfs = REGIME_ETFS.get(early_transition, [])[:3]
        rotation_pct = mode_cfg["early_rotation_pct"]

        # Scale down main positions to make room
        scale = (100 - cash_target - rotation_pct) / (100 - cash_target) if (100 - cash_target) > 0 else 0.8
        for ow in overweight:
            ow["weight"] = round(ow["weight"] * scale)

        rotation_positions = []
        target_total = sum(e["conviction"] for e in target_etfs) if target_etfs else 1
        for etf in target_etfs:
            w = round(rotation_pct * etf["conviction"] / target_total)
            timing = get_etf_timing(etf["ticker"])
            rotation_positions.append({
                "ticker": etf["ticker"],
                "name": etf["name"],
                "weight": w,
                "conviction": round(etf["conviction"], 2),
                "priceAssessment": "Early entry" if not timing else (
                    "Still attractive" if timing["score"] >= 65 else "Fairly valued" if timing["score"] >= 40 else "Extended"
                ),
                "rationale": f"Early rotation into {early_transition} — starter position before confirmation",
            })

        early_rotation = {
            "targetRegime": early_transition,
            "totalPct": rotation_pct,
            "positions": rotation_positions,
        }

    # ── Underweight list ──
    all_avoid_etfs = {
        "QQQ": ("Nasdaq 100 ETF", "Growth stocks suffer from rising rates and declining consumer spending power."),
        "TLT": ("20+ Year Treasury", "Long duration bonds lose value as inflation expectations remain elevated."),
        "IWM": ("Russell 2000 ETF", "Small caps most exposed to economic slowdown and tightening credit."),
        "GURU": ("Global Guru ETF", "Superinvestor picks lag during stagflation — typically overweight growth."),
        "SPY": ("S&P 500 ETF", "Broad market drag from growth-heavy composition."),
        "BRK-B": ("Berkshire Hathaway", "Quality value underperforms when commodity scarcity dominates."),
        "XLI": ("Industrials SPDR", "Manufacturing contracts as input costs rise and demand falls."),
        "VGK": ("Europe ETF", "European economy more exposed to energy supply disruption."),
        "AGG": ("US Agg Bond", "Fixed income suffers when inflation is rising."),
        "TIP": ("TIPS Bond ETF", "TIPS provide some protection but less upside than commodities."),
        "XLE": ("Energy Select SPDR", "Energy underperforms without specific supply disruption."),
        "GLD": ("SPDR Gold Shares", "No inflation to hedge against."),
        "DBC": ("Invesco DB Commodity", "Commodity demand collapses with economic activity."),
        "XLP": ("Consumer Staples SPDR", "Defensive play unnecessary in growth regimes."),
        "XLU": ("Utilities Select SPDR", "Yield play loses appeal when growth is abundant."),
    }

    # Early rotation tickers shouldn't appear in avoid list
    rotation_tickers = {p["ticker"] for p in (early_rotation["positions"] if early_rotation else [])}
    underweight = []
    for ticker, (name, rationale) in all_avoid_etfs.items():
        if ticker not in pick_tickers and ticker not in rotation_tickers:
            underweight.append({"ticker": ticker, "name": name, "rationale": rationale})

    return {
        "regime": regime,
        "mode": mode,
        "kellyFraction": round(kelly, 4),
        "cashTarget": round(cash_target),
        "overweight": overweight,
        "underweight": underweight,
        "earlyRotation": early_rotation,
    }


@app.post("/api/calculate")
def calculate_allocation(body: dict):
    """Position calculator — sizes current regime picks using Kelly Criterion."""
    from macro_kelly import get_current_regime, REGIME_ETFS, get_dynamic_convictions, kelly_fraction

    portfolio_size = float(body.get("portfolioSize", 0))
    cash_available = float(body.get("cashAvailable", 0))
    currency = body.get("currency", "EUR")

    if cash_available <= 0:
        return {"error": "Cash available must be positive", "allocations": []}

    # Total investable = existing portfolio + new cash
    total_investable = portfolio_size + cash_available

    regime, _, _ = get_current_regime()
    picks = REGIME_ETFS.get(regime, [])
    dyn_convictions, cash_pct = get_dynamic_convictions()
    kelly = kelly_fraction(regime)

    # Simple rule: deploy + reserve = cash available. Nothing left over.
    cash_reserve_pct = min(30, max(10, cash_pct or 15)) / 100
    cash_reserve = round(cash_available * cash_reserve_pct)
    deployable = cash_available - cash_reserve

    # Allocate by conviction × value score — buy more of what's cheap
    from macro_kelly import get_etf_timing

    raw_scores = []
    for etf in picks:
        conviction = _get_conviction(etf["ticker"], etf["conviction"], dyn_convictions)
        timing = get_etf_timing(etf["ticker"])
        # Timing score: 0-100, higher = cheaper. Default 50 if no data.
        value_score = timing["score"] if timing else 50
        # Combined: conviction matters, but cheap ETFs get a boost
        # conviction (0.4-0.95) × value_multiplier (0.75-1.75)
        value_multiplier = 0.75 + (value_score / 100)
        raw_scores.append(conviction * value_multiplier)

    total_score = sum(raw_scores) if raw_scores else 1

    allocations = []
    for i, etf in enumerate(picks):
        conviction = _get_conviction(etf["ticker"], etf["conviction"], dyn_convictions)
        weight = raw_scores[i] / total_score if total_score > 0 else 1 / len(picks)
        amount = round(deployable * weight)
        allocations.append({
            "ticker": etf["ticker"],
            "name": etf["name"],
            "weight": round(weight * 100, 1),
            "amount": amount,
            "conviction": round(conviction, 2),
        })

    return {
        "regime": regime,
        "currency": currency,
        "portfolioSize": portfolio_size,
        "cashAvailable": cash_available,
        "deployable": round(deployable),
        "cashReserve": round(cash_reserve),
        "kellyFraction": round(kelly, 4),
        "allocations": allocations,
    }


@app.get("/api/calendar")
def get_calendar():
    """Section 4 — This week's economic releases with regime implications."""
    import json

    # Pull calendar scenarios from AI synthesis cache
    synthesis = _load_synthesis()
    calendar_scenarios = synthesis.get("calendar_scenarios", {}) if synthesis else {}
    watch_list = synthesis.get("watch_this_week", []) if synthesis else []

    # Build calendar from synthesis + hardcoded FRED release schedule
    events = []

    # CPI
    cpi = calendar_scenarios.get("cpi", {})
    events.append({
        "name": "CPI (March)",
        "source": "Bureau of Labor Statistics",
        "date": "2026-04-10",
        "day": "Thursday",
        "impact": "High",
        "implication": cpi.get("what_to_watch", "Energy component will dominate headline CPI."),
        "scenarios": {
            "high": cpi.get("high", ""),
            "low": cpi.get("low", ""),
            "inline": cpi.get("inline", ""),
        } if cpi else None,
    })

    # FOMC
    fomc = calendar_scenarios.get("fomc", {})
    events.append({
        "name": "FOMC Meeting",
        "source": "Federal Reserve",
        "date": "2026-04-28",
        "day": "Monday",
        "impact": "High",
        "implication": fomc.get("what_to_watch", "Watch for language on energy shock vs growth risks."),
        "scenarios": {
            "hold": fomc.get("hold", ""),
            "hike": fomc.get("hike", ""),
            "cut": fomc.get("cut", ""),
        } if fomc else None,
    })

    # 13F filings
    filings = calendar_scenarios.get("filings", {})
    events.append({
        "name": "13F Filing Deadline (Q1)",
        "source": "SEC EDGAR",
        "date": "2026-05-15",
        "day": "Thursday",
        "impact": "Medium",
        "implication": filings.get("what_to_watch", "Superinvestor positioning for Q1 2026."),
        "scenarios": None,
    })

    # Static releases for this week
    events.extend([
        {
            "name": "ISM Manufacturing PMI",
            "source": "ISM",
            "date": "2026-04-01",
            "day": "Tuesday",
            "impact": "High",
            "implication": "Below 50 confirms manufacturing contraction — supports stagflation read.",
            "scenarios": None,
        },
        {
            "name": "Initial Jobless Claims",
            "source": "Department of Labor",
            "date": "2026-04-03",
            "day": "Thursday",
            "impact": "Medium",
            "implication": "Rising claims would confirm growth slowdown leg of stagflation.",
            "scenarios": None,
        },
        {
            "name": "Retail Sales (March)",
            "source": "Census Bureau",
            "date": "2026-04-15",
            "day": "Tuesday",
            "impact": "High",
            "implication": "Consumer spending under pressure from energy costs — key growth signal.",
            "scenarios": None,
        },
    ])

    # Sort by date
    events.sort(key=lambda e: e["date"])

    return {"events": events, "watchList": watch_list}


@app.get("/api/triggers")
def get_triggers_endpoint():
    """Section 5 — Live regime change triggers."""
    import json

    # Try loading from cache first (already AI-generated)
    cache_path = os.path.join(MACRO, ".macro_cache", "regime_triggers.json")
    triggers = []
    try:
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                data = json.load(f)
            triggers = data.get("regime_triggers", [])
    except Exception:
        pass

    if not triggers:
        # Fallback: generate from live data
        try:
            from macro_kelly import get_current_regime, get_hormuz_transits
            from geopolitical import get_geopolitical_risks, get_triggers
            from fred import get_all
            from quadrant import get_quadrant

            regime, fred_regime, _ = get_current_regime()
            geo = get_geopolitical_risks()
            fred_data = get_all()
            quadrant = get_quadrant(fred_data)

            hormuz = get_hormuz_transits()
            oil_price = None
            try:
                from macro_kelly import get_etf_price
                oil_price = get_etf_price("CL=F")
            except Exception:
                pass

            cpi_val = None
            try:
                cpi_series = fred_data.get("cpi", [])
                if len(cpi_series) >= 2:
                    cpi_val = round((cpi_series[0][1] - cpi_series[1][1]) / cpi_series[1][1] * 100, 2)
            except Exception:
                pass

            triggers = get_triggers(
                geo, quadrant["quadrant"]["name"],
                oil_price=oil_price,
                hormuz_count=hormuz.get("count") if hormuz else None,
                cpi=cpi_val,
            )
        except Exception:
            pass

    # Normalize status field: API returns "met"/"not_met", frontend expects "crisis"/"watch"/"stable"
    for t in triggers:
        status = t.get("status", "not_met")
        urgency = t.get("urgency", "LOW")
        if status == "met":
            t["status"] = "crisis"
        elif urgency == "HIGH":
            t["status"] = "watch"
        else:
            t["status"] = "stable"

    return {"triggers": triggers}


@app.get("/api/backtest")
def get_backtest():
    """Section 7 — Regime history and backtesting data."""
    import json
    from backtest_regime import (
        build_regime_timeline, identify_periods, compute_return,
        compute_portfolio_return, REGIME_ETFS as BT_REGIME_ETFS,
    )

    # Load pre-computed summary
    summary = {}
    try:
        with open(os.path.join(MACRO, ".macro_cache", "backtest_results.json")) as f:
            summary = json.load(f)
    except Exception:
        pass

    # Load cached ETF prices
    prices = {}
    cache_dir = os.path.join(MACRO, ".macro_cache")
    for fname in os.listdir(cache_dir):
        if fname.startswith("backtest_etf_") and fname.endswith(".json"):
            ticker = fname.replace("backtest_etf_", "").replace(".json", "")
            try:
                with open(os.path.join(cache_dir, fname)) as f:
                    prices[ticker] = json.load(f)
            except Exception:
                pass

    # Build regime timeline and periods
    try:
        timeline = build_regime_timeline()
        periods = identify_periods(timeline)
    except Exception:
        periods = []

    # Build timeline entries with returns
    timeline_data = []
    for period in periods:
        regime = period["regime"]
        start = period["start"]
        end = period["end"]
        if start == end:
            continue

        # Duration in months
        try:
            from datetime import datetime
            s = datetime.strptime(start, "%Y-%m-%d")
            e = datetime.strptime(end, "%Y-%m-%d")
            months = max(1, (e.year - s.year) * 12 + (e.month - s.month))
        except Exception:
            months = 1

        spy_ret = compute_return(prices.get("SPY", {}), start, end)
        picks_ret = compute_portfolio_return(
            prices, BT_REGIME_ETFS.get(regime, []), start, end
        )

        # Positive return = win, negative = loss (not vs SPY — absolute)
        profitable = (picks_ret or 0) > 0 if picks_ret is not None else None
        beat_spy = (picks_ret or 0) > (spy_ret or 0) if picks_ret is not None and spy_ret is not None else None

        timeline_data.append({
            "regime": regime,
            "start": start[:7],
            "end": end[:7],
            "months": months,
            "picksReturn": picks_ret,
            "spyReturn": spy_ret,
            "profitable": profitable,
            "beatSpy": beat_spy,
        })

    timeline_data.reverse()  # Most recent first

    # Compute scorecard from real data
    valid = [t for t in timeline_data if t["profitable"] is not None]
    profitable_count = len([t for t in valid if t["profitable"]])
    profitable_pct = round(profitable_count / len(valid) * 100, 1) if valid else 0
    beat_spy_count = len([t for t in valid if t.get("beatSpy")])
    beat_spy_pct = round(beat_spy_count / len(valid) * 100, 1) if valid else 0
    total_regimes = len(timeline_data)

    # Best and worst calls by absolute return
    best_call = max(valid, key=lambda t: t["picksReturn"] or 0) if valid else None
    worst_call = min(valid, key=lambda t: t["picksReturn"] or 0) if valid else None

    # Per-regime breakdown
    regime_breakdown = {}
    for regime_name in ["Stagflation", "Goldilocks", "Reflation", "Deflation"]:
        rk = summary.get("regime_kelly", {}).get(regime_name, {})
        regime_periods = [t for t in timeline_data if t["regime"] == regime_name]
        regime_valid = [t for t in regime_periods if t["profitable"] is not None]
        regime_profitable = [t for t in regime_valid if t["profitable"]]
        regime_breakdown[regime_name] = {
            "count": len(regime_periods),
            "winRate": round(len(regime_profitable) / len(regime_valid) * 100, 1) if regime_valid else 0,
            "kellyHalf": round(rk.get("kelly_half", 0) * 100, 1),
            "observations": rk.get("observations", 0),
        }

    return {
        "totalRegimes": total_regimes,
        "yearRange": f"2007–2026",
        "profitableCount": profitable_count,
        "profitablePct": profitable_pct,
        "beatSpyCount": beat_spy_count,
        "beatSpyPct": beat_spy_pct,
        "avoidAccuracy": round(summary.get("avoid_accuracy", 0) * 100, 1),
        "bestCall": {
            "start": best_call["start"],
            "regime": best_call["regime"],
            "picksReturn": best_call["picksReturn"],
            "spyReturn": best_call["spyReturn"],
        } if best_call else None,
        "worstCall": {
            "start": worst_call["start"],
            "regime": worst_call["regime"],
            "picksReturn": worst_call["picksReturn"],
            "spyReturn": worst_call["spyReturn"],
        } if worst_call else None,
        "regimeBreakdown": regime_breakdown,
        "timeline": timeline_data[:20],  # Last 20 periods
    }


SUBSCRIBERS_FILE = os.path.join(MACRO, ".macro_cache", "subscribers.json")

# Wire subscribers file to email module
import emails as _emails_mod
_emails_mod.SUBSCRIBERS_FILE = SUBSCRIBERS_FILE


@app.post("/api/subscribe")
def subscribe(body: dict):
    """Email capture — stores subscribers locally (Supabase in production)."""
    import json
    from datetime import datetime

    email = body.get("email", "").strip().lower()
    if not email or "@" not in email:
        return {"error": "Invalid email", "ok": False}

    event_alerts = body.get("eventAlerts", True)
    regime_alerts = body.get("regimeAlerts", True)
    weekly_pulse = body.get("weeklyPulse", False)
    waitlist_features = body.get("waitlistFeatures", [])

    # Load existing subscribers
    subscribers = []
    try:
        if os.path.exists(SUBSCRIBERS_FILE):
            with open(SUBSCRIBERS_FILE) as f:
                subscribers = json.load(f)
    except Exception:
        subscribers = []

    # Check for duplicate
    existing = next((s for s in subscribers if s["email"] == email), None)
    if existing:
        existing["eventAlerts"] = event_alerts
        existing["regimeAlerts"] = regime_alerts
        existing["weeklyPulse"] = weekly_pulse
        if waitlist_features:
            existing["waitlistFeatures"] = list(set(existing.get("waitlistFeatures", []) + waitlist_features))
        existing["updatedAt"] = datetime.now().isoformat()
    else:
        subscribers.append({
            "email": email,
            "eventAlerts": event_alerts,
            "regimeAlerts": regime_alerts,
            "weeklyPulse": weekly_pulse,
            "waitlistFeatures": waitlist_features,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        })

    with open(SUBSCRIBERS_FILE, "w") as f:
        json.dump(subscribers, f, indent=2)

    return {"ok": True, "message": "Subscribed successfully"}


@app.get("/api/transition")
def get_transition_outlook():
    """Preparing for Transition — next regime probabilities + cheap ETFs to position early."""
    from macro_kelly import get_current_regime, REGIME_ETFS, get_etf_timing
    from fred import get_all
    from quadrant import get_quadrant
    from transition import assess_transitions, TRANSITION_GUIDANCE, NEXT_QUADRANT

    regime, fred_regime, _ = get_current_regime()

    # Get transition signals from FRED data
    try:
        fred_data = get_all()
        quadrant = get_quadrant(fred_data)
        transitions = assess_transitions(quadrant["growth"], quadrant["inflation"])
    except Exception:
        transitions = {"warnings": [], "likely_name": None}

    # Get geo synthesis for scenario-based transitions
    synthesis = _load_synthesis()
    bull_case = synthesis.get("bull_case", {}) if synthesis else {}
    bear_case = synthesis.get("bear_case", {}) if synthesis else {}

    # Build list of possible next regimes with probability scores
    # Score based on: FRED flickering signals + geo scenario alignment
    possible_regimes = {}

    # From FRED transition signals
    likely = transitions.get("likely_name")
    if likely and likely != regime:
        flickering_count = len(transitions.get("warnings", []))
        possible_regimes[likely] = {
            "score": 40 + flickering_count * 15,  # 40-100 based on how many indicators
            "source": "FRED indicators flickering",
            "signals": [w["message"] for w in transitions.get("warnings", [])],
        }

    # From geo synthesis scenarios
    # Bull case often points to Goldilocks/Reflation, bear case to Stagflation/Deflation
    for case, label in [(bull_case, "bull"), (bear_case, "bear")]:
        beneficiaries = case.get("beneficiaries", []) if label == "bull" else []
        victims = case.get("victims", []) if label == "bear" else []
        trigger = case.get("trigger", "")
        scenario = case.get("scenario", "")

        # Determine which regime the scenario points to
        if label == "bull" and beneficiaries:
            # Bull scenario usually points away from current crisis
            growth_assets = {"QQQ", "SPY", "GURU", "IWM", "XLI", "BRK-B"}
            if set(beneficiaries) & growth_assets:
                target = "Goldilocks" if regime in ("Stagflation", "Deflation") else "Reflation"
                if target not in possible_regimes:
                    possible_regimes[target] = {"score": 25, "source": "", "signals": []}
                possible_regimes[target]["score"] += 15
                possible_regimes[target]["source"] = f"Geo bull scenario: {scenario[:80]}"
                possible_regimes[target]["signals"].append(f"Trigger: {trigger}")

        elif label == "bear" and victims:
            commodity_assets = {"XLE", "GLD", "DBC"}
            if set(victims) & commodity_assets:
                target = "Deflation" if regime in ("Stagflation", "Reflation") else "Stagflation"
            else:
                target = "Stagflation" if regime != "Stagflation" else "Deflation"
            if target not in possible_regimes and target != regime:
                possible_regimes[target] = {"score": 20, "source": "", "signals": []}
                if target in possible_regimes:
                    possible_regimes[target]["score"] += 10
                    possible_regimes[target]["source"] = f"Geo bear scenario: {scenario[:80]}"
                    possible_regimes[target]["signals"].append(f"Trigger: {trigger}")

    # Also consider the natural cycle — what typically follows this regime
    key = (quadrant["growth"]["direction"], quadrant["inflation"]["direction"]) if 'quadrant' in dir() else ("rising", "rising")
    try:
        next_opts = NEXT_QUADRANT.get(key, {})
        for direction, next_regime_desc in next_opts.items():
            # Extract regime name from description like "Stagflation 🔴 — worst environment"
            for rname in ["Stagflation", "Goldilocks", "Reflation", "Deflation"]:
                if rname in str(next_regime_desc) and rname != regime:
                    if rname not in possible_regimes:
                        possible_regimes[rname] = {"score": 15, "source": f"Natural cycle: {direction.replace('_', ' ')}", "signals": []}
    except Exception:
        pass

    # Sort by probability score
    ranked = sorted(possible_regimes.items(), key=lambda x: -x[1]["score"])

    # For each possible regime, get ETFs + their current prices
    outlook = []
    for target_regime, info in ranked[:3]:  # Top 3 possible transitions
        guidance = TRANSITION_GUIDANCE.get(target_regime, {})
        regime_etfs = REGIME_ETFS.get(target_regime, [])

        etf_opportunities = []
        for etf in regime_etfs:
            timing = get_etf_timing(etf["ticker"])
            if timing:
                score = timing["score"]
                assessment = "Cheap — good entry" if score >= 65 else "Fair price" if score >= 40 else "Expensive — wait"
                etf_opportunities.append({
                    "ticker": etf["ticker"],
                    "name": etf["name"],
                    "price": timing["price"],
                    "rsi": timing["rsi"],
                    "timingScore": timing["score"],
                    "priceAssessment": assessment,
                    "conviction": etf["conviction"],
                })
            else:
                etf_opportunities.append({
                    "ticker": etf["ticker"],
                    "name": etf["name"],
                    "price": None,
                    "rsi": None,
                    "timingScore": 50,
                    "priceAssessment": "No data",
                    "conviction": etf["conviction"],
                })

        # Sort: cheapest first
        etf_opportunities.sort(key=lambda e: -e["timingScore"])

        outlook.append({
            "regime": target_regime,
            "probability": min(info["score"], 100),
            "source": info["source"],
            "signals": info["signals"][:3],
            "description": guidance.get("description", ""),
            "confirmationSignals": guidance.get("confirmation_signals", [])[:3],
            "etfs": etf_opportunities,
        })

    # Historical duration stats for current regime
    duration_stats = None
    try:
        from backtest_regime import build_regime_timeline, identify_periods
        from datetime import datetime as _dt
        from collections import defaultdict
        timeline = build_regime_timeline()
        periods = identify_periods(timeline)
        durations = defaultdict(list)
        for p in periods:
            s = _dt.strptime(p["start"], "%Y-%m-%d")
            e = _dt.strptime(p["end"], "%Y-%m-%d")
            months = max(1, (e.year - s.year) * 12 + (e.month - s.month))
            durations[p["regime"]].append(months)
        d = durations.get(regime, [])
        if d:
            duration_stats = {
                "avg": round(sum(d) / len(d), 1),
                "min": min(d),
                "max": max(d),
                "periods": len(d),
            }
    except Exception:
        pass

    return {
        "currentRegime": regime,
        "durationStats": duration_stats,
        "outlook": outlook,
    }


@app.post("/api/send-event-alert")
async def send_event_alert(request: Request):
    """Send a post-event analysis email for a specific economic release."""
    cron_secret = os.getenv("CRON_SECRET", "")
    if cron_secret and request.headers.get("x-cron-secret") != cron_secret:
        return {"error": "Unauthorized"}

    body = await request.json()
    event_name = body.get("eventName", "")
    if not event_name:
        return {"error": "eventName required"}

    from macro_kelly import get_current_regime
    import requests as req

    regime, fred_regime, _ = get_current_regime()
    synthesis = _load_synthesis()
    situation = synthesis.get("situation", "") if synthesis else ""

    # Use Claude to generate the analysis
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not anthropic_key:
        return {"error": "No Anthropic API key"}

    # Get upcoming calendar for context
    calendar_events = []
    try:
        cal = get_calendar()
        calendar_events = cal.get("events", [])
    except Exception:
        pass
    upcoming = [e for e in calendar_events if e.get("date", "") > body.get("eventDate", "2026-04-01")]
    upcoming_text = "\n".join(f"- {e['name']} ({e['date']})" for e in upcoming[:5]) if upcoming else "Check macro-pulse.io for upcoming releases"

    prompt = f"""You are a macro economist writing a brief post-event email for investors.

Event: {event_name}
Current regime: {regime} (confirmed by geopolitical signal)
FRED regime: {fred_regime}
Current situation: {situation}

Upcoming releases after this event:
{upcoming_text}

Write three short paragraphs (2-3 sentences each):
1. "What happened" — what the data showed (use realistic numbers for this event type)
2. "Impact on {regime}" — how this affects the current regime thesis
3. "Action" — one sentence on what investors should do (hold, adjust, or watch)

For "nextRelease", pick the most relevant upcoming release from the list above.

Keep it concise and plain English. No jargon. Write as if explaining to a smart friend who invests but isn't an economist.

Respond in JSON format:
{{"analysis": "...", "impact": "...", "action": "...", "nextRelease": "..."}}"""

    try:
        r = req.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        data = r.json()
        text = "".join(b.get("text", "") for b in data.get("content", []))

        import json as _json
        # Parse JSON from response
        clean = text.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
            clean = clean.strip()
        if not clean.startswith("{"):
            start = clean.find("{")
            end = clean.rfind("}") + 1
            if start != -1:
                clean = clean[start:end]

        result = _json.loads(clean)

        import emails
        sent = emails.send_event_breakdown(
            event_name=event_name,
            regime=regime,
            analysis=result.get("analysis", ""),
            impact_on_regime=result.get("impact", ""),
            action_needed=result.get("action", ""),
            next_release=result.get("nextRelease", "Check the dashboard"),
        )

        return {"ok": True, "emailsSent": sent, "analysis": result}

    except Exception as e:
        return {"error": str(e), "emailsSent": 0}


@app.post("/api/cron/check-triggers")
async def cron_check_triggers(request: Request):
    """Check triggers for significant movements and send alerts."""
    cron_secret = os.getenv("CRON_SECRET", "")
    if cron_secret and request.headers.get("x-cron-secret") != cron_secret:
        return {"error": "Unauthorized"}

    import json as _json
    from macro_kelly import get_current_regime, get_etf_price
    from geopolitical import get_geopolitical_risks
    import emails

    regime, _, _ = get_current_regime()

    # Load previous trigger values
    trigger_history_file = os.path.join(MACRO, ".macro_cache", "trigger_history.json")
    previous = {}
    try:
        if os.path.exists(trigger_history_file):
            with open(trigger_history_file) as f:
                previous = _json.load(f)
    except Exception:
        pass

    # Get current values
    current = {}
    try:
        oil = get_etf_price("CL=F")
        if oil:
            current["oil"] = {"value": round(oil, 1), "label": f"${round(oil, 1)}/bbl"}
    except Exception:
        pass

    try:
        geo = get_geopolitical_risks() or {}
        hormuz = None
        try:
            from macro_kelly import get_hormuz_transits
            hormuz = get_hormuz_transits()
        except Exception:
            pass
        if hormuz and hormuz.get("count"):
            current["hormuz"] = {"value": hormuz["count"], "label": f"{hormuz['count']} vessels/day"}
    except Exception:
        pass

    # Define what counts as "significant movement"
    THRESHOLDS = {
        "oil": {
            "name": "WTI Crude Oil",
            "regime_threshold": "Below $85 = Stagflation weakening",
            "significant_move": 5,  # $5 change is significant
        },
        "hormuz": {
            "name": "Strait of Hormuz Transits",
            "regime_threshold": "Above 50/day = supply recovering",
            "significant_move": 10,  # 10 vessel change is significant
        },
    }

    alerts_sent = 0
    movements = []

    for key, config in THRESHOLDS.items():
        if key not in current:
            continue
        curr_val = current[key]["value"]
        prev_val = previous.get(key, {}).get("value")

        if prev_val is None:
            continue

        change = abs(curr_val - prev_val)
        if change >= config["significant_move"]:
            direction = "up" if curr_val > prev_val else "down"

            # Generate AI analysis
            anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
            analysis = f"{config['name']} moved {direction} from {previous[key].get('label', prev_val)} to {current[key]['label']}."

            if anthropic_key:
                try:
                    import requests as req
                    synthesis = _load_synthesis()
                    situation = synthesis.get("situation", "") if synthesis else ""

                    r = req.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "Content-Type": "application/json",
                            "x-api-key": anthropic_key,
                            "anthropic-version": "2023-06-01",
                        },
                        json={
                            "model": "claude-sonnet-4-20250514",
                            "max_tokens": 200,
                            "messages": [{"role": "user", "content": f"""In 2-3 sentences, explain what it means that {config['name']} moved from {previous[key].get('label', prev_val)} to {current[key]['label']}. Current regime is {regime}. Context: {situation[:200]}. Keep it plain English, no jargon."""}],
                        },
                        timeout=20,
                    )
                    data = r.json()
                    text = "".join(b.get("text", "") for b in data.get("content", []))
                    if text:
                        analysis = text.strip()
                except Exception:
                    pass

            sent = emails.send_trigger_movement(
                trigger_name=config["name"],
                previous_value=previous[key].get("label", str(prev_val)),
                current_value=current[key]["label"],
                threshold=config["regime_threshold"],
                regime=regime,
                analysis=analysis,
            )
            alerts_sent += sent
            movements.append({"trigger": config["name"], "from": prev_val, "to": curr_val, "sent": sent})

    # Save current values as new baseline
    with open(trigger_history_file, "w") as f:
        _json.dump(current, f)

    return {"ok": True, "alertsSent": alerts_sent, "movements": movements, "currentValues": current}


# ── Cron Jobs ────────────────────────────────────────────
# Called by Railway cron or external scheduler via secret header

CRON_SECRET = os.getenv("CRON_SECRET", "")


def _check_cron_auth(request) -> bool:
    """Verify cron request is authorized."""
    if not CRON_SECRET:
        return True  # No secret set = allow (dev mode)
    return request.headers.get("x-cron-secret") == CRON_SECRET


@app.post("/api/cron/daily")
async def cron_daily(request: Request):
    """Daily at 6am UTC — refresh geopolitical synthesis, check for override changes."""
    if not _check_cron_auth(request):
        return {"error": "Unauthorized"}, 401

    from geopolitical import get_geopolitical_risks, get_synthesis
    from fred import get_all
    from quadrant import get_quadrant
    from macro_kelly import get_current_regime
    import emails

    # Get previous geo regime from cache
    old_synthesis = _load_synthesis()
    old_geo = old_synthesis.get("etf_convictions", {}) if old_synthesis else {}

    # Force refresh geo data (delete cache to bypass TTL)
    geo_cache = os.path.join(MACRO, ".macro_cache", "geopolitical.json")
    synth_cache = os.path.join(MACRO, ".macro_cache", "geo_synthesis.json")
    for f in [geo_cache, synth_cache]:
        if os.path.exists(f):
            os.remove(f)

    # Refresh
    geo = get_geopolitical_risks()
    regime, fred_regime, lag_warning = get_current_regime()

    # Check if geo override changed
    new_geo_regime = geo.get("overall_regime_bias", "")
    old_geo_regime = old_synthesis.get("headline", "") if old_synthesis else ""

    # Refresh synthesis
    fred_data = get_all()
    quadrant = get_quadrant(fred_data)
    get_synthesis(geo, quadrant["quadrant"]["name"])

    # If geo regime changed, send alert
    sent = 0
    if old_synthesis and new_geo_regime and new_geo_regime != geo.get("_prev_regime", new_geo_regime):
        sent = emails.send_geo_override(
            event=geo.get("overall_summary", "Geopolitical signal updated")[:80],
            geo_regime=new_geo_regime,
            fred_regime=fred_regime,
            explanation=geo.get("overall_summary", ""),
        )

    return {
        "ok": True,
        "regime": regime,
        "fredRegime": fred_regime,
        "geoRegime": new_geo_regime,
        "lagWarning": lag_warning,
        "emailsSent": sent,
    }


@app.post("/api/cron/fred-release")
async def cron_fred_release(request: Request):
    """On FRED release dates — pull data, check regime, send alerts."""
    if not _check_cron_auth(request):
        return {"error": "Unauthorized"}, 401

    from fred import get_all
    from quadrant import get_quadrant
    from macro_kelly import get_current_regime, REGIME_ETFS
    from transition import assess_transitions
    import emails

    # Get current regime before refresh
    old_regime, _, _ = get_current_regime()

    # Force refresh FRED data
    fred_cache_dir = os.path.join(MACRO, ".macro_cache")
    for fname in os.listdir(fred_cache_dir):
        if fname.endswith(".json") and not fname.startswith("backtest") and fname not in [
            "geopolitical.json", "geo_synthesis.json", "regime_triggers.json",
            "hormuz.json", "subscribers.json", "portfolio.json",
        ]:
            fpath = os.path.join(fred_cache_dir, fname)
            try:
                os.remove(fpath)
            except Exception:
                pass

    # Recalculate
    fred_data = get_all()
    quadrant = get_quadrant(fred_data)
    new_regime, fred_regime, lag_warning = get_current_regime()

    # Check transitions
    transitions = assess_transitions(quadrant["growth"], quadrant["inflation"])
    early_signal = transitions.get("likely_name") if transitions.get("likely_name") != new_regime else None

    sent = 0
    release_name = "FRED Data Release"

    if new_regime != old_regime:
        # Regime shift
        picks = [f'{e["ticker"]} — {e["name"]}' for e in REGIME_ETFS.get(new_regime, [])]
        avoids = [t for t in ["QQQ", "TLT", "IWM"] if t not in [e["ticker"] for e in REGIME_ETFS.get(new_regime, [])]]
        sent = emails.send_regime_shift(
            old_regime=old_regime,
            new_regime=new_regime,
            trigger=f"FRED data confirmed regime change from {old_regime} to {new_regime}.",
            new_picks=picks,
            new_avoids=avoids,
        )
    elif early_signal:
        # Early signal
        flickering = [w["metric"] for w in transitions.get("warnings", [])]
        sent = emails.send_early_signal(
            release_name=release_name,
            current_regime=new_regime,
            target_regime=early_signal,
            indicator=", ".join(flickering[:2]),
            explanation=f"Indicators flickering toward {early_signal}. Not yet confirmed.",
        )
    else:
        # Unchanged
        synthesis = _load_synthesis()
        summary = synthesis.get("situation", "Regime held steady.") if synthesis else "Regime held steady."
        sent = emails.send_regime_unchanged(
            release_name=release_name,
            regime=new_regime,
            summary=summary,
            next_release="Check macro pulse dashboard for upcoming releases.",
        )

    return {
        "ok": True,
        "previousRegime": old_regime,
        "currentRegime": new_regime,
        "earlySignal": early_signal,
        "emailsSent": sent,
    }


@app.post("/api/cron/weekly")
async def cron_weekly(request: Request):
    """Every Tuesday 8am UTC — send weekly newsletter."""
    if not _check_cron_auth(request):
        return {"error": "Unauthorized"}, 401

    from macro_kelly import get_current_regime, REGIME_ETFS
    import emails

    regime, fred_regime, lag_warning = get_current_regime()
    months = _count_consecutive_months(regime)

    picks = [{"ticker": e["ticker"], "name": e["name"], "weight": round(e["conviction"] * 20)}
             for e in REGIME_ETFS.get(regime, [])]

    # Load triggers and calendar from existing endpoints
    triggers_resp = get_triggers_endpoint()
    triggers = triggers_resp.get("triggers", []) if isinstance(triggers_resp, dict) else []

    calendar_resp = get_calendar()
    calendar_events = calendar_resp.get("events", []) if isinstance(calendar_resp, dict) else []

    synthesis = _load_synthesis()
    bull = synthesis.get("bull_case", {}).get("trigger", "Geopolitical de-escalation") if synthesis else "Geopolitical de-escalation"
    bear = synthesis.get("bear_case", {}).get("trigger", "Conflict escalation") if synthesis else "Conflict escalation"

    geo_regime = ""
    if synthesis:
        # Get geo regime from geopolitical cache
        try:
            import json
            geo_path = os.path.join(MACRO, ".macro_cache", "geopolitical.json")
            if os.path.exists(geo_path):
                with open(geo_path) as f:
                    geo_regime = json.load(f).get("overall_regime_bias", fred_regime)
        except Exception:
            geo_regime = fred_regime

    sent = emails.send_weekly_pulse(
        regime=regime,
        months=months,
        fred_regime=fred_regime,
        geo_regime=geo_regime or fred_regime,
        picks=picks,
        triggers=triggers,
        calendar=calendar_events,
        bull_trigger=bull,
        bear_trigger=bear,
    )

    return {"ok": True, "regime": regime, "emailsSent": sent}


def _get_conviction(ticker: str, static_conviction: float, dyn_convictions: dict | None) -> float:
    """Get conviction for an ETF — dynamic override can increase but never decrease below static."""
    if not dyn_convictions:
        return static_conviction
    dynamic = dyn_convictions.get(ticker, static_conviction)
    return max(dynamic, static_conviction)


# ── Helpers ──────────────────────────────────────────────

def _build_regime_origin(synthesis: dict | None, regime: str, start_date: str) -> dict | None:
    """Build explanation of why the geopolitical layer flagged this regime."""
    if not synthesis:
        return None

    headline = synthesis.get("headline", "")
    situation = synthesis.get("situation", "")
    key_tension = synthesis.get("key_tension", "")
    bull_trigger = synthesis.get("bull_case", {}).get("trigger", "")
    bear_trigger = synthesis.get("bear_case", {}).get("trigger", "")

    if not situation:
        return None

    return {
        "regime": regime,
        "detectedDate": start_date,
        "headline": headline,
        "situation": situation,
        "keyTension": key_tension,
        "whatWouldEndIt": bull_trigger,
        "whatWouldDeepen": bear_trigger,
    }


def _load_synthesis() -> dict | None:
    """Load AI synthesis cache."""
    import json
    try:
        cache_path = os.path.join(MACRO, ".macro_cache", "geo_synthesis.json")
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                return json.load(f)
    except Exception:
        pass
    return None


def _get_regime_start() -> str:
    """Get regime start date from synthesis cache."""
    import json
    try:
        cache_path = os.path.join(MACRO, ".macro_cache", "geo_synthesis.json")
        with open(cache_path) as f:
            return json.load(f).get("regime_start_date", "2025-12-01")
    except Exception:
        return "2025-12-01"


def _count_consecutive_months(regime: str) -> int:
    """Count months since regime start date."""
    from datetime import datetime
    try:
        start = _get_regime_start()
        start_dt = datetime.strptime(start, "%Y-%m-%d")
        now = datetime.now()
        months = (now.year - start_dt.year) * 12 + (now.month - start_dt.month)
        return max(months, 1)
    except Exception:
        return 1


def _build_fred_note(fred_data: dict, quadrant: dict) -> str:
    """Build an informative FRED signal note explaining what the data shows and its lag."""
    growth = quadrant.get("growth", {})
    inflation = quadrant.get("inflation", {})
    g_detail = growth.get("detail", {})
    i_detail = inflation.get("detail", {})

    # Identify the laggiest data point
    gdp_date = ""
    try:
        gdp_series = fred_data.get("gdp", [])
        if gdp_series:
            gdp_date = str(gdp_series[0][0])  # e.g. "2025-10-01"
    except Exception:
        pass

    parts = []
    parts.append(f"Growth {growth.get('direction', '?')} ({g_detail.get('gdp_change_pct', '?')}% GDP, {g_detail.get('retail_change_pct', '?')}% retail)")
    parts.append(f"Inflation {inflation.get('direction', '?')} ({i_detail.get('cpi_change_pct', '?')}% CPI, {i_detail.get('ppi_change_pct', '?')}% PPI)")

    if gdp_date:
        from datetime import datetime
        try:
            gdp_dt = datetime.strptime(gdp_date[:10], "%Y-%m-%d")
            months_old = (datetime.now().year - gdp_dt.year) * 12 + (datetime.now().month - gdp_dt.month)
            if months_old >= 3:
                parts.append(f"GDP data is from {gdp_date[:7]} ({months_old}mo lag)")
        except Exception:
            pass

    return " · ".join(parts)


def _latest_fred_date(fred_data: dict) -> str:
    """Extract the most recent date from FRED data."""
    try:
        for key in ["cpi", "pce", "retail_sales", "unemployment"]:
            series = fred_data.get(key, [])
            if series and len(series) > 0:
                return str(series[0][0])
    except Exception:
        pass
    return "Unknown"


def _geo_cache_date() -> str:
    """Get the date the geopolitical cache was last updated."""
    import json
    try:
        cache_path = os.path.join(MACRO, ".macro_cache", "geopolitical.json")
        stat = os.stat(cache_path)
        from datetime import datetime
        return datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")
    except Exception:
        return "Unknown"
