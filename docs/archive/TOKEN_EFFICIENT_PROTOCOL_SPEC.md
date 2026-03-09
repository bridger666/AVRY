# Aivory Token-Efficient Communication Protocol (TECP)

## Executive Summary

The Token-Efficient Communication Protocol (TECP) is a comprehensive middleware layer designed to optimize all AI model communications in the Aivory platform. It reduces token usage by 30-50% through intelligent routing, input compression, caching, and step-wise reasoning while maintaining response quality and system reliability.

## 1. Protocol Overview

### 1.1 Goals
- Reduce token usage by 30-50% across all AI workflows
- Maintain or improve response times through caching
- Ensure backward compatibility with existing APIs
- Provide comprehensive monitoring and observability

### 1.2 Key Features
- **Intelligent Model Routing**: Automatic selection of optimal model based on task type
- **Input Compression**: Minimize payload size without losing semantic meaning
- **Response Caching**: Store and reuse results for identical queries
- **Step-wise Reasoning**: Break complex tasks into smaller, efficient steps
- **Comprehensive Logging**: Track token usage, cache performance, and savings

### 1.3 Architecture

```
API Routes → Protocol Manager → [Compressor, Cache, Validator] → Sumopod Client → AI Models
```

## 2. Model Routing Strategy

### 2.1 Allowed Models

**deepseek-v3-2-251201**
- Use case: Short/medium outputs (≤2000 tokens)
- Max tokens: 2000
- Timeout: 60 seconds
- Tasks: Snapshot diagnostic, console chat, workflow generation, log analysis

**glm-4-7-251222**
- Use case: Long outputs, reasoning-heavy tasks (>2000 tokens)
- Max tokens: 3000
- Timeout: 90 seconds
- Tasks: Deep diagnostic, blueprint generation
- Fallback: deepseek-v3-2-251201

### 2.2 Removed Models
- **kimi-k2-250905**: Completely removed from all code

### 2.3 Routing Logic

```python
def select_model(task_type: str, estimated_tokens: int) -> str:
    if task_type in ["deep_diagnostic", "blueprint_generation"]:
        return "glm-4-7-251222"
    elif estimated_tokens > 2000:
        return "glm-4-7-251222"
    else:
        return "deepseek-v3-2-251201"
```

## 3. Input Optimization Techniques

### 3.1 Whitespace Normalization

Remove extra spaces, newlines, and tabs that don't affect meaning.

**Example**:
```python
# Before (168 chars)
"How   automated   are\n\nyour    workflows?\n\n\nPlease   describe."

# After (52 chars)
"How automated are your workflows? Please describe."

# Savings: 69%
```

### 3.2 Diagnostic Answer Compression

Convert verbose answer objects to compact string format.

**Example**:
```python
# Before (4,500 chars for 30 questions)
[
  {
    "question_id": "workflow_automation",
    "question_text": "How automated are your workflows?",
    "selected_option": "Mostly manual with some automation",
    "option_value": 2,
    "weight": 1.5
  },
  ...
]

# After (600 chars)
"Q1:mostly_manual|Q2:partial|Q3:advanced|Q4:none|..."

# Savings: 87%
```

### 3.3 Context Deduplication

Use reference IDs instead of resending full context.

**Example**:
```python
# Before (resending full snapshot result - 3,200 chars)
{
  "snapshot_result": {
    "readiness_score": 67,
    "category_scores": {...},
    "recommendations": [...]
  }
}

# After (using reference ID - 45 chars)
{
  "context_id": "snapshot_result_abc123"
}

# Savings: 99%
```

### 3.4 Field Pruning

Remove optional fields not needed for specific task.

**Example**:
```python
# Before (includes all metadata)
{
  "query": "...",
  "timestamp": "2026-02-15T19:00:00Z",
  "user_agent": "Mozilla/5.0...",
  "session_id": "...",
  "debug_info": {...}
}

# After (only essential fields)
{
  "query": "..."
}
```

## 4. Caching Strategy

### 4.1 Cache Key Generation

```python
def generate_cache_key(task_type: str, input_data: str, model: str) -> str:
    input_hash = hashlib.sha256(input_data.encode()).hexdigest()[:12]
    return f"cache:v1:{task_type}:{model}:{input_hash}"

# Example: "cache:v1:snapshot_diagnostic:deepseek-v3:a7f2c4d1e5b3"
```

