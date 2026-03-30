import requests
import os
import time
import json
from datetime import datetime, timedelta

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
CACHE_FILE        = "analysis_cache.json"
CACHE_TTL_HOURS   = 24

HEADERS = {
    "x-api-key": os.environ.get("ANTHROPIC_API_KEY"),
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
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

def cache_get(key: str) -> dict | None:
    cache = load_cache()
    entry = cache.get(key)
    if not entry:
        return None
    # Check if still fresh
    saved_at = datetime.fromisoformat(entry["saved_at"])
    if datetime.now() - saved_at > timedelta(hours=CACHE_TTL_HOURS):
        return None
    return entry["data"]

def cache_set(key: str, data: dict):
    cache = load_cache()
    cache[key] = {
        "saved_at": datetime.now().isoformat(),
        "data":     data,
    }
    save_cache(cache)


# ── API call ───────────────────────────────────────────────────────────────────

def call_claude(prompt: str) -> str:
    payload = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 1000,
        "tools": [{"type": "web_search_20250305", "name": "web_search"}],
        "messages": [{"role": "user", "content": prompt}]
    }

    for attempt in range(3):
        try:
            response = requests.post(ANTHROPIC_API_URL, headers=HEADERS, json=payload, timeout=30)
            if response.status_code == 429:
                print(f"    ⏳ Rate limited, waiting 20 seconds...")
                time.sleep(20)
                continue
            response.raise_for_status()
            content = response.json().get("content", [])
            return " ".join(
                block["text"]
                for block in content
                if block.get("type") == "text"
            ).strip()
        except Exception as e:
            return f"Analysis unavailable: {e}"

    return "Analysis unavailable: max retries exceeded."


# ── Buy analysis ───────────────────────────────────────────────────────────────

def analyse_buy(company: str, symbol: str) -> dict:
    cache_key = f"buy_{symbol}"
    cached    = cache_get(cache_key)
    if cached:
        print(f"    📦 Loaded from cache")
        return cached

    prompt = f"""You are a concise financial analyst. The stock {company} ({symbol}) is currently trading near its 52-week low.

Search for the most recent news about why {company} ({symbol}) stock has been declining or is near its yearly low.

Then respond in exactly 3-4 sentences covering:
1. The main reason the stock is low right now
2. Whether this looks temporary (cyclical/overreaction) or structural (business is broken)
3. One thing to watch that would confirm which way it goes

Be direct and specific. No disclaimers. No "as an AI" language.

End your response with exactly one line in this format:
VERDICT: cyclical
or
VERDICT: structural"""

    text = call_claude(prompt)

    if not text or "unavailable" in text.lower():
        return {"text": text, "verdict": "unknown"}

    lines   = text.strip().splitlines()
    verdict = "unknown"
    for line in reversed(lines):
        if line.strip().upper().startswith("VERDICT:"):
            verdict = line.strip().upper().replace("VERDICT:", "").strip().lower()
            break

    display_text = " ".join(
        " ".join(l for l in lines if not l.strip().upper().startswith("VERDICT:")).split()
    )

    result = {"text": display_text, "verdict": verdict}
    cache_set(cache_key, result)
    return result


# ── Sell analysis ──────────────────────────────────────────────────────────────

def analyse_sell(company: str, sellers: list[str]) -> str:
    cache_key = f"sell_{company}"
    cached    = cache_get(cache_key)
    if cached:
        print(f"    📦 Loaded from cache")
        return cached if isinstance(cached, str) else cached.get("text", "")

    sellers_str = ", ".join(sellers)
    prompt = f"""You are a concise financial analyst. The following top investors just exited their position in {company} this quarter: {sellers_str}.

Search for the most recent news about {company} to understand why institutional investors might be selling.

Then respond in exactly 3-4 sentences covering:
1. The most likely reason these investors sold
2. Whether the risk looks temporary or permanent
3. One thing to watch — is this a potential contrarian buy, or should you stay away?

Be direct and specific. No disclaimers. No "as an AI" language."""

    result = call_claude(prompt)
    cache_set(cache_key, result)
    return result


# ── Kept for compatibility with old imports ────────────────────────────────────

def enrich_with_analysis(ranked: list[dict]) -> list[dict]:
    return ranked

def enrich_sells_with_analysis(sells: list[dict]) -> list[dict]:
    return sells

