# Testing the Layered Diagnostic System

## Quick Start

### 1. Start Backend
```bash
cd ~/Documents/Aivory
python run_server.py
```

Backend should start on `http://localhost:8081`

### 2. Deploy Frontend to XAMPP
```bash
cp ~/Documents/Aivory/frontend/* /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/
sudo /Applications/XAMPP/xamppfiles/xampp restart
```

Frontend available at `http://localhost/aivory/frontend/index.html`

---

## Test Flow 1: Free Diagnostic Only

### Steps
1. Open `http://localhost/aivory/frontend/index.html`
2. Click "Run Free AI Readiness Diagnostic"
3. Answer all 12 questions
4. Click "Submit Diagnostic"
5. Should redirect to `dashboard.html?mode=free`
6. Verify:
   - ✅ Score displayed
   - ✅ Category shown
   - ✅ Insights listed
   - ✅ Recommendations shown
   - ✅ Upgrade buttons visible (Snapshot $15, Blueprint $99)

### Expected Behavior
- Free diagnostic completes in < 5 seconds
- No AI model calls (rule-based only)
- Dashboard shows basic readiness info
- Upgrade options unlocked

---

## Test Flow 2: Free → Snapshot

### Steps
1. Complete Free Diagnostic (see Flow 1)
2. From dashboard, click "Upgrade to AI Snapshot" or "Run AI Snapshot - $15"
3. Should redirect to `index.html#snapshot`
4. Should show 30-question diagnostic
5. Answer all 30 questions (note: different from free 12)
6. Click "Submit Snapshot Diagnostic"
7. Wait 5-15 seconds for AI processing
8. Should redirect to `dashboard.html?mode=snapshot`
9. Verify:
   - ✅ Readiness score displayed
   - ✅ System outline shown (system_name, system_type, core_objective)
   - ✅ A-to-A pseudo-code displayed (NON-executable format)
   - ✅ Key gaps listed
   - ✅ Automation opportunities listed
   - ✅ Upgrade to Blueprint button visible ($99)

### Expected Behavior
- Snapshot uses NEW 30 questions (not reusing free 12)
- AI processing takes 5-15 seconds
- Pseudo-code is in A-to-A format (DEFINE, TRIGGER, IF/ELSE, ROUTE TO, etc.)
- No tool-specific names (n8n, Claude, Make, Zapier)

### Validation
Check backend logs for:
```
Calling Sumopod for snapshot diagnostic (primary: deepseek-v3-2-251201)...
Successfully parsed JSON on attempt 1
Snapshot diagnostic completed successfully: score=XX, system=YY, model=deepseek-v3-2-251201
```

---

## Test Flow 3: Free → Snapshot → Blueprint

### Steps
1. Complete Free Diagnostic (see Flow 1)
2. Complete Snapshot Diagnostic (see Flow 2)
3. From snapshot dashboard, click "Upgrade to Deep Diagnostic" or "Run Deep Diagnostic - $99"
4. Should redirect to `index.html#blueprint`
5. Should show loading (no new questions)
6. Wait 10-20 seconds for AI processing
7. Should redirect to `dashboard.html?mode=blueprint`
8. Verify:
   - ✅ Executive summary displayed
   - ✅ System recommendation shown (name, description, confidence)
   - ✅ Workflow architecture detailed (trigger, steps, conditions, agents)
   - ✅ Agent structure cards displayed
   - ✅ Expected impact metrics shown
   - ✅ Deployment phases listed
   - ✅ Recommended subscription tier shown
   - ✅ Deploy button visible

### Expected Behavior
- Blueprint does NOT ask new questions
- Uses snapshot_result_json from previous step
- AI processing takes 10-20 seconds
- Blueprint refines snapshot outline into full architecture

### Validation
Check backend logs for:
```
Calling Sumopod for deep diagnostic blueprint (glm-4-7-251222)...
Successfully parsed blueprint JSON on attempt 1
Deep diagnostic blueprint completed: System Name
```

---

## Test Flow 4: Try to Skip Layers (Should Fail)

### Test A: Try Blueprint without Snapshot
1. Open browser console
2. Run:
```javascript
snapshotDiagnosticCompleted = false;
snapshotDiagnosticResult = null;
startBlueprint();
```
3. Should see alert: "Please complete the AI Snapshot ($15) diagnostic first!"

### Test B: Try Snapshot with only 12 answers
1. Complete free diagnostic
2. Open browser console
3. Run:
```javascript
// Try to submit snapshot with only 12 answers
fetch('http://localhost:8081/api/v1/diagnostic/snapshot', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    snapshot_answers: Array(12).fill({question_id: 'test', selected_option: 0}),
    language: 'en'
  })
}).then(r => r.json()).then(console.log);
```
4. Should see error: "Exactly 30 questions required. Received 12 questions."

### Test C: Try Blueprint without snapshot_result_json
```javascript
fetch('http://localhost:8081/api/v1/diagnostic/deep', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    language: 'en'
  })
}).then(r => r.json()).then(console.log);
```
Should see error: "snapshot_result_json is required. Please complete the AI Snapshot ($15) diagnostic first."

