# Macro Pulse — Claude Code Build Spec v3

---

## LIVING DOCUMENT — HOW TO USE THIS SPEC

This file is the single source of truth for this project. Claude Code must:

- **Read this file at the start of every session** before writing any code
- **Update this file** whenever any of the following happens:
  - A build step is completed — mark it ✅ with the date
  - A technical decision is made that isn't covered here — add it under the Decisions Log section at the bottom
  - Feedback from Lucas changes a requirement — update the relevant section and note what changed
  - A new feature or section is added to scope — add it to the spec before building it
  - A technical constraint is discovered — note it so future sessions don't repeat the same dead ends

- **Never assume** something is still accurate if it hasn't been confirmed in the current session. Re-read this file first.

---

## Project Overview

I have an existing Python-based macro investing tool that runs locally. It tracks Ray Dalio's four economic seasons (Stagflation, Goldilocks, Reflation, Deflation) using live FRED data and a geopolitical AI synthesis layer, generates ETF allocation recommendations, sizes positions using Kelly Criterion, and maintains a full history of every regime signal it has ever produced.

I want to turn this into a public-facing web app that anyone can use for free. The goal is to build an audience, establish a timestamped public track record of macro calls, and capture emails for post-event alerts and a weekly newsletter.

**This is an MVP. No paywall. No user accounts. Entirely free.**

---

## What the Existing Python Tool Already Does

Before building anything, read and understand the existing codebase thoroughly. It contains:

- **FRED data pipeline** — pulls GDP, CPI, PCE, PPI, retail sales, unemployment via the FRED API and calculates 3-month momentum vs 12-month trend to determine if growth and inflation are rising or falling
- **Regime detection** — maps growth/inflation signals to one of four regimes using Dalio's framework, with smoothing logic (requires 2 consecutive months before flipping to confirmed regime)
- **Early transition detection** — identifies when one or more indicators are flickering toward a new regime before it is confirmed, producing an "early signal" state separate from the confirmed regime
- **Geopolitical override** — a daily AI synthesis layer that reads current geopolitical events and updates an override signal when events (e.g. Iran/Hormuz oil disruption) indicate a regime shift before the lagging FRED data confirms it. This runs daily via API call, not on the FRED release schedule.
- **Asset performance tracker** — tracks actual ETF returns for regime picks vs avoids since the current regime started
- **Portfolio allocation engine** — given a portfolio size, cash available, and current holdings, calculates exact dollar/euro amounts to buy or sell per ETF based on regime-recommended weights and Kelly Criterion sizing. Also factors in current ETF prices relative to historical averages within the regime to flag what is still attractively priced vs what has already run.
- **Early rotation recommendations** — when an early transition signal is detected, generates small starter position recommendations for the incoming regime's asset classes, sized conservatively until the regime is confirmed
- **Weekly checklist** — generates upcoming economic releases with regime implications and live trigger thresholds
- **Backtesting data** — validated performance across 52 regime periods from 2007 to 2026. Check whether ETF performance per regime period is already stored or needs to be calculated and stored before building Section 7.

The web app should expose all of this as a clean, public-facing interface. Do not rewrite the core logic — wrap it in a web layer.

---

## Tech Stack

- **Frontend:** Next.js (React) — deployed on Vercel
- **Backend:** Python FastAPI — wraps the existing Python tool logic, deployed on Railway
- **Database:** Supabase (free tier) — stores regime history, email signups, event results
- **Email:** Resend (free tier) — sends post-event alert emails and weekly newsletter
- **Schedulers (two separate jobs):**
  - **Daily at 6am UTC** — geopolitical AI synthesis API call, reads current events, updates override signal
  - **On FRED release dates** — triggers FRED data pull after each scheduled economic release (use hardcoded FRED release calendar)
- **Charts:** Recharts or Chart.js

---

## Design Direction

