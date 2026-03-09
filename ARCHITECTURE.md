# Aivory Architecture

## Overview

Aivory is an AI automation platform that provides diagnostic tools, workflow generation, and an AI console for business automation.

## System Components

### Frontend (Canonical Files)

**Main Pages:**
- `index.html` - Landing page with diagnostic entry points
- Next.js Console (port 3001) - AI console with ARIA agent (http://localhost:3001/console)
- `dashboard.html` - User dashboard with tabs (Overview, Diagnostic, Snapshot, Blueprint)
- `workflows.html` - Workflow management
- `logs.html` - Execution logs
- `settings.html` - User settings

**Styles:**
- `app-shell.css` - Unified shell and sidebar (used by all HTML pages)
- `dashboard.css` - Dashboard-specific styles
- Next.js Console uses `nextjs-console/styles/globals.css` - GPT-style warm gray theme

**Core JavaScript Modules:**
- `console-aria.js` - ARIA AI agent (exposes `window.ARIAAgent`)
- `dashboard.js` - Dashboard logic (defines `initDashboard()`)
- `auth-manager.js` - Authentication system
- `user-state-manager.js` - User state management
- `id-chain-manager.js` - ID chain tracking
- `tier-sync.js` - Tier synchronization

### Backend

**Framework:** FastAPI (Python)

**Key Services:**
- `auth_service.py` - Authentication and authorization
- `ai_enrichment.py` - AI-powered content enrichment
- `ai_blueprint_generator.py` - Blueprint generation
- `console_service.py` - Console API
- `tier_service.py` - Subscription tier management
- `credit_manager.py` - Credit tracking

**Database:** Supabase (PostgreSQL)

**Models:**
- `User` - User accounts
- `Diagnostic` - Diagnostic results
- `Snapshot` - Snapshot assessments
- `Blueprint` - AI blueprints
- `Contact` - Contact information

## Data Flow

1. **User Authentication:**
   - User logs in via `auth-manager.js`
   - JWT token stored in localStorage
   - Token validated on each API request

2. **Diagnostic Flow:**
   - User completes diagnostic on `index.html`
   - Results sent to `/api/v1/diagnostic`
   - Stored in database
   - Displayed on dashboard

3. **Console Flow:**
   - User opens Next.js Console at http://localhost:3001/console
   - Console page initialized from `nextjs-console/app/console/page.tsx`
   - Messages sent to `/api/console/message` via Next.js API proxy
   - Streaming responses rendered in real-time

4. **Dashboard Flow:**
   - User opens `dashboard.html`
   - `initDashboard()` loads user state
   - Tabs fetch data from respective APIs
   - Results rendered dynamically

## Integration Points

- **n8n:** Workflow automation (local instance)
- **OpenRouter:** LLM API for AI features
- **Supabase:** Database and authentication
- **VPS Bridge:** Optional deployment bridge

## Security

- JWT-based authentication
- Row-level security (RLS) in Supabase
- API key validation
- CORS configuration for frontend-backend communication
