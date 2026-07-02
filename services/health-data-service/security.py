import json

from sh_common import encode_id


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
