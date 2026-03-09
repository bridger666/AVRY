# Aivory API Reference

Complete API documentation for the Aivory AI Readiness Platform.

---

## Base URL

```
http://localhost:8081
```

**Production:** Replace with your production domain.

---

## Authentication

Currently, no authentication is required (prototype mode).

**Future:** Will use Bearer token authentication:
```http
Authorization: Bearer <token>
```

---

## Common Headers

All POST requests require:
```http
Content-Type: application/json
```

---

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

---

## Endpoints

### 1. Health Check

Check API health and LLM availability.

**Endpoint:** `GET /health`

**Parameters:** None

**Response:**
```json
{
  "status": "healthy",
  "llm_available": true,
  "timestamp": "2024-02-13T10:30:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

**Example:**
```bash
curl http://localhost:8081/health
```

---

### 2. Free Diagnostic

Run free 12-question diagnostic with rule-based scoring.

**Endpoint:** `POST /api/v1/diagnostic/run`

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "business_objective",
      "selected_option": 2
    },
    {
      "question_id": "current_ai_usage",
      "selected_option": 1
    }
  ]
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `answers` | Array | Yes | Array of answer objects |
| `answers[].question_id` | String | Yes | Question identifier |
| `answers[].selected_option` | Integer | Yes | Selected option index (0-3) |

**Valid Question IDs:**
- `business_objective`
- `current_ai_usage`
- `data_availability`
- `process_documentation`
- `workflow_standardization`
- `erp_integration`
- `automation_level`
- `decision_speed`
- `leadership_alignment`
- `budget_ownership`
- `change_readiness`
- `internal_capability`

**Response:**
```json
{
  "score": 75.5,
  "category": "AI-Ready",
  "category_explanation": "Your organization shows strong readiness for AI adoption...",
  "insights": [
    "Strong leadership alignment on AI initiatives",
    "Good data infrastructure in place",
    "Process documentation needs improvement"
  ],
  "recommendation": "Consider starting with pilot projects in customer service automation...",
  "badge_svg": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `score` | Float | Overall readiness score (0-100) |
| `category` | String | Readiness category (AI-Novice, AI-Curious, AI-Ready, AI-Advanced) |
| `category_explanation` | String | Explanation of the category |
| `insights` | Array[String] | Key insights from the assessment |
| `recommendation` | String | Personalized recommendation |
| `badge_svg` | String | SVG badge for sharing |

**Status Codes:**
- `200 OK` - Diagnostic completed successfully
- `422 Unprocessable Entity` - Invalid input data
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST http://localhost:8081/api/v1/diagnostic/run \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"question_id": "business_objective", "selected_option": 3},
      {"question_id": "current_ai_usage", "selected_option": 2},
      {"question_id": "data_availability", "selected_option": 2},
      {"question_id": "process_documentation", "selected_option": 2},
      {"question_id": "workflow_standardization", "selected_option": 2},
      {"question_id": "erp_integration", "selected_option": 2},
      {"question_id": "automation_level", "selected_option": 2},
      {"question_id": "decision_speed", "selected_option": 2},
      {"question_id": "leadership_alignment", "selected_option": 2},
      {"question_id": "budget_ownership", "selected_option": 2},
      {"question_id": "change_readiness", "selected_option": 2},
      {"question_id": "internal_capability", "selected_option": 2}
    ]
  }'