Dark background (#0a0a0a), monospace font for all data elements, clean terminal-inspired aesthetic. Matches the existing tool's output style and signals that the data comes from a real system, not a marketing page.

Colour coding for regimes used consistently throughout:
- Stagflation — red
- Goldilocks — green
- Reflation — yellow
- Deflation — blue

Mobile responsive. Single scrolling page for MVP. No navigation menu needed.

Site name: **Macro Pulse**

---

## Page Structure

---

### SECTION 0 — Welcome + Context (above the fold)

New visitors need context before the regime indicator means anything. This section sits above the regime indicator and provides orientation.

Display:
- Site name: **Macro Pulse**
- One-line tagline: "Track economic regimes in real time. Know what to own and when."
- Brief 2-3 sentence explainer: "The economy cycles through four seasons — Stagflation, Goldilocks, Reflation, and Deflation. Each one rewards different assets. This tool detects which season we're in using live economic data and AI-powered geopolitical analysis, then tells you what historically works."
- Four small regime cards in a row showing the four seasons with their colours, each with a 3-4 word description (e.g., "Falling growth, rising inflation")
- "How it works" in 3 steps: 1) We read FRED economic data + daily geopolitical signals → 2) Classify into one of four regimes → 3) Show you which ETFs historically outperform
- A subtle downward arrow or "See current regime ↓" prompt

This section should be clean, fast to scan, and make a first-time visitor understand the value in under 10 seconds.

### Mode Selector

Directly below Section 0. Three buttons in a row: **Conservative** | **Medium** | **Aggressive**
- Brief one-line description under each: "Wait for confirmation" | "Act on strong signals" | "Move early, accept more risk"
- Defaults to Active
- Persisted in localStorage, defaults to Active
- Affects all sections below

### SECTION 1 — Regime Indicator

The main regime display. Adapts based on selected mode.

Display:
- Current regime name in large text with colour coding (what counts as "confirmed" depends on mode)
- "Xth consecutive month" below the regime name
- Two signal indicators side by side:
  - **FRED signal:** current reading with data source note
  - **Geopolitical signal:** current reading (updated daily)
- If they diverge, show a prominent banner: "Data lag active — geopolitical signal overriding FRED. FRED data lags reality by 1-2 months."
- If an early transition signal is detected, show a secondary banner directly below the confirmed regime showing which indicators are flickering, which are still confirming the current regime, and a note that it is not yet confirmed.
- Last updated timestamp (geopolitical: updated daily / FRED: updated on release dates)
- **Mode-specific behavior:** Aggressive mode may show a different confirmed regime than Conservative if only 1 month of data supports the new regime

---

### SECTION 2 — Asset Performance

Title: "[Current Regime] — Picks vs Avoids (since [regime start date])"

A table with three columns: Asset | Return since regime start | Category

Pull this data live from the existing tool's asset performance tracker. Regime picks show with a green checkmark, regime avoids with a red X, benchmark (SPY) separately.

Summary row at bottom:
- Avg picks: [X]% | Avg avoids: [X]% | Picks outperformed (or not)

Disclaimer below table:
"Past performance within a regime does not guarantee future results. Regime transitions can reverse quickly. This is not financial advice."

---

### SECTION 3 — Portfolio Allocation

Title: "Current Allocation Recommendation"

This section has two parts:

**Part A — Regime weights with smart buy guidance**

A horizontal bar chart showing recommended portfolio percentage per ETF for the current regime.

Below the chart, two columns:

**Overweight (buy/hold):**
For each regime pick, display:
- ETF ticker and name
- Recommended portfolio weight
- Current price assessment: Still attractive / Fairly valued / Extended
- One-line rationale based on current conditions pulled from tool (not static text)

**Underweight (avoid):**
For each regime avoid:
- ETF ticker and name
- One-line explanation of why it underperforms in this regime

**If early transition signal is active — add a third column:**

**Early rotation (starter positions):**
- List incoming regime's asset classes with conservative starter weights (5-10%)
- Price assessment for each
- Note: "Regime not yet confirmed. Small starter position only. Full rotation if confirmed next month."

Note below section: "Buy recommendations factor in current ETF prices relative to historical regime averages. Allocation updates automatically when the regime changes or an early signal fires."

Disclaimer: "This is a systematic framework output, not personalised financial advice. Always do your own research."

**Part B — Personal allocation calculator**

An interactive input form using the existing Kelly Criterion position sizing logic:

Inputs:
- Total portfolio size (EUR/USD toggle)
- Cash available to deploy
- Current holdings (optional — user can add ETF ticker + current value)

Output:
- A table showing exactly how much to buy or sell per ETF in currency terms
- Includes early rotation starter positions if early signal is active
- A simple pie chart of the resulting portfolio

