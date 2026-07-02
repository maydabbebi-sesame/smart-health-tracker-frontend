import base64
import hashlib
from datetime import datetime, timedelta
from functools import wraps

import jwt
from cryptography.fernet import Fernet
from flask import g, jsonify, request

from .config import JWT_ALGORITHM, JWT_EXP_DELTA_SECONDS, JWT_SECRET_KEY, SECRET_KEY
from .db import get_db_connection
from .identifiers import decode_id, encode_id

_FERNET_KEY = base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode("utf-8")).digest())
_fernet = Fernet(_FERNET_KEY)


def encrypt_token(token: str) -> str:
    return _fernet.encrypt(token.encode("utf-8")).decode("utf-8")


def decrypt_token(token: str) -> str | None:
    try:
        return _fernet.decrypt(token.encode("utf-8")).decode("utf-8")
    except Exception:
        return None


def create_access_token(user_id: int, role: str, token_version: int = 0) -> str:
    payload = {
        "uid": encode_id(user_id),
        "role": role,
        "tv": token_version,
        "exp": datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS),
    }
    jwt_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encrypt_token(jwt_token)


def decode_auth_token(token: str) -> dict | None:
    decoded = decrypt_token(token)
    if decoded is None:
        return None
    try:
        return jwt.decode(decoded, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def get_token_from_header() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"error": "Authorization header missing or invalid"}), 401

        payload = decode_auth_token(token)
        if payload is None:
            return jsonify({"error": "Invalid or expired token"}), 401

        internal_id = decode_id(payload.get("uid"))
        if internal_id is None:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Re-checked on every request (not just at login) against the shared
        # `users` table, so that an admin disabling a user, or a logout/
        # forced-logout bumping token_version, immediately invalidates any
        # session already in use -- across *every* service, not just the
        # one that issued the token. This is the only revocation mechanism;
        # there is no in-memory blacklist, since that wouldn't be visible to
        # the other services.
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT is_active, token_version FROM users WHERE id = %s", (internal_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if row is None:
            return jsonify({"error": "Invalid or expired token"}), 401

        if not row.get("is_active", 1):
            return jsonify({"error": "Account disabled"}), 403

        if row.get("token_version", 0) != payload.get("tv", 0):
            return jsonify({"error": "Token has been revoked"}), 401

        g.current_user = payload
        return f(*args, **kwargs)

    return decorated


def roles_required(*allowed_roles):
    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if user is None or user.get("role") not in allowed_roles:
                return jsonify({"error": "Forbidden"}), 403
            return f(*args, **kwargs)

        return decorated

    return wrapper
