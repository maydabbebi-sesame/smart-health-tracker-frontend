import base64
import hashlib
import hmac

from .config import SECRET_KEY


def _pad(text: str) -> str:
    return text + "=" * (-len(text) % 4)


def encode_id(internal_id: int) -> str:
    payload = str(internal_id).encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), payload, hashlib.sha256).digest()
    token = payload + b"." + signature
    return base64.urlsafe_b64encode(token).decode("utf-8").rstrip("=")


def decode_id(public_id: str) -> int | None:
    try:
        token = base64.urlsafe_b64decode(_pad(public_id))
        payload, signature = token.split(b".", 1)
        expected = hmac.new(SECRET_KEY.encode("utf-8"), payload, hashlib.sha256).digest()
        if hmac.compare_digest(signature, expected):
            return int(payload.decode("utf-8"))
    except Exception:
        return None
    return None
