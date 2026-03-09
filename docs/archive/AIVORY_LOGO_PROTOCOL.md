# AIVORY LOGO USAGE PROTOCOL

## CRITICAL RULE: ALWAYS USE LOGO IMAGE, NEVER TEXT

**MANDATORY**: Whenever displaying "Aivory" branding anywhere in the application, you MUST use the actual logo image file `frontend/Aivory_logo.png`. NEVER use plain text "Aivory" as a substitute.

---

## Logo File Location

```
frontend/Aivory_logo.png
```

**File Details:**
- Format: PNG with transparency
- Size: ~21KB
- Dimensions: Check with `identify` or `file` command
- Location: Root of frontend directory

---

## Implementation Requirements

### 1. Badge Generation (Backend)

**File**: `app/services/badge_service.py`

**Current Implementation**: ✅ CORRECT
- Uses `get_logo_base64()` function to embed logo as base64 data URL
- Logo positioned at bottom center of badge
- Fallback to text only if logo file is missing (should never happen)

**Logo Specifications in Badge:**
- Position: x="160" y="195" (bottom center)
- Size: width="80" height="20"
- Preserves aspect ratio

**Verification:**
```python
# Logo must be embedded as base64 data URL
logo_data_url = get_logo_base64()
if logo_data_url:
    logo_svg = f'<image href="{logo_data_url}" x="160" y="195" width="80" height="20" preserveAspectRatio="xMidYMid meet"/>'
```

---

### 2. Frontend HTML (Navigation, Headers, etc.)

**Files**: 
- `frontend/index.html`
- `frontend/dashboard.html`
- `frontend/console.html`
- `frontend/workflows.html`
- `frontend/logs.html`

**Current Implementation**: ✅ CORRECT
- Navigation uses `<img src="Aivory_logo.png">` in nav-brand
- Logo height: 35px
- Object-fit: contain

**Example:**
```html
<div class="nav-brand">
    <img src="Aivory_logo.png" alt="Aivory">
</div>
```

**CSS:**
```css
.nav-brand img {
    height: 35px;
    width: auto;
    object-fit: contain;
}
```

---

## Checklist for Any New Feature

Before deploying any feature that displays "Aivory" branding:

- [ ] **Backend Badge/SVG Generation**: Uses `get_logo_base64()` to embed logo as base64
- [ ] **Frontend HTML**: Uses `<img src="Aivory_logo.png">` tag, NOT text
- [ ] **CSS Styling**: Logo has proper sizing (height: 35px for nav, adjust for other contexts)
- [ ] **Fallback**: Only use text fallback if logo file is genuinely missing (log error)
- [ ] **Testing**: Verify logo displays correctly in all browsers
- [ ] **Mobile**: Verify logo scales properly on mobile devices

---

## Common Mistakes to Avoid

### ❌ WRONG - Using Text Instead of Logo
```html
<div class="nav-brand">Aivory</div>
```

### ❌ WRONG - Using Text in SVG Badge
```svg
<text x="200" y="210">Aivory</text>
```

### ✅ CORRECT - Using Logo Image
```html
<div class="nav-brand">
    <img src="Aivory_logo.png" alt="Aivory">
</div>
```

### ✅ CORRECT - Using Logo in SVG Badge
```svg
<image href="data:image/png;base64,{base64_data}" x="160" y="195" width="80" height="20"/>
```

---

## Troubleshooting

### Logo Not Displaying in Badge

1. **Check file exists:**
   ```bash
   ls -la frontend/Aivory_logo.png
   ```

2. **Check backend can read it:**
   ```python
   logo_path = os.path.join(os.path.dirname(__file__), '../../frontend/Aivory_logo.png')
   print(f"Logo exists: {os.path.exists(logo_path)}")
   ```

3. **Check base64 encoding:**
   ```python
   logo_data_url = get_logo_base64()
   print(f"Logo data URL length: {len(logo_data_url)}")
   ```

4. **Verify SVG output:**
   - Badge SVG should contain `<image href="data:image/png;base64,..."`
   - Should NOT contain `<text>Aivory</text>` unless logo is missing

### Logo Not Displaying in Frontend

1. **Check file path is correct:**
   - Logo should be in `frontend/` directory
   - HTML files reference it as `Aivory_logo.png` (relative path)

2. **Check browser console for 404 errors**

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## Testing Protocol

### Manual Testing

1. **Badge Generation:**
   ```bash
   # Run diagnostic and check badge SVG
   curl -X POST http://localhost:8081/api/v1/diagnostic/run \
     -H "Content-Type: application/json" \
     -d '{"answers": [...]}'
   
   # Verify response contains base64 logo in badge_svg field
   ```

2. **Frontend Display:**
   - Open `index.html` in browser
   - Verify logo displays in navigation
   - Inspect element to confirm `<img>` tag is used
   - Check logo is not pixelated or distorted

3. **Badge Download:**
   - Complete free diagnostic
   - Download badge as PNG
   - Verify logo appears at bottom of badge
   - Verify logo is clear and not text

### Automated Testing

```python
def test_badge_contains_logo():
    """Verify badge SVG contains logo image, not text"""
    from app.services.badge_service import generate_badge
    
    badge_svg = generate_badge(58, "AI Ready")
    
    # Should contain image element with base64 data
    assert '<image href="data:image/png;base64,' in badge_svg
    
    # Should NOT contain text fallback
    assert '<text>Aivory</text>' not in badge_svg
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Logo file `frontend/Aivory_logo.png` is committed to repository
- [ ] Badge service successfully loads and encodes logo
- [ ] All HTML pages use `<img>` tag for logo, not text
- [ ] Logo displays correctly in development environment
- [ ] Logo displays correctly in staging environment
- [ ] Badge download includes logo (not text)
- [ ] Mobile devices display logo correctly
- [ ] All browsers (Chrome, Firefox, Safari, Edge) display logo correctly

---

## Contact

If logo is missing or not displaying correctly, this is a **CRITICAL BRANDING ISSUE** and must be fixed immediately before any deployment.

**Priority**: P0 (Blocker)
**Owner**: Frontend + Backend teams
**File Location**: `frontend/Aivory_logo.png`
**Documentation**: This file (`AIVORY_LOGO_PROTOCOL.md`)
