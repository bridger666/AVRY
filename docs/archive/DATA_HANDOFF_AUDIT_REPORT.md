# Data Handoff Pipeline Audit Report
## Aivory 3-Step Monetization Funnel

**Audit Date:** February 26, 2026  
**Auditor:** Kiro AI  
**Objective:** Identify and fix all data loss between Step 1 → Step 2a → Step 2b

---

## Executive Summary

🚨 **CRITICAL ISSUES FOUND:**

1. **Step 1 → Step 2a (Diagnostic → Snapshot):** COMPLETE DATA LOSS
2. **Step 2a → Step 2b (Snapshot → Blueprint):** PARTIAL DATA LOSS
3. **ID Traceability:** BROKEN CHAIN (no diagnostic_id → snapshot_id → blueprint_id linking)

**Impact:** Users must re-enter information, Snapshot/Blueprint generation is generic (not personalized), no audit trail.

---

## Step 1 → Step 2a: Diagnostic → Snapshot

### Current State (BROKEN)

#### Step 1 Output (Free Diagnostic)
**Endpoint:** `POST /api/v1/diagnostic/run`

**Output Schema:**
```json
{
  "score": 75,
  "category": "Building Momentum",
  "category_explanation": "string",
  "insights": ["string"],
  "recommendation": "string",
  "badge_svg": "string",
  "enriched_by_ai": false
}
```

**Data Available (NOT RETURNED):**
```javascript
// Frontend has this data but doesn't store it:
freeDiagnosticAnswers = {
  "business_objective": 0,
  "current_automation": 2,
  "data_centralized": 1,
  // ... 12 questions total
}
```

**Missing:**
- ❌ No `diagnostic_id` generated
- ❌ Answers NOT stored in database
- ❌ Answers NOT returned to frontend
- ❌ No user_id association
- ❌ No timestamp tracking

#### Step 2a Input (AI Snapshot)
**Endpoint:** `POST /api/v1/diagnostic/snapshot`

**Expected Input Schema:**
```json
{
  "snapshot_answers": [
    {"question_id": "primary_objective", "selected_option": 0},
    // ... 30 questions (DIFFERENT from Step 1)
  ],
  "language": "en"
}
```

**What It Actually Needs (NOT PROVIDED):**
- ❌ Free diagnostic answers (12 questions)
- ❌ diagnostic_id for traceability
- ❌ User context (company name, industry, email)
- ❌ Pain points from Step 1
- ❌ Current tools/workflows from Step 1

### Data Loss Analysis

| Field | Step 1 Has It | Step 2a Needs It | Currently Passed | Status |
|-------|---------------|------------------|------------------|--------|
| diagnostic_id | ❌ Not generated | ✅ Yes | ❌ No | **MISSING** |
| user_id | ❌ Not captured | ✅ Yes | ❌ No | **MISSING** |
| company_name | ❌ Not asked | ✅ Yes | ❌ No | **MISSING** |
| industry | ❌ Not asked | ✅ Yes | ❌ No | **MISSING** |
| business_objective | ✅ Q1 answer | ✅ Yes | ❌ No | **DROPPED** |
| current_automation | ✅ Q2 answer | ✅ Yes | ❌ No | **DROPPED** |
| data_centralized | ✅ Q3 answer | ✅ Yes | ❌ No | **DROPPED** |
| pain_points | ✅ Implicit in answers | ✅ Yes | ❌ No | **DROPPED** |
| workflows | ✅ Implicit in answers | ✅ Yes | ❌ No | **DROPPED** |
| readiness_score | ✅ Calculated | ✅ Yes | ❌ No | **DROPPED** |

**Result:** 100% data loss. Snapshot starts from scratch with 30 NEW questions.

---

## Step 2a → Step 2b: Snapshot → Blueprint

### Current State (PARTIALLY BROKEN)

#### Step 2a Output (AI Snapshot)
**Endpoint:** `POST /api/v1/diagnostic/snapshot`

