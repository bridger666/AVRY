# VPS Bridge Integration Complete

## ✅ What Changed

### 1. Frontend Console (`frontend/console.js`)
- Added VPS Bridge client initialization
- Modified `sendMessage()` to route through VPS bridge
- Fallback to local backend if VPS unavailable
- Health check on page load
- Displays PicoClaw model info in reasoning panel

### 2. New VPS Bridge Client (`frontend/vps-bridge-client.js`)
- Standalone client for VPS communication
- Session management
- Error handling
- Health checks

### 3. Console HTML (`frontend/console.html`)
- Added VPS bridge client script
- Configuration variables

### 4. Environment Config (`.env.local`)
- Added VPS_BRIDGE_URL
- Added VPS_BRIDGE_API_KEY

## 🔄 Message Flow

```
User types message in console
         ↓
frontend/console.js checks if VPS bridge available
         ↓
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ↓         ↓
VPS Bridge  Local Backend
(PicoClaw)  (Sumopod)
    │         │
    ↓         ↓
Response displayed in console
```

## 🚀 Setup Instructions

### Step 1: Deploy VPS Bridge
```bash
# On VPS (43.156.108.96)
cd ~/aivory/vps-bridge
cp .env.example .env
nano .env  # Set API_KEY

# Generate secure API key
openssl rand -hex 32

# Install and start
npm install
docker-compose up -d --build
```

### Step 2: Configure Frontend
```bash
# On MacBook
cd ~/Documents/Aivory

# Update .env.local with API key from VPS
nano .env.local
```

Add:
```bash
VPS_BRIDGE_URL=http://43.156.108.96:3001
VPS_BRIDGE_API_KEY=your-api-key-from-vps
```

### Step 3: Update console.html
Edit `frontend/console.html` and replace:
```javascript
window.VPS_BRIDGE_API_KEY = 'your-api-key-here';
```

With your actual API key from VPS.

### Step 4: Test Connection
```bash
# Open console
open http://localhost/frontend/console.html?tier=operator

# Check browser console for:
# ✅ VPS Bridge connected
```

## 🧪 Testing

### Test 1: VPS Bridge Health
```bash
curl http://43.156.108.96:3001/health
```

Expected:
```json
{"status":"healthy","timestamp":"...","uptime":123}
```

### Test 2: Send Message
Open browser console and run:
```javascript
vpsBridgeClient.chat('Test message').then(console.log)
```

### Test 3: Full Flow
1. Open console: `http://localhost/frontend/console.html?tier=operator`
2. Type message: "Analyze my AI readiness"
3. Check response includes PicoClaw model info
4. Verify n8n webhook triggered (check n8n logs)

## 🔍 Debugging

### Check VPS Bridge Logs
```bash
ssh root@43.156.108.96
cd ~/aivory/vps-bridge
docker-compose logs -f aivory-bridge
```

### Check Frontend Console
Open browser DevTools (F12) → Console tab

Look for:
- `✅ VPS Bridge connected` - Bridge is working
- `⚠️ VPS Bridge unavailable` - Falling back to local
- `🚀 Sending to VPS Bridge...` - Message sent to VPS
- `📡 Sending to local backend...` - Using fallback

### Check Network Tab
DevTools → Network tab

Look for:
- `POST http://43.156.108.96:3001/api/chat` - VPS bridge call
- Status 200 - Success
- Status 401 - API key invalid
- Status 429 - Rate limited

## 🔒 Security Notes

1. **API Key**: Never commit to git, use environment variables
2. **CORS**: VPS bridge allows your localhost by default
3. **Rate Limiting**: 100 requests per 15 minutes
4. **HTTPS**: Use SSL in production (see nginx.conf)

## 📊 Monitoring

### VPS Bridge Status
```bash
# Check if running
docker ps | grep aivory-bridge

# View logs
docker-compose logs -f aivory-bridge

# Check resource usage
docker stats aivory-bridge
```

### Frontend Status
Check browser console for connection status indicator.

## 🐛 Troubleshooting

### "VPS Bridge unavailable"
1. Check VPS bridge is running: `docker ps`
2. Check firewall: `ufw status`
3. Test health endpoint: `curl http://43.156.108.96:3001/health`

### "Unauthorized: Invalid API key"
1. Verify API key in `frontend/console.html`
2. Check VPS `.env` file has same key
3. Restart VPS bridge: `docker-compose restart`

### "CORS error"
1. Check VPS `.env` CORS_ORIGIN includes your localhost
2. Restart bridge after changing CORS

### Messages not appearing
1. Check browser console for errors
2. Verify VPS bridge logs show request
3. Check PicoClaw is working: `/usr/local/bin/picoclaw agent -m "test"`

## 🎯 Next Steps

1. **SSL/HTTPS**: Configure nginx reverse proxy
2. **Domain**: Point api.aivory.id to VPS
3. **Monitoring**: Set up logging dashboard
4. **Backup**: Regular backup of VPS bridge logs
5. **Scaling**: Add load balancer if needed

## 📝 Files Modified

- `frontend/console.js` - Added VPS bridge integration
- `frontend/console.html` - Added bridge client script
- `frontend/vps-bridge-client.js` - New bridge client
- `.env.local` - Added VPS bridge config
- `VPS_BRIDGE_INTEGRATION.md` - This file

## ✨ Benefits

✅ No LLM keys in frontend code
✅ Centralized cost control
✅ Audit trail of all AI interactions
✅ Content filtering and guardrails
✅ Automatic n8n webhook triggering
✅ Fallback to local backend if VPS down
✅ Session management
✅ Rate limiting protection

## 🔗 Related Documentation

- `vps-bridge/README.md` - VPS bridge documentation
- `vps-bridge/DEPLOYMENT.md` - Deployment guide
- `vps-bridge/frontend-integration-example.js` - Code examples
