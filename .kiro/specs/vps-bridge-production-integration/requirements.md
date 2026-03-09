# Requirements Document

## Introduction

The VPS Bridge Production Integration establishes the VPS Bridge as the single, stable entry point for all AI features in Aivory. This system ensures that the Next.js frontend never communicates directly with OpenRouter or hardcodes model names. Instead, all requests flow through a standardized architecture: Next.js → VPS Bridge → Zenclaw → OpenRouter (Qwen) → back to Aivory. This integration addresses current production issues including internal server errors, temporary mock responses, lack of standardized error handling, missing health checks, and non-configurable model routing.

## Glossary

- **VPS_Bridge**: The HTTP service that acts as the single entry point for all AI features, responsible for request enrichment, model routing, and response normalization
- **Zenclaw**: The AI backend service that receives enriched requests from VPS_Bridge and communicates with OpenRouter
- **OpenRouter**: The external AI service provider that hosts the Qwen models
- **Next.js_Frontend**: The client application that initiates AI feature requests
- **Model_Tag**: A logical identifier (e.g., "qwen-console", "qwen-diagnostic") used internally to route requests, distinct from OpenRouter model names
- **Use_Case**: A semantic identifier (e.g., "console", "diagnostic", "blueprint") that helps Zenclaw select the appropriate system prompt
- **Request_Envelope**: The standardized JSON structure containing model, use_case, and payload fields sent to Zenclaw
- **Error_Envelope**: The standardized JSON structure for all error responses containing error, code, message, and details fields
- **Health_Check**: An endpoint that reports the operational status of VPS_Bridge and its dependencies
- **DiagnosticResult**: The JSON schema returned by diagnostic endpoints (both free and deep modes)
- **Blueprint**: The JSON schema returned by blueprint generation endpoints

## Requirements

### Requirement 1: VPS Bridge Core Responsibilities

**User Story:** As a system architect, I want the VPS Bridge to handle all AI request orchestration, so that the frontend remains decoupled from AI provider implementation details.

#### Acceptance Criteria

1. THE VPS_Bridge SHALL expose stable HTTP endpoints for console chat, diagnostics, and blueprint generation
2. WHEN a request is received from Next.js_Frontend, THE VPS_Bridge SHALL enrich it with organization metadata, session metadata, and model routing information
3. WHEN forwarding to Zenclaw, THE VPS_Bridge SHALL use Model_Tag identifiers rather than OpenRouter model names
4. WHEN receiving responses from Zenclaw, THE VPS_Bridge SHALL normalize them to consistent JSON format
5. THE VPS_Bridge SHALL provide a health check endpoint for monitoring system status

### Requirement 2: Model Routing with Logical Tags

**User Story:** As a developer, I want model routing to use logical tags instead of hardcoded provider names, so that we can change AI providers without modifying frontend code.

#### Acceptance Criteria

1. THE VPS_Bridge SHALL maintain an internal routing map from endpoints to Model_Tag values
2. WHEN a console chat request is received at POST /console/stream, THE VPS_Bridge SHALL assign Model_Tag "qwen-console"
3. WHEN a deep diagnostic request is received at POST /diagnostics/run, THE VPS_Bridge SHALL assign Model_Tag "qwen-diagnostic"
4. WHEN a free diagnostic request is received at POST /diagnostics/free/run, THE VPS_Bridge SHALL assign Model_Tag "qwen-diagnostic"
5. WHEN a blueprint generation request is received at POST /blueprints/generate, THE VPS_Bridge SHALL assign Model_Tag "qwen-blueprint"
6. WHEN forwarding any request to Zenclaw, THE VPS_Bridge SHALL construct a Request_Envelope containing model, use_case, and payload fields

### Requirement 3: Console Chat API Contract

**User Story:** As a frontend developer, I want a stable console chat streaming endpoint, so that users can interact with the AI consultant in real-time.

#### Acceptance Criteria

1. THE VPS_Bridge SHALL accept POST requests at /console/stream with session_id, organization_id, language, and messages fields
2. WHEN a console chat request is received, THE VPS_Bridge SHALL forward it to Zenclaw with Model_Tag "qwen-console" and Use_Case "console"
3. THE VPS_Bridge SHALL support streaming responses using Server-Sent Events or chunked HTTP transfer encoding
4. WHEN Zenclaw returns streaming data, THE VPS_Bridge SHALL relay it to Next.js_Frontend without buffering the entire response

### Requirement 4: Deep Diagnostic API Contract

**User Story:** As a frontend developer, I want a reliable deep diagnostic endpoint, so that premium users can receive comprehensive AI-powered business diagnostics.

#### Acceptance Criteria

1. THE VPS_Bridge SHALL accept POST requests at /diagnostics/run with organization_id, mode set to "deep", and diagnostic_payload fields
2. WHEN a deep diagnostic request is received, THE VPS_Bridge SHALL forward it to Zenclaw with Model_Tag "qwen-diagnostic" and Use_Case "diagnostic"
3. WHEN Zenclaw returns a response, THE VPS_Bridge SHALL return a DiagnosticResult JSON object conforming to version 1 schema

### Requirement 5: Free Diagnostic API Contract

**User Story:** As a frontend developer, I want a reliable free diagnostic endpoint, so that all users can receive basic AI-powered business diagnostics.

#### Acceptance Criteria

