# Configuration Guide

## Quick Start

### 1. Create Configuration Directory Structure
The `config/` directory should contain:
```
config/
├── peak_config.yml           # Peak system connection
├── storage_config.yml        # Shared Drive and local paths
├── validation_rules.yml      # File validation rules
├── reporting_config.yml      # Report generation settings
└── .env                       # Environment variables (git-ignored)
```

### 2. Create .env File
Copy the following template and update with your values:

```env
# Peak System Configuration
PEAK_ENDPOINT=https://peak-api.example.com
PEAK_USERNAME=your_username
PEAK_PASSWORD=your_password
PEAK_API_VERSION=v1
PEAK_TIMEOUT=30

# Storage Configuration
SHARED_DRIVE_PATH=\\shared.drive\uwfiles
LOCAL_CACHE_PATH=data/cache

# Azure Configuration
AZURE_STORAGE_ACCOUNT=storageaccount
AZURE_STORAGE_ACCOUNT_KEY=your_key_here
AZURE_CONTAINER_NAME=accufile-reports

# Logging
LOG_LEVEL=INFO
LOG_DIR=logs

# Reporting
REPORT_OUTPUT_PATH=reports/
EMAIL_RECIPIENTS=operations@example.com
```

### 3. Create Configuration Files

#### peak_config.yml
```yaml
# Peak Insurance System Configuration

endpoint: "${PEAK_ENDPOINT}"
api_version: "${PEAK_API_VERSION}"
timeout: ${PEAK_TIMEOUT}

credentials:
  username: "${PEAK_USERNAME}"
  password: "${PEAK_PASSWORD}"

# Query parameters
query:
  # Include policies from last 90 days
  days_back: 90
  # Policy statuses to include
  statuses:
    - "active"
    - "pending"
  # Policy types to include (empty = all)
  policy_types: []
```

#### storage_config.yml
```yaml
# Storage System Configuration

shared_drive_path: "${SHARED_DRIVE_PATH}"
local_cache_path: "${LOCAL_CACHE_PATH}"

# File matching patterns
file_patterns:
  # Policy number patterns
  policy_number_patterns:
    - "^[A-Z]{2}-\\d{4}-\\d{6}$"      # AH-2024-001234
    - "^\\d{8,10}$"                    # 12345678
  
  # Directory naming patterns
  directory_patterns:
    - "[PolicyNumber]_[InsuredName]"
    - "[PolicyNumber]-[InsuredName]"
  
  # File extensions to include
  file_extensions:
    - ".pdf"
    - ".docx"
    - ".xlsx"
    - ".tif"
    - ".jpg"

# Similarity matching
similarity:
  min_threshold: 0.75  # Minimum similarity score
  algorithm: "levenshtein"
```

#### validation_rules.yml
```yaml
# File Validation Rules

# Policy type configurations
policy_types:
  commercial:
    name: "Commercial A&H"
    required_documents:
      - type: "application"
        description: "Insurance Application"
        required: true
      - type: "quote"
        description: "Quote/Binder"
        required: true
      - type: "policy"
        description: "Policy Document"
        required: true
      - type: "inspection"
        description: "Inspection Report"
        required: false
      - type: "medical"
        description: "Medical Records/Underwriting"
        required: false
    
    folder_structure:
      pattern: "[PolicyNumber]_[InsuredName]"
      max_depth: 3
      allowed_subfolders:
        - "Documents"
        - "Correspondence"
        - "Underwriting"
        - "Medical"
        - "Inspections"
    
    naming_conventions:
      file_pattern: "^[A-Za-z0-9\\-_\\.\\s]+\\.[a-z]{2,4}$"
      forbidden_chars: "<>:\"/\\|?*"
      max_filename_length: 255
      required_prefix: "[PolicyNumber]"

  individual:
    name: "Individual A&H"
    required_documents:
      - type: "application"
        description: "Insurance Application"
        required: true
      - type: "policy"
        description: "Policy Document"
        required: true
    
    folder_structure:
      pattern: "[PolicyNumber]_[InsuredName]"
      max_depth: 2
    
    naming_conventions:
      file_pattern: "^[A-Za-z0-9\\-_\\.\\s]+\\.[a-z]{2,4}$"

# Validation checks
validation_checks:
  # Document completeness
  documents:
    enabled: true
    check_type: "file_content"  # file_content, filename_pattern, folder_structure
    
  # Folder structure
  structure:
    enabled: true
    check_type: "folder_structure"
    
  # Naming conventions
  naming:
    enabled: true
    check_type: "filename_pattern"
    
  # Metadata
  metadata:
    enabled: true
    check_type: "metadata_tags"
    required_tags:
      - "policy_number"
      - "insured_name"
      - "effective_date"
      - "underwriter"

# Compliance levels
compliance_levels:
  pass:
    criteria: "All checks pass"
    action: "No action needed"
  
  warning:
    criteria: "1-2 checks fail, non-critical documents missing"
    action: "Review and determine if remediation needed"
  
  fail:
    criteria: ">2 checks fail or critical documents missing"
    action: "Remediation required before policy activation"
```