```

---

### 3. AI Snapshot Diagnostic

Run AI-powered snapshot diagnostic ($15 tier).

**Endpoint:** `POST /api/v1/diagnostic/snapshot`

**AI Model:** `deepseek-v3-2-251201`

**Processing Time:** 5-10 seconds

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "business_goal_1",
      "selected_option": "cost_reduction"
    },
    {
      "question_id": "business_goal_2",
      "selected_option": "10m_50m"
    }
  ],
  "language": "en"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `answers` | Array | Yes | Array of answer objects (30 questions) |
| `answers[].question_id` | String | Yes | Question identifier |
| `answers[].selected_option` | String | Yes | Selected option value |
| `language` | String | No | Response language ("en" or "id"), defaults to "en" |

**Valid Question IDs:** See `diagnostic-questions-paid.js` for complete list (30 questions across 6 sections).

**Response:**
```json
{
  "readiness_score": 68,
  "readiness_level": "Proficient",
  "summary": "Your organization demonstrates solid AI readiness with strong business goals and moderate technical infrastructure. Key opportunities exist in data quality improvement and team skill development.",
  "key_gaps": [
    "Limited AI/ML expertise in current team",
    "Data quality and governance need improvement",
    "Process documentation is incomplete"
  ],
  "recommended_use_cases": [
    "Customer service chatbot for repetitive inquiries",
    "Document processing and data entry automation",
    "Sales lead scoring and prioritization"
  ],
  "priority_actions": [
    "Hire or train AI specialist within next 30 days",
    "Implement data quality assessment and cleanup",
    "Document top 5 business processes in detail",
    "Run pilot project with customer service automation"
  ],
  "upgrade_recommendation": "Your readiness score indicates strong potential for comprehensive AI transformation. Consider running a Deep Diagnostic to receive a complete AI System Blueprint with specific architecture, agent design, and deployment roadmap tailored to your organization."
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `readiness_score` | Integer | AI readiness score (0-100) |
| `readiness_level` | String | Level: Novice, Emerging, Proficient, or Advanced |
| `summary` | String | 2-3 sentence executive summary |
| `key_gaps` | Array[String] | Critical gaps preventing AI adoption |
| `recommended_use_cases` | Array[String] | Quick-win AI use cases |
| `priority_actions` | Array[String] | Actions for next 30 days |
| `upgrade_recommendation` | String | Why to upgrade to Deep Diagnostic |

**Status Codes:**
- `200 OK` - Diagnostic completed successfully
- `422 Unprocessable Entity` - Invalid input data
- `500 Internal Server Error` - AI processing error

**Example:**
```bash
curl -X POST http://localhost:8081/api/v1/diagnostic/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"question_id": "business_goal_1", "selected_option": "cost_reduction"},
      {"question_id": "business_goal_2", "selected_option": "10m_50m"}
    ],
    "language": "en"
  }'
```

---

### 4. Deep Diagnostic (AI System Blueprint)

Run comprehensive AI system design diagnostic ($99 tier).

**Endpoint:** `POST /api/v1/diagnostic/deep`

**AI Models:** 3-agent chain
1. `deepseek-v3-2-251201` - Analysis
2. `kimi-k2-250905` - System Design
3. `glm-4-7-251222` - Executive Blueprint

**Processing Time:** 10-20 seconds

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "business_goal_1",
      "selected_option": "cost_reduction"
    },
    {
      "question_id": "business_goal_2",
      "selected_option": "10m_50m"
    }
  ],
  "language": "en"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `answers` | Array | Yes | Array of answer objects (30 questions) |
| `answers[].question_id` | String | Yes | Question identifier |
| `answers[].selected_option` | String | Yes | Selected option value |
| `language` | String | No | Response language ("en" or "id"), defaults to "en" |

