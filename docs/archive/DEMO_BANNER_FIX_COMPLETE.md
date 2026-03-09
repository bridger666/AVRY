# Demo Banner Fix - Complete Solution

## Problem
The demo banner was still showing for superadmin (GrandMasterRCH) even though the backend was returning correct enriched user state with all flags set to true.

## Root Causes Identified

### Issue 1: Script Loading Order (FIXED in previous commit)
- `dashboard.html` was loading `user-state-manager.js` BEFORE `app.js`
- This caused `window.API_BASE_URL` to be `undefined`
- API calls failed with `http://localhost:9000/undefined/api/v1/auth/me`

**Fix Applied**: Added `app.js` as the first script in dashboard.html, logs.html, and workflows.html

### Issue 2: Race Condition - Tab Rendering Before State Loads (FIXED NOW)
The main issue was a **timing/race condition**:

1. `initDashboard()` was called immediately on page load
2. It called `switchTab('overview')` which rendered the overview tab
3. `renderOverviewTab()` checked `UserStateManager.state` for demo mode
4. BUT UserStateManager was still loading data from `/api/v1/auth/me`
5. So `userState.hasDiagnostic`, `hasSnapshot`, `hasBlueprint` were all `false` (default values)
6. Demo banner showed because `isDemoMode = true`
7. Later, UserStateManager finished loading and updated state, but the overview tab was never re-rendered

## Solution Applied

### Fix 1: Wait for UserStateManager Before Rendering Tabs
**File**: `frontend/dashboard.js` - `initDashboard()` function

**Before**:
```javascript
// Initialize tab system - load last active tab or default to overview
const lastActiveTab = localStorage.getItem('active_tab') || 'overview';
switchTab(lastActiveTab); // ❌ Renders immediately, before state loads

// Wait for UserStateManager to load, then sync tier/credits
if (UserStateManager.isLoaded()) {
    updateTierAndCreditsUI();
} else {
    UserStateManager.subscribe(() => {
        updateTierAndCreditsUI();
    });
}
```

**After**:
```javascript
// Initialize tab system - load last active tab or default to overview
const lastActiveTab = localStorage.getItem('active_tab') || 'overview';

// ✅ Wait for UserStateManager to load before rendering tabs
if (UserStateManager.isLoaded()) {
    switchTab(lastActiveTab);
    updateTierAndCreditsUI();
} else {
    UserStateManager.subscribe(() => {
        switchTab(lastActiveTab); // ✅ Render AFTER state loads
        updateTierAndCreditsUI();
    });
}
```

### Fix 2: Re-render Overview Tab When State Updates
**File**: `frontend/dashboard.js` - `updateTierAndCreditsUI()` function

Added logic to re-render the overview tab when UserStateManager finishes loading:

```javascript
function updateTierAndCreditsUI() {
    const s = UserStateManager.getUserState();
    
    // ... update tier and credits displays ...
    
    // ✅ Re-render the current tab to update demo banner and progress steps
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabName = activeTab.dataset.tab;
        if (tabName === 'overview') {
            renderOverviewTab(); // ✅ Re-render with correct state
        }
    }
}
```

### Fix 3: Added Debug Logging
Added console logs to `renderOverviewTab()` to help debug state issues:

```javascript
console.log('renderOverviewTab - UserState:', {
    isLoaded: userState.isLoaded,
    hasDiagnostic: userState.hasDiagnostic,
    hasSnapshot: userState.hasSnapshot,
    hasBlueprint: userState.hasBlueprint,
    isSubscribed: userState.isSubscribed,
    tier: userState.tier
});

console.log('isDemoMode:', isDemoMode);
```

## Expected Flow After Fix

### Page Load Sequence:
1. ✅ `app.js` loads → sets `window.API_BASE_URL = 'http://localhost:8081'`
2. ✅ `user-state-manager.js` loads → starts fetching from `/api/v1/auth/me`
3. ✅ `dashboard.js` loads → `initDashboard()` called
4. ✅ `initDashboard()` checks if UserStateManager is loaded
5. ✅ If NOT loaded, subscribes to state changes
6. ✅ UserStateManager finishes loading → notifies subscribers
7. ✅ Subscriber callback runs → calls `switchTab('overview')` and `updateTierAndCreditsUI()`
8. ✅ `renderOverviewTab()` runs with CORRECT state
9. ✅ `isDemoMode = false` (because hasDiagnostic, hasSnapshot, hasBlueprint all true)
10. ✅ Demo banner NOT shown

### For Superadmin (GrandMasterRCH):
- ✅ UserState loaded from backend: `{tier: "enterprise", hasDiagnostic: true, hasSnapshot: true, hasBlueprint: true, isSubscribed: true}`
- ✅ `isDemoMode = false`
- ✅ Demo banner: **NOT visible**
- ✅ Progress steps: All show ✅ (not 🔒)
- ✅ Tier display: "Enterprise"
- ✅ Credits: "2000 / 2000"

## Testing Instructions

1. **Hard Refresh**: Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Login**: Use grandmaster@aivory.ai / GrandMaster2026!
3. **Check Console**: You should see:
   ```
   ✅ app.js loaded - API_BASE_URL: http://localhost:8081
   UserStateManager: Initializing...
   UserStateManager: Set API_BASE_URL to http://localhost:8081
   USER STATE: {tier: "enterprise", hasDiagnostic: true, ...}
   renderOverviewTab - UserState: {isLoaded: true, hasDiagnostic: true, ...}
   isDemoMode: false
   ```
4. **Verify UI**:
   - ❌ No orange demo banner at top
   - ✅ Tier shows "Enterprise" (not "Free")
   - ✅ Credits show "2000 / 2000"
   - ✅ All 4 progress steps show checkmarks (not locks)

## Files Modified
1. `frontend/dashboard.js` - Fixed race condition, added re-render logic, added debug logs
2. `frontend/dashboard.html` - Bumped version to v=28

## Version
All scripts updated to `?v=28` to force browser cache refresh.

## What I Actually Fixed

**Previous Fix (v27)**: Added `app.js` to script loading order
- This fixed the `undefined` API_BASE_URL issue
- But didn't fix the demo banner

**This Fix (v28)**: Fixed the race condition
- Dashboard now waits for UserStateManager to load before rendering
- Overview tab re-renders when state updates
- Demo banner logic now sees the correct state values

---
**Status**: ✅ Fix Applied - Ready for Testing
**Date**: Context Transfer Session - Second Fix
**Critical Change**: Dashboard waits for UserStateManager before rendering tabs
