# Button Click Debug Guide

## Issue
The "Start Free Diagnostic" button appears unclickable ("dead") when clicked.

## Debug Steps

### Step 1: Open Debug Page
Open `frontend/debug-clicks.html` in your browser to see detailed diagnostics:
- Canvas pointer-events status
- Button existence check
- Function existence check
- app.js load status
- Real-time click logging

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click the "Start free diagnostic" button
4. Look for:
   - Any JavaScript errors (red text)
   - "Starting FREE diagnostic (12 questions)" message
   - Any blocked requests or CSP violations

### Step 3: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page (Ctrl+R)
4. Check if `app.js` is loading:
   - Look for `app.js` in the list
   - Status should be 200 (green)
   - If 404 (red), the file path is wrong
   - If blocked, there's a CORS or CSP issue

### Step 4: Test Simple Button
Open `frontend/button-test.html` to test if basic JavaScript works:
1. Click "Test Inline onclick" - should show alert
2. Click "Test Event Listener" - should show alert
3. Click "Test startFreeDiagnostic" - shows if function exists
4. Click "Test with app.js loaded" - loads and tests app.js

## Common Causes & Fixes

### Cause 1: Browser Cache
**Symptoms**: Old JavaScript is cached
**Fix**: Hard refresh
- Chrome/Edge: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- Safari: `Cmd + Option + R` (Mac)

### Cause 2: app.js Not Loading
**Symptoms**: Console shows "startFreeDiagnostic is not defined"
**Fix**: Check file path in index.html
```html
<!-- Should be at line ~745 -->
<script src="app.js?v=3"></script>
```

### Cause 3: JavaScript Error
**Symptoms**: Console shows error before button click
**Fix**: Check console for error message and fix the error

### Cause 4: Content Security Policy (CSP)
**Symptoms**: Console shows "Refused to execute inline script"
**Fix**: Check if there's a CSP meta tag or header blocking inline scripts

### Cause 5: Modal Overlay Stuck Open
**Symptoms**: Clicks don't register on any buttons
**Fix**: Run in console:
```javascript
document.getElementById('loginModal').style.display = 'none';
```

### Cause 6: Canvas Blocking Clicks
**Symptoms**: Canvas has pointer-events: auto instead of none
**Fix**: Check styles.css line ~106:
```css
#led-hero-bg {
    pointer-events: none; /* Should be 'none' */
}
```

## Quick Test in Console

Open browser console (F12) and run:

```javascript
// Test 1: Check if function exists
console.log('Function exists:', typeof startFreeDiagnostic === 'function');

// Test 2: Try calling it manually
startFreeDiagnostic();

// Test 3: Check button
const btn = document.querySelector('.cta-button.primary');
console.log('Button found:', !!btn);
console.log('Button onclick:', btn?.onclick);

// Test 4: Check canvas pointer-events
const canvas = document.getElementById('led-hero-bg');
console.log('Canvas pointer-events:', window.getComputedStyle(canvas).pointerEvents);

// Test 5: Check for overlays
const modal = document.getElementById('loginModal');
console.log('Modal display:', window.getComputedStyle(modal).display);
```

## Expected Results

When working correctly:
1. Console shows: "Starting FREE diagnostic (12 questions)"
2. Page scrolls to top
3. Section changes to show diagnostic questions
4. No errors in console

## Files to Check

1. `frontend/index.html` - Button HTML (line ~81)
2. `frontend/app.js` - startFreeDiagnostic function (line ~184)
3. `frontend/styles.css` - Canvas pointer-events (line ~106)
4. Browser DevTools Console - JavaScript errors
5. Browser DevTools Network - app.js loading

## Still Not Working?

If none of the above fixes work:

1. **Take a screenshot** of:
   - The button you're clicking
   - Browser console (F12 → Console tab)
   - Network tab showing app.js

2. **Try a different browser** to rule out browser-specific issues

3. **Check if it works on the test pages**:
   - `frontend/button-test.html`
   - `frontend/debug-clicks.html`

4. **Verify the server is running** if using a local server:
   ```bash
   # Check if server is running
   curl http://localhost:8000/frontend/index.html
   ```
