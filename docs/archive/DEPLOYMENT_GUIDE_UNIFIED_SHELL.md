# Deployment Guide: Unified Shell Integration

## Quick Start

The unified shell integration is **complete and ready to deploy**. All files have been updated and are production-ready.

## Pre-Deployment Checklist

### 1. Verify Files Exist
```bash
# Check unified shell files
ls -la frontend/app-shell.css
ls -la frontend/console-aria.js
ls -la frontend/console-unified.html
ls -la frontend/settings.html

# Check updated pages
ls -la frontend/dashboard.html
ls -la frontend/workflows.html
ls -la frontend/logs.html
```

### 2. Verify Backend is Running
```bash
# Start backend if not running
python -m uvicorn app.main:app --reload --port 8081

# Test ARIA prompt endpoint
curl -X POST http://localhost:8081/api/console/prompt \
  -H "Content-Type: application/json" \
  -d '{"tier":"enterprise","has_snapshot":false,"has_blueprint":false}'
```

### 3. Test in Browser
```bash
# Open in browser (replace with your actual path)
open frontend/console-unified.html
open frontend/dashboard.html
open frontend/workflows.html
open frontend/logs.html
open frontend/settings.html
```

## Deployment Steps

### Step 1: Backup Current Files (Optional)
```bash
# Create backup directory
mkdir -p backups/pre-unified-shell

# Backup old files
cp frontend/dashboard.html backups/pre-unified-shell/
cp frontend/workflows.html backups/pre-unified-shell/
cp frontend/logs.html backups/pre-unified-shell/
```

### Step 2: Deploy New Files
```bash
# All files are already in place, just verify
git status

# You should see:
# modified:   frontend/dashboard.html
# modified:   frontend/workflows.html
# modified:   frontend/logs.html
# new file:   frontend/app-shell.css
# new file:   frontend/console-aria.js
# new file:   frontend/console-unified.html
# new file:   frontend/settings.html
```

### Step 3: Update Internal Links (If Needed)
```bash
# Search for old console links
grep -r "console.html" frontend/*.html

# Update to console-unified.html
# (Already done in dashboard.html, workflows.html, logs.html)
```

### Step 4: Clear Browser Cache
```bash
# Instruct users to clear cache or use hard refresh
# Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
# Safari: Cmd+Option+R (Mac)
```

### Step 5: Test All Pages

#### Test Console
1. Open `frontend/console-unified.html`
2. Verify sidebar appears correctly
3. Type "Hello" → ARIA should respond in English
4. Type "Halo, saya ingin membuat workflow" → ARIA should respond in Indonesian
5. Reload page → Conversation should persist

#### Test Dashboard
1. Open `frontend/dashboard.html`
2. Verify same sidebar as console
3. Click through tabs: Overview, Diagnostic, Snapshot, Blueprint
4. Verify Settings tab is removed (now in settings.html)
5. Click sidebar links → Verify navigation works

#### Test Workflows
1. Open `frontend/workflows.html`
2. Verify same sidebar as console and dashboard
3. Verify workflows table loads
4. Click sidebar links → Verify navigation works

#### Test Logs
1. Open `frontend/logs.html`
2. Verify same sidebar as console, dashboard, and workflows
3. Verify logs table loads
4. Test filters work
5. Click sidebar links → Verify navigation works

#### Test Settings
1. Open `frontend/settings.html`
2. Verify same sidebar as all other pages
3. Verify API key section displays
4. Click eye icon → API key should become visible
5. Click copy button → API key should copy to clipboard
6. Verify workspace settings section
7. Verify integrations section

### Step 6: Test Navigation Flow
```
1. Start at console-unified.html
2. Click "Overview" in sidebar → Should go to dashboard.html
3. Click "Workflows" in sidebar → Should go to workflows.html
4. Click "Logs" in sidebar → Should go to logs.html
5. Click "Settings" in sidebar → Should go to settings.html
6. Click "Console" in sidebar → Should go back to console-unified.html
7. Verify sidebar stays the same on all pages
8. Verify only main content changes
```

### Step 7: Test Mobile Responsive
```
1. Open any page
2. Resize browser to mobile width (< 768px)
3. Verify sidebar adapts/collapses
4. Verify top bar remains functional
5. Verify content is readable
6. Test on actual mobile device if possible
```

## Post-Deployment Verification