This runs on demand. Backend runs Kelly sizing logic and returns result. No user data is stored.

---

### SECTION 4 — This Week's Calendar

Title: "This Week — What to Watch"

Pull from the existing weekly checklist generator. Display upcoming economic releases as cards:

Each card:
- Release name and data source
- Day and date
- Impact level: High / Medium / Low
- One sentence on what it means for the regime

---

### SECTION 5 — Live Triggers + Email Capture

Title: "Regime Change Triggers"

Pull from the existing weekly checklist. Display as a visual checklist with traffic light indicators:

Per trigger:
- Indicator name
- Current value
- Status: Crisis / Watch / Stable
- "Below [threshold] = [what happens]"

Footer line showing current positioning.

**Email capture — unified, directly below the triggers:**

Title: "Get notified when something changes"

One signup form with two clearly explained options:

"We send two types of updates — choose what's useful for you:"

- Event alerts — after each economic release, a plain English summary of what the data showed and whether your allocation needs to adjust (checked by default)
- Regime change alerts — immediately if a trigger fires or the regime shifts (checked by default)

Single email field + "Notify me" button.

Below the button: "No spam. No weekly newsletters unless you want them. Only signal, no noise."

Optional add-on checkbox: Also send me the Weekly Macro Pulse every Tuesday

---

### SECTION 6 — The Regime Playbook

Title: "Why Each Asset Class Performs in Each Season"
Subtitle: "Understanding the mechanics behind the allocations."

Display as four expandable cards, one per regime. Collapsed by default, expanded on click. This keeps the page clean but makes content available for SEO crawling and engaged readers.

Each card follows this structure:
- What is happening in the economy during this regime
- Which asset classes outperform and why (mechanistic explanation, not just assertion)
- Which asset classes underperform and why
- Historical examples of this regime occurring

The four regimes to cover:
- Stagflation: Falling growth + Rising inflation
- Goldilocks: Rising growth + Falling inflation
- Reflation: Rising growth + Rising inflation
- Deflation: Falling growth + Falling inflation

---

### SECTION 7 — Regime History + Backtesting

Title: "52 Regimes. 19 Years. Every Call Shown."
Subtitle: "How the framework performed across every economic season from 2007 to 2026."

**Important implementation note:** Before building this section, check the existing codebase to determine whether ETF performance per regime period is already stored or needs to be calculated. If it needs to be calculated, run the calculation for all 52 periods and store the results in Supabase before building the UI. Do not build this section with placeholder data.

Display as two parts:

**Part A — Interactive backtesting tool**

Inputs:
- Select regime filter (dropdown: All / Stagflation / Goldilocks / Reflation / Deflation)
- Select ETFs to include (checkboxes)
- Date range slider: 2007 to present

Output:
- Line chart showing portfolio value over time vs SPY benchmark
- Regime periods highlighted as colour bands on the chart
- Summary table: total return, max drawdown, best single regime, worst single regime

**Part B — Regime timeline**

Condensed visual timeline of all 52 regime periods, most recent at top. Each entry:
- Regime type with colour
- Date range and duration
- Recommended allocation for that period
- Picks performance vs SPY: outperformed / underperformed

Scorecard below:
- Total regimes: 52 (2007-2026)
- Picks outperformed SPY: [X]/52 ([%])
- Average outperformance per regime: +[X]%
- Best call: [date] — [regime] — picks +[X]% vs SPY [X]%
- Worst call: [date] — [regime] — picks [X]% vs SPY +[X]%

The worst call must be shown. It is what makes every other number credible.

Disclaimer: "Backtested performance. Does not represent live trading results. Past performance does not guarantee future results."

---

### SECTION 8 — Weekly Newsletter Signup

Title: "The Weekly Macro Pulse"

"Every Tuesday — the full regime update, this week's key releases, live trigger status, and current allocation. Written by the tool, edited for humans."

Email field + "Send me the weekly pulse" button.

Include a collapsed preview of what the email looks like so people know what they are signing up for.

---

### SECTION 9 — Coming Soon

Title: "What's Coming Next"

Three upcoming features:
- Portfolio X-ray: "Paste your current ETF holdings and see what macro bet you're actually making"
- Mobile alerts: "Push notifications when a trigger fires — no need to check the site"
- Multi-market regimes: "See how Europe and Asia compare to the US regime signal"

