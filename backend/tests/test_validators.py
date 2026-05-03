"""
Tests for validators
"""
import pytest
from src.validators.file_validator import FileValidator


class TestFileValidator:
    """Test cases for FileValidator"""
    
    def test_validator_initialization(self, config):
        """Test validator can be initialized"""
        validator = FileValidator(config["validation"])
        assert validator is not None
    
    def test_validate_file(self, config, sample_file_info):
        """Test file validation"""
        validator = FileValidator(config["validation"])
        
        result = validator.validate(sample_file_info)
        
        assert "is_valid" in result
        assert "checks" in result
        assert "issues" in result
        assert isinstance(result["is_valid"], bool)
        assert isinstance(result["checks"], dict)
        assert isinstance(result["issues"], list)
