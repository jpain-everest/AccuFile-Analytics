"""
Test configuration and fixtures
"""
import pytest
from pathlib import Path


@pytest.fixture
def sample_policy():
    """Sample policy from Peak system"""
    return {
        "policy_number": "AH-2024-001234",
        "insured_name": "Acme Corporation",
        "policy_type": "commercial",
        "effective_date": "2024-01-01",
        "premium": 15000.00,
        "status": "active"
    }


@pytest.fixture
def sample_policies():
    """Sample policies from Peak system"""
    return [
        {
            "policy_number": "AH-2024-001234",
            "insured_name": "Acme Corporation",
            "policy_type": "commercial",
            "effective_date": "2024-01-01",
            "premium": 15000.00
        },
        {
            "policy_number": "AH-2024-001235",
            "insured_name": "Beta Industries",
            "policy_type": "individual",
            "effective_date": "2024-01-02",
            "premium": 5000.00
        },
        {
            "policy_number": "AH-2024-001236",
            "insured_name": "Gamma Ltd",
            "policy_type": "commercial",
            "effective_date": "2024-01-03",
            "premium": 20000.00
        }
    ]


@pytest.fixture
def sample_file_info():
    """Sample file information"""
    return {
        "policy_number": "AH-2024-001234",
        "matched_file": {
            "full_path": "\\shared.drive\uwfiles\AH-2024-001234_Acme_Corp",
            "filename": "AH-2024-001234_Acme_Corp",
            "size": 1024000,
            "modified": "2024-01-15"
        },
        "match_confidence": 0.95
    }


@pytest.fixture
def config():
    """Test configuration"""
    return {
        "peak": {
            "endpoint": "https://peak-test.example.com",
            "timeout": 30
        },
        "storage": {
            "shared_drive_path": "/test/shared",
            "local_cache_path": "/test/cache"
        },
        "validation": {
            "required_documents": ["Application", "Policy"],
            "folder_structure": {"pattern": "[PolicyNumber]_[Name]"}
        },
        "reporting": {
            "output_path": "/test/reports"
        }
    }
