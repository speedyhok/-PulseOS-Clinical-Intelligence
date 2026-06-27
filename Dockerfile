FROM python:3.11-slim

WORKDIR /workspace

# Install system dependencies if any
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app /workspace/app
COPY mcp_servers /workspace/mcp_servers

# Set environment variables
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 7860

# Run FastAPI server
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "7860"]
