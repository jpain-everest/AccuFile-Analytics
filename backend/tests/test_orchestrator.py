"""
Tests for the main workflow orchestrator
"""
import pytest
from src.agents.orchestrator import FileReviewOrchestrator


class TestOrchestrator:
    """Test cases for FileReviewOrchestrator"""
    
    def test_orchestrator_initialization(self, config):
        """Test orchestrator can be initialized"""
        orchestrator = FileReviewOrchestrator(config)
        assert orchestrator is not None
        assert orchestrator.config == config
    
    def test_build_summary(self, config):
        """Test summary building"""
        orchestrator = FileReviewOrchestrator(config)
        
        policies = [{"policy_number": f"POL{i:05d}"} for i in range(100)]
        matched_files = [{"policy_number": f"POL{i:05d}"} for i in range(90)]
        missing_files = [{"policy_number": f"POL{i:05d}"} for i in range(90, 100)]
        validation_results = {
            f"POL{i:05d}": {"is_compliant": True} for i in range(80)
        }
        validation_results.update({
            f"POL{i:05d}": {"is_compliant": False} for i in range(80, 90)
        })
        
        summary = orchestrator._build_summary(
            policies, matched_files, missing_files, validation_results
        )
        
        assert summary["total_policies"] == 100
        assert summary["matched_files"] == 90
        assert summary["match_rate_percent"] == 90.0
        assert summary["missing_files"] == 10
        assert summary["missing_rate_percent"] == 10.0
        assert summary["validation_failures"] == 10
        
    def test_summary_with_empty_lists(self, config):
        """Test summary with empty data"""
        orchestrator = FileReviewOrchestrator(config)
        
        summary = orchestrator._build_summary([], [], [], {})
        
        assert summary["total_policies"] == 0
        assert summary["matched_files"] == 0
        assert summary["missing_files"] == 0
