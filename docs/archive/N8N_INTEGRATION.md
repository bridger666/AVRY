# n8n Integration for Aivory

## Overview
Aivory is now integrated with n8n workflow automation running on VPS (43.156.108.96:5678).

## Configuration

### Environment Variables (.env.local)
```bash
N8N_BASE_URL=http://43.156.108.96:5678
N8N_TIMEOUT=10.0
N8N_MAX_RETRIES=3
```

## Components

### 1. N8nClient (`app/integrations/n8n_client.py`)
Core client for n8n integration with:
- Health check monitoring
- Webhook triggering with retry logic
- Exponential backoff (max 3 retries)
- 10-second timeout
- Connection status caching

### 2. API Routes (`app/api/routes/n8n.py`)
FastAPI endpoints:
- `GET /api/n8n/health` - Check n8n connection
- `POST /api/n8n/webhook` - Trigger n8n webhooks

### 3. Test Script (`test_n8n_integration.py`)
Validates connection and webhook functionality.

## Usage

### Health Check
```python
from app.integrations.n8n_client import N8nClient

client = N8nClient(base_url="http://43.156.108.96:5678")
health = await client.health_check()
# Returns: {"status": "connected", "latency_ms": 45.2, "timestamp": "2026-02-24T..."}
```

### Trigger Webhook
```python
response = await client.trigger_webhook(
    webhook_path="/webhook/aivory-diagnostic",
    payload={
        "user_id": "demo_user",
        "diagnostic_type": "snapshot",
        "score": 75
    }
)
```

### API Endpoints

#### Check Health
```bash
curl http://localhost:8081/api/n8n/health
```

#### Trigger Webhook
```bash
curl -X POST http://localhost:8081/api/n8n/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_path": "/webhook/test",
    "payload": {"test": true},
    "method": "POST"
  }'
```

## Testing

Run the test script:
```bash
python test_n8n_integration.py
```

Expected output:
```
============================================================
n8n Integration Test
============================================================

[TEST 1] Health Check
------------------------------------------------------------
Status: connected
Latency: 45.23ms
Timestamp: 2026-02-24T10:30:00.000Z
✅ Health check passed

[TEST 2] Webhook Trigger (Example)
------------------------------------------------------------
⚠️  Webhook trigger failed (expected if webhook not configured)
```

## Error Handling

### Retry Logic
- Max 3 attempts with exponential backoff
- Delays: 2s, 4s, 8s
- Handles timeouts and connection errors

### Status Codes
- `200` - Success
- `503` - n8n unavailable
- `500` - Internal error

## Security Notes

⚠️ **Current Setup**: HTTP (no TLS)
- Connection is NOT encrypted
- Do NOT send sensitive data until SSL is configured
- Temporary setup until reverse proxy + SSL deployment

## Integration Points

### Diagnostic Workflows
Trigger n8n when:
- Snapshot diagnostic completes
- Deep diagnostic completes
- Blueprint generated

### Console Operations
Trigger n8n for:
- Workflow generation
- Log analysis
- System events

## Next Steps

1. Configure n8n webhooks for Aivory events
2. Set up reverse proxy with SSL/TLS
3. Implement authentication tokens
4. Add webhook signature verification
5. Create n8n workflows for:
   - Diagnostic notifications
   - Workflow automation
   - Data synchronization

## Monitoring

Check connection status:
```python
if client.is_connected:
    print("n8n is connected")
```

View logs:
```bash
tail -f logs/aivory.log | grep n8n
```
