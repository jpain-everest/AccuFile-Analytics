import logging
from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional

from app.services.blob_service import get_blob_service
from app.auth import verify_credentials
from app.telemetry import get_tracer, get_current_trace_context

router = APIRouter(
    prefix="/policy-reviews",
    tags=["policy-reviews"],
    responses={404: {"description": "Not found"}},
)

# Logger and tracer for this module
logger = logging.getLogger(__name__)
tracer = get_tracer(__name__)


@router.get("/", response_model=List[dict])
def read_policy_reviews(
    username: str = Depends(verify_credentials),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    submission_number: Optional[str] = Query(None, description="Filter by submission number (partial match)"),
    account_name: Optional[str] = Query(None, description="Filter by account name (partial match)"),
    policy_number: Optional[str] = Query(None, description="Filter by policy number (partial match)"),
    product_type: Optional[str] = Query(None, description="Filter by product type: 'Participant Accident', 'Business Travel Accident'"),
    match_status: Optional[str] = Query(None, description="Filter by match status: auto, review, none"),
    min_match_score: Optional[int] = Query(None, ge=0, le=100, description="Minimum match score (0-100)"),
    max_match_score: Optional[int] = Query(None, ge=0, le=100, description="Maximum match score (0-100)"),
    min_completeness: Optional[int] = Query(None, ge=0, le=100, description="Minimum completeness score (0-100)"),
    max_completeness: Optional[int] = Query(None, ge=0, le=100, description="Maximum completeness score (0-100)"),
    has_missing_documents: Optional[bool] = Query(None, description="Filter by whether record has missing documents"),
):
    """
    Get all policy reviews from Azure Blob Storage with optional filtering.
    
    **Available Filters:**
    - `submission_number`: Partial match on submission number
    - `account_name`: Partial match on account name (case-insensitive)
    - `policy_number`: Partial match on policy number
    - `product_type`: Exact match - 'Participant Accident' or 'Business Travel Accident'
    - `match_status`: Exact match - 'auto', 'review', or 'none'
    - `min_match_score` / `max_match_score`: Filter by match score range (0-100)
    - `min_completeness` / `max_completeness`: Filter by completeness score range (0-100)
    - `has_missing_documents`: true = only records with missing docs, false = only complete records
    """
    try:
        # Log with trace context
        logger.info(f"Fetching policy reviews for user: {username}")
        
        with tracer.start_as_current_span("fetch_policy_reviews") as span:
            span.set_attribute("user.name", username)
            span.set_attribute("pagination.skip", skip)
            span.set_attribute("pagination.limit", limit)
            
            blob_service = get_blob_service()
        
            # Check if any filter is applied
            has_filters = any([
                submission_number, account_name, policy_number, product_type,
                match_status, min_match_score, max_match_score,
                min_completeness, max_completeness, has_missing_documents is not None
            ])
        
            if has_filters:
                span.set_attribute("filter.applied", True)
                results = blob_service.search(
                    submission_number=submission_number,
                    account_name=account_name,
                    policy_number=policy_number,
                    product_type=product_type,
                    match_status=match_status,
                    min_match_score=min_match_score,
                    max_match_score=max_match_score,
                    min_completeness=min_completeness,
                    max_completeness=max_completeness,
                    has_missing_documents=has_missing_documents,
                    skip=skip,
                    limit=limit
                )
            else:
                span.set_attribute("filter.applied", False)
                results = blob_service.get_all(skip=skip, limit=limit)
            
            span.set_attribute("result.count", len(results))
            logger.info(f"Returning {len(results)} policy reviews")
            return results
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching data from blob storage: {str(e)}"
        )


@router.get("/refresh", response_model=dict)
def refresh_data(username: str = Depends(verify_credentials)):
    """
    Force refresh the cached data from Azure Blob Storage.
    Use this after the blob file is updated.
    """
    try:
        blob_service = get_blob_service()
        data = blob_service.refresh_cache()
        return {
            "status": "success",
            "message": "Cache refreshed successfully",
            "record_count": len(data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing cache: {str(e)}"
        )


@router.get("/stats", response_model=dict)
def get_stats(username: str = Depends(verify_credentials)):
    """
    Get statistics about the policy reviews data.
    
    Returns:
    - Total records
    - Count by match_status
    - Count by product_type
    - Average match score
    - Average completeness score
    - Records with/without missing documents
    """
    try:
        blob_service = get_blob_service()
        return blob_service.get_stats()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating stats: {str(e)}"
        )


@router.get("/{submission_number}", response_model=dict)
def read_policy_review(submission_number: str, username: str = Depends(verify_credentials)):
    """Get a specific policy review by submission number."""
    try:
        blob_service = get_blob_service()
        record = blob_service.get_by_submission_number(submission_number)
        
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Policy review with submission number '{submission_number}' not found"
            )
        
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching data: {str(e)}"
        )
