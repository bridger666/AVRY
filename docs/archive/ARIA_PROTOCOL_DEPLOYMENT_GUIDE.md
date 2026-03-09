# ARIA Protocol Deployment Guide

## Issue Identified

The AI Console is showing old behavior (responding in English to Indonesian questions) because the **backend server is using a cached version of the system prompt**.

## Root Cause

The ARIA Protocol v2.0 has been correctly implemented in `app/prompts/console_prompts.py`, but the FastAPI backend server needs to be restarted to load the new prompt.

## Verification Results

✅ **ARIA Protocol is correctly configured:**
- Contains ARIA identity and branding
- Includes multilingual support (English, Bahasa Indonesia, Arabic)
- Has language detection rules
- Includes proper introduction examples in all 3 languages
- Contains Aivory-centric solution guidelines
- Professional Claude Opus-style behavior rules

**Test Results:**
```
✅ PASS: Contains 'ARIA'
✅ PASS: Contains 'Aivory Reasoning & Intelligence Assistant'
✅ PASS: Contains multilingual support
✅ PASS: Contains Bahasa Indonesia
✅ PASS: Contains Arabic
✅ PASS: Contains language detection rules
✅ PASS: Contains 'siapa kamu' example
✅ PASS: Contains introduction requirement
✅ PASS: Contains Aivory-centric solutions
```

## Solution: Restart Backend Server

### Option 1: Using systemctl (if running as service)
```bash
sudo systemctl restart aivory-backend
```

### Option 2: Using PM2 (if using PM2)
```bash
pm2 restart aivory-backend
```

### Option 3: Manual restart
```bash
# Stop the current server (Ctrl+C if running in terminal)
# Then start it again:
cd /path/to/aivory
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 4: Development mode with auto-reload
```bash
cd /path/to/aivory
uvicorn app.main:app --reload
```

## Expected Behavior After Restart

When you send "siapa kamu?" to the AI Console, ARIA should respond in Indonesian:

**Expected Response:**
```
Halo, saya ARIA – Aivory Reasoning & Intelligence Assistant. 
Saya bisa bantu kamu mengatur workflow, blueprint, dan otomatisasi di Aivory. 
Mau mulai dari mana?
```

## ARIA Protocol Features

### 1. Multilingual Support
- **English**: Default language for English speakers
- **Bahasa Indonesia**: Automatically detects and responds in Indonesian
- **Arabic (العربية)**: Automatically detects and responds in Arabic

### 2. Language Detection Rules
- Detects user's language from their message
- Responds in the SAME language
- Switches language when explicitly requested
- Example: "bisa pakai bahasa Indonesia?" → switches to Indonesian

### 3. Professional Behavior
- Claude Opus-style reasoning
- Minimal hallucinations
- Asks for clarification instead of guessing
- Solution-oriented responses
- No filler phrases or sycophantic language

### 4. Aivory-Centric Solutions
- Always prioritizes Aivory/Zenclaw/n8n ecosystem
- External tools only mentioned as temporary/complementary
- Never recommends random free tools as primary solution
- Focuses on what can be built within Aivory platform

### 5. Clear Identity
- Always introduces as "ARIA – Aivory Reasoning & Intelligence Assistant"
- Never claims to be ChatGPT, Claude, or other models
- Consistent branding across all interactions

## Files Modified

1. **app/prompts/console_prompts.py** ✅
   - Contains complete ARIA Protocol v2.0
   - Includes `get_console_system_prompt()` function
   - Tier-specific capabilities

2. **app/services/console_service.py** ✅
   - Uses `get_console_system_prompt()` from prompts module
   - Passes tier, has_snapshot, has_blueprint parameters
   - Correctly builds system message for OpenRouter

3. **app/api/routes/console.py** ✅
   - Passes user context to console service
   - Includes tier, user_id, has_snapshot, has_blueprint

## Testing Checklist

After restarting the backend, test these scenarios:

### Test 1: Indonesian Language Detection
**Input:** "siapa kamu?"
**Expected:** Response in Indonesian introducing ARIA

### Test 2: English Language Detection
**Input:** "who are you?"
**Expected:** Response in English introducing ARIA

### Test 3: Arabic Language Detection
**Input:** "من أنت؟"
**Expected:** Response in Arabic introducing ARIA

### Test 4: Language Switching
**Input:** "Can you answer in English?"
**Expected:** Switches to English and continues in English

### Test 5: Aivory-Centric Solutions
**Input:** "I need to automate my workflow"
**Expected:** Suggests Aivory/Zenclaw/n8n solutions, not external tools

## Troubleshooting

### Issue: Still showing old behavior after restart
**Solution:** Clear browser cache and reload the console page
```bash
# In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Issue: Backend won't start
**Solution:** Check logs for errors
```bash
# Check systemctl logs
sudo journalctl -u aivory-backend -f

# Or check PM2 logs
pm2 logs aivory-backend
```

### Issue: Import errors
**Solution:** Verify Python environment
```bash
# Activate virtual environment
source venv/bin/activate

# Verify imports
python3 -c "from app.prompts.console_prompts import get_console_system_prompt; print('✅ Import successful')"
```

## Next Steps

1. ✅ ARIA Protocol implemented in backend
2. ⏳ **Restart backend server** (REQUIRED)
3. ⏳ Test multilingual behavior
4. ⏳ Verify Aivory-centric solutions
5. ⏳ Monitor user interactions

## Support

If issues persist after restart:
1. Check backend logs for errors
2. Verify OpenRouter API key is configured
3. Test with `test_aria_protocol.py` script
4. Check network connectivity to OpenRouter API

---

**Status:** ARIA Protocol is ready, awaiting backend restart to take effect.