**Response:**
```json
{
  "executive_summary": "Based on comprehensive analysis of your organization's AI readiness, we recommend implementing an Intelligent Customer Service Hub that will automate 75% of routine inquiries while improving response times by 80%. This system leverages your existing CRM infrastructure and can be deployed in 3 phases over 6 months.",
  
  "system_recommendation": {
    "system_name": "Intelligent Customer Service Hub",
    "description": "AI-powered customer service automation system with multi-channel support, intelligent routing, and continuous learning capabilities.",
    "confidence_level": "High"
  },
  
  "workflow_architecture": [
    {
      "trigger": "Customer inquiry received via email, chat, or phone",
      "steps": [
        "Classify inquiry type and urgency",
        "Extract key information and intent",
        "Search knowledge base for relevant solutions",
        "Generate personalized response",
        "Route to human agent if needed",
        "Log interaction and update customer profile"
      ],
      "tools_used": [
        "NLP classifier",
        "Entity extraction engine",
        "Vector database for knowledge base",
        "Response generation model",
        "CRM integration API",
        "Analytics dashboard"
      ]
    }
  ],
  
  "agent_structure": [
    {
      "agent_name": "Intake Agent",
      "role": "First-line inquiry handler",
      "responsibilities": [
        "Receive and classify all incoming inquiries",
        "Extract customer information and intent",
        "Determine urgency and priority",
        "Route to appropriate handler (AI or human)"
      ]
    },
    {
      "agent_name": "Resolution Agent",
      "role": "Automated problem solver",
      "responsibilities": [
        "Search knowledge base for solutions",
        "Generate contextual responses",
        "Handle routine inquiries autonomously",
        "Escalate complex issues to humans"
      ]
    },
    {
      "agent_name": "Learning Agent",
      "role": "Continuous improvement",
      "responsibilities": [
        "Analyze resolution success rates",
        "Identify knowledge gaps",
        "Suggest knowledge base updates",
        "Monitor customer satisfaction"
      ]
    }
  ],
  
  "expected_impact": {
    "automation_potential_percent": 75,
    "estimated_time_saved_hours_per_week": 40,
    "expected_roi": "300% within 12 months"
  },
  
  "deployment_complexity": "Medium",
  
  "recommended_plan": "Phase 1 (Months 1-2): Deploy Intake Agent for inquiry classification and routing. Phase 2 (Months 3-4): Add Resolution Agent for top 10 inquiry types. Phase 3 (Months 5-6): Implement Learning Agent and expand coverage to all inquiry types. Expected investment: $50K-$75K for initial deployment, $10K/month for maintenance and optimization."
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `executive_summary` | String | High-level overview for executives |
| `system_recommendation` | Object | Recommended AI system |
| `system_recommendation.system_name` | String | Name of the AI system |
| `system_recommendation.description` | String | System description |
| `system_recommendation.confidence_level` | String | High, Medium, or Low |
| `workflow_architecture` | Array[Object] | Workflow designs |
| `workflow_architecture[].trigger` | String | What triggers the workflow |
| `workflow_architecture[].steps` | Array[String] | Workflow steps |
| `workflow_architecture[].tools_used` | Array[String] | Required tools |
| `agent_structure` | Array[Object] | AI agent designs |
| `agent_structure[].agent_name` | String | Agent name |
| `agent_structure[].role` | String | Agent role |
| `agent_structure[].responsibilities` | Array[String] | Agent responsibilities |
| `expected_impact` | Object | Expected business impact |
| `expected_impact.automation_potential_percent` | Integer | % of work that can be automated |
| `expected_impact.estimated_time_saved_hours_per_week` | Integer | Hours saved per week |
| `expected_impact.expected_roi` | String | Expected ROI description |
| `deployment_complexity` | String | Low, Medium, or High |
| `recommended_plan` | String | Phased deployment plan |

**Status Codes:**
- `200 OK` - Diagnostic completed successfully
- `422 Unprocessable Entity` - Invalid input data
- `500 Internal Server Error` - AI processing error

**Example:**
```bash
curl -X POST http://localhost:8081/api/v1/diagnostic/deep \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"question_id": "business_goal_1", "selected_option": "cost_reduction"},
      {"question_id": "business_goal_2", "selected_option": "10m_50m"}
    ],
    "language": "en"
  }'
```

---

### 5. Contact Form

Submit contact form inquiry.

**Endpoint:** `POST /api/v1/contact`

**Request Body:**
```json
{
  "name": "John Doe",
  "company": "Acme Corporation",
  "email": "john.doe@acme.com",
  "message": "Interested in learning more about AI implementation services."
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Contact name |
| `company` | String | Yes | Company name |
| `email` | String | Yes | Email address |
| `message` | String | Yes | Message content |

**Response:**
```json
{
  "status": "success",
  "message": "Thank you for contacting us. We'll be in touch soon."
}
```

**Status Codes:**
- `200 OK` - Contact form submitted successfully
- `422 Unprocessable Entity` - Invalid input data
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST http://localhost:8081/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "company": "Acme Corp",
    "email": "john@acme.com",
    "message": "Interested in AI consultation"
  }'
```

---

### 6. Test LLM Connection

Test Ollama LLM connection (legacy endpoint).

**Endpoint:** `GET /api/v1/diagnostic/test-llm`

**Parameters:** None

**Response (Success):**
```json
{
  "status": "success",
  "response": "Hello from Aivory!",
  "message": "LLM is available and responding"
}
```

**Response (Unavailable):**
```json
{
  "status": "unavailable",
  "error": "Connection refused",
  "message": "LLM is not available, but the system will use static content"
}
```

**Status Codes:**
- `200 OK` - LLM is available
- `503 Service Unavailable` - LLM is not available

**Example:**
```bash
curl http://localhost:8081/api/v1/diagnostic/test-llm
```

---

## Error Handling

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `400` | Bad Request | Malformed JSON |
| `422` | Unprocessable Entity | Invalid data format |
| `500` | Internal Server Error | Server error, AI API error |
| `503` | Service Unavailable | LLM not available |

### Error Examples

**Missing Required Field:**
```json
{
  "detail": "No answers provided"
}
```

**AI Processing Error:**
```json
{
  "detail": "AI response parsing failed"
}
```

**Timeout Error:**
```json
{
  "detail": "Sumopod API timeout: Request took too long"
}
```

---

## Rate Limiting

**Current:** No rate limiting (prototype mode)

**Future:** Will implement rate limiting:
- Free tier: 10 requests/hour
- Paid tier: 100 requests/hour
- Enterprise: Unlimited

**Rate Limit Headers (Future):**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1676289600
```

