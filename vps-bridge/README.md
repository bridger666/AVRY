# Aivory Bridge Service

Secure proxy service that routes all LLM inference from Aivory frontend through VPS → PicoClaw → n8n.

## 🎯 Purpose

**CRITICAL**: Remove all direct LLM API calls from frontend code for:
- **Security**: No API keys exposed in browser
- **Cost Control**: Centralized usage tracking
- **Guardrails**: Content filtering and validation
- **Logging**: Audit trail of all AI interactions

## 🏗️ Architecture

```
┌─────────────────┐
│ Aivory Frontend │ (MacBook localhost)
│  (React/Vite)   │
└────────┬────────┘
         │ HTTP POST /api/chat
         │ Header: X-Api-Key
         ▼
┌─────────────────┐
│  Bridge Service │ (VPS 43.156.108.96:3001)
│   (Node.js)     │
└────────┬────────┘
         │
         ├─► PicoClaw CLI ──► OpenRouter (qwen/qwen-2.5-7b-instruct)
         │
         └─► n8n Webhook (port 5678)
```

## 📦 Components

### 1. Bridge Server (`server.js`)
- Express.js API server
- API key authentication
- Rate limiting (100 req/15min)
- Session management (in-memory)
- PicoClaw execution with shell escaping
- JSON extraction and validation
- n8n webhook triggering
- Winston logging

### 2. Docker Setup
- `Dockerfile`: Production container
- `docker-compose.yml`: Multi-service orchestration
- Health checks and auto-restart

### 3. Nginx Reverse Proxy
- SSL/TLS termination
- Security headers
- Rate limiting
- Subdomain routing (api.aivory.id)

## 🚀 Quick Start

### On VPS:
```bash
cd ~/aivory/vps-bridge
cp .env.example .env
nano .env  # Set API_KEY and other vars
npm install
docker-compose up -d --build
```

### On MacBook:
```bash
# Add to .env.local
echo "VITE_BRIDGE_URL=http://43.156.108.96:3001" >> .env.local
echo "VITE_BRIDGE_API_KEY=your-api-key-from-vps" >> .env.local

# Test connection
cd vps-bridge
node test-bridge.js
```

## 📡 API Endpoints

### POST /api/chat
Main inference endpoint.

**Request:**
```json
{
  "message": "Analyze my AI readiness...",
  "sessionId": "optional-session-id",
  "context": {
    "tier": "operator",
    "userId": "user-123"
  }
}
```

**Headers:**
```
X-Api-Key: your-api-key
Content-Type: application/json
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "score": 75,
    "diagnosis": "Your company shows...",
    "blueprint": { ... },
    "workflows": [ ... ],
    "sessionId": "...",
    "requestId": "...",
    "timestamp": "2026-02-24T..."
  },
  "requestId": "..."
}
```

### GET /api/session/:sessionId
Get conversation history.

### DELETE /api/session/:sessionId
Clear session.

### GET /health
Service health check.

## 🔒 Security Features

1. **API Key Authentication**: Required for all /api/* endpoints
2. **Rate Limiting**: 100 requests per 15 minutes per IP
3. **Shell Escaping**: Prevents command injection
4. **CORS**: Configurable allowed origins
5. **Input Validation**: Max message length, type checking
6. **No Key Exposure**: LLM keys never leave VPS
7. **Logging**: All requests logged with sanitization

## 🧪 Testing

```bash
# Health check
curl http://43.156.108.96:3001/health

# Chat request
curl -X POST http://43.156.108.96:3001/api/chat \
  -H "X-Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'

# Run test suite
node test-bridge.js
```

## 📝 Logging

Logs are written to:
- `logs/combined.log` - All requests
- `logs/error.log` - Errors only
- Console - Real-time output

View logs:
```bash
docker-compose logs -f aivory-bridge
tail -f logs/combined.log
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
PORT=3001
API_KEY=your-secure-random-key
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
N8N_WEBHOOK_URL=http://localhost:5678/webhook/aivory
PICOCLAW_BIN=/usr/local/bin/picoclaw
LOG_LEVEL=info
```

### PicoClaw Config (~/.picoclaw/config.json)
Ensure JSON output is enabled:
```json
{
  "model": "qwen/qwen-2.5-7b-instruct",
  "output_format": "json",
  "temperature": 0.7
}
```

## 🐛 Troubleshooting

### Bridge not responding
```bash
docker-compose restart aivory-bridge
docker-compose logs aivory-bridge
```

### PicoClaw errors
```bash
/usr/local/bin/picoclaw agent -m "test"
cat ~/.picoclaw/config.json
```

### CORS errors
Update CORS_ORIGIN in .env and restart.

### n8n webhook not triggering
Check n8n logs and verify webhook URL.

## 📚 Documentation

- `DEPLOYMENT.md` - Full deployment guide
- `frontend-integration-example.js` - Frontend code examples
- `nginx.conf` - Nginx configuration
- `test-bridge.js` - Test script

## 🔄 Updates

```bash
cd ~/aivory/vps-bridge
git pull
docker-compose down
docker-compose up -d --build
```

## 📞 Support

For issues, check logs first:
```bash
docker-compose logs -f
tail -f logs/error.log
```

## ⚠️ Important Notes

1. **Never commit .env** - Contains API keys
2. **Use HTTPS in production** - See nginx.conf for SSL setup
3. **Monitor rate limits** - Adjust if needed
4. **Backup logs regularly** - For audit trail
5. **Update API key periodically** - Security best practice
