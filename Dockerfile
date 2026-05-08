# Multi-stage Dockerfile for A&H AccuFile (Frontend + Backend)
# Suitable for Azure Container Apps

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY frontend/ ./
RUN chmod +x ./node_modules/.bin/* && npm run build

# Stage 2: Setup Python Backend with Nginx
FROM python:3.11-slim

# Install system dependencies including nginx and supervisor
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html

# Create necessary directories
RUN mkdir -p /app/backend/data/shared_drive /app/backend/reports

# Configure Nginx
COPY nginx-combined.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default && \
    ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# Configure Supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set Python path
ENV PYTHONPATH=/app/backend

# Azure credentials must be provided at runtime (do not hardcode in image)
# Required: AZURE_STORAGE_CONNECTION_STRING OR (AZURE_STORAGE_ACCOUNT + AZURE_STORAGE_KEY)
# Optional: AZURE_STORAGE_CONTAINER override

# Expose ports
EXPOSE 80 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# Start supervisor to manage both services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
