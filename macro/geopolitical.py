"""
Geopolitical risk monitor — uses Anthropic API to fetch and
analyse current geopolitical events and their macro regime impact.
Runs a web search via Claude to get live context.
"""
import os
import requests
import json

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")

SYSTEM_PROMPT = """You are a macro economist analysing geopolitical events
and their impact on Ray Dalio's economic quadrants.

For each major geopolitical event you identify, assess:
1. Which asset classes it impacts (oil, gold, bonds, equities)
2. Which macro regime it pushes toward (Reflation, Stagflation, 
   Deflation, Goldilocks)
3. Severity (HIGH/MEDIUM/LOW)

Respond ONLY with a JSON object, no markdown, no preamble:
{
  "events": [
    {
      "title": "short title",
      "description": "1-2 sentence summary",
      "asset_impact": ["Oil up", "Gold up", "Bonds down"],
      "regime_push": "Stagflation",
      "severity": "HIGH",
      "emoji": "🔴"
    }
  ],
  "overall_regime_bias": "Stagflation",
  "overall_summary": "2-3 sentence synthesis of geopolitical picture"
}"""

USER_PROMPT = """Search for and identify the top 3-5 major geopolitical 
events happening RIGHT NOW in March 2026 that are impacting global 
financial markets and commodity prices. Focus on events affecting:
- Oil and energy prices
- Gold and safe haven assets  
- Global trade and supply chains
- Central bank policy decisions
- Currency markets

Assess each event's impact on macro regimes."""

CACHE_DIR  = "/home/lucas_r0drigues9/finance-projects/macro/.macro_cache"
CACHE_FILE = f"{CACHE_DIR}/geopolitical.json"
CACHE_TTL  = 24  # hours