### 4.2 TTL Configuration

```python
CACHE_TTL = {
    "snapshot_diagnostic": 3600,    # 1 hour
    "deep_diagnostic": 3600,        # 1 hour
    "console_chat": 300,            # 5 minutes
    "workflow_generation": 1800,    # 30 minutes
    "log_analysis": 600             # 10 minutes
}
```

### 4.3 Cache Storage

- **Implementation**: In-memory LRU cache (cachetools library)
- **Size**: 1000 entries (configurable)
- **Eviction**: LRU (Least Recently Used)
- **Persistence**: Optional Redis backend for distributed caching

## 5. Step-wise Reasoning

### 5.1 When to Use

- Tasks with estimated output >2500 tokens
- Multi-phase workflows (e.g., deep diagnostic)
- Tasks requiring intermediate validation

### 5.2 Step Definition

```python
@dataclass
class StepDefinition:
    step_number: int
    step_name: str
    prompt: str
    max_tokens: int
    depends_on: Optional[int] = None
    required: bool = True
```

### 5.3 Example: Deep Diagnostic Steps

```python
steps = [
    StepDefinition(
        step_number=1,
        step_name="executive_summary",
        prompt="Generate executive summary based on snapshot...",
        max_tokens=500
    ),
    StepDefinition(
        step_number=2,
        step_name="system_architecture",
        prompt="Design system architecture based on summary...",
        max_tokens=800,
        depends_on=1
    ),
    StepDefinition(
        step_number=3,
        step_name="workflow_architecture",
        prompt="Define workflow architecture...",
        max_tokens=1000,
        depends_on=2
    )
]
```

## 6. Standardized Payload Structure

### 6.1 Request Payload

```json
{
  "task_type": "snapshot_diagnostic",
  "query": "Analyze AI readiness",
  "context": {
    "context_id": "optional_reference_id",
    "data": {},
    "references": []
  },
  "options": {
    "max_tokens": 1500,
    "temperature": 0.3,
    "model": "auto",
    "cache_enabled": true,
    "compression_enabled": true,
    "step_wise": false
  },
  "metadata": {
    "user_id": "user_123",
    "session_id": "session_456",
    "tier": "operator"
  }
}
```

### 6.2 Response Payload

```json
{
  "status": "success",
  "data": {
    "response": "...",
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
      "key": "cache:v1:snapshot_diagnostic:deepseek-v3:f8a3b2c1"
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

## 7. Example Workflows

### 7.1 Short Task: Console Chat

**Scenario**: User asks a quick question in console

**Request**:
```json
{
  "task_type": "console_chat",
  "query": "What is workflow automation?",
  "options": {
    "max_tokens": 500
  }
}
```

**Processing**:
1. Compress query (minimal change for short text)
2. Check cache (miss)
3. Select model: deepseek-v3-2-251201
4. Call model
5. Store in cache (TTL: 5 minutes)

**Response**:
```json
{
  "status": "success",
  "data": {
    "response": "Workflow automation is...",
    "model_used": "deepseek-v3-2-251201"
  },
  "metrics": {
    "tokens": {"input": 12, "output": 145, "total": 157, "saved": 3},
    "cache": {"hit": false},
    "timing": {"total_ms": 850}
  }
}
```

**Token Savings**: 3 tokens (2% reduction from compression)

### 7.2 Medium Task: Snapshot Diagnostic

**Scenario**: User completes 30-question diagnostic

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
  }
}
```

