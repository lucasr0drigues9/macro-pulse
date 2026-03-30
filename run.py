"""
Investment Research Suite — Interactive Launcher
Follow the steps in order for a complete analysis.
"""
import os
import sys
import subprocess
from datetime import datetime

MACRO_DIR    = "/home/lucas_r0drigues9/finance-projects/macro"
INVESTOR_DIR = "/home/lucas_r0drigues9/finance-projects"
PYTHON       = sys.executable

def clear():
    os.system("clear")

def run(cmd, cwd):
    """Run a command, filtering fetch noise from output."""
    result = subprocess.run(
        [PYTHON] + cmd, cwd=cwd,
        capture_output=True, text=True
    )
    skip = (
        "Fetching ", "📡 Fetching",
        "🇺🇸 US (FRED)", "🇨🇳 China (World", "🇪🇺 Europe (FRED",
        "Looking up sector", "✅  Warren", "✅  Bill",
        "✅  Michael", "✅  David", "✅  George", "✅  Norges",
        "✅  Swedbank", "✅  Handels", "✅  Hillhouse",
        "✅  Greenwoods", "✅  Aspex", "✅  Baillie",
        "✅  Lansdowne", "✅  Man Group",
        "⚠️  World Bank", "⚠️  Failed",
    )
    for line in result.stdout.split("\n"):
        if not any(line.strip().startswith(s) for s in skip):
            print(line)
    if result.returncode != 0 and result.stderr:
        print(f"\n  ⚠️  Error: {result.stderr[:200]}")
    input("\n  Press Enter to return to menu...")

def run_direct(script_path, cwd):
    """Run a script directly — no output capture, supports input() prompts."""
    subprocess.run([PYTHON, script_path], cwd=cwd)
    input("\n  Press Enter to return to menu...")

def get_geo_regime():
    """Get current geopolitical regime for menu display."""
    try:
        sys.path.insert(0, MACRO_DIR)
        from geopolitical import get_geopolitical_risks
        data = get_geopolitical_risks()
        if data:
            bias  = data.get("overall_regime_bias", "Unknown")
            emojis = {"Reflation":"🟡","Stagflation":"🔴",
                      "Deflation":"🔵","Goldilocks":"🟢"}
            return f"{emojis.get(bias,'❓')} {bias}"
    except:
        pass
    return "❓ Unknown"

def get_filing_status():
    """Get 13F filing status for menu display."""
    FILING_DATES = [
        (datetime(2026, 2, 14), "Q4 2025"),
        (datetime(2026, 5, 15), "Q1 2026"),
        (datetime(2026, 8, 14), "Q2 2026"),
        (datetime(2026, 11, 14),"Q3 2026"),
    ]
    today = datetime.now()
    for filing_date, quarter in FILING_DATES:
        days_since = (today - filing_date).days
        if 0 <= days_since <= 30:
            return f"🟢 FILING SEASON — {quarter} ({days_since}d ago)"
    future = [(d, q) for d, q in FILING_DATES if d > today]
    if future:
        nxt_d, nxt_q = future[0]
        days = (nxt_d - today).days
        return f"🔴 between filings — {nxt_q} in {days} days"
    return "❓ unknown"

def print_menu():
    clear()
    regime  = get_geo_regime()
    filing  = get_filing_status()
    today   = datetime.now().strftime("%B %d, %Y")

    print(f"\n{'═'*62}")
    print(f"  📊 INVESTMENT RESEARCH SUITE          {today}")
    print(f"  Follow the steps below for a complete analysis")
    print(f"{'═'*62}")

    print(f"\n  STEP 1 — UNDERSTAND THE WORLD")
    print(f"  1. 🌐 Geopolitical snapshot    what's happening right now")
    print(f"  2. 🌍 Global macro guidance    where the value is by region")
    print(f"  3. 🇺🇸 US economy              FRED data + transition watch")
    print(f"  4. 🇨🇳 China economy           deflation analysis + scenarios")
    print(f"  5. 🇪🇺 Europe economy          ECB cycle + opportunities")

    print(f"\n  STEP 2 — VALIDATE WITH DATA")
    print(f"  6. 📈 Asset performance        is the macro framework working?")
    print(f"  7. 🌐 Geopolitical deep dive   risks + AI portfolio synthesis")

    print(f"\n  STEP 3 — SIZE YOUR POSITIONS")
    print(f"  8. 📐 ETF allocation           Kelly sizing + regime monitor")
    print(f"     └─ Current regime: {regime}")

    print(f"\n  STEP 4 — RESEARCH (filing season only)")
    print(f"  9. 🏆 Superinvestor rankings   what smart money held last quarter")
    print(f"  A. 🔗 Alignment analysis       [{filing}]")

    print(f"\n  ADVANCED")
    print(f"  B. 🇳🇴 Norway Oil Fund         NBIM deep dive")
    print(f"  D. 📅 Weekly checklist         what to check and when this week")
    print(f"  H. 📈 Market history           daily snapshot table")

    print(f"\n  0. Exit")
    print(f"\n{'─'*62}")

