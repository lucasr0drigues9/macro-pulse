"""
Macro Pulse — Email system
Sends alerts and weekly newsletter via Resend.
"""

import os
import json
import resend

RESEND_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "Macro Pulse <onboarding@resend.dev>")
SITE_URL = os.getenv("SITE_URL", "https://macro-pulse.vercel.app")

SUBSCRIBERS_FILE = None  # Set by main.py

DISCLAIMER = (
    "This is a systematic framework output for educational purposes only. "
    "It does not constitute personalised financial advice. "
    "Past performance does not guarantee future results. "
    "Always consult a qualified financial advisor before making investment decisions."
)

REGIME_COLORS = {
    "Stagflation": "#ef4444",
    "Goldilocks": "#22c55e",
    "Reflation": "#eab308",
    "Deflation": "#3b82f6",
}


def _load_subscribers(filter_field: str = None) -> list[dict]:
    """Load subscribers, optionally filtered by a boolean field."""
    if not SUBSCRIBERS_FILE or not os.path.exists(SUBSCRIBERS_FILE):
        return []
    try:
        with open(SUBSCRIBERS_FILE) as f:
            subs = json.load(f)
        if filter_field:
            return [s for s in subs if s.get(filter_field, False)]
        return subs
    except Exception:
        return []


def _send(to: str, subject: str, html: str) -> bool:
    """Send a single email via Resend."""
    if not RESEND_KEY:
        print(f"  [email] No RESEND_API_KEY — would send to {to}: {subject}")
        return False
    try:
        resend.api_key = RESEND_KEY
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as e:
        print(f"  [email] Failed to send to {to}: {e}")
        return False


def _email_wrapper(title: str, body: str) -> str:
    """Wrap email body in dark-themed HTML template."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',monospace;color:#e0e0e0;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="text-align:center;padding:8px 0;border-bottom:1px solid #222;margin-bottom:24px;">
        <span style="font-size:11px;letter-spacing:3px;color:#888;text-transform:uppercase;">Macro Pulse</span>
    </div>
    <h1 style="font-size:20px;color:#e0e0e0;margin:0 0 16px;">{title}</h1>
    {body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #222;">
        <p style="font-size:10px;color:#555;line-height:1.5;">{DISCLAIMER}</p>
        <p style="font-size:10px;color:#333;margin-top:8px;">
            <a href="{SITE_URL}" style="color:#555;">View dashboard</a> ·
            <a href="{SITE_URL}/disclaimer" style="color:#555;">Disclaimer</a>
        </p>
    </div>
</div>
</body>
</html>"""


def _regime_badge(regime: str) -> str:
    color = REGIME_COLORS.get(regime, "#888")
    return f'<span style="color:{color};font-weight:bold;">{regime}</span>'


# ── Email Types ──────────────────────────────────────────


def send_trigger_movement(trigger_name: str, previous_value: str, current_value: str,
                          threshold: str, regime: str, analysis: str) -> int:
    """A trigger moved significantly — not a regime change, but worth watching."""
    subject = f"Trigger update: {trigger_name}"
    body = f"""
    <div style="background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.3);border-radius:8px;padding:16px;margin:0 0 16px;">
        <p style="margin:0;font-size:11px;color:#eab308;text-transform:uppercase;letter-spacing:1px;">Trigger Movement</p>
        <p style="margin:8px 0 0;font-size:18px;font-weight:bold;color:#e0e0e0;">{trigger_name}</p>
        <div style="margin:12px 0 0;display:flex;gap:24px;">
            <div>
                <p style="margin:0;font-size:10px;color:#555;">Previous</p>
                <p style="margin:2px 0 0;font-size:14px;color:#888;">{previous_value}</p>
            </div>
            <div>
                <p style="margin:0;font-size:10px;color:#555;">Now</p>
                <p style="margin:2px 0 0;font-size:14px;color:#e0e0e0;font-weight:bold;">{current_value}</p>
            </div>
            <div>
                <p style="margin:0;font-size:10px;color:#555;">Threshold</p>
                <p style="margin:2px 0 0;font-size:14px;color:#eab308;">{threshold}</p>
            </div>
        </div>
    </div>
    <p style="color:#888;font-size:13px;line-height:1.6;">{analysis}</p>
    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:12px;margin:16px 0;">
        <p style="margin:0;font-size:12px;color:#eab308;">⚠ This is a notable movement, not a regime change signal. For it to indicate a real transition, it needs to be sustained over a period of time. One data point is not a trend.</p>
    </div>
    <p style="text-align:center;margin:16px 0;">
        <a href="{SITE_URL}" style="background:#222;color:#e0e0e0;padding:10px 24px;border-radius:4px;text-decoration:none;font-size:13px;">View triggers →</a>
    </p>
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("regimeAlerts")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent


def send_event_breakdown(event_name: str, regime: str, analysis: str,
                         impact_on_regime: str, action_needed: str,
                         next_release: str) -> int:
    """Post-event breakdown — what happened, what it means, what to do."""
    subject = f"{event_name} — What it means for {regime}"
    body = f"""
    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin:0 0 16px;">
        <p style="margin:0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;">Event Analysis</p>
        <p style="margin:8px 0 0;font-size:16px;font-weight:bold;color:#e0e0e0;">{event_name}</p>
    </div>
    <h3 style="font-size:13px;color:#e0e0e0;margin:16px 0 4px;">What happened</h3>
    <p style="color:#888;font-size:13px;line-height:1.6;">{analysis}</p>
    <h3 style="font-size:13px;color:#e0e0e0;margin:16px 0 4px;">Impact on {regime}</h3>
    <p style="color:#888;font-size:13px;line-height:1.6;">{impact_on_regime}</p>
    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;">Action</p>
        <p style="margin:8px 0 0;font-size:13px;color:#e0e0e0;">{action_needed}</p>
    </div>
    <p style="font-size:12px;color:#555;">Next release to watch: {next_release}</p>
    <p style="text-align:center;margin:16px 0;">
        <a href="{SITE_URL}" style="background:#222;color:#e0e0e0;padding:10px 24px;border-radius:4px;text-decoration:none;font-size:13px;">View dashboard →</a>
    </p>
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("eventAlerts")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent


def send_regime_unchanged(release_name: str, regime: str, summary: str, next_release: str) -> int:
    """After an economic release — regime held steady."""
    subject = f"{release_name} — Regime unchanged — {regime}"
    body = f"""
    <p style="color:#888;font-size:14px;">{summary}</p>
    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:14px;">Current regime: {_regime_badge(regime)}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#888;">Positioning unchanged. No action needed.</p>
    </div>
    <p style="font-size:12px;color:#555;">Next release to watch: {next_release}</p>
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("eventAlerts")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent


def send_early_signal(release_name: str, current_regime: str, target_regime: str,
                      indicator: str, explanation: str) -> int:
    """An indicator is flickering toward a new regime."""
    subject = f"{release_name} — Early {target_regime} signal detected"
    body = f"""
    <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#3b82f6;font-weight:bold;">Early signal: {target_regime}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#888;">{indicator} moved — {explanation}</p>
    </div>
    <p style="font-size:14px;color:#888;">Current confirmed regime remains {_regime_badge(current_regime)}. This is an early warning, not a confirmed shift.</p>
    <p style="font-size:12px;color:#888;">The framework historically suggests small starter positions (5-10%) in the incoming regime's asset classes before confirmation.</p>
    <p style="font-size:12px;color:#555;">Full rotation only if confirmed next month.</p>
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("eventAlerts")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent


def send_regime_shift(old_regime: str, new_regime: str, trigger: str,
                      new_picks: list[str], new_avoids: list[str]) -> int:
    """Confirmed regime change."""
    subject = f"Regime shift confirmed — {old_regime} → {new_regime}"
    picks_html = "".join(f'<li style="color:#22c55e;font-size:13px;">{p}</li>' for p in new_picks)
    avoids_html = "".join(f'<li style="color:#ef4444;font-size:13px;">{p}</li>' for p in new_avoids)
    body = f"""
    <div style="background:{REGIME_COLORS.get(new_regime, '#888')}15;border:1px solid {REGIME_COLORS.get(new_regime, '#888')}40;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#888;">{old_regime} →</p>
        <p style="margin:4px 0;font-size:28px;font-weight:bold;color:{REGIME_COLORS.get(new_regime, '#888')};">{new_regime}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#888;">Confirmed</p>
    </div>
    <p style="font-size:14px;color:#888;">{trigger}</p>
    <div style="display:flex;gap:16px;margin:16px 0;">
        <div style="flex:1;">
            <p style="font-size:11px;color:#22c55e;text-transform:uppercase;letter-spacing:1px;">New picks</p>
            <ul style="padding-left:16px;margin:4px 0;">{picks_html}</ul>
        </div>
        <div style="flex:1;">
            <p style="font-size:11px;color:#ef4444;text-transform:uppercase;letter-spacing:1px;">New avoids</p>
            <ul style="padding-left:16px;margin:4px 0;">{avoids_html}</ul>
        </div>
    </div>
    <p style="text-align:center;margin:16px 0;">
        <a href="{SITE_URL}" style="background:#222;color:#e0e0e0;padding:10px 24px;border-radius:4px;text-decoration:none;font-size:13px;">View full allocation →</a>
    </p>
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("regimeAlerts")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent


def send_geo_override(event: str, geo_regime: str, fred_regime: str, explanation: str) -> int:
    """Geopolitical signal changed."""
    subject = f"Geopolitical signal updated — {event}"
    body = f"""
    <p style="font-size:14px;color:#888;">{explanation}</p>
    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin:16px 0;">
        <div style="display:flex;justify-content:space-between;">
            <div>
                <p style="font-size:11px;color:#555;text-transform:uppercase;">Geopolitical</p>
                <p style="font-size:18px;font-weight:bold;color:{REGIME_COLORS.get(geo_regime, '#888')};">{geo_regime}</p>
            </div>
            <div style="text-align:right;">
                <p style="font-size:11px;color:#555;text-transform:uppercase;">FRED</p>
                <p style="font-size:18px;font-weight:bold;color:{REGIME_COLORS.get(fred_regime, '#888')};">{fred_regime}</p>
            </div>
        </div>
    </div>
    <p style="font-size:12px;color:#555;">When geopolitical and FRED signals diverge, the framework weights the more current signal (geopolitical) while monitoring FRED for confirmation or reversion.</p>
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("regimeAlerts")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent


def send_weekly_pulse(regime: str, months: int, fred_regime: str, geo_regime: str,
                      picks: list[dict], triggers: list[dict],
                      calendar: list[dict], bull_trigger: str, bear_trigger: str) -> int:
    """Weekly Macro Pulse — Tuesday newsletter."""
    from datetime import datetime
    date_str = datetime.now().strftime("%B %d, %Y")
    subject = f"Weekly Macro Pulse — {date_str}"

    picks_rows = ""
    for p in picks:
        picks_rows += f'<tr><td style="padding:4px 8px;color:#e0e0e0;font-size:13px;">{p["ticker"]}</td><td style="padding:4px 8px;color:#888;font-size:13px;">{p["name"]}</td><td style="padding:4px 8px;text-align:right;color:#888;font-size:13px;">{p.get("weight", "")}%</td></tr>'

    triggers_html = ""
    for t in triggers[:4]:
        status_color = {"crisis": "#ef4444", "watch": "#eab308", "stable": "#22c55e"}.get(t.get("status", "stable"), "#888")
        triggers_html += f'<p style="font-size:12px;color:#888;margin:4px 0;"><span style="color:{status_color};">●</span> {t["name"]}: {t["current"]}</p>'

    calendar_html = ""
    for c in calendar[:3]:
        calendar_html += f'<p style="font-size:12px;color:#888;margin:4px 0;">• {c["name"]} ({c["date"]}) — {c.get("implication", "")[:80]}</p>'

    lag_note = ""
    if fred_regime != geo_regime:
        lag_note = f'<p style="font-size:12px;color:#eab308;margin:8px 0;">⚠ FRED says {fred_regime}. Geopolitical says {geo_regime}. Framework weights the more current signal.</p>'

    body = f"""
    <div style="background:{REGIME_COLORS.get(regime, '#888')}15;border:1px solid {REGIME_COLORS.get(regime, '#888')}40;border-radius:8px;padding:16px;margin:0 0 16px;text-align:center;">
        <p style="margin:0;font-size:24px;font-weight:bold;color:{REGIME_COLORS.get(regime, '#888')};">{regime}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#888;">{months}th consecutive month</p>
    </div>
    {lag_note}

    <h2 style="font-size:14px;color:#e0e0e0;margin:24px 0 8px;border-bottom:1px solid #222;padding-bottom:4px;">Current Allocation</h2>
    <table style="width:100%;border-collapse:collapse;">{picks_rows}</table>

    <h2 style="font-size:14px;color:#e0e0e0;margin:24px 0 8px;border-bottom:1px solid #222;padding-bottom:4px;">Triggers</h2>
    {triggers_html}

    <h2 style="font-size:14px;color:#e0e0e0;margin:24px 0 8px;border-bottom:1px solid #222;padding-bottom:4px;">This Week</h2>
    {calendar_html}

    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:12px;margin:16px 0;">
        <p style="font-size:12px;color:#555;margin:0;">What would change this:</p>
        <p style="font-size:12px;color:#22c55e;margin:4px 0 0;">Bull: {bull_trigger}</p>
        <p style="font-size:12px;color:#ef4444;margin:4px 0 0;">Bear: {bear_trigger}</p>
    </div>
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("weeklyPulse")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent
