# Frontend Consolidation & Cleanup - Design Document

## Design Overview

This design establishes a clean, minimal frontend architecture by:
1. Identifying canonical files
2. Moving/deleting variants and test files
3. Fixing script loading order to eliminate wiring errors
4. Consolidating documentation

## Canonical Architecture

### Page Structure

```
┌─────────────────────────────────────────┐
│         Landing (index.html)            │
│  - Homepage with diagnostics            │
│  - No shell, standalone                 │
└─────────────────────────────────────────┘
                    │
                    ├─ Login/Signup
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Unified Shell (app-shell.css)      │
│  ┌─────────┬──────────────────────────┐ │
│  │ Sidebar │      Main Content        │ │
│  │         │                          │ │
│  │ Console │  ┌────────────────────┐  │ │
│  │ Overview│  │  console-unified   │  │ │
│  │Workflows│  │  dashboard         │  │ │
│  │  Logs   │  │  workflows         │  │ │
│  │Settings │  │  logs              │  │ │
│  │         │  │  settings          │  │ │
│  └─────────┴──┴────────────────────┴──┘ │
└─────────────────────────────────────────┘
```

### File Responsibilities

#### 1. Console System

**console-unified.html** (CANONICAL)
- Full page with unified shell
- Loads ARIA agent
- Handles console UI

**console-unified.css** (CANONICAL)
- Console-specific styles
- Chat interface styling
- Message bubbles, input area

**console-aria.js** (CANONICAL)
- Exposes `window.ARIAAgent` object
- Implements ARIA protocol
- Handles multilingual behavior
- Must load BEFORE any code that uses it

```javascript
// console-aria.js structure
window.ARIAAgent = {
    initConsole: function(config) { ... },
    sendMessage: function(message) { ... },
    // ... other methods
};
```

#### 2. Dashboard System

**dashboard.html** (CANONICAL)
- Full page with unified shell
- Loads dashboard logic
- Tab navigation (Overview, Diagnostic, Snapshot, Blueprint)

**dashboard.css** (CANONICAL)
- Dashboard-specific styles
- Card styling
- Tab styling

**dashboard.js** (CANONICAL)
- Defines `initDashboard()` function
- Handles tab switching
- Renders dashboard content
- Must load BEFORE inline script that calls it

```javascript
// dashboard.js structure
async function initDashboard() { ... }
function switchTab(tabName) { ... }
function renderOverviewTab() { ... }
// ... other functions
```

#### 3. Shared Shell

**app-shell.css** (CANONICAL)
- Sidebar navigation
- Topbar/header
- Layout grid
- Shared across all authenticated pages

#### 4. Shared JavaScript Modules

**auth-manager.js**
- Exposes `window.AuthManager`
- Handles login/logout
- Session management

**user-state-manager.js**
- Exposes `window.UserStateManager`
- Manages user state
- Tier, credits, etc.

**tier-sync.js**
- Syncs tier across pages
- Updates UI elements

**id-chain-manager.js**
- Manages diagnostic/snapshot/blueprint IDs
- Data handoff between flows

## Script Loading Order (Critical)

### Console Page (console-unified.html)

```html
<!-- Load dependencies FIRST -->
<script src="auth-manager.js"></script>
<script src="user-state-manager.js"></script>
<script src="tier-sync.js"></script>

<!-- Load ARIA agent BEFORE anything uses it -->
<script src="console-aria.js"></script>

<!-- Then load console UI logic -->
<script src="console-streaming.js"></script>

<!-- THEN inline initialization -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        // ARIAAgent is now defined
        ARIAAgent.initConsole({ ... });
    });
</script>
```

### Dashboard Page (dashboard.html)

```html
<!-- Load dependencies FIRST -->
<script src="auth-manager.js"></script>
<script src="user-state-manager.js"></script>
<script src="tier-sync.js"></script>
<script src="id-chain-manager.js"></script>
<script src="auth-guard.js"></script>

<!-- Load dashboard logic BEFORE calling it -->
<script src="dashboard.js"></script>

<!-- THEN inline initialization -->
<script>
    document.addEventListener('DOMContentLoaded', async () => {
        const authorized = await guardDashboardAccess();
        if (authorized) {
            // initDashboard is now defined
            initDashboard();
        }
    });
</script>
```

## Migration Strategy

### Phase 1: Create Legacy Folder
1. Create `frontend/legacy/` directory
2. Create `docs/archive/` directory

### Phase 2: Move HTML Variants
Move these files to `frontend/legacy/`:
- All `*-test.html` files
- All `*-premium.html` files (except console-unified)
- All `debug-*.html` files
- Old `console.html` (if different from console-unified)
- `dashboard-subscription.html`
- `console-integration-example.html`
- `console-layout-test.html`

### Phase 3: Move CSS Variants
Move these files to `frontend/legacy/`:
- `console-premium.css`
- `console-layout-refactor.css`
- `dashboard-premium.css`
- `dashboard-v2.css`
- `dashboard-subscription.css`
- Any other `-v2`, `-premium`, `-test` CSS files

### Phase 4: Move JS Variants
Move these files to `frontend/legacy/`:
- `console-premium.js`
- `dashboard-v2.js`
- `dashboard-subscription.js`
- `app_new.js`
- Any other `-v2`, `-premium`, `-test` JS files

### Phase 5: Fix Console Wiring
In `console-unified.html`:
1. Ensure `console-aria.js` loads FIRST
2. Ensure inline script runs AFTER DOM loaded
3. Verify `window.ARIAAgent` is defined before use

### Phase 6: Fix Dashboard Wiring
In `dashboard.html`:
1. Ensure `dashboard.js` loads BEFORE inline script
2. Ensure inline script runs AFTER DOM loaded
3. Verify `initDashboard` is defined before calling

### Phase 7: Consolidate Documentation
Move to `docs/archive/`:
- All `*_COMPLETE.md` files
- All `*_SUMMARY.md` files
- All `PHASE_*.md` files
- All `*_GUIDE.md` files (except README)
- All `QUICK_*.md` files
- All `BEFORE_AFTER_*.md` files
- All `*_FIX_*.md` files

Keep in root:
- `README.md` (main project readme)
- `ARCHITECTURE.md` (NEW - consolidated architecture doc)
- `DEPLOYMENT.md` (NEW - deployment instructions)

### Phase 8: Create Consolidated Docs

**ARCHITECTURE.md** (NEW)
```markdown
# Aivory Architecture

## Frontend Structure
- Landing: index.html
- Console: console-unified.html
- Dashboard: dashboard.html
- Workflows: workflows.html
- Logs: logs.html
- Settings: settings.html

## Key Components
- ARIA Agent: console-aria.js
- Auth: auth-manager.js
- User State: user-state-manager.js

## Backend
- FastAPI server
- Supabase database
- OpenRouter LLM integration
```

**DEPLOYMENT.md** (NEW)
```markdown
# Deployment Guide

## Local Development
1. Start backend: `uvicorn app.main:app --reload`
2. Serve frontend: `python -m http.server 8000`
3. Open: http://localhost:8000

## Production
[Deployment steps]
```

## Correctness Properties

### Property 1: No Undefined Function Errors
**Specification**: All JavaScript functions must be defined before they are called

**Test Strategy**: Load each page and check browser console

**Validation**:
- Console page: No `ARIAAgent is not defined`
- Dashboard page: No `initDashboard is not defined`
- All pages: No `function not found` errors

### Property 2: Single Canonical File Per Type
**Specification**: Each page type has exactly one canonical HTML/CSS/JS file

**Test Strategy**: File system audit

**Validation**:
- Only one console HTML in use
- Only one dashboard HTML in use
- All variants in `legacy/` folder

### Property 3: Consistent Shell Across Pages
**Specification**: All authenticated pages use same shell/sidebar

**Test Strategy**: Visual inspection

**Validation**:
- Console, dashboard, workflows, logs, settings all have same sidebar
- Same topbar across all pages
- Same navigation behavior

### Property 4: Documentation Accuracy
**Specification**: Remaining docs describe current implementation

**Test Strategy**: Manual review

**Validation**:
- No references to deleted files
- No contradictory information
- Clear, accurate descriptions

## Testing Framework

**Framework**: Manual browser testing + file system audit

**Test Procedure**:
1. Load console-unified.html → Check for JS errors
2. Load dashboard.html → Check for JS errors
3. Navigate between pages → Check consistency
4. Verify file structure matches canonical design
5. Review remaining documentation for accuracy

## Rollback Plan

If issues arise:
1. Files are in `legacy/` folder, not deleted
2. Can restore any file if needed
3. Git history preserves all changes
4. No data loss, only file reorganization

## Design Decisions

### Why Move Instead of Delete?
- **Reason**: Preserve history, allow rollback if needed
- **Solution**: `legacy/` folder clearly marked as old

### Why Consolidate Docs?
- **Reason**: 100+ .md files create noise and confusion
- **Solution**: Archive old docs, keep 3 canonical files

### Why Fix Script Order?
- **Reason**: JavaScript errors break functionality
- **Solution**: Load dependencies before code that uses them

### Why Unified Shell?
- **Reason**: Consistent UX, easier maintenance
- **Solution**: All pages use `app-shell.css`
