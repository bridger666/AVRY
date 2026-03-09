# VPS Bridge Deployment Instructions

## Prerequisites

- Node.js 18+ installed
- OpenRouter API key
- Access to production server (43.156.108.96)

## Deployment Steps

### 1. Copy Files to Production Server

```bash
# From your local machine
scp -r vps-bridge/ user@43.156.108.96:/opt/aivory/
```

### 2. Configure Environment Variables

```bash
# SSH into production server
ssh user@43.156.108.96

# Navigate to VPS Bridge directory
cd /opt/aivory/vps-bridge

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Required variables:
```bash
PORT=3001
API_KEY=supersecret-xyz123456789
CORS_ORIGIN=*
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE
LOG_LEVEL=info
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Test the Server

```bash
# Start server in foreground (for testing)
node server.js

# In another terminal, test health check
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-28T...",
  "checks": {
    "openrouter_api_key_set": true
  }
}
```

### 5. Run as Background Service (Production)

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start VPS Bridge with PM2
pm2 start server.js --name vps-bridge

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup

# View logs
pm2 logs vps-bridge

# Monitor status
pm2 status
```

#### Option B: Using systemd

Create service file:
```bash
sudo nano /etc/systemd/system/vps-bridge.service
```

Service configuration:
```ini
[Unit]
Description=VPS Bridge - AI Gateway for Aivory
After=network.target

[Service]
Type=simple
User=aivory
WorkingDirectory=/opt/aivory/vps-bridge
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vps-bridge

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable vps-bridge
sudo systemctl start vps-bridge
sudo systemctl status vps-bridge
```

View logs:
```bash
sudo journalctl -u vps-bridge -f
```

### 6. Configure Firewall

```bash
# Allow port 3001
sudo ufw allow 3001/tcp

# Verify firewall status
sudo ufw status
```

### 7. Test All Endpoints

#### Health Check
```bash
curl http://43.156.108.96:3001/health
```

#### Free Diagnostic
```bash
curl -X POST http://43.156.108.96:3001/diagnostics/free/run \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "organization_id": "test-org",
    "mode": "free",
    "answers": {
      "q1": 2, "q2": 1, "q3": 2, "q4": 1,
      "q5": 2, "q6": 1, "q7": 2, "q8": 1,
      "q9": 2, "q10": 1, "q11": 2, "q12": 1
    },
    "language": "en"
  }'
```

#### Console Stream
```bash
curl -X POST http://43.156.108.96:3001/console/stream \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "session_id": "test-session",
    "messages": [
      {"role": "user", "content": "What is AI readiness?"}
    ]
  }'
```

## Monitoring

### Check Server Status

```bash
# Using PM2
pm2 status vps-bridge
pm2 logs vps-bridge --lines 100

# Using systemd
sudo systemctl status vps-bridge
sudo journalctl -u vps-bridge -n 100
```

### Monitor Resource Usage

```bash
# CPU and memory
top -p $(pgrep -f "node server.js")

# Or with PM2
pm2 monit
```

### Check Logs

Logs are written to stdout/stderr and captured by PM2 or systemd.

Log format:
```json
{
  "timestamp": "2026-02-28T12:00:00.000Z",
  "level": "info",
  "message": "Request received",
  "request_id": "req_abc123",
  "endpoint": "/diagnostics/free/run",
  "organization_id": "org_xyz"
}
```

## Troubleshooting

### Server Won't Start

1. Check environment variables:
   ```bash
   cat .env
   ```

2. Check for port conflicts:
   ```bash
   lsof -i :3001
   ```

3. Check Node.js version:
   ```bash
   node --version  # Should be 18+
   ```

### Connection Refused

1. Verify server is running:
   ```bash
   ps aux | grep "node server.js"
   ```

2. Check firewall:
   ```bash
   sudo ufw status
   ```

3. Test locally first:
   ```bash
   curl http://localhost:3001/health
   ```

### OpenRouter Errors

1. Verify API key is set:
   ```bash
   grep OPENROUTER_API_KEY .env
   ```

2. Test API key directly:
   ```bash
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer $OPENROUTER_API_KEY"
   ```

### High Memory Usage

1. Check for memory leaks:
   ```bash
   pm2 monit
   ```

2. Restart server:
   ```bash
   pm2 restart vps-bridge
   ```

## Updating the Server

```bash
# Pull latest changes
cd /opt/aivory/vps-bridge
git pull

# Install dependencies
npm install

# Restart server
pm2 restart vps-bridge

# Or with systemd
sudo systemctl restart vps-bridge
```

## Security Considerations

1. **API Key**: Change the default API_KEY in production
2. **CORS**: Restrict CORS_ORIGIN to your frontend domain
3. **Firewall**: Only allow necessary ports
4. **HTTPS**: Consider using nginx as reverse proxy with SSL
5. **Rate Limiting**: Already configured (100 req/15min per IP)

## Production Checklist

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Server starts without errors
- [ ] Health check returns "ok"
- [ ] All 6 endpoints tested
- [ ] Firewall configured
- [ ] Process manager configured (PM2 or systemd)
- [ ] Logs are accessible
- [ ] Monitoring in place
- [ ] API key changed from default
- [ ] CORS restricted to frontend domain

## Support

For issues or questions:
- Check logs first: `pm2 logs vps-bridge` or `journalctl -u vps-bridge`
- Review error codes in VPS_BRIDGE_INTEGRATION_COMPLETE.md
- Test endpoints individually to isolate issues
