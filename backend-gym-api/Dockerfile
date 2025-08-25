FROM python:3.11-slim

WORKDIR /app
COPY backend-gym-api/ ./

RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt

CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "--timeout", "300"]