def get_geopolitical_risks():
    import os
    from datetime import datetime, timedelta

    # Check cache first
    os.makedirs(CACHE_DIR, exist_ok=True)
    if os.path.exists(CACHE_FILE):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(CACHE_FILE))
        if age < timedelta(hours=CACHE_TTL):
            print(f"  Using cached data (age: {int(age.seconds/60)} minutes)")
            with open(CACHE_FILE) as f:
                return json.load(f)

    if not ANTHROPIC_KEY:
        return {
            "events": [
                {
                    "title": "API key not configured",
                    "description": "Set ANTHROPIC_API_KEY to enable live geopolitical risk assessment.",
                    "asset_impact": [],
                    "regime_push": "Unknown",
                    "severity": "LOW",
                    "emoji": "⚠️"
                }
            ],
            "overall_regime_bias": "Unknown",
            "overall_summary": "Set ANTHROPIC_API_KEY in your environment to enable dynamic geopolitical risk monitoring."
        }
    try:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
        }
        messages = [{"role": "user", "content": USER_PROMPT}]

        # Multi-turn loop to handle web search tool calls
        full_text = ""
        for _ in range(5):
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1000,
                    "tools": [{"type": "web_search_20250305", "name": "web_search"}],
                    "system": SYSTEM_PROMPT,
                    "messages": messages,
                },
                timeout=60
            )
            data = response.json()
            content_blocks = data.get("content", [])
            stop_reason    = data.get("stop_reason", "")

            # Add assistant response to messages
            messages.append({"role": "assistant", "content": content_blocks})

            if stop_reason == "end_turn":
                # Extract final text
                full_text = ""
                for block in content_blocks:
                    if block.get("type") == "text":
                        full_text += block.get("text", "")
                break

            elif stop_reason == "tool_use":
                # Process tool results and continue
                tool_results = []
                for block in content_blocks:
                    if block.get("type") == "tool_use":
                        # Web search results come back in the block itself
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.get("id"),
                            "content": json.dumps(block.get("content", "")),
                        })
                if tool_results:
                    messages.append({"role": "user", "content": tool_results})
            else:
                break

        # Strip citation tags before parsing
        import re
        full_text = re.sub(r'<cite[^>]*>|</cite>', '', full_text)

        # Parse JSON from final text
        clean = full_text.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        clean = clean.strip()
        # Find JSON object if wrapped in other text
        if not clean.startswith("{"):
            start = clean.find("{")
            end   = clean.rfind("}") + 1
            if start != -1 and end > start:
                clean = clean[start:end]

        result = json.loads(clean)

        # Strip citation tags from all text fields
        import re
        def strip_citations(obj):
            if isinstance(obj, str):
                return re.sub(r'<cite[^>]*>|</cite>', '', obj).strip()
            elif isinstance(obj, dict):
                return {k: strip_citations(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [strip_citations(i) for i in obj]
            return obj
        result = strip_citations(result)

        with open(CACHE_FILE, "w") as f:
            json.dump(result, f)
        return result

    except Exception as e:
        print(f"  ⚠️  Geopolitical fetch failed: {e}")
        if os.path.exists(CACHE_FILE):
            print(f"  Using stale cache as fallback...")
            with open(CACHE_FILE) as f:
                return json.load(f)
        return None

try:
    from thresholds import OIL_WARNING_LEVEL, CPI_GOLDILOCKS, HORMUZ_RECOVERY
    _OIL = OIL_WARNING_LEVEL
    _CPI = CPI_GOLDILOCKS
    _HOR = HORMUZ_RECOVERY
except:
    _OIL, _CPI, _HOR = 85, 0.2, 50

SYNTHESIS_PROMPT = """You are a senior macro analyst and portfolio strategist.
You will be given:
1. Current macro regime (Ray Dalio quadrant)
2. Active geopolitical risks
3. Recent asset performance data
4. Transition warnings
5. Upcoming economic calendar events

Synthesise all of this into a concise, actionable investment narrative.
Acknowledge uncertainty honestly — don't pretend to know what will happen.

IMPORTANT: Only recommend ETFs from our tracked universe. Do NOT recommend individual stocks.
Our ETF universe: XLE, GLD, DBC, XLP, XLU, GURU, XLI, SPY, BRK-B, QQQ, TLT, IWM.
For bull/bear cases, beneficiaries/victims must be from this list only.

Regime ETF baskets:
- Stagflation: XLE, GLD, DBC, XLP, XLU
- Reflation: GURU, XLE, XLI, GLD, DBC
- Goldilocks: SPY, BRK-B, QQQ, GURU, IWM
- Deflation: GURU, TLT, GLD, XLP

For the CURRENT regime ETFs, score each from 0.5 (low conviction) to 1.0 (highest conviction)
based on the CURRENT geopolitical and macro conditions. Use the full range: 0.5 = weak/hold,
0.7 = moderate, 0.9+ = high conviction. Scores should reflect THIS specific situation.

Respond ONLY with valid JSON, no markdown:
{
  "headline": "one punchy sentence summarising the situation",
  "situation": "2-3 sentences on what is happening and why it matters",
  "key_tension": "the central investment dilemma right now in one sentence",
  "bull_case": {
    "scenario": "what needs to happen for risk assets to rally",
    "trigger": "specific observable signal that would confirm this",
    "beneficiaries": ["specific tickers/ETFs that would rally"]
  },
  "bear_case": {
    "scenario": "what happens if the risk scenario deepens",
    "trigger": "specific observable signal that would confirm this",
    "victims": ["specific tickers/ETFs that would fall further"]
  },
  "prudent_strategy": "2-3 sentences on how to position given the uncertainty",
  "suggested_allocation": {
    "energy_commodities": 30,
    "gold": 15,
    "quality_tech": 10,
    "bonds": 5,
    "cash": 25,
    "other": 15
  },
  "watch_this_week": ["specific data release or event to monitor"],
  "etf_convictions": {
    "XLE": 0.95,
    "GLD": 0.90,
    "DBC": 0.85,
    "XLP": 0.75,
    "TIP": 0.65,
    "XLU": 0.60
  },
  "regime_start_date": "YYYY-MM-DD — the start date of the LAST period in the FRED regime history that matches the current regime. Use the exact start date from the history. Do NOT merge separate periods — if there was a different regime in between, use the start of the most recent matching period, not an earlier one.",
  "calendar_scenarios": {
    "cpi": {
      "what_to_watch": "one sentence on what matters most in this CPI print given current situation",
      "high": "if CPI comes in high — specific action to take",
      "low": "if CPI comes in low — specific action to take",
      "inline": "if CPI is as expected — what it means"
    },
    "fomc": {
      "what_to_watch": "one sentence on what matters most at this Fed meeting",
      "hold": "if Fed holds — specific action",
      "hike": "if Fed hikes — specific action",
      "cut": "if Fed cuts — specific action",
      "emergency_cut": "if emergency cut — specific action"
    },
    "filings": {
      "what_to_watch": "what sector rotation to look for in 13F filings given current regime",
      "bullish_signal": "what filing pattern would confirm the macro thesis",
      "bearish_signal": "what filing pattern would contradict it"
    }
  }
}"""

def get_synthesis(geo_data, quadrant, transition_warning=None, performance_data=None):
    """Generate AI synthesis combining geo risks with macro context."""
    if not ANTHROPIC_KEY:
        return None

    # Check cache
    import os
    from datetime import datetime, timedelta
    cache = f"{CACHE_DIR}/geo_synthesis.json"
    os.makedirs(CACHE_DIR, exist_ok=True)
    if os.path.exists(cache):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache))
        if age < timedelta(hours=24):
            with open(cache) as f:
                return json.load(f)

    # Build context for the prompt
    events_text = ""
    for e in geo_data.get("events", []):
        title = e.get("title",""); desc = e.get("description",""); regime = e.get("regime_push","")
        events_text += f"- {title}: {desc} (regime push: {regime})\n"

    perf_text = ""
    if performance_data:
        perf_text = performance_data

    transition_text = ""
    if transition_warning:
        transition_text = f"Transition warning: {transition_warning}"

    # Build calendar context
    from datetime import datetime as _dt
    now = _dt.now()
    CPI_DATES  = [_dt(2026,1,15),_dt(2026,2,11),_dt(2026,3,11),_dt(2026,4,10),
                  _dt(2026,5,12),_dt(2026,6,10),_dt(2026,7,14),_dt(2026,8,11),
                  _dt(2026,9,10),_dt(2026,10,13),_dt(2026,11,12),_dt(2026,12,10)]
    FOMC_DATES = [_dt(2026,1,28),_dt(2026,3,18),_dt(2026,4,29),_dt(2026,6,17),
                  _dt(2026,7,29),_dt(2026,9,16),_dt(2026,10,28),_dt(2026,12,9)]
    FILING_DATES = [(_dt(2026,2,14),"Q4 2025"),(_dt(2026,5,15),"Q1 2026"),
                    (_dt(2026,8,14),"Q2 2026"),(_dt(2026,11,14),"Q3 2026")]
    nxt_cpi  = next((d for d in CPI_DATES if d > now), None)
    nxt_fomc = next((d for d in FOMC_DATES if d > now), None)
    nxt_fil  = next(((d,q) for d,q in FILING_DATES if d > now), None)
    cal_text = f"""
Upcoming calendar events:
- Next CPI print: {nxt_cpi.strftime('%B %d') if nxt_cpi else 'TBD'} ({(nxt_cpi-now).days if nxt_cpi else '?'} days away)
- Next FOMC meeting: {nxt_fomc.strftime('%B %d') if nxt_fomc else 'TBD'} ({(nxt_fomc-now).days if nxt_fomc else '?'} days away)
- Next 13F filings: {nxt_fil[0].strftime('%B %d') + ' (' + nxt_fil[1] + ')' if nxt_fil else 'TBD'}
Current Fed rate: 3.50-3.75% (held at March 18 meeting)"""

    # Build regime history from FRED backtest timeline + compute start date
    regime_history_text = ""
    _computed_regime_start = None
    try:
        from backtest_regime import build_regime_timeline, identify_periods
        import contextlib as _ctx, io as _io
        with _ctx.redirect_stdout(_io.StringIO()):
            _tl = build_regime_timeline()
        _periods = identify_periods(_tl)

        # Find the start of the last period matching the current geo regime
        _geo_regime = geo_data.get("overall_regime_bias", "")
        for _p in reversed(_periods):
            if _p["regime"] == _geo_regime:
                _computed_regime_start = _p["start"]
                break

        # Show last 8 periods for context
        _recent = _periods[-8:]
        regime_history_text = "FRED regime history (recent periods, based on GDP/CPI/retail data):\n"
        for _p in _recent:
            _months = len([t for t in _tl if t["date"] >= _p["start"] and t["date"] <= _p["end"]])
            regime_history_text += f"  {_p['start']} → {_p['end']}  {_p['regime']} ({_months} months)\n"

        if _computed_regime_start:
            regime_history_text += f"\nThe current {_geo_regime} regime started on {_computed_regime_start} according to FRED data.\n"
            regime_history_text += f"You MUST use {_computed_regime_start} as the regime_start_date.\n"
    except Exception:
        regime_history_text = ""

    # Fetch live performance data
    perf_text = "Recent asset performance (LIVE):\n"
    try:
        import yfinance as _yf

        # Use computed regime start date, fallback to cache or default
        _regime_start = _computed_regime_start or "2025-08-01"

        _perf_tickers = {
            "XLE": "Energy",    "GLD": "Gold",      "DBC": "Commodities",
            "XLP": "Staples",   "XLU": "Utilities",  "QQQ": "Growth/Tech",
            "SPY": "S&P 500",   "TLT": "Long bonds", "GURU": "Hedge fund 13F",
            "BRK-B": "Berkshire",
        }
        for _pt, _pn in _perf_tickers.items():
            try:
                _ph = _yf.Ticker(_pt).history(start=_regime_start)
                if len(_ph) > 2:
                    _pr = round((_ph["Close"].iloc[-1] - _ph["Close"].iloc[0]) / _ph["Close"].iloc[0] * 100, 1)
                    _price = round(_ph["Close"].iloc[-1], 2)
                    perf_text += f"- {_pt} ({_pn}): {_pr:+.1f}% since {_regime_start}, now ${_price}\n"
            except:
                continue

        # Add key individual stocks — 52-week high comparison
        for _st, _sn in [("MSFT", "Microsoft"), ("NVDA", "Nvidia"), ("GOOGL", "Google")]:
            try:
                _sh = _yf.Ticker(_st).history(period="1y")
                if len(_sh) > 20:
                    _high = _sh["Close"].max()
                    _curr = _sh["Close"].iloc[-1]
                    _drop = round((_curr - _high) / _high * 100, 1)
                    perf_text += f"- {_st} ({_sn}): {_drop:+.1f}% from 52-week high, now ${_curr:.0f}\n"
            except:
                continue
    except Exception as _pe:
        perf_text = f"Recent asset performance: unavailable ({_pe})\n"

    user_prompt = f"""Current macro regime (FRED): {quadrant}
Overall geopolitical bias: {geo_data.get('overall_regime_bias', 'Unknown')}
Today's date: {now.strftime('%Y-%m-%d')}

{regime_history_text}

Active geopolitical events:
{events_text}

{transition_text}

{perf_text}

{cal_text}

Given all of this, provide your investment synthesis and portfolio guidance.
Include specific calendar_scenarios for the upcoming CPI, FOMC and 13F filings
based on the CURRENT geopolitical and macro context — not generic advice.
Be specific. Name tickers. Acknowledge what you don't know."""

    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type":      "application/json",
                "x-api-key":         ANTHROPIC_KEY,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model":    "claude-sonnet-4-20250514",
                "max_tokens": 2000,
                "system":   SYNTHESIS_PROMPT,
                "messages": [{"role": "user", "content": user_prompt}],
            },
            timeout=30
        )
        data     = response.json()
        raw_text = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                raw_text += block.get("text", "")

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
        with open(cache, "w") as f:
            json.dump(result, f)
        return result

    except Exception as e:
        print(f"  ⚠️  Synthesis failed: {e}")
        return None

