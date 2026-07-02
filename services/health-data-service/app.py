from flask import Flask, jsonify
from flask_cors import CORS

from alerts import alerts_bp
from config import PORT
from forms import forms_bp
from sh_common.db import get_db_connection
from vitals import vitals_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(vitals_bp)
app.register_blueprint(forms_bp)
app.register_blueprint(alerts_bp)


@app.route("/internal/stats")
def internal_stats():
    """Counts consumed by users-service's /api/admin/statistics fan-out.
    Not behind token_required: only reachable service-to-service, never
    routed through the gateway to the public internet.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) as count FROM vitals")
    total_vitals = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM alerts WHERE is_read = 0")
    unread_alerts = cursor.fetchone()["count"]
    cursor.close()
    conn.close()
    return jsonify({"total_vitals": total_vitals, "unread_alerts": unread_alerts})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
