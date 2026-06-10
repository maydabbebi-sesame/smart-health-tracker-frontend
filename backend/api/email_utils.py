import smtplib
from email.message import EmailMessage
from typing import Optional
from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_USE_TLS
from logger import get_logger

logger = get_logger(__name__)


def send_email(to: str, subject: str, body: str) -> bool:
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
        return False


def send_verification_email(email: str, uid: str, code: str) -> bool:
    subject = "SmartHealth — Verify your email"
    body = f"Please verify your SmartHealth account.\n\nUID: {uid}\nVerification code: {code}\n\nThis code expires in one hour."
    return send_email(email, subject, body)


def send_mfa_email(email: str, code: str) -> bool:
    subject = "SmartHealth — Your MFA code"
    body = f"Your MFA verification code is: {code}\nIt expires shortly."
    return send_email(email, subject, body)
