from flask import Flask
from flask_cors import CORS

from auth import auth_bp
from config import PORT

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