**Output Schema:**
```json
{
  "readiness_score": 75,
  "readiness_level": "Medium",
  "strength_index": 80,
  "bottleneck_index": 60,
  "top_recommendations": ["workflow_automation_engine", "task_routing_agent"],
  "priority_score": 85,
  "deployment_phase_suggestion": "foundation_building",
  "category_scores": {
    "workflow": 70,
    "data": 80,
    "automation": 75,
    "organization": 65
  },
  "strength_category": "data",
  "bottleneck_category": "organization",
  "primary_objective": "improve_efficiency",
  "weights_used": {"workflow": 0.35, "data": 0.20, ...}
}
```

**Missing from Output:**
- ❌ No `snapshot_id` generated
- ❌ Snapshot answers NOT stored
- ❌ No user_id association
- ❌ No company_name
- ❌ No industry
- ❌ No pain_points (explicit list)
- ❌ No workflows (explicit list)
- ❌ No current_tools (explicit list)

#### Step 2b Input (AI Blueprint Generator)
**Endpoint:** `POST /api/v1/blueprint/generate`

**Expected Input:**
```json
{
  "user_id": "string",
  "snapshot_id": "snap_abc123",
  "bypass_payment": false
}
```

**What Blueprint Generator Needs (from SnapshotData model):**
```python
class SnapshotData(BaseModel):
    snapshot_id: str
    user_email: EmailStr
    company_name: str
    readiness_score: int
    primary_objective: str
    industry: Optional[str]
    key_processes: List[str]
    automation_level: str
    pain_points: List[str]
    workflows: List[str]
    data_quality_score: int
```

**Current Implementation:**
```python
# blueprint_generation.py line 150
async def _retrieve_snapshot_data(self, snapshot_id: str, user_id: str) -> Optional[SnapshotData]:
    # Mock snapshot data for testing
    if snapshot_id.startswith("snap_"):
        return SnapshotData(
            snapshot_id=snapshot_id,
            user_email="user@example.com",  # ❌ HARDCODED
            company_name="Example Corp",     # ❌ HARDCODED
            readiness_score=75,              # ❌ HARDCODED
            primary_objective="Automate customer service operations",  # ❌ HARDCODED
            industry="Technology",           # ❌ HARDCODED
            key_processes=["Customer support", "Ticket routing"],  # ❌ HARDCODED
            automation_level="Partial",      # ❌ HARDCODED
            pain_points=["Slow response times", "Manual routing"],  # ❌ HARDCODED
            workflows=["Email triage", "Ticket assignment"],  # ❌ HARDCODED
            data_quality_score=80            # ❌ HARDCODED
        )
    return None
```

### Data Loss Analysis

| Field | Step 2a Has It | Step 2b Needs It | Currently Passed | Status |
|-------|----------------|------------------|------------------|--------|
| snapshot_id | ❌ Not generated | ✅ Yes | ❌ No | **MISSING** |
| user_email | ❌ Not captured | ✅ Yes | ❌ Mock data | **MISSING** |
| company_name | ❌ Not captured | ✅ Yes | ❌ Mock data | **MISSING** |
| readiness_score | ✅ Calculated | ✅ Yes | ❌ Mock data | **DROPPED** |
| primary_objective | ✅ Returned | ✅ Yes | ❌ Mock data | **DROPPED** |
| industry | ❌ Not captured | ✅ Yes | ❌ Mock data | **MISSING** |
| key_processes | ❌ Not captured | ✅ Yes | ❌ Mock data | **MISSING** |
| automation_level | ❌ Not captured | ✅ Yes | ❌ Mock data | **MISSING** |
| pain_points | ❌ Not captured | ✅ Yes | ❌ Mock data | **MISSING** |
| workflows | ❌ Not captured | ✅ Yes | ❌ Mock data | **MISSING** |
| data_quality_score | ❌ Not calculated | ✅ Yes | ❌ Mock data | **MISSING** |
| category_scores | ✅ Returned | ❌ Not used | ❌ No | **IGNORED** |
| top_recommendations | ✅ Returned | ❌ Not used | ❌ No | **IGNORED** |

**Result:** 70% data loss. Blueprint uses hardcoded mock data instead of real Snapshot results.

---

## ID Traceability Chain

### Current State (BROKEN)

**Expected Flow:**
```
diagnostic_id → snapshot_id → blueprint_id
```

**Actual Flow:**
```
❌ (no ID) → ❌ (no ID) → ✅ bp_abc123
```

