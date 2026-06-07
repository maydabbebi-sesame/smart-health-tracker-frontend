"""
turn_logger.py — traces each MediAssist chat turn to mediassist.log (JSON Lines,
one object per turn) so you can see exactly what was sent to the model, what it
answered, and what changed in the patient's analysis as a result.

Not committed to git (*.log is ignored) — these entries carry patient health
data, so the file should stay local.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

LOG_PATH = Path(__file__).parent / "mediassist.log"

_logger = logging.getLogger("mediassist.turns")
_logger.setLevel(logging.INFO)
_logger.propagate = False
if not _logger.handlers:
    handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(message)s"))
    _logger.addHandler(handler)


def log_turn(messages, raw_response, parsed):
    """Appends one JSON line: what was sent, the raw reply, and the resulting changes."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sent_to_model": messages,
        "raw_response": raw_response,
        "changes": {
            "urgence": (parsed or {}).get("urgence"),
            "alertes": (parsed or {}).get("alertes"),
            "recommandations": (parsed or {}).get("recommandations"),
            "orientation": (parsed or {}).get("orientation"),
        },
    }
    _logger.info(json.dumps(entry, ensure_ascii=False))
