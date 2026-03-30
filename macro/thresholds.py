"""
Single source of truth for all regime change thresholds.
Update here and all tools update automatically.
"""

# Oil price thresholds (Brent crude)
OIL_CRISIS_LEVEL    = 100   # above = acute crisis premium
OIL_WARNING_LEVEL   = 85    # below = Stagflation thesis weakening  
OIL_ROTATION_LEVEL  = 75    # below = confirmed rotation to tech

# CPI thresholds (monthly % change)
CPI_STAGFLATION     = 0.5   # above = Stagflation deepening
CPI_NEUTRAL         = 0.3   # 0.3-0.5 = regime unchanged
CPI_GOLDILOCKS      = 0.2   # below = Goldilocks signal

# Hormuz transit threshold
HORMUZ_RECOVERY     = 50    # vessels/day above = supply recovering
HORMUZ_NORMAL       = 138   # vessels/day pre-crisis baseline

# Retail sales
RETAIL_RECESSION    = 0.0   # below = Stagflation confirmed

# Fed rate scenarios (current: 3.50-3.75%)
FED_CURRENT_LOW     = 3.50
FED_CURRENT_HIGH    = 3.75

# Regime change labels
REGIME_TRIGGERS = {
    "Stagflation": {
        "oil_crisis":  f"Brent > ${OIL_CRISIS_LEVEL} — crisis premium active",
        "oil_warning": f"Brent < ${OIL_WARNING_LEVEL} — Stagflation weakening",
        "oil_rotate":  f"Brent < ${OIL_ROTATION_LEVEL} — rotate to QQQ/tech",
        "cpi_high":    f"CPI > +{CPI_STAGFLATION}% — Stagflation deepens, hold XLE/GLD",
        "cpi_neutral": f"CPI {CPI_NEUTRAL}-{CPI_STAGFLATION}% — regime unchanged",
        "cpi_low":     f"CPI < +{CPI_GOLDILOCKS}% — oil shock easing, watch rotation",
        "hormuz_ok":   f"Hormuz > {HORMUZ_RECOVERY}/day — supply recovering",
        "retail_neg":  "Retail sales negative — recession risk rising",
    },
    "Reflation": {
        "oil_warning": f"Brent > ${OIL_CRISIS_LEVEL} — Stagflation risk rising",
        "cpi_high":    f"CPI > +{CPI_STAGFLATION}% — regime shifting to Stagflation",
        "cpi_low":     f"CPI < +{CPI_GOLDILOCKS}% — regime shifting to Goldilocks",
        "retail_neg":  "Retail sales negative — Stagflation confirmed",
    },
    "Goldilocks": {
        "oil_warning": f"Brent > ${OIL_WARNING_LEVEL} — inflation returning",
        "cpi_high":    f"CPI > +{CPI_NEUTRAL}% — Reflation risk",
    },
    "Deflation": {
        "cpi_high":    "CPI turns positive — Reflation incoming",
        "stimulus":    "Stimulus announced — rotate into equities",
    },
}
