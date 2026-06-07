#!/usr/bin/env python3
"""
app.py — MediAssist chat relay (Smart Health Tracker)

A thin Python backend in front of the Focus Gateway: the frontend posts the
patient's data, the running conversation history and the new question; this
service builds the system/user prompts (prompt_builder.py), forwards them to
the model (llm_client.py) and returns its parsed JSON reply. Keeping this on
the server side means the gateway API key never reaches the browser.

The service is stateless — the conversation history is supplied by the caller
on every turn and persisted client-side — so it can be scaled horizontally
without any session handling.

Every turn is traced to mediassist.log (see turn_logger.py): what was sent to
the model, its raw reply, and the resulting changes (urgence/alertes/
recommandations/orientation).

Usage : python app.py   (listens on http://127.0.0.1:5001)
"""

from flask import Flask, jsonify, request
from flask_cors import CORS

from llm_client import FALLBACK_RESPONSE, call_model, parse_response
from prompt_builder import build_system_prompt, build_user_message
from turn_logger import log_turn

app = Flask(__name__)
CORS(app)


@app.post("/api/mediassist/chat")
def chat():
    body = request.get_json(silent=True) or {}
    patient_data = body.get("patientData") or {}
    history = body.get("history") or []
    user_text = body.get("userText") or ""

    # The very first turn gets the full patient-data dump (no history yet);
    # every later turn is a follow-up in an ongoing conversation — the profile
    # is already in the system prompt and in `history`, so it isn't repeated.
    user_content = build_user_message(patient_data, user_text, is_followup=bool(history))
    messages = [
        {"role": "system", "content": build_system_prompt(patient_data)},
        *history,
        {"role": "user", "content": user_content},
    ]

    raw, error = call_model(messages)
    parsed = parse_response(raw)

    # Trace this turn to mediassist.log: what we sent the model, its raw
    # reply, and the resulting changes (urgence/alertes/recommandations/
    # orientation) — handy for debugging prompts and parsing without
    # reaching into the model's logs.
    log_turn(messages, raw, parsed)

    return jsonify({
        "userContent": user_content,
        "assistantContent": raw or "",
        "parsed": parsed if parsed is not None else FALLBACK_RESPONSE,
        "error": error,
    })


@app.get("/api/mediassist/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # use_reloader=False — the file-watcher restart drops in-flight connections,
    # which is fatal for requests that hold a long-running LLM call open.
    app.run(host="127.0.0.1", port=5001, debug=True, use_reloader=False)
