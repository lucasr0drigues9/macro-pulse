import json

with open(".nbim_global_holdings.json") as f:
    cache = json.load(f)

dates = list(cache.keys())
print(f"Cached dates: {dates}")

holdings = cache[dates[0]]

# Find a known large holding to calibrate
for name, data in holdings.items():
    if "NVIDIA" in name.upper() or "APPLE" in name.upper() or "MICROSOFT" in name.upper():
        print(f"{name}: value={data.get('value', 0):,.0f}  pct={data.get('pct', 0)}")

total = sum(d.get("value", 0) for d in holdings.values() if isinstance(d, dict))
print(f"\nTotal raw value: {total:,.0f}")
print(f"As NOK (÷10.5 for USD billions): {total/10.5/1e9:.2f}B")
print(f"As USD directly (billions): {total/1e9:.2f}B")
print(f"As NOK millions (÷10.5÷1000 for USD billions): {total/10.5/1e6:.2f}B")
print(f"As USD thousands (÷1e6 for USD billions): {total/1e6:.2f}B")
