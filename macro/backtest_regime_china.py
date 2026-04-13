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
    ("2010-01", "2011-06", "Stagflation", "Post-GFC stimulus overshoot. GDP 10%+ but CPI hit 6.5%. Food inflation crisis. PBOC hiked 5 times. Property bubble inflating."),
    ("2011-07", "2012-09", "Deflation", "PBOC tightening hit growth. Eurozone crisis killed export demand. PPI turned negative. Manufacturing overcapacity exposed."),
    ("2012-10", "2013-12", "Goldilocks", "Inflation controlled at 2-3%. Growth stabilising at 7.5%. New leadership under Xi Jinping. Moderate stimulus."),
    ("2014-01", "2015-06", "Goldilocks", "Growth 7% with low inflation. Despite PPI negative (manufacturing overcapacity), broad economy fine. Tech sector booming. Equity bull market."),
    ("2015-07", "2015-12", "Deflation", "Stock market crash (Jun-Aug 2015). Yuan devaluation Aug 2015. Capital flight $500B+. PBOC burned reserves defending yuan."),
    ("2016-01", "2016-12", "Reflation", "Massive stimulus. Property boom. Supply-side reform cutting steel/coal overcapacity. PPI turned positive."),
    ("2017-01", "2018-03", "Goldilocks", "Growth 6.8%, inflation 2%. Deleveraging campaign. Tech sector thriving. MSCI added China A-shares."),
    ("2018-04", "2019-03", "Deflation", "US-China trade war began. Tariffs crushed export demand. PMI fell below 50. Growth slowed to 6.2%. PBOC cut RRR 4 times."),
    ("2019-04", "2019-12", "Deflation", "Trade war escalation. Manufacturing PMI below 50. PPI turned negative. Phase 1 deal signed Dec 2019."),
    ("2020-01", "2020-06", "Deflation", "COVID-19 origin. Wuhan lockdown. GDP -6.8% Q1 2020. Deepest contraction ever. Massive fiscal response."),
    ("2020-07", "2021-06", "Reflation", "First to recover from COVID. Exports booming. PPI surging to +9%. Commodity super-cycle. Property prices rising."),
    ("2021-07", "2022-03", "Stagflation", "Evergrande crisis. Property sector collapse begins. PPI above 10% while growth slowing sharply. Regulatory crackdown on tech."),
    ("2022-04", "2022-12", "Deflation", "Zero-COVID lockdowns. Shanghai lockdown Apr-Jun. Consumer confidence collapsed. Youth unemployment 20%+."),
    ("2023-01", "2023-06", "Deflation", "COVID reopening Dec 2022. Brief bounce fizzled within weeks. Property crisis accelerated. CPI near zero."),
    ("2023-07", "2024-09", "Deflation", "Prolonged deflation. Property prices -5% YoY. PPI negative 18 months. Youth unemployment crisis. Consumer confidence at record lows."),
    ("2024-10", "2026-03", "Deflation", "Property prices -8.5% YoY. PPI -2.8%. Consumer deflation. PBOC cutting but insufficient. Stimulus announced but below expectations."),
    ("2026-04", "2026-12", "Stagflation", "Hormuz closure cut shadow fleet oil supply to China. Energy costs rising while economy still deflating. First US-China confrontation point."),
]

# ETF baskets for China regime backtesting
# China-specific: uses China-exposed and Asia-focused ETFs
CHINA_BACKTEST_ETFS = {
    "Stagflation": ["GLD", "DBC", "EWH"],           # Gold + commodities + HK (defensive Asia)
    "Reflation":   ["FXI", "CHIQ", "COPX"],          # China large-cap + consumer + copper (demand recovery)
    "Goldilocks":  ["KWEB", "FXI", "AAXJ"],          # China tech + equities + Asia broad (risk-on)
    "Deflation":   ["TLT", "GLD", "AGG"],             # US Treasuries + gold + bonds (safe haven)
}

ALL_TICKERS = list(set(t for picks in CHINA_BACKTEST_ETFS.values() for t in picks))


