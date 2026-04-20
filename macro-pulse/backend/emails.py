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
            Confirm your email
        </p>
        <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
            Click below to confirm delivery. This helps future updates
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


# ════════════════════════════════════════════════════════════════════
# POSITIONING PHASE — gold → growth rotation (mirrors frontend logic)
# ════════════════════════════════════════════════════════════════════

PHASES = {
    "gold-anchor": {
        "label": "Gold anchor",
        "color": "#eab308",
        "description": "Gold wins in both scenarios (oil up or down). Growth is discounted — start buying the thesis. Skip other materials — they already priced in stagflation.",
        "picks": [
            {"ticker": "GLD", "name": "Gold", "weight": 65},
            {"ticker": "SMH", "name": "AI Chips (semiconductors)", "weight": 20},
            {"ticker": "BOTZ", "name": "Robotics & AI", "weight": 15},
        ],
    },
    "rotation": {
        "label": "Rotate toward growth",
        "color": "#3b82f6",
        "description": "Oil is falling but inflation takes 2-3 more months to follow in CPI. Gold keeps working while you wait. Start shifting weight toward growth — market is forward-looking.",
        "picks": [
            {"ticker": "GLD", "name": "Gold", "weight": 40},
            {"ticker": "SMH", "name": "AI Chips (semiconductors)", "weight": 35},
            {"ticker": "BOTZ", "name": "Robotics & AI", "weight": 25},
        ],
    },
    "growth-tilt": {
        "label": "Growth tilt",
        "color": "#22c55e",
        "description": "CPI is now printing lower and the market has confirmed it: yields falling, internals risk-on. Growth multiples expanding. Keep gold as a hedge but growth is now the primary position.",
        "picks": [
            {"ticker": "GLD", "name": "Gold", "weight": 25},
            {"ticker": "SMH", "name": "AI Chips (semiconductors)", "weight": 40},
            {"ticker": "BOTZ", "name": "Robotics & AI", "weight": 35},
        ],
    },
    "full-conviction": {
        "label": "Full conviction growth",
        "color": "#22c55e",
        "description": "All layers aligned: CPI disinflation, Fed cutting, liquidity expanding, internals risk-on. This is the high-conviction growth window.",
        "picks": [
            {"ticker": "GLD", "name": "Gold", "weight": 15},
            {"ticker": "SMH", "name": "AI Chips (semiconductors)", "weight": 45},
            {"ticker": "BOTZ", "name": "Robotics & AI", "weight": 40},
        ],
    },
}


def compute_positioning_phase(oil: dict | None, liquidity: dict | None,
                              yields: dict | None, internals: dict | None) -> dict:
    """Mirror of frontend MarketContext positioning phase logic.

    Returns the active phase dict (with label, description, picks).
    """
    oil_brent = oil.get("latest", {}).get("brent") if oil else None
    oil_3m = oil.get("changes", {}).get("threeMonth") if oil else None
    liq_3m = liquidity.get("changes", {}).get("threeMonth") if liquidity else None
    y_trend = yields.get("trend", "flat") if yields else "flat"
    risk_on_internals = sum(
        1 for i in (internals or {}).get("internals", [])
        if i.get("signal") == "risk-on"
    )

    oil_falling = oil_3m is not None and oil_3m < -5
    oil_below_85 = oil_brent is not None and oil_brent < 85
    now_bullish = y_trend == "falling" and risk_on_internals >= 2
    coming_bullish = oil_falling and (liq_3m or 0) > 1

    if now_bullish and coming_bullish:
        phase_id = "full-conviction"
    elif now_bullish:
        phase_id = "growth-tilt"
    elif oil_below_85 or oil_falling:
        phase_id = "rotation"
    else:
        phase_id = "gold-anchor"

    return {"id": phase_id, **PHASES[phase_id]}


def fetch_fed_stance(liquidity: dict | None, yields_summary: dict | None) -> dict | None:
    """Classify Fed stance from policy rate trajectory + liquidity + yields.

    Tepper principle: the Fed is the dominant signal. Returns:
      { stance: "hawkish"|"dovish"|"paralyzed"|"transitioning", confidence, reason }
    """
    import urllib.request as _ur
    try:
        # Fed funds target upper bound (DFEDTARU) — daily
        url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFEDTARU&cosd=2024-01-01"
        with _ur.urlopen(url, timeout=10) as r:
            lines = r.read().decode().strip().split("\n")[1:]
        rates = []
        for ln in lines:
            _, v = ln.split(",")
            try:
                rates.append(float(v))
            except ValueError:
                pass
        if len(rates) < 30:
            return None

        latest_rate = rates[-1]
        past_rate = rates[max(0, len(rates) - 180)]  # ~6 months ago
        rate_delta = latest_rate - past_rate
        policy_trend = "hike" if rate_delta > 0.1 else "cut" if rate_delta < -0.1 else "hold"

        liq_trend = liquidity.get("trend") if liquidity else "flat"
        yield_trend = yields_summary.get("trend") if yields_summary else "flat"

        hawk = sum([policy_trend == "hike", liq_trend == "contracting", yield_trend == "rising"])
        dove = sum([policy_trend == "cut", liq_trend == "expanding", yield_trend == "falling"])

        if hawk >= 2 and dove == 0:
            stance = "hawkish"
            confidence = "high" if hawk == 3 else "medium"
            reason = f"Rates {'rising' if policy_trend == 'hike' else 'held high'}, liquidity {liq_trend}, yields {yield_trend}. Growth stocks face headwind."
        elif dove >= 2 and hawk == 0:
            stance = "dovish"
            confidence = "high" if dove == 3 else "medium"
            reason = f"Rates {'falling' if policy_trend == 'cut' else 'held low'}, liquidity {liq_trend}, yields {yield_trend}. Growth stocks get tailwind."
        elif policy_trend == "hold" and liq_trend == "flat" and yield_trend == "flat":
            stance = "paralyzed"
            confidence = "high"
            reason = "Fed on hold, liquidity flat, yields flat. Markets in consolidation — waiting for a catalyst."
        else:
            stance = "transitioning"
            confidence = "low"
            dominant = "hawkish" if hawk > dove else "dovish" if dove > hawk else "mixed"
            reason = f"Mixed signals ({hawk} hawkish, {dove} dovish). Leaning {dominant}."

        return {"stance": stance, "confidence": confidence, "reason": reason}
    except Exception as e:
        logger.warning(f"[fed_stance] fetch failed: {e}")
        return None


