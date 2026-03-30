import requests

HEADERS = {"User-Agent": "superinvestor-tracker contact@example.com"}

# Get NBIM's two most recent 13F accessions
r = requests.get("https://data.sec.gov/submissions/CIK0001374170.json", headers=HEADERS, timeout=30)
filings    = r.json().get("filings", {}).get("recent", {})
forms      = filings.get("form", [])
accessions = filings.get("accessionNumber", [])

filings_13f = []
for form, acc in zip(forms, accessions):
    if form == "13F-HR":
        filings_13f.append(acc)
    if len(filings_13f) == 3:
        break

print("Latest 3 NBIM 13F filings:")
for acc in filings_13f:
    print(f"  {acc}")

# Check the index of the previous quarter
acc_clean = filings_13f[1].replace("-", "")
index_url = f"https://www.sec.gov/Archives/edgar/data/1374170/{acc_clean}/index.json"
print(f"\nPrevious quarter index: {index_url}")
r2 = requests.get(index_url, headers=HEADERS, timeout=30)
print(f"Status: {r2.status_code}")
if r2.status_code == 200:
    items = r2.json().get("directory", {}).get("item", [])
    print("Files:")
    for item in items:
        print(f"  {item.get('name')} ({item.get('size', '?')} bytes)")
