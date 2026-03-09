# Zeroclaw Migration - Quick Test Guide

## ✅ Migration Complete - Ready to Test

### Quick Test (2 minutes)

1. **Open Console:**
   ```
   http://localhost:3000/console
   ```

2. **Check Browser Console (F12):**
   - Look for: `✅ Zeroclaw connection successful`
   - OR: `❌ Zeroclaw connection failed`

3. **Send Test Message:**
   - Type: "Hello"
   - Click Send
   - Wait for response

4. **Check Network Tab:**
   - Look for POST to `43.156.108.96:3100/webhook`
   - Status: 200
   - Response has `reply` field

### Expected Results

✅ **Success:**
- Connection test passes
- Message sends
- Response appears
- No errors in console

❌ **CORS Error:**
- Console shows: `CORS policy: No 'Access-Control-Allow-Origin'`
- **Fix:** Configure CORS in Zeroclaw (see ZEROCLAW_MIGRATION_SUCCESS.md)

❌ **Connection Error:**
- Console shows: `❌ Zeroclaw connection failed`
- **Check:** Is Zeroclaw running? `./test-zeroclaw-connection.sh`

### Rollback (if needed)

```bash
cd frontend
cp console-streaming-zenclaw-backup.js console-streaming.js
```

Refresh browser.

---

**Status:** ✅ Ready to test  
**Backend:** ✅ Running (tested)  
**Frontend:** ✅ Migrated (verified)
