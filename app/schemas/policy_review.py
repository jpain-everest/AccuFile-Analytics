from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class PolicyReviewBase(BaseModel):
    """Base schema for PolicyReview."""
    submission_number: str
    run_date: datetime
    business_segment: Optional[str] = None
    account_name: Optional[str] = None
    policy_number: Optional[str] = None
    product_type: Optional[str] = None
    line_of_business: Optional[str] = None
    matched_folder: Optional[str] = None
    match_score: Optional[int] = None
    match_status: Optional[str] = None
    match_reasoning: Optional[str] = None
    total_pdfs_found: Optional[int] = None
    available_documents: Optional[List[Any]] = None
    missing_documents: Optional[List[Any]] = None
    completeness_score: Optional[int] = None
    field_extractions: Optional[List[Any]] = None
    fields_found_total: Optional[int] = None
    fields_missing_total: Optional[int] = None


class PolicyReviewCreate(PolicyReviewBase):
    """Schema for creating a new policy review."""
    pass


class PolicyReviewUpdate(BaseModel):
    """Schema for updating a policy review."""
    run_date: Optional[datetime] = None
    business_segment: Optional[str] = None
    account_name: Optional[str] = None
    policy_number: Optional[str] = None
    product_type: Optional[str] = None
    line_of_business: Optional[str] = None
    matched_folder: Optional[str] = None
    match_score: Optional[int] = None
    match_status: Optional[str] = None
    match_reasoning: Optional[str] = None
    total_pdfs_found: Optional[int] = None
    available_documents: Optional[List[Any]] = None
    missing_documents: Optional[List[Any]] = None
    completeness_score: Optional[int] = None
    field_extractions: Optional[List[Any]] = None
    fields_found_total: Optional[int] = None
    fields_missing_total: Optional[int] = None


class PolicyReviewResponse(PolicyReviewBase):
    """Schema for policy review response."""
    
    class Config:
        from_attributes = True