CTA: "Join the waitlist for early access"
Email field (pre-filled if already signed up) + feature preference checkboxes.
Track per-feature waitlist count in Supabase to prioritise what to build next.

---

## Email Logic

### Two schedulers — keep them separate

**Daily at 6am UTC — geopolitical synthesis:**
1. Run AI synthesis API call
2. Read current geopolitical events
3. Update override signal in Supabase
4. If override changes, trigger immediate alert email to event subscribers

**On FRED release dates — economic data:**
1. Pull latest FRED data after scheduled release time
2. Recalculate regime signal
3. Check for early transition signals
4. Compare to previous stored signal
5. Send appropriate email to alert subscribers

### Email types

**Regime unchanged:**
Subject: "[Release] — Regime unchanged — Stagflation"
Body: what the data showed, why regime held, current positioning unchanged, next release to watch

**Early signal detected:**
Subject: "[Release] — Early [regime] signal detected"
Body: which indicator moved, what it means, starter position suggestion if applicable, what needs to happen for full confirmation

**Regime confirmed:**
Subject: "Regime shift confirmed — [old] to [new]"
Body: what triggered the shift, new picks and avoids, suggested rebalancing with allocation calculator output, link to site

**Geopolitical override change:**
Subject: "Geopolitical signal updated — [what changed]"
Body: what event triggered the update, how it affects the regime read, whether it contradicts or confirms FRED data

**Weekly Macro Pulse (every Tuesday 8am UTC):**
Subject: "Weekly Macro Pulse — [date]"
Body: current regime + months, this week's releases + what to watch, live triggers status, current allocation + any early signals, one line on what would change the regime

---

## Regime Smoothing — Three Modes

The user selects an approach mode that controls how aggressively the framework acts on regime signals. Mode is persisted in localStorage so it's remembered across visits.

### Conservative
- Requires **2 consecutive months** to confirm a regime change
- **No early rotation** — waits for full confirmation before recommending any allocation changes
- Lowest risk, latest to act
- Email alerts: only on confirmed regime shifts

### Active (default)
- Requires **1 month** to confirm a regime change
- **5-10% starter positions** in incoming regime's asset classes when early signals fire
- Balanced approach — acts on strong early signals but doesn't go all-in before confirmation
- Email alerts: on early signals + confirmed shifts

### Aggressive
- **No smoothing** — acts immediately when indicators flicker toward a new regime
- **15-25% early rotation** into incoming regime's positions before confirmation
- Highest risk, earliest to act — captures opportunities before confirmation but exposed to false signals
- Email alerts: on every indicator flicker, early signals, and confirmed shifts

### How mode affects each section
- **Section 1 (Regime Indicator)** — Conservative may show "Confirmed: Reflation" while Aggressive shows "Confirmed: Stagflation" (if 1 month of data points to Stagflation but not yet 2)
- **Section 3 (Allocation)** — Early rotation column appears for Medium/Aggressive when signals fire; Aggressive shows larger early positions
- **Section 3 (Calculator)** — Kelly fraction and cash reserve adjust per mode (Aggressive deploys more, Conservative holds more cash)
- **Email alerts** — frequency and trigger sensitivity varies per mode
- **Section 5 (Triggers)** — same triggers shown for all modes, but the "action" text adjusts per mode

### Mode selector
A toggle at the top of the page (below the site header, above the regime indicator). Three buttons: Conservative | Active | Aggressive. Persisted in localStorage.

### Important: never hide information
All modes show the same underlying data (FRED signals, geo signals, early transition indicators). The mode only changes the **recommended action** and **when to act**. A Conservative user can still see that indicators are flickering — they just won't see an early rotation recommendation.

---

## Database Schema (Supabase)

**regime_signals**
id, date, confirmed_regime, early_signal_regime (nullable), growth_signal, inflation_signal, signal_source, raw_indicators (JSON), geopolitical_override (boolean), created_at

**asset_performance**
id, regime_start_date, ticker, name, return_pct, price_assessment (attractive/fair/extended), category, updated_at

**regime_backtest**
id, period_start, period_end, regime, duration_months, picks_return, spy_return, outperformed (boolean), allocation (JSON)

**economic_calendar**
id, release_name, release_date, impact_level, regime_implication, result_summary (filled after release), regime_changed (boolean), created_at

