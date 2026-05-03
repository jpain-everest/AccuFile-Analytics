# Quick Start Guide

Get the A&H AccuFile system up and running in your development environment.

## Prerequisites

- Python 3.11+
- Git
- Windows (for Shared Drive access) or access to Shared Drive via SMB
- Access to Peak staging/development environment

## Development Setup (5 minutes)

### 1. Clone or Download the Project
```bash
cd c:\Users\jpain\A-H-AccuFile
```

### 2. Create Python Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Configuration
```bash
# Copy template files
copy config\example.env config\.env
copy config\peak_config.yml config\
copy config\storage_config.yml config\
copy config\validation_rules.yml config\
copy config\reporting_config.yml config\
```

### 5. Update .env File
Edit `config\.env` with your settings:
```env
PEAK_ENDPOINT=https://peak-staging.example.com
PEAK_USERNAME=your_username
PEAK_PASSWORD=your_password
SHARED_DRIVE_PATH=C:\Data\Sample_UW_Files  # For testing
LOCAL_CACHE_PATH=data/cache
LOG_LEVEL=DEBUG
```

### 6. Create Sample Data Directory
```bash
mkdir data\sample_files
# Copy some sample UW files here for testing
```

## Run Your First Workflow

### Execute Full Workflow
```bash
python -m src.main
```

### Expected Output
```
================================================================================
A&H AccuFile Workflow Started - 2024-01-15T10:30:45.123456
================================================================================
INFO: Configuration loaded from: config
INFO: Starting file review workflow...
Step 1: Retrieving policies from Peak system...
✓ Retrieved X policies from Peak
Step 2: Matching files from Shared Drive to policies...
✓ Matched X files, Y missing
Step 3: Validating file structure and completeness...
✓ Validation complete - X files assessed
Step 4: Generating analysis reports...
✓ Reports generated and saved
================================================================================
A&H AccuFile Workflow Completed - 2024-01-15T10:35:22.654321
================================================================================
```

### Check Reports
Reports are generated in the `reports/` directory:
- `accufile_report_YYYYMMDD_HHMMSS.json` - Detailed JSON data
- `accufile_summary_YYYYMMDD_HHMMSS.txt` - Executive summary
- `accufile_issues_YYYYMMDD_HHMMSS.txt` - Issues and action items

## Run Individual Agents

### Test Peak Agent
```bash
python -c "from src.agents.peak_agent import PeakAgent; from src.utils.config_loader import ConfigLoader; config = ConfigLoader().load_config(); agent = PeakAgent(config['peak']); print('Peak Agent initialized successfully')"
```

### Test File Matcher
```bash
python -c "from src.agents.file_matcher import FileMatcherAgent; from src.utils.config_loader import ConfigLoader; config = ConfigLoader().load_config(); agent = FileMatcherAgent(config['storage']); print('File Matcher initialized successfully')"
```

### Test Validator
```bash
python -c "from src.agents.validator_agent import ValidatorAgent; from src.utils.config_loader import ConfigLoader; config = ConfigLoader().load_config(); agent = ValidatorAgent(config['validation']); print('Validator initialized successfully')"
```

## Run Tests

```bash
# Install test dependencies
pip install pytest pytest-cov pytest-mock

# Run all tests
pytest tests/ -v

# Run with coverage report
pytest tests/ --cov=src --cov-report=html

# Run specific test file
pytest tests/test_helpers.py -v
```

## Code Quality Checks

### Format Code
```bash
black src/
```

### Check Style
```bash
flake8 src/ --max-line-length=100
```

### Type Checking
```bash
mypy src/
```

## Project Structure Overview

```
A-H-AccuFile/
├── src/                    # Source code
│   ├── agents/            # Workflow orchestrators
│   ├── connectors/        # External system connections
│   ├── validators/        # Validation logic
│   ├── utils/            # Helper functions
│   └── main.py           # Entry point
│
├── config/               # Configuration files
│   ├── peak_config.yml
│   ├── storage_config.yml
│   ├── validation_rules.yml
│   ├── reporting_config.yml
│   ├── example.env      # Template
│   └── .env             # Your local settings (git-ignored)
│
├── tests/               # Test suite
│   ├── conftest.py
│   ├── test_*.py
│   └── README.md
│
├── data/               # Data directory
│   ├── cache/         # Local cache
│   ├── sample_files/  # Test data
│   └── schemas/       # Data schemas
│
├── logs/              # Application logs
│   ├── accufile.log
│   └── accufile_error.log
│
├── reports/           # Generated reports
│   └── archive/
│
├── docs/              # Documentation
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── USE_CASE.md
│   └── IMPLEMENTATION_ROADMAP.md
│
└── pyproject.toml    # Project configuration
```

## Common Development Tasks

### Add New Policy Type
1. Edit `config/validation_rules.yml`
2. Add policy type under `policy_types:`
3. Define required documents
4. Define folder structure
5. Test with sample files

### Adjust Validation Rules
1. Edit `config/validation_rules.yml`
2. Modify `validation_checks:` section
3. Test with `pytest`
4. Run workflow to validate

### Add New Validation Check
1. Edit `src/validators/file_validator.py`
2. Add method `_check_new_rule()`
3. Add to validation checks list
4. Write unit tests
5. Update configuration

### Debug Workflow Execution
1. Set `LOG_LEVEL=DEBUG` in `.env`
2. Add breakpoints in code
3. Run with debugger:
   ```bash
   python -m pdb -m src.main
   ```
4. Check logs in `logs/` directory

## Troubleshooting

### "Configuration file not found"
- Check that `config/.env` exists
- Verify file paths in `.env` are correct
- Run: `python -c "from src.utils.config_loader import ConfigLoader; ConfigLoader().load_config()"`

### "Cannot connect to Shared Drive"
- Verify SMB path is correct
- Check network connectivity
- Run: `net use \\shared.drive`

### "No policies retrieved from Peak"
- Check Peak credentials in `.env`
- Verify Peak endpoint URL
- Check Peak system is accessible
- Review logs for detailed errors

### "Reports not generated"
- Check `reports/` directory permissions
- Verify disk space available
- Review `logs/accufile_error.log` for errors

### Tests failing
- Ensure pytest is installed: `pip install pytest`
- Run from project root: `pytest tests/`
- Check test configuration in `tests/conftest.py`

## Next Steps

1. **Review Documentation**
   - Read [ARCHITECTURE.md](ARCHITECTURE.md)
   - Read [USE_CASE.md](USE_CASE.md)

2. **Explore the Code**
   - Start with `src/main.py`
   - Understand workflow in `src/agents/orchestrator.py`
   - Review configuration loading

3. **Customize for Your Environment**
   - Update Peak endpoint and credentials
   - Configure Shared Drive path
   - Adjust validation rules

4. **Get Involved**
   - Review validation rules with Operations
   - Collect sample files for testing
   - Schedule implementation kickoff

## Support

For questions or issues:
1. Check [troubleshooting guide](ARCHITECTURE.md#troubleshooting)
2. Review documentation in `docs/`
3. Contact project lead
4. File issue with logs attached

Happy coding! 🚀
