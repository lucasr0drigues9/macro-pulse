"""
NBIM Deep Analysis Module
Fetches NBIM's annual and half-year reports and uses Claude AI to extract:
- Full portfolio allocation (equities, bonds, real estate, infrastructure)
- Top holdings by region and sector
- Recent strategic moves and notable changes
- ESG exclusions and ethical positions
- Fund performance vs benchmark
"""

import requests
import os
import json
from datetime import datetime, timedelta

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
CACHE_FILE        = "nbim_analysis_cache.json"
CACHE_TTL_HOURS   = 168  # 1 week — report data doesn't change often

HEADERS_API = {
    "x-api-key":         os.environ.get("ANTHROPIC_API_KEY"),
    "anthropic-version": "2023-06-01",
    "content-type":      "application/json",
}

HEADERS_FETCH = {"User-Agent": "superinvestor-tracker contact@example.com"}

# NBIM report URLs — update these when new reports are published
REPORTS = {
    "half_year_2025": "https://www.nbim.no/contentassets/4929094bc7f0436c8d311e10557f8b83/gpfg-half-year-report-2025.pdf",
}


# ── Cache helpers ──────────────────────────────────────────────────────────────

def load_cache() -> dict:
    try:
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_cache(cache: dict):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)

def cache_get(key: str):
    cache = load_cache()
    entry = cache.get(key)
    if not entry:
        return None
    saved_at = datetime.fromisoformat(entry["saved_at"])
    if datetime.now() - saved_at > timedelta(hours=CACHE_TTL_HOURS):
        return None
    return entry["data"]

def cache_set(key: str, data):
    cache = load_cache()
    cache[key] = {"saved_at": datetime.now().isoformat(), "data": data}
    save_cache(cache)


# ── Fetch PDF ──────────────────────────────────────────────────────────────────

def fetch_pdf_as_base64(url: str) -> str | None:
    """Fetches a PDF and returns it as base64 for Claude."""
    import base64
    try:
        r = requests.get(url, headers=HEADERS_FETCH, timeout=60)
        r.raise_for_status()
        return base64.b64encode(r.content).decode("utf-8")
    except Exception as e:
        print(f"  ⚠️  Could not fetch PDF: {e}")
        return None


# ── Claude analysis ────────────────────────────────────────────────────────────

def analyse_nbim_report(pdf_base64: str) -> dict:
    """
    Sends the NBIM PDF to Claude and extracts structured insights.
    Returns a dict with all key data points.
    """
    prompt = """You are analysing Norges Bank Investment Management's (NBIM) latest report — the world's largest sovereign wealth fund managing Norway's oil revenue (~$2 trillion).

Extract the following structured information from this report and return it as a JSON object:

{
  "reporting_period": "e.g. H1 2025 or Full Year 2025",
  "fund_value_billion_usd": <number>,
  "total_return_pct": <number>,
  "vs_benchmark_pct": <number>,
  "asset_allocation": {
    "equities_pct": <number>,
    "fixed_income_pct": <number>,
    "real_estate_pct": <number>,
    "infrastructure_pct": <number>
  },
  "equity_return_pct": <number>,
  "fixed_income_return_pct": <number>,
  "real_estate_return_pct": <number>,
  "top_equity_regions": [
    {"region": "North America", "pct": <number>},
    ...
  ],
  "top_sectors": [
    {"sector": "Technology", "pct": <number>},
    ...
  ],
  "notable_holdings": [
    {"company": "Apple", "detail": "e.g. largest holding"},
    ...
  ],
  "strategic_moves": [
    "Key strategic decision or change mentioned",
    ...
  ],
  "esg_highlights": [
    "Key ESG action or exclusion",
    ...
  ],
  "key_risks": [
    "Key risk mentioned by management",
    ...
  ],
  "ceo_quote": "Notable quote from CEO Nicolai Tangen if present"
}

Be precise with numbers. If a value isn't in the report, use null. Return ONLY valid JSON, no preamble."""

    payload = {
        "model":      "claude-sonnet-4-20250514",
        "max_tokens": 2000,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type":   "document",
                    "source": {
                        "type":       "base64",
                        "media_type": "application/pdf",
                        "data":       pdf_base64,
                    }
                },
                {"type": "text", "text": prompt}
            ]
        }]
    }

    try:
        r = requests.post(ANTHROPIC_API_URL, headers=HEADERS_API, json=payload, timeout=60)
        r.raise_for_status()
        text = " ".join(
            b["text"] for b in r.json().get("content", [])
            if b.get("type") == "text"
        ).strip()
        # Clean JSON fences if present
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"  ⚠️  Analysis failed: {e}")
        return {}


