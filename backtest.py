"""
Point-in-time Backtest — SEC EDGAR XBRL
Scores S&P 500 using only data available at a given date,
picks top N by fundamentals, buys $total split equally, shows value today.
"""

import json, time, os, re, requests, yfinance as yf
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

HEADERS   = {"User-Agent": "superinvestor-tracker contact@example.com"}
CACHE_DIR = ".backtest_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

KNOWN_CIKS = {
    "AAPL":"0000320193","MSFT":"0000789019","GOOGL":"0001652044",
    "AMZN":"0001018724","META":"0001326801","NVDA":"0001045810",
    "ADBE":"0000796343","BKNG":"0001075531","PGR":"0000080661",
    "AXP":"0000004846","CB":"0000896159","MLI":"0000089089",
    "ENVA":"0001529864","UBER":"0001543151","V":"0001403161",
    "MA":"0001141391","UNH":"0000731766","JPM":"0000019617",
    "BRK-B":"0001067983","TSM":"0001046179","KO":"0000021344",
    "CVX":"0000093410","PFE":"0000078003","TSLA":"0001318605",
    "NFLX":"0001065280","CRM":"0001108524","INTC":"0000050863",
    "AMD":"0000002488","QCOM":"0000804328","TXN":"0000097476",
    "AVGO":"0001730168","CSCO":"0000858877","WMT":"0000104169",
    "HD":"0000354950","COST":"0000909832","MCD":"0000063908",
    "NKE":"0000320187","JNJ":"0000200406","LLY":"0000059478",
    "ABT":"0000001800","TMO":"0000097745","BAC":"0000070858",
    "WFC":"0000072971","GS":"0000886982","BLK":"0001364742",
    "SPGI":"0000064040","MCO":"0001059556","ICE":"0001571949",
    "V":"0001403161","MA":"0001141391","PYPL":"0001633917",
}

def get_cik(ticker):
    t = ticker.upper()
    if t in KNOWN_CIKS:
        return KNOWN_CIKS[t]
    cf = os.path.join(CACHE_DIR, f"cik_{t}.txt")
    if os.path.exists(cf):
        v = open(cf).read().strip()
        return v or None
    try:
        url = f"https://www.sec.gov/cgi-bin/browse-edgar?CIK={t}&type=10-K&action=getcompany"
        r   = requests.get(url, headers=HEADERS, timeout=30)
        m   = re.search(r"getcompany&CIK=(\d+)", r.text)
        if m:
            cik = m.group(1).zfill(10)
            open(cf,"w").write(cik)
            return cik
    except: pass
    open(cf,"w").write("")
    return None

def get_facts(cik):
    cf = os.path.join(CACHE_DIR, f"facts_{cik}.json")
    if os.path.exists(cf):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cf))
        if age < timedelta(hours=48):
            return json.load(open(cf))
    try:
        r = requests.get(
            f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
            headers=HEADERS, timeout=60)
        r.raise_for_status()
        d = r.json()
        json.dump(d, open(cf,"w"))
        return d
    except Exception as e:
        print(f"  ⚠️  XBRL failed CIK {cik}: {e}")
        return {}

def get_vals(facts, concepts, as_of):
    gaap = facts.get("facts",{}).get("us-gaap",{})
    for concept in concepts:
        if concept not in gaap: continue
        entries = gaap[concept].get("units",{}).get("USD",[])
        by_year = {}
        for e in entries:
            if e.get("form") not in ("10-K","10-K/A"): continue
            if "Q" in e.get("frame",""): continue
            try:
                filed = datetime.strptime(e["filed"],"%Y-%m-%d")
            except: continue
            if filed > as_of: continue
            end = e.get("end","")
            if end not in by_year or filed > by_year[end][0]:
                by_year[end] = (filed, e.get("val",0))
        if by_year:
            return [v for _,(_, v) in sorted(by_year.items(),reverse=True)[:4]]
    return []

def get_shares(facts, as_of):
    """Get shares outstanding, trying multiple concepts and unit types."""
    gaap = facts.get("facts",{}).get("us-gaap",{})
    concepts = ["CommonStockSharesOutstanding","CommonStockSharesIssued",
                "EntityCommonStockSharesOutstanding"]
    for concept in concepts:
        if concept not in gaap: continue
        # Check both USD and shares units
        for unit in ["shares","USD"]:
            entries = gaap[concept].get("units",{}).get(unit,[])
            by_year = {}
            for e in entries:
                if e.get("form") not in ("10-K","10-K/A","10-Q","DEF 14A"): continue
                try:
                    filed = datetime.strptime(e["filed"],"%Y-%m-%d")
                except: continue
                if filed > as_of: continue
                end = e.get("end","")
                if end not in by_year or filed > by_year[end][0]:
                    by_year[end] = (filed, e.get("val",0))
            if by_year:
                vals = [v for _,(_, v) in sorted(by_year.items(),reverse=True)[:1]]
                if vals and vals[0] > 0:
                    return vals[0]
    return None

