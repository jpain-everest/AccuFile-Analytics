# Azure Container App Deployment Script
# Run this script from Azure Cloud Shell or local terminal with Azure CLI installed

# ============ CONFIGURATION - UPDATE THESE VALUES ============
$RESOURCE_GROUP = "Hackathon-Team6-RG"
$LOCATION = "eastus"
$CONTAINER_APP_ENV = "blob-api-env"
$CONTAINER_APP_NAME = "blob-file-update-api"
$ACR_NAME = "blobfileapiregistry"  # Must be globally unique, lowercase, alphanumeric only
$IMAGE_NAME = "blob-file-update-api"
$IMAGE_TAG = "v1"

# Azure Storage Connection String (from your .env file)
$AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=sourecfilestorage;AccountKey=YOUR_KEY_HERE;EndpointSuffix=core.windows.net"

# ============ STEP 1: Create Azure Container Registry ============
Write-Host "Creating Azure Container Registry..." -ForegroundColor Green
az acr create `
    --resource-group $RESOURCE_GROUP `
    --name $ACR_NAME `
    --sku Basic `
    --admin-enabled true

# Get ACR credentials
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer --output tsv
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username --output tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv

Write-Host "ACR Login Server: $ACR_LOGIN_SERVER" -ForegroundColor Cyan

# ============ STEP 2: Build and Push Docker Image ============
Write-Host "Building and pushing Docker image..." -ForegroundColor Green

# Login to ACR
az acr login --name $ACR_NAME

# Build image using ACR (cloud build - no local Docker needed)
az acr build `
    --registry $ACR_NAME `
    --image "${IMAGE_NAME}:${IMAGE_TAG}" `
    --file Dockerfile .

# ============ STEP 3: Create Container Apps Environment ============
Write-Host "Creating Container Apps Environment..." -ForegroundColor Green
az containerapp env create `
    --name $CONTAINER_APP_ENV `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION

# ============ STEP 4: Create Container App ============
Write-Host "Creating Container App..." -ForegroundColor Green
az containerapp create `
    --name $CONTAINER_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --environment $CONTAINER_APP_ENV `
    --image "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}" `
    --target-port 8000 `
    --ingress external `
    --registry-server $ACR_LOGIN_SERVER `
    --registry-username $ACR_USERNAME `
    --registry-password $ACR_PASSWORD `
    --env-vars "AZURE_STORAGE_CONNECTION_STRING=$AZURE_STORAGE_CONNECTION_STRING" `
    --cpu 0.5 `
    --memory 1.0Gi `
    --min-replicas 0 `
    --max-replicas 3

# ============ STEP 5: Get the App URL ============
Write-Host "Deployment complete!" -ForegroundColor Green
$APP_URL = az containerapp show `
    --name $CONTAINER_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --query "properties.configuration.ingress.fqdn" `
    --output tsv

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "Your API is deployed at:" -ForegroundColor Yellow
Write-Host "https://$APP_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Swagger Docs:" -ForegroundColor Yellow
Write-Host "https://$APP_URL/docs" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Yellow
