"""
Kelly-adjusted position sizing for the superinvestor screener.
Uses historical win rate and win/loss ratio of the F.score system
to suggest position sizes relative to portfolio.

Historical data (2022-2024, 36 observations):
  Win rate:       64%
  Avg win:        +37.6%
  Avg loss:       -17.0%
  Win/loss ratio: 2.22x
  Half Kelly:     23.8%
"""

# Historical parameters from backtesting
HISTORICAL_WIN_RATE  = 0.64
HISTORICAL_WIN_LOSS  = 2.22
MAX_POSITION_PCT     = 0.08   # Hard cap — never more than 8% in one stock
MIN_POSITION_PCT     = 0.02   # Minimum meaningful position
HALF_KELLY_FRACTION  = 0.5    # Use half Kelly for safety

def kelly_fraction(win_rate=HISTORICAL_WIN_RATE,
                   win_loss_ratio=HISTORICAL_WIN_LOSS):
    """Calculate Kelly fraction."""
    q = 1 - win_rate
    f = (win_rate * win_loss_ratio - q) / win_loss_ratio
    return max(0, f * HALF_KELLY_FRACTION)

def score_to_confidence(fscore, iscore):
    """
    Convert F.score and I.score to a confidence multiplier (0-1).
    Higher score = higher confidence = larger Kelly allocation.
    """
    # Normalise F.score (0-9) and I.score (0-30+)
    f_norm = min(fscore / 9.0, 1.0)  if fscore else 0
    i_norm = min(iscore / 30.0, 1.0) if iscore else 0

    # Weight: 60% fundamentals, 40% investor conviction
    confidence = (f_norm * 0.6) + (i_norm * 0.4)
    return round(confidence, 3)

def kelly_position(fscore, iscore, portfolio_value,
                   macro_aligned=True, filing_season=False):
    """
    Calculate Kelly-adjusted position size in dollars.

    Args:
        fscore:         Fundamentals score (0-9)
        iscore:         Investor conviction score
        portfolio_value: Total portfolio in NOK/USD
        macro_aligned:  Is this stock aligned with current macro regime?
        filing_season:  Are we within 30 days of a 13F filing?

    Returns dict with position sizing details.
    """
    base_kelly = kelly_fraction()
    confidence = score_to_confidence(fscore, iscore)

    # Adjust Kelly by confidence
    adjusted_kelly = base_kelly * confidence

    # Macro regime adjustment
    if macro_aligned:
        regime_mult = 1.2   # 20% larger if macro agrees
    else:
        regime_mult = 0.6   # 40% smaller if macro disagrees

    # Filing season adjustment
    filing_mult = 1.0 if filing_season else 0.8

    final_kelly = adjusted_kelly * regime_mult * filing_mult

    # Apply hard caps
    final_kelly = min(final_kelly, MAX_POSITION_PCT)
    final_kelly = max(final_kelly, MIN_POSITION_PCT) if fscore and fscore > 3 else 0

    position_value = round(portfolio_value * final_kelly)

    return {
        "kelly_pct":       round(final_kelly * 100, 1),
        "position_value":  position_value,
        "confidence":      round(confidence * 100),
        "macro_aligned":   macro_aligned,
        "filing_season":   filing_season,
        "base_kelly":      round(base_kelly * 100, 1),
    }