def print_synthesis(data):
    if not data:
        return

    print(f"\n  {'─'*60}")
    print(f"  🧠 AI PORTFOLIO SYNTHESIS")

    # Show synthesis age
    cache = f"{CACHE_DIR}/geo_synthesis.json"
    if os.path.exists(cache):
        from datetime import datetime, timedelta
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache))
        hours = int(age.seconds / 3600)
        mins  = int((age.seconds % 3600) / 60)
        age_str = f"{hours}h {mins}m ago" if hours > 0 else f"{mins}m ago"
        print(f"  (synthesis generated {age_str} — live prices may differ)")

    if data.get("headline"):
        print(f"\n  {data['headline']}")

    if data.get("situation"):
        print(f"\n  {data['situation']}")

    if data.get("key_tension"):
        print(f"\n  ⚡ Key tension: {data['key_tension']}")

    bull = data.get("bull_case", {})
    bear = data.get("bear_case", {})

    if bull:
        print(f"\n  🟢 BULL CASE — {bull.get('scenario','')}")
        print(f"     Trigger: {bull.get('trigger','')}")
        if bull.get("beneficiaries"):
            print(f"     Buy:     {', '.join(bull['beneficiaries'])}")

    if bear:
        print(f"\n  🔴 BEAR CASE — {bear.get('scenario','')}")
        print(f"     Trigger: {bear.get('trigger','')}")
        if bear.get("victims"):
            print(f"     Avoid:   {', '.join(bear['victims'])}")

    if data.get("prudent_strategy"):
        print(f"\n  💡 PRUDENT STRATEGY:")
        words = data["prudent_strategy"].split()
        line  = "     "
        for word in words:
            if len(line) + len(word) > 62:
                print(line)
                line = "     " + word + " "
            else:
                line += word + " "
        if line.strip():
            print(line)

    # Allocation removed — use option 8 (Kelly) for position sizing

    watch = data.get("watch_this_week", [])
    if watch:
        print(f"\n  👁️  WATCH THIS WEEK:")
        for item in watch:
            print(f"     📍 {item}")

