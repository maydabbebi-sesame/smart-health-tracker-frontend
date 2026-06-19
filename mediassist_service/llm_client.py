"""
llm_client.py — Focus Gateway client + JSON-response parsing for MediAssist.
Uses streaming so proxy/read timeouts never fire mid-generation: the gateway
sends a token chunk every few milliseconds, keeping the connection alive while
the model "thinks" through its reasoning block before emitting JSON.
"""

import json
import re
import time

import requests

GATEWAY_URL = "http://172.26.33.20:12345/api/chat"
API_KEY = "sk-64c932a912b64339928b35feea0c45e1"
MODEL = "medgemma1.5:latest"

# medgemma1.5 is a "thinking" model — it produces a long internal reasoning
# block (3 000–8 000 tokens) before its final JSON.  num_predict must cover
# the full thinking + JSON budget.  With stream=True the gateway sends each
# token as it is generated, so this setting only limits total output length,
# not wall-clock time.  repeat_penalty/repeat_last_n discourage the model
# from getting stuck looping its own checklist instead of emitting JSON
# (observed: it re-answered "minimum 3 sentences? Yes." 500+ times in a row).
_OPTIONS = {
    "temperature": 0.3,
    "num_predict": 10000,
    "num_ctx": 16384,
    "repeat_penalty": 1.3,
    "repeat_last_n": 256,
}

# Repetition guard: every this many streamed chunks, check whether the tail
# of the output has repeated verbatim too many times — a cheap, model-agnostic
# way to detect the degenerate-looping failure mode above and cut the stream
# short instead of burning the full num_predict budget (and several minutes)
# on a turn that was never going to produce valid JSON. Checked frequently
# (every 60 tokens) so a loop is caught within a few hundred characters,
# leaving time for retries within the same overall wait.
_REPEAT_CHECK_EVERY = 60
_REPEAT_TAIL_CHARS = 80
_REPEAT_MAX_OCCURRENCES = 4

# (connect_timeout, chunk_timeout): 15 s to establish the TCP connection,
# 120 s max between any two consecutive chunks.  Even at 1 tok/s the model
# streams a chunk every second, so 120 s is effectively "never timeout during
# active generation".
_TIMEOUT = (15, 120)
# Retries now cover BOTH empty streams and streams that produced text but no
# parseable JSON (e.g. the degenerate-repetition failure mode) — see call_model.
_MAX_RETRIES = 3

