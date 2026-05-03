# Testing Guide

Comprehensive guide to testing the A&H AccuFile system.

## Test Structure

```
tests/
├── conftest.py              # Pytest configuration and fixtures
├── test_orchestrator.py     # Orchestrator tests
├── test_helpers.py          # Utility function tests
├── test_file_matcher.py     # File matching tests
├── test_validators.py       # Validation tests
├── test_connectors.py       # Connector tests (future)
├── test_agents/             # Agent-specific tests (future)
└── test_integration/        # End-to-end integration tests (future)
```

## Running Tests

### Install Testing Dependencies
```bash
pip install pytest pytest-cov pytest-mock pytest-asyncio
```

### Run All Tests
```bash
pytest tests/ -v
```

### Run Specific Test File
```bash
pytest tests/test_helpers.py -v
```

### Run Specific Test
```bash
pytest tests/test_helpers.py::TestHelpers::test_sanitize_filename -v
```

### Run with Coverage Report
```bash
pytest tests/ --cov=src --cov-report=html
# Coverage report will be in htmlcov/index.html
```

### Run with Markers
```bash
# Run only fast tests
pytest tests/ -m "not slow" -v

# Run only integration tests
pytest tests/ -m "integration" -v
```

## Test Organization

### Fixtures
Fixtures are defined in `conftest.py`:

- `sample_policy` - Single policy object
- `sample_policies` - Multiple policy objects
- `sample_file_info` - File information object
- `config` - Test configuration dictionary

Example usage:
```python
def test_something(sample_policy, config):
    # sample_policy and config automatically injected
    assert sample_policy["policy_number"] == "AH-2024-001234"
```

### Test Categories

#### Unit Tests
- Test individual functions and methods
- Use mocking for external dependencies
- Fast execution (<1 second per test)

```python
def test_sanitize_filename():
    result = sanitize_filename("file<name>.txt")
    assert result == "file_name_.txt"
```

#### Integration Tests
- Test multiple components together
- Can use real file system (limited)
- Moderate execution speed (1-10 seconds)

```python
def test_orchestrator_workflow(config):
    orchestrator = FileReviewOrchestrator(config)
    results = orchestrator.run()
    assert results is not None
```

#### Performance Tests
- Test performance characteristics
- May take longer to execute
- Mark with `@pytest.mark.slow`

```python
@pytest.mark.slow
def test_large_file_set_matching():
    # Test with 10,000 files
    pass
```

## Mock External Services

### Mock Peak System
```python
from unittest.mock import Mock, patch

@patch('src.agents.peak_agent.PeakAgent.get_all_policies')
def test_orchestrator_with_peak(mock_peak, config):
    mock_peak.return_value = [
        {"policy_number": "POL001", "insured_name": "Test Co"}
    ]
    
    orchestrator = FileReviewOrchestrator(config)
    results = orchestrator.run()
    
    assert results["step_1_policies_retrieved"] == 1
```

### Mock File System
```python
from pathlib import Path
from unittest.mock import MagicMock

def test_file_listing(config):
    agent = FileMatcherAgent(config["storage"])
    
    # Mock file listing
    mock_files = [
        {"filename": "POL001_Test.pdf", "parent_dir": "UW"}
    ]
    
    agent._scan_shared_drive = MagicMock(return_value=mock_files)
    
    result = agent._find_policy_file(
        {"policy_number": "POL001"},
        mock_files
    )
    
    assert result is not None
```

## Coverage Goals

### Target Coverage
- Overall: >80%
- Core modules: >90%
- Utilities: >95%
- Connectors: >70% (mocked)

### Generate Coverage Report
```bash
pytest tests/ --cov=src --cov-report=html --cov-report=term-missing

# View in browser
start htmlcov/index.html
```

## Writing Tests

### Test Structure (AAA Pattern)
```python
def test_something():
    # Arrange - setup test data
    input_data = {"key": "value"}
    
    # Act - perform the action
    result = some_function(input_data)
    
    # Assert - verify the result
    assert result is not None
    assert result["key"] == "value"
```

### Best Practices
1. **One assertion per test** (preferred)
   ```python
   def test_sanitize_removes_angle_brackets():
       result = sanitize_filename("file<name>.txt")
       assert result == "file_name_.txt"
   ```

2. **Descriptive test names**
   ```python
   # Good
   def test_sanitize_filename_removes_forbidden_characters():
       pass
   
   # Bad
   def test_sanitize():
       pass
   ```

3. **Use fixtures for setup**
   ```python
   def test_orchestrator(config):  # config fixture injected
       orchestrator = FileReviewOrchestrator(config)
       assert orchestrator is not None
   ```

4. **Mock external dependencies**
   ```python
   @patch('external_module.function')
   def test_with_mock(mock_func):
       mock_func.return_value = "mocked_result"
       result = my_function()
       assert result == "expected"
   ```