**Processing**:
1. Compress 30 answers: 4500 chars → 600 chars (87% reduction)
2. Check cache (miss on first run)
3. Select model: deepseek-v3-2-251201
4. Call model
5. Store in cache (TTL: 1 hour)

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
    "model_used": "deepseek-v3-2-251201"
  },
  "metrics": {
    "tokens": {"input": 245, "output": 412, "total": 657, "saved": 1190},
    "cache": {"hit": false},
    "compression": {"ratio": 0.13},
    "timing": {"total_ms": 2100}
  }
}
```

**Token Savings**: 1,190 tokens (64% reduction from compression)

**Second Request (Same Answers)**:
```json
{
  "metrics": {
    "tokens": {"input": 0, "output": 0, "total": 0, "saved": 657},
    "cache": {"hit": true},
    "timing": {"total_ms": 12}
  }
}
```

**Token Savings**: 657 tokens (100% - cache hit)

### 7.3 Long Task: Deep Diagnostic (Step-wise)

**Scenario**: User requests deployment blueprint

**Request**:
```json
{
  "task_type": "deep_diagnostic",
  "query": "Generate deployment blueprint",
  "context": {
    "context_id": "snapshot_result_abc123"
  },
  "options": {
    "step_wise": true
  }
}
```

**Processing**:
1. Retrieve snapshot result by reference ID (avoid resending 3200 chars)
2. Define 4 steps (executive summary, system arch, workflow arch, agent structure)
3. Execute steps sequentially:
   - Step 1: 500 tokens
   - Step 2: 800 tokens (includes Step 1 context)
   - Step 3: 1000 tokens (includes Step 2 context)
   - Step 4: 700 tokens (includes Step 2 context)
4. Combine results
5. Cache each step individually

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
    "tokens": {"input": 1245, "output": 2834, "total": 4079, "saved": 1521},
    "cache": {"hit": false},
    "compression": {"ratio": 0.39},
    "timing": {"total_ms": 8750}
  }
}
```

**Token Savings**: 1,521 tokens (27% reduction from context deduplication + step-wise)

**Without Protocol** (estimated):
- Input: 3200 (full snapshot) + 450 (query) = 3650 tokens
- Output: 2950 tokens
- Total: 6600 tokens

**With Protocol**:
- Input: 1245 tokens (context reference + compressed)
- Output: 2834 tokens
- Total: 4079 tokens

**Savings**: 2,521 tokens (38% reduction)

## 8. Error Handling & Fallbacks

### 8.1 Fallback Chain

```
1. Primary Model + Cache
   ↓ (cache miss)
2. Primary Model (no cache)
   ↓ (model failure)
3. Fallback Model + Cache
   ↓ (cache miss)
4. Fallback Model (no cache)
   ↓ (failure)
5. Error Response
```

### 8.2 Error Response Format

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

## 9. Configuration

### 9.1 Environment Variables

```bash
# .env.local
PROTOCOL_CACHE_ENABLED=true
PROTOCOL_CACHE_SIZE=1000
PROTOCOL_CACHE_DEFAULT_TTL=3600
PROTOCOL_COMPRESSION_ENABLED=true
PROTOCOL_STEPWISE_THRESHOLD=2500
PROTOCOL_LOG_LEVEL=INFO
PROTOCOL_METRICS_ENABLED=true
```

### 9.2 Task Type Configuration

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

## 10. Monitoring & Metrics

### 10.1 Key Metrics

- **Token Usage**: Total tokens, by task type, by model
- **Token Savings**: Absolute and percentage
- **Cache Hit Rate**: Hits / (Hits + Misses)
- **Compression Ratio**: Compressed Size / Original Size
- **Response Time**: P50, P95, P99
- **Error Rate**: Errors / Total Requests

### 10.2 Logging Format

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

## 11. Implementation Checklist

- [ ] Create protocol configuration module
- [ ] Implement input compressor
- [ ] Implement cache manager
- [ ] Implement payload validator
- [ ] Implement step-wise reasoner
- [ ] Implement protocol logger
- [ ] Implement protocol manager
- [ ] Integrate with diagnostic routes
- [ ] Integrate with console service
- [ ] Integrate with workflow generator
- [ ] Write unit tests (80%+ coverage)
- [ ] Write integration tests
- [ ] Perform token usage analysis
- [ ] Deploy to staging
- [ ] Monitor and validate
- [ ] Deploy to production

## 12. Success Criteria

✅ 30-50% reduction in token usage  
✅ 40%+ cache hit rate  
✅ No degradation in response times  
✅ No increase in error rates  
✅ All existing tests pass  
✅ 80%+ code coverage for new code

---

**Document Version**: 1.0  
**Created**: February 15, 2026  
**Status**: Specification Complete - Ready for Implementation