_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
_JSON_OBJECT_RE = re.compile(r"\{[\s\S]*\}")
# medgemma1.5 separates its internal reasoning from its actual output with
# special tokens like <unused95>. Everything AFTER the last such token is
# the "real" response.
_THINKING_SEPARATOR_RE = re.compile(r"<unused\d+>|<\|assistant\|>|<\|end_header_id\|>")
_CODE_FENCE_JSON_RE = re.compile(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```")


def _read_stream(resp) -> str:
    """Consume a streaming response and return the concatenated assistant content.

    Handles both Ollama-native chunked JSON lines and OpenAI-compatible SSE
    (``data: {...}`` lines).  Returns an empty string if the stream closes
    without producing content.
    """
    chunks = []
    chunks_since_check = 0
    try:
        for line in resp.iter_lines():
            if not line:
                continue
            # decode_unicode=True silently no-ops when the response has no
            # declared charset, leaving lines as bytes — decode explicitly.
            if isinstance(line, bytes):
                line = line.decode("utf-8", errors="replace")
            line = line.strip()
            if not line:
                continue

            # OpenAI SSE prefix
            if line.startswith("data: "):
                line = line[6:]
                if line.strip() == "[DONE]":
                    break

            try:
                chunk = json.loads(line)
            except json.JSONDecodeError:
                continue

            got_delta = False

            # Ollama native streaming format
            if "message" in chunk:
                delta = chunk["message"].get("content") or ""
                chunks.append(delta)
                got_delta = True
                if chunk.get("done"):
                    break

            # OpenAI-compatible streaming format
            elif "choices" in chunk:
                delta = (chunk["choices"][0].get("delta") or {}).get("content") or ""
                chunks.append(delta)
                got_delta = True
                if chunk["choices"][0].get("finish_reason"):
                    break

            if not got_delta:
                continue
            chunks_since_check += 1
            if chunks_since_check < _REPEAT_CHECK_EVERY:
                continue
            chunks_since_check = 0

            raw_so_far = "".join(chunks)
            if len(raw_so_far) <= _REPEAT_TAIL_CHARS:
                continue
            tail = raw_so_far[-_REPEAT_TAIL_CHARS:]
            if raw_so_far.count(tail) >= _REPEAT_MAX_OCCURRENCES:
                # Degenerate loop detected (model re-emitting the same
                # checklist line instead of progressing to JSON) — stop
                # reading now rather than waiting out the full token budget.
                break

    except requests.Timeout:
        # Re-raise so call_model can surface the right error message
        raise
    except requests.RequestException:
        raise

    return "".join(chunks)


def call_model(messages, model=MODEL):
    """POSTs one chat turn to the Focus Gateway using streaming and returns
    (raw_text, parsed, error).

    `model` defaults to medgemma1.5 (the only model the main MediAssist chat
    uses) but callers needing a lighter/faster model for a simpler task (e.g.
    the Doctor Agent's recommend-or-not decision, which reasons over already
    distilled clinical signals rather than raw patient data) can pass a
    different model id registered on the same gateway.

    Retries up to _MAX_RETRIES times when the stream closes with empty content
    OR when it produced text that doesn't parse as valid JSON — medgemma1.5
    occasionally degenerates into looping its own checklist instead of ever
    emitting the JSON (see the repetition guard in _read_stream), and that
    failure produces non-empty but unusable text, so emptiness alone isn't
    a reliable signal that a retry is needed.
    """
    payload = {
        "model": model,
        "stream": True,
        "options": _OPTIONS,
        "messages": messages,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }

    last_raw = ""
    for attempt in range(_MAX_RETRIES):
        try:
            resp = requests.post(
                GATEWAY_URL,
                headers=headers,
                json=payload,
                timeout=_TIMEOUT,
                stream=True,
            )
        except requests.Timeout:
            return "", None, "L'analyse a depasse le delai imparti. Reessayez."
        except requests.RequestException as exc:
            return "", None, str(exc)

        if resp.status_code == 401:
            return "", None, "Cle API invalide."
        if resp.status_code == 403:
            return "", None, "Acces refuse au gateway LLM."
        if not resp.ok:
            return "", None, f"Erreur gateway LLM : {resp.status_code}"

        try:
            raw = _read_stream(resp)
        except requests.Timeout:
            return "", None, "L'analyse a depasse le delai imparti (lecture). Reessayez."
        except requests.RequestException as exc:
            if attempt < _MAX_RETRIES - 1:
                time.sleep(3)
                continue
            return "", None, str(exc)

        last_raw = raw
        parsed = parse_response(raw)
        if parsed is not None:
            return raw, parsed, None

        if attempt < _MAX_RETRIES - 1:
            time.sleep(3)

    return last_raw, None, "Le modele n'a pas produit de reponse exploitable apres plusieurs tentatives. Reessayez."


def parse_response(raw):
    """Parses the model's JSON reply, tolerating the usual formatting slips."""
    if not raw or not raw.strip():
        return None

    text = raw.strip()

    # medgemma1.5 emits its chain-of-thought before a separator token like
    # <unused95>, then the actual JSON output after it. Taking the last segment
    # isolates the real response and prevents the greedy regex below from
    # anchoring on stray { } characters inside the reasoning block.
    parts = _THINKING_SEPARATOR_RE.split(text)
    if len(parts) > 1:
        text = parts[-1].strip()

    # 1. Direct parse (model output is clean JSON)
    try:
        return json.loads(text)
    except ValueError:
        pass

    # 2. JSON inside a markdown code fence (```json ... ```)
    match = _CODE_FENCE_JSON_RE.search(text)
    if match:
        try:
            return json.loads(match.group(1))
        except ValueError:
            pass

    # 3. Control-character cleanup then retry
    try:
        cleaned = _CONTROL_CHARS_RE.sub("", text.replace("\t", "\\t").replace("\r", "\\r"))
        return json.loads(cleaned)
    except ValueError:
        pass

    # 4. Last resort: try every JSON-object-shaped substring
    for match in _JSON_OBJECT_RE.finditer(text):
        try:
            return json.loads(match.group(0))
        except ValueError:
            continue

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
