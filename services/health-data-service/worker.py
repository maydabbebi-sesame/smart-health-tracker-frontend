"""Standalone consumer process for cross-service events (run separately from
app.py's HTTP API -- see docs/microservices-migration-plan.html, Messaging).

Currently handles `appointment.*` events published by
doctors-appointments-service, turning them into in-app alerts owned by this
service, without doctors-appointments-service needing to know the alerts
schema.

Usage: python worker.py
"""
from sh_common import consume_events, get_logger
from sh_common.db import get_db_connection

from alerts import insert_alert

logger = get_logger(__name__)

QUEUE_NAME = "health-data-appointment-events"
ROUTING_KEYS = ["appointment.*"]


def _handle_appointment_event(routing_key: str, payload: dict) -> None:
    user_id = payload.get("user_id")
    title = payload.get("title")
    message = payload.get("message")
    if not user_id or not title or not message:
        logger.warning("Dropping malformed event routing_key=%s payload=%s", routing_key, payload)
        return

    category = "appointment"
    conn = get_db_connection()
    try:
        insert_alert(conn, user_id, title, message, category=category)
        logger.info("Created alert from %s for user_id=%s", routing_key, user_id)
    finally:
        conn.close()


if __name__ == "__main__":
    consume_events(QUEUE_NAME, ROUTING_KEYS, _handle_appointment_event)
