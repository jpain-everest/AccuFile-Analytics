# Architecture & Design Documentation

## System Overview

A&H AccuFile is an agentic workflow system that automates the file review and compliance process for Accident & Health underwriting files. The system operates on a nightly schedule to scan, validate, and report on file status.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    File Review Orchestrator                 │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Peak Agent      │  │  File Matcher    │                │
│  │ (Policy Data)    │  │  (File Scanning) │                │
│  └────────┬─────────┘  └─────────┬────────┘                │
│           │                      │                          │
│           ▼                      ▼                          │
│  ┌────────────────────────────────────────┐                │
│  │     Validator Agent                     │                │
│  │  (Structure & Completeness Checks)     │                │
│  └─────────────────┬──────────────────────┘                │
│                    │                                        │
│                    ▼                                        │
│  ┌────────────────────────────────────────┐                │
│  │   Report Generator                      │                │
│  │  (JSON, Summary, Issues Reports)       │                │
│  └────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
    ┌─────────────┐         ┌──────────────┐
    │ Peak System │         │ Shared Drive │
    │  (Read)     │         │   (Read)     │
    └─────────────┘         └──────────────┘
         │                          │
         └─────────────┬────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │  Azure Blob Storage     │
         │  (Archive & Reports)    │
         └─────────────────────────┘
```

## Component Architecture

### 1. Agents (Orchestration Layer)
Located in `src/agents/`

**Orchestrator** (`orchestrator.py`)
- Main workflow coordinator
- Manages step sequencing
- Aggregates results

**PeakAgent** (`peak_agent.py`)
- Connects to Peak insurance system
- Retrieves policy list and metadata
- Supports date range filtering

**FileMatcherAgent** (`file_matcher.py`)
- Scans Shared Drive for files
- Attempts to match files to policies
- Identifies missing files
- Uses pattern matching and similarity scoring

**ValidatorAgent** (`validator_agent.py`)
- Validates file structure
- Checks document completeness
- Verifies naming conventions
- Validates metadata

**ReportGeneratorAgent** (`report_generator.py`)
- Generates JSON reports
- Creates summary reports
- Generates detailed issues reports
- Saves reports to disk

### 2. Connectors (Integration Layer)
Located in `src/connectors/`

**BaseConnector** (`base_connector.py`)
- Abstract base class for all connectors
- Defines connect/disconnect interface

**PeakConnector** (`peak_connector.py`)
- Peak system API connection
- Policy queries
- Authentication handling

**StorageConnector** (`storage_connector.py`)
- Local filesystem and Shared Drive access
- File listing and retrieval
- Write operations

**AzureConnector** (`azure_connector.py`)
- Azure Blob Storage integration
- Upload/download operations
- File listing

### 3. Validators (Validation Logic)
Located in `src/validators/`

**FileValidator** (`file_validator.py`)
- Comprehensive file validation
- Document completeness checking
- Structure validation
- Naming convention checking

### 4. Utilities (Helper Functions)
Located in `src/utils/`

**ConfigLoader** (`config_loader.py`)
- YAML configuration file loading
- Environment variable overrides
- Configuration management

**LoggingConfig** (`logging_config.py`)
- Centralized logging configuration
- File and console handlers
- Rotating log files

**Helpers** (`helpers.py`)
- File sanitization
- Hash calculation
- File size formatting
- Policy number extraction

## Data Flow

### Workflow Execution Steps

```
1. Retrieve Policies from Peak
   └─> Return: List[Policy{policy_number, insured_name, type, ...}]

2. Match Files to Policies
   ├─> Scan Shared Drive
   ├─> Apply matching patterns
   └─> Return: (matched_files[], missing_files[])

3. Validate Files
   ├─> Check required documents
   ├─> Verify folder structure
   ├─> Check naming conventions
   ├─> Verify metadata
   └─> Return: validation_results{policy_num: {checks, issues}}

4. Generate Reports
   ├─> Create JSON report
   ├─> Create summary report
   ├─> Create issues report
   └─> Return: report_paths{json, summary, issues}
```

## Configuration Files

### `peak_config.yml`
```yaml
endpoint: "https://peak-api.example.com"
api_version: "v1"
timeout: 30
credentials:
  username: ""  # Set via environment
  password: ""  # Set via environment
```

### `storage_config.yml`
```yaml
shared_drive_path: "\\shared.drive\uwfiles"
local_cache_path: "data/cache"
file_patterns:
  policy_number: "^[A-Z0-9]{8,10}"
  insured_name: "pattern"
