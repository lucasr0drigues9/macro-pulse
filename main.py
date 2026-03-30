import sys
import time
from ranking import rank_stocks
from prices import enrich_with_prices, lookup_ticker, get_entry_score
from fundamentals import get_fundamentals, format_fundamentals
from universe import build_universe
from screener import run_screener, build_investor_map
from analysis import analyse_buy, analyse_sell

ACTION_MULTIPLIERS = {
    "new":      2.0,
    "adding":   1.5,
    "holding":  1.0,
    "trimming": 0.3,
}

ACTION_LABELS = {
    "new":      "🟢 NEW ",
    "adding":   "🔼 ADD ",
    "holding":  "➡️  HOLD",
    "trimming": "🔽 TRIM",
    "sell":     "🔴 SELL",
}

REGION_FLAGS = {
    "US":     "🇺🇸",
    "Nordic": "🇳🇴",
    "Asia":   "🇨🇳",
    "UK":     "🇬🇧",
}

def wrap_text(text: str, prefix: str, width: int = 105):
    words = text.split()
    line  = prefix
    for word in words:
        if len(line) + len(word) + 1 > width:
            print(line)
            line = "          " + word + " "
        else:
            line += word + " "
    if line.strip():
        print(line)

def fmt_portfolio(total_thousands: float) -> str:
    """Format value in $thousands to readable size."""
    val = total_thousands
    if val >= 1_000_000_000:
        return f"${val/1_000_000_000:.1f}T"
    elif val >= 1_000_000:
        return f"${val/1_000_000:.1f}B"
    elif val >= 1_000:
        return f"${val/1_000:.0f}M"
    elif val > 0:
        return f"${val:.0f}K"
    else:
        return ""

def print_divider():
    print("\n" + "─" * 105 + "\n")

def print_stock(i: int, stock: dict, global_mode: bool = False):
    price_info  = stock["price_info"]
    price_label = price_info.get("label", "❓ no data")
    price       = price_info.get("price", "")
    price_str   = f"${price:.2f}" if isinstance(price, float) else ""
    symbol      = stock["symbol"]
    company     = stock["ticker"][:31]
    analysis    = stock.get("analysis")
    flag        = price_info.get("flag", "🌐")

    # In global mode show which regions hold this stock — but only on breakdown lines, not main line
    regions    = stock.get("regions", [])

    # Calculate target entry price for non-good-entry stocks
    week_low  = price_info.get("52w_low")
    week_high = price_info.get("52w_high")
    fscore    = stock.get("fund_score")
    iscore    = stock.get("investor_score", stock["score"])
    fscore_str = f"{fscore:.1f}" if fscore is not None else "n/a"
    print(f"{i:<5} {symbol:<7} {company:<32} {'F:'+fscore_str:<7} {'I:'+str(iscore):<9} {stock['signal']:<18} {price_str} {flag}".rstrip())

    for b in stock["breakdown"]:
        action_label = ACTION_LABELS.get(b["action"], b["action"])
        region_flag  = REGION_FLAGS.get(b.get("region", ""), "") if global_mode else ""
        pct          = b.get("pct", 0.0)
        delta        = b.get("delta", 0.0)
        prev_pct     = b.get("prev_pct", 0.0)

        portfolio_total = b.get("portfolio_total", 0)
        fund_str        = fmt_portfolio(portfolio_total) if portfolio_total > 0 else ""

        # Calculate approximate dollar amount in this position
        if pct > 0 and portfolio_total > 0:
            position_value = portfolio_total * (pct / 100)  # in $thousands
            pos_str = fmt_portfolio(position_value)
        else:
            pos_str = ""

        # Use more decimal places for tiny positions
        def fmt_pct(p):
            if p >= 0.1:   return f"{p:.1f}%"
            elif p >= 0.01: return f"{p:.2f}%"
            elif p > 0:    return f"{p:.4f}%"
            else:          return "0%"

        if b["action"] == "new":
            pct_str = f"+{fmt_pct(pct)} (new position)"
        elif b["action"] == "adding":
            pct_str = f"{fmt_pct(pct)}  (+{fmt_pct(abs(delta))} this quarter)"
        elif b["action"] == "trimming":
            pct_str = f"{fmt_pct(pct)}  ({fmt_pct(abs(delta))} this quarter)"
        elif b["action"] == "holding":
            pct_str = f"{fmt_pct(pct)}  (no change)"
        else:
            pct_str = fmt_pct(pct)

        fund_display = f"[fund: {fund_str}]" if fund_str else ""
        pos_display  = f"≈{pos_str}" if pos_str else ""
        print(f"       └─ {region_flag} {b['investor']:<32} {action_label}   {pct_str:<32} {pos_display:<12} {fund_display}".rstrip())

    if analysis and "unavailable" not in analysis.lower():
        print()
        wrap_text(analysis, "       💬 ")

    # Show fundamentals
    fund_data = stock.get("fundamentals")
    if fund_data and "error" not in fund_data:
        print()
        for line in format_fundamentals(fund_data):
            print(line)

    print()

