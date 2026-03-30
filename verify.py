"""
Verification script — checks exactly what financial data
the backtest used for each stock at a given date.
Cross-reference these numbers against the actual SEC filings.
"""

import json, os
from datetime import datetime

CACHE_DIR = ".backtest_cache"

VERIFY = [
    ("NVDA",  "0001045810", datetime(2022, 1, 1)),
    ("AVGO",  "0001730168", datetime(2022, 1, 1)),
    ("GOOGL", "0001652044", datetime(2022, 1, 1)),
]

CONCEPTS = {
    "Operating CF":  ["NetCashProvidedByUsedInOperatingActivities"],
    "CapEx":         ["PaymentsToAcquirePropertyPlantAndEquipment",
                       "PaymentsForCapitalImprovements",
                       "CapitalExpendituresIncurringObligation",
                       "PurchaseOfPropertyPlantAndEquipmentNet",
                       "PaymentsToAcquireOtherProductiveAssets"],
    "Revenue":       ["Revenues",
                       "RevenueFromContractWithCustomerExcludingAssessedTax",
                       "SalesRevenueNet",
                       "RevenueNet"],
    "Op. Income":    ["OperatingIncomeLoss"],
    "SBC":           ["ShareBasedCompensation",
                      "AllocatedShareBasedCompensationExpense"],
    "Shares":        ["CommonStockSharesOutstanding"],
}

def get_annual(facts, concepts, as_of):
    gaap = facts.get("facts",{}).get("us-gaap",{})
    for concept in concepts:
        if concept not in gaap: continue
        for unit in ["USD","shares"]:
            entries = gaap[concept].get("units",{}).get(unit,[])
            annual  = []
            for e in entries:
                if e.get("form") not in ("10-K","10-K/A"): continue
                if "Q" in e.get("frame",""): continue
                try:
                    filed = datetime.strptime(e["filed"],"%Y-%m-%d")
                except: continue
                if filed > as_of: continue
                annual.append(e)
            annual.sort(key=lambda x: x["end"], reverse=True)
            if annual:
                return concept, unit, annual[:3]
    return None, None, []

print("\n" + "="*72)
print("  BACKTEST DATA VERIFICATION")
print("  Cross-reference these values against SEC EDGAR 10-K filings")
print("="*72)

for ticker, cik, as_of in VERIFY:
    cache = os.path.join(CACHE_DIR, f"facts_{cik}.json")
    if not os.path.exists(cache):
        print(f"\n  ⚠️  No cache for {ticker} (CIK {cik}) — run backtest first")
        continue

    facts = json.load(open(cache))
    print(f"\n{'─'*72}")
    print(f"  {ticker}  (CIK: {cik})  — data available as of {as_of.strftime('%b %d %Y')}")
    print(f"{'─'*72}")

    for label, concepts in CONCEPTS.items():
        concept, unit, entries = get_annual(facts, concepts, as_of)
        if not entries:
            print(f"  {label:<16} ⚠️  NOT FOUND — tried: {', '.join(concepts)}")
            continue

        scale = 1e9 if unit == "USD" else 1e6
        unit_label = "B USD" if unit == "USD" else "M shares"

        row = f"  {label:<16} [{concept}]"
        vals = []
        for e in entries:
            v = e['val'] / scale
            vals.append(f"{e['end'][:4]}: {v:>8.2f} {unit_label}  (filed {e['filed']})")
        print(row)
        for v in vals:
            print(f"    {v}")

    print(f"\n  Verify at:")
    print(f"  https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=10-K&dateb=&owner=include&count=10")

print(f"\n{'='*72}")
print("  HOW TO VERIFY:")
print("  1. Click each SEC EDGAR link above")
print("  2. Open the 10-K filed closest to (but before) the as_of date")
print("  3. Find the Cash Flow Statement")
print("  4. Compare 'Net cash from operations' with Operating CF above")
print("  5. Compare 'Capital expenditures' with CapEx above")
print("  6. FCF = Operating CF - CapEx")
print("  7. FCF Yield = FCF / (Price × Shares)")
print(f"{'='*72}\n")