def fetch_yields_summary() -> dict | None:
    """Lightweight 10Y yield trend from FRED DGS10 — just enough for phase detection."""
    import urllib.request as _ur
    try:
        url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10&cosd=2025-01-01"
        with _ur.urlopen(url, timeout=10) as r:
            lines = r.read().decode().strip().split("\n")[1:]
        vals = []
        for ln in lines:
            _, v = ln.split(",")
            try:
                vals.append(float(v))
            except ValueError:
                pass
        if len(vals) < 64:
            return None
        current = vals[-1]
        past_3m = vals[-64]
        delta_bps = round((current - past_3m) * 100)
        trend = "rising" if delta_bps > 20 else "falling" if delta_bps < -20 else "flat"
        return {"trend": trend, "latest": {"tenYear": current}, "changes": {"threeMonthBps": delta_bps}}
    except Exception as e:
        logger.warning(f"[yields] fetch failed: {e}")
        return None


def fetch_liquidity() -> dict | None:
    """Fetch Fed net liquidity (WALCL - TGA - RRP*1000) from FRED CSV endpoints.
    Returns { net: $B, trend, changes: {oneM, threeM}, pctFromPeak } or None on failure."""
    import urllib.request as _ur
    try:
        def _fred(series: str) -> list[tuple[str, float]]:
            url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}&cosd=2020-01-01"
            with _ur.urlopen(url, timeout=10) as r:
                lines = r.read().decode().strip().split("\n")[1:]
            out = []
            for ln in lines:
                d, v = ln.split(",")
                try:
                    out.append((d, float(v)))
                except ValueError:
                    pass
            return out

        walcl = _fred("WALCL")
        tga = dict(_fred("WTREGEN"))
        rrp = _fred("RRPONTSYD")
        if not walcl or not tga or not rrp:
            return None

        def _nearest_before(series, target):
            cand = [v for d, v in series if d <= target]
            return cand[-1] if cand else None

        net = []
        for d, w in walcl:
            t = tga.get(d)
            r = _nearest_before(rrp, d)
            if t is not None and r is not None:
                net.append((d, w - t - r * 1000))

        if len(net) < 52:
            return None

        vals = [v for _, v in net]
        latest = vals[-1]
        one_m = ((latest - vals[-5]) / abs(vals[-5]) * 100) if len(vals) >= 5 else None
        three_m = ((latest - vals[-14]) / abs(vals[-14]) * 100) if len(vals) >= 14 else None
        peak = max(vals)
        pct_from_peak = (latest - peak) / peak * 100
        trend = "expanding" if (three_m or 0) > 1 else "contracting" if (three_m or 0) < -1 else "flat"
        return {
            "net": round(latest / 1000),  # billions
            "trend": trend,
            "oneM": round(one_m, 1) if one_m is not None else None,
            "threeM": round(three_m, 1) if three_m is not None else None,
            "pctFromPeak": round(pct_from_peak, 1),
        }
    except Exception as e:
        logger.warning(f"[liquidity] fetch failed: {e}")
        return None


def compute_week_deltas(snapshots_path: str, current_prices: dict[str, float]) -> list[dict]:
    """Compare current ETF prices against ~7-day-old snapshot. Returns top 3 movers."""
    import os as _os
    from datetime import datetime as _dt
    if not _os.path.exists(snapshots_path):
        return []
    try:
        with open(snapshots_path) as f:
            snaps = [json.loads(l) for l in f if l.strip()]
        if len(snaps) < 2:
            return []
        target = _dt.now().timestamp() - 7 * 86400
        prev = min(snaps, key=lambda s: abs(_dt.fromisoformat(s["timestamp"]).timestamp() - target))
        prev_prices = prev.get("prices", {})

        deltas = []
        for ticker, now_px in current_prices.items():
            then = prev_prices.get(ticker)
            if then and then > 0:
                pct = (now_px - then) / then * 100
                deltas.append({"ticker": ticker, "pct": round(pct, 1), "from": then, "to": now_px})
        deltas.sort(key=lambda d: abs(d["pct"]), reverse=True)
        return deltas[:3]
    except Exception as e:
        logger.warning(f"[week_deltas] failed: {e}")
        return []


def generate_weekly_narrative(regime: str, months: int, liquidity: dict | None,
                               week_deltas: list[dict], synthesis: dict) -> str:
    """Ask Claude for a 2-paragraph lede in the Macro World View voice."""
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return _fallback_narrative(regime, months, liquidity, week_deltas)
    try:
        import requests as _rq
        liq_line = "liquidity data unavailable"
        if liquidity:
            liq_line = f"Fed net liquidity ${liquidity['net']}B, {liquidity['trend']}, {liquidity['threeM']:+.1f}% 3m"
        mover_lines = "; ".join(f"{d['ticker']} {d['pct']:+.1f}%" for d in week_deltas[:3]) or "no significant movers"
        situation = (synthesis.get("situation") or "")[:400]

        prompt = f"""You write the Macro World View weekly newsletter. Voice: direct, opinionated, no cliches (never say "back up the truck" or "to the moon"). Tone is confident but never hyperbolic.

Signals this week:
- US regime: {regime} (month {months})
- {liq_line}
- Biggest ETF moves this week: {mover_lines}
- Context: {situation}

Write exactly two short paragraphs (3-4 sentences each) for the top of the newsletter:
1) What the three signals (regime + liquidity + Big Cycle Stage 5) say TOGETHER this week. Be specific about whether they agree or conflict.
2) Our take — what this means for the AI & Robotics Race thesis (growth vs materials). End with a clear positioning bias (start building growth / hold materials tilt / neutral / etc).

No bullet points. No headers. Plain sentences only. No markdown. Under 120 words total."""
        r = _rq.post(
            "https://api.anthropic.com/v1/messages",
            headers={"Content-Type": "application/json", "x-api-key": api_key, "anthropic-version": "2023-06-01"},
            json={"model": "claude-sonnet-4-20250514", "max_tokens": 400,
                  "messages": [{"role": "user", "content": prompt}]},
            timeout=30,
        )
        text = "".join(b.get("text", "") for b in r.json().get("content", []))
        return text.strip() or _fallback_narrative(regime, months, liquidity, week_deltas)
    except Exception as e:
        logger.warning(f"[narrative] Claude call failed: {e}")
        return _fallback_narrative(regime, months, liquidity, week_deltas)