def fetch_etf_monthly(ticker, start="2010-01-01"):
    """Fetch monthly close prices for an ETF via Yahoo query2 API, cached."""
    cache_file = f"{CACHE_DIR}/backtest_etf_{ticker}.json"
    if os.path.exists(cache_file):
        age = datetime.now().timestamp() - os.path.getmtime(cache_file)
        if age < 7 * 86400:  # 7 day cache
            with open(cache_file) as f:
                return json.load(f)

    try:
        url = f"https://query2.finance.yahoo.com/v8/finance/chart/{ticker}"
        r = requests.get(url, params={"interval": "1mo", "range": "max"},
                        headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        data = r.json()
        result = data.get("chart", {}).get("result", [{}])[0]
        timestamps = result.get("timestamp", [])
        closes = result.get("indicators", {}).get("quote", [{}])[0].get("close", [])

        monthly = {}
        for ts, close in zip(timestamps, closes):
            if close is not None:
                dt = datetime.fromtimestamp(ts)
                key = dt.strftime("%Y-%m-01")
                if key >= start:
                    monthly[key] = round(float(close), 2)

        if monthly:
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


# ── AI geopolitical overrides for China ──
# Format: start_month -> (strength, context, ai_regime_override_or_None)
# None = AI would have agreed with proxy data
CHINA_SIGNAL_STRENGTH = {
    # 2010-2012: Post-GFC stimulus → tightening
    "2010-01": ("STRONG", "Post-GFC 4 trillion yuan stimulus created massive inflation overshoot. CPI 6.5%, food prices surging. PBOC hiked 5 times.", None),
    "2011-07": ("MODERATE", "Eurozone debt crisis. Greece bailout contagion fears. Chinese exports slowing. PBOC shifted from tightening to easing.", None),
    # 2012-2015: Xi era begins
    "2012-10": ("MODERATE", "Xi Jinping took power. Anti-corruption campaign. Moderate reform expectations. Stability-oriented policy.", None),
    "2014-01": ("MODERATE", "Economy growing 7% despite PPI deflation. Tech boom (Alibaba IPO Sep 2014). Equity bull market building.", None),
    "2015-07": ("STRONG", "Stock market crash lost $5T in weeks. PBOC devalued yuan Aug 2015. Capital flight $500B+. Global contagion fears.", None),
    # 2016-2019: Stimulus → Trade war
    "2016-01": ("STRONG", "Massive stimulus. PBOC cut rates + RRR. Supply-side reform shutting overcapacity. Property boom reignited.", None),
    "2017-01": ("MODERATE", "Deleveraging campaign. Shadow banking crackdown. But economy strong — GDP 6.8%, tech thriving.", None),
    "2018-04": ("STRONG", "US-China trade war started. Trump tariffs Mar 2018. Growth slowed as export sector hit. PBOC cut RRR 4 times to cushion.", None),
    "2019-04": ("MODERATE", "Trade war escalation. Huawei ban May 2019. Phase 1 deal negotiations ongoing. PMI below 50.", None),
    # 2020-2022: COVID → Recovery → Property crisis
    "2020-01": ("STRONG", "COVID-19 pandemic origin. Wuhan lockdown Jan 2020. GDP -6.8% Q1. BUT massive fiscal+monetary response — PBOC + $500B stimulus within weeks.", "Goldilocks"),
    "2020-07": ("STRONG", "First economy to recover from COVID. Exports booming on global restocking. PPI surging to +9%. Commodity super-cycle.", None),
    "2021-07": ("STRONG", "Evergrande default Sep 2021. $300B in liabilities. Property sector collapse begins. Simultaneously PPI above 10% from commodities. Regulatory crackdown on tech (DIDI, education).", None),
    "2022-04": ("STRONG", "Shanghai locked down Apr-Jun 2022. Zero-COVID at peak. BUT China abruptly abandoned zero-COVID Dec 2022. Markets anticipated reopening from Oct.", "Goldilocks"),
    # 2023-2026: Deflation → Hormuz
    "2023-01": ("MODERATE", "Reopening bounce lasted 2-3 weeks then fizzled. Property crisis accelerated. Consumer confidence collapsed.", None),
    "2023-07": ("MODERATE", "Prolonged deflation. Country Garden crisis Aug 2023. Youth unemployment data suspended. PBOC cutting but insufficient.", None),
    "2024-10": ("STRONG", "Iran-Israel war escalated. Hormuz transits dropped. Shadow fleet still operating but oil costs rising. Energy supply chain under pressure.", "Stagflation"),
    "2026-04": ("STRONG", "US permanently closed Hormuz to ALL shipping including Iran's shadow fleet to China. First direct US-China energy confrontation.", None),
}


def build_china_backtest():
    """Build the full China backtest — regime periods with basket returns + AI geo layer."""
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

        # AI geopolitical layer
        sig = CHINA_SIGNAL_STRENGTH.get(start, ("MODERATE", "", None))
        geo_override = sig[2] if len(sig) > 2 else None
        ai_regime = geo_override if geo_override else regime
        ai_picks_return = all_returns.get(ai_regime)
        ai_correct = best == ai_regime if best else None

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
            "signalStrength": sig[0],
            "signalContext": sig[1] if sig[1] else context,
            "picksReturn": all_returns.get(regime),
            "allRegimeReturns": all_returns,
            "bestRegime": best,
            "frameworkCorrect": framework_correct,
            "aiRegime": ai_regime,
            "aiPicksReturn": ai_picks_return,
            "aiDiffersFromProxy": geo_override is not None and geo_override != regime,
            "aiCorrect": ai_correct,
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