**email_subscribers**
id, email, event_alerts (boolean), regime_alerts (boolean), weekly_pulse (boolean), waitlist_features (JSON), created_at, confirmed

---

## Build Order

Build in this exact sequence:

1. [x] Frontend with static hardcoded data — shareable URL from this point ✅ 2026-04-01
2. [x] Connect live regime data — wire Sections 1 and 2 to existing Python tool via FastAPI ✅ 2026-04-01
3. [x] Add allocation calculator — connect Kelly sizing logic to Part B of Section 3 ✅ 2026-04-01
4. [x] Add smart buy guidance — connect price assessment logic to Part A of Section 3 ✅ 2026-04-01
5. [x] Add calendar and triggers — wire weekly checklist to Sections 4 and 5 ✅ 2026-04-01
6. [x] Build and populate backtesting section — data already pre-computed in cache, build Section 7 UI ✅ 2026-04-01
7. [x] Add Regime Playbook — Section 6 as expandable cards ✅ 2026-04-01 (built in Step 1, static content)
8. [x] Add email capture and Resend — unified signup, welcome emails ✅ 2026-04-01 (local JSON storage, Resend/Supabase for production)
9. [x] Build email alert logic — both cron schedulers and all four email types ✅ 2026-04-02
10. [x] Add Coming Soon waitlist — Section 9 with per-feature tracking ✅ 2026-04-01
11. [x] Polish and deploy — Vercel + Railway production ✅ 2026-04-01 (deploy-ready, needs Railway/Vercel accounts)

### Post-MVP Enhancements

12. [ ] Add welcome section (Section 0) — context for first-time visitors ← **NEXT**
13. [ ] Add regime smoothing modes — Conservative/Medium/Aggressive selector + localStorage persistence
14. [ ] Wire modes to backend — adjust regime confirmation, Kelly sizing, early rotation per mode
15. [ ] Wire modes to email alerts — frequency and trigger sensitivity per mode
16. [ ] Deploy and test modes end-to-end

---

## Out of Scope for MVP

- User accounts or authentication
- Blog or CMS
- Payment processing
- Mobile push notifications
- Social login
- Comments or community features

---

## Critical Notes

- Do not rewrite the core Python logic. Read the existing codebase first, then wrap it.
- Check backtesting data availability before building Section 7.
- Two separate schedulers — geopolitical synthesis runs daily, FRED pull runs on release dates.
- Early signals surface immediately — never hold them waiting for smoothing confirmation.
- No user data stored from the allocation calculator.
- Worst performing regime call must appear in the history scorecard.
- Every allocation output must include: "This is a systematic framework output, not personalised financial advice."

---

## Codebase Audit (2026-04-01)

Performed full exploration of existing codebase and macro-pulse scaffold before starting build.

### Existing Python Tool — Ready to Wrap
All core logic is implemented and producing data:
- `macro/quadrant.py` — `get_quadrant()` returns regime + growth/inflation scores
- `macro/geopolitical.py` — `get_geopolitical_risks()` + `get_synthesis()` returns AI risk assessment
- `macro/performance.py` — `get_regime()` + `get_return()` for ETF performance tracking
- `macro_kelly.py` — `get_current_regime()`, `REGIME_ETFS`, `kelly_fraction()`, `get_etf_timing()`
- `macro/snapshot.py` — `save_snapshot()` / `load_snapshots()` for daily history
- `macro/thresholds.py` — all trigger thresholds (oil, CPI, Hormuz, Fed rates)
- `macro/transition.py` — early regime change warnings
- `portfolio.py` — holdings tracking, drift calculation

### Key Data Shapes Available in Cache
- `geo_synthesis.json` — headline, bull/bear cases, etf_convictions (0.5-1.0), calendar_scenarios
- `backtest_results.json` — overall win rates, per-regime Kelly fractions, picks vs SPY stats
- `backtest_etf_*.json` — 21 files covering all ETFs and FRED series (pre-computed 2007-2026)
- `snapshots.jsonl` — daily time series with regime, prices, geo events

### Macro-Pulse Scaffold State
- Frontend: Next.js 14.2.35 with Tailwind — **default create-next-app boilerplate, zero custom code**
- Backend: empty directory, no files
- `package-lock.json` is 0 bytes — needs `npm install` before dev server works
- No Supabase, Resend, or external services configured