TRIGGERS_PROMPT = """You are a macro analyst. Generate regime change triggers.
Respond ONLY with valid JSON, no markdown:
{
  "regime_triggers": [
    {"name": "str", "threshold": "str", "current": "str", 
     "status": "met or not_met", "action": "str", "urgency": "HIGH or MEDIUM or LOW"}
  ]
}
Generate 5-6 specific, observable triggers based on the current situation.
Each trigger should be a real metric with a specific threshold."""

def get_triggers(geo_data, quadrant, oil_price=None, hormuz_count=None, cpi=None):
    """Separate API call just for regime triggers."""
    if not ANTHROPIC_KEY:
        return []

    cache_file = f"{CACHE_DIR}/regime_triggers.json"
    from datetime import datetime, timedelta
    if os.path.exists(cache_file):
        age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
        if age < timedelta(hours=24):
            with open(cache_file) as f:
                return json.load(f).get("regime_triggers", [])

    events_text = ""
    for e in geo_data.get("events", [])[:4]:
        title = e.get("title",""); desc = e.get("description","")[:100]
        events_text += f"- {title}: {desc}\n"

    prompt = f"""Current macro regime: {quadrant}
Geopolitical bias: {geo_data.get('overall_regime_bias','Unknown')}
Oil price: ${oil_price if oil_price else 'unknown'}
Hormuz transits: {hormuz_count if hormuz_count else 'unknown'}/day (normal=138)
CPI monthly: {cpi if cpi else 'unknown'}%

Active events:
{events_text}

Generate 5-6 regime change triggers specific to THIS situation.
What exactly needs to happen for the regime to shift?
What are the observable signals to watch right now?"""

    try:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"Content-Type": "application/json",
                     "x-api-key": ANTHROPIC_KEY,
                     "anthropic-version": "2023-06-01"},
            json={"model": "claude-sonnet-4-20250514",
                  "max_tokens": 800,
                  "system": TRIGGERS_PROMPT,
                  "messages": [{"role": "user", "content": prompt}]},
            timeout=30
        )
        data = r.json()
        text = "".join(b.get("text","") for b in data.get("content",[]))
        clean = text.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"): clean = clean[4:]
        clean = clean.strip()
        if not clean.startswith("{"):
            start = clean.find("{"); end = clean.rfind("}") + 1
            if start != -1: clean = clean[start:end]
        result = json.loads(clean)
        with open(cache_file, "w") as f:
            json.dump(result, f)
        return result.get("regime_triggers", [])
    except Exception as e:
        print(f"  ⚠️  Triggers failed: {e}")
        return []

