from collections import defaultdict


def rank_stocks(all_holdings: list[dict]) -> tuple[list[dict], list[dict]]:
    stock_data = defaultdict(lambda: {
        "score": 0.0,
        "count": 0,
        "investors": [],
        "actions": [],
        "breakdown": [],
    })

    sells = []

    for holding in all_holdings:
        ticker = holding["ticker"]
        action = holding["action"]

        if action == "sell":
            sells.append({
                "ticker":          ticker,
                "investor":        holding["investor_name"],
                "weight":          holding["weight"],
                "region":          holding.get("region", ""),
                "prev_pct":        holding.get("prev_pct", 0.0),
                "portfolio_total": holding.get("portfolio_total", 0),
            })
            continue

        stock_data[ticker]["score"]     += holding["score"]
        stock_data[ticker]["count"]     += 1
        stock_data[ticker]["investors"].append(holding["investor_name"])
        stock_data[ticker]["actions"].append(action)
        stock_data[ticker]["breakdown"].append({
            "investor": holding["investor_name"],
            "action":   action,
            "weight":   holding["weight"],
            "score":    holding["score"],
            "pct":      holding.get("pct", 0.0),
            "prev_pct": holding.get("prev_pct", 0.0),
            "delta":          holding.get("delta", 0.0),
            "region":         holding.get("region", ""),
            "portfolio_total": holding.get("portfolio_total", 0),
        })

    ranked = []
    for ticker, data in stock_data.items():
        actions   = data["actions"]
        new_count = actions.count("new")
        add_count = actions.count("adding")

        if new_count > 0:
            signal = f"🟢 NEW by {new_count}"
        elif add_count > 0:
            signal = f"🔼 ADDING"
        else:
            signal = f"➡️  holding"

        ranked.append({
            "ticker":    ticker,
            "score":     round(data["score"], 2),
            "count":     data["count"],
            "investors": data["investors"],
            "signal":    signal,
            "breakdown": data["breakdown"],
        })

    # Apply fundamentals multiplier after fetching fundamentals in main.py
    # The multiplier is applied externally once fundamentals are known
    # Store raw investor score for reference
    for stock in ranked:
        stock["investor_score"] = stock["score"]

    ranked.sort(key=lambda x: x["score"], reverse=True)

    sells_grouped = defaultdict(list)
    for sell in sells:
        sells_grouped[sell["ticker"]].append({
            "investor":        sell["investor"],
            "weight":          sell["weight"],
            "region":          sell.get("region", ""),
            "prev_pct":        sell.get("prev_pct", 0.0),
            "portfolio_total": sell.get("portfolio_total", 0),
        })

    sells_list = [
        {"ticker": ticker, "sellers": sellers}
        for ticker, sellers in sells_grouped.items()
    ]
    sells_list.sort(
        key=lambda x: sum(s["weight"] for s in x["sellers"]),
        reverse=True
    )

    return ranked, sells_list
