# VPS Bridge Testing Guide

This guide provides comprehensive testing procedures for all VPS Bridge endpoints.

## Prerequisites

- VPS Bridge server running on http://43.156.108.96:3001
- Valid API key: `supersecret-xyz123456789`
- curl or Postman installed

## Test 1: Health Check

**Purpose**: Verify server is running and OpenRouter API key is configured

```bash
curl http://43.156.108.96:3001/health
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-02-28T...",
  "checks": {
    "openrouter_api_key_set": true
  }
}
```

**Failure Cases**:
- Status "down" (503): OpenRouter API key not configured
- Connection refused: Server not running

---

## Test 2: Free Diagnostic (12 Questions)

**Purpose**: Test free diagnostic endpoint with 12-question format

```bash
curl -X POST http://43.156.108.96:3001/diagnostics/free/run \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "organization_id": "test-org-001",
    "mode": "free",
    "answers": {
      "q1": 2,
      "q2": 1,
      "q3": 2,
      "q4": 1,
      "q5": 2,
      "q6": 1,
      "q7": 2,
      "q8": 1,
      "q9": 2,
      "q10": 1,
      "q11": 2,
      "q12": 1
    },
    "language": "en"
  }'
```

**Expected Response** (200 OK):
```json
{
  "diagnostic_id": "string",
  "ai_readiness_score": 50,
  "maturity_level": "Emerging",
  "strengths": ["...", "..."],
  "primary_constraints": ["...", "..."],
  "automation_opportunities": ["...", "..."],
  "narrative_summary": "...",
  "recommended_next_step": "..."
}
```

**Validation**:
- `ai_readiness_score`: integer 0-100
- `maturity_level`: one of "Awareness", "Emerging", "Developing", "Advanced", "Leading"
- `strengths`: array of 2-4 strings
- `primary_constraints`: array of 2-5 strings
- `automation_opportunities`: array of 3-7 strings

**Error Cases**:

Missing API key (401):
```bash
curl -X POST http://43.156.108.96:3001/diagnostics/free/run \
  -H "Content-Type: application/json" \
  -d '{"organization_id": "test", "mode": "free", "answers": {}}'
```

Invalid mode (422):
```bash
curl -X POST http://43.156.108.96:3001/diagnostics/free/run \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "organization_id": "test",
    "mode": "invalid",
    "answers": {"q1": 1}
  }'
```

Wrong number of questions (422):
```bash
curl -X POST http://43.156.108.96:3001/diagnostics/free/run \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "organization_id": "test",
    "mode": "free",
    "answers": {"q1": 1, "q2": 2}
  }'
```

---

## Test 3: Deep Diagnostic

**Purpose**: Test deep diagnostic endpoint with full diagnostic payload

```bash
curl -X POST http://43.156.108.96:3001/diagnostics/run \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "organization_id": "test-org-001",
    "mode": "deep",
    "diagnostic_payload": {
      "company_name": "Acme Corp",
      "industry": "retail",
      "size": "sme",
      "current_tech_stack": ["CRM", "ERP", "Email"],
      "pain_points": ["Manual data entry", "Slow reporting"],
      "objectives": ["Automate workflows", "Improve decision making"],
      "budget": "medium",
      "timeline": "6 months"
    }
  }'
```

**Expected Response** (200 OK):
```json
{
  "diagnostic_id": "string",
  "ai_readiness_score": 65,
  "maturity_level": "Developing",
  "strengths": ["...", "..."],
  "primary_constraints": ["...", "..."],
  "automation_opportunities": ["...", "..."],
  "narrative_summary": "...",
  "recommended_next_step": "..."
}
```

**Model Used**: qwen/qwen3-14b (deeper reasoning)

---

## Test 4: Console Chat Streaming

**Purpose**: Test console streaming endpoint with Server-Sent Events

```bash
curl -X POST http://43.156.108.96:3001/console/stream \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "session_id": "test-session-001",
    "messages": [
      {
        "role": "user",
        "content": "What is AI readiness and why does it matter?"
      }
    ]
  }'
```

**Expected Response** (200 OK, streaming):
```
data: {"delta": "AI", "done": false}

data: {"delta": " readiness", "done": false}

data: {"delta": " refers", "done": false}

...

data: {"delta": "", "done": true}
```

**Validation**:
- Response should stream in real-time
- Content-Type: text/event-stream
- Each chunk should be valid JSON
- Final chunk should have "done": true

**Multi-turn conversation**:
```bash
curl -X POST http://43.156.108.96:3001/console/stream \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "session_id": "test-session-001",
    "messages": [
      {
        "role": "user",
        "content": "What is AI readiness?"
      },
      {
        "role": "assistant",
        "content": "AI readiness is the measure of how prepared an organization is to adopt and benefit from AI technologies..."
      },
      {
        "role": "user",
        "content": "How can I improve it?"
      }
    ]
  }'
```

