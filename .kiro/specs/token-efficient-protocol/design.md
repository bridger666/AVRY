# Token-Efficient Communication Protocol - Design

## 1. Architecture Overview

The Token-Efficient Communication Protocol (TECP) is a middleware layer that sits between Aivory's API routes and the Sumopod LLM client. It optimizes all AI communications through intelligent routing, input compression, caching, and step-wise reasoning.

```
┌─────────────────────────────────────────────────────────────┐
│                     API Routes Layer                         │
│  (diagnostic.py, console.py, workflow_generator.py)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           Token-Efficient Protocol Layer (NEW)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Router     │  │  Compressor  │  │    Cache     │      │
│  │  (Model      │  │  (Input      │  │  (Results    │      │
│  │  Selection)  │  │  Optimizer)  │  │  Storage)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Step-wise   │  │   Payload    │  │   Logger     │      │
│  │  Reasoner    │  │  Validator   │  │  (Metrics)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Sumopod Client / Model API                      │
│         (deepseek-v3-2-251201, glm-4-7-251222)              │
└─────────────────────────────────────────────────────────────┘
```

## 2. Core Components

### 2.1 Protocol Manager (`app/services/protocol_manager.py`)

Central orchestrator that coordinates all protocol operations.

**Responsibilities**:
- Accept requests from API routes
- Route through compression, caching, and model selection
- Return optimized responses with metrics
- Handle errors and fallbacks

**Key Methods**:
```python
async def process_request(
    task_type: str,
    query: str,
    context: Optional[Dict] = None,
    options: Optional[ProtocolOptions] = None
) -> ProtocolResponse

async def process_multi_step(
    task_type: str,
    steps: List[StepDefinition],
    context: Optional[Dict] = None
) -> ProtocolResponse
```

### 2.2 Input Compressor (`app/services/input_compressor.py`)

Optimizes input payloads to minimize token usage.

**Compression Strategies**:
1. **Whitespace Normalization**: Remove extra spaces, newlines, tabs
2. **Diagnostic Answer Compression**: Convert verbose answers to compact format
3. **Context Deduplication**: Use reference IDs for repeated content
4. **Field Pruning**: Remove optional fields not needed for task
5. **Text Summarization**: Condense long context (optional, configurable)

**Example**:
```python
# Before compression (verbose)
{
    "question_1": {
        "id": "workflow_automation",
        "question": "How automated are your workflows?",
        "selected_option": "Mostly manual with some automation",
        "weight": 1.5
    },
    "question_2": { ... }
}

# After compression (compact)
"Q1:mostly_manual|Q2:partial|Q3:advanced|..."
```

### 2.3 Cache Manager (`app/services/cache_manager.py`)

Stores and retrieves cached AI responses.

**Cache Strategy**:
- **Key Generation**: Hash of (task_type + compressed_input + model + version)
- **Storage**: In-memory LRU cache with configurable size
- **TTL**: Configurable per task type (default: 1 hour for diagnostics, 5 min for console)
- **Invalidation**: Automatic on TTL expiry, manual via admin endpoint

**Cache Key Format**:
```
cache:v1:{task_type}:{model}:{input_hash}
```

**Example**:
```
cache:v1:snapshot_diagnostic:deepseek-v3:a3f5b2c1d4e6
```

### 2.4 Step-wise Reasoner (`app/services/stepwise_reasoner.py`)

Breaks complex tasks into smaller, sequential steps.

**When to Use**:
- Tasks with estimated output >2500 tokens
- Multi-phase workflows (e.g., deep diagnostic)
- Tasks requiring intermediate validation

**Step Definition**:
```python
@dataclass
class StepDefinition:
    step_number: int
    step_name: str
    prompt: str
    max_tokens: int
    depends_on: Optional[int] = None  # Previous step number
    required: bool = True
    validation_fn: Optional[Callable] = None
```

**Example Flow**:
```python
# Deep Diagnostic broken into steps
steps = [
    StepDefinition(1, "executive_summary", prompt1, 500),
    StepDefinition(2, "system_architecture", prompt2, 800, depends_on=1),
    StepDefinition(3, "workflow_architecture", prompt3, 1000, depends_on=2),
    StepDefinition(4, "agent_structure", prompt4, 700, depends_on=2)
]
```

### 2.5 Payload Validator (`app/services/payload_validator.py`)

Validates and enforces payload structure.

**Validation Rules**:
- Schema compliance (required fields present)
- Token limit enforcement (max_tokens ≤ model limit)
- Data type validation
- Security checks (no injection patterns)

