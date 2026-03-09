# Aivory Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Python 3.11 installed
- XAMPP installed
- Sumopod API key

---

## Step 1: Start Backend (2 minutes)

```bash
# Navigate to project
cd ~/Documents/Aivory

# Activate virtual environment (if not already active)
source venv/bin/activate

# Start server
/opt/homebrew/opt/python@3.11/bin/python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

**Verify:** Open http://localhost:8081/health in browser
- Should see: `{"status": "healthy", ...}`

---

## Step 2: Start Frontend (1 minute)

```bash
# Copy files to XAMPP (if not already done)
cp -r frontend/* /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/

# Start XAMPP Apache
# Open XAMPP Control Panel and click "Start" for Apache
```

**Verify:** Open http://localhost/aivory/frontend/index.html in browser
- Should see Aivory homepage with animated background

---

## Step 3: Test Diagnostics (2 minutes)

### Test Free Diagnostic
1. Click "Run Free Diagnostic"
2. Answer 12 questions
3. Click "Submit Diagnostic"
4. See results with score and badge

### Test AI Snapshot ($15)
1. Click "Run AI Snapshot"
2. Answer 30 questions (or just a few for testing)
3. Click "Run Snapshot ($15)"
4. Wait 5-10 seconds
5. See AI-generated readiness assessment

### Test Deep Diagnostic ($99)
1. Click "Generate AI Blueprint"
2. Answer 30 questions
3. Click "Generate Blueprint ($99)"
4. Wait 10-20 seconds
5. See complete AI system blueprint

---

## Common Commands

### Backend

```bash
# Start backend
cd ~/Documents/Aivory
source venv/bin/activate
/opt/homebrew/opt/python@3.11/bin/python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload

# Stop backend
Ctrl + C

# Check if backend is running
curl http://localhost:8081/health

# Kill backend if stuck
lsof -ti:8081 | xargs kill -9
```

### Frontend

```bash
# Copy files to XAMPP
cp -r frontend/* /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/

# Copy single file
cp frontend/app.js /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/

# View XAMPP logs
tail -f /Applications/XAMPP/xamppfiles/logs/error_log
```

### Testing

```bash
# Test health endpoint
curl http://localhost:8081/health

# Test free diagnostic
curl -X POST http://localhost:8081/api/v1/diagnostic/run \
  -H "Content-Type: application/json" \
  -d '{"answers": [{"question_id": "business_objective", "selected_option": 2}]}'

# Test AI snapshot
curl -X POST http://localhost:8081/api/v1/diagnostic/snapshot \
  -H "Content-Type: application/json" \
  -d '{"answers": [{"question_id": "business_goal_1", "selected_option": "cost_reduction"}], "language": "en"}'
```

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 8081 is in use
lsof -i:8081

# Kill process using port
lsof -ti:8081 | xargs kill -9

# Check Python version
python --version  # Should be 3.11.x

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend not loading
```bash
# Check XAMPP Apache is running
# Open XAMPP Control Panel

# Check file permissions
ls -la /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/

# Hard refresh browser
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows)
```

### API calls failing
```bash
# Check backend is running
curl http://localhost:8081/health

# Check API key is set
cat .env.local

# Check backend logs
# Look at terminal where uvicorn is running
```

### AI responses failing
```bash
# Check API key format (must start with sk-)
cat .env.local

# Test Sumopod directly
curl -X POST https://ai.sumopod.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek-v3-2-251201", "messages": [{"role": "user", "content": "test"}]}'
```

---

## File Locations

### Backend
- Main app: `~/Documents/Aivory/app/main.py`
- Config: `~/Documents/Aivory/.env.local`
- API routes: `~/Documents/Aivory/app/api/routes/`
- LLM clients: `~/Documents/Aivory/app/llm/`

### Frontend
- Development: `~/Documents/Aivory/frontend/`
- Production: `/Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/`
- Main JS: `app.js`
- Questions: `diagnostic-questions-paid.js`
- Styles: `styles.css`

---

## URLs

- **Frontend:** http://localhost/aivory/frontend/index.html
- **Backend API:** http://localhost:8081
- **Health Check:** http://localhost:8081/health
- **API Docs:** http://localhost:8081/docs (FastAPI auto-generated)

---

## Environment Variables

Edit `.env.local`:
```env
SUMOPOD_API_KEY=sk-your-api-key-here
SUMOPOD_BASE_URL=https://ai.sumopod.com/v1
```

---

## Development Workflow

### Making Changes

1. **Backend changes:**
   ```bash
   # Edit files in ~/Documents/Aivory/app/
   # Server auto-reloads (--reload flag)
   # Test changes immediately
   ```

2. **Frontend changes:**
   ```bash
   # Edit files in ~/Documents/Aivory/frontend/
   # Copy to XAMPP
   cp frontend/app.js /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/
   # Hard refresh browser (Cmd+Shift+R)
   ```

### Testing Changes

1. **Backend:** Check terminal for errors
2. **Frontend:** Check browser console (F12)
3. **API:** Use curl or Postman
4. **Integration:** Test full flow in browser

---

## Quick Reference

### Diagnostic Types

| Type | Questions | Time | Model(s) | Price |
|------|-----------|------|----------|-------|
| Free | 12 | <1s | Rule-based | Free |
| Snapshot | 30 | 5-10s | DeepSeek | $15 |
| Blueprint | 30 | 10-20s | DeepSeek + Kimi + GLM | $99 |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/v1/diagnostic/run` | POST | Free diagnostic |
| `/api/v1/diagnostic/snapshot` | POST | AI Snapshot |
| `/api/v1/diagnostic/deep` | POST | Deep Diagnostic |
| `/api/v1/contact` | POST | Contact form |

### Key Functions (Frontend)

| Function | Purpose |
|----------|---------|
| `startPaidDiagnostic(mode)` | Start 30-question flow |
| `submitPaidDiagnostic()` | Submit answers to API |
| `displaySnapshotResults(result)` | Show snapshot results |
| `displayDeepDiagnosticResults(result)` | Show blueprint results |
| `initializeStarAnimation()` | Initialize background animation |

---

## Next Steps

1. **Read full documentation:** `AIVORY_COMPLETE_DOCUMENTATION.md`
2. **Review bug fixes:** `BUG_FIXES_AND_TESTING.md`
3. **Test all features:** Follow testing guide
4. **Customize:** Modify questions, styling, or logic
5. **Deploy:** Follow deployment checklist in main docs

---

## Support

- **Documentation:** See `AIVORY_COMPLETE_DOCUMENTATION.md`
- **Bug Reports:** See `BUG_FIXES_AND_TESTING.md`
- **Quick Start:** This file

---

## Tips

1. **Always use Python 3.11** (not 3.13)
2. **Hard refresh browser** after frontend changes
3. **Check terminal logs** for backend errors
4. **Check browser console** for frontend errors
5. **Test with curl** before testing in browser
6. **Keep backend running** while developing frontend
7. **Copy files to XAMPP** after every frontend change

---

## Keyboard Shortcuts

- **Hard Refresh:** Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
- **Open Console:** F12 or Cmd+Option+I (Mac)
- **Stop Server:** Ctrl+C
- **Clear Terminal:** Cmd+K (Mac) / Ctrl+L (Linux)

---

## Status Indicators

### Backend Running
```
INFO:     Uvicorn running on http://0.0.0.0:8081 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Backend Error
```
ERROR:    [Errno 48] Address already in use
```
**Fix:** Kill process on port 8081

### Frontend Working
- Animated background visible
- Stars flickering
- Buttons clickable
- No console errors

### Frontend Error
- Check browser console (F12)
- Look for red error messages
- Check network tab for failed requests

---

## Emergency Commands

```bash
# Kill everything on port 8081
lsof -ti:8081 | xargs kill -9

# Restart XAMPP
sudo /Applications/XAMPP/xamppfiles/xampp restart

# Clear browser cache
# Chrome: Cmd+Shift+Delete
# Firefox: Cmd+Shift+Delete
# Safari: Cmd+Option+E

# Reset virtual environment
rm -rf venv
/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Clear localStorage (in browser console)
localStorage.clear()
```

---

## Success Checklist

- [ ] Backend starts without errors
- [ ] Health check returns 200
- [ ] Frontend loads with animations
- [ ] Free diagnostic completes
- [ ] AI Snapshot returns results
- [ ] Deep Diagnostic returns blueprint
- [ ] No console errors
- [ ] All buttons work
- [ ] Results display correctly

---

**You're ready to go! 🎉**

Start with the free diagnostic, then test the AI-powered features. Check the full documentation for advanced features and deployment options.
