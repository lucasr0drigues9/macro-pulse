"""
Tracks actual asset performance across all three regions
since each economy's current regime started.

US:     Reflation since Aug 2025
China:  Deflation since ~Aug 2025
Europe: Reflation since ~Aug 2025
"""
import yfinance as yf
from datetime import datetime

START_DATE = "2025-08-01"
END_DATE   = datetime.today().strftime("%Y-%m-%d")

US_ASSETS = {
    "DBC  — Commodities":    ("DBC", "✅ Reflation pick"),
    "XLE  — Energy stocks":  ("XLE", "✅ Reflation pick"),
    "TIP  — TIPS":           ("TIP", "✅ Reflation pick"),
    "VNQ  — Real estate":    ("VNQ", "✅ Reflation pick"),
    "QQQ  — Growth stocks":  ("QQQ", "❌ Reflation avoid"),
    "TLT  — Long bonds":     ("TLT", "❌ Reflation avoid"),
    "SPY  — S&P 500":        ("SPY", "📊 Benchmark"),
    "GLD  — Gold":           ("GLD", "📊 Benchmark"),
}

CHINA_ASSETS = {
    "BABA — Alibaba":        ("BABA", "🔵 Deflation — export tech"),
    "NTES — NetEase":        ("NTES", "🔵 Deflation — export tech"),
    "PDD  — Pinduoduo":      ("PDD",  "🔵 Deflation — export tech"),
    "KWEB — China tech ETF": ("KWEB", "📊 China benchmark"),
    "FXI  — China broad":    ("FXI",  "📊 China benchmark"),
    "EEM  — Emerging mkts":  ("EEM",  "📊 EM benchmark"),
}

EM_BREAKDOWN = {
    "EEM  — EM broad":       ("EEM",  "📊 Broad EM"),
    "INDA — India":          ("INDA", "📊 EM component"),
    "EWY  — South Korea":    ("EWY",  "📊 EM component"),
    "EWT  — Taiwan":         ("EWT",  "📊 EM component"),
    "EWZ  — Brazil":         ("EWZ",  "📊 EM component"),
    "FXI  — China":          ("FXI",  "📊 EM component"),
    "VNM  — Vietnam":        ("VNM",  "📊 EM component"),
}

EUROPE_ASSETS = {
    "VGK  — Europe broad":   ("VGK",  "✅ Reflation pick"),
    "EWG  — Germany":        ("EWG",  "✅ Reflation pick"),
    "IEV  — Europe index":   ("IEV",  "✅ Reflation pick"),
    "EWU  — UK":             ("EWU",  "📊 Benchmark"),
}

ETF_COMPOSITION_NOTES = {
    "EEM":  {"note": "~25% China, ~20% India, ~15% Taiwan, ~10% S.Korea", "updated": "Q1 2026", "warning": "India/Taiwan driving returns — not a pure China signal"},
    "KWEB": {"note": "~100% China internet/tech stocks",                   "updated": "Q1 2026", "warning": None},
    "FXI":  {"note": "~100% large-cap China stocks (H-shares)",            "updated": "Q1 2026", "warning": None},
    "VGK":  {"note": "~25% UK, ~15% France, ~14% Switzerland, ~12% Germany","updated": "Q1 2026","warning": "UK not in Eurozone — different monetary policy"},
    "IEV":  {"note": "~25% UK, ~14% France, ~13% Switzerland, ~10% Germany","updated": "Q1 2026","warning": "UK not in Eurozone — different monetary policy"},
    "EWG":  {"note": "~100% German equities",                              "updated": "Q1 2026", "warning": None},
    "EWU":  {"note": "~100% UK equities — GBP denominated",                "updated": "Q1 2026", "warning": "Not Eurozone — separate from ECB policy"},
    "INDA": {"note": "~100% Indian equities — largest EM opportunity",       "updated": "Q1 2026", "warning": None},
    "EWY":  {"note": "~100% South Korean equities — tech/semiconductor heavy","updated": "Q1 2026","warning": None},
    "EWT":  {"note": "~100% Taiwan equities — TSMC dominates (~50%)",        "updated": "Q1 2026", "warning": "TSMC alone is ~50% of this ETF"},
    "EWZ":  {"note": "~100% Brazilian equities — commodity/energy heavy",    "updated": "Q1 2026", "warning": None},
    "VNM":  {"note": "~100% Vietnamese equities — manufacturing relocation", "updated": "Q1 2026", "warning": "Benefiting from China+1 manufacturing shift"},
}

def get_return(ticker, start, end):
    try:
        hist = yf.Ticker(ticker).history(start=start, end=end)
        if hist.empty or len(hist) < 2:
            return None
        start_price = hist["Close"].iloc[0]
        end_price   = hist["Close"].iloc[-1]
        return round((end_price - start_price) / start_price * 100, 2)
    except:
        return None

def print_section(title, assets, sort=True):
    results = []
    for label, (ticker, category) in assets.items():
        ret = get_return(ticker, START_DATE, END_DATE)
        results.append((label, ticker, category, ret))

    if sort:
        results.sort(key=lambda x: x[3] if x[3] is not None else -999, reverse=True)

    print(f"\n  {title}")
    print(f"  {'─'*58}")
    print(f"  {'Asset':<28} {'Return':>8}   Category")
    print(f"  {'─'*26} {'─'*8}   {'─'*18}")

    for label, ticker, category, ret in results:
        ret_str  = f"{ret:>+.1f}%" if ret is not None else "   n/a"
        comp     = ETF_COMPOSITION_NOTES.get(ticker, {})
        note     = comp.get("note", "")
        warning  = comp.get("warning", "")
        updated  = comp.get("updated", "")
        print(f"  {label:<28} {ret_str:>7}   {category}")
        if note:
            print(f"  {'':28}          📌 {note} ({updated})")
        if warning:
            print(f"  {'':28}          ⚠️  {warning}")

    # Summary for picks vs avoids
    picks  = [r for r in results if "pick" in r[2] and r[3] is not None]
    avoids = [r for r in results if "avoid" in r[2] and r[3] is not None]
    if picks and avoids:
        avg_p = sum(r[3] for r in picks)  / len(picks)
        avg_a = sum(r[3] for r in avoids) / len(avoids)
        won   = "✅ Picks outperformed" if avg_p > avg_a else "❌ Avoids outperformed"
        print(f"\n  📈 Avg picks: {avg_p:>+.1f}%   📉 Avg avoids: {avg_a:>+.1f}%   {won}")

def run():
    print(f"\n{'='*65}")
    print(f"  📊 GLOBAL ASSET PERFORMANCE SINCE CURRENT REGIMES STARTED")
    print(f"  Period: {START_DATE} → {END_DATE}")
    print(f"{'='*65}")

    print_section(
        "🇺🇸 US — Reflation picks vs avoids",
        US_ASSETS
    )
    print_section(
        "🌏 Emerging Markets — breakdown by country",
        EM_BREAKDOWN
    )
    print_section(
        "🇨🇳 China — Deflation period performance",
        CHINA_ASSETS
    )
    print_section(
        "🇪🇺 Europe — Reflation period performance",
        EUROPE_ASSETS
    )

    print(f"\n  {'─'*60}")
    print(f"  ⚠️  Past performance within a regime does not guarantee")
    print(f"     future results. Regime transitions can reverse quickly.")
    print(f"\n{'='*65}\n")

if __name__ == "__main__":
    run()