# ── Main entry point ───────────────────────────────────────────────────────────

def get_nbim_analysis() -> dict:
    """
    Returns full NBIM analysis, using cache if available.
    """
    cached = cache_get("nbim_full_analysis")
    if cached:
        print("  📦 NBIM analysis loaded from cache")
        return cached

    print("  📥 Fetching NBIM report...")
    pdf_base64 = fetch_pdf_as_base64(REPORTS["half_year_2025"])
    if not pdf_base64:
        return {}

    print("  🧠 Analysing NBIM report with Claude...")
    analysis = analyse_nbim_report(pdf_base64)

    if analysis:
        cache_set("nbim_full_analysis", analysis)

    return analysis


def print_nbim_analysis():
    """
    Prints a rich NBIM analysis to the terminal.
    """
    print("\n🇳🇴 NORGES BANK INVESTMENT MANAGEMENT — DEEP ANALYSIS")
    print("   The world's largest sovereign wealth fund | Norway's Oil Fund")
    print("─" * 105)

    data = get_nbim_analysis()
    if not data:
        print("  ⚠️  Could not retrieve NBIM analysis")
        return

    period = data.get("reporting_period", "Latest report")
    value  = data.get("fund_value_billion_usd")
    ret    = data.get("total_return_pct")
    bench  = data.get("vs_benchmark_pct")

    print(f"\n📊 {period}")
    if value:
        print(f"   Fund value:    ~${value:,.0f}B USD")
    if ret is not None:
        bench_str = f"  ({bench:+.2f}% vs benchmark)" if bench is not None else ""
        print(f"   Total return:  {ret:.1f}%{bench_str}")

    # Asset allocation
    alloc = data.get("asset_allocation", {})
    if alloc:
        print(f"\n💼 Asset Allocation")
        print(f"   Equities:       {alloc.get('equities_pct', '?')}%")
        print(f"   Fixed Income:   {alloc.get('fixed_income_pct', '?')}%")
        print(f"   Real Estate:    {alloc.get('real_estate_pct', '?')}%")
        print(f"   Infrastructure: {alloc.get('infrastructure_pct', '?')}%")

    # Regional breakdown
    regions = data.get("top_equity_regions", [])
    if regions:
        print(f"\n🌍 Equity by Region")
        for r in regions:
            print(f"   {r.get('region', ''):<25} {r.get('pct', '?')}%")

    # Sector breakdown
    sectors = data.get("top_sectors", [])
    if sectors:
        print(f"\n🏭 Top Sectors")
        for s in sectors:
            print(f"   {s.get('sector', ''):<25} {s.get('pct', '?')}%")

    # Notable holdings
    holdings = data.get("notable_holdings", [])
    if holdings:
        print(f"\n🏆 Notable Holdings")
        for h in holdings:
            print(f"   • {h.get('company', '')}: {h.get('detail', '')}")

    # Strategic moves
    moves = data.get("strategic_moves", [])
    if moves:
        print(f"\n♟️  Strategic Moves This Period")
        for m in moves:
            print(f"   • {m}")

    # ESG
    esg = data.get("esg_highlights", [])
    if esg:
        print(f"\n🌱 ESG & Ethics")
        for e in esg:
            print(f"   • {e}")

    # Key risks
    risks = data.get("key_risks", [])
    if risks:
        print(f"\n⚠️  Key Risks Flagged by Management")
        for risk in risks:
            print(f"   • {risk}")

    # CEO quote
    quote = data.get("ceo_quote")
    if quote:
        print(f"\n💬 CEO Nicolai Tangen:")
        print(f"   \"{quote}\"")

    print("─────────────────────────────────────────────────────────────────────────────────────────────────────────")
    print("   Source: NBIM Half-Year Report 2025 | nbim.no")
    print("   Note: This covers the full $2T fund including bonds, real estate and infrastructure.")
    print("   The 13F-based Nordic mode only shows NBIM's US equity slice (~30% of equities).")
