# Console Migration Guide

## Overview

Migrating from the old HTML console (`console-unified.html`) to the new Next.js console.

## Current State

✅ **Backend**: Running on port 8081
✅ **Next.js Console**: Built and ready in `nextjs-console/`
✅ **API Integration**: Configured to connect to ARIA backend

## Migration Steps

### 1. Install Node.js (if not installed)

```bash
# macOS
brew install node

# Verify installation
node --version
npm --version
```

### 2. Install Next.js Dependencies

```bash
cd nextjs-console
npm install
```

### 3. Start the New Console

**Option A: Use the startup script**

```bash
./start_console.sh
```

**Option B: Manual start**

Terminal 1 (Backend):
```bash
python3 -m uvicorn app.main:app --reload --port 8081
```

Terminal 2 (Frontend):
```bash
cd nextjs-console
npm run dev
```

### 4. Test the New Console

Open: http://localhost:3000/console

Test:
- Send a message
- Verify ARIA responds
- Test the upload menu (+ button)
- Test keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Test on mobile/responsive

### 5. Update Navigation Links

Once verified, update links in:

**frontend/dashboard.html**:
```html
<!-- Old -->
<a href="console-unified.html" class="sidebar-nav-item">Console</a>

<!-- New -->
<a href="http://localhost:3000/console" class="sidebar-nav-item">Console</a>
```

**frontend/workflows.html**, **frontend/logs.html**, **frontend/settings.html**:
Same change in sidebar navigation.

### 6. Move Old Console to Legacy

```bash
# Move old console files to legacy
mv frontend/console-unified.html frontend/legacy/
mv frontend/console-unified.css frontend/legacy/
# console-aria.js stays (may be used by backend)
```

### 7. Update Documentation

Update `ARCHITECTURE.md`:
```markdown
**Main Pages:**
- `index.html` - Landing page
- Next.js Console (port 3000) - AI console with ARIA agent
- `dashboard.html` - Dashboard
- `workflows.html` - Workflows
- `logs.html` - Logs
- `settings.html` - Settings
```

## Architecture

### Old Console (HTML)
```
frontend/console-unified.html
  ↓
frontend/console-aria.js
  ↓
Backend API (port 8081)
```

### New Console (Next.js)
```
nextjs-console/app/console/page.tsx
  ↓
Next.js API Proxy (port 3000)
  ↓
Backend API (port 8081)
```

## Benefits of New Console

✅ **Modern Stack**: Next.js 14 + TypeScript
✅ **Better UX**: GPT-style design, smooth animations
✅ **Maintainable**: Component-based architecture
✅ **Extensible**: Easy to add features (streaming, attachments, etc.)
✅ **Type-Safe**: Full TypeScript support
✅ **Responsive**: Mobile-first design

## Rollback Plan

If issues arise:

1. Stop Next.js console
2. Restore old console from legacy:
   ```bash
   mv frontend/legacy/console-unified.html frontend/
   mv frontend/legacy/console-unified.css frontend/
   ```
3. Update navigation links back to `console-unified.html`

## Production Deployment

### Build Next.js Console

```bash
cd nextjs-console
npm run build
npm start
```

### Serve on Different Port

Edit `nextjs-console/package.json`:
```json
{
  "scripts": {
    "start": "next start -p 3001"
  }
}
```

### Reverse Proxy (Nginx)

```nginx
# Serve Next.js console at /console
location /console {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Backend API
location /api {
    proxy_pass http://localhost:8081;
}
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Backend Connection Error

Check:
1. Backend is running on port 8081
2. CORS is configured in backend
3. Next.js proxy is configured in `next.config.js`

### Styling Issues

Check:
1. `styles/globals.css` is imported in `app/layout.tsx`
2. Inter Tight font is loading from Google Fonts
3. CSS variables are defined in `:root`

## Next Steps

After migration:

1. Add streaming responses (SSE)
2. Add attachment preview chips
3. Add JSON schema viewer
4. Add blueprint preview renderer
5. Add markdown rendering for AI responses
6. Add code syntax highlighting

## Status

- [x] Next.js console built
- [x] API integration configured
- [x] Backend running on port 8081
- [ ] Node.js installed
- [ ] Dependencies installed
- [ ] Console tested
- [ ] Navigation updated
- [ ] Old console moved to legacy
- [ ] Documentation updated

