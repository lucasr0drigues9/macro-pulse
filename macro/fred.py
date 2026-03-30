import os, requests, json
from datetime import datetime, timedelta

FRED_KEY = os.getenv("FRED_API_KEY")
CACHE_DIR = ".macro_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

SERIES = {
    "gdp":          "GDPC1",
    "unemployment": "UNRATE",
    "cpi":          "CPIAUCSL",
    "core_cpi":     "CPILFESL",
    "pce":          "PCEPI",
    "ppi":          "PPIFIS",
    "retail_sales": "RSXFS",
    "t10y2y":       "T10Y2Y",   # 10yr minus 2yr yield spread
    "t10y3m":       "T10Y3M",   # 10yr minus 3month spread (Fed's preferred)
}

def fetch_series(series_id, limit=12):
    cache_file = f"{CACHE_DIR}/{series_id}.json"
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(hours=24):
            return json.load(open(cache_file))

    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id":     series_id,
        "api_key":       FRED_KEY,
        "file_type":     "json",
        "sort_order":    "desc",
        "limit":         limit,
    }
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json().get("observations", [])
    json.dump(data, open(cache_file, "w"))
    return data

def get_all():
    result = {}
    for name, series_id in SERIES.items():
        print(f"  Fetching {name} ({series_id})...")
        obs = fetch_series(series_id)
        values = [(o["date"], float(o["value"]))
                  for o in obs if o["value"] != "."]
        result[name] = values
    return result

if __name__ == "__main__":
    data = get_all()
    for name, values in data.items():
        latest = values[0] if values else None
        print(f"  {name}: {latest}")