### 2.6 Protocol Logger (`app/services/protocol_logger.py`)

Tracks metrics and performance data.

**Logged Metrics**:
- Token usage (input, output, total)
- Cache hit/miss rates
- Model selection decisions
- Compression ratios
- Response times
- Error rates
- Token savings

## 3. Standardized Payload Structure

### 3.1 Request Payload Schema

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
    "model": "string (optional, auto-selected if omitted)",
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

### 3.2 Response Payload Schema

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
  },
  "error": {
    "code": "string (if error)",
    "message": "string (if error)",
    "fallback_used": "boolean"
  }
}
```

## 4. Task Type Configurations

### 4.1 Task Type Registry

```python
TASK_CONFIGS = {
    "snapshot_diagnostic": {
        "model": "deepseek-v3-2-251201",
        "max_tokens": 1500,
        "cache_ttl": 3600,  # 1 hour
        "compression": True,
        "step_wise": False
    },
    "deep_diagnostic": {
        "model": "glm-4-7-251222",
        "max_tokens": 3000,
        "cache_ttl": 3600,
        "compression": True,
        "step_wise": True,  # Break into steps
        "fallback_model": "deepseek-v3-2-251201"
    },
    "console_chat": {
        "model": "deepseek-v3-2-251201",
        "max_tokens": 1000,
        "cache_ttl": 300,  # 5 minutes
        "compression": True,
        "step_wise": False
    },
    "workflow_generation": {
        "model": "deepseek-v3-2-251201",
        "max_tokens": 2000,
        "cache_ttl": 1800,  # 30 minutes
        "compression": True,
        "step_wise": False
    },
    "log_analysis": {
        "model": "deepseek-v3-2-251201",
        "max_tokens": 1500,
        "cache_ttl": 600,  # 10 minutes
        "compression": True,
        "step_wise": False
    }
}
```

## 5. Example Payloads

### 5.1 Short Task: Console Chat

**Request**:
```json
{
  "task_type": "console_chat",
  "query": "Explain the difference between workflow automation and process automation",
  "options": {
    "max_tokens": 500,
    "cache_enabled": true
  },
  "metadata": {
    "user_id": "user_123",
    "tier": "operator"
  }
}
```

**Internal Processing**:
```python
# 1. Compression (minimal for short query)
compressed_query = "Explain diff: workflow automation vs process automation"

# 2. Cache check
cache_key = "cache:v1:console_chat:deepseek-v3:f8a3b2c1"
cached_result = cache.get(cache_key)  # None (cache miss)

# 3. Model call
model = "deepseek-v3-2-251201"
response = await sumopod.chat_completion(...)

# 4. Cache store
cache.set(cache_key, response, ttl=300)
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "response": "Workflow automation focuses on...",
    "model_used": "deepseek-v3-2-251201",
    "steps_executed": 1
  },
  "metrics": {
    "tokens": {
      "input": 145,
      "output": 312,
      "total": 457,
      "saved": 23
    },
    "cache": {
      "hit": false,
      "key": "cache:v1:console_chat:deepseek-v3:f8a3b2c1"
    },
    "compression": {
      "original_size": 168,
      "compressed_size": 145,
      "ratio": 0.86
    },
    "timing": {
      "total_ms": 1250,
      "model_ms": 1200,
      "cache_ms": 5
    }
  }
}
```

### 5.2 Medium Task: Snapshot Diagnostic

**Request**:
```json
{
  "task_type": "snapshot_diagnostic",
  "query": "Analyze AI readiness",
  "context": {
    "data": {
      "answers": [
        {"question_id": "Q1", "selected": "mostly_manual"},
        {"question_id": "Q2", "selected": "partial_automation"},
        ...
      ]
    }
  },
  "options": {
    "max_tokens": 1500,
    "cache_enabled": true,
    "compression_enabled": true
  }
}
```

**Internal Processing**:
```python
# 1. Compression (significant for 30 answers)
# Before: 30 answer objects × ~150 chars = 4500 chars
# After: "Q1:mostly_manual|Q2:partial|Q3:advanced|..." = ~600 chars
compressed_answers = "Q1:mostly_manual|Q2:partial|Q3:advanced|..."

# 2. Cache check
cache_key = "cache:v1:snapshot_diagnostic:deepseek-v3:a7f2c4d1"
cached_result = cache.get(cache_key)  # Hit!

