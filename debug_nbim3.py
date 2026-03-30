import requests

HEADERS = {"User-Agent": "superinvestor-tracker contact@example.com"}

r = requests.get("https://data.sec.gov/submissions/CIK0001374170.json", headers=HEADERS, timeout=30)
filings    = r.json().get("filings", {}).get("recent", {})
forms      = filings.get("form", [])
accessions = filings.get("accessionNumber", [])
dates      = filings.get("filingDate", [])

print("All NBIM 13F filings:")
for form, acc, date in zip(forms, accessions, dates):
    if "13F" in form:
        acc_clean = acc.replace("-", "")
        # Check file sizes
        idx_url = f"https://www.sec.gov/Archives/edgar/data/1374170/{acc_clean}/index.json"
        r2 = requests.get(idx_url, headers=HEADERS, timeout=15)
        if r2.status_code == 200:
            items = r2.json().get("directory", {}).get("item", [])
            xml_files = [(i.get("name"), i.get("size")) for i in items if i.get("name","").endswith(".xml") and i.get("name") != "primary_doc.xml"]
            print(f"  {date} {form} {acc}  →  {xml_files}")
        else:
            print(f"  {date} {form} {acc}  →  index {r2.status_code}")
