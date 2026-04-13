"""
Macro World View — Email system
Sends alerts and weekly newsletter via Resend.
Uses Resend Audiences for persistent subscriber storage.
"""

import os
import json
import logging
import urllib.parse
import resend

logger = logging.getLogger("macro_pulse.emails")
logging.basicConfig(level=logging.INFO)

RESEND_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "Macro World View <hello@macroworldview.com>")
SITE_URL = os.getenv("SITE_URL", "https://macroworldview.com")
AUDIENCE_ID = os.getenv("RESEND_AUDIENCE_ID", "")
ADMIN_ALERT_EMAIL = os.getenv("ADMIN_ALERT_EMAIL", "lucasrodrigues12000@gmail.com")

SUBSCRIBERS_FILE = None  # Legacy fallback — set by main.py


class SubscribeResult:
    """Outcome of a subscribe attempt — never lies about persistence."""
    def __init__(self, ok: bool, persisted_to: str | None, error: str | None = None,
                 already_existed: bool = False):
        self.ok = ok
        self.persisted_to = persisted_to  # "resend" | "file" | None
        self.error = error
        self.already_existed = already_existed

    def to_dict(self) -> dict:
        return {
            "ok": self.ok,
            "persistedTo": self.persisted_to,
            "alreadyExisted": self.already_existed,
            "error": self.error,
        }

DISCLAIMER = (
    "This is a systematic framework output for educational purposes only. "
    "It does not constitute personalised financial advice. "
    "Past performance does not guarantee future results. "
    "Always consult a qualified financial advisor before making investment decisions."
)

# Contextual welcome copy per signup source — used by send_welcome()
WELCOME_COPY = {
    "home_weekly_pulse": {
        "heading": "You're in. First briefing lands Tuesday.",
        "body": "Every Tuesday morning you'll get the full Macro World View: current regime, triggers that moved, what the framework says to own, and the economic releases to watch this week.",
    },
    "home_regime_alerts": {
        "heading": "You're tracking the transition.",
        "body": "You'll be notified when the current economic regime shifts, when key triggers fire, or when new analysis drops on the site.",
    },
    "world_order": {
        "heading": "You're tracking the world order.",
        "body": "You'll be notified when a country's alliance position shifts — UN voting changes, major treaties, or power-score movements across the 30 tracked nations.",
    },
    "us_overextension": {
        "heading": "You're tracking US overextension.",
        "body": "You'll be notified when key Dalio indicators shift — debt milestones, new military commitments, or reserve-currency changes.",
    },
    "china": {
        "heading": "You're tracking China's real economy.",
        "body": "You'll be notified when proxy indicators (electricity, PMI, port throughput, copper imports) shift significantly or when Taiwan risk level changes.",
    },
    "emerging_markets": {
        "heading": "You're tracking emerging markets.",
        "body": "You'll be notified when a significant shift occurs in any of the six tracked economies or when European autonomy spending creates new demand.",
    },
    "europe": {
        "heading": "You're tracking European autonomy.",
        "body": "Quarterly updates on European strategic autonomy milestones, policy shifts, and company developments.",
    },
    "regime_triggers": {
        "heading": "You're watching the triggers.",
        "body": "You'll be notified the moment a regime-change trigger fires or the current regime shifts.",
    },
    "transition_outlook": {
        "heading": "You're watching the transition.",
        "body": "You'll be notified when triggers start firing, so you can act at the right time.",
    },
    "weekly_calendar": {
        "heading": "You're watching the calendar.",
        "body": "After each economic release you'll get a plain-English summary of what the data showed and whether your allocation needs to adjust.",
    },
    "coming_soon": {
        "heading": "You're on the waitlist.",
        "body": "We'll let you know when the features you flagged are ready for early access.",
    },
    "default": {
        "heading": "You're subscribed.",
        "body": "Thanks for signing up to Macro World View. We'll be in touch with updates from the framework.",
    },
}

REGIME_COLORS = {
    "Stagflation": "#ef4444",
    "Goldilocks": "#22c55e",
    "Reflation": "#eab308",
    "Deflation": "#3b82f6",
}


def _alert_admin(subject: str, body: str):
    """Send a self-alert email when something goes wrong with subscribe flow.
    Best-effort — never raises."""
    if not RESEND_KEY or not ADMIN_ALERT_EMAIL:
        return
    try:
        resend.api_key = RESEND_KEY
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [ADMIN_ALERT_EMAIL],
            "subject": f"[Macro World View alert] {subject}",
            "html": f"<pre style='font-family:monospace;font-size:12px;'>{body}</pre>",
        })
    except Exception as e:
        logger.error(f"Failed to send admin alert: {e}")