def print_sell(sell: dict, global_mode: bool = False):
    company  = sell["ticker"]
    warning  = "  ⚠️  MULTIPLE SELLERS" if len(sell["sellers"]) > 1 else ""

    price_info = sell.get("price_info", {})
    price      = price_info.get("price", "")
    price_str  = f"${price:.2f}" if isinstance(price, float) else ""
    flag       = price_info.get("flag", "")
    symbol     = sell.get("symbol", "")

    header = f"\n🔴 {company}{warning}"
    if symbol and price_str:
        header += f"   {symbol} {price_str} {flag}"

    print(header)

    for s in sell["sellers"]:
        region_flag = REGION_FLAGS.get(s.get("region", ""), "") + " " if global_mode else ""
        prev_pct    = s.get("prev_pct", 0.0)
        fund_total  = s.get("portfolio_total", 0)
        fund_str    = fmt_portfolio(fund_total) if fund_total > 0 else ""

        def fmt_pct(p):
            if p >= 0.1:    return f"{p:.1f}%"
            elif p >= 0.01: return f"{p:.2f}%"
            elif p > 0:     return f"{p:.4f}%"
            else:           return "0%"

        if prev_pct > 0 and fund_total > 0:
            pos_value = fund_total * (prev_pct / 100)
            pos_str   = f"≈{fmt_portfolio(pos_value)}"
            pct_info  = f"was {fmt_pct(prev_pct)} of portfolio"
        elif fund_total > 0:
            max_pos  = fund_total * 0.000001
            pos_str  = f"<{fmt_portfolio(max_pos)}"
            pct_info = "was <0.0001% of portfolio"
        else:
            pos_str  = ""
            pct_info = "position exited"

        fund_display = f"[fund: {fund_str}]" if fund_str else ""
        print(f"   🔴 {region_flag}{s['investor']:<32} exited   {pct_info:<30} {pos_str:<12} {fund_display}".rstrip())

    analysis = sell.get("analysis")
    if analysis and "unavailable" not in analysis.lower():
        print()
        wrap_text(analysis, "   💬 ")


def get_filing_context(all_holdings: list[dict]) -> str:
    """
    Detects the filing period from the accession numbers already fetched.
    13F filings cover the quarter ending 45 days before the filing date.
    Returns a human-readable context string.
    """
    import datetime

    # We know filings are quarterly — figure out which quarter from today's date
    today      = datetime.date.today()
    # 13F covers previous quarter, filed 45 days after quarter end
    # Q4 ends Dec 31, filed ~Feb 14
    # Q1 ends Mar 31, filed ~May 15
    # Q2 ends Jun 30, filed ~Aug 14
    # Q3 ends Sep 30, filed ~Nov 14
    month = today.month
    year  = today.year

    if month <= 2:
        # Jan-Feb: Q3 of previous year just filed, Q4 due soon
        filing_quarter = "Q3"
        filing_year    = year - 1
        next_filing    = f"Q4 {year - 1} (due ~Feb {year})"
    elif month <= 5:
        # Mar-May: Q4 just filed
        filing_quarter = "Q4"
        filing_year    = year - 1
        next_filing    = f"Q1 {year} (due ~May {year})"
    elif month <= 8:
        # Jun-Aug: Q1 just filed
        filing_quarter = "Q1"
        filing_year    = year
        next_filing    = f"Q2 {year} (due ~Aug {year})"
    elif month <= 11:
        # Sep-Nov: Q2 just filed
        filing_quarter = "Q2"
        filing_year    = year
        next_filing    = f"Q3 {year} (due ~Nov {year})"
    else:
        # Dec: Q3 just filed
        filing_quarter = "Q3"
        filing_year    = year
        next_filing    = f"Q4 {year} (due ~Feb {year + 1})"

    return (
        f"⏱️  Holdings data reflects {filing_quarter} {filing_year} "
        f"(positions as of {['Dec 31', 'Sep 30', 'Jun 30', 'Mar 31'][['Q4','Q3','Q2','Q1'].index(filing_quarter)]} {filing_year}). "
        f"Next update: {next_filing}."
    )

