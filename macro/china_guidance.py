from china import get_china_data, assess_china

CHINA_GUIDANCE = {
    "Deflation": {
        "situation": (
            "China is in deflation despite official GDP growth of ~5%. "
            "Consumer prices falling (-0.5% over 3 months), property sector "
            "contracting, domestic demand weak. Beijing has significant tools "
            "to stimulate and has historically acted when growth targets threatened."
        ),
        "scenarios": [
            {
                "key":   "deflation_persists",
                "title": "SCENARIO 1 — DEFLATION PERSISTS",
                "prob":  "35%",
                "desc":  "Beijing stimulus proves insufficient or delayed.",
                "toward": [
                    "Chinese government bonds — rally in deflation",
                    "Export tech (BABA, NTES, PDD) — weaker Yuan helps",
                    "USD assets — Yuan weakness makes dollar attractive",
                    "Gold — safe haven during uncertainty",
                ],
                "away": [
                    "Chinese property developers — avoid entirely",
                    "Domestic consumption plays — retail, restaurants",
                    "Chinese banks — rising NPLs from property exposure",
                    "Commodity producers — Chinese demand stays weak",
                ],
                "watch": [
                    "CPI stays negative for 3+ consecutive months",
                    "Property prices continue falling",
                    "Credit growth stays weak despite rate cuts",
                    "Youth unemployment rises above 20%",
                ],
            },
            {
                "key":   "transition_reflation",
                "title": "SCENARIO 2 — CHINA REFLATES (most likely)",
                "prob":  "45%",
                "desc":  "Beijing deploys meaningful stimulus. This is Tepper's thesis.",
                "toward": [
                    "Chinese equities broadly — BABA, NTES, FUTU, PDD, JD",
                    "Commodities (DBC, copper) — China is world's largest consumer",
                    "Energy stocks — Chinese demand recovery boosts oil",
                    "Emerging market ETFs (EEM) — China re-rating lifts EM",
                    "Materials — steel, cement, construction recovery",
                ],
                "away": [
                    "USD — weakens as capital flows toward China",
                    "Chinese bonds — rotation to equities",
                    "Gold — loses safe haven premium as risk returns",
                ],
                "watch": [
                    "PBOC cuts reserve requirement ratio (RRR)",
                    "Beijing announces fiscal package >1% of GDP",
                    "Property prices stabilise or show monthly gains",
                    "CPI returns to positive territory",
                    "PMI manufacturing crosses above 50",
                ],
                "tepper": (
                    "Tepper holds Alibaba as his largest position (~11% of fund). "
                    "His bet: Beijing will stimulate enough to reflate, Chinese "
                    "equities are severely undervalued, and Alibaba's cloud/AI "
                    "business (triple-digit growth 10 consecutive quarters) "
                    "justifies re-rating. BABA trades at ~10x forward earnings "
                    "vs 25x+ for US peers."
                ),
            },
            {
                "key":   "transition_goldilocks",
                "title": "SCENARIO 3 — GOLDILOCKS (best case)",
                "prob":  "20%",
                "desc":  "Stimulus works AND inflation stays controlled. Requires property stabilisation.",
                "toward": [
                    "Chinese growth stocks — full re-rating potential",
                    "Chinese consumer discretionary — confidence restored",
                    "Chinese financials — banks recover as NPLs stabilise",
                    "Broad EM exposure — rising tide lifts all boats",
                ],
                "away": [
                    "Defensive assets — no longer needed",
                    "USD — meaningful weakness likely",
                ],
                "watch": [
                    "GDP growth accelerates above 5.5% YoY",
                    "CPI rises to 1-2% (healthy inflation)",
                    "Property transaction volumes recover strongly",
                    "Consumer confidence returns to 2021 levels",
                ],
            },
        ],
    },
    "Reflation": {
        "situation": (
            "China successfully reflated — stimulus worked. "
            "Growth and inflation both rising. Watch for overheating."
        ),
        "scenarios": [
            {
                "key":   "reflation_sustained",
                "title": "REFLATION SUSTAINED",
                "prob":  "50%",
                "desc":  "Stimulus keeping growth and inflation rising.",
                "toward": [
                    "Commodities — China demand driving global prices",
                    "Energy stocks — oil demand strong",
                    "Chinese industrials and materials",
                    "EM equities broadly",
                ],
                "away": [
                    "Chinese bonds — inflation eroding fixed income",
                    "Defensive sectors",
                ],
                "watch": [
                    "CPI stays in 1-3% range",
                    "PMI manufacturing above 52",
                    "Export growth remains positive",
                ],
            },
        ],
    },
    "Goldilocks": {
        "situation": (
            "Ideal Chinese environment — growth healthy, inflation controlled. "
            "Rare but powerful when it occurs."
        ),
        "scenarios": [
            {
                "key":   "goldilocks_sustained",
                "title": "GOLDILOCKS SUSTAINED",
                "prob":  "40%",
                "desc":  "Best environment for Chinese equities.",
                "toward": [
                    "Chinese equities broadly",
                    "Chinese tech and consumer discretionary",
                    "EM equities",
                ],
                "away": [
                    "Commodities — inflation not a concern",
                    "Defensive assets",
                ],
                "watch": [
                    "GDP growth 4.5-5.5% range",
                    "CPI 1-2% range",
                    "Property sector stable",
                ],
            },
        ],
    },
    "Stagflation": {
        "situation": (
            "Worst case for China — growth slowing while inflation rises. "
            "Likely driven by energy/commodity price shocks or supply disruption."
        ),
        "scenarios": [
            {
                "key":   "stagflation_sustained",
                "title": "STAGFLATION",
                "prob":  "n/a",
                "desc":  "Difficult environment requiring defensive positioning.",
                "toward": [
                    "Gold — safe haven",
                    "Cash — preserve capital",
                    "Consumer staples — non-cyclical demand",
                    "Energy stocks — input cost beneficiary",
                ],
                "away": [
                    "Chinese growth stocks — double headwind",
                    "Chinese property — rate and demand pressure",
                    "Consumer discretionary",
                ],
                "watch": [
                    "PBOC policy response — rate cut vs inflation fight",
                    "Commodity prices — key driver of Chinese PPI",
                    "Export demand — global recession risk",
                ],
            },
        ],
    },
}

