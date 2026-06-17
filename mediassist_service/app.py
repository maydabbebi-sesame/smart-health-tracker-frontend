#!/usr/bin/env python3
"""
app.py — MediAssist chat relay (Smart Health Tracker)

Thin Python backend in front of the Focus Gateway: the frontend posts the
patient's data, the new question, and identifiers (userUid + sessionId); this
service builds the system/user prompts, loads conversation history from MySQL
(scoped per session so a new form submission always starts fresh), forwards
everything to the model, saves the new turn, and returns the parsed JSON reply.

Usage : python app.py   (listens on http://127.0.0.1:5001)
"""

import os

import json as _json

from flask import Flask, jsonify, request
from flask_cors import CORS

from llm_client import FALLBACK_RESPONSE, call_model, parse_response
from prompt_builder import build_system_prompt, build_user_message
from turn_logger import log_turn

# ── DB setup ──────────────────────────────────────────────────────────────────
# Load credentials from the sibling backend/.env if dotenv is available,
# otherwise fall back to environment variables already set in the shell.
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
    load_dotenv(dotenv_path=_env_path, override=False)
except ImportError:
    pass

_DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", "3306")),
    "database": os.getenv("DB_NAME", "smarthealth"),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
}

try:
    import mysql.connector
    from mysql.connector import Error as _MySQLError
    _MYSQL_OK = True
except ImportError:
    _MYSQL_OK = False


def _get_db():
    if not _MYSQL_OK:
        return None
    try:
        return mysql.connector.connect(**_DB_CONFIG)
    except _MySQLError:
        return None


def _load_history(user_uid: str, session_id: str) -> list:
    """Return the stored turns for this (user, session) pair, oldest first."""
    if not user_uid or not session_id:
        return []
    conn = _get_db()
    if conn is None:
        return []
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT role, content FROM mediassist_history "
            "WHERE user_uid = %s AND session_id = %s ORDER BY created_at ASC",
            (user_uid, session_id),
        )
        rows = cur.fetchall()
        return [{"role": r["role"], "content": r["content"]} for r in rows]
    except Exception:
        return []
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass


def _save_turn(user_uid: str, session_id: str, user_content: str, assistant_content: str):
    """Persist both sides of one chat turn."""
    if not user_uid or not session_id:
        return
    conn = _get_db()
    if conn is None:
        return
    try:
        cur = conn.cursor()
        cur.executemany(
            "INSERT INTO mediassist_history (user_uid, session_id, role, content) "
            "VALUES (%s, %s, %s, %s)",
            [
                (user_uid, session_id, "user",      user_content),
                (user_uid, session_id, "assistant", assistant_content or ""),
            ],
        )
        conn.commit()
    except Exception:
        pass
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass


# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)


@app.post("/api/mediassist/chat")
def chat():
    body = request.get_json(silent=True) or {}
    patient_data = body.get("patientData") or {}
    user_uid     = (body.get("userUid") or body.get("user_uid") or "").strip()
    session_id   = (body.get("sessionId") or "").strip()
    user_text    = body.get("userText") or ""

    # Prefer DB history (scoped to this consultation session) when both
    # identifiers are present; fall back to the array sent by the frontend
    # (for unauthenticated users or when the DB is temporarily unreachable).
    if user_uid and session_id:
        history = _load_history(user_uid, session_id)
    else:
        history = body.get("history") or []

    # First turn → full initial-analysis prompt; subsequent turns → follow-up.
    user_content = build_user_message(patient_data, user_text, is_followup=bool(history))
    messages = [
        {"role": "system", "content": build_system_prompt(patient_data)},
        *history,
        {"role": "user", "content": user_content},
    ]

    raw, error = call_model(messages)
    parsed = parse_response(raw)
    log_turn(messages, raw, parsed)

    # Persist this turn so the next request picks it up from DB automatically.
    # Store the parsed JSON (not the raw thinking output) as the assistant's
    # history entry — sending thousands of <unused94>thought tokens back to the
    # model on every follow-up would waste the context window and confuse it.
    if user_uid and session_id:
        clean_assistant = _json.dumps(parsed, ensure_ascii=False) if parsed else (raw or "")
        _save_turn(user_uid, session_id, user_content, clean_assistant)

    return jsonify({
        "userContent":     user_content,
        "assistantContent": raw or "",
        "parsed":          parsed if parsed is not None else FALLBACK_RESPONSE,
        "error":           error,
    })


@app.get("/api/mediassist/health")
def health():
    return jsonify({"status": "ok", "db": _MYSQL_OK})


if __name__ == "__main__":
    # use_reloader=False — the file-watcher restart drops in-flight connections,
    # which is fatal for requests that hold a long-running LLM call open.
    app.run(host="127.0.0.1", port=5001, debug=True, use_reloader=False)