```

### `validation_rules.yml`
```yaml
policy_types:
  commercial:
    required_documents:
      - "Application"
      - "Quote/Binder"
      - "Policy Document"
      - "Inspections"
    folder_structure: "[PolicyNumber]_[InsuredName]"

required_documents:
  - "Application"
  - "Quote"
  - "Policy"

folder_structure:
  max_depth: 3
  naming_pattern: "[PolicyNum]_[Name]"

naming_conventions:
  forbidden_chars: "<>:\"/\\|?*"
  valid_separators: "_-"
```

### `reporting_config.yml`
```yaml
output_path: "reports/"
formats:
  - "json"
  - "summary"
  - "issues"
email_recipients:
  - "operations@example.com"
```

## Key Algorithms

### File Matching Algorithm
1. Clean filename and policy metadata (uppercase, remove special chars)
2. Pattern 1: Exact policy number match in filename or parent directory
   - Confidence: 0.95 if in filename, 0.90 if in directory
3. Pattern 2: Policy number substring match
   - Confidence: 0.85
4. Pattern 3: Insured name similarity matching
   - Calculate string similarity score
   - Confidence: 0.75 if similarity > 0.8

### Similarity Scoring
- Remove all non-alphanumeric characters from both strings
- Count common characters
- Score = common_chars / max(len(str1), len(str2))

### Validation Scoring
- Document Completeness: Check file contents for required document types
- Structure: Validate folder naming and depth
- Naming: Verify character restrictions and patterns
- Metadata: Ensure required tags/properties present

## Integration Points

### Peak System
- **Connection**: REST API (https)
- **Authentication**: Username/password or API key
- **Data**: Policy numbers, insured names, policy types, effective dates
- **Frequency**: Nightly full scan

### Shared Drive
- **Connection**: SMB/UNC path
- **Authentication**: Windows domain credentials
- **Data**: UW file structure and contents
- **Frequency**: Nightly full scan

### Azure Blob Storage
- **Connection**: Connection string or managed identity
- **Purpose**: Archive reports, staging analysis
- **Retention**: 30 days rolling window

## Security Considerations

1. **Credentials**: Never commit credentials to repository
   - Use environment variables for sensitive data
   - Use .env files (git-ignored)
   - Azure Managed Identity for cloud resources

2. **File Access**: Respect access controls
   - Use service account with minimal required permissions
   - Log all file access
   - Audit trail for sensitive operations

3. **Data Privacy**: Protect PII
   - Sanitize reports for distribution
   - Store sensitive data securely
   - Implement data retention policies

4. **Logging**: Comprehensive audit trail
   - Log all operations
   - Include timestamps and user context
   - Rotate logs to prevent disk fill

## Error Handling

### Graceful Degradation
- Peak unavailable → Continue with cached policies
- Shared Drive unavailable → Report with previous state
- Validation error → Mark file with error and continue
- Report generation error → Save partial results

### Retry Strategy
- Network errors: Exponential backoff (3 retries)
- Timeouts: Configurable timeout with retry
- API rate limits: Respect Rate-Limit-Reset header

### Monitoring
- Log all errors with context
- Track error frequency and patterns
- Alert on critical failures
- Generate health reports

## Performance Considerations

### Scalability
- Current expected scale: ~3,500 files, ~5,000 policies
- Batch processing for large file sets
- Incremental processing option (vs. full nightly scan)
- Caching of frequently accessed data

### Optimization
- Parallel file matching algorithm
- Incremental validation (only changed files)
- Index creation for quick lookups
- Archive old reports to reduce storage

## Future Enhancements

1. **Machine Learning**: Document classification using OCR
2. **Real-time Monitoring**: Move from nightly to continuous
3. **Auto-remediation**: Automatically fix common issues
4. **Predictive Analytics**: Forecast compliance issues
5. **Mobile App**: Compliance dashboard for mobile access
6. **Advanced Reporting**: Interactive dashboards and visualizations
7. **Integration**: DMS migration automation

## Testing Strategy

### Unit Tests
- Test each agent independently
- Mock external connectors
- Test validation rules
- Test utility functions

### Integration Tests
- Test full workflow end-to-end
- Use staging Peak/storage systems
- Validate report generation

### Performance Tests
- Benchmark large file set processing
- Measure memory usage
- Validate timeout handling

## Deployment

### Development
- Run locally with mock data
- Use config/example.env for local setup

### Staging
- Deploy to staging environment
- Test with subset of actual data
- Validate report generation

### Production
- Deploy to Azure or on-premises
- Configure scheduled execution (nightly, 11 PM UTC)
- Setup monitoring and alerting
- Establish support procedures
