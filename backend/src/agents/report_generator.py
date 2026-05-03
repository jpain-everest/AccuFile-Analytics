"""
Report Generator - Generates analysis reports
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class ReportGeneratorAgent:
    """
    Agent responsible for generating analysis reports
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Report Generator Agent
        
        Args:
            config: Reporting configuration (output paths, formats, etc.)
        """
        self.config = config
        backend_dir = Path(config.get("_backend_dir", ""))
        raw_path = config.get("output_path", "reports/")
        p = Path(raw_path)
        self.output_path = (backend_dir / p) if not p.is_absolute() and backend_dir else p
        self.output_path.mkdir(parents=True, exist_ok=True)
        self.llm_service = config.get("_llm_service")
        logger.info(f"ReportGeneratorAgent initialized with output path: {self.output_path} (LLM: {'enabled' if self.llm_service else 'disabled'})")

    def generate_reports(
        self,
        policies: List[Dict[str, Any]],
        matched_files: List[Dict[str, Any]],
        missing_files: List[Dict[str, Any]],
        validation_results: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Generate comprehensive analysis reports
        
        Args:
            policies: All policies from Peak
            matched_files: Files that were matched to policies
            missing_files: Policies with missing files
            validation_results: File validation results
            
        Returns:
            Dictionary with paths to generated reports
        """
        logger.info("Generating analysis reports...")
        
        report_paths = {}
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        try:
            # Generate JSON report
            json_report = self._generate_json_report(
                policies, matched_files, missing_files, validation_results
            )
            json_path = self.output_path / f"accufile_report_{timestamp}.json"
            with open(json_path, 'w') as f:
                json.dump(json_report, f, indent=2)
            report_paths["json"] = str(json_path)
            logger.info(f"JSON report saved: {json_path}")
            
            # Generate summary report
            summary_report = self._generate_summary_report(
                policies, matched_files, missing_files, validation_results
            )
            summary_path = self.output_path / f"accufile_summary_{timestamp}.txt"
            with open(summary_path, 'w') as f:
                f.write(summary_report)
            report_paths["summary"] = str(summary_path)
            logger.info(f"Summary report saved: {summary_path}")
            
            # Generate detailed issues report
            issues_report = self._generate_issues_report(validation_results, missing_files)
            issues_path = self.output_path / f"accufile_issues_{timestamp}.txt"
            with open(issues_path, 'w') as f:
                f.write(issues_report)
            report_paths["issues"] = str(issues_path)
            logger.info(f"Issues report saved: {issues_path}")
            
        except Exception as e:
            logger.error(f"Report generation error: {str(e)}", exc_info=True)
            raise
        
        return report_paths

    def _generate_json_report(
        self,
        policies: List[Dict[str, Any]],
        matched_files: List[Dict[str, Any]],
        missing_files: List[Dict[str, Any]],
        validation_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate comprehensive JSON report"""
        # Calculate risk score statistics
        risk_scores = [v.get("risk_score", 0) for v in validation_results.values() if isinstance(v, dict)]
        avg_risk_score = sum(risk_scores) / len(risk_scores) if risk_scores else 0
        
        # Count by risk level
        risk_levels = {}
        for v in validation_results.values():
            if isinstance(v, dict):
                level = v.get("risk_level", "Unknown")
                risk_levels[level] = risk_levels.get(level, 0) + 1
        
        # Build policy risk scores for UI
        policy_risk_scores = []
        for policy_num, result in validation_results.items():
            if isinstance(result, dict):
                policy_risk_scores.append({
                    "policy_number": policy_num,
                    "risk_score": result.get("risk_score", 0),
                    "risk_level": result.get("risk_level", "Unknown"),
                    "is_compliant": result.get("is_compliant", False),
                    "missing_documents": result.get("missing_documents", []),
                    "issues_count": len(result.get("issues", []))
                })
        
        return {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_policies": len(policies),
                "matched_files": len(matched_files),
                "missing_files": len(missing_files),
                "match_rate": (len(matched_files) / len(policies) * 100) if policies else 0,
                "average_risk_score": round(avg_risk_score, 1),
                "risk_distribution": risk_levels
            },
            "policy_risk_scores": policy_risk_scores,
            "matched_files": matched_files,
            "missing_files": missing_files,
            "validation_results": validation_results
        }

    def _generate_summary_report(
        self,
        policies: List[Dict[str, Any]],
        matched_files: List[Dict[str, Any]],
        missing_files: List[Dict[str, Any]],
        validation_results: Dict[str, Any]
    ) -> str:
        """Generate text summary report"""
        total = len(policies) or 1  # avoid division by zero
        matched = len(matched_files) or 1
        
        lines = []
        lines.append("=" * 80)
        lines.append("A&H AccuFile - Daily Analysis Report")
        lines.append("=" * 80)
        lines.append(f"Report Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")
        
        lines.append("SUMMARY STATISTICS")
        lines.append("-" * 80)
        lines.append(f"Total Policies from Peak:      {len(policies):>6}")
        lines.append(f"Files Successfully Matched:    {len(matched_files):>6} ({len(matched_files)/total*100:.1f}%)")
        lines.append(f"Missing Files (Not Found):     {len(missing_files):>6} ({len(missing_files)/total*100:.1f}%)")
        lines.append("")
        
        # Validation summary
        compliant = sum(1 for r in validation_results.values() if isinstance(r, dict) and r.get("is_compliant"))
        non_compliant = matched - compliant
        lines.append(f"Files Validated:               {len(matched_files):>6}")
        lines.append(f"Compliant Files:               {compliant:>6} ({compliant/matched*100:.1f}%)")
        lines.append(f"Non-Compliant Files:           {non_compliant:>6} ({non_compliant/matched*100:.1f}%)")
        lines.append("")
        
        lines.append("=" * 80)
        
        return "\n".join(lines)

    def _generate_issues_report(
        self,
        validation_results: Dict[str, Any],
        missing_files: List[Dict[str, Any]]
    ) -> str:
        """Generate detailed issues report"""
        lines = []
        lines.append("=" * 80)
        lines.append("A&H AccuFile - Detailed Issues Report")
        lines.append("=" * 80)
        lines.append(f"Report Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")
        
        # Missing files section
        if missing_files:
            lines.append("MISSING FILES (No match found on Shared Drive)")
            lines.append("-" * 80)
            for i, missing in enumerate(missing_files[:10], 1):  # Show first 10
                lines.append(f"{i}. Policy: {missing.get('policy_number')} - {missing.get('insured_name')}")
            if len(missing_files) > 10:
                lines.append(f"... and {len(missing_files) - 10} more missing files")
            lines.append("")
        
        # Non-compliant files section
        non_compliant = [
            (k, v) for k, v in validation_results.items()
            if isinstance(v, dict) and not v.get("is_compliant")
        ]
        
        if non_compliant:
            lines.append("NON-COMPLIANT FILES (Structure/Completeness Issues)")
            lines.append("-" * 80)
            for i, (policy_num, result) in enumerate(non_compliant[:10], 1):
                lines.append(f"{i}. Policy: {policy_num}")
                if result.get("missing_documents"):
                    lines.append(f"   Missing Documents: {', '.join(result['missing_documents'])}")
                for issue in result.get("issues", []):
                    lines.append(f"   Issue: {issue}")
            if len(non_compliant) > 10:
                lines.append(f"... and {len(non_compliant) - 10} more non-compliant files")
            lines.append("")
        
        lines.append("=" * 80)
        
        return "\n".join(lines)
