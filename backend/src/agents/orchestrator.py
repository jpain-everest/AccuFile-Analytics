"""
Orchestrator - Main workflow coordinator
"""
import io
import json
import logging
import yaml
from pathlib import Path
from typing import Any, Dict

from src.agents.file_matcher import FileMatcherAgent
from src.agents.peak_agent import PeakAgent
from src.agents.report_generator import ReportGeneratorAgent
from src.agents.validator_agent import ValidatorAgent
from src.utils.llm_service import LLMService

logger = logging.getLogger(__name__)


class FileReviewOrchestrator:
    """
    Orchestrates the complete A&H file review workflow:
    1. Retrieve policies from Peak
    2. Match files from Shared Drive
    3. Validate file structure and completeness
    4. Generate reports
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize orchestrator with configuration
        
        Args:
            config: Configuration dictionary with all system settings
        """
        self.config = config
        self._backend_dir = config.get("_backend_dir", "")
        
        # Load LLM configuration
        llm_config = self._load_llm_config()
        self.llm_service = LLMService(llm_config) if llm_config else None
        
        # Inject backend_dir and llm_service into sub-configs
        for key in ("peak", "storage", "validation", "reporting"):
            if key in config and isinstance(config[key], dict):
                config[key]["_backend_dir"] = self._backend_dir
                config[key]["_llm_service"] = self.llm_service
        
        self.peak_agent = PeakAgent(config.get("peak", {}))
        self.file_matcher = FileMatcherAgent(config.get("storage", {}))
        self.validator = ValidatorAgent(config.get("validation", {}))
        self.report_generator = ReportGeneratorAgent(config.get("reporting", {}))
        
        # Set up log stream for capturing logs
        self.log_stream = io.StringIO()
        log_handler = logging.StreamHandler(self.log_stream)
        log_handler.setLevel(logging.DEBUG)
        log_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
        
        # Add handler to root logger to capture all logs
        root_logger = logging.getLogger()
        root_logger.addHandler(log_handler)
        root_logger.setLevel(logging.INFO)

    def run(self) -> Dict[str, Any]:
        """
        Execute the complete workflow
        
        Returns:
            Dictionary with workflow results and statistics
        """
        logger.info("="*80)
        logger.info("[ORCHESTRATOR AGENT] Initiating A&H AccuFile Workflow")
        logger.info("[REASONING] This workflow coordinates multiple AI agents to validate underwriting files")
        logger.info("="*80)
        
        results = {
            "step_1_policies_retrieved": None,
            "step_2_files_matched": None,
            "step_3_validation_results": None,
            "step_4_reports_generated": None,
            "summary": {}
        }

        try:
            # Step 1: Retrieve policies from Peak
            logger.info("\n[STEP 1] PEAK AGENT - Policy Retrieval")
            logger.info("[REASONING] Fetching all active policies from Peak system to establish baseline")
            policies = self._step_1_retrieve_policies()
            results["step_1_policies_retrieved"] = len(policies)
            logger.info(f"[RESULT] Successfully retrieved {len(policies)} policies from Peak system")
            logger.info(f"[ANALYSIS] These policies will be matched against underwriting files in shared drive")

            # Step 2: Match files to policies
            logger.info("\n[STEP 2] FILE MATCHER AGENT - Policy-to-File Matching")
            logger.info("[REASONING] Using intelligent matching algorithms to link policies with their document folders")
            logger.info("[METHOD] Matching by insured name similarity and policy number patterns")
            matched_files, missing_files = self._step_2_match_files(policies)
            results["step_2_files_matched"] = {
                "matched": len(matched_files),
                "missing": len(missing_files)
            }
            match_rate = (len(matched_files) / len(policies) * 100) if policies else 0
            logger.info(f"[RESULT] Matched {len(matched_files)} policies, {len(missing_files)} unmatched")
            logger.info(f"[ANALYSIS] Match rate: {match_rate:.1f}% - {'GOOD' if match_rate >= 80 else 'NEEDS ATTENTION'}")

            # Step 3: Validate files
            logger.info("\n[STEP 3] VALIDATOR AGENT - Compliance & Risk Assessment")
            logger.info("[REASONING] Analyzing each policy folder for required documents, naming conventions, and structure")
            logger.info("[CRITERIA] Checking for Application, Quote/Binder, Policy Document, and proper folder organization")
            validation_results = self._step_3_validate_files(matched_files)
            results["step_3_validation_results"] = validation_results
            compliant_count = sum(1 for r in validation_results.values() if isinstance(r, dict) and r.get('is_compliant'))
            logger.info(f"[RESULT] Validated {len(validation_results)} policy folders")
            logger.info(f"[ANALYSIS] Compliant: {compliant_count}, Non-compliant: {len(validation_results) - compliant_count}")
            logger.info(f"[RISK SCORING] Calculated risk scores based on missing documents and validation failures")

            # Step 4: Generate reports
            logger.info("\n[STEP 4] REPORT GENERATOR AGENT - Insights & Documentation")
            logger.info("[REASONING] Compiling findings into actionable reports with risk scores and recommendations")
            logger.info("[OUTPUT] Generating JSON report, summary statistics, and detailed issues list")
            reports = self._step_4_generate_reports(
                policies,
                matched_files,
                missing_files,
                validation_results
            )
            results["step_4_reports_generated"] = reports
            logger.info(f"[RESULT] Reports successfully generated at: {self.config.get('reporting', {}).get('output_path', 'reports/')}")
            logger.info(f"[NEXT STEPS] Reports ready for review and action")

            # Build summary
            results["summary"] = self._build_summary(
                policies,
                matched_files,
                missing_files,
                validation_results
            )
            
            # Load summary, issues, and risk scores from generated report files
            summary_report, issues_report, policy_risk_scores = self._get_report_data(reports)

        except Exception as e:
            logger.error(f"Workflow error: {str(e)}", exc_info=True)
            raise
        
        # Ensure all logs are flushed
        logger.info("\n" + "="*80)
        logger.info("[ORCHESTRATOR AGENT] Workflow Completed Successfully")
        logger.info("[SUMMARY] All agents completed their tasks - results ready for review")
        logger.info("[AI EXPLAINABILITY] This log provides full transparency into agent reasoning and decisions")
        logger.info("="*80)
        for handler in logging.getLogger().handlers:
            handler.flush()
        
        # Get log content
        log_content = self.log_stream.getvalue()
        
        # Generate LLM insights if available
        llm_insights = {}
        if self.llm_service:
            logger.info("\n[LLM SERVICE] AI-Powered Insights Generation")
            logger.info("[REASONING] Using advanced language models to provide intelligent analysis and recommendations")
            try:
                llm_insights = self.llm_service.generate_validation_insights(validation_results)
                llm_insights["executive_summary"] = self.llm_service.generate_executive_summary({
                    "summary": summary_report,
                    "policy_risk_scores": policy_risk_scores,
                    "issues": issues_report
                })
                llm_insights["status"] = self.llm_service.get_status()
                logger.info(f"[RESULT] LLM insights generated in {llm_insights['status'].get('mode', 'unknown')} mode")
                logger.info("[ANALYSIS] AI provided root cause analysis, recommendations, and executive summary")
            except Exception as e:
                logger.error(f"[ERROR] LLM insights generation failed: {e}")
                llm_insights = {"error": str(e)}
        
        # Build file structure for tree view
        file_structure = self._build_file_structure(policies, matched_files, missing_files, validation_results)
        
        return {
            "summary": summary_report,
            "issues": issues_report,
            "policy_risk_scores": policy_risk_scores,
            "validation_results": validation_results,
            "file_structure": file_structure,
            "llm_insights": llm_insights,
            "logs": log_content
        }

    def _step_1_retrieve_policies(self) -> list:
        """Retrieve all policies from Peak system"""
        return self.peak_agent.get_all_policies()

    def _step_2_match_files(self, policies: list) -> tuple:
        """Match files from Shared Drive to policies"""
        return self.file_matcher.match_files_to_policies(policies)

    def _step_3_validate_files(self, matched_files: list) -> Dict[str, Any]:
        """Validate matched files for structure and completeness"""
        return self.validator.validate_files(matched_files)

    def _step_4_generate_reports(
        self,
        policies: list,
        matched_files: list,
        missing_files: list,
        validation_results: Dict[str, Any]
    ) -> Dict[str, str]:
        """Generate analysis reports"""
        return self.report_generator.generate_reports(
            policies,
            matched_files,
            missing_files,
            validation_results
        )

    def _build_summary(
        self,
        policies: list,
        matched_files: list,
        missing_files: list,
        validation_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build execution summary statistics"""
        total_policies = len(policies)
        matched_count = len(matched_files)
        missing_count = len(missing_files)
        match_rate = (matched_count / total_policies * 100) if total_policies > 0 else 0
        
        # Count validation failures
        failed_validations = sum(
            1 for result in validation_results.values()
            if isinstance(result, dict) and not result.get("is_compliant", True)
        )
        fail_rate = (failed_validations / matched_count * 100) if matched_count > 0 else 0

        return {
            "total_policies": total_policies,
            "matched_files": matched_count,
            "match_rate_percent": round(match_rate, 2),
            "missing_files": missing_count,
            "missing_rate_percent": round(100 - match_rate, 2),
            "files_validated": matched_count,
            "validation_failures": failed_validations,
            "failure_rate_percent": round(fail_rate, 2),
            "timestamp": str(__import__("datetime").datetime.now())
        }
    
    def _load_llm_config(self) -> Dict[str, Any]:
        """Load LLM configuration from YAML file"""
        try:
            llm_config_path = Path(self._backend_dir) / "config" / "llm_config.yml"
            if llm_config_path.exists():
                with open(llm_config_path, 'r') as f:
                    config = yaml.safe_load(f)
                    return config.get("llm", {})
            else:
                logger.warning(f"LLM config file not found at {llm_config_path}")
                return {}
        except Exception as e:
            logger.error(f"Error loading LLM config: {e}")
            return {}
    
    def _get_report_data(self, report_paths: Dict[str, str]):
        """Load data from generated JSON and TXT report files."""
        from pathlib import Path
        
        summary_report = {}
        issues_report = []
        policy_risk_scores = []

        json_report_path = report_paths.get("json")
        if json_report_path:
            try:
                with open(json_report_path, 'r') as f:
                    json_data = json.load(f)
                    summary_report = json_data.get("summary", {})
                    policy_risk_scores = json_data.get("policy_risk_scores", [])
                    
                    # Build issues report from validation results in JSON
                    validation_results = json_data.get("validation_results", {})
                    for policy_num, result in validation_results.items():
                        if isinstance(result, dict):
                            # Add issues for missing documents
                            for missing_doc in result.get("missing_documents", []):
                                issues_report.append({
                                    "policy_id": policy_num,
                                    "file_name": "N/A",
                                    "issue": f"Missing required document: {missing_doc}"
                                })
                            
                            # Add other validation issues
                            for issue in result.get("issues", []):
                                issues_report.append({
                                    "policy_id": policy_num,
                                    "file_name": "Policy Folder",
                                    "issue": issue
                                })
                    
            except (FileNotFoundError, json.JSONDecodeError) as e:
                logger.error(f"Could not read or parse summary from JSON report: {e}")
        
        return summary_report, issues_report, policy_risk_scores
    
    def _build_file_structure(self, policies, matched_files, missing_files, validation_results):
        """Build hierarchical file structure for tree view based on actual file system."""
        from pathlib import Path
        import os
        
        file_structure = []
        
        # Get the shared drive path from config
        shared_drive_path = Path(self.config.get("storage", {}).get("shared_drive_path", ""))
        if not shared_drive_path.is_absolute():
            shared_drive_path = Path(self._backend_dir) / shared_drive_path
        
        # Create a lookup for validation results
        validation_lookup = {policy.get("policy_number"): validation_results.get(policy.get("policy_number"), {}) 
                           for policy in policies}
        
        # Scan the actual file system
        if shared_drive_path.exists() and shared_drive_path.is_dir():
            for policy_folder in sorted(shared_drive_path.iterdir()):
                if not policy_folder.is_dir():
                    continue
                
                policy_num = policy_folder.name
                validation = validation_lookup.get(policy_num, {})
                
                # Determine policy status
                is_compliant = validation.get("is_compliant", True)
                issues = validation.get("issues", [])
                issues_count = len(issues)
                missing_docs = validation.get("missing_documents", [])
                missing_count = len(missing_docs)
                
                if missing_count > 0 or issues_count >= 3:
                    status = "critical"
                elif issues_count > 0:
                    status = "issues"
                elif not is_compliant:
                    status = "missing"
                else:
                    status = "compliant"
                
                # Build files list from actual file system
                files = []
                try:
                    for file_path in sorted(policy_folder.rglob("*")):
                        if file_path.is_file():
                            # Determine file status based on validation issues
                            file_status = "compliant"
                            file_issues = 0
                            
                            for issue in issues:
                                if file_path.name in str(issue):
                                    file_status = "issues"
                                    file_issues += 1
                            
                            # Get relative path within policy folder
                            rel_path = file_path.relative_to(policy_folder)
                            # Normalize path separators to forward slashes for consistent frontend parsing
                            rel_path_str = str(rel_path).replace('\\', '/')
                            
                            files.append({
                                "name": rel_path_str,  # Show relative path for nested files with forward slashes
                                "path": str(file_path),
                                "status": file_status,
                                "issues_count": file_issues,
                                "size": file_path.stat().st_size,
                                "type": file_path.suffix.lower()
                            })
                except Exception as e:
                    logger.warning(f"Error reading files for policy {policy_num}: {e}")
                
                file_structure.append({
                    "policy_number": policy_num,
                    "status": status,
                    "file_count": len(files),
                    "issues_count": issues_count,
                    "missing_count": missing_count,
                    "files": files,
                    "missing_files": missing_docs,
                    "folder_path": str(policy_folder)
                })
        else:
            logger.warning(f"Shared drive path not found: {shared_drive_path}")
        
        return file_structure