---

## Test 5: Mobile Console (Non-streaming)

**Purpose**: Test mobile console endpoint for WhatsApp/Telegram integration

```bash
curl -X POST http://43.156.108.96:3001/console/mobile \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "session_id": "whatsapp-session-001",
    "message": "What is AI readiness?"
  }'
```

**Expected Response** (200 OK):
```json
{
  "response": "AI readiness is the measure of how prepared an organization is to adopt and benefit from AI technologies. It encompasses several key factors..."
}
```

**Model Used**: qwen/qwen3-8b (fast, lightweight)

---

## Test 6: Blueprint Generation

**Purpose**: Test blueprint generation endpoint

```bash
curl -X POST http://43.156.108.96:3001/blueprints/generate \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "organization_id": "test-org-001",
    "diagnostic_id": "diag-001",
    "objective": "Automate customer support and improve response times",
    "constraints": {
      "budget": "medium",
      "timeline": "6 months",
      "team_size": "small"
    },
    "industry": "retail"
  }'
```

**Expected Response** (200 OK):
```json
{
  "blueprint_id": "string",
  "version": "1",
  "status": "draft",
  "organization": {
    "name": "string",
    "industry": "retail",
    "size": "sme"
  },
  "diagnostic_summary": {
    "ai_readiness_score": 65,
    "maturity_level": "Developing",
    "primary_constraints": []
  },
  "strategic_objective": {
    "primary_goal": "string",
    "kpi_targets": [
      {"metric": "string", "target": "string"}
    ]
  },
  "system_architecture": {
    "data_sources": [],
    "processing_layers": [],
    "decision_engine": "string",
    "memory_layer": "string",
    "execution_layer": []
  },
  "workflow_modules": [
    {
      "workflow_id": "string",
      "name": "string",
      "trigger": "string",
      "steps": [
        {"type": "ingestion", "action": "string"}
      ],
      "integrations_required": []
    }
  ],
  "risk_assessment": {
    "data_risks": [],
    "operational_risks": [],
    "mitigation_strategies": []
  },
  "deployment_plan": {
    "phase": "string",
    "estimated_impact": "string",
    "estimated_roi_months": 6,
    "waves": [
      {
        "name": "Wave 1",
        "included_workflows": [],
        "notes": "string"
      }
    ]
  }
}
```

**Validation**:
- Should have 3-7 workflow_modules
- All workflow_ids in deployment_plan.waves must match workflow_modules
- step.type must be one of: ingestion, ai_processing, decision, execution, notification, human_review
- organization.size must be one of: micro, sme, mid-market, enterprise

**Model Used**: qwen/qwen3-30b-a3b-thinking-2507 (quality + architecture reasoning)

---

## Test 7: Workflow Synthesis

**Purpose**: Test workflow synthesis endpoint for n8n workflow generation

```bash
curl -X POST http://43.156.108.96:3001/workflows/synthesize \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: supersecret-xyz123456789" \
  -d '{
    "organization_id": "test-org-001",
    "workflow_module": {
      "workflow_id": "wf-001",
      "name": "Customer Support Ticket Triage",
      "trigger": "New support ticket received",
      "steps": [
        {"type": "ingestion", "action": "Receive ticket from email/form"},
        {"type": "ai_processing", "action": "Classify ticket urgency and category"},
        {"type": "decision", "action": "Route to appropriate team"},
        {"type": "notification", "action": "Notify assigned team member"}
      ],
      "integrations_required": ["Email", "Slack", "CRM"]
    }
  }'
```

**Expected Response** (200 OK):
```json
{
  "name": "Customer Support Ticket Triage",
  "nodes": [
    {
      "id": "trigger",
      "name": "Email Trigger",
      "type": "n8n-nodes-base.emailReadImap",
      "position": [250, 300],
      "parameters": {}
    },
    {
      "id": "classify",
      "name": "AI Classification",
      "type": "n8n-nodes-base.openAi",
      "position": [450, 300],
      "parameters": {}
    }
  ],
  "connections": {
    "trigger": {
      "main": [[{"node": "classify", "type": "main", "index": 0}]]
    }
  }
}
```

**Validation**:
- Response must be valid n8n workflow JSON
- Must have trigger node
- All nodes must have id, name, type, position, parameters
- Connections must reference valid node ids

