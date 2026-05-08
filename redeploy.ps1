# Update Container App after code changes
# Run this script to redeploy after making changes

$RESOURCE_GROUP = "acufile-rg"
$CONTAINER_APP_NAME = "acufile-api"
$ACR_NAME = "acufileacr"

Write-Host "Building and pushing new image..." -ForegroundColor Green
az acr build --registry $ACR_NAME --image acufile-api:latest .

Write-Host "Updating Container App..." -ForegroundColor Green
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer --output tsv
az containerapp update `
    --name $CONTAINER_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --image "$ACR_LOGIN_SERVER/acufile-api:latest"

Write-Host "Deployment complete!" -ForegroundColor Green
$APP_URL = az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv
Write-Host "API URL: https://$APP_URL" -ForegroundColor Cyan
