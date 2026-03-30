import streamlit as st
import sys

# ── Page config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Superinvestor Tracker",
    page_icon="📊",
    layout="wide",
)

# ── Styling ────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    .main { background-color: #0e1117; }
    .stock-card {
        background: #1a1f2e;
        border: 1px solid #2d3748;
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 10px;
    }
    .stock-rank { color: #718096; font-size: 13px; }
    .stock-name { color: #e2e8f0; font-size: 18px; font-weight: 700; }
    .stock-ticker { color: #63b3ed; font-size: 14px; font-weight: 600; }
    .stock-price { color: #e2e8f0; font-size: 15px; }
    .tag {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-right: 6px;
    }
    .tag-new { background: #1a3a2a; color: #68d391; border: 1px solid #68d391; }
    .tag-holding { background: #1a2a3a; color: #63b3ed; border: 1px solid #63b3ed; }
    .tag-good { background: #1a3a2a; color: #68d391; }
    .tag-fair { background: #3a3020; color: #f6ad55; }
    .tag-expensive { background: #3a1a1a; color: #fc8181; }
    .tag-trap { background: #3a2a10; color: #f6ad55; }
    .summary-line { color: #a0aec0; font-size: 14px; margin-top: 8px; }
    .score-badge {
        float: right;
        background: #2d3748;
        color: #e2e8f0;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 700;
    }
</style>
""", unsafe_allow_html=True)

# ── Header ─────────────────────────────────────────────────────────────────────
st.title("📊 Superinvestor Tracker")
st.markdown("*Track what the world's best investors are buying — and whether now is a good time to enter.*")

# ── Mode selector ──────────────────────────────────────────────────────────────
col1, col2 = st.columns([2, 1])
with col1:
    mode = st.radio(
        "Select mode",
        ["🇺🇸 US Superinvestors", "🇳🇴 Nordic Funds (ESG)"],
        horizontal=True,
    )
with col2:
    run_btn = st.button("🔄 Refresh Data", type="primary", use_container_width=True)

st.divider()

# ── Cache + fetch logic ────────────────────────────────────────────────────────
@st.cache_data(ttl=3600, show_spinner=False)  # cache for 1 hour
def load_data(selected_mode: str):
    if "Nordic" in selected_mode:
        from investors_nordic import get_all_holdings
    else:
        from investors import get_all_holdings

    from ranking import rank_stocks
    from prices import enrich_with_prices
    from analysis import enrich_with_analysis

    all_holdings = get_all_holdings()
    ranked       = rank_stocks(all_holdings)
    ranked       = enrich_with_prices(ranked[:20])
    ranked       = enrich_with_analysis(ranked)
    return ranked

if run_btn:
    st.cache_data.clear()

# ── Load data ──────────────────────────────────────────────────────────────────
with st.spinner("Fetching holdings, prices and AI analysis... (this takes ~2 minutes on first run)"):
    try:
        ranked = load_data(mode)
    except Exception as e:
        st.error(f"Error loading data: {e}")
        st.stop()

# ── Helper: entry label → CSS class ───────────────────────────────────────────
def entry_class(label: str) -> str:
    if "✅" in label:    return "tag-good"
    if "⚠️" in label and "trap" in label: return "tag-trap"
    if "⚠️" in label:   return "tag-fair"
    if "❌" in label:    return "tag-expensive"
    return ""

def signal_class(signal: str) -> str:
    return "tag-new" if "NEW" in signal else "tag-holding"

def make_summary(analysis: str) -> str:
    """Extract a one-line summary from the full analysis."""
    if not analysis or "unavailable" in analysis.lower():
        return "Analysis not available."
    # First sentence only
    sentences = analysis.replace("...", "…").split(". ")
    return sentences[0].strip() + "." if sentences else analysis[:120]

# ── Render cards ───────────────────────────────────────────────────────────────
st.subheader(f"Top 20 Stocks — {mode}")

for i, stock in enumerate(ranked, 1):
    price_info  = stock.get("price_info", {})
    price_label = price_info.get("label", "❓ no data")
    price       = price_info.get("price", "")
    price_str   = f"${price:.2f}" if isinstance(price, float) else "—"
    symbol      = stock.get("symbol", "?")
    company     = stock["ticker"]
    signal      = stock.get("signal", "")
    score       = stock.get("score", 0)
    analysis    = stock.get("analysis", "")
    investors   = ", ".join(set(stock.get("investors", [])))
    summary     = make_summary(analysis)

    with st.container():
        # Card header
        st.markdown(f"""
        <div class="stock-card">
            <span class="stock-rank">#{i}</span>
            <span class="score-badge">Score {score}</span>
            <span class="stock-name">{company}</span>
            &nbsp;<span class="stock-ticker">{symbol}</span>
            &nbsp;<span class="stock-price">{price_str}</span>
            <br><br>
            <span class="tag {signal_class(signal)}">{signal}</span>
            <span class="tag {entry_class(price_label)}">{price_label}</span>
            <br>
            <div class="summary-line">💬 {summary}</div>
        </div>
        """, unsafe_allow_html=True)

        # Expandable full analysis
        if analysis and "unavailable" not in analysis.lower():
            with st.expander(f"📖 Full analysis — {symbol}"):
                st.markdown(f"**{company} ({symbol})**")
                st.markdown(analysis)
                st.caption(f"Held by: {investors}")

st.divider()
st.caption("Data sources: SEC EDGAR 13F filings · Yahoo Finance · Anthropic Claude with web search")
st.caption("⚠️ Not financial advice. Do your own research before investing.")
