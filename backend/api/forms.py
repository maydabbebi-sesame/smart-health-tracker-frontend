import json
import re

from flask import Blueprint, jsonify, request, g

from database import get_db_connection
from validators import validate_json_fields
from security import decode_id, encode_id, publicize_form
from auth import token_required, roles_required
from alerts import insert_alert

forms_bp = Blueprint("forms", __name__, url_prefix="/api/forms")


def _collect_form_alerts(questionnaire_name: str, answers: dict) -> tuple[bool, str, str]:
    triggers = [
        "chest pain", "difficulty breathing", "shortness of breath",
        "severe headache", "fainting", "high fever", "blood in urine",
        "palpitations", "dizziness", "blurred vision"
    ]
    warnings = []

    def value_indicates_issue(value):
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return value != 0
        if isinstance(value, str):
            normalized = value.lower().strip()
            if re.search(r"\b(yes|y|true|positive)\b", normalized):
                return True
            if any(trigger in normalized for trigger in triggers):
                return True
        return False

    for key, value in answers.items():
        key_text = key.replace("_", " ").lower()
        if any(trigger in key_text for trigger in triggers) and value_indicates_issue(value):
            warnings.append(f"{key}: {value}")
            continue

        if isinstance(value, str):
            text = value.lower()
            for trigger in triggers:
                if trigger in text:
                    warnings.append(f"{key}: {value}")
                    break

    if warnings:
        title = f"Urgent issue in {questionnaire_name}"
        message = "Potential urgent symptoms reported: " + ", ".join(warnings)
        return True, title, message
    return False, "", ""


@forms_bp.route("", methods=["POST"])
@token_required
def submit_form():
    """Submit a questionnaire or form response."""
    data, error = validate_json_fields(["user_uid", "questionnaire_name", "answers"])
    if error:
        return error

    if not isinstance(data["answers"], dict):
        return jsonify({"error": "answers must be a JSON object"}), 400

    user_id = decode_id(data["user_uid"])
    if user_id is None:
        return jsonify({"error": "Invalid user UID"}), 400

    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != data["user_uid"]:
        return jsonify({"error": "Forbidden"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    answers_json = json.dumps(data["answers"])
    cursor.execute(
        "INSERT INTO forms (user_id, questionnaire_name, answers, status) VALUES (%s, %s, %s, %s)",
        (user_id, data["questionnaire_name"], answers_json, "submitted")
    )
    conn.commit()
    form_id = cursor.lastrowid

    should_alert, title, message = _collect_form_alerts(data["questionnaire_name"], data["answers"])
    if should_alert:
        insert_alert(conn, user_id, title, message, category="form")

    cursor.close()
    conn.close()
    return jsonify({"message": "Form submitted successfully!", "uid": encode_id(form_id)}), 201


@forms_bp.route("", methods=["GET"])
@token_required
def list_forms():
    """List form submissions for the requesting user or admin."""
    user_uid = request.args.get("user_uid")
    current_user = g.current_user
    current_uid = current_user.get("uid")
    current_role = current_user.get("role")

    if user_uid:
        user_id = decode_id(user_uid)
        if user_id is None:
            return jsonify({"error": "Invalid user UID"}), 400
        if current_role != "admin" and current_uid != user_uid:
            return jsonify({"error": "Forbidden"}), 403
    elif current_role != "admin":
        user_id = decode_id(current_uid)
    else:
        user_id = None

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if user_id is not None:
        cursor.execute("SELECT * FROM forms WHERE user_id = %s ORDER BY submitted_at DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM forms ORDER BY submitted_at DESC")

    forms = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify([publicize_form(item) for item in forms])


@forms_bp.route("/<uid>", methods=["GET"])
@token_required
def get_form(uid: str):
    """Get a specific form submission by UID."""
    internal_id = decode_id(uid)
    if internal_id is None:
        return jsonify({"error": "Invalid form UID"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM forms WHERE id = %s", (internal_id,))
    form = cursor.fetchone()
    cursor.close()
    conn.close()

    if form is None:
        return jsonify({"error": "Form not found"}), 404

    if g.current_user.get("role") != "admin" and g.current_user.get("uid") != encode_id(form["user_id"]):
        return jsonify({"error": "Forbidden"}), 403

    return jsonify(publicize_form(form))
