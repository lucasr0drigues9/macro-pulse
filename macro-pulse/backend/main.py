"""
Macro Pulse — FastAPI backend
Wraps the existing Python CLI tool into REST endpoints.
"""

import sys
import os

# Add both root and macro/ to Python path so imports resolve
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MACRO = os.path.join(ROOT, "macro")
sys.path.insert(0, ROOT)
sys.path.insert(0, MACRO)

# Change working directory to macro/ so cache paths resolve
os.chdir(MACRO)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Macro Pulse API", version="0.1.0")

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/regime")
def get_regime():
    """Section 1 — Current regime indicator with both signals."""
    from macro_kelly import get_current_regime, REGIME_ETFS
    from fred import get_all
    from quadrant import get_quadrant
    from geopolitical import get_geopolitical_risks, get_synthesis
    from transition import assess_transitions

    # Core regime data
    regime, fred_regime, lag_warning = get_current_regime()

    # FRED quadrant details
    fred_data = get_all()
    quadrant = get_quadrant(fred_data)

    # Geopolitical data
    geo = get_geopolitical_risks()

    # Early transition check
    early_transition = None
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

    # Count consecutive months from snapshots
    consecutive_months = _count_consecutive_months(regime)

    return {
        "confirmed": regime,
        "consecutiveMonths": consecutive_months,
        "fredSignal": {
            "regime": fred_regime,
            "note": f"Based on {quadrant['growth']['detail'].get('gdp_change_pct', 'N/A')}% GDP, "
                    f"{quadrant['inflation']['detail'].get('cpi_change_pct', 'N/A')}% CPI",
            "lastUpdated": _latest_fred_date(fred_data),
        },
        "geoSignal": {
            "regime": geo.get("overall_regime_bias", regime),
            "note": geo.get("overall_summary", "")[:120],
            "lastUpdated": _geo_cache_date(),
        },
        "lagWarning": lag_warning,
        "earlyTransition": early_transition,
        "regimeStartDate": regime_start,
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
def get_allocation():
    """Section 3 Part A — Regime weights with smart buy guidance (price assessments)."""
    from macro_kelly import (
        get_current_regime, REGIME_ETFS, get_etf_timing,
        get_dynamic_convictions, kelly_fraction,
    )

    regime, _, lag_warning = get_current_regime()
    picks = REGIME_ETFS.get(regime, [])
    pick_tickers = {e["ticker"] for e in picks}

    # Dynamic conviction overrides from AI synthesis
    dyn_convictions, cash_pct = get_dynamic_convictions()

    # Kelly fraction for this regime
    kelly = kelly_fraction(regime)

    # Build overweight list with price assessments
    overweight = []
    total_conviction = sum(e["conviction"] for e in picks)

    for etf in picks:
        ticker = etf["ticker"]
        conviction = dyn_convictions.get(ticker, etf["conviction"]) if dyn_convictions else etf["conviction"]

        # Weight = conviction-proportional share of non-cash allocation
        cash = cash_pct if cash_pct else 15
        weight = round(conviction / total_conviction * (100 - cash))

        # Price assessment from timing signals
        timing = get_etf_timing(ticker)
        if timing:
            score = timing["score"]
            if score >= 65:
                assessment = "Still attractive"
            elif score >= 40:
                assessment = "Fairly valued"
            else:
                assessment = "Extended"
            price_info = {
                "price": timing["price"],
                "rsi": timing["rsi"],
                "score": timing["score"],
            }
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

    # Build underweight list (all ETFs not in picks)
    avoid_etfs = {
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

    underweight = []
    for ticker, (name, rationale) in avoid_etfs.items():
        if ticker not in pick_tickers:
            underweight.append({"ticker": ticker, "name": name, "rationale": rationale})

    return {
        "regime": regime,
        "kellyFraction": round(kelly, 4),
        "cashTarget": cash_pct or 15,
        "overweight": overweight,
        "underweight": underweight,
        "earlyRotation": None,  # TODO: wire transition.py
    }


@app.post("/api/calculate")
def calculate_allocation(body: dict):
    """Section 3 Part B — Kelly position sizing calculator."""
    from macro_kelly import get_current_regime, REGIME_ETFS, get_dynamic_convictions, kelly_fraction

    portfolio_size = float(body.get("portfolioSize", 0))
    cash_available = float(body.get("cashAvailable", 0))
    currency = body.get("currency", "EUR")

    if portfolio_size <= 0 or cash_available <= 0:
        return {"error": "Portfolio size and cash must be positive", "allocations": []}

    regime, _, _ = get_current_regime()
    picks = REGIME_ETFS.get(regime, [])

    # Dynamic convictions
    dyn_convictions, cash_pct = get_dynamic_convictions()
    cash_target = cash_pct or 15

    # Kelly fraction scales how aggressively we deploy
    kelly = kelly_fraction(regime)

    # Deployable amount: min of cash available and Kelly-adjusted portfolio
    kelly_deployable = portfolio_size * kelly if kelly > 0 else cash_available * 0.5
    deployable = min(cash_available, max(kelly_deployable, cash_available * 0.3))

    # Reserve cash target
    cash_reserve = portfolio_size * cash_target / 100
    deployable = min(deployable, max(0, portfolio_size - cash_reserve))

    # Allocate proportionally by conviction
    total_conviction = sum(
        (dyn_convictions.get(e["ticker"], e["conviction"]) if dyn_convictions else e["conviction"])
        for e in picks
    )

    allocations = []
    for etf in picks:
        conviction = dyn_convictions.get(etf["ticker"], etf["conviction"]) if dyn_convictions else etf["conviction"]
        weight = conviction / total_conviction if total_conviction > 0 else 1 / len(picks)
        amount = round(deployable * weight, 2)
        allocations.append({
            "ticker": etf["ticker"],
            "name": etf["name"],
            "weight": round(weight * 100, 1),
            "amount": round(amount),
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

        outperformed = (picks_ret or 0) > (spy_ret or 0) if picks_ret is not None and spy_ret is not None else None

        timeline_data.append({
            "regime": regime,
            "start": start[:7],
            "end": end[:7],
            "months": months,
            "picksReturn": picks_ret,
            "spyReturn": spy_ret,
            "outperformed": outperformed,
        })

    timeline_data.reverse()  # Most recent first

    # Compute scorecard from real data
    valid = [t for t in timeline_data if t["outperformed"] is not None]
    wins = [t for t in valid if t["outperformed"]]
    total_regimes = len(timeline_data)
    outperformed_count = len(wins)
    outperformed_pct = round(outperformed_count / len(valid) * 100, 1) if valid else 0

    # Best and worst calls
    best_call = max(valid, key=lambda t: (t["picksReturn"] or 0) - (t["spyReturn"] or 0)) if valid else None
    worst_call = min(valid, key=lambda t: (t["picksReturn"] or 0) - (t["spyReturn"] or 0)) if valid else None

    # Per-regime breakdown
    regime_breakdown = {}
    for regime_name in ["Stagflation", "Goldilocks", "Reflation", "Deflation"]:
        rk = summary.get("regime_kelly", {}).get(regime_name, {})
        regime_periods = [t for t in timeline_data if t["regime"] == regime_name]
        regime_valid = [t for t in regime_periods if t["outperformed"] is not None]
        regime_wins = [t for t in regime_valid if t["outperformed"]]
        regime_breakdown[regime_name] = {
            "count": len(regime_periods),
            "winRate": round(len(regime_wins) / len(regime_valid) * 100, 1) if regime_valid else 0,
            "kellyHalf": round(rk.get("kelly_half", 0) * 100, 1),
            "observations": rk.get("observations", 0),
        }

    return {
        "totalRegimes": total_regimes,
        "yearRange": f"2007–2026",
        "picksOutperformedSpy": outperformed_count,
        "picksOutperformedPct": outperformed_pct,
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


# ── Helpers ──────────────────────────────────────────────

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