**Issues:**
1. Free Diagnostic doesn't generate or return `diagnostic_id`
2. AI Snapshot doesn't generate or return `snapshot_id`
3. Blueprint has no way to link back to Snapshot or Diagnostic
4. No audit trail for user journey
5. Cannot retrieve historical data for regeneration

---

## Root Cause Analysis

### 1. No Database Persistence Layer
- Diagnostic answers stored only in frontend memory (lost on refresh)
- Snapshot answers stored only in frontend memory (lost on refresh)
- No database tables for diagnostics or snapshots

### 2. API Design Mismatch
- Step 1 returns summary, not raw data
- Step 2a expects NEW 30 questions, not Step 1 data
- Step 2b expects database lookup, but database doesn't exist

### 3. Frontend State Management
- Each step is isolated
- No data passed between steps
- User must re-enter information

### 4. Mock Data in Production Code
- `_retrieve_snapshot_data()` returns hardcoded values
- Blueprint generation ignores real Snapshot results
- No validation that data is real vs mock

---

## Required Fixes

### Fix 1: Add Database Persistence

**Create Tables:**
```sql
-- diagnostics table
CREATE TABLE diagnostics (
    diagnostic_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(100),
    user_email VARCHAR(255),
    company_name VARCHAR(255),
    industry VARCHAR(100),
    answers JSONB,
    score INTEGER,
    category VARCHAR(50),
    created_at TIMESTAMP,
    INDEX idx_user_id (user_id)
);

-- snapshots table
CREATE TABLE snapshots (
    snapshot_id VARCHAR(50) PRIMARY KEY,
    diagnostic_id VARCHAR(50),
    user_id VARCHAR(100),
    user_email VARCHAR(255),
    company_name VARCHAR(255),
    industry VARCHAR(100),
    answers JSONB,
    readiness_score INTEGER,
    category_scores JSONB,
    primary_objective VARCHAR(100),
    top_recommendations JSONB,
    pain_points JSONB,
    workflows JSONB,
    key_processes JSONB,
    created_at TIMESTAMP,
    FOREIGN KEY (diagnostic_id) REFERENCES diagnostics(diagnostic_id),
    INDEX idx_user_id (user_id),
    INDEX idx_diagnostic_id (diagnostic_id)
);

-- blueprints table (already exists, needs foreign key)
ALTER TABLE blueprints ADD COLUMN snapshot_id VARCHAR(50);
ALTER TABLE blueprints ADD FOREIGN KEY (snapshot_id) REFERENCES snapshots(snapshot_id);
```

### Fix 2: Update Step 1 Output

**Modify `/api/v1/diagnostic/run`:**
```python
# BEFORE
return {
    "score": score,
    "category": category,
    ...
}

# AFTER
diagnostic_id = f"diag_{uuid.uuid4().hex[:12]}"
await db.store_diagnostic(diagnostic_id, user_id, answers, score, category)

return {
    "diagnostic_id": diagnostic_id,  # NEW
    "score": score,
    "category": category,
    "answers": answers,  # NEW - return for frontend
    ...
}
```

### Fix 3: Update Step 2a Input/Output

**Modify `/api/v1/diagnostic/snapshot`:**
```python
# BEFORE
{
    "snapshot_answers": [...],  # 30 NEW questions
    "language": "en"
}

# AFTER
{
    "diagnostic_id": "diag_abc123",  # NEW - link to Step 1
    "snapshot_answers": [...],  # 30 questions
    "user_email": "user@example.com",  # NEW
    "company_name": "Acme Corp",  # NEW
    "industry": "Technology",  # NEW
    "language": "en"
}

# Output BEFORE
{
    "readiness_score": 75,
    ...
}

# Output AFTER
{
    "snapshot_id": "snap_abc123",  # NEW
    "diagnostic_id": "diag_abc123",  # NEW - traceability
    "readiness_score": 75,
    "pain_points": ["Slow response", "Manual routing"],  # NEW - extracted from answers
    "workflows": ["Email triage", "Ticket assignment"],  # NEW - extracted from answers
    "key_processes": ["Customer support", "Sales"],  # NEW - extracted from answers
    ...
}
```

### Fix 4: Update Step 2b Input