def load_holdings(mode: str) -> list[dict]:
    all_holdings = []

    if mode in ("us", "global"):
        from investors import get_all_holdings as get_us
        print("  🇺🇸 US investors (Buffett, Ackman, Burry, Tepper, Soros)")
        all_holdings += get_us()

    if mode in ("nordic", "global"):
        from investors_nordic import get_all_holdings as get_nordic
        print("  🇳🇴 Nordic funds (Norges Bank, Swedbank Robur, Handelsbanken)")
        all_holdings += get_nordic()

    if mode == "nordic-global":
        from investors_nbim_global import get_all_holdings as get_nbim_global
        from investors_nordic import get_all_holdings as get_nordic_rest
        print("  🇳🇴 NBIM — full global portfolio (~9,000 holdings)")
        all_holdings += get_nbim_global()
        # Add Swedbank and Handelsbanken but skip NBIM (already added)
        print("  🇳🇴 Swedbank Robur + Handelsbanken")
        nordic_rest = [h for h in get_nordic_rest() if h["investor_name"] != "Norges Bank (Oil Fund)"]
        all_holdings += nordic_rest

    if mode in ("asia", "global"):
        from investors_asia import get_all_holdings as get_asia
        print("  🇨🇳 Asian funds (Hillhouse, Greenwoods, Aspex)")
        all_holdings += get_asia()

    if mode in ("uk", "global"):
        from investors_uk import get_all_holdings as get_uk
        print("  🇬🇧 UK funds (Baillie Gifford, Lansdowne, Man Group)")
        all_holdings += get_uk()

    if mode == "screen":
        # Load all regions as investor context
        from investors import get_all_holdings as get_us
        from investors_nordic import get_all_holdings as get_nordic
        from investors_asia import get_all_holdings as get_asia
        from investors_uk import get_all_holdings as get_uk
        print("  🇺🇸 US investors"); all_holdings += get_us()
        print("  🇳🇴 Nordic funds");  all_holdings += get_nordic()
        print("  🇨🇳 Asian funds");   all_holdings += get_asia()
        print("  🇬🇧 UK funds");      all_holdings += get_uk()

    return all_holdings

def enrich_breakdown_with_region(ranked: list[dict], all_holdings: list[dict]) -> list[dict]:
    region_map = {
        (h["ticker"], h["investor_name"]): h.get("region", "")
        for h in all_holdings
    }

    for stock in ranked:
        regions = []
        for b in stock["breakdown"]:
            region = region_map.get((stock["ticker"], b["investor"]), "")
            b["region"] = region
            if region:
                regions.append(region)
        stock["regions"] = list(set(regions))

    return ranked