def _fallback_narrative(regime: str, months: int, liquidity: dict | None, deltas: list[dict]) -> str:
    """Deterministic fallback if Claude API is unavailable."""
    parts = [f"US regime is {regime}, now month {months}."]
    if liquidity:
        parts.append(f"Fed liquidity is {liquidity['trend']} at ${liquidity['net']}B ({liquidity['threeM']:+.1f}% over 3 months).")
    if deltas:
        top = deltas[0]
        parts.append(f"{top['ticker']} moved {top['pct']:+.1f}% this week.")
    parts.append("Stage 5 thesis unchanged — structural position in the AI & Robotics Race supply chain remains intact. Adjust tactical tilts per the regime.")
    return " ".join(parts)


def pick_subject_line(regime: str, liquidity: dict | None, deltas: list[dict], months: int) -> str:
    """Pick the best subject line based on the biggest signal this week."""
    # Priority: big ETF mover > liquidity regime change > regime duration milestone
    if deltas and abs(deltas[0]["pct"]) >= 4:
        d = deltas[0]
        direction = "+" if d["pct"] > 0 else ""
        return f"{d['ticker']} moved {direction}{d['pct']}% this week. Here's why."
    if liquidity and liquidity.get("threeM") is not None:
        if liquidity["threeM"] >= 2:
            return f"Liquidity expanded {liquidity['threeM']:+.1f}% over 3 months. Growth is listening."
        if liquidity["threeM"] <= -2:
            return f"Liquidity contracted {liquidity['threeM']:+.1f}% over 3 months. Watch growth."
    if months >= 4:
        return f"Still {regime} — month {months}. Here's what that means."
    return f"Weekly Macro World View — {regime}, month {months}"


# ════════════════════════════════════════════════════════════════════
# DAILY HEADLINES DIGEST — curated macro news
# ════════════════════════════════════════════════════════════════════

# Public RSS feeds. No auth required. Parse with stdlib ElementTree.
DIGEST_SOURCES = [
    ("MarketWatch", "https://feeds.content.dowjones.io/public/rss/mw_topstories"),
    ("CNBC World", "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362"),
    ("CNBC Economy", "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258"),
    ("Investing.com Economy", "https://www.investing.com/rss/news_25.rss"),
    ("Yahoo Finance", "https://finance.yahoo.com/news/rssindex"),
]


def fetch_headlines(sources: list[tuple[str, str]] | None = None,
                    hours_window: int = 24,
                    per_source_limit: int = 15) -> list[dict]:
    """Pull recent headlines from RSS feeds. Returns list of {source, title, url, published, summary}.

    Deduplicates by normalized title.
    """
    import urllib.request as _ur
    from datetime import datetime as _dt, timedelta as _td
    from xml.etree import ElementTree as _ET
    from email.utils import parsedate_to_datetime as _pdt

    sources = sources or DIGEST_SOURCES
    cutoff = _dt.now().astimezone() - _td(hours=hours_window)
    seen_titles: set[str] = set()
    out: list[dict] = []

    for source_name, url in sources:
        try:
            req = _ur.Request(url, headers={"User-Agent": "MacroWorldView/1.0"})
            with _ur.urlopen(req, timeout=10) as r:
                raw = r.read()
        except Exception as e:
            logger.warning(f"[headlines] {source_name} fetch failed: {e}")
            continue

        try:
            root = _ET.fromstring(raw)
        except Exception as e:
            logger.warning(f"[headlines] {source_name} parse failed: {e}")
            continue

        # RSS 2.0: channel/item; Atom: feed/entry (handle both shallowly)
        items = root.findall(".//item")
        if not items:
            items = root.findall(".//{http://www.w3.org/2005/Atom}entry")

        def _first(elem, *tags):
            """Return first existing child element from tag list (or None)."""
            for t in tags:
                el = elem.find(t)
                if el is not None:
                    return el
            return None

        count = 0
        for item in items:
            if count >= per_source_limit:
                break
            title_el = _first(item, "title", "{http://www.w3.org/2005/Atom}title")
            link_el = _first(item, "link", "{http://www.w3.org/2005/Atom}link")
            date_el = _first(item, "pubDate", "{http://www.w3.org/2005/Atom}published", "{http://www.w3.org/2005/Atom}updated")
            desc_el = _first(item, "description", "{http://www.w3.org/2005/Atom}summary")

            title = (title_el.text or "").strip() if title_el is not None else ""
            if not title:
                continue
            link = ""
            if link_el is not None:
                link = (link_el.text or link_el.get("href") or "").strip()
            pub = ""
            if date_el is not None and date_el.text:
                pub = date_el.text.strip()

            # Time window filter (best-effort — if parse fails, include it)
            if pub:
                try:
                    pub_dt = _pdt(pub)
                    if pub_dt < cutoff:
                        continue
                except Exception:
                    pass

            # Dedupe: lowercase + strip punctuation shingle
            key = "".join(c.lower() for c in title if c.isalnum() or c == " ")[:80]
            if key in seen_titles:
                continue
            seen_titles.add(key)

            summary = ""
            if desc_el is not None and desc_el.text:
                summary = desc_el.text.strip()[:300]

            out.append({
                "source": source_name,
                "title": title,
                "url": link,
                "published": pub,
                "summary": summary,
            })
            count += 1

    return out


def classify_headlines(headlines: list[dict], regime: str,
                       liquidity: dict | None) -> list[dict]:
    """Claude picks the 3 most relevant headlines for the thesis.

    Returns list of {title, source, url, why_it_matters} — may be empty.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key or not headlines:
        return []

    try:
        import requests as _rq
        numbered = "\n".join(
            f"{i+1}. [{h['source']}] {h['title']}"
            for i, h in enumerate(headlines[:50])
        )
        liq_line = (
            f"liquidity {liquidity['trend']} ({liquidity['threeM']:+.1f}% 3m)"
            if liquidity else "liquidity status unknown"
        )
        prompt = f"""You curate a daily headlines digest for a long-term macro investor.

