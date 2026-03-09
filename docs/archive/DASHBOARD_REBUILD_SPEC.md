# Dashboard Rebuild - Complete Specification

## Status: IN PROGRESS

### PHASE 1 — Fix Tier 1 Bugs ✅ COMPLETE
1. ✅ UserStateManager.js created
2. ✅ Thinking animation CSS added
3. ✅ Thinking animation functions added to console.js
4. ✅ Workflow failed alert system created

### PHASE 2 — Build Missing Dashboard Tabs (IN PROGRESS)

The current dashboard.html uses a mode-based system where different content is shown based on URL parameter `?mode=free|snapshot|blueprint|operate`.

**New Architecture Needed:**
- Tab-based navigation within dashboard
- Each tab shows different data view
- All tabs in single dashboard.html file
- No new HTML files

**Tabs to Build:**
1. Overview Tab - Progress tracker + summary metrics
2. Diagnostic Results Tab - Readiness score + categories
3. Snapshot Results Tab - Detailed analysis
4. AI Blueprint Tab - System design (already exists, needs polish)
5. Settings Tab - API credentials, integrations, account
6. Purchase History Tab - Payment records

### Implementation Strategy

Since this is a major rebuild, I'll:
1. Create new tab navigation system
2. Build each tab as a separate section
3. Update dashboard.js to handle tab switching
4. Preserve existing blueprint rendering
5. Add demo mode for users without data

### Files to Modify
- `frontend/dashboard.html` - Add tab navigation + new sections
- `frontend/dashboard.js` - Add tab switching logic + new render functions
- `frontend/dashboard.css` - Add tab styles
- `frontend/dashboard-layout.css` - Update layout for tabs

### Files to Create
- `frontend/user-state-manager.js` ✅ DONE
- `frontend/workflow-alert.js` ✅ DONE

## Next Steps

Continue with PHASE 2 implementation...
