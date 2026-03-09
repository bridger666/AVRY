# Phase 2 Quick Test Checklist

## Quick Start (5 minutes)

### Prerequisites
- [ ] Next.js running: `npm run dev` (port 3000)
- [ ] n8n running: http://43.156.108.96:5678
- [ ] `.env.local` configured with N8N_BASE_URL, N8N_API_KEY

### Quick Test
1. Open: `http://localhost:3000/workflows/sdVzJXaKnmFQUUbo`
2. Verify:
   - [ ] Page shows "n8n Workflow Editor" (not blueprint view)
   - [ ] Header shows "Online" status
   - [ ] SyncStatus shows "Synced" (green)
   - [ ] Canvas displays nodes
   - [ ] No console errors

### Save Test
1. Move a node slightly
2. Verify:
   - [ ] SyncStatus changes to "Unsaved changes" (amber)
   - [ ] Click "Save changes"
   - [ ] SyncStatus shows "Saving..." then "Synced"
   - [ ] No errors

### Activate Test
1. In status dropdown, select "Active"
2. Verify:
   - [ ] Status changes to "Active"
   - [ ] No errors
   - [ ] Check n8n UI - workflow is active

### Offline Test
1. Stop n8n server
2. Reload page
3. Verify:
   - [ ] Header shows "Offline (local mode)"
   - [ ] Canvas still displays workflow
   - [ ] Warning toast appears
4. Restart n8n
5. Click Save
6. Verify:
   - [ ] Changes sync successfully
   - [ ] Status returns to "Synced"

## Full Test Suite (30 minutes)

See `N8N_PHASE2_E2E_TESTING.md` for complete test plan with 14 tests.

## Common Issues

| Issue | Solution |
|-------|----------|
| Page won't load | Check Next.js is running on port 3000 |
| Workflow not fetching | Verify n8n is running and API key is valid |
| Save fails | Check n8n is accessible, verify Network tab |
| Offline mode not working | Verify n8n is actually down, check localStorage |
| Status dropdown not working | Check Network tab for POST request, verify response |

## Success Criteria

✅ All quick tests pass
✅ No console errors
✅ No security issues (API key not exposed)
✅ Offline mode works
✅ Changes persist in n8n

## Next Steps

- [ ] Run full test suite (14 tests)
- [ ] Document any issues
- [ ] Proceed to Phase 3 (Unit Tests)
- [ ] Proceed to Phase 4 (Error Handling & Security)
