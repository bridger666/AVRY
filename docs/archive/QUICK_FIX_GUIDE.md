# Quick Fix Guide: API_BASE_URL Conflict

## 🚨 Problem
All CTA buttons broken due to JavaScript conflict: "Identifier 'API_BASE_URL' has already been declared"

## ✅ Solution Applied

### 1. Created Central Config File
```
frontend/config.js (NEW)
└── Sets window.API_BASE_URL once
```

### 2. Updated Script Load Order
```html
<!-- index.html -->
<script src="config.js?v=12"></script>        ← FIRST!
<script src="id-chain-manager.js?v=12"></script>
<script src="auth-manager.js?v=12"></script>
<script src="auth-modals.js?v=12"></script>
<script src="diagnostic-questions-paid.js?v=12"></script>
<script src="diagnostic-questions-snapshot.js?v=12"></script>
<script src="app.js?v=12"></script>
```

### 3. Removed Duplicate Declarations
```javascript
// ❌ BEFORE (in 4 files - caused conflict)
if (!window.API_BASE_URL) {
    window.API_BASE_URL = 'http://localhost:8081';
}
const API_BASE_URL = window.API_BASE_URL;

// ✅ AFTER (in 4 files - no conflict)
const API_BASE_URL = window.API_BASE_URL;
```

## 🧪 Test It

### Step 1: Clear Cache
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`

### Step 2: Open Console (F12)

### Step 3: Check Functions
```javascript
typeof startFreeDiagnostic  // Should be "function"
typeof startSnapshot        // Should be "function"
typeof startBlueprint       // Should be "function"
typeof handleSignInClick    // Should be "function"
typeof handleDashboardClick // Should be "function"
```

### Step 4: Click Buttons
- ✅ "Start free diagnostic"
- ✅ "Run AI Snapshot — $15"
- ✅ "Generate AI Blueprint — $79"
- ✅ "Sign In"
- ✅ "Dashboard"

## 📊 Expected Console Output

```
✅ Aivory Config loaded - API_BASE_URL: http://localhost:8081
✅ Page loaded
✅ startFreeDiagnostic: function
✅ startSnapshot: function
✅ startBlueprint: function
✅ showSection: function
✅ handleSignInClick: function
✅ handleDashboardClick: function
```

## 🔧 Files Changed

| File | Change |
|------|--------|
| `config.js` | ✨ NEW - Global config |
| `app.js` | 🔧 Reference global only |
| `auth-manager.js` | 🔧 Reference global only |
| `app_new.js` | 🔧 Reference global only |
| `dashboard-v2.js` | 🔧 Reference global only |
| `index.html` | 🔧 Load config.js first, v=12 |

## 🎯 Success Criteria

- [ ] No console errors
- [ ] All functions defined
- [ ] All buttons clickable
- [ ] API calls work
- [ ] No CORS errors

## 📚 Full Documentation

- Technical details: `CRITICAL_FIX_API_BASE_URL_CONFLICT.md`
- Complete summary: `FIX_COMPLETE_SUMMARY.md`
- Verification script: `frontend/verify-fix.js`

---

**Status**: ✅ FIXED
**Version**: v=12
**Cache**: MUST clear to see changes