def score(ticker, as_of):
    cik = get_cik(ticker)
    if not cik: return None
    facts = get_facts(cik)
    if not facts: return None

    op_cf   = get_vals(facts,["NetCashProvidedByUsedInOperatingActivities"], as_of)
    capex   = get_vals(facts,[
                        "PaymentsToAcquirePropertyPlantAndEquipment",
                        "PaymentsForCapitalImprovements",
                        "CapitalExpendituresIncurringObligation",
                        "PurchaseOfPropertyPlantAndEquipmentNet",
                        "PaymentsToAcquireOtherProductiveAssets",
                        "AcquisitionOfPropertyPlantAndEquipment",
                    ], as_of)
    sbc     = get_vals(facts,["ShareBasedCompensation",
                              "AllocatedShareBasedCompensationExpense"], as_of)
    revenue = get_vals(facts,[
                        "Revenues",
                        "RevenueFromContractWithCustomerExcludingAssessedTax",
                        "SalesRevenueNet",
                        "RevenueFromContractWithCustomerIncludingAssessedTax",
                        "SalesRevenueGoodsNet",
                        "RevenueNet",
                    ], as_of)
    op_inc  = get_vals(facts,["OperatingIncomeLoss"], as_of)

    if not op_cf: return None

    fcf = []
    for i in range(min(len(op_cf), 4)):
        ocf = op_cf[i]
        cpx = capex[i] if i < len(capex) else 0
        fcf.append(ocf - abs(cpx))

    # Price at as_of
    tk = yf.Ticker(ticker)
    try:
        hist = tk.history(start=as_of-timedelta(days=7), end=as_of+timedelta(days=7))
        price_then = float(hist["Close"].iloc[-1]) if not hist.empty else None
    except: price_then = None

    # Price today
    try:
        hist_now = tk.history(period="5d")
        price_now = float(hist_now["Close"].iloc[-1]) if not hist_now.empty else None
    except: price_now = None

    # Market cap at as_of — try XBRL shares first, then yfinance
    mktcap = None
    raw_shares = get_shares(facts, as_of)
    if raw_shares and price_then:
        # Normalise share count — XBRL sometimes files in thousands or millions
        if raw_shares < 100_000:
            raw_shares *= 1_000_000
        elif raw_shares < 100_000_000:
            raw_shares *= 1_000
        mktcap = price_then * raw_shares

    # Sanity check — market cap should be > $100M and < $10T
    if not mktcap or mktcap < 1e8 or mktcap > 1e13:
        try:
            fi = tk.fast_info
            if fi.shares_outstanding and price_then:
                mktcap = price_then * fi.shares_outstanding
        except: pass

    latest_fcf = fcf[0] if fcf else None
    latest_rev = revenue[0] if revenue else None
    prev_rev   = revenue[1] if len(revenue)>1 else None
    latest_op  = op_inc[0] if op_inc else None
    latest_sbc = sbc[0] if sbc else None
    prev_fcf   = fcf[1] if len(fcf)>1 else None

    def pct(a, b):
        try:
            if b and b != 0: return round(a/b*100, 1)
        except: pass
        return None

    fcf_yield  = pct(latest_fcf, mktcap)
    op_margin  = pct(latest_op, latest_rev)
    rev_growth = pct((latest_rev-prev_rev), abs(prev_rev)) if latest_rev and prev_rev else None
    fcf_growth = pct((latest_fcf-prev_fcf), abs(prev_fcf)) if latest_fcf and prev_fcf and prev_fcf>0 else None
    sbc_pct    = pct(abs(latest_sbc), latest_fcf) if latest_sbc and latest_fcf and latest_fcf>0 else None

    def s(v, good, bad, hi=True):
        if v is None: return 0
        if hi:  return 2 if v>=good else (1 if v>=bad else -1)
        else:   return 2 if v<=good else (1 if v<=bad else -1)

    metric_scores = [
        s(fcf_yield,  4,   2),
        s(op_margin,  15,  5),
        s(rev_growth, 10,  0),
        s(fcf_growth, 10,  0),
        s(sbc_pct,    20,  50, hi=False),
    ]
    green  = sum(1 for x in metric_scores if x == 2)
    red    = sum(1 for x in metric_scores if x == -1)
    fscore = round(max(0, green*1.5 - red*1.0), 2)

    return {
        "ticker":     ticker,
        "fscore":     fscore,
        "green":      green,
        "red":        red,
        "price_then": price_then,
        "price_now":  price_now,
        "fcf_yield":  fcf_yield,
        "op_margin":  op_margin,
        "rev_growth": rev_growth,
        "fcf_growth": fcf_growth,
        "sbc_pct":    sbc_pct,
        "mktcap_b":   round(mktcap/1e9, 1) if mktcap else None,
    }