Current context:
- US regime: {regime}
- Fed {liq_line}
- Core thesis: Big Cycle Stage 5 (great-power conflict), AI & Robotics Race supply chain (chips, copper, lithium, rare earths, robotics), 20-40 year structural horizon with 3-9 month tactical tilts.

Pick the 3 headlines most worth knowing. Skip:
- Company earnings beats/misses (unless revealing a macro trend)
- Celebrity/political noise with no market impact
- Duplicate stories from different outlets

Prioritize: Fed decisions, macro data surprises, supply chain disruptions, geopolitical shifts affecting commodity flows, regulatory moves in China/US, anything that meaningfully moves the three-layer framework (Stage 5 / regime / liquidity).

If fewer than 3 qualify, return fewer. If NOTHING qualifies, return an empty array.

Headlines:
{numbered}

Output ONLY valid JSON, no prose, no markdown. Array of up to 3 objects, each with:
- "index": the number above
- "why_it_matters": one sentence (≤25 words) tying this to the thesis — regime, liquidity, Stage 5, or AI & Robotics Race supply chain.

Example: [{{"index": 3, "why_it_matters": "Reinforces the stagflation headwind on growth; expect further multiple compression in tech until CPI moderates."}}]"""

        r = _rq.post(
            "https://api.anthropic.com/v1/messages",
            headers={"Content-Type": "application/json", "x-api-key": api_key, "anthropic-version": "2023-06-01"},
            json={"model": "claude-sonnet-4-20250514", "max_tokens": 600,
                  "messages": [{"role": "user", "content": prompt}]},
            timeout=30,
        )
        text = "".join(b.get("text", "") for b in r.json().get("content", [])).strip()
        # Strip code fences if Claude added them
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
            text = text.rsplit("```", 1)[0].strip()

        picks = json.loads(text)
        if not isinstance(picks, list):
            return []

        out = []
        for p in picks[:3]:
            idx = p.get("index")
            why = (p.get("why_it_matters") or "").strip()
            if not isinstance(idx, int) or idx < 1 or idx > len(headlines) or not why:
                continue
            h = headlines[idx - 1]
            out.append({
                "title": h["title"],
                "source": h["source"],
                "url": h["url"],
                "why_it_matters": why,
            })
        return out
    except Exception as e:
        logger.warning(f"[classify_headlines] Claude call failed: {e}")
        return []


# (send_daily_digest removed — unified into send_daily_update in "headlines" mode)


# ════════════════════════════════════════════════════════════════════
# CHANGE MONITOR — event-driven alert system
# ════════════════════════════════════════════════════════════════════

# Weights for change detection. Tune based on real fires.
CHANGE_WEIGHTS = {
    "regime_flip": 100,          # Any country regime changes
    "liquidity_trend_flip": 60,  # expanding → contracting or vice versa
    "liquidity_3m_band": 30,     # 3M change crosses ±3%
    "etf_move_5pct": 20,         # per ETF moving ≥5%
    "etf_move_8pct": 40,         # instead of 20 if ≥8%
    "trigger_status_flip": 30,   # per trigger changing status tier
}

CHANGE_THRESHOLD = 50    # score at which we fire
COOLDOWN_HOURS = 48      # min hours between fires
QUIET_NET_DAYS = 10      # safety net: fire anyway if silence this long

WATCH_TICKERS = ["SMH", "BOTZ", "COPX", "LIT", "REMX", "ICLN", "GLD", "XLE", "DBC", "QQQ", "SPY", "TLT"]


def detect_changes(baseline: dict, current: dict) -> tuple[int, list[dict]]:
    """Compare baseline state to current state. Returns (total_score, list of changes).

    Each change is: {what, weight, old, new, direction}
    """
    changes = []

    # Regime flips (US is most important, weight higher)
    for region in ["us_regime", "eu_regime", "cn_regime"]:
        old = (baseline.get(region) or "").strip()
        new = (current.get(region) or "").strip()
        if old and new and old != new:
            weight = CHANGE_WEIGHTS["regime_flip"] if region == "us_regime" else CHANGE_WEIGHTS["regime_flip"] // 2
            changes.append({"what": f"{region.split('_')[0].upper()} regime", "weight": weight,
                            "old": old, "new": new, "direction": "flip"})

    # Liquidity trend flip
    old_trend = baseline.get("liquidity_trend")
    new_trend = current.get("liquidity_trend")
    if old_trend and new_trend and old_trend != new_trend:
        changes.append({"what": "Fed liquidity trend", "weight": CHANGE_WEIGHTS["liquidity_trend_flip"],
                        "old": old_trend, "new": new_trend, "direction": "flip"})

    # Liquidity 3M crossing ±3% band
    old_3m = baseline.get("liquidity_3m")
    new_3m = current.get("liquidity_3m")
    if old_3m is not None and new_3m is not None:
        def _band(v): return "expand" if v >= 3 else "contract" if v <= -3 else "neutral"
        if _band(old_3m) != _band(new_3m):
            changes.append({"what": "Liquidity 3M band", "weight": CHANGE_WEIGHTS["liquidity_3m_band"],
                            "old": f"{old_3m:+.1f}%", "new": f"{new_3m:+.1f}%", "direction": "band_shift"})

    # ETF moves
    old_prices = baseline.get("prices") or {}
    new_prices = current.get("prices") or {}
    for tkr in new_prices:
        op = old_prices.get(tkr)
        np_ = new_prices.get(tkr)
        if op and np_ and op > 0:
            pct = (np_ - op) / op * 100
            if abs(pct) >= 8:
                changes.append({"what": tkr, "weight": CHANGE_WEIGHTS["etf_move_8pct"],
                                "old": f"${op:.2f}", "new": f"${np_:.2f}",
                                "direction": f"{pct:+.1f}%"})
            elif abs(pct) >= 5:
                changes.append({"what": tkr, "weight": CHANGE_WEIGHTS["etf_move_5pct"],
                                "old": f"${op:.2f}", "new": f"${np_:.2f}",
                                "direction": f"{pct:+.1f}%"})

    # Trigger status flips
    old_trigs = baseline.get("triggers") or {}
    new_trigs = current.get("triggers") or {}
    for name, new_status in new_trigs.items():
        old_status = old_trigs.get(name)
        if old_status and new_status and old_status != new_status:
            changes.append({"what": f"Trigger · {name}", "weight": CHANGE_WEIGHTS["trigger_status_flip"],
                            "old": old_status, "new": new_status, "direction": "flip"})

    total = sum(c["weight"] for c in changes)
    changes.sort(key=lambda c: c["weight"], reverse=True)
    return total, changes


def load_change_state(path: str) -> dict:
    """Load the change_state cache. Returns empty dict if missing."""
    if not os.path.exists(path):
        return {}
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {}


def save_change_state(path: str, state: dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(state, f, indent=2)


def should_fire(state: dict, score: int, now_iso: str) -> tuple[bool, str]:
    """Decide whether to fire. Returns (fire?, reason_code).

    reason_code: "change" | "safety_net" | "cooldown" | "below_threshold"
    """
    from datetime import datetime as _dt

    last_fire = state.get("last_fire")
    hours_since = float("inf")
    days_since = float("inf")
    if last_fire:
        try:
            last_dt = _dt.fromisoformat(last_fire)
            delta = _dt.fromisoformat(now_iso) - last_dt
            hours_since = delta.total_seconds() / 3600
            days_since = delta.days + delta.seconds / 86400
        except Exception:
            pass

    if score >= CHANGE_THRESHOLD:
        if hours_since >= COOLDOWN_HOURS:
            return True, "change"
        return False, "cooldown"

    if days_since >= QUIET_NET_DAYS:
        return True, "safety_net"

    return False, "below_threshold"


def send_daily_update(regime: str, months: int, liquidity: dict | None,
                      picks: list[dict], triggers: list[dict],
                      mode: str,
                      changes: list[dict] | None = None, change_score: int = 0,
                      headlines: list[dict] | None = None,
                      synthesis: dict | None = None,
                      decision_scenario: dict | None = None,
                      phase: dict | None = None,
                      fed_stance: dict | None = None) -> tuple[int, str]:
    """Unified daily email. Combines change alerts, headlines digest, and safety-net framing.

    mode: "change" | "headlines" | "quiet"
      - change: WHAT JUST CHANGED block at top, narrative, headlines (if any) below
      - headlines: top story drives subject, signal strip + 3 stories + light narrative
      - quiet: safety-net framing for 10+ day silence

    Returns (count_sent, subject_used).
    """
    synthesis = synthesis or {}
    changes = changes or []
    headlines = headlines or []

    # ── Subject + top block per mode ──
    if mode == "change" and changes:
        top = changes[0]
        if top["direction"] == "flip":
            subject = f"{top['what']} flipped: {top['old']} → {top['new']}"
        elif "%" in top["direction"]:
            subject = f"{top['what']} moved {top['direction']} this week"
        else:
            subject = f"{top['what']} just changed — {top['new']}"
        header_block = _change_header_block(changes, change_score)
        narrative = _narrative_for_change(changes, regime, months, liquidity, synthesis)

    elif mode == "headlines" and headlines:
        top = headlines[0]["title"]
        subject = top if len(top) <= 70 else top[:67] + "..."
        header_block = ""  # signal strip alone suffices
        narrative = ""  # headlines speak for themselves; signal strip provides context

    elif mode == "quiet":
        subject = f"Quiet markets — {regime}, month {months}"
        header_block = (
            '<div style="margin:0 0 20px;padding:10px 12px;background:#0a0a0a;'
            'border-left:3px solid #888;border-radius:0 6px 6px 0;">'
            '<p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">Quiet markets</p>'
            '<p style="margin:4px 0 0;font-size:13px;color:#d0d0d0;">No material changes since the last update.</p>'
            '</div>'
        )
        liq_line = (
            f"Liquidity {liquidity['trend']} at {liquidity['threeM']:+.1f}% 3m. "
            if liquidity else ""
        )
        narrative = (
            f"No material moves since the last update. US regime stayed {regime} (month {months}). "
            f"{liq_line}Absence of movement during Stage 5 is itself information — the structural thesis is intact "
            f"and the tactical picture hasn&apos;t shifted. Our positioning bias is unchanged; use quiet "
            f"periods to reread the thesis, not to change weights."
        )
    else:
        return 0, ""

    return _render_and_send(
        subject=subject,
        header_block=header_block,
        narrative=narrative,
        regime=regime,
        months=months,
        liquidity=liquidity,
        picks=picks,
        triggers=triggers,
        decision_scenario=decision_scenario,
        synthesis=synthesis,
        headlines=headlines,
        mode=mode,
        phase=phase,
        fed_stance=fed_stance,
    ), subject


def _narrative_for_change(changes: list[dict], regime: str, months: int,
                          liquidity: dict | None, synthesis: dict) -> str:
    """Ask Claude to interpret the specific set of changes that fired the alert."""
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key or not changes:
        return _fallback_narrative(regime, months, liquidity,
                                   [{"ticker": c["what"], "pct": 0} for c in changes[:3]])
    try:
        import requests as _rq
        change_lines = "; ".join(
            f"{c['what']}: {c['old']} → {c['new']}" for c in changes[:5]
        )
        situation = (synthesis.get("situation") or "")[:300]
        liq_line = f"${liquidity['net']}B, {liquidity['trend']}, {liquidity['threeM']:+.1f}% 3m" if liquidity else "—"

        prompt = f"""You write the Macro World View change alert. Voice: direct, opinionated, no cliches (never say "back up the truck"). Confident but not hyperbolic.

