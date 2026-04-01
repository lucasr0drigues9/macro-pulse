"""
Portfolio Tracker — tracks holdings and integrates with regime allocation.
Stores transactions in JSON, computes drift vs target, and
deploys new capital toward underweight positions.
"""
import os
import sys
import json
from datetime import datetime

sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")
sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects")

PORTFOLIO_FILE = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/portfolio.json"


def load_portfolio():
    """Load transactions from JSON file."""
    if os.path.exists(PORTFOLIO_FILE):
        with open(PORTFOLIO_FILE) as f:
            data = json.load(f)
        return data.get("transactions", [])
    return []


def save_portfolio(transactions):
    """Save transactions to JSON file."""
    os.makedirs(os.path.dirname(PORTFOLIO_FILE), exist_ok=True)
    with open(PORTFOLIO_FILE, "w") as f:
        json.dump({"transactions": transactions}, f, indent=2)


def add_transaction(ticker, shares, price, action="buy", date=None):
    """Add a buy/sell transaction."""
    txns = load_portfolio()
    txns.append({
        "date":   date or datetime.now().strftime("%Y-%m-%d"),
        "ticker": ticker.upper(),
        "shares": shares,
        "price":  price,
        "action": action,
    })
    save_portfolio(txns)
    return txns


def remove_transaction(index):
    """Remove a transaction by index (0-based)."""
    txns = load_portfolio()
    if 0 <= index < len(txns):
        removed = txns.pop(index)
        save_portfolio(txns)
        return removed
    return None


def get_holdings():
    """Aggregate transactions into holdings: {ticker: {shares, avg_cost, total_cost}}."""
    txns = load_portfolio()
    holdings = {}
    for t in txns:
        ticker = t["ticker"]
        shares = t["shares"]
        price  = t["price"]
        action = t.get("action", "buy")

        if ticker not in holdings:
            holdings[ticker] = {"shares": 0, "total_cost": 0}

        if action == "buy":
            holdings[ticker]["shares"]     += shares
            holdings[ticker]["total_cost"] += shares * price
        elif action == "sell":
            holdings[ticker]["shares"]     -= shares
            holdings[ticker]["total_cost"] -= shares * price

    # Compute avg cost and remove empty positions
    result = {}
    for ticker, h in holdings.items():
        if h["shares"] > 0:
            h["avg_cost"] = round(h["total_cost"] / h["shares"], 2)
            result[ticker] = h
    return result


def get_portfolio_value(holdings):
    """Compute total portfolio value from live prices."""
    from macro_kelly import get_etf_price
    total = 0
    positions = {}
    for ticker, h in holdings.items():
        price = get_etf_price(ticker)
        if price:
            value = round(h["shares"] * price, 2)
            gain  = round(value - h["total_cost"], 2)
            gain_pct = round((price / h["avg_cost"] - 1) * 100, 1) if h["avg_cost"] > 0 else 0
            positions[ticker] = {
                **h, "price": price, "value": value,
                "gain": gain, "gain_pct": gain_pct,
            }
            total += value
        else:
            positions[ticker] = {**h, "price": None, "value": 0, "gain": 0, "gain_pct": 0}
    return positions, round(total, 2)


def get_target_allocation(regime, etfs=None):
    """Get target allocation % for each ETF in current regime."""
    if etfs is None:
        from macro_kelly import REGIME_ETFS
        etfs = REGIME_ETFS.get(regime, [])
    conv_total = sum(e["conviction"] for e in etfs)
    CASH_DEFAULT = 15
    invested_pct = (100 - CASH_DEFAULT) / 100.0
    targets = {}
    for etf in etfs:
        targets[etf["ticker"]] = round((etf["conviction"] / conv_total) * invested_pct * 100, 1)
    return targets


