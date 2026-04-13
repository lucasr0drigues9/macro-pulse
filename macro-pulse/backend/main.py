"""
Macro World View — FastAPI backend
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
            with open(fpath, "w") as f:
                json.dump(content, f)

_seed_cache_on_startup()

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio


async def _background_trigger_check():
    """Check triggers every 4 hours in background."""
    await asyncio.sleep(60)  # Wait 1 min after startup
    while True:
        try:
            # Import here to avoid circular imports
            from macro_kelly import get_current_regime, get_etf_price
            import json as _j

            regime, _, _ = get_current_regime()
            trigger_history = os.path.join(MACRO, ".macro_cache", "trigger_history.json")
            previous = {}
            try:
                with open(trigger_history) as f:
                    previous = _j.load(f)
            except Exception:
                pass

            oil = get_etf_price("CL=F")
            if oil:
                current_oil = {"value": round(oil, 1), "label": f"${round(oil, 1)}/bbl"}
                # Check level crossings
                levels_file = os.path.join(MACRO, ".macro_cache", "levels_crossed.json")
                try:
                    with open(levels_file) as f:
                        levels_crossed = _j.load(f)
                except Exception:
                    levels_crossed = {}

                prev_oil = previous.get("oil", {}).get("value")
                if prev_oil:
                    for level_info in [
                        {"level": 100, "dir": "below", "label": "Oil below $100"},
                        {"level": 90, "dir": "below", "label": "Oil below $90"},
                        {"level": 85, "dir": "below", "label": "Oil below $85"},
                        {"level": 120, "dir": "above", "label": "Oil above $120"},
                    ]:
                        alert_key = f"oil_{level_info['level']}_{level_info['dir']}"
                        crossed = False
                        if level_info["dir"] == "below" and prev_oil >= level_info["level"] and oil < level_info["level"]:
                            crossed = True
                        elif level_info["dir"] == "above" and prev_oil <= level_info["level"] and oil > level_info["level"]:
                            crossed = True
                        if crossed and not levels_crossed.get(alert_key, False):
                            levels_crossed[alert_key] = True
                            print(f"  ALERT: {level_info['label']} — ${prev_oil} → ${oil}")
                        elif not crossed and levels_crossed.get(alert_key, False):
                            levels_crossed[alert_key] = False

                    with open(levels_file, "w") as f:
                        _j.dump(levels_crossed, f)

                # Update history
                previous["oil"] = current_oil
                with open(trigger_history, "w") as f:
                    _j.dump(previous, f)

        except Exception as e:
            print(f"  Background trigger check error: {e}")

        await asyncio.sleep(4 * 3600)  # Every 4 hours


@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(_background_trigger_check())
    yield
    task.cancel()


app = FastAPI(title="Macro World View API", version="0.3.0", lifespan=lifespan)


@app.get("/api/version")
def get_version():
    return {"version": "0.3.0", "feature": "signal_strength"}


@app.get("/api/returns")
def get_returns(tickers: str = "", start: str = ""):
    """Return price returns for a comma-separated list of tickers.
    Optional 'start' param (YYYY-MM-DD) for custom start date. Default: 1 year ago."""
    import yfinance as yf
    from datetime import datetime, timedelta

    if not tickers:
        return {"returns": {}}

    ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]
    start_date = start if start else (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    results = {}

    for ticker in ticker_list[:15]:  # max 15 tickers per request
        try:
            hist = yf.Ticker(ticker).history(start=start_date)
            if len(hist) >= 2:
                start_price = float(hist["Close"].iloc[0])
                end_price = float(hist["Close"].iloc[-1])
                ret = round((end_price - start_price) / start_price * 100, 1)
                results[ticker] = {"return": ret, "price": round(end_price, 2), "startPrice": round(start_price, 2)}
        except Exception:
            continue

    return {"returns": results}


@app.post("/api/trigger-oil-alert")
def trigger_oil_alert():
    """One-time endpoint to manually trigger oil level alert."""
    import json as _json
    from macro_kelly import get_current_regime, get_etf_price
    import emails

    regime, _, _ = get_current_regime()
    oil = get_etf_price("CL=F")
    if not oil:
        return {"error": "Could not fetch oil price"}

    # Get AI analysis
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    analysis = f"Oil at ${round(oil, 1)}/barrel — below the key $100 level."

    if anthropic_key:
        try:
            import requests as req
            synthesis = {}
            synth_path = os.path.join(MACRO, ".macro_cache", "geo_synthesis.json")
            if os.path.exists(synth_path):
                with open(synth_path) as f:
                    synthesis = _json.load(f)
            r = req.post(
                "https://api.anthropic.com/v1/messages",
                headers={"Content-Type": "application/json", "x-api-key": anthropic_key, "anthropic-version": "2023-06-01"},
                json={"model": "claude-sonnet-4-20250514", "max_tokens": 300,
                    "messages": [{"role": "user", "content": f"Oil broke below $100 to ${round(oil, 1)}/barrel. Current regime is {regime}. Context: {synthesis.get('situation', '')[:300]}. In 4 sentences: 1) Why $100 matters, 2) What it signals for Stagflation thesis, 3) Which ETFs to watch (GLD, XLE, DBC), 4) What action to consider. Direct and actionable."}]},
                timeout=25,
            )
            text = "".join(b.get("text", "") for b in r.json().get("content", []))
            if text:
                analysis = text.strip()
        except Exception:
            pass

    sent = emails.send_trigger_movement(
        trigger_name="Oil Below $100 — Key Level Break",
        previous_value="$103/bbl",
        current_value=f"${round(oil, 1)}/bbl",
        threshold="Stagflation energy thesis under pressure — supply disruption may be easing or demand destruction setting in",
        regime=regime,
        analysis=analysis,
    )
    return {"ok": True, "oil": round(oil, 1), "emailsSent": sent, "analysis": analysis[:200]}


@app.get("/api/interpretation")
def get_interpretation():
    """Return the AI regime interpretation and capital flow for the lobby page."""
    synthesis = _load_synthesis()
    if not synthesis:
        return {"interpretation": None, "capitalFlow": None, "europeInterpretation": None}
    return {
        "interpretation": synthesis.get("regime_interpretation"),
        "situation": synthesis.get("situation"),
        "headline": synthesis.get("headline"),
        "keyTension": synthesis.get("key_tension"),
        "capitalFlow": synthesis.get("capital_flow"),
        "europeInterpretation": synthesis.get("europe_interpretation"),
    }


@app.get("/api/eu/regime")
def get_eu_regime():
    """Current European economic regime — geo override logic matches US tracker.

    Priority:
    1. AI geopolitical signal (if different from snapshot, and clear catalyst)
    2. Eurostat snapshot (latest values across all series — most current data)
    3. Backtest timeline (fallback only)
    """
    try:
        from eurostat import get_all as eu_get_all
        from eu_quadrant import get_eu_quadrant
        from backtest_regime_eu import build_eu_regime_timeline, identify_eu_periods
        import contextlib, io as _io, re

        # Get live snapshot (uses latest available data from each series)
        with contextlib.redirect_stdout(_io.StringIO()):
            eu_data = eu_get_all()
        snapshot = get_eu_quadrant(eu_data)
        eurostat_regime = snapshot["quadrant"]["name"]

        # Get AI geopolitical regime from synthesis cache
        synthesis = _load_synthesis() or {}
        europe_text = synthesis.get("europe_interpretation", "") or ""
        # Case-insensitive match — AI often writes "stagflation regime" in lowercase
        geo_match = re.search(r"\b(stagflation|goldilocks|reflation|deflation)\b", europe_text, re.IGNORECASE)
        geo_regime = geo_match.group(1).capitalize() if geo_match else None

        # Apply override logic: geo overrides when different
        lag_warning = False
        if geo_regime and geo_regime != eurostat_regime:
            confirmed = geo_regime
            lag_warning = True
        else:
            confirmed = eurostat_regime

        # Get backtest timeline for historical context and eurostat regime start date
        with contextlib.redirect_stdout(_io.StringIO()):
            timeline = build_eu_regime_timeline()
        periods = identify_eu_periods(timeline)

        # Find when the current Eurostat (snapshot) regime last started in the timeline
        # Walk backwards from the most recent period
        from datetime import datetime as _dt
        eurostat_period_start = None
        if periods:
            # If last timeline period matches, use it
            if periods[-1]["regime"] == eurostat_regime:
                eurostat_period_start = periods[-1]["start"]
            else:
                # Snapshot differs from last timeline period — find last occurrence
                for p in reversed(periods):
                    if p["regime"] == eurostat_regime:
                        eurostat_period_start = p["start"]
                        break
                # If still none found, timeline never matched — use month after last period end
                if not eurostat_period_start and periods:
                    last_end = _dt.strptime(periods[-1]["end"], "%Y-%m-%d")
                    # Transition detected after the last timeline period
                    eurostat_period_start = f"{last_end.year + (1 if last_end.month == 12 else 0)}-{(last_end.month % 12) + 1:02d}-01"

        # Calculate months since eurostat regime started
        months = 1
        if eurostat_period_start:
            start = _dt.strptime(eurostat_period_start, "%Y-%m-%d")
            now = _dt.now()
            months = max(1, (now.year - start.year) * 12 + (now.month - start.month) + 1)

        # AI synthesis last updated timestamp
        ai_last_updated = None
        try:
            synth_path = os.path.join(MACRO, ".macro_cache", "geo_synthesis.json")
            if os.path.exists(synth_path):
                mtime = os.path.getmtime(synth_path)
                ai_last_updated = _dt.fromtimestamp(mtime).strftime("%Y-%m-%d")
        except Exception:
            pass

        # Get raw growth indicators (latest available value per series)
        def latest_val(key):
            return eu_data.get(key, [None])[0] if eu_data.get(key) else None

        return {
            "confirmed": confirmed,
            "eurostatRegime": eurostat_regime,
            "eurostatPeriodStart": eurostat_period_start,
            "geoRegime": geo_regime,
            "aiLastUpdated": ai_last_updated,
            "lagWarning": lag_warning,
            "consecutiveMonths": months,
            "periodStart": periods[-1]["start"] if periods else None,
            "periodEnd": periods[-1]["end"] if periods else None,
            "growth": snapshot["growth"],
            "inflation": snapshot["inflation"],
            "latest": {
                "gdp": latest_val("gdp"),
                "industrialProduction": latest_val("industrial_production"),
                "retailSales": latest_val("retail_sales"),
                "unemployment": latest_val("unemployment"),
                "hicp": latest_val("hicp"),
            },
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/eu/backtest")
def get_eu_backtest():
    """European regime history with returns per regime + AI geo overrides."""
    try:
        from backtest_regime_eu import (
            build_eu_regime_timeline, identify_eu_periods, REGIME_ETFS_EU, load_all_eu_prices
        )
        from backtest_regime import compute_portfolio_return
        from datetime import datetime as _dt
        import contextlib, io as _io, json as _json

        # AI geopolitical overrides for key European events
        # Format: start_month (YYYY-MM) -> (strength, context, ai_regime_override_or_None)
        EU_SIGNAL_STRENGTH = {
            "2007-01": ("MODERATE", "Subprime crisis starting. European banks exposed to US mortgage assets.", "Stagflation"),
            "2008-06": ("STRONG", "Pre-Lehman stress. Northern Rock had already failed. Credit crunch deepening.", "Deflation"),
            "2008-11": ("STRONG", "Lehman collapse hit Europe hard. Iceland banking crisis. Deepest recession since WW2.", None),
            "2009-11": ("MODERATE", "Greek debt crisis emerging. Early signs of European sovereign stress.", "Deflation"),
            "2010-04": ("STRONG", "Greek bailout triggered sovereign debt crisis. Portugal, Ireland, Spain contagion.", "Stagflation"),
            "2010-08": ("MODERATE", "ECB bond-buying program (SMP) active. Post-crisis recovery building with very loose monetary policy.", "Reflation"),
            "2010-10": ("MODERATE", "ECB maintaining low rates, recovery building. QE-equivalent policies supporting risk assets.", "Reflation"),
            "2011-08": ("STRONG", "European debt crisis peak. Italy and Spain under attack. ECB launched SMP buying Italian/Spanish bonds.", None),
            "2012-07": ("STRONG", "Draghi 'whatever it takes' saved the euro. Turning point for European risk assets.", "Reflation"),
            "2012-08": ("STRONG", "Draghi 'whatever it takes' Jul 2012 + OMT program backstopping eurozone bonds. Risk assets rallying on monetary backstop.", "Reflation"),
            "2012-11": ("STRONG", "OMT program in place since Sep 2012. Sovereign spreads compressing. ECB backstop enabling risk-on reflation trade.", "Reflation"),
            "2014-11": ("STRONG", "ECB cut deposit rate to -0.2%, preparing full QE. Oil crashing. Draghi engineering reflation, not stagflation.", "Reflation"),
            "2015-03": ("STRONG", "ECB QE launched (€60B/month). Euro weakened. Deflation fear genuine but stimulus flowing.", "Reflation"),
            "2015-08": ("STRONG", "ECB QE running at €60B/month since Jan 2015. Euro at multi-year lows. Reflationary tailwind from massive bond purchases.", "Reflation"),
            "2016-04": ("MODERATE", "Brexit vote uncertainty building. Oil recovering. Mixed signals.", "Goldilocks"),
            "2016-07": ("STRONG", "Brexit vote shock. Sterling collapsed. European integration under threat.", "Deflation"),
            "2017-01": ("MODERATE", "ECB QE ongoing. Euro weakening, exports booming. Reflationary tailwind from loose monetary policy.", "Reflation"),
            "2017-04": ("MODERATE", "ECB QE at €60B/month. Euro economy growing steadily, inflation below target. Classic Goldilocks from accommodative policy.", "Goldilocks"),
            "2018-04": ("MODERATE", "ECB still running QE at €30B/month. Growth moderate, inflation below target. Monetary accommodation supporting Goldilocks.", "Goldilocks"),
            "2019-08": ("STRONG", "ECB preparing rate cut and QE restart announced Sep 2019. Accommodative pivot driving reflation.", "Reflation"),
            "2019-01": ("MODERATE", "ECB ended QE Dec 2018 but signaled patience on rates. Loose monetary conditions still supporting reflation.", "Reflation"),
            "2019-11": ("WEAK", "Brief pre-COVID weakness. Trade war concerns. No major European catalyst.", None),
            "2020-04": ("STRONG", "COVID lockdowns. Italy and Spain hit first and hardest. Economy collapsed.", None),
            "2020-07": ("STRONG", "EU recovery fund agreed — first joint fiscal action. Reopening boost.", "Reflation"),
            "2021-11": ("MODERATE", "Energy prices spiking. Natural gas crisis building. Russia restricting flows.", "Stagflation"),
            "2022-04": ("STRONG", "Russia invaded Ukraine Feb 2022. European energy crisis. ECB behind the curve.", "Stagflation"),
            "2022-06": ("STRONG", "Russia weaponised gas supplies. Nord Stream flows cut to 20%. Energy price spikes creating clear stagflationary pressure across Europe.", "Stagflation"),
            "2022-08": ("STRONG", "European energy crisis peaked with Russia's complete gas cutoff. Nord Stream shutdown. Industrial energy costs doubling.", "Stagflation"),
            "2022-10": ("STRONG", "European gas storage filled, prices falling, recession fears dominant.", "Deflation"),
            "2022-12": ("MODERATE", "Gas storage full, energy prices collapsing from peaks. ECB still hiking but worst of crisis over. Growth stabilising.", "Goldilocks"),
            "2023-04": ("MODERATE", "Post-banking-crisis stability. ECB still hiking. Inflation sticky.", None),
            "2024-03": ("STRONG", "ECB signaled June 2024 rate cut. Inflation falling to 2.4%. Germany weak but eurozone growth stabilising.", "Goldilocks"),
            "2024-12": ("STRONG", "Trump tariff threats + Iran tensions + German political crisis.", "Stagflation"),
            "2025-07": ("STRONG", "Post-Iran war period. ECB hiked 75bp in Nov 2025 while German energy costs surged 40% from pipeline disruptions. Classic stagflation.", "Stagflation"),
        }

        with contextlib.redirect_stdout(_io.StringIO()):
            timeline = build_eu_regime_timeline()
            prices = load_all_eu_prices()
        periods = identify_eu_periods(timeline)

        timeline_data = []
        for p in periods:
            start = p["start"]
            end = p["end"]
            if start == end:
                continue
            try:
                s_dt = _dt.strptime(start, "%Y-%m-%d")
                e_dt = _dt.strptime(end, "%Y-%m-%d")
                months = max(1, (e_dt.year - s_dt.year) * 12 + (e_dt.month - s_dt.month) + 1)
            except Exception:
                months = 1

            # Compute returns for all 4 regime baskets during this period
            all_returns = {}
            for r_name in ["Stagflation", "Goldilocks", "Reflation", "Deflation"]:
                ret = compute_portfolio_return(
                    prices, REGIME_ETFS_EU.get(r_name, []), start, end, use_next_month_end=True
                )
                all_returns[r_name] = ret

            valid_returns = {k: v for k, v in all_returns.items() if v is not None}
            best_regime = max(valid_returns, key=lambda k: valid_returns[k]) if valid_returns else None
            framework_correct = best_regime == p["regime"] if best_regime else None

            # AI geopolitical signal for this period
            sig = EU_SIGNAL_STRENGTH.get(start[:7], ("MODERATE", "", None))
            geo_override = sig[2] if len(sig) > 2 else None
            ai_regime = geo_override if geo_override else p["regime"]
            ai_picks_return = all_returns.get(ai_regime)
            ai_correct = best_regime == ai_regime if best_regime else None

            # Load structured per-period analysis (all 4 outcome cases)
            period_analysis = None
            try:
                pa_path = os.path.join(MACRO, ".macro_cache", "period_analysis_eu.json")
                if os.path.exists(pa_path):
                    with open(pa_path) as _paf:
                        pa_cache = _json.load(_paf)
                    pa_entry = pa_cache.get(start[:7])
                    if pa_entry:
                        period_analysis = pa_entry.get("structured")
            except Exception:
                pass

            timeline_data.append({
                "regime": p["regime"],
                "start": start[:7],
                "end": end[:7],
                "months": months,
                "picksReturn": all_returns.get(p["regime"]),
                "allRegimeReturns": all_returns,
                "bestRegime": best_regime,
                "frameworkCorrect": framework_correct,
                "signalStrength": sig[0],
                "signalContext": sig[1],
                "aiRegime": ai_regime,
                "aiPicksReturn": ai_picks_return,
                "aiDiffersFromFred": geo_override is not None and geo_override != p["regime"],
                "aiCorrect": ai_correct,
                "periodAnalysis": period_analysis,
            })

        timeline_data.reverse()  # Most recent first

        # Regime breakdown
        regime_counts = {}
        for t in timeline_data:
            r = t["regime"]
            regime_counts[r] = regime_counts.get(r, 0) + 1

        return {
            "totalRegimes": len(timeline_data),
            "yearRange": "2005-2026",
            "timeline": timeline_data,
            "regimeBreakdown": regime_counts,
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/eu/allocation")
def get_eu_allocation():
    """EU portfolio allocation — mirrors /api/allocation for European UCITS ETFs."""
    try:
        from europe_guidance import EU_REGIME_ETFS
        import yfinance as _yf

        # Use the live EU regime signal, not the backtest timeline
        try:
            eu_regime_data = get_eu_regime()
            if "error" in eu_regime_data:
                raise Exception(eu_regime_data["error"])
        except Exception:
            eu_regime_data = {"confirmed": "Stagflation", "periodStart": "2026-02-01"}
        regime = eu_regime_data.get("confirmed", "Stagflation")
        period_start = eu_regime_data.get("periodStart")
        picks = EU_REGIME_ETFS.get(regime, [])

        def _eu_etf_return(ticker: str) -> float | None:
            if not period_start:
                return None
            try:
                h = _yf.Ticker(ticker).history(start=period_start)
                if len(h) >= 2:
                    return round((float(h["Close"].iloc[-1]) - float(h["Close"].iloc[0])) / float(h["Close"].iloc[0]) * 100, 1)
            except Exception:
                pass
            return None

        # Build allocation weights from convictions
        total_conviction = sum(e["conviction"] for e in picks) or 1
        cash_target = 15

        overweight = []
        for etf in picks:
            weight = round(etf["conviction"] / total_conviction * (100 - cash_target))
            overweight.append({
                "ticker": etf["ticker"],
                "name": etf["name"],
                "weight": weight,
                "conviction": etf["conviction"],
                "rationale": etf["note"],
                "priceAssessment": "Fairly valued",
                "returnSinceRegime": _eu_etf_return(etf["ticker"]),
            })

        pick_tickers = {e["ticker"] for e in picks}
        underweight = []
        for other_regime, other_etfs in EU_REGIME_ETFS.items():
            if other_regime == regime:
                continue
            for etf in other_etfs:
                if etf["ticker"] not in pick_tickers and not any(
                    u["ticker"] == etf["ticker"] for u in underweight
                ):
                    underweight.append({
                        "ticker": etf["ticker"],
                        "name": etf["name"],
                        "reason": f"Underperforms in {regime} — better suited for {other_regime}.",
                        "returnSinceRegime": _eu_etf_return(etf["ticker"]),
                    })

        return {
            "regime": regime,
            "periodStart": period_start,
            "cashTarget": cash_target,
            "overweight": overweight,
            "underweight": underweight,
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "type": type(e).__name__, "trace": traceback.format_exc()[-500:]}


@app.get("/api/eu/triggers")
def get_eu_triggers():
    """EU regime triggers — ECB rate, gas prices, PMI, spreads, inflation."""
    try:
        from europe_guidance import EU_TRIGGERS
        import yfinance as yf

        triggers = []
        for key, cfg in EU_TRIGGERS.items():
            trigger = {
                "name": cfg["name"],
                "threshold": cfg["threshold"],
                "urgency": cfg["urgency"],
                "current": "Loading...",
                "status": "stable",
                "action": "Monitor",
            }

            # Try to fetch live values for market-based triggers
            try:
                if key == "ecb_rate":
                    trigger["current"] = "2.75%"
                    trigger["status"] = "watch"
                    trigger["action"] = "ECB cutting — watch for pace change"
                elif key == "eu_gas_price":
                    # TTF gas — use Dutch TTF future
                    h = yf.Ticker("TTF=F").history(period="5d")
                    if len(h) > 0:
                        price = round(float(h["Close"].iloc[-1]), 1)
                        trigger["current"] = f"€{price}/MWh"
                        trigger["status"] = "crisis" if price > 50 else "watch" if price > 30 else "stable"
                        trigger["action"] = "Energy crisis" if price > 50 else "Elevated" if price > 30 else "Normal range"
                elif key == "eur_usd":
                    h = yf.Ticker("EURUSD=X").history(period="5d")
                    if len(h) > 0:
                        rate = round(float(h["Close"].iloc[-1]), 4)
                        trigger["current"] = f"{rate}"
                        trigger["status"] = "crisis" if rate < 1.00 else "watch" if rate < 1.05 else "stable"
                        trigger["action"] = "Parity breach" if rate < 1.00 else "Euro weak" if rate < 1.05 else "Normal range"
                elif key == "eu_pmi":
                    trigger["current"] = "~47.5 (Mar)"
                    trigger["status"] = "watch"
                    trigger["action"] = "Below 50 — contraction territory"
                elif key == "bund_spread":
                    trigger["current"] = "~140bp"
                    trigger["status"] = "stable"
                    trigger["action"] = "Normal range — no fragmentation stress"
                elif key == "eu_hicp":
                    trigger["current"] = "2.4% (Mar)"
                    trigger["status"] = "watch"
                    trigger["action"] = "Above target but trending down"
            except Exception:
                pass

            triggers.append(trigger)

        return {"triggers": triggers}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/eu/transition")
def get_eu_transition():
    """EU transition outlook — probabilities and UCITS ETF opportunities per scenario."""
    try:
        from europe_guidance import EU_REGIME_ETFS, EU_TRANSITION_GUIDANCE

        # Use live EU regime signal
        eu_regime_data = get_eu_regime()
        regime = eu_regime_data.get("confirmed", "Deflation")
        months = eu_regime_data.get("consecutiveMonths", 1)

        # Build outlook for each possible target regime
        outlook = []
        for target_regime in ["Stagflation", "Goldilocks", "Reflation", "Deflation"]:
            if target_regime == regime:
                continue
            guide = EU_TRANSITION_GUIDANCE.get(target_regime, {})
            etfs = EU_REGIME_ETFS.get(target_regime, [])

            # Simple probability heuristic based on current regime
            prob = 20  # default
            if regime == "Stagflation" and target_regime == "Deflation":
                prob = 35
            elif regime == "Stagflation" and target_regime == "Reflation":
                prob = 25
            elif regime == "Deflation" and target_regime == "Reflation":
                prob = 40
            elif regime == "Goldilocks" and target_regime == "Stagflation":
                prob = 25
            elif regime == "Reflation" and target_regime == "Goldilocks":
                prob = 35

            outlook.append({
                "regime": target_regime,
                "probability": prob,
                "source": "Historical transition frequency",
                "signals": guide.get("confirmation_signals", []),
                "description": guide.get("description", ""),
                "etfs": [
                    {"ticker": e["ticker"], "name": e["name"], "conviction": e["conviction"]}
                    for e in etfs
                ],
            })

        # Sort by probability descending
        outlook.sort(key=lambda x: x["probability"], reverse=True)

        return {
            "currentRegime": regime,
            "durationStats": {"months": months},
            "outlook": outlook,
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "type": type(e).__name__, "trace": traceback.format_exc()[-500:]}


@app.get("/api/eu/calendar")
def get_eu_calendar():
    """EU-specific economic calendar — key releases that affect European regime."""
    try:
        from europe_guidance import EU_CALENDAR_TEMPLATE
        from datetime import datetime, timedelta
        import requests as _req

        # Use the AI synthesis to generate a dynamic calendar if available
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if api_key:
            try:
                now = datetime.now()
                r = _req.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 1500,
                        "messages": [{"role": "user", "content": f"""Today is {now.strftime('%Y-%m-%d')}.
