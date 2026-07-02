from sh_common import encode_id


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
