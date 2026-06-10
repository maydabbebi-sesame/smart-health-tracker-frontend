import importlib.util
import pkgutil

from flask import Flask
from flask_cors import CORS

from users import users_bp
from doctors import doctors_bp
from appointments import appointments_bp
from auth import auth_bp
from alerts import alerts_bp
from forms import forms_bp
from vitals import vitals_bp

if not hasattr(pkgutil, "get_loader"):
    def _fallback_get_loader(name):
        spec = importlib.util.find_spec(name)
        return spec.loader if spec else None
    pkgutil.get_loader = _fallback_get_loader

app = Flask(__name__)
CORS(app)

app.register_blueprint(users_bp)
app.register_blueprint(doctors_bp)
app.register_blueprint(appointments_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(alerts_bp)
app.register_blueprint(forms_bp)
app.register_blueprint(vitals_bp)


if __name__ == "__main__":
    app.run(debug=True)
