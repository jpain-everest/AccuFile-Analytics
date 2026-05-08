import logging
from fastapi import HTTPException
from app.config import get_settings
from app.services.blob_service import AzureBlobService

logger = logging.getLogger(__name__)


def get_blob_service() -> AzureBlobService:
    """Dependency to get the Azure Blob Service instance."""
    logger.debug("Getting blob service instance")
    settings = get_settings()
    
    logger.debug(f"Connection string configured: {bool(settings.azure_storage_connection_string)}")
    logger.debug(f"Account name configured: {bool(settings.azure_storage_account_name)}")
    logger.debug(f"Account key configured: {bool(settings.azure_storage_account_key)}")
    
    try:
        if settings.azure_storage_connection_string:
            logger.info("Creating AzureBlobService with connection string")
            return AzureBlobService(connection_string=settings.azure_storage_connection_string)
        elif settings.azure_storage_account_name and settings.azure_storage_account_key:
            logger.info("Creating AzureBlobService with account name and key")
            return AzureBlobService(
                account_name=settings.azure_storage_account_name,
                account_key=settings.azure_storage_account_key
            )
        else:
            logger.error("No Azure Storage credentials configured")
            raise HTTPException(
                status_code=500,
                detail="Azure Storage credentials not configured. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY"
            )
    except ValueError as e:
        logger.error(f"Failed to create AzureBlobService: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
