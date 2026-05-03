"""
Validator Agent - Validates file structure and completeness
"""
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class ValidatorAgent:
    """
    Agent responsible for validating file structure and completeness
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Validator Agent
        
        Args:
            config: Validation rules and requirements configuration
        """
        self.config = config
        self.required_documents = config.get("required_documents", [])
        self.folder_structure_rules = config.get("folder_structure", {})
        self.naming_conventions = config.get("naming_conventions", {})
        self.llm_service = config.get("_llm_service")
        logger.info(f"ValidatorAgent initialized (LLM: {'enabled' if self.llm_service else 'disabled'})")

    def validate_files(self, matched_files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate each file for structure and completeness
        
        Args:
            matched_files: List of matched file information
            
        Returns:
            Dictionary of validation results keyed by policy number
        """
        logger.info(f"[VALIDATOR] Beginning compliance validation for {len(matched_files)} policy folders")
        logger.info("[REASONING] Checking required documents, folder structure, and naming conventions")
        logger.info("[CRITERIA] Required: Application, Quote/Binder, Policy Document")
        
        validation_results = {}
        compliant_count = 0
        
        try:
            for file_info in matched_files:
                policy_number = file_info.get("policy_number", "UNKNOWN")
                result = self._validate_single_file(file_info)
                validation_results[policy_number] = result
                
                if result.get("is_compliant"):
                    compliant_count += 1
            
            compliance_rate = (compliant_count / len(matched_files) * 100) if matched_files else 0
            logger.info(f"[VALIDATOR] Validation complete: {compliant_count}/{len(matched_files)} compliant")
            logger.info(f"[METRICS] Compliance rate: {compliance_rate:.1f}%")
            if compliance_rate < 70:
                logger.warning(f"[ALERT] Compliance rate below 70% - immediate action recommended")
            logger.info(f"[REASONING] Risk scores calculated based on missing docs (20pts each) + failed checks (10pts each)")
            
        except Exception as e:
            logger.error(f"Validation error: {str(e)}", exc_info=True)
            raise
        
        return validation_results

    def _validate_single_file(self, file_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate a single file
        
        Args:
            file_info: File information to validate
            
        Returns:
            Validation result dictionary
        """
        policy_number = file_info.get("policy_number", "UNKNOWN")
        logger.debug(f"Validating policy: {policy_number}")
        
        result = {
            "policy_number": policy_number,
            "is_compliant": True,
            "checks": {},
            "missing_documents": [],
            "issues": [],
            "risk_score": 0,
            "risk_level": "Low"
        }
        
        try:
            # Check 1: Required documents present
            missing = self._check_required_documents(file_info)
            result["checks"]["required_documents"] = len(missing) == 0
            if missing:
                result["is_compliant"] = False
                result["missing_documents"] = missing
                result["issues"].append(f"Missing {len(missing)} required document(s)")
            
            # Check 2: Folder structure
            structure_valid = self._check_folder_structure(file_info)
            result["checks"]["folder_structure"] = structure_valid
            if not structure_valid:
                result["is_compliant"] = False
                result["issues"].append("Folder structure does not match standard")
            
            # Check 3: Naming conventions
            naming_valid = self._check_naming_conventions(file_info)
            result["checks"]["naming_conventions"] = naming_valid
            if not naming_valid:
                result["is_compliant"] = False
                result["issues"].append("File/folder names do not follow conventions")
            
            # Check 4: Metadata completeness
            metadata_valid = self._check_metadata(file_info)
            result["checks"]["metadata"] = metadata_valid
            if not metadata_valid:
                result["is_compliant"] = False
                result["issues"].append("File metadata is incomplete or missing")
            
            # Calculate risk score based on validation results
            risk_score, risk_level = self._calculate_risk_score(result)
            result["risk_score"] = risk_score
            result["risk_level"] = risk_level
            
        except Exception as e:
            logger.error(f"Error validating {policy_number}: {str(e)}")
            result["is_compliant"] = False
            result["issues"].append(f"Validation error: {str(e)}")
        
        return result

    def _check_required_documents(self, file_info: Dict[str, Any]) -> List[str]:
        """
        Check if all required documents are present by scanning filenames
        in the matched folder for keywords.
        """
        missing = []
        matched_file = file_info.get("matched_file", {})
        files = matched_file.get("files", [])
        filenames_lower = [f.get("filename", "").lower() for f in files]
        all_text = " ".join(filenames_lower)
        
        # Required document checks (keyword-based)
        required_docs = [
            ("Application", ["application", "app"]),
            ("Quote/Binder", ["quote", "binder", "proposal"]),
            ("Policy Document", ["policy", "declarations"]),
        ]
        
        for doc_name, keywords in required_docs:
            found = any(kw in all_text for kw in keywords)
            if not found:
                missing.append(doc_name)
        
        logger.debug(f"Required doc check: {len(missing)} missing for {file_info.get('policy_number')}")
        return missing

    def _check_folder_structure(self, file_info: Dict[str, Any]) -> bool:
        """
        Validate folder structure – expects a Documents subfolder.
        """
        matched_file = file_info.get("matched_file", {})
        files = matched_file.get("files", [])
        
        # Check if any files are inside a "Documents" subfolder
        has_subfolder = any("Documents" in f.get("relative_path", "") or
                          "Underwriting" in f.get("relative_path", "") or
                          "Inspections" in f.get("relative_path", "")
                          for f in files)
        return has_subfolder

    def _check_naming_conventions(self, file_info: Dict[str, Any]) -> bool:
        """
        Validate that filenames follow the [PolicyNumber]_description pattern.
        """
        policy_number = file_info.get("policy_number", "")
        matched_file = file_info.get("matched_file", {})
        files = matched_file.get("files", [])
        
        if not files or not policy_number:
            return False
        
        # Check if at least half the files include the policy number
        count_with_policy = sum(
            1 for f in files if policy_number.upper() in f.get("filename", "").upper()
        )
        return count_with_policy >= (len(files) / 2)

    def _check_metadata(self, file_info: Dict[str, Any]) -> bool:
        """
        Validate file metadata completeness
        
        Args:
            file_info: File information
            
        Returns:
            True if metadata is complete, False otherwise
        """
        # TODO: Implement metadata validation
        # Check for required tags, properties, etc.
        
        return True
    
    def _calculate_risk_score(self, result: Dict[str, Any]) -> tuple:
        """
        Calculate risk score based on validation results
        
        Args:
            result: Validation result dictionary
            
        Returns:
            Tuple of (risk_score, risk_level)
        """
        score = 0
        
        # Missing documents: 20 points per document
        missing_count = len(result.get("missing_documents", []))
        score += missing_count * 20
        
        # Failed checks: 10 points per failed check
        checks = result.get("checks", {})
        failed_checks = sum(1 for passed in checks.values() if not passed)
        score += failed_checks * 10
        
        # Issues: 5 points per issue
        issues_count = len(result.get("issues", []))
        score += issues_count * 5
        
        # Cap at 100
        score = min(score, 100)
        
        # Determine risk level
        if score >= 70:
            risk_level = "Critical"
        elif score >= 50:
            risk_level = "High"
        elif score >= 30:
            risk_level = "Medium"
        elif score >= 10:
            risk_level = "Low"
        else:
            risk_level = "Minimal"
        
        logger.info(f"[RISK CALCULATION] Score: {score}/100 | Level: {risk_level}")
        logger.info(f"[BREAKDOWN] Missing docs: {missing_count} (×20pts) | Failed checks: {failed_checks} (×10pts) | Issues: {issues_count} (×5pts)")
        if score >= 70:
            logger.warning(f"[CRITICAL] Policy requires immediate remediation - score {score}")
        
        return score, risk_level
