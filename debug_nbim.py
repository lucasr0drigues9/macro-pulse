import os
from bs4 import BeautifulSoup

# Check what's actually in the NBIM cache files
files = [f for f in os.listdir(".") if f.startswith(".xml_cache_0001374170")]
print(f"Found NBIM cache files: {files}")

for fname in files:
    with open(fname) as f:
        content = f.read()
    print(f"\n{fname}: {len(content)} chars")
    
    soup = BeautifulSoup(content, "html.parser")
    tables = soup.find_all("infotable")
    print(f"  infotable tags found: {len(tables)}")
    
    if tables:
        # Show first entry
        first = tables[0]
        name = first.find("nameofissuer")
        val  = first.find("value")
        print(f"  First entry: {name.get_text() if name else 'N/A'} = {val.get_text() if val else 'N/A'}")
    else:
        # Try other tag names
        print("  Trying other tags...")
        print(f"  infoTable: {len(soup.find_all('infoTable'))}")
        print(f"  informationTable: {len(soup.find_all('informationTable'))}")
        print(f"  First 500 chars: {content[:500]}")
