# A&H AccuFile - Agentic Workflow for UW File Review

## Overview
A&H AccuFile is an agentic workflow automation system designed to streamline and standardize Accident & Health (A&H) Underwriting file review and compliance. The system performs nightly analysis of underwriting files against Peak policy records, assesses file completeness and structure, and identifies missing documentation.

## Problem Statement
The Accident & Health underwriting team has been writing business for ~3 years without:
- A proper Document Management System (DMS)
- A dedicated Operations team
- A mandated file structure

Currently:
- ~3,500 underwriting files stored on Shared Drive with inconsistent naming and structure
- Manual file review has completed only 12% of files in 4 months
- No clear assessment of file completeness or structure compliance
- Daily growth in backlog due to aggressive A&H growth targets

## Proposed Solution
Automated nightly workflow that:
1. **Scans Peak** to retrieve all written policies
2. **Matches files** on Shared Drive to policies (identifies missing files ~5-10%)
     - Rules for documentation 
     - Folder/File Structure
     - apply fuzzy logic
3. **Assesses completeness** (expected 30-40% fail this step)
     - Content review inside the folders and files
     - Business rules match for contents
     - Prepare evaluation result
4. **Reports missing documents** and structural issues
     - Publish real-time Dashboard from evaluation/audit
     - Support real-time query on the evaluation 
     - Show score/confidence on each evaluation parameter
     - Multi-channel Rules based report distribution capability
     - Report scheduling and distribution


## Key Benefits
- **Compliance**: Ensure consistent file structure across all UW files
- **Efficiency**: Replace manual 4-month 12% completion with automated scanning
- **Risk Mitigation**: Identify missing documentation before policy issuance
- **DMS Readiness**: Clean, standardized files for smooth 2027 DMS migration

## Target Users
- Operations team (UA Lead)

## Architecture Components

### Core Modules
- **Agents** - Orchestration logic for workflow steps
- **Connectors** - Integration with Peak system and Shared Drive
- **Validators** - File structure and completeness validation
- **Utils** - Helper functions and logging

### Data Flow
```
Peak System → Policy Retrieval Agent
     ↓
Pattern Matching Agent (Shared Drive Scan)
     ↓
File Assessment Agent
     ↓
Validation Engine
     ↓
Report Generation & Storage
     ↓
Operations Dashboard/Email
```

## Project Structure
```
A-H-AccuFile/
├── backend/                      # Python FastAPI backend
│   ├── web_app.py                # FastAPI application entry point
│   ├── requirements.txt          # Python dependencies
│   ├── pyproject.toml            # Python project configuration
│   ├── config/                   # Configuration files
│   ├── src/                      # Source code
│   │   ├── agents/               # Agentic workflow orchestrators
│   │   ├── connectors/           # Peak, Shared Drive, Azure connectors
│   │   ├── validators/           # File validation rules
│   │   └── utils/                # Utility functions
│   ├── tests/                    # Unit and integration tests
│   ├── data/                     # Sample data and schemas
│   ├── logs/                     # Runtime logs
│   └── reports/                  # Generated reports
├── frontend/                     # React frontend
│   ├── package.json              # Node.js dependencies
│   ├── public/                   # Static assets
│   └── src/                      # React source code
├── docs/                         # Documentation
└── README.md                     # This file
```

## Getting Started

### Prerequisites
- Python 3.11+
- Access to Peak system credentials
- Azure Blob Storage access
- Shared Drive mount/connectivity

### Installation
```bash
# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration
1. Copy `config/example.env` to `config/.env`
2. Update with Peak credentials, storage paths, and Azure settings
3. Configure validation rules in `config/validation_rules.yml`

### Running the Workflow
```bash
# Start the backend (FastAPI)
cd backend
python web_app.py
# API available at http://localhost:5000
# Swagger docs at http://localhost:5000/docs

# Start the frontend (React) in a separate terminal
cd frontend
npm start
# UI available at http://localhost:3000

# Run CLI workflow directly
cd backend
python -m src.main

# Run tests
cd backend
pytest tests/
```

## Configuration Files

### Peak Connector (`config/peak_config.yml`)
- Peak API endpoint
- Credentials and authentication
- Query parameters

### Shared Drive Connector (`config/storage_config.yml`)
- Shared Drive paths
- File naming patterns
- Expected document types

### Validation Rules (`config/validation_rules.yml`)
- Required documents by policy type
- Folder structure standards
- File naming conventions
- Document type specifications

## Validation Logic

### File Completeness
Expected documents:
- Binder/Quote
- Application
- Medical Records (if required)
- Inspections (if required)
- Policy Document
- Endorsements (if applicable)

### Structure Standards
- Consistent folder naming: `[PolicyNumber]_[InsuredName]`
- Document classification folders
- Standardized file naming conventions
- Metadata tracking

## Data Sources & Testing
- **Peak System**: Live policy database (production)
- **Shared Drive**: File source (current)
- **Azure Blob Storage**: Staging area for analysis and archive
- **Sample Data**: `data/sample_files/` for testing

## Timeline & Milestones
- **Phase 1** (Apr-May 2026): Development & testing
- **Phase 2** (Jun 2026): Pilot with limited file set
- **Phase 3** (Jul-Aug 2026): Full production rollout
- **Phase 4** (Sep 2026-Jan 2027): Continuous improvement & DMS prep

## Reporting

### Daily Report Contents
- Files processed: X
- Files matched: Y (Z%)
- Missing files: N (%)
- Incomplete files: M (%)
- Structure violations: K (%)
- Detailed findings by issue type

### Report Destinations
- Excel export for Operations review
- Email distribution to UA Lead
- Dashboard/Portal view (future)

## DMS Migration Readiness
- Standardized file structure
- Complete metadata tagging
- Missing document identification
- Compliance audit trail

## Support & Maintenance
- Scheduled nightly runs (11 PM UTC)
- Daily Operations report delivery
- Monthly validation rule updates
- Quarterly performance metrics review

## Future Enhancements
- Machine learning for document classification
- OCR for content validation
- Real-time compliance dashboard
- Predictive issue identification
- Auto-remediation for common issues

## License
Internal use only

## Contact
Operations Team (UA Lead)
