# Use Case & Requirements Documentation

## Executive Summary

A&H AccuFile is an agentic workflow system designed to automate the review and compliance assessment of Accident & Health underwriting files. The system performs nightly analysis of UW files to identify structural issues, missing documentation, and compliance violations, enabling the Operations team to prioritize cleanup efforts and prevent future issues.

## Problem Statement

### Current State
- **Timeframe**: A&H writing for ~3 years without proper document management
- **Team Structure**: Underwriters responsible for all placement tasks (no Operations support)
- **File Management**: Ad-hoc file structure on Shared Drive (no standardization)
- **Cleanup Progress**: Only 12% of ~3,500 files reviewed in 4 months
- **Projected Timeline**: At current pace, would take 33+ months to complete

### Key Challenges
1. **Scale**: ~3,500 files across thousands of policies
2. **Growth**: A&H experiencing aggressive growth (~50+ new policies/month)
3. **Backlog**: "Hole" getting larger every day as new files added
4. **Standards**: No consistent file structure or naming conventions
5. **Expertise**: Need for standardization to support eventual DMS migration

## Business Objectives

### Primary Goals
1. **Accelerate Cleanup**: Reduce manual review time from years to months
2. **Define Standards**: Establish consistent file structure and naming conventions
3. **Identify Gaps**: Locate missing documentation and files
4. **Enable Operations**: Provide clear actionable work for Operations team
5. **Risk Mitigation**: Ensure compliance before DMS migration

### Success Metrics
- 100% of files assessed within 30 days (vs. 4+ months manual)
- Clear prioritization of cleanup work
- <5% false positives in missing file detection
- 95%+ accuracy in structure compliance detection
- Enable smooth DMS migration in early 2027

## Proposed Solution

### Solution Overview
**Nightly Agentic Workflow** that:
1. Scans Peak for complete policy list
2. Matches files from Shared Drive to policies
3. Validates file structure and document completeness
4. Generates daily analysis reports for Operations

### Workflow Steps

#### Step 1: Policy Retrieval (Peak Agent)
- **Input**: None
- **Process**: Query Peak system for all written policies
- **Output**: List of policies with metadata
  - Policy Number
  - Insured Name
  - Policy Type
  - Effective Date
  - Premium
- **Assumptions**:
  - Peak API accessible nightly
  - Complete and accurate policy data
  - Support for large result sets (3,000+)

#### Step 2: File Matching (File Matcher Agent)
- **Input**: List of policies from Step 1
- **Process**: Scan Shared Drive to find files matching policies
- **Matching Strategy**:
  - Primary: Policy number in filename or folder name
  - Secondary: Policy number in full path
  - Tertiary: Insured name similarity matching
- **Output**:
  - Matched files (with confidence scores)
  - Missing files (no match found)
- **Expected Results**:
  - ~90-95% of policies have matching files
  - ~5-10% missing (new policies, incomplete uploads, etc.)

#### Step 3: File Validation (Validator Agent)
- **Input**: Matched files
- **Process**: Validate each file against compliance rules
- **Validation Checks**:
  1. **Document Completeness** - All required documents present
  2. **Folder Structure** - Correct naming and hierarchy
  3. **Naming Conventions** - Consistent file/folder naming
  4. **Metadata** - Required tags and properties
- **Output**: Detailed validation results
  - Compliance status (pass/fail)
  - Missing documents
  - Structure violations
  - Naming issues
- **Expected Results**:
  - ~60-70% pass all validations (fully compliant)
  - ~30-40% have issues requiring remediation
  - Average 2-3 issues per non-compliant file

#### Step 4: Report Generation (Report Generator)
- **Input**: All analysis results
- **Process**: Create actionable reports for Operations
- **Output Formats**:
  1. **JSON Report** (detailed data)
     - Full results with all details
     - Suitable for programmatic processing
     - Archived for audit trail
  
  2. **Summary Report** (executive view)
     - Key metrics and statistics
     - High-level compliance status
     - Trend analysis
  
  3. **Issues Report** (action items)
     - Top missing files (by priority)
     - Non-compliant files grouped by issue type
     - Suggested remediation steps
- **Distribution**:
  - Email to Operations team
  - Archive to Azure Blob Storage
  - Dashboard/Portal access (future)

## Target Users

### Primary User: Operations Team
- **Role**: UA Lead and Operations Specialists
- **Needs**:
  - Daily compliance status
  - Prioritized list of issues to address
  - Clear action items
  - Trend analysis over time
  
### Secondary Users
- **Underwriters**: Need remediation instructions
- **Management**: Executive dashboards and metrics

## Requirements

### Functional Requirements

#### FR1: Policy Retrieval
- Retrieve all policies from Peak system nightly
- Support filtering by date range (for incremental runs)
- Include all relevant policy metadata
- Handle policies from previous 90 days

#### FR2: File Matching
- Scan entire Shared Drive for files
- Match files to policies using multiple pattern strategies
- Calculate and report match confidence scores
- Identify files with no matching policy
- Handle renamed/moved files (cache-based matching)

#### FR3: File Validation
- Check for required documents by policy type
- Validate folder structure against standards
- Verify file/folder naming conventions
- Validate file metadata and tags
- Support custom validation rules per policy type

#### FR4: Report Generation
- Generate comprehensive JSON report
- Create executive summary report
- Generate detailed issues report
- Archive reports for audit trail
- Support email distribution to stakeholders

#### FR5: Workflow Orchestration
- Execute steps in correct sequence
- Handle errors gracefully (step failure → continue)
- Aggregate results from all steps
- Generate execution summary

