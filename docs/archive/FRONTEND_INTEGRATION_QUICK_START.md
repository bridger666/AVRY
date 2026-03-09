# Frontend Integration - Quick Start Guide

## 🚀 Quick Test (5 Minutes)

### 1. Start Services

```bash
# Terminal 1: Start Backend
cd /path/to/aivory
python3 -m uvicorn app.main:app --reload --port 8081

# Terminal 2: Start Frontend
cd frontend
python3 -m http.server 8080
```

### 2. Open Test Page

```
http://localhost:8080/test-id-chain.html
```

### 3. Run Super Admin Test

1. Click **"Load Test IDs"** button
2. Verify IDs appear in "Current ID Chain" section:
   - ✅ diagnostic_id: `diag_t3n4myidyorn`
   - ✅ snapshot_id: `snap_uk5fttxhm23k`
3. Click **"Generate Test Blueprint"** button
4. Verify blueprint_id appears

**Expected Result:**
```
✓ Blueprint generated successfully!

blueprint_id: bp_...
json_url: /data/blueprints/...
pdf_url: /data/blueprints/...

Complete ID chain established!
```

### 4. Verify ID Chain

Check the floating widget in bottom-right corner:
- All 3 IDs should be green
- Company name should show "Aivory Test Corp"

---

## 🔗 Complete Flow Test (10 Minutes)

### 1. Open Homepage

```
http://localhost:8080/index.html
```

### 2. Complete Diagnostic

1. Click "Start Diagnostic"
2. Answer all 12 questions (any answers)
3. Enter optional info:
   - Email: `test@aivory.id`
   - Company: `Aivory Test Corp`
   - Industry: `Technology`
4. Submit
5. **Verify:** Console shows `✓ Stored diagnostic_id: diag_...`

### 3. Complete Snapshot

1. Click "Upgrade to AI Snapshot" (or navigate to snapshot page)
2. Answer all 30 questions (any answers)
3. Submit
4. **Verify:** Console shows:
   - `📥 Using diagnostic_id: diag_...`
   - `📥 Using user_context: {...}`
   - `✓ Stored snapshot_id: snap_...`

### 4. Generate Blueprint

1. Navigate to blueprint page
2. Click "Generate Blueprint"
3. **Verify:** Console shows `✓ Stored blueprint_id: bp_...`

### 5. Check Complete Chain

Open browser console and type:
```javascript
IDChainManager.logIdChain()
```

**Expected Output:**
```
🔗 ID CHAIN:
  diagnostic_id: diag_...
       ↓
  snapshot_id: snap_...
       ↓
  blueprint_id: bp_...
  user_context: {user_email: "test@aivory.id", company_name: "Aivory Test Corp", ...}
```

---

## 🔧 Super Admin Mode

### Enable via URL

```
http://localhost:8080/index.html?superadmin=GrandMasterRCH
```

**What Happens:**
- Red "SUPER ADMIN MODE" badge appears
- Test IDs auto-load
- Floating ID chain widget appears
- Console shows test IDs

### Enable via Console

```javascript
IDChainManager.loadTestIds()
IDChainManager.showIdChainDisplay()
```

---

## 📊 Verify Data Persistence

### Check LocalStorage

1. Open DevTools (F12)
2. Go to: Application → Local Storage → `http://localhost:8080`
3. Verify keys exist:
   - `aivory_diagnostic_id`
   - `aivory_snapshot_id`
   - `aivory_blueprint_id`
   - `aivory_user_context`

### Check Backend Database

```bash
# Check diagnostic file
cat data/diagnostics/diag_*.json | python3 -m json.tool

# Check snapshot file
cat data/snapshots/snap_*.json | python3 -m json.tool

# Verify User_Context inheritance
cat data/snapshots/snap_*.json | grep -A 3 "company_name"
```

**Expected:**
```json
{
  "company_name": "Aivory Test Corp",
  "user_email": "test@aivory.id",
  "industry": "Technology"
}
```

---

## ✅ Success Checklist

- [ ] Backend running on port 8081
- [ ] Frontend running on port 8080
- [ ] Test page loads without errors
- [ ] Super admin mode loads test IDs
- [ ] Diagnostic stores diagnostic_id
- [ ] Snapshot retrieves diagnostic_id
- [ ] Snapshot stores snapshot_id
- [ ] Blueprint retrieves snapshot_id
- [ ] Floating ID chain widget shows all IDs
- [ ] Console logs show ID operations
- [ ] LocalStorage contains all IDs
- [ ] Backend database files contain real data

---

## 🐛 Common Issues

### Issue: IDs Not Storing

**Solution:**
```javascript
// Clear and reload
IDChainManager.clearAllIds();
location.reload();
```

### Issue: Backend Not Running

**Check:**
```bash
curl http://localhost:8081/api/v1/diagnostic/test-llm
```

**Expected:** JSON response with status

### Issue: Frontend Not Loading

**Check:**
```bash
curl http://localhost:8080/index.html
```

**Expected:** HTML content

### Issue: CORS Errors

**Fix:** Ensure backend allows localhost:8080 in CORS settings

---

## 📝 Quick Commands

```bash
# Start backend
python3 -m uvicorn app.main:app --reload --port 8081

# Start frontend
cd frontend && python3 -m http.server 8080

# Check backend health
curl http://localhost:8081/api/v1/diagnostic/test-llm

# View diagnostic data
cat data/diagnostics/diag_*.json | python3 -m json.tool

# View snapshot data
cat data/snapshots/snap_*.json | python3 -m json.tool

# Clear all test data
rm data/diagnostics/diag_*.json
rm data/snapshots/snap_*.json
```

---

## 🎯 Expected Results

### After Diagnostic:
- ✅ diagnostic_id stored in localStorage
- ✅ user_context stored in localStorage
- ✅ Console shows: `✓ Stored diagnostic_id: diag_...`
- ✅ File created: `data/diagnostics/diag_*.json`

### After Snapshot:
- ✅ snapshot_id stored in localStorage
- ✅ Console shows: `📥 Using diagnostic_id: diag_...`
- ✅ Console shows: `✓ Stored snapshot_id: snap_...`
- ✅ File created: `data/snapshots/snap_*.json`
- ✅ Snapshot file contains inherited user_context

### After Blueprint:
- ✅ blueprint_id stored in localStorage
- ✅ Console shows: `✓ Stored blueprint_id: bp_...`
- ✅ Blueprint contains real company data
- ✅ Complete ID chain visible in widget

---

## 🔗 Useful Links

- Test Page: `http://localhost:8080/test-id-chain.html`
- Homepage: `http://localhost:8080/index.html`
- Super Admin: `http://localhost:8080/index.html?superadmin=GrandMasterRCH`
- Backend API: `http://localhost:8081/docs`

---

**Status:** ✅ Ready for Testing  
**Estimated Test Time:** 5-10 minutes  
**Last Updated:** February 26, 2026
