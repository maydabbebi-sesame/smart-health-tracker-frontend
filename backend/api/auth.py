import base64
import hashlib
import json
import secrets
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from functools import wraps

import jwt
from jwt import PyJWKClient
from cryptography.fernet import Fernet
from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from config import (
    JWT_ALGORITHM,
    JWT_EXP_DELTA_SECONDS,
    JWT_SECRET_KEY,
    SECRET_KEY,
    GOOGLE_CLIENT_ID,
    FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET,
    APPLE_CLIENT_ID,
)
from config import MAX_FAILED_LOGIN_ATTEMPTS, LOCKOUT_SECONDS, VERIFICATION_CODE_EXPIRY_SECONDS, MFA_CODE_EXPIRY_SECONDS
from database import get_db_connection
from security import encode_id, decode_id
from email_utils import send_verification_email, send_mfa_email


FERNET_KEY = base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode("utf-8")).digest())
fernet = Fernet(FERNET_KEY)
revoked_tokens: set[str] = set()

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def encrypt_token(token: str) -> str:
    return fernet.encrypt(token.encode("utf-8")).decode("utf-8")


def decrypt_token(token: str) -> str | None:
    try:
        return fernet.decrypt(token.encode("utf-8")).decode("utf-8")
    except Exception:
        return None


def create_access_token(user_id: int, role: str) -> str:
    payload = {
        "uid": encode_id(user_id),
        "role": role,
        "exp": datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS)
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


def fetch_json_from_url(url: str) -> dict | None:
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError):
        return None


def verify_google_id_token(id_token: str) -> dict | None:
    if not GOOGLE_CLIENT_ID:
        return None
    token_info_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(id_token)}"
    payload = fetch_json_from_url(token_info_url)
    if not payload:
        return None
    if payload.get("aud") != GOOGLE_CLIENT_ID:
        return None
    issuer = payload.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        return None
    email_verified = payload.get("email_verified")
    if email_verified not in (True, "true", "True", "1"):
        return None
    return payload


def verify_facebook_access_token(access_token: str) -> dict | None:
    if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
        return None
    app_token = f"{FACEBOOK_APP_ID}|{FACEBOOK_APP_SECRET}"
    debug_url = (
        "https://graph.facebook.com/debug_token?"
        f"input_token={urllib.parse.quote(access_token)}&access_token={urllib.parse.quote(app_token)}"
    )
    debug_info = fetch_json_from_url(debug_url)
    data = debug_info.get("data") if isinstance(debug_info, dict) else None
    if not data or not data.get("is_valid") or data.get("app_id") != FACEBOOK_APP_ID:
        return None

    graph_url = (
        "https://graph.facebook.com/me?fields=id,name,email&"
        f"access_token={urllib.parse.quote(access_token)}"
    )
    payload = fetch_json_from_url(graph_url)
    if not payload or not payload.get("id") or not payload.get("email"):
        return None
    return payload


def verify_apple_id_token(id_token: str) -> dict | None:
    if not APPLE_CLIENT_ID:
        return None
    try:
        jwk_client = PyJWKClient("https://appleid.apple.com/auth/keys")
        signing_key = jwk_client.get_signing_key_from_jwt(id_token)
        payload = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=APPLE_CLIENT_ID,
        )
        if payload.get("iss") != "https://appleid.apple.com":
            return None
        return payload
    except Exception:
        return None


def get_or_create_social_user(provider: str, provider_id: str, email: str, name: str | None):
    if not provider_id or not email:
        return None
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM users WHERE provider = %s AND provider_id = %s",
        (provider, provider_id),
    )
    user = cursor.fetchone()
    if not user:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

    if user:
        if user.get("provider") != provider or user.get("provider_id") != provider_id:
            cursor.execute(
                "UPDATE users SET provider = %s, provider_id = %s, is_verified = 1 WHERE id = %s",
                (provider, provider_id, user["id"]),
            )
            conn.commit()
        cursor.close()
        conn.close()
        return user

    random_password = generate_password_hash(secrets.token_urlsafe(32))
    name_value = name or email.split("@")[0]
    cursor.execute(
        "INSERT INTO users (name, email, password, role, is_verified, provider, provider_id) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (name_value, email, random_password, "user", 1, provider, provider_id),
    )
    conn.commit()
    user_id = cursor.lastrowid
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user


def social_login_response(user: dict):
    if not user:
        return jsonify({"error": "Unable to authenticate social login"}), 401
    token = create_access_token(user["id"], user["role"])
    return jsonify({"access_token": token, "token_type": "Bearer", "expires_in": JWT_EXP_DELTA_SECONDS})


def get_token_from_header():
    auth_header = request.headers.get("Authorization", "")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


