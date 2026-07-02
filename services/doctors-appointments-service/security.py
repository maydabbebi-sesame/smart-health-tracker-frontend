import json
from datetime import timedelta

from sh_common import encode_id


def publicize_external_doctor(record: dict) -> dict:
    """All doctors (platform-added, med.tn-scraped, or OSM-sourced) live in
    external_doctors now, distinguished by their `source` field."""
    if not record:
        return record
    availability = record.get("availability")
    if isinstance(availability, str):
        try:
            availability = json.loads(availability)
        except Exception:
            pass
    return {
        "uid": encode_id(record["id"]),
        "source": record.get("source"),
        "name": record.get("name"),
        "email": record.get("email"),
        "specialization": record.get("specialization"),
        "location": record.get("location"),
        "bio": record.get("bio"),
        "availability": availability,
        "rating": float(record["rating"]) if record.get("rating") is not None else None,
        "ratingCount": record.get("rating_count", 0),
        "sourceUrl": record.get("source_url"),
        "phone": record.get("phone"),
        "lat": float(record["lat"]) if record.get("lat") is not None else None,
        "lng": float(record["lng"]) if record.get("lng") is not None else None,
    }


def publicize_health_center(record: dict) -> dict:
    if not record:
        return record
    return {
        "uid": encode_id(record["id"]),
        "source": record.get("source"),
        "name": record.get("name"),
        "category": record.get("category"),
        "location": record.get("location"),
        "phone": record.get("phone"),
        "email": record.get("email"),
        "website": record.get("website"),
        "lat": float(record["lat"]) if record.get("lat") is not None else None,
        "lng": float(record["lng"]) if record.get("lng") is not None else None,
    }


def _format_time(value) -> str | None:
    """Format a TIME column value (returned by the MySQL connector as a
    datetime.timedelta) into an "HH:MM:SS" string so it is JSON serializable."""
    if value is None:
        return None
    if isinstance(value, timedelta):
        total_seconds = int(value.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    return str(value)


def publicize_appointment(record: dict) -> dict:
    if not record:
        return record
    public = {
        "uid": encode_id(record["id"]),
        "user_uid": encode_id(record["user_id"]),
        "doctor_uid": encode_id(record["doctor_id"]),
        "doctor_name": record.get("doctor_name"),
        "doctor_specialization": record.get("doctor_specialization"),
        "doctor_location": record.get("doctor_location"),
        "appointment_date": record.get("appointment_date"),
        "appointment_time": _format_time(record.get("appointment_time")),
        "reason": record.get("reason"),
        "status": record.get("status")
    }
    return public