def print_kelly_table(rankings, portfolio_value,
                      macro_regime="Reflation", filing_season=False):
    """Print Kelly position sizing table for top rankings."""

    # Sectors aligned with current macro regime
    REGIME_SECTORS = {
        "Reflation":   ["Energy", "Basic Materials", "Industrials", "Utilities"],
        "Goldilocks":  ["Technology", "Communication Services", "Consumer Cyclical"],
        "Stagflation": ["Energy", "Basic Materials", "Consumer Defensive", "Utilities"],
        "Deflation":   ["Utilities", "Consumer Defensive", "Healthcare"],
    }
    aligned_sectors = REGIME_SECTORS.get(macro_regime, [])

    print(f"\n{'='*70}")
    print(f"  📐 KELLY POSITION SIZING")
    print(f"  Portfolio: ${portfolio_value:,.0f}  |  Regime: {macro_regime}")
    print(f"  Base Half-Kelly: {kelly_fraction()*100:.1f}%  |  "
          f"Filing season: {'YES ✅' if filing_season else 'NO ⚠️'}")
    print(f"{'='*70}")
    print(f"\n  {'Ticker':<7} {'F':>4} {'I':>6}  {'Conf':>5}  "
          f"{'Kelly%':>7}  {'Position':>10}  Note")
    print(f"  {'─'*6} {'─'*4} {'─'*6}  {'─'*5}  "
          f"{'─'*7}  {'─'*10}  {'─'*15}")

    total_allocated = 0
    # Ticker name -> symbol map for common names
    NAME_TO_SYM = {
        "ALPHABET": "GOOGL", "AMAZON COM": "AMZN",
        "META PLATFORMS": "META", "APPLE": "AAPL",
        "MICROSOFT": "MSFT", "NVIDIA": "NVDA",
        "PFIZER": "PFE", "LUMENTUM": "LITE",
        "SYNOPSYS": "SNPS", "UBER TECHNOLOGIES": "UBER",
        "AMERICAN EXPRESS": "AXP", "COCA COLA": "KO",
        "TESLA": "TSLA", "BROADCOM": "AVGO",
        "PALANTIR TECHNOLOGIES": "PLTR",
        "NETEASE": "NTES", "MERCADOLIBRE": "MELI",
    }

    import yfinance as yf

    def get_fscore(sym):
        """Quick fundamentals check from yfinance."""
        try:
            info = yf.Ticker(sym).info
            score = 0
            # FCF yield proxy
            fcf = info.get("freeCashflow", 0) or 0
            mkt = info.get("marketCap", 1) or 1
            if fcf / mkt > 0.02: score += 1
            # Revenue growth
            if (info.get("revenueGrowth") or 0) > 0.05: score += 1
            # Profit margins
            if (info.get("operatingMargins") or 0) > 0.1: score += 1
            # P/E reasonable
            pe = info.get("forwardPE") or 999
            if pe < 30: score += 1
            return score
        except:
            return 0

    def get_sector(sym):
        try:
            return yf.Ticker(sym).info.get("sector", "Unknown")
        except:
            return "Unknown"

    for stock in rankings[:10]:
        raw_ticker = stock.get("ticker", "")
        ticker  = NAME_TO_SYM.get(raw_ticker.upper(), raw_ticker)
        iscore  = float(stock.get("investor_score", stock.get("score", 0)) or 0)
        fscore  = get_fscore(ticker)
        sector  = get_sector(ticker)

        aligned = sector in aligned_sectors

        k = kelly_position(
            fscore, iscore, portfolio_value,
            macro_aligned=aligned,
            filing_season=filing_season
        )

        note = "✅ macro aligned" if aligned else "⚠️  macro diverge"
        if not filing_season:
            note += " | stale 13F"

        print(f"  {ticker:<7} {fscore:>4.1f} {iscore:>6.1f}  "
              f"{k['confidence']:>4}%  "
              f"{k['kelly_pct']:>6.1f}%  "
              f"${k['position_value']:>9,.0f}  {note}")

        total_allocated += k['kelly_pct']

    cash_pct = max(0, 100 - total_allocated)
    cash_val = portfolio_value * cash_pct / 100
    print(f"\n  {'─'*68}")
    print(f"  {'Allocated:':<20} {total_allocated:>6.1f}%  "
          f"${portfolio_value * total_allocated/100:>9,.0f}")
    print(f"  {'Remaining cash:':<20} {cash_pct:>6.1f}%  "
          f"${cash_val:>9,.0f}")

    print(f"\n  ⚠️  Kelly sizing based on 36-obs backtest (2022-2024).")
    print(f"     Past win rate: 64% | Win/loss: 2.22x | Half Kelly: 23.8%")
    print(f"     Capped at {MAX_POSITION_PCT*100:.0f}% max per position for safety.")
    print(f"     Not financial advice — adjust to your risk tolerance.")
    print(f"\n{'='*70}\n")

if __name__ == "__main__":
    # Test with mock data
    test_rankings = [
        {"ticker": "UBER",  "fscore": 7.5, "investor_score": 17.2, "sector": "Technology"},
        {"ticker": "FUTU",  "fscore": 7.5, "investor_score": 11.8, "sector": "Financial Services"},
        {"ticker": "NTES",  "fscore": 7.5, "investor_score": 11.3, "sector": "Communication Services"},
        {"ticker": "AXP",   "fscore": 6.0, "investor_score": 11.1, "sector": "Financial Services"},
        {"ticker": "NVDA",  "fscore": 5.0, "investor_score": 28.1, "sector": "Technology"},
        {"ticker": "GOOGL", "fscore": 3.0, "investor_score": 27.1, "sector": "Communication Services"},
        {"ticker": "CVX",   "fscore": 4.0, "investor_score": 8.2,  "sector": "Energy"},
        {"ticker": "XOM",   "fscore": 4.5, "investor_score": 7.5,  "sector": "Energy"},
    ]
    print_kelly_table(test_rankings, 10000,
                      macro_regime="Reflation", filing_season=False)
