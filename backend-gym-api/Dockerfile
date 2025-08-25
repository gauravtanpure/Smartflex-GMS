FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for dlib, OpenCV, etc.
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend code
COPY . ./

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt

# Expose port (optional, for clarity)
EXPOSE 8000

# Start the app
CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "--timeout", "300", "--bind", "0.0.0.0:8000"]
