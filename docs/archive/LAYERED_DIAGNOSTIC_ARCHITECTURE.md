# Aivory Layered Diagnostic Architecture

## Overview

The Aivory platform implements a **3-tier intelligence layered system** with strict separation of concerns. Each layer serves a distinct purpose and cannot be bypassed.

## Architecture Principles

### Intelligence Separation
- **12 questions** = Readiness signal (marketing layer)
- **30 questions** = System design signal (direction layer)
- **Blueprint** = Architectural refinement (deployment layer)

### Flow Enforcement
```
Free Diagnostic (12Q) → AI Snapshot (30Q) → Deep Diagnostic (Blueprint)
```

Each tier is **independent** and **required** for the next tier.

---

## Layer 1: Free Diagnostic ($0)

### Purpose
High-level readiness signal detection for marketing and initial assessment.

### Characteristics
- **Exactly 12 questions**
- **Rule-based scoring** (no AI model calls)
- **Fast completion** (< 2 minutes)
- **Always available** (no prerequisites)

### Question Categories (12)
1. Business objective clarity
2. Current AI usage
3. Data centralization
4. Process documentation
5. Workflow standardization
6. System integration maturity
7. Automation level
8. Decision speed
9. Leadership alignment
10. Budget ownership
11. Change readiness
12. Internal technical capability

### Output Contract
```json
{
  "score": number (0-100),
  "category": "Not Ready" | "Getting Started" | "Building Momentum" | "AI-Ready",
  "category_explanation": string,
  "insights": [string],
  "recommendation": string,
  "badge_svg": string
}
```

### What Free Diagnostic Does NOT Include
- ❌ Pseudo-code
- ❌ Workflow architecture
- ❌ Agent structure
- ❌ System recommendations

### Backend Endpoint
```
POST /api/v1/diagnostic/run
Body: { answers: [{ question_id, selected_option }] }
Validation: Exactly 12 answers required
```

---

## Layer 2: AI Snapshot ($15)

### Purpose
Generate system direction + A-to-A pseudo-code outline using structured 30-question taxonomy.

### Critical Rules
- **MUST use NEW 30 questions** (NOT the 12 free questions)
- **AI-powered** (deepseek-v3-2-251201 primary, kimi-k2-250905 fallback)
- **Generates NON-executable A-to-A pseudo-code**
- **No tool-specific names** (no n8n, Claude, Make, Zapier)

### Question Taxonomy (30 Total)

#### A. Strategy & Objective (5)
1. Primary AI goal
2. Quantified KPI target
3. Time horizon
4. Department priority
5. Risk tolerance level

#### B. Operations & Bottlenecks (5)
6. Biggest operational bottleneck
7. Manual workload percentage
8. Decision approval layers
9. SLA expectations
10. Repetitive task frequency

#### C. Data & Infrastructure (5)
11. Data format types
12. Data accessibility
13. ERP/CRM stack
14. API availability
15. Integration constraints

#### D. Automation Readiness (5)
16. Current automation tools
17. Conditional logic usage
18. Workflow branching complexity
19. Event triggers available
20. Monitoring capabilities

#### E. Decision Intelligence (5)
21. Human vs automated decisions ratio
22. Escalation paths
23. Exception frequency
24. Compliance requirements
25. Audit log needs

#### F. Organizational Readiness (5)
26. AI ownership role
27. Change management maturity
28. Cross-team coordination level
29. Budget authority
30. Deployment urgency

### Output Contract
```json
{
  "readiness_score": number (0-100),
  "readiness_level": "Low" | "Medium" | "High",
  "strategic_priority": string,
  "key_gaps": [string],
  "automation_opportunities": [string],
  "system_outline": {
    "system_name": string,
    "system_type": string,
    "core_objective": string,
    "pseudo_code_outline": string (A-to-A format, NON-executable)
  },
  "recommended_next_step": string
}
```

### A-to-A Pseudo-Code Format
```
DEFINE objective: Process incoming invoices
DEFINE trigger: Email received with PDF attachment
IF attachment_type == "invoice":
    ROUTE TO Document_Parser_Agent
    EXTRACT: invoice_number, amount, vendor, date
    ROUTE TO Validation_Agent
    IF validation_passed:
        ROUTE TO Approval_Router_Agent
    ELSE:
        ROUTE TO Exception_Handler_Agent
        ESCALATE if threshold
LOG result
```

### Backend Endpoint
```
POST /api/v1/diagnostic/snapshot
Body: { 
  snapshot_answers: [{ question_id, selected_option }],  // EXACTLY 30
  language: "en" | "id"
}
Validation: Exactly 30 answers required
Model: deepseek-v3-2-251201 (primary), kimi-k2-250905 (fallback)
Timeout: 60 seconds
```

---

## Layer 3: Deep Diagnostic ($99)

### Purpose
Refine Snapshot into deploy-ready blueprint with detailed architecture.

### Critical Rules
- **REQUIRES snapshot_result_json** (cannot bypass Snapshot)
- **Does NOT accept only free diagnostic answers**
- **Refines existing system outline** (not starting from scratch)
- **AI-powered** (glm-4-7-251222)

### Input Requirements
```json
{
  "snapshot_result_json": { /* Complete snapshot result */ },
  "additional_context": string (optional),
  "language": "en" | "id"
}
```

