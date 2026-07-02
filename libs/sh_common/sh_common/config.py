import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "smarthealth-secret-2026")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "smarthealth-jwt-secret-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXP_DELTA_SECONDS = int(os.getenv("JWT_EXP_DELTA_SECONDS", "3600"))

# Each service supplies its own DB_USER/DB_PASSWORD (scoped to the tables it
# owns via GRANTs) while pointing at the same DB_HOST/DB_DATABASE.
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "smarthealth"),
    "password": os.getenv("DB_PASSWORD", "Test12####"),
    "database": os.getenv("DB_DATABASE", "smarthealth"),
}

# SMTP email settings (configure via environment variables)
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@smarthealth.local")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "True").lower() in ("1", "true", "yes")

_PLACEHOLDER_SMTP_HOSTS = {"", "smtp.example.com", "localhost", "127.0.0.1"}
_smtp_enabled_env = os.getenv("SMTP_ENABLED", "").lower()
if _smtp_enabled_env in ("1", "true", "yes"):
    SMTP_ENABLED = True
elif _smtp_enabled_env in ("0", "false", "no"):
    SMTP_ENABLED = False
else:
    SMTP_ENABLED = SMTP_HOST not in _PLACEHOLDER_SMTP_HOSTS and bool(SMTP_USER)

_email_dev_env = os.getenv("EMAIL_DEV_MODE", "").lower()
if _email_dev_env in ("1", "true", "yes"):
    EMAIL_DEV_MODE = True
elif _email_dev_env in ("0", "false", "no"):
    EMAIL_DEV_MODE = False
else:
    EMAIL_DEV_MODE = not SMTP_ENABLED

# RabbitMQ event bus (see sh_common.events) -- used for cross-service events
# like appointment lifecycle notifications, not for the in-process
# vitals/forms -> alerts path (those stay direct function calls since
# they're co-located in health-data-service).
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASSWORD = os.getenv("RABBITMQ_PASSWORD", "guest")
