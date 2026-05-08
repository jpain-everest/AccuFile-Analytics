import os
from typing import Any

from azure.storage.blob import BlobServiceClient
from fastapi import HTTPException


# POC/sandbox fallback credentials
_FALLBACK_ACCOUNT = "sourecfilestorage"
_FALLBACK_KEY = ""
_FALLBACK_CONTAINER = "json-outputs"


def build_blob_service_client() -> BlobServiceClient:
    """Build blob client from environment variables."""
    connection_string = (os.getenv("AZURE_STORAGE_CONNECTION_STRING") or "").strip()
    if connection_string:
        return BlobServiceClient.from_connection_string(connection_string)

    account_name = os.getenv("AZURE_STORAGE_ACCOUNT") or _FALLBACK_ACCOUNT
    account_key = os.getenv("AZURE_STORAGE_KEY") or os.getenv("AZURE_STORAGE_ACCOUNT_KEY") or _FALLBACK_KEY

    if not account_key:
        raise HTTPException(
            status_code=500,
            detail="Azure Blob credentials are not configured. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_KEY.",
        )

    account_url = f"https://{account_name}.blob.core.windows.net"
    return BlobServiceClient(account_url=account_url, credential=account_key)


def extract_records(payload: Any) -> list[dict[str, Any]]:
    """Extract list of records from common JSON payload shapes."""
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]

    if isinstance(payload, dict):
        for key in ("policies_reviewed", "policy_risk_scores", "records", "data", "items", "rows"):
            value = payload.get(key)
            if isinstance(value, list):
                return [row for row in value if isinstance(row, dict)]

        dict_values = [v for v in payload.values() if isinstance(v, dict)]
        if dict_values:
            return dict_values

        return [payload]

    return []
