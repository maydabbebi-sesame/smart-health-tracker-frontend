# Build context is the repo root (see docker-compose.yml) so this can COPY
# libs/sh_common alongside the service's own code.
FROM python:3.11
WORKDIR /app
COPY libs/sh_common /app/libs/sh_common
COPY services/doctors-appointments-service /app/services/doctors-appointments-service
WORKDIR /app/services/doctors-appointments-service
RUN pip install --no-cache-dir setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt
EXPOSE 5104
CMD ["python", "app.py"]