def print_portfolio(regime=None):
    """Show full portfolio with drift analysis."""
    import contextlib, io

    holdings = get_holdings()
    if not holdings:
        print("\n  No holdings recorded yet. Use option 2 to add a transaction.")
        return

    # Get regime
    if regime is None:
        try:
            from macro_kelly import get_current_regime
            with contextlib.redirect_stdout(io.StringIO()):
                regime, _, _ = get_current_regime()
        except:
            regime = "Stagflation"

    EMOJIS = {"Stagflation": "🔴", "Reflation": "🟡",
              "Goldilocks": "🟢", "Deflation": "🔵"}

    positions, total_value = get_portfolio_value(holdings)
    targets = get_target_allocation(regime)

    print(f"\n{'='*70}")
    print(f"  💼 PORTFOLIO — {EMOJIS.get(regime, '')} {regime} regime")
    print(f"  Total value: ${total_value:,.2f}")
    print(f"{'='*70}")

    print(f"\n  {'Ticker':<7} {'Shares':>7} {'Avg Cost':>9} {'Price':>9} "
          f"{'Value':>10} {'Gain':>9} {'Alloc':>6} {'Target':>7} {'Drift':>7}")
    print(f"  {'─'*7} {'─'*7} {'─'*9} {'─'*9} "
          f"{'─'*10} {'─'*9} {'─'*6} {'─'*7} {'─'*7}")

    # Show positions (current holdings)
    all_tickers = set(positions.keys()) | set(targets.keys())
    sorted_tickers = sorted(all_tickers, key=lambda t: -(positions.get(t, {}).get("value", 0)))

    total_gain = 0
    for ticker in sorted_tickers:
        pos = positions.get(ticker)
        target_pct = targets.get(ticker, 0)

        if pos and pos["shares"] > 0:
            current_pct = round(pos["value"] / total_value * 100, 1) if total_value > 0 else 0
            drift = round(current_pct - target_pct, 1)
            drift_str = f"{drift:+.1f}%"
            if drift > 3:
                drift_str += " ⬆"
            elif drift < -3:
                drift_str += " ⬇"

            gain_str = f"{pos['gain_pct']:+.1f}%"
            total_gain += pos["gain"]

            print(f"  {ticker:<7} {pos['shares']:>7} ${pos['avg_cost']:>8.2f} "
                  f"${pos['price']:>8.2f} ${pos['value']:>9,.2f} "
                  f"{gain_str:>9} {current_pct:>5.1f}% {target_pct:>6.1f}% {drift_str:>7}")
        elif target_pct > 0:
            # Target exists but no position — show as missing
            print(f"  {ticker:<7} {'—':>7} {'—':>9} {'—':>9} "
                  f"{'$0':>10} {'—':>9} {'0.0%':>6} {target_pct:>6.1f}% "
                  f"{-target_pct:+.1f}% ⬇")

    # Summary
    total_cost = sum(p.get("total_cost", 0) for p in positions.values())
    total_gain_pct = round((total_value / total_cost - 1) * 100, 1) if total_cost > 0 else 0

    print(f"\n  {'─'*70}")
    print(f"  Total invested: ${total_cost:>10,.2f}")
    print(f"  Current value:  ${total_value:>10,.2f}")
    print(f"  Total gain:     ${total_gain:>10,.2f} ({total_gain_pct:+.1f}%)")

    # Rebalance suggestion
    underweight = [(t, targets[t] - (positions.get(t, {}).get("value", 0) / total_value * 100 if total_value > 0 else 0))
                   for t in targets if targets[t] > 0]
    underweight = [(t, d) for t, d in underweight if d > 2]
    underweight.sort(key=lambda x: -x[1])

    if underweight:
        print(f"\n  📉 Underweight positions (buy priority):")
        for ticker, drift in underweight:
            needed = round(total_value * drift / 100)
            print(f"     {ticker:<7} {drift:>+.1f}% below target  (≈${needed} to rebalance)")

    overweight = [(t, (positions[t]["value"] / total_value * 100 if total_value > 0 else 0) - targets.get(t, 0))
                  for t in positions if positions[t]["shares"] > 0]
    overweight = [(t, d) for t, d in overweight if d > 5]
    overweight.sort(key=lambda x: -x[1])

    if overweight:
        print(f"\n  📈 Overweight positions (trim candidates):")
        for ticker, drift in overweight:
            print(f"     {ticker:<7} {drift:>+.1f}% above target")

    print(f"\n{'='*70}")


