# VPS Bridge Gateway Routing - Implementation Complete

**Date**: March 1, 2026  
**Status**: ✅ Complete

## Overview

Successfully rerouted plain chat endpoints from OpenRouter to internal n8n gateway while keeping structured endpoints (diagnostics, blueprints, workflows) on OpenRouter.

## Changes Made

### 1. New Gateway Client (`vps-bridge/gatewayClient.js`)

Created dedicated client for internal n8n gateway:
- **Gateway URL**: `http://43.156.108.96:5678/webhook/755fcac8-dc36-49e3-9553-67e62bac82e8`
- **Request format**: `{ "message": "<user message>" }`
- **Response format**: `{ "model": "...", "response": "..." }`
- **Features**:
  - Error mapping and handling
  - Request/response logging
  - Health check function
  - 60-second timeout

### 2. Updated Endpoints (`vps-bridge/endpoints.js`)

**Modified `/console/mobile`**:
- Changed from OpenRouter to gateway routing
- Removed model routing logic
- Simplified to direct gateway call
- Still requires `organization_id` for tracking

**Added `/aria` endpoint**:
- New plain chat endpoint
- Routes through gateway
- Minimal validation (only `message` field required)
- No `organization_id` requirement
- Simpler authentication flow

### 3. Server Configuration (`vps-bridge/server.js`)

**Middleware updates**:
- `/console/stream`, `/console/mobile`: Full enrichment (requires `organization_id`)
- `/aria`: Simple enrichment (no `organization_id` required)
- All endpoints: API key authentication via `X-API-Key` header

**New endpoint registration**:
- `POST /aria` - Plain chat through gateway

## Current Routing Table

| Endpoint | Destination | Model | Streaming | Requires Org ID |
|----------|-------------|-------|-----------|-----------------|
| `/console/stream` | OpenRouter | qwen3-14b | Yes (SSE) | Yes |
| `/console/mobile` | **Gateway** | (gateway decides) | No | Yes |
| `/aria` | **Gateway** | (gateway decides) | No | No |
| `/diagnostics/free/run` | OpenRouter | qwen3-8b | No | Yes |
| `/diagnostics/run` | OpenRouter | qwen3-14b | No | Yes |
| `/blueprints/generate` | OpenRouter | qwen3-30b-a3b-thinking | No | Yes |
| `/workflows/synthesize` | OpenRouter | qwen3-coder-30b-a3b | No | Yes |

## Testing Results

### ✅ `/aria` Endpoint Test
```bash
curl -X POST http://localhost:3001/aria \
  -H "Content-Type: application/json" \
  -H "X-API-Key: supersecret-xyz123456789" \
  -d '{"message": "Hello, what is Aivory?"}'
```

**Response**: 
```json
{
  "response": "Hello, Aivory13! 🦀 I'm A.R.I.A, your personal assistant..."
}
```

### ✅ `/console/mobile` Endpoint Test
```bash
curl -X POST http://localhost:3001/console/mobile \
  -H "Content-Type: application/json" \
  -H "X-API-Key: supersecret-xyz123456789" \
  -d '{
    "organization_id": "test-org-123",
    "session_id": "test-session-456",
    "message": "Hello, what is Aivory?"
  }'
```

**Response**:
```json
{
  "response": "Hey Aivory13, looks like you sent an empty message!..."
}
```

## Architecture Benefits

### Why Gateway for Plain Chat?
1. **Centralized model routing**: Gateway handles model selection logic
2. **Simplified VPS Bridge**: Less model configuration in bridge code
3. **Flexibility**: Can change models without redeploying VPS Bridge
4. **Cost optimization**: Gateway can implement smart routing based on load

### Why OpenRouter for Structured Endpoints?
1. **JSON validation**: OpenRouter provides reliable JSON parsing
2. **Schema enforcement**: Structured outputs need validation
3. **Retry logic**: Built-in JSON repair for malformed responses
4. **Stability**: Critical business logic needs proven infrastructure

## Files Modified

1. `vps-bridge/gatewayClient.js` - **NEW**
2. `vps-bridge/endpoints.js` - Modified `handleMobileConsole`, added `handleAriaChat`
3. `vps-bridge/server.js` - Updated middleware, added `/aria` endpoint

## VPS Bridge Status

- **Process ID**: 12
- **Port**: 3001
- **Status**: Running
- **Started**: March 1, 2026 at 14:59:30 UTC

## Next Steps

### Recommended
1. Monitor gateway response times and error rates
2. Add gateway health check to `/health` endpoint
3. Consider adding request/response caching for common queries
4. Implement rate limiting per session_id for mobile endpoint

### Future Enhancements
1. Add streaming support to gateway for `/console/stream` migration
2. Implement structured payload support in gateway for diagnostics/blueprints
3. Add A/B testing framework to compare OpenRouter vs Gateway quality
4. Create dashboard for gateway vs OpenRouter metrics

## Rollback Plan

If gateway issues occur:

1. Stop VPS Bridge: `kill <process-id>`
2. Revert `endpoints.js`:
   - Change `handleMobileConsole` back to OpenRouter
   - Remove `handleAriaChat` or point to OpenRouter
3. Revert `server.js`:
   - Remove `/aria` endpoint or point to OpenRouter handler
4. Restart VPS Bridge: `node server.js`

## Notes

- Gateway currently returns responses with emoji and casual tone
- ARIA system prompt is NOT being applied by gateway (gateway has its own prompt)
- For ARIA protocol compliance, gateway needs to be updated with ARIA system prompt
- `/console/stream` remains on OpenRouter until gateway supports SSE streaming
