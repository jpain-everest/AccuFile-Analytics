from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base


class PolicyReview(Base):
    """PolicyReview model for database."""
    
    __tablename__ = "policy_reviews"
    
    submission_number = Column(String, primary_key=True, index=True)
    run_date = Column(DateTime(timezone=True), nullable=False)
    business_segment = Column(String, nullable=True)
    account_name = Column(String, nullable=True)
    policy_number = Column(String, nullable=True)
    product_type = Column(String, nullable=True)
    line_of_business = Column(String, nullable=True)
    matched_folder = Column(String, nullable=True)
    match_score = Column(Integer, nullable=True)
    match_status = Column(String, nullable=True)  # 'auto', 'review', 'none'
    match_reasoning = Column(Text, nullable=True)
    total_pdfs_found = Column(Integer, nullable=True)
    available_documents = Column(JSONB, nullable=True)  # [{doc_id, doc_name, matched_file, confidence}]
    missing_documents = Column(JSONB, nullable=True)  # [{doc_id, doc_name}]
    completeness_score = Column(Integer, nullable=True)  # 0-100 percentage
    field_extractions = Column(JSONB, nullable=True)  # [{doc_id, doc_name, file, ocr_status, fields: {...}}]
    fields_found_total = Column(Integer, nullable=True)
    fields_missing_total = Column(Integer, nullable=True)
