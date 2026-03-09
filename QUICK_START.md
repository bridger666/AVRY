# 🚀 Quick Start - VPS Bridge Deployment

## TL;DR

**Local server is running and tested ✅**  
**Production deployment ready ⏳**

---

## Deploy to Production (Choose One)

### 🤖 Automated (Recommended)
```bash
./vps-bridge/deploy-to-production.sh
```

### 👨‍💻 Manual
```bash
ssh user@43.156.108.96
cd /opt/aivory/vps-bridge
npm install
pm2 start server.js --name vps-bridge
pm2 save
```

---

## Test After Deployment

```bash
# Health check
curl http://43.156.108.96:3001/health

# Free diagnostic
curl -X POST http://43.156.108.96:3001/diagnostics/free/run \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{"organization_id":"test","mode":"free","answers":{"q1":2,"q2":1,"q3":2,"q4":1,"q5":2,"q6":1,"q7":2,"q8":1,"q9":2,"q10":1,"q11":2,"q12":1},"language":"en"}'
```

---

## Monitor

```bash
# View logs
ssh user@43.156.108.96 'pm2 logs vps-bridge'

# Check status
ssh user@43.156.108.96 'pm2 status'

# Restart
ssh user@43.156.108.96 'pm2 restart vps-bridge'
```

---

## What's Working

✅ Local server running on port 3001  
✅ Health check passing  
✅ Free diagnostic tested with OpenRouter  
✅ Console streaming tested  
✅ All mocks removed from frontend  
✅ Error handling verified  

---

## What's Next

1. Deploy to production (run script above)
2. Test all endpoints
3. Monitor logs
4. Update frontend if needed

---

## Documentation

- **DEPLOYMENT_READY.md** - Full deployment guide
- **DEPLOYMENT_STATUS.md** - Current status
- **vps-bridge/TESTING_GUIDE.md** - Test all endpoints
- **vps-bridge/DEPLOYMENT_INSTRUCTIONS.md** - Detailed steps

---

## Need Help?

Check logs first:
```bash
pm2 logs vps-bridge --lines 50
```

Then review troubleshooting in DEPLOYMENT_READY.md
