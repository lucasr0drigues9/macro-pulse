"""
Fundamentals Analysis Module
Replaces 52-week range entry signals with real business quality metrics.
Inspired by Joseph Carlson's framework: FCF yield, P/E, margins, growth, SBC.
"""

import time
import json
from datetime import datetime, timedelta
import yfinance as yf

CACHE_FILE = "fundamentals_cache.json"
CACHE_TTL  = 24  # hours — fundamentals don't change daily


# ── Cache ──────────────────────────────────────────────────────────────────────

def load_cache() -> dict:
    try:
        with open(CACHE_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_cache(cache: dict):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)

def cache_get(symbol: str):
    cache = load_cache()
    entry = cache.get(symbol)
    if not entry:
        return None
    if datetime.now() - datetime.fromisoformat(entry["saved_at"]) > timedelta(hours=CACHE_TTL):
        return None
    return entry["data"]

def cache_set(symbol: str, data: dict):
    cache = load_cache()
    cache[symbol] = {"saved_at": datetime.now().isoformat(), "data": data}
    save_cache(cache)


# ── Metric helpers ─────────────────────────────────────────────────────────────

import math

def safe_div(a, b):
    try:
        if b and b != 0:
            result = a / b
            if result is None or (isinstance(result, float) and math.isnan(result)):
                return None
            return result
        return None
    except:
        return None

def pct(val):
    if val is None:
        return None
    return round(val * 100, 1)

