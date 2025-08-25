FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for face-recognition
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    python3-dev \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libx11-dev \
    libgtk-3-dev \
    libboost-all-dev \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip & build tools
RUN pip install --upgrade pip setuptools wheel cmake

# Copy requirements first (for caching)
COPY requirements.txt .

# ✅ Install all dependencies including prebuilt dlib-bin
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run with gunicorn + uvicorn worker
CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "--timeout", "300", "--bind", "0.0.0.0:8000"]
