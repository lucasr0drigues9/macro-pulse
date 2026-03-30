import sys
sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects")

# Temporarily import to check what portfolio_total Swedbank stores
from investors_nordic import get_all_holdings
holdings = get_all_holdings()

for h in holdings:
    if h["investor_name"] == "Swedbank Robur" and h["action"] != "sell":
        print(f"Sample: {h['ticker'][:20]} pct={h['pct']} portfolio_total={h['portfolio_total']:,.0f}")
        # Calculate what position value would show
        pos = h['portfolio_total'] * (h['pct'] / 100)
        print(f"  → position value in thousands: {pos:,.0f} = ${pos/1e6:.1f}B")
        break
