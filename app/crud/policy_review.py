from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.policy_review import PolicyReview
from app.schemas.policy_review import PolicyReviewCreate, PolicyReviewUpdate


def get_policy_review(db: Session, submission_number: str) -> Optional[PolicyReview]:
    """Get a policy review by submission number."""
    return db.query(PolicyReview).filter(PolicyReview.submission_number == submission_number).first()


def get_policy_reviews(db: Session, skip: int = 0, limit: int = 100) -> List[PolicyReview]:
    """Get all policy reviews with pagination."""
    return db.query(PolicyReview).offset(skip).limit(limit).all()


def get_policy_reviews_by_status(db: Session, match_status: str, skip: int = 0, limit: int = 100) -> List[PolicyReview]:
    """Get policy reviews by match status."""
    return db.query(PolicyReview).filter(PolicyReview.match_status == match_status).offset(skip).limit(limit).all()


def get_policy_reviews_by_account(db: Session, account_name: str, skip: int = 0, limit: int = 100) -> List[PolicyReview]:
    """Get policy reviews by account name."""
    return db.query(PolicyReview).filter(PolicyReview.account_name.ilike(f"%{account_name}%")).offset(skip).limit(limit).all()


def create_policy_review(db: Session, policy_review: PolicyReviewCreate) -> PolicyReview:
    """Create a new policy review."""
    db_policy_review = PolicyReview(**policy_review.model_dump())
    db.add(db_policy_review)
    db.commit()
    db.refresh(db_policy_review)
    return db_policy_review


def update_policy_review(db: Session, submission_number: str, policy_review_update: PolicyReviewUpdate) -> Optional[PolicyReview]:
    """Update a policy review."""
    db_policy_review = get_policy_review(db, submission_number)
    if not db_policy_review:
        return None
    
    update_data = policy_review_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_policy_review, field, value)
    
    db.commit()
    db.refresh(db_policy_review)
    return db_policy_review


def delete_policy_review(db: Session, submission_number: str) -> bool:
    """Delete a policy review."""
    db_policy_review = get_policy_review(db, submission_number)
    if not db_policy_review:
        return False
    
    db.delete(db_policy_review)
    db.commit()
    return True
