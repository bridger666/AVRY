# Aivory - AI Readiness Diagnostic Platform

A complete web application that helps organizations understand their AI readiness, identify automation opportunities, and convert diagnostic insights into monetization paths.

## Features

- **Homepage**: Clear value proposition with three entry points
- **12-Question Diagnostic**: Google Form-style assessment in under 3 minutes
- **AI Readiness Score**: Normalized 0-100 score with category classification
- **AI Enrichment**: LLM-powered insights with graceful degradation
- **Downloadable Badge**: Visual representation of readiness score
- **Tiered Offerings**: Three monetization levels ($49, $150, Custom)
- **Build Automation Section**: Information about automation services
- **Design AI System Section**: Strategic architecture planning
- **Contact Form**: Consultation request submission

## Tech Stack

- **Backend**: Python FastAPI running on localhost:8081
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **LLM**: Mistral-7B-Instruct via Ollama
- **Architecture**: Graceful degradation ensures UI works even if AI fails

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Ollama with Mistral-7B-Instruct model (optional, system works without it)

### Installation

1. Clone the repository
2. Run the startup script:

```bash
./start.sh
```

Or manually:

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start the backend
uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

### Viewing the Application

Option 1: Open `frontend/index.html` directly in your browser

Option 2: Use a simple HTTP server:
```bash
python3 -m http.server 8080 --directory frontend
```
Then visit http://localhost:8080

## Configuration

Edit `.env` file to configure:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistralai/Mistral-7B-Instruct
LLM_TIMEOUT=5.0
LLM_MAX_TOKENS=500
LLM_TEMPERATURE=0.7
PORT=8081
```

## API Endpoints

### Health Check
```
GET /health
```
Returns system health and LLM availability status.

### Run Diagnostic
```
POST /api/v1/diagnostic/run
```
Submit 12 diagnostic answers and receive AI readiness results.

### Submit Contact Form
```
POST /api/v1/contact
```
Submit consultation request.

### Test LLM
```
GET /api/v1/diagnostic/test-llm
```
Test Ollama connection.

## Architecture

### Mandatory Scoring (Always Works)
- Calculates raw score (0-36) from 12 questions
- Normalizes to 0-100 scale
- Assigns category: AI Unready, AI Curious, AI Ready, or AI Native
- Works independently of LLM availability

### AI Enrichment (Optional)
- Generates 3 personalized insights
- Creates custom recommendation paragraph
- Assigns readiness narrative
- Falls back to static content if LLM unavailable

### Graceful Degradation
- System provides value even when AI components fail
- Static content for each readiness category
- UI always renders and functions
- No blocking on LLM availability

## Project Structure

```
.
├── app/
│   ├── api/routes/          # API endpoints
│   ├── models/              # Pydantic data models
│   ├── services/            # Business logic
│   │   ├── scoring_config.py
│   │   ├── scoring_service.py
│   │   ├── static_content.py
│   │   ├── ai_enrichment.py
│   │   └── badge_service.py
│   ├── llm/                 # LLM client
│   ├── config.py            # Configuration
│   └── main.py              # FastAPI app
├── frontend/
│   ├── index.html           # Complete SPA
│   ├── app.js               # JavaScript logic
│   └── styles.css           # Styling
├── .env.example             # Environment template
├── requirements.txt         # Python dependencies
├── start.sh                 # Startup script
└── README.md
```

## Development

### Running Tests
```bash
pytest
```

### Code Style
```bash
black app/
flake8 app/
```

### Adding New Questions
Edit `app/services/scoring_config.py` and `frontend/app.js` to add questions.

## Deployment

For production deployment:

1. Set proper CORS origins in `app/config.py`
2. Use a production ASGI server (e.g., Gunicorn with Uvicorn workers)
3. Serve frontend through a web server (Nginx, Apache)
4. Set up proper logging and monitoring
5. Configure LLM service for production use

## License

Proprietary - Aivory Platform

## Support

For questions or issues, contact the Aivory team.
