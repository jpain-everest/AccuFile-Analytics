# LLM & AI Features Documentation

## Overview

The A&H AccuFile project now includes powerful LLM (Large Language Model) capabilities that enhance each agent with AI-powered analysis, insights, and recommendations. This feature operates in two modes:

1. **Simulated Mode** (Default): Provides template-based insights without requiring API keys
2. **Live Mode**: Connects to OpenAI GPT-4 (or other LLM providers) for advanced AI analysis

## Architecture

### LLMService (`src/utils/llm_service.py`)

Central service that provides LLM capabilities to all agents:
- Document analysis
- Smart file matching
- Validation insights generation
- Executive summary creation
- Tool/function calling support

### Agent Integration

Each agent has been enhanced with LLM capabilities:

#### 1. **ValidatorAgent**
- **Feature**: Document content analysis
- **Purpose**: Analyzes policy documents to identify missing information, compliance issues, and risk factors
- **Output**: Detailed insights added to validation results

#### 2. **FileMatcherAgent**
- **Feature**: Smart fuzzy matching
- **Purpose**: Uses AI to match files to policies even with naming variations
- **Output**: Match confidence scores with reasoning

#### 3. **PeakAgent**
- **Feature**: Policy data extraction
- **Purpose**: Intelligently parse and understand policy information
- **Output**: Structured policy insights

#### 4. **ReportGeneratorAgent**
- **Feature**: Executive summary generation
- **Purpose**: Creates natural language summaries of findings
- **Output**: AI-generated executive summaries

## Configuration

### 1. LLM Config (`config/llm_config.yml`)

```yaml
llm:
  provider: "openai"
  model: "gpt-4"
  temperature: 0.3
  max_tokens: 2000
  
  # Feature flags
  enable_document_analysis: true
  enable_smart_matching: true
  enable_validation_insights: true
  enable_report_generation: true
  enable_tools: true
```

### 2. Environment Variables

Create `.env` file in `backend/config/`:

```bash
# OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# Or generic LLM key
LLM_API_KEY=your-api-key-here

# Azure OpenAI (optional)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-key
```

## Features

### 1. Document Analysis
- Identifies missing critical information
- Detects compliance issues
- Assesses risk factors
- Provides remediation recommendations

### 2. Smart File Matching
- Fuzzy logic matching with confidence scores
- Understanding of naming variations
- Context-aware policy-to-file mapping
- Detailed matching reasoning

### 3. Validation Insights
- Root cause analysis of issues
- Pattern detection across files
- Trend analysis
- Actionable recommendations

### 4. Executive Summaries
- Natural language report generation
- Key findings highlighting
- Risk assessment summaries
- Strategic recommendations

## Usage

### Simulated Mode (No API Key Required)

The system works out of the box with template-based insights:

```python
# Agents automatically use simulated mode if no API key is configured
orchestrator = FileReviewOrchestrator(config)
result = orchestrator.run()

# LLM insights are included in results
llm_insights = result['llm_insights']
```

### Live Mode (API Key Required)

1. Set environment variable:
```bash
export OPENAI_API_KEY=sk-your-key
```

2. Run normally - system auto-detects API key:
```python
orchestrator = FileReviewOrchestrator(config)
result = orchestrator.run()
```

## UI Components

### LLMInsights Component

Displays AI-generated insights in the dashboard:

- **Executive Summary**: High-level overview
- **Root Cause Analysis**: Deep dive into issues
- **AI Recommendations**: Actionable next steps
- **Trend Analysis**: Pattern identification
- **Status Badge**: Shows Live/Simulated mode

## API Response Structure

```json
{
  "summary": {...},
  "issues": [...],
  "policy_risk_scores": [...],
  "llm_insights": {
    "success": true,
    "mode": "simulated",  // or "live"
    "executive_summary": "AI-generated summary text...",
    "root_causes": [
      "Common pattern: Missing required documentation",
      "Inconsistent file naming conventions"
    ],
    "recommendations": [
      "Implement standardized file naming templates",
      "Create automated document checklist"
    ],
    "trend_analysis": "Analysis text...",
    "status": {
      "provider": "openai",
      "model": "gpt-4",
      "enabled": true,
      "features": {...}
    }
  },
  "logs": "..."
}
```

## Tool/Function Calling

The LLM service supports function calling for structured outputs:

### Available Tools

1. **identify_risk_factors**: Extract specific risks from documents
2. **calculate_match_score**: Compute file matching confidence
3. **analyze_trends**: Identify patterns across validations

### Example

```python
# LLM can call tools for structured data extraction
analysis = llm_service.analyze_document(
    document_info={"policy_number": "AH-2024-001"},
    context="Validation context"
)

# Result includes tool call outputs
risk_factors = analysis.get("risk_factors", [])
```

## Customization

### Custom Prompts

Edit `config/llm_config.yml` to customize AI behavior:

```yaml
prompts:
  document_analysis: |
    You are an expert underwriting file analyst...
    [Custom instructions]
    
  validation_insights: |
    You are an expert compliance officer...
    [Custom instructions]
```

### Adding New Providers

Extend `LLMService._initialize_client()`:

```python
elif self.provider == "anthropic":
    import anthropic
    self.client = anthropic.Anthropic(api_key=self.api_key)
```

## Cost Considerations

### Simulated Mode
- **Cost**: $0
- **Speed**: Instant
- **Quality**: Template-based, good for testing

### Live Mode (OpenAI GPT-4)
- **Cost**: ~$0.01-0.03 per workflow run (depending on data size)
- **Speed**: 2-5 seconds per API call
- **Quality**: Advanced AI analysis

### Recommendations
- Use **Simulated Mode** for development/testing
- Use **Live Mode** for production critical analysis
- Enable only needed features to minimize costs

## Troubleshooting

### "LLM features will be simulated"
- No API key found
- Set `OPENAI_API_KEY` environment variable

### "Import openai could not be resolved"
- Install dependencies: `pip install openai`

### High API costs
- Reduce `max_tokens` in config
- Disable unused features
- Use caching (future enhancement)

## Future Enhancements

- [ ] Response caching to reduce API calls
- [ ] Support for local LLMs (Llama, Mistral)
- [ ] Batch processing for efficiency
- [ ] Custom fine-tuned models
- [ ] Real-time streaming responses
- [ ] Multi-modal analysis (images, PDFs)

## Security

- API keys stored in environment variables (never in code)
- No data logging by default
- Configurable data retention policies
- Compliance with data privacy regulations

## Performance

- Async API calls for non-blocking operations
- Parallel processing where possible
- Intelligent caching strategies
- Configurable timeouts
- Graceful degradation to simulated mode on failures

---

For questions or issues, refer to the main project documentation or contact the development team.