SEVERITY_COLORS = {
    "HIGH":   "🔴",
    "MEDIUM": "🟡",
    "LOW":    "🟢",
}

REGIME_EMOJIS = {
    "Reflation":   "🟡",
    "Stagflation": "🔴",
    "Deflation":   "🔵",
    "Goldilocks":  "🟢",
}

def print_geopolitical(data):
    if not data:
        print(f"\n  ⚠️  Could not fetch geopolitical data")
        return

    events   = data.get("events", [])
    overall  = data.get("overall_regime_bias", "Unknown")
    summary  = data.get("overall_summary", "")
    emoji    = REGIME_EMOJIS.get(overall, "❓")

    print(f"\n  {'─'*60}")
    print(f"  🌐 GEOPOLITICAL RISK MONITOR")
    print(f"  Overall regime bias: {emoji} {overall}")

    if summary:
        print(f"\n  {summary}")

    print(f"\n  Active risk events:")
    for event in events:
        sev   = event.get("severity", "MEDIUM")
        color = SEVERITY_COLORS.get(sev, "🟡")
        regime = event.get("regime_push", "Unknown")
        remoji = REGIME_EMOJIS.get(regime, "❓")

        print(f"\n  {color} {event.get('title', '')}  [{sev}]")
        print(f"     {event.get('description', '')}")

        impacts = event.get("asset_impact", [])
        if impacts:
            print(f"     Impact: {', '.join(impacts)}")
        print(f"     Regime push: {remoji} {regime}")