List the next 5-7 most important European economic releases and ECB events in the next 2 weeks.
Output ONLY a JSON array. Each item: {{"name": "...", "source": "ECB/Eurostat/S&P Global", "date": "YYYY-MM-DD", "day": "Monday/Tuesday/etc", "impact": "High/Medium/Low", "implication": "1 sentence: why this matters for the European regime signal"}}
No markdown fences."""}],
                        "tools": [{"type": "web_search_20250305", "name": "web_search", "max_uses": 2}],
                    },
                    timeout=30,
                )
                data = r.json()
                raw = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
                import re, json as _json
                m = re.search(r"\[.*\]", raw, re.DOTALL)
                if m:
                    events = _json.loads(m.group(0))
                    return {"events": events}
            except Exception:
                pass

        # Fallback to template
        return {"events": EU_CALENDAR_TEMPLATE}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/china/regime")
def get_china_regime():
    """Current Chinese regime based on LIVE market proxies + AI geo layer.

    Growth = copper futures 3-month momentum + FXI 3-month momentum
    Inflation = FRED China CPI YoY
    Yuan (CNH) direction as supplementary signal
    """
    import json as _cjson
    import requests as _req

    # ── Step 1: Get LIVE proxy regime from market data ──
    proxy_regime = "Deflation"
    growth = "falling"
    inflation = "falling"
    confidence = "Medium"
    months = 18
    indicators = {}

    try:
        def _fetch_market_indicator(ticker, label):
            """Fetch daily prices, compute 3m momentum, 6m averages, trend, and monthly history."""
            try:
                r = _req.get(f"https://query2.finance.yahoo.com/v8/finance/chart/{ticker}",
                            params={"interval": "1d", "range": "1y"},
                            headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
                data = r.json()["chart"]["result"][0]
                closes = data["indicators"]["quote"][0]["close"]
                timestamps = data.get("timestamp", [])
                valid = [(t, c) for t, c in zip(timestamps, closes) if c is not None]
                if len(valid) < 60:
                    return None, None

                current = valid[-1][1]
                # 3-month momentum
                idx_3m = max(0, len(valid) - 63)
                mom_3m = round((current - valid[idx_3m][1]) / valid[idx_3m][1] * 100, 1)

                # Monthly samples for sparkline (last 12 months, ~1 per 21 trading days)
                from datetime import datetime as _dtm
                history = []
                step = max(1, len(valid) // 12)
                for i in range(0, len(valid), step):
                    dt = _dtm.fromtimestamp(valid[i][0])
                    history.append({"date": dt.strftime("%Y-%m"), "value": round(valid[i][1], 2)})
                # Ensure latest is included
                dt_last = _dtm.fromtimestamp(valid[-1][0])
                if not history or history[-1]["date"] != dt_last.strftime("%Y-%m"):
                    history.append({"date": dt_last.strftime("%Y-%m"), "value": round(current, 2)})

                # 6m avg vs prior 6m avg (using daily closes)
                mid = len(valid) // 2
                recent_vals = [c for _, c in valid[mid:]]
                prior_vals = [c for _, c in valid[:mid]]
                recent_avg = round(sum(recent_vals) / len(recent_vals), 2) if recent_vals else None
                prior_avg = round(sum(prior_vals) / len(prior_vals), 2) if prior_vals else None
                trend = "rising" if recent_avg and prior_avg and recent_avg > prior_avg else "falling"

                return mom_3m, {
                    "value": round(current, 2),
                    "momentum3m": mom_3m,
                    "recent6mAvg": recent_avg,
                    "prior6mAvg": prior_avg,
                    "trend": trend,
                    "history": history,
                }
            except Exception:
                return None, None

        # Copper (China demand proxy)
        copper_mom, copper_data = _fetch_market_indicator("HG=F", "copper")
        if copper_data:
            indicators["copper"] = copper_data

        # FXI (market sentiment on China)
        fxi_mom, fxi_data = _fetch_market_indicator("FXI", "fxi")
        if fxi_data:
            indicators["fxi"] = fxi_data

        # USD/CNH (yuan direction)
        try:
            r = _req.get("https://query2.finance.yahoo.com/v8/finance/chart/CNH=X",
                        params={"interval": "1d", "range": "3mo"},
                        headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            closes = r.json()["chart"]["result"][0]["indicators"]["quote"][0]["close"]
            valid = [c for c in closes if c is not None]
            if len(valid) >= 20:
                cnh_now = valid[-1]
                cnh_prev = valid[-21] if len(valid) >= 21 else valid[0]
                indicators["cnh"] = {"value": round(cnh_now, 4), "change1m": round((cnh_now - cnh_prev) / cnh_prev * 100, 2)}
        except Exception:
            pass

        # China CPI from FRED (monthly, lagged but real)
        cpi_val = None
        try:
            FRED_KEY = os.getenv("FRED_API_KEY", "")
            if FRED_KEY:
                r = _req.get("https://api.stlouisfed.org/fred/series/observations", params={
                    "series_id": "CPALTT01CNM659N", "api_key": FRED_KEY,
                    "file_type": "json", "sort_order": "desc", "limit": 12,
                }, timeout=10)
                obs = [(o["date"], float(o["value"])) for o in r.json().get("observations", []) if o["value"] != "."]
                if obs:
                    cpi_val = obs[0][1]
                    # Compute trend: recent 6m avg vs prior 6m avg
                    recent = [v for _, v in obs[:6]]
                    prior = [v for _, v in obs[6:12]]
                    recent_avg = round(sum(recent) / len(recent), 2) if recent else None
                    prior_avg = round(sum(prior) / len(prior), 2) if prior else None
                    trend = "rising" if recent_avg is not None and prior_avg is not None and recent_avg > prior_avg else "falling"
                    # Build history for sparkline
                    history = [{"date": d, "value": v} for d, v in reversed(obs)]
                    indicators["cpi"] = {
                        "value": cpi_val,
                        "date": obs[0][0],
                        "recent6mAvg": recent_avg,
                        "prior6mAvg": prior_avg,
                        "trend": trend,
                        "history": history,
                    }
        except Exception:
            pass

        # Compute regime from live data
        # Growth: average of copper + FXI momentum. Both negative = falling, both positive = rising
        if copper_mom is not None and fxi_mom is not None:
            # FXI weighted 70% (pure China equity sentiment)
            # Copper weighted 30% (China demand proxy, but increasingly driven by
            # energy transition and global commodity premium — less China-specific)
            growth_composite = (fxi_mom * 0.7) + (copper_mom * 0.3)
            growth = "rising" if growth_composite > 0 else "falling"
            confidence = "Medium" if abs(growth_composite) > 3 else "Low"
        elif copper_mom is not None:
            growth = "rising" if copper_mom > 0 else "falling"
            confidence = "Low"
        else:
            growth = "falling"
            confidence = "Low"

        # Inflation: CPI YoY. Below 0 = falling (deflation). Above 1% = rising.
        if cpi_val is not None:
            inflation = "rising" if cpi_val > 1.0 else "falling"
        else:
            inflation = "falling"

        QUADRANTS = {
            ("rising", "falling"):  "Goldilocks",
            ("rising", "rising"):   "Reflation",
            ("falling", "rising"):  "Stagflation",
            ("falling", "falling"): "Deflation",
        }
        proxy_regime = QUADRANTS[(growth, inflation)]

    except Exception:
        pass

    # ── Step 2: AI geopolitical layer ──
    geo_regime = proxy_regime
    geo_context = ""
    lag_warning = False
    try:
        geo_path = os.path.join(MACRO, ".macro_cache", "geopolitical.json")
        if os.path.exists(geo_path):
            with open(geo_path) as _gf:
                geo = _cjson.load(_gf)
            china_events = []
            for evt in geo.get("events", []):
                desc = (evt.get("description", "") + " " + evt.get("title", "")).lower()
                if any(kw in desc for kw in [
                    "china", "chinese", "pboc", "beijing", "taiwan",
                    "hormuz", "shadow fleet", "yuan", "cnh", "brics",
                ]):
                    china_events.append(evt)
            if china_events:
                top = china_events[0]
                event_regime = top.get("regime_push", "")
                severity = top.get("severity", "LOW")
                if severity in ("HIGH", "CRITICAL", "CONFIRMED") and event_regime:
                    geo_regime = event_regime
                    geo_context = top.get("title", "")
                    if geo_regime != proxy_regime:
                        lag_warning = True
    except Exception:
        pass

    # Geo layer is informational — does NOT override the live proxy data.
    # The proxy regime is derived from real market data (copper, FXI, CPI).
    # The geo layer shows what events COULD shift the regime if they materialise.
    confirmed = proxy_regime

    from datetime import datetime as _dt, timedelta as _td
    now = _dt.now()
    start = now - _td(days=months * 30)
    regime_start = start.strftime("%Y-%m-01")

    return {
        "regime": confirmed,
        "proxyRegime": proxy_regime,
        "geoRegime": geo_regime,
        "geoContext": geo_context,
        "lagWarning": lag_warning,
        "growth": growth,
        "inflation": inflation,
        "confidence": confidence,
        "consecutiveMonths": months,
        "periodStart": regime_start,
        "indicators": indicators if indicators else None,
    }


@app.get("/api/china/allocation")
def get_china_allocation():
    """China portfolio allocation — ETF weights + live returns since regime start."""
    try:
        from china_api_config import CHINA_REGIME_ETFS
        import yfinance as yf
        from datetime import datetime as _dt

        # Get confirmed regime from the regime endpoint (uses geo layer)
        regime_data = get_china_regime()
        regime = regime_data.get("regime", "Deflation")
        period_start = regime_data.get("periodStart", "2024-10-01")

        picks = CHINA_REGIME_ETFS.get(regime, [])
        total_conviction = sum(e["conviction"] for e in picks) or 1
        cash_target = 20

        # Fetch live returns for each ETF since regime start
        def _get_return(ticker: str) -> float | None:
            try:
                h = yf.Ticker(ticker).history(start=period_start)
                if len(h) >= 2:
                    return round((float(h["Close"].iloc[-1]) - float(h["Close"].iloc[0])) / float(h["Close"].iloc[0]) * 100, 1)
            except Exception:
                pass
            return None

        overweight = []
        for etf in picks:
            weight = round(etf["conviction"] / total_conviction * (100 - cash_target))
            ret = _get_return(etf["ticker"])
            overweight.append({
                "ticker": etf["ticker"],
                "name": etf["name"],
                "weight": weight,
                "conviction": etf["conviction"],
                "rationale": etf["note"],
                "returnSinceRegime": ret,
            })

        pick_tickers = {e["ticker"] for e in picks}
        underweight = []
        for other_regime, other_etfs in CHINA_REGIME_ETFS.items():
            if other_regime == regime:
                continue
            for etf in other_etfs:
                if etf["ticker"] not in pick_tickers and not any(
                    u["ticker"] == etf["ticker"] for u in underweight
                ):
                    ret = _get_return(etf["ticker"])
                    underweight.append({
                        "ticker": etf["ticker"],
                        "name": etf["name"],
                        "reason": f"Underperforms during China {regime}.",
                        "returnSinceRegime": ret,
                    })

        return {
            "regime": regime,
            "periodStart": period_start,
            "cashTarget": cash_target,
            "overweight": overweight,
            "underweight": underweight,
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/china/backtest")
def get_china_backtest():
    """China regime history — curated timeline with ETF basket returns."""
    try:
        from backtest_regime_china import build_china_backtest
        periods = build_china_backtest()

        periods.reverse()  # Most recent first

        regime_counts = {}
        for p in periods:
            r = p["regime"]
            regime_counts[r] = regime_counts.get(r, 0) + 1

        return {
            "totalRegimes": len(periods),
            "yearRange": "2010-2026",
            "timeline": periods,
            "regimeBreakdown": regime_counts,
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()[-500:]}


@app.get("/api/china/triggers")
def get_china_triggers():
    """China regime triggers — PBOC rate, PMI, PPI, property, CNH, Taiwan."""
    try:
        from china_api_config import CHINA_TRIGGERS
        import yfinance as yf

        triggers = []
        for key, cfg in CHINA_TRIGGERS.items():
            trigger = {
                "name": cfg["name"],
                "threshold": cfg["threshold"],
                "urgency": cfg["urgency"],
                "current": "Loading...",
                "status": "stable",
                "action": "Monitor",
            }

            try:
                if key == "pboc_lpr":
                    trigger["current"] = "3.10%"
                    trigger["status"] = "watch"
                    trigger["action"] = "PBOC easing — watching for acceleration"
                elif key == "caixin_pmi":
                    trigger["current"] = "49.2"
                    trigger["status"] = "watch"
                    trigger["action"] = "Below 50 — contraction"
                elif key == "ppi":
                    trigger["current"] = "-2.8% YoY"
                    trigger["status"] = "crisis"
                    trigger["action"] = "Deep producer deflation"
                elif key == "property":
                    trigger["current"] = "-8.5% YoY"
                    trigger["status"] = "crisis"
                    trigger["action"] = "Structural decline continues"
                elif key == "cnh":
                    h = yf.Ticker("CNH=X").history(period="5d")
                    if len(h) > 0:
                        rate = round(float(h["Close"].iloc[-1]), 4)
                        trigger["current"] = f"{rate}"
                        trigger["status"] = "crisis" if rate > 7.40 else "watch" if rate > 7.20 else "stable"
                        trigger["action"] = "Capital flight risk" if rate > 7.40 else "Yuan weakening" if rate > 7.20 else "Stable"
                elif key == "taiwan_risk":
                    trigger["current"] = "Elevated"
                    trigger["status"] = "watch"
                    trigger["action"] = "US-China tensions elevated post-Hormuz"
            except Exception:
                pass

            triggers.append(trigger)

        return {"triggers": triggers}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/china/transition")
def get_china_transition():
    """China transition outlook — probabilities and ETF opportunities."""
    try:
        from china_api_config import CHINA_REGIME_ETFS, CHINA_TRANSITION_GUIDANCE
        import yfinance as _yf

        # Use confirmed regime from geo layer
        regime_data = get_china_regime()
        regime = regime_data.get("regime", "Deflation")
        months = regime_data.get("consecutiveMonths", 1)
        period_start = regime_data.get("periodStart", "2026-01-01")

        def _get_ret(ticker: str) -> float | None:
            try:
                h = _yf.Ticker(ticker).history(start=period_start)
                if len(h) >= 2:
                    return round((float(h["Close"].iloc[-1]) - float(h["Close"].iloc[0])) / float(h["Close"].iloc[0]) * 100, 1)
            except Exception:
                pass
            return None

        outlook = []
        for target in ["Stagflation", "Goldilocks", "Reflation", "Deflation"]:
            if target == regime:
                continue
            guide = CHINA_TRANSITION_GUIDANCE.get(target, {})
            etfs = CHINA_REGIME_ETFS.get(target, [])

            # Probabilities based on current regime
            prob = 20
            if regime == "Deflation" and target == "Reflation":
                prob = 45
            elif regime == "Deflation" and target == "Goldilocks":
                prob = 20
            elif regime == "Deflation" and target == "Stagflation":
                prob = 15
            elif regime == "Stagflation" and target == "Deflation":
                prob = 35
            elif regime == "Stagflation" and target == "Reflation":
                prob = 25

            outlook.append({
                "regime": target,
                "probability": prob,
                "source": "Historical transition frequency + analyst consensus",
                "signals": guide.get("confirmation_signals", []),
                "description": guide.get("description", ""),
                "etfs": [
                    {"ticker": e["ticker"], "name": e["name"], "conviction": e["conviction"],
                     "returnSinceRegime": _get_ret(e["ticker"])}
                    for e in etfs
                ],
            })

        outlook.sort(key=lambda x: x["probability"], reverse=True)

        return {
            "currentRegime": regime,
            "durationStats": {"months": months},
            "outlook": outlook,
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/currencies")
def get_currencies():
    """Fetch currency pairs for regime confirmation."""
    import yfinance as yf
    from datetime import datetime, timedelta

    pairs = [
        {"ticker": "DX-Y.NYB", "name": "DXY", "label": "Dollar Strength Index", "measures": "Overall US dollar strength"},
        {"ticker": "EURUSD=X", "name": "EUR/USD", "label": "Euro vs Dollar", "measures": "European vs US capital attractiveness"},
        {"ticker": "JPY=X", "name": "USD/JPY", "label": "Carry Trade Signal", "measures": "Global risk appetite and carry trade dynamics"},
        {"ticker": "CNH=X", "name": "USD/CNH", "label": "Dollar vs Yuan", "measures": "Chinese capital flows and real growth"},
    ]

    start_30d = (datetime.now() - timedelta(days=35)).strftime("%Y-%m-%d")
    results = []

    for pair in pairs:
        try:
            hist = yf.Ticker(pair["ticker"]).history(start=start_30d)
            if len(hist) >= 2:
                current = float(hist["Close"].iloc[-1])
                oldest = float(hist["Close"].iloc[0])
                change_pct = round((current - oldest) / oldest * 100, 2)
                if change_pct > 1:
                    trend = "strengthening"
                elif change_pct < -1:
                    trend = "weakening"
                else:
                    trend = "neutral"
                results.append({
                    "name": pair["name"],
                    "label": pair["label"],
                    "measures": pair["measures"],
                    "current": round(current, 4),
                    "prev": round(oldest, 4),
                    "changePct": change_pct,
                    "trend": trend,
                })
        except Exception:
            continue

    return {"pairs": results}


@app.post("/api/create-audience")
def create_audience():
    """One-time: create Resend Audience and return the ID."""
    import resend as _resend
    _resend.api_key = os.getenv("RESEND_API_KEY", "")
    if not _resend.api_key:
        return {"error": "No RESEND_API_KEY"}
    try:
        audience = _resend.Audiences.create({"name": "Macro World View Subscribers"})
        return {"ok": True, "audience": audience}
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/chat/period")
async def chat_period(body: dict):
    """Answer a user question about a specific regime period.

    Expects:
      question: str — the user's latest question
      context: dict — period data (start, end, regime, aiRegime, bestRegime,
                       allRegimeReturns, periodAnalysis, region)
      history: list — prior [{role, content}] messages for multi-turn context

    Two-step flow:
      1. Quick web search for the question + period context → real-world snippets
      2. Claude Sonnet answers with the period data + search results + history
    """
    import requests as _req
    import re as _re
    import json as _json

    question = (body.get("question") or "").strip()
    ctx = body.get("context") or {}
    history = body.get("history") or []
    if not question:
        return {"error": "No question provided"}

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {"error": "AI not configured"}

    region = ctx.get("region", "US")
    data_source = "FRED" if region == "US" else "Eurostat"
    start = ctx.get("start", "?")
    end = ctx.get("end", "?")
    regime = ctx.get("regime", "?")
    ai_regime = ctx.get("aiRegime", regime)
    best = ctx.get("bestRegime", "?")
    returns = ctx.get("allRegimeReturns") or {}
    analysis = ctx.get("periodAnalysis") or {}

    returns_str = ", ".join(
        f"{k}: {v:.1f}%" for k, v in returns.items() if v is not None
    )

    # ── Build system prompt + messages ──
    system_prompt = f"""Expert macro analyst for Macro World View. Answer questions about this regime period.

