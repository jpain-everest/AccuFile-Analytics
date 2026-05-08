# Docker Deployment Guide for A&H AccuFile

This guide covers deploying the A&H AccuFile application as a single container running both frontend and backend services, optimized for Azure Container Apps.

## Architecture

The Docker container includes:
- **Frontend**: React app (built static files served by Nginx)
- **Backend**: FastAPI application running on port 8001
- **Web Server**: Nginx on port 80 (serves frontend + proxies API calls)
- **Process Manager**: Supervisord manages both Nginx and FastAPI

## Quick Start

### Build the Docker Image

```bash
docker build -t accufile-app:latest .
```

### Run Locally

```bash
docker run -p 80:80 \
  -e AZURE_STORAGE_CONNECTION_STRING="your_connection_string" \
  -e AZURE_STORAGE_CONTAINER="your_container" \
  -e OPENAI_API_KEY="your_api_key" \
  accufile-app:latest
```

Access the application at: http://localhost

## Azure Container Apps Deployment

### Prerequisites

1. Azure CLI installed
2. Azure Container Registry (ACR) or Docker Hub account
3. Environment variables prepared

### Step 1: Push Image to Azure Container Registry

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name rg-accufile --location eastus

# Create Azure Container Registry
az acr create --resource-group rg-accufile \
  --name accufileregistry --sku Basic

# Login to ACR
az acr login --name accufileregistry

# Tag your image
docker tag accufile-app:latest accufileregistry.azurecr.io/accufile-app:latest

# Push to ACR
docker push accufileregistry.azurecr.io/accufile-app:latest
```

### Step 2: Create Container App Environment

```bash
# Install/upgrade Container Apps extension
az extension add --name containerapp --upgrade

# Create Container Apps environment
az containerapp env create \
  --name accufile-env \
  --resource-group rg-accufile \
  --location eastus
```

### Step 3: Deploy Container App

```bash
# Create the container app
az containerapp create \
  --name accufile-app \
  --resource-group rg-accufile \
  --environment accufile-env \
  --image accufileregistry.azurecr.io/accufile-app:latest \
  --registry-server accufileregistry.azurecr.io \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 1.0 \
  --memory 2.0Gi \
  --env-vars \
    AZURE_STORAGE_CONNECTION_STRING="secretref:storage-connection" \
    AZURE_STORAGE_CONTAINER="your_container" \
    OPENAI_API_KEY="secretref:openai-key" \
    ENV="production"
```

### Step 4: Configure Secrets

```bash
# Add secrets to the container app
az containerapp secret set \
  --name accufile-app \
  --resource-group rg-accufile \
  --secrets \
    storage-connection="your_azure_storage_connection_string" \
    openai-key="your_openai_api_key"
```

### Step 5: Update Container App with Secrets

```bash
az containerapp update \
  --name accufile-app \
  --resource-group rg-accufile \
  --set-env-vars \
    AZURE_STORAGE_CONNECTION_STRING=secretref:storage-connection \
    OPENAI_API_KEY=secretref:openai-key
```

## Environment Variables

The following environment variables should be configured in Azure Container Apps:

### Required
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection string
- `AZURE_STORAGE_CONTAINER` - Storage container name
- `OPENAI_API_KEY` - OpenAI API key for LLM features

### Optional
- `ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (INFO/DEBUG/ERROR)
- `MAX_WORKERS` - Number of uvicorn workers (default: 1)

## Monitoring and Logs

### View Container Logs

```bash
az containerapp logs show \
  --name accufile-app \
  --resource-group rg-accufile \
  --follow
```

### View Container Metrics

```bash
az containerapp show \
  --name accufile-app \
  --resource-group rg-accufile \
  --query "properties.runningStatus"
```

## Scaling Configuration

### Manual Scaling

```bash
az containerapp update \
  --name accufile-app \
  --resource-group rg-accufile \
  --min-replicas 2 \
  --max-replicas 5
```

### Auto-scaling Rules

```bash
az containerapp update \
  --name accufile-app \
  --resource-group rg-accufile \
  --scale-rule-name http-rule \
  --scale-rule-type http \
  --scale-rule-http-concurrency 50
```

## Health Checks

The container includes a health check endpoint:
- **URL**: `/health`
- **Method**: GET
- **Expected Response**: 200 OK

Configure liveness probe:
```bash
az containerapp update \
  --name accufile-app \
  --resource-group rg-accufile \
  --set-env-vars HEALTH_CHECK_PATH="/health"
```

## Updating the Application

### Deploy New Version

```bash
# Build new image
docker build -t accufile-app:v2 .

# Tag and push
docker tag accufile-app:v2 accufileregistry.azurecr.io/accufile-app:v2
docker push accufileregistry.azurecr.io/accufile-app:v2

# Update container app
az containerapp update \
  --name accufile-app \
  --resource-group rg-accufile \
  --image accufileregistry.azurecr.io/accufile-app:v2
```

## Troubleshooting

### Container Won't Start

1. Check logs:
   ```bash
   az containerapp logs show --name accufile-app --resource-group rg-accufile
   ```

2. Verify environment variables are set correctly

3. Check image is accessible from ACR

### Backend API Not Responding

1. Verify supervisord is running both services:
   ```bash
   docker exec -it <container_id> supervisorctl status
   ```

2. Check backend logs in container

3. Verify nginx configuration is correct

### Frontend Not Loading

1. Check if static files were built correctly during image build
2. Verify nginx is running
3. Check nginx error logs

## Local Development

For local development, you can still use the frontend and backend separately:

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn web_app:app --reload --port 8001

# Terminal 2: Frontend
cd frontend
npm start
```

## Cost Optimization

- Use consumption-based pricing for Container Apps
- Set minimum replicas to 0 for non-production environments
- Use Azure Container Registry geo-replication for better performance
- Configure auto-scaling based on actual traffic patterns

## Security Best Practices

1. Store secrets in Azure Key Vault
2. Use managed identity for Azure services
3. Enable container app authentication if needed
4. Regularly update base images for security patches
5. Scan images for vulnerabilities using Azure Defender

## Support

For issues or questions, refer to:
- Project documentation in `/docs`
- Azure Container Apps documentation
- FastAPI documentation
- React documentation