def run(quadrant="Reflation", transition_warning=None):
    print(f"\n  Fetching geopolitical risks (live via AI search)...")
    data = get_geopolitical_risks()
    print_geopolitical(data)

    if data and ANTHROPIC_KEY:
        print(f"\n  Generating portfolio synthesis...")
        synthesis = get_synthesis(
            data, quadrant=quadrant,
            transition_warning=transition_warning
        )
        print_synthesis(synthesis)

        # Fetch dynamic triggers separately
        oil_price = None
        try:
            import yfinance as yf
            for ot in ["BZ=F", "CL=F"]:
                try:
                    h = yf.Ticker(ot).history(period="5d")
                    if len(h):
                        p = round(h["Close"].iloc[-1], 1)
                        if 30 < p < 300:
                            oil_price = p
                            break
                except:
                    continue
        except:
            pass

        hormuz_count = None
        try:
            hcache = f"{CACHE_DIR}/hormuz.json"
            if os.path.exists(hcache):
                with open(hcache) as hf:
                    hormuz_count = json.load(hf).get("count")
        except:
            pass

        get_triggers(data, quadrant,
                    oil_price=oil_price,
                    hormuz_count=hormuz_count)

    return data

if __name__ == "__main__":
    print("\n🌐 Geopolitical Risk Monitor")
    run()
    print()
