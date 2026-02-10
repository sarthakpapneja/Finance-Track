FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
# Install basic dependencies and scikit-learn specifics if needed
# Install libgomp1 for OpenMP (xgboost/sklearn dependency usually)
RUN apt-get update && apt-get install -y libgomp1 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ backend/
COPY ml_service/ ml_service/

# Create directory for sqlite db
RUN mkdir -p ml_service/models

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
