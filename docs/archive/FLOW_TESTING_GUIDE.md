# Flow Testing Guide - Three Separate Diagnostic Flows

## Deployment Status

✅ **Backend**: Updated and running on port 8081
✅ **Frontend JavaScript**: `app.js` deployed to XAMPP
✅ **Frontend HTML**: `index.html` deployed to XAMPP

## Testing URL

Open in browser: `http://localhost/aivory/frontend/index.html`

**IMPORTANT**: Use `Cmd + Shift + R` (Mac) to hard refresh and clear cache before testing!

## Test Flow 1: Free AI Readiness Diagnostic ($0)

### Expected Behavior
- Always available
- 12 questions
- No payment required
- Entry point for all users

### Test Steps

1. **Navigate to homepage**
   - URL: `http://localhost/aivory/frontend/index.html`
   - Should see: "Run Free AI Readiness Diagnostic" button

2. **Click "Run Free AI Readiness Diagnostic"**
   - Should navigate to free diagnostic section
   - Should see: "Question 1 of 12"
   - Should see: Progress bar at 0%

3. **Answer all 12 questions**
   - Click through each question
   - Select an option for each
   - Progress bar should update
   - "Next" button should enable after selecting option
   - "Previous" button should work
   - On question 12, "Submit" button should appear

4. **Submit free diagnostic**
   - Click "Submit Diagnostic"
   - Should see: Loading spinner with "Analyzing Your AI Readiness..."
   - Backend call: `POST http://localhost:8081/api/v1/diagnostic/run`

5. **View free diagnostic results**
   - Should see: Score (0-100)
   - Should see: Category (e.g., "AI-Ready", "AI-Curious")
   - Should see: Key Insights (list)
   - Should see: Recommendation (text)
   - Should see: Badge (SVG)
   - Should see: Upgrade options section with two cards:
     - "AI Snapshot - $15"
     - "AI System Blueprint - $99"

### Success Criteria
- ✅ All 12 questions display correctly
- ✅ Navigation works (Previous/Next)
- ✅ Submit calls correct endpoint
- ✅ Results display correctly
- ✅ Upgrade options appear after completion
- ✅ `freeDiagnosticCompleted` flag is set to `true`

---

## Test Flow 2: AI Snapshot ($15)

### Expected Behavior
- Locked until free diagnostic is completed
- Uses free diagnostic answers as input
- Calls `/api/v1/diagnostic/snapshot` endpoint
- Uses `kimi-k2-250905` model

### Test Steps

1. **Attempt to access before free diagnostic**
   - Click "Run AI Snapshot — $15" from homepage
   - Should see: Alert "Please complete the free AI readiness diagnostic first!"
   - Should redirect to free diagnostic

2. **Access after free diagnostic**
   - Complete free diagnostic first (see Flow 1)
   - From results page, click "Run AI Snapshot — $15"
   - Should navigate to snapshot loading section
   - Should see: "Generating Your AI Snapshot..."

3. **Backend processing**
   - Backend call: `POST http://localhost:8081/api/v1/diagnostic/snapshot`
   - Request body should include: `free_diagnostic_answers` (12 answers from free diagnostic)
   - Model used: `kimi-k2-250905`
   - Processing time: 5-10 seconds

4. **View snapshot results**
   - Should see: Readiness Score (0-100)
   - Should see: Summary (2-3 sentences)
   - Should see: Recommended Use Cases (3 items)
   - Should see: Priority Actions (3 items)
   - Should see: Upgrade CTA for Blueprint ($99)

### Success Criteria
- ✅ Locked until free diagnostic completed
- ✅ Uses free diagnostic answers (not new questions)
- ✅ Calls correct endpoint with correct model
- ✅ Results display correctly
- ✅ Upgrade CTA for Blueprint appears

---

## Test Flow 3: AI System Blueprint ($99)

### Expected Behavior
- Locked until free diagnostic is completed
- Uses free diagnostic answers as input
- Calls `/api/v1/diagnostic/blueprint` endpoint
- Uses `glm-4-7-251222` model

### Test Steps

1. **Attempt to access before free diagnostic**
   - Click "Generate AI Blueprint — $99" from homepage
   - Should see: Alert "Please complete the free AI readiness diagnostic first!"
   - Should redirect to free diagnostic

