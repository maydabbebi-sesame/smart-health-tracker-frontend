"""
llm_client.py — Focus Gateway client + JSON-response parsing for MediAssist.
Mirrors the request shape, response formats (Ollama native + OpenAI-compatible)
and JSON-extraction fallback chain previously used on the frontend, so the
backend and the model agree on exactly the same contract.
"""

import json
import re

import requests

GATEWAY_URL = "http://172.26.33.20:12345/api/chat"
API_KEY = "sk-64c932a912b64339928b35feea0c45e1"
MODEL = "medgemma1.5:latest"
# medgemma1.5 is a "thinking" model — it produces a long internal reasoning
# block before its final JSON, so generation routinely runs past a minute.
# This must stay comfortably BELOW the frontend's TIMEOUT_MS (mediAssistService.js)
# so the gateway call can finish (success or its own error) and still get
# logged/returned before the browser gives up on the request.
TIMEOUT_S = 500

_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
_JSON_OBJECT_RE = re.compile(r"\{[\s\S]*\}")


def call_model(messages):
    """POSTs one chat turn to the Focus Gateway and returns (raw_text, error)."""
    try:
        resp = requests.post(
            GATEWAY_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}",
            },
            json={
                "model": MODEL,
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 3500, "num_ctx": 8192},
                "messages": messages,
            },
            timeout=TIMEOUT_S,
        )
    except requests.Timeout:
        return "", "L'analyse a depasse le delai imparti. Reessayez."
    except requests.RequestException as exc:
        return "", str(exc)

    if resp.status_code == 401:
        return "", "Cle API invalide."
    if resp.status_code == 403:
        return "", "Acces refuse au gateway LLM."
    if not resp.ok:
        return "", f"Erreur gateway LLM : {resp.status_code}"

    data = resp.json()

    # Support both Ollama-native ("message") and OpenAI-compatible ("choices")
    # response shapes — and the "thinking model" quirk where the JSON ends up
    # in the reasoning/thinking field instead of content.
    raw = ""
    if "choices" in data:
        message = (data.get("choices") or [{}])[0].get("message") or {}
        raw = message.get("content") or ""
        if not raw.strip():
            match = _JSON_OBJECT_RE.search(message.get("reasoning") or "")
            if match:
                raw = match.group(0)
    elif "message" in data:
        message = data.get("message") or {}
        raw = message.get("content") or ""
        if not raw.strip():
            match = _JSON_OBJECT_RE.search(message.get("thinking") or "")
            if match:
                raw = match.group(0)

    return raw, None


def parse_response(raw):
    """Parses the model's JSON reply, tolerating the usual formatting slips."""
    if not raw or not raw.strip():
        return None

    text = raw.strip()

    try:
        return json.loads(text)
    except ValueError:
        pass

    try:
        cleaned = _CONTROL_CHARS_RE.sub("", text.replace("\t", "\\t").replace("\r", "\\r"))
        return json.loads(cleaned)
    except ValueError:
        pass

    match = _JSON_OBJECT_RE.search(text)
    if match:
        try:
            return json.loads(match.group(0))
        except ValueError:
            pass

    return None


FALLBACK_RESPONSE = {
    "urgence": "moderee",
    "alertes": [],
    "resume_situation": "Analyse temporairement indisponible.",
    "analyse": "Nous n'avons pas pu analyser vos donnees correctement. Veuillez reessayer.",
    "recommandations": [],
    "orientation": {
        "niveau": "medecin_generaliste",
        "raison": "En cas de doute, consultez votre medecin.",
        "delai": "cette semaine",
    },
    "disclaimer": "Ces informations sont indicatives et ne remplacent pas une consultation medicale.",
}
