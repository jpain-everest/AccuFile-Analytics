import json
import logging
from typing import List, Optional, Any
from azure.storage.blob import BlobServiceClient
from functools import lru_cache
from app.config import get_settings

# Logger for this module
logger = logging.getLogger(__name__)


class BlobService:
    """Service to fetch and filter data from Azure Blob Storage."""
    
    def __init__(self):
        settings = get_settings()
        connection_string = (
            f"DefaultEndpointsProtocol=https;"
            f"AccountName={settings.azure_storage_account};"
            f"AccountKey={settings.azure_storage_key};"
            f"EndpointSuffix=core.windows.net"
        )
        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self.container_name = settings.azure_storage_container
        self.blob_path = settings.azure_blob_path
        self._cache: Optional[List[dict]] = None
        logger.info(f"BlobService initialized for container: {self.container_name}")
    
    def fetch_data(self, force_refresh: bool = False) -> List[dict]:
        """Fetch JSON data from blob storage."""
        if self._cache is not None and not force_refresh:
            logger.debug(f"Returning cached data ({len(self._cache)} records)")
            return self._cache
        
        try:
            logger.info(f"Fetching data from blob: {self.blob_path}")
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=self.blob_path
            )
            blob_data = blob_client.download_blob().readall()
            data = json.loads(blob_data)
            
            # Handle if data is a single object or list
            if isinstance(data, dict):
                self._cache = [data]
            elif isinstance(data, list):
                self._cache = data
            else:
                self._cache = []
            
            logger.info(f"Successfully fetched {len(self._cache)} records from blob storage")
            return self._cache
        except Exception as e:
            logger.error(f"Error fetching blob data: {e}")
            raise
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[dict]:
        """Get all records with pagination."""
        data = self.fetch_data()
        return data[skip:skip + limit]
    
    def get_by_submission_number(self, submission_number: str) -> Optional[dict]:
        """Get a single record by submission number."""
        data = self.fetch_data()
        for record in data:
            if record.get("submission_number") == submission_number:
                return record
        return None
    
    def search(
        self,
        submission_number: Optional[str] = None,
        account_name: Optional[str] = None,
        policy_number: Optional[str] = None,
        product_type: Optional[str] = None,
        match_status: Optional[str] = None,
        min_match_score: Optional[int] = None,
        max_match_score: Optional[int] = None,
        min_completeness: Optional[int] = None,
        max_completeness: Optional[int] = None,
        has_missing_documents: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[dict]:
        """Search with multiple filters."""
        data = self.fetch_data()
        filtered = data
        
        # Filter by submission_number (partial match)
        if submission_number:
            submission_lower = submission_number.lower()
            filtered = [r for r in filtered if submission_lower in (r.get("submission_number") or "").lower()]
        
        # Filter by account_name (partial match, case-insensitive)
        if account_name:
            account_lower = account_name.lower()
            filtered = [r for r in filtered if account_lower in (r.get("account_name") or "").lower()]
        
        # Filter by policy_number (partial match)
        if policy_number:
            policy_lower = policy_number.lower()
            filtered = [r for r in filtered if policy_lower in (r.get("policy_number") or "").lower()]
        
        # Filter by product_type (exact match, case-insensitive)
        if product_type:
            product_lower = product_type.lower()
            filtered = [r for r in filtered if (r.get("product_type") or "").lower() == product_lower]
        
        # Filter by match_status (exact match)
        if match_status:
            filtered = [r for r in filtered if r.get("match_status") == match_status]
        
        # Filter by match_score range
        if min_match_score is not None:
            filtered = [r for r in filtered if (r.get("match_score") or 0) >= min_match_score]
        
        if max_match_score is not None:
            filtered = [r for r in filtered if (r.get("match_score") or 0) <= max_match_score]
        
        # Filter by completeness_score range
        if min_completeness is not None:
            filtered = [r for r in filtered if (r.get("completeness_score") or 0) >= min_completeness]
        
        if max_completeness is not None:
            filtered = [r for r in filtered if (r.get("completeness_score") or 0) <= max_completeness]
        
        # Filter by has_missing_documents
        if has_missing_documents is not None:
            if has_missing_documents:
                filtered = [r for r in filtered if len(r.get("missing_documents") or []) > 0]
            else:
                filtered = [r for r in filtered if len(r.get("missing_documents") or []) == 0]
        
        return filtered[skip:skip + limit]
    
    def get_stats(self) -> dict:
        """Get statistics about the data."""
        data = self.fetch_data()
        total = len(data)
        
        # Count by match_status
        status_counts = {}
        for record in data:
            status = record.get("match_status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Count by product_type
        product_counts = {}
        for record in data:
            product = record.get("product_type", "unknown")
            product_counts[product] = product_counts.get(product, 0) + 1
        
        # Average scores
        match_scores = [r.get("match_score", 0) for r in data if r.get("match_score") is not None]
        completeness_scores = [r.get("completeness_score", 0) for r in data if r.get("completeness_score") is not None]
        
        avg_match_score = sum(match_scores) / len(match_scores) if match_scores else 0
        avg_completeness = sum(completeness_scores) / len(completeness_scores) if completeness_scores else 0
        
        # Missing documents summary
        with_missing = len([r for r in data if len(r.get("missing_documents") or []) > 0])
        complete = len([r for r in data if len(r.get("missing_documents") or []) == 0])
        
        return {
            "total_records": total,
            "by_match_status": status_counts,
            "by_product_type": product_counts,
            "average_match_score": round(avg_match_score, 2),
            "average_completeness_score": round(avg_completeness, 2),
            "with_missing_documents": with_missing,
            "complete_records": complete
        }
    
    def refresh_cache(self) -> List[dict]:
        """Force refresh the cached data."""
        return self.fetch_data(force_refresh=True)


# Singleton instance
_blob_service: Optional[BlobService] = None


def get_blob_service() -> BlobService:
    """Get or create BlobService instance."""
    global _blob_service
    if _blob_service is None:
        _blob_service = BlobService()
    return _blob_service
