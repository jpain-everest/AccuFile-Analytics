"""
Tests for file matching functionality
"""
import pytest
from src.agents.file_matcher import FileMatcherAgent


class TestFileMatcherAgent:
    """Test cases for FileMatcherAgent"""
    
    def test_similarity_score(self, config):
        """Test similarity scoring"""
        agent = FileMatcherAgent(config["storage"])
        
        # Exact match
        score = agent._similarity_score("acme", "acme")
        assert score == 1.0
        
        # No match
        score = agent._similarity_score("aaa", "zzz")
        assert score == 0.0
        
        # Partial match
        score = agent._similarity_score("acme", "acmecorp")
        assert score > 0.5  # ACME is in ACMECORP
    
    def test_find_policy_file_no_match(self, config, sample_policy):
        """Test file finding with no match"""
        agent = FileMatcherAgent(config["storage"])
        
        available_files = [
            {"filename": "UNRELATED_FILE.pdf", "parent_dir": "OTHER"}
        ]
        
        result = agent._find_policy_file(sample_policy, available_files)
        assert result is None
    
    def test_find_policy_file_with_match(self, config, sample_policy):
        """Test file finding with match"""
        agent = FileMatcherAgent(config["storage"])
        
        available_files = [
            {
                "filename": "AH-2024-001234_Acme_Corp.pdf",
                "parent_dir": "UW_FILES",
                "full_path": "\\share\AH-2024-001234_Acme_Corp.pdf",
                "size": 1024
            }
        ]
        
        result = agent._find_policy_file(sample_policy, available_files)
        assert result is not None
        assert result["match_confidence"] >= 0.9
