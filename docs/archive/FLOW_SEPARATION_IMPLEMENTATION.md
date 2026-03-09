# Flow Separation Implementation Guide

## Problem Statement

The current implementation incorrectly merged the free diagnostic flow with the paid diagnostic flows. This document outlines the correct implementation with three completely separate flows.

## Correct Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  FLOW 1: FREE AI READINESS DIAGNOSTIC ($0)                  │
│  - Always available                                          │
│  - 12 questions                                              │
│  - Entry point for all users                                │
│  - Endpoint: POST /api/v1/diagnostic/run                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ User completes free diagnostic
                            ▼
        ┌───────────────────────────────────────┐
        │   Paid tiers now UNLOCKED             │
        └───────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│  FLOW 2: AI SNAPSHOT      │  │  FLOW 3: AI BLUEPRINT     │
│  ($15)                    │  │  ($99)                    │
│                           │  │                           │
│  - Uses free answers      │  │  - Uses free answers      │
│  - Model: kimi-k2-250905  │  │  - Model: glm-4-7-251222  │
│  - Endpoint: /snapshot    │  │  - Endpoint: /blueprint   │
└───────────────────────────┘  └───────────────────────────┘
```

## Backend Changes

### File: `app/api/routes/diagnostic.py`

#### 1. Keep Free Diagnostic Endpoint (NO CHANGES)
```python
@router.post("/run")
async def run_diagnostic(submission: DiagnosticSubmission):
    """
    FREE AI Readiness Diagnostic - 12 questions
    Always available, standalone flow
    """
    # Existing implementation - DO NOT CHANGE
```

#### 2. Update Snapshot Endpoint
```python
@router.post("/snapshot")
async def run_snapshot_diagnostic(data: dict):
    """
    AI Snapshot Diagnostic ($15)
    REQUIRES: free_diagnostic_answers from completed free diagnostic
    MODEL: kimi-k2-250905
    """
    free_answers = data.get("free_diagnostic_answers", [])
    if not free_answers:
        raise HTTPException(422, "Free diagnostic required")
    
    # Use kimi-k2-250905 model
    # Return: readiness_score, summary, recommended_use_cases, priority_actions
```

#### 3. Create New Blueprint Endpoint
```python
@router.post("/blueprint")
async def run_blueprint_diagnostic(data: dict):
    """
    AI System Blueprint ($99)
    REQUIRES: free_diagnostic_answers from completed free diagnostic
    MODEL: glm-4-7-251222
    """
    free_answers = data.get("free_diagnostic_answers", [])
    if not free_answers:
        raise HTTPException(422, "Free diagnostic required")
    
    # Use glm-4-7-251222 model
    # Return: system_recommendation, workflow, agent_structure, expected_ROI, deployment_plan
```

#### 4. Remove Old /deep Endpoint
Delete the `/deep` endpoint as it's being replaced by `/blueprint`.

## Frontend Changes

### File: `frontend/app.js`

Replace entire file with `frontend/app_new.js` which implements:

#### Global State
```javascript
// FREE DIAGNOSTIC STATE (12 questions)
let freeDiagnosticAnswers = {};
let freeDiagnosticResult = null;
let freeDiagnosticCompleted = false;  // Gate for paid tiers
```

#### Flow 1: Free Diagnostic Functions
```javascript
function startFreeDiagnostic()           // Entry point
function initializeFreeDiagnostic()      // Setup
function renderFreeQuestion()            // Display question
function selectFreeOption(index)         // Answer selection
function previousFreeQuestion()          // Navigation
function nextFreeQuestion()              // Navigation
function submitFreeDiagnostic()          // Submit to /api/v1/diagnostic/run
function displayFreeDiagnosticResults()  // Show results
function displayUpgradeOptions()         // Show locked paid tiers
```

#### Flow 2: Snapshot Functions
```javascript
function startSnapshot()                 // Check if free completed, then run
function runSnapshot()                   // Call /api/v1/diagnostic/snapshot
function displaySnapshotResults()        // Show snapshot results
```

#### Flow 3: Blueprint Functions
```javascript
function startBlueprint()                // Check if free completed, then run
function runBlueprint()                  // Call /api/v1/diagnostic/blueprint
function displayBlueprintResults()       // Show blueprint results
```

### File: `frontend/index.html`

Add three separate sections:

```html
<!-- FREE DIAGNOSTIC SECTION -->
<section id="free-diagnostic" class="section">
    <div class="container">
        <!-- Progress bar -->
        <div class="diagnostic-progress">
            <div class="progress-bar">
                <div id="free-progress-fill" class="progress-fill"></div>
            </div>
            <div class="progress-text">
                Question <span id="free-current-question">1</span> of 12
            </div>
        </div>
        
        <!-- Questions -->
        <div id="free-diagnostic-questions">
            <div id="free-question-container"></div>
            <div class="navigation-buttons">
                <button id="free-prev-button" onclick="previousFreeQuestion()">← Previous</button>
                <button id="free-next-button" onclick="nextFreeQuestion()">Next →</button>
                <button id="free-submit-button" onclick="submitFreeDiagnostic()" style="display:none">Submit</button>
            </div>
        </div>
        
        <!-- Loading -->
        <div id="free-diagnostic-loading" style="display:none">
            <div class="spinner"></div>
            <h2>Analyzing Your Responses...</h2>
        </div>
        
        <!-- Results -->
        <div id="free-diagnostic-results" style="display:none">
            <div class="score-section">
                <h2>Your AI Readiness Score</h2>
                <div id="free-score-number" class="score-number"></div>
                <div id="free-score-category" class="score-category"></div>
                <p id="free-category-explanation"></p>
            </div>
            
            <div class="section-box">
                <h3>Key Insights</h3>
                <ul id="free-insights-list"></ul>
            </div>
            
            <div class="section-box">
                <h3>Recommendation</h3>
                <p id="free-recommendation-text"></p>
            </div>
            
            <div class="section-box">
                <h3>Your Badge</h3>
                <div id="free-badge-container"></div>
                <button onclick="downloadFreeBadge()">Download Badge</button>
            </div>
            
            <!-- UPGRADE OPTIONS (unlocked after free diagnostic) -->
            <div id="free-upgrade-options"></div>
        </div>
    </div>