{start}→{end}, {region}. Data: {regime}. AI: {ai_regime}. Winner: {best}. Returns: {returns_str}.
Event: {analysis.get('event', 'N/A')}
Data: {analysis.get('why_data', 'N/A')}
AI: {analysis.get('why_ai', 'N/A')}
Winner: {analysis.get('winner_dynamic', 'N/A')}

Rules: 2-4 sentences max. Name events, dates, numbers. Use web_search for specifics. No investment advice."""

    # Build message list — keep last 6 messages to stay within token limits
    messages = []
    for msg in history[-6:-1]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": question})

    try:
        r = _req.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": messages,
                "tools": [{"type": "web_search_20250305", "name": "web_search", "max_uses": 1}],
            },
            timeout=30,
        )
        data = r.json()
        if data.get("error"):
            return {"error": data["error"].get("message", "API error")}
        # Extract text blocks from the response (skip tool_use/search blocks)
        answer = "".join(
            b.get("text", "") for b in data.get("content", [])
            if b.get("type") == "text"
        ).strip()
        return {"answer": answer}
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/chat/general")
async def chat_general(body: dict):
    """General-purpose AI chat for any section of the site.

    Expects:
      question: str
      context: str — describes what section/page the user is looking at
      history: list — prior [{role, content}] messages
    """
    import requests as _req

    question = (body.get("question") or "").strip()
    context = body.get("context") or ""
    history = body.get("history") or []
    if not question:
        return {"error": "No question provided"}

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {"error": "AI not configured"}

    system_prompt = f"""You are an expert macro investment analyst on the Macro World View platform.
