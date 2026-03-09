# Aivory Super Admin Test Suite

## Overview
Comprehensive automated testing suite for Aivory platform using Playwright for end-to-end testing.

## Setup

### 1. Install Dependencies
```bash
cd tests
pip install -r requirements.txt
playwright install chromium
```

### 2. Start Aivory Services
```bash
# Terminal 1: Start backend
cd ~/Documents/Aivory
python3 app/main.py

# Terminal 2: Start frontend
python3 simple_server.py
```

### 3. Run Tests

#### Run Full Test Suite
```bash
python test_super_admin_suite.py
```

#### Run with Headless Mode (for CI/CD)
Edit `test_super_admin_suite.py` and change:
```python
browser = await p.chromium.launch(headless=True)
```

## Test Coverage

### 1. Authentication & Access Control
- ✅ Super Admin login
- ✅ Dashboard section access
- ✅ Tier-based restrictions

### 2. Free AI Diagnostic
- ✅ 12-question flow
- ✅ Structured JSON output
- ✅ Score calculation

### 3. $15 AI Snapshot
- ✅ 30-question deep analysis
- ✅ Maturity scoring
- ✅ System recommendations

### 4. $79 AI Blueprint
- ✅ Full architecture generation
- ✅ Governance mapping
- ✅ Deployment planning

### 5. Subscription Tiers
- ✅ Foundation ($29/mo)
- ✅ Pro ($149/mo)
- ✅ Enterprise ($499/mo)

### 6. ROI Engine
- ✅ Conservative mode
- ✅ Growth mode
- ✅ Deterministic calculations

### 7. Multi-Turn Diagnostic
- ✅ 3-5 round flow
- ✅ Adaptive questions
- ✅ Structured output

### 8. UI/UX Validation
- ✅ Color consistency
- ✅ Minimal design
- ✅ Brand compliance

## Test Reports

Test reports are automatically generated in JSON format:
```
test_report_YYYYMMDD_HHMMSS.json
```

### Report Structure
```json
{
  "test_suite": "Super Admin Full Feature Test",
  "start_time": "2025-02-24T10:00:00",
  "end_time": "2025-02-24T10:15:00",
  "summary": {
    "total_tests": 30,
    "passed": 28,
    "failed": 2,
    "pass_rate": "93.3%"
  },
  "results": [...]
}
```

## Manual Testing

For manual testing, use the comprehensive guide:
```
SUPER_ADMIN_TEST_GUIDE.md
```

## Credentials

**Super Admin Account:**
- Username: `GrandMasterRCH`
- Password: `Lemonandsalt66633`

## Troubleshooting

### Tests Fail to Start
- Ensure backend is running on port 8081
- Ensure frontend is running on port 8080
- Check that Playwright is installed: `playwright install`

### Authentication Fails
- Verify credentials in CONFIG
- Check if login page exists at `/login.html`
- Verify backend authentication endpoint

### Element Not Found Errors
- Update selectors in test functions
- Check if UI structure has changed
- Verify page load timing (increase wait_for_timeout if needed)

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Aivory E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          pip install -r tests/requirements.txt
          playwright install chromium
      - name: Start services
        run: |
          python3 app/main.py &
          python3 simple_server.py &
          sleep 10
      - name: Run tests
        run: python tests/test_super_admin_suite.py
      - name: Upload test report
        uses: actions/upload-artifact@v2
        with:
          name: test-report
          path: test_report_*.json
```

## Contributing

When adding new tests:
1. Follow existing test function naming: `test_<feature>_<scenario>`
2. Add results to report using `report.add_result()`
3. Include descriptive print statements
4. Update this README with new test coverage

## Support

For issues or questions:
- Check existing test reports for patterns
- Review SUPER_ADMIN_TEST_GUIDE.md for expected behavior
- Verify against pricing-funnel-update spec
