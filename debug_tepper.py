import sys
sys.path.insert(0, ".")
import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "superinvestor-tracker contact@example.com"}
CIK = "0001006438"  # Tepper

# Get accession
r = requests.get(f"https://data.sec.gov/submissions/CIK{CIK}.json", headers=HEADERS, timeout=10)
filings = r.json().get("filings", {}).get("recent", {})
forms = filings.get("form", [])
accessions = filings.get("accessionNumber", [])

acc = None
for form, accession in zip(forms, accessions):
    if form == "13F-HR":
        acc = accession.replace("-", "")
        break

print(f"Tepper accession: {acc}")

# Get infotable
cik_int = int(CIK)
idx = requests.get(f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{acc}/index.json", headers=HEADERS, timeout=10)
items = idx.json().get("directory", {}).get("item", [])
xml_file = next(i["name"] for i in items if i["name"].endswith(".xml") and i["name"] != "primary_doc.xml")
url = f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{acc}/{xml_file}"

r2 = requests.get(url, headers=HEADERS, timeout=30)
soup = BeautifulSoup(r2.text, "html.parser")
tables = soup.find_all("infotable")
print(f"Holdings found: {len(tables)}")

total = 0
for t in tables[:3]:
    name = t.find("nameofissuer")
    val = t.find("value")
    if name and val:
        v = float(val.get_text(strip=True).replace(",", ""))
        total += v
        print(f"  {name.get_text()[:30]}: ${v:,.0f}")

print(f"\nTotal of first 3: ${total:,.0f}")
print(f"If in $thousands: ${total/1000:,.0f}K = ${total/1e6:.1f}M")
print(f"Full fund at this scale: ~${total*len(tables)/1e6:.0f}M = ${total*len(tables)/1e9:.1f}B")