def is_token_revoked(token: str) -> bool:
    return token in revoked_tokens


def revoke_token(token: str) -> None:
    revoked_tokens.add(token)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"error": "Authorization header missing or invalid"}), 401

        if is_token_revoked(token):
            return jsonify({"error": "Token has been revoked"}), 401

        payload = decode_auth_token(token)
        if payload is None:
            return jsonify({"error": "Invalid or expired token"}), 401

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


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400

    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Missing required fields: email, password"}), 400
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid email or password"}), 401

    # check locked_until
    locked_until = user.get("locked_until")
    if locked_until is not None:
        try:
            if isinstance(locked_until, str):
                locked_dt = datetime.fromisoformat(locked_until)
            else:
                locked_dt = locked_until
            if locked_dt > datetime.utcnow():
                cursor.close()
                conn.close()
                return jsonify({"error": "Account locked due to too many failed attempts. Try later."}), 403
        except Exception:
            pass

    if not user.get("is_verified"):
        cursor.close()
        conn.close()
        return jsonify({"error": "Email address not verified"}), 403

    if not check_password_hash(user["password"], password):
        # increment failed attempts
        cursor.execute("UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = %s", (user["id"],))
        cursor.execute("SELECT failed_attempts FROM users WHERE id = %s", (user["id"],))
        fa_row = cursor.fetchone()
        fa = fa_row.get("failed_attempts") if fa_row else None
        # lock account if threshold reached
        if fa is not None and fa >= MAX_FAILED_LOGIN_ATTEMPTS:
            lock_until = datetime.utcnow() + timedelta(seconds=LOCKOUT_SECONDS)
            cursor.execute("UPDATE users SET locked_until = %s WHERE id = %s", (lock_until, user["id"]))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid email or password"}), 401

    # successful password check -> reset failed attempts and locked_until
    cursor.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = %s", (user["id"],))
    conn.commit()

    # if MFA enabled, issue one-time MFA code and require verification
    if user.get("mfa_enabled"):
        mfa_code = f"{secrets.randbelow(1000000):06d}"
        mfa_expiry = datetime.utcnow() + timedelta(seconds=MFA_CODE_EXPIRY_SECONDS)
        cursor.execute("UPDATE users SET mfa_code = %s, mfa_expiry = %s WHERE id = %s", (mfa_code, mfa_expiry, user["id"]))
        conn.commit()
        # send MFA code by email (best-effort)
        try:
            send_mfa_email(user.get("email"), mfa_code)
        except Exception:
            pass
        cursor.close()
        conn.close()
        return jsonify({"mfa_required": True, "message": "MFA code sent"}), 200

    token = create_access_token(user["id"], user["role"])
    cursor.close()
    conn.close()
    return jsonify({"access_token": token, "token_type": "Bearer", "expires_in": JWT_EXP_DELTA_SECONDS})


@auth_bp.route("/login/google", methods=["POST"])
def login_google():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400
    id_token = data.get("id_token")
    if not id_token:
        return jsonify({"error": "Missing required field: id_token"}), 400

    payload = verify_google_id_token(id_token)
    if not payload:
        return jsonify({"error": "Invalid Google ID token"}), 401

    email = payload.get("email")
    name = payload.get("name") or payload.get("given_name")
    provider_id = payload.get("sub")
    user = get_or_create_social_user("google", provider_id, email, name)
    return social_login_response(user)


@auth_bp.route("/login/facebook", methods=["POST"])
def login_facebook():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400
    access_token = data.get("access_token")
    if not access_token:
        return jsonify({"error": "Missing required field: access_token"}), 400

    payload = verify_facebook_access_token(access_token)
    if not payload:
        return jsonify({"error": "Invalid Facebook access token"}), 401

    email = payload.get("email")
    name = payload.get("name")
    provider_id = payload.get("id")
    user = get_or_create_social_user("facebook", provider_id, email, name)
    return social_login_response(user)


@auth_bp.route("/login/apple", methods=["POST"])
def login_apple():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400
    id_token = data.get("id_token")
    if not id_token:
        return jsonify({"error": "Missing required field: id_token"}), 400

    payload = verify_apple_id_token(id_token)
    if not payload:
        return jsonify({"error": "Invalid Apple ID token"}), 401

    email = payload.get("email")
    name = payload.get("name")
    provider_id = payload.get("sub")
    user = get_or_create_social_user("apple", provider_id, email, name)
    return social_login_response(user)