**Model Used**: qwen/qwen3-coder-30b-a3b-instruct (structured JSON/config output)

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": true,
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": null
}
```

**Error Codes**:
- `BAD_REQUEST` (400): Missing or invalid request fields
- `UNAUTHORIZED` (401): Missing or invalid API key
- `VALIDATION_ERROR` (422): Invalid data format or values
- `AI_BACKEND_ERROR` (502): OpenRouter service error
- `AI_BACKEND_UNAVAILABLE` (503): OpenRouter connection failed
- `AI_BACKEND_TIMEOUT` (504): Request timeout
- `LLM_INVALID_RESPONSE` (502): Invalid JSON from LLM (after retry)
- `INTERNAL_SERVER_ERROR` (500): Unexpected server error

---

## Performance Testing

### Latency Benchmarks

Expected response times (approximate):

- Health check: < 50ms
- Free diagnostic: 2-5 seconds
- Deep diagnostic: 5-10 seconds
- Console stream (first token): < 1 second
- Blueprint generation: 15-30 seconds
- Workflow synthesis: 10-20 seconds

### Load Testing

Use Apache Bench or similar tool:

```bash
# Test health check under load
ab -n 1000 -c 10 http://43.156.108.96:3001/health

# Test free diagnostic under load (requires POST data)
ab -n 100 -c 5 -p diagnostic-payload.json \
  -T application/json \
  -H "X-Api-Key: supersecret-xyz123456789" \
  http://43.156.108.96:3001/diagnostics/free/run
```

**Rate Limits**:
- 100 requests per 15 minutes per IP address
- Exceeding limit returns 429 with error code `RATE_LIMIT_EXCEEDED`

---

## Automated Test Suite

Create a test script (`test-all-endpoints.sh`):

```bash
#!/bin/bash

BASE_URL="http://43.156.108.96:3001"
API_KEY="supersecret-xyz123456789"

echo "Testing VPS Bridge Endpoints..."
echo "================================"

# Test 1: Health Check
echo -n "1. Health Check... "
RESPONSE=$(curl -s $BASE_URL/health)
if echo $RESPONSE | grep -q '"status":"ok"'; then
  echo "✅ PASS"
else
  echo "❌ FAIL: $RESPONSE"
fi

# Test 2: Free Diagnostic
echo -n "2. Free Diagnostic... "
RESPONSE=$(curl -s -X POST $BASE_URL/diagnostics/free/run \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -d '{"organization_id":"test","mode":"free","answers":{"q1":2,"q2":1,"q3":2,"q4":1,"q5":2,"q6":1,"q7":2,"q8":1,"q9":2,"q10":1,"q11":2,"q12":1},"language":"en"}')
if echo $RESPONSE | grep -q '"diagnostic_id"'; then
  echo "✅ PASS"
else
  echo "❌ FAIL: $RESPONSE"
fi

# Test 3: Console Stream
echo -n "3. Console Stream... "
RESPONSE=$(curl -s -X POST $BASE_URL/console/stream \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -d '{"session_id":"test","messages":[{"role":"user","content":"Hi"}]}' \
  | head -1)
if echo $RESPONSE | grep -q 'data:'; then
  echo "✅ PASS"
else
  echo "❌ FAIL: $RESPONSE"
fi

# Test 4: Mobile Console
echo -n "4. Mobile Console... "
RESPONSE=$(curl -s -X POST $BASE_URL/console/mobile \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -d '{"session_id":"test","message":"Hi"}')
if echo $RESPONSE | grep -q '"response"'; then
  echo "✅ PASS"
else
  echo "❌ FAIL: $RESPONSE"
fi

echo "================================"
echo "Test suite complete!"
```

Make executable and run:
```bash
chmod +x test-all-endpoints.sh
./test-all-endpoints.sh
```

---

## Troubleshooting

### Issue: Connection Refused

**Cause**: Server not running  
**Solution**: Start server with `pm2 start server.js --name vps-bridge`

### Issue: 401 Unauthorized

**Cause**: Missing or invalid API key  
**Solution**: Include `X-Api-Key: supersecret-xyz123456789` header

### Issue: 502 AI_BACKEND_ERROR

**Cause**: OpenRouter service error  
**Solution**: Check OpenRouter status, verify API key, retry request

### Issue: 504 AI_BACKEND_TIMEOUT

**Cause**: Request took too long  
**Solution**: Retry request, check OpenRouter latency

### Issue: Invalid JSON Response

**Cause**: LLM returned malformed JSON  
**Solution**: VPS Bridge automatically retries once; if still fails, report issue

---

## Next Steps

After testing all endpoints:

1. Document any failures or unexpected behavior
2. Monitor logs for errors: `pm2 logs vps-bridge`
3. Check performance metrics
4. Update frontend to use all VPS Bridge endpoints
5. Deploy to production if not already deployed
