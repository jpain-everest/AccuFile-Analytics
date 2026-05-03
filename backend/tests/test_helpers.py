"""
Tests for utility functions
"""
import pytest
from src.utils.helpers import (
    sanitize_filename,
    extract_policy_number,
    extract_insured_name,
    merge_dicts,
    filter_dict
)


class TestHelpers:
    """Test cases for helper functions"""
    
    def test_sanitize_filename(self):
        """Test filename sanitization"""
        assert sanitize_filename("file<name>.txt") == "file_name_.txt"
        assert sanitize_filename("my:file|name.pdf") == "my_file_name.pdf"
        assert sanitize_filename("  spaces  ") == "spaces"
    
    def test_extract_policy_number(self):
        """Test policy number extraction"""
        assert extract_policy_number("AH-2024-001234_file.pdf") == "AH-2024-001234"
        assert extract_policy_number("12345678_acme.pdf") == "12345678"
        assert extract_policy_number("no_policy_here.pdf") is None
    
    def test_extract_insured_name(self):
        """Test insured name extraction"""
        result = extract_insured_name("AH-2024-001234_Acme_Corporation.pdf")
        assert "Acme" in result
        assert "Corporation" in result
    
    def test_merge_dicts(self):
        """Test dictionary merging"""
        dict1 = {"a": 1, "b": {"c": 2}}
        dict2 = {"b": {"d": 3}, "e": 4}
        
        result = merge_dicts(dict1, dict2)
        
        assert result["a"] == 1
        assert result["b"]["c"] == 2
        assert result["b"]["d"] == 3
        assert result["e"] == 4
    
    def test_filter_dict(self):
        """Test dictionary filtering"""
        data = {"a": 1, "b": 2, "c": 3, "d": 4}
        result = filter_dict(data, ["a", "c"])
        
        assert result == {"a": 1, "c": 3}
        assert "b" not in result
        assert "d" not in result
