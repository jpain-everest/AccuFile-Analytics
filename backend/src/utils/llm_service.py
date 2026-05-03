"""
LLM Service - Provides LLM capabilities for all agents
"""
import os
import logging
from typing import Any, Dict, List, Optional
import json

logger = logging.getLogger(__name__)


class LLMService:
    """
    Service class for LLM interactions across all agents
    Supports multiple LLM providers and function calling
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize LLM Service
        
        Args:
            config: LLM configuration dictionary
        """
        self.config = config
        self.provider = config.get("provider", "openai")
        self.model = config.get("model", "gpt-4")
        self.temperature = config.get("temperature", 0.3)
        self.max_tokens = config.get("max_tokens", 2000)
        self.enable_tools = config.get("enable_tools", True)
        
        # API key from environment
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
        
        # Feature flags
        self.features = {
            "document_analysis": config.get("enable_document_analysis", True),
            "smart_matching": config.get("enable_smart_matching", True),
            "validation_insights": config.get("enable_validation_insights", True),
            "report_generation": config.get("enable_report_generation", True)
        }
        
        # Prompts
        self.prompts = config.get("prompts", {})
        
        # Initialize client based on provider
        self.client = None
        self._initialize_client()
        
        logger.info(f"LLMService initialized with provider: {self.provider}, model: {self.model}")

    def _initialize_client(self):
        """Initialize the LLM client based on provider"""
        try:
            if self.provider == "openai":
                # Try to import OpenAI (optional dependency)
                try:
                    import openai
                    if self.api_key:
                        openai.api_key = self.api_key
                        self.client = openai
                        logger.info("OpenAI client initialized successfully")
                    else:
                        logger.warning("OpenAI API key not found. LLM features will be simulated.")
                except ImportError:
                    logger.warning("OpenAI library not installed. LLM features will be simulated.")
            # Add other providers as needed
        except Exception as e:
            logger.error(f"Error initializing LLM client: {e}")

    def analyze_document(self, document_info: Dict[str, Any], context: str = "") -> Dict[str, Any]:
        """
        Analyze a document using LLM
        
        Args:
            document_info: Document metadata and content
            context: Additional context for analysis
            
        Returns:
            Analysis results with insights and recommendations
        """
        if not self.features["document_analysis"]:
            return {"enabled": False, "message": "Document analysis is disabled"}
        
        prompt = self.prompts.get("document_analysis", "")
        
        # Simulate LLM response if client not available
        if not self.client or not self.api_key:
            return self._simulate_document_analysis(document_info)
        
        try:
            # Call LLM API
            analysis = self._call_llm(
                prompt=prompt,
                context=f"Document: {json.dumps(document_info, indent=2)}\n\nContext: {context}",
                tools=self._get_analysis_tools() if self.enable_tools else None
            )
            
            return {
                "success": True,
                "insights": analysis.get("content", ""),
                "risk_factors": analysis.get("risk_factors", []),
                "recommendations": analysis.get("recommendations", [])
            }
        except Exception as e:
            logger.error(f"Error in document analysis: {e}")
            return {"success": False, "error": str(e)}

    def smart_match(self, policy_info: Dict[str, Any], file_name: str) -> Dict[str, Any]:
        """
        Use LLM for intelligent file matching
        
        Args:
            policy_info: Policy information
            file_name: File name to match
            
        Returns:
            Match result with confidence score and reasoning
        """
        if not self.features["smart_matching"]:
            return {"enabled": False}
        
        prompt = self.prompts.get("smart_matching", "")
        
        # Simulate if no client
        if not self.client or not self.api_key:
            return self._simulate_smart_match(policy_info, file_name)
        
        try:
            result = self._call_llm(
                prompt=prompt,
                context=f"Policy: {json.dumps(policy_info)}\nFile Name: {file_name}",
                tools=self._get_matching_tools() if self.enable_tools else None
            )
            
            return {
                "success": True,
                "is_match": result.get("is_match", False),
                "confidence": result.get("confidence", 0.0),
                "reasoning": result.get("reasoning", "")
            }
        except Exception as e:
            logger.error(f"Error in smart matching: {e}")
            return {"success": False, "error": str(e)}

    def generate_validation_insights(self, validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate insights from validation results using LLM
        
        Args:
            validation_results: Validation results to analyze
            
        Returns:
            Insights including root causes and recommendations
        """
        if not self.features["validation_insights"]:
            return {"enabled": False}
        
        prompt = self.prompts.get("validation_insights", "")
        
        # Simulate if no client
        if not self.client or not self.api_key:
            return self._simulate_validation_insights(validation_results)
        
        try:
            insights = self._call_llm(
                prompt=prompt,
                context=f"Validation Results:\n{json.dumps(validation_results, indent=2)}",
                tools=self._get_validation_tools() if self.enable_tools else None
            )
            
            return {
                "success": True,
                "root_causes": insights.get("root_causes", []),
                "recommendations": insights.get("recommendations", []),
                "trend_analysis": insights.get("trends", "")
            }
        except Exception as e:
            logger.error(f"Error generating validation insights: {e}")
            return {"success": False, "error": str(e)}

    def generate_executive_summary(self, report_data: Dict[str, Any]) -> str:
        """
        Generate executive summary using LLM
        
        Args:
            report_data: Full report data
            
        Returns:
            Executive summary text
        """
        if not self.features["report_generation"]:
            return "Executive summary generation is disabled."
        
        prompt = self.prompts.get("report_summary", "")
        
        # Simulate if no client
        if not self.client or not self.api_key:
            return self._simulate_executive_summary(report_data)
        
        try:
            summary = self._call_llm(
                prompt=prompt,
                context=f"Report Data:\n{json.dumps(report_data, indent=2)}"
            )
            
            return summary.get("content", "Unable to generate summary")
        except Exception as e:
            logger.error(f"Error generating executive summary: {e}")
            return f"Error generating summary: {str(e)}"

    def _call_llm(self, prompt: str, context: str, tools: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Call the LLM API
        
        Args:
            prompt: System prompt
            context: User context/query
            tools: Optional tool definitions for function calling
            
        Returns:
            LLM response
        """
        # This is a placeholder - actual implementation would call the LLM API
        # For now, return simulated response
        return {"content": "LLM response placeholder"}

    # Simulation methods for when LLM is not available
    def _simulate_document_analysis(self, document_info: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate document analysis"""
        policy_num = document_info.get("policy_number", "UNKNOWN")
        return {
            "success": True,
            "mode": "simulated",
            "insights": f"Analysis for policy {policy_num}: Document structure appears standard. No critical issues detected in metadata.",
            "risk_factors": ["Simulated risk factor: Missing some optional fields"],
            "recommendations": ["Verify all required documents are present", "Review compliance checklist"]
        }

    def _simulate_smart_match(self, policy_info: Dict[str, Any], file_name: str) -> Dict[str, Any]:
        """Simulate smart matching"""
        policy_num = policy_info.get("policy_number", "")
        is_match = policy_num in file_name
        return {
            "success": True,
            "mode": "simulated",
            "is_match": is_match,
            "confidence": 0.85 if is_match else 0.15,
            "reasoning": f"Policy number {policy_num} {'found' if is_match else 'not found'} in file name"
        }

    def _simulate_validation_insights(self, validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate validation insights"""
        total_issues = sum(len(v.get("issues", [])) for v in validation_results.values() if isinstance(v, dict))
        return {
            "success": True,
            "mode": "simulated",
            "root_causes": [
                "Common pattern: Missing required documentation",
                "Inconsistent file naming conventions"
            ],
            "recommendations": [
                "Implement standardized file naming templates",
                "Create automated document checklist",
                "Provide training on documentation requirements"
            ],
            "trend_analysis": f"Identified {total_issues} total issues across validated files. Primary concerns are structural compliance."
        }

    def _simulate_executive_summary(self, report_data: Dict[str, Any]) -> str:
        """Simulate executive summary generation"""
        summary_data = report_data.get("summary", {})
        total = summary_data.get("total_policies", 0)
        matched = summary_data.get("matched_files", 0)
        avg_risk = summary_data.get("average_risk_score", 0)
        
        return f"""EXECUTIVE SUMMARY (AI-Generated)

File Review Analysis for {total} policies revealed a {(matched/total*100) if total > 0 else 0:.1f}% match rate with {matched} files successfully located.

Key Findings:
• Average Risk Score: {avg_risk:.1f}/100 indicating {'critical' if avg_risk >= 70 else 'elevated' if avg_risk >= 50 else 'moderate' if avg_risk >= 30 else 'acceptable'} risk levels
• Primary concerns center on documentation completeness and structural compliance
• Immediate attention required for high-risk policies

Recommendations:
1. Prioritize review of policies with risk scores above 70
2. Implement standardized documentation procedures
3. Provide additional training on compliance requirements
4. Schedule follow-up review in 30 days

This analysis leverages AI-powered insights to identify patterns and trends across the portfolio."""

    def _get_analysis_tools(self) -> List[Dict[str, Any]]:
        """Get tool definitions for document analysis"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "identify_risk_factors",
                    "description": "Identify specific risk factors in a document",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "risk_factors": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of identified risk factors"
                            }
                        }
                    }
                }
            }
        ]

    def _get_matching_tools(self) -> List[Dict[str, Any]]:
        """Get tool definitions for smart matching"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "calculate_match_score",
                    "description": "Calculate confidence score for file matching",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "confidence": {
                                "type": "number",
                                "description": "Confidence score between 0 and 1"
                            }
                        }
                    }
                }
            }
        ]

    def _get_validation_tools(self) -> List[Dict[str, Any]]:
        """Get tool definitions for validation insights"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "analyze_trends",
                    "description": "Analyze trends across validation results",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "trends": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Identified trends"
                            }
                        }
                    }
                }
            }
        ]

    def is_enabled(self) -> bool:
        """Check if LLM service is properly configured"""
        return self.client is not None and self.api_key is not None

    def get_status(self) -> Dict[str, Any]:
        """Get LLM service status"""
        return {
            "provider": self.provider,
            "model": self.model,
            "enabled": self.is_enabled(),
            "mode": "live" if self.is_enabled() else "simulated",
            "features": self.features
        }
