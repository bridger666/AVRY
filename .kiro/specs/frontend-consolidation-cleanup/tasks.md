# Frontend Consolidation & Cleanup - Implementation Tasks

## Phase 1: Create Archive Folders

### Task 1.1: Create Legacy Frontend Folder
**Status**: [x]  
**Description**: Create folder for old frontend variants

**Details**:
- Create `frontend/legacy/` directory
- Add `frontend/legacy/README.md` with note: "Old/experimental files. Not part of canonical implementation."

**Acceptance Criteria**:
- `frontend/legacy/` folder exists
- README explains purpose

### Task 1.2: Create Documentation Archive Folder
**Status**: [x]  
**Description**: Create folder for old documentation

**Details**:
- Create `docs/` directory if not exists
- Create `docs/archive/` subdirectory
- Add `docs/archive/README.md` with note: "Historical documentation. See root README.md for current docs."

**Acceptance Criteria**:
- `docs/archive/` folder exists
- README explains purpose

## Phase 2: Move HTML Variants

### Task 2.1: Move Test HTML Files
**Status**: [x]  
**Description**: Move all test HTML files to legacy folder

**Details**:
Move these files from `frontend/` to `frontend/legacy/`:
- `test-console-aria.html`
- `test-auth-flow.html`
- `test-id-chain.html`
- `test-blueprint-dashboard.html`
- `test-api-connection.html`
- `button-test.html`
- `cache-test.html`
- `workflow-preview-test.html`
- `console-layout-test.html`
- `dashboard-test.html`
- Any other `test-*.html` files

**Acceptance Criteria**:
- All test HTML files moved to legacy/
- No test files in main frontend/

### Task 2.2: Move Debug HTML Files
**Status**: [x]  
**Description**: Move all debug HTML files to legacy folder

**Details**:
Move these files from `frontend/` to `frontend/legacy/`:
- `debug-user-state.html`
- `debug-clicks.html`
- Any other `debug-*.html` files

**Acceptance Criteria**:
- All debug HTML files moved to legacy/
- No debug files in main frontend/

### Task 2.3: Move Console Variants
**Status**: [x]  
**Description**: Move old console variants to legacy folder

**Details**:
Move these files from `frontend/` to `frontend/legacy/`:
- `console.html` (if different from console-unified.html)
- `console-premium.html`
- `console-integration-example.html`

