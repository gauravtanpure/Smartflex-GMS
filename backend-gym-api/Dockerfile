FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    python3-dev \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libx11-dev \
    libgtk-3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend code
COPY . ./ 

# Upgrade pip and install Python build tools
RUN pip install --upgrade pip setuptools wheel

# Install prebuilt dlib wheel from GitHub (avoids memory-heavy build)
# RUN pip install dlib==19.24.0 --find-links https://github.com/davisking/dlib/releases || echo "dlib install skipped on Render"

# Install remaining Python dependencies without reinstalling dlib
RUN pip install -r requirements.txt 
RUN pip install typing-extensions

# Expose port
EXPOSE 8000

# Start the app
CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "--timeout", "300", "--bind", "0.0.0.0:8000"]