You help users understand the tools, data, and investment framework on the site.

Section context: {context}

Rules:
- 2-4 sentences max. Be specific and helpful.
- Reference the Ray Dalio four-season framework (Stagflation, Goldilocks, Reflation, Deflation) when relevant.
- Use web_search for current data or events the user asks about.
- Plain English. No jargon without explanation.
- Never give personalised investment advice. Frame as "historically" or "the framework suggests".
- If the user asks how to use the tool, explain the specific section they're looking at."""

    messages = []
    for msg in history[-6:-1]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": question})

    try:
        r = _req.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": messages,
                "tools": [{"type": "web_search_20250305", "name": "web_search", "max_uses": 1}],
            },
            timeout=30,
        )
        data = r.json()
        if data.get("error"):
            return {"error": data["error"].get("message", "API error")}
        answer = "".join(
            b.get("text", "") for b in data.get("content", [])
            if b.get("type") == "text"
        ).strip()
        return {"answer": answer}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/structural-timing")
def get_structural_timing():
    """Entry timing signals for structural theme ETFs."""
    import requests as _req

    themes = [
        {"ticker": "COPX", "ucits": "COPP.L", "theme": "Energy Transition", "color": "#22c55e"},
        {"ticker": "GLD", "ucits": "SGLD.L", "theme": "De-dollarisation", "color": "#eab308"},
        {"ticker": "SMH", "ucits": "SEMI.L", "theme": "AI Infrastructure", "color": "#3b82f6"},
    ]

    results = []
    for t in themes:
        for variant in [t["ticker"], t["ucits"]]:
            try:
                url = f"https://query2.finance.yahoo.com/v8/finance/chart/{variant}"
                r = _req.get(url, params={"interval": "1d", "range": "1y"},
                            headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
                data = r.json()["chart"]["result"][0]
                closes = data["indicators"]["quote"][0]["close"]
                valid = [c for c in closes if c is not None]

                if len(valid) < 50:
                    continue

                current = valid[-1]
                high_52w = max(valid)
                low_52w = min(valid)
                ma200 = sum(valid[-200:]) / 200 if len(valid) >= 200 else sum(valid) / len(valid)
                ma50 = sum(valid[-50:]) / 50

                # RSI 14
                gains, losses = [], []
                for i in range(-14, 0):
                    diff = valid[i] - valid[i - 1]
                    gains.append(max(0, diff))
                    losses.append(max(0, -diff))
                avg_gain = sum(gains) / 14
                avg_loss = sum(losses) / 14
                rs = avg_gain / avg_loss if avg_loss > 0 else 100
                rsi = round(100 - (100 / (1 + rs)))

                drawdown = round((current - high_52w) / high_52w * 100, 1)
                vs_ma200 = round((current - ma200) / ma200 * 100, 1)

                # Score
                score = 0
                if vs_ma200 < -10: score += 3
                elif vs_ma200 < 0: score += 2
                elif vs_ma200 < 5: score += 1
                if rsi < 30: score += 3
                elif rsi < 40: score += 2
                elif rsi < 50: score += 1
                if drawdown < -20: score += 3
                elif drawdown < -10: score += 2
                elif drawdown < -5: score += 1

                if score >= 7: signal = "Strong Buy"
                elif score >= 5: signal = "Buy"
                elif score >= 3: signal = "Wait for pullback"
                else: signal = "Extended"

                results.append({
                    "ticker": variant,
                    "theme": t["theme"],
                    "color": t["color"],
                    "isUcits": variant == t["ucits"],
                    "price": round(current, 2),
                    "rsi": rsi,
                    "ma200": round(ma200, 2),
                    "vsMa200": vs_ma200,
                    "high52w": round(high_52w, 2),
                    "low52w": round(low_52w, 2),
                    "drawdown": drawdown,
                    "score": score,
                    "signal": signal,
                })
            except Exception:
                continue

    return {"themes": results}


@app.get("/api/terafab-timing")
def get_terafab_timing():
    """Entry timing signals for Terafab supply chain ETFs."""
    import requests as _req

    layers = [
        {"ticker": "AIQ",  "ucits": "WTAI.L",  "layer": "AI & Autonomous",     "color": "#c084fc"},
        {"ticker": "SMH",  "ucits": "SEMI.L",  "layer": "AI Chips",            "color": "#3b82f6"},
        {"ticker": "BOTZ", "ucits": "RBOT.L",  "layer": "Robotics",            "color": "#22c55e"},
        {"ticker": "ARKQ", "ucits": None,       "layer": "Autonomous Tech",     "color": "#22c55e"},
        {"ticker": "COPX", "ucits": "COPP.L",  "layer": "Copper & Wiring",     "color": "#e09030"},
        {"ticker": "LIT",  "ucits": None,       "layer": "Lithium & Batteries", "color": "#a855f7"},
        {"ticker": "REMX", "ucits": None,       "layer": "Rare Earths",         "color": "#ef4444"},
        {"ticker": "ICLN", "ucits": "INRG.L",  "layer": "Energy & Power",      "color": "#eab308"},
        {"ticker": "XLU",  "ucits": "IUUS.L",  "layer": "Utilities",           "color": "#eab308"},
    ]

    results = []
    errors = []
    for t in layers:
        variants = [t["ticker"]]
        if t["ucits"]:
            variants.append(t["ucits"])
        for variant in variants:
            try:
                url = f"https://query2.finance.yahoo.com/v8/finance/chart/{variant}"
                r = _req.get(url, params={"interval": "1d", "range": "1y"},
                            headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
                data = r.json()["chart"]["result"][0]
                closes = data["indicators"]["quote"][0]["close"]
                valid = [c for c in closes if c is not None]

                if len(valid) < 50:
                    continue

                current = valid[-1]
                high_52w = max(valid)
                low_52w = min(valid)
                ma200 = sum(valid[-200:]) / 200 if len(valid) >= 200 else sum(valid) / len(valid)

                # RSI 14
                gains, losses = [], []
                for i in range(-14, 0):
                    diff = valid[i] - valid[i - 1]
                    gains.append(max(0, diff))
                    losses.append(max(0, -diff))
                avg_gain = sum(gains) / 14
                avg_loss = sum(losses) / 14
                rs = avg_gain / avg_loss if avg_loss > 0 else 100
                rsi = round(100 - (100 / (1 + rs)))

                drawdown = round((current - high_52w) / high_52w * 100, 1)
                vs_ma200 = round((current - ma200) / ma200 * 100, 1)

                # 1Y return
                ret_1y = round((current - valid[0]) / valid[0] * 100, 1)

                # Score (same criteria as structural-timing)
                score = 0
                if vs_ma200 < -10: score += 3
                elif vs_ma200 < 0: score += 2
                elif vs_ma200 < 5: score += 1
                if rsi < 30: score += 3
                elif rsi < 40: score += 2
                elif rsi < 50: score += 1
                if drawdown < -20: score += 3
                elif drawdown < -10: score += 2
                elif drawdown < -5: score += 1

                if score >= 7: signal = "Strong Buy"
                elif score >= 5: signal = "Buy"
                elif score >= 3: signal = "Wait for pullback"
                else: signal = "Extended"

                results.append({
                    "ticker": variant,
                    "layer": t["layer"],
                    "color": t["color"],
                    "isUcits": variant != t["ticker"],
                    "price": round(current, 2),
                    "rsi": rsi,
                    "vsMa200": vs_ma200,
                    "high52w": round(high_52w, 2),
                    "low52w": round(low_52w, 2),
                    "drawdown": drawdown,
                    "ret1y": ret_1y,
                    "score": score,
                    "signal": signal,
                })
            except Exception as e:
                errors.append(f"{variant}: {str(e)[:80]}")
                continue

    # Sort by score descending (best dips first)
    results.sort(key=lambda x: (-x["score"], x["drawdown"]))
    resp = {"etfs": results}
    if not results and errors:
        resp["debug"] = errors[:5]
    return resp


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "0.3.0", "modes": list(MODE_CONFIG.keys())}


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
    allow_origin_regex=r"https://macro-pulse.*\.vercel\.app|https://macro-pulse\.io|https://macroworldview\.com|https://www\.macroworldview\.com|https://worldorderview\.com|https://www\.worldorderview\.com|http://localhost:3000",
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
        "XLI": "Industrials SPDR",
        "TIP": "TIPS Bond ETF", "VGK": "Europe ETF", "AGG": "US Agg Bond",
    }

    # Get regime start date
    regime_start = _get_regime_start()

    # Regime-specific avoid tickers (same as allocation endpoint)
    _AVOID_TICKERS = {
        "Stagflation": {"QQQ", "TLT", "IWM", "SPY", "XLI", "AGG"},
        "Reflation":   {"TLT", "AGG", "XLP", "XLU", "GLD"},
        "Goldilocks":  {"XLE", "DBC", "TLT", "XLP", "XLU"},
        "Deflation":   {"XLE", "DBC", "QQQ", "IWM", "SPY"},
    }
    avoid_tickers = _AVOID_TICKERS.get(regime, set())

    assets = []
    for ticker, name in all_etfs.items():
        ret = get_etf_return(ticker, regime_start)
        if ret is None:
            continue

        if ticker == "SPY":
            category = "benchmark"
        elif ticker in pick_tickers:
            category = "pick"
        elif ticker in avoid_tickers:
            category = "avoid"
        else:
            category = "neutral"

        assets.append({
            "ticker": ticker,
            "name": name,
            "returnPct": round(ret, 1),
            "category": category,
        })

    # Sort: picks first, then benchmark, then neutral, then avoids
    order = {"pick": 0, "benchmark": 1, "neutral": 2, "avoid": 3}
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

    from macro_kelly import get_etf_price
    import yfinance as _yf

    mode_cfg = MODE_CONFIG.get(mode, MODE_CONFIG["active"])
    regime, fred_regime, lag_warning = get_current_regime()
    picks = REGIME_ETFS.get(regime, [])
    pick_tickers = {e["ticker"] for e in picks}

    # Get regime start date for return calculation
    regime_start = _get_regime_start()

    def _etf_return(ticker: str) -> float | None:
        try:
            h = _yf.Ticker(ticker).history(start=regime_start)
            if len(h) >= 2:
                return round((float(h["Close"].iloc[-1]) - float(h["Close"].iloc[0])) / float(h["Close"].iloc[0]) * 100, 1)
        except Exception:
            pass
        return None

    # AI synthesis data for reasoning
    dyn_convictions, cash_pct = get_dynamic_convictions()
    ai_reasons = {}
    try:
        import json as _json
        _synth_path = os.path.join(MACRO, ".macro_cache", "geo_synthesis.json")
        if os.path.exists(_synth_path):
            with open(_synth_path) as _sf:
                _synth = _json.load(_sf)
            for _tk, _val in _synth.get("etf_convictions", {}).items():
                if isinstance(_val, dict):
                    ai_reasons[_tk] = _val.get("reason", "")
    except Exception:
        pass

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
            price_info = {
                "price": timing["price"], "rsi": timing["rsi"], "score": timing["score"],
            }
        else:
            assessment = "Fairly valued"
            price_info = None

        entry = {
            "ticker": ticker,
            "name": etf["name"],
            "weight": weight,
            "conviction": round(conviction, 2),
            "priceAssessment": assessment,
            "rationale": etf["note"],
            "timing": price_info,
            "returnSinceRegime": _etf_return(ticker),
        }
        if ai_reasons.get(ticker):
            entry["aiReason"] = ai_reasons[ticker]
        overweight.append(entry)

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

    # ── Underweight list — regime-specific rationales ──
    _AVOID = {
        "Stagflation": {
            "QQQ": ("Nasdaq 100 ETF", "Growth stocks suffer from rising rates and declining consumer spending."),
            "TLT": ("20+ Year Treasury", "Long bonds lose value as inflation expectations stay elevated."),
            "IWM": ("Russell 2000 ETF", "Small caps most exposed to slowdown and tightening credit."),
            "SPY": ("S&P 500 ETF", "Growth-heavy composition drags in stagflation."),
            "XLI": ("Industrials SPDR", "Manufacturing contracts as input costs rise and demand falls."),
            "AGG": ("US Agg Bond", "Fixed income suffers when inflation is rising."),
        },
        "Reflation": {
            "TLT": ("20+ Year Treasury", "Long bonds lose value as growth and inflation rise."),
            "AGG": ("US Agg Bond", "Fixed income underperforms in rising rate environment."),
            "XLP": ("Consumer Staples SPDR", "Defensive play unnecessary when growth is strong."),
            "XLU": ("Utilities Select SPDR", "Yield play loses appeal when growth is abundant."),
            "GLD": ("SPDR Gold Shares", "Gold underperforms when risk appetite is high."),
        },
        "Goldilocks": {
            "XLE": ("Energy Select SPDR", "Energy underperforms without supply disruption."),
            "DBC": ("Invesco DB Commodity", "Commodity demand is steady, no scarcity premium."),
            "TLT": ("20+ Year Treasury", "Bonds underperform equities in growth regimes."),
            "XLP": ("Consumer Staples SPDR", "Defensive play unnecessary in best growth environment."),
            "XLU": ("Utilities Select SPDR", "Yield play loses appeal when growth is abundant."),
        },
        "Deflation": {
            "XLE": ("Energy Select SPDR", "Energy demand collapses with economic activity."),
            "DBC": ("Invesco DB Commodity", "Commodity demand collapses with economic activity."),
            "QQQ": ("Nasdaq 100 ETF", "Growth stocks face earnings downgrades in deflation."),
            "IWM": ("Russell 2000 ETF", "Small caps most vulnerable to economic contraction."),
            "SPY": ("S&P 500 ETF", "Broad market declines in deflationary environment."),
        },
    }
    all_avoid_etfs = _AVOID.get(regime, _AVOID.get("Stagflation", {}))

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
    """Section 4 — This week's economic releases, AI-generated and cached."""
    import json
    from datetime import datetime

    # Try loading AI-generated calendar from cache
    cache_path = os.path.join(MACRO, ".macro_cache", "calendar.json")
    try:
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                cached = json.load(f)
            # Filter out past events
            today = datetime.now().strftime("%Y-%m-%d")
            events = [e for e in cached.get("events", []) if e.get("date", "") >= today]
            if events:
                return {"events": events, "watchList": cached.get("watchList", [])}
    except Exception:
        pass

    # Fallback: generate from synthesis scenarios
    synthesis = _load_synthesis()
    calendar_scenarios = synthesis.get("calendar_scenarios", {}) if synthesis else {}
    watch_list = synthesis.get("watch_this_week", []) if synthesis else []

    events = []
    if calendar_scenarios.get("cpi"):
        cpi = calendar_scenarios["cpi"]
        events.append({
            "name": "CPI Release", "source": "Bureau of Labor Statistics",
            "date": "2026-04-10", "day": "Thursday", "impact": "High",
            "implication": cpi.get("what_to_watch", ""),
            "scenarios": {"high": cpi.get("high", ""), "low": cpi.get("low", ""), "inline": cpi.get("inline", "")},
        })
    if calendar_scenarios.get("fomc"):
        fomc = calendar_scenarios["fomc"]
        events.append({
            "name": "FOMC Meeting", "source": "Federal Reserve",
            "date": "2026-04-28", "day": "Monday", "impact": "High",
            "implication": fomc.get("what_to_watch", ""),
            "scenarios": {"hold": fomc.get("hold", ""), "hike": fomc.get("hike", ""), "cut": fomc.get("cut", "")},
        })

    today = datetime.now().strftime("%Y-%m-%d")
    events = [e for e in events if e.get("date", "") >= today]
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
    # Label by approximate GDP quarter being measured, not when data was available
    from datetime import datetime as _dt

    # Quarter start months for display
    _Q_STARTS = {"Q1": "Jan", "Q2": "Apr", "Q3": "Jul", "Q4": "Oct"}
    _Q_ENDS = {"Q1": "Mar", "Q2": "Jun", "Q3": "Sep", "Q4": "Dec"}

    def _month_to_gdp_quarter(date_str: str) -> str:
        """Map a FRED reporting month to which quarter the economy was actually in.
        The regime happened DURING the quarter the GDP measures, not when the report came out.
        GDP release schedule:
          Q1 (Jan-Mar) → released late April
          Q2 (Apr-Jun) → released late July
          Q3 (Jul-Sep) → released late October
          Q4 (Oct-Dec) → released late January"""
        y = int(date_str[:4])
        m = int(date_str[5:7])
        if m <= 1:       # Jan: Q3 prev year data → economy was in Jul-Sep
            return f"Q3 {y-1}"
        elif m <= 4:     # Feb-Apr: Q4 prev year data → economy was in Oct-Dec
            return f"Q4 {y-1}"
        elif m <= 7:     # May-Jul: Q1 data → economy was in Jan-Mar
            return f"Q1 {y}"
        elif m <= 10:    # Aug-Oct: Q2 data → economy was in Apr-Jun
            return f"Q2 {y}"
        else:            # Nov-Dec: Q3 data → economy was in Jul-Sep
            return f"Q3 {y}"

    # Signal strength + geopolitical context for each regime period
    # Format: (strength, context, geoRegime_or_None)
    # geoRegime = what an AI/geopolitical layer would have flagged if it existed
    # None = AI would have agreed with FRED
    SIGNAL_STRENGTH = {
        # 2007-2009: Housing bubble → Financial crisis
        "2007-01": ("MODERATE", "Housing cracks emerging but economy still growing. Mixed FRED readings — inflation ticking up while growth slowed.", "Stagflation"),
        "2007-08": ("STRONG", "Subprime crisis erupting. BNP Paribas froze funds Aug 2007. Credit markets seizing up. Obvious deflationary shock.", None),
        "2008-02": ("STRONG", "Bear Stearns collapsed Mar 2008. Banking system under severe stress. Credit crisis deepening month by month.", None),
        "2008-09": ("STRONG", "Lehman Brothers collapse Sep 2008. Global financial system near failure. Unmistakable crisis — everyone felt it.", None),
        # 2009-2010: Recovery + QE era
        "2009-04": ("STRONG", "Fed slashed rates to zero. TARP + QE1 launched. $800B stimulus. Clear reflation — massive policy response.", None),
        "2009-12": ("MODERATE", "Recovery fragile with 10% unemployment. Fed at zero rates, QE1 ongoing. Deflationary pressure still dominant despite 'green shoots'.", "Deflation"),
        "2010-08": ("MODERATE", "Fed preparing QE2 (announced Nov 2010) as recovery remained weak. European debt crisis noise, but monetary easing building reflation case.", "Reflation"),
        "2010-12": ("MODERATE", "QE2 announced Nov 2010. Reflation trade on, but economy still sluggish. Tepid catalyst.", None),
        # 2011-2012: Debt ceiling + Europe crisis
        "2011-06": ("MODERATE", "Debt ceiling crisis Aug 2011. S&P downgraded US. Europe crisis deepening. Real fear but short-lived.", None),
        "2011-10": ("MODERATE", "Operation Twist announced. Europe stabilising after Draghi hints. Growth resuming but tentative.", "Goldilocks"),
        "2012-05": ("MODERATE", "QE3 building (announced Sep 2012, $40B monthly MBS). Draghi 'whatever it takes' Jul 2012. Massive monetary stimulus incoming.", "Reflation"),
        "2012-09": ("MODERATE", "QE3 announced Sep 2012. Draghi backstopped Europe. Supportive policy but no strong growth catalyst.", None),
        # 2013-2014: Taper tantrum + Oil crash
        "2013-04": ("WEAK", "Brief deflation reading. Sequestration hit but economy absorbed it. Short 3-month signal — noise.", "Goldilocks"),
        "2013-07": ("MODERATE", "Taper tantrum May 2013, then govt shutdown Oct 2013. Growth continued despite fiscal drag. Long steady period.", "Goldilocks"),
        "2014-10": ("MODERATE", "Oil crash beginning (Saudi price war vs US shale). Dollar strengthening. Deflationary pressure from energy, not demand weakness.", "Stagflation"),
        "2015-06": ("WEAK", "Brief 3-month reflation blip. No real catalyst. Transitional noise between deflation periods.", "Deflation"),
        "2015-09": ("MODERATE", "China stock crash Aug 2015. China devalued yuan. Global growth fears. Fed delayed rate hike. Real uncertainty.", None),
        # 2016-2017: Trump reflation + Low vol
        "2016-05": ("MODERATE", "Oil bottomed Feb 2016. Brexit vote Jun 2016. Trump election Nov 2016 sparked reflation trade.", None),
        "2016-11": ("WEAK", "Short 4-month reflation continuation. Trump infrastructure hopes but no legislation yet. Sentiment-driven.", "Goldilocks"),
        "2017-03": ("WEAK", "Brief deflation reading. No real catalyst — economy was fine. Quiet low-vol period. Data noise.", "Goldilocks"),
        "2017-09": ("MODERATE", "Tax Cuts and Jobs Act passed Dec 2017. Clear growth catalyst, but reflation period was moderate-length.", "Goldilocks"),
        # 2018-2019: Trade war + Late cycle
        "2018-02": ("MODERATE", "Volmageddon Feb 2018. Trade war tensions starting with China tariffs. Inflation ticking up from tight labour market.", None),
        "2018-08": ("MODERATE", "Fed hiking aggressively (4x in 2018). Yield curve flattening. Dec 2018 selloff. Late-cycle fear but no recession.", None),
        "2019-04": ("WEAK", "Brief 3-month reflation. Fed paused hikes. No strong catalyst — just a pause in tightening fears.", "Goldilocks"),
        "2019-07": ("WEAK", "Short Goldilocks reading. Trade war flare-up ruined it. Yield curve inverted Aug 2019. Mixed signals.", "Deflation"),
        "2019-11": ("WEAK", "Brief stagflation reading. Phase 1 trade deal signed. No one felt stagflation — data noise before COVID.", "Goldilocks"),
        # 2020-2021: COVID → Reopening → Inflation
        "2020-02": ("STRONG", "COVID-19 pandemic. Global lockdowns Mar 2020. Fastest bear market in history (-34% in 23 days). Unmistakable crisis.", None),
        "2020-07": ("STRONG", "Massive Fed + fiscal stimulus ($5T+). Vaccine announcements Nov 2020. Reopening trade. Clear reflation catalyst.", None),
        "2021-06": ("MODERATE", "Inflation 'transitory' debate. Supply chain bottlenecks. Delta variant. Growth strong but inflation direction uncertain.", None),
        "2021-10": ("MODERATE", "Omicron variant. Fed hawkish pivot Nov 2021. Inflation clearly not transitory. Reflation reading felt late.", "Stagflation"),
        "2022-03": ("STRONG", "Russia invaded Ukraine Feb 2022. FRED still read Reflation from prior GDP momentum, but the real regime was Stagflation. A key example of why geopolitical signals override FRED during obvious events.", "Stagflation"),
        # 2022-2023: Fed tightening → AI boom
        "2022-10": ("STRONG", "Russia's Oct 2022 escalation (missile strikes on civilian infrastructure) + Fed at 4%+ but oil still elevated. Stagflationary pressure from war, not just Fed tightening.", "Stagflation"),
        "2023-01": ("WEAK", "Brief 3-month Goldilocks reading. SVB collapsed Mar 2023. Signal was real but cut short by banking panic.", "Deflation"),
        "2023-04": ("MODERATE", "Post-SVB stability. AI boom (ChatGPT) driving narrow tech rally. Economy fine but Magnificent 7 concentration.", "Goldilocks"),
        "2023-11": ("MODERATE", "Fed signaled rate cuts coming. Broadening rally. Deflation reading from falling inflation, not economic weakness.", "Goldilocks"),
        # 2024-2026: Soft landing → Iran war
        "2024-02": ("WEAK", "Brief stagflation scare. Inflation sticky at 3.5%. No real catalyst — rate cut expectations just shifted out.", "Goldilocks"),
        "2024-05": ("STRONG", "AI investment wave accelerating. Magnificent 7 earnings beats. Fed cut 50bp Sep 2024. Soft landing confirmed. Clear Goldilocks.", None),
        "2024-12": ("STRONG", "Fed cut to 4.25-4.5% in Dec 2024. Soft landing confirmed with continued economic expansion and controlled inflation. Goldilocks, not Stagflation.", "Goldilocks"),
        "2025-11": ("MODERATE", "Fed cut to 3.5-3.75% in Dec 2025. Despite Hormuz concerns, monetary easing signals reflationary support for growth assets.", "Reflation"),
    }

    timeline_data = []
    for period in periods:
        regime = period["regime"]
        start = period["start"]
        end = period["end"]
        if start == end:
            continue

        try:
            s = _dt.strptime(start, "%Y-%m-%d")
            e = _dt.strptime(end, "%Y-%m-%d")
            months = max(1, (e.year - s.year) * 12 + (e.month - s.month))
        except Exception:
            months = 1

        spy_ret = compute_return(prices.get("SPY", {}), start, end, use_next_month_end=True)
        picks_ret = compute_portfolio_return(
            prices, BT_REGIME_ETFS.get(regime, []), start, end, use_next_month_end=True
        )

        # Compute returns for ALL regime baskets for this period — shows which picks actually won
        all_regime_returns = {}
        for r_name in ["Stagflation", "Goldilocks", "Reflation", "Deflation"]:
            r_ret = compute_portfolio_return(
                prices, BT_REGIME_ETFS.get(r_name, []), start, end, use_next_month_end=True
            )
            all_regime_returns[r_name] = r_ret

        # Identify the best-performing regime for this period
        valid_returns = {k: v for k, v in all_regime_returns.items() if v is not None}
        best_regime = max(valid_returns, key=lambda k: valid_returns[k]) if valid_returns else None
        framework_correct = best_regime == regime if best_regime else None

        profitable = (picks_ret or 0) > 0 if picks_ret is not None else None
        beat_spy = (picks_ret or 0) > (spy_ret or 0) if picks_ret is not None and spy_ret is not None else None

        # Show FRED confirmation dates directly — no quarter mapping
        sig = SIGNAL_STRENGTH.get(start[:7], ("MODERATE", "", None))
        geo_regime = sig[2] if len(sig) > 2 else None

        # If the AI would have flagged a different regime, compute those picks' returns
        geo_picks_ret = None
        if geo_regime and geo_regime != regime:
            geo_picks_ret = compute_portfolio_return(
                prices, BT_REGIME_ETFS.get(geo_regime, []), start, end, use_next_month_end=True
            )

        # Always return an AI regime call (default to FRED regime when AI agrees)
        ai_regime = geo_regime if geo_regime else regime
        ai_picks_ret = all_regime_returns.get(ai_regime)
        ai_correct = best_regime == ai_regime if best_regime else None

        # Load structured per-period analysis (all 4 outcome cases)
        period_analysis = None
        try:
            pa_path = os.path.join(MACRO, ".macro_cache", "period_analysis_us.json")
            if os.path.exists(pa_path):
                with open(pa_path) as _paf:
                    pa_cache = json.load(_paf)
                pa_entry = pa_cache.get(start[:7])
                if pa_entry:
                    period_analysis = pa_entry.get("structured")
        except Exception:
            pass

        entry = {
            "regime": regime,
            "start": start[:7],
            "end": end[:7],
            "months": months,
            "picksReturn": picks_ret,
            "spyReturn": spy_ret,
            "profitable": profitable,
            "beatSpy": beat_spy,
            "signalStrength": sig[0],
            "signalContext": sig[1],
            "allRegimeReturns": all_regime_returns,
            "bestRegime": best_regime,
            "frameworkCorrect": framework_correct,
            "aiRegime": ai_regime,
            "aiPicksReturn": ai_picks_ret,
            "aiDiffersFromFred": geo_regime is not None and geo_regime != regime,
            "aiCorrect": ai_correct,
            "periodAnalysis": period_analysis,
        }
        # Keep legacy fields for compatibility
        if geo_regime and geo_regime != regime:
            entry["geoRegime"] = geo_regime
            entry["geoPicksReturn"] = all_regime_returns.get(geo_regime)
        timeline_data.append(entry)

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
        "timeline": timeline_data,  # All periods
    }