# 3. Return cached result (no model call)
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "response": {
      "readiness_score": 67,
      "readiness_level": "Medium",
      ...
    },
    "model_used": "deepseek-v3-2-251201",
    "steps_executed": 0
  },
  "metrics": {
    "tokens": {
      "input": 0,
      "output": 0,
      "total": 0,
      "saved": 1847
    },
    "cache": {
      "hit": true,
      "key": "cache:v1:snapshot_diagnostic:deepseek-v3:a7f2c4d1"
    },
    "compression": {
      "original_size": 4500,
      "compressed_size": 600,
      "ratio": 0.13
    },
    "timing": {
      "total_ms": 12,
      "model_ms": 0,
      "cache_ms": 12
    }
  }
}
```

### 5.3 Long Task: Deep Diagnostic (Step-wise)

**Request**:
```json
{
  "task_type": "deep_diagnostic",
  "query": "Generate deployment blueprint",
  "context": {
    "context_id": "snapshot_result_abc123",
    "references": ["snapshot_result_abc123"]
  },
  "options": {
    "max_tokens": 3000,
    "step_wise": true,
    "cache_enabled": true
  }
}
```

**Internal Processing**:
```python
# 1. Retrieve context by reference ID (avoid resending full snapshot)
snapshot_data = context_store.get("snapshot_result_abc123")

# 2. Define steps
steps = [
    StepDefinition(1, "executive_summary", prompt1, 500),
    StepDefinition(2, "system_architecture", prompt2, 800, depends_on=1),
    StepDefinition(3, "workflow_architecture", prompt3, 1000, depends_on=2),
    StepDefinition(4, "agent_structure", prompt4, 700, depends_on=2)
]

# 3. Execute steps sequentially
results = []
for step in steps:
    # Check cache for this step
    step_cache_key = f"cache:v1:deep_diagnostic:step{step.step_number}:glm-4-7:x7y2z4"
    cached_step = cache.get(step_cache_key)
    
    if cached_step:
        results.append(cached_step)
        continue
    
    # Build prompt with previous step results
    context = build_step_context(step, results)
    
    # Call model
    response = await sumopod.chat_completion(
        model="glm-4-7-251222",
        messages=[{"role": "user", "content": context}],
        max_tokens=step.max_tokens
    )
    
    results.append(response)
    cache.set(step_cache_key, response, ttl=3600)

# 4. Combine results
final_result = combine_step_results(results)
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "response": {
      "executive_summary": "...",
      "system_architecture": {...},
      "workflow_architecture": {...},
      "agent_structure": [...]
    },
    "model_used": "glm-4-7-251222",
    "steps_executed": 4
  },
  "metrics": {
    "tokens": {
      "input": 1245,
      "output": 2834,
      "total": 4079,
      "saved": 1521
    },
    "cache": {
      "hit": false,
      "key": "cache:v1:deep_diagnostic:glm-4-7:b3c5d7e9"
    },
    "compression": {
      "original_size": 3200,
      "compressed_size": 1245,
      "ratio": 0.39
    },
    "timing": {
      "total_ms": 8750,
      "model_ms": 8500,
      "cache_ms": 15
    }
  }
}
```

## 6. Integration Points

### 6.1 Diagnostic Routes Integration

**Before (Current)**:
```python
# app/api/routes/diagnostic.py
@router.post("/snapshot")
async def run_snapshot_diagnostic(data: dict):
    model = ModelSelector.get_model_for_task("snapshot_diagnostic")
    response = await sumopod.chat_completion(messages, model)
    return response
```

**After (With Protocol)**:
```python
# app/api/routes/diagnostic.py
from app.services.protocol_manager import ProtocolManager

protocol = ProtocolManager()

@router.post("/snapshot")
async def run_snapshot_diagnostic(data: dict):
    result = await protocol.process_request(
        task_type="snapshot_diagnostic",
        query="Analyze AI readiness",
        context={"data": data.get("snapshot_answers")},
        options={"cache_enabled": True}
    )
    return result.data
```

### 6.2 Console Service Integration

**Before (Current)**:
```python
# app/services/console_service.py
async def process_message(self, message: str, ...):
    model = self._select_model(tier)
    ai_response = self.sumopod_client.chat_completion(...)
    return {"response": response_text}
```

**After (With Protocol)**:
```python
# app/services/console_service.py
from app.services.protocol_manager import ProtocolManager

