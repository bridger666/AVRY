# Frontend Consolidation & Cleanup - Requirements

## Overview
Eliminate duplicate/variant frontend files, fix wiring errors (ARIAAgent, initDashboard), and establish a small set of canonical files that provide a stable, maintainable foundation.

## Problem Statement
The frontend has accumulated multiple competing implementations:
- Multiple console variants (console.html, console-premium.html, console-unified.html)
- Multiple dashboard variants (dashboard.html, dashboard-subscription.html, dashboard-test.html)
- Duplicate JS/CSS files with conflicting logic
- Broken wiring: `ARIAAgent is not defined`, `initDashboard is not defined`
- Hundreds of outdated .md documentation files creating noise

Backend/auth works correctly. The instability is purely frontend file proliferation and wiring issues.

## User Stories

### 1. Single Console Entry Point
**As a** developer  
**I want** one canonical console file  
**So that** there's no confusion about which file to use or maintain

**Acceptance Criteria:**
- One console HTML file: `console-unified.html` (canonical)
- One console CSS file: `console-unified.css` (canonical)
- One ARIA agent JS: `console-aria.js` (canonical, exposes `window.ARIAAgent`)
- No `ARIAAgent is not defined` errors
- Old variants moved to `frontend/legacy/` or deleted

### 2. Single Dashboard Entry Point
**As a** developer  
**I want** one canonical dashboard file  
**So that** there's no confusion about which file to use or maintain

**Acceptance Criteria:**
- One dashboard HTML file: `dashboard.html` (canonical)
- One dashboard CSS file: `dashboard.css` (canonical)
- One dashboard JS file: `dashboard.js` (canonical, defines `initDashboard()`)
- No `initDashboard is not defined` errors
- Old variants moved to `frontend/legacy/` or deleted

### 3. Unified Shell Across All Pages
**As a** user  
**I want** consistent navigation and layout  
**So that** console, dashboard, workflows, logs, and settings feel like one app

**Acceptance Criteria:**
- All pages use same sidebar from `app-shell.css`
- All pages share same header/topbar
- No separate mini-shells or different layouts per page
- Consistent premium console look across all pages

### 4. Clean Documentation
**As a** developer  
**I want** minimal, accurate documentation  
**So that** I can understand the system without wading through outdated notes

**Acceptance Criteria:**
- Maximum 5 canonical .md files in root/frontend
- All other .md files moved to `docs/archive/` or deleted
- Remaining docs accurately describe current implementation
- No contradictory information

### 5. No JavaScript Wiring Errors
**As a** user  
**I want** pages to load without console errors  
**So that** the application works reliably

**Acceptance Criteria:**
- No `ARIAAgent is not defined` errors
- No `initDashboard is not defined` errors
- No `function not found` errors
- All script dependencies loaded in correct order

## Technical Constraints

1. **Backend Unchanged**: Do not modify backend/auth (already working)
2. **Preserve Functionality**: All current features must continue working
3. **No New Variants**: Delete/consolidate, don't create new files
4. **Git History**: Use git for history, not filename variants

## Canonical File Structure (Target)

```
frontend/
├── index.html                    # Landing page (keep as-is)
├── console-unified.html          # CANONICAL console
├── dashboard.html                # CANONICAL dashboard
├── workflows.html                # Workflows page
├── logs.html                     # Logs page
├── settings.html                 # Settings page
│
├── app-shell.css                 # CANONICAL shell/layout
├── console-unified.css           # CANONICAL console styles
├── dashboard.css                 # CANONICAL dashboard styles
├── auth-modals.css               # Auth modal styles
│
├── console-aria.js               # CANONICAL ARIA agent (exposes window.ARIAAgent)
├── dashboard.js                  # CANONICAL dashboard logic (defines initDashboard)
├── auth-manager.js               # Auth logic
├── user-state-manager.js         # User state
├── tier-sync.js                  # Tier sync
├── id-chain-manager.js           # ID chain
│
├── legacy/                       # OLD FILES MOVED HERE
│   ├── console.html
│   ├── console-premium.html
│   ├── dashboard-subscription.html
│   ├── dashboard-test.html
│   └── ...
│
└── README.md                     # ONLY canonical doc in frontend/
```

```
root/
├── README.md                     # Main project readme
├── ARCHITECTURE.md               # System architecture (NEW, consolidated)
├── DEPLOYMENT.md                 # Deployment guide (NEW, consolidated)
│
└── docs/
    └── archive/                  # ALL OLD .md FILES MOVED HERE
        ├── CONSOLE_PREMIUM_COMPLETE.md
        ├── DASHBOARD_REDESIGN_PHASE1_COMPLETE.md
        └── ... (hundreds of old docs)
```

## Files to Delete/Move

### HTML Variants (move to frontend/legacy/)
- `console.html` (old version)
- `console-premium.html` (variant)
- `console-layout-test.html` (test file)
- `console-integration-example.html` (example)
- `dashboard-subscription.html` (variant)
- `dashboard-test.html` (test file)
- `test-*.html` (all test files)
- `debug-*.html` (all debug files)
- `button-test.html`, `cache-test.html`, etc.

### CSS Variants (move to frontend/legacy/)
- `console-premium.css` (variant)
- `console-layout-refactor.css` (variant)
- `dashboard-premium.css` (variant)
- `dashboard-v2.css` (variant)
- `dashboard-subscription.css` (variant)
- `dashboard-layout.css` (if not used)
- `design-system.css` (if not used)

### JS Variants (move to frontend/legacy/)
- `console-premium.js` (variant)
- `dashboard-v2.js` (variant)
- `dashboard-subscription.js` (variant)
- `app_new.js` (variant)

### Documentation (move to docs/archive/)
- All `CONSOLE_*_COMPLETE.md` files
- All `DASHBOARD_*_COMPLETE.md` files
- All `PHASE_*_COMPLETE.md` files
- All `*_FIX_COMPLETE.md` files
- All `*_SUMMARY.md` files
- All `*_GUIDE.md` files (except main README)
- All `QUICK_*.md` files
- All `BEFORE_AFTER_*.md` files

## Success Metrics

1. **File Count Reduction**: Frontend HTML files reduced from ~20 to ~6
2. **No Console Errors**: Zero JavaScript errors on page load
3. **Documentation Clarity**: Root .md files reduced from ~100 to ~3
4. **Single Source of Truth**: Each page type has exactly one canonical file
5. **Consistent UX**: All pages use same shell and styling

## Out of Scope

- Backend changes
- New features
- Visual redesigns
- Performance optimization
