# Deprecated Frontend Files

This document lists files that are no longer part of the canonical Aivory frontend and should be considered legacy or test files.

## Deprecated Console Files

### console-premium.html
- **Status**: DEPRECATED
- **Reason**: Standalone test file, functionality merged into `console.html`
- **Replacement**: Use `console.html` (canonical)
- **Action**: Can be removed after production verification

### console-premium.js
- **Status**: DEPRECATED  
- **Reason**: Duplicate of `console.js`
- **Replacement**: Use `console.js` (canonical)
- **Action**: Can be removed after production verification

### console-layout-refactor.css
- **Status**: DEPRECATED
- **Reason**: Old theme, replaced by warm gray design
- **Replacement**: Use `console-premium.css` (canonical)
- **Action**: Can be removed after production verification

### console-layout-test.html
- **Status**: TEST FILE
- **Reason**: Used for testing layout changes
- **Action**: Keep for debugging, not for production

## Deprecated Dashboard Files

### dashboard-v2.html
- **Status**: DEPRECATED
- **Reason**: Old dashboard variant
- **Replacement**: Use `dashboard.html` (canonical)
- **Action**: Can be removed after production verification

### dashboard-test.html
- **Status**: TEST FILE
- **Reason**: Used for testing dashboard features
- **Action**: Keep for debugging, not for production

### dashboard-subscription.html
- **Status**: LEGACY
- **Reason**: Separate subscription page, may be integrated into main dashboard
- **Action**: Review for integration or keep as separate page

## Test Files (Keep for Debugging)

These files are useful for testing and debugging:
- `console-layout-test.html`
- `dashboard-test.html`
- `test-auth-flow.html`
- `test-api-connection.html`
- `test-id-chain.html`
- `test-blueprint-dashboard.html`
- `button-test.html`
- `debug-clicks.html`
- `debug-user-state.html`
- `login-test-direct.html`
- `cache-test.html`
- `workflow-preview-test.html`

## Canonical Files (Production)

### Main Entry Points
- `index.html` - Landing page
- `dashboard.html` - Main dashboard (authenticated)
- `console.html` - AI Console (authenticated)
- `workflows.html` - Workflows page
- `logs.html` - Logs page

### Styles
- `console-premium.css` - Console warm gray theme
- `dashboard.css` - Dashboard styles
- `dashboard-layout.css` - Dashboard layout
- `design-system.css` - Design system tokens
- `styles.css` - Global styles
- `auth-modals.css` - Authentication modals

### Scripts
- `console.js` - Console functionality
- `dashboard.js` - Dashboard functionality
- `app.js` - Main application logic
- `auth-manager.js` - Authentication
- `tier-sync.js` - Tier synchronization
- `workflow-preview.js` - Workflow preview
- `console-streaming.js` - Console streaming

### Assets
- `Aivory_console_pic.svg` - Aivory logo/avatar (canonical)
- `aivory_logo.png` - Aivory brand logo

## Cleanup Recommendations

### Phase 1: Mark as Deprecated (Done)
- Add deprecation notices to files
- Update documentation

### Phase 2: Verify Production (In Progress)
- Test canonical files in production
- Confirm all features work
- Monitor for issues

### Phase 3: Remove Deprecated Files (Future)
- After 30 days of stable production
- Remove deprecated files
- Update build scripts if needed

## Migration Guide

### For Developers

If you're working with old code that references deprecated files:

1. **console-premium.html** → Use `console.html`
2. **console-premium.js** → Use `console.js`
3. **console-layout-refactor.css** → Use `console-premium.css`
4. **dashboard-v2.html** → Use `dashboard.html`

### For Links/Navigation

Update any hardcoded links:
- `/console-premium.html` → `/console.html`
- `/dashboard-v2.html` → `/dashboard.html`

---

**Last Updated**: February 28, 2026
**Maintained By**: Aivory Development Team
