# Aivory Bridge Deployment Guide

## Overview
Secure bridge service that routes all LLM calls from Aivory frontend → VPS → PicoClaw → n8n.
**NO LLM KEYS IN FRONTEND CODE.**

## Architecture
```
Frontend (MacBook) → VPS Bridge (43.156.108.96:3001) → PicoClaw → OpenRouter
                                    ↓
                                  n8n Webhook
```

## Prerequisites on VPS
- Ubuntu with Docker installed
- PicoClaw installed at `/usr/local/bin/picoclaw`
- PicoClaw config at `~/.picoclaw/config.json`
- n8n running on port 5678

## Step 1: Deploy to VPS

### 1.1 Copy files to VPS
```bash
# From MacBook
scp -r vps-bridge root@43.156.108.96:~/aivory/
```

### 1.2 SSH into VPS
```bash
ssh root@43.156.108.96
cd ~/aivory/vps-bridge
```

### 1.3 Configure environment
```bash
cp .env.example .env
nano .env
```

Set these values:
```bash
PORT=3001
API_KEY=$(openssl rand -hex 32)  # Generate secure key
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
N8N_WEBHOOK_URL=http://localhost:5678/webhook/aivory
PICOCLAW_BIN=/usr/local/bin/picoclaw
LOG_LEVEL=info
```

Save the `API_KEY` - you'll need it for frontend!

### 1.4 Install dependencies
```bash
npm install
```

### 1.5 Test locally first
```bash
npm start
```

In another terminal:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"healthy","timestamp":"...","uptime":...}
```

## Step 2: Docker Deployment

### 2.1 Build and start
```bash
docker-compose up -d --build
```

### 2.2 Check logs
```bash
docker-compose logs -f aivory-bridge
```

### 2.3 Test endpoint
```bash
curl http://43.156.108.96:3001/health
```

## Step 3: Configure n8n Webhook

### 3.1 Access n8n
```bash
http://43.156.108.96:5678
```

### 3.2 Create webhook workflow
1. Create new workflow
2. Add "Webhook" trigger node
3. Set path: `/webhook/aivory`
4. Set method: `POST`
5. Add processing nodes (e.g., store to database, send notifications)
6. Activate workflow

### 3.3 Test webhook
```bash
curl -X POST http://43.156.108.96:5678/webhook/aivory \
  -H "Content-Type: application/json" \
  -d '{"test": true, "score": 75}'
```

## Step 4: Frontend Integration

### 4.1 Update .env.local on MacBook
```bash
# In your Aivory project root
echo "VITE_BRIDGE_URL=http://43.156.108.96:3001" >> .env.local
echo "VITE_BRIDGE_API_KEY=YOUR_API_KEY_FROM_VPS" >> .env.local
```

### 4.2 Remove direct LLM calls
Search and remove:
- `openai.createChatCompletion`
- `fetch('https://api.openai.com')`
- `fetch('https://openrouter.ai')`
- Any API keys in frontend code

### 4.3 Replace with bridge calls
See `frontend-integration-example.js` for code samples.

## Step 5: SSL/HTTPS Setup (Production)

### 5.1 Install Certbot
```bash
apt update
apt install certbot python3-certbot-nginx
```

### 5.2 Get SSL certificate
```bash
certbot --nginx -d api.aivory.id
```

### 5.3 Copy Nginx config
```bash
cp nginx.conf /etc/nginx/sites-available/aivory-bridge
ln -s /etc/nginx/sites-available/aivory-bridge /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5.4 Update frontend to use HTTPS
```bash
VITE_BRIDGE_URL=https://api.aivory.id
```

## Testing

### From VPS
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message", "sessionId": "test-123"}'
```

### From MacBook
```bash
cd vps-bridge
API_KEY=YOUR_API_KEY BRIDGE_URL=http://43.156.108.96:3001 node test-bridge.js
```

## Monitoring

### Check service status
```bash
docker-compose ps
```

### View logs
```bash
docker-compose logs -f aivory-bridge
tail -f logs/combined.log
tail -f logs/error.log
```

### Check resource usage
```bash
docker stats aivory-bridge
```

## Troubleshooting

### Bridge not responding
```bash
docker-compose restart aivory-bridge
docker-compose logs aivory-bridge
```

### PicoClaw errors
```bash
# Test PicoClaw directly
/usr/local/bin/picoclaw agent -m "test message"

# Check config
cat ~/.picoclaw/config.json
```

### n8n webhook not triggering
```bash
# Check n8n logs
docker-compose logs n8n

# Test webhook directly
curl -X POST http://localhost:5678/webhook/aivory -d '{"test":true}'
```

### CORS errors
Update `.env`:
```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://yourdomain.com
```

Restart:
```bash
docker-compose restart aivory-bridge
```

## Security Checklist

- [ ] API_KEY is strong random string (32+ chars)
- [ ] API_KEY not committed to git
- [ ] CORS_ORIGIN restricted to your domains
- [ ] Rate limiting enabled (100 req/15min)
- [ ] SSL/HTTPS configured for production
- [ ] Nginx security headers enabled
- [ ] No LLM keys in frontend code
- [ ] Logs don't contain sensitive data
- [ ] Docker containers run as non-root
- [ ] Firewall rules configured (UFW)

## Firewall Setup
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3001/tcp  # Bridge (temporary, remove after Nginx)
ufw enable
```

## Backup
```bash
# Backup logs
tar -czf aivory-bridge-logs-$(date +%Y%m%d).tar.gz logs/

# Backup config
cp .env .env.backup
```

## Updates
```bash
cd ~/aivory/vps-bridge
git pull  # If using git
docker-compose down
docker-compose up -d --build
```