def get_sp500():
    cache = os.path.join(CACHE_DIR, "sp500.json")
    if os.path.exists(cache):
        return json.load(open(cache))
    try:
        r    = requests.get(
            "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
            headers=HEADERS, timeout=30)
        soup = BeautifulSoup(r.text, "html.parser")
        tbl  = soup.find("table", {"id": "constituents"})
        tickers = [row.find_all("td")[0].get_text(strip=True).replace(".", "-")
                   for row in tbl.find_all("tr")[1:] if row.find_all("td")]
        json.dump(tickers, open(cache,"w"))
        print(f"  ✅  S&P 500: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"  ⚠️  Wikipedia scrape failed: {e}")
        return []


def run(universe, date_str, top_n=10, total=1000):
    as_of = datetime.strptime(date_str, "%Y-%m-%d")
    print(f"\n  📅  Scoring {len(universe)} stocks as of {as_of.strftime('%b %Y')}...")

    results = []
    for i, ticker in enumerate(universe, 1):
        if i % 5 == 0:
            print(f"  [{i}/{len(universe)}] {ticker}...")
        r = score(ticker, as_of)
        if r and r["fscore"] > 0 and r["price_then"] and r["price_now"]:
            results.append(r)
        time.sleep(0.15)

    # Require FCF yield >= 2% OR unknown (banks/financials)
    results = [r for r in results
               if r["fcf_yield"] is None or r["fcf_yield"] >= 2.0]

    # Sort: fscore first, then FCF yield as tiebreaker
    results.sort(key=lambda x: (x["fscore"], x["fcf_yield"] or 0), reverse=True)
    top = results[:top_n]

    if not top:
        print("  ⚠️  No results")
        return

    per_stock = total / len(top)

    # SPY comparison
    spy_hist_then = yf.Ticker("SPY").history(
        start=as_of-timedelta(days=7), end=as_of+timedelta(days=7))
    spy_hist_now  = yf.Ticker("SPY").history(period="5d")
    spy_then  = float(spy_hist_then["Close"].iloc[-1]) if not spy_hist_then.empty else None
    spy_now   = float(spy_hist_now["Close"].iloc[-1])  if not spy_hist_now.empty  else None
    spy_value = round(total * (spy_now / spy_then), 2) if spy_then and spy_now else None

    print(f"\n{'─'*72}")
    print(f"  Top {top_n} by fundamentals — {as_of.strftime('%b %Y')}  |  ${per_stock:.0f} per stock  |  ${total:.0f} total")
    print(f"{'─'*72}")
    print(f"  {'Ticker':<7} {'Score':<7} {'G/R':<5} {'FCFYld':>7} {'MktCap':>8} {'Then':>9} {'Now':>8} {'Value':>9} {'Ret':>7}")
    print(f"  {'─'*7} {'─'*7} {'─'*5} {'─'*7} {'─'*8} {'─'*9} {'─'*8} {'─'*9} {'─'*7}")

    total_now = 0
    rows = []
    for r in top:
        shares_bought = per_stock / r["price_then"]
        value_now     = round(shares_bought * r["price_now"], 2)
        ret           = round((r["price_now"] - r["price_then"]) / r["price_then"] * 100, 1)
        total_now    += value_now
        rows.append((r, value_now, ret))

    for r, val, ret in sorted(rows, key=lambda x: x[1], reverse=True):
        fy  = f"{r['fcf_yield']:.1f}%" if r['fcf_yield'] is not None else "n/a"
        mc  = f"${r['mktcap_b']}B"     if r['mktcap_b']  is not None else "n/a"
        print(f"  {r['ticker']:<7} {r['fscore']:<7} {r['green']}🟢{r['red']}🔴  "
              f"{fy:>6}  {mc:>8}  ${r['price_then']:>8.2f}  ${r['price_now']:>7.2f}"
              f"  ${val:>8.2f}  {ret:>+.1f}%")

    print(f"\n{'─'*72}")
    print(f"  Portfolio today:  ${total_now:>10,.2f}  ({(total_now-total)/total*100:+.1f}%)")
    if spy_value:
        print(f"  SPY same ${total:.0f}:  ${spy_value:>10,.2f}  ({(spy_value-total)/total*100:+.1f}%)")
        print(f"  Difference:       ${total_now-spy_value:>+10,.2f}")
    print(f"{'─'*72}\n")


if __name__ == "__main__":
    import sys
    date_str = sys.argv[1] if len(sys.argv) > 1 else "2021-01-01"
    top_n    = int(sys.argv[2])   if len(sys.argv) > 2 else 10
    total    = float(sys.argv[3]) if len(sys.argv) > 3 else 1000.0

    universe = get_sp500()
    if not universe:
        print("⚠️  Could not fetch S&P 500 — check connection")
        sys.exit(1)

    run(universe, date_str, top_n=top_n, total=total)