### Output Contract
```json
{
  "executive_summary": string,
  "system_recommendation": {
    "system_name": string,
    "description": string,
    "confidence_level": "Low" | "Medium" | "High"
  },
  "workflow_architecture": {
    "trigger": string,
    "steps": [string],
    "conditions": [string],
    "tools_required": [string]  // Generic agent names only
  },
  "agent_structure": [{
    "agent_name": string,
    "role": string,
    "responsibilities": [string]
  }],
  "expected_impact": {
    "automation_potential_percent": number,
    "estimated_time_saved_hours_per_week": number,
    "projected_roi": string
  },
  "deployment_phases": [string],
  "recommended_subscription_tier": "Builder" | "Operator" | "Enterprise"
}
```

### Backend Endpoint
```
POST /api/v1/diagnostic/deep
Body: { 
  snapshot_result_json: { /* Required */ },
  additional_context: string (optional),
  language: "en" | "id"
}
Validation: snapshot_result_json must exist and be valid
Model: glm-4-7-251222
Timeout: 90 seconds
```

---

## Validation Rules

### Free Diagnostic
```python
if len(answers) != 12:
    raise HTTPException(422, "Exactly 12 questions required")
```

### Snapshot Diagnostic
```python
if len(snapshot_answers) != 30:
    raise HTTPException(422, "Exactly 30 questions required. Do NOT use free diagnostic answers.")
```

### Deep Diagnostic
```python
if not snapshot_result_json:
    raise HTTPException(422, "snapshot_result_json required. Please complete AI Snapshot first.")

if "system_outline" not in snapshot_result_json:
    raise HTTPException(422, "Invalid snapshot_result_json. Please run Snapshot diagnostic first.")
```

---

## User Flow

### Step 1: Free Diagnostic
1. User completes 12 questions
2. Receives readiness score + badge
3. Sees upgrade options (Snapshot $15, Blueprint $99)

### Step 2: AI Snapshot (Optional)
1. User clicks "Run AI Snapshot - $15"
2. Completes NEW 30-question assessment
3. Receives system outline with A-to-A pseudo-code
4. Sees upgrade option (Blueprint $99)

### Step 3: Deep Diagnostic (Optional)
1. User clicks "Run Deep Diagnostic - $99"
2. System uses snapshot_result_json (no new questions)
3. Receives complete blueprint with deployment phases
4. Can deploy to subscription tier

### Step 4: Deployment (Future)
1. User selects subscription tier (Builder/Operator/Enterprise)
2. Blueprint → Decoder → Execution Layer
3. Workflows deployed to production

---

## Frontend Implementation

### Files
- `frontend/app.js` - Main diagnostic flow logic
- `frontend/diagnostic-questions-snapshot.js` - 30 snapshot questions
- `frontend/dashboard.js` - Unified dashboard for all modes
- `frontend/dashboard.html` - Dashboard UI
- `frontend/index.html` - Main page with diagnostic sections

### State Management
```javascript
// Free diagnostic (12 questions)
let freeDiagnosticAnswers = {};
let freeDiagnosticResult = null;
let freeDiagnosticCompleted = false;

// Snapshot diagnostic (30 questions)
let snapshotDiagnosticAnswers = {};
let snapshotDiagnosticResult = null;
let snapshotDiagnosticCompleted = false;
```

### Dashboard Modes
- `?mode=free` - Free diagnostic results
- `?mode=snapshot` - Snapshot results with pseudo-code
- `?mode=blueprint` - Blueprint results with full architecture
- `?mode=operate` - Operating partner dashboard (subscription)

---

## Backend Implementation

### Files
- `app/api/routes/diagnostic.py` - All diagnostic endpoints
- `app/llm/sumopod_client.py` - Sumopod API integration

### Models Used
- **Free**: None (rule-based)
- **Snapshot**: deepseek-v3-2-251201 (primary), kimi-k2-250905 (fallback)
- **Blueprint**: glm-4-7-251222

---

## Prohibited Actions

### ❌ DO NOT
1. Merge 12 and 30 question logic
2. Allow Snapshot to use only 12 free answers
3. Allow Blueprint to bypass Snapshot
4. Add tool-specific workflow code (n8n, Claude, Make, Zapier)
5. Generate executable code (must be A-to-A pseudo-code)
6. Collapse tiers or simplify architecture

### ✅ DO
1. Maintain strict separation of concerns
2. Enforce validation rules at each layer
3. Use A-to-A pseudo-code format (NON-executable)
4. Require snapshot_result_json for Blueprint
5. Preserve structured contracts
6. Keep intelligence layers independent

---

## Testing the System

### Test Free Diagnostic
```bash
curl -X POST http://localhost:8081/api/v1/diagnostic/run \
  -H "Content-Type: application/json" \
  -d '{"answers": [/* 12 answers */]}'
```

### Test Snapshot Diagnostic
```bash
curl -X POST http://localhost:8081/api/v1/diagnostic/snapshot \
  -H "Content-Type: application/json" \
  -d '{"snapshot_answers": [/* 30 answers */], "language": "en"}'
```

### Test Deep Diagnostic
```bash
curl -X POST http://localhost:8081/api/v1/diagnostic/deep \
  -H "Content-Type: application/json" \
  -d '{"snapshot_result_json": {/* snapshot result */}, "language": "en"}'
```

---

## Future: Decoder Layer

The A-to-A pseudo-code format enables a future **Decoder Layer** that converts generic agent logic into specific workflow engine syntax:

```
A-to-A Pseudo-Code → Decoder → n8n/Make/Custom Engine
```

This maintains vendor independence while enabling execution.

---

## Summary

This architecture creates a **scalable AI Operating Partner framework** with:

1. **Marketing signal** (Free - 12Q)
2. **Direction clarity** (Snapshot - 30Q)
3. **Deployable architecture** (Blueprint - refinement)
4. **Execution layer** (Subscription - future)

Each layer is **independent**, **required**, and **non-bypassable**.

**Architectural integrity is preserved.**
