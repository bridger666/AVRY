# Aivory Development Server Setup

## Problem Fixed ✅

**Issue**: Frontend was being opened directly from filesystem (`file://`), causing:
- CORS errors on all API calls
- `window.API_BASE_URL` resolving as `undefined`
- Authentication and data fetching failures

**Solution**: Serve frontend through HTTP server on same origin as API

---

## Quick Start

### Option 1: Simple Python Server (Recommended for Frontend Development)

```bash
# From project root
python3 simple_server.py
```

Then open: **http://localhost:8081**

This serves:
- Frontend files from `./frontend/` directory
- Basic API endpoints for diagnostics
- No CORS issues (same origin)

### Option 2: Full FastAPI Backend (For Full Stack Development)

```bash
# Terminal 1: Start FastAPI backend
python3 -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Start frontend server
python3 simple_server.py
```

Then open: **http://localhost:8081**

---

## Using npm Scripts

If you have Node.js installed:

```bash
# Start frontend dev server
npm run dev

# Or
npm start
```

---

## How It Works

### 1. Static File Serving
`simple_server.py` now extends `SimpleHTTPRequestHandler` to serve files from `./frontend/` directory:

```python
class RequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='frontend', **kwargs)
```

### 2. API Base URL Auto-Detection
`frontend/app.js` automatically detects the correct API URL:

```javascript
// Before (broken):
window.API_BASE_URL = process.env.API_URL; // undefined in browser

// After (fixed):
window.API_BASE_URL = window.location.origin; // http://localhost:8081
```

This works because:
- Development: `window.location.origin` = `http://localhost:8081`
- Production: `window.location.origin` = `https://yourdomain.com`
- Always correct, no environment variables needed

### 3. CORS Headers
Server adds CORS headers to all responses:

```python
def end_headers(self):
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    super().end_headers()
```

---

## Available URLs

When server is running on port 8081:

| URL | Description |
|-----|-------------|
| http://localhost:8081 | Landing page (redirects to index.html) |
| http://localhost:8081/index.html | Main landing page |
| http://localhost:8081/dashboard.html | User dashboard |
| http://localhost:8081/console.html | AI Console |
| http://localhost:8081/workflows.html | Workflows page |
| http://localhost:8081/logs.html | Execution logs |
| http://localhost:8081/api/health | API health check |
| http://localhost:8081/api/v1/diagnostic/run | Diagnostic API |

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8081
lsof -i :8081

# Kill the process
kill -9 <PID>

# Or change port in simple_server.py:
PORT = 8082  # Use different port
```

### API Calls Still Failing

1. Check browser console for `API_BASE_URL`:
   ```javascript
   console.log(window.API_BASE_URL);
   // Should show: http://localhost:8081
   ```

2. Verify you're accessing via HTTP, not file://:
   ```
   ✅ http://localhost:8081/index.html
   ❌ file:///Users/you/project/frontend/index.html
   ```

3. Check server is running:
   ```bash
   curl http://localhost:8081/api/health
   # Should return: {"status":"healthy","llm_available":false}
   ```

### CORS Errors Persist

If you still see CORS errors:
1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Check you're not mixing HTTP/HTTPS requests
4. Verify server logs show the request

---

## Production Deployment

For production, you'll want a proper web server:

### Option 1: Nginx + FastAPI

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Serve frontend
    location / {
        root /var/www/aivory/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API to FastAPI
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 2: FastAPI Static Files

Update `app/main.py`:

```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
```

---

## Development Workflow

1. **Start server**: `python3 simple_server.py`
2. **Open browser**: http://localhost:8081
3. **Make changes**: Edit files in `frontend/` directory
4. **Refresh browser**: Changes appear immediately (no build step)
5. **Check console**: Monitor for errors and API calls

---

## Key Files Modified

- `simple_server.py` - Now serves static files + API
- `frontend/app.js` - Fixed API_BASE_URL detection
- `package.json` - Added npm scripts for convenience

---

## Next Steps

1. Start the server: `python3 simple_server.py`
2. Open http://localhost:8081 in your browser
3. Verify no CORS errors in console
4. Test API calls (diagnostic, auth, etc.)
5. Confirm `window.API_BASE_URL` shows correct URL

**Server is running on port: 8081**
