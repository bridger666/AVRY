# Token-Efficient Communication Protocol - Requirements

## 1. Overview

Design and implement a token-efficient communication protocol for all backend AI workflows in Aivory to minimize token usage, reduce costs, and improve response times while maintaining functionality and accuracy.

## 2. User Stories

### 2.1 As a System Administrator
- I want all AI model calls to use minimal tokens so that operational costs are reduced
- I want automatic model routing based on task complexity so that the right model is used for each task
- I want caching of intermediate results so that duplicate API calls are avoided
- I want comprehensive logging so that I can monitor token usage and optimize further

### 2.2 As a Backend Developer
- I want a standardized protocol for all AI communications so that implementation is consistent
- I want clear payload structures so that integration is straightforward
- I want automatic context compression so that I don't manually optimize each request
- I want step-wise reasoning support so that complex tasks can be broken down efficiently

### 2.3 As an API Consumer
- I want faster response times so that user experience is improved
- I want reliable fallback mechanisms so that service remains available
- I want consistent error handling so that failures are predictable

## 3. Acceptance Criteria

### 3.1 Model Routing
- **AC 3.1.1**: System MUST use `deepseek-v3-2-251201` for short/medium output tasks (≤2000 tokens)
- **AC 3.1.2**: System MUST use `glm-4-7-251222` for long output or reasoning-heavy tasks (>2000 tokens)
- **AC 3.1.3**: System MUST NOT use `kimi-k2-250905` anywhere in the codebase
- **AC 3.1.4**: System MUST automatically select model based on task type classification
- **AC 3.1.5**: System MUST fallback from GLM-4-7 to DeepSeek if primary model fails

### 3.2 Input Optimization
- **AC 3.2.1**: System MUST trim unnecessary whitespace and formatting from input text
- **AC 3.2.2**: System MUST use reference IDs for repeated context instead of resending full content
- **AC 3.2.3**: System MUST compress diagnostic answers into minimal format (e.g., "Q1: A, Q2: B")
- **AC 3.2.4**: System MUST only include fields required for the specific task type
- **AC 3.2.5**: System MUST validate and reject oversized inputs before sending to model

### 3.3 Step-wise Reasoning
- **AC 3.3.1**: System MUST support breaking complex tasks into sequential steps
- **AC 3.3.2**: System MUST only send subsequent steps if previous step requires continuation
- **AC 3.3.3**: System MUST track step state and context across multi-step workflows
- **AC 3.3.4**: System MUST allow early termination if task completes before all steps

### 3.4 Caching
- **AC 3.4.1**: System MUST cache intermediate outputs with TTL (time-to-live)
- **AC 3.4.2**: System MUST use cache keys based on input hash and model version
- **AC 3.4.3**: System MUST invalidate cache when model configuration changes
- **AC 3.4.4**: System MUST track cache hit/miss rates for monitoring
- **AC 3.4.5**: System MUST support cache bypass for real-time requests

### 3.5 Payload Structure
- **AC 3.5.1**: System MUST use standardized JSON format with defined schema
- **AC 3.5.2**: Payload MUST include: `task_type`, `query`, `max_tokens`, `model`
- **AC 3.5.3**: Payload MAY include: `context_id`, `step_number`, `cache_key`, `metadata`
- **AC 3.5.4**: System MUST enforce max_tokens limits per task type
- **AC 3.5.5**: System MUST validate payload schema before processing

### 3.6 Logging & Error Handling
- **AC 3.6.1**: System MUST log token usage per request (input + output tokens)
- **AC 3.6.2**: System MUST log cache hit/miss events
- **AC 3.6.3**: System MUST log model selection decisions
- **AC 3.6.4**: System MUST maintain existing error handling and fallback mechanisms
- **AC 3.6.5**: System MUST track and report token savings from optimization

## 4. Technical Requirements

### 4.1 Performance
- Token reduction: Target 30-50% reduction in token usage across all workflows
- Response time: No degradation in response times (maintain current performance)
- Cache hit rate: Target 40%+ cache hit rate for repeated queries

### 4.2 Compatibility
- Must maintain backward compatibility with existing API endpoints
- Must work with current Sumopod client implementation
- Must integrate with existing ModelSelector class

### 4.3 Scalability
- Cache must support concurrent access
- Protocol must handle high request volumes
- Must support distributed caching in future

### 4.4 Security
- Cache must not store sensitive user data beyond TTL
- Context IDs must be cryptographically secure
- Payload validation must prevent injection attacks

## 5. Non-Functional Requirements

### 5.1 Maintainability
- Protocol specification must be documented
- Code must follow existing project patterns
- Configuration must be centralized

### 5.2 Observability
- Token usage must be trackable per endpoint
- Cache performance must be monitorable
- Model routing decisions must be auditable

### 5.3 Reliability
- Cache failures must not break functionality
- Fallback to non-cached operation must be automatic
- Error handling must be comprehensive

## 6. Out of Scope

- Frontend changes (protocol is backend-only)
- Database schema changes
- User authentication/authorization changes
- Billing/credit system modifications
- Real-time streaming responses

## 7. Dependencies

- Existing `app/config/model_config.py` (ModelSelector)
- Existing `app/llm/sumopod_client.py` (SumopodClient)
- Python caching library (e.g., `cachetools` or Redis)
- Existing logging infrastructure

## 8. Success Metrics

- **Token Reduction**: 30-50% reduction in average tokens per request
- **Cost Savings**: Proportional reduction in API costs
- **Cache Hit Rate**: 40%+ for repeated queries
- **Response Time**: No degradation (maintain <90s for deep diagnostic)
- **Error Rate**: No increase in error rates
- **Code Coverage**: 80%+ test coverage for new protocol code

## 9. Risks & Mitigations

### Risk 1: Cache Invalidation Complexity
- **Mitigation**: Use simple TTL-based expiration, add manual invalidation endpoint

### Risk 2: Over-Compression Losing Context
- **Mitigation**: Validate compressed output quality, allow compression bypass flag

### Risk 3: Step-wise Reasoning Overhead
- **Mitigation**: Only use for tasks >3000 tokens, measure overhead vs. savings

### Risk 4: Cache Storage Growth
- **Mitigation**: Implement LRU eviction, set reasonable TTL (1-24 hours)

## 10. Timeline Estimate

- Requirements & Design: 1 day
- Core Protocol Implementation: 2-3 days
- Integration with Existing Services: 2 days
- Testing & Validation: 1-2 days
- Documentation: 1 day

**Total**: 7-9 days

## 11. Approval

This requirements document must be reviewed and approved before proceeding to design phase.

---

**Document Version**: 1.0  
**Created**: February 15, 2026  
**Status**: Draft - Pending Review
