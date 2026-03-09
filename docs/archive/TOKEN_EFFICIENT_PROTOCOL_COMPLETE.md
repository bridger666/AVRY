# Token-Efficient Communication Protocol - Complete Specification

## Summary

Successfully created a comprehensive specification for the Token-Efficient Communication Protocol (TECP) for Aivory's backend AI workflows. This protocol will reduce token usage by 30-50% while maintaining response quality and system reliability.

## Deliverables

### 1. Requirements Document
**Location**: `.kiro/specs/token-efficient-protocol/requirements.md`

**Contents**:
- 11 user stories across 3 personas
- 30+ acceptance criteria organized into 6 categories
- Technical requirements (performance, compatibility, scalability, security)
- Success metrics and KPIs
- Risk analysis and mitigation strategies
- Timeline estimate: 7-9 days

**Key Requirements**:
- Model routing: Only use deepseek-v3-2-251201 and glm-4-7-251222
- Input optimization: 30-50% token reduction target
- Caching: 40%+ cache hit rate target
- Step-wise reasoning: Break complex tasks into smaller steps
- Standardized payloads: Consistent JSON structure
- Comprehensive logging: Track all metrics

### 2. Design Document
**Location**: `.kiro/specs/token-efficient-protocol/design.md`

**Contents**:
- Complete architecture overview with diagrams
- 6 core components with detailed specifications
- Standardized payload schemas (request/response)
- Task type configurations for all workflows
- 3 detailed example workflows (short, medium, long)
- Integration points with existing services
- Configuration management
- Error handling and fallback strategies
- Monitoring and observability plan
- 4-phase migration plan

**Core Components**:
1. **Protocol Manager**: Central orchestrator
2. **Input Compressor**: Minimize payload size
3. **Cache Manager**: Store and reuse results
4. **Payload Validator**: Enforce schemas
5. **Step-wise Reasoner**: Break complex tasks
6. **Protocol Logger**: Track metrics

### 3. Implementation Tasks
**Location**: `.kiro/specs/token-efficient-protocol/tasks.md`

**Contents**:
- 20 main tasks organized into 6 phases
- 80+ subtasks with clear deliverables
- Task dependencies and sequencing
- Timeline: 8-10 days for implementation and deployment

**Phases**:
1. Core Protocol Components (Days 1-3)
2. Protocol Manager (Day 4)
3. Integration with Existing Services (Days 5-6)
4. Testing & Validation (Days 7-8)
5. Documentation & Deployment (Days 9-10)
6. Monitoring & Optimization (Ongoing)

### 4. Protocol Specification
**Location**: `TOKEN_EFFICIENT_PROTOCOL_SPEC.md`

**Contents**:
- Executive summary
- Model routing strategy
- Input optimization techniques with examples
- Caching strategy with TTL configuration
- Step-wise reasoning approach
- Standardized payload structure
- 3 complete example workflows with token savings calculations
- Error handling and fallback chain
- Configuration guide
- Monitoring and metrics
- Implementation checklist

## Key Features

### Model Routing
- **deepseek-v3-2-251201**: Short/medium outputs (≤2000 tokens)
  - Tasks: Snapshot diagnostic, console chat, workflow generation
  - Max tokens: 2000, Timeout: 60s
  
- **glm-4-7-251222**: Long outputs, reasoning-heavy (>2000 tokens)
  - Tasks: Deep diagnostic, blueprint generation
  - Max tokens: 3000, Timeout: 90s
  - Fallback: deepseek-v3-2-251201

- **Removed**: kimi-k2-250905 (completely eliminated)

### Input Optimization

**1. Whitespace Normalization**
- Remove extra spaces, newlines, tabs
- Savings: Up to 69% for poorly formatted text

**2. Diagnostic Answer Compression**
- Convert verbose JSON to compact string format
- Example: `[{question_id: "Q1", ...}]` → `"Q1:mostly_manual|Q2:partial|..."`
- Savings: 87% for 30-question diagnostic

**3. Context Deduplication**
- Use reference IDs instead of resending full content
- Example: Full snapshot (3200 chars) → Reference ID (45 chars)
- Savings: 99% for repeated context

**4. Field Pruning**
- Remove optional fields not needed for task
- Savings: 10-30% depending on metadata

### Caching Strategy

**Cache Key Format**:
```
cache:v1:{task_type}:{model}:{input_hash}
```

**TTL Configuration**:
- Snapshot diagnostic: 1 hour
- Deep diagnostic: 1 hour
- Console chat: 5 minutes
- Workflow generation: 30 minutes
- Log analysis: 10 minutes

**Storage**: In-memory LRU cache (1000 entries, configurable)

### Step-wise Reasoning

**When to Use**:
- Tasks with estimated output >2500 tokens
- Multi-phase workflows (e.g., deep diagnostic)

**Example: Deep Diagnostic**
- Step 1: Executive summary (500 tokens)
- Step 2: System architecture (800 tokens)
- Step 3: Workflow architecture (1000 tokens)
- Step 4: Agent structure (700 tokens)

**Benefits**:
- Each step cached individually
- Early termination if task completes
- Better error isolation

## Example Token Savings

### Console Chat (Short Task)
- **Without Protocol**: 160 tokens
- **With Protocol**: 157 tokens
- **Savings**: 3 tokens (2%)
- **Cache Hit**: 157 tokens saved (100%)

### Snapshot Diagnostic (Medium Task)
- **Without Protocol**: 1,847 tokens
- **With Protocol**: 657 tokens
- **Savings**: 1,190 tokens (64%)
- **Cache Hit**: 657 tokens saved (100%)

### Deep Diagnostic (Long Task)
- **Without Protocol**: 6,600 tokens (estimated)
- **With Protocol**: 4,079 tokens
- **Savings**: 2,521 tokens (38%)
- **Cache Hit**: 4,079 tokens saved (100%)

### Overall Target
- **Token Reduction**: 30-50% across all workflows
- **Cache Hit Rate**: 40%+ for repeated queries
- **Cost Savings**: Proportional to token reduction

## Standardized Payloads

### Request Payload
```json
{
  "task_type": "string (required)",
  "query": "string (required)",
  "context": {
    "context_id": "string (optional)",
    "data": "object (optional)",
    "references": ["string"] (optional)
  },
  "options": {
    "max_tokens": "integer (optional)",
    "temperature": "float (optional)",
    "model": "string (optional, auto-selected)",
    "cache_enabled": "boolean (default: true)",
    "compression_enabled": "boolean (default: true)",
    "step_wise": "boolean (default: auto)"
  },
  "metadata": {
    "user_id": "string (optional)",
    "session_id": "string (optional)",
    "tier": "string (optional)"
  }
}
```

### Response Payload
```json
{
  "status": "success | error",
  "data": {
    "response": "string or object",
    "model_used": "string",
    "steps_executed": "integer"
  },
  "metrics": {
    "tokens": {
      "input": "integer",
      "output": "integer",
      "total": "integer",
      "saved": "integer"
    },
    "cache": {
      "hit": "boolean",
      "key": "string"
    },
    "compression": {
      "original_size": "integer",
      "compressed_size": "integer",
      "ratio": "float"
    },
    "timing": {
      "total_ms": "integer",
      "model_ms": "integer",
      "cache_ms": "integer"
    }
  }
}
```

## Integration Points

### Diagnostic Routes
```python
# app/api/routes/diagnostic.py
from app.services.protocol_manager import ProtocolManager

protocol = ProtocolManager()

@router.post("/snapshot")
async def run_snapshot_diagnostic(data: dict):
    result = await protocol.process_request(
        task_type="snapshot_diagnostic",
        query="Analyze AI readiness",
        context={"data": data.get("snapshot_answers")}
    )
    return result.data
```

### Console Service
```python
# app/services/console_service.py
from app.services.protocol_manager import ProtocolManager

async def process_message(self, message: str, ...):
    protocol = ProtocolManager()
    result = await protocol.process_request(
        task_type="console_chat",
        query=message,
        metadata={"tier": tier, "user_id": user_id}
    )
    return {"response": result.data["response"]}
```

