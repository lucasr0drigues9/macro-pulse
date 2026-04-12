"""
Europe guidance layer — mirrors the US regime tracker structure.
Provides allocation weights, triggers, transition outlook, and calendar
for the European regime using UCITS ETFs.
"""

# ── EU UCITS ETF universe with conviction scores per regime ──
# Conviction: 0.5 = low, 0.7 = moderate, 0.9+ = high
# Based on historical regime backtests for European markets

EU_REGIME_ETFS = {
    "Stagflation": [
        {"ticker": "IOGP.L", "name": "iShares Oil & Gas UCITS", "conviction": 0.95,
         "note": "European energy producers benefit directly from elevated oil/gas prices. Outperformed in every EU stagflation period since 2007."},
        {"ticker": "SGLD.L", "name": "Invesco Physical Gold", "conviction": 0.90,
         "note": "Gold in EUR terms benefits from both inflation hedge and safe-haven demand. ECB rate hikes historically lag inflation."},
        {"ticker": "EXH1.DE", "name": "iShares Euro Govt Bond 1-3yr", "conviction": 0.70,
         "note": "Short-duration govts protect against rate rises while capturing yield. Defensive anchor during stagflation."},
    ],
    "Reflation": [
        {"ticker": "EXV5.DE", "name": "iShares STOXX Europe 600 Basic Resources", "conviction": 0.90,
         "note": "Materials and mining benefit from rising growth and inflation. China demand recovery lifts European miners."},
        {"ticker": "EXV8.DE", "name": "iShares STOXX Europe 600 Industrial Goods", "conviction": 0.85,
         "note": "European industrials rally on capex cycles and infrastructure spending. Defence spending tailwind."},
        {"ticker": "EXSA.DE", "name": "iShares STOXX Europe 600", "conviction": 0.75,
         "note": "Broad European equity exposure captures the reflation tide. Euro weakness helps exporters."},
    ],
    "Goldilocks": [
        {"ticker": "EXSA.DE", "name": "iShares STOXX Europe 600", "conviction": 0.90,
         "note": "Broad equities do best when growth is steady and inflation controlled. Full risk-on for Europe."},
        {"ticker": "IUIT.L", "name": "iShares S&P 500 IT Sector UCITS", "conviction": 0.80,
         "note": "Tech exposure via UCITS. European Goldilocks often coincides with global tech rallies."},
        {"ticker": "EXH9.DE", "name": "iShares Euro Corporate Bond", "conviction": 0.75,
         "note": "Investment-grade credit benefits from stable growth and tight spreads. ECB support backstops quality."},
    ],
    "Deflation": [
        {"ticker": "SGLD.L", "name": "Invesco Physical Gold", "conviction": 0.85,
         "note": "Gold as safe haven during deflationary scares. ECB easing weakens EUR, boosting gold in local terms."},
        {"ticker": "IBGL.L", "name": "iShares Euro Govt Bond 15-30yr", "conviction": 0.90,
         "note": "Long-duration govts rally hard when ECB cuts rates aggressively. Best deflation play in Europe."},
        {"ticker": "EXH4.DE", "name": "iShares Euro Govt Bond 7-10yr", "conviction": 0.80,
         "note": "Medium-duration govts: less volatile than 15-30yr but still captures rate-cut rally."},
    ],
}

# ── EU-specific triggers ──
# Thresholds that would shift the European regime signal

EU_TRIGGERS = {
    "ecb_rate": {
        "name": "ECB Deposit Rate",
        "threshold": "Cut below 2.5% → Reflation signal; Hike above 3.5% → Stagflation deepens",
        "urgency": "Next ECB meeting",
    },
    "eu_gas_price": {
        "name": "EU Natural Gas (TTF)",
        "threshold": "Above €50/MWh → Stagflation pressure; Below €25/MWh → Deflation/Goldilocks support",
        "urgency": "Daily",
    },
    "eu_pmi": {
        "name": "Eurozone Composite PMI",
        "threshold": "Below 48 → Deflation risk; Above 52 → Goldilocks/Reflation confirmation",
        "urgency": "Monthly (1st business day)",
    },
    "bund_spread": {
        "name": "Italy-Germany 10yr Spread",
        "threshold": "Above 250bp → Fragmentation risk (ECB intervention); Below 120bp → Goldilocks signal",
        "urgency": "Daily",
    },
    "eur_usd": {
        "name": "EUR/USD",
        "threshold": "Below 1.00 (parity) → Deflation/crisis signal; Above 1.15 → European strength",
        "urgency": "Daily",
    },
    "eu_hicp": {
        "name": "Eurozone HICP Inflation",
        "threshold": "Above 3% → Stagflation; 1.5-2.5% → Goldilocks; Below 1% → Deflation risk",
        "urgency": "Monthly (flash estimate)",
    },
}

# ── EU calendar: typical economic releases that matter ──
EU_CALENDAR_TEMPLATE = [
    {"name": "ECB Interest Rate Decision", "source": "ECB", "impact": "High",
     "implication": "Rate direction defines the European regime more than any other single factor."},
    {"name": "Eurozone Flash HICP", "source": "Eurostat", "impact": "High",
     "implication": "First inflation read of the month. Core HICP (ex-energy, food) is the ECB's focus."},
    {"name": "Eurozone Composite PMI", "source": "S&P Global", "impact": "High",
     "implication": "Most timely growth indicator. Manufacturing vs services split reveals regime dynamics."},
    {"name": "Germany Industrial Production", "source": "Destatis", "impact": "Medium",
     "implication": "Germany is Europe's manufacturing engine. Weak IP = recession risk."},
    {"name": "ECB Meeting Minutes", "source": "ECB", "impact": "Medium",
     "implication": "Forward guidance on rate path. Hawks vs doves balance shapes expectations."},
    {"name": "Italy-Germany Bond Spread", "source": "Market", "impact": "Medium",
     "implication": "Widening spread = fragmentation risk. ECB's TPI backstop credibility test."},
]

# ── Transition guidance per target regime ──
EU_TRANSITION_GUIDANCE = {
    "Stagflation": {
        "description": "Energy costs rising, growth stalling. ECB caught between inflation and recession.",
        "confirmation_signals": [
            "TTF gas above €50/MWh for 2+ weeks",
            "ECB raises rates despite PMI below 50",
            "Core HICP above 3% for 2 consecutive months",
        ],
    },
    "Reflation": {
        "description": "ECB easing working, growth recovering. Cyclicals and materials leading.",
        "confirmation_signals": [
            "ECB cuts rates 2+ times consecutively",
            "Eurozone composite PMI crosses above 52",
            "European bank lending survey shows easing conditions",
        ],
    },
    "Goldilocks": {
        "description": "Growth steady, inflation at target. Best environment for European equities.",
        "confirmation_signals": [
            "Core HICP in 1.5-2.5% range for 3+ months",
            "PMI manufacturing above 50 with services above 53",
            "Italy-Germany spread below 150bp",
        ],
    },
    "Deflation": {
        "description": "Growth collapsing, inflation falling. ECB forced into emergency mode.",
        "confirmation_signals": [
            "Core HICP below 1% for 2+ months",
            "Eurozone composite PMI below 47",
            "ECB announces new asset purchase program",
        ],
    },
}
