FROM python:3.11-slim

WORKDIR /app

# Install build dependencies for psycopg2 and fitz
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Run alembic upgrade head, then start uvicorn
ENV PYTHONPATH=/app/src
CMD ["sh", "-c", "alembic upgrade head && uvicorn talentstream_core_service.main:app --host 0.0.0.0 --port 8000"]