What just changed: {change_lines}
Current state: US regime {regime} (month {months}); Fed liquidity {liq_line}
Context: {situation}

Write exactly two short paragraphs (3-4 sentences each):
1) Why these specific changes matter — tie them to the three-layer framework (Stage 5 / regime / liquidity). Be specific about whether the changes reinforce or contradict the current thesis.
2) Our take — what this changes (if anything) for the AI & Robotics Race positioning bias. End with a concrete action or watch-list item.

No bullets, no headers, plain sentences. No markdown. Under 130 words total."""
        r = _rq.post(
            "https://api.anthropic.com/v1/messages",
            headers={"Content-Type": "application/json", "x-api-key": api_key, "anthropic-version": "2023-06-01"},
            json={"model": "claude-sonnet-4-20250514", "max_tokens": 400,
                  "messages": [{"role": "user", "content": prompt}]},
            timeout=30,
        )
        text = "".join(b.get("text", "") for b in r.json().get("content", []))
        return text.strip() or _fallback_narrative(regime, months, liquidity, [])
    except Exception as e:
        logger.warning(f"[change narrative] Claude call failed: {e}")
        return _fallback_narrative(regime, months, liquidity, [])


def _change_header_block(changes: list[dict], score: int) -> str:
    """Top-of-email 'WHAT JUST CHANGED' block."""
    rows = ""
    for c in changes[:5]:
        color = "#ef4444" if c["direction"] == "flip" else "#22c55e" if c["direction"].startswith("+") else "#ef4444" if c["direction"].startswith("-") else "#eab308"
        rows += (
            f'<p style="margin:4px 0;font-size:12px;color:#888;">'
            f'<span style="color:{color};">●</span> '
            f'<b style="color:#e0e0e0;">{c["what"]}</b>: '
            f'{c["old"]} → {c["new"]}'
            f'</p>'
        )
    return (
        f'<div style="margin:0 0 20px;padding:12px;background:#0a0a0a;border-left:3px solid #ef4444;border-radius:0 8px 8px 0;">'
        f'<p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.15em;">What just changed</p>'
        f'{rows}'
        f'<p style="margin:8px 0 0;font-size:10px;color:#555;">Change score: {score}</p>'
        f'</div>'
    )


def _render_and_send(subject: str, header_block: str, narrative: str,
                     regime: str, months: int, liquidity: dict | None,
                     picks: list[dict], triggers: list[dict],
                     decision_scenario: dict | None, synthesis: dict,
                     headlines: list[dict] | None = None,
                     mode: str = "change",
                     phase: dict | None = None,
                     fed_stance: dict | None = None) -> int:
    """Shared renderer for all daily emails. Mode-aware layout + optional headlines section."""
    headlines = headlines or []
    regime_color = REGIME_COLORS.get(regime, "#888")

    # Fed stance block — Tepper principle, top of email
    fed_stance_html = ""
    if fed_stance:
        stance_color = {
            "hawkish": "#ef4444", "dovish": "#22c55e",
            "paralyzed": "#eab308", "transitioning": "#3b82f6",
        }.get(fed_stance.get("stance", ""), "#888")
        fed_stance_html = f"""
        <div style="margin:0 0 16px;padding:12px 14px;background:{stance_color}10;border:1px solid {stance_color}40;border-radius:8px;">
            <div style="margin:0 0 4px;">
                <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#555;">Fed stance</span>
                <span style="display:inline-block;margin-left:6px;font-size:13px;font-weight:bold;padding:2px 10px;border-radius:10px;background:{stance_color}20;color:{stance_color};text-transform:capitalize;">{fed_stance.get('stance', '—')}</span>
                <span style="margin-left:6px;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#555;">{fed_stance.get('confidence', '')} confidence</span>
            </div>
            <p style="margin:4px 0 0;font-size:11px;color:#888;line-height:1.5;">{fed_stance.get('reason', '')}</p>
        </div>"""

    # Positioning phase block — shows current phase + allocation rationale
    phase_html = ""
    if phase:
        phase_html = f"""
        <div style="margin:0 0 20px;padding:14px;background:{phase['color']}10;border:1px solid {phase['color']}40;border-radius:8px;">
            <div style="display:flex;align-items:center;gap:8px;margin:0 0 6px;">
                <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#555;">Positioning phase</span>
                <span style="font-size:11px;font-weight:bold;padding:2px 8px;border-radius:10px;background:{phase['color']}20;color:{phase['color']};">{phase['label']}</span>
            </div>
            <p style="margin:4px 0 0;font-size:11px;color:#888;line-height:1.5;">{phase.get('description', '')}</p>
        </div>"""

    # Signal strip (liquidity left, regime right to match site)
    liq_html = ""
    if liquidity:
        trend_color = {"expanding": "#22c55e", "contracting": "#ef4444", "flat": "#888"}.get(liquidity["trend"], "#888")
        three_m = liquidity.get("threeM")
        three_m_str = f"{three_m:+.1f}%" if three_m is not None else "—"
        liq_html = f"""
        <td style="padding:12px;border:1px solid #222;border-radius:8px;background:#0a0a0a;width:50%;vertical-align:top;">
            <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">Fed liquidity</p>
            <p style="margin:4px 0 2px;font-size:18px;font-weight:bold;color:#e0e0e0;">${liquidity['net'] / 1000:.2f}T</p>
            <p style="margin:0;font-size:11px;color:{trend_color};text-transform:capitalize;">{liquidity['trend']} · {three_m_str} 3m</p>
        </td>"""
    regime_cell = f"""
        <td style="padding:12px;border:1px solid {regime_color}40;border-radius:8px;background:{regime_color}08;width:50%;vertical-align:top;">
            <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">US regime</p>
            <p style="margin:4px 0 2px;font-size:18px;font-weight:bold;color:{regime_color};">{regime}</p>
            <p style="margin:0;font-size:11px;color:#888;">Month {months}</p>
        </td>"""
    signal_strip = f'<table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin:0 0 20px;"><tr>{liq_html}{regime_cell}</tr></table>'

    paras = [p.strip() for p in narrative.split("\n") if p.strip()]
    if len(paras) == 1:
        sents = paras[0].split(". ")
        mid = len(sents) // 2
        paras = [". ".join(sents[:mid]) + ".", ". ".join(sents[mid:])]
    lede_html = "".join(
        f'<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#d0d0d0;">{p}</p>'
        for p in paras
    )

    # Decision block
    decision_html = ""
    if decision_scenario:
        event = decision_scenario.get("event", "Upcoming release")
        scenarios = decision_scenario.get("scenarios") or {}
        watch = decision_scenario.get("what_to_watch", "")
        decision_html = f"""
        <h2 style="font-size:12px;color:#888;margin:28px 0 10px;text-transform:uppercase;letter-spacing:0.15em;">This week&apos;s decision</h2>
        <div style="margin:0 0 16px;padding:14px;background:#0a0a0a;border:1px solid #222;border-radius:8px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#e0e0e0;">{event}</p>
            {f'<p style="margin:0 0 10px;font-size:12px;color:#888;line-height:1.5;">{watch}</p>' if watch else ''}
        """
        if scenarios.get("high"): decision_html += f'<p style="margin:4px 0;font-size:12px;color:#ef4444;">↑ {scenarios["high"]}</p>'
        if scenarios.get("inline"): decision_html += f'<p style="margin:4px 0;font-size:12px;color:#888;">→ {scenarios["inline"]}</p>'
        if scenarios.get("low"): decision_html += f'<p style="margin:4px 0;font-size:12px;color:#22c55e;">↓ {scenarios["low"]}</p>'
        decision_html += "</div>"

    # Appendix — allocation rows + cash to fill to 100%
    total_pct = sum(int(p.get("weight", 0) or 0) for p in picks)
    picks_rows = "".join(
        f'<tr><td style="padding:3px 8px;color:#888;font-size:12px;">{p["ticker"]}</td>'
        f'<td style="padding:3px 8px;color:#555;font-size:12px;">{p["name"]}</td>'
        f'<td style="padding:3px 8px;text-align:right;color:#555;font-size:12px;">{p.get("weight", "")}%</td></tr>'
        for p in picks
    )
    if total_pct < 100:
        cash_pct = 100 - total_pct
        picks_rows += (
            f'<tr style="border-top:1px solid #222;">'
            f'<td style="padding:3px 8px;color:#888;font-size:12px;">CASH</td>'
            f'<td style="padding:3px 8px;color:#555;font-size:12px;">Cash / money market</td>'
            f'<td style="padding:3px 8px;text-align:right;color:#555;font-size:12px;">{cash_pct}%</td></tr>'
        )
    triggers_html = ""
    for t in triggers[:4]:
        status = t.get("status", "stable")
        status_color = {"crisis": "#ef4444", "watch": "#eab308", "stable": "#22c55e"}.get(status, "#888")
        status_label = {"crisis": "TRIGGERED", "watch": "WATCH", "stable": "NOT MET"}.get(status, "—")
        threshold = t.get("threshold", "")
        threshold_html = f'<div style="font-size:10px;color:#555;margin:1px 0 0 14px;">Threshold: {threshold}</div>' if threshold else ""
        triggers_html += (
            f'<div style="margin:6px 0;">'
            f'<p style="font-size:11px;color:#888;margin:0;">'
            f'<span style="color:{status_color};">●</span> '
            f'<b style="color:#e0e0e0;">{t["name"]}</b>: {t["current"]} '
            f'<span style="color:{status_color};font-size:9px;font-weight:bold;">· {status_label}</span>'
            f'</p>'
            f'{threshold_html}'
            f'</div>'
        )

    # Headlines section (only if populated)
    headlines_html = ""
    if headlines:
        heading = "Today&apos;s stories" if mode == "headlines" else "Also worth knowing today"
        stories = ""
        for h in headlines[:3]:
            source_line = f'<a href="{h["url"]}" style="color:#888;text-decoration:none;">{h["source"]} →</a>' if h.get("url") else h["source"]
            stories += f"""
            <div style="margin:0 0 12px;padding:10px 12px;background:#0a0a0a;border-left:3px solid #3b82f6;border-radius:0 6px 6px 0;">
                <p style="margin:0 0 3px;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">{source_line}</p>
                <p style="margin:0 0 5px;font-size:13px;font-weight:bold;color:#e0e0e0;line-height:1.4;">{h['title']}</p>
                <p style="margin:0;font-size:12px;color:#888;line-height:1.5;"><span style="color:#3b82f6;">Why it matters:</span> {h['why_it_matters']}</p>
            </div>"""
        headlines_html = f"""
        <h2 style="font-size:12px;color:#888;margin:28px 0 10px;text-transform:uppercase;letter-spacing:0.15em;">{heading}</h2>
        {stories}"""

    body = f"""
    {fed_stance_html}

    {header_block}
    {signal_strip}

    {phase_html}

    {lede_html}

    {headlines_html}

    {decision_html}

    <hr style="border:none;border-top:1px solid #1a1a1a;margin:28px 0;" />

    <p style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px;">Appendix · Current allocation</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">{picks_rows}</table>

    <p style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px;">Appendix · Trigger status</p>
    {triggers_html}
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("weeklyPulse")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent


# ════════════════════════════════════════════════════════════════════
# Legacy weekly (kept for compatibility — not scheduled anymore)
# ════════════════════════════════════════════════════════════════════

def send_weekly_pulse(regime: str, months: int, fred_regime: str, geo_regime: str,
                      picks: list[dict], triggers: list[dict],
                      calendar: list[dict], bull_trigger: str, bear_trigger: str,
                      liquidity: dict | None = None,
                      week_deltas: list[dict] | None = None,
                      synthesis: dict | None = None,
                      decision_scenario: dict | None = None) -> int:
    """Weekly Macro World View — Tuesday newsletter.

    New structure: narrative lede, what moved this week, this week's decision,
    then appendix (allocation + triggers). Uses Claude for the lede.
    """
    from datetime import datetime
    date_str = datetime.now().strftime("%B %d, %Y")
    week_deltas = week_deltas or []
    synthesis = synthesis or {}

    subject = pick_subject_line(regime, liquidity, week_deltas, months)
    narrative = generate_weekly_narrative(regime, months, liquidity, week_deltas, synthesis)

    regime_color = REGIME_COLORS.get(regime, "#888")

    # ── Beat 1: THE LEDE ──
    # Split narrative into paragraphs
    paras = [p.strip() for p in narrative.split("\n") if p.strip()]
    if len(paras) == 1:
        # If Claude returned one block, split on sentence midpoint
        sents = paras[0].split(". ")
        mid = len(sents) // 2
        paras = [". ".join(sents[:mid]) + ".", ". ".join(sents[mid:])]
    lede_html = "".join(
        f'<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#d0d0d0;">{p}</p>'
        for p in paras
    )

    # ── Quick signal strip (regime + liquidity side by side) ──
    liq_html = ""
    if liquidity:
        trend_color = {"expanding": "#22c55e", "contracting": "#ef4444", "flat": "#888"}.get(liquidity["trend"], "#888")
        three_m = liquidity.get("threeM")
        three_m_str = f"{three_m:+.1f}%" if three_m is not None else "—"
        liq_html = f"""
        <td style="padding:12px;border:1px solid #222;border-radius:8px;background:#0a0a0a;width:50%;vertical-align:top;">
            <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">Fed liquidity</p>
            <p style="margin:4px 0 2px;font-size:18px;font-weight:bold;color:#e0e0e0;">${liquidity['net'] / 1000:.2f}T</p>
            <p style="margin:0;font-size:11px;color:{trend_color};text-transform:capitalize;">{liquidity['trend']} · {three_m_str} 3m</p>
        </td>"""
    regime_cell = f"""
        <td style="padding:12px;border:1px solid {regime_color}40;border-radius:8px;background:{regime_color}08;width:50%;vertical-align:top;">
            <p style="margin:0;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">US regime</p>
            <p style="margin:4px 0 2px;font-size:18px;font-weight:bold;color:{regime_color};">{regime}</p>
            <p style="margin:0;font-size:11px;color:#888;">Month {months}</p>
        </td>"""
    signal_strip = f'<table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin:0 0 20px;"><tr>{liq_html}{regime_cell}</tr></table>'

    # ── Beat 2: WHAT MOVED ──
    movers_html = ""
    for d in week_deltas[:3]:
        color = "#22c55e" if d["pct"] > 0 else "#ef4444"
        arrow = "↑" if d["pct"] > 0 else "↓"
        movers_html += f"""
        <div style="margin:0 0 10px;padding:10px 12px;background:#0a0a0a;border-left:3px solid {color};border-radius:0 6px 6px 0;">
            <p style="margin:0;font-size:13px;color:#e0e0e0;"><b>{d['ticker']}</b> <span style="color:{color};">{arrow} {abs(d['pct'])}% this week</span></p>
        </div>"""
    if not movers_html:
        movers_html = '<p style="font-size:12px;color:#555;margin:0;">No significant ETF moves this week — markets consolidating.</p>'

    # ── Beat 3: THIS WEEK'S DECISION ──
    decision_html = ""
    if decision_scenario:
        event = decision_scenario.get("event", "Upcoming release")
        scenarios = decision_scenario.get("scenarios") or {}
        watch = decision_scenario.get("what_to_watch", "")
        decision_html = f"""
        <div style="margin:0 0 16px;padding:14px;background:#0a0a0a;border:1px solid #222;border-radius:8px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#e0e0e0;">{event}</p>
            {f'<p style="margin:0 0 10px;font-size:12px;color:#888;line-height:1.5;">{watch}</p>' if watch else ''}
        """
        if scenarios.get("high"):
            decision_html += f'<p style="margin:4px 0;font-size:12px;color:#ef4444;">↑ {scenarios["high"]}</p>'
        if scenarios.get("inline"):
            decision_html += f'<p style="margin:4px 0;font-size:12px;color:#888;">→ {scenarios["inline"]}</p>'
        if scenarios.get("low"):
            decision_html += f'<p style="margin:4px 0;font-size:12px;color:#22c55e;">↓ {scenarios["low"]}</p>'
        decision_html += "</div>"
    elif calendar:
        # Fallback: first upcoming calendar event with implication
        c = calendar[0]
        decision_html = f"""
        <div style="margin:0 0 16px;padding:14px;background:#0a0a0a;border:1px solid #222;border-radius:8px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#e0e0e0;">{c.get('name', 'Upcoming event')} — {c.get('date', '')}</p>
            <p style="margin:0;font-size:12px;color:#888;line-height:1.5;">{c.get('implication', '')}</p>
        </div>"""

    # ── Appendix: allocation + triggers (collapsed look) ──
    picks_rows = "".join(
        f'<tr><td style="padding:3px 8px;color:#888;font-size:12px;">{p["ticker"]}</td>'
        f'<td style="padding:3px 8px;color:#555;font-size:12px;">{p["name"]}</td>'
        f'<td style="padding:3px 8px;text-align:right;color:#555;font-size:12px;">{p.get("weight", "")}%</td></tr>'
        for p in picks
    )
    triggers_html = ""
    for t in triggers[:4]:
        status = t.get("status", "stable")
        status_color = {"crisis": "#ef4444", "watch": "#eab308", "stable": "#22c55e"}.get(status, "#888")
        status_label = {"crisis": "TRIGGERED", "watch": "WATCH", "stable": "NOT MET"}.get(status, "—")
        threshold = t.get("threshold", "")
        threshold_html = f'<div style="font-size:10px;color:#555;margin:1px 0 0 14px;">Threshold: {threshold}</div>' if threshold else ""
        triggers_html += (
            f'<div style="margin:6px 0;">'
            f'<p style="font-size:11px;color:#888;margin:0;">'
            f'<span style="color:{status_color};">●</span> '
            f'<b style="color:#e0e0e0;">{t["name"]}</b>: {t["current"]} '
            f'<span style="color:{status_color};font-size:9px;font-weight:bold;">· {status_label}</span>'
            f'</p>'
            f'{threshold_html}'
            f'</div>'
        )

    lag_note = ""
    if fred_regime != geo_regime and geo_regime:
        lag_note = f'<p style="font-size:11px;color:#eab308;margin:0 0 12px;">FRED says {fred_regime}, geopolitical says {geo_regime}. Framework weights the more current signal.</p>'

    body = f"""
    {signal_strip}
    {lag_note}

    {lede_html}

    <h2 style="font-size:12px;color:#888;margin:28px 0 10px;text-transform:uppercase;letter-spacing:0.15em;">What moved this week</h2>
    {movers_html}

    <h2 style="font-size:12px;color:#888;margin:28px 0 10px;text-transform:uppercase;letter-spacing:0.15em;">This week&apos;s decision</h2>
    {decision_html}

    <hr style="border:none;border-top:1px solid #1a1a1a;margin:28px 0;" />

    <p style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px;">Appendix · Current allocation</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">{picks_rows}</table>

    <p style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px;">Appendix · Trigger status</p>
    {triggers_html}

    <div style="margin:24px 0 0;padding:10px 12px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:6px;">
        <p style="font-size:11px;color:#555;margin:0;">Bull catalyst: <span style="color:#22c55e;">{bull_trigger}</span></p>
        <p style="font-size:11px;color:#555;margin:4px 0 0;">Bear catalyst: <span style="color:#ef4444;">{bear_trigger}</span></p>
    </div>
    """
    html = _email_wrapper(subject, body)
    subs = _load_subscribers("weeklyPulse")
    sent = 0
    for s in subs:
        if _send(s["email"], subject, html):
            sent += 1
    return sent


# send_daily_briefing removed — replaced by send_daily_update (headlines mode)
