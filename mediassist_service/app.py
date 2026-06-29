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

import base64
import hashlib
import hmac
import os

import json as _json

from flask import Flask, jsonify, request
from flask_cors import CORS

from llm_client import FALLBACK_RESPONSE, call_model
from prompt_builder import (
    build_doctor_agent_messages,
    build_system_prompt,
    build_trend_analysis_messages,
    build_user_message,
    clean_trend_synthese,
    normalize_chat_response,
    normalize_tendances,
    response_is_incomplete,
)
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
# Load credentials from backend/api/.env (the .env backend/api/config.py
# itself reads) if dotenv is available, otherwise fall back to environment
# variables already set in the shell.
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'api', '.env')
    load_dotenv(dotenv_path=_env_path, override=False)
except ImportError:
    pass

_DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", "3306")),
    "database": os.getenv("DB_DATABASE", "smarthealth"),
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


# mediassist_history keys rows by the numeric users.id, like every other
# per-user table (vitals, medical_history...). The frontend never has that
# raw id though — it only holds the signed "uid" token backend/api/security.py
# hands out (encode_id), so every request still arrives with that token and
# gets decoded here. Duplicated from security.py's decode_id rather than
# imported because mediassist_service is a standalone Flask app with no
# dependency on the backend/api package; keep the two in sync if either
# changes.
_SECRET_KEY = os.getenv("SECRET_KEY", "smarthealth-secret-2026")


def _decode_user_id(public_uid: str):
    if not public_uid:
        return None
    try:
        padded = public_uid + "=" * (-len(public_uid) % 4)
        token = base64.urlsafe_b64decode(padded)
        payload, signature = token.split(b".", 1)
        expected = hmac.new(_SECRET_KEY.encode("utf-8"), payload, hashlib.sha256).digest()
        if hmac.compare_digest(signature, expected):
            return int(payload.decode("utf-8"))
    except Exception:
        return None
    return None


def _load_history(user_id: int, session_id: str) -> list:
    """Return the stored turns for this (user, session) pair, oldest first."""
    if not user_id or not session_id:
        return []
    conn = _get_db()
    if conn is None:
        return []
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT role, content FROM mediassist_history "
            "WHERE user_id = %s AND session_id = %s ORDER BY created_at ASC",
            (user_id, session_id),
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


