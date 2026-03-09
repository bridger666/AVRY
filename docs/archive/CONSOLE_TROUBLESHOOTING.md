# AI Console Troubleshooting Guide

## Issue: Unable to send messages through console chat

### Quick Checklist

1. **Backend Server Running?**
   ```bash
   # Check if backend is running on port 8081
   curl http://localhost:8081/health
   
   # If not running, start it:
   cd ~/Documents/Aivory
   uvicorn app.main:app --reload --port 8081
   ```

2. **Environment Variables Set?**
   ```bash
   # Check .env.local file
   cat .env.local
   
   # Should contain:
   # SUMOPOD_API_KEY=sk-sN-XLH9gHi32voS7BWq-iw
   # SUMOPOD_BASE_URL=https://ai.sumopod.com/v1
   ```

3. **Test Console API Endpoint**
   ```bash
   # Run the test script
   python test_console_api.py
   ```

4. **Check Browser Console for Errors**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try sending a message
   - Look for any error messages

5. **Check Network Tab**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try sending a message
   - Check if request is being sent to `http://localhost:8081/api/console/message`
   - Check response status code and body

### Common Issues & Solutions

#### Issue 1: CORS Error
**Symptom**: Browser console shows CORS error

**Solution**: Backend CORS is configured to allow all origins (`*`), but if you see CORS errors:
```python
# In app/main.py, verify CORS middleware:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Issue 2: Connection Refused
**Symptom**: `ERR_CONNECTION_REFUSED` or `Failed to fetch`

**Solution**: Backend server is not running. Start it:
```bash
cd ~/Documents/Aivory
uvicorn app.main:app --reload --port 8081
```

#### Issue 3: 500 Internal Server Error
**Symptom**: API returns 500 error

**Solution**: Check backend logs for errors. Common causes:
- Missing Sumopod API key
- Invalid model configuration
- Missing service dependencies

**Check logs**:
```bash
# Backend should print errors to console
# Look for Python tracebacks
```

#### Issue 4: 402 Insufficient Credits
**Symptom**: Modal shows "Insufficient Credits"

**Solution**: This is expected if credits are 0. The demo user starts with 50 credits. To reset:
```python
# In app/services/credit_manager.py
# The get_credits() method returns mock data
# You can modify it to return more credits for testing
```

#### Issue 5: Model Not Found
**Symptom**: Error about invalid model

**Solution**: Verify model configuration:
```bash
# Check app/config/model_config.py
# Should use: deepseek-v3-2-free
```

### Step-by-Step Debugging

1. **Start Backend with Verbose Logging**
   ```bash
   cd ~/Documents/Aivory
   uvicorn app.main:app --reload --port 8081 --log-level debug
   ```

2. **Open Console in Browser**
   ```
   http://localhost/frontend/console.html?tier=operator
   ```

3. **Open Browser DevTools (F12)**
   - Console tab: Check for JavaScript errors
   - Network tab: Monitor API requests

4. **Send Test Message**
   - Type: "Hello"
   - Click Send
   - Watch for:
     - Request in Network tab
     - Response status code
     - Response body
     - Any errors in Console tab

5. **Check Backend Logs**
   - Look for incoming request log
   - Look for any Python errors
   - Check if Sumopod API is being called

### Manual API Test

Test the endpoint directly with curl:

```bash
curl -X POST http://localhost:8081/api/console/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, can you help me?",
    "files": [],
    "workflow": null,
    "context": {
      "tier": "operator",
      "user_id": "demo_user"
    }
  }'
```

Expected response:
```json
{
  "response": "Hello! I'm AIVORY AI Console...",
  "reasoning": {...},
  "credits_remaining": 49,
  "timestamp": "2026-02-15T..."
}
```

### Verify Services

Check that all required services are working:

```python
# Test in Python console
python
>>> from app.services.console_service import ConsoleService
>>> from app.config.model_config import ModelSelector
>>> 
>>> # Check model selection
>>> model = ModelSelector.get_model_for_task("console_chat")
>>> print(model)  # Should print: deepseek-v3-2-free
>>> 
>>> # Check Sumopod client
>>> from app.llm.sumopod_client import SumopodClient
>>> client = SumopodClient()
>>> print(client.api_key)  # Should print your API key
>>> print(client.base_url)  # Should print: https://ai.sumopod.com/v1
```

### Still Not Working?

If none of the above works, try:

1. **Restart Everything**
   ```bash
   # Stop backend (Ctrl+C)
   # Clear browser cache
   # Restart backend
   uvicorn app.main:app --reload --port 8081
   # Refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
   ```

2. **Check Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify File Permissions**
   ```bash
   ls -la app/services/console_service.py
   ls -la app/api/routes/console.py
   ```

4. **Test Sumopod API Directly**
   ```bash
   curl -X POST https://ai.sumopod.com/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk-sN-XLH9gHi32voS7BWq-iw" \
     -d '{
       "model": "deepseek-v3-2-free",
       "messages": [
         {"role": "user", "content": "Hello"}
       ],
       "temperature": 0.3,
       "max_tokens": 100
     }'
   ```

### Contact Support

If you're still having issues, provide:
- Browser console errors (screenshot)
- Network tab showing failed request (screenshot)
- Backend logs (text)
- Output of `python test_console_api.py`

---

**Last Updated**: February 15, 2026
