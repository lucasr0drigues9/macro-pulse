# Superinvestor Tracker — Phase 1

Ranks stocks by how many top investors hold them, weighted by conviction level.

## Setup

```bash
pip install -r requirements.txt
python main.py
```

## How it works

1. `investors.py` — defines the investor list and scrapes their holdings from Dataroma
2. `ranking.py`  — scores each stock based on how many weighted investors hold it
3. `main.py`     — runs everything and prints the ranked leaderboard

## Investor weights

Weights live in `investors.py` under the `INVESTORS` list.
Increase a weight if you trust that investor's picks more.

## Roadmap

- **Phase 2**: Factor in Buy / Add / Trim / Sell actions, not just current holdings
- **Phase 3**: Add YouTube transcript + article sentiment via AI (Anthropic API)
- **Phase 4**: Streamlit dashboard with weekly refresh