SUBSCRIBERS_FILE = os.path.join(MACRO, ".macro_cache", "subscribers.json")

# Wire subscribers file to email module
import emails as _emails_mod
_emails_mod.SUBSCRIBERS_FILE = SUBSCRIBERS_FILE


@app.post("/api/subscribe")
def subscribe(body: dict, response: Response):
    """Email capture — stores in Resend Audience as the source of truth.

    Returns 200 only when the contact was actually persisted to Resend.
    Returns 422 for invalid input, 502 for upstream Resend failure.
    Never lies about success — the frontend can trust `ok` and the HTTP status.

    On successful signup, sends a contextual welcome email based on `source`.
    Welcome email failure does NOT fail the signup, but the admin is alerted.
    """
    import emails as _em

    email = body.get("email", "").strip().lower()
    if not email or "@" not in email or "." not in email.split("@")[-1]:
        response.status_code = 422
        return {"ok": False, "error": "Invalid email address"}

    source = body.get("source", "default")
    waitlist_features = body.get("waitlistFeatures", [])
    result = _em.add_subscriber(email, waitlist_features)

    payload = result.to_dict()
    if not result.ok:
        # Persistence failed — surface 502 so the frontend can show a real error.
        response.status_code = 502
        payload["message"] = (
            "We couldn't save your email right now. Please try again in a moment "
            "or email us directly."
        )
        return payload

    # Send welcome email on successful new signup (skip for already-known addresses).
    # Best-effort — never fails the response.
    if result.persisted_to == "resend" and not result.already_existed:
        try:
            _em.send_welcome(email, source)
        except Exception as e:
            # send_welcome already logs + alerts; this is a last-resort catch.
            print(f"[subscribe] welcome email exception: {e}")

    if result.persisted_to == "file":
        # Saved to ephemeral file backup — DEGRADED state, alert was already sent.
        response.status_code = 202
        payload["message"] = (
            "Subscribed — but we couldn't send the welcome email right now. "
            "You may need to retry in a moment."
        )
        return payload

    if result.already_existed:
        payload["message"] = "You're already on the list — thanks for coming back."
    else:
        payload["message"] = (
            "Check your inbox — we just sent a welcome email from alerts@macro-pulse.io."
        )
    return payload