def deploy_with_portfolio(amount, etfs, regime):
    """Deploy new capital accounting for existing portfolio drift + timing."""
    from macro_kelly import get_etf_price, get_etf_timing

    holdings = get_holdings()
    positions, total_value = get_portfolio_value(holdings) if holdings else ({}, 0)
    new_total = total_value + amount

    # Target allocation
    conv_total = sum(e["conviction"] for e in etfs)
    CASH_PCT = 0.15
    invested_pct = 1 - CASH_PCT

    EMOJIS = {"Stagflation": "🔴", "Reflation": "🟡",
              "Goldilocks": "🟢", "Deflation": "🔵"}

    print(f"\n{'='*70}")
    print(f"  💰 DEPLOY ${amount:,.0f} — {EMOJIS.get(regime, '')} {regime}")
    if total_value > 0:
        print(f"  Current portfolio: ${total_value:,.0f} → New total: ${new_total:,.0f}")
    print(f"  Accounting for existing holdings + buy timing")
    print(f"{'='*70}")

    # For each ETF: compute target value, current value, gap
    etf_data = []
    for etf in etfs:
        ticker = etf["ticker"]
        target_pct = (etf["conviction"] / conv_total) * invested_pct
        target_val = new_total * target_pct
        current_val = positions.get(ticker, {}).get("value", 0)
        gap = max(0, target_val - current_val)  # Only buy, never sell here
        timing = get_etf_timing(ticker)
        price = get_etf_price(ticker) if not timing else timing.get("price")

        # Timing multiplier
        t_score = timing["score"] if timing else 50
        timing_mult = 0.6 + (t_score / 100) * 0.8

        etf_data.append({
            "ticker": ticker, "name": etf["name"],
            "target_pct": target_pct, "target_val": target_val,
            "current_val": current_val, "gap": gap,
            "adjusted_gap": gap * timing_mult,
            "timing": timing, "price": price,
            "current_shares": positions.get(ticker, {}).get("shares", 0),
        })

    # Distribute deployment proportionally to adjusted gaps
    total_adj_gap = sum(e["adjusted_gap"] for e in etf_data)

    if total_adj_gap <= 0:
        print(f"\n  ✅ Portfolio is balanced — no rebalancing needed.")
        print(f"     Consider holding as cash or adding to highest-conviction pick.")
        print(f"\n{'='*70}\n")
        return

    print(f"\n  {'ETF':<7} {'Have':>7} {'Target':>7} {'Gap':>8} "
          f"{'Timing':<14} {'Deploy':>9} {'Shares':>7}  Action")
    print(f"  {'─'*7} {'─'*7} {'─'*7} {'─'*8} "
          f"{'─'*14} {'─'*9} {'─'*7}  {'─'*20}")

    buy_now = []
    wait = []

    for e in sorted(etf_data, key=lambda x: -x["adjusted_gap"]):
        if total_adj_gap > 0:
            deploy = round(amount * (e["adjusted_gap"] / total_adj_gap))
        else:
            deploy = 0
        shares = int(deploy / e["price"]) if e["price"] and e["price"] > 0 else 0
        price_str = f"${e['price']:.2f}" if e["price"] else "n/a"

        t = e["timing"]
        signal = t["signal"] if t else "❓ No data"
        score = t["score"] if t else 50

        current_str = f"${e['current_val']:,.0f}" if e["current_val"] > 0 else "—"
        target_str = f"${e['target_val']:,.0f}"
        gap_str = f"${e['gap']:,.0f}" if e["gap"] > 0 else "—"

        if deploy < 5:
            continue  # Skip negligible allocations

        if score >= 40:
            action = f"BUY {shares} @ {price_str}"
            buy_now.append((e, deploy, shares))
        else:
            action = f"WAIT — hold ${deploy}"
            wait.append((e, deploy))

        print(f"  {e['ticker']:<7} {current_str:>7} {target_str:>7} {gap_str:>8} "
              f"{signal:<14} ${deploy:>8,} {shares:>7}  {action}")

    # Summary
    buy_total = sum(d for _, d, _ in buy_now)
    wait_total = sum(d for _, d in wait)

    print(f"\n  {'─'*68}")
    print(f"  Deploy now:  ${buy_total:>8,.0f}  "
          f"({', '.join(e['ticker'] for e, _, _ in buy_now)})" if buy_now else "")
    if wait:
        print(f"  Hold cash:   ${wait_total:>8,.0f}  "
              f"({', '.join(e['ticker'] for e, _ in wait)} — wait for better entry)")
        print(f"\n  Check again in 1-2 weeks. If timing improves, deploy the rest.")
    elif buy_now:
        print(f"  All underweight picks at fair entry — deploy full amount now.")

    if amount >= 1000 and wait:
        print(f"\n  💡 DCA suggestion: deploy ${buy_total:,.0f} now, "
              f"${wait_total:,.0f} in 2 weeks if timing improves.")

    print(f"\n{'='*70}\n")


