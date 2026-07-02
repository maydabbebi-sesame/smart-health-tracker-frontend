import os

from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET", "")
APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID", "")

MAX_FAILED_LOGIN_ATTEMPTS = int(os.getenv("MAX_FAILED_LOGIN_ATTEMPTS", "5"))
LOCKOUT_SECONDS = int(os.getenv("LOCKOUT_SECONDS", "300"))
VERIFICATION_CODE_EXPIRY_SECONDS = int(os.getenv("VERIFICATION_CODE_EXPIRY_SECONDS", "3600"))
MFA_CODE_EXPIRY_SECONDS = int(os.getenv("MFA_CODE_EXPIRY_SECONDS", "300"))

PORT = int(os.getenv("PORT", "5101"))