### Workflow Generator
```python
# app/services/workflow_generator.py
from app.services.protocol_manager import ProtocolManager

async def generate(self, ...):
    protocol = ProtocolManager()
    result = await protocol.process_request(
        task_type="workflow_generation",
        query=prompt,
        context={"data": workflow_data}
    )
    return result.data["response"]
```

## Error Handling

### Fallback Chain
```
Primary Model + Cache
  ↓ (cache miss)
Primary Model (no cache)
  ↓ (model failure)
Fallback Model + Cache
  ↓ (cache miss)
Fallback Model (no cache)
  ↓ (failure)
Error Response
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "MODEL_UNAVAILABLE",
    "message": "AI service temporarily unavailable",
    "fallback_used": true
  },
  "metrics": {
    "tokens": {"total": 0, "saved": 0}
  }
}
```

## Configuration

### Environment Variables
```bash
PROTOCOL_CACHE_ENABLED=true
PROTOCOL_CACHE_SIZE=1000
PROTOCOL_CACHE_DEFAULT_TTL=3600
PROTOCOL_COMPRESSION_ENABLED=true
PROTOCOL_STEPWISE_THRESHOLD=2500
PROTOCOL_LOG_LEVEL=INFO
PROTOCOL_METRICS_ENABLED=true
```

### Task Type Configuration
```python
TASK_CONFIGS = {
    "snapshot_diagnostic": {
        "model": "deepseek-v3-2-251201",
        "max_tokens": 1500,
        "cache_ttl": 3600,
        "compression": True,
        "step_wise": False
    },
    "deep_diagnostic": {
        "model": "glm-4-7-251222",
        "max_tokens": 3000,
        "cache_ttl": 3600,
        "compression": True,
        "step_wise": True,
        "fallback_model": "deepseek-v3-2-251201"
    }
}
```

## Monitoring & Metrics

### Key Metrics
- Token usage (total, by task type, by model)
- Token savings (absolute and percentage)
- Cache hit rate (hits / total requests)
- Compression ratio (compressed / original)
- Response time (P50, P95, P99)
- Error rate (errors / total requests)

### Logging Format
```python
logger.info(
    "Protocol request processed",
    extra={
        "task_type": "snapshot_diagnostic",
        "model": "deepseek-v3-2-251201",
        "tokens_input": 245,
        "tokens_output": 412,
        "tokens_saved": 1190,
        "cache_hit": False,
        "compression_ratio": 0.13,
        "duration_ms": 2100
    }
)
```

## Implementation Timeline

- **Phase 1**: Core Components (Days 1-3)
- **Phase 2**: Protocol Manager (Day 4)
- **Phase 3**: Integration (Days 5-6)
- **Phase 4**: Testing (Days 7-8)
- **Phase 5**: Deployment (Days 9-10)
- **Phase 6**: Monitoring (Ongoing)

**Total**: 8-10 days for implementation and deployment

## Success Criteria

✅ 30-50% reduction in token usage  
✅ 40%+ cache hit rate  
✅ No degradation in response times  
✅ No increase in error rates  
✅ All existing tests pass  
✅ 80%+ code coverage for new code  
✅ Backward compatibility maintained  
✅ Comprehensive monitoring in place

## Next Steps

1. **Review and Approve**: Review requirements, design, and tasks
2. **Begin Implementation**: Start with Phase 1 (Core Components)
3. **Iterative Development**: Follow task list sequentially
4. **Testing**: Comprehensive unit and integration tests
5. **Staging Deployment**: Validate in staging environment
6. **Production Rollout**: Gradual rollout with monitoring
7. **Optimization**: Continuous improvement based on metrics

## Files Created

1. `.kiro/specs/token-efficient-protocol/requirements.md` - Complete requirements
2. `.kiro/specs/token-efficient-protocol/design.md` - Detailed design
3. `.kiro/specs/token-efficient-protocol/tasks.md` - Implementation tasks
4. `TOKEN_EFFICIENT_PROTOCOL_SPEC.md` - Protocol specification
5. `TOKEN_EFFICIENT_PROTOCOL_COMPLETE.md` - This summary document

---

**Status**: ✅ Specification Complete  
**Created**: February 15, 2026  
**Ready for**: Implementation

All requirements, design decisions, example payloads, and implementation tasks are documented and ready for development.
