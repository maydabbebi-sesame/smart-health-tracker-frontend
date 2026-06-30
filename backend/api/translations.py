from flask import Blueprint, jsonify

from database import get_db_connection

translations_bp = Blueprint("translations", __name__, url_prefix="/api/translations")

SUPPORTED_LOCALES = ("en", "fr")


@translations_bp.route("/<locale>", methods=["GET"])
def get_translations(locale: str):
    """Return all translation key/value pairs for a locale.

    GET /api/translations/<locale>
    Response: { "<key>": "<value>", ... }

    Public endpoint (no auth) since translated text is needed on the
    login/register screens, before a session exists.
    """
    if locale not in SUPPORTED_LOCALES:
        return jsonify({"error": f"Unsupported locale. Allowed: {', '.join(SUPPORTED_LOCALES)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT `key`, value FROM translations WHERE locale = %s", (locale,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify({row["key"]: row["value"] for row in rows})