def trend(values: list) -> str:
    """↗️ improving, ➡️ stable, ↘️ deteriorating"""
    clean = [v for v in values if v is not None]
    if len(clean) < 2:
        return "➡️"
    first_half = sum(clean[:len(clean)//2]) / (len(clean)//2)
    second_half = sum(clean[len(clean)//2:]) / (len(clean) - len(clean)//2)
    diff = second_half - first_half
    if abs(diff) < 0.5:
        return "➡️"
    return "↗️" if diff > 0 else "↘️"

def pct_trend(values: list) -> str:
    """For percentage metrics like margins"""
    clean = [v for v in values if v is not None]
    if len(clean) < 2:
        return "➡️"
    diff = clean[-1] - clean[0]
    if abs(diff) < 1.0:
        return "➡️"
    return "↗️" if diff > 0 else "↘️"

def score_metric(value, thresholds: dict) -> str:
    """Returns 🟢 🟡 🔴 based on thresholds dict with 'good' and 'bad' keys"""
    if value is None:
        return "⬜"
    if thresholds.get("higher_is_better", True):
        if value >= thresholds["good"]:
            return "🟢"
        elif value >= thresholds["bad"]:
            return "🟡"
        else:
            return "🔴"
    else:
        if value <= thresholds["good"]:
            return "🟢"
        elif value <= thresholds["bad"]:
            return "🟡"
        else:
            return "🔴"

def consistency_score(values: list, threshold, higher_is_better=True) -> int:
    """How many of the last 4 years was the metric above/below threshold?"""
    clean = [v for v in values if v is not None]
    if not clean:
        return 0
    if higher_is_better:
        return sum(1 for v in clean if v >= threshold)
    else:
        return sum(1 for v in clean if v <= threshold)


# ── Main analysis ──────────────────────────────────────────────────────────────

def get_fundamentals(symbol: str) -> dict:
    """
    Fetches and analyses up to 4 years of fundamentals for a stock.
    Returns a rich dict with metrics, trends, scores and a verdict.
    """
    if symbol in ("ACQUIRED", "?"):
        return {"error": "not_applicable"}

    cached = cache_get(symbol)
    if cached:
        return cached

    time.sleep(0.5)

    try:
        ticker    = yf.Ticker(symbol)
        info      = ticker.info
        cashflow  = ticker.cashflow          # columns = years (newest first)
        income    = ticker.income_stmt
        balance   = ticker.balance_sheet

        if cashflow is None or cashflow.empty:
            return {"error": "no_data"}

        # ── Extract years ──────────────────────────────────────────────────────
        years = [str(c.year) for c in cashflow.columns[:4]][::-1]  # oldest first

        def get_row(df, *names):
            """Try multiple row name variations"""
            for name in names:
                for idx in df.index:
                    if name.lower() in str(idx).lower():
                        row = df.loc[idx]
                        return [row.get(c) for c in cashflow.columns[:4]][::-1]
            return [None] * len(years)

        # ── Cash flow metrics ──────────────────────────────────────────────────
        operating_cf  = get_row(cashflow, "Operating Cash Flow", "Total Cash From Operating")
        capex         = get_row(cashflow, "Capital Expenditure", "Purchase Of Property Plant")
        sbc_row       = get_row(cashflow, "Stock Based Compensation", "Share Based Compensation")

        # FCF = Operating CF - CapEx
        fcf = []
        for i in range(len(years)):
            ocf = operating_cf[i]
            cpx = capex[i]
            if ocf is not None and cpx is not None:
                fcf.append(ocf - abs(cpx))
            elif ocf is not None:
                fcf.append(ocf)
            else:
                fcf.append(None)

        # ── Income metrics ─────────────────────────────────────────────────────
        revenue     = get_row(income, "Total Revenue")
        op_income   = get_row(income, "Operating Income", "Ebit")
        net_income  = get_row(income, "Net Income")

        op_margins = [pct(safe_div(op_income[i], revenue[i])) for i in range(len(years))]

        # ── Revenue growth YoY ─────────────────────────────────────────────────
        rev_growth = [None]
        for i in range(1, len(years)):
            if revenue[i] and revenue[i-1]:
                rev_growth.append(pct((revenue[i] - revenue[i-1]) / abs(revenue[i-1])))
            else:
                rev_growth.append(None)

        # ── FCF growth YoY ────────────────────────────────────────────────────
        fcf_growth = [None]
        for i in range(1, len(years)):
            if fcf[i] and fcf[i-1] and fcf[i-1] > 0:
                fcf_growth.append(pct((fcf[i] - fcf[i-1]) / abs(fcf[i-1])))
            else:
                fcf_growth.append(None)

        # ── SBC as % of FCF ────────────────────────────────────────────────────
        sbc_pct = []
        for i in range(len(years)):
            s = sbc_row[i]
            f = fcf[i]
            if s is not None and f and f > 0:
                sbc_pct.append(pct(abs(s) / f))
            else:
                sbc_pct.append(None)

        # ── Market data ───────────────────────────────────────────────────────
        market_cap   = info.get("marketCap")
        current_pe   = info.get("trailingPE")
        forward_pe   = info.get("forwardPE")
        current_price= info.get("currentPrice") or info.get("regularMarketPrice")
        country      = info.get("country", "")
        sector       = info.get("sector", "")

        # FCF yield per year
        fcf_yield = []
        for i in range(len(years)):
            if fcf[i] and market_cap and market_cap > 0:
                val = pct(fcf[i] / market_cap)
                fcf_yield.append(val if val is not None and not (isinstance(val, float) and math.isnan(val)) else None)
            else:
                fcf_yield.append(None)

        # ── Scores ────────────────────────────────────────────────────────────
        latest_fcf_yield  = fcf_yield[-1]
        latest_op_margin  = op_margins[-1]
        latest_rev_growth = rev_growth[-1]
        latest_fcf_growth = fcf_growth[-1]
        latest_sbc_pct    = sbc_pct[-1]

        score_fcf    = score_metric(latest_fcf_yield,  {"good": 4.0,  "bad": 2.0,  "higher_is_better": True})
        score_pe     = score_metric(current_pe,        {"good": 20,   "bad": 35,   "higher_is_better": False})
        score_margin = score_metric(latest_op_margin,  {"good": 15.0, "bad": 5.0,  "higher_is_better": True})
        score_rev    = score_metric(latest_rev_growth, {"good": 10.0, "bad": 0.0,  "higher_is_better": True})
        score_fcfg   = score_metric(latest_fcf_growth, {"good": 10.0, "bad": 0.0,  "higher_is_better": True})
        score_sbc    = score_metric(latest_sbc_pct,    {"good": 20.0, "bad": 50.0, "higher_is_better": False})

        scores     = [score_fcf, score_pe, score_margin, score_rev, score_fcfg, score_sbc]
        green_count = scores.count("🟢")
        red_count   = scores.count("🔴")

        # Consistency bonuses
        fcf_consistency  = consistency_score(fcf_yield,  4.0)
        marg_consistency = consistency_score(op_margins, 15.0)

        # ── Overall verdict ───────────────────────────────────────────────────
        if green_count >= 5:
            verdict = "🟢 strong buy"
            label   = "✅ high quality"
        elif green_count >= 4 and red_count == 0:
            verdict = "🟢 good entry"
            label   = "✅ good entry"
        elif green_count >= 3 and red_count <= 1:
            verdict = "🟡 fair"
            label   = "⚠️  fair entry"
        elif red_count >= 4:
            verdict = "🔴 avoid"
            label   = "❌ weak fundamentals"
        else:
            verdict = "🟡 mixed"
            label   = "⚠️  mixed signals"

        result = {
            "symbol":          symbol,
            "price":           current_price,
            "sector":          sector,
            "country":         country,
            "years":           years,
            "verdict":         verdict,
            "label":           label,
            "scores": {
                "fcf_yield":  score_fcf,
                "pe":         score_pe,
                "op_margin":  score_margin,
                "rev_growth": score_rev,
                "fcf_growth": score_fcfg,
                "sbc":        score_sbc,
            },
            "metrics": {
                "fcf_yield":   fcf_yield,
                "pe_current":  round(current_pe, 1) if current_pe else None,
                "pe_forward":  round(forward_pe, 1) if forward_pe else None,
                "op_margins":  op_margins,
                "rev_growth":  rev_growth,
                "fcf_growth":  fcf_growth,
                "sbc_pct":     sbc_pct,
                "fcf_abs":     [round(f/1e9, 2) if f and not (isinstance(f, float) and math.isnan(f)) else None for f in fcf],
            },
            "trends": {
                "fcf_yield":  pct_trend(fcf_yield),
                "op_margin":  pct_trend(op_margins),
                "rev_growth": trend(rev_growth),
                "fcf_growth": trend(fcf_growth),
            },
            "consistency": {
                "fcf_yield":  fcf_consistency,
                "op_margin":  marg_consistency,
            },
            "green_count": green_count,
            "red_count":   red_count,
        }

        cache_set(symbol, result)
        return result

    except Exception as e:
        return {"error": str(e)}


def format_fundamentals(data: dict, indent: str = "       ") -> list[str]:
    """
    Returns a list of lines to print for the fundamentals section.
    """
    if not data or "error" in data:
        return []

    lines   = []
    years   = data.get("years", [])
    metrics = data.get("metrics", {})
    scores  = data.get("scores", {})
    trends  = data.get("trends", {})
    cons    = data.get("consistency", {})

    def fmt_val(v, suffix="", decimals=1):
        if v is None or (isinstance(v, float) and math.isnan(v)):
            return "  n/a  "
        return f"{v:+.{decimals}f}{suffix}".rjust(8) if "+" in f"{v:+.0f}" else f"{v:.{decimals}f}{suffix}".rjust(8)

    def fmt_row(label, values, suffix, score):
        year_vals = "   ".join(fmt_val(v, suffix) for v in values)
        return f"{indent}  {score} {label:<14} {year_vals}"

    # Header
    year_header = "   ".join(y.rjust(8) for y in years)
    lines.append(f"{indent}  {'':14} {year_header}")
    lines.append(f"{indent}  {'─'*14} {'─'*8}   {'─'*8}   {'─'*8}   {'─'*8}")

    # FCF Yield
    lines.append(fmt_row(
        "FCF Yield*",
        metrics.get("fcf_yield", []),
        "%", scores.get("fcf_yield", "⬜"),
    ))

    # FCF Growth
    lines.append(fmt_row(
        "FCF Growth",
        metrics.get("fcf_growth", []),
        "%", scores.get("fcf_growth", "⬜"),
    ))

    # FCF ($B) — ball based on latest value positive + growing
    fcf_abs = metrics.get("fcf_abs", [])
    if any(f is not None for f in fcf_abs):
        clean = [f for f in fcf_abs if f is not None]
        latest = clean[-1] if clean else None
        prev   = clean[-2] if len(clean) >= 2 else None
        if latest is None:
            fcf_ball = "⬜"
        elif latest > 0 and (prev is None or latest >= prev):
            fcf_ball = "🟢"
        elif latest > 0:
            fcf_ball = "🟡"
        else:
            fcf_ball = "🔴"
        fcf_str = "   ".join((f"${f}B" if f is not None else "  n/a").rjust(8) for f in fcf_abs)
        lines.append(f"{indent}  {fcf_ball} {'FCF ($B)':<14} {fcf_str}")

    # Op. Margin
    lines.append(fmt_row(
        "Op. Margin",
        metrics.get("op_margins", []),
        "%", scores.get("op_margin", "⬜"),
    ))

    # Rev. Growth
    lines.append(fmt_row(
        "Rev. Growth",
        metrics.get("rev_growth", []),
        "%", scores.get("rev_growth", "⬜"),
    ))

    # SBC / FCF
    lines.append(fmt_row(
        "SBC / FCF",
        metrics.get("sbc_pct", []),
        "%", scores.get("sbc", "⬜"),
    ))

    # P/E — single clean line
    pe_cur = metrics.get("pe_current")
    pe_fwd = metrics.get("pe_forward")
    pe_str = f"P/E: {pe_cur}x trailing" if pe_cur else "P/E: n/a"
    if pe_fwd:
        pe_str += f"  /  {pe_fwd}x forward"
    lines.append(f"{indent}  {scores.get('pe','⬜')} {pe_str}")





        # Verdict at bottom
    green = data.get("green_count", 0)
    red   = data.get("red_count", 0)
    lines.append(f"{indent}  {'─'*54}")
    lines.append(f"{indent}  {data.get('verdict', '?')}   ({green} green  {red} red  out of 6)")

    return lines
