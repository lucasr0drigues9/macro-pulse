"""
China API configuration — ETF universe, triggers, transition guidance.
Mirrors europe_guidance.py structure for the China tracker.
"""

# ── China-accessible ETFs (mix of US-listed and UCITS) ──
CHINA_REGIME_ETFS = {
    "Deflation": [
        {"ticker": "GLD", "name": "SPDR Gold", "conviction": 0.90,
         "note": "Gold as safe haven during Chinese deflationary spiral. PBOC easing weakens CNH, supports gold."},
        {"ticker": "TLT", "name": "iShares 20+ Year Treasury", "conviction": 0.85,
         "note": "US long bonds benefit from global deflation fears. Flight to safety as China slows."},
        {"ticker": "XLP", "name": "Consumer Staples Select", "conviction": 0.70,
         "note": "Defensive non-cyclical demand. Insulated from Chinese demand weakness."},
    ],
    "Reflation": [
        {"ticker": "FXI", "name": "iShares China Large-Cap", "conviction": 0.85,
         "note": "Direct China equity exposure. Reflation = Beijing stimulus working, Chinese equities re-rate."},
        {"ticker": "DBC", "name": "Invesco DB Commodity", "conviction": 0.90,
         "note": "China is world's largest commodity consumer. Reflation drives copper, iron ore, energy demand."},
        {"ticker": "EEM", "name": "iShares MSCI Emerging Markets", "conviction": 0.80,
         "note": "China recovery lifts all EM. Commodity exporters (Brazil, Indonesia) benefit from demand."},
    ],
    "Goldilocks": [
        {"ticker": "KWEB", "name": "KraneShares CSI China Internet", "conviction": 0.90,
         "note": "Chinese tech re-rates in Goldilocks. BABA, PDD, JD benefit from consumer confidence + regulatory easing."},
        {"ticker": "FXI", "name": "iShares China Large-Cap", "conviction": 0.85,
         "note": "Broad Chinese equities. Growth + low inflation = best environment for re-rating."},
        {"ticker": "EEM", "name": "iShares MSCI Emerging Markets", "conviction": 0.75,
         "note": "Rising tide lifts all boats. China Goldilocks is the single biggest catalyst for EM."},
    ],
    "Stagflation": [
        {"ticker": "GLD", "name": "SPDR Gold", "conviction": 0.90,
         "note": "Safe haven in worst-case China scenario. Energy/commodity shock + growth collapse."},
        {"ticker": "XLE", "name": "Energy Select", "conviction": 0.80,
         "note": "If stagflation is supply-driven (Hormuz), energy producers benefit even as China slows."},
        {"ticker": "DBC", "name": "Invesco DB Commodity", "conviction": 0.75,
         "note": "Commodity prices stay elevated from supply constraints even if demand weakens."},
    ],
}

# ── China-specific triggers ──
CHINA_TRIGGERS = {
    "pboc_lpr": {
        "name": "PBOC Loan Prime Rate (1yr)",
        "threshold": "Cut below 3.0% → aggressive easing; Hold → deflationary inaction",
        "urgency": "Monthly (20th)",
    },
    "caixin_pmi": {
        "name": "Caixin Manufacturing PMI",
        "threshold": "Below 48 → deep contraction; Above 51 → reflation signal",
        "urgency": "Monthly (1st business day)",
    },
    "ppi": {
        "name": "China PPI (Producer Prices)",
        "threshold": "Below -3% → severe deflation; Above 0% → reflation confirmed",
        "urgency": "Monthly (10th)",
    },
    "property": {
        "name": "New Home Prices (70 cities)",
        "threshold": "MoM negative for 6+ months → structural deflation; Any positive → stabilisation",
        "urgency": "Monthly (15th)",
    },
    "cnh": {
        "name": "USD/CNH",
        "threshold": "Above 7.40 → capital flight; Below 7.10 → confidence returning",
        "urgency": "Daily",
    },
    "taiwan_risk": {
        "name": "Taiwan Strait Activity",
        "threshold": "Military exercises → extreme risk premium; Diplomatic progress → risk reduction",
        "urgency": "Event-driven",
    },
}

# ── Transition guidance ──
CHINA_TRANSITION_GUIDANCE = {
    "Deflation": {
        "description": "Growth collapsing, prices falling. PBOC forced into aggressive easing. Property crisis dominant.",
        "confirmation_signals": [
            "CPI negative for 3+ consecutive months",
            "PBOC cuts RRR + LPR in same month",
            "Property transaction volumes fall 30%+ YoY",
        ],
    },
    "Reflation": {
        "description": "Beijing stimulus working. Growth and inflation both rising. Tepper thesis playing out.",
        "confirmation_signals": [
            "Caixin PMI above 51 for 2 consecutive months",
            "PPI returns to positive territory",
            "Property prices stabilise (MoM flat or positive)",
        ],
    },
    "Goldilocks": {
        "description": "Best case — stimulus worked AND inflation stays controlled. Consumer confidence restored.",
        "confirmation_signals": [
            "GDP growth above 5.5% with CPI in 1-2% range",
            "Property transaction volumes recover to 2021 levels",
            "Youth unemployment falls below 15%",
        ],
    },
    "Stagflation": {
        "description": "Worst case — supply shock (energy/food) hits while growth is already weak. Policy dilemma.",
        "confirmation_signals": [
            "PPI above 2% while PMI below 49",
            "Food price inflation above 5% (pork/grain crisis)",
            "PBOC caught between easing (growth) and tightening (inflation)",
        ],
    },
}
