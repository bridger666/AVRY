# Aivory Frontend

Canonical frontend implementation with unified shell design.

## File Structure

### Main Pages

- `index.html` - Landing page (standalone design)
- `console-unified.html` - AI Console with ARIA agent
- `dashboard.html` - Dashboard with tabs (Overview, Diagnostic, Snapshot, Blueprint)
- `workflows.html` - Workflow management
- `logs.html` - Execution logs
- `settings.html` - User settings

### Styles

- `app-shell.css` - **CANONICAL** unified shell and sidebar (used by all pages except index)
- `console-unified.css` - Console-specific styles
- `dashboard.css` - Dashboard-specific styles
- `styles.css` - Landing page styles

### Core JavaScript Modules

- `console-aria.js` - **CANONICAL** ARIA AI agent (exposes `window.ARIAAgent`)
- `dashboard.js` - **CANONICAL** dashboard logic (defines `initDashboard()`)
- `auth-manager.js` - Authentication system
- `user-state-manager.js` - User state management
- `id-chain-manager.js` - ID chain tracking
- `tier-sync.js` - Tier synchronization
- `auth-guard.js` - Dashboard access guard
- `auth-modals.js` - Login/signup modals

### Legacy Files

- `legacy/` - Old/experimental files not part of canonical implementation

## Script Loading Order

### Console (console-unified.html)

```html
<!-- Load ARIA agent FIRST -->
<script src="console-aria.js"></script>

<!-- Then inline script that uses ARIAAgent -->
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const ariaAgent = new ARIAAgent({ ... });
    await ariaAgent.initialize();
  });
</script>
```

### Dashboard (dashboard.html)

```html
<!-- Load dependencies -->
<script src="app.js"></script>
<script src="user-state-manager.js"></script>
<script src="auth-manager.js"></script>
<script src="auth-guard.js"></script>
<script src="tier-sync.js"></script>

<!-- Load dashboard.js BEFORE inline script -->
<script src="dashboard.js"></script>

<!-- Then inline script that calls initDashboard() -->
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const authorized = await guardDashboardAccess();
    if (authorized) {
      initDashboard();
    }
  });
</script>
```

## Unified Shell

All main pages (except index.html) use the unified shell from `app-shell.css`:

- Consistent sidebar navigation
- Consistent topbar
- Consistent layout
- Consistent visual style

### Sidebar Structure

```html
<div class="app-shell">
  <aside class="app-sidebar">
    <div class="sidebar-header">...</div>
    <nav class="sidebar-nav">
      <div class="sidebar-section">
        <div class="sidebar-section-title">Main</div>
        <a href="console-unified.html" class="sidebar-nav-item">Console</a>
        <a href="dashboard.html" class="sidebar-nav-item">Overview</a>
        <a href="workflows.html" class="sidebar-nav-item">Workflows</a>
        <a href="logs.html" class="sidebar-nav-item">Logs</a>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title">Configuration</div>
        <a href="settings.html" class="sidebar-nav-item">Settings</a>
      </div>
    </nav>
    <div class="sidebar-footer">...</div>
  </aside>
  
  <main class="app-main">
    <div class="app-topbar">...</div>
    <div class="app-content">
      <!-- Page content here -->
    </div>
  </main>
</div>
```

## Adding New Pages

1. Copy the shell structure from an existing page (e.g., `workflows.html`)
2. Update the page title and topbar title
3. Set the active state on the correct sidebar item
4. Add your page-specific content in `<div class="app-content">`
5. Include `app-shell.css` for the shell
6. Add page-specific CSS if needed
7. Load required JavaScript modules
8. Ensure scripts load in correct order (dependencies first, then page logic)

## Development

### Running Locally

```bash
# Option 1: Python simple server
python simple_server.py

# Option 2: Python http.server
python -m http.server 8080

# Option 3: Node.js http-server
npx http-server . -p 8080
```

### Testing

1. Open browser to http://localhost:8080
2. Open browser console (F12)
3. Check for JavaScript errors
4. Test navigation between pages
5. Verify consistent shell across pages

### Common Issues

**ARIAAgent is not defined:**
- Ensure `console-aria.js` loads BEFORE inline script
- Check browser console for loading errors

**initDashboard is not defined:**
- Ensure `dashboard.js` loads BEFORE inline script
- Check browser console for loading errors

**Inconsistent sidebar:**
- Ensure page uses `app-shell.css`
- Verify sidebar HTML structure matches template
- Check active state is set on correct item

## File Naming Convention

- **Canonical files:** No suffix (e.g., `console-unified.html`, `dashboard.js`)
- **Legacy files:** Moved to `legacy/` folder
- **Test files:** Moved to `legacy/` folder
- **Debug files:** Moved to `legacy/` folder

## Code Style

- Use ES6+ JavaScript
- Use async/await for asynchronous operations
- Use `const` and `let` (no `var`)
- Use template literals for strings
- Use arrow functions where appropriate
- Add comments for complex logic
- Keep functions small and focused
- Use descriptive variable names

## Architecture

See [../ARCHITECTURE.md](../ARCHITECTURE.md) for complete system architecture.