def add_subscriber(email: str, features: list[str] = None) -> SubscribeResult:
    """Add a subscriber to Resend Audience. Returns honest SubscribeResult.

    Persistence priority:
      1. Resend Audience (durable, source of truth)
      2. File backup (only used if Resend not configured — ephemeral on Railway)

    A duplicate email in Resend is considered SUCCESS (idempotent), not failure.
    Any unhandled error triggers an admin alert email + logs the full context.
    """
    logger.info(f"[subscribe] attempt email={email} features={features}")

    if not RESEND_KEY or not AUDIENCE_ID:
        msg = (f"RESEND_API_KEY={'set' if RESEND_KEY else 'MISSING'}, "
               f"RESEND_AUDIENCE_ID={'set' if AUDIENCE_ID else 'MISSING'}")
        logger.error(f"[subscribe] config error: {msg}")
        _alert_admin(
            "Subscribe config error",
            f"Email: {email}\nReason: Resend not configured ({msg})\n\n"
            f"User saw success but the contact was NOT persisted durably.",
        )
        # Still try the file backup — better than dropping the email entirely
        return _file_fallback(email, features, error=f"Resend not configured: {msg}")

    try:
        resend.api_key = RESEND_KEY
        resend.Contacts.create({
            "audience_id": AUDIENCE_ID,
            "email": email,
            "first_name": "",
            "last_name": "",
            "unsubscribed": False,
        })
        logger.info(f"[subscribe] resend OK email={email}")
        return SubscribeResult(ok=True, persisted_to="resend")
    except Exception as e:
        err_str = str(e)
        # Resend returns "validation_error" / "Contact already exists" for duplicates.
        # Treat as success — the email is already persisted.
        if "already exists" in err_str.lower() or "duplicate" in err_str.lower():
            logger.info(f"[subscribe] duplicate email={email} (treated as success)")
            return SubscribeResult(ok=True, persisted_to="resend", already_existed=True)

        # Real failure — alert admin so we never lose another signup silently
        logger.error(f"[subscribe] resend error email={email}: {e}")
        _alert_admin(
            "Subscribe FAILED — possible lost lead",
            f"Email: {email}\nFeatures: {features}\n"
            f"Resend error: {err_str}\n\n"
            f"Falling back to file backup, but Railway wipes the FS on deploy. "
            f"Add this address to Resend manually if you want to keep them.",
        )
        return _file_fallback(email, features, error=err_str)


def _file_fallback(email: str, features: list[str] = None,
                   error: str = None) -> SubscribeResult:
    """Last-resort file persistence. Caller must understand this is ephemeral on Railway."""
    if not SUBSCRIBERS_FILE:
        return SubscribeResult(ok=False, persisted_to=None,
                               error=error or "No file backup configured")
    try:
        subs = []
        if os.path.exists(SUBSCRIBERS_FILE):
            with open(SUBSCRIBERS_FILE) as f:
                subs = json.load(f)
        if any(s.get("email") == email for s in subs):
            return SubscribeResult(ok=True, persisted_to="file",
                                   already_existed=True, error=error)
        subs.append({
            "email": email,
            "regimeAlerts": True,
            "eventAlerts": True,
            "weeklyPulse": True,
            "waitlistFeatures": features or [],
        })
        with open(SUBSCRIBERS_FILE, "w") as f:
            json.dump(subs, f)
        return SubscribeResult(ok=True, persisted_to="file", error=error)
    except Exception as e:
        logger.error(f"[subscribe] file backup also failed for {email}: {e}")
        return SubscribeResult(ok=False, persisted_to=None,
                               error=f"{error}; file backup also failed: {e}")


def _load_subscribers(filter_field: str = None) -> list[dict]:
    """Load subscribers from Resend Audience. Falls back to file."""
    # Try Resend Audience first
    if RESEND_KEY and AUDIENCE_ID:
        try:
            resend.api_key = RESEND_KEY
            contacts = resend.Contacts.list(audience_id=AUDIENCE_ID)
            subs = []
            for c in contacts.get("data", []):
                if not c.get("unsubscribed", False):
                    subs.append({
                        "email": c["email"],
                        "regimeAlerts": True,
                        "eventAlerts": True,
                        "weeklyPulse": True,
                    })
            return subs
        except Exception as e:
            print(f"  [email] Failed to load from Resend Audience: {e}")

    # Legacy file fallback
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
        <span style="font-size:11px;letter-spacing:3px;color:#888;text-transform:uppercase;">Macro World View</span>
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