### Visual Consistency Check
- [ ] All pages use same sidebar
- [ ] All pages use same top bar
- [ ] All pages use same colors (#272728, #1b1b1c)
- [ ] All pages use same typography (Inter Tight, 15px)
- [ ] All pages have same spacing
- [ ] No glow effects anywhere

### Functional Check
- [ ] ARIA agent works on console
- [ ] ARIA responds in correct language
- [ ] Conversation persists after reload
- [ ] Dashboard tabs work
- [ ] Workflows table loads
- [ ] Logs table loads and filters work
- [ ] Settings page displays correctly
- [ ] API key visibility toggle works
- [ ] All sidebar links work

### Performance Check
- [ ] Pages load quickly
- [ ] No console errors
- [ ] No 404 errors for CSS/JS files
- [ ] ARIA responses stream smoothly
- [ ] Navigation is instant

## Rollback Plan (If Needed)

### If Issues Occur
```bash
# Restore from backup
cp backups/pre-unified-shell/dashboard.html frontend/
cp backups/pre-unified-shell/workflows.html frontend/
cp backups/pre-unified-shell/logs.html frontend/

# Or use git
git checkout HEAD -- frontend/dashboard.html
git checkout HEAD -- frontend/workflows.html
git checkout HEAD -- frontend/logs.html
```

### Temporary Workaround
```bash
# If unified shell has issues, old pages still work
# Users can access:
# - frontend/console.html (old console)
# - frontend/console-premium.html (old premium console)
# - Old dashboard/workflows/logs (if restored)
```

## Common Issues & Solutions

### Issue: Sidebar Not Showing
**Solution**:
```bash
# Verify app-shell.css is loaded
curl -I http://localhost:8000/frontend/app-shell.css

# Check browser console for errors
# Clear browser cache
# Hard refresh (Ctrl+Shift+R)
```

### Issue: ARIA Not Responding
**Solution**:
```bash
# Verify backend is running
curl http://localhost:8081/health

# Check ARIA prompt endpoint
curl -X POST http://localhost:8081/api/console/prompt \
  -H "Content-Type: application/json" \
  -d '{"tier":"enterprise","has_snapshot":false,"has_blueprint":false}'

# Check browser console for errors
# Verify console-aria.js is loaded
```

### Issue: Navigation Broken
**Solution**:
```bash
# Verify all files exist
ls -la frontend/console-unified.html
ls -la frontend/dashboard.html
ls -la frontend/workflows.html
ls -la frontend/logs.html
ls -la frontend/settings.html

# Check for typos in href attributes
grep -n "href=" frontend/dashboard.html
grep -n "href=" frontend/workflows.html
grep -n "href=" frontend/logs.html
```

### Issue: Styling Inconsistent
**Solution**:
```bash
# Verify app-shell.css is loaded first
# Check <head> section of each page
# Should have: <link rel="stylesheet" href="app-shell.css">
# Before: <link rel="stylesheet" href="dashboard.css">

# Clear browser cache
# Hard refresh (Ctrl+Shift+R)
```

### Issue: Mobile Not Responsive
**Solution**:
```bash
# Verify viewport meta tag exists
grep "viewport" frontend/*.html

# Should have:
# <meta name="viewport" content="width=device-width, initial-scale=1.0">

# Check app-shell.css media queries
grep "@media" frontend/app-shell.css
```

## Monitoring

### What to Monitor
1. **Page Load Times**: Should be < 2 seconds
2. **Console Errors**: Should be zero
3. **ARIA Response Time**: Should be < 5 seconds
4. **Navigation Clicks**: Should be instant
5. **User Feedback**: Watch for confusion or issues

### Metrics to Track
```javascript
// Add to each page for monitoring
window.addEventListener('load', () => {
  const loadTime = performance.now();
  console.log(`Page loaded in ${loadTime}ms`);
  
  // Send to analytics if available
  if (window.analytics) {
    analytics.track('Page Load', {
      page: window.location.pathname,
      loadTime: loadTime
    });
  }
});
```

## Success Criteria

### Deployment is Successful When:
- ✅ All pages load without errors
- ✅ Sidebar is consistent across all pages
- ✅ Navigation works smoothly
- ✅ ARIA agent responds correctly
- ✅ Mobile responsive works
- ✅ No user complaints
- ✅ Performance is good

### Deployment Needs Attention When:
- ⚠️ Console errors appear
- ⚠️ Pages load slowly (> 3 seconds)
- ⚠️ ARIA doesn't respond
- ⚠️ Navigation is broken
- ⚠️ Mobile layout is broken
- ⚠️ Users report issues

## Next Steps After Deployment

### Immediate (Week 1)
1. Monitor for issues
2. Collect user feedback
3. Fix any bugs found
4. Update documentation

### Short Term (Month 1)
1. Update index.html to link to console-unified.html
2. Add redirects from old console pages
3. Create user migration guide
4. Update help documentation

### Long Term (Quarter 1)
1. Remove deprecated files (console.html, console-premium.html)
2. Remove deprecated JavaScript files
3. Create standalone pages for Diagnostics, Snapshots, Blueprints
4. Enhance ARIA agent capabilities
5. Add more integrations to Settings page

## Support Contacts

### Technical Issues
- Check documentation: `UNIFIED_SHELL_INTEGRATION_COMPLETE.md`
- Check troubleshooting: `QUICK_START_UNIFIED_SHELL.md`
- Check implementation: `UNIFIED_SHELL_COMPLETE.md`

### User Issues
- Provide quick start guide: `QUICK_START_UNIFIED_SHELL.md`
- Provide visual guide: `INTEGRATION_BEFORE_AFTER.md`
- Provide changelog: `CHANGELOG_UNIFIED_SHELL.md`

## Conclusion

The unified shell integration is production-ready and can be deployed immediately. All files have been updated, tested, and documented. Follow this guide for a smooth deployment.

**Status**: ✅ Ready for Deployment

---

**Document Version**: 1.0.0
**Last Updated**: 2025-02-28
**Deployment Risk**: Low
**Rollback Time**: < 5 minutes
