import json
from datetime import timedelta

from sh_common import decode_id, encode_id

__all__ = ["decode_id", "encode_id"]


def publicize_user(record: dict) -> dict:
    if not record:
        return record
    public = {
        "uid": encode_id(record["id"]),
        "name": record.get("name"),
        "email": record.get("email"),
        "role": record.get("role"),
        "phone": record.get("phone"),
        "address": record.get("address"),
        "date_of_birth": record.get("date_of_birth"),
        "gender": record.get("gender"),
        "emergency_contact": record.get("emergency_contact"),
        "profile_picture": record.get("profile_picture"),
        "age": record.get("age"),
        "weight": record.get("weight"),
        "height": record.get("height"),
        "blood_group": record.get("blood_group"),
        "notifications_enabled": bool(record.get("notifications_enabled", True)),
        "created_at": record.get("created_at"),
    }
    return public


def publicize_admin_user(record: dict) -> dict:
    """Extended user view for the admin backoffice: adds account status,
    verification/security flags, and audit fields that regular users don't
    need to see about themselves via publicize_user."""
    if not record:
        return record
    public = publicize_user(record)
    public.update({
        "is_active": bool(record.get("is_active", True)),
        "is_verified": bool(record.get("is_verified")),
        "mfa_enabled": bool(record.get("mfa_enabled")),
        "provider": record.get("provider"),
        "locked_until": record.get("locked_until"),
        "created_at": record.get("created_at"),
    })
    return public


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


def publicize_alert(record: dict) -> dict:
    if not record:
        return record
    return {
        "uid": encode_id(record["id"]),
        "user_uid": encode_id(record["user_id"]),
        "title": record.get("title"),
        "message": record.get("message"),
        "category": record.get("category"),
        "is_read": bool(record.get("is_read")),
        "created_at": record.get("created_at"),
        "updated_at": record.get("updated_at")
    }


def publicize_form(record: dict) -> dict:
    if not record:
        return record
    answers = record.get("answers")
    try:
        answers = json.loads(answers) if isinstance(answers, str) else answers
    except Exception:
        answers = record.get("answers")
    return {
        "uid": encode_id(record["id"]),
        "user_uid": encode_id(record["user_id"]),
        "questionnaire_name": record.get("questionnaire_name"),
        "answers": answers,
        "status": record.get("status"),
        "submitted_at": record.get("submitted_at"),
        "updated_at": record.get("updated_at")
    }


def publicize_medical_history(record: dict) -> dict:
    if not record:
        return record
    return {
        "uid": encode_id(record["id"]),
        "user_uid": encode_id(record["user_id"]),
        "title": record.get("title"),
        "date_label": record.get("date_label"),
        "status": record.get("status"),
        "created_at": record.get("created_at"),
        "updated_at": record.get("updated_at"),
    }


def publicize_vaccination(record: dict) -> dict:
    if not record:
        return record
    return {
        "uid": encode_id(record["id"]),
        "user_uid": encode_id(record["user_id"]),
        "name": record.get("name"),
        "date_label": record.get("date_label"),
        "status": record.get("status"),
        "created_at": record.get("created_at"),
        "updated_at": record.get("updated_at"),
    }


def publicize_vital(record: dict) -> dict:
    if not record:
        return record
    return {
        "uid": encode_id(record["id"]),
        "user_uid": encode_id(record["user_id"]),
        "age": record.get("age"),
        "gender": record.get("gender"),
        "height": record.get("height"),
        "heart_rate": record.get("heart_rate"),
        "systolic_bp": record.get("systolic_bp"),
        "diastolic_bp": record.get("diastolic_bp"),
        "temperature": record.get("temperature"),
        "oxygen_saturation": record.get("oxygen_saturation"),
        "respiratory_rate": record.get("respiratory_rate"),
        "notes": record.get("notes"),
        "weight": record.get("weight"),
        "glycemia": record.get("glycemia"),
        "weight_variation": record.get("weight_variation"),
        "weight_variation_kg": record.get("weight_variation_kg"),
        "health_issues_history": record.get("health_issues_history"),
        "drug_allergies_flag": bool(record.get("drug_allergies_flag")),
        "drug_allergies": record.get("drug_allergies"),
        "family_health_issues": record.get("family_health_issues"),
        "smoking": bool(record.get("smoking")),
        "cigarettes_per_day": record.get("cigarettes_per_day"),
        "alcohol": bool(record.get("alcohol")),
        "alcohol_glasses": record.get("alcohol_glasses"),
        "current_treatment": bool(record.get("current_treatment")),
        "current_treatments": record.get("current_treatments"),
        "complements": bool(record.get("complements")),
        "complements_text": record.get("complements_text"),
        "observance": record.get("observance"),
        "symptoms": record.get("symptoms"),
        "pain_intensity": record.get("pain_intensity"),
        "symptoms_description": record.get("symptoms_description"),
        "symptoms_duration": record.get("symptoms_duration"),
        "pain_location": record.get("pain_location"),
        "triggers": record.get("triggers"),
        "general_state": record.get("general_state"),
        "recorded_at": record.get("recorded_at"),
        "created_at": record.get("created_at"),
        "updated_at": record.get("updated_at")
    }