def main():
    mode        = "us"
    no_analysis = False

    for arg in sys.argv[1:]:
        if arg in ("us", "nordic", "asia", "uk", "global", "nbim", "nordic-global", "screen"):
            mode = arg
        elif arg == "--no-analysis":
            no_analysis = True

    mode_labels = {
        "us":     "🇺🇸 US Mode — Buffett, Ackman, Burry, Tepper, Soros",
        "nordic": "🇳🇴 Nordic Mode — Norges Bank, Swedbank Robur, Handelsbanken",
        "asia":   "🇨🇳 Asia Mode — Hillhouse, Greenwoods, Aspex",
        "uk":     "🇬🇧 UK Mode — Baillie Gifford, Lansdowne, Man Group",
        "global": "🌍 Global Mode — All regions combined",
        "nbim":   "🇳🇴 NBIM Deep Analysis — Full $2T fund breakdown",
        "nordic-global": "🇳🇴 Nordic Global Mode — NBIM full portfolio + Swedbank + Handelsbanken",
    }
    print(f"\n{mode_labels.get(mode, mode)}\n")

    # NBIM deep analysis mode — completely different output
    if mode == "nbim":
        from nbim_analysis import print_nbim_analysis
        print_nbim_analysis()
        return

    if no_analysis:
        print("⚡ Analysis disabled — running in fast mode (no API calls)\n")

    print("📊 Fetching superinvestor holdings...\n")

    all_holdings = load_holdings(mode)

    # ── Screener mode — skip investor loading entirely ────────────────────────
    if mode == "screen":
        investor_map = {}
        universe     = build_universe()
        results      = run_screener(universe, investor_map, top_n=30, min_score=4.5)

        print_divider()
        print(f"{'Rank':<5} {'Ticker':<7} {'Company':<28} {'F.Score':<8} {'Investors':<40} {'Price'}")
        print("─" * 105)
        print()

        REGION_FLAGS = {"US": "🇺🇸", "Nordic": "🇳🇴", "Asia": "🇨🇳", "UK": "🇬🇧"}
        ACTION_ICONS = {"new": "🟢", "adding": "🔼", "holding": "➡️ ", "trimming": "🔽"}

        for i, result in enumerate(results, 1):
            ticker    = result["ticker"]
            fscore    = result["fscore"]
            fund      = result["fund"]
            investors = result["investors"]
            price_info = get_entry_score(ticker)
            price      = price_info.get("price", "")
            flag       = price_info.get("flag", "🌐")
            price_str  = f"${price:.2f}" if isinstance(price, float) else ""
            inv_str = "  ".join(
                f"{REGION_FLAGS.get(inv['region'], '')} {ACTION_ICONS.get(inv['action'], '')} {inv['investor'].split()[0]} {inv['pct']:.1f}%"
                for inv in sorted(investors, key=lambda x: x["weight"], reverse=True)[:3]
            ) if investors else "—"
            print(f"{i:<5} {ticker:<7} {ticker:<28} {fscore:<8} {inv_str:<40} {price_str} {flag}")
            if fund and "error" not in fund:
                print()
                for line in format_fundamentals(fund):
                    print(line)
                print()

        print_divider()
        print("📌 Screener ranks by fundamentals quality across S&P 500 + investor universe")
        print(f"\n💡 Modes: us | nordic | nordic-global | asia | uk | global | screen | nbim")
        return

    print("\n🏆 Ranking stocks by conviction...\n")
    ranked, sells = rank_stocks(all_holdings)

    print("💰 Fetching price data...\n")
    ranked = enrich_with_prices(ranked[:20])
    ranked = enrich_breakdown_with_region(ranked, all_holdings)

    global_mode = (mode == "global")

    for sell in sells[:15]:
        symbol = lookup_ticker(sell["ticker"])
        if symbol:
            sell["symbol"]     = symbol
            sell["price_info"] = get_entry_score(symbol)
        else:
            sell["symbol"]     = ""
            sell["price_info"] = {}
        for s in sell["sellers"]:
            for h in all_holdings:
                if h["investor_name"] == s["investor"]:
                    s["region"]          = h.get("region", "")
                    s["portfolio_total"] = h.get("portfolio_total", 0)
                    break
            # Get the prev_pct from the sell holding data
            for h in all_holdings:
                if h["investor_name"] == s["investor"] and h["ticker"] == sell["ticker"]:
                    s["prev_pct"] = h.get("prev_pct", 0.0)
                    break
            else:
                # Sold positions aren't in all_holdings (they were excluded) — use delta abs value
                s["prev_pct"] = abs(s.get("delta", 0.0)) if "delta" in s else 0.0

    # ── Screener mode — fundamentals-first ────────────────────────────────────
    if mode == "screen":
        investor_map = build_investor_map(all_holdings)
        universe     = build_universe()

        results = run_screener(universe, investor_map, top_n=30, min_score=4.5)

        print_divider()
        print(f"{'Rank':<5} {'Ticker':<7} {'Company':<28} {'F.Score':<8} {'Investors':<35} {'Price'}")
        print("─" * 105)
        print()

        REGION_FLAGS = {"US": "🇺🇸", "Nordic": "🇳🇴", "Asia": "🇨🇳", "UK": "🇬🇧"}
        ACTION_ICONS = {"new": "🟢", "adding": "🔼", "holding": "➡️ ", "trimming": "🔽"}

        for i, result in enumerate(results, 1):
            ticker    = result["ticker"]
            fscore    = result["fscore"]
            fund      = result["fund"]
            investors = result["investors"]

            # Get price info
            price_info = get_entry_score(ticker)
            price      = price_info.get("price", "")
            flag       = price_info.get("flag", "🌐")
            price_str  = f"${price:.2f}" if isinstance(price, float) else ""

            # Compact investor list
            inv_str = "  ".join(
                f"{REGION_FLAGS.get(inv['region'], '')} {ACTION_ICONS.get(inv['action'], '')} {inv['investor'].split()[0]} {inv['pct']:.1f}%"
                for inv in sorted(investors, key=lambda x: x["weight"], reverse=True)[:3]
            ) if investors else "—"

            company = fund.get("sector", ticker) if not investors else ticker
            print(f"{i:<5} {ticker:<7} {company:<28} {fscore:<8} {inv_str:<35} {price_str} {flag}")

            # Show fundamentals
            if fund and "error" not in fund:
                print()
                for line in format_fundamentals(fund):
                    print(line)
                print()

        print_divider()
        print(get_filing_context(all_holdings))
        print("📌 Screener ranks by fundamentals quality across S&P 500 + investor holdings universe")
        print("   Investor column shows who holds it and their action — context only, not a ranking factor")
        print(f"\n💡 Modes: us | nordic | nordic-global | asia | uk | global | screen | nbim")
        return

    # ── Pre-fetch fundamentals and rank by them ────────────────────────────────
    def fundamentals_score(fund: dict) -> float:
        """Pure fundamentals score 0-10. Investor data is context only."""
        if not fund or "error" in fund:
            return None
        green = fund.get("green_count", 0)
        red   = fund.get("red_count", 0)
        # Base score from green count (0-6 metrics)
        base = green * 1.5
        # Penalty for reds
        penalty = red * 1.0
        return round(max(0, base - penalty), 2)

    print(f"\n  📊 Fetching fundamentals...")
    for stock in ranked:
        symbol = stock.get("symbol", "?")
        if symbol and symbol != "?" and symbol != "ACQUIRED":
            fund = get_fundamentals(symbol)
            stock["fundamentals"] = fund
            fscore = fundamentals_score(fund)
            stock["fund_score"]    = fscore
            stock["fund_mult"]     = None
        else:
            stock["fundamentals"] = None
            stock["fund_score"]   = None
            stock["fund_mult"]    = None

    # Sort by fundamentals score — stocks with no data go to the bottom
    ranked.sort(key=lambda x: (
        x["fund_score"] is not None,
        x["fund_score"] or 0,
        x["investor_score"]   # tiebreaker: investor conviction
    ), reverse=True)

    # ── Stream buys ────────────────────────────────────────────────────────────
    print_divider()
    print(f"{'Rank':<5} {'Ticker':<7} {'Company':<32} {'F.Score':<7} {'I.Score':<9} {'Signal':<18} {'Price'}")
    print("─" * 105)
    print()

    for i, stock in enumerate(ranked, 1):
        symbol  = stock.get("symbol", "?")
        company = stock["ticker"]

        if not no_analysis and symbol != "?" and symbol != "ACQUIRED":
            print(f"  🧠 Analysing {company} ({symbol})...")
            result = analyse_buy(company, symbol)
            stock["analysis"] = result["text"]
            if result["verdict"] == "structural":
                stock["price_info"]["label"] = "⚠️  value trap?"
            time.sleep(2)
        else:
            stock["analysis"] = None

        print_stock(i, stock, global_mode)

    # ── Sells ──────────────────────────────────────────────────────────────────
    if sells:
        print_divider()
        print("🔴 Recent Sells — positions exited this quarter\n")
        print("─" * 105)

        top_sells   = sorted(sells, key=lambda x: sum(s["weight"] for s in x["sellers"]), reverse=True)[:5]
        top_tickers = {s["ticker"] for s in top_sells}

        for sell in sells[:15]:
            if not no_analysis and sell["ticker"] in top_tickers:
                print(f"\n  🧠 Analysing exit: {sell['ticker']}...")
                seller_names     = [s["investor"] for s in sell["sellers"]]
                sell["analysis"] = analyse_sell(sell["ticker"], seller_names)
                time.sleep(2)
            else:
                sell["analysis"] = None

            print_sell(sell, global_mode)

    print_divider()
    print(get_filing_context(all_holdings))
    print("📌 Fundamentals guide:")
    print("   FCF Yield*   what you pay (FCF / market cap)")
    print("   FCF Growth   where cash flow is heading")
    print("   FCF ($B)     raw cash generated")
    print("   Op. Margin   business quality & moat")
    print("   Rev. Growth  top line momentum")
    print("   SBC / FCF    shareholder dilution check")
    print("   P/E          market valuation (trailing / forward)")
    print("📌 Score = investor weight × action multiplier (NEW=2.0, ADD=1.5, HOLD=1.0, TRIM=0.3)")
    print("   * FCF Yield uses current market cap — historical values may be understated")
    if no_analysis:
        print("💡 Run without --no-analysis to enable AI commentary")
    print(f"\n💡 Modes: us | nordic | nordic-global | asia | uk | global | nbim   |   add --no-analysis for fast mode")
    print(f"   Example: python3 main.py global --no-analysis   |   python3 main.py nbim")

if __name__ == "__main__":
    main()