5. **Test error conditions**
   ```python
   def test_handles_invalid_input():
       with pytest.raises(ValueError):
           my_function(None)
   ```

## Continuous Integration

### GitHub Actions Example
Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    strategy:
      matrix:
        python-version: ['3.11', '3.12']
    
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run tests
        run: pytest tests/ --cov=src --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Scenarios

### Scenario 1: Happy Path
- Peak has 100 policies
- 90 files matched on Shared Drive
- 80 files pass validation
- Reports generated successfully

```python
def test_happy_path(config):
    policies = [{"policy_number": f"POL{i:03d}"} for i in range(100)]
    matched = [{"policy_number": f"POL{i:03d}"} for i in range(90)]
    missing = [{"policy_number": f"POL{i:03d}"} for i in range(90, 100)]
    valid = {f"POL{i:03d}": {"is_compliant": True} for i in range(80)}
    
    orchestrator = FileReviewOrchestrator(config)
    summary = orchestrator._build_summary(policies, matched, missing, valid)
    
    assert summary["total_policies"] == 100
    assert summary["match_rate_percent"] == 90.0
```

### Scenario 2: Peak Unavailable
- Graceful fallback to cached data
- Error logged appropriately
- Execution continues with previous policy list

```python
@patch('src.agents.peak_agent.PeakAgent.get_all_policies')
def test_peak_unavailable(mock_peak, config):
    mock_peak.side_effect = ConnectionError("Peak unavailable")
    
    orchestrator = FileReviewOrchestrator(config)
    
    with pytest.raises(ConnectionError):
        orchestrator.run()
```

### Scenario 3: No Files Match
- All files reported as missing
- Report accurately reflects status
- Operations alerted to investigate

```python
def test_no_file_matches(config):
    policies = [{"policy_number": "POL001"}]
    matched = []
    missing = [{"policy_number": "POL001"}]
    
    orchestrator = FileReviewOrchestrator(config)
    summary = orchestrator._build_summary(policies, matched, missing, {})
    
    assert summary["match_rate_percent"] == 0.0
    assert summary["missing_files"] == 1
```

### Scenario 4: Validation Failures
- Multiple validation failures detected
- Issues clearly identified
- Remediation recommendations provided

```python
def test_validation_failures(config):
    file_info = {"policy_number": "POL001"}
    validation_results = {
        "POL001": {
            "is_compliant": False,
            "missing_documents": ["Application", "Medical Records"],
            "issues": ["Invalid folder structure"]
        }
    }
    
    summary = {k: v for k, v in validation_results.items()}
    non_compliant = sum(1 for v in summary.values() if not v.get("is_compliant"))
    
    assert non_compliant == 1
```

## Debugging Tests

### Run Single Test with Debugger
```bash
python -m pdb -m pytest tests/test_helpers.py::TestHelpers::test_sanitize_filename -v
```

### Print Debug Information
```python
def test_something(sample_policy):
    print(f"Policy: {sample_policy}")
    result = process(sample_policy)
    assert result is not None
```

Run with output:
```bash
pytest tests/ -s -v  # -s shows print output
```

### Inspect Test Objects
```python
def test_inspect(sample_policies):
    import json
    print(json.dumps(sample_policies, indent=2))
```

## Performance Testing

### Benchmark File Matching
```python
@pytest.mark.slow
def test_large_dataset_performance(config):
    import time
    
    # Create 10,000 policies
    policies = [{"policy_number": f"POL{i:06d}"} for i in range(10000)]
    files = [{"filename": f"POL{i:06d}.pdf"} for i in range(7500)]
    
    agent = FileMatcherAgent(config["storage"])
    
    start = time.time()
    matched, missing = agent.match_files_to_policies(policies)
    elapsed = time.time() - start
    
    assert elapsed < 60  # Should complete in <1 minute
    assert len(matched) == 7500
```

## Test Maintenance

### Keep Tests Current
- Update when code changes
- Review for brittleness
- Update mocks when interfaces change

### Common Issues
- **Flaky tests**: Tests that fail intermittently
  - Often due to timing or randomness
  - Use `pytest.mark.flaky(reruns=3)` temporarily
  
- **Slow tests**: Tests taking >10 seconds
  - Mark with `@pytest.mark.slow`
  - Consider mocking external calls

- **False negatives**: Tests passing when they shouldn't
  - Review test logic
  - Add additional assertions

## Test Templates

### Test for New Function
```python
def test_new_function():
    """Description of what's being tested"""
    # Arrange
    input_value = "test"
    
    # Act
    result = new_function(input_value)
    
    # Assert
    assert result is not None
    assert isinstance(result, str)
```

### Test Error Handling
```python
def test_new_function_handles_error():
    """Verify proper error handling"""
    with pytest.raises(ValueError):
        new_function(None)
```

### Test with Fixture
```python
def test_with_sample_data(sample_policy):
    """Use injected test data"""
    result = process_policy(sample_policy)
    assert result is not None
```

See `tests/` directory for complete examples!
