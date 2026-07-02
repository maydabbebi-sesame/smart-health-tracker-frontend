import os

from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "5102"))

# Best-effort fan-out targets for the admin statistics/activity-log
# endpoints, which need counts that live in other services' tables.
# Synchronous REST, not events, since this is a read/query -- see the
# migration plan's "Known limitations" on this not being real-time.
HEALTHDATA_SERVICE_URL = os.getenv("HEALTHDATA_SERVICE_URL", "http://localhost:5103")
DOCTORSAPPT_SERVICE_URL = os.getenv("DOCTORSAPPT_SERVICE_URL", "http://localhost:5104")
