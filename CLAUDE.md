# Investment Research Suite — Claude Code Context

## Project Overview
A Python-based investment research suite combining macro economics, geopolitical analysis, superinvestor tracking, and Kelly-criterion position sizing. Built for a Norwegian investor using Nordnet/ASK account structure.

## Architecture — 6 Layers
1. **Macro Regime** — Ray Dalio 4-quadrant framework (Reflation/Goldilocks/Stagflation/Deflation)
2. **Geopolitical Context** — AI-powered risk monitor, cached 24h
3. **Asset Performance** — Live ETF prices via yfinance
4. **Superinvestor Positioning** — SEC 13F filings (quarterly, 45-day lag)
5. **Historical Positioning Analysis** — Alignment of smart money vs macro regime
6. **Action Plan** — Kelly-criterion ETF allocation with dynamic triggers

## Key Files
```
finance-projects/
├── run.py                    — Interactive menu launcher (START HERE)
├── macro_kelly.py            — ETF allocator + regime trigger monitor
├── macro_alignment.py        — Superinvestor vs macro alignment
├── kelly.py                  — Kelly position sizing (individual stocks)
├── investors.py              — US fund 13F data fetcher
├── investors_nordic.py       — Nordic fund data
├── investors_asia.py         — Asian fund data  
├── investors_uk.py           — UK fund data
├── ranking.py                — Stock ranking algorithm
├── fundamentals.py           — F.score fundamentals scoring
└── macro/
    ├── main.py               — Macro dashboard (us/china/europe/global/guidance)
    ├── geopolitical.py       — Geopolitical monitor + AI synthesis
    ├── macro_kelly.py        — ETF allocator (same as root, called from macro dir)
    ├── snapshot.py           — Daily market snapshot system
    ├── thresholds.py         — Single source of truth for all thresholds
    ├── fred.py               — FRED data fetcher
    ├── quadrant.py           — Dalio quadrant assessment
    ├── transition.py         — Regime transition warnings
    ├── performance.py        — Asset performance tracker
    ├── global_guidance.py    — Global allocation guidance
    ├── china.py              — China deflation analysis
    ├── europe.py             — Europe analysis
    ├── data_freshness.py     — 13F staleness warning
    └── .macro_cache/         — All cached data (JSON files)
```

## Running the Tool
```bash
cd ~/finance-projects && python3 run.py    # Main menu
cd ~/finance-projects/macro && python3 ../macro_kelly.py  # ETF allocator only
cd ~/finance-projects/macro && python3 geopolitical.py    # Geo monitor only
cd ~/finance-projects/macro && python3 snapshot.py        # History
```

## Menu Structure
```
STEP 1 — UNDERSTAND THE WORLD
  1. Geopolitical snapshot
  2. Global macro guidance
  3. US economy (FRED data)
  4. China economy
  5. Europe economy

STEP 2 — VALIDATE WITH DATA
  6. Asset performance
  7. Geopolitical deep dive + AI synthesis

STEP 3 — SIZE YOUR POSITIONS
  8. ETF allocation (Kelly + regime monitor)

STEP 4 — RESEARCH (filing season only)
  9. Superinvestor rankings
  A. Alignment analysis

ADVANCED
  B. Norway Oil Fund (NBIM)
  D. Weekly checklist
  H. Market history
```

## Cache System
All API and data calls are cached in `macro/.macro_cache/`:
- `geopolitical.json` — geo risks (24h TTL)
- `geo_synthesis.json` — AI synthesis + calendar scenarios + `etf_convictions` per-ETF scores (24h TTL)
- `regime_triggers.json` — dynamic regime triggers (24h TTL)
- `data_freshness.json` — 13F staleness assessment (48h TTL)
- `hormuz.json` — Hormuz transit count (4h TTL)
- `snapshots.jsonl` — daily market history (permanent)
- `FRED_SERIES.json` — FRED data series (24h TTL)

## API Usage
- **Anthropic API** — geopolitical synthesis, data freshness, regime triggers
  - Model: claude-sonnet-4-20250514
  - Key: read from `ANTHROPIC_API_KEY` environment variable
  - Cost: ~€0.10-0.20 per full refresh (once per 24h)
- **FRED API** — macro economic data (free, no key needed)
- **yfinance** — live prices (free)
- **World Bank API** — China/global data (free)

## Current Market Context (as of late March 2026)
- **FRED regime:** 🟡 Reflation (lagged Jan/Feb data)
- **Geo regime:** 🔴 Stagflation (Iran war, oil shock — MORE CURRENT)
- **Oil price:** ~$100-110 (Brent)
- **Hormuz transits:** 6/day (normal = 138/day)
- **Next 13F filings:** May 15, 2026 (Q1 2026)
- **Next CPI print:** April 10, 2026
- **Next FOMC:** April 28-29, 2026

## Design Principles
1. **Geopolitical signal overrides FRED** when data lag warning is active
2. **Single source of truth** — all thresholds in `thresholds.py`
3. **Graceful degradation** — tool works without API key (uses cached/static data)
4. **Filing season awareness** — 13F data only reliable within 30 days of filing
5. **Cache everything** — minimize API calls, respect rate limits
6. **Norway context** — ASK (Aksjesparekonto) at Nordnet, Brent crude benchmark

## Pending Work
- [ ] Write README.md for GitHub
- [ ] Push to GitHub (git not yet initialized)
- [ ] Compartmentalise history view (navigate by month/year)
- [ ] Europe guidance layer equivalent to china_guidance.py

## Known Issues
- Oil ticker `BZ=F` sometimes returns bad data — fallback to `CL=F`
- Mohnish Pabrai returns 0 holdings (data source issue)
- Core CPI from FRED lags 6-9 months — currently estimated as 55% of headline
- World Bank API occasionally times out — graceful fallback to cache

## Code Style
- Python 3.12
- No external frameworks — pure stdlib + yfinance + requests + beautifulsoup4
- All paths use absolute paths (no relative paths in production code)
- Print-based UI (no rich/curses) for terminal compatibility
- Emoji indicators: 🟢 good/met, 🟡 warning/watch, 🔴 bad/not-met, 🔵 deflation