@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Authorization header missing or invalid"}), 401

    revoke_token(token)
    return jsonify({"message": "Logged out successfully"})


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    if not name or not email or not password:
        return jsonify({"error": "Missing required fields: name, email, password"}), 400

    password_hash = generate_password_hash(password)
    role = data.get("role", "user")
    allowed_roles = {"user", "doctor", "admin"}
    if role not in allowed_roles:
        return jsonify({"error": "Role must be one of user, doctor, admin"}), 400

    if role != "user":
        token = get_token_from_header()
        admin_payload = decode_auth_token(token) if token else None
        if not admin_payload or admin_payload.get("role") != "admin":
            return jsonify({"error": "Only admin may register doctor or admin roles"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    verification_code = f"{secrets.randbelow(1000000):06d}"
    verification_expiry = datetime.utcnow() + timedelta(seconds=VERIFICATION_CODE_EXPIRY_SECONDS)
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password, role, is_verified, verification_code, verification_expiry) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (name, email, password_hash, role, 0, verification_code, verification_expiry)
        )
        conn.commit()
        user_id = cursor.lastrowid
    except Exception as exc:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": "Unable to register user", "details": str(exc)}), 400

    # send verification email (best-effort)
    try:
        send_verification_email(email, encode_id(user_id), verification_code)
    except Exception:
        pass

    cursor.close()
    conn.close()
    return jsonify({"message": "User registered successfully; verify email to activate account", "uid": encode_id(user_id)}), 201

@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400
    uid = data.get("uid")
    code = data.get("code")
    if not uid or not code:
        return jsonify({"error": "Missing required fields: uid, code"}), 400

    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT verification_code, verification_expiry, is_verified FROM users WHERE id = %s", (internal_id,))
    row = cursor.fetchone()
    if not row:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if row.get("is_verified"):
        cursor.close()
        conn.close()
        return jsonify({"message": "Already verified"}), 200

    if row.get("verification_code") != code:
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid verification code"}), 400

    expiry = row.get("verification_expiry")
    if expiry is not None and expiry < datetime.utcnow():
        cursor.close()
        conn.close()
        return jsonify({"error": "Verification code expired"}), 400

    cursor.execute("UPDATE users SET is_verified = 1, verification_code = NULL, verification_expiry = NULL WHERE id = %s", (internal_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Email verified successfully"}), 200

@auth_bp.route("/request-verification", methods=["POST"])
def request_verification():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400
    email = data.get("email")
    if not email:
        return jsonify({"error": "Missing required field: email"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    if not user:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    verification_code = f"{secrets.randbelow(1000000):06d}"
    verification_expiry = datetime.utcnow() + timedelta(seconds=VERIFICATION_CODE_EXPIRY_SECONDS)
    cursor.execute("UPDATE users SET verification_code = %s, verification_expiry = %s WHERE id = %s", (verification_code, verification_expiry, user["id"]))
    conn.commit()
    # send email (best-effort)
    try:
        send_verification_email(email, encode_id(user["id"]), verification_code)
    except Exception:
        pass
    cursor.close()
    conn.close()
    return jsonify({"message": "Verification code generated and sent"}), 200

@auth_bp.route("/verify-mfa", methods=["POST"])
def verify_mfa():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400
    email = data.get("email")
    code = data.get("code")
    if not email or not code:
        return jsonify({"error": "Missing required fields: email, code"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    if not user:
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid credentials"}), 401

    if not user.get("mfa_enabled") or not user.get("mfa_code"):
        cursor.close()
        conn.close()
        return jsonify({"error": "MFA not enabled or no pending MFA"}), 400

    expiry = user.get("mfa_expiry")
    if expiry is not None and expiry < datetime.utcnow():
        cursor.close()
        conn.close()
        return jsonify({"error": "MFA code expired"}), 400

    if user.get("mfa_code") != code:
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid MFA code"}), 401

    # clear MFA fields and issue token
    cursor.execute("UPDATE users SET mfa_code = NULL, mfa_expiry = NULL WHERE id = %s", (user["id"],))
    conn.commit()
    token = create_access_token(user["id"], user["role"])
    cursor.close()
    conn.close()
    return jsonify({"access_token": token, "token_type": "Bearer", "expires_in": JWT_EXP_DELTA_SECONDS})


@auth_bp.route("/enable-mfa", methods=["POST"])
@token_required
def enable_mfa():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400
    current_password = data.get("current_password")
    if not current_password:
        return jsonify({"error": "Missing required field: current_password"}), 400

    requester = g.current_user
    internal_id = decode_id(requester.get("uid"))
    if internal_id is None:
        return jsonify({"error": "Invalid user"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT password FROM users WHERE id = %s", (internal_id,))
    user = cursor.fetchone()
    if not user or not check_password_hash(user["password"], current_password):
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid current password"}), 401

    cursor.execute("UPDATE users SET mfa_enabled = 1 WHERE id = %s", (internal_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "MFA enabled for your account"}), 200
