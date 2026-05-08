# Azure Container Apps Deployment Script
# Run this from PowerShell in the project directory

# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================
# Use EXISTING resource group you have access to
$RESOURCE_GROUP = "Hackathon-Team6-RG"
$LOCATION = "eastus2"
$CONTAINER_APP_ENV = "accufile-env"
$CONTAINER_APP_NAME = "accufile-app"

# Use EXISTING Azure Container Registry (or set to empty to create new if you have permission)
$ACR_NAME = "accufileacr"

# Azure Storage settings (your existing storage)
$AZURE_STORAGE_ACCOUNT = "sourecfilestorage"
$AZURE_STORAGE_KEY = "<SET_IN_LOCAL_SCRIPT_OR_ENV>"
$AZURE_STORAGE_CONTAINER = "landingzone"
$AZURE_BLOB_PATH = "output/output.json"

# API Authentication
$API_USERNAME = "acufile"
$API_PASSWORD = "acufile123"

# ============================================
# STEP 1: Login to Azure
# ============================================
Write-Host "Step 1: Logging in to Azure..." -ForegroundColor Green
az login

# Set the correct subscription
az account set --subscription "ETS-Dev-Sandbox-Insurance"

# ============================================
# STEP 2: Get ACR Credentials
# ============================================
Write-Host "Step 2: Getting ACR credentials..." -ForegroundColor Green
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv
$ACR_USERNAME = az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query username --output tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "passwords[0].value" --output tsv

Write-Host "ACR Login Server: $ACR_LOGIN_SERVER" -ForegroundColor Cyan

# ============================================
# STEP 3: Build and Push Docker Image
# ============================================
Write-Host "Step 3: Building and pushing Docker image..." -ForegroundColor Green
az acr login --name $ACR_NAME
az acr build --registry $ACR_NAME --image accufile-api:latest .

# ============================================
# STEP 4: Update Container App
# ============================================
Write-Host "Step 4: Updating Container App..." -ForegroundColor Green
az containerapp update `
    --name $CONTAINER_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --image "$ACR_LOGIN_SERVER/accufile-api:latest" `
    --set-env-vars `
        AZURE_STORAGE_ACCOUNT=$AZURE_STORAGE_ACCOUNT `
        AZURE_STORAGE_KEY=$AZURE_STORAGE_KEY `
        AZURE_STORAGE_CONTAINER=$AZURE_STORAGE_CONTAINER `
        AZURE_BLOB_PATH=$AZURE_BLOB_PATH `
        API_USERNAME=$API_USERNAME `
        API_PASSWORD=$API_PASSWORD `
        ENVIRONMENT=production `
        DEBUG=false

# ============================================
# STEP 5: Get the App URL
# ============================================
Write-Host "Step 5: Getting App URL..." -ForegroundColor Green
$APP_URL = az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "API URL: https://$APP_URL" -ForegroundColor Cyan
Write-Host "Health Check: https://$APP_URL/health" -ForegroundColor Cyan
Write-Host "Swagger Docs: https://$APP_URL/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow" -ForegroundColor White
