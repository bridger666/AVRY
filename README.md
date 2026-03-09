# Aivory - AI Automation Platform

Aivory helps organizations assess their AI readiness, identify automation opportunities, and deploy intelligent workflow systems.

## Quick Start

```bash
# 1. Start Backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000

# 2. Start Frontend
python simple_server.py

# 3. Open Browser
http://localhost:8080
```

## Features

- **Free Diagnostic** - 12-question AI readiness assessment
- **AI Snapshot** ($15) - 30-question deep analysis with recommendations
- **AI Blueprint** ($79) - Complete system architecture and deployment plan
- **AI Console** - Interactive ARIA agent for workflow guidance
- **Dashboard** - Unified view of diagnostics, snapshots, and blueprints
- **Workflow Management** - Deploy and monitor AI workflows

## Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Setup and deployment guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview
- **[docs/archive/](docs/archive/)** - Historical documentation

## Tech Stack

**Backend:**
- Python 3.9+ with FastAPI
- Supabase (PostgreSQL + Auth)
- OpenRouter (LLM API)

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- Unified shell design

## Project Structure

```
Aivory/
├── README.md                    ← You are here
├── ARCHITECTURE.md              ← System architecture
├── DEPLOYMENT.md                ← Setup guide
├── requirements.txt             ← Python dependencies
│
├── app/                         ← Backend (FastAPI)
│   ├── main.py                  ← API entry point
│   ├── api/routes/              ← API endpoints
│   ├── services/                ← Business logic
│   ├── models/                  ← Data models
│   └── llm/                     ← LLM integrations
│
├── frontend/                    ← Frontend (Static)
│   ├── index.html               ← Landing page
│   ├── console-unified.html     ← AI Console
│   ├── dashboard.html           ← Dashboard
│   ├── workflows.html           ← Workflows
│   ├── logs.html                ← Logs
│   ├── settings.html            ← Settings
│   ├── app-shell.css            ← Unified shell
│   ├── console-aria.js          ← ARIA agent
│   ├── dashboard.js             ← Dashboard logic
│   └── legacy/                  ← Old files (archived)
│
└── docs/archive/                ← Historical docs
```

## Configuration

Create `.env.local` with:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_key

# JWT
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256

# API
API_BASE_URL=http://localhost:8000
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/v1/diagnostic/run` | POST | Free diagnostic |
| `/api/v1/diagnostic/snapshot` | POST | AI Snapshot |
| `/api/v1/blueprint/{id}` | GET | Get blueprint |
| `/api/v1/console/chat` | POST | Console chat |
| `/api/v1/workflows` | GET | List workflows |

**Interactive API Docs:** http://localhost:8000/docs

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run backend with auto-reload
python -m uvicorn app.main:app --reload --port 8000

# Run frontend
python simple_server.py
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
- Backend: Railway, Render, or AWS ECS
- Frontend: Netlify, Vercel, or Cloudflare Pages
- Database: Supabase (managed PostgreSQL)

## Support

For questions or issues:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for setup help
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for system details
3. Check [docs/archive/](docs/archive/) for historical docs
4. Contact the Aivory team

## License

Proprietary - Aivory Platform

Copyright © 2024-2025 Aivory. All rights reserved.