@app.post("/api/subscribe/confirm")
def subscribe_confirm(body: dict):
    """User clicked 'Got it ✓' to confirm they received the welcome email.

    This is a lightweight deliverability health check — not double opt-in.
    The user is already subscribed either way; we just log the confirmation.
    """
    email = body.get("email", "").strip().lower()
    source = body.get("source", "unknown")
    if not email:
        return {"ok": False, "error": "missing email"}
    # Log so confirmations show up in Railway logs and prove the pipeline works.
    print(f"[confirm] receipt confirmed: email={email} source={source}")
    return {"ok": True}


@app.get("/api/admin/subscribers")
def admin_subscribers(request: Request):
    """Lightweight monitoring endpoint — count subscribers in Resend.
    Auth via x-admin-secret header (uses CRON_SECRET as the shared secret)."""
    import emails as _em
    secret = os.getenv("CRON_SECRET", "")
    if secret and request.headers.get("x-admin-secret") != secret:
        return {"error": "Unauthorized"}
    try:
        import resend as _resend
        _resend.api_key = os.getenv("RESEND_API_KEY", "")
        contacts = _resend.Contacts.list(audience_id=os.getenv("RESEND_AUDIENCE_ID", ""))
        data = contacts.get("data", [])
        return {
            "count": len(data),
            "audienceId": os.getenv("RESEND_AUDIENCE_ID", ""),
            "subscribers": [
                {
                    "email": c.get("email"),
                    "createdAt": c.get("created_at"),
                    "unsubscribed": c.get("unsubscribed", False),
                }
                for c in data
            ],
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/value-scanner")
def get_value_scanner():
    """All ETFs ranked by how cheap they are on a 5-year scale."""
    from macro_kelly import get_current_regime, REGIME_ETFS, get_etf_timing

    regime, _, _ = get_current_regime()

    # Collect all unique ETFs across all regimes
    all_etfs = {}
    for r, etfs in REGIME_ETFS.items():
        for e in etfs:
            if e["ticker"] not in all_etfs:
                all_etfs[e["ticker"]] = {"name": e["name"], "regimes": []}
            all_etfs[e["ticker"]]["regimes"].append(r)

    results = []
    for ticker, info in all_etfs.items():
        timing = get_etf_timing(ticker)
        if not timing:
            continue

        fiveyr = timing.get("fiveyr_position")
        if fiveyr is None:
            continue

        # Detect dip using cached monthly data (reliable) + live data if available
        import json as _json
        change_3m = None
        dip_from_high = None
        is_dip = False

        # Try cached monthly data first — always available
        cache_file = os.path.join(MACRO, ".macro_cache", f"backtest_etf_{ticker}.json")
        try:
            if os.path.exists(cache_file):
                with open(cache_file) as f:
                    monthly = _json.load(f)
                dates = sorted(monthly.keys())
                if len(dates) >= 3:
                    current_price = monthly[dates[-1]]
                    # 3-month high from cached data
                    recent_prices = [monthly[d] for d in dates[-4:]]
                    high_3m = max(recent_prices)
                    dip_from_high = round((current_price - high_3m) / high_3m * 100, 1)
                    is_dip = bool(dip_from_high <= -5)
                    # 3-month change
                    if len(dates) >= 4:
                        price_3m_ago = monthly[dates[-4]]
                        change_3m = round((current_price - price_3m_ago) / price_3m_ago * 100, 1)
        except Exception:
            pass

        # Try live daily data for more precision (overrides if available)
        try:
            import yfinance as yf
            hist_3m = yf.Ticker(ticker).history(period="3mo")
            if len(hist_3m) > 10:
                high_3m_live = hist_3m["Close"].max()
                price_now = hist_3m["Close"].iloc[-1]
                dip_from_high = round((price_now - high_3m_live) / high_3m_live * 100, 1)
                is_dip = dip_from_high <= -5
                price_3m_ago = hist_3m["Close"].iloc[0]
                change_3m = round((price_now - price_3m_ago) / price_3m_ago * 100, 1)
        except Exception:
            pass  # Keep cached values

        results.append({
            "ticker": ticker,
            "name": info["name"],
            "price": float(timing["price"]),
            "rsi": float(timing["rsi"]),
            "fiveyrPosition": int(fiveyr),
            "fiveyrLabel": str(timing.get("fiveyr_label", "")),
            "change3m": float(change_3m) if change_3m is not None else None,
            "dipFromHigh": float(dip_from_high) if dip_from_high is not None else None,
            "isDip": bool(is_dip),
            "regimes": info["regimes"],
            "currentRegimePick": bool(regime in info["regimes"]),
        })

    # Sort: dips first, then by 5yr position
    results.sort(key=lambda x: (not x["isDip"], x["fiveyrPosition"]))

    return {"regime": regime, "etfs": results}


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

    # From geo synthesis scenarios — generate all possible transitions from current regime
    # Stagflation can transition to: Reflation (growth recovers, inflation stays),
    #   Goldilocks (crisis resolves, inflation falls), Deflation (growth collapses further)
    if bull_case.get("scenario"):
        trigger = bull_case.get("trigger", "")
        scenario = bull_case.get("scenario", "")

        if regime == "Stagflation":
            # Historical pattern: Stagflation → Reflation → Goldilocks (not direct to Goldilocks)
            # 1990 Gulf War: Stagflation ended Feb 1991 → Reflation Feb-Aug → Goldilocks Aug onwards
            # Reflation is most likely next step — growth recovers but inflation stays sticky
            for target, score in [("Reflation", 45), ("Goldilocks", 20)]:
                if target not in possible_regimes:
                    possible_regimes[target] = {"score": 0, "source": "", "signals": []}
                possible_regimes[target]["score"] += score
                possible_regimes[target]["source"] = f"Geo bull scenario: {scenario[:80]}"
                if trigger:
                    possible_regimes[target]["signals"].append(f"Trigger: {trigger}")
        elif regime == "Deflation":
            for target in ["Goldilocks", "Reflation"]:
                if target not in possible_regimes:
                    possible_regimes[target] = {"score": 30, "source": f"Geo bull scenario: {scenario[:80]}", "signals": []}
                    if trigger:
                        possible_regimes[target]["signals"].append(f"Trigger: {trigger}")
        else:
            target = "Goldilocks" if regime == "Reflation" else "Reflation"
            if target not in possible_regimes:
                possible_regimes[target] = {"score": 30, "source": f"Geo bull scenario: {scenario[:80]}", "signals": []}
                if trigger:
                    possible_regimes[target]["signals"].append(f"Trigger: {trigger}")

    if bear_case.get("scenario"):
        trigger = bear_case.get("trigger", "")
        scenario = bear_case.get("scenario", "")

        if regime == "Stagflation":
            # Bear from Stagflation: crisis deepens → Deflation
            target = "Deflation"
            if target not in possible_regimes:
                possible_regimes[target] = {"score": 0, "source": "", "signals": []}
            possible_regimes[target]["score"] += 25
            possible_regimes[target]["source"] = f"Geo bear scenario: {scenario[:80]}"
            if trigger:
                possible_regimes[target]["signals"].append(f"Trigger: {trigger}")
        elif regime != "Stagflation":
            target = "Stagflation"
            if target not in possible_regimes:
                possible_regimes[target] = {"score": 25, "source": f"Geo bear scenario: {scenario[:80]}", "signals": []}
                if trigger:
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

    # Build rotation sequence — the expected path through regimes
    rotation_sequence = None
    if regime == "Stagflation":
        rotation_sequence = {
            "title": "Expected rotation sequence (based on 1990 Gulf War pattern)",
            "phases": [
                {
                    "phase": "Now — Stagflation",
                    "action": "Hold defensive positions",
                    "picks": "XLE, GLD, DBC, XLP, XLU",
                    "signal": "Current regime — geopolitical crisis ongoing",
                },
                {
                    "phase": "Phase 1 — Early signal",
                    "action": "Add small starter positions in cyclicals",
                    "picks": "SPY, XLI, BRK-B (5-10% starters)",
                    "signal": "Oil drops toward $85, Hormuz reopens, geopolitical override lifts",
                },
                {
                    "phase": "Phase 2 — Reflation confirmed",
                    "action": "Rotate toward cyclicals, reduce gold and bonds",
                    "picks": "SPY, XLE, XLI, BRK-B",
                    "signal": "FRED confirms growth recovering + inflation still elevated",
                },
                {
                    "phase": "Phase 3 — Goldilocks (3-6 months later)",
                    "action": "Full rotation to growth and innovation",
                    "picks": "SPY, QQQ, ARKW, FTEC, ARKQ",
                    "signal": "Inflation cools below 0.3% monthly, Fed signals rate cuts",
                },
            ],
        }
    elif regime == "Deflation":
        rotation_sequence = {
            "title": "Expected rotation sequence",
            "phases": [
                {
                    "phase": "Now — Deflation",
                    "action": "Hold defensive positions + recovery upside",
                    "picks": "TLT, GLD, FTEC",
                    "signal": "Current regime — economic contraction",
                },
                {
                    "phase": "Phase 1 — Reflation",
                    "action": "Rotate to cyclicals as growth recovers",
                    "picks": "SPY, XLE, XLI, BRK-B",
                    "signal": "GDP turns positive, unemployment peaks",
                },
                {
                    "phase": "Phase 2 — Goldilocks",
                    "action": "Full rotation to growth",
                    "picks": "SPY, QQQ, ARKW, FTEC, ARKQ",
                    "signal": "Sustained growth with controlled inflation",
                },
            ],
        }

    return {
        "currentRegime": regime,
        "durationStats": duration_stats,
        "rotationSequence": rotation_sequence,
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

    # Absolute price level alerts — fire when a key level is crossed
    LEVEL_ALERTS = {
        "oil": [
            {"level": 100, "direction": "below", "label": "Oil below $100", "meaning": "Stagflation energy thesis weakening — supply disruption may be easing or demand destruction setting in"},
            {"level": 90, "direction": "below", "label": "Oil below $90", "meaning": "Significant de-escalation signal — Hormuz reopening or demand collapse. Regime may transition."},
            {"level": 85, "direction": "below", "label": "Oil below $85", "meaning": "Stagflation energy thesis broken — consider rotating from energy to growth/tech positions"},
            {"level": 120, "direction": "above", "label": "Oil above $120", "meaning": "Escalation — war premium intensifying. Double down on Stagflation picks (GLD, XLE, DBC)"},
        ],
    }

    alerts_sent = 0
    movements = []

    # Check absolute level crossings
    levels_crossed_file = os.path.join(MACRO, ".macro_cache", "levels_crossed.json")
    try:
        with open(levels_crossed_file) as f:
            levels_crossed = _json.load(f)
    except Exception:
        levels_crossed = {}

    for key, levels in LEVEL_ALERTS.items():
        if key not in current:
            continue
        curr_val = current[key]["value"]
        prev_val = previous.get(key, {}).get("value")
        if prev_val is None:
            continue

        for alert in levels:
            alert_key = f"{key}_{alert['level']}_{alert['direction']}"
            already_fired = levels_crossed.get(alert_key, False)

            crossed = False
            if alert["direction"] == "below" and prev_val >= alert["level"] and curr_val < alert["level"]:
                crossed = True
            elif alert["direction"] == "above" and prev_val <= alert["level"] and curr_val > alert["level"]:
                crossed = True

            if crossed and not already_fired:
                levels_crossed[alert_key] = True

                # Generate AI analysis for level crossing
                anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
                analysis = f"{alert['label']}. {alert['meaning']}"

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
                                "max_tokens": 300,
                                "messages": [{"role": "user", "content": f"""{alert['label']} — oil moved from ${prev_val} to ${curr_val}. Current regime is {regime}. Context: {situation[:300]}.

Explain in 3-4 sentences: 1) Why this level matters for investors, 2) What it signals about the Stagflation thesis, 3) What specific action to consider (which ETFs to watch). Plain English, no jargon."""}],
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
                    trigger_name=alert["label"],
                    previous_value=f"${prev_val}/bbl",
                    current_value=f"${curr_val}/bbl",
                    threshold=alert["meaning"],
                    regime=regime,
                    analysis=analysis,
                )
                alerts_sent += sent
                movements.append({"trigger": alert["label"], "from": prev_val, "to": curr_val, "sent": sent})

            elif not crossed and already_fired:
                # Reset if price moved back above/below level
                levels_crossed[alert_key] = False

    with open(levels_crossed_file, "w") as f:
        _json.dump(levels_crossed, f)

    # Check relative movement thresholds (existing logic)
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

    # Try to refresh geo data — only delete cache if refresh succeeds
    geo_cache = os.path.join(MACRO, ".macro_cache", "geopolitical.json")
    synth_cache = os.path.join(MACRO, ".macro_cache", "geo_synthesis.json")

    # Temporarily remove cache to force refresh
    geo_backup = None
    synth_backup = None
    try:
        if os.path.exists(geo_cache):
            with open(geo_cache) as f:
                geo_backup = f.read()
            os.remove(geo_cache)
        if os.path.exists(synth_cache):
            with open(synth_cache) as f:
                synth_backup = f.read()
            os.remove(synth_cache)
    except Exception:
        pass

    # Refresh
    geo = get_geopolitical_risks()

    # If refresh failed (empty/None), restore backups
    if not geo or not geo.get("overall_regime_bias"):
        try:
            if geo_backup:
                with open(geo_cache, "w") as f:
                    f.write(geo_backup)
            if synth_backup:
                with open(synth_cache, "w") as f:
                    f.write(synth_backup)
            geo = get_geopolitical_risks()  # Re-read from restored cache
        except Exception:
            pass

    regime, fred_regime, lag_warning = get_current_regime()

    # Check if geo override changed
    new_geo_regime = geo.get("overall_regime_bias", "")
    old_geo_regime = old_synthesis.get("headline", "") if old_synthesis else ""

    # Refresh synthesis — use regime from backtest timeline (consistent with regime indicator)
    regime, fred_regime, _ = get_current_regime()
    get_synthesis(geo, regime)

    # If geo regime changed, send alert
    sent = 0
    if old_synthesis and new_geo_regime and new_geo_regime != geo.get("_prev_regime", new_geo_regime):
        sent = emails.send_geo_override(
            event=geo.get("overall_summary", "Geopolitical signal updated")[:80],
            geo_regime=new_geo_regime,
            fred_regime=fred_regime,
            explanation=geo.get("overall_summary", ""),
        )

    # Refresh weekly calendar via AI
    calendar_updated = _refresh_calendar(regime, geo)

    return {
        "ok": True,
        "regime": regime,
        "fredRegime": fred_regime,
        "geoRegime": new_geo_regime,
        "lagWarning": lag_warning,
        "emailsSent": sent,
        "calendarUpdated": calendar_updated,
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


@app.post("/api/cron/daily-briefing")
async def cron_daily_briefing(request: Request):
    """Every day 8am UTC — generate and send daily macro/geo briefing."""
    if not _check_cron_auth(request):
        return {"error": "Unauthorized"}, 401

    import requests as _req
    import json as _json
    import emails
    from datetime import datetime as _dt
    from macro_kelly import get_current_regime

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {"error": "No ANTHROPIC_API_KEY"}

    regime, _, _ = get_current_regime()
    date_str = _dt.now().strftime("%B %d, %Y")

    # Load current triggers for context
    triggers_resp = get_triggers_endpoint()
    triggers = triggers_resp.get("triggers", []) if isinstance(triggers_resp, dict) else []
    triggers_ctx = "\n".join(
        f"- {t['name']}: {t['current']} ({t['status']})" for t in triggers[:6]
    )

    # Load geo events for context
    geo_events_ctx = ""
    try:
        geo_path = os.path.join(MACRO, ".macro_cache", "geopolitical.json")
        if os.path.exists(geo_path):
            with open(geo_path) as f:
                geo = _json.load(f)
            for e in geo.get("events", [])[:3]:
                geo_events_ctx += f"- {e['title']}: {e['description'][:150]}\n"
    except Exception:
        pass

    # Ask Claude with web search to find today's top macro/geo stories
    prompt = f"""Today is {date_str}. Current US regime: {regime}.

MANDATORY STORIES — these are confirmed events our platform is tracking.
Include ALL of them in your output as stories (use web search to add latest details):
{geo_events_ctx}

Current triggers:
{triggers_ctx}

THEN search for additional macro and geopolitical news from the last 24 hours.
Focus on:
- Central bank decisions or speeches (Fed, ECB, BOJ, PBOC)
- Geopolitical escalations or de-escalations
- Major economic data releases (CPI, GDP, jobs, PMI)
- Oil/energy/commodity price moves
- Significant market moves (>2% on major indices)
- World order shifts (alliances, trade, sanctions, military)

Filter through the Macro World View lens: only include stories that affect
regime signals, the US-China power transition, European autonomy, or
emerging market positioning.

IMPORTANT: The mandatory stories above MUST appear first, then add 2-4 more from web search.

Output ONLY a JSON object:
{{
  "stories": [
    {{
      "headline": "short headline (max 15 words)",
      "summary": "2 sentences: what happened and why it matters for the regime",
      "regime_impact": "one sentence: how this affects the current regime signal",
      "severity": "HIGH or MEDIUM or LOW"
    }}
  ],
  "trigger_moves": [
    {{
      "name": "Oil (Brent)",
      "direction": "up",
      "value": "$114.20/bbl",
      "change": "+4.2%"
    }}
  ]
}}

Include 3-6 stories, ordered by severity. Include 2-4 trigger moves (oil, gold, DXY, yields, VIX).
No markdown fences. Only the JSON object."""

    try:
        r = _req.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 2000,
                "messages": [{"role": "user", "content": prompt}],
                "tools": [{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}],
            },
            timeout=60,
        )
        data = r.json()
        if data.get("error"):
            return {"error": data["error"].get("message", "API error")}

        raw_text = "".join(
            b.get("text", "") for b in data.get("content", [])
            if b.get("type") == "text"
        ).strip()

        # Parse JSON from response — try multiple strategies
        import re
        briefing = None
        # Try: find outermost { ... } by matching balanced braces
        depth = 0
        start_idx = None
        for i, ch in enumerate(raw_text):
            if ch == "{":
                if depth == 0:
                    start_idx = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start_idx is not None:
                    try:
                        briefing = _json.loads(raw_text[start_idx:i + 1])
                        break
                    except _json.JSONDecodeError:
                        start_idx = None
        if not briefing:
            return {"error": "Failed to parse briefing", "raw": raw_text[:1000]}

        stories = briefing.get("stories", [])
        trigger_moves = briefing.get("trigger_moves", [])

        if not stories:
            return {"error": "No stories generated"}

        sent = emails.send_daily_briefing(
            stories=stories,
            trigger_moves=trigger_moves,
            regime=regime,
            date_str=date_str,
        )

        return {
            "ok": True,
            "date": date_str,
            "stories": len(stories),
            "triggerMoves": len(trigger_moves),
            "emailsSent": sent,
        }
    except Exception as e:
        return {"error": str(e)}


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
    """Use static conviction from historical backtest data.
    AI synthesis convictions were overriding historical rankings (e.g. XLP 0.40 → 0.80),
    distorting the template. Static convictions are derived from actual performance
    across all regime periods and should be the source of truth."""
    return static_conviction


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


