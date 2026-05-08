from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Azure Blob Storage (matching your env var names)
    azure_storage_account: str = "sourecfilestorage"
    azure_storage_key: str = ""
    azure_storage_container: str = "landingzone"
    azure_blob_path: str = "output/output.json"
    
    # Authentication
    api_username: str = "acufile"
    api_password: str = "acufile123"
    
    # Application
    app_name: str = "AcuFile API"
    debug: bool = False
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
