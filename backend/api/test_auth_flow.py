import json
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Ensure local imports work regardless of current working directory
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from werkzeug.serving import make_server
from api.app_backend import app
from database import get_db_connection
from security import decode_id

BASE_URL = "http://127.0.0.1:5001"
TEST_EMAIL = f"testuser+{int(time.time())}@example.com"
TEST_PASSWORD = "TestP@ssw0rd123"


def post(path, payload, token=None):
    url = urllib.parse.urljoin(BASE_URL, path)
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.getcode(), json.load(response)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            payload = json.loads(body)
        except Exception:
            payload = {"error": body}
        return exc.code, payload


def query_user_codes(uid):
    internal_id = decode_id(uid)
    if internal_id is None:
        raise ValueError("Unable to decode uid")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT verification_code, mfa_code FROM users WHERE id = %s",
        (internal_id,),
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row or {}


def cleanup_user(uid):
    internal_id = decode_id(uid)
    if internal_id is None:
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (internal_id,))
    conn.commit()
    cursor.close()
    conn.close()


def run_server():
    server = make_server("127.0.0.1", 5001, app)
    server.serve_forever()


def main():
    print("Starting API server on http://127.0.0.1:5001")
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    time.sleep(1)

    uid = None
    try:
        print("Registering new user...")
        status, result = post(
            "/api/auth/register",
            {
                "name": "Test User",
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
            },
        )
        print(status, result)
        if status != 201:
            raise RuntimeError("Registration failed")

        uid = result.get("uid")
        if not uid:
            raise RuntimeError("Registration response missing uid")

        print("Fetching verification code from database...")
        codes = query_user_codes(uid)
        verification_code = codes.get("verification_code")
        if not verification_code:
            raise RuntimeError("Verification code not found in DB")

        print("Verifying email...")
        status, result = post(
            "/api/auth/verify-email",
            {"uid": uid, "code": verification_code},
        )
        print(status, result)
        if status != 200:
            raise RuntimeError("Email verification failed")

        print("Logging in after verification...")
        status, result = post(
            "/api/auth/login",
            {"email": TEST_EMAIL, "password": TEST_PASSWORD},
        )
        print(status, result)
        if status != 200 or "access_token" not in result:
            raise RuntimeError("Login failed after verification")

        token = result["access_token"]

        print("Enabling MFA for user...")
        status, result = post(
            "/api/auth/enable-mfa",
            {"current_password": TEST_PASSWORD},
            token=token,
        )
        print(status, result)
        if status != 200:
            raise RuntimeError("Enable MFA failed")

        print("Logging in again to trigger MFA...")
        status, result = post(
            "/api/auth/login",
            {"email": TEST_EMAIL, "password": TEST_PASSWORD},
        )
        print(status, result)
        if status != 200 or not result.get("mfa_required"):
            raise RuntimeError("MFA login did not trigger as expected")

        print("Fetching MFA code from database...")
        codes = query_user_codes(uid)
        mfa_code = codes.get("mfa_code")
        if not mfa_code:
            raise RuntimeError("MFA code not found in DB")

        print("Verifying MFA...")
        status, result = post(
            "/api/auth/verify-mfa",
            {"email": TEST_EMAIL, "code": mfa_code},
        )
        print(status, result)
        if status != 200 or "access_token" not in result:
            raise RuntimeError("MFA verification failed")

        print("MFA flow completed successfully.")
    finally:
        if uid:
            cleanup_user(uid)
        print("Test complete. User cleanup attempted.")


if __name__ == "__main__":
    main()
