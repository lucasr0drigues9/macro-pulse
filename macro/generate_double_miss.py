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
    """Call Claude for a structured post-mortem. Returns raw text."""
    if not ANTHROPIC_KEY:
        return ""
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
                "max_tokens": 400,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        data = r.json()
        if data.get("error"):
            return ""
        return "".join(b.get("text", "") for b in data.get("content", [])).strip()
    except Exception:
        return ""


def parse_structured(text: str) -> dict | None:
    """Extract {event, blind_spot, winner_dynamic} from Claude response.
    Tries fenced JSON first, then bare JSON object."""
    if not text:
        return None
    import re
    # Try fenced block
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        try:
            obj = json.loads(m.group(1))
        except Exception:
            obj = None
    else:
        obj = None
    if obj is None:
        # Try bare braces
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                obj = json.loads(m.group(0))
            except Exception:
                return None
    if not isinstance(obj, dict):
        return None
    required = ("event", "blind_spot", "winner_dynamic")
    if not all(k in obj and isinstance(obj[k], str) and obj[k].strip() for k in required):
        return None
    return {k: obj[k].strip() for k in required}


def format_period_prompt(region: str, period: dict) -> str:
    """Build a prompt asking Claude for a structured post-mortem."""
    start = period["start"]
    end = period["end"]
    fwd_regime = period["regime"]
    ai_regime = period.get("aiRegime", fwd_regime)
    best = period["bestRegime"]
    all_returns = period.get("allRegimeReturns", {})

    data_source = "FRED" if region == "US" else "Eurostat"
    returns_summary = ", ".join(
        f"{r}: {v:.1f}%" for r, v in all_returns.items() if v is not None
    )
    region_label = "United States" if region == "US" else "Europe"

    return f"""You are writing a post-mortem for a macro regime call that missed.

Context:
- Period: {start} to {end}, {region_label}
- {data_source} economic data called: {fwd_regime}
- AI geopolitical layer called: {ai_regime}
- Actual best-performing regime basket: {best}
- Returns by regime basket: {returns_summary}

Write a structured post-mortem as a JSON object with exactly three fields:
1. "event" — ONE concrete sentence naming the specific event, policy, or market shift that actually drove the period. Name dates, policies, people, or numbers. Max 25 words.
2. "blind_spot" — ONE sentence explaining why both the data and the AI layer failed to see it. What were they anchored on that turned out wrong? Max 25 words.
3. "winner_dynamic" — ONE sentence explaining the mechanism: why did {best} picks specifically outperform? (What assets were in that basket, what drove them up?) Max 25 words.

Hard rules:
- Output ONLY the JSON object, nothing else. No preamble, no markdown fences, no commentary.
- Every sentence must be concrete. Ban the words "framework", "layer", "signal", "missed", "failed to account", "however", "while".
- Lead with nouns (events, policies, tickers, numbers), not abstractions.
- Do not hedge. Be direct.
- If you don't know the real reason, infer the most likely cause from the returns pattern — but still commit to a specific story.

Example output format:
{{"event": "Fed cut rates 50bps in Sep 2024 as inflation fell below 2.5% and unemployment climbed to 4.3%.", "blind_spot": "Both readings were anchored on Q2 growth momentum and sticky services inflation, missing the speed of the labour market cooling.", "winner_dynamic": "Reflation picks (XLE, XLI, commodities) rallied as rate cuts priced in a soft landing and a weaker dollar lifted industrials."}}"""


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
        # Skip only if we already have a structured entry
        if (
            key in cache
            and isinstance(cache[key].get("structured"), dict)
            and cache[key]["structured"].get("event")
        ):
            continue

        print(f"  {key}: {p['regime']} → winner {p['bestRegime']}")
        prompt = format_period_prompt(region, p)

        # Retry up to 2 times if parsing fails
        structured = None
        raw_text = ""
        for attempt in range(2):
            raw_text = ask_claude(prompt)
            structured = parse_structured(raw_text)
            if structured:
                break
            print(f"    (retry — unparseable response)")

        if not structured:
            print(f"    ✗ failed to parse after 2 attempts")
            structured = None

        cache[key] = {
            "start": p["start"],
            "end": p["end"],
            "framework": p["regime"],
            "ai": p.get("aiRegime", p["regime"]),
            "winner": p["bestRegime"],
            "structured": structured,
            "raw": raw_text,
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
