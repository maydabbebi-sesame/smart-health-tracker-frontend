import json

import pika

from .config import RABBITMQ_HOST, RABBITMQ_PASSWORD, RABBITMQ_PORT, RABBITMQ_USER
from .logger import get_logger

logger = get_logger(__name__)

EXCHANGE_NAME = "smarthealth.events"


def _connection_params():
    return pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD),
    )


def publish_event(routing_key: str, payload: dict) -> None:
    """Best-effort publish -- a missing/unreachable broker must never block
    the publishing service's primary request (booking an appointment still
    has to work even if no consumer is listening for the notification)."""
    try:
        connection = pika.BlockingConnection(_connection_params())
        channel = connection.channel()
        channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type="topic", durable=True)
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=routing_key,
            body=json.dumps(payload).encode("utf-8"),
            properties=pika.BasicProperties(content_type="application/json", delivery_mode=2),
        )
        connection.close()
    except Exception:
        logger.exception("Failed to publish event routing_key=%s", routing_key)


def consume_events(queue_name: str, routing_keys: list, handler) -> None:
    """Blocking consumer loop -- intended to run in its own worker process,
    not inside the request-handling Flask app. `handler(routing_key, payload)`
    is called for each message; exceptions are logged and the message is
    still ack'd (no retry queue/DLQ at this project's scale)."""
    connection = pika.BlockingConnection(_connection_params())
    channel = connection.channel()
    channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type="topic", durable=True)
    channel.queue_declare(queue=queue_name, durable=True)
    for key in routing_keys:
        channel.queue_bind(exchange=EXCHANGE_NAME, queue=queue_name, routing_key=key)

    def _on_message(ch, method, _properties, body):
        try:
            payload = json.loads(body.decode("utf-8"))
            handler(method.routing_key, payload)
        except Exception:
            logger.exception("Error handling event routing_key=%s", method.routing_key)
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_consume(queue=queue_name, on_message_callback=_on_message)
    logger.info("Listening on queue=%s for routing_keys=%s", queue_name, routing_keys)
    channel.start_consuming()
