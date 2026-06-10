import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "smarthealth"),
    "password": os.getenv("DB_PASSWORD", "Test12####"),
    "database": os.getenv("DB_DATABASE", "smarthealth"),
}

SECRET_KEY = os.getenv("SECRET_KEY", "smarthealth-secret-2026")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "smarthealth-jwt-secret-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXP_DELTA_SECONDS = int(os.getenv("JWT_EXP_DELTA_SECONDS", "3600"))
MAX_FAILED_LOGIN_ATTEMPTS = int(os.getenv("MAX_FAILED_LOGIN_ATTEMPTS", "5"))
LOCKOUT_SECONDS = int(os.getenv("LOCKOUT_SECONDS", "300"))
VERIFICATION_CODE_EXPIRY_SECONDS = int(os.getenv("VERIFICATION_CODE_EXPIRY_SECONDS", "3600"))
MFA_CODE_EXPIRY_SECONDS = int(os.getenv("MFA_CODE_EXPIRY_SECONDS", "300"))

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET", "")
APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID", "")

# SMTP email settings (configure via environment variables)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.example.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "your-smtp-user@example.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "supersecret")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@smarthealth.local")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "True").lower() in ("1", "true", "yes")