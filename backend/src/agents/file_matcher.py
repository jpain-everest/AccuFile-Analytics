"""
File Matcher Agent - Matches files to policies
"""
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)


class FileMatcherAgent:
    """
    Agent responsible for matching files from Shared Drive to policies
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize File Matcher Agent
        
        Args:
            config: Storage configuration (Shared Drive path, file patterns, etc.)
        """
        self.config = config
        self._backend_dir = Path(config.get("_backend_dir", ""))
        raw_path = config.get("shared_drive_path", "")
        p = Path(raw_path)
        self.shared_drive_path = str(self._backend_dir / p) if raw_path and not p.is_absolute() else raw_path
        self.pattern_templates = config.get("file_patterns", {})
        self.llm_service = config.get("_llm_service")
        logger.info(f"FileMatcherAgent initialized with path: {self.shared_drive_path} (LLM: {'enabled' if self.llm_service else 'disabled'})")

    def match_files_to_policies(self, policies: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Match files from Shared Drive to policies
        
        Args:
            policies: List of policies from Peak
            
        Returns:
            Tuple of (matched_files, missing_files)
        """
        logger.info(f"[FILE MATCHER] Initiating intelligent file matching for {len(policies)} policies")
        logger.info("[REASONING] Matching policies to document folders using name similarity algorithms")
        
        matched_files = []
        missing_files = []
        
        try:
            # Scan shared drive for files
            logger.info("[ACTION] Scanning shared drive for policy folders and documents")
            available_files = self._scan_shared_drive()
            logger.info(f"[DISCOVERY] Found {len(available_files)} policy folders in shared drive")
            logger.info(f"[REASONING] Will attempt to match each of {len(policies)} policies to these folders")
            
            # Attempt to match each policy to a file
            for policy in policies:
                match_result = self._find_policy_file(policy, available_files)
                
                if match_result:
                    matched_files.append(match_result)
                else:
                    missing_files.append({
                        "policy_number": policy.get("policy_number", "UNKNOWN"),
                        "insured_name": policy.get("insured_name", "UNKNOWN"),
                        "status": "MISSING"
                    })
            
            match_rate = (len(matched_files) / len(policies) * 100) if policies else 0
            logger.info(f"[FILE MATCHER] Matching complete: {len(matched_files)} matched, {len(missing_files)} missing")
            logger.info(f"[METRICS] Match rate: {match_rate:.1f}%")
            if match_rate < 80:
                logger.warning(f"[RECOMMENDATION] Match rate below 80% - review folder naming conventions")
            logger.info(f"[REASONING] Unmatched policies may indicate missing folders or naming discrepancies")
            
        except Exception as e:
            logger.error(f"File matching error: {str(e)}", exc_info=True)
            raise
        
        return matched_files, missing_files

    def _scan_shared_drive(self) -> List[Dict[str, Any]]:
        """
        Scan Shared Drive for policy folders and their files
        
        Returns:
            List of policy folder entries with metadata
        """
        logger.info(f"Scanning Shared Drive: {self.shared_drive_path}")
        available_files = []
        
        try:
            path = Path(self.shared_drive_path)
            if path.exists():
                # Scan top-level directories as policy folders
                for item in path.iterdir():
                    if item.is_dir():
                        # Collect all files within this policy folder
                        files_in_folder = []
                        for f in item.rglob("*"):
                            if f.is_file():
                                files_in_folder.append({
                                    "filename": f.name,
                                    "relative_path": str(f.relative_to(item)),
                                    "size": f.stat().st_size,
                                })
                        available_files.append({
                            "full_path": str(item),
                            "folder_name": item.name,
                            "files": files_in_folder,
                            "file_count": len(files_in_folder),
                        })
            
            logger.debug(f"Found {len(available_files)} policy folders during scan")
        except Exception as e:
            logger.warning(f"Error scanning Shared Drive: {str(e)}")
        
        return available_files

    def _find_policy_file(
        self,
        policy: Dict[str, Any],
        available_files: List[Dict[str, Any]]
    ) -> Dict[str, Any] | None:
        """
        Attempt to find a folder matching the policy
        """
        policy_number = policy.get("policy_number", "").upper()
        insured_name = policy.get("insured_name", "").upper()
        
        for folder_info in available_files:
            folder_name = folder_info.get("folder_name", "").upper()
            
            # Pattern 1: Policy number in folder name
            if policy_number and policy_number in folder_name:
                return {
                    **policy,
                    "matched_file": folder_info,
                    "match_confidence": 0.95,
                }
            
            # Pattern 2: Insured name similarity
            if insured_name and self._similarity_score(insured_name, folder_name) > 0.8:
                return {
                    **policy,
                    "matched_file": folder_info,
                    "match_confidence": 0.75,
                }
        
        return None

    def _similarity_score(self, str1: str, str2: str) -> float:
        """
        Calculate similarity score between two strings
        
        Args:
            str1: First string
            str2: Second string
            
        Returns:
            Similarity score between 0 and 1
        """
        # Simple implementation - can be enhanced with better algorithms
        str1_clean = re.sub(r'[^a-z0-9]', '', str1.lower())
        str2_clean = re.sub(r'[^a-z0-9]', '', str2.lower())
        
        if not str1_clean or not str2_clean:
            return 0.0
        
        common = sum(1 for c in str1_clean if c in str2_clean)
        return common / max(len(str1_clean), len(str2_clean))