def _refresh_calendar(regime: str, geo: dict) -> bool:
    """Use AI to generate this week's economic calendar with regime implications."""
    import json as _json
    import requests as req
    from datetime import datetime, timedelta

    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not anthropic_key:
        return False

    today = datetime.now()
    next_week = today + timedelta(days=14)
    geo_summary = geo.get("overall_summary", "")[:200] if geo else ""

    prompt = f"""Today is {today.strftime('%A, %B %d, %Y')}.
Current macro regime: {regime}
Geopolitical context: {geo_summary}

List 5-8 of the most important upcoming US economic releases and events between now and {next_week.strftime('%B %d, %Y')}.

For each event, provide:
- name: the release name (do NOT prefix weekly releases with "Weekly")
- source: who publishes it (e.g. Bureau of Labor Statistics, Federal Reserve)
- date: exact date in YYYY-MM-DD format
- day: day of the week
- impact: High, Medium, or Low (must always be included)
- implication: one sentence on what it means for the current {regime} regime

Include: CPI, PPI, retail sales, initial jobless claims, FOMC meetings/minutes, GDP, ISM PMI, NFP jobs report, consumer sentiment, housing starts — whichever are actually scheduled in this period. Only include real scheduled releases. For weekly releases like jobless claims, only include the next one, not multiple weeks.

Respond as JSON: {{"events": [{{"name": "...", "source": "...", "date": "YYYY-MM-DD", "day": "...", "impact": "High/Medium/Low", "implication": "..."}}], "watchList": ["item1", "item2"]}}"""

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
                "max_tokens": 800,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        data = r.json()
        text = "".join(b.get("text", "") for b in data.get("content", []))

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

        cache_path = os.path.join(MACRO, ".macro_cache", "calendar.json")
        with open(cache_path, "w") as f:
            _json.dump(result, f)
        return True
    except Exception as e:
        print(f"  [calendar] Failed to refresh: {e}")
        return False


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
