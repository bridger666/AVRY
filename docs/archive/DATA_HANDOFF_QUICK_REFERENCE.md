# Data Handoff Pipeline - Quick Reference

## What Changed

### 1. Diagnostic API (`/api/v1/diagnostic/run`)

**NEW Request Fields (Optional):**
```json
{
  "answers": [...],
  "user_email": "user@example.com",
  "company_name": "Example Corp",
  "industry": "Technology"
}
```

**NEW Response Field:**
```json
{
  "diagnostic_id": "diag_abc123...",
  "score": 75,
  ...
}
```

### 2. Snapshot API (`/api/v1/diagnostic/snapshot`)

**NEW Request Fields (Optional):**
```json
{
  "snapshot_answers": [...],
  "diagnostic_id": "diag_abc123...",
  "user_email": "user@example.com",
  "company_name": "Example Corp",
  "industry": "Technology"
}
```

**NEW Response Fields:**
```json
{
  "snapshot_id": "snap_xyz789...",
  "diagnostic_id": "diag_abc123...",
  "readiness_score": 82,
  ...
}
```

### 3. Blueprint Generation

**No API changes** - Blueprint generation now automatically retrieves real data from database using `snapshot_id`.

---

## How It Works

### Flow 1: Standalone Diagnostic
```
User completes diagnostic
  ↓
Backend generates diagnostic_id
  ↓
Backend stores diagnostic + User_Context
  ↓
Frontend receives diagnostic_id
```

### Flow 2: Diagnostic → Snapshot (Linked)
```
User completes diagnostic (gets diagnostic_id)
  ↓
User proceeds to snapshot
  ↓
Frontend passes diagnostic_id to snapshot API
  ↓
Backend retrieves User_Context from diagnostic
  ↓
Backend generates snapshot_id
  ↓
Backend stores snapshot + links to diagnostic_id
  ↓
Frontend receives snapshot_id + diagnostic_id
```

### Flow 3: Snapshot → Blueprint (Linked)
```
User completes snapshot (gets snapshot_id)
  ↓
User proceeds to blueprint
  ↓
Frontend passes snapshot_id to blueprint API
  ↓
Backend retrieves REAL snapshot data from database
  ↓
Backend generates blueprint with real data
  ↓
Blueprint contains: company_name, pain_points, workflows, etc.
```

---

## Key Benefits

1. **Zero Data Loss** - All data persisted to database
2. **Zero Re-Entry** - User_Context flows automatically
3. **Real Data** - Blueprints use actual snapshot data (no mock data)
4. **Traceability** - Complete ID chain: diagnostic → snapshot → blueprint
5. **Personalization** - Blueprints contain company-specific information

---

## Database Files

**Location:** `data/` directory

```
data/
├── diagnostics/
│   └── diag_{id}.json
├── snapshots/
│   └── snap_{id}.json
└── blueprints/
    └── {user_id}/
        └── {blueprint_id}/
```

---

## Testing

**Run end-to-end test:**
```bash
python3 test_data_handoff_e2e.py
```

**Run blueprint real data test:**
```bash
python3 test_blueprint_real_data.py
```

---

## Frontend Integration Checklist

- [ ] Store `diagnostic_id` from diagnostic response
- [ ] Pass `diagnostic_id` to snapshot API
- [ ] Store `snapshot_id` from snapshot response
- [ ] Pass `snapshot_id` to blueprint API
- [ ] Display personalized blueprint content

---

## Example: Complete Flow

```javascript
// 1. Submit diagnostic
const diagResponse = await fetch('/api/v1/diagnostic/run', {
  method: 'POST',
  body: JSON.stringify({
    answers: [...],
    user_email: 'user@example.com',
    company_name: 'Example Corp',
    industry: 'Technology'
  })
});
const { diagnostic_id } = await diagResponse.json();

// 2. Submit snapshot (linked to diagnostic)
const snapResponse = await fetch('/api/v1/diagnostic/snapshot', {
  method: 'POST',
  body: JSON.stringify({
    snapshot_answers: [...],
    diagnostic_id: diagnostic_id  // Link!
  })
});
const { snapshot_id } = await snapResponse.json();

// 3. Generate blueprint (linked to snapshot)
const bpResponse = await fetch('/api/v1/blueprint/generate', {
  method: 'POST',
  body: JSON.stringify({
    snapshot_id: snapshot_id  // Link!
  })
});
const blueprint = await bpResponse.json();
// Blueprint now contains real company data!
```

---

## Status

✅ Backend implementation complete  
✅ Database layer complete  
✅ API updates complete  
✅ Blueprint service complete  
✅ End-to-end testing complete  
⏳ Frontend integration pending
