"""
Generate regime backtest charts — one per regime showing
picks vs SPY vs 60/40 vs superinvestors across all periods.
"""
import sys
import json
import os
sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

CACHE = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache"
OUTPUT_DIR = "/home/lucas_r0drigues9/finance-projects/macro"

REGIME_COLORS = {
    "Stagflation": "#E24B4A",
    "Reflation":   "#F5A623",
    "Goldilocks":  "#1D9E75",
    "Deflation":   "#378ADD",
}
REGIME_EMOJIS = {
    "Stagflation": "Stagflation",
    "Reflation":   "Reflation",
    "Goldilocks":  "Goldilocks",
    "Deflation":   "Deflation",
}


def load_backtest_data():
    """Re-run the backtest data collection to get period results."""
    from backtest_regime import (
        build_regime_timeline, identify_periods, fetch_etf_monthly,
        compute_return, compute_6040_return, compute_portfolio_return,
        REGIME_ETFS, REGIME_AVOIDS, SUPERINVESTOR_PROXIES, ETF_INCEPTION
    )

    print("  Loading regime timeline...")
    timeline = build_regime_timeline()
    periods = identify_periods(timeline)

    print("  Loading ETF prices...")
    all_tickers = set()
    for etfs in REGIME_ETFS.values():
        all_tickers.update(etfs)
    for etfs in REGIME_AVOIDS.values():
        all_tickers.update(etfs)
    all_tickers.update(["SPY", "AGG"])
    all_tickers.update(SUPERINVESTOR_PROXIES.keys())

    prices = {}
    for ticker in sorted(all_tickers):
        prices[ticker] = fetch_etf_monthly(ticker)

    period_results = []
    for period in periods:
        regime = period["regime"]
        start  = period["start"]
        end    = period["end"]
        if start == end:
            continue

        spy_ret    = compute_return(prices["SPY"], start, end)
        bench_6040 = compute_6040_return(prices, start, end)
        pick_ret   = compute_portfolio_return(prices, REGIME_ETFS.get(regime, []), start, end)
        avoid_ret  = compute_portfolio_return(prices, REGIME_AVOIDS.get(regime, []), start, end)

        si_rets = {}
        for si_ticker in SUPERINVESTOR_PROXIES:
            inception = ETF_INCEPTION.get(si_ticker, "1990-01-01")
            if start >= inception:
                si_rets[si_ticker] = compute_return(prices.get(si_ticker, {}), start, end)

        if spy_ret is not None and pick_ret is not None:
            period_results.append({
                "regime": regime, "start": start, "end": end,
                "pick_ret": pick_ret, "spy_ret": spy_ret,
                "bench_6040": bench_6040, "avoid_ret": avoid_ret,
                **{f"si_{k}": v for k, v in si_rets.items()},
            })

    return timeline, periods, period_results


def plot_regime_timeline(timeline, periods, period_results):
    """Chart 1: Full regime timeline with color bars."""
    from datetime import datetime

    fig, ax = plt.subplots(figsize=(16, 3))
    fig.patch.set_facecolor("#0d0d0d")
    ax.set_facecolor("#0d0d0d")

    dates = [datetime.strptime(t["date"], "%Y-%m-%d") for t in timeline]
    for i, t in enumerate(timeline):
        color = REGIME_COLORS[t["regime"]]
        ax.bar(dates[i], 1, width=28, color=color, alpha=0.85)

    patches = [mpatches.Patch(color=c, label=q) for q, c in REGIME_COLORS.items()]
    ax.legend(handles=patches, loc="upper left",
              facecolor="#1a1a1a", edgecolor="#444",
              labelcolor="white", fontsize=9)

    ax.set_title("Economic Regime Timeline (2007-2026) — Dalio Quadrant Classification",
                 color="white", fontsize=12, pad=10)
    ax.set_yticks([])
    ax.tick_params(colors="#888")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")

    plt.tight_layout()
    path = f"{OUTPUT_DIR}/chart_regime_timeline.png"
    plt.savefig(path, dpi=150, facecolor=fig.get_facecolor())
    print(f"  Saved: {path}")
    plt.close()