def wrap(text, width=58, indent="     "):
    words = text.split()
    line  = indent
    for word in words:
        if len(line) + len(word) > width:
            print(line)
            line = indent + word + " "
        else:
            line += word + " "
    if line.strip():
        print(line)

def print_china_guidance(china_result):
    quadrant = china_result["quadrant"]
    guidance = CHINA_GUIDANCE.get(quadrant, {})
    if not guidance:
        return

    print(f"\n  {'─'*60}")
    print(f"  🧭 CHINA INVESTMENT GUIDANCE")
    print(f"\n  Current situation:")
    wrap(guidance["situation"])

    for scenario in guidance.get("scenarios", []):
        print(f"\n  {'─'*55}")
        prob  = scenario.get("prob", "")
        title = scenario["title"]
        print(f"  📍 {title}  [{prob} probability]")

        if scenario.get("desc"):
            print(f"\n  {scenario['desc']}")

        if scenario.get("toward"):
            print(f"\n  MOVE TOWARD:")
            for item in scenario["toward"]:
                print(f"    ✅ {item}")

        if scenario.get("away"):
            print(f"\n  MOVE AWAY FROM:")
            for item in scenario["away"]:
                print(f"    ❌ {item}")

        if scenario.get("watch"):
            print(f"\n  SIGNALS TO WATCH:")
            for item in scenario["watch"]:
                print(f"    📍 {item}")

        if scenario.get("tepper"):
            print(f"\n  💡 SMART MONEY THESIS (Tepper):")
            wrap(scenario["tepper"])

if __name__ == "__main__":
    print("\n🇨🇳 Testing China guidance...")
    data   = get_china_data()
    result = assess_china(data)
    print_china_guidance(result)
    print()
