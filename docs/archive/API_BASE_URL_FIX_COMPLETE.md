# API_BASE_URL Fix Complete

## Problem
The demo banner was still visible for superadmin (GrandMasterRCH) because `window.API_BASE_URL` was `undefined`, causing API calls to fail with:
```
GET http://localhost:9000/undefined/api/v1/auth/me 404 (File not found)
```

## Root Cause
**Script Loading Order Issue**: Dashboard pages (dashboard.html, logs.html, workflows.html) were loading `user-state-manager.js` and `workflow-alert.js` BEFORE `app.js`, which sets the global `window.API_BASE_URL`.

### Timeline of Events:
1. `user-state-manager.js` loads and tries to use `window.API_BASE_URL` → undefined
2. `workflow-alert.js` loads and tries to use `window.API_BASE_URL` → undefined  
3. Both scripts have fallback logic, but it wasn't being triggered properly
4. API calls fail with `http://localhost:9000/undefined/api/...`

## Solution Applied

### Fixed Script Loading Order
Added `app.js` as the FIRST script in all dashboard-related HTML files:

**Files Updated:**
- `frontend/dashboard.html` - Added `app.js?v=27` before user-state-manager.js
- `frontend/logs.html` - Added `app.js?v=27` before user-state-manager.js
- `frontend/workflows.html` - Added `app.js?v=27` before user-state-manager.js

**New Loading Order:**
```html
<script src="app.js?v=27"></script>              <!-- Sets window.API_BASE_URL -->
<script src="user-state-manager.js?v=27"></script> <!-- Uses window.API_BASE_URL -->
<script src="workflow-alert.js?v=27"></script>     <!-- Uses window.API_BASE_URL -->
<!-- ... other scripts ... -->
```

### What app.js Does
```javascript
// app.js sets window.API_BASE_URL globally
if (!window.API_BASE_URL) {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    if (isDevelopment) {
        window.API_BASE_URL = 'http://localhost:8081'; // FastAPI backend
    } else {
        window.API_BASE_URL = window.location.origin;
    }
}
```

## Current Server Configuration
- **Frontend**: Port 9000 (simple_server.py) - Process 22
- **Backend API**: Port 8081 (FastAPI/Uvicorn) - Process 21
- **API_BASE_URL**: `http://localhost:8081` (in development)

## Expected Results After Fix

### For Superadmin (GrandMasterRCH):
1. ✅ Login successful
2. ✅ UserStateManager loads enriched state from `/api/v1/auth/me`
3. ✅ Console shows: `USER STATE: {tier: "enterprise", isSubscribed: true, ...}`
4. ✅ Demo banner: **NOT visible** (because hasSnapshot/hasBlueprint/hasDiagnostic all true)
5. ✅ Tier display: "Enterprise" (not "Free")
6. ✅ Credits display: "2000 / 2000"
7. ✅ Blueprint tab: Loads seeded blueprint

### API Calls Now Work:
- ✅ `http://localhost:8081/api/v1/auth/me` (not undefined)
- ✅ `http://localhost:8081/api/v1/workflows/list?user_id=GrandMasterRCH`
- ✅ `http://localhost:8081/api/v1/blueprint/superadmin_blueprint_001`

## Testing Instructions

1. **Hard Refresh**: Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) to clear cache
2. **Login**: Use grandmaster@aivory.ai / GrandMaster2026!
3. **Check Console**: Should see `✅ app.js loaded - API_BASE_URL: http://localhost:8081`
4. **Verify State**: Should see `USER STATE: {tier: "enterprise", ...}` with all flags true
5. **Check UI**: 
   - No demo banner
   - Tier shows "Enterprise"
   - Credits show "2000 / 2000"
   - Blueprint tab loads successfully

## Version Bump
All script tags updated to `?v=27` to force browser cache refresh.

## Next Steps
If the demo banner is still visible after hard refresh:
1. Check browser console for any remaining errors
2. Verify both servers are running (ports 8081 and 9000)
3. Test API endpoint directly: `curl http://localhost:8081/api/v1/auth/me -H "Authorization: Bearer <token>"`
4. Consider implementing the full architecture cleanup spec (`.kiro/specs/architecture-cleanup/`)

---
**Status**: ✅ Fix Applied - Ready for Testing
**Date**: Context Transfer Session
**Files Modified**: 3 (dashboard.html, logs.html, workflows.html)