</section>

<!-- SNAPSHOT LOADING SECTION -->
<section id="snapshot-loading" class="section">
    <div class="container">
        <div class="loading-container">
            <div class="spinner"></div>
            <h2>Generating Your AI Snapshot...</h2>
            <p>Our AI is analyzing your readiness. This takes 5-10 seconds.</p>
        </div>
    </div>
</section>

<!-- SNAPSHOT RESULTS SECTION -->
<section id="snapshot-results" class="section">
    <div class="container">
        <div id="snapshot-results-container"></div>
    </div>
</section>

<!-- BLUEPRINT LOADING SECTION -->
<section id="blueprint-loading" class="section">
    <div class="container">
        <div class="loading-container">
            <div class="spinner"></div>
            <h2>Generating Your AI System Blueprint...</h2>
            <p>Our AI is designing your custom system. This takes 10-15 seconds.</p>
        </div>
    </div>
</section>

<!-- BLUEPRINT RESULTS SECTION -->
<section id="blueprint-results" class="section">
    <div class="container">
        <div id="blueprint-results-container"></div>
    </div>
</section>
```

### Homepage CTAs

Update homepage buttons:

```html
<!-- FREE DIAGNOSTIC CTA (always available) -->
<button class="cta-button primary" onclick="startFreeDiagnostic()">
    Run Free AI Readiness Diagnostic
</button>

<!-- PAID TIER CTAs (locked until free diagnostic completed) -->
<button class="cta-button" onclick="startSnapshot()" id="snapshot-cta">
    Run AI Snapshot — $15
</button>

<button class="cta-button" onclick="startBlueprint()" id="blueprint-cta">
    Generate AI System Blueprint — $99