def _save_turn(user_id: int, session_id: str, user_content: str, assistant_content: str):
    """Persist both sides of one chat turn."""
    if not user_id or not session_id:
        return
    conn = _get_db()
    if conn is None:
        return
    try:
        cur = conn.cursor()
        cur.executemany(
            "INSERT INTO mediassist_history (user_id, session_id, role, content) "
            "VALUES (%s, %s, %s, %s)",
            [
                (user_id, session_id, "user",      user_content),
                (user_id, session_id, "assistant", assistant_content or ""),
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


def _save_recommendations(user_id: int, session_id: str, recommandations: list, fallback_urgence: str):
    """Persist each recommendation from a real (non-fallback) initial analysis
    into mediassist_recommendations, flattened -- separate from mediassist_history's
    raw JSON turns, so /api/mediassist/recommendations-history can serve the
    user's last known-good recommendations when a later turn's LLM call fails
    and falls back to an empty response (see llm_client.FALLBACK_RESPONSE).

    Individual recommendations don't carry their own "urgence" (only the
    overall analysis does -- see prompt_builder's schema), so fallback_urgence
    mirrors medAssistStore.applyAnalysis's normalizeUrgence(parsed.urgence).
    """
    if not user_id or not recommandations:
        return
    conn = _get_db()
    if conn is None:
        return
    urgence = fallback_urgence if fallback_urgence in ("normale", "moderee", "elevee", "critique") else "normale"
    try:
        cur = conn.cursor()
        cur.executemany(
            "INSERT INTO mediassist_recommendations "
            "(user_id, session_id, titre, detail, pourquoi, priorite, urgence) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            [
                (
                    user_id, session_id,
                    (r.get("titre") or "")[:255],
                    r.get("detail") or "",
                    r.get("pourquoi") or "",
                    r.get("priorite") if r.get("priorite") in ("haute", "moyenne", "basse") else "basse",
                    urgence,
                )
                for r in recommandations if r and r.get("titre")
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
    user_id      = _decode_user_id((body.get("userUid") or body.get("user_uid") or "").strip())
    session_id   = (body.get("sessionId") or "").strip()
    user_text    = body.get("userText") or ""

    # Prefer DB history (scoped to this consultation session) when both
    # identifiers are present; fall back to the array sent by the frontend
    # (for unauthenticated users or when the DB is temporarily unreachable).
    if user_id and session_id:
        history = _load_history(user_id, session_id)
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
    if parsed is not None:
        parsed = normalize_chat_response(parsed)

    # Two known degenerate-but-syntactically-valid failure modes, neither a
    # prompt-building bug (messages sent differ correctly turn to turn, see
    # mediassist.log): (1) medgemma1.5 occasionally echoes the previous
    # turn's response verbatim for a genuinely new follow-up question; (2) it
    # plans a detailed list in its own reasoning but closes "analyse" right
    # after announcing it ("Voici les principes generaux :") without ever
    # writing the list. One retry is enough to break out of either in practice.
    is_duplicate = (
        history and history[-1]["role"] == "assistant" and parsed is not None
        and _json.dumps(parsed, ensure_ascii=False) == history[-1]["content"]
    )
    if parsed is not None and (is_duplicate or response_is_incomplete(parsed)):
        raw, parsed, error = call_model(messages)
        if parsed is not None:
            parsed = normalize_chat_response(parsed)

    log_turn(messages, raw, parsed)

    # Only persist when the model actually produced a usable response.
    if user_id and session_id and parsed:
        clean_assistant = _json.dumps(parsed, ensure_ascii=False)
        _save_turn(user_id, session_id, user_content, clean_assistant)

        # Only the initial analysis of a session seeds the recommendations
        # history (mirrors medAssistStore.applyAnalysis only being called for
        # isInitial turns on the frontend) -- a follow-up's recommandations
        # are conversational, not a fresh full analysis.
        if not history:
            _save_recommendations(user_id, session_id, parsed.get("recommandations") or [], parsed.get("urgence"))

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


TREND_ANALYSIS_FALLBACK = {
    "periode": "",
    "synthese": "Nous n'avons pas pu analyser vos tendances pour l'instant. Réessayez plus tard.",
    "tendances": [],
    "points_attention": [],
    "recommandations": [],
    "disclaimer": "Ces informations sont indicatives et ne remplacent pas une consultation médicale.",
}


@app.post("/api/mediassist/analyze-trends")
def analyze_trends():
    """Analyze how a patient's vitals/symptoms evolved over a chosen period
    (week/month/3months) for the health-history page's "Analyser mes
    tendances" button. Stateless and unpersisted — this is a one-off export,
    not a conversation to resume (see prompt_builder.build_trend_analysis_messages).

    POST body: { vitals: [...], period: "week"|"month"|"3months" }
    Response: trend-analysis JSON (see prompt_builder) + error?
    """
    body = request.get_json(silent=True) or {}
    vitals = body.get("vitals") or []
    period = body.get("period") or ""

    messages = build_trend_analysis_messages(vitals, period)
    raw, parsed, error = call_model(messages)
    log_turn(messages, raw, parsed)

    if parsed is None:
        return jsonify({**TREND_ANALYSIS_FALLBACK, "error": error})

    if parsed.get("synthese"):
        parsed["synthese"] = clean_trend_synthese(parsed["synthese"])

    if parsed.get("tendances"):
        parsed["tendances"] = normalize_tendances(parsed["tendances"])

    return jsonify({**parsed, "error": None})


_PRIORITY_ORDER = {"haute": 0, "moyenne": 1, "basse": 2}


@app.get("/api/mediassist/recommendations")
def latest_recommendation():
    """Dashboard "Recommandation IA" card: surfaces the top-priority
    recommendation from the patient's most recent MediAssist analysis.

    Reads mediassist_recommendations (the flattened table _save_recommendations
    fills on every real initial analysis -- see chat() above) rather than
    parsing mediassist_history's raw JSON turns directly: the latest chat turn
    there can be a follow-up question, or the generic empty FALLBACK_RESPONSE
    from a failed LLM gateway call, neither of which is a recommendation. This
    keeps the dashboard showing the patient's last known-good recommendation
    in that case instead of nothing -- same fallback table the AI Analysis
    page uses (see recommendations_history below).
    """
    user_id = _decode_user_id((request.args.get("user_uid") or "").strip())
    if not user_id:
        return jsonify({"summary": None, "error": "user_uid manquant ou invalide"}), 400

    conn = _get_db()
    if conn is None:
        return jsonify({"summary": None, "error": "Base de données indisponible"})

    rows = []
    try:
        cur = conn.cursor(dictionary=True)
        # Scope to the most recent analysis's own session_id so a high-priority
        # recommendation from an older analysis never outranks a real, more
        # recent (even if lower-priority) one.
        cur.execute(
            "SELECT titre, detail, pourquoi, priorite FROM mediassist_recommendations "
            "WHERE user_id = %s AND session_id = ("
            "  SELECT session_id FROM mediassist_recommendations "
            "  WHERE user_id = %s ORDER BY created_at DESC LIMIT 1"
            ")",
            (user_id, user_id),
        )
        rows = cur.fetchall()
    except Exception:
        rows = []
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass

    if not rows:
        return jsonify({"summary": None, "recommendation": None, "error": None})

    top = min(rows, key=lambda r: _PRIORITY_ORDER.get(r["priorite"], 99))
    return jsonify({
        "summary": top["titre"],
        "recommendation": {
            "titre": top["titre"],
            "detail": top["detail"],
            "pourquoi": top["pourquoi"],
            "priorite": top["priorite"],
        },
        "error": None,
    })


@app.get("/api/mediassist/recommendations-history")
def recommendations_history():
    """AI Analysis page fallback: when the live chat turn's LLM call fails
    (gateway unreachable/timeout) it falls back to FALLBACK_RESPONSE, which
    has no recommandations -- this returns the patient's last persisted
    recommendations (see _save_recommendations) so the page can show those
    instead of an empty panel.
    """
    user_id = _decode_user_id((request.args.get("user_uid") or "").strip())
    if not user_id:
        return jsonify({"recommendations": [], "error": "user_uid manquant ou invalide"}), 400

    conn = _get_db()
    if conn is None:
        return jsonify({"recommendations": [], "error": "Base de données indisponible"})

    rows = []
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT titre, detail, pourquoi, priorite, urgence, created_at "
            "FROM mediassist_recommendations WHERE user_id = %s "
            "ORDER BY created_at DESC LIMIT 10",
            (user_id,),
        )
        rows = cur.fetchall()
    except Exception:
        rows = []
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass

    recommendations = [
        {
            "titre": r["titre"],
            "detail": r["detail"] or "",
            "pourquoi": r["pourquoi"] or "",
            "priorite": r["priorite"],
            "urgence": r["urgence"],
            "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
        }
        for r in rows
    ]
    return jsonify({"recommendations": recommendations, "error": None})


@app.get("/api/mediassist/health")
def health():
    return jsonify({"status": "ok", "db": _MYSQL_OK})


if __name__ == "__main__":
    # use_reloader=False — the file-watcher restart drops in-flight connections,
    # which is fatal for requests that hold a long-running LLM call open.
    app.run(host="127.0.0.1", port=5001, debug=True, use_reloader=False)
