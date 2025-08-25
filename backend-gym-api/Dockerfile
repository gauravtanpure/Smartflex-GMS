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
    libxext6 \
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

# ✅ Install prebuilt dlib wheel instead of building from source
RUN pip install --no-cache-dir dlib-bin==19.24.2

# ✅ Install other dependencies (face-recognition will detect dlib automatically)
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run with gunicorn + uvicorn worker
CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "--timeout", "300", "--bind", "0.0.0.0:8000"]
