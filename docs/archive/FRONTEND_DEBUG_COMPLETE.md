# Frontend Debug - Complete

## Debug Tools Created

### 1. Test Blueprint Dashboard
**File**: `frontend/test-blueprint-dashboard.html`
**URL**: http://localhost:8080/test-blueprint-dashboard.html

This is a comprehensive debug tool that tests the entire blueprint dashboard flow:

- ✅ Environment check (API_BASE_URL, AuthManager, IDChainManager)
- ✅ Authentication check (login, super admin status)
- ✅ Blueprint generation
- ✅ Blueprint data fetch
- ✅ Dashboard rendering simulation
- ✅ Console logging

**How to Use:**
1. Open http://localhost:8080/test-blueprint-dashboard.html
2. Click "Test Login" to login as super admin
3. Click "Generate Blueprint" to create a new blueprint
4. Click "Fetch Blueprint" to load the data
5. Click "Simulate Dashboard" to verify rendering
6. Check console log for any errors

### 2. Simple Debug Page
**File**: `frontend/debug_frontend.html`
**URL**: http://localhost:8080/debug_frontend.html

Simpler version that automatically runs all tests on page load.

## Files Fixed

### 1. `frontend/dashboard.html`
- Fixed syntax error (extra closing brace)
- Updated script versions to v=23

### 2. `frontend/auth-manager.js`
- Added `getUserId()` method
- Returns `currentUser.user_id` or null

### 3. `frontend/dashboard.js`
- Fixed calls to `AuthManager.getUserId()`
- Updated to use new method instead of `AuthManager.getCurrentUser()?.user_id`

### 4. `frontend/index.html`
- Updated script versions to v=23

## Verification Steps

### Step 1: Check Servers Running
```bash
# Check backend (port 8081)
curl http://localhost:8081/health

# Check frontend (port 8080)
curl http://localhost:8080/index.html | head -5
```

### Step 2: Test Login API
```bash
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"grandmaster@aivory.ai","password":"GrandMaster2026!"}'
```

Expected response:
```json
{
  "user": {
    "user_id": "GrandMasterRCH",
    "email": "grandmaster@aivory.ai",
    "account_type": "superadmin"
  },
  "tokens": { ... }
}
```

### Step 3: Test Blueprint Generation
```bash
curl -X POST http://localhost:8081/api/v1/blueprint/generate \
  -H "Content-Type: application/json" \
  -d '{"user_id":"GrandMasterRCH","snapshot_id":"snap_superadmin_demo"}'
```

Expected response:
```json
{
  "success": true,
  "blueprint_id": "bp_xxxxx",
  "json_url": "/api/v1/blueprint/bp_xxxxx/download/json",
  "pdf_url": "/api/v1/blueprint/bp_xxxxx/download/pdf"
}
```

### Step 4: Test Blueprint Fetch
```bash
curl "http://localhost:8081/api/v1/blueprint/bp_xxxxx?user_id=GrandMasterRCH"
```

Expected response:
```json
{
  "blueprint_id": "bp_xxxxx",
  "system_name": "Aivory Demo Corp AI System",
  "agents": [ ... ],
  "workflows": [ ... ],
  "integrations_required": [ ... ],
  "deployment_estimate": "20-40 hours"
}
```

### Step 5: Test Frontend Debug Tool
1. Open http://localhost:8080/test-blueprint-dashboard.html
2. All environment checks should pass (green checkmarks)
3. Click "Test Login" - should succeed
4. Click "Generate Blueprint" - should return blueprint_id
5. Click "Fetch Blueprint" - should show 2 agents, 1 workflow, 2 integrations
6. Click "Simulate Dashboard" - should show all fields populated

### Step 6: Test Real Dashboard
1. Open http://localhost:8080/index.html
2. Click "Sign In" in top-right
3. Login with:
   - Email: grandmaster@aivory.ai
   - Password: GrandMaster2026!
4. Open browser console (F12)
5. Navigate to: http://localhost:8080/dashboard.html?mode=blueprint&id=bp_xxxxx&user_id=GrandMasterRCH
6. Check console for:
   - ✅ "Super admin access granted"
   - ✅ "Blueprint data loaded"
   - ❌ No errors

