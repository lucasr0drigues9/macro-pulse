"""
Central cache configuration.
Import this in any module that uses caching.
"""

CACHE_TTL = {
    "fred_data":       24,   # hours — FRED macro series
    "geopolitical":     6,   # hours — geopolitical risk assessment
    "data_freshness":  12,   # hours — 13F staleness warning
    "worldbank":       24,   # hours — World Bank China data
    "sector":         168,   # hours — yfinance sector lookups (7 days)
    "performance":      4,   # hours — ETF performance data
    "history":         24,   # hours — quadrant history
    "13f_filings":    168,   # hours — SEC EDGAR filings (7 days)
}

# Market hours check — only refresh price data during market hours
from datetime import datetime

def is_market_hours():
    """US market hours EST — rough check."""
    now   = datetime.utcnow()
    hour  = now.hour
    wday  = now.weekday()
    # Mon-Fri, 14:30-21:00 UTC (9:30am-4pm EST)
    return wday < 5 and 14 <= hour < 21

def should_refresh(cache_file, data_type="fred_data"):
    """Check if cache should be refreshed based on TTL."""
    import os
    from datetime import timedelta
    ttl = CACHE_TTL.get(data_type, 24)
    if not os.path.exists(cache_file):
        return True
    age = datetime.now() - datetime.fromtimestamp(
        os.path.getmtime(cache_file))
    return age > timedelta(hours=ttl)