2. **Access after free diagnostic**
   - Complete free diagnostic first (see Flow 1)
   - From results page, click "Generate AI System Blueprint — $99"
   - Should navigate to blueprint loading section
   - Should see: "Generating Your AI System Blueprint..."

3. **Backend processing**
   - Backend call: `POST http://localhost:8081/api/v1/diagnostic/blueprint`
   - Request body should include: `free_diagnostic_answers` (12 answers from free diagnostic)
   - Model used: `glm-4-7-251222`
   - Processing time: 10-15 seconds

4. **View blueprint results**
   - Should see: System Recommendation (name, description, confidence level)
   - Should see: Workflow Architecture (triggers, steps, tools)
   - Should see: Agent Structure (agent names, roles, responsibilities)
   - Should see: Expected ROI
   - Should see: Deployment Plan

### Success Criteria
- ✅ Locked until free diagnostic completed
- ✅ Uses free diagnostic answers (not new questions)
- ✅ Calls correct endpoint with correct model
- ✅ Results display correctly
- ✅ All sections render properly

---

## Browser Console Checks

Open browser console (F12 or Cmd+Option+I) and verify:

### After Free Diagnostic
```javascript
// Check state
console.log('Free diagnostic completed:', freeDiagnosticCompleted);  // Should be true
console.log('Free diagnostic answers:', freeDiagnosticAnswers);      // Should have 12 entries
console.log('Free diagnostic result:', freeDiagnosticResult);        // Should have score, category, etc.
```

### During Snapshot Call
```javascript
// Check network request
// Look for: POST http://localhost:8081/api/v1/diagnostic/snapshot
// Request payload should include: free_diagnostic_answers
```

### During Blueprint Call
```javascript
// Check network request
// Look for: POST http://localhost:8081/api/v1/diagnostic/blueprint
// Request payload should include: free_diagnostic_answers
```

---

## Backend Verification

### Check Backend Logs

```bash
# Backend should be running on port 8081
# Check logs for:

# Free diagnostic call
INFO: POST /api/v1/diagnostic/run

# Snapshot call
INFO: Calling Sumopod for snapshot diagnostic (kimi-k2-250905)...
INFO: Snapshot diagnostic completed: score=XX

# Blueprint call
INFO: Calling Sumopod for blueprint diagnostic (glm-4-7-251222)...
INFO: Blueprint diagnostic completed: [system_name]
```

### Test Backend Endpoints Directly

```bash
# Test free diagnostic endpoint
curl -X POST http://localhost:8081/api/v1/diagnostic/run \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"question_id": "business_objective", "selected_option": 2},
      {"question_id": "current_ai_usage", "selected_option": 1},
      {"question_id": "data_availability", "selected_option": 2},
      {"question_id": "process_documentation", "selected_option": 1},
      {"question_id": "workflow_standardization", "selected_option": 2},
      {"question_id": "erp_integration", "selected_option": 1},
      {"question_id": "automation_level", "selected_option": 2},
      {"question_id": "decision_speed", "selected_option": 1},
      {"question_id": "leadership_alignment", "selected_option": 2},
      {"question_id": "budget_ownership", "selected_option": 1},
      {"question_id": "change_readiness", "selected_option": 2},
      {"question_id": "internal_capability", "selected_option": 1}
    ]
  }'

# Test snapshot endpoint (requires free diagnostic answers)
curl -X POST http://localhost:8081/api/v1/diagnostic/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "free_diagnostic_answers": [
      {"question_id": "business_objective", "selected_option": 2},
      {"question_id": "current_ai_usage", "selected_option": 1},
      {"question_id": "data_availability", "selected_option": 2},
      {"question_id": "process_documentation", "selected_option": 1},
      {"question_id": "workflow_standardization", "selected_option": 2},
      {"question_id": "erp_integration", "selected_option": 1},
      {"question_id": "automation_level", "selected_option": 2},
      {"question_id": "decision_speed", "selected_option": 1},
      {"question_id": "leadership_alignment", "selected_option": 2},
      {"question_id": "budget_ownership", "selected_option": 1},
      {"question_id": "change_readiness", "selected_option": 2},
      {"question_id": "internal_capability", "selected_option": 1}
    ],
    "language": "en"
  }'

# Test blueprint endpoint (requires free diagnostic answers)
curl -X POST http://localhost:8081/api/v1/diagnostic/blueprint \
  -H "Content-Type: application/json" \
  -d '{
    "free_diagnostic_answers": [
      {"question_id": "business_objective", "selected_option": 2},
      {"question_id": "current_ai_usage", "selected_option": 1},
      {"question_id": "data_availability", "selected_option": 2},
      {"question_id": "process_documentation", "selected_option": 1},
      {"question_id": "workflow_standardization", "selected_option": 2},
      {"question_id": "erp_integration", "selected_option": 1},
      {"question_id": "automation_level", "selected_option": 2},
      {"question_id": "decision_speed", "selected_option": 1},
      {"question_id": "leadership_alignment", "selected_option": 2},
      {"question_id": "budget_ownership", "selected_option": 1},
      {"question_id": "change_readiness", "selected_option": 2},
      {"question_id": "internal_capability", "selected_option": 1}
    ],
    "language": "en"
  }'
```

