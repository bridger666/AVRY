# Sidebar Toggle - Visual Test Guide

## Quick Test Instructions

### Test 1: Toggle Button Presence
**What to check:** Toggle button appears at bottom of sidebar on all pages

**Steps:**
1. Open `http://localhost:8080/console.html`
2. Look at bottom of sidebar - you should see a button with a left-pointing arrow icon
3. Repeat for:
   - `http://localhost:8080/dashboard.html`
   - `http://localhost:8080/workflows.html`
   - `http://localhost:8080/logs.html`

**Expected Result:** ✓ Toggle button visible on all 4 pages

---

### Test 2: Toggle Functionality
**What to check:** Clicking toggle button expands/collapses sidebar

**Steps:**
1. Open any dashboard page
2. Sidebar should be collapsed (64px, icons only)
3. Click the toggle button at bottom
4. Sidebar should expand to 220px with full text labels
5. Click toggle button again
6. Sidebar should collapse back to 64px

**Expected Result:** ✓ Smooth animation, no layout jumps

---

### Test 3: Tooltips in Collapsed State
**What to check:** Hovering over nav items shows tooltips when collapsed

**Steps:**
1. Ensure sidebar is collapsed (64px)
2. Hover over the Console icon
3. Tooltip saying "Console" should appear to the right
4. Hover over other icons (Overview, Workflows, Logs, Diagnostics)
5. Each should show its respective tooltip

**Expected Result:** ✓ Tooltips appear on hover, positioned to the right

---

### Test 4: Navigation Hierarchy
**What to check:** Console is first item on all pages

**Steps:**
1. Open each page and check sidebar order:
   - Console.html: Console (active), Overview, Workflows, Logs, Diagnostics
   - Dashboard.html: Console, Overview (active), Workflows, Logs, Diagnostics
   - Workflows.html: Console, Overview, Workflows (active), Logs, Diagnostics
   - Logs.html: Console, Overview, Workflows, Logs (active), Diagnostics

**Expected Result:** ✓ Console is always first, active state on current page

---

### Test 5: State Persistence
**What to check:** Sidebar state persists across page navigation

**Steps:**
1. Open console.html
2. Click toggle to expand sidebar
3. Navigate to workflows.html
4. Sidebar should still be expanded
5. Navigate to logs.html
6. Sidebar should still be expanded
7. Click toggle to collapse
8. Navigate to dashboard.html
9. Sidebar should be collapsed

**Expected Result:** ✓ State persists across all page navigations

---

### Test 6: Visual Consistency
**What to check:** All pages look identical in sidebar design

**Steps:**
1. Open all 4 pages in separate tabs
2. Compare sidebar appearance:
   - Same width (64px collapsed, 220px expanded)
   - Same icon sizes
   - Same spacing
   - Same colors
   - Same hover effects
   - Same active states

**Expected Result:** ✓ Pixel-perfect consistency across all pages

---

## Visual Reference

### Collapsed State (64px)
```
┌─────┐
│ 💬  │ ← Console (with tooltip on hover)
│ ▦   │ ← Overview
│ ⚡  │ ← Workflows
│ 📄  │ ← Logs
│ 🔍  │ ← Diagnostics
│     │
│ ⚙️  │ ← Settings
│ 🏠  │ ← Home
│     │
│ ◀   │ ← Toggle button
└─────┘
```

### Expanded State (220px)
```
┌──────────────────┐
│ 💬  Console      │ ← Active (mint green)
│ ▦   Overview     │
│ ⚡  Workflows    │
│ 📄  Logs         │
│ 🔍  Diagnostics  │
│                  │
│ SETTINGS         │
│ ⚙️  Settings     │
│ 🏠  Home         │
│                  │
│ ▶                │ ← Toggle button (rotated)
└──────────────────┘
```

---

## Color Reference

### Sidebar Colors
- Background: `#20202b` (--bg-secondary)
- Border: `#2a2a38` (--border-default)
- Text (inactive): `#9ca3af` (--text-secondary)
- Text (active): `#0ae8af` (--mint-green)
- Hover background: `#2a2a38` (--bg-tertiary)

### Toggle Button
- Border: `#2a2a38` (--border-default)
- Hover border: `#3a3a48` (--border-strong)
- Hover text: `#0ae8af` (--mint-green)

---

## Common Issues & Solutions

### Issue: Toggle button not visible
**Solution:** Check that `sidebar-toggle.js` is loaded in the page

### Issue: Sidebar doesn't expand/collapse
**Solution:** Check browser console for JavaScript errors

### Issue: Tooltips don't appear
**Solution:** Verify `data-tooltip` attributes are present on nav items

### Issue: State doesn't persist
**Solution:** Check localStorage is enabled in browser

### Issue: Navigation order is wrong
**Solution:** Verify HTML structure matches the specification

---

## Browser DevTools Inspection

### Check localStorage
1. Open DevTools (F12)
2. Go to Application tab
3. Expand Local Storage
4. Look for key: `aivory-sidebar-expanded`
5. Value should be `"true"` or `"false"`

### Check CSS Classes
1. Open DevTools (F12)
2. Inspect `.dashboard-layout` element
3. When expanded, should have class `sidebar-expanded`
4. When collapsed, should NOT have class `sidebar-expanded`

### Check Grid Columns
1. Open DevTools (F12)
2. Inspect `.dashboard-layout` element
3. Check computed styles:
   - Collapsed: `grid-template-columns: 64px 1fr`
   - Expanded: `grid-template-columns: 220px 1fr`

---

**Test Status:** Ready for verification
**Estimated Test Time:** 5-10 minutes
**Required:** Modern browser with JavaScript enabled