def plot_regime_performance(period_results, regime):
    """Chart per regime: bar chart of picks vs SPY vs 60/40 vs BRK-B vs GURU per period."""
    r_periods = [p for p in period_results if p["regime"] == regime]
    if not r_periods:
        return

    color = REGIME_COLORS[regime]
    labels = [f"{p['start'][:7]}" for p in r_periods]
    n = len(labels)
    x = np.arange(n)
    width = 0.15

    fig, ax = plt.subplots(figsize=(max(12, n * 1.2), 6))
    fig.patch.set_facecolor("#0d0d0d")
    ax.set_facecolor("#0d0d0d")

    picks = [p["pick_ret"] for p in r_periods]
    spy   = [p["spy_ret"] for p in r_periods]
    b6040 = [p["bench_6040"] if p["bench_6040"] is not None else 0 for p in r_periods]
    brkb  = [p.get("si_BRK-B") if p.get("si_BRK-B") is not None else 0 for p in r_periods]
    guru  = [p.get("si_GURU") if p.get("si_GURU") is not None else 0 for p in r_periods]

    bars_picks = ax.bar(x - 2*width, picks, width, label="Regime Picks", color=color, alpha=0.9)
    bars_spy   = ax.bar(x - width,   spy,   width, label="SPY",          color="#AAAAAA", alpha=0.8)
    bars_6040  = ax.bar(x,           b6040, width, label="60/40",        color="#6B8E9B", alpha=0.8)
    bars_brkb  = ax.bar(x + width,   brkb,  width, label="BRK-B",       color="#D4A574", alpha=0.8)
    bars_guru  = ax.bar(x + 2*width, guru,  width, label="GURU",        color="#9B6BD4", alpha=0.8)

    ax.set_xlabel("Period Start", color="#888", fontsize=10)
    ax.set_ylabel("Return (%)", color="#888", fontsize=10)
    ax.set_title(f"{regime} Periods — Strategy Returns Comparison",
                 color="white", fontsize=13, pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=8)
    ax.tick_params(colors="#888")
    ax.axhline(y=0, color="#555", linewidth=0.5)

    ax.legend(facecolor="#1a1a1a", edgecolor="#444",
              labelcolor="white", fontsize=9, loc="best")

    for spine in ax.spines.values():
        spine.set_edgecolor("#333")

    # Add average annotation
    avg_pick = sum(picks) / len(picks)
    avg_spy  = sum(spy) / len(spy)
    ax.text(0.02, 0.95,
            f"Avg: Picks {avg_pick:+.1f}%  |  SPY {avg_spy:+.1f}%  |  "
            f"60/40 {sum(b6040)/len(b6040):+.1f}%",
            transform=ax.transAxes, color="#CCC", fontsize=9,
            verticalalignment="top",
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#1a1a1a", edgecolor="#444"))

    plt.tight_layout()
    path = f"{OUTPUT_DIR}/chart_{regime.lower()}.png"
    plt.savefig(path, dpi=150, facecolor=fig.get_facecolor())
    print(f"  Saved: {path}")
    plt.close()


def plot_summary(period_results):
    """Chart: Average returns by regime for each strategy."""
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.patch.set_facecolor("#0d0d0d")
    ax.set_facecolor("#0d0d0d")

    regimes = ["Stagflation", "Reflation", "Goldilocks", "Deflation"]
    x = np.arange(len(regimes))
    width = 0.15

    strategies = {
        "Regime Picks": ("pick_ret", None),
        "SPY":          ("spy_ret", None),
        "60/40":        ("bench_6040", None),
        "BRK-B":        ("si_BRK-B", None),
        "GURU":         ("si_GURU", None),
    }
    colors = {
        "Regime Picks": "#E24B4A",
        "SPY":          "#AAAAAA",
        "60/40":        "#6B8E9B",
        "BRK-B":        "#D4A574",
        "GURU":         "#9B6BD4",
    }

    for i, (name, (key, _)) in enumerate(strategies.items()):
        avgs = []
        for regime in regimes:
            r_ps = [p for p in period_results if p["regime"] == regime]
            vals = [p[key] for p in r_ps if p.get(key) is not None]
            avgs.append(sum(vals) / len(vals) if vals else 0)
        offset = (i - 2) * width
        bars = ax.bar(x + offset, avgs, width, label=name,
                      color=colors[name], alpha=0.85)
        # Add value labels on bars
        for bar, val in zip(bars, avgs):
            if abs(val) > 0.3:
                ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.1,
                        f"{val:+.1f}", ha="center", va="bottom",
                        color="#CCC", fontsize=7)

    ax.set_xlabel("Regime", color="#888", fontsize=11)
    ax.set_ylabel("Avg Return per Period (%)", color="#888", fontsize=11)
    ax.set_title("Which Strategy Wins in Each Regime? (2007-2026 Backtest)",
                 color="white", fontsize=13, pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(regimes, fontsize=11)
    ax.tick_params(colors="#888")
    ax.axhline(y=0, color="#555", linewidth=0.5)

    ax.legend(facecolor="#1a1a1a", edgecolor="#444",
              labelcolor="white", fontsize=10, loc="upper left")

    for spine in ax.spines.values():
        spine.set_edgecolor("#333")

    # Add winner annotations
    winners = {
        "Stagflation": "Regime Picks",
        "Reflation":   "GURU",
        "Goldilocks":  "BRK-B",
        "Deflation":   "GURU",
    }
    for i, regime in enumerate(regimes):
        ax.text(i, -1.2, f"Winner: {winners[regime]}",
                ha="center", color=colors.get(winners[regime], "#CCC"),
                fontsize=9, fontweight="bold")

    plt.tight_layout()
    path = f"{OUTPUT_DIR}/chart_summary.png"
    plt.savefig(path, dpi=150, facecolor=fig.get_facecolor())
    print(f"  Saved: {path}")
    plt.close()


if __name__ == "__main__":
    import subprocess, shutil

    print(f"\n  Generating backtest charts...")

    timeline, periods, period_results = load_backtest_data()

    plot_regime_timeline(timeline, periods, period_results)
    plot_summary(period_results)
    for regime in ["Stagflation", "Reflation", "Goldilocks", "Deflation"]:
        plot_regime_performance(period_results, regime)

    charts = [
        f"{OUTPUT_DIR}/chart_summary.png",
        f"{OUTPUT_DIR}/chart_regime_timeline.png",
        f"{OUTPUT_DIR}/chart_stagflation.png",
        f"{OUTPUT_DIR}/chart_reflation.png",
        f"{OUTPUT_DIR}/chart_goldilocks.png",
        f"{OUTPUT_DIR}/chart_deflation.png",
    ]

    # Try to open in VS Code, fallback to xdg-open
    opener = None
    if shutil.which("code"):
        opener = "code"
    elif shutil.which("xdg-open"):
        opener = "xdg-open"

    if opener:
        print(f"\n  Opening charts in {opener}...")
        for chart in charts:
            subprocess.Popen([opener, chart], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        print(f"\n  Charts saved to {OUTPUT_DIR}/chart_*.png")
        print(f"  Open manually or install 'code' CLI to auto-open.")