---

## Common Issues and Solutions

### Issue 1: "Failed to run diagnostic" error
**Cause**: Backend not running or wrong port
**Solution**: 
```bash
# Check if backend is running
lsof -ti:8081

# If not running, start it
cd ~/Documents/Aivory
source venv/bin/activate
/opt/homebrew/opt/python@3.11/bin/python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

### Issue 2: Old version of files loading
**Cause**: Browser cache
**Solution**: Hard refresh with `Cmd + Shift + R` (Mac)

### Issue 3: Snapshot/Blueprint not unlocking after free diagnostic
**Cause**: `freeDiagnosticCompleted` flag not set
**Solution**: Check browser console for errors, verify `submitFreeDiagnostic()` completes successfully

### Issue 4: API returns 422 error for snapshot/blueprint
**Cause**: Missing `free_diagnostic_answers` in request
**Solution**: Verify free diagnostic was completed and answers are stored in `freeDiagnosticAnswers` variable

### Issue 5: Sumopod API timeout
**Cause**: Sumopod API slow or unavailable
**Solution**: Check `.env.local` for correct API key, verify Sumopod service is available

---

## Final Verification Checklist

- [ ] Free diagnostic works standalone (12 questions)
- [ ] Free diagnostic returns correct results (score, category, insights, recommendation, badge)
- [ ] Snapshot is locked until free diagnostic completed
- [ ] Snapshot uses free diagnostic answers (not new questions)
- [ ] Snapshot calls correct endpoint (`/api/v1/diagnostic/snapshot`)
- [ ] Snapshot uses correct model (`kimi-k2-250905`)
- [ ] Snapshot returns correct results (readiness_score, summary, use_cases, actions)
- [ ] Blueprint is locked until free diagnostic completed
- [ ] Blueprint uses free diagnostic answers (not new questions)
- [ ] Blueprint calls correct endpoint (`/api/v1/diagnostic/blueprint`)
- [ ] Blueprint uses correct model (`glm-4-7-251222`)
- [ ] Blueprint returns correct results (system_recommendation, workflow, agent_structure, ROI, deployment_plan)
- [ ] All three flows are completely separate
- [ ] No confusion between free and paid flows
- [ ] Navigation works correctly between all sections

---

## Success Criteria Summary

✅ **Flow Separation**: Free diagnostic is completely standalone, paid tiers are extensions
✅ **Entry Point**: Free diagnostic is the only entry point, paid tiers locked until completed
✅ **Data Reuse**: Paid tiers reuse free diagnostic answers, no new questions
✅ **Correct Models**: Snapshot uses Kimi, Blueprint uses GLM
✅ **Correct Endpoints**: Each flow calls its own endpoint
✅ **UI Clarity**: Each flow has distinct UI sections and results
✅ **No Confusion**: Clear separation between free and paid flows

---

## Next Steps After Testing

1. If all tests pass: Mark Task 2 as COMPLETE
2. If issues found: Document issues and fix them
3. Update documentation with any changes
4. Consider adding error handling improvements
5. Consider adding loading state improvements
6. Consider adding analytics tracking

---

## Contact for Issues

If you encounter any issues during testing:
1. Check browser console for JavaScript errors
2. Check backend logs for API errors
3. Verify all files are deployed to XAMPP
4. Verify backend is running on port 8081
5. Hard refresh browser to clear cache