### Important Finding: Backtest Data Exists
The spec says "check whether ETF performance per regime period is already stored." Answer: **YES** — 21 backtest cache files exist (generated 2026-03-30). No need to recalculate for Section 7. Updated build step 6 to reflect this.

### Backend Wrapping Challenge
All Python functions currently print to stdout. FastAPI endpoints will need to capture return values. Most functions do return data structures before printing — need to verify per-function during Step 2.

### Backtest Results — Framing Note
Overall picks-beat-SPY rate: 44.2%. But Stagflation-specific: 53.6% win rate with 1.66 win/loss ratio (half-Kelly = 12.8%). Framework is strongest in crisis regimes. The "worst call" requirement in Section 7 will be important for credibility — don't hide the aggregate numbers.

---

## Decisions Log

(Claude Code appends here as decisions are made during the build)

- 2026-03-31 — Spec v3 created. Project not yet started.
- 2026-04-01 — Full codebase audit completed. All build steps confirmed as not started. Backtest data confirmed pre-computed (21 cache files). Frontend is default Next.js boilerplate. Backend directory empty. Next step: Build Step 1 (static frontend).
- 2026-04-01 — **Step 11 complete.** Polish pass: added `apiUrl()` abstraction for production API URL (`NEXT_PUBLIC_API_URL` env var), CORS configurable via `CORS_ORIGINS` env var, CSS fade-in transitions on sections, pulse loading animation. Deployment files: `requirements.txt`, `Procfile`, `railway.json` for backend; `.env.example` for both. All 7 endpoints verified working through full Next.js→FastAPI stack: regime, performance, allocation, calculate, calendar, triggers, backtest, subscribe. Production build: 100kB first load JS. Ready to deploy — just needs Railway account (backend) and Vercel account (frontend).
- 2026-04-01 — **Steps 6-8, 10 complete.** `GET /api/backtest` serves 52 real regime periods (2007-2026) built from FRED regime timeline + cached ETF prices. Returns per-period picks vs SPY returns, scorecard (44.2% outperformance, best call: Stagflation 2025-12 +16.0% vs SPY +0.9%, worst call: Reflation 2013-08 +9.6% vs SPY +25.1%), per-regime breakdown with Kelly fractions. RegimeHistory component now has clickable regime filter cards. `POST /api/subscribe` stores emails to local JSON (Supabase migration for production). All 3 email forms (triggers, newsletter, waitlist) wired to backend. Step 9 (cron schedulers + Resend) deferred to deployment.
- 2026-04-01 — **Step 5 complete.** Two new endpoints: `GET /api/calendar` returns economic releases with AI-generated scenario analysis from synthesis cache (CPI high/low/inline, FOMC hold/hike/cut scenarios) + hardcoded FRED release schedule. `GET /api/triggers` returns 6 AI-generated regime triggers from cache with normalized status (crisis/watch/stable). WeeklyCalendar now shows expandable scenario cards. RegimeTriggers fetches live trigger data.
- 2026-04-01 — **Steps 3+4 complete.** Two new endpoints: `GET /api/allocation` returns regime-weighted ETF picks with live price assessments (RSI/SMA timing scores from yfinance → Still attractive/Fairly valued/Extended), dynamic AI conviction overrides from synthesis cache, and avoid list. `POST /api/calculate` accepts portfolioSize + cashAvailable + currency, returns Kelly-sized allocations with cash reserve (20% AI-recommended). Example: €100k portfolio, €25k cash → Kelly deploys €12,776 across 5 ETFs with €20k cash reserve. Frontend PortfolioAllocation component now fetches live data with mock fallback, calculator POSTs to backend.
- 2026-04-01 — **Step 2 complete.** FastAPI backend at `macro-pulse/backend/main.py` with two endpoints: `GET /api/regime` (Section 1 data — confirmed regime, FRED/geo signals, lag warning, early transition, consecutive months) and `GET /api/performance` (Section 2 data — ETF returns since regime start, pick/avoid/benchmark categories). Frontend components fetch live data with fallback to mock. Next.js rewrites proxy `/api/*` to FastAPI on port 8000. Geo cache refreshed via Anthropic API on first call (24h TTL). Note: geopolitical fetch shows "Expecting value" error when cache is stale and API key not set — falls back to stale cache gracefully.
- 2026-04-01 — **Step 1 complete.** Built all 9 sections with hardcoded mock data matching real Python tool output shapes. Tech: Next.js 14 + Tailwind + GeistMono font. Dark terminal aesthetic (#0a0a0a). All sections render, production build passes. Components: RegimeIndicator, AssetPerformance, PortfolioAllocation (with working client-side calculator), WeeklyCalendar, RegimeTriggers + email capture, RegimePlaybook (expandable cards), RegimeHistory (timeline + scorecard), Newsletter (with preview), ComingSoon (waitlist). Mock data in src/lib/mockData.ts — designed to match exact shapes from Python cache files for easy swap to API calls in Step 2. Note: recharts installed but not yet used (bar chart in Section 3 uses pure CSS bars). Backtesting interactive chart (Section 7 Part A) deferred to Step 6 when real data is wired.

---

## Legal Disclaimer & Compliance

### Context
This site operates as a financial education and information platform, not a financial advisory service. This distinction is legally important under Norwegian law (Finanstilsynet) and EU MiFID II regulations which Norway follows through the EEA agreement.

### What This Site Is
- A systematic framework tool based on Ray Dalio's publicly documented macro research
- An educational resource explaining how economic regimes affect asset class performance
- A backtested historical analysis tool
- A public research publication

### What This Site Is Not
- A personalised financial advisory service
- A licensed investment manager
- A guaranteed return product
- A fiduciary service of any kind

### Required Disclaimers — Add to Every Section

Add this footer disclaimer to every page and every section that shows allocation data:

"This website is for educational and informational purposes only. Nothing on this site constitutes personalised financial advice. All analysis is generated systematically from public economic data using Ray Dalio's macro framework. Past performance does not guarantee future results. Always consult a qualified financial advisor before making investment decisions."

### Specific Framing Rules — Enforce Throughout

These rules apply to every piece of copy on the site:

NEVER write:
- "You should buy X"
- "We recommend buying X"
- "Buy X now"
- Any language implying personalised advice

ALWAYS write:
- "The framework indicates X historically performs in this regime"
- "The model suggests X based on current conditions"
- "Historically, X has outperformed in Stagflation regimes"
- "The systematic output for this regime is X"

The tool speaks. The site explains the tool. The user decides.

### Performance Statistics Rules

Every backtested number must be accompanied by:
- The word "backtested" or "historical"
- The specific date range it covers
- A note that past performance does not guarantee future results

Never present backtested returns without these qualifiers. Never imply future performance.

### Pages to Build

Add two new pages to the site (not in the original scope — add now):

**1 — Disclaimer Page (/disclaimer)**

Sections:
- What this site is and is not
- How the framework works and its limitations
- Data sources and their known limitations (FRED lag, China data reliability)
- Backtesting methodology and constraints
- Regime smoothing explanation and why signals can be wrong
- Contact information
- Link to Finanstilsynet consumer guidance for Norwegian users
- Link to EU MiFID II investor protection information

**2 — Terms of Service Page (/terms)**

Standard ToS covering:
- Acceptance of educational-only nature of the content
- No liability for investment decisions made based on site content
- No guarantee of accuracy or completeness
- Intellectual property of the framework presentation
- User responsibility for their own investment decisions

Both pages linked in the footer of every page. Required reading before using the allocation calculator — add a checkbox: "I understand this tool is for educational purposes only and does not constitute financial advice" before the calculator outputs are shown.

### Decisions Log Update
- 2026-04-01 — Legal disclaimer framework added to spec. Site must operate as educational platform only. Never personalised advice. Disclaimers required on every page and every allocation output.
- 2026-04-02 — **Post-MVP features added to spec.** (1) Welcome section (Section 0) above regime indicator — provides context for first-time visitors with tagline, 4-season explainer cards, and 3-step "how it works". (2) Three regime smoothing modes — Conservative (2mo confirmation, no early rotation), Medium (1mo, 5-10% starters), Aggressive (no smoothing, 15-25% early rotation). Mode persisted in localStorage, defaults to Active. Affects regime confirmation, allocation weights, Kelly sizing, calculator output, and email alert frequency. Fallback plan: if three modes too complex, simplify to Conservative + Active.
