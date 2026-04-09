"""
Eurostat data fetcher — European equivalent of FRED.
Fetches economic data for the EU27 aggregate.
"""
import os
import requests
import json
from datetime import datetime, timedelta

CACHE_DIR = ".macro_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# Eurostat series used for EU regime calculation
# Growth indicators: GDP, industrial production, retail sales, unemployment
# Inflation indicators: HICP, PPI
SERIES = {
    "gdp": {
        "dataset": "namq_10_gdp",
        "params": {"unit": "CLV_PCH_PRE", "s_adj": "SCA", "na_item": "B1GQ", "geo": "EU27_2020"},
        "freq": "quarterly",
    },
    "industrial_production": {
        "dataset": "sts_inpr_m",
        "params": {"unit": "I21", "s_adj": "CA", "nace_r2": "B-D", "geo": "EU27_2020"},
        "freq": "monthly",
    },
    "retail_sales": {
        "dataset": "sts_trtu_m",
        "params": {"unit": "I21", "s_adj": "CA", "nace_r2": "G47", "indic_bt": "VOL_SLS", "geo": "EU27_2020"},
        "freq": "monthly",
    },
    "unemployment": {
        "dataset": "une_rt_m",
        "params": {"unit": "PC_ACT", "s_adj": "SA", "sex": "T", "age": "TOTAL", "geo": "EU27_2020"},
        "freq": "monthly",
    },
    "hicp": {
        "dataset": "prc_hicp_manr",
        "params": {"unit": "RCH_A", "coicop": "CP00", "geo": "EU27_2020"},
        "freq": "monthly",
    },
}

BASE_URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"


def fetch_series(series_name, cache_hours=24):
    """Fetch a Eurostat series and return list of (date, value) tuples, newest first."""
    cfg = SERIES.get(series_name)
    if not cfg:
        return []

    cache_file = f"{CACHE_DIR}/eu_{series_name}.json"
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(hours=cache_hours):
            return json.load(open(cache_file))

    url = f"{BASE_URL}/{cfg['dataset']}"
    params = {"format": "JSON", "lang": "en", **cfg["params"]}

    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        print(f"  Failed to fetch {series_name}: {e}")
        if os.path.exists(cache_file):
            return json.load(open(cache_file))
        return []

    # Parse JSON-stat format
    # The 'time' dimension maps index -> date string (YYYY-MM or YYYY-QX)
    time_dim = data.get("dimension", {}).get("time", {}).get("category", {})
    time_index = time_dim.get("index", {})  # maps date string -> index
    values_map = data.get("value", {})  # maps flat index -> value

    # Build ordered list: (date, value)
    # time_index is {date_str: idx}, we need to reverse
    idx_to_date = {v: k for k, v in time_index.items()}

    # For a single-dimension query (EU27 only), the flat index = time index
    # For multi-dim queries we'd need size-based indexing
    result = []
    for idx_str, val in values_map.items():
        idx = int(idx_str)
        date = idx_to_date.get(idx)
        if date and val is not None:
            # Convert quarterly "2025-Q3" to "2025-07-01", monthly "2025-06" to "2025-06-01"
            if "Q" in date:
                year, q = date.split("-Q")
                month = {"1": "01", "2": "04", "3": "07", "4": "10"}[q]
                iso_date = f"{year}-{month}-01"
            else:
                iso_date = f"{date}-01"
            result.append((iso_date, float(val)))

    # Sort descending (newest first, matching FRED format)
    result.sort(key=lambda x: x[0], reverse=True)

    with open(cache_file, "w") as f:
        json.dump(result, f)

    return result


def get_all():
    """Fetch all EU indicators. Returns dict matching FRED's format."""
    result = {}
    for name in SERIES:
        print(f"  Fetching EU {name}...")
        result[name] = fetch_series(name)
    return result


if __name__ == "__main__":
    data = get_all()
    print()
    for name, values in data.items():
        latest = values[0] if values else None
        print(f"  {name}: {latest}")