---

## Verify A-to-A Pseudo-Code Format

### In Snapshot Results
Check that pseudo-code follows format:
```
DEFINE objective: ...
DEFINE trigger: ...
IF condition:
    ROUTE TO Agent_Name
    EXTRACT: fields
    IF validation:
        ROUTE TO Another_Agent
    ELSE:
        ESCALATE
LOG result
```

### Forbidden Terms
Pseudo-code should NOT contain:
- ❌ n8n
- ❌ Claude
- ❌ Make
- ❌ Zapier
- ❌ OpenAI
- ❌ Anthropic

### Allowed Terms
- ✅ Document_Parser_Agent
- ✅ Validation_Agent
- ✅ Routing_Agent
- ✅ Approval_Agent
- ✅ Exception_Handler_Agent
- ✅ Generic agent names

---

## Backend API Testing

### Test Free Diagnostic Endpoint
```bash
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
      {"question_id": "automation_level", "selected_option": 1},
      {"question_id": "decision_speed", "selected_option": 2},
      {"question_id": "leadership_alignment", "selected_option": 2},
      {"question_id": "budget_ownership", "selected_option": 1},
      {"question_id": "change_readiness", "selected_option": 2},
      {"question_id": "internal_capability", "selected_option": 1}
    ]
  }'
```

Expected: Score, category, insights, recommendation, badge_svg

### Test Snapshot Endpoint (30 questions)
```bash
curl -X POST http://localhost:8081/api/v1/diagnostic/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "snapshot_answers": [
      {"question_id": "primary_ai_goal", "selected_option": 0},
      {"question_id": "quantified_kpi_target", "selected_option": 2},
      ... (28 more questions)
    ],
    "language": "en"
  }'
```

Expected: readiness_score, readiness_level, strategic_priority, system_outline with pseudo_code_outline

### Test Blueprint Endpoint (requires snapshot result)
```bash
curl -X POST http://localhost:8081/api/v1/diagnostic/deep \
  -H "Content-Type: application/json" \
  -d '{
    "snapshot_result_json": {
      "readiness_score": 75,
      "readiness_level": "High",
      "strategic_priority": "Efficiency improvement",
      "system_outline": {
        "system_name": "Invoice Processing System",
        "system_type": "Document Processing",
        "core_objective": "Automate invoice processing",
        "pseudo_code_outline": "DEFINE objective..."
      },
      "key_gaps": ["Manual data entry"],
      "automation_opportunities": ["Invoice extraction"],
      "recommended_next_step": "Upgrade to blueprint"
    },
    "language": "en"
  }'
```

Expected: executive_summary, system_recommendation, workflow_architecture, agent_structure, expected_impact, deployment_phases

---

## Common Issues

### Issue: "SNAPSHOT_DIAGNOSTIC_QUESTIONS not loaded"
**Solution**: Ensure `diagnostic-questions-snapshot.js` is included in `index.html` before `app.js`

### Issue: Snapshot endpoint returns 422 error
**Solution**: Check that exactly 30 answers are being sent, not 12

### Issue: Blueprint endpoint returns 422 error
**Solution**: Ensure snapshot_result_json is included in request body

### Issue: Pseudo-code contains tool names
**Solution**: Check LLM prompt includes prohibition of tool-specific names

### Issue: Dashboard shows "Temporarily Unavailable"
**Solution**: 
1. Check backend is running on port 8081
2. Check SUMOPOD_API_KEY is set in .env.local
3. Check browser console for errors
4. Check backend logs for API errors

---

## Success Criteria

### ✅ Free Diagnostic
- [ ] Completes in < 5 seconds
- [ ] Shows score, category, insights
- [ ] Unlocks upgrade options
- [ ] No AI model calls

### ✅ Snapshot Diagnostic
- [ ] Uses 30 NEW questions
- [ ] Generates A-to-A pseudo-code
- [ ] No tool-specific names
- [ ] Completes in 5-15 seconds
- [ ] Shows system outline

### ✅ Blueprint Diagnostic
- [ ] Requires snapshot_result_json
- [ ] Does NOT ask new questions
- [ ] Refines snapshot into full architecture
- [ ] Shows deployment phases
- [ ] Completes in 10-20 seconds

### ✅ Validation
- [ ] Cannot skip layers
- [ ] Cannot use wrong number of questions
- [ ] Cannot bypass snapshot for blueprint
- [ ] Error messages are clear

---

## Next Steps After Testing

1. Test multilingual support (language: "id")
2. Test error handling (invalid API key, timeout, etc.)
3. Test dashboard mode switching
4. Test download functionality
5. Test tier selection flow
6. Add property-based tests
7. Add integration tests
8. Deploy to production

---

## Support

If issues persist:
1. Check `LAYERED_DIAGNOSTIC_ARCHITECTURE.md` for architecture details
2. Check backend logs: `tail -f logs/aivory.log`
3. Check browser console for frontend errors
4. Verify environment variables in `.env.local`
5. Restart backend and XAMPP