</button>
```

## API Request/Response Formats

### 1. Free Diagnostic

**Request:**
```json
POST /api/v1/diagnostic/run
{
  "answers": [
    {"question_id": "business_objective", "selected_option": 2},
    {"question_id": "current_ai_usage", "selected_option": 1},
    ...
  ]
}
```

**Response:**
```json
{
  "score": 75.5,
  "category": "AI-Ready",
  "category_explanation": "...",
  "insights": ["...", "...", "..."],
  "recommendation": "...",
  "badge_svg": "<svg>...</svg>"
}
```

### 2. AI Snapshot

**Request:**
```json
POST /api/v1/diagnostic/snapshot
{
  "free_diagnostic_answers": [
    {"question_id": "business_objective", "selected_option": 2},
    ...
  ],
  "language": "en"
}
```

**Response:**
```json
{
  "readiness_score": 68,
  "summary": "...",
  "recommended_use_cases": ["...", "...", "..."],
  "priority_actions": ["...", "...", "..."]
}
```

### 3. AI System Blueprint

**Request:**
```json
POST /api/v1/diagnostic/blueprint
{
  "free_diagnostic_answers": [
    {"question_id": "business_objective", "selected_option": 2},
    ...
  ],
  "language": "en"
}
```

**Response:**
```json
{
  "system_recommendation": {
    "system_name": "...",
    "description": "...",
    "confidence_level": "High"
  },
  "workflow": [{
    "trigger": "...",
    "steps": ["...", "..."],
    "tools_used": ["...", "..."]
  }],
  "agent_structure": [{
    "agent_name": "...",
    "role": "...",
    "responsibilities": ["...", "..."]
  }],
  "expected_ROI": "...",
  "deployment_plan": "..."
}
```

## Implementation Steps

### Step 1: Update Backend
1. ✅ Update `/snapshot` endpoint to use `kimi-k2-250905` and require `free_diagnostic_answers`
2. ✅ Create `/blueprint` endpoint using `glm-4-7-251222` and require `free_diagnostic_answers`
3. ❌ Remove `/deep` endpoint (old 3-agent chain)
4. ✅ Keep `/run` endpoint unchanged (free diagnostic)

### Step 2: Update Frontend JavaScript
1. Replace `frontend/app.js` with `frontend/app_new.js`
2. Test free diagnostic flow
3. Test snapshot flow (should require free diagnostic first)
4. Test blueprint flow (should require free diagnostic first)

### Step 3: Update Frontend HTML
1. Add `free-diagnostic` section
2. Add `snapshot-loading` and `snapshot-results` sections
3. Add `blueprint-loading` and `blueprint-results` sections
4. Update homepage CTAs
5. Remove old `paid-diagnostic` section

### Step 4: Update CSS
Add styles for new sections (if needed)

### Step 5: Test Complete Flow
1. User starts on homepage
2. Clicks "Run Free AI Readiness Diagnostic"
3. Answers 12 questions
4. Sees results + upgrade options
5. Clicks "Run AI Snapshot — $15"
6. Sees snapshot results
7. Clicks "Generate AI System Blueprint — $99"
8. Sees blueprint results

## Key Differences from Previous Implementation

| Aspect | OLD (Incorrect) | NEW (Correct) |
|--------|-----------------|---------------|
| Free Diagnostic | Merged with paid | Completely separate |
| Questions | 30 questions for all | 12 for free, paid use free answers |
| Snapshot Input | 30 new questions | Uses 12 free answers |
| Blueprint Input | 30 new questions | Uses 12 free answers |
| Snapshot Model | deepseek-v3 | kimi-k2-250905 |
| Blueprint Model | 3-agent chain | glm-4-7-251222 |
| Endpoint Names | /snapshot, /deep | /snapshot, /blueprint |
| Paid Tier Access | Always available | Locked until free complete |

## Testing Checklist

- [ ] Free diagnostic works standalone
- [ ] Snapshot requires free diagnostic first
- [ ] Blueprint requires free diagnostic first
- [ ] Snapshot uses correct model (kimi-k2-250905)
- [ ] Blueprint uses correct model (glm-4-7-251222)
- [ ] Snapshot receives free_diagnostic_answers
- [ ] Blueprint receives free_diagnostic_answers
- [ ] Results display correctly for all three flows
- [ ] Navigation works between flows
- [ ] Error handling works for all flows

## Files to Update

1. ✅ `app/api/routes/diagnostic.py` - Backend endpoints
2. ⏳ `frontend/app.js` - Replace with app_new.js
3. ⏳ `frontend/index.html` - Add new sections
4. ⏳ `frontend/styles.css` - Add new styles (if needed)
5. ⏳ Copy files to XAMPP

## Deployment Commands

```bash
# 1. Backend is already updated (diagnostic.py)

# 2. Update frontend
cd ~/Documents/Aivory
cp frontend/app_new.js frontend/app.js

# 3. Copy to XAMPP
cp -r frontend/* /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/

# 4. Restart backend (if needed)
# Kill existing process
lsof -ti:8081 | xargs kill -9

# Start backend
/opt/homebrew/opt/python@3.11/bin/python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload

# 5. Test in browser
# http://localhost/aivory/frontend/index.html
```

## Success Criteria

✅ User can complete free diagnostic without any payment
✅ Paid tiers are locked until free diagnostic is completed
✅ Snapshot uses free diagnostic answers as context
✅ Blueprint uses free diagnostic answers as context
✅ Each flow has its own distinct UI and results
✅ No confusion between free and paid flows
✅ Clear upgrade path from free → snapshot → blueprint

## Notes

- The free diagnostic is the ONLY entry point
- Paid tiers are EXTENSIONS, not replacements
- Free diagnostic answers are REUSED by paid tiers
- Each flow has its own backend endpoint
- Each flow has its own frontend section
- No merging or confusion between flows
