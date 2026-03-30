"""
Daily snapshot system — stores full market state each day.
Keeps everything forever in a JSONL file (one JSON per line).
"""
import os
import json
from datetime import datetime

SNAPSHOT_FILE = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/snapshots.jsonl"

def save_snapshot():
    """Save today's full market snapshot. Skips if already saved today."""
    today = datetime.now().strftime("%Y-%m-%d")

    # Check if today already saved
    if os.path.exists(SNAPSHOT_FILE):
        with open(SNAPSHOT_FILE) as f:
            lines = f.readlines()
        if lines and json.loads(lines[-1]).get("date") == today:
            return False  # Already saved today

    snapshot = {"date": today, "timestamp": datetime.now().isoformat()}

    # Macro regime
    try:
        import sys
        sys.path.insert(0, "/home/lucas_r0drigues9/finance-projects/macro")
        import contextlib, io
        from fred import get_all
        from quadrant import get_quadrant
        from transition import assess_transitions
        with contextlib.redirect_stdout(io.StringIO()):
            us_data = get_all()
        result = get_quadrant(us_data)
        q = result["quadrant"]
        g = result["growth"]
        i = result["inflation"]
        trans = assess_transitions(g, i)
        snapshot["regime"]       = q["name"]
        snapshot["gdp_pct"]      = g["detail"].get("gdp_change_pct")
        snapshot["cpi_pct"]      = i["detail"].get("cpi_change_pct")
        snapshot["retail_pct"]   = g["detail"].get("retail_change_pct")
        snapshot["transition"]   = trans.get("likely_name")
    except Exception as e:
        snapshot["regime_error"] = str(e)

    # Live prices
    try:
        import yfinance as yf
        prices = {}
        for ticker in ["CL=F", "GLD", "XLE", "DBC", "QQQ", "SPY", "TLT"]:
            try:
                hist = yf.Ticker(ticker).history(period="2d")
                if len(hist):
                    prices[ticker] = round(hist["Close"].iloc[-1], 2)
            except:
                pass
        snapshot["prices"] = prices
        # Oil specifically
        for ot in ["BZ=F", "CL=F"]:
            try:
                h = yf.Ticker(ot).history(period="5d")
                if len(h):
                    p = round(h["Close"].iloc[-1], 1)
                    if 30 < p < 300:
                        snapshot["oil_price"] = p
                        snapshot["oil_ticker"] = ot
                        break
            except:
                pass
    except Exception as e:
        snapshot["prices_error"] = str(e)

    # Geopolitical
    try:
        from geopolitical import get_geopolitical_risks
        geo = get_geopolitical_risks()
        if geo:
            snapshot["geo_regime"]  = geo.get("overall_regime_bias")
            snapshot["geo_summary"] = geo.get("overall_summary", "")[:200]
            snapshot["geo_events"]  = [
                {"title": e.get("title"), "severity": e.get("severity"),
                 "regime_push": e.get("regime_push")}
                for e in geo.get("events", [])[:5]
            ]
    except Exception as e:
        snapshot["geo_error"] = str(e)

    # Hormuz
    try:
        hcache = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/hormuz.json"
        if os.path.exists(hcache):
            with open(hcache) as hf:
                hdata = json.load(hf)
                snapshot["hormuz_count"] = hdata.get("count")
                snapshot["hormuz_pct"]   = hdata.get("pct_normal")
    except:
        pass

    # Synthesis headline
    try:
        spath = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/geo_synthesis.json"
        if os.path.exists(spath):
            with open(spath) as sf:
                synth = json.load(sf)
                snapshot["synthesis_headline"] = synth.get("headline", "")
                snapshot["synthesis_strategy"] = synth.get("prudent_strategy", "")[:300]
                snapshot["bull_trigger"]       = synth.get("bull_case", {}).get("trigger", "")
                snapshot["bear_trigger"]       = synth.get("bear_case", {}).get("trigger", "")
    except:
        pass

    # Save
    os.makedirs(os.path.dirname(SNAPSHOT_FILE), exist_ok=True)
    with open(SNAPSHOT_FILE, "a") as f:
        f.write(json.dumps(snapshot) + "\n")

    return True

def load_snapshots(days=None):
    """Load all snapshots, optionally limited to last N days."""
    if not os.path.exists(SNAPSHOT_FILE):
        return []
    with open(SNAPSHOT_FILE) as f:
        snapshots = [json.loads(line) for line in f if line.strip()]
    if days:
        from datetime import timedelta
        cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        snapshots = [s for s in snapshots if s.get("date", "") >= cutoff]
    return snapshots

def print_history_table(snapshots):
    """Print history as a clean table."""
    if not snapshots:
        print("\n  No historical data yet. Run the tool daily to build history.")
        return

    REGIME_EMOJIS = {
        "Reflation": "🟡", "Stagflation": "🔴",
        "Deflation": "🔵", "Goldilocks": "🟢"
    }

    print(f"\n{'='*75}")
    print(f"  📈 MARKET HISTORY — {len(snapshots)} snapshots")
    print(f"{'='*75}")
    print(f"\n  {'Date':<12} {'Regime':<13} {'Geo':<13} {'Oil':>6} "
          f"{'CPI':>7} {'Retail':>8} {'Hormuz':>9} {'XLE':>7}")
    print(f"  {'─'*12} {'─'*13} {'─'*13} {'─'*6} "
          f"{'─'*7} {'─'*8} {'─'*9} {'─'*7}")

    for s in reversed(snapshots):
        date    = s.get("date", "")
        regime  = s.get("regime", s.get("geo_regime", "Unknown"))
        geo     = s.get("geo_regime", "Unknown")
        oil     = f"${s['oil_price']:.0f}" if s.get("oil_price") else "n/a"
        cpi     = f"{s['cpi_pct']:+.2f}%" if s.get("cpi_pct") else "n/a"
        retail  = f"{s['retail_pct']:+.2f}%" if s.get("retail_pct") else "n/a"
        hormuz  = f"{s['hormuz_count']}/day" if s.get("hormuz_count") else "n/a"
        xle     = f"${s['prices']['XLE']:.1f}" if s.get("prices", {}).get("XLE") else "n/a"

        r_emoji = REGIME_EMOJIS.get(regime, "❓")
        g_emoji = REGIME_EMOJIS.get(geo, "❓")

        print(f"  {date:<12} {r_emoji}{regime:<12} {g_emoji}{geo:<12} "
              f"{oil:>6} {cpi:>7} {retail:>8} {hormuz:>9} {xle:>7}")

    # Latest synthesis
    latest = snapshots[-1]
    if latest.get("synthesis_headline"):
        print(f"\n  {'─'*73}")
        print(f"  Latest synthesis ({latest['date']}):")
        print(f"  {latest['synthesis_headline']}")
        if latest.get("bull_trigger"):
            print(f"\n  🟢 Bull trigger: {latest['bull_trigger']}")
        if latest.get("bear_trigger"):
            print(f"  🔴 Bear trigger: {latest['bear_trigger']}")

    print(f"\n{'='*75}\n")

if __name__ == "__main__":
    import sys
    if "--save" in sys.argv:
        saved = save_snapshot()
        print("Snapshot saved." if saved else "Already saved today.")
    else:
        snapshots = load_snapshots()
        print_history_table(snapshots)
