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

from llm_client import FALLBACK_RESPONSE, call_model
from prompt_builder import build_doctor_agent_messages, build_system_prompt, build_user_message
from turn_logger import log_turn

# Lighter general-purpose model for the Doctor Agent's recommend-or-not
# decision — it reasons over signals MediAssist already distilled, not raw
# patient data, so it doesn't need medgemma1.5's long medical "thinking" chain.
DOCTOR_AGENT_MODEL = "gemma4:26b"

DOCTOR_AGENT_FALLBACK = {
    "shouldRecommend": False,
    "urgency": "normale",
    "specialty": None,
    "message": "Je n'ai pas pu analyser ta situation pour l'instant, mais tu peux chercher un médecin manuellement si besoin.",
}

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

    raw, parsed, error = call_model(messages)
    log_turn(messages, raw, parsed)

    # Only persist when the model actually produced a usable response.
    if user_uid and session_id and parsed:
        clean_assistant = _json.dumps(parsed, ensure_ascii=False)
        _save_turn(user_uid, session_id, user_content, clean_assistant)

    # If call_model reported an error (empty content after retries, timeout…),
    # surface it to the frontend so the chat shows an actionable message instead
    # of the generic "indisponible" fallback.
    effective_parsed = parsed if parsed is not None else FALLBACK_RESPONSE
    if error and parsed is None:
        effective_parsed = {**FALLBACK_RESPONSE, "analyse": error}

    return jsonify({
        "userContent":      user_content,
        "assistantContent": raw or "",
        "parsed":           effective_parsed,
        "error":            error,
    })


@app.post("/api/mediassist/doctor-agent")
def doctor_agent_decision():
    """Decide whether the Doctor Agent should proactively offer to find a
    doctor for this patient right now, based on signals MediAssist already
    produced (alerts/recommendations/orientation) — see prompt_builder.py's
    build_doctor_agent_messages for why this doesn't re-run a full medical
    analysis.

    POST body: { alerts: [...], recommendations: [...], orientation: {...} }
    Response: { shouldRecommend, urgency, specialty, message, error? }
    """
    body = request.get_json(silent=True) or {}
    messages = build_doctor_agent_messages(
        body.get("alerts"), body.get("recommendations"), body.get("orientation"),
    )

    raw, parsed, error = call_model(messages, model=DOCTOR_AGENT_MODEL)
    log_turn(messages, raw, parsed)

    if parsed is None:
        return jsonify({**DOCTOR_AGENT_FALLBACK, "error": error})

    return jsonify({
        "shouldRecommend": bool(parsed.get("shouldRecommend")),
        "urgency": parsed.get("urgency") or "normale",
        "specialty": parsed.get("specialty"),
        "message": parsed.get("message") or DOCTOR_AGENT_FALLBACK["message"],
        "error": None,
    })


@app.get("/api/mediassist/health")
def health():
    return jsonify({"status": "ok", "db": _MYSQL_OK})


if __name__ == "__main__":
    # use_reloader=False — the file-watcher restart drops in-flight connections,
    # which is fatal for requests that hold a long-running LLM call open.
    app.run(host="127.0.0.1", port=5001, debug=True, use_reloader=False)
