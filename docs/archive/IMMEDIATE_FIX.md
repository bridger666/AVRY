# Immediate Fix for Dead Button

## Quick Diagnosis

Open browser console (F12) and paste this:

```javascript
// Test if function exists
console.log('startFreeDiagnostic exists:', typeof startFreeDiagnostic);

// Test if button exists
const btn = document.querySelector('.hero-cta-group .cta-button.primary');
console.log('Button exists:', !!btn);

// Try calling function manually
if (typeof startFreeDiagnostic === 'function') {
    console.log('Calling function...');
    startFreeDiagnostic();
} else {
    console.error('Function not found! app.js may not be loaded.');
}
```

## Most Likely Causes

### 1. app.js Not Loaded (Most Common)
**Check**: Look in browser console for "app.js" 404 error
**Fix**: Verify file path and clear cache

### 2. JavaScript Error Before Button Click
**Check**: Look for red errors in console
**Fix**: Fix the error shown in console

### 3. Inline onclick Not Working (CSP Issue)
**Check**: Console shows "Refused to execute inline script"
**Fix**: Use event listeners instead

## Immediate Workaround

Add this script to the bottom of `frontend/index.html` (before `</body>`):

```html
<script>
// Backup event listener if inline onclick fails
document.addEventListener('DOMContentLoaded', function() {
    // Find all buttons with startFreeDiagnostic onclick
    const buttons = document.querySelectorAll('[onclick*="startFreeDiagnostic"]');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            console.log('Button clicked via event listener');
            e.preventDefault();
            e.stopPropagation();
            
            if (typeof startFreeDiagnostic === 'function') {
                startFreeDiagnostic();
            } else {
                console.error('startFreeDiagnostic function not found!');
                alert('Error: Diagnostic function not loaded. Please refresh the page.');
            }
        });
    });
    
    console.log('✅ Event listeners attached to', buttons.length, 'buttons');
});
</script>
```

## Test Pages

1. **Open `frontend/button-test.html`** - Tests basic button functionality
2. **Open `frontend/debug-clicks.html`** - Shows real-time diagnostics

## Nuclear Option (If Nothing Works)

Replace the inline onclick with a direct event listener in index.html:

```html
<!-- Find this line (around line 81) -->
<button class="cta-button primary" onclick="startFreeDiagnostic()">Start free diagnostic</button>

<!-- Replace with -->
<button class="cta-button primary" id="start-diagnostic-btn">Start free diagnostic</button>

<!-- Then add this script at the bottom -->
<script>
document.getElementById('start-diagnostic-btn').addEventListener('click', function() {
    if (typeof startFreeDiagnostic === 'function') {
        startFreeDiagnostic();
    } else {
        alert('Please refresh the page and try again.');
    }
});
</script>
```
