# Build context is the repo root (see docker-compose.yml) so this can COPY
# libs/sh_common alongside the service's own code. Backs both the HTTP API
# container (CMD below) and the worker.py event-consumer container, which
# docker-compose.yml runs from this same image with a different command.
FROM python:3.11
WORKDIR /app
COPY libs/sh_common /app/libs/sh_common
COPY services/health-data-service /app/services/health-data-service
WORKDIR /app/services/health-data-service
RUN pip install --no-cache-dir setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt
EXPOSE 5103
CMD ["python", "app.py"]