def main():
    # Auto-save daily snapshot silently
    try:
        sys.path.insert(0, MACRO_DIR)
        os.chdir(MACRO_DIR)
        from snapshot import save_snapshot
        save_snapshot()
        os.chdir(INVESTOR_DIR)
    except:
        pass

    # Auto-refresh triggers if cache older than 24h
    try:
        import json as _j
        from datetime import datetime as _dt, timedelta as _td
        _tpath = f"{MACRO_DIR}/.macro_cache/regime_triggers.json"
        _needs_refresh = True
        if os.path.exists(_tpath):
            _age = _dt.now() - _dt.fromtimestamp(os.path.getmtime(_tpath))
            if _age < _td(hours=24):
                _needs_refresh = False
        if _needs_refresh:
            os.chdir(MACRO_DIR)
            sys.path.insert(0, MACRO_DIR)
            from geopolitical import get_geopolitical_risks, get_triggers
            _geo = get_geopolitical_risks()
            if _geo:
                _regime = _geo.get("overall_regime_bias", "Reflation")
                get_triggers(_geo, _regime)
            os.chdir(INVESTOR_DIR)
    except:
        pass

    while True:
        print_menu()
        choice = input("\n  Select: ").strip().upper()

        if choice == "0":
            clear()
            print("\n  Goodbye.\n")
            break

        elif choice == "1":
            clear()
            sys.path.insert(0, MACRO_DIR)
            os.chdir(MACRO_DIR)
            try:
                import contextlib, io
                sys.path.insert(0, MACRO_DIR)
                from thresholds import (OIL_CRISIS_LEVEL, OIL_WARNING_LEVEL,
                    CPI_STAGFLATION, CPI_GOLDILOCKS, HORMUZ_RECOVERY)
                from fred import get_all
                from quadrant import get_quadrant
                from transition import assess_transitions
                from geopolitical import get_geopolitical_risks
                EMOJIS = {"Reflation":"🟡","Stagflation":"🔴",
                          "Deflation":"🔵","Goldilocks":"🟢"}

                with contextlib.redirect_stdout(io.StringIO()):
                    us_data = get_all()
                result   = get_quadrant(us_data)
                q        = result["quadrant"]
                g        = result["growth"]
                i        = result["inflation"]
                trans    = assess_transitions(g, i)
                geo      = get_geopolitical_risks()
                geo_bias = geo.get("overall_regime_bias") if geo else None

                print(f"\n{'='*62}")
                print(f"  📋 SITUATION SUMMARY — {datetime.now().strftime('%B %d, %Y')}")
                print(f"{'='*62}")

                print(f"\n  MACRO REGIME")
                print(f"  FRED data:      {EMOJIS.get(q['name'],'❓')} {q['name']} (reflects Jan/Feb 2026)")
                if geo_bias and geo_bias != q['name']:
                    print(f"  Geopolitical:   {EMOJIS.get(geo_bias,'❓')} {geo_bias} (current — overrides FRED)")
                    print(f"  ⚠️  Data lag active — use geopolitical signal")
                else:
                    print(f"  Geopolitical:   {EMOJIS.get(geo_bias,'❓')} {geo_bias} (confirms FRED)")

                print(f"\n  KEY NUMBERS")
                print(f"  GDP:            {g['detail']['gdp_change_pct']:+.2f}%")
                print(f"  CPI:            {i['detail']['cpi_change_pct']:+.2f}%")
                print(f"  Retail sales:   {g['detail']['retail_change_pct']:+.2f}%")

                likely = trans.get("likely_name")
                if likely:
                    print(f"\n  ⚠️  TRANSITION WARNING → {likely} risk")
                    for w in trans.get("warnings", [])[:2]:
                        print(f"     {w['severity']} {w['message']}")

                if geo:
                    print(f"\n  TOP GEOPOLITICAL RISKS")
                    high = [e for e in geo.get("events",[]) if e.get("severity") == "HIGH"]
                    for e in high[:3]:
                        print(f"  🔴 {e.get('title','')} [{e.get('severity','')}]")
                        print(f"     → {e.get('regime_push','')}")

                regime = geo_bias or q['name']
                print(f"\n  WHAT TO DO NOW")
                print(f"  ✅ Buy:   {', '.join(q['best_assets'][:3])}")
                print(f"  ❌ Avoid: {', '.join(q['worst_assets'][:2])}")
                print(f"\n  → Option 7 for full geopolitical analysis")
                print(f"  → Option 8 for ETF allocation + position sizing")
                print(f"\n{'='*62}")
            except Exception as e:
                print(f"\n  ⚠️  {e}")
                import traceback; traceback.print_exc()
            input("\n  Press Enter to return to menu...")

        elif choice == "2":
            run(["main.py", "guidance"], MACRO_DIR)

        elif choice == "3":
            run(["main.py", "us"], MACRO_DIR)

        elif choice == "4":
            run(["main.py", "china"], MACRO_DIR)

        elif choice == "5":
            run(["main.py", "europe"], MACRO_DIR)

        elif choice == "6":
            run(["performance.py"], MACRO_DIR)

        elif choice == "7":
            run(["geopolitical.py"], MACRO_DIR)

        elif choice == "8":
            clear()
            run_direct(
                "/home/lucas_r0drigues9/finance-projects/macro_kelly.py",
                MACRO_DIR
            )

        elif choice == "9":
            run(["main.py", "global", "--no-analysis"], INVESTOR_DIR)

        elif choice == "A":
            run(["macro_alignment.py", "global"], INVESTOR_DIR)

        elif choice == "B":
            run(["main.py", "nbim", "--no-analysis"], INVESTOR_DIR)

        elif choice == "D":
            clear()
            sys.path.insert(0, MACRO_DIR)
            os.chdir(MACRO_DIR)
            try:
                import contextlib, io
                from fred import get_all
                from quadrant import get_quadrant
                from transition import assess_transitions
                from geopolitical import get_geopolitical_risks
                import yfinance as yf

                with contextlib.redirect_stdout(io.StringIO()):
                    us_data = get_all()
                result  = get_quadrant(us_data)
                q       = result["quadrant"]
                g       = result["growth"]
                i       = result["inflation"]
                trans   = assess_transitions(g, i)
                geo     = get_geopolitical_risks()
                geo_bias = geo.get("overall_regime_bias") if geo else None
                EMOJIS  = {"Reflation":"🟡","Stagflation":"🔴",
                           "Deflation":"🔵","Goldilocks":"🟢"}
                regime  = geo_bias or q["name"]

                # Live oil price — try multiple tickers
                oil_price = None
                for _oticker in ["CL=F", "BZ=F"]:
                    try:
                        _ohist = yf.Ticker(_oticker).history(period="5d")
                        if len(_ohist):
                            _op = round(_ohist["Close"].iloc[-1], 1)
                            if 30 < _op < 300:
                                oil_price = _op
                                break
                    except:
                        continue

                # Hormuz cache
                hormuz_count = 6  # fallback
                try:
                    import json
                    hcache = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/hormuz.json"
                    if os.path.exists(hcache):
                        with open(hcache) as hf:
                            hdata = json.load(hf)
                            hormuz_count = hdata.get("count", 6)
                except:
                    pass

                # Weekly calendar
                from datetime import timedelta
                weekday = datetime.now().weekday()
                days_ahead = {
                    "Wednesday EIA oil inventory":    (2 - weekday) % 7 or 7,
                    "Friday NFP jobs report":         (4 - weekday) % 7 or 7,
                }
                # Next 13F filing
                next_filing = datetime(2026, 5, 15)
                days_to_filing = (next_filing - datetime.now()).days

                print(f"\n{'='*62}")
                print(f"  📅 WEEKLY INVESTMENT CHECKLIST")
                print(f"  {datetime.now().strftime('%A, %B %d, %Y')}")
                print(f"{'='*62}")
                print(f"\n  Regime: {EMOJIS.get(regime,'❓')} {regime}")
                if geo_bias and geo_bias != q['name']:
                    print(f"  ⚠️  FRED still shows {q['name']} — data lag active")

                print(f"\n  THIS WEEK — scheduled releases:")
                for event, days in sorted(days_ahead.items(), key=lambda x: x[1]):
                    day_str = "today" if days == 0 else f"in {days} days"
                    print(f"  ☐ {event} ({day_str})")

                print(f"\n  LIVE TRIGGERS — check if fired:")
                if oil_price:
                    if oil_price > OIL_CRISIS_LEVEL:
                        oil_status = "🔴 crisis level"
                    elif oil_price > OIL_WARNING_LEVEL:
                        oil_status = "🟡 easing"
                    else:
                        oil_status = "🟢 ROTATE signal"
                    print(f"  ☐ Oil price       ${oil_price} → <${OIL_WARNING_LEVEL} = rotate to tech  {oil_status}")
                print(f"  ☐ CPI monthly     {i['detail']['cpi_change_pct']:+.2f}% → below +0.2% = Goldilocks signal")
                print(f"  ☐ Retail sales    {g['detail']['retail_change_pct']:+.2f}% → negative = Stagflation confirmed")
                print(f"  ☐ Hormuz transits {hormuz_count}/day → above 50 = supply recovering")

                # Iran events
                if geo:
                    iran = any("Iran" in e.get("title","") and
                               e.get("severity") == "HIGH"
                               for e in geo.get("events", []))
                    iran_status = "🔴 active" if iran else "🟢 easing"
                    print(f"  ☐ Iran conflict   {iran_status} → ceasefire = reduce XLE, add QQQ")

                print(f"\n  CALENDAR AHEAD:")
                CPI_DATES = [
                    datetime(2026,1,15),datetime(2026,2,11),datetime(2026,3,11),
                    datetime(2026,4,10),datetime(2026,5,12),datetime(2026,6,10),
                    datetime(2026,7,14),datetime(2026,8,11),datetime(2026,9,10),
                    datetime(2026,10,13),datetime(2026,11,12),datetime(2026,12,10),
                ]
                FOMC_DATES = [
                    datetime(2026,1,28),datetime(2026,3,18),datetime(2026,4,29),
                    datetime(2026,6,17),datetime(2026,7,29),datetime(2026,9,16),
                    datetime(2026,10,28),datetime(2026,12,9),
                ]
                FILING_SCHED = [
                    (datetime(2026,2,14),"Q4 2025"),(datetime(2026,5,15),"Q1 2026"),
                    (datetime(2026,8,14),"Q2 2026"),(datetime(2026,11,14),"Q3 2026"),
                ]
                now      = datetime.now()
                nxt_cpi  = next((d for d in CPI_DATES if d > now), None)
                nxt_fomc = next((d for d in FOMC_DATES if d > now), None)
                nxt_fil  = next(((d,q) for d,q in FILING_SCHED if d > now), None)
                d_cpi    = (nxt_cpi - now).days  if nxt_cpi  else None
                d_fomc   = (nxt_fomc - now).days if nxt_fomc else None
                d_fil    = (nxt_fil[0] - now).days if nxt_fil else None
                s_cpi    = nxt_cpi.strftime("%b %d")   if nxt_cpi  else "TBD"
                s_fomc   = nxt_fomc.strftime("%b %d")  if nxt_fomc else "TBD"
                s_fil    = nxt_fil[0].strftime("%b %d") if nxt_fil else "TBD"
                fil_q    = nxt_fil[1] if nxt_fil else ""
                # Try to get dynamic calendar scenarios from cached synthesis
                cal = {}
                try:
                    import json as _json
                    spath = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache/geo_synthesis.json"
                    if os.path.exists(spath):
                        with open(spath) as sf:
                            synth = _json.load(sf)
                            cal = synth.get("calendar_scenarios", {})
                except:
                    pass

                SEP = f"  {chr(9472)*58}"

                # CPI section
                print(SEP)
                print(f"  📅 {s_cpi} ({d_cpi}d)   CPI print — 8:30am ET")
                print(SEP)
                if cal.get("cpi"):
                    c = cal["cpi"]
                    print(f"  Context: {c.get('what_to_watch','')}")
                    print(f"  {'High CPI':<16} → {c.get('high','')}")
                    print(f"  {'Inline':<16} → {c.get('inline','')}")
                    print(f"  {'Low CPI':<16} → {c.get('low','')}")
                else:
                    print(f"  {'CPI > +0.5%':<16} → Stagflation deepens — HOLD XLE/GLD")
                    print(f"  {'CPI 0.3-0.5%':<16} → Regime unchanged — no action")
                    print(f"  {'CPI < +0.3%':<16} → Oil shock easing — watch for rotation")

                # FOMC section
                print(f"")
                print(SEP)
                print(f"  📅 {s_fomc} ({d_fomc}d)   FOMC — rate 3.50-3.75%")
                print(SEP)
                if cal.get("fomc"):
                    f_ = cal["fomc"]
                    print(f"  Context: {f_.get('what_to_watch','')}")
                    print(f"  {'HOLD (likely)':<16} → {f_.get('hold','')}")
                    print(f"  {'HIKE':<16} → {f_.get('hike','')}")
                    print(f"  {'CUT':<16} → {f_.get('cut','')}")
                    print(f"  {'EMERGENCY CUT':<16} → {f_.get('emergency_cut','')}")
                else:
                    print(f"  {'HOLD (likely)':<16} → No change to allocation")
                    print(f"  {'HIKE':<16} → ADD GLD/cash  |  REDUCE XLU/equities")
                    print(f"  {'CUT':<16} → ADD XLU/TLT  |  REDUCE XLE")
                    print(f"  {'EMERGENCY CUT':<16} → Pivot to TLT/GLD/cash only")

                # 13F section
                print(f"")
                print(SEP)
                print(f"  📅 {s_fil} ({d_fil}d)   {fil_q} 13F filings → run option A")
                print(SEP)
                if cal.get("filings"):
                    fi = cal["filings"]
                    print(f"  Watch: {fi.get('what_to_watch','')}")
                    print(f"  {'Bullish signal':<16} → {fi.get('bullish_signal','')}")
                    print(f"  {'Bearish signal':<16} → {fi.get('bearish_signal','')}")
                else:
                    print(f"  Watch for sector rotation from tech → energy/defense")
                print(f"\n  CURRENT ALLOCATION (option 8 for full detail):")
                if regime == "Stagflation":
                    print(f"  ✅ HOLD:  XLE, GLD, DBC, XLP, TIP, XLU")
                    print(f"  ❌ AVOID: QQQ, TLT, consumer discretionary")
                elif regime == "Reflation":
                    print(f"  ✅ HOLD:  XLE, DBC, GLD, TIPS")
                    print(f"  ❌ AVOID: TLT, long-duration growth stocks")
                elif regime == "Goldilocks":
                    print(f"  ✅ HOLD:  QQQ, SPY, VGK, growth stocks")
                    print(f"  ❌ AVOID: TLT, defensive plays")
                elif regime == "Deflation":
                    print(f"  ✅ HOLD:  TLT, GLD, XLP, cash")
                    print(f"  ❌ AVOID: equities broadly")

                print(f"\n{'='*62}")
            except Exception as e:
                print(f"\n  ⚠️  {e}")
                import traceback; traceback.print_exc()
            input("\n  Press Enter to return to menu...")

        elif choice == "H":
            clear()
            sys.path.insert(0, MACRO_DIR)
            os.chdir(MACRO_DIR)
            try:
                from snapshot import load_snapshots, print_history_table
                snapshots = load_snapshots()
                print_history_table(snapshots)
            except Exception as e:
                print(f"\n  ⚠️  {e}")
            input("\n  Press Enter to return to menu...")

        else:
            print("\n  Invalid selection.")
            import time
            time.sleep(1)

if __name__ == "__main__":
    main()
