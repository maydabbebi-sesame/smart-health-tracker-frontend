import os

from flask import Flask, send_from_directory
from flask_cors import CORS

from admin import admin_bp
from config import PORT
from medical_history import medical_history_bp
from translations import translations_bp
from users import users_bp
from vaccinations import vaccinations_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(users_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(medical_history_bp)
app.register_blueprint(vaccinations_bp)
app.register_blueprint(translations_bp)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "uploads")


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    """Serve files saved by the profile picture upload endpoint."""
    return send_from_directory(UPLOADS_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
