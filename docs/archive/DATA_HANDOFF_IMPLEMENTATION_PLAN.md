# Data Handoff Implementation Plan
## Systematic Fix for Zero Data Loss

**Status:** IN PROGRESS  
**Started:** February 26, 2026

---

## Implementation Checklist

### ✅ Phase 1: Database Foundation (COMPLETE)
- [x] Create `app/models/diagnostic.py` with DiagnosticResult, DiagnosticRecord
- [x] Create `app/models/snapshot.py` with SnapshotResult, SnapshotRecord
- [x] Create `app/database/db_service.py` with file-based storage
- [x] Create `app/database/__init__.py`

### 🔄 Phase 2: Step 1 Fix (IN PROGRESS)
- [ ] Update `/api/v1/diagnostic/run` to:
  - Generate `diagnostic_id` (format: `diag_{12-char-hex}`)
  - Extract user_email, company_name, industry from request
  - Store diagnostic in database
  - Return diagnostic_id + answers in response
- [ ] Test diagnostic storage and retrieval

### ⏳ Phase 3: Step 2a Fix (PENDING)
- [ ] Update `/api/v1/diagnostic/snapshot` to:
  - Accept diagnostic_id, user_email, company_name, industry
  - Generate `snapshot_id` (format: `snap_{12-char-hex}`)
  - Extract pain_points, workflows, key_processes from answers
  - Store snapshot in database with link to diagnostic_id
  - Return snapshot_id + extracted data in response
- [ ] Test snapshot storage and retrieval

### ⏳ Phase 4: Step 2b Fix (PENDING)
- [ ] Update `blueprint_generation.py`:
  - Replace mock `_retrieve_snapshot_data()` with real database lookup
  - Use snapshot data to populate SnapshotData model
  - Link blueprint to snapshot_id in storage
- [ ] Test blueprint generation with real data

### ⏳ Phase 5: End-to-End Test (PENDING)
- [ ] Run full flow as GrandMasterRCH
- [ ] Verify data at each handoff
- [ ] Verify ID chain: diagnostic_id → snapshot_id → blueprint_id
- [ ] Document before/after schemas

---

## Files to Modify

### Priority 2: Step 1 Fix
1. `app/api/routes/diagnostic.py` - Update `/run` endpoint
2. `app/models/diagnostic.py` - Already created ✅

### Priority 3: Step 2a Fix
1. `app/api/routes/diagnostic.py` - Update `/snapshot` endpoint
2. `app/models/snapshot.py` - Already created ✅
3. `app/services/snapshot_scoring_service.py` - Add data extraction functions

### Priority 4: Step 2b Fix
1. `app/services/blueprint_generation.py` - Replace mock data
2. `app/services/blueprint_storage.py` - Add snapshot_id linking
3. `app/models/blueprint.py` - Update SnapshotData usage

---

## Next Steps

1. Complete Phase 2: Update diagnostic endpoint
2. Test diagnostic flow
3. Move to Phase 3: Update snapshot endpoint
4. Test snapshot flow
5. Move to Phase 4: Update blueprint generation
6. Run end-to-end test
7. Document results

---

**Current Focus:** Updating `/api/v1/diagnostic/run` endpoint to persist data and return diagnostic_id