def print_transactions():
    """Show transaction log."""
    txns = load_portfolio()
    if not txns:
        print("\n  No transactions recorded.")
        return

    print(f"\n  {'#':>3} {'Date':<12} {'Action':<6} {'Ticker':<7} "
          f"{'Shares':>7} {'Price':>9} {'Total':>10}")
    print(f"  {'─'*3} {'─'*12} {'─'*6} {'─'*7} "
          f"{'─'*7} {'─'*9} {'─'*10}")
    for i, t in enumerate(txns):
        total = round(t["shares"] * t["price"], 2)
        print(f"  {i:>3} {t['date']:<12} {t['action']:<6} {t['ticker']:<7} "
              f"{t['shares']:>7} ${t['price']:>8.2f} ${total:>9,.2f}")


def portfolio_menu():
    """Interactive portfolio management menu."""
    import contextlib, io

    while True:
        holdings = get_holdings()
        if holdings:
            try:
                _, total = get_portfolio_value(holdings)
                n = len(holdings)
                summary = f"${total:,.0f} across {n} position{'s' if n != 1 else ''}"
            except:
                summary = f"{len(holdings)} positions (prices unavailable)"
        else:
            summary = "Empty — add your first transaction"

        print(f"\n{'='*50}")
        print(f"  💼 PORTFOLIO TRACKER")
        print(f"  {summary}")
        print(f"{'='*50}")
        print(f"\n  1. View holdings + drift vs target")
        print(f"  2. Add transaction (buy)")
        print(f"  3. Add transaction (sell)")
        print(f"  4. Deploy new capital (portfolio-aware)")
        print(f"  5. View transaction log")
        print(f"  6. Remove transaction (fix mistake)")
        print(f"  0. Back")

        try:
            choice = input("\n  Select: ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if choice == "0":
            break

        elif choice == "1":
            print_portfolio()

        elif choice in ("2", "3"):
            action = "buy" if choice == "2" else "sell"
            try:
                ticker = input(f"  Ticker (e.g. XLE): ").strip().upper()
                if not ticker:
                    continue
                shares = float(input(f"  Shares: ").strip())
                price  = float(input(f"  Price per share ($): ").strip())
                date   = input(f"  Date (YYYY-MM-DD, Enter for today): ").strip()
                if not date:
                    date = datetime.now().strftime("%Y-%m-%d")

                add_transaction(ticker, shares, price, action, date)
                total = round(shares * price, 2)
                print(f"\n  ✅ Recorded: {action.upper()} {shares} {ticker} "
                      f"@ ${price:.2f} = ${total:,.2f}")
            except (ValueError, EOFError, KeyboardInterrupt):
                print("\n  Cancelled.")

        elif choice == "4":
            try:
                amt = float(input("\n  Amount to deploy ($): ").strip())
                if amt <= 0:
                    continue

                from macro_kelly import REGIME_ETFS, get_current_regime
                with contextlib.redirect_stdout(io.StringIO()):
                    regime, _, _ = get_current_regime()
                etfs = REGIME_ETFS.get(regime, REGIME_ETFS["Stagflation"])
                deploy_with_portfolio(amt, etfs, regime)
            except (ValueError, EOFError, KeyboardInterrupt):
                print("\n  Cancelled.")

        elif choice == "5":
            print_transactions()

        elif choice == "6":
            print_transactions()
            try:
                idx = int(input("\n  Transaction # to remove: ").strip())
                removed = remove_transaction(idx)
                if removed:
                    print(f"  ✅ Removed: {removed['action']} {removed['shares']} "
                          f"{removed['ticker']} @ ${removed['price']:.2f}")
                else:
                    print(f"  ❌ Invalid transaction number.")
            except (ValueError, EOFError, KeyboardInterrupt):
                print("\n  Cancelled.")

    print()


if __name__ == "__main__":
    portfolio_menu()
