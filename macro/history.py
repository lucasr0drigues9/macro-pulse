"""
Plots which Dalio quadrant the economy was in over the last 10 years,
based on rolling 3-month changes in GDP, unemployment, CPI and PCE.
"""
import os, json, requests
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime, timedelta
from quadrant import assess_growth, assess_inflation, QUADRANTS

FRED_KEY  = os.getenv("FRED_API_KEY")
CACHE_DIR = ".macro_cache"

QUADRANT_COLORS = {
    "Goldilocks":  "#1D9E75",
    "Reflation":   "#F5A623",
    "Stagflation": "#E24B4A",
    "Deflation":   "#378ADD",
}

def fetch_full_series(series_id, limit=60):
    cache_file = f"{CACHE_DIR}/history_{series_id}.json"
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(hours=24):
            return json.load(open(cache_file))
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id":  series_id,
        "api_key":    FRED_KEY,
        "file_type":  "json",
        "sort_order": "desc",
        "limit":      limit,
    }
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json().get("observations", [])
    json.dump(data, open(cache_file, "w"))
    return data

def build_history():
    print("  Fetching historical data...")
    series = {
        "gdp":          fetch_full_series("GDPC1",    limit=40),
        "unemployment": fetch_full_series("UNRATE",   limit=60),
        "cpi":          fetch_full_series("CPIAUCSL", limit=60),
        "pce":          fetch_full_series("PCEPI",    limit=60),
        "ppi":          fetch_full_series("PPIFIS",   limit=60),
        "retail_sales": fetch_full_series("RSXFS",    limit=60),
    }

    # Convert to sorted lists (oldest first)
    def to_list(obs):
        vals = [(o["date"], float(o["value"]))
                for o in obs if o["value"] != "."]
        return sorted(vals, key=lambda x: x[0])

    data_asc = {k: to_list(v) for k, v in series.items()}

    # Build monthly snapshots going back ~4 years
    history = []
    ref_dates = sorted(set(d for d, _ in data_asc["cpi"]))[-48:]

    for date in ref_dates:
        # Slice each series up to this date (descending for quadrant functions)
        snapshot = {}
        for key, vals in data_asc.items():
            up_to = [(d, v) for d, v in vals if d <= date]
            snapshot[key] = list(reversed(up_to))

        if len(snapshot["cpi"]) < 4:
            continue

        growth    = assess_growth(snapshot)
        inflation = assess_inflation(snapshot)
        key       = (growth["direction"], inflation["direction"])
        quadrant  = QUADRANTS[key]

        history.append({
            "date":     date,
            "quadrant": quadrant["name"],
            "growth":   growth["direction"],
            "inflation": inflation["direction"],
        })

    return history

def plot_history(history):
    dates     = [datetime.strptime(h["date"], "%Y-%m-%d") for h in history]
    quadrants = [h["quadrant"] for h in history]
    colors    = [QUADRANT_COLORS[q] for q in quadrants]

    fig, ax = plt.subplots(figsize=(14, 5))
    fig.patch.set_facecolor("#0d0d0d")
    ax.set_facecolor("#0d0d0d")

    for i, (date, q, color) in enumerate(zip(dates, quadrants, colors)):
        ax.bar(date, 1, width=25, color=color, alpha=0.85)

    # Legend
    patches = [mpatches.Patch(color=c, label=q)
               for q, c in QUADRANT_COLORS.items()]
    ax.legend(handles=patches, loc="upper left",
              facecolor="#1a1a1a", edgecolor="#444",
              labelcolor="white", fontsize=10)

    ax.set_title("Ray Dalio Economic Quadrant — Last 4 Years",
                 color="white", fontsize=13, pad=12)
    ax.set_xlabel("Date", color="#888", fontsize=10)
    ax.set_yticks([])
    ax.tick_params(colors="#888")
    for spine in ax.spines.values():
        spine.set_edgecolor("#333")

    plt.tight_layout()
    output = "quadrant_history.png"
    plt.savefig(output, dpi=150, facecolor=fig.get_facecolor())
    print(f"\n  ✅ Chart saved to {output}")
    plt.show()

if __name__ == "__main__":
    print("\n📅 Building quadrant history...")
    history = build_history()

    print(f"\n  Last 6 months:")
    for h in history[-6:]:
        print(f"    {h['date']}  →  {h['quadrant']:<12}  "
              f"(growth: {h['growth']}, inflation: {h['inflation']})")

    plot_history(history)
