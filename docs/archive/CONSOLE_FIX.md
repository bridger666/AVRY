# Console Chat Fix - Quick Guide

## Problem
Console is loaded as `file://` instead of `http://localhost`, causing JavaScript to fail.

## Solution: Start Web Server

### Option 1: Python Simple Server (Recommended)
```bash
cd ~/Documents/Aivory/frontend
python3 -m http.server 8080
```

Then open: **http://localhost:8080/console.html?tier=operator**

### Option 2: Use Existing Simple Server
```bash
cd ~/Documents/Aivory
python3 simple_server.py
```

Then open: **http://localhost/frontend/console.html?tier=operator**

### Option 3: XAMPP (if already running)
If XAMPP is running, open: **http://localhost/frontend/console.html?tier=operator**

## Quick Test

1. Start server (choose option above)
2. Open browser to: `http://localhost:8080/console.html?tier=operator`
3. Open DevTools (F12) → Console tab
4. Look for: `✅ VPS Bridge connected` or `⚠️ VPS Bridge unavailable`
5. Type a message and press Enter

## Troubleshooting

### "VPS Bridge unavailable"
This is OK - it will fallback to local backend (Sumopod).

To use VPS Bridge:
1. Deploy bridge to VPS (see vps-bridge/DEPLOYMENT.md)
2. Update API key in `frontend/console.html` line 283
3. Restart browser

### Backend not responding
```bash
# Start backend
cd ~/Documents/Aivory
uvicorn app.main:app --reload --port 8081
```

### Still can't type?
1. Check browser console for errors (F12)
2. Verify server is running: `curl http://localhost:8080/console.html`
3. Try different browser (Chrome/Firefox)
4. Clear browser cache (Cmd+Shift+R)

## Current Setup

**Frontend Server**: http://localhost:8080 (or :80 with XAMPP)
**Backend API**: http://localhost:8081
**VPS Bridge**: http://43.156.108.96:3001 (optional)

## Test Commands

```bash
# Test frontend
curl http://localhost:8080/console.html

# Test backend
curl http://localhost:8081/health

# Test VPS bridge (if deployed)
curl http://43.156.108.96:3001/health
```

## Next Steps

1. ✅ Start web server
2. ✅ Open console in browser
3. ✅ Test sending message
4. 🔄 Deploy VPS bridge (optional, for PicoClaw)
5. 🔄 Configure API key (optional)
