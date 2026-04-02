# Macro Pulse

Live economic regime tracker built on Ray Dalio's four-season framework. Combines lagging FRED data with daily AI-powered geopolitical synthesis to detect regime shifts before traditional indicators confirm them.

**Live site:** [macropulse.io](https://macropulse.io)

## What it does

Classifies the economy into one of four regimes — **Stagflation**, **Goldilocks**, **Reflation**, or **Deflation** — using 6 FRED economic indicators (GDP, CPI, PCE, PPI, unemployment, retail sales) and a daily geopolitical AI layer. Each regime maps to specific ETF allocations sized using Kelly Criterion.

### Dashboard sections

1. **Regime Indicator** — Current confirmed regime with FRED and geopolitical signal comparison
2. **Asset Performance** — Picks vs avoids since regime start with live ETF returns
3. **Portfolio Allocation** — Conviction-weighted ETF recommendations with RSI/SMA price assessments
4. **Position Calculator** — Kelly Criterion sizing based on your portfolio size and cash
5. **Weekly Calendar** — Upcoming economic releases with AI scenario analysis
6. **Regime Triggers** — Live thresholds that would shift the signal
7. **Regime Playbook** — Why each asset class performs in each season
8. **Backtesting** — 52 regime periods from 2007-2026 with full scorecard
9. **Email Alerts** — Post-release summaries, regime change alerts, weekly newsletter

## Architecture

```
macropulse.io (Vercel)          Railway (FastAPI)           Python CLI tool
    Next.js 14                      7 API endpoints            FRED data pipeline
    Tailwind CSS                    3 cron endpoints           Quadrant classifier
    9 React components              Resend emails              Geopolitical AI synthesis
                                                               Kelly Criterion sizing
                                                               Backtest engine (52 periods)
```

The web app wraps an existing Python CLI tool — it doesn't rewrite the core logic, it exposes it through a REST API.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18, Tailwind CSS, TypeScript |
| Backend | Python FastAPI, uvicorn |
| Data | FRED API, yfinance, Anthropic Claude API (geo synthesis) |
| Email | Resend |
| Hosting | Vercel (frontend), Railway (backend) |

## Project structure

```
finance-projects/
├── macro-pulse/
│   ├── frontend/           Next.js app (Vercel)
│   │   └── src/
│   │       ├── app/        Pages (home, disclaimer, terms)
│   │       ├── components/ 9 section components
│   │       └── lib/        API helpers, mock data
│   └── backend/
│       ├── main.py         FastAPI endpoints
│       └── emails.py       Resend email templates
├── macro/                  Core Python tool
│   ├── fred.py             FRED data fetcher
│   ├── quadrant.py         Dalio regime classifier
│   ├── geopolitical.py     AI geopolitical synthesis
│   ├── performance.py      ETF performance tracker
│   ├── transition.py       Early regime warnings
│   ├── backtest_regime.py  52-period backtester
│   ├── thresholds.py       Single source of truth for triggers
│   └── snapshot.py         Daily market state archiver
├── macro_kelly.py          ETF allocator + Kelly sizing
├── run.py                  Interactive CLI menu
└── portfolio.py            Holdings tracker
```

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/regime` | Current regime, signals, lag warning |
| GET | `/api/performance` | ETF returns since regime start |
| GET | `/api/allocation` | Conviction-weighted picks with price assessments |
| POST | `/api/calculate` | Kelly position sizing calculator |
| GET | `/api/calendar` | Economic releases with AI scenarios |
| GET | `/api/triggers` | Live regime change thresholds |
| GET | `/api/backtest` | 52 regime periods with scorecard |
| POST | `/api/subscribe` | Email signup |
| POST | `/api/cron/daily` | Geo synthesis refresh (6am UTC) |
| POST | `/api/cron/weekly` | Tuesday newsletter |
| POST | `/api/cron/fred-release` | FRED data pull + regime check |

## Running locally

```bash
# Backend
cd macro-pulse/backend
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your-key
export FRED_API_KEY=your-key
python -m uvicorn main:app --port 8000

# Frontend (separate terminal)
cd macro-pulse/frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Environment variables

### Backend (Railway)
| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Geopolitical AI synthesis (~$0.10-0.20/day) |
| `FRED_API_KEY` | Yes | FRED economic data (free at fredaccount.stlouisfed.org) |
| `RESEND_API_KEY` | Yes | Email sending |
| `CORS_ORIGINS` | Yes | Comma-separated allowed frontend origins |
| `CRON_SECRET` | Yes | Auth header for cron endpoints |

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Railway backend URL |

## Backtesting results

52 regime periods from 2007 to 2026:

- Picks outperformed SPY: 44.2% of periods
- Avoid accuracy: 54.8%
- Strongest regime: Stagflation (57.1% win rate, 12.8% half-Kelly)
- Best call: Stagflation 2025-12 — picks +16.0% vs SPY +0.9%
- Worst call: Reflation 2013-08 — picks +9.6% vs SPY +25.1%

The worst call is always shown. Transparency is what makes every other number credible.

## Disclaimer

This is a systematic framework output for educational purposes only. It does not constitute personalised financial advice. Past performance does not guarantee future results. See [/disclaimer](https://macropulse.io/disclaimer) and [/terms](https://macropulse.io/terms).

## License

MIT