#### reporting_config.yml
```yaml
# Reporting Configuration

# Output paths
output_path: "${REPORT_OUTPUT_PATH}"
archive_path: "reports/archive"

# Report types to generate
report_formats:
  - type: "json"
    filename: "accufile_report_{timestamp}.json"
    enabled: true
    
  - type: "summary"
    filename: "accufile_summary_{timestamp}.txt"
    enabled: true
    
  - type: "issues"
    filename: "accufile_issues_{timestamp}.txt"
    enabled: true
    
  - type: "excel"
    filename: "accufile_report_{timestamp}.xlsx"
    enabled: false  # Enable when Excel support added

# Email distribution
email:
  enabled: true
  smtp_server: "smtp.office365.com"
  smtp_port: 587
  sender: "accufile@example.com"
  recipients: "${EMAIL_RECIPIENTS}"
  subject: "A&H AccuFile Daily Report - {date}"
  include_reports:
    - "summary"
    - "issues"

# Azure archival
azure_archive:
  enabled: true
  account: "${AZURE_STORAGE_ACCOUNT}"
  container: "${AZURE_CONTAINER_NAME}"
  retention_days: 30

# Report thresholds
thresholds:
  alert_missing_rate: 0.15      # Alert if >15% files missing
  alert_fail_rate: 0.5          # Alert if >50% files non-compliant
  alert_on_error: true          # Alert on any execution error

# Report recipients by role
recipients:
  operations_lead:
    email: "${OPERATIONS_LEAD_EMAIL}"
    reports:
      - "summary"
      - "issues"
    frequency: "daily"
  
  management:
    email: "${MANAGEMENT_EMAIL}"
    reports:
      - "summary"
    frequency: "weekly"
```

## Environment-Specific Configuration

### Development Environment
Create `config/.env.dev`:
```env
PEAK_ENDPOINT=https://peak-staging.example.com
SHARED_DRIVE_PATH=C:\Data\Sample_UW_Files
LOG_LEVEL=DEBUG
```

### Staging Environment
Create `config/.env.staging`:
```env
PEAK_ENDPOINT=https://peak-staging.example.com
SHARED_DRIVE_PATH=\\staging-share\uwfiles
LOG_LEVEL=INFO
```

### Production Environment
Create `config/.env.prod`:
```env
PEAK_ENDPOINT=https://peak-api.example.com
SHARED_DRIVE_PATH=\\shared.drive\uwfiles
LOG_LEVEL=INFO
```

## Validation Rules Customization

### Adding a New Policy Type

1. Add to `validation_rules.yml`:
```yaml
policy_types:
  group:
    name: "Group A&H"
    required_documents:
      - type: "group_application"
        description: "Group Insurance Application"
        required: true
      # ... more documents
```

2. Update your Peak connector to recognize new type
3. Test with sample files
4. Deploy in next run

### Adjusting Validation Strictness

**Less Strict** (for pilot phase):
```yaml
compliance_levels:
  fail:
    criteria: ">3 checks fail or critical documents missing"
```

**More Strict** (for production):
```yaml
compliance_levels:
  warning:
    criteria: "Any check fails"
```

## Scheduling Configuration

### Using Windows Task Scheduler
1. Create scheduled task to run:
```powershell
python -m src.main
```
2. Set schedule: Daily at 11:00 PM UTC
3. Set working directory to project root
4. Set user account to service account

### Using APScheduler (in-app)
Edit orchestrator initialization:
```python
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(
    orchestrator.run,
    'cron',
    hour=23,
    minute=0,
    timezone='UTC'
)
scheduler.start()
```

## Security Best Practices

1. **Never commit credentials** to Git
   - .env file is in .gitignore
   - Use environment variables

2. **Use Azure Managed Identity** when possible
   - Avoids storing connection strings

3. **Restrict file permissions**
   - Config directory: Read-only for service account
   - Reports directory: Read-write for service account
   - Shared Drive: Read-only for service account

4. **Rotate credentials** regularly
   - Change Peak credentials quarterly
   - Rotate Azure storage keys annually

5. **Audit logging**
   - Enable detailed logging
   - Archive logs for 1 year
   - Review logs monthly

## Troubleshooting Configuration

### Check Configuration
```bash
python -c "from src.utils.config_loader import ConfigLoader; c = ConfigLoader(); print(c.load_config())"
```

### Validate YAML
```bash
python -c "import yaml; yaml.safe_load(open('config/validation_rules.yml'))"
```

### Test Connections
```bash
python -m src.connectors.test_connectors
```

## Advanced Configuration

### Custom Validation Rules
Create custom validator:
```python
from src.validators.file_validator import FileValidator

class CustomValidator(FileValidator):
    def _check_custom_rule(self, file_info):
        # Your custom logic
        return validation_result
```

### Custom Report Format
```python
class CustomReportGenerator(ReportGeneratorAgent):
    def _generate_custom_report(self, results):
        # Your custom report logic
        pass
```

### Performance Tuning
```yaml
performance:
  parallel_workers: 4          # Number of parallel validation workers
  batch_size: 100              # Files per batch
  cache_policy_data: true      # Cache Peak data locally
  incremental_validation: true # Only validate changed files
```
