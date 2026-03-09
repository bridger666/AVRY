# Aivory AI Readiness Platform - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [API Documentation](#api-documentation)
5. [Frontend Features](#frontend-features)
6. [Diagnostic Flows](#diagnostic-flows)
7. [Troubleshooting](#troubleshooting)
8. [Development Guide](#development-guide)

---

## System Overview

Aivory is an AI readiness assessment platform that helps organizations evaluate their AI adoption potential and receive customized recommendations. The platform offers three diagnostic tiers:

- **Free Diagnostic** (12 questions) - Basic AI readiness assessment with rule-based scoring
- **AI Snapshot** ($15) - Fast AI readiness assessment using DeepSeek reasoning model (30 questions)
- **AI System Blueprint** ($99) - Complete AI system design using 3-model agent chain (30 questions)

### Technology Stack

**Backend:**
- Python 3.11
- FastAPI (web framework)
- Pydantic (data validation)
- HTTPX (async HTTP client)
- Uvicorn (ASGI server)

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- XAMPP (Apache web server)

**AI Integration:**
- Sumopod AI Platform (https://ai.sumopod.com)
- Models: DeepSeek-v3, Kimi-k2, GLM-4

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  (XAMPP Apache - http://localhost/aivory/frontend/)         │
│                                                              │
│  - index.html (main page)                                   │
│  - app.js (application logic)                               │
│  - diagnostic-questions-paid.js (30-question config)        │
│  - styles.css (styling)                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/JSON
                   │ (localhost:8081)
┌──────────────────▼──────────────────────────────────────────┐
│                    Backend API                               │
│         (FastAPI - http://localhost:8081)                   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Routes                                         │    │
│  │  - /api/v1/diagnostic/run (free)                   │    │
│  │  - /api/v1/diagnostic/snapshot (paid $15)          │    │
│  │  - /api/v1/diagnostic/deep (paid $99)              │    │
│  │  - /api/v1/contact                                  │    │
│  │  - /health                                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Services                                           │    │
│  │  - scoring_service.py (rule-based scoring)         │    │
│  │  - ai_enrichment.py (AI insights)                  │    │
│  │  - badge_service.py (SVG badge generation)         │    │
│  │  - tier_service.py (subscription tiers)            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  LLM Clients                                        │    │
│  │  - sumopod_client.py (Sumopod AI integration)      │    │
│  │  - ollama_client.py (legacy local LLM)             │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS/JSON
                   │ (ai.sumopod.com)
┌──────────────────▼──────────────────────────────────────────┐
│                  Sumopod AI Platform                         │
│                                                              │
│  - deepseek-v3-2-251201 (reasoning & analysis)              │
│  - kimi-k2-250905 (system design)                           │
│  - glm-4-7-251222 (executive blueprint)                     │
└──────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
~/Documents/Aivory/
├── .env.local                          # Environment configuration
├── .gitignore
├── requirements.txt                    # Python dependencies
├── run_server.py                       # Server startup script
├── start.sh                            # Shell startup script
│
├── app/                                # Backend application
│   ├── __init__.py
│   ├── main.py                         # FastAPI app entry point
│   ├── config.py                       # Configuration management
│   │
│   ├── api/                            # API routes
│   │   └── routes/
│   │       ├── diagnostic.py           # Diagnostic endpoints
│   │       ├── contact.py              # Contact form
│   │       └── tier.py                 # Tier management
│   │
│   ├── llm/                            # LLM integrations
│   │   ├── sumopod_client.py           # Sumopod AI client
│   │   └── ollama_client.py            # Ollama client (legacy)
│   │
│   ├── models/                         # Data models
│   │   ├── diagnostic.py               # Diagnostic models
│   │   ├── contact.py                  # Contact models
│   │   └── user_tier.py                # Tier models
│   │
│   └── services/                       # Business logic
│       ├── scoring_service.py          # Scoring engine
│       ├── ai_enrichment.py            # AI insights
│       ├── badge_service.py            # Badge generation
│       ├── tier_service.py             # Tier management
│       ├── scoring_config.py           # Scoring configuration
│       └── static_content.py           # Static content
│
└── frontend/                           # Frontend application
    ├── index.html                      # Main HTML page
    ├── app.js                          # Application logic
    ├── diagnostic-questions-paid.js    # 30-question config
    ├── styles.css                      # Styling
    ├── aivory_logo.png                 # Logo
    ├── Aivory_HS_backgroundPlus.svg    # Animated background
    └── utils/
        └── recommendationEngine.js     # Recommendation logic
```

---

## Installation & Setup

### Prerequisites

1. **Python 3.11** (required - Python 3.13 has compatibility issues)
   ```bash
   brew install python@3.11
   ```

2. **XAMPP** (for frontend hosting)
   - Download from https://www.apachefriends.org/
   - Install to `/Applications/XAMPP/`

3. **Sumopod API Key**
   - Sign up at https://ai.sumopod.com
   - Get API key (format: `sk-...`)

### Backend Setup

1. **Navigate to project directory:**
   ```bash
   cd ~/Documents/Aivory
   ```

2. **Create virtual environment:**
   ```bash
   /opt/homebrew/opt/python@3.11/bin/python3.11 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   Create `.env.local` file:
   ```env
   SUMOPOD_API_KEY=sk-your-api-key-here
   SUMOPOD_BASE_URL=https://ai.sumopod.com/v1
   ```

5. **Start backend server:**
   ```bash
   /opt/homebrew/opt/python@3.11/bin/python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
   ```

   Server will be available at: `http://localhost:8081`

### Frontend Setup

1. **Copy frontend files to XAMPP:**
   ```bash
   cp -r frontend/* /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/
   ```

2. **Start XAMPP:**
   - Open XAMPP Control Panel
   - Start Apache server

3. **Access frontend:**
   Open browser to: `http://localhost/aivory/frontend/index.html`

### Verification

1. **Check backend health:**
   ```bash
   curl http://localhost:8081/health
   ```

2. **Test Sumopod connection:**
   ```bash
   curl -X POST http://localhost:8081/api/v1/diagnostic/snapshot \
     -H "Content-Type: application/json" \
     -d '{"answers": [{"question_id": "test", "selected_option": "test"}], "language": "en"}'
   ```

---

## API Documentation

### Base URL
```
http://localhost:8081/api/v1
```

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "llm_available": true,
  "timestamp": "2024-02-13T10:30:00.000Z"
}
```

---

#### 2. Free Diagnostic (12 Questions)
```http
POST /diagnostic/run
```

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "business_objective",
      "selected_option": 2
    }
  ]
}
```

**Response:**
```json
{
  "score": 75.5,
  "category": "AI-Ready",
  "category_explanation": "Your organization shows strong readiness...",
  "insights": [
    "Strong leadership alignment",
    "Good data infrastructure"
  ],
  "recommendation": "Consider starting with pilot projects...",
  "badge_svg": "<svg>...</svg>"
}
```

---

#### 3. AI Snapshot ($15)
```http
POST /diagnostic/snapshot
```

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "business_goal_1",
      "selected_option": "cost_reduction"
    }
  ],
  "language": "en"
}
```

**Response:**
```json
{
  "readiness_score": 68,
  "readiness_level": "Proficient",
  "summary": "Your organization demonstrates solid AI readiness...",
  "key_gaps": [
    "Limited AI expertise in team",
    "Data quality needs improvement"
  ],
  "recommended_use_cases": [
    "Customer service automation",
    "Document processing"
  ],
  "priority_actions": [
    "Hire AI specialist",
    "Implement data governance"
  ],
  "upgrade_recommendation": "Consider deep diagnostic for complete blueprint..."
}
```

**Model Used:** `deepseek-v3-2-251201`

**Timeout:** 60 seconds

---

#### 4. Deep Diagnostic ($99)
```http
POST /diagnostic/deep
```

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "business_goal_1",
      "selected_option": "cost_reduction"
    }
  ],
  "language": "en"
}
```

**Response:**
```json
{
  "executive_summary": "Based on comprehensive analysis...",
  "system_recommendation": {
    "system_name": "Intelligent Customer Service Hub",
    "description": "AI-powered customer service automation...",
    "confidence_level": "High"
  },
  "workflow_architecture": [
    {
      "trigger": "Customer inquiry received",
      "steps": [
        "Classify inquiry type",
        "Extract key information",
        "Generate response"
      ],
      "tools_used": ["NLP classifier", "Knowledge base", "Response generator"]
    }
  ],
  "agent_structure": [
    {
      "agent_name": "Intake Agent",
      "role": "First-line inquiry handler",
      "responsibilities": [
        "Classify inquiries",
        "Route to appropriate handler"
      ]
    }
  ],
  "expected_impact": {
    "automation_potential_percent": 75,
    "estimated_time_saved_hours_per_week": 40,
    "expected_roi": "300% in 12 months"
  },
  "deployment_complexity": "Medium",
  "recommended_plan": "Phase 1: Deploy intake agent..."
}
```

**Models Used (3-agent chain):**
1. `deepseek-v3-2-251201` - Analysis
2. `kimi-k2-250905` - System Design
3. `glm-4-7-251222` - Executive Blueprint

**Timeout:** 90 seconds per agent (270 seconds total)

---

#### 5. Contact Form
```http
POST /contact
```

**Request Body:**
```json
{
  "name": "John Doe",
  "company": "Acme Corp",
  "email": "john@acme.com",
  "message": "Interested in AI consultation"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Thank you for contacting us"
}
```

---

## Frontend Features

### 1. Animated Background
- 29 green plus symbols with flicker animation
- Realistic star-like behavior
- Random initial state (78% OFF, 22% ON)
- Maximum 7 stars visible simultaneously
- Smooth CSS animations with varied delays

### 2. Diagnostic Flows

#### Free Diagnostic (12 Questions)
- Quick assessment
- Rule-based scoring
- Instant results
- Downloadable SVG badge

#### Paid Diagnostic (30 Questions)
- Comprehensive assessment
- 6 sections with 5 questions each
- Step-by-step navigation
- Progress tracking
- Auto-save to localStorage
- Resume capability

### 3. Result Displays

#### Snapshot Results
- Readiness score (0-100)
- Readiness level (Novice/Emerging/Proficient/Advanced)
- Key gaps analysis
- Recommended use cases
- Priority actions (30-day plan)
- Upgrade CTA to Deep Diagnostic

#### Deep Diagnostic Results
- Executive summary
- System recommendation with confidence level
- Workflow architecture diagrams
- Agent structure breakdown
- Expected impact metrics
- Deployment complexity assessment
- Recommended deployment plan
- PDF download option

### 4. Tier System
- Foundation Plan ($200/month) - 3 workflows, 3K executions
- Acceleration Plan ($500/month) - 10 workflows, 15K executions
- Intelligence Plan ($1000/month) - Unlimited

---

## Diagnostic Flows

### Free Diagnostic Flow

```
User clicks "Run Free Diagnostic"
    ↓
Show 12 questions (one at a time)
    ↓
User answers all questions
    ↓
Submit to /api/v1/diagnostic/run
    ↓
Backend calculates score (rule-based)
    ↓
Display results with badge
```

### AI Snapshot Flow ($15)

```
User clicks "Run AI Snapshot"
    ↓
Show 30 questions (step-by-step)
    ↓
Auto-save answers to localStorage
    ↓
User completes all 30 questions
    ↓
Submit to /api/v1/diagnostic/snapshot
    ↓
Backend calls DeepSeek model
    ↓
AI analyzes readiness
    ↓
Display snapshot results
    ↓
Clear localStorage
```

### Deep Diagnostic Flow ($99)

```
User clicks "Generate AI Blueprint"
    ↓
Show 30 questions (step-by-step)
    ↓
Auto-save answers to localStorage
    ↓
User completes all 30 questions
    ↓
Submit to /api/v1/diagnostic/deep
    ↓
Backend orchestrates 3-agent chain:
    ├─ Agent 1: DeepSeek Analysis
    ├─ Agent 2: Kimi System Design
    └─ Agent 3: GLM Executive Blueprint
    ↓
Display complete AI system blueprint
    ↓
Clear localStorage
```

---

## Troubleshooting

### Backend Issues

#### Error: "Address already in use"
```bash
# Find and kill existing process
ps aux | grep uvicorn
kill -9 <PID>

# Or use lsof
lsof -ti:8081 | xargs kill -9
```

#### Error: "Authentication Error, expected to start with 'sk-'"
- Check `.env.local` file
- Ensure API key starts with `sk-`
- Correct format: `SUMOPOD_API_KEY=sk-your-key-here`

#### Error: "Sumopod API timeout"
- Check internet connection
- Verify Sumopod service status
- Increase timeout in `sumopod_client.py`

#### Error: "Failed to parse AI response as JSON"
- AI wrapped JSON in markdown code blocks
- Already handled in code with markdown stripping
- Check logs for raw response

### Frontend Issues

#### Changes not reflecting
```bash
# Hard refresh browser
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows)

# Clear browser cache
# Or use incognito mode
```

#### API calls failing
- Check backend is running: `curl http://localhost:8081/health`
- Check CORS settings in `app/main.py`
- Check browser console for errors

#### Paid diagnostic not showing
- Verify `diagnostic-questions-paid.js` is loaded
- Check `paid-diagnostic` section exists in HTML
- Check browser console for JavaScript errors

### Python Version Issues

#### Using Python 3.13
```bash
# Python 3.13 has pydantic-core compatibility issues
# Switch to Python 3.11

# Install Python 3.11
brew install python@3.11

# Create new venv
/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Development Guide

### Adding New Questions

1. **Edit `frontend/diagnostic-questions-paid.js`:**
```javascript
{
    id: "new_question_id",
    section: "Section Name",
    question: "Your question text?",
    type: "single-choice", // or "multiple-choice"
    options: [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" }
    ]
}
```

2. **Copy to XAMPP:**
```bash
cp frontend/diagnostic-questions-paid.js /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/
```

### Adding New AI Models

1. **Edit `app/llm/sumopod_client.py`:**
```python
async def chat_completion(
    self,
    messages: List[SumopodMessage],
    model: str,  # Pass any Sumopod model name
    temperature: float = 0.3,
    max_tokens: int = 2000,
    timeout: float = 30.0
) -> str:
    # Implementation handles any model
```

2. **Use in diagnostic endpoint:**
```python
response = await sumopod.chat_completion(
    messages=messages,
    model="new-model-name",  # Any Sumopod model
    temperature=0.3,
    timeout=60.0
)
```

### Adding New Endpoints

1. **Create route in `app/api/routes/`:**
```python
@router.post("/new-endpoint")
async def new_endpoint(data: dict):
    # Implementation
    return {"result": "success"}
```

2. **Register in `app/main.py`:**
```python
from app.api.routes import new_route
app.include_router(new_route.router, prefix="/api/v1")
```

### Modifying Scoring Logic

Edit `app/services/scoring_service.py`:
```python
def calculate_score(answers: List[DiagnosticAnswer]) -> float:
    # Custom scoring logic
    total_score = 0
    for answer in answers:
        # Calculate score
        pass
    return total_score
```

### Customizing UI

Edit `frontend/styles.css`:
```css
/* Modify colors */
:root {
    --primary-color: #8b5cf6;
    --secondary-color: #07d197;
}

/* Modify animations */
@keyframes flicker {
    /* Custom animation */
}
```

---

## Environment Variables

### Required Variables

```env
# Sumopod AI Configuration
SUMOPOD_API_KEY=sk-your-api-key-here
SUMOPOD_BASE_URL=https://ai.sumopod.com/v1
```

### Optional Variables

```env
# Server Configuration
HOST=0.0.0.0
PORT=8081

# LLM Configuration (legacy Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistralai/Mistral-7B-Instruct
LLM_TIMEOUT=5.0
LLM_MAX_TOKENS=500
LLM_TEMPERATURE=0.7

# CORS Configuration
CORS_ORIGINS=["*"]
```

---

## Performance Optimization

### Backend
- Use async/await for all I/O operations
- Implement request caching for repeated queries
- Add rate limiting for API endpoints
- Use connection pooling for HTTP clients

### Frontend
- Lazy load diagnostic questions
- Implement virtual scrolling for long lists
- Compress images and assets
- Use CDN for static assets

### AI Calls
- Implement retry logic with exponential backoff
- Cache AI responses for identical inputs
- Use streaming for long responses
- Implement timeout handling

---

## Security Considerations

### API Security
- Validate all input data
- Sanitize user inputs
- Implement rate limiting
- Use HTTPS in production
- Store API keys securely

### Data Privacy
- Don't log sensitive user data
- Implement data retention policies
- Comply with GDPR/privacy regulations
- Encrypt data at rest and in transit

### Frontend Security
- Sanitize HTML output
- Prevent XSS attacks
- Validate form inputs
- Use Content Security Policy

---

## Deployment

### Production Checklist

1. **Environment Configuration:**
   - Set production API keys
   - Configure production URLs
   - Enable HTTPS
   - Set secure CORS origins

2. **Backend Deployment:**
   - Use production ASGI server (Gunicorn + Uvicorn)
   - Set up reverse proxy (Nginx)
   - Configure SSL certificates
   - Set up monitoring and logging

3. **Frontend Deployment:**
   - Minify JavaScript and CSS
   - Optimize images
   - Enable caching headers
   - Use CDN for static assets

4. **Database Setup:**
   - Set up production database
   - Configure backups
   - Implement migrations

5. **Monitoring:**
   - Set up error tracking (Sentry)
   - Configure logging (CloudWatch, Datadog)
   - Set up uptime monitoring
   - Configure alerts

---

## Support & Contact

For issues or questions:
- Email: support@aivory.com
- Documentation: https://docs.aivory.com
- GitHub: https://github.com/aivory/platform

---

## License

Copyright © 2024 Aivory. All rights reserved.