**Modify Blueprint Generation:**
```python
# BEFORE (mock data)
async def _retrieve_snapshot_data(self, snapshot_id: str, user_id: str):
    return SnapshotData(
        snapshot_id=snapshot_id,
        user_email="user@example.com",  # HARDCODED
        ...
    )

# AFTER (real database lookup)
async def _retrieve_snapshot_data(self, snapshot_id: str, user_id: str):
    snapshot = await db.get_snapshot(snapshot_id, user_id)
    if not snapshot:
        raise SnapshotNotFoundError(f"Snapshot {snapshot_id} not found")
    
    return SnapshotData(
        snapshot_id=snapshot.snapshot_id,
        user_email=snapshot.user_email,
        company_name=snapshot.company_name,
        readiness_score=snapshot.readiness_score,
        primary_objective=snapshot.primary_objective,
        industry=snapshot.industry,
        key_processes=snapshot.key_processes,
        automation_level=snapshot.automation_level,
        pain_points=snapshot.pain_points,
        workflows=snapshot.workflows,
        data_quality_score=snapshot.data_quality_score
    )
```

### Fix 5: Frontend Data Flow

**Update frontend to pass data between steps:**
```javascript
// Step 1 completion
const diagnosticResult = await submitFreeDiagnostic();
localStorage.setItem('diagnostic_id', diagnosticResult.diagnostic_id);
localStorage.setItem('diagnostic_answers', JSON.stringify(diagnosticResult.answers));

// Step 2a start
const diagnostic_id = localStorage.getItem('diagnostic_id');
const snapshotResult = await submitSnapshot({
    diagnostic_id: diagnostic_id,
    snapshot_answers: snapshotAnswers,
    user_email: userEmail,
    company_name: companyName,
    industry: industry
});
localStorage.setItem('snapshot_id', snapshotResult.snapshot_id);

// Step 2b start
const snapshot_id = localStorage.getItem('snapshot_id');
const blueprintResult = await generateBlueprint({
    user_id: userId,
    snapshot_id: snapshot_id,
    bypass_payment: false
});
```

---

## Implementation Priority

### Phase 1: Critical (Zero Data Loss)
1. ✅ Add database tables (diagnostics, snapshots)
2. ✅ Generate and return diagnostic_id in Step 1
3. ✅ Store diagnostic answers in database
4. ✅ Generate and return snapshot_id in Step 2a
5. ✅ Store snapshot answers and results in database
6. ✅ Replace mock data in Blueprint generation with real database lookup

### Phase 2: Enhanced Traceability
1. ✅ Add foreign key relationships (diagnostic_id → snapshot_id → blueprint_id)
2. ✅ Add user_id to all tables
3. ✅ Add timestamps for audit trail
4. ✅ Add indexes for performance

### Phase 3: User Experience
1. ✅ Update frontend to capture user_email, company_name, industry
2. ✅ Pass diagnostic_id to Snapshot API
3. ✅ Pass snapshot_id to Blueprint API
4. ✅ Add "Resume" functionality (retrieve saved progress)

---

## Testing Plan

### End-to-End Test (GrandMasterRCH)

**Test Flow:**
```bash
# Step 1: Free Diagnostic
curl -X POST http://localhost:8081/api/v1/diagnostic/run \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "GrandMasterRCH",
    "user_email": "admin@aivory.id",
    "company_name": "Aivory Test Corp",
    "industry": "Technology",
    "answers": [
      {"question_id": "business_objective", "selected_option": 1},
      ...
    ]
  }'

# Expected: diagnostic_id returned, answers stored

# Step 2a: AI Snapshot
curl -X POST http://localhost:8081/api/v1/diagnostic/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "diagnostic_id": "diag_abc123",
    "user_email": "admin@aivory.id",
    "company_name": "Aivory Test Corp",
    "industry": "Technology",
    "snapshot_answers": [
      {"question_id": "primary_objective", "selected_option": 1},
      ...
    ]
  }'

# Expected: snapshot_id returned, linked to diagnostic_id

# Step 2b: AI Blueprint
curl -X POST http://localhost:8081/api/v1/blueprint/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "GrandMasterRCH",
    "snapshot_id": "snap_abc123",
    "bypass_payment": true
  }'

# Expected: Blueprint uses REAL snapshot data, not mock data
```

