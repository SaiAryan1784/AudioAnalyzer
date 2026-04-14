"""
Email service — Resend API wrapper.

Required env vars:
  RESEND_API_KEY   — Resend API key (get from resend.com)
  EMAIL_FROM       — Sender address, e.g. "AudioAnalyzer <noreply@audioanalyzer.app>"
  FRONTEND_URL     — Base URL for link generation, e.g. https://audio-analyzer-beta.vercel.app
"""

import httpx
import logging

from app.config import settings

logger = logging.getLogger(__name__)

RESEND_URL = "https://api.resend.com/emails"


async def _send(to: str, subject: str, html: str) -> bool:
    """Send an email via Resend. Returns True on success, False on failure."""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — email skipped (to=%s subject=%s)", to, subject)
        return False

    payload = {
        "from":    settings.EMAIL_FROM,
        "to":      [to],
        "subject": subject,
        "html":    html,
    }
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type":  "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(RESEND_URL, json=payload, headers=headers)
            if resp.status_code not in (200, 201):
                logger.error("Resend error %s: %s", resp.status_code, resp.text)
                return False
        return True
    except Exception as exc:
        logger.exception("Failed to send email to %s: %s", to, exc)
        return False


# ─── Email templates ──────────────────────────────────────────────────────────────

def _base_template(title: str, body: str) -> str:
    """Minimal branded email shell."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#06080F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#F0EDE8;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px;background:#0D1020;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                  <span style="font-weight:800;font-size:18px;letter-spacing:-0.5px;color:#fff;">AudioAnalyzer</span>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fff;">{title}</h1>
                  {body}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);">
                    This email was sent from AudioAnalyzer. If you didn't request this, you can safely ignore it.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def _cta_button(href: str, label: str) -> str:
    return f"""
    <a href="{href}"
       style="display:inline-block;margin:20px 0;padding:14px 28px;background:#E8FF47;
              color:#06080F;font-weight:700;font-size:14px;text-decoration:none;
              border-radius:10px;letter-spacing:-0.2px;">
      {label}
    </a>
    """


async def send_password_reset_email(to: str, reset_url: str) -> bool:
    body = f"""
    <p style="margin:0 0 12px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;">
      We received a request to reset the password for your AudioAnalyzer account.
      Click the button below to choose a new password. This link expires in <strong style="color:#fff;">1 hour</strong>.
    </p>
    {_cta_button(reset_url, "Reset Password")}
    <p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.4);">
      Or copy this link: <a href="{reset_url}" style="color:#E8FF47;">{reset_url}</a>
    </p>
    """
    return await _send(to, "Reset your AudioAnalyzer password", _base_template("Reset your password", body))


async def send_verification_email(to: str, verify_url: str) -> bool:
    body = f"""
    <p style="margin:0 0 12px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;">
      Thanks for signing up! Please verify your email address to unlock audio analysis.
      This link expires in <strong style="color:#fff;">24 hours</strong>.
    </p>
    {_cta_button(verify_url, "Verify Email Address")}
    <p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.4);">
      Or copy this link: <a href="{verify_url}" style="color:#E8FF47;">{verify_url}</a>
    </p>
    """
    return await _send(to, "Verify your AudioAnalyzer email", _base_template("Verify your email", body))


async def send_welcome_email(to: str, name: str | None) -> bool:
    display = name or "there"
    body = f"""
    <p style="margin:0 0 12px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;">
      Hi {display}, your email is verified and your account is ready.
      Upload your first recording to get an AI-powered analysis in under 60 seconds.
    </p>
    {_cta_button(settings.FRONTEND_URL, "Start Analyzing")}
    """
    return await _send(to, "Welcome to AudioAnalyzer 🎵", _base_template("You're all set!", body))
