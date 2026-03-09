# Quick Reference: Aivory Console

## For Developers

### Canonical Files (Edit These)
- **HTML**: `frontend/console.html`
- **CSS**: `frontend/console-premium.css`
- **JS**: `frontend/console.js`
- **Logo**: `frontend/Aivory_console_pic.svg`

### Deprecated Files (Don't Edit)
- ~~`frontend/console-premium.html`~~ (standalone test)
- ~~`frontend/console-premium.js`~~ (duplicate)
- ~~`frontend/console-layout-refactor.css`~~ (old theme)

### Entry Points
- **Landing**: `index.html` → Dashboard
- **Dashboard**: `dashboard.html` → Console (sidebar)
- **Console**: `console.html` (canonical)

## For Designers

### Color Palette
```css
/* Main */
--bg-main: #272728;        /* Warm dark gray */
--bg-sidebar: #1b1b1c;     /* Darker sidebar */
--border: #333338;         /* Subtle borders */

/* Text */
--text-primary: #e0e0e0;   /* Main text */
--text-secondary: #a0a0a8; /* Secondary text */
--text-tertiary: #6a6a78;  /* Tertiary text */
--text-white: #ffffff;     /* Emphasis */
```

### Spacing
- **Message gaps**: 2rem (32px)
- **Line height**: 1.7-1.8
- **Paragraph margins**: 1.5rem (24px)
- **Table padding**: 1.25rem × 1.5rem

### Typography
- **Font**: Inter Tight, system-ui fallback
- **Base size**: 15px
- **Headings**: 600 weight, -0.02em letter-spacing

### Effects
- **Shadows**: Subtle flat only (no glow)
- **Blur**: None (removed all backdrop-filter)
- **Animations**: Simple opacity/transform only

## For Product Managers

### User Flow
1. User lands on `index.html`
2. Clicks "Get Started" or "Dashboard"
3. Authenticates (if needed)
4. Arrives at `dashboard.html`
5. Clicks "Console" in sidebar
6. Uses `console.html` with premium UI

### Key Features
- **File Upload**: Circular + button (bottom-left)
- **AI Avatar**: Aivory logo in all messages
- **Theme**: Warm gray, no glow effects
- **Input**: Multi-line, Enter to send, Shift+Enter for newline
- **Responsive**: Works on mobile, tablet, desktop

### What Users See
- Clean, professional dark interface
- Aivory branding throughout
- Easy file upload
- Smooth message streaming
- Generous spacing and readability

## For QA/Testing

### Test Checklist
- [ ] Navigate from dashboard to console
- [ ] Verify warm gray theme (#272728)
- [ ] Check Aivory logo in AI messages
- [ ] Test file upload button (+ icon)
- [ ] Verify Enter sends, Shift+Enter newline
- [ ] Test on mobile (< 768px)
- [ ] Test on tablet (768px-1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Verify no glow effects anywhere
- [ ] Check conversation persistence (refresh page)

### Known Issues
- None currently

### Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## For DevOps

### Deployment Files
```
frontend/
├── console.html              # Deploy
├── console.js                # Deploy
├── console-premium.css       # Deploy
├── dashboard.html            # Deploy
├── Aivory_console_pic.svg    # Deploy
└── [shared utilities]        # Deploy
```

### Don't Deploy
- `console-premium.html` (deprecated)
- `console-premium.js` (deprecated)
- `console-layout-refactor.css` (deprecated)
- `*-test.html` files (test only)

### Cache Busting
- CSS: `console-premium.css?v=2`
- JS: `console.js?v=[timestamp]`
- Update version numbers on changes

### Environment Variables
- `API_BASE_URL`: Backend API endpoint
- `TIER_SYNC_ENABLED`: Enable tier synchronization
- `FILE_UPLOAD_MAX_SIZE`: Max file size (MB)

## For Support

### Common User Questions

**Q: Where is the AI Console?**
A: Click "Console" in the left sidebar from the dashboard.

**Q: How do I upload files?**
A: Click the + button (bottom-left of input) and select upload type.

**Q: Why can't I see my messages?**
A: Check browser console for errors. Try clearing cache and refreshing.

**Q: The console looks different than before**
A: We updated to a new warm gray theme. It's the same console, just better!

**Q: How do I send a message?**
A: Type in the input box and press Enter. Use Shift+Enter for new lines.

### Troubleshooting

**Issue**: Console not loading
- Check network tab for failed requests
- Verify API endpoint is accessible
- Clear browser cache

**Issue**: File upload not working
- Check file size (max 10MB)
- Verify file type is supported
- Check browser console for errors

**Issue**: Messages not persisting
- Check localStorage is enabled
- Verify not in incognito mode
- Check browser storage quota

## Quick Commands

### Development
```bash
# Start local server
python simple_server.py

# Open console
open http://localhost:8000/console.html

# Watch for changes
# (use your preferred file watcher)
```

### Testing
```bash
# Run tests (if available)
npm test

# Check for errors
# Open browser console (F12)
```

### Deployment
```bash
# Build (if needed)
npm run build

# Deploy to production
# (use your deployment script)
```

## Links

### Documentation
- [Console Consolidation](./CONSOLE_CONSOLIDATION_COMPLETE.md)
- [Warm Gray Redesign](./CONSOLE_WARM_GRAY_REDESIGN_COMPLETE.md)
- [Before/After Comparison](./CONSOLE_BEFORE_AFTER_UNIFICATION.md)
- [Deprecated Files](./frontend/DEPRECATED_FILES.md)

### Related Files
- [Dashboard](./frontend/dashboard.html)
- [Workflows](./frontend/workflows.html)
- [Logs](./frontend/logs.html)

---

**Last Updated**: February 28, 2026
**Maintained By**: Aivory Development Team
**Questions?**: Check documentation or ask the team