async def process_message(self, message: str, ...):
    protocol = ProtocolManager()
    result = await protocol.process_request(
        task_type="console_chat",
        query=message,
        context={"files": files, "workflow": workflow},
        metadata={"tier": tier, "user_id": user_id}
    )
    return {
        "response": result.data["response"],
        "reasoning": self._build_reasoning(result.metrics, tier)
    }
```

## 7. Configuration

### 7.1 Environment Variables

```bash
# .env.local
PROTOCOL_CACHE_ENABLED=true
PROTOCOL_CACHE_SIZE=1000  # Max cache entries
PROTOCOL_CACHE_DEFAULT_TTL=3600  # 1 hour
PROTOCOL_COMPRESSION_ENABLED=true
PROTOCOL_STEPWISE_THRESHOLD=2500  # Tokens
PROTOCOL_LOG_LEVEL=INFO
PROTOCOL_METRICS_ENABLED=true
```

### 7.2 Configuration File

```python
# app/config/protocol_config.py
from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class ProtocolConfig:
    cache_enabled: bool = True
    cache_size: int = 1000
    cache_default_ttl: int = 3600
    compression_enabled: bool = True
    stepwise_threshold: int = 2500
    log_level: str = "INFO"
    metrics_enabled: bool = True
    
    # Task-specific overrides
    task_configs: Dict[str, Dict] = None
    
    @classmethod
    def from_env(cls):
        """Load configuration from environment variables"""
        return cls(
            cache_enabled=os.getenv("PROTOCOL_CACHE_ENABLED", "true").lower() == "true",
            cache_size=int(os.getenv("PROTOCOL_CACHE_SIZE", "1000")),
            ...
        )
```

## 8. Error Handling & Fallbacks

### 8.1 Error Scenarios

1. **Cache Failure**: Fall back to direct model call
2. **Compression Failure**: Use uncompressed input
3. **Step Execution Failure**: Retry with single-step approach
4. **Model Failure**: Use fallback model (GLM-4-7 → DeepSeek)
5. **Validation Failure**: Return clear error message

### 8.2 Fallback Chain

```
Primary Model (with cache) 
  → Primary Model (no cache) 
    → Fallback Model (with cache) 
      → Fallback Model (no cache) 
        → Error Response
```

## 9. Monitoring & Observability

### 9.1 Metrics Dashboard

Track the following metrics:
- **Token Usage**: Total, by task type, by model
- **Token Savings**: Absolute and percentage
- **Cache Performance**: Hit rate, miss rate, eviction rate
- **Compression Ratios**: By task type
- **Response Times**: P50, P95, P99
- **Error Rates**: By error type
- **Cost Savings**: Estimated based on token reduction

### 9.2 Logging Format

```python
logger.info(
    "Protocol request processed",
    extra={
        "task_type": "snapshot_diagnostic",
        "model": "deepseek-v3-2-251201",
        "tokens_input": 145,
        "tokens_output": 312,
        "tokens_saved": 23,
        "cache_hit": False,
        "compression_ratio": 0.86,
        "duration_ms": 1250
    }
)
```

## 10. Testing Strategy

### 10.1 Unit Tests
- Test each component in isolation
- Mock external dependencies (Sumopod, cache)
- Verify compression algorithms
- Validate payload schemas

### 10.2 Integration Tests
- Test full request flow through protocol
- Verify cache behavior
- Test step-wise execution
- Validate error handling

### 10.3 Performance Tests
- Measure token reduction
- Verify response time impact
- Test cache hit rates
- Load test with concurrent requests

## 11. Migration Plan

### Phase 1: Core Implementation (Days 1-3)
- Implement ProtocolManager, InputCompressor, CacheManager
- Create payload schemas and validators
- Add basic logging

### Phase 2: Integration (Days 4-5)
- Integrate with diagnostic routes
- Integrate with console service
- Integrate with workflow generator
- Add comprehensive error handling

### Phase 3: Testing & Optimization (Days 6-7)
- Unit and integration tests
- Performance testing
- Token usage analysis
- Documentation

### Phase 4: Deployment (Day 8)
- Deploy to staging
- Monitor metrics
- Gradual rollout to production
- Post-deployment validation

## 12. Success Criteria

- ✅ 30-50% reduction in token usage
- ✅ 40%+ cache hit rate
- ✅ No degradation in response times
- ✅ No increase in error rates
- ✅ All existing tests pass
- ✅ 80%+ code coverage for new code

---

**Document Version**: 1.0  
**Created**: February 15, 2026  
**Status**: Draft - Pending Review
