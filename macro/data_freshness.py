"""
Dynamic data freshness warning for the superinvestor tracker.
Uses Anthropic API to assess how stale the 13F data is
based on recent market movements and events.
Cached for 6 hours to avoid repeated API calls.
"""
import os
import json
import requests
from datetime import datetime, timedelta

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
CACHE_DIR     = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache"
CACHE_FILE    = f"{CACHE_DIR}/data_freshness.json"
CACHE_TTL     = 48  # hours

SYSTEM_PROMPT = """You are a financial analyst assessing how relevant 
13F SEC filing data is given recent market events.

13F filings are submitted quarterly with a 45-day delay.
The data we are reading reflects positions from approximately 
3-4 months ago.

Assess:
1. What major market moves have happened recently that might 
   have caused institutional investors to rebalance
2. Which sectors have seen significant inflows or outflows
3. How likely is it that the 13F positions we see still 
   reflect current positioning

Respond ONLY with valid JSON, no markdown, no preamble:
{
  "filing_lag_months": 4,
  "staleness_level": "HIGH/MEDIUM/LOW",
  "staleness_emoji": "🔴/🟡/🟢",
  "recent_moves": [
    {
      "ticker": "NVDA",
      "move": "-17% from highs",
      "implication": "funds likely trimmed"
    }
  ],
  "sector_shifts": [
    {
      "from_sector": "Technology",
      "to_sector": "Energy",
      "evidence": "brief evidence"
    }
  ],
  "positioning_confidence": "LOW/MEDIUM/HIGH",
  "summary": "2-3 sentence assessment of how much to trust current 13F data",
  "next_filing_date": "approximate date of next 13F filings"
}"""

USER_PROMPT = f"""Today is {datetime.now().strftime('%B %Y')}.
The 13F data we are analysing reflects Q4 2024 positions 
filed in February 2025 — approximately 4 months old.

Based on what has happened in financial markets between 
then and now, assess how stale this data is. Consider:
- Major moves in tech stocks (Magnificent 7)
- Energy sector performance  
- Any major market events causing institutional rebalancing
- Iran war oil shock impact on portfolios
- Venezuela operation impact on energy stocks
- Any rotation signals from institutions

Be specific about recent price moves and their implications 
for whether superinvestor 13F positions are still valid."""

def get_freshness_assessment():
    os.makedirs(CACHE_DIR, exist_ok=True)

    # Check cache
    if os.path.exists(CACHE_FILE):
        age = datetime.now() - datetime.fromtimestamp(
            os.path.getmtime(CACHE_FILE))
        if age < timedelta(hours=CACHE_TTL):
            with open(CACHE_FILE) as f:
                return json.load(f)

    if not ANTHROPIC_KEY:
        return {
            "filing_lag_months":      4,
            "staleness_level":        "UNKNOWN",
            "staleness_emoji":        "⚠️",
            "recent_moves":           [],
            "sector_shifts":          [],
            "positioning_confidence": "UNKNOWN",
            "summary": (
                "Set ANTHROPIC_API_KEY to enable dynamic freshness assessment. "
                "13F data reflects positions from ~4 months ago — "
                "recent market moves may not be captured."
            ),
            "next_filing_date": "~May 2026"
        }

    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type":    "application/json",
                "x-api-key":       ANTHROPIC_KEY,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model":      "claude-sonnet-4-20250514",
                "max_tokens": 800,
                "system":     SYSTEM_PROMPT,
                "messages":   [{"role": "user", "content": USER_PROMPT}],
            },
            timeout=30
        )
        data     = response.json()
        raw_text = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                raw_text += block.get("text", "")

        # Parse JSON
        clean = raw_text.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        clean = clean.strip()
        if not clean.startswith("{"):
            start = clean.find("{")
            end   = clean.rfind("}") + 1
            if start != -1:
                clean = clean[start:end]

        result = json.loads(clean)
        with open(CACHE_FILE, "w") as f:
            json.dump(result, f)
        return result

    except Exception as e:
        print(f"  ⚠️  Freshness check failed: {e}")
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE) as f:
                return json.load(f)
        return None

def print_freshness_warning(data):
    if not data:
        print(f"\n  ⚠️  13F data is ~4 months old — positions may have changed")
        return

    emoji     = data.get("staleness_emoji", "🟡")
    level     = data.get("staleness_level", "MEDIUM")
    conf      = data.get("positioning_confidence", "MEDIUM")
    summary   = data.get("summary", "")
    next_date = data.get("next_filing_date", "~May 2026")
    lag       = data.get("filing_lag_months", 4)

    print(f"\n  {'─'*60}")
    print(f"  {emoji} DATA FRESHNESS WARNING — 13F LAG ASSESSMENT")
    print(f"\n  Filing lag:           ~{lag} months")
    print(f"  Staleness level:      {level}")
    print(f"  Positioning confidence: {conf}")
    print(f"  Next 13F filings:     {next_date}")

    if summary:
        print(f"\n  {summary}")

    recent = data.get("recent_moves", [])
    if recent:
        print(f"\n  Recent moves suggesting rebalancing:")
        for move in recent[:5]:
            ticker = move.get("ticker", "")
            m      = move.get("move", "")
            impl   = move.get("implication", "")
            print(f"    📊 {ticker:<6} {m:<20} → {impl}")

    shifts = data.get("sector_shifts", [])
    if shifts:
        print(f"\n  Sector rotation signals:")
        for shift in shifts[:3]:
            frm  = shift.get("from_sector", "")
            to   = shift.get("to_sector", "")
            evid = shift.get("evidence", "")
            print(f"    🔄 {frm} → {to}: {evid}")

if __name__ == "__main__":
    print("\n📊 Checking 13F data freshness...")
    data = get_freshness_assessment()
    print_freshness_warning(data)
    print()