**Keep in frontend/**:
- `console-unified.html` (CANONICAL)

**Acceptance Criteria**:
- Only `console-unified.html` remains in frontend/
- Old console variants in legacy/

### Task 2.4: Move Dashboard Variants
**Status**: [x]  
**Description**: Move old dashboard variants to legacy folder

**Details**:
Move these files from `frontend/` to `frontend/legacy/`:
- `dashboard-subscription.html`
- Any other dashboard-*.html except dashboard.html

**Keep in frontend/**:
- `dashboard.html` (CANONICAL)

**Acceptance Criteria**:
- Only `dashboard.html` remains in frontend/
- Old dashboard variants in legacy/

## Phase 3: Move CSS Variants

### Task 3.1: Move Console CSS Variants
**Status**: [x]  
**Description**: Move old console CSS files to legacy folder

**Details**:
Move these files from `frontend/` to `frontend/legacy/`:
- `console-premium.css`
- `console-layout-refactor.css`
- Any other console-*.css except console-unified.css

**Keep in frontend/**:
- `console-unified.css` (CANONICAL)

**Acceptance Criteria**:
- Only `console-unified.css` remains in frontend/
- Old console CSS in legacy/

### Task 3.2: Move Dashboard CSS Variants
**Status**: [x]  
**Description**: Move old dashboard CSS files to legacy folder

**Details**:
Move these files from `frontend/` to `frontend/legacy/`:
- `dashboard-premium.css`
- `dashboard-v2.css`
- `dashboard-subscription.css`
- `dashboard-layout.css` (if not used)
- `design-system.css` (if not used)
- Any other dashboard-*.css except dashboard.css

**Keep in frontend/**:
- `dashboard.css` (CANONICAL)

**Acceptance Criteria**:
- Only `dashboard.css` remains in frontend/
- Old dashboard CSS in legacy/

## Phase 4: Move JS Variants

### Task 4.1: Move Console JS Variants
**Status**: [x]  
**Description**: Move old console JS files to legacy folder

**Details**:
Move these files from `frontend/` to `frontend/legacy/`:
- `console-premium.js`
- Any other console-*.js except console-aria.js and console-streaming.js

**Keep in frontend/**:
- `console-aria.js` (CANONICAL ARIA agent)
- `console-streaming.js` (if used)

**Acceptance Criteria**:
- Only canonical console JS remains in frontend/
- Old console JS in legacy/

### Task 4.2: Move Dashboard JS Variants
**Status**: [x]  
**Description**: Move old dashboard JS files to legacy folder

**Details**:
Move these files from `frontend/` to `frontend/legacy/`:
- `dashboard-v2.js`
- `dashboard-subscription.js`
- Any other dashboard-*.js except dashboard.js

**Keep in frontend/**:
- `dashboard.js` (CANONICAL)

**Acceptance Criteria**:
- Only `dashboard.js` remains in frontend/
- Old dashboard JS in legacy/

### Task 4.3: Move Other JS Variants
**Status**: [x]  
**Description**: Move miscellaneous old JS files to legacy folder

**Details**:
Move these files from `frontend/` to `frontend/legacy/`:
- `app_new.js`
- Any other `*-v2.js`, `*-test.js`, `*-old.js` files

**Keep in frontend/**:
- `app.js` (if used)
- All canonical JS modules (auth-manager.js, user-state-manager.js, etc.)

**Acceptance Criteria**:
- Only canonical JS files remain in frontend/
- Old JS variants in legacy/

## Phase 5: Fix Console Wiring

### Task 5.1: Fix console-unified.html Script Loading
**Status**: [x]  
**Description**: Ensure console-aria.js loads before any code uses ARIAAgent

**Details**:
- Open `frontend/console-unified.html`
- Verify script loading order:
  1. `auth-manager.js`
  2. `user-state-manager.js`
  3. `tier-sync.js`
  4. `console-aria.js` ← MUST load before inline script
  5. `console-streaming.js` (if used)
  6. Inline `<script>` that calls `ARIAAgent.initConsole()`
- Ensure inline script wraps in `DOMContentLoaded` event
- Verify `window.ARIAAgent` is defined before use

**Acceptance Criteria**:
- `console-aria.js` loads before inline script
- No `ARIAAgent is not defined` errors
- Console initializes correctly

### Task 5.2: Verify console-aria.js Exports
**Status**: [x]  
**Description**: Ensure console-aria.js properly exposes window.ARIAAgent

**Details**:
- Open `frontend/console-aria.js`
- Verify it defines `window.ARIAAgent = { ... }`
- Verify it exports `initConsole()`, `sendMessage()`, and other methods
- Ensure no syntax errors

**Acceptance Criteria**:
- `window.ARIAAgent` object is defined
- All required methods are exposed
- No JavaScript errors in file

## Phase 6: Fix Dashboard Wiring

### Task 6.1: Fix dashboard.html Script Loading
**Status**: [x]  
**Description**: Ensure dashboard.js loads before any code calls initDashboard

**Details**:
- Open `frontend/dashboard.html`
- Verify script loading order:
  1. `app.js` (if needed)
  2. `user-state-manager.js`
  3. `workflow-alert.js` (if needed)
  4. `id-chain-manager.js`
  5. `auth-manager.js`
  6. `auth-modals.js`
  7. `sidebar-toggle.js` (if needed)
  8. `auth-guard.js`
  9. `tier-sync.js`
  10. `dashboard.js` ← MUST load before inline script
  11. Inline `<script>` that calls `initDashboard()`
- Ensure inline script wraps in `DOMContentLoaded` event
- Verify `initDashboard` is defined before calling

**Acceptance Criteria**:
- `dashboard.js` loads before inline script
- No `initDashboard is not defined` errors
- Dashboard initializes correctly

### Task 6.2: Verify dashboard.js Exports
**Status**: [x]  
**Description**: Ensure dashboard.js properly defines initDashboard function

**Details**:
- Open `frontend/dashboard.js`
- Verify `async function initDashboard()` is defined
- Verify `function switchTab()` is defined
- Verify all render functions are defined
- Ensure no syntax errors

**Acceptance Criteria**:
- `initDashboard()` function is defined
- All required functions are defined
- No JavaScript errors in file

## Phase 7: Verify Other Pages

### Task 7.1: Verify workflows.html
**Status**: [x]  
**Description**: Ensure workflows page uses unified shell and has no errors

**Details**:
- Open `frontend/workflows.html`
- Verify it uses `app-shell.css`
- Verify sidebar matches other pages
- Check for JavaScript errors in console
- Verify page loads correctly

**Acceptance Criteria**:
- Uses unified shell
- No JavaScript errors
- Page loads and functions correctly

### Task 7.2: Verify logs.html
**Status**: [x]  
**Description**: Ensure logs page uses unified shell and has no errors

**Details**:
- Open `frontend/logs.html`
- Verify it uses `app-shell.css`
- Verify sidebar matches other pages
- Check for JavaScript errors in console
- Verify page loads correctly

**Acceptance Criteria**:
- Uses unified shell
- No JavaScript errors
- Page loads and functions correctly

### Task 7.3: Verify settings.html
**Status**: [x]  
**Description**: Ensure settings page uses unified shell and has no errors

**Details**:
- Open `frontend/settings.html`
- Verify it uses `app-shell.css`
- Verify sidebar matches other pages
- Check for JavaScript errors in console
- Verify page loads correctly

**Acceptance Criteria**:
- Uses unified shell
- No JavaScript errors
- Page loads and functions correctly

## Phase 8: Documentation Cleanup

### Task 8.1: Move Completion Docs
**Status**: [x]  
**Description**: Move all *_COMPLETE.md files to archive

**Details**:
Move these files from root to `docs/archive/`:
- All `*_COMPLETE.md` files
- All `*_DEPLOYED.md` files
- All `*_READY.md` files

**Acceptance Criteria**:
- No `*_COMPLETE.md` files in root
- All moved to docs/archive/

### Task 8.2: Move Summary Docs
**Status**: [x]  
**Description**: Move all *_SUMMARY.md files to archive

**Details**:
Move these files from root to `docs/archive/`:
- All `*_SUMMARY.md` files
- All `*_INDEX.md` files

**Acceptance Criteria**:
- No `*_SUMMARY.md` files in root
- All moved to docs/archive/

### Task 8.3: Move Phase Docs
**Status**: [x]  
**Description**: Move all PHASE_*.md files to archive

**Details**:
Move these files from root to `docs/archive/`:
- All `PHASE_*.md` files
- All `SPRINT_*.md` files

**Acceptance Criteria**:
- No `PHASE_*.md` files in root
- All moved to docs/archive/

### Task 8.4: Move Guide Docs
**Status**: [x]  
**Description**: Move all guide/tutorial docs to archive

**Details**:
Move these files from root to `docs/archive/`:
- All `*_GUIDE.md` files (except README)
- All `QUICK_*.md` files
- All `*_REFERENCE.md` files
- All `BEFORE_AFTER_*.md` files
- All `*_VISUAL_*.md` files

**Acceptance Criteria**:
- No guide docs in root (except README)
- All moved to docs/archive/

### Task 8.5: Move Fix Docs
**Status**: [x]  
**Description**: Move all fix/debug docs to archive

**Details**:
Move these files from root to `docs/archive/`:
- All `*_FIX_*.md` files
- All `*_ERROR_*.md` files
- All `*_DEBUG_*.md` files
- All `*_ISSUE_*.md` files

**Acceptance Criteria**:
- No fix docs in root
- All moved to docs/archive/

### Task 8.6: Move Spec Docs
**Status**: [x]  
**Description**: Move all spec/implementation docs to archive

**Details**:
Move these files from root to `docs/archive/`:
- All `*_SPEC.md` files (except those in .kiro/specs/)
- All `*_IMPLEMENTATION_*.md` files
- All `*_INTEGRATION_*.md` files

**Acceptance Criteria**:
- No spec docs in root
- All moved to docs/archive/

### Task 8.7: Move Test Docs
**Status**: [x]  
**Description**: Move all test/verification docs to archive

**Details**:
Move these files from root to `docs/archive/`:
- All `*_TEST_*.md` files
- All `*_TESTING_*.md` files
- All `*_VERIFICATION_*.md` files
- All `*_AUDIT_*.md` files

**Acceptance Criteria**:
- No test docs in root
- All moved to docs/archive/

## Phase 9: Create Consolidated Documentation

### Task 9.1: Create ARCHITECTURE.md
**Status**: [x]  
**Description**: Create consolidated architecture document

**Details**:
- Create `ARCHITECTURE.md` in root
- Document:
  - Frontend structure (canonical files)
  - Backend structure
  - Key components (ARIA, Auth, User State)
  - Data flow
  - Integration points
- Keep concise (1-2 pages max)

**Acceptance Criteria**:
- `ARCHITECTURE.md` exists in root
- Accurately describes current system
- Clear and concise

### Task 9.2: Create DEPLOYMENT.md
**Status**: [x]  
**Description**: Create consolidated deployment guide

**Details**:
- Create `DEPLOYMENT.md` in root
- Document:
  - Local development setup
  - Environment variables
  - Running backend
  - Running frontend
  - Production deployment
- Keep concise (1-2 pages max)

**Acceptance Criteria**:
- `DEPLOYMENT.md` exists in root
- Clear step-by-step instructions
- Accurate for current setup

### Task 9.3: Update Root README.md
**Status**: [x]  
**Description**: Update main README to reflect current state

**Details**:
- Open `README.md` in root
- Update to describe:
  - What Aivory is
  - Quick start (link to DEPLOYMENT.md)
  - Architecture (link to ARCHITECTURE.md)
  - Key features
- Remove outdated information
- Keep concise (1 page max)

**Acceptance Criteria**:
- README.md is up to date
- Links to ARCHITECTURE.md and DEPLOYMENT.md
- No outdated information

### Task 9.4: Update Frontend README.md
**Status**: [x]  
**Description**: Update frontend README to describe canonical files

**Details**:
- Open `frontend/README.md`
- Document:
  - Canonical file structure
  - Purpose of each file
  - Script loading order
  - How to add new pages
- Remove outdated information

**Acceptance Criteria**:
- Frontend README is up to date
- Describes canonical files
- Clear and accurate

## Phase 10: Final Verification

### Task 10.1: Test Console Page
**Status**: [x]  
**Description**: Verify console page works without errors

**Details**:
- Open browser to `console-unified.html`
- Open browser console (F12)
- Verify no JavaScript errors
- Verify ARIA agent loads
- Send test message
- Verify response works

**Acceptance Criteria**:
- No `ARIAAgent is not defined` errors
- No other JavaScript errors
- Console functions correctly

### Task 10.2: Test Dashboard Page
**Status**: [x]  
**Description**: Verify dashboard page works without errors

**Details**:
- Open browser to `dashboard.html`
- Open browser console (F12)
- Verify no JavaScript errors
- Verify dashboard loads
- Click through all tabs (Overview, Diagnostic, Snapshot, Blueprint)
- Verify all tabs render correctly

**Acceptance Criteria**:
- No `initDashboard is not defined` errors
- No other JavaScript errors
- Dashboard functions correctly
- All tabs work

### Task 10.3: Test Navigation Between Pages
**Status**: [x]  
**Description**: Verify navigation works across all pages

**Details**:
- Start at dashboard
- Click Console in sidebar → verify loads
- Click Overview in sidebar → verify loads
- Click Workflows in sidebar → verify loads
- Click Logs in sidebar → verify loads
- Click Settings in sidebar → verify loads
- Verify consistent shell/sidebar across all pages

**Acceptance Criteria**:
- All pages load correctly
- Consistent shell across pages
- No navigation errors

### Task 10.4: Verify File Structure
**Status**: [x]  
**Description**: Audit file structure matches canonical design

**Details**:
- Check `frontend/` directory
- Verify only canonical files present:
  - `index.html`
  - `console-unified.html`
  - `dashboard.html`
  - `workflows.html`
  - `logs.html`
  - `settings.html`
  - Canonical CSS files
  - Canonical JS files
- Verify `frontend/legacy/` contains old files
- Verify `docs/archive/` contains old docs

**Acceptance Criteria**:
- Only canonical files in frontend/
- Old files in legacy/
- Old docs in docs/archive/

### Task 10.5: Verify Documentation
**Status**: [x]  
**Description**: Verify documentation is accurate and minimal

**Details**:
- Check root directory
- Verify only these .md files present:
  - `README.md`
  - `ARCHITECTURE.md`
  - `DEPLOYMENT.md`
- Verify `docs/archive/` contains all old docs
- Read each canonical doc
- Verify accuracy

**Acceptance Criteria**:
- Only 3 .md files in root
- All docs are accurate
- No contradictory information

## Phase 11: Create Summary Document

### Task 11.1: Create CONSOLIDATION_COMPLETE.md
**Status**: [x]  
**Description**: Document what was done and final state

**Details**:
- Create `CONSOLIDATION_COMPLETE.md` in root
- Document:
  - What was consolidated
  - Files moved to legacy/
  - Docs moved to archive/
  - Wiring fixes applied
  - Final canonical file structure
  - How to use the system
- This will be the ONLY summary doc in root

**Acceptance Criteria**:
- Summary document created
- Comprehensive record of changes
- Clear final state description
