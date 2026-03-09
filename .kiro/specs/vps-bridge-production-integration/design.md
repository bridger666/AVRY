# Design Document: VPS Bridge Production Integration

## Overview

The VPS Bridge Production Integration transforms the VPS Bridge into a production-ready, stable entry point for all AI features in Aivory. The system implements a clean separation of concerns where the Next.js frontend never communicates directly with AI providers or hardcodes model names. Instead, all requests flow through a standardized architecture: Next.js → VPS Bridge → Zenclaw → OpenRouter (Qwen) → back to Aivory.

The design addresses critical production issues including internal server errors, temporary mock responses, lack of standardized error handling, missing health checks, and non-configurable model routing. The solution introduces logical model tags, request enrichment, response normalization, comprehensive error handling, and health monitoring.

## Architecture

### System Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Next.js   │────────▶│ VPS Bridge  │────────▶│  Zenclaw    │────────▶│ OpenRouter  │
│  Frontend   │         │  (Node.js)  │         │  (Python)   │         │   (Qwen)    │
└─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
      │                       │                       │                       │
      │                       │                       │                       │
      └───────────────────────┴───────────────────────┴───────────────────────┘
                              Response Flow
```

### Architectural Principles

1. **Single Entry Point**: VPS Bridge is the only service the frontend communicates with for AI features
2. **Logical Abstraction**: Model tags (e.g., "qwen-console") abstract away provider-specific details
3. **Request Enrichment**: VPS Bridge adds metadata (organization, session, routing) before forwarding
4. **Response Normalization**: All responses follow consistent JSON schemas
5. **Fail-Safe Error Handling**: Errors are caught, logged, and returned in standardized format
6. **Observable**: Comprehensive logging and health checks enable monitoring

### Technology Stack

- **VPS Bridge**: Node.js with Express.js
- **HTTP Client**: axios for Zenclaw communication
- **Logging**: winston for structured logging
- **Validation**: ajv for JSON schema validation
- **Streaming**: Server-Sent Events (SSE) for console chat

## Components and Interfaces

### 1. Model Routing Configuration

**Purpose**: Maps endpoints to logical model tags and use cases

**Structure**:
```javascript
const MODEL_ROUTING = {
  '/console/stream': {
    modelTag: 'qwen-console',
    useCase: 'console',
    streaming: true
  },
  '/diagnostics/run': {
    modelTag: 'qwen-diagnostic',
    useCase: 'diagnostic',
    streaming: false
  },
  '/diagnostics/free/run': {
    modelTag: 'qwen-diagnostic',
    useCase: 'diagnostic',
    streaming: false
  },
  '/blueprints/generate': {
    modelTag: 'qwen-blueprint',
    useCase: 'blueprint',
    streaming: false
  }
};
```

**Responsibilities**:
- Provide centralized routing configuration
- Enable easy addition of new endpoints
- Support both streaming and non-streaming modes

### 2. Request Enrichment Middleware

**Purpose**: Enriches incoming requests with metadata before forwarding to Zenclaw

**Input**: Raw request from Next.js frontend
**Output**: Enriched request envelope

**Process**:
1. Extract endpoint path from request
2. Look up model tag and use case from routing configuration
3. Generate unique request_id
4. Extract organization_id and session_id from request body
5. Construct Request_Envelope:
```javascript
{
  model: "qwen-diagnostic",
  use_case: "diagnostic",
  payload: {
    organization_id: "org_123",
    session_id: "sess_456",  // if applicable
    ...originalRequestBody
  },
  metadata: {
    request_id: "req_abc123",
    timestamp: "2025-02-28T12:34:56.000Z",
    source: "vps-bridge"
  }
}
```

### 3. Zenclaw HTTP Client

**Purpose**: Handles communication with Zenclaw backend

**Configuration**:
```javascript
const zenclawClient = axios.create({
  baseURL: process.env.ZENCLAW_BASE_URL || 'http://localhost:8000',
  timeout: 60000,  // 60 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.ZENCLAW_API_KEY
  }
});
```

**Methods**:
- `sendRequest(envelope)`: Send non-streaming request
- `sendStreamingRequest(envelope, responseStream)`: Send streaming request and pipe response

**Error Handling**:
- Network errors → AI_BACKEND_UNAVAILABLE (503)
- Timeout errors → AI_BACKEND_TIMEOUT (504)
- 4xx from Zenclaw → Forward with context
- 5xx from Zenclaw → AI_BACKEND_ERROR (502)

### 4. Response Normalization Layer

**Purpose**: Ensures all responses conform to expected schemas

**Schemas**:

**DiagnosticResult Schema**:
```javascript
{
  type: 'object',
  required: ['diagnostic_id', 'organization_id', 'score', 'maturity_level'],
  properties: {
    diagnostic_id: { type: 'string' },
    organization_id: { type: 'string' },
    score: { type: 'number', minimum: 0, maximum: 100 },
    maturity_level: { type: 'string', enum: ['Emerging', 'Developing', 'Advancing', 'Leading'] },
    strengths: { type: 'string' },
    blocker: { type: 'string' },
    opportunity: { type: 'string' },
    narrative: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' }
  }
}
```

**Blueprint Schema**:
```javascript
{
  type: 'object',
  required: ['blueprint_id', 'organization_id', 'diagnostic_id', 'version'],
  properties: {
    blueprint_id: { type: 'string' },
    organization_id: { type: 'string' },
    diagnostic_id: { type: 'string' },
    version: { type: 'number' },
    objective: { type: 'string' },
    strategy: { type: 'object' },
    implementation_plan: { type: 'array' },
    success_metrics: { type: 'array' },
    timestamp: { type: 'string', format: 'date-time' }
  }
}
```

**Process**:
1. Receive response from Zenclaw
2. Validate against appropriate schema
3. Log validation warnings if schema doesn't match
4. Return validated response to frontend

### 5. Error Handling Middleware

**Purpose**: Centralized error handling with standardized error envelopes

**Error Categories**:

1. **Client Errors (400, 422)**:
```javascript
{
  error: true,
  code: 'BAD_REQUEST',
  message: 'Missing required field: organization_id',
  details: {
    field: 'organization_id',
    expected: 'string'
  }
}
```

2. **Backend Unavailable (502, 503)**:
```javascript
{
  error: true,
  code: 'AI_BACKEND_UNAVAILABLE',
  message: 'Our AI engine is temporarily unavailable. Please try again in a few minutes.',
  details: null
}
```

3. **Internal Errors (500)**:
```javascript
{
  error: true,
  code: 'INTERNAL_SERVER_ERROR',
  message: 'An unexpected error occurred. Please try again.',
  details: null
}
```

**Implementation**:
```javascript
function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';
  
  // Log full error with stack trace
  logger.error('Request failed', {
    requestId,
    endpoint: req.path,
    organization_id: req.body?.organization_id,
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500
  });
  
  // Determine error category
  let errorEnvelope;
  if (err.statusCode >= 400 && err.statusCode < 500) {
    errorEnvelope = {
      error: true,
      code: 'BAD_REQUEST',
      message: err.message,
      details: err.details || null
    };
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    errorEnvelope = {
      error: true,
      code: 'AI_BACKEND_UNAVAILABLE',
      message: 'Our AI engine is temporarily unavailable. Please try again in a few minutes.',
      details: null
    };
  } else {
    errorEnvelope = {
      error: true,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      details: null
    };
  }
  
  // Never include stack traces in client response
  res.status(err.statusCode || 500).json(errorEnvelope);
}
```

### 6. Health Check Service

**Purpose**: Provides system health status for monitoring

**Endpoint**: GET /health

**Health Checks**:
1. **Zenclaw Connection**: Attempt to ping Zenclaw /health endpoint
2. **Config Loaded**: Verify MODEL_ROUTING configuration is loaded

**Status Determination**:
- **ok**: All checks pass
- **degraded**: Zenclaw connection fails but service can still operate (cached responses, etc.)
- **down**: Critical failure (config not loaded, service cannot start)

**Response**:
```javascript
{
  status: 'ok',  // 'ok' | 'degraded' | 'down'
  timestamp: '2025-02-28T12:34:56.000Z',
  checks: {
    zenclaw_connection: 'ok',  // 'ok' | 'failed'
    config_loaded: true
  }
}
```

**HTTP Status Codes**:
- 200: status is 'ok' or 'degraded'
- 503: status is 'down'

### 7. Logging Service

**Purpose**: Comprehensive structured logging for observability

**Log Levels**:
- **error**: Failures, exceptions, error conditions
- **warn**: Validation failures, degraded performance
- **info**: Request/response lifecycle, health checks
- **debug**: Detailed debugging information

**Required Fields for All Requests**:
```javascript
{
  request_id: 'req_abc123',
  endpoint: '/diagnostics/run',
  organization_id: 'org_123',
  model_tag: 'qwen-diagnostic',
  use_case: 'diagnostic',
  latency_ms: 1234,
  status: 'success',  // 'success' | 'error'
  timestamp: '2025-02-28T12:34:56.000Z'
}
```

**Error Logging**:
```javascript
{
  request_id: 'req_abc123',
  endpoint: '/diagnostics/run',
  organization_id: 'org_123',
  error_code: 'AI_BACKEND_UNAVAILABLE',
  error_message: 'Connection refused',
  stack_trace: '...',
  timestamp: '2025-02-28T12:34:56.000Z'
}
```

## Data Models

### Request Envelope

```typescript
interface RequestEnvelope {
  model: string;           // Model tag (e.g., "qwen-console")
  use_case: string;        // Use case identifier (e.g., "diagnostic")
  payload: {
    organization_id: string;
    session_id?: string;
    [key: string]: any;    // Domain-specific data
  };
  metadata: {
    request_id: string;
    timestamp: string;
    source: string;
  };
}
```

### Error Envelope

```typescript
interface ErrorEnvelope {
  error: true;
  code: string;            // Error code (e.g., "BAD_REQUEST")
  message: string;         // User-friendly error message
  details: any | null;     // Additional error context (optional)
}
```

### Health Check Response

```typescript
interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  checks: {
    zenclaw_connection: 'ok' | 'failed';
    config_loaded: boolean;
  };
}
```

### Console Chat Request

```typescript
interface ConsoleStreamRequest {
  session_id: string;
  organization_id: string;
  language: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

### Diagnostic Request (Deep)

```typescript
interface DeepDiagnosticRequest {
  organization_id: string;
  mode: 'deep';
  diagnostic_payload: {
    business_context: string;
    current_state: string;
    goals: string;
    [key: string]: any;
  };
}
```

### Diagnostic Request (Free)

```typescript
interface FreeDiagnosticRequest {
  organization_id: string;
  mode: 'free';
  answers: {
    [questionId: string]: number;  // 0-3 for each question
  };
  language: string;
}
```

### Blueprint Generation Request

```typescript
interface BlueprintGenerationRequest {
  organization_id: string;
  diagnostic_id: string;
  objective: string;
  constraints: {
    budget?: string;
    timeline?: string;
    resources?: string;
  };
  industry: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Request Envelope Construction

*For any* valid request to an AI endpoint (console, diagnostics, blueprint), the VPS Bridge SHALL construct a Request_Envelope containing the correct model tag, use case, and all required payload fields from the original request.

**Validates: Requirements 1.2, 1.3, 2.6, 11.4**

### Property 2: Response Schema Validation

*For any* successful response from Zenclaw, the VPS Bridge SHALL return JSON that validates against the appropriate schema (DiagnosticResult for diagnostics, Blueprint for blueprints, streaming text for console).

**Validates: Requirements 1.4, 4.3, 5.3, 6.3, 9.2, 11.2**

### Property 3: Error Envelope Format

*For any* error condition (client error, backend error, or internal error), the VPS Bridge SHALL return an Error_Envelope containing error: true, a valid error code, a user-friendly message, and no internal stack traces or sensitive information.

**Validates: Requirements 7.1, 7.2, 7.3, 7.5, 9.3, 11.5**

### Property 4: Comprehensive Request Logging

*For any* request processed by the VPS Bridge, the system SHALL log an entry containing request_id, endpoint, organization_id, model_tag, use_case, latency, and success/error status.

**Validates: Requirements 7.4, 9.4**

## Error Handling

### Error Categories and Responses

1. **Missing Required Fields**
   - HTTP 400
   - Code: BAD_REQUEST
   - Example: "Missing required field: organization_id"

2. **Invalid Field Values**
   - HTTP 422
   - Code: VALIDATION_ERROR
   - Example: "Invalid mode: expected 'free' or 'deep', got 'premium'"

3. **Zenclaw Connection Failure**
   - HTTP 503
   - Code: AI_BACKEND_UNAVAILABLE
   - Message: "Our AI engine is temporarily unavailable. Please try again in a few minutes."

4. **Zenclaw Timeout**
   - HTTP 504
   - Code: AI_BACKEND_TIMEOUT
   - Message: "The AI request took too long to process. Please try again."

5. **Zenclaw Error Response**
   - HTTP 502
   - Code: AI_BACKEND_ERROR
   - Message: "The AI engine encountered an error. Please try again."

6. **Internal Server Error**
   - HTTP 500
   - Code: INTERNAL_SERVER_ERROR
   - Message: "An unexpected error occurred. Please try again."

### Error Logging Strategy

All errors are logged with full context:
- Request details (endpoint, organization_id, request_id)
- Error details (message, code, stack trace)
- Timing information (when error occurred, request latency)
- User context (session_id if available)

Logs are written to:
- Console (for development)
- File (error.log for errors, combined.log for all)
- Future: External logging service (e.g., CloudWatch, Datadog)

### Error Recovery

- **Transient Errors**: Clients should implement retry logic with exponential backoff
- **Persistent Errors**: Health check endpoint helps identify system-wide issues
- **Graceful Degradation**: If Zenclaw is down, health check reports "degraded" but service stays up

## Testing Strategy

### Dual Testing Approach

The VPS Bridge requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many inputs.

### Unit Testing Focus

Unit tests should focus on:
- Specific endpoint examples (e.g., POST /console/stream with valid payload returns 200)
- Edge cases (e.g., empty organization_id, malformed JSON)
- Error conditions (e.g., Zenclaw returns 500, network timeout)
- Integration points (e.g., health check calls Zenclaw /health)

Avoid writing too many unit tests for scenarios that property tests can cover through randomization.

### Property-Based Testing Configuration

- **Library**: fast-check (JavaScript property-based testing library)
- **Iterations**: Minimum 100 iterations per property test
- **Tagging**: Each property test must reference its design document property

Tag format:
```javascript
// Feature: vps-bridge-production-integration, Property 1: Request Envelope Construction
test('property: request envelope construction', () => {
  fc.assert(
    fc.property(
      fc.record({
        organization_id: fc.string(),
        session_id: fc.string(),
        // ... other fields
      }),
      (request) => {
        const envelope = enrichRequest('/console/stream', request);
        expect(envelope).toHaveProperty('model');
        expect(envelope).toHaveProperty('use_case');
        expect(envelope.payload).toHaveProperty('organization_id');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

1. **Endpoint Tests**: Each endpoint (console, diagnostics, blueprints) has unit tests
2. **Error Handling Tests**: Each error category has unit tests
3. **Property Tests**: All four correctness properties have property-based tests
4. **Integration Tests**: Health check integration with Zenclaw
5. **Streaming Tests**: Console streaming behavior verified

### Mock Strategy

- **Zenclaw Client**: Mock axios calls to Zenclaw for unit tests
- **Property Tests**: Use real enrichment/validation logic, mock only external calls
- **Integration Tests**: Use test instance of Zenclaw or mock server

## Implementation Notes

### Migration from Current Implementation

The current VPS Bridge (server.js) has:
- PicoClaw CLI integration (to be replaced with Zenclaw HTTP)
- Basic /api/chat endpoint (to be replaced with specific endpoints)
- Session management (to be retained)
- Basic error handling (to be enhanced)
- Free diagnostic endpoint (to be updated with new error handling)

Migration steps:
1. Add MODEL_ROUTING configuration
2. Implement Zenclaw HTTP client (replace PicoClaw CLI)
3. Add request enrichment middleware
4. Implement new endpoints (/console/stream, /diagnostics/run, /blueprints/generate)
5. Implement centralized error handling middleware
6. Update health check endpoint
7. Add comprehensive logging
8. Remove PicoClaw CLI code
9. Update free diagnostic endpoint to use new error handling

### Configuration Management

Environment variables required:
```bash
# Zenclaw Backend
ZENCLAW_BASE_URL=http://localhost:8000
ZENCLAW_API_KEY=your_api_key_here

# VPS Bridge
PORT=3001
API_KEY=your_vps_bridge_api_key

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Deployment Considerations

1. **Health Checks**: Configure load balancer to use /health endpoint
2. **Timeouts**: Set appropriate timeouts for long-running AI requests (60s+)
3. **Rate Limiting**: Maintain rate limiting to prevent abuse
4. **Monitoring**: Set up alerts for health check failures
5. **Logging**: Configure log aggregation for production debugging

### Security Considerations

1. **API Key Authentication**: All endpoints require X-API-Key header
2. **No Credential Exposure**: Never expose OpenRouter keys to frontend
3. **Input Validation**: Validate all inputs before forwarding
4. **Error Messages**: Never leak internal details in error responses
5. **Rate Limiting**: Prevent abuse through rate limiting
6. **CORS**: Configure appropriate CORS origins for production