#### FR6: Data Integration
- Connect to Peak system
- Read from Shared Drive
- Upload reports to Azure Blob Storage (staging)

### Non-Functional Requirements

#### NFR1: Performance
- Process 3,500+ files in <4 hours (nightly window)
- Complete policy retrieval in <30 minutes
- File validation speed: >500 files/hour
- Memory usage: <2GB for full dataset

#### NFR2: Reliability
- Nightly execution success rate: >95%
- Automatic retry for transient failures
- Graceful error handling
- Execution logs for troubleshooting

#### NFR3: Security
- Secure credential storage (environment variables)
- Audit logging of all operations
- Data privacy for PII in files
- Role-based access to reports

#### NFR4: Maintainability
- Well-documented code
- Modular architecture for easy enhancements
- Configuration-driven behavior
- Easy to update validation rules

#### NFR5: Scalability
- Support for future growth (5,000+ policies)
- Incremental processing capability
- Parallel processing support
- Cloud-ready architecture

#### NFR6: Availability
- Schedule nightly execution (11 PM UTC default)
- Support for on-demand execution
- Redundancy for critical connectors
- Monitoring and alerting

## Data Model

### Policy (from Peak)
```json
{
  "policy_number": "AH-2024-001234",
  "insured_name": "Acme Corporation",
  "policy_type": "commercial",
  "effective_date": "2024-01-01",
  "premium": 15000.00,
  "status": "active"
}
```

### File Match Result
```json
{
  "policy_number": "AH-2024-001234",
  "matched": true,
  "file_path": "\\shared.drive\uwfiles\AH-2024-001234_Acme_Corp\",
  "match_confidence": 0.95,
  "match_method": "policy_number_directory"
}
```

### Validation Result
```json
{
  "policy_number": "AH-2024-001234",
  "is_compliant": false,
  "checks": {
    "required_documents": false,
    "folder_structure": true,
    "naming_conventions": true,
    "metadata": false
  },
  "missing_documents": ["Medical Records", "Inspection Report"],
  "issues": [
    "Folder structure does not match standard",
    "Missing metadata tags: 'underwriter', 'effective_date'"
  ]
}
```

## Implementation Phases

### Phase 1: Development & Testing (Apr-May 2026)
- Build core agents and connectors
- Implement validation logic
- Create report generation
- Comprehensive testing
- Documentation

### Phase 2: Pilot (Jun 2026)
- Deploy to staging environment
- Test with 10% of file set (~350 files)
- Validate accuracy and performance
- Gather feedback from Operations
- Adjust validation rules as needed

### Phase 3: Production Rollout (Jul-Aug 2026)
- Deploy to production environment
- Begin nightly execution
- Start daily report delivery to Operations
- Monitor execution and adjust
- Support Operations cleanup efforts

### Phase 4: Continuous Improvement (Sep 2026-Jan 2027)
- Enhance validation rules based on findings
- Add new policy types and requirements
- Implement machine learning for classification
- Prepare for DMS migration
- Support Operations in achieving 100% cleanup

## Testing Approach

### Test Data
- Sample policies from Peak (staging)
- Sample files from Shared Drive
- Mock validation scenarios
- Edge cases (special characters, missing metadata)

### Test Categories
1. **Unit Tests**: Individual components
2. **Integration Tests**: End-to-end workflow
3. **Performance Tests**: Scale and speed
4. **Accuracy Tests**: Validation correctness

### Success Criteria
- 100% of validation rules pass unit tests
- End-to-end workflow completes in <4 hours
- Report accuracy: >95% for structure/documents
- No critical errors in 30-day production run

## Risk Management

### Key Risks

#### Risk 1: Peak System Unavailability
- **Impact**: Workflow cannot execute
- **Mitigation**: 
  - Use cached policy data from previous run
  - Retry with exponential backoff
  - Alert Operations team

#### Risk 2: Shared Drive Unavailability
- **Impact**: Cannot assess files
- **Mitigation**:
  - Test connectivity before execution
  - Use local cache when possible
  - Report partial results

#### Risk 3: Incorrect Validation Rules
- **Impact**: False positives/negatives
- **Mitigation**:
  - Pilot with Operations validation
  - Adjust rules based on feedback
  - Manual spot-checking

#### Risk 4: Performance Degradation
- **Impact**: Workflow exceeds 4-hour window
- **Mitigation**:
  - Performance testing during development
  - Implement parallel processing
  - Optimize algorithms

#### Risk 5: Security/Compliance
- **Impact**: Credential exposure, audit issues
- **Mitigation**:
  - Use environment variables for secrets
  - Comprehensive audit logging
  - Security review before production

## Success Factors

1. **Clear Operations Engagement**: Operations team involved from start
2. **Accurate Validation Rules**: Work with Operations to define standards
3. **Reliable Execution**: Nightly runs must be dependable
4. **Actionable Reports**: Easy for Operations to identify next steps
5. **Continuous Improvement**: Feedback loop with Operations

## Expected Outcomes

### Short Term (Phase 2-3)
- Complete assessment of all files within 30 days
- Clear prioritization of cleanup work for Operations
- Identification of missing files (~5-10%)
- Identification of structural issues (~30-40% of files)

### Medium Term (Phase 3-4)
- Operations completes 50%+ of cleanup in 2 months
- Validation rules refined and validated
- Machine learning classification implemented
- Daily compliance dashboard for stakeholders

### Long Term (Early 2027)
- 100% file cleanup complete
- All files ready for DMS migration
- Standardized file structure across all A&H business
- Prevention system in place for new files
