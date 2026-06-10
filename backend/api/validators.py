from flask import jsonify, request


def json_error(message: str, status: int = 400):
    return jsonify({"error": message}), status


def get_request_data():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, json_error("Invalid JSON payload")
    return data, None


def require_fields(data: dict, fields: list[str]):
    missing = [field for field in fields if field not in data or data[field] is None or str(data[field]).strip() == ""]
    if missing:
        return json_error(f"Missing required fields: {', '.join(missing)}")
    return None


def validate_json_fields(required_fields: list[str]):
    data, error = get_request_data()
    if error:
        return None, error

    error = require_fields(data, required_fields)
    if error:
        return None, error

    return data, None