1. THE VPS_Bridge SHALL accept POST requests at /diagnostics/free/run with organization_id, mode set to "free", answers array, and language fields
2. WHEN a free diagnostic request is received, THE VPS_Bridge SHALL forward it to Zenclaw with Model_Tag "qwen-diagnostic" and Use_Case "diagnostic"
3. WHEN Zenclaw returns a response, THE VPS_Bridge SHALL return a DiagnosticResult-shaped JSON object

### Requirement 6: Blueprint Generation API Contract

**User Story:** As a frontend developer, I want a reliable blueprint generation endpoint, so that users can generate actionable business blueprints from their diagnostics.

#### Acceptance Criteria

1. THE VPS_Bridge SHALL accept POST requests at /blueprints/generate with organization_id, diagnostic_id, objective, constraints, and industry fields
2. WHEN a blueprint generation request is received, THE VPS_Bridge SHALL forward it to Zenclaw with Model_Tag "qwen-blueprint" and Use_Case "blueprint"
3. WHEN Zenclaw returns a response, THE VPS_Bridge SHALL return a Blueprint JSON object conforming to version 1 schema

### Requirement 7: Standardized Error Handling

**User Story:** As a frontend developer, I want all errors to follow a consistent JSON format, so that I can handle errors predictably and provide clear feedback to users.

#### Acceptance Criteria

1. WHEN a client error occurs (HTTP 400 or 422), THE VPS_Bridge SHALL return an Error_Envelope with code "BAD_REQUEST" and a descriptive message
2. WHEN Zenclaw is unavailable (HTTP 502 or 503), THE VPS_Bridge SHALL return an Error_Envelope with code "AI_BACKEND_UNAVAILABLE" and a user-friendly message
3. WHEN an internal error occurs (HTTP 500), THE VPS_Bridge SHALL return an Error_Envelope with code "INTERNAL_SERVER_ERROR" and a generic message
4. THE VPS_Bridge SHALL log full error details including stack traces on the server
5. THE VPS_Bridge SHALL NOT include internal stack traces or sensitive information in Error_Envelope responses sent to clients
6. THE VPS_Bridge SHALL implement centralized error-handling middleware to ensure consistent error formatting

### Requirement 8: Health Check Endpoint

**User Story:** As a DevOps engineer, I want a health check endpoint, so that I can monitor the VPS Bridge status and detect issues proactively.

#### Acceptance Criteria

1. THE VPS_Bridge SHALL accept GET requests at /health
2. WHEN the health check is requested, THE VPS_Bridge SHALL return a JSON object with status, timestamp, and checks fields
3. THE VPS_Bridge SHALL report status as "ok" when all systems are operational
4. THE VPS_Bridge SHALL report status as "degraded" when some non-critical systems are failing
5. THE VPS_Bridge SHALL report status as "down" when critical systems are failing
6. THE VPS_Bridge SHALL include a zenclaw_connection check indicating whether Zenclaw is reachable
7. THE VPS_Bridge SHALL include a config_loaded check indicating whether configuration was loaded successfully
8. WHEN status is "ok" or "degraded", THE VPS_Bridge SHALL return HTTP status code 200
9. WHEN status is "down", THE VPS_Bridge SHALL return HTTP status code 503

### Requirement 9: Remove Mocks and Stabilize Production

**User Story:** As a product manager, I want all temporary mocks removed and real implementations deployed, so that users receive actual AI-powered features instead of placeholder responses.

#### Acceptance Criteria

1. THE VPS_Bridge SHALL implement real logic for all endpoints without temporary mock responses
2. THE VPS_Bridge SHALL ensure all success responses are valid JSON conforming to their respective schemas
3. THE VPS_Bridge SHALL ensure all error responses are valid JSON conforming to the Error_Envelope schema
4. WHEN processing any request, THE VPS_Bridge SHALL log request_id, endpoint, organization_id, Model_Tag, Use_Case, latency, and success or error status

### Requirement 10: System Prompt Selection

**User Story:** As an AI engineer, I want Zenclaw to select appropriate system prompts based on use_case, so that each AI feature receives contextually appropriate instructions.

#### Acceptance Criteria

1. WHEN Zenclaw receives a request with Use_Case "console", THE Zenclaw SHALL apply the Aivory Console consultant system prompt
2. WHEN Zenclaw receives a request with Use_Case "diagnostic", THE Zenclaw SHALL apply the Aivory Diagnostic Engine system prompt that produces DiagnosticResult JSON
3. WHEN Zenclaw receives a request with Use_Case "blueprint", THE Zenclaw SHALL apply the Aivory Blueprint Engine system prompt that produces Blueprint version 1 JSON

### Requirement 11: Definition of Done Validation

**User Story:** As a project stakeholder, I want clear acceptance criteria for production readiness, so that we can confidently deploy the VPS Bridge to production.

#### Acceptance Criteria

1. WHEN the health check endpoint is called in normal operation, THE VPS_Bridge SHALL return status "ok"
2. WHEN free diagnostic, deep diagnostic, or blueprint endpoints are called with valid input, THE VPS_Bridge SHALL return valid JSON conforming to their respective schemas
3. THE Next.js_Frontend SHALL NOT display generic "Internal server error" messages for VPS_Bridge failures
4. THE VPS_Bridge SHALL route all AI requests through the model and use_case system
5. THE VPS_Bridge SHALL return standardized Error_Envelope JSON for all failure scenarios
