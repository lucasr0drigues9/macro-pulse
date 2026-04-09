"""
Generate AI explanations for periods where BOTH the framework data signal
AND the AI geopolitical layer failed to pick the best-performing regime.

These are the "double miss" periods — the most interesting failures because
they reveal what neither layer could anticipate. Output is cached in
.macro_cache/double_miss_us.json and .macro_cache/double_miss_eu.json.
"""
import os
import json
import sys
import requests
from datetime import datetime

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CACHE_DIR = ".macro_cache"


def ask_claude(prompt: str) -> str:
    """Call Claude for a short explanation. Returns the text."""
    if not ANTHROPIC_KEY:
        return "(no API key configured)"
    try:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_KEY,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 250,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        data = r.json()
        if data.get("error"):
            return f"(API error: {data['error'].get('message', 'unknown')})"
        return "".join(b.get("text", "") for b in data.get("content", [])).strip()
    except Exception as e:
        return f"(error: {e})"


def format_period_prompt(region: str, period: dict) -> str:
    """Build a prompt asking Claude to explain a double-miss period."""
    start = period["start"]
    end = period["end"]
    fwd_regime = period["regime"]
    ai_regime = period.get("aiRegime", fwd_regime)
    best = period["bestRegime"]
    all_returns = period.get("allRegimeReturns", {})

    framework_name = "FRED" if region == "US" else "Eurostat"
    returns_summary = ", ".join(
        f"{r}: {v:.1f}%" for r, v in all_returns.items() if v is not None
    )

    return f"""In the {region} from {start} to {end}, our economic regime framework called {fwd_regime} based on {framework_name} data, and the AI geopolitical layer also called {ai_regime}. But the best-performing regime picks during this period were {best}.

Period returns by regime basket: {returns_summary}

In 2-3 sentences, explain specifically WHY both the data framework and the AI layer missed this call. What event, policy shift, or market dynamic drove {best} picks to outperform while everyone expected something different? Be specific — name events, policies, or market conditions. Don't hedge. This is a post-mortem of a framework failure, so be direct about what was missed."""


def generate_for_region(region: str, timeline: list, output_file: str):
    """Generate explanations for all double-miss periods in a region."""
    # Filter to double-miss periods only
    double_miss = [
        t for t in timeline
        if t.get("frameworkCorrect") is False and t.get("aiCorrect") is False
    ]
    print(f"\n{region}: {len(double_miss)} double-miss periods")

    # Load existing cache
    cache = {}
    if os.path.exists(output_file):
        try:
            with open(output_file) as f:
                cache = json.load(f)
        except Exception:
            pass

    new_count = 0
    for p in double_miss:
        key = p["start"]
        if key in cache and cache[key].get("reason"):
            continue  # Already generated

        print(f"  {key}: {p['regime']} → winner {p['bestRegime']}")
        prompt = format_period_prompt(region, p)
        reason = ask_claude(prompt)
        cache[key] = {
            "start": p["start"],
            "end": p["end"],
            "framework": p["regime"],
            "ai": p.get("aiRegime", p["regime"]),
            "winner": p["bestRegime"],
            "reason": reason,
            "generatedAt": datetime.now().isoformat(),
        }
        new_count += 1

        # Save after each one so we don't lose progress
        with open(output_file, "w") as f:
            json.dump(cache, f, indent=2)

    print(f"  Generated {new_count} new explanations, {len(cache)} total cached")


def main():
    if not ANTHROPIC_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    os.makedirs(CACHE_DIR, exist_ok=True)

    # Fetch US backtest
    print("Fetching US backtest...")
    r = requests.get("https://macro-pulse-backend-production.up.railway.app/api/backtest", timeout=30)
    us_timeline = r.json().get("timeline", [])
    generate_for_region("US", us_timeline, f"{CACHE_DIR}/double_miss_us.json")

    # Fetch EU backtest
    print("\nFetching EU backtest...")
    r = requests.get("https://macro-pulse-backend-production.up.railway.app/api/eu/backtest", timeout=60)
    eu_timeline = r.json().get("timeline", [])
    generate_for_region("EU", eu_timeline, f"{CACHE_DIR}/double_miss_eu.json")


if __name__ == "__main__":
    main()
