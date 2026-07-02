import smtplib
from email.message import EmailMessage

from .config import (
    EMAIL_DEV_MODE,
    SMTP_ENABLED,
    SMTP_FROM,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USE_TLS,
    SMTP_USER,
)
from .logger import get_logger

logger = get_logger(__name__)


def _log_dev_email(to: str, subject: str, body: str) -> None:
    logger.warning(
        "[DEV EMAIL] SMTP unavailable — email not sent.\n"
        "  To: %s\n"
        "  Subject: %s\n"
        "  Body:\n%s",
        to,
        subject,
        body,
    )


def send_email(to: str, subject: str, body: str) -> bool:
    if not SMTP_ENABLED:
        if EMAIL_DEV_MODE:
            _log_dev_email(to, subject, body)
        else:
            logger.error(
                "SMTP is not configured (set SMTP_HOST/SMTP_USER or EMAIL_DEV_MODE=true for local testing)"
            )
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg.set_content(body)

    try:
        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)

        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)

        server.send_message(msg)
        server.quit()
        logger.info("Sent email to %s subject=%s", to, subject)
        return True
    except Exception as exc:
        logger.exception("Failed to send email to %s: %s", to, exc)
        if EMAIL_DEV_MODE:
            _log_dev_email(to, subject, body)
        return False


def send_verification_email(email: str, uid: str, code: str) -> bool:
    subject = "SmartHealth — Verify your email"
    body = (
        f"Please verify your SmartHealth account.\n\n"
        f"UID: {uid}\n"
        f"Verification code: {code}\n\n"
        f"This code expires in one hour."
    )
    sent = send_email(email, subject, body)
    if not sent and EMAIL_DEV_MODE:
        logger.info("[DEV] Verification code for %s: %s (uid=%s)", email, code, uid)
    return sent


def send_mfa_email(email: str, code: str) -> bool:
    subject = "SmartHealth — Your MFA code"
    body = f"Your MFA verification code is: {code}\nIt expires shortly."
    sent = send_email(email, subject, body)
    if not sent and EMAIL_DEV_MODE:
        logger.info("[DEV] MFA code for %s: %s", email, code)
    return sent
