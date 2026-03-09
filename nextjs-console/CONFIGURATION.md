# VPS Bridge Configuration Setup

This document describes the environment configuration and validation setup for VPS Bridge integration.

## Overview

The configuration system ensures that all required environment variables are present before the application starts, providing clear error messages when configuration is missing.

## Files Created

### 1. `.env.local`
Location: `nextjs-console/.env.local`

Contains the VPS bridge connection details:
```env
VPS_BRIDGE_URL=http://43.156.108.96:3001
VPS_BRIDGE_API_KEY=supersecret-xyz123456789
```

### 2. `lib/config.ts`
Location: `nextjs-console/lib/config.ts`

Configuration module that:
- Loads environment variables
- Validates required variables are present
- Provides typed configuration interface
- Throws clear errors when configuration is missing

**Functions:**
- `getConfig()` - Returns validated configuration (throws on missing vars)
- `validateConfig()` - Returns validation result without throwing

### 3. `instrumentation.ts`
Location: `nextjs-console/instrumentation.ts`

Startup validation that runs when the Next.js server starts:
- Validates configuration on server startup
- Logs clear error messages for missing variables
- Logs success message when configuration is valid

### 4. `app/api/health/route.ts`
Location: `nextjs-console/app/api/health/route.ts`

Health check endpoint at `/api/health` that:
- Validates environment configuration
- Returns JSON status response
- Useful for monitoring and deployment checks

### 5. `next.config.js` (Updated)
Location: `nextjs-console/next.config.js`

Enabled instrumentation hook:
```javascript
experimental: {
  instrumentationHook: true,
}
```

## Usage

### Checking Configuration

**Via Health Endpoint:**
```bash
curl http://localhost:3000/api/health
```

**In Code:**
```typescript
import { getConfig } from '@/lib/config'

const config = getConfig()
console.log(config.VPS_BRIDGE_URL)
console.log(config.VPS_BRIDGE_API_KEY)
```

### Startup Validation

When you start the Next.js server, you'll see:

**Success:**
```
✅ Configuration validation passed
VPS Bridge URL: http://43.156.108.96:3001
VPS Bridge API Key: [CONFIGURED]
```

**Failure:**
```
❌ Configuration validation failed!
Missing required environment variables: VPS_BRIDGE_URL, VPS_BRIDGE_API_KEY
Please ensure these are set in your .env.local file:
  - VPS_BRIDGE_URL
  - VPS_BRIDGE_API_KEY

The application may not function correctly without these variables.
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VPS_BRIDGE_URL` | URL of the VPS bridge server | `http://43.156.108.96:3001` |
| `VPS_BRIDGE_API_KEY` | API key for VPS bridge authentication | `supersecret-xyz123456789` |

## Security Notes

- Environment variables are only accessible on the server-side
- API keys are never exposed to the client
- The health endpoint does not reveal sensitive values
- Configuration validation happens before serving requests

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- ✅ 7.1: System reads VPS_BRIDGE_URL and VPS_BRIDGE_API_KEY from .env.local
- ✅ 7.2: Application validates required environment variables on startup
- ✅ 7.3: Clear error messages for missing configuration
- ✅ 7.4: VPS_BRIDGE_API_KEY not exposed to frontend
- ✅ 7.5: Configuration validation endpoint for health checks