---

## Pagination

**Current:** Not applicable (single-request responses)

**Future:** For list endpoints:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

## Webhooks

**Current:** Not implemented

**Future:** Webhook support for:
- Diagnostic completion
- Payment confirmation
- Subscription updates

---

## SDKs

**Current:** No official SDKs

**Future:** Official SDKs planned for:
- Python
- JavaScript/TypeScript
- PHP
- Ruby

---

## API Versioning

**Current Version:** v1

**Base Path:** `/api/v1`

**Future Versions:** Will use path versioning:
- `/api/v1` - Current version
- `/api/v2` - Future version

---

## CORS

**Current:** Allows all origins (`*`)

**Production:** Will restrict to specific domains:
```python
cors_origins = [
    "https://aivory.com",
    "https://www.aivory.com",
    "https://app.aivory.com"
]
```

---

## Testing

### Using cURL

```bash
# Health check
curl http://localhost:8081/health

# Free diagnostic
curl -X POST http://localhost:8081/api/v1/diagnostic/run \
  -H "Content-Type: application/json" \
  -d @test_free_diagnostic.json

# AI Snapshot
curl -X POST http://localhost:8081/api/v1/diagnostic/snapshot \
  -H "Content-Type: application/json" \
  -d @test_snapshot.json

# Deep Diagnostic
curl -X POST http://localhost:8081/api/v1/diagnostic/deep \
  -H "Content-Type: application/json" \
  -d @test_deep.json
```

### Using Postman

1. Import collection from `postman_collection.json` (to be created)
2. Set environment variable: `base_url = http://localhost:8081`
3. Run collection

### Using Python

```python
import requests

# Health check
response = requests.get('http://localhost:8081/health')
print(response.json())

# Free diagnostic
response = requests.post(
    'http://localhost:8081/api/v1/diagnostic/run',
    json={
        'answers': [
            {'question_id': 'business_objective', 'selected_option': 2}
        ]
    }
)
print(response.json())

# AI Snapshot
response = requests.post(
    'http://localhost:8081/api/v1/diagnostic/snapshot',
    json={
        'answers': [
            {'question_id': 'business_goal_1', 'selected_option': 'cost_reduction'}
        ],
        'language': 'en'
    }
)
print(response.json())
```

### Using JavaScript

```javascript
// Health check
fetch('http://localhost:8081/health')
  .then(res => res.json())
  .then(data => console.log(data));

// Free diagnostic
fetch('http://localhost:8081/api/v1/diagnostic/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers: [
      { question_id: 'business_objective', selected_option: 2 }
    ]
  })
})
  .then(res => res.json())
  .then(data => console.log(data));

// AI Snapshot
fetch('http://localhost:8081/api/v1/diagnostic/snapshot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers: [
      { question_id: 'business_goal_1', selected_option: 'cost_reduction' }
    ],
    language: 'en'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Interactive API Documentation

FastAPI provides automatic interactive API documentation:

**Swagger UI:** http://localhost:8081/docs

**ReDoc:** http://localhost:8081/redoc

These interfaces allow you to:
- View all endpoints
- See request/response schemas
- Test endpoints directly in browser
- Download OpenAPI specification

---

## OpenAPI Specification

Download the OpenAPI (Swagger) specification:

```bash
curl http://localhost:8081/openapi.json > aivory_openapi.json
```

Use this specification to:
- Generate client SDKs
- Import into API testing tools
- Generate documentation
- Validate requests/responses

---

## Support

For API support:
- **Documentation:** See `AIVORY_COMPLETE_DOCUMENTATION.md`
- **Issues:** Report bugs in `BUG_FIXES_AND_TESTING.md`
- **Email:** support@aivory.com (future)

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Free diagnostic endpoint
- AI Snapshot endpoint
- Deep Diagnostic endpoint
- Contact form endpoint
- Health check endpoint

### Future Versions
- v1.1.0: Authentication and user management
- v1.2.0: Payment integration
- v1.3.0: Webhook support
- v2.0.0: Major API redesign (TBD)

---

## License

API access is subject to Aivory Terms of Service.

Copyright © 2024 Aivory. All rights reserved.