## Common Issues & Solutions

### Issue 1: "AuthManager not loaded"
**Cause**: Script loading order or cache
**Solution**: 
- Hard reload (Cmd+Shift+R)
- Check script tags in dashboard.html have v=23
- Verify auth-manager.js loads before dashboard.js

### Issue 2: "Not authenticated, showing login modal"
**Cause**: User not logged in or localStorage cleared
**Solution**:
- Login at index.html first
- Check localStorage has 'aivory_user' key
- Verify user object has account_type: 'superadmin'

### Issue 3: "Failed to load blueprint data"
**Cause**: Blueprint ID doesn't exist or wrong user_id
**Solution**:
- Generate fresh blueprint with curl
- Verify blueprint_id in URL matches generated ID
- Check user_id=GrandMasterRCH in URL

### Issue 4: "Blueprint dashboard shows 'failed to load data'"
**Cause**: Data not in sessionStorage or fetch failed
**Solution**:
- Check browser console for fetch errors
- Verify API returns 200 status
- Check sessionStorage has 'dashboard_blueprint_data' key

### Issue 5: Dashboard shows error state
**Cause**: DashboardState.data is null
**Solution**:
- Verify fetchBlueprintData() was called
- Check if blueprint_id is in URL params
- Verify API response has correct structure

## Debug Checklist

Before reporting issues, verify:

- [ ] Both servers running (8080 and 8081)
- [ ] Logged in as super admin
- [ ] Blueprint generated successfully
- [ ] Blueprint ID in URL is correct
- [ ] Hard reload performed (Cmd+Shift+R)
- [ ] Browser console checked for errors
- [ ] Test debug tool passes all checks
- [ ] localStorage has user data
- [ ] sessionStorage has blueprint data

## Browser Console Commands

Open browser console (F12) and run:

```javascript
// Check AuthManager
console.log('AuthManager:', typeof AuthManager);
console.log('Authenticated:', AuthManager.isAuthenticated());
console.log('Super Admin:', AuthManager.isSuperAdmin());
console.log('User:', AuthManager.getUser());
console.log('User ID:', AuthManager.getUserId());

// Check localStorage
console.log('User in localStorage:', localStorage.getItem('aivory_user'));
console.log('Token:', localStorage.getItem('aivory_access_token'));

// Check sessionStorage
console.log('Blueprint data:', sessionStorage.getItem('dashboard_blueprint_data'));

// Check DashboardState
console.log('Dashboard mode:', DashboardState.mode);
console.log('Dashboard data:', DashboardState.data);

// Test blueprint fetch
const blueprintId = 'bp_xxxxx';
fetch(`http://localhost:8081/api/v1/blueprint/${blueprintId}?user_id=GrandMasterRCH`)
  .then(r => r.json())
  .then(d => console.log('Blueprint:', d))
  .catch(e => console.error('Error:', e));
```

## Expected Console Output

When dashboard loads successfully:

```
✅ Super admin access granted
Blueprint data loaded: {blueprint_id: "bp_xxxxx", system_name: "...", ...}
```

When dashboard renders:

```
Rendering blueprint dashboard
System Name: Aivory Demo Corp AI System
Agents: 2
Workflows: 1
Integrations: 2
```

## Files to Check

If issues persist, verify these files:

1. `frontend/dashboard.html` - Line 217 (script tags)
2. `frontend/dashboard.js` - Lines 100-120 (initDashboard)
3. `frontend/auth-manager.js` - Lines 200-210 (getUserId)
4. `frontend/auth-guard.js` - Lines 15-25 (super admin bypass)

## Next Steps

1. Run test debug tool: http://localhost:8080/test-blueprint-dashboard.html
2. Verify all 5 steps pass
3. If any step fails, check console log for error details
4. If all steps pass, test real dashboard
5. If real dashboard fails, compare console output with test tool

## Status

✅ All fixes applied
✅ Script versions updated to v=23
✅ Debug tools created
✅ Verification scripts created
✅ API endpoints tested and working
✅ Blueprint generation working
✅ Blueprint fetch working

**Ready for frontend testing.**

User should:
1. Open test debug tool
2. Run all tests
3. Report any failures with console output
