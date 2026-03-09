# Configuration Module

This directory contains utility modules for the Next.js console application.

## config.ts

The configuration module handles environment variable loading and validation for VPS Bridge integration.

### Usage

```typescript
import { getConfig } from '@/lib/config'

// Get validated configuration (throws if missing vars)
const config = getConfig()
console.log(config.VPS_BRIDGE_URL)
console.log(config.VPS_BRIDGE_API_KEY)
```

### Environment Variables

The following environment variables must be set in `.env.local`:

- `VPS_BRIDGE_URL` - The URL of the VPS bridge server (e.g., http://43.156.108.96:3001)
- `VPS_BRIDGE_API_KEY` - The API key for authenticating with the VPS bridge

### Validation

Configuration is validated automatically on server startup via `instrumentation.ts`. If required variables are missing, the server will log clear error messages indicating which variables need to be configured.

You can also check configuration health via the `/api/health` endpoint:

```bash
curl http://localhost:3000/api/health
```

Response when healthy:
```json
{
  "status": "healthy",
  "message": "All required environment variables are configured",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Response when unhealthy:
```json
{
  "status": "unhealthy",
  "error": "Missing required environment variables",
  "missingVars": ["VPS_BRIDGE_URL", "VPS_BRIDGE_API_KEY"],
  "message": "Please configure the following environment variables in .env.local: VPS_BRIDGE_URL, VPS_BRIDGE_API_KEY"
}
```