**Validation Checks:**
1. ✅ Blueprint system_name derived from company_name
2. ✅ Blueprint agents derived from pain_points and workflows
3. ✅ Blueprint integrations derived from current_tools
4. ✅ Blueprint deployment_estimate uses real readiness_score
5. ✅ Database shows: diagnostic_id → snapshot_id → blueprint_id chain

---

## Success Criteria

### Zero Data Loss
- ✅ All diagnostic answers stored and retrievable
- ✅ All snapshot answers stored and retrievable
- ✅ Blueprint generation uses 100% real data (0% mock data)

### Complete Traceability
- ✅ Every blueprint links to snapshot
- ✅ Every snapshot links to diagnostic
- ✅ Full audit trail with timestamps

### No Manual Re-entry
- ✅ User enters email/company/industry ONCE (Step 1)
- ✅ Snapshot pre-fills user context
- ✅ Blueprint automatically retrieves snapshot data

### Personalized Output
- ✅ Blueprint system_name reflects company_name
- ✅ Blueprint agents address specific pain_points
- ✅ Blueprint integrations match current_tools
- ✅ Blueprint estimate uses real readiness_score

---

## Current Status

🔴 **BLOCKED:** Cannot proceed with fixes until database schema is approved.

**Next Steps:**
1. Review this audit report
2. Approve database schema changes
3. Implement Phase 1 fixes
4. Run end-to-end test
5. Verify zero data loss

---

## Appendix: Data Schema Comparison

### Step 1 Output (Current)
```json
{
  "score": 75,
  "category": "Building Momentum",
  "category_explanation": "...",
  "insights": ["..."],
  "recommendation": "...",
  "badge_svg": "...",
  "enriched_by_ai": false
}
```

### Step 1 Output (Required)
```json
{
  "diagnostic_id": "diag_abc123",
  "user_id": "user123",
  "user_email": "user@example.com",
  "company_name": "Acme Corp",
  "industry": "Technology",
  "score": 75,
  "category": "Building Momentum",
  "category_explanation": "...",
  "insights": ["..."],
  "recommendation": "...",
  "badge_svg": "...",
  "enriched_by_ai": false,
  "answers": [
    {"question_id": "business_objective", "selected_option": 1},
    ...
  ],
  "created_at": "2026-02-26T10:00:00Z"
}
```

### Step 2a Output (Current)
```json
{
  "readiness_score": 75,
  "readiness_level": "Medium",
  "category_scores": {...},
  "top_recommendations": [...],
  ...
}
```

### Step 2a Output (Required)
```json
{
  "snapshot_id": "snap_abc123",
  "diagnostic_id": "diag_abc123",
  "user_id": "user123",
  "user_email": "user@example.com",
  "company_name": "Acme Corp",
  "industry": "Technology",
  "readiness_score": 75,
  "readiness_level": "Medium",
  "category_scores": {...},
  "top_recommendations": [...],
  "pain_points": ["Slow response times", "Manual routing"],
  "workflows": ["Email triage", "Ticket assignment"],
  "key_processes": ["Customer support", "Sales"],
  "automation_level": "Partial",
  "data_quality_score": 80,
  "created_at": "2026-02-26T10:15:00Z"
}
```

### Step 2b Input (Current - Mock)
```python
SnapshotData(
    snapshot_id="snap_test",
    user_email="user@example.com",  # HARDCODED
    company_name="Example Corp",     # HARDCODED
    ...
)
```

### Step 2b Input (Required - Real)
```python
SnapshotData(
    snapshot_id="snap_abc123",
    user_email="user@example.com",  # FROM DATABASE
    company_name="Acme Corp",        # FROM DATABASE
    readiness_score=75,              # FROM DATABASE
    primary_objective="improve_efficiency",  # FROM DATABASE
    industry="Technology",           # FROM DATABASE
    key_processes=["Customer support", "Sales"],  # FROM DATABASE
    automation_level="Partial",      # FROM DATABASE
    pain_points=["Slow response times"],  # FROM DATABASE
    workflows=["Email triage"],      # FROM DATABASE
    data_quality_score=80            # FROM DATABASE
)
```

---

**End of Audit Report**
