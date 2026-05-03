"""
Peak Agent - Retrieves policy data from Peak system
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class PeakAgent:
    """
    Agent responsible for connecting to Peak system and retrieving policy data.
    Falls back to local JSON data file for testing when no live API is available.
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.endpoint = config.get("endpoint", "")
        self.api_version = config.get("api_version", "v1")
        self._backend_dir = Path(config.get("_backend_dir", ""))
        self.llm_service = config.get("_llm_service")
        
        # Resolve data_file relative to backend dir
        data_file = config.get("data_file", "")
        if data_file:
            p = Path(data_file)
            self.data_file = str(self._backend_dir / p) if not p.is_absolute() else data_file
        else:
            self.data_file = ""
        logger.info(f"PeakAgent initialized with endpoint: {self.endpoint}")

    def get_all_policies(self) -> List[Dict[str, Any]]:
        """Retrieve all policies from Peak system or local data file"""
        logger.info("Querying Peak for all policies...")
        try:
            policies = self._query_policies()
            logger.info(f"Retrieved {len(policies)} policies from Peak")
            return policies
        except Exception as e:
            logger.error(f"Failed to retrieve policies from Peak: {str(e)}")
            raise

    def get_policies_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Retrieve policies within a specific date range"""
        logger.info(f"Querying Peak for policies between {start_date} and {end_date}...")
        policies = self._query_policies(start_date=start_date, end_date=end_date)
        logger.info(f"Retrieved {len(policies)} policies for date range")
        return policies

    def get_policy_details(self, policy_number: str) -> Dict[str, Any]:
        """Retrieve detailed information for a specific policy"""
        logger.info(f"Retrieving details for policy: {policy_number}")
        all_policies = self._query_policies()
        for p in all_policies:
            if p.get("policy_number") == policy_number:
                return p
        return {}

    def _query_policies(self, **kwargs) -> List[Dict[str, Any]]:
        """
        Query policies – loads from local JSON data file when available,
        otherwise returns empty list (placeholder for live API).
        """
        # Try loading from local data file first (for dev/testing)
        if self.data_file:
            data_path = Path(self.data_file)
            if data_path.exists():
                logger.info(f"Loading policies from data file: {data_path}")
                with open(data_path, "r") as f:
                    policies = json.load(f)
                # Apply optional date filters
                if "start_date" in kwargs and "end_date" in kwargs:
                    policies = [
                        p for p in policies
                        if kwargs["start_date"] <= p.get("effective_date", "") <= kwargs["end_date"]
                    ]
                return policies

        # TODO: Implement actual Peak API connection
        logger.debug(f"Executing Peak query with parameters: {kwargs}")
        return []