def send_welcome(email: str, source: str = "default") -> bool:
    """Send a welcome/confirmation email immediately after signup.

    Content is contextual based on `source` (which form they subscribed from).
    Tells the user to head back to the site and click "Got it" to confirm
    delivery — we use that as a lightweight deliverability health check.

    Returns True if Resend accepted the send, False otherwise. Failures are
    logged and the admin is alerted but the caller should NOT fail the signup
    just because the welcome email couldn't be sent.
    """
    copy = WELCOME_COPY.get(source, WELCOME_COPY["default"])
    subject = "Welcome to Macro World View — please confirm"
    # Build the one-click confirmation URL
    confirm_url = (
        f"{SITE_URL}/confirmed?"
        f"email={urllib.parse.quote_plus(email)}"
        f"&source={urllib.parse.quote_plus(source)}"
    )
    body = f"""
    <p style="font-size:14px;color:#e0e0e0;margin:0 0 16px;line-height:1.5;">
        {copy['body']}
    </p>

    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:11px;color:#eab308;text-transform:uppercase;letter-spacing:1px;">
            One small favour
        </p>
        <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
            Click the button below to confirm you received this email. This
            tells us our delivery pipeline is working and helps future alerts
            land in your inbox instead of spam.
        </p>
        <p style="text-align:center;margin:16px 0 0;">
            <a href="{confirm_url}"
               style="background:#22c55e;color:#0a0a0a;padding:12px 28px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;display:inline-block;">
                Confirm I got this email ✓
            </a>
        </p>
    </div>

    <p style="font-size:11px;color:#555;margin:16px 0 0;line-height:1.5;">
        You're subscribed as <b>{email}</b>. If this wasn't you — or you'd like
        to unsubscribe — just reply to this email and we'll remove you immediately.
    </p>
    """
    html = _email_wrapper(copy["heading"], body)
    ok = _send(email, subject, html)
    if not ok:
        logger.error(f"[welcome] failed to send to {email} source={source}")
        _alert_admin(
            "Welcome email send failed",
            f"Email: {email}\nSource: {source}\n\nThe subscriber IS in Resend "
            f"but the welcome email did not send. They may never know their "
            f"signup worked.",
        )
    else:
        logger.info(f"[welcome] sent to {email} source={source}")
    return ok


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
    """Weekly Macro World View — Tuesday newsletter."""
    from datetime import datetime
    date_str = datetime.now().strftime("%B %d, %Y")
    subject = f"Weekly Macro World View — {date_str}"

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


def send_daily_briefing(stories: list[dict], trigger_moves: list[dict],
                        regime: str, date_str: str) -> int:
    """Daily macro/geo briefing — sent to eventAlerts subscribers at 8am UTC.

    stories: [{headline, summary, regime_impact, severity}]
    trigger_moves: [{name, direction, value, change}]
    """
    subject = f"Daily Briefing — {date_str}"

    stories_html = ""
    for s in stories:
        sev_color = {"HIGH": "#ef4444", "MEDIUM": "#eab308", "LOW": "#22c55e"}.get(
            s.get("severity", "MEDIUM"), "#888"
        )
        stories_html += f"""
        <div style="margin:0 0 16px;padding:12px;background:#111;border-left:3px solid {sev_color};border-radius:0 8px 8px 0;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#e0e0e0;">{s['headline']}</p>
            <p style="margin:0 0 6px;font-size:12px;color:#888;line-height:1.5;">{s['summary']}</p>
            <p style="margin:0;font-size:11px;color:{sev_color};">Regime impact: {s.get('regime_impact', 'Monitoring')}</p>
        </div>"""

    triggers_html = ""
    if trigger_moves:
        triggers_html = '<h3 style="font-size:13px;color:#e0e0e0;margin:20px 0 8px;border-bottom:1px solid #222;padding-bottom:4px;">Triggers that moved</h3>'
        for t in trigger_moves:
            arrow = "\u2191" if t.get("direction") == "up" else "\u2193" if t.get("direction") == "down" else "\u2192"
            change_color = "#22c55e" if t.get("direction") == "up" else "#ef4444" if t.get("direction") == "down" else "#888"
            triggers_html += f'<p style="font-size:12px;color:#888;margin:4px 0;">{arrow} <b style="color:#e0e0e0;">{t["name"]}</b>: {t.get("value", "")} <span style="color:{change_color};">{t.get("change", "")}</span></p>'

    body = f"""
    <div style="background:{REGIME_COLORS.get(regime, '#888')}15;border:1px solid {REGIME_COLORS.get(regime, '#888')}40;border-radius:8px;padding:12px;margin:0 0 16px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#555;">Current regime</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:{REGIME_COLORS.get(regime, '#888')};">{regime}</p>
    </div>

    <h3 style="font-size:13px;color:#e0e0e0;margin:0 0 12px;border-bottom:1px solid #222;padding-bottom:4px;">Today's stories</h3>
    {stories_html}

    {triggers_html}

    <p style="text-align:center;margin:24px 0;">
        <a href="{SITE_URL}" style="background:#222;color:#e0e0e0;padding:10px 24px;border-radius:4px;text-decoration:none;font-size:13px;display:inline-block;">View live dashboard \u2192</a>
    </p>
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("eventAlerts")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent
