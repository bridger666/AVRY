# AIVORY Dashboard Structural Audit

**Date**: Current Sprint
**Status**: Sprint 0 - Assessment Complete
**Owner**: Kiro Agent

---

## Executive Summary

The AIVORY dashboard requires structural fixes before Phase 1 (AI Command Console) implementation can begin. This audit documents all broken components, missing tier logic, layout gaps, and inconsistent styling across the current dashboard implementation.

**Critical Finding**: The OS must boot properly before installing the intelligence layer.

---

## Current Dashboard State

### Existing Files
- `frontend/dashboard-subscription.html` - Tier-gated subscription dashboard (REFERENCE IMPLEMENTATION)
- `frontend/dashboard-subscription.js` - Tier detection, state management, mock workflows
- `frontend/dashboard-subscription.css` - Design system (Inter Tight 300, brand colors, card language)
- `frontend/dashboard.html` - Basic dashboard (needs consolidation)
- `frontend/dashboard.js` - Basic dashboard logic
- `frontend/dashboard.css` - Basic dashboard styles
- `frontend/index.html` - Homepage with diagnostic CTA
- `frontend/app.js` - Main application logic with diagnostic flows

### Design System (CORRECT - from dashboard-subscription.css)
```css
Font: Inter Tight, weight 300
Colors:
  - Brand Purple: #4020a5
  - Mint Green: #07d197
  - Button Purple: #3c229f
  - Card BG: rgba(255, 255, 255, 0.04)
  - Card Border: 1px solid rgba(255, 255, 255, 0.08)
Border Radius: 12px (cards), 9999px (buttons)
Transitions: 0.25s ease
```

---

## BLOCKING ISSUE #1: CTA → Dashboard Routing (BROKEN)

### Current Problem
**Severity**: 🔴 CRITICAL

**What's Broken**:
1. Users must manually open HTML files to access dashboards
2. No tier-based routing from homepage after diagnostic completion
3. Hardcoded HTML file access (unacceptable for SaaS)
4. No "Access Dashboard" CTA after diagnostic results

**Current Flow** (BROKEN):
```
Homepage → Diagnostic → Results → ??? (no clear path to dashboard)
```

**Required Flow**:
```
Homepage → Diagnostic → Results → "Access Dashboard" CTA → dashboard.html?tier={tier}
```

### Files Affected
- `frontend/app.js` - Missing `accessDashboard(tier)` function
- `frontend/index.html` - Missing "Access Dashboard" CTA after diagnostic
- `frontend/dashboard.html` - Should be unified entry point (not dashboard-subscription.html)

### Implementation Gap
```javascript
// MISSING in app.js:
function accessDashboard(tier) {
    // Validate tier
    // Route to dashboard.html?tier={tier}
    // Store tier in session
}

// MISSING in displayFreeDiagnosticResults():
// Add "Access Dashboard" button with tier parameter
```

---

## BLOCKING ISSUE #2: Tier Access Guard (MISSING)

### Current Problem
**Severity**: 🔴 CRITICAL

**What's Missing**:
1. No subscription validation before dashboard load
2. No credit validation before console load
3. Silent failures - users see broken UI instead of clear errors
4. No 403 unauthorized page

**Current Behavior**:
- Anyone can access any tier by changing URL parameter
- No backend validation of tier permissions
- No frontend guard to check subscription status

### Files Affected
- `app/api/routes/auth.py` - DOES NOT EXIST (needs creation)
- `frontend/auth-guard.js` - DOES NOT EXIST (needs creation)
- `frontend/403.html` - DOES NOT EXIST (needs creation)

### Implementation Gap
```python
# MISSING: app/api/routes/auth.py
@router.get("/api/auth/validate-tier")
async def validate_tier(tier: str):
    # Check subscription status
    # Return { authorized: bool, tier: string, credits: number }

@router.get("/api/auth/validate-credits")
async def validate_credits(required_credits: int):
    # Check credit balance
    # Return { authorized: bool, credits: number }
```

```javascript
// MISSING: frontend/auth-guard.js
function validateTierAccess(requiredTier) {
    // Call /api/auth/validate-tier
    // Redirect to 403 if unauthorized
}

function validateCreditBalance(requiredCredits) {
    // Call /api/auth/validate-credits
    // Show upgrade modal if insufficient
}
```

---

## BLOCKING ISSUE #3: Dashboard Layout (TOO BASIC)

### Current Problem
**Severity**: 🟡 MEDIUM (UX Impact)

**What's Wrong**:
1. No persistent sidebar navigation
2. Workflow preview uses basic arrows (not enterprise-grade)
3. No visual hierarchy
4. Inconsistent with subscription dashboard reference

**Current Layout** (dashboard.html):
```
┌─────────────────────────────┐
│  Top Bar (basic)            │
├─────────────────────────────┤
│                             │
│  Content (no structure)     │
│                             │
└─────────────────────────────┘
```

**Required Layout** (Enterprise-Grade):
```
┌─────────────────────────────────────────────────────────┐
│  Top Bar: Credits + Plan + SLA                          │
├──────────┬──────────────────────────────────────────────┤
│          │                                               │
│ Sidebar  │  Main Canvas                                 │
│          │                                               │
│ Overview │  Workflow Visualization (n8n-style)          │
│ Workflows│  - Nodes = blocks                            │
│ Console  │  - Connections = directional edges           │
│ Logs     │  - Multi-branch visualization                │
│ Diagnos. │  - Retry/Fail nodes visible                  │
│ Settings │                                               │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
```

### Files Affected
- `frontend/dashboard.html` - Needs complete layout restructure
- `frontend/dashboard.css` - Needs sidebar, grid system, n8n-style workflow viz
- `frontend/dashboard-layout.css` - DOES NOT EXIST (needs creation)

### Reference Implementation
- `frontend/dashboard-subscription.html` - Has correct top bar structure
- `frontend/dashboard-subscription.css` - Has correct design system
- Workflow visualization needs upgrade from arrows to SVG node graph

---

## BLOCKING ISSUE #4: Console Placement (WRONG)

### Current Problem
**Severity**: 🟡 MEDIUM (Architectural)

**What's Wrong**:
1. Spec says console is separate page `/dashboard/console`
2. Should be embedded inside dashboard (not separate)
3. No collapsible panel implementation
4. No toggle button in sidebar

**Current Spec** (INCORRECT):
```
Console Route: /dashboard/console (separate page)
```

**Required Implementation** (CORRECT):
```
Console: Embedded collapsible panel inside dashboard
- Right side or bottom dock
- Toggle button in sidebar
- Starts collapsed by default
- Matches dashboard design system
```

### Files Affected
- `.kiro/specs/ai-command-console/requirements.md` - Says "dedicated route /dashboard/console"
- `.kiro/specs/ai-command-console/design.md` - Needs update to embedded panel
- `frontend/console-panel.js` - DOES NOT EXIST (needs creation)
- `frontend/dashboard.html` - Needs console panel container

### Spec Update Required
**Before Sprint 2**, update console spec to reflect embedded panel approach:
- Remove "dedicated route /dashboard/console"
- Add "embedded collapsible panel inside dashboard"
- Update all references from separate page to embedded component

---

## BLOCKING ISSUE #5: UI Framework Consistency (BROKEN)

### Current Problem
**Severity**: 🟡 MEDIUM (UX Quality)

**What's Inconsistent**:
1. `dashboard-subscription.html` uses correct design system
2. `dashboard.html` doesn't match
3. `index.html` has different spacing/colors
4. No centralized design system CSS

**Inconsistencies Found**:

| Component | dashboard-subscription | dashboard | index |
|-----------|----------------------|-----------|-------|
| Font | Inter Tight 300 ✅ | Mixed ❌ | Mixed ❌ |
| Card BG | rgba(255,255,255,0.04) ✅ | Different ❌ | Different ❌ |
| Border Radius | 12px ✅ | Inconsistent ❌ | Inconsistent ❌ |
| Button Style | 9999px radius ✅ | Different ❌ | Different ❌ |
| Spacing | Consistent ✅ | Inconsistent ❌ | Inconsistent ❌ |

### Files Affected
- `frontend/design-system.css` - DOES NOT EXIST (needs creation)
- `frontend/index.html` - Needs design system application
- `frontend/dashboard.html` - Needs design system application
- `frontend/dashboard-v2.html` - Needs design system application

### Reference Implementation
- `frontend/dashboard-subscription.css` - CORRECT design system
- Extract CSS variables and create centralized design-system.css
- Apply to all components

---

## Sprint Execution Plan

### Sprint 0: Audit & Assessment ✅ COMPLETE
- [x] Document all 5 blocking issues
- [x] Identify affected files
- [x] List implementation gaps
- [x] Create execution roadmap

### Sprint 1: Fix 5 Structural Issues (2-3 days)
**Priority Order**:
1. 🔴 Issue #1: CTA → Dashboard Routing (CRITICAL)
2. 🔴 Issue #2: Tier Access Guard (CRITICAL)
3. 🟡 Issue #3: Dashboard Layout (MEDIUM)
4. 🟡 Issue #5: UI Framework Consistency (MEDIUM)
5. ⚪ Issue #4: Console Placement (DEFER to Sprint 2)

### Sprint 2: Embed Console Panel (1 day)
- Update console spec (requirements.md, design.md)
- Create console-panel.js (embedded component)
- Add toggle button in sidebar
- Integrate with dashboard state

### Sprint 3: Verify & Prep Phase 1 (1 day)
- Test all CTA routing
- Test tier guard enforcement
- Test layout responsiveness
- Validate credit model triggers
- Run smoke tests

---

## Files to Create (Sprint 1)

### Backend
- `app/api/routes/auth.py` - Tier and credit validation endpoints

### Frontend
- `frontend/auth-guard.js` - Client-side tier/credit validation
- `frontend/403.html` - Unauthorized access page
- `frontend/design-system.css` - Centralized design tokens
- `frontend/dashboard-layout.css` - Enterprise-grade layout system

### Frontend (Sprint 2)
- `frontend/console-panel.js` - Embedded console component

---

## Files to Update (Sprint 1)

### Frontend
- `frontend/app.js` - Add accessDashboard() function, add "Access Dashboard" CTA
- `frontend/index.html` - Add CTA after diagnostic results
- `frontend/dashboard.html` - Consolidate as unified entry point, add sidebar, upgrade layout
- `frontend/dashboard.css` - Apply design system, add n8n-style workflow viz
- `frontend/dashboard-v2.html` - Apply design system

### Backend
- `app/main.py` - Register auth routes

---

## Success Criteria

### Sprint 1 Complete When:
- ✅ All CTAs route to correct dashboard with tier parameter
- ✅ Tier guard prevents unauthorized access (403 page shown)
- ✅ Dashboard has persistent sidebar navigation
- ✅ Workflow visualization uses n8n-style node graph (not arrows)
- ✅ All components use consistent design system
- ✅ Dashboard boots properly and is fully functional

### Sprint 2 Complete When:
- ✅ Console embedded as collapsible panel inside dashboard
- ✅ Toggle button in sidebar works
- ✅ Panel starts collapsed by default
- ✅ Styling matches dashboard framework

### Sprint 3 Complete When:
- ✅ All smoke tests pass
- ✅ OS boots stable
- ✅ Credit model triggers correctly
- ✅ Ready for Phase 1 AI & agentic workflows

---

## Risk Assessment

### High Risk
- **Tier Guard Implementation**: No existing auth infrastructure
- **Dashboard Consolidation**: Multiple dashboard files need merging

### Medium Risk
- **Workflow Visualization Upgrade**: Complex SVG node graph implementation
- **Design System Application**: Many files to update

### Low Risk
- **CTA Routing**: Straightforward function addition
- **Console Embedding**: Well-defined component pattern

---

## Next Steps

**Immediate Action**: Begin Sprint 1 execution
**First Task**: Fix Issue #1 (CTA → Dashboard Routing)
**Blocker Resolution**: All 5 issues must be resolved before Phase 1

---

**Status**: 🟢 AUDIT COMPLETE - READY FOR SPRINT 1 EXECUTION